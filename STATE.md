# STATE

Read this first after any compaction or "continue". Then reread `docs/style-guide.md`, `docs/question-standard.md`, and the lesson's entry in `content/curriculum.yaml` before writing. `docs/PROMPT.md` is the full original request.

## Goal

A production web app (Next.js 16, Vercel) that takes Ashwath from beginner to national-championship level for FBLA Data Science & AI (2026-2027): lessons with embedded checks, lesson quizzes, unit tests, five real-format practice tests (100 questions, 50 minutes), skill-grid question bank, flashcards, mistakes and saved review, analytics, planner aimed at competition dates. Gate: dark "Hello there." screen, code 9409049 only, device remembered. Push to github.com/sarthakgautam940/winning-fbla (main).

## User instructions that override defaults

- No subagents. Write everything directly (user, 2026-11-01). All earlier agents are stopped; none left output except research files.
- The gate animation is final as the user approved it (typewriter, caret pre-aligned so nothing shifts when it disappears). Do not restyle it.
- No IBM Plex, no Times-like fonts, no em dashes, no middots, no AI tells. Very high bar; no placeholders.

## App status (built, committed)

Gate + proxy auth, design tokens (Figtree, JetBrains Mono), app shell, lesson reader (callouts, worked examples, checks, figures, code, widgets, outline rail), question card, 18 figure types, 14 widgets, exam runner (timer, map, marks, FBLA-style flag with comment, basic calculator, resume), report, practice runner, pages: home, learn, unit, lesson, quiz, unit test, practice (skill grid, drills, lesson practice), tests hub + runner, report, flashcards, review, progress, plan, reference (event, formulas, glossary, objectives, databases, sources), settings, not-found. Analytics and planner libs. Types and lint were clean at commit f0b8bd6.

## Content workflow (per lesson)

1. Read the lesson entry (outline, skills, patterns, vocab, widgets, notes) in curriculum.yaml.
2. Write `content/lessons/<id>.md`, `content/questions/<unit>/<id>.yaml`, `content/flashcards/<id>.yaml`.
3. `npx tsx scripts/build-content.ts --check --only <id>` then `scripts\.venv\Scripts\python.exe scripts\verify.py --only <id>`. Fix to 0 errors and 0 warnings.
4. Per lesson: 4-8 checks placed in the lesson, 8-12 quiz (about 30/45/25 core/competitive/champion), bank so every skill has 6+ (1+ core, 2+ competitive, 1 champion). Letters 20-30% each per file, never 4 in a row. Correct option must not be much longer than the others (validator warns at 1.6x).
5. Verified facts: research/facts.md (262 claims; use VERIFIED/CORRECTED rows only), research/event.md, research/scope.md.

## Content progress

| Unit | Lessons | Bank questions | Flashcards | Status |
|---|---|---|---|---|
| u0 | l1-l3 | none (no skills) | none | done |
| u1 (DL) | l1-l8 | 222 | 121 | done, all lessons 0 errors 0 warnings, verified |
| u2 (PS) | l1-l8 | 209 | 79 | done, all lessons 0 errors 0 warnings, verified |
| u3 (DA) | l1-l8 | 194 | 69 | done, all lessons 0 errors 0 warnings, verified |
| u4 (TL) | l1-l9 | 213 | 81 | done, all lessons 0 errors 0 warnings, verified (SQL against the sample DBs, Python by execution, R by reasoning) |
| u5 (ML) | l1-l10 | 221 | 83 | done, all lessons 0 errors 0 warnings, verified |
| u6-u8 | | | | to do, in order u6-l1 onward |

Full `--check` (no filter) at fb5427c: 0 errors, 1 warning (Virginia cards for terms in later units, expected until those units exist).

Conventions settled while writing (keep them): options length-matched as you draft (the validator warns when the correct option is over 1.6x the others); numeric options ascending with `ordered: true`; prose avoids negative signs ("an expected loss of $2"); multiplication sign Ã— in prose; real-world cases only from research/facts.md, otherwise clearly hypothetical examples.

Order of work: u1-l2 ... u1-l8, u2 (l1, l2, l4-l8), u3, u4 (incl. l9), u5, u6, u7 (incl. l8), u8. Then unit tests (`content/questions/unit-tests/u1..u8.yaml`, 25 each) and practice-test items (`content/questions/tests/<AREA>.yaml`, `test: 1..5`; per test DL 20, PS 15, DA 15, TL 10, AI 10, ML 10, PR 10, PE 10; tests 1-4 about 35/45/20 tiers, test 5 about 20/45/35; every objective in every test). Then strict check (`--strict`), cold solve, visual QA, push.

## Open issues

- R cannot be executed locally; R snippets are checked by reasoning only.
- Visual QA to-do: the neuron-playground widget hint (src/components/widgets/ml-widgets.tsx) writes "w1·x1" with a middot; change to the × sign during the QA pass and scan src for any other middots.
- Facts not yet verified, so not used: Minsky and Papert's 1969 book Perceptrons (verify before citing it in u6-l1 history).
- Flashcard ids already taken that later units must not reuse: fc-gan, fc-autoencoder, fc-cnn, fc-rnn, fc-lstm (u5-l10), fc-training-loop (u4-l7).
