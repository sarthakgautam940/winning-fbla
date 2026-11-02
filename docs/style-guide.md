# Lesson style guide

This guide governs every lesson in `content/lessons/`. Read it fully before writing. The exemplar lesson `content/lessons/u2-l3.md` and its questions in `content/questions/u2/u2-l3.yaml` show the standard in practice.

## 1. Who you are writing for

One high school student, studying alone, possibly a complete beginner, aiming to win first place at the FBLA National Leadership Conference. The test is 100 multiple-choice questions in 50 minutes, so the student must recognize terms instantly, calculate small things fast, read short SQL and Python at a glance, and avoid the traps distractors are built from.

Every paragraph must raise that student's score. Teach to mastery: explain, show, practice, and connect to what the test asks. Cover everything the test could ask, at the depth the hardest real question would need, and stop there. Do not pile on material that cannot appear on a 30-second multiple-choice question.

## 2. Voice

- A clear, confident teacher talking to one student. Second person ("you"), active voice, present tense.
- Short paragraphs (two to five sentences), one idea each.
- Concrete before abstract: give an example first, then the general rule or formula.
- Define every term the first time it appears, in **bold**. A beginner must never meet an undefined term.
- Exact numbers and every step of every calculation. Never "after some algebra".
- Warm but not chatty. No jokes that cost clarity, no hype, no emoji, no exclamation marks in teaching text.
- Not academic: no passive voice walls, no unexplained notation. Math appears where it helps and is always explained in words.

## 3. House style (enforced by `npm run content:check`)

- No em dashes (the long dash). Use commas, colons, parentheses, or two sentences.
- En dashes only between numbers in a range (for example 68–95–99.7 is fine; a dash between words is not). When unsure, write "to".
- No middots or bullets used as separators inside sentences.
- Banned words and patterns: delve, dive into, deep dive, in today's fast-paced world, it's important to note, unleash, unlock (as hype), supercharge, seamless, robust, empower, leverage (as a verb), game-changer, "not just X but Y", "not only X but also Y" as a flourish, and reflexive groups of three adjectives.
- Write numbers with digits for anything you compute. Use a comma in thousands (16,777,216).
- Use the minus sign carefully: in prose write "negative 3" or use a hyphen-minus inside math (`$$-3$$`).
- Money: write `$5` normally. Single dollar signs are plain text in this project.
- Spell out abbreviations on first use in each lesson: natural language processing (NLP).

## 4. Lesson file format

One file per lesson: `content/lessons/<lesson-id>.md`, for example `content/lessons/u1-l4.md`. The lesson id, title, skills, and outline come from `content/curriculum.yaml`. Follow the outline's section list and order; you may rename a section slightly for clarity and you may add a section if the material needs it, but every outline item must be taught.

```md
---
id: u2-l3
title: Variance and standard deviation
---

Opening: two to four sentences on why this matters and how the test asks about it.

## Deviations from the mean

Teaching text...

::check{id="variance-sd-01"}

## Population versus sample [Competitive]
...
```

### Frontmatter
Only `id` and `title`. Everything else lives in the curriculum.

### Sections and tiers
- Each `##` heading is one section. Use `###` for sub-steps inside a section if needed; never deeper.
- Mark the tier at the end of the heading in square brackets: `[Competitive]` or `[Champion]`. No marker means Core.
  - **Core**: what every competitor must know.
  - **Competitive**: what separates state finalists: precise distinctions, standard calculations, edge cases.
  - **Champion**: what decides national rankings and tiebreakers: subtle distinctions and multi-step problems.
- Order sections so a beginner can follow them top to bottom.

### Length and shape
- 1,400 to 2,800 words of teaching text per lesson (not counting questions). Heavier lessons may go longer if every paragraph earns its place.
- Each section ends with 1 or 2 embedded checks (`::check`). A lesson has 4 to 8 checks in total.
- At least one worked example in every lesson with any calculation or procedure. Computational lessons need two or three.
- End every lesson with a `:::takeaways` block (5 to 9 bullets): the facts, formulas and distinctions to remember. These are what the student rereads the night before.

## 5. Building blocks

Use these and nothing else. Do not write raw HTML.

### Callouts (four kinds)

```md
:::key
**Key idea.** The single most important sentence or two of the section.
:::

:::tip
**Test tip.** How this shows up on the test and how to answer it fast.
:::

:::trap
**Common trap.** The mistake a distractor is built from, and how to avoid it.
:::
```

Use callouts sparingly: about one per section at most. A callout must say something specific; never "remember this is important".

### Worked examples with revealable steps

```md
::::example[Sample standard deviation]
Find the sample standard deviation of 2, 4, 4, 5, 10.

:::step
Find the mean. The sum is 25 and there are 5 values, so the mean is 25 / 5 = 5.
:::

:::step
Square each deviation: 9, 1, 1, 0, 25. They sum to 36.
:::

:::step
Divide by n minus 1 = 4 to get the sample variance 9. The square root is 3.
:::

:::answer
The sample standard deviation is 3.
:::
::::
```

The student sees the problem, tries it, and reveals one step at a time. Each step is one move, stated plainly, with the arithmetic shown. The outer fence uses four colons; inner blocks use three.

### Embedded checks

`::check{id="variance-sd-03"}` places a question from the bank (with `use: check`) at that spot. Every check id must exist in your lesson's question file, and every `use: check` question must be placed exactly once, in the lesson that owns its skill.

### Takeaways

```md
:::takeaways
- Variance is the average squared deviation; standard deviation is its square root.
- Divide by N for a population and by n - 1 for a sample.
:::
```

### Math

- Inline math uses double dollar signs inside a sentence: the mean is `$$\bar{x} = \frac{\sum x}{n}$$`.
- Display math goes on its own lines:

