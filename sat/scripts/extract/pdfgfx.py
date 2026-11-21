"""A small PDF content-stream interpreter for the College Board question bank exports.

The exports are Chrome prints run through Ghostscript: body text is Type 3 fonts,
math is MathJax SVG turned into filled paths (each glyph is filled, then stroked
with the same outline), and figures are plain vector paths. This module turns a
page into positioned items in page points with y pointing down:

  Char   text glyph with its Unicode value, font id, glyph id and transform
  Path   filled or stroked path (glyph-like math paths are flagged)

Glyph outlines (Type 3 CharProcs and MathJax paths) go to a shared library keyed
by shape, so the app can draw every occurrence with <use>.
"""
from __future__ import annotations

import hashlib
import math
import re
from dataclasses import dataclass, field

from pypdf import PdfReader
from pypdf.generic import ContentStream, IndirectObject

IDENT = (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)


def mmul(a, b):
    """Affine product: apply a, then b (PDF row-vector convention)."""
    return (
        a[0] * b[0] + a[1] * b[2],
        a[0] * b[1] + a[1] * b[3],
        a[2] * b[0] + a[3] * b[2],
        a[2] * b[1] + a[3] * b[3],
        a[4] * b[0] + a[5] * b[2] + b[4],
        a[4] * b[1] + a[5] * b[3] + b[5],
    )


def apply(m, x, y):
    return (m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5])


def fmt(v: float, nd: int = 3) -> str:
    s = f"{v:.{nd}f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


def color_hex(vals, space):
    try:
        if space == "g":
            g = float(vals[0])
            r = gg = b = g
        elif space == "k":
            c, m, y, k = (float(v) for v in vals)
            r, gg, b = (1 - c) * (1 - k), (1 - m) * (1 - k), (1 - y) * (1 - k)
        else:
            r, gg, b = (float(v) for v in vals[:3])
    except Exception:
        return "#000000"
    return "#%02x%02x%02x" % tuple(max(0, min(255, round(c * 255))) for c in (r, gg, b))


@dataclass
class Path:
    segs: list  # page coords, y down: ("M",x,y) ("L",x,y) ("C",x1,y1,x2,y2,x,y) ("Z",)
    fill: str | None
    stroke: str | None
    lw: float = 0.0
    dash: tuple = ()
    cap: int = 0
    join: int = 0
    evenodd: bool = False
    alpha: float = 1.0
    clip: tuple | None = None
    blend: str = ""
    kind: str = "p"  # p path, g math glyph, r rectangle
    glyph: str | None = None  # library id for kind g
    gm: tuple | None = None  # glyph transform for kind g
    order: int = 0

    @property
    def bbox(self):
        xs, ys = [], []
        for s in self.segs:
            if s[0] != "Z":
                xs.extend(s[1::2])
                ys.extend(s[2::2])
        if not xs:
            return (0, 0, 0, 0)
        return (min(xs), min(ys), max(xs), max(ys))

    def d(self, nd=2):
        out = []
        for s in self.segs:
            if s[0] == "Z":
                out.append("Z")
            else:
                out.append(s[0] + " ".join(fmt(v, nd) for v in s[1:]))
        return "".join(out)


@dataclass
class Char:
    u: str
    font: str
    glyph: str | None
    m: tuple  # glyph space -> page (y down)
    x: float  # origin x (page, y down)
    y: float  # baseline y
    size: float  # effective font size in points
    adv: float  # advance in points
    color: str
    bbox: tuple
    style: str = ""
    order: int = 0
    rot: bool = False
    gname: str = ""
    wunits: float = 0.0


@dataclass
class Image:
    key: str  # content hash (color data and alpha mask)
    m: tuple  # unit square -> page (y down)
    bbox: tuple
    w: int
    h: int
    order: int = 0
    key_color: str = ""  # hash of the color data alone (earlier key)


class GlyphLib:
    def __init__(self):
        self.paths: dict[str, str] = {}  # id -> d (in the glyph's own frame)
        self._by_key: dict[str, str] = {}

        self.boxes: dict[str, tuple] = {}

    def add(self, key: str, d: str) -> str:
        gid = self._by_key.get(key)
        if gid is None:
            gid = "g" + hashlib.sha1(key.encode()).hexdigest()[:10]
            self._by_key[key] = gid
            self.paths[gid] = d
            nums = [float(v) for v in re.findall(r"-?\d+(?:\.\d+)?(?:e-?\d+)?", d)]
            xs, ys = nums[0::2], nums[1::2]
            self.boxes[gid] = (min(xs), min(ys), max(xs), max(ys)) if xs else (0, 0, 0, 0)
        return gid


