"""Turn interpreted pages into structured questions.

usage: python layout.py <cache_dir> <taxonomy.txt> <out_dir>

Writes <out_dir>/questions.json (every question: stem, choices, answer, rationale
as blocks of inline text and math), <out_dir>/glyphs.svg (the shared sprite) and
<out_dir>/img/*.png (raster images that stay images).
"""
from __future__ import annotations

import collections
import json
import math
import os
import pickle
import re
import sys

from pdfgfx import fmt

EM = 9.0  # body text em in points
MARGIN = 18.0
RIGHT = 594.0

BOLD, ITAL, REG, SANS = "math:f1350", "math:f2307", "math:f11398", "math:f2408"


# ---------------------------------------------------------------- utilities
def bbox_union(boxes):
    boxes = list(boxes)
    return (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))


def overlap_y(a, b, pad=0.0):
    return a[1] - pad < b[3] and b[1] - pad < a[3]


def overlap_x(a, b, pad=0.0):
    return a[0] - pad < b[2] and b[0] - pad < a[2]


def inside(b, r, pad=0.0):
    cx, cy = (b[0] + b[2]) / 2, (b[1] + b[3]) / 2
    return r[0] - pad <= cx <= r[2] + pad and r[1] - pad <= cy <= r[3] + pad


def is_dark(col):
    if not col:
        return False
    r, g, b = int(col[1:3], 16), int(col[3:5], 16), int(col[5:7], 16)
    return max(r, g, b) < 80


def svg_color(col):
    if col is None:
        return "none"
    if is_dark(col):
        return "currentColor"
    if col.lower() in ("#ffffff", "#fefefe"):
        return "var(--paper,#fff)"
    return col


# ---------------------------------------------------------------- items
class Item:
    __slots__ = ("kind", "obj", "bbox", "page", "style", "u", "role", "under", "line", "script")

    def __init__(self, kind, obj, bbox, page):
        self.kind = kind  # char glyph rule path image
        self.obj = obj
        self.bbox = bbox
        self.page = page
        self.style = ""
        self.u = ""
        self.role = ""
        self.under = False
        self.line = None
        self.script = ""


def classify_path(p):
    """Return 'hrule', 'vrule' or 'path'."""
    x0, y0, x1, y1 = p.bbox
    w, h = x1 - x0, y1 - y0
    segs = [s for s in p.segs if s[0] != "Z"]
    straight = all(s[0] in ("M", "L") for s in segs)
    if p.fill and not p.stroke and straight and len(segs) <= 5:
        if h < 1.6 and w > 2 * h:
            return "hrule"
        if w < 1.6 and h > 2 * w:
            return "vrule"
    if p.stroke and not p.fill and straight and len(segs) == 2 and p.lw < 1.6:
        if h < 0.2:
            return "hrule"
        if w < 0.2:
            return "vrule"
    return "path"


def rule_box(p):
    x0, y0, x1, y1 = p.bbox
    if p.stroke and not p.fill:
        if y1 - y0 < 0.2:
            return (x0, y0 - p.lw / 2, x1, y1 + p.lw / 2)
        return (x0 - p.lw / 2, y0, x1 + p.lw / 2, y1)
    return p.bbox


# ---------------------------------------------------------------- SVG output
class SvgOut:
    def __init__(self, lib, used, images_used):
        self.lib = lib
        self.used = used
        self.images_used = images_used

    def render(self, items, box, pad=0.6, keep_color=False):
        x0, y0, x1, y1 = box
        x0 -= pad
        y0 -= pad
        x1 += pad
        y1 += pad
        w, h = x1 - x0, y1 - y0
        parts = []
        for it in sorted(items, key=lambda i: getattr(i.obj, "order", 0)):
            o = it.obj
            if it.kind == "glyph" and o.glyph is None:
                parts.append(f'<path d="{translate_d(o, x0, y0)}" fill="currentColor"/>')
            elif it.kind in ("glyph",):
                self.used.add(o.glyph)
                m = o.gm
                fill = svg_color(o.fill) if keep_color else "currentColor"
                fa = "" if fill == "currentColor" else f' fill="{fill}"'
                parts.append(f'<use href="#{o.glyph}" transform="matrix({fmt(m[0],4)} 0 0 {fmt(m[3],4)} {fmt(m[4]-x0)} {fmt(m[5]-y0)})"{fa}/>')
            elif it.kind == "char":
                if not o.glyph:
                    continue
                self.used.add(o.glyph)
                m = o.m
                fill = svg_color(o.color)
                fa = "" if fill == "currentColor" else f' fill="{fill}"'
                parts.append(
                    f'<use href="#{o.glyph}" transform="matrix({fmt(m[0],6)} {fmt(m[1],6)} {fmt(m[2],6)} {fmt(m[3],6)} {fmt(m[4]-x0)} {fmt(m[5]-y0)})"{fa}/>'
                )
            elif it.kind in ("rule", "path"):
                d = translate_d(o, x0, y0)
                attrs = [f'd="{d}"']
                attrs.append(f'fill="{svg_color(o.fill)}"' if o.fill else 'fill="none"')
                if o.evenodd:
                    attrs.append('fill-rule="evenodd"')
                if o.stroke:
                    attrs.append(f'stroke="{svg_color(o.stroke)}" stroke-width="{fmt(o.lw, 2)}"')
                    if o.cap:
                        attrs.append('stroke-linecap="' + ("round" if o.cap == 1 else "square") + '"')
                    if o.join:
                        attrs.append('stroke-linejoin="' + ("round" if o.join == 1 else "bevel") + '"')
                    if o.dash:
                        attrs.append('stroke-dasharray="' + " ".join(fmt(v, 2) for v in o.dash) + '"')
                if o.alpha < 1:
                    attrs.append(f'opacity="{fmt(o.alpha,2)}"')
                if getattr(o, "blend", ""):
                    attrs.append(f'style="mix-blend-mode:{o.blend}"')
                parts.append("<path " + " ".join(attrs) + "/>")
            elif it.kind == "image":
                self.images_used.add(o.key)
                m = o.m
                # unit square (y up) -> page y down: draw the image flipped into the unit square
                parts.append(
                    f'<image href="/img/{o.key}.png" width="1" height="1" preserveAspectRatio="none" '
                    f'transform="matrix({fmt(m[0],4)} {fmt(m[1],4)} {fmt(m[2],4)} {fmt(m[3],4)} {fmt(m[4]-x0)} {fmt(m[5]-y0)}) translate(0 1) scale(1 -1)"/>'
                )
        return w, h, x0, y0, "".join(parts)