```md
$$
s = \sqrt{\frac{\sum (x - \bar{x})^2}{n - 1}}
$$
```

- Single dollar signs are plain text (money), so `$5` is safe.
- After any formula, say in words what it means.
- Inside a table cell, write a vertical bar in math as `\mid` and in text as `\|`.

### Code

Use fenced blocks with a language: `python`, `sql`, `r`, `json`, `text`, `bash`.

- Keep listings short (usually under 15 lines) and readable at a glance.
- If you show output for Python, mark the code block `run` and put the exact output in an `output` block right after it. The verifier executes the code and compares.

````md
```python run
import numpy as np
print(np.array([1, 2]) + np.array([3, 4]))
```

```output
[4 6]
```
````

- If you show a SQL result, mark the block `run db=school` (or `db=shop`) and put the result as a markdown table right after it. The verifier runs the query against the course's sample database and compares cell by cell. Use `NULL` for a null cell. Sample databases are defined in `scripts/verify/datasets.py` and shown to the student on the Reference page; read that file before writing SQL.

````md
```sql run db=school
SELECT name, gpa FROM students WHERE gpa >= 3.8 ORDER BY name;
```

| name | gpa |
|---|---|
| Chloe | 3.9 |
| Elena | 3.8 |
| Hiro | 3.9 |
````

- R cannot be executed in this build. Keep R snippets simple, standard, and triple-check them by reasoning. Never show R output you are not certain of.
- Monospace is only for code and inline code (backticks for identifiers such as `df.head()`), never for emphasis.

### Figures

Figures are drawn by the app from a spec. Put a fenced block with language `figure` containing YAML. Every figure needs a `caption` that says what to notice. Use real computed numbers.

````md
```figure
type: histogram
caption: Right-skewed incomes. The long tail on the right pulls the mean above the median.
xLabel: Income (thousands of dollars)
yLabel: Households
bins:
  - { from: 20, to: 40, count: 12 }
  - { from: 40, to: 60, count: 9 }
```
````

Available figure types and their fields (all optional unless marked required):

| type | required fields | optional fields |
|---|---|---|
| histogram | bins (from, to, count), xLabel | yLabel |
| bar | categories, series (name?, values) | xLabel, yLabel, horizontal, stacked |
| line | series (name?, points [[x, y], ...]), xLabel, yLabel | yMin, yMax |
| scatter | series (name?, points [[x, y], ...]), xLabel, yLabel | line (slope, intercept, label?), centroids [[x, y]], highlight [[x, y]] |
| boxplot | groups (label, min, q1, median, q3, max, outliers?), axisLabel | |
| dotplot | values, xLabel | |
| normal | (none) | mean, sd, axis (`sd`, `z`, or `values`), shade [{from, to}] with null for open ends, marks [numbers] |
| curve | fn (sigmoid, relu, leaky-relu, tanh, step, linear, parabola, exp, log), xRange [min, max] | yRange, xLabel, yLabel, marks [{x, label}], hline |
| tree | root: {label, edge?, children?} (leaves have no children) | |
| network | layers [counts] | labels [names per layer] |
| graph | nodes [{id, label, x, y}] on a 0 to 100 grid, edges [{from, to, label?}] | directed (default true) |
| flow | steps [labels] | cycle (true draws a loop) |
| confusion | tp, fp, fn, tn | positive, negative (class names) |
| venn | sets [{label}] (2 or 3) | center (label for the overlap) |
| nested | layers [outer to inner labels] | |
| pyramid | levels [top to bottom labels] | |
| pie | slices [{label, value}] | |
| pixels | grid [[0 to 255 values]] | |

Tables are plain markdown tables, not figures.

### Interactive widgets

Some lessons have a widget listed in the curriculum. Place it with a leaf directive and introduce it with one sentence saying what to try:

```md
Try it: change one value and watch the mean move while the median stays put.

::widget{name="stats-explorer"}
```

Allowed names: `base-converter`, `stats-explorer`, `normal-explorer`, `bayes-explorer`, `kmeans-stepper`, `threshold-explorer`, `query-order`, `join-explorer`, `overfit-explorer`, `gradient-descent`, `split-calculator`, `neuron-playground`, `temperature-explorer`, `bayesnet-calculator`. Use only the widgets your lesson lists.

### Links between lessons

`[see lesson 2.3](lesson:u2-l3)` links to another lesson. Use sparingly, for real prerequisites.

## 6. How each concept is taught

For every concept, in this order:
1. Why it matters and how the test asks about it (one or two sentences, often in the section intro).
2. Plain explanation with a concrete example; define terms in bold.
3. The precise definition or formula, then a worked example in steps when there is a procedure.
4. The common trap (what distractors exploit).
5. A check question.

Interleave earlier ideas where natural (for example, use z-scores when discussing standardization).

## 7. Facts and sources

- Dates, names, cases, laws, statistics about the real world, and attributed definitions must come from `research/facts.md`. If a fact you need is not there, either verify it yourself from a primary source (and add a row to `research/facts-extra.md` with the URL and date accessed) or leave it out.
- Write time-sensitive facts so they stay true ("as of 2026", "the EU AI Act, which entered into force in August 2024"), and avoid version numbers and product names that date quickly.
- Where standard sources define a term differently, teach the most common definition and mention the variant in one sentence.

## 8. Checklist before you finish a lesson

- [ ] Every outline item from the curriculum is taught.
- [ ] Every Virginia vocabulary term listed for the lesson (`vocab`) appears in bold where it is defined.
- [ ] Every skill of the lesson has teaching text and at least one check.
- [ ] Worked examples have correct arithmetic, shown step by step.
- [ ] No banned words, no em dashes, no raw HTML.
- [ ] `npm run content:check` reports no errors for your files, and `python scripts/verify.py` passes.
