# Question standard

Every question in the app follows this standard. Questions are data: they live in YAML files and the app renders them, so a key can never disagree with its question. Read this fully before writing. The exemplar questions in `content/questions/u2/u2-l3.yaml` (skills `variance-sd`, `sd-props`, `coef-var`) show the standard in practice.

## 1. What a great question is

Writing one good test question is careful work. A national-level question:
- tests one specific, important idea from a skill's pattern list;
- has one answer that an expert would defend without hesitation;
- has three wrong answers that real students actually choose, each built from a specific mistake;
- can be answered by a prepared student in under 30 seconds (Champion questions may take up to about 60);
- reads cleanly, with no clues in grammar, length, or wording that give the answer away.

Never copy or lightly reword a question from the Virginia study guide, FBLA materials, textbooks, or websites. Write original questions. Do not write the same fact twice with the same framing.

## 2. Format rules

- A short stem and exactly four options. Exactly one option is correct.
- Options are parallel in grammar and similar in length. The correct option must not be noticeably longer or more qualified than the others.
- Numeric options go in ascending order and you set `ordered: true`.
- Use NOT or EXCEPT in capitals when a stem asks for the exception, and use them rarely (at most about 1 in 15 questions).
- Avoid "all of the above" and "none of the above" (at most one per unit, only when it is genuinely the best design).
- Avoid "always" and "never" in options unless the statement is truly absolute.
- Units and context in the stem: "in thousands of dollars", "rounded to the nearest tenth".
- If a calculation is needed, the numbers should be friendly enough to do with the online calculator or scratch paper in the time available.
- Code in stems uses fenced code blocks. SQL keywords in uppercase. Python follows common pandas and NumPy style.
- Tables use markdown tables. Figures use the `figure` field (see the style guide for figure specs).

## 3. Distractors

Each wrong option is a specific mistake a real student makes. Examples by topic:
- Statistics: dividing by n instead of n − 1; taking the middle of an unsorted list; forgetting to square or to take the square root; confusing variance with standard deviation; using the mean when the median was asked.
- Probability: adding when you should multiply; ignoring the base rate; confusing P(A | B) with P(B | A); treating mutually exclusive as independent.
- Number systems: reading bits in the wrong order; treating hex digit B as 12; off-by-one on 2^n − 1.
- SQL: reading a LEFT JOIN as an INNER JOIN; WHERE instead of HAVING; forgetting that COUNT(column) skips NULL; BETWEEN as exclusive.
- Metrics: swapping precision and recall; using accuracy on imbalanced data.
- Logic: pairing a universal quantifier with "and"; affirming the consequent.
- Concepts: a true statement about a neighboring concept (for example, a correct description of unsupervised learning offered for a question about reinforcement learning).

No joke options, no options that are obviously wrong from their form, no options that are absurd ("to waste time").

## 4. Tiers

- **core**: direct recognition or a one-step calculation of something every competitor must know.
- **competitive**: a precise distinction, a two-step calculation, an applied scenario, or a standard trap.
- **champion**: a subtle distinction, a multi-step problem, or the deeper version of a topic that decides national rankings and tiebreakers. Hard because it demands real understanding, never because it is obscure, ambiguous, or out of scope.

Do not write questions that could not plausibly appear on this event's test.

## 5. Types

Every question has one `type`:
- `recall`: a definition, term, or fact.
- `concept`: understanding how or why; distinguishing related ideas.
- `scenario`: apply knowledge to a described situation (choose a method, identify a bias, pick a chart).
- `calculation`: compute a number.
- `code`: read or predict Python, pandas, NumPy, or R.
- `sql`: read, write, or predict SQL.
- `visual`: read a chart, diagram, or table (has a `figure` or a table in the stem).

Each skill should use a realistic mix of types for its content.

## 6. Explanations

- `explain`: two to four sentences on why the correct answer is right. Start with the reasoning, not "The answer is B". Show the arithmetic for calculations. Do not refer to options by letter.
- `why`: one sentence for each wrong option naming the specific mistake behind it ("This divides by n instead of n − 1."). Keys are exactly the three wrong letters.
- Plain, exact, encouraging, and short.

## 7. Balanced keys

