"""Interpret every page of both PDFs and cache the items (pickle) for layout work.

usage: python interpret_all.py <math.pdf> <rw.pdf> <cache_dir>
"""
import os
import pickle
import sys
from concurrent.futures import ProcessPoolExecutor

from pypdf import PdfReader

from pdfgfx import GlyphLib, PageInterp

_reader = {}
_fonts = {}
_lib = GlyphLib()


def work(args):
    pdf, idx = args
    if pdf not in _reader:
        _reader[pdf] = PdfReader(pdf)
        _fonts[pdf] = {}
    lib = _lib
    pi = PageInterp(_reader[pdf], idx, lib, _fonts[pdf]).run()
    fonts = {}
    for f in _fonts[pdf].values():
        fonts[f.id] = f.base
    return idx, dict(W=pi.W, H=pi.H, chars=pi.chars, paths=pi.paths, images=pi.images), (dict(lib.paths), dict(lib.boxes), pi.image_data), fonts


def main():
    math_pdf, rw_pdf, out = sys.argv[1:4]
    os.makedirs(out, exist_ok=True)
    lib_all = {}
    box_all = {}
    img_all = {}
    for name, pdf in (("math", math_pdf), ("rw", rw_pdf)):
        n = len(PdfReader(pdf).pages)
        pages = [None] * n
        fonts_all = {}
        with ProcessPoolExecutor(max_workers=os.cpu_count()) as ex:
            for idx, page, lib, fonts in ex.map(work, [(pdf, i) for i in range(n)], chunksize=4):
                pages[idx] = page
                lib_all.update(lib[0])
                box_all.update(lib[1])
                img_all.update(lib[2])
                fonts_all.update(fonts)
        with open(os.path.join(out, f"{name}.pkl"), "wb") as fh:
            pickle.dump(dict(pages=pages, fonts=fonts_all), fh)
        print(name, n, "pages")
    with open(os.path.join(out, "lib.pkl"), "wb") as fh:
        pickle.dump(dict(paths=lib_all, boxes=box_all, images=img_all), fh)
    print("glyphs", len(lib_all))


if __name__ == "__main__":
    main()
