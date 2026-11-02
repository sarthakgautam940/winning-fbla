# STATE

Read this first after any compaction or "continue". Then reread `docs/PROMPT.md` (the request), `content/curriculum.yaml` (structure), `docs/style-guide.md`, `docs/question-standard.md`, and `docs/agent-brief.md`.

## Goal

A production web app (Next.js 16, deploy on Vercel) that takes Ashwath from beginner to national-championship level for the FBLA Data Science & AI event (2026-2027): lessons with embedded checks, lesson quizzes, unit tests, five real-format practice tests (100 questions, 50 minutes), a skill-grid question bank, flashcards, mistakes and saved review, analytics, and a planner aimed at competition dates. Access gate: dark "Hello there." screen, code 9409049 only, remembers the device. Push to github.com/sarthakgautam940/winning-fbla (main).

## Locked decisions

- Stack: Next.js 16.4 App Router + React 19.3 + TypeScript 5.9 + Tailwind 4 (turbopack loader). `cacheComponents` off. Auth via `src/proxy.ts` (Next 16 renamed middleware to proxy) with an HMAC-signed httpOnly cookie, 400-day expiry; code checked server-side against a SHA-256 hash.
- Progress lives client-side (localStorage, versioned document of attempts/sessions/etc.), optional cloud sync later if KV env vars exist.
- Content is data: `content/curriculum.yaml` (9 units u0-u8, 64 lessons, 174 skills), lessons in `content/lessons/<lesson>.md`, bank questions in `content/questions/<unit>/<lesson>.yaml`, flashcards in `content/flashcards/<lesson>.yaml`, unit tests in `content/questions/unit-tests/<unit>.yaml`, practice-test items in `content/questions/tests/<AREA>.yaml` with `test: 1..5`.
- `scripts/build-content.ts` validates and renders everything to `src/generated/` (gitignored; runs on predev/prebuild). `scripts/verify.py` (venv at scripts/.venv: numpy 2.5, pandas 3.1, scipy) executes verify snippets and runnable lesson code.
- Markdown: remark-directive callouts (key, tip, trap), ::::example with :::step, ::check, ::widget, :::takeaways; math with `$$` only (single `$` is money); ```figure YAML specs; ```python run + ```output and ```sql run db=school + table are executed by the verifier.
- Tiers: core / competitive / champion. Question types: recall, concept, scenario, calculation, code, sql, visual.
- 14 widgets (names fixed in scripts/lib/schemas.ts WIDGETS).
- Fonts: not IBM Plex, not Times-like. House style: no em dashes, no middots, banned phrase list in scripts/lib/style.ts.

## Done

- Read both PDFs in full (guidelines 5 pp; Virginia guide 42 pp: 100 MCQ, 100 open questions, 120 vocab entries / 119 unique, study checklist).
- Project scaffolded, deps installed, git initialized with remote.
- docs/PROMPT.md, docs/style-guide.md, docs/question-standard.md, docs/agent-brief.md.
- content/curriculum.yaml (blueprint; all 44 objectives and all Virginia terms mapped).
- Content pipeline + validators + verifier, tested.
- Pilot lesson u2-l3 (variance and standard deviation) with 23 questions and 9 flashcards: 0 errors, verifier 14/14 OK.

## User instruction (2026-11-01, mid-build)

"Please no more using subagents." Do not launch any new agents. Agents already running when this arrived (8 wave-1 writers for u1-u4, 1 fact checker) are allowed to finish; do not send them extra scope. Everything else is written directly: u0, u4-l9, u5, u6, u7 (incl. new u7-l8), u8, unit tests, practice tests, cold solve, fixes to wave-1 output.

## Research results (done)

- research/event.md: NLC 2027 Columbus, Ohio, June 23-26 (confirmed). Virginia SLC 2027 unpublished, likely early-mid April (2026: Apr 10-11, Reston). Virginia regionals ~mid-Feb to mid-Mar, test at school, top 3 per region advance. Platform: Blue Panda E-Testing (bpet.gobluepanda.com; sample test login "sample"/"sample"/"sample"). Calculator: practice with a basic four-function one. FBLA "flag" = challenge sent to a review team with an optional comment, not a bookmark; no confirmed review screen. MBA Research writes FBLA objective tests; FBLA says tests are rigorous and reward application over memorization.
- research/scope.md: reference-by-reference scope. Curriculum expanded from it: IBM (Rollins) 10-stage methodology, floating point, u4-l9 toolkit lesson (python-core, dev-tools), AI types by functionality, NLP ambiguity/text features, agentic AI, perception/sensors/agents, syllogisms, u7-l8 search lesson (search-basics, reasoning-types), ethics criteria, IP, GLBA, adversarial examples.
- research/facts.md: still being written by the fact checker.

## In progress

- Wave 1 lesson writers (u1-u4), already running.
- App build (me).

## Next

1. Build the app: design tokens, gate, shell, lesson reader, question component, figures, widgets, quizzes, tests, review, analytics, planner, flashcards, reference.
2. Write u5, u6, u7, u8, u4-l9, u0 directly. Add IBM methodology and floating point to u1 files if wave 1 missed them.
3. Unit tests (8 x 25) and practice tests (5 x 100) directly; cold-solve and verify; QA; push.

## Open issues

- R cannot be executed locally: R snippets are checked by reasoning only.