- Across every set of 20 or more questions (a lesson's bank file, a unit test, a practice test), each letter is correct 20 to 30 percent of the time.
- Within a file, no letter is correct more than three times in a row in file order.
- Do not let a pattern form (such as numeric answers always in position B).

## 8. YAML schema

Bank questions live in one file per lesson, `content/questions/<unit>/<lesson>.yaml` (for example `content/questions/u1/u1-l4.yaml`), as a list. A lesson file holds only questions for that lesson's skills. Group them by skill in curriculum order.

```yaml
- id: variance-sd-01          # <skill-id>-<two digits>, unique across the app
  skill: variance-sd           # a skill id from content/curriculum.yaml
  tier: core                   # core | competitive | champion
  type: calculation            # recall | concept | scenario | calculation | code | sql | visual
  use: check                   # check (placed in the lesson) | quiz (lesson quiz) | bank (extra practice)
  objective: PS2               # optional; defaults to the skill's first objective
  stem: |
    The values 2, 4, 6 are an entire population. What is the population variance?
  options:
    - "$$\\frac{8}{3}$$"
    - "4"
    - "8"
    - "16"
  ordered: true                # set when options are numbers or sequences in ascending order
  answer: A
  explain: |
    The mean is 4, the squared deviations are 4, 0, 4, and they sum to 8. A population divides by N = 3, so the variance is 8/3, about 2.67.
  why:
    B: "This divides the sum of squares by n - 1 = 2, which is the sample variance."
    C: "This is the sum of squared deviations before dividing."
    D: "This squares the range instead of averaging squared deviations."
  verify: "statistics.pvariance([2, 4, 6])"
  time: 30                     # optional expected seconds; defaults by type and tier
```

Notes:
- YAML: quote strings that contain a colon followed by a space, or start with a special character (`*`, `&`, `!`, `%`, `@`, `` ` ``, `{`, `[`, `>`, `|`, `#`). Use `|` block scalars for multi-line text and for any text with code or math. Inside double-quoted strings, backslashes must be doubled (`"$$\\frac{8}{3}$$"`); inside `|` blocks they are literal (`$$\frac{8}{3}$$`).
- Inline math uses `$$...$$`. Single `$` is plain text.
- Markdown works in stems, options, and explanations (bold, inline code, code blocks, tables, math).

## 9. Verification snippets

Every `calculation` question, and every `sql` or `code` question whose answer is a computed value, carries `verify`: Python that computes the answer independently. The verifier (`python scripts/verify.py`) runs it and checks that the result matches the keyed option and no other option.

- A one-line expression, or a block that assigns `ans`.
- Available without imports: `math`, `statistics`, `Fraction`, `comb`, `perm`, `np` (NumPy), `pd` (pandas), plus helpers:
  - `sql(db, query)` returns the rows (list of tuples); `db` is `"school"`, `"shop"`, or a connection from `make_db(script)`.
  - `scalar(db, query)` returns the single value of a one-row, one-column result.
  - `make_db("CREATE TABLE ...; INSERT ...;")` builds a throwaway SQLite database for tables written in the stem.
  - `rows(db, query)` returns the number of result rows.
- The result is compared to option text: numbers are matched within the precision shown in the option (an option "3.08" matches 3.0822); percentages match either 25 or 0.25 for "25%"; strings are compared ignoring case, extra spaces, backticks, and `$$`.
- To check a non-numeric answer, return the exact correct option text: `ans = "LEFT JOIN"`.

```yaml
verify: |
  db = make_db("CREATE TABLE t(x INT); INSERT INTO t VALUES (1),(2),(NULL);")
  ans = scalar(db, "SELECT COUNT(x) FROM t")
```

## 10. Use, counts, and placement (bank files)

For each lesson:
- `check`: 4 to 8 questions, at least one per skill, placed in the lesson with `::check{id="..."}`. Mostly core and competitive. They teach as much as they test: after each section, they lock in the idea just taught.
- `quiz`: 8 to 12 questions across the lesson's skills, a mix of all three tiers (roughly 30 percent core, 45 percent competitive, 25 percent champion). This is the lesson's end quiz.
- `bank`: extra practice so every skill reaches its target count.

For each skill: at least 6 questions in total (target 7 to 9 for heavily tested skills), with at least one core, at least two competitive, and at least one champion when the skill has champion-level patterns. Cover every pattern listed for the skill in the curriculum, and every pattern should appear before a question of that pattern can appear on a test.

Unit tests (`content/questions/unit-tests/<unit>.yaml`) and practice tests (`content/questions/tests/<AREA>.yaml`) follow the same schema without `use`, plus `test: 1..5` for practice-test items. They must not reuse or closely paraphrase any bank question.

## 11. Checklist before you finish

- [ ] `npm run content:check` reports no errors.
- [ ] `python scripts/verify.py` reports no mismatches.
- [ ] Every skill meets its count and tier minimums and covers its patterns.
- [ ] Letters are balanced and no letter runs longer than three.
- [ ] You re-solved every question cold, from the stem alone, and got the key.
