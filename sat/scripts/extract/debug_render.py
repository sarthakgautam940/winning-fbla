"""Redraw a page from the interpreter's items as SVG, to compare with the PDF."""
import sys

from pypdf import PdfReader

from pdfgfx import GlyphLib, PageInterp, fmt


def page_svg(pi: PageInterp, lib: GlyphLib, mark=False) -> str:
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{pi.W*2}" height="{pi.H*2}" viewBox="0 0 {pi.W} {pi.H}"><rect width="100%" height="100%" fill="white"/><defs>']
    used = {p.glyph for p in pi.paths if p.glyph} | {c.glyph for c in pi.chars if c.glyph}
    for gid in used:
        out.append(f'<path id="{gid}" d="{lib.paths[gid]}"/>')
    out.append("</defs>")
    items = sorted([(p.order, "p", p) for p in pi.paths] + [(c.order, "c", c) for c in pi.chars], key=lambda t: t[0])
    for _, k, it in items:
        if k == "p":
            if it.kind == "g":
                m = it.gm
                col = "#c00" if mark else (it.fill or "#000")
                out.append(f'<use xlink:href="#{it.glyph}" fill="{col}" transform="matrix({",".join(fmt(v,4) for v in m)})"/>')
            else:
                attrs = [f'd="{it.d()}"']
                attrs.append(f'fill="{it.fill}"' if it.fill else 'fill="none"')
                if it.evenodd:
                    attrs.append('fill-rule="evenodd"')
                if it.stroke:
                    attrs.append(f'stroke="{it.stroke}" stroke-width="{fmt(it.lw,3)}"')
                    if it.dash:
                        attrs.append('stroke-dasharray="' + " ".join(fmt(v, 2) for v in it.dash) + '"')
                out.append("<path " + " ".join(attrs) + "/>")
        else:
            if it.glyph:
                col = "#06c" if mark else it.color
                out.append(f'<use xlink:href="#{it.glyph}" fill="{col}" transform="matrix({",".join(fmt(v,5) for v in it.m)})"/>')
            else:
                out.append(f'<text x="{fmt(it.x)}" y="{fmt(it.y)}" font-size="{fmt(it.size)}" font-family="Open Sans" fill="{"#090" if mark else it.color}">{it.u.replace("&","&amp;").replace("<","&lt;")}</text>')
    out.append("</svg>")
    return "".join(out)


if __name__ == "__main__":
    pdf, page, dst = sys.argv[1], int(sys.argv[2]), sys.argv[3]
    mark = len(sys.argv) > 4
    r = PdfReader(pdf)
    lib = GlyphLib()
    pi = PageInterp(r, page - 1, lib, {}).run()
    open(dst, "w").write(page_svg(pi, lib, mark))
    print("chars", len(pi.chars), "paths", len(pi.paths), "glyph paths", sum(p.kind == "g" for p in pi.paths), "lib", len(lib.paths))
