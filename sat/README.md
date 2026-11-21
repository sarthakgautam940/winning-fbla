# SAT Bank

A mastery question bank for the hardest SAT questions: 246 Math and 235 Reading and Writing, every one exactly as the College Board question bank exports it (same wording, math, tables, and figures), organized into 127 patterns. Each question has to be answered correctly 5 times to count as mastered.

## Run it

```bash
cd sat
npm install
npm run dev
```

`npm run dev` and `npm run build` first run `scripts/build-data.mjs`, which turns `data/` into `public/data/` and `src/generated/`.

## Deploy

It is a static site (`output: "export"`). On Vercel, create a project from this repository with **Root Directory** set to `sat`; the defaults do the rest. Any static host works too: `npm run build`, then serve `out/`.

Progress is stored in the browser (localStorage). Settings has Export and Import so it can be backed up or moved to another device.

## How studying works

- **Mastery.** A question is mastered after 5 correct answers. Wrong answers never count toward the 5.
- **Spacing** (`src/lib/engine.ts`). A session keeps a small working set. After a miss, the question returns after 2 other questions; after correct answers 1 to 4 it returns after 3, 5, 8, then 12 others. A question never shows twice in a row, the set grows only when nothing is due, and every question comes back within about a dozen steps. Questions due at the same time come in a shuffled order.
- **Feedback.** Picking a choice shows green or red at once, then the College Board explanation and the pattern's teaching note. Click anywhere (or press Enter) to move on. Keys A to D or 1 to 4 answer.
- **Plan** (`src/lib/plan.ts`). Learning runs through December 1: the daily target is the correct answers still needed divided by the days left. December 2 and 3 are hardening days (one clean pass over every mastered question; a miss drops it to 3 of 5), December 4 is a light review of the most-missed questions, and December 5 is the test. Both dates can be changed in Settings.
- **Analytics** (`src/lib/stats.ts`). First-try accuracy (the best signal for test day), accuracy by topic and pattern, time per answer, the last 14 days, the weakest patterns, and the most-missed questions.

## Where the content comes from

`data/` holds everything the app is built from:

| File | What it is |
|---|---|
| `taxonomy.txt` | Sections, categories, the 127 patterns, and each question's code, College Board ID, and description |
| `extracted/` | The questions extracted from the two PDF exports, the glyph sprite their math draws from, and raster figures |
| `mathtype.tsv` | LaTeX for the raster equations in older items (keyed by image hash) |
| `overrides.json` | One multi-answer grid-in, and 15 spots where the PDF printed "Math output error" instead of the math (restored from the surrounding text) |
| `teach-math.json`, `teach-rw.json` | The teaching note for each pattern |

### Re-extracting from the PDFs

The PDFs are College Board question bank exports (Chrome prints run through Ghostscript). Body text is Type 3 fonts, math is MathJax output turned into vector paths, and figures are vector drawings, so `scripts/extract/` interprets each page's content stream directly instead of using text extraction. Math is kept as the exact glyph outlines (deduplicated into one sprite) and laid out inline at the right baseline, so it looks the same as in the College Board's rendering.

```bash
pip install pypdf fonttools pillow
python scripts/extract/interpret_all.py SAT_Math.pdf SAT_RW.pdf /tmp/sat-cache
python scripts/extract/layout.py /tmp/sat-cache data/taxonomy.txt /tmp/sat-out
cp /tmp/sat-out/questions.json /tmp/sat-out/glyphs.svg data/extracted/
rm -rf data/extracted/img && cp -r /tmp/sat-out/img data/extracted/img
```

`layout.py` writes `report.txt` with a line per question and any warnings (missing sections, untranscribed images, stray pieces). `preview.py` renders extracted questions to a plain HTML page for checking against the PDF.

## Checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```
