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
| u6 (AI) | l1-l6 | 177 | 77 | done, all lessons 0 errors 0 warnings, verified (3 AI3 questions added to u6-l3) |
| u7 (PR) | l1-l8 | 200 | 71 | done, all lessons 0 errors 0 warnings, verified (truth tables, chaining, Bayes, BN joints, search orders by execution) |
| u8 (PE) | l1-l7 | 200 | 98 | done, all lessons 0 errors 0 warnings, verified (fairness rates, k, epsilon budget, SHAP sums by execution) |

All 67 lessons written. Full `--check` (no filter) after u8-l7: 0 errors, 0 warnings (1,636 bank questions, 669 flashcards; every Virginia term has a card). Full `verify.py`: 419 items, 0 problems.

Distractor audit (2026-11-02): found joke or invented distractors in u6-l6 (genai-limits-04/06/07/13, llm-capabilities-08/11/12), u6-l4 (llm-definition-03) and u3-l3 (causation-05); all replaced with real misconceptions. A keyword scan of every bank option found no others; the final QA pass still skims options during the cold solve.

Conventions settled while writing (keep them): options length-matched as you draft (the validator warns when the correct option is over 1.6x the others); numeric options ascending with `ordered: true`; prose avoids negative signs ("an expected loss of $2"); multiplication sign Ãƒâ€” in prose; real-world cases only from research/facts.md, otherwise clearly hypothetical examples.

Order of work: u1-l2 ... u1-l8, u2 (l1, l2, l4-l8), u3, u4 (incl. l9), u5, u6, u7 (incl. l8), u8. Then unit tests (`content/questions/unit-tests/u1..u8.yaml`, 25 each) and practice-test items (`content/questions/tests/<AREA>.yaml`, `test: 1..5`; per test DL 20, PS 15, DA 15, TL 10, AI 10, ML 10, PR 10, PE 10; tests 1-4 about 35/45/20 tiers, test 5 about 20/45/35; every objective in every test). Then strict check (`--strict`), cold solve, visual QA, push.

## Test authoring plan (unit tests, then practice tests)

Unit tests: `content/questions/unit-tests/u1.yaml` ... `u8.yaml` (u0 has no skills, so no test). 20 to 30 questions each (targets: u1 30, u2 30, u3 28, u4 28, u5 28, u6 26, u7 26, u8 26). IDs `ut<unit>-<nn>` (ut1-01). No `use`, no `test`. Only that unit's skills. Tier mix about 30/45/25. Letters 20 to 30 percent each, no run of 4 (strict). A stem 0.85 or more similar to any bank stem is an error, so write fresh scenarios and numbers. Progress: u1 (30), u2 (30), u3 (28), u4 (28) done, 0 errors, all computed keys verified.

Practice tests: `content/questions/tests/<AREA>.yaml` (DL, PS, DA, TL, AI, ML, PR, PE). Each item has `test: n` and an explicit `objective`. IDs `pt<n>-<area>-<nn>` (pt1-dl-01). Per test: DL 20, PS 15, DA 15, TL 10, AI 10, ML 10, PR 10, PE 10, and every one of the 44 objectives at least once. The builder shuffles each test (no run of 4 letters or areas) and checks letter balance over the assembled 100.
- Objective quotas per test: DL1 3, DL2 2, DL3 3, DL4 4, DL5 3, DL6 3, DL7 2; PS1 4, PS2 3, PS3 3, PS4 3, PS5 2; DA1 2, DA2 3, DA3 3, DA4 2, DA5 2, DA6 3; TL1 4, TL2 2, TL3 2, TL4 1, TL5 1; AI1 2, AI2 2, AI3 1, AI4 2, AI5 1, AI6 2; ML1 1, ML2 2, ML3 3, ML4 2, ML5 1, ML6 1; PR1 to PR5 2 each; PE1 3, PE2 3, PE3 2, PE4 2.
- Tier quotas (core/competitive/champion) per area, tests 1 to 4: DL 7/9/4, PS 5/7/3, DA 5/7/3, TL 4/4/2, AI 4/4/2, ML 3/5/2, PR 3/5/2, PE 4/4/2 (= 35/45/20). Test 5: DL 4/9/7, PS 3/7/5, DA 3/7/5, TL 2/5/3, AI 2/4/4, ML 2/4/4, PR 2/4/4, PE 2/5/3 (= 20/45/35). Builder targets: tests 1 to 4 core 30 to 40, competitive 40 to 50, champion 15 to 25; test 5 core 15 to 25, competitive 40 to 50, champion 30 to 40.
- Progress: none yet.

## Open issues

- R cannot be executed locally; R snippets are checked by reasoning only.
- Visual QA to-do: the neuron-playground widget hint (src/components/widgets/ml-widgets.tsx) writes "w1Â·x1" with a middot; change to the Ã— sign during the QA pass and scan src for any other middots.
- Pronoun rule (done and scanned for u0-u8): no he/his/him/she/her for real or example people; use names, "the student," or they/them. Rescan with a regex before release.
- House-style ban on "robust" also catches "robustness": the EU HLEG wording ("lawful, ethical and robust", "technical robustness and safety") is paraphrased as "technically and socially sound" and "technical reliability and safety".
- Add every research/facts-extra.md source to content/reference/sources.md (rows added since the last sources update: PubMed AlphaGo, Cornell Chronicle 2019, arXiv 2108.07258, copyright.gov/ai, govinfo FR 2023-05321, W3C RDF/SPARQL/OWL, schema.org, Google KG blog, Scientific American 2001, AAAI R1, MYCIN ch. 5, Crossref Zadeh and Pearl, Wikipedia Pearl, AI4People (PMC6404626), USPTO trademark-patent-copyright, USPTO patent essentials, USPTO trade secret policy, copyright.gov FAQ, AlphaFold DB, NIST AI 600-1 PDF, Suresh and Guttag (arXiv 1901.10002), Ensign et al. (PMLR 81), 29 CFR 1607.4 (LII), AIF360 (arXiv 1810.01943), Hardt et al. (arXiv 1610.02413), OWASP LLM01/LLM04/LLM05/LLM06/LLM09 pages, Greshake et al. (arXiv 2302.12173), Goodfellow et al. (arXiv 1412.6572), Carlini et al. (arXiv 2302.10149), NIST CSRC glossary, Shokri et al. (arXiv 1610.05820), Fredrikson et al. (CMU PDF), gdpr-info.eu Art. 4, Recital 26, Chapter 3, Art. 33, Kalai et al. (arXiv 2509.04664), EU AI Act Art. 14, cor.inquirygroup.org lateral reading, Wikipedia Disinformation, FTC GLBA, EC HLEG guidelines, NYC DCWP Local Law 144, NIST AIRC RMF sections 3 and 5).
