"""Render extracted questions to a static HTML page for side-by-side checking.

usage: python preview.py <out_dir> <html> [id_or_code ...]
"""
import html
import json
import sys


def inline(c):
    out = []
    for x in c:
        if "t" in x:
            t = html.escape(x["t"])
            f = x.get("f", "")
            if "b" in f:
                t = f"<b>{t}</b>"
            if "i" in f:
                t = f"<i>{t}</i>"
            if "u" in f:
                t = f"<u>{t}</u>"
            if "s" in f:
                t = f"<sup>{t}</sup>"
            if "d" in f:
                t = f"<sub>{t}</sub>"
            out.append(t)
        elif "m" in x:
            va = x.get("va")
            style = f"width:{x['w']}em;height:{x['h']}em;" + (f"vertical-align:{va}em" if va is not None else "")
            out.append(f'<svg class="m" viewBox="0 0 {x["w"]*9:.2f} {x["h"]*9:.2f}" style="{style}">{x["m"]}</svg>')
        elif "img" in x:
            out.append(f'<img class="im" src="img/{x["img"]}.png" style="width:{x["w"]}em;height:{x["h"]}em;vertical-align:{x["va"]}em">')
        elif "tex" in x:
            out.append(f'<span class="tex">{html.escape(x["tex"])}</span>')
        elif "br" in x:
            out.append("<br>")
    return "".join(out)


def blocks(bs):
    out = []
    for b in bs:
        if b["k"] == "fig":
            out.append(f'<div class="fig"><svg viewBox="0 0 {b["w"]*9:.2f} {b["h"]*9:.2f}" style="width:{b["w"]}em;max-width:100%">{b["svg"]}</svg></div>')
        else:
            st = ""
            if b.get("li"):
                st = "display:list-item;margin-left:2em"
            elif b.get("al") == "c":
                st = "text-align:center"
            elif b.get("ind"):
                st = f"padding-left:{b['ind']}em"
            out.append(f'<p style="{st}">{inline(b["c"])}</p>')
    return "".join(out)


def main():
    out, dst = sys.argv[1], sys.argv[2]
    want = set(sys.argv[3:])
    qs = json.load(open(f"{out}/questions.json"))
    sprite = open(f"{out}/glyphs.svg").read().replace("<svg ", '<svg style="display:none" ', 1)
    parts = [
        """<html><head><meta charset="utf-8"><style>
body{font-family:Roboto,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1e1e1e;margin:0;background:#fff}
.q{width:640px;padding:16px 20px;border-bottom:1px solid #ccc}
.q h3{margin:0 0 8px;font-size:13px;color:#888}
svg.m{display:inline-block;overflow:visible}
.fig{text-align:center;margin:8px 0}
.ch{display:flex;gap:8px;margin:6px 0}.ch .l{font-weight:700;width:1.2em}
.ans{font-weight:700;margin:10px 0}.rat{color:#333;border-top:1px dashed #ddd;margin-top:8px}
p{margin:6px 0}
</style></head><body>""",
        sprite,
    ]
    for q in qs:
        if want and q["id"] not in want and q["code"] not in want:
            continue
        parts.append(f'<div class="q" id="{q["id"]}"><h3>{q["code"]} {q["id"]} {html.escape(q["meta"].get("skill",""))}</h3>')
        parts.append(blocks(q["stem"]))
        for ch in q["choices"]:
            parts.append(f'<div class="ch"><span class="l">{ch["l"]}.</span><div>{blocks(ch["c"])}</div></div>')
        parts.append(f'<div class="ans">Answer: {html.escape(q["answer"] or "?")}</div>')
        parts.append(f'<div class="rat">{blocks(q["rationale"])}</div></div>')
    parts.append("</body></html>")
    open(dst, "w").write("".join(parts))


if __name__ == "__main__":
    main()