def parse_cmap(data: bytes) -> dict[int, str]:
    out: dict[int, str] = {}
    text = data.decode("latin1")

    def hexs(h):
        h = h.strip("<>")
        return bytes.fromhex(h).decode("utf-16-be", errors="replace")

    for block in re.findall(r"beginbfchar(.*?)endbfchar", text, re.S):
        for a, b in re.findall(r"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]*)>", block):
            out[int(a, 16)] = hexs(b) if b else ""
    for block in re.findall(r"beginbfrange(.*?)endbfrange", text, re.S):
        for m in re.finditer(r"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*(\[[^\]]*\]|<[0-9A-Fa-f]+>)", block):
            lo, hi, dst = int(m.group(1), 16), int(m.group(2), 16), m.group(3)
            if dst.startswith("["):
                items = re.findall(r"<([0-9A-Fa-f]+)>", dst)
                for i, it in enumerate(items):
                    out[lo + i] = hexs(it)
            else:
                base = bytes.fromhex(dst.strip("<>"))
                n = int.from_bytes(base, "big")
                for c in range(lo, hi + 1):
                    v = n + (c - lo)
                    out[c] = v.to_bytes(len(base), "big").decode("utf-16-be", errors="replace")
    return out


class Font:
    def __init__(self, ref, reader, lib: GlyphLib):
        self.obj = ref.get_object()
        self.id = f"f{ref.idnum}" if isinstance(ref, IndirectObject) else "f" + hashlib.sha1(repr(self.obj).encode()).hexdigest()[:8]
        self.subtype = self.obj.get("/Subtype")
        self.base = str(self.obj.get("/BaseFont", ""))
        tu = self.obj.get("/ToUnicode")
        self.tounicode = parse_cmap(tu.get_object().get_data()) if tu is not None else {}
        self.lib = lib
        self.reader = reader
        self.two_byte = self.subtype == "/Type0"
        self.glyph_ids: dict[int, str | None] = {}
        if self.subtype == "/Type3":
            fm = self.obj.get("/FontMatrix")
            self.fm = tuple(float(v) for v in fm)
            self.first = int(self.obj.get("/FirstChar", 0))
            self.widths = [float(w) for w in self.obj.get("/Widths", [])]
            self.names: dict[int, str] = {}
            enc = self.obj.get("/Encoding")
            enc = enc.get_object() if enc is not None else None
            if enc is not None and "/Differences" in enc:
                code = 0
                for v in enc["/Differences"]:
                    if isinstance(v, (int, float)) and not isinstance(v, bool):
                        code = int(v)
                    else:
                        self.names[code] = str(v)
                        code += 1
            self.procs = self.obj["/CharProcs"]
        else:
            self.fm = (0.001, 0, 0, 0.001, 0, 0)
            self.dw = 1000.0
            self.cidw: dict[int, float] = {}
            desc = self.obj.get("/DescendantFonts")
            if desc is not None:
                d0 = desc[0].get_object()
                self.dw = float(d0.get("/DW", 1000))
                w = d0.get("/W")
                if w is not None:
                    w = list(w)
                    i = 0
                    while i < len(w):
                        c = int(w[i])
                        nxt = w[i + 1]
                        if isinstance(nxt, list) or hasattr(nxt, "__iter__") and not isinstance(nxt, (str, bytes)):
                            for k, val in enumerate(nxt):
                                self.cidw[c + k] = float(val)
                            i += 2
                        else:
                            c2 = int(nxt)
                            val = float(w[i + 2])
                            for k in range(c, c2 + 1):
                                self.cidw[k] = val
                            i += 3

    def codes(self, s: bytes):
        if self.two_byte:
            return [int.from_bytes(s[i : i + 2], "big") for i in range(0, len(s) - 1, 2)]
        return list(s)

    def width(self, code: int) -> float:
        """Advance in text space units (multiply by font size)."""
        if self.subtype == "/Type3":
            i = code - self.first
            w = self.widths[i] if 0 <= i < len(self.widths) else 0.0
            return w * self.fm[0]
        return self.cidw.get(code, self.dw) / 1000.0

    def _tt(self):
        if hasattr(self, "_ttfont"):
            return self._ttfont
        self._ttfont = None
        try:
            import io

            from fontTools.ttLib import TTFont

            d0 = self.obj["/DescendantFonts"][0].get_object()
            fd = d0["/FontDescriptor"].get_object()
            ff = fd.get("/FontFile2")
            if ff is not None:
                self._ttfont = TTFont(io.BytesIO(ff.get_object().get_data()))
                c2g = d0.get("/CIDToGIDMap")
                self._c2g = None
                if c2g is not None and not isinstance(c2g.get_object(), str) and hasattr(c2g.get_object(), "get_data"):
                    raw = c2g.get_object().get_data()
                    self._c2g = [int.from_bytes(raw[i : i + 2], "big") for i in range(0, len(raw), 2)]
        except Exception as e:  # pragma: no cover
            print("WARN: TrueType load failed", self.base, e)
        return self._ttfont

    def glyph(self, code: int):
        if code in self.glyph_ids:
            return self.glyph_ids[code]
        gid = None
        if self.subtype == "/Type0" and self._tt() is not None:
            from fontTools.pens.svgPathPen import SVGPathPen
            from fontTools.pens.transformPen import TransformPen

            tt = self._ttfont
            g = self._c2g[code] if self._c2g is not None and code < len(self._c2g) else code
            order = tt.getGlyphOrder()
            if 0 <= g < len(order):
                gs = tt.getGlyphSet()
                upm = tt["head"].unitsPerEm
                pen = SVGPathPen(gs, ntos=lambda v: fmt(v, 1))
                k = 1000.0 / upm
                gs[order[g]].draw(TransformPen(pen, (k, 0, 0, k, 0, 0)))
                d = pen.getCommands()
                if d:
                    gid = self.lib.add("tt:" + d, d)
            self.glyph_ids[code] = gid
            return gid
        if self.subtype == "/Type3":
            name = self.names.get(code)
            if name is not None and name in self.procs:
                data = self.procs[name].get_object().get_data()
                d = charproc_path(data, self.reader)
                if d:
                    gid = self.lib.add("t3:" + d, d)
        self.glyph_ids[code] = gid
        return gid