def translate_d(p, dx, dy):
    out = []
    for s in p.segs:
        if s[0] == "Z":
            out.append("Z")
        else:
            vals = []
            for i, v in enumerate(s[1:]):
                vals.append(fmt(v - (dx if i % 2 == 0 else dy), 2))
            out.append(s[0] + " ".join(vals))
    return "".join(out)


# ---------------------------------------------------------------- question assembly
HEADER_WORDS = ("Question", "Answer", "Rationale")


TEX_FOR = None  # set by main: image -> LaTeX transcription or None


def build_items(page, pidx, fam, style_of):
    items = []
    fills = [p.bbox for p in page["paths"] if p.fill]

    def outline_of_fill(p):
        b = p.bbox
        if p.lw < 0.1:
            # hairline: drop it when it sits on any filled shape
            return any(b[0] < f[2] and f[0] < b[2] and b[1] < f[3] and f[1] < b[3] for f in fills)
        return any(abs(b[0] - f[0]) < 0.12 and abs(b[1] - f[1]) < 0.12 and abs(b[2] - f[2]) < 0.12 and abs(b[3] - f[3]) < 0.12 for f in fills)
    for c in page["chars"]:
        it = Item("char", c, c.bbox, pidx)
        it.u = c.u
        st = style_of(c.font)
        it.style = st
        if st == "fig" or c.rot:
            it.role = "fig"
        items.append(it)
    for p in page["paths"]:
        if p.stroke and not p.fill and p.lw < 0.2 and outline_of_fill(p):
            continue  # hairline outline MathJax draws over a filled shape
        if p.stroke and not p.fill and p.lw < 0.05 and any(sg[0] == "C" for sg in p.segs):
            # a math glyph drawn only as its outline: show it filled, as the PDF viewer does
            p.fill, p.stroke = p.stroke, None
            items.append(Item("glyph", p, p.bbox, pidx))
            continue
        if p.fill and not p.stroke and p.kind != "g":
            r, g, bl = int(p.fill[1:3], 16), int(p.fill[3:5], 16), int(p.fill[5:7], 16)
            if r > 200 and g > 200 and bl < 120:
                continue  # yellow highlight behind "Math output error"
        x0, y0, x1, y1 = p.bbox
        if p.kind != "g" and p.fill and not p.stroke and 1.5 < x1 - x0 < 4.5 and abs((x1 - x0) - (y1 - y0)) < 0.6 and any(sg[0] == "C" for sg in p.segs):
            it = Item("path", p, p.bbox, pidx)
            it.role = "bullet"
            items.append(it)
            continue
        if p.kind == "g":
            it = Item("glyph", p, p.bbox, pidx)
        else:
            k = classify_path(p)
            if k == "hrule":
                it = Item("rule", p, rule_box(p), pidx)
                it.role = "h"
            elif k == "vrule":
                it = Item("rule", p, rule_box(p), pidx)
                it.role = "v"
            else:
                it = Item("path", p, p.bbox, pidx)
        items.append(it)
    for im in page["images"]:
        it = Item("image", im, im.bbox, pidx)
        h = im.bbox[3] - im.bbox[1]
        tex = TEX_FOR(im) if TEX_FOR else None
        it.role = "fig" if (h > 45 and not (tex and tex != "!img")) else ""
        items.append(it)
    return items


class Line:
    def __init__(self, base, page):
        self.base = base
        self.page = page
        self.items = []
        self.virtual = False

    @property
    def bbox(self):
        ink = [i.bbox for i in self.items if not (i.kind == "char" and not i.u.strip())]
        return bbox_union(ink or [i.bbox for i in self.items])


def text_of(items):
    return "".join(i.u for i in sorted(items, key=lambda i: i.bbox[0]) if i.kind == "char")


