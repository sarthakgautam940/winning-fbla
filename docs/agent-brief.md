# Brief for lesson writers

You are writing part of the curriculum for a personal study web app that prepares one student, Ashwath, for the FBLA **Data Science & AI** event (2026-2027). The goal is first place at the National Leadership Conference. The test is 100 multiple-choice questions in 50 minutes across eight areas; no notes, an online calculator, one sheet of scratch paper.

The bar is the best test-prep writing that exists (The College Panda, Erica Meltzer): plain, exact teaching; real strategy; many excellent practice questions; nothing padded, nothing wrong. A beginner must be able to start at the first lesson, and a strong student must still be stretched to national level. Correctness matters more than anything: a wrong key or wrong fact teaches the wrong thing to someone who trusts the app.

The project is at `C:\Users\122125\Desktop\Winning FBLA` (Windows; use PowerShell or Bash). Today is 2026-11-01.

## Read first, fully

1. `docs/style-guide.md`: how lessons are written and the markdown building blocks.
2. `docs/question-standard.md`: how questions are written, the YAML schema, verification snippets, counts.
3. `content/curriculum.yaml`: find your lessons (title, summary, skills, objectives, vocab, outline, notes, widgets) and your skills (name, objectives, patterns).
4. The exemplar, which shows the bar: `content/lessons/u2-l3.md`, `content/questions/u2/u2-l3.yaml`, `content/flashcards/u2-l3.yaml`.
5. If you write SQL: `scripts/verify/datasets.py` (the course's `school` and `shop` sample databases).
6. If they exist: `research/facts.md` (verified facts) and `research/scope.md` (what the official references cover).

## What you produce for each assigned lesson

1. `content/lessons/<lesson-id>.md`: the lesson, following its outline in the curriculum.
2. `content/questions/<unit>/<lesson-id>.yaml`: every question for that lesson's skills:
   - `use: check`: 4 to 8, at least one per skill, each placed once in the lesson with `::check{id="..."}` right after the section it locks in.
   - `use: quiz`: 8 to 12, across all the lesson's skills, roughly 30% core, 45% competitive, 25% champion.
   - `use: bank`: as many as needed so every skill has at least 6 questions (7 to 9 for skills that are calculated or heavily tested), with at least 1 core, 2 competitive, and (where the skill has champion-level patterns) 1 champion.
   - Cover every pattern listed for each skill.
   - Balance letters across the file: each letter correct 20 to 30% of the time, never more than three in a row in file order.
3. `content/flashcards/<lesson-id>.yaml`: one card for every Virginia vocabulary term listed in the lesson's `vocab` (set `virginia: true` and spell `term` exactly as in the curriculum), plus 5 to 12 more cards for the other key terms, formulas, and distinctions in the lesson. Schema:

```yaml
- id: fc-<short-slug>        # unique across the app; prefix fc-
  term: Mean                 # the front of the card
  def: The sum of the values divided by how many there are; the balance point of the data.
  example: "The mean of 2, 4, 9 is 15 / 3 = 5."   # optional
  skill: mean                # the skill this card belongs to
  virginia: true             # only for Virginia vocabulary terms
```

Definitions are one or two sentences, exact, and match how the lesson teaches the term.

## Checking your work (required)

Run these from the project folder, with your lesson ids, until both are clean:

```
npm run content:check -- --only u3-l1,u3-l2
scripts\.venv\Scripts\python.exe scripts\verify.py --only u3-l1,u3-l2
```

The first validates schemas, references, house style, balance, counts, near-duplicates, and math rendering. The second executes every `verify` snippet and every `run` code block and compares with your keys and shown outputs. Fix every error. Treat warnings about your own files as defects to fix, except warnings that are only about other people's files.

Then do the cold check: for each question you wrote, reread only the stem and options, solve it, and confirm the key. Any question an expert could argue has two defensible answers must be rewritten.

## Rules

- Write only your assigned files (plus `research/facts-<your first lesson id>.md` if you verify new facts). Do not edit `content/curriculum.yaml`, the docs, scripts, or anyone else's files. Do not run git, `npm run dev`, or `npm run build`.
- If you think the curriculum outline has a gap or an error, teach the right thing anyway and mention it in your final report.
- Facts about the real world (dates, people, cases, laws, statistics, attributed definitions) must come from `research/facts.md` or be verified by you from a primary source with WebSearch and WebFetch. Log anything you verify yourself in `research/facts-<your first lesson id>.md` (claim, source URL, accessed 2026-11-01). If you cannot verify something, leave it out.
- Keep within scope: everything the test could plausibly ask, taught to the depth the hardest real question needs. No filler, no exotic material that could never appear on a 30-second multiple-choice question.
- Every question original. Never copy or lightly reword questions from the Virginia study guide, FBLA materials, textbooks, or websites.
- Number formatting in options: consistent decimals within a question; ascending order for numeric options with `ordered: true`.

## Final report

When everything passes, reply with:
- the files you wrote;
- for each skill: total questions and the core/competitive/champion split;
- word count per lesson (from the check output or your estimate);
- any facts you could not verify and left out;
- any curriculum issues you noticed.