def charproc_path(data: bytes, reader) -> str:
    """Return SVG path data for a Type 3 CharProc, in glyph space."""
    try:
        ops = ContentStream(DataStream(data), reader).operations
    except Exception:
        return ""
    ctm = IDENT
    stack = []
    out = []
    cur = []
    cp = (0.0, 0.0)
    sp = (0.0, 0.0)

    def P(p):
        return fmt(p[0], 1) + " " + fmt(p[1], 1)

    for operands, op in ops:
        op = op.decode() if isinstance(op, bytes) else op
        v = [float(a) for a in operands if isinstance(a, (int, float))]
        if op == "q":
            stack.append(ctm)
        elif op == "Q":
            ctm = stack.pop() if stack else IDENT
        elif op == "cm":
            ctm = mmul(tuple(v), ctm)
        elif op == "m":
            cp = sp = apply(ctm, v[0], v[1])
            cur.append("M" + P(cp))
        elif op == "l":
            cp = apply(ctm, v[0], v[1])
            cur.append("L" + P(cp))
        elif op == "c":
            p1, p2, p3 = apply(ctm, v[0], v[1]), apply(ctm, v[2], v[3]), apply(ctm, v[4], v[5])
            cur.append("C" + P(p1) + " " + P(p2) + " " + P(p3))
            cp = p3
        elif op == "v":
            p2, p3 = apply(ctm, v[0], v[1]), apply(ctm, v[2], v[3])
            cur.append("C" + P(cp) + " " + P(p2) + " " + P(p3))
            cp = p3
        elif op == "y":
            p1, p3 = apply(ctm, v[0], v[1]), apply(ctm, v[2], v[3])
            cur.append("C" + P(p1) + " " + P(p3) + " " + P(p3))
            cp = p3
        elif op == "h":
            cur.append("Z")
            cp = sp
        elif op == "re":
            x, y, w, h = v
            pts = [apply(ctm, x, y), apply(ctm, x + w, y), apply(ctm, x + w, y + h), apply(ctm, x, y + h)]
            cur.append("M" + " L".join(P(p) for p in pts) + "Z")
        elif op in ("f", "F", "f*", "B", "B*", "b", "b*"):
            out.extend(cur)
            cur = []
        elif op in ("n", "S", "s"):
            cur = []
    return "".join(out)