class Builder:
    def __init__(self, lib, images, svg: SvgOut, tex=None):
        self.lib = lib
        self.images = images
        self.svg = svg
        self.tex = tex or {}
        self.warn = []
        self.collided: set = set()

    def tex_for(self, im):
        if im.key in self.tex:
            return self.tex[im.key]
        if getattr(im, "key_color", "") and im.key_color not in self.collided:
            return self.tex.get(im.key_color)
        return None

    # ---------------- figures
    def figure_regions(self, items):
        vr = [i.bbox for i in items if i.kind == "rule" and i.role == "v"]

        def touches(b):
            return any(v[0] - 1.2 < b[2] and b[0] - 1.2 < v[2] and v[1] - 1.2 < b[3] and b[1] - 1.2 < v[3] for v in vr)

        seeds = [
            i
            for i in items
            if (i.kind == "path" and i.role != "bullet")
            or (i.kind == "rule" and i.role == "v")
            or (i.kind == "rule" and i.role == "h" and touches(i.bbox))
            or i.role == "fig"
        ]
        regions = []
        for s in seeds:
            b = s.bbox
            regions.append([b[0], b[1], b[2], b[3], 1 if s.kind == "rule" else 0])
        body = [i.bbox for i in items if i.kind == "char" and i.style in ("r", "b", "i") and i.role != "fig" and i.u.strip()]

        def text_left(r, o):
            """Body text (such as a choice label) beside the pair blocks a merge."""
            y0, y1 = min(r[1], o[1]), max(r[3], o[3])
            x0 = min(r[0], o[0])
            return any(y0 - 2 < (c[1] + c[3]) / 2 < y1 + 2 and c[2] <= x0 + 2 for c in body)
        def near(r, o):
            if r[0] - 8 < o[2] and o[0] - 8 < r[2] and r[1] - 8 < o[3] and o[1] - 8 < r[3]:
                return True
            # side by side: mostly the same rows, a modest gap between them
            ov = min(r[3], o[3]) - max(r[1], o[1])
            if ov > 0.5 * min(r[3] - r[1], o[3] - o[1]) and (max(r[0], o[0]) - min(r[2], o[2])) < 80:
                return True
            gx = max(r[0], o[0]) - min(r[2], o[2])
            gy = max(r[1], o[1]) - min(r[3], o[3])
            # a small label (axis title, point name, plot title) close to a figure
            small = lambda b: not b[4] and ((b[2] - b[0]) < 70 or (b[3] - b[1]) < 16)
            if (small(r) or small(o)) and gx < 16 and gy < 16 and not text_left(r, o):
                return True
            # stacked parts of one figure: title, plot, axis, legend
            xov = min(r[2], o[2]) - max(r[0], o[0])
            if gy < 18 and xov > 0.4 * min(r[2] - r[0], o[2] - o[0]) and not text_left(r, o):
                return True
            return False

        merged = True
        while merged:
            merged = False
            out = []
            for r in regions:
                for o in out:
                    if near(r, o):
                        o[0], o[1], o[2], o[3], o[4] = min(o[0], r[0]), min(o[1], r[1]), max(o[2], r[2]), max(o[3], r[3]), o[4] | r[4]
                        merged = True
                        break
                else:
                    out.append(list(r))
            regions = out
        regions = [r[:4] for r in regions]
        # absorb items that sit inside a region; grow until stable
        members = [[] for _ in regions]
        for _ in range(6):
            changed = False
            for k, r in enumerate(regions):
                for it in items:
                    if it.line == ("fig", k):
                        continue
                    if it.line is not None and it.line[0] == "fig":
                        continue
                    b = it.bbox
                    if it.kind == "char":
                        ok = inside(b, r, 1.5)
                    else:
                        ok = inside(b, r, 2.5) or (
                            b[0] >= r[0] - 2.5 and b[2] <= r[2] + 2.5 and b[1] >= r[1] - 2.5 and b[3] <= r[3] + 2.5
                        )
                    if ok:
                        it.line = ("fig", k)
                        members[k].append(it)
                        nr = [min(r[0], b[0]), min(r[1], b[1]), max(r[2], b[2]), max(r[3], b[3])]
                        if nr != r:
                            r[:] = nr
                            changed = True
            if not changed:
                break
        return [(tuple(r), m) for r, m in zip(regions, members) if m]

    # ---------------- lines
    def lines(self, items):
        lines = []
        by_base = collections.defaultdict(list)
        small = []
        for it in items:
            if it.line is None and it.kind == "char" and it.style in ("r", "b", "i"):
                if it.obj.size < 0.8:
                    small.append(it)
                else:
                    by_base[(it.page, round(it.obj.y * 2) / 2)].append(it)
        bases = sorted(by_base)
        merged = []
        for b in bases:
            if merged and merged[-1][0][0] == b[0] and abs(b[1] - merged[-1][0][1]) <= 1.0:
                merged[-1][1].extend(by_base[b])
            else:
                merged.append([b, list(by_base[b])])
        for (pg, b), its in merged:
            ln = Line(b, pg)
            for it in its:
                it.line = ln
                ln.items.append(it)
            lines.append(ln)
        # superscript and subscript text (smaller size, shifted baseline)
        for it in small:
            best, bd = None, 1e9
            for ln in lines:
                if ln.page != it.page:
                    continue
                dy = ln.base - it.obj.y
                if -4.5 < dy < 6.5:
                    xs = [c.bbox for c in ln.items]
                    if min(b[0] for b in xs) - 30 < it.bbox[0] < max(b[2] for b in xs) + 30 and abs(dy) < bd:
                        best, bd = ln, abs(dy)
            if best is None:
                ln = Line(it.obj.y, it.page)
                lines.append(ln)
                best = ln
            else:
                it.script = "s" if best.base - it.obj.y > 0.8 else ("d" if it.obj.y - best.base > 0.8 else "")
            it.line = best
            best.items.append(it)
        # underlines: horizontal rules right under body text
        for it in items:
            if it.kind == "rule" and it.role == "h" and it.line is None:
                b = it.bbox
                for ln in lines:
                    if 0.3 <= b[1] - ln.base <= 3.5:
                        hit = [c for c in ln.items if c.kind == "char" and c.bbox[0] < b[2] - 0.5 and c.bbox[2] > b[0] + 0.5]
                        if hit:
                            # only an underline if no math sits directly under the rule
                            below = [g for g in items if g.kind == "glyph" and g.line is None and overlap_x(g.bbox, b) and 0 < g.bbox[1] - b[3] < 6]
                            if not below:
                                for c in hit:
                                    cx = (c.bbox[0] + c.bbox[2]) / 2
                                    if b[0] - 0.5 <= cx <= b[2] + 0.5:
                                        c.under = True
                                it.line = ("under", None)
                                break
        # math and inline images: attach to the nearest text line
        loose = [i for i in items if i.line is None and i.kind in ("glyph", "rule", "image", "path", "char")]
        for it in loose:
            b = it.bbox
            cy = (b[1] + b[3]) / 2
            best, bd = None, 1e9
            for ln in lines:
                if ln.page != it.page:
                    continue
                d = abs((ln.base - 2.6) - cy)
                lo, hi = ln.base - 12.0, ln.base + 7.5
                if lo <= cy <= hi and d < bd:
                    best, bd = ln, d
            if best is not None and not (it.kind == "image" and (b[3] - b[1]) > 30 and not self._near_text(best, b)):
                it.line = best
                best.items.append(it)
        # leftovers become display lines (grouped by vertical overlap)
        rest = [i for i in items if i.line is None and i.kind in ("glyph", "rule", "image", "path", "char")]
        rest.sort(key=lambda i: (i.page, i.bbox[1]))
        groups = []
        for it in rest:
            for g in groups:
                if g["page"] == it.page and it.bbox[1] < g["box"][3] + 1.0 and g["box"][1] < it.bbox[3] + 1.0:
                    g["items"].append(it)
                    gb = g["box"]
                    g["box"] = (min(gb[0], it.bbox[0]), min(gb[1], it.bbox[1]), max(gb[2], it.bbox[2]), max(gb[3], it.bbox[3]))
                    break
            else:
                groups.append(dict(page=it.page, items=[it], box=it.bbox))
        for g in groups:
            ln = Line(g["box"][3], g["page"])
            ln.virtual = True
            for it in g["items"]:
                it.line = ln
                ln.items.append(it)
            lines.append(ln)
        return lines

    def _near_text(self, ln, b):
        return any(c.kind == "char" and abs(c.bbox[2] - b[0]) < 6 or abs(b[2] - c.bbox[0]) < 6 for c in ln.items if c.kind == "char")

    # ---------------- inline content of a line
    def inline(self, ln):
        glyphs = [i.bbox for i in ln.items if i.kind in ("glyph", "image")]

        def sort_x(i):
            # a bar over letters (overline, vinculum) sorts with the first glyph under it
            if i.kind == "rule":
                under = [g[0] for g in glyphs if g[0] < i.bbox[2] and g[2] > i.bbox[0]]
                if under:
                    return max(i.bbox[0], min(under) - 0.01)
            return i.bbox[0]

        its = sorted(ln.items, key=lambda i: (sort_x(i), i.bbox[1]))
        out = []
        run = []
        base = ln.base

        def flush():
            if not run:
                return
            kinds = {i.kind for i in run}
            if "path" in kinds or "char" in kinds:
                self.warn.append("inline run with " + ",".join(sorted(kinds)) + " near y=" + str(round(ln.base)))
            gl = [i.bbox for i in run if i.kind in ("glyph", "image")]
            if gl:
                gx0, gx1 = min(b[0] for b in gl), max(b[2] for b in gl)
                for k, i in enumerate(run):
                    if i.kind == "rule" and (i.bbox[0] < gx0 - 2.5 or i.bbox[2] > gx1 + 2.5):
                        run[k] = trimmed_rule(i, max(i.bbox[0], gx0 - 1.0), min(i.bbox[2], gx1 + 1.0))
            box = bbox_union(i.bbox for i in run)
            w, h, x0, y0, body = self.svg.render(run, box, pad=0.4)
            va = -((y0 + h) - base) / EM if not ln.virtual else None
            out.append(dict(m=body, w=round(w / EM, 3), h=round(h / EM, 3), va=round(va, 3) if va is not None else None, x0=x0, x1=x0 + w))
            run.clear()

        for it in its:
            if it.kind == "char" and it.style in ("r", "b", "i"):
                flush()
                flags = it.style if it.style != "r" else ""
                if it.under:
                    flags += "u"
                flags += it.script
                u = it.u
                if out and "t" in out[-1] and out[-1].get("f", "") == flags:
                    out[-1]["t"] += u
                    out[-1]["x1"] = it.bbox[2]
                else:
                    out.append(dict(t=u, f=flags, x0=it.bbox[0], x1=it.bbox[2]))
            elif it.kind == "image" and it.obj.key in self.images:
                flush()
                b = it.bbox
                tex = self.tex_for(it.obj)
                if tex and tex != "!img":
                    out.append(dict(tex=tex, x0=b[0], x1=b[2]))
                else:
                    if not tex:
                        self.warn.append("untranscribed image " + it.obj.key)
                    self.svg.images_used.add(it.obj.key)
                    out.append(dict(img=it.obj.key, w=round((b[2] - b[0]) / EM, 3), h=round((b[3] - b[1]) / EM, 3), va=round(-(b[3] - base) / EM, 3), x0=b[0], x1=b[2]))
            else:
                if run and it.bbox[0] - max(r.bbox[2] for r in run) > 7.0:
                    flush()
                run.append(it)
        flush()
        return out

    # ---------------- blocks
    def blocks(self, lines, figs, base_x=MARGIN):
        """Ordered blocks for one section."""
        entries = []
        for ln in lines:
            entries.append(("line", ln.page, ln.bbox[1], ln))
        for box, members, page in figs:
            entries.append(("fig", page, box[1], (box, members)))
        entries.sort(key=lambda e: (e[1], e[2]))
        blocks = []
        prev = None  # (line, block)
        for kind, page, top, obj in entries:
            if kind == "fig":
                box, members = obj
                w, h, x0, y0, body = self.svg.render(members, box, pad=1.0, keep_color=True)
                chars = [m for m in members if m.kind == "char" and m.u.strip()]
                rows = collections.defaultdict(list)
                for c in chars:
                    rows[round(c.obj.y / 3)].append(c)
                alt = " ".join("".join(c.u for c in sorted(rows[k], key=lambda c: c.bbox[0])) for k in sorted(rows))
                blk = dict(k="fig", svg=body, w=round(w / EM, 3), h=round(h / EM, 3), top=top, page=page, x0=box[0])
                if w < 30 or h < 12:
                    self.warn.append(f"small figure {round(w)}x{round(h)} at y={round(box[1])}")
                if alt.strip():
                    blk["alt"] = alt.strip()
                xh = sorted(c.bbox[3] - c.bbox[1] for c in chars if c.u in "acemnorsuvwxz" and not c.obj.rot)
                if xh and xh[len(xh) // 2] < 3.9 and w > 250:
                    blk["fit"] = 1  # small table text (x-height under 3.9pt): let it use the column width
                blocks.append(blk)
                prev = None
                continue
            ln = obj
            bullets = [i for i in ln.items if i.role == "bullet"]
            if bullets:
                ln.items = [i for i in ln.items if i.role != "bullet"]
            inl = self.inline(ln)
            if not inl:
                continue
            lb = ln.bbox
            x0 = lb[0]
            text_x0 = min((i.bbox[0] for i in ln.items if i.kind == "char" and i.u.strip()), default=None)
            new_par = True
            if bullets:
                pass
            elif prev is not None and not ln.virtual and not prev[0].virtual and prev[0].page == ln.page:
                pb = prev[0].bbox
                gap = lb[1] - pb[3]
                pitch = ln.base - prev[0].base
                dedent = x0 < prev[0].bbox[0] - 1.5  # back out to the left: a new paragraph (verse, then prose)
                if gap < 7.5 and not dedent and (abs(x0 - base_x) < 1.5 or abs(x0 - prev[1]["x0"]) < 1.5):
                    new_par = False
            elif prev is not None and not ln.virtual and not prev[0].virtual and prev[0].page != ln.page:
                # page break inside a paragraph: continue if the previous line ran to the right margin
                if prev[0].bbox[2] > RIGHT - 40 and (abs(x0 - base_x) < 1.5 or abs(x0 - prev[1]["x0"]) < 1.5):
                    new_par = False
            if not new_par:
                blk = prev[1]
                blk["_lines"].append((inl, lb[2], self._first_token_width(ln)))
                prev = (ln, blk)
                continue
            indent = max(0.0, x0 - base_x)
            center = ln.virtual or (x0 > base_x + 40 and abs((lb[0] + lb[2]) / 2 - 306) < 30)
            blk = dict(k="p", c=None, top=top, page=page, x0=x0, _lines=[(inl, lb[2], 0.0)])
            if bullets:
                blk["li"] = 1
            elif center:
                blk["al"] = "c"
            elif indent > 1.5:
                blk["ind"] = round(indent / EM, 2)
                if lb[2] > RIGHT - 4 and indent > 200:
                    blk["al"] = "r"  # right-aligned credit line
                    blk.pop("ind")
            blocks.append(blk)
            prev = (ln, blk)
        for blk in blocks:
            if blk["k"] != "p":
                continue
            lines_ = blk.pop("_lines")
            right = max(x1 for _, x1, _ in lines_)
            c = list(lines_[0][0])
            for k in range(1, len(lines_)):
                inl, _, first_w = lines_[k]
                prev_x1 = lines_[k - 1][1]
                # hard break only if the previous line stopped well short and the next word would have fit
                if prev_x1 + first_w + 6 < right - 3:
                    c.append(dict(br=1))
                else:
                    last = c[-1]
                    if "t" in last and not last["t"].endswith((" ", " ", "-", "—", "/")) and not ("t" in inl[0] and inl[0]["t"].startswith(" ")):
                        last["t"] += " "
                    elif "t" not in last and not ("t" in inl[0] and inl[0]["t"][:1] in (" ", ",", ".", ";", ":", ")")):
                        c.append(dict(t=" ", f=""))
                c.extend(inl)
            blk["c"] = c
        return blocks

    def _first_token_width(self, ln):
        """Width of the unbreakable run that starts the line (non-breaking spaces glue)."""
        x_start = x_end = None
        for it in sorted(ln.items, key=lambda i: i.bbox[0]):
            if it.kind == "char" and it.u in (" ", "\t"):
                if x_start is not None:
                    break
                continue
            if x_start is None:
                x_start = it.bbox[0]
            x_end = it.bbox[2] if x_end is None else max(x_end, it.bbox[2])
        return 0.0 if x_start is None else x_end - x_start


def trimmed_rule(it, x0, x1):
    """A copy of a horizontal rule item cut to [x0, x1]."""
    import copy

    p = copy.copy(it.obj)
    _, y0, _, y1 = it.bbox
    p.segs = [("M", x0, y0), ("L", x1, y0), ("L", x1, y1), ("L", x0, y1), ("Z",)]
    if not p.fill:
        p.fill, p.stroke = p.stroke, None
    out = Item("rule", p, (x0, y0, x1, y1), it.page)
    out.role = it.role
    out.line = it.line
    return out


def clean_blocks(blocks):
    for b in blocks:
        for k in ("top", "page", "x0"):
            b.pop(k, None)
        if b["k"] == "p":
            out = []
            for c in b["c"]:
                c.pop("x0", None)
                c.pop("x1", None)
                if "t" in c:
                    if not c["f"]:
                        c.pop("f")
                    if out and "t" in out[-1] and out[-1].get("f") == c.get("f"):
                        out[-1]["t"] += c["t"]
                        continue
                out.append(c)
            # trim
            if out and "t" in out[0]:
                out[0]["t"] = out[0]["t"].lstrip()
            if out and "t" in out[-1]:
                out[-1]["t"] = out[-1]["t"].rstrip()
            b["c"] = [c for c in out if not ("t" in c and c["t"] == "")]
    return [b for b in blocks if b["k"] != "p" or b["c"]]


# ---------------------------------------------------------------- driver
def load_taxonomy(path):
    sections = []
    cur_sec = cur_cat = cur_sub = None
    for raw in open(path, encoding="utf-8"):
        line = raw.rstrip("\n")
        if not line.strip() or line.startswith("# Source of truth") or line.startswith("# Line format"):
            continue
        if line.startswith("@"):
            name, pdf = line[1:].split(" ", 1)
            cur_sec = dict(key=name, pdf=pdf, categories=[])
            sections.append(cur_sec)
        elif line.startswith("## "):
            num, name = line[3:].split(" ", 1)
            cur_sub = dict(num=int(num), name=name, questions=[])
            cur_cat["subs"].append(cur_sub)
        elif line.startswith("# "):
            cur_cat = dict(name=line[2:], subs=[])
            cur_sec["categories"].append(cur_cat)
        else:
            code, qid, pattern = line.split(" ", 2)
            cur_sub["questions"].append(dict(code=code, id=qid, pattern=pattern))
    return sections


def families(cache):
    """Group fonts into families by shared glyph outlines; place leftovers by glyph widths."""
    parent = {}

    def find(a):
        while parent.setdefault(a, a) != a:
            parent[a] = parent[parent[a]]
            a = parent[a]
        return a

    def union(a, b):
        a, b = find(a), find(b)
        if a != b:
            parent[b] = a

    owner = {}
    count = collections.Counter()
    widths = collections.defaultdict(dict)
    for name in ("math", "rw"):
        d = pickle.load(open(os.path.join(cache, f"{name}.pkl"), "rb"))
        for pg in d["pages"]:
            for c in pg["chars"]:
                f = f"{name}:{c.font}"
                find(f)
                count[f] += 1
                if c.gname:
                    widths[f][c.gname] = round(c.wunits, 4)
                if c.glyph and c.u.strip():
                    if c.glyph in owner:
                        union(owner[c.glyph], f)
                    else:
                        owner[c.glyph] = f
    roots = collections.Counter()
    for f, n in count.items():
        roots[find(f)] += n
    big = [r for r, n in roots.most_common() if n > 500]
    # canonical names for the three Roboto families and the chart font
    ref = {}
    for r in big:
        ref[r] = {}
    for f in count:
        r = find(f)
        if r in ref:
            ref[r].update(widths[f])
    out = {}
    for f in count:
        r = find(f)
        if r not in ref and widths[f]:
            best, score = None, 0
            for rr, tab in ref.items():
                sc = sum(1 for g, w in widths[f].items() if g in tab and abs(tab[g] - w) < 1e-3) - sum(
                    1 for g, w in widths[f].items() if g in tab and abs(tab[g] - w) >= 1e-3
                )
                if sc > score:
                    best, score = rr, sc
            if best is not None:
                r = best
        out[f] = r
    # name the families by known text
    names = {}
    for name in ("math",):
        d = pickle.load(open(os.path.join(cache, f"{name}.pkl"), "rb"))
        pg = d["pages"][0]
        for c in pg["chars"]:
            f = out[f"{name}:{c.font}"]
            if c.u == "Q" and c.bbox[1] < 45:
                names[f] = BOLD
            if c.u == "S" and 80 < c.y < 95:
                names[f] = REG
        pg = d["pages"][1]
        for c in pg["chars"]:
            f = out[f"{name}:{c.font}"]
            if c.u == "y" and f not in names:
                names[f] = ITAL
    for r in big:
        if r not in names:
            names[r] = SANS if r not in names.values() else r
    print("families:", {names.get(r, r): roots[r] for r in big})
    return {f: names.get(r, r) for f, r in out.items()}


def main():
    cache, tax_path, out = sys.argv[1:4]
    only = sys.argv[4] if len(sys.argv) > 4 else None
    os.makedirs(os.path.join(out, "img"), exist_ok=True)
    libd = pickle.load(open(os.path.join(cache, "lib.pkl"), "rb"))
    lib, images = libd["paths"], libd["images"]
    fam = families(cache)
    taxonomy = load_taxonomy(tax_path)
    data_dir = os.path.dirname(os.path.abspath(tax_path))
    tex = {}
    for line in open(os.path.join(data_dir, "mathtype.tsv"), encoding="utf-8"):
        if line.startswith("#") or not line.strip():
            continue
        key, _code, latex = line.rstrip("\n").split("\t", 2)
        tex[key] = latex
    overrides = json.load(open(os.path.join(data_dir, "overrides.json")))
    # earlier image keys hashed only the color data; a few different images shared one
    by_color = collections.defaultdict(set)
    for name in ("math", "rw"):
        for pg in pickle.load(open(os.path.join(cache, f"{name}.pkl"), "rb"))["pages"]:
            for im in pg["images"]:
                by_color[im.key_color].add(im.key)
    collided = {k for k, v in by_color.items() if len(v) > 1}
    used, images_used = set(), set()
    svg = SvgOut(lib, used, images_used)
    global TEX_FOR
    _probe = Builder(lib, images, svg, tex)
    _probe.collided = collided
    TEX_FOR = _probe.tex_for
    questions = {}
    report = []
    for sec in taxonomy:
        name = sec["key"]
        d = pickle.load(open(os.path.join(cache, f"{name}.pkl"), "rb"))
        pages = d["pages"]
        fonts = d["fonts"]

        def style_of(fid, name=name):
            root = fam.get(f"{name}:{fid}")
            if root == BOLD:
                return "b"
            if root == ITAL:
                return "i"
            if root == SANS or "OpenSans" in fonts.get(fid, ""):
                return "fig"
            return "r"

        # page -> question id
        starts = []
        for pi, pg in enumerate(pages):
            t = "".join(c.u for c in pg["chars"] if c.bbox[1] < 45)
            m = re.search(r"Question ID: ([0-9a-f]{8})", t)
            if m:
                starts.append((pi, m.group(1)))
        starts.append((len(pages), None))
        for k in range(len(starts) - 1):
            p0, qid = starts[k]
            p1 = starts[k + 1][0]
            if only and qid != only:
                continue
            b = Builder(lib, images, svg, tex)
            b.collided = collided
            q = assemble(b, pages, p0, p1, style_of, name)
            q["id"] = qid
            q["_warn"].extend(b.warn)
            if qid in overrides.get("answers", {}):
                q["answer"] = overrides["answers"][qid]
            fixes = list(overrides.get("mathOutputError", {}).get(qid, []))
            n_err = restore_math_errors(q, fixes)
            if n_err or fixes:
                q["_warn"].append(f"math output errors: {n_err} found, {len(fixes)} left")
            questions[qid] = q
            report.append((qid, name, p0 + 1, p1 - p0, q.get("_warn", [])))
    # attach taxonomy
    ordered = []
    for sec in taxonomy:
        for cat in sec["categories"]:
            for sub in cat["subs"]:
                for qq in sub["questions"]:
                    q = questions.get(qq["id"])
                    if q is None:
                        print("MISSING", qq)
                        continue
                    q.update(code=qq["code"], pattern=qq["pattern"], section=sec["key"], category=cat["name"], sub=sub["num"], subName=sub["name"])
                    ordered.append(q)
    with open(os.path.join(out, "questions.json"), "w", encoding="utf-8") as fh:
        json.dump(ordered, fh, ensure_ascii=False, separators=(",", ":"))
    with open(os.path.join(out, "taxonomy.json"), "w", encoding="utf-8") as fh:
        json.dump(taxonomy, fh, ensure_ascii=False, indent=1)
    # glyph sprite
    with open(os.path.join(out, "glyphs.svg"), "w") as fh:
        fh.write('<svg xmlns="http://www.w3.org/2000/svg"><defs>')
        for gid in sorted(used):
            fh.write(f'<path id="{gid}" d="{lib[gid]}"/>')
        fh.write("</defs></svg>")
    for key in images_used:
        open(os.path.join(out, "img", key + ".png"), "wb").write(images[key])
    with open(os.path.join(out, "report.txt"), "w") as fh:
        for r in report:
            fh.write(f"{r[0]} {r[1]} p{r[2]} n{r[3]} {'; '.join(r[4])}\n")
    print("questions", len(ordered), "glyphs", len(used), "images", len(images_used))


MOE = "Math output error"


def restore_math_errors(q, fixes):
    """Replace each 'Math output error' with the next LaTeX fix, in reading order."""
    count = 0

    def fix_blocks(bs):
        nonlocal count
        for b in bs:
            if b["k"] != "p":
                continue
            out = []
            for c in b["c"]:
                if "t" in c and MOE in c["t"]:
                    parts = c["t"].split(MOE)
                    for i, part in enumerate(parts):
                        if part:
                            seg = dict(c)
                            seg["t"] = part
                            out.append(seg)
                        if i < len(parts) - 1:
                            count += 1
                            tex = fixes.pop(0) if fixes else "?"
                            out.append(dict(tex=tex))
                else:
                    out.append(c)
            b["c"] = out

    fix_blocks(q["stem"])
    for ch in q["choices"]:
        fix_blocks(ch["c"])
    fix_blocks(q["rationale"])
    return count


def assemble(b: Builder, pages, p0, p1, style_of, secname):
    warn = []
    all_items = []
    meta = {}
    for pi in range(p0, p1):
        items = build_items(pages[pi], pi, None, style_of)
        if pi == p0:
            # header table: read Domain and Skill, then drop everything above "Question"
            qy = None
            for it in items:
                if it.kind == "char" and it.style == "b":
                    pass
            bold_lines = collections.defaultdict(list)
            for it in items:
                if it.kind == "char" and it.style == "b":
                    bold_lines[round(it.obj.y, 1)].append(it)
            for y, its in sorted(bold_lines.items()):
                if text_of(its).strip() == "Question" and y > 80:
                    qy = y
                    break
            if qy is None:
                warn.append("no Question header")
                qy = 120
            cols = [(24, 130, "assessment"), (130, 245, "test"), (245, 360, "domain"), (360, 475, "skill"), (475, 600, "difficulty")]
            hdr = [it for it in items if it.kind == "char" and it.style == "r" and 80 < it.obj.y < qy - 8]
            for x0, x1, key in cols:
                cs = [c for c in hdr if x0 <= c.obj.x < x1]
                rows = collections.defaultdict(list)
                for c in cs:
                    rows[round(c.obj.y, 1)].append(c)
                meta[key] = " ".join(text_of(rows[y]).strip() for y in sorted(rows)).strip()
            items = [it for it in items if it.bbox[1] > qy - 9]
        all_items.extend(items)
    # section headers
    heads = []
    bold_lines = collections.defaultdict(list)
    for it in all_items:
        if it.kind == "char" and it.style == "b":
            bold_lines[(it.page, round(it.obj.y, 1))].append(it)
    for (pg, y), its in bold_lines.items():
        its.sort(key=lambda i: i.bbox[0])
        if abs(its[0].bbox[0] - MARGIN) > 2.5:
            continue
        t = text_of(its).strip()
        if t in HEADER_WORDS or t.startswith("Correct Answer:"):
            heads.append((pg, y, t, its))
    heads.sort(key=lambda h: (h[0], h[1]))
    names = [h[2] if not h[2].startswith("Correct Answer:") else "Correct" for h in heads]
    if names[:1] != ["Question"] or "Correct" not in names or "Rationale" not in names:
        warn.append("headers: " + ",".join(names))
    answer = None
    for h in heads:
        if h[2].startswith("Correct Answer:"):
            answer = h[2].split(":", 1)[1].strip()
    # remove header chars
    head_items = {id(i) for h in heads for i in h[3]}
    all_items = [i for i in all_items if id(i) not in head_items]

    def section_of(it):
        key = (it.page, it.bbox[1])
        cur = None
        for h in heads:
            if (h[0], h[1] - 8) <= key:
                cur = h[2]
        return cur

    # figures are found per page over all items, before splitting into sections
    figs_by_page = collections.defaultdict(list)
    for pi in range(p0, p1):
        pits = [i for i in all_items if i.page == pi]
        for box, members in b.figure_regions(pits):
            figs_by_page[pi].append((box, members))
    lines = b.lines(all_items)

    def sec_key(name):
        return "Correct" if name and name.startswith("Correct Answer:") else name

    sec_lines = collections.defaultdict(list)
    for ln in lines:
        s = None
        y = ln.bbox[1]
        for h in heads:
            if (h[0], h[1] - 4) <= (ln.page, y + 4):
                s = sec_key(h[2])
        sec_lines[s].append(ln)
    sec_figs = collections.defaultdict(list)
    for pi, figs in figs_by_page.items():
        for box, members in figs:
            s = None
            for h in heads:
                if (h[0], h[1] - 4) <= (pi, box[1] + 4):
                    s = sec_key(h[2])
            sec_figs[s].append((box, members, pi))
    q = dict(meta=meta, answer=answer)
    q["stem"] = clean_blocks(b.blocks(sec_lines["Question"], sec_figs["Question"]))
    # choices
    choices = []
    if "Answer" in names:
        lns = sec_lines["Answer"]
        figs = sec_figs["Answer"]
        labels = []
        for ln in lns:
            cs = sorted([i for i in ln.items if i.kind == "char" and i.u.strip()], key=lambda i: i.bbox[0])
            if len(cs) >= 2 and abs(cs[0].bbox[0] - MARGIN) < 2 and cs[0].u in "ABCD" and cs[1].u == ".":
                labels.append((ln.page, ln.base, cs[0].u, cs[:2]))
        labels.sort()
        if [l[2] for l in labels] != ["A", "B", "C", "D"]:
            warn.append("choice labels " + "".join(l[2] for l in labels))
        lab_items = {id(i) for l in labels for i in l[3]}
        for ln in lns:
            ln.items = [i for i in ln.items if id(i) not in lab_items]
        groups = collections.defaultdict(lambda: ([], []))
        for ln in lns:
            if not ln.items:
                continue
            owner = None
            for l in labels:
                if (l[0], l[1] - 2) <= (ln.page, ln.bbox[3]):
                    owner = l[2]
            groups[owner][0].append(ln)
        for box, members, pi in figs:
            owner = None
            for l in labels:
                if (l[0], l[1] - 2) <= (pi, box[3]):
                    owner = l[2]
            groups[owner][1].append((box, members, pi))
        for l in labels:
            lns_, figs_ = groups[l[2]]
            xs = [ln.bbox[0] for ln in lns_ if not ln.virtual]
            bx = min(xs) if xs else MARGIN
            choices.append(dict(l=l[2], c=clean_blocks(b.blocks(lns_, figs_, base_x=max(bx, MARGIN)))))
        if groups.get(None) and (groups[None][0] or groups[None][1]):
            warn.append("content before choice A")
    q["choices"] = choices
    q["rationale"] = clean_blocks(b.blocks(sec_lines["Rationale"], sec_figs["Rationale"]))
    if sec_lines.get(None) or sec_figs.get(None):
        warn.append("content outside sections")
    if sec_lines.get("Correct"):
        extra = [text_of(ln.items) for ln in sec_lines["Correct"]]
        extra = [t for t in extra if t.strip()]
        if extra:
            warn.append("extra in Correct: " + " | ".join(extra)[:80])
    dropped = [i for i in all_items if i.line is None and not (i.kind == "char" and not i.u.strip())]
    if dropped:
        warn.append(f"dropped {len(dropped)}: " + "".join(i.u for i in dropped if i.kind == "char")[:40] + " " + ",".join(sorted({i.kind for i in dropped})))
    if not answer:
        txt = "".join(c.get("t", "\u25a1") for blk in q["rationale"] if blk["k"] == "p" for c in blk["c"])
        m = re.search(r"[Tt]he correct answer is ([^\s.,]+(?:\.\d+)?)", txt)
        if m and "\u25a1" not in m.group(1):
            q["answer"] = m.group(1)
            warn.append("answer from rationale: " + m.group(1))
        else:
            warn.append("NO ANSWER")
    q["_warn"] = warn
    return q


if __name__ == "__main__":
    main()