class DataStream:
    """Minimal stream wrapper so ContentStream can parse raw bytes."""

    def __init__(self, data: bytes):
        self._data = data

    def get_data(self):
        return self._data

    def get_object(self):
        return self

    def __getitem__(self, k):
        raise KeyError(k)

    def get(self, k, default=None):
        return default


class PageInterp:
    def __init__(self, reader: PdfReader, page_index: int, lib: GlyphLib, fonts_cache: dict):
        self.reader = reader
        self.page = reader.pages[page_index]
        self.lib = lib
        self.fonts_cache = fonts_cache
        mb = [float(v) for v in self.page.mediabox]
        self.H = mb[3]
        self.W = mb[2]
        self.flip = (1, 0, 0, -1, 0, self.H)
        self.paths: list[Path] = []
        self.chars: list[Char] = []
        self.images: list[Image] = []
        self.image_data: dict[str, bytes] = {}
        self.order = 0

    def _image(self, xo):
        import io

        from PIL import Image as PILImage

        w, h = int(xo["/Width"]), int(xo["/Height"])
        raw = xo.get_data()
        smask = xo.get("/SMask")
        mask_raw = smask.get_object().get_data() if smask is not None else b""
        self._last_key_color = "i" + hashlib.sha1(raw).hexdigest()[:12]
        key = "i" + hashlib.sha1(raw + b"|" + mask_raw).hexdigest()[:12]
        if key not in self.image_data:
            cs = xo.get("/ColorSpace")
            cs = cs.get_object() if cs is not None else None
            bpc = int(xo.get("/BitsPerComponent", 8))
            filt = str(xo.get("/Filter", ""))
            im = None
            try:
                if "DCT" in filt:
                    im = PILImage.open(io.BytesIO(xo._data))
                elif isinstance(cs, list) and str(cs[0]) == "/Indexed":
                    base, hival, lut = cs[1], int(cs[2]), cs[3]
                    lut = lut.get_object()
                    lut = lut.get_data() if hasattr(lut, "get_data") else bytes(lut)
                    im = PILImage.frombytes("P", (w, h), raw[: w * h])
                    im.putpalette(lut)
                    im = im.convert("RGB")
                elif bpc == 1:
                    im = PILImage.frombytes("1", (w, h), raw)
                else:
                    mode = "L" if "Gray" in str(cs) else ("CMYK" if "CMYK" in str(cs) else "RGB")
                    need = w * h * {"L": 1, "RGB": 3, "CMYK": 4}[mode]
                    im = PILImage.frombytes(mode, (w, h), raw[:need])
            except Exception as e:
                print("WARN: image decode", e, cs, bpc, filt, w, h, len(raw))
                im = PILImage.new("RGB", (w, h), "white")
            sm = xo.get("/SMask")
            if sm is not None:
                sm = sm.get_object()
                sw, sh = int(sm["/Width"]), int(sm["/Height"])
                a = PILImage.frombytes("L", (sw, sh), sm.get_data()[: sw * sh])
                im = im.convert("RGB")
                if a.size != im.size:
                    a = a.resize(im.size)
                im.putalpha(a)
            buf = io.BytesIO()
            im.save(buf, "PNG")
            self.image_data[key] = buf.getvalue()
        return key, w, h

    def font(self, res, name):
        ref = res["/Font"].raw_get(name) if hasattr(res["/Font"], "raw_get") else res["/Font"][name]
        key = ref.idnum if isinstance(ref, IndirectObject) else id(ref)
        f = self.fonts_cache.get(key)
        if f is None:
            f = Font(ref, self.reader, self.lib)
            self.fonts_cache[key] = f
        return f

    def run(self, res=None, ops=None, ctm=IDENT, clip=None, inherit=None):
        top = res is None
        if top:
            res = self.page["/Resources"]
            ops = ContentStream(self.page.get_contents(), self.reader).operations
        gs = dict(ctm=ctm, fill="#000000", stroke="#000000", lw=1.0, dash=(), cap=0, join=0, alpha=1.0, salpha=1.0, clip=clip, blend="")
        if inherit:
            # a form XObject starts from the graphics state in force where it is drawn
            gs.update({k: v for k, v in inherit.items() if k not in ("ctm", "clip")})
        stack = []
        segs = []  # in user->page (y up) coords; converted at paint
        start = None
        pending_clip = None
        last_fill_path: Path | None = None
        last_fill_raw = None
        # text state
        tm = tlm = IDENT
        tfs = 1.0
        fnt = None
        tc = tw = 0.0
        th = 1.0
        tl = 0.0
        trise = 0.0
        tr = 0
        fill_space = stroke_space = "rgb"

        def tp(x, y):
            px, py = apply(gs["ctm"], x, y)
            return px, self.H - py

        for operands, op in ops:
            op = op.decode() if isinstance(op, bytes) else op
            if op == "q":
                stack.append(dict(gs))
            elif op == "Q":
                if stack:
                    gs = stack.pop()
            elif op == "cm":
                gs["ctm"] = mmul(tuple(float(v) for v in operands), gs["ctm"])
            elif op == "w":
                gs["lw"] = float(operands[0])
            elif op == "J":
                gs["cap"] = int(operands[0])
            elif op == "j":
                gs["join"] = int(operands[0])
            elif op == "d":
                gs["dash"] = tuple(float(v) for v in operands[0])
            elif op == "gs":
                eg = res["/ExtGState"][operands[0]].get_object()
                if "/LW" in eg:
                    gs["lw"] = float(eg["/LW"])
                if "/ca" in eg:
                    gs["alpha"] = float(eg["/ca"])
                if "/CA" in eg:
                    gs["salpha"] = float(eg["/CA"])
                if "/BM" in eg:
                    bm = eg["/BM"]
                    bm = str(bm[0] if isinstance(bm, list) else bm).lstrip("/")
                    gs["blend"] = "" if bm in ("Normal", "Compatible") else bm.lower()
            elif op == "rg":
                gs["fill"] = color_hex(operands, "rgb")
            elif op == "RG":
                gs["stroke"] = color_hex(operands, "rgb")
            elif op == "g":
                gs["fill"] = color_hex(operands, "g")
            elif op == "G":
                gs["stroke"] = color_hex(operands, "g")
            elif op == "k":
                gs["fill"] = color_hex(operands, "k")
            elif op == "K":
                gs["stroke"] = color_hex(operands, "k")
            elif op in ("cs", "CS"):
                sp = str(operands[0])
                space = "g" if "Gray" in sp else "k" if "CMYK" in sp else "rgb"
                if op == "cs":
                    fill_space = space
                else:
                    stroke_space = space
            elif op in ("sc", "scn"):
                nums = [v for v in operands if isinstance(v, (int, float))]
                if nums:
                    gs["fill"] = color_hex(nums, fill_space if len(nums) != 1 else "g")
            elif op in ("SC", "SCN"):
                nums = [v for v in operands if isinstance(v, (int, float))]
                if nums:
                    gs["stroke"] = color_hex(nums, stroke_space if len(nums) != 1 else "g")
            # ---- path construction
            elif op == "m":
                p = tp(float(operands[0]), float(operands[1]))
                segs.append(("M", *p))
                start = p
            elif op == "l":
                segs.append(("L", *tp(float(operands[0]), float(operands[1]))))
            elif op == "c":
                v = [float(a) for a in operands]
                segs.append(("C", *tp(v[0], v[1]), *tp(v[2], v[3]), *tp(v[4], v[5])))
            elif op == "v":
                v = [float(a) for a in operands]
                cur = segs[-1][-2:] if segs and segs[-1][0] != "Z" else start
                segs.append(("C", *cur, *tp(v[0], v[1]), *tp(v[2], v[3])))
            elif op == "y":
                v = [float(a) for a in operands]
                p3 = tp(v[2], v[3])
                segs.append(("C", *tp(v[0], v[1]), *p3, *p3))
            elif op == "h":
                segs.append(("Z",))
            elif op == "re":
                x, y, w, h = (float(a) for a in operands)
                pts = [tp(x, y), tp(x + w, y), tp(x + w, y + h), tp(x, y + h)]
                segs.append(("M", *pts[0]))
                for p in pts[1:]:
                    segs.append(("L", *p))
                segs.append(("Z",))
                start = pts[0]
            elif op in ("W", "W*"):
                pending_clip = list(segs)
            elif op in ("f", "F", "f*", "S", "s", "B", "B*", "b", "b*", "n"):
                if op in ("s", "b", "b*"):
                    segs.append(("Z",))
                if pending_clip is not None:
                    bb = Path(pending_clip, None, None).bbox
                    if gs["clip"] is not None:
                        c = gs["clip"]
                        bb = (max(bb[0], c[0]), max(bb[1], c[1]), min(bb[2], c[2]), min(bb[3], c[3]))
                    gs["clip"] = bb
                    pending_clip = None
                if op != "n" and segs:
                    do_fill = op in ("f", "F", "f*", "B", "B*", "b", "b*")
                    do_stroke = op in ("S", "s", "B", "B*", "b", "b*")
                    scale = math.sqrt(abs(gs["ctm"][0] * gs["ctm"][3] - gs["ctm"][1] * gs["ctm"][2]))
                    raw = tuple(s for s in segs if s[0] != "Z")
                    if (
                        do_stroke
                        and not do_fill
                        and last_fill_path is not None
                        and raw == last_fill_raw
                        and last_fill_path.fill == gs["stroke"]
                        and (last_fill_path.bbox[3] - last_fill_path.bbox[1]) < 40
                        and (last_fill_path.bbox[2] - last_fill_path.bbox[0]) < 60
                    ):
                        # MathJax glyph: filled, then stroked with the same outline
                        last_fill_path.kind = "g"
                    else:
                        pth = Path(
                            list(segs),
                            gs["fill"] if do_fill else None,
                            gs["stroke"] if do_stroke else None,
                            lw=gs["lw"] * scale,
                            dash=tuple(v * scale for v in gs["dash"][0]) if gs["dash"] and gs["dash"][0] else (),
                            cap=gs["cap"],
                            join=gs["join"],
                            evenodd=op in ("f*", "B*", "b*"),
                            alpha=gs["alpha"],
                            clip=gs["clip"],
                            blend=gs["blend"],
                            order=self.order,
                        )
                        self.order += 1
                        self.paths.append(pth)
                        if do_fill and not do_stroke:
                            last_fill_path, last_fill_raw = pth, raw
                        else:
                            last_fill_path, last_fill_raw = None, None
                segs = []
            # ---- text
            elif op == "BT":
                tm = tlm = IDENT
            elif op == "ET":
                pass
            elif op == "Tf":
                fnt = self.font(res, operands[0])
                tfs = float(operands[1])
            elif op == "Tc":
                tc = float(operands[0])
            elif op == "Tw":
                tw = float(operands[0])
            elif op == "Tz":
                th = float(operands[0]) / 100.0
            elif op == "TL":
                tl = float(operands[0])
            elif op == "Ts":
                trise = float(operands[0])
            elif op == "Tr":
                tr = int(operands[0])
            elif op == "Tm":
                tm = tlm = tuple(float(v) for v in operands)
            elif op in ("Td", "TD"):
                tx, ty = float(operands[0]), float(operands[1])
                if op == "TD":
                    tl = -ty
                tlm = mmul((1, 0, 0, 1, tx, ty), tlm)
                tm = tlm
            elif op == "T*":
                tlm = mmul((1, 0, 0, 1, 0, -tl), tlm)
                tm = tlm
            elif op in ("Tj", "TJ", "'", '"'):
                if op in ("'", '"'):
                    if op == '"':
                        tw, tc = float(operands[0]), float(operands[1])
                    tlm = mmul((1, 0, 0, 1, 0, -tl), tlm)
                    tm = tlm
                items = operands[0] if op == "TJ" else [operands[-1]]
                for it in items:
                    if isinstance(it, (int, float)) and not isinstance(it, bool):
                        tm = mmul((1, 0, 0, 1, -float(it) / 1000.0 * tfs * th, 0), tm)
                        continue
                    if hasattr(it, "original_bytes"):
                        s = it.original_bytes
                    elif isinstance(it, bytes):
                        s = it
                    else:
                        s = str(it).encode("latin1", errors="replace")
                    for code in fnt.codes(s):
                        trm = mmul((tfs * th, 0, 0, tfs, 0, trise), mmul(tm, gs["ctm"]))
                        w0 = fnt.width(code)
                        u = fnt.tounicode.get(code, "")
                        if tr != 3 and tr != 7:
                            gm = mmul(fnt.fm, trm)
                            gmf = mmul(gm, self.flip)
                            ox, oy = apply(trm, 0, 0)
                            size = math.hypot(trm[2], trm[3])
                            adv = w0 * math.hypot(trm[0], trm[1])
                            rot = abs(trm[1]) > 1e-6 or abs(trm[2]) > 1e-6
                            # approximate box: ascent 0.95em, descent 0.25em
                            ux, uy = trm[2] / max(size, 1e-9), trm[3] / max(size, 1e-9)
                            ax, ay = trm[0] / max(math.hypot(trm[0], trm[1]), 1e-9), trm[1] / max(math.hypot(trm[0], trm[1]), 1e-9)
                            corners = [
                                (ox - ux * 0.25 * size, oy - uy * 0.25 * size),
                                (ox + ux * 0.95 * size, oy + uy * 0.95 * size),
                                (ox + ax * adv - ux * 0.25 * size, oy + ay * adv - uy * 0.25 * size),
                                (ox + ax * adv + ux * 0.95 * size, oy + ay * adv + uy * 0.95 * size),
                            ]
                            xs = [c[0] for c in corners]
                            ys = [self.H - c[1] for c in corners]
                            gid = fnt.glyph(code)
                            if gid is not None:
                                gb = self.lib.boxes[gid]
                                pts = [apply(gmf, gb[0], gb[1]), apply(gmf, gb[2], gb[1]), apply(gmf, gb[0], gb[3]), apply(gmf, gb[2], gb[3])]
                                xs = [q[0] for q in pts]
                                ys = [q[1] for q in pts]
                            self.chars.append(
                                Char(
                                    u=u,
                                    font=fnt.id,
                                    glyph=gid,
                                    gname=fnt.names.get(code, "") if fnt.subtype == "/Type3" else str(code),
                                    wunits=w0,
                                    m=gmf,
                                    x=ox,
                                    y=self.H - oy,
                                    size=size,
                                    adv=adv,
                                    color=gs["fill"],
                                    bbox=(min(xs), min(ys), max(xs), max(ys)),
                                    order=self.order,
                                    rot=rot,
                                )
                            )
                            self.order += 1
                        tx = (w0 * tfs + tc + (tw if (code == 32 and not fnt.two_byte) else 0.0)) * th
                        tm = mmul((1, 0, 0, 1, tx, 0), tm)
            elif op == "Do":
                xo = res["/XObject"][operands[0]].get_object()
                st = xo.get("/Subtype")
                if st == "/Form":
                    fm = tuple(float(v) for v in xo.get("/Matrix", IDENT))
                    fres = xo.get("/Resources")
                    fres = fres.get_object() if fres is not None else res
                    fops = ContentStream(xo, self.reader).operations
                    self.run(fres, fops, mmul(fm, gs["ctm"]), gs["clip"], dict(gs))
                elif st == "/Image":
                    key, w, h = self._image(xo)
                    m = gs["ctm"]
                    pts = [apply(m, 0, 0), apply(m, 1, 0), apply(m, 0, 1), apply(m, 1, 1)]
                    xs = [q[0] for q in pts]
                    ys = [self.H - q[1] for q in pts]
                    self.images.append(Image(key, mmul(m, self.flip), (min(xs), min(ys), max(xs), max(ys)), w, h, self.order, self._last_key_color))
                    self.order += 1
        if not top:
            return self
        # normalize math glyph paths into the library
        for p in self.paths:
            if p.kind == "g" and p.glyph is None:
                x0, y0, x1, y1 = p.bbox
                h = max(y1 - y0, x1 - x0, 1e-6)
                norm = []
                for s in p.segs:
                    if s[0] == "Z":
                        norm.append("Z")
                    else:
                        vals = []
                        for i, v in enumerate(s[1:]):
                            vals.append((v - (x0 if i % 2 == 0 else y0)) / h)
                        norm.append((s[0], vals))
                key = "".join(n if isinstance(n, str) else n[0] + " ".join("%.2f" % v for v in n[1]) for n in norm)
                d = "".join(n if isinstance(n, str) else n[0] + " ".join(fmt(v, 3) for v in n[1]) for n in norm)
                p.glyph = self.lib.add("mj:" + key, d)
                p.gm = (h, 0, 0, h, x0, y0)
        return self
