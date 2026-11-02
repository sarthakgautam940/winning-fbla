/*
 * Builds and validates all course content.
 *
 *   npm run content              validate + write src/generated (fails on errors)
 *   npm run content:check        validate only, print the full report
 *   ... --unit u3                only print issues for unit u3's files
 *   ... --strict                 coverage targets become errors (final QA)
 */
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import type { Root as HRoot } from "hast";
import { curriculumSchema, questionSchema, flashcardSchema, VIRGINIA_TERMS, type QuestionSource, type CurriculumSource } from "./lib/schemas";
import { initHighlighter, newContext, renderToHast, renderToHtml, splitFrontmatter, type RunBlock } from "./lib/markdown";
import { scanStyle } from "./lib/style";
import { Issues } from "./lib/report";
import { similarity, normalizeStem } from "./lib/similarity";
import type {
  AreaId,
  Catalog,
  Flashcard,
  LessonInfo,
  Letter,
  PracticeTest,
  QMeta,
  QuestionContent,
  SkillInfo,
  TestQuestion,
  Tier,
  UnitInfo,
  UnitTest,
  QType,
} from "../src/lib/content-types";

const ROOT = path.resolve(__dirname, "..");
const CONTENT = path.join(ROOT, "content");
const OUT = path.join(ROOT, "src", "generated");
const TMP = path.join(ROOT, "tmp");

const args = process.argv.slice(2);
const CHECK_ONLY = args.includes("--check");
const STRICT = args.includes("--strict");
const argValue = (flag: string) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
};
// --only u3-l1,u3-l2 limits the printed report (and the verify file) to files
// whose path contains any of the tokens. --unit u3 is shorthand for --only u3.
const ONLY = (argValue("--only") ?? argValue("--unit") ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const matchesOnly = (file: string) => ONLY.length === 0 || ONLY.some((t) => file.includes(t));

const issues = new Issues();
const rel = (p: string) => path.relative(ROOT, p).replace(/\\/g, "/");
const LETTERS: Letter[] = ["A", "B", "C", "D"];
const TIER_RANK: Record<Tier, number> = { core: 0, competitive: 1, champion: 2 };
const BASE_TIME: Record<QType, number> = { recall: 15, concept: 25, scenario: 30, calculation: 45, code: 40, sql: 40, visual: 35 };
const TIER_MULT: Record<Tier, number> = { core: 1, competitive: 1.2, champion: 1.5 };

function defaultTime(type: QType, tier: Tier): number {
  return Math.round((BASE_TIME[type] * TIER_MULT[tier]) / 5) * 5;
}

function readYaml(file: string): unknown {
  const src = fs.readFileSync(file, "utf8");
  const doc = YAML.parseDocument(src, { prettyErrors: true });
  if (doc.errors.length) {
    for (const e of doc.errors) issues.error(rel(file), `line ${e.linePos?.[0]?.line ?? "?"}`, `YAML: ${e.message.split("\n")[0]}`);
    return null;
  }
  return doc.toJS();
}

function listYaml(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"))
    .sort()
    .map((f) => path.join(dir, f));
}

function strictOr(file: string, where: string, msg: string) {
  if (STRICT) issues.error(file, where, msg);
  else issues.warn(file, where, msg);
}

function letterBalance(letters: Letter[], file: string, label: string, enforceShare: boolean) {
  let run = 1;
  for (let i = 1; i < letters.length; i++) {
    run = letters[i] === letters[i - 1] ? run + 1 : 1;
    if (run === 4) issues.error(file, label, `answer ${letters[i]} is correct 4+ times in a row (ending at item ${i + 1})`);
  }
  if (!enforceShare || letters.length < 20) return;
  for (const L of LETTERS) {
    const share = letters.filter((x) => x === L).length / letters.length;
    if (share < 0.2 || share > 0.3) {
      issues.error(file, label, `answer ${L} is correct ${(share * 100).toFixed(0)}% of the time (allowed 20 to 30%)`);
    }
  }
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function parseNumber(s: string): number | null {
  const t = s.replace(/\$\$|\\,|,|\$|%|`|\*/g, "").trim();
  const frac = t.match(/^\\frac\{(-?\d+(?:\.\d+)?)\}\{(-?\d+(?:\.\d+)?)\}$/) ?? t.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  return null;
}

// ---------------------------------------------------------------- curriculum

function loadCurriculum() {
  const file = path.join(CONTENT, "curriculum.yaml");
  const raw = readYaml(file);
  const parsed = curriculumSchema.safeParse(raw);
  if (!parsed.success) {
    for (const e of parsed.error.issues.slice(0, 20)) issues.error(rel(file), e.path.join("."), e.message);
    throw new Error("curriculum.yaml is invalid");
  }
  return parsed.data;
}

interface Indexes {
  cur: CurriculumSource;
  areaOf: Record<string, AreaId>;
  objectiveArea: Record<string, AreaId>;
  lessonUnit: Record<string, string>;
  skills: Record<string, SkillInfo>;
  skillOrder: string[];
  unitArea: Record<string, AreaId | null>;
}

function buildIndexes(cur: CurriculumSource): Indexes {
  const file = "content/curriculum.yaml";
  const objectiveArea: Record<string, AreaId> = {};
  for (const a of cur.areas) for (const o of a.objectives) objectiveArea[o.id] = a.id;
  const skillDefs = new Map(cur.skills.map((s) => [s.id, s]));
  if (skillDefs.size !== cur.skills.length) issues.error(file, "skills", "duplicate skill ids");
  const lessonUnit: Record<string, string> = {};
  const unitArea: Record<string, AreaId | null> = {};
  const skills: Record<string, SkillInfo> = {};
  const skillOrder: string[] = [];
  let n = 0;
  for (const u of cur.units) {
    unitArea[u.id] = u.area;
    for (const l of u.lessons) {
      lessonUnit[l.id] = u.id;
      for (const o of l.objectives) if (!objectiveArea[o]) issues.error(file, l.id, `unknown objective ${o}`);
      for (const sid of l.skills) {
        const def = skillDefs.get(sid);
        if (!def) {
          issues.error(file, l.id, `lesson lists unknown skill "${sid}"`);
          continue;
        }
        if (skills[sid]) {
          issues.error(file, l.id, `skill "${sid}" is assigned to more than one lesson`);
          continue;
        }
        n += 1;
        for (const o of def.objectives) {
          if (!objectiveArea[o]) issues.error(file, sid, `unknown objective ${o}`);
        }
        skills[sid] = {
          id: sid,
          n,
          name: def.name,
          unit: u.id,
          lesson: l.id,
          area: u.area,
          objectives: def.objectives,
          patterns: def.patterns,
        };
        skillOrder.push(sid);
      }
    }
  }
  for (const s of cur.skills) if (!skills[s.id]) issues.error(file, s.id, "skill is not assigned to any lesson");
  const areaOf: Record<string, AreaId> = {};
  for (const sid of skillOrder) {
    const a = skills[sid].area;
    if (a) areaOf[sid] = a;
  }
  return { cur, areaOf, objectiveArea, lessonUnit, skills, skillOrder, unitArea };
}

// ---------------------------------------------------------------- questions

interface LoadedQuestion {
  src: QuestionSource;
  file: string;
  content: QuestionContent;
  objective: string;
  area: AreaId;
  time: number;
}

function renderQuestion(q: QuestionSource, file: string, ix: Indexes): QuestionContent {
  const where = q.id;
  const block = (text: string, field: string) => renderToHtml(text, newContext(file, `${where}.${field}`, "block", issues, ix.lessonUnit));
  const inline = (text: string, field: string) => renderToHtml(text, newContext(file, `${where}.${field}`, "inline", issues, ix.lessonUnit));
  const why: Partial<Record<Letter, string>> = {};
  for (const L of LETTERS) {
    const w = q.why[L];
    if (w) why[L] = inline(w, `why.${L}`);
  }
  return {
    id: q.id,
    stem: block(q.stem, "stem"),
    figure: q.figure as QuestionContent["figure"],
    options: q.options.map((o, i) => inline(o, `options.${LETTERS[i]}`)),
    answer: q.answer,
    explain: block(q.explain, "explain"),
    why,
  };
}

function validateQuestion(q: QuestionSource, file: string, ix: Indexes, kind: "bank" | "unit" | "test") {
  const where = q.id;
  const skill = ix.skills[q.skill];
  if (!skill) issues.error(file, where, `unknown skill "${q.skill}"`);
  if (kind === "bank" && !q.use) issues.error(file, where, "bank questions need use: check | quiz | bank");
  if (kind !== "bank" && q.use) issues.error(file, where, "unit-test and practice-test questions must not have use");
  if (kind === "test" && !q.test) issues.error(file, where, "practice-test questions need test: 1..5");
  if (kind !== "test" && q.test) issues.error(file, where, "only practice-test questions have test");
  if (q.objective) {
    const area = ix.objectiveArea[q.objective];
    if (!area) issues.error(file, where, `unknown objective ${q.objective}`);
    else if (skill?.area && area !== skill.area) issues.error(file, where, `objective ${q.objective} is not in the skill's area ${skill.area}`);
  }
  const wrong = LETTERS.filter((L) => L !== q.answer);
  const whyKeys = Object.keys(q.why).sort().join("");
  if (whyKeys !== wrong.join("")) issues.error(file, where, `why must explain exactly ${wrong.join(", ")} (has ${whyKeys || "none"})`);
  const norm = q.options.map((o) => o.replace(/\s+/g, " ").trim().toLowerCase());
  if (new Set(norm).size !== 4) issues.error(file, where, "two options are identical");
  const nums = q.options.map(parseNumber);
  const allNumeric = nums.every((x) => x !== null);
  if (allNumeric) {
    const ascending = nums.every((x, i) => i === 0 || (x as number) > (nums[i - 1] as number));
    if (!ascending) issues.error(file, where, "numeric options must be in ascending order");
    if (!q.ordered) issues.warn(file, where, "numeric options: set ordered: true");
  }
  if (q.ordered && !allNumeric) {
    // Sequences such as "1, 2, 3" are allowed; nothing else to check automatically.
  }
  const lens = q.options.map((o) => o.length);
  const correctLen = lens[LETTERS.indexOf(q.answer)];
  const others = lens.filter((_, i) => i !== LETTERS.indexOf(q.answer));
  const avgOthers = others.reduce((a, b) => a + b, 0) / others.length;
  if (correctLen > 24 && correctLen > avgOthers * 1.6) issues.warn(file, where, "the correct option is much longer than the others (a giveaway)");
  const allText = [q.stem, ...q.options, q.explain, ...Object.values(q.why)].join("\n");
  if (/\b(all|none) of the above\b/i.test(q.options.join("\n"))) issues.warn(file, where, "avoid all/none of the above");
  if (/\bwhich\b[^?]*\b(not|except)\b/.test(q.stem)) issues.error(file, where, "write NOT or EXCEPT in capitals in the stem");
  if (/\b(option|choice|answer) \(?[ABCD]\)?\b/.test(q.explain)) issues.warn(file, where, "explanations should not refer to options by letter");
  if (q.type === "calculation" && !q.verify) issues.error(file, where, "calculation questions need a verify snippet");
  if ((q.type === "visual") && !q.figure && !/\|.*\|/.test(q.stem)) issues.warn(file, where, "visual questions should have a figure or a table");
  for (const p of scanStyle(allText.replace(/```[\s\S]*?```/g, "").replace(/`[^`]*`/g, "").replace(/\$\$[\s\S]*?\$\$/g, ""))) {
    issues.error(file, where, p);
  }
}

function loadQuestionFile(file: string, ix: Indexes, kind: "bank" | "unit" | "test", seen: Map<string, string>): LoadedQuestion[] {
  const raw = readYaml(file);
  if (raw === null) return [];
  if (!Array.isArray(raw)) {
    issues.error(rel(file), "(root)", "a question file must be a YAML list");
    return [];
  }
  const out: LoadedQuestion[] = [];
  raw.forEach((item, i) => {
    const parsed = questionSchema.safeParse(item);
    const label = (item as { id?: string })?.id ?? `item ${i + 1}`;
    if (!parsed.success) {
      for (const e of parsed.error.issues.slice(0, 4)) issues.error(rel(file), label, `${e.path.join(".") || "(item)"}: ${e.message}`);
      return;
    }
    const q = parsed.data;
    if (seen.has(q.id)) {
      issues.error(rel(file), q.id, `duplicate id (also in ${seen.get(q.id)})`);
      return;
    }
    seen.set(q.id, rel(file));
    validateQuestion(q, rel(file), ix, kind);
    const skill = ix.skills[q.skill];
    if (!skill) return;
    const objective = q.objective ?? skill.objectives[0];
    out.push({
      src: q,
      file: rel(file),
      content: renderQuestion(q, rel(file), ix),
      objective,
      area: (skill.area ?? "DL") as AreaId,
      time: q.time ?? defaultTime(q.type, q.tier),
    });
  });
  return out;
}

// ---------------------------------------------------------------- lessons

interface LoadedLesson {
  id: string;
  file: string;
  hast: HRoot;
  checks: string[];
  widgets: string[];
  sections: LessonInfo["sections"];
  strongs: string[];
  words: number;
  figures: number;
  runnable: RunBlock[];
}

function loadLessons(ix: Indexes): Map<string, LoadedLesson> {
  const dir = path.join(CONTENT, "lessons");
  const out = new Map<string, LoadedLesson>();
  if (!fs.existsSync(dir)) return out;
  const known = new Set(Object.keys(ix.lessonUnit));
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".md")).sort()) {
    const file = path.join(dir, f);
    const id = f.replace(/\.md$/, "");
    const r = rel(file);
    if (!known.has(id)) {
      issues.error(r, "(file)", `no lesson "${id}" in the curriculum`);
      continue;
    }
    const src = fs.readFileSync(file, "utf8");
    const { data, body } = splitFrontmatter(src);
    if (data.id !== id) issues.error(r, "frontmatter", `id must be "${id}"`);
    const ctx = newContext(r, r, "lesson", issues, ix.lessonUnit);
    const hast = renderToHast(body, ctx);
    out.set(id, {
      id,
      file: r,
      hast,
      checks: ctx.checks,
      widgets: ctx.widgets,
      sections: ctx.sections,
      strongs: ctx.strongs,
      words: ctx.words,
      figures: ctx.figures,
      runnable: ctx.runnable,
    });
  }
  return out;
}

// ---------------------------------------------------------------- flashcards

function loadFlashcards(ix: Indexes): Flashcard[] {
  const out: Flashcard[] = [];
  const seen = new Set<string>();
  for (const file of listYaml(path.join(CONTENT, "flashcards"))) {
    const raw = readYaml(file);
    if (!Array.isArray(raw)) continue;
    raw.forEach((item, i) => {
      const parsed = flashcardSchema.safeParse(item);
      const label = (item as { id?: string })?.id ?? `card ${i + 1}`;
      if (!parsed.success) {
        for (const e of parsed.error.issues.slice(0, 3)) issues.error(rel(file), label, `${e.path.join(".")}: ${e.message}`);
        return;
      }
      const c = parsed.data;
      if (seen.has(c.id)) issues.error(rel(file), c.id, "duplicate flashcard id");
      seen.add(c.id);
      const skill = ix.skills[c.skill];
      if (!skill) {
        issues.error(rel(file), c.id, `unknown skill "${c.skill}"`);
        return;
      }
      for (const p of scanStyle(`${c.term}\n${c.def}\n${c.example ?? ""}`.replace(/`[^`]*`/g, "").replace(/\$\$[\s\S]*?\$\$/g, ""))) {
        issues.error(rel(file), c.id, p);
      }
      const ctx = newContext(rel(file), `${c.id}.def`, "block", issues, ix.lessonUnit);
      const back = renderToHtml(c.example ? `${c.def}\n\n*Example:* ${c.example}` : c.def, ctx);
      out.push({ id: c.id, term: c.term, back, skill: c.skill, unit: skill.unit, lesson: skill.lesson, virginia: c.virginia ?? false });
    });
  }
  return out;
}

// ---------------------------------------------------------------- main

async function main() {
  await initHighlighter();
  const cur = loadCurriculum();
  const ix = buildIndexes(cur);
  const seen = new Map<string, string>();

  // Bank questions: one file per lesson, content/questions/<unit>/<lesson>.yaml.
  const bank: LoadedQuestion[] = [];
  for (const unit of cur.units.map((u) => u.id)) {
    for (const file of listYaml(path.join(CONTENT, "questions", unit))) {
      const lesson = path.basename(file).replace(/\.ya?ml$/, "");
      if (ix.lessonUnit[lesson] !== unit) {
        issues.error(rel(file), "(file)", `bank files are named after a lesson of ${unit} (for example ${unit}-l1.yaml)`);
        continue;
      }
      const qs = loadQuestionFile(file, ix, "bank", seen);
      for (const q of qs) {
        if (ix.skills[q.src.skill]?.lesson !== lesson) issues.error(q.file, q.src.id, `skill ${q.src.skill} belongs to lesson ${ix.skills[q.src.skill]?.lesson}, not ${lesson}`);
      }
      letterBalance(qs.map((q) => q.src.answer), rel(file), "(file order)", true);
      bank.push(...qs);
    }
  }
  for (const f of listYaml(path.join(CONTENT, "questions"))) {
    issues.error(rel(f), "(file)", "bank questions go in content/questions/<unit>/<lesson>.yaml");
  }

  // Unit tests.
  const unitTests = new Map<string, LoadedQuestion[]>();
  for (const file of listYaml(path.join(CONTENT, "questions", "unit-tests"))) {
    const unit = path.basename(file).replace(/\.ya?ml$/, "");
    const qs = loadQuestionFile(file, ix, "unit", seen);
    for (const q of qs) if (ix.skills[q.src.skill]?.unit !== unit) issues.error(q.file, q.src.id, `skill ${q.src.skill} is not in ${unit}`);
    if (qs.length < 20 || qs.length > 30) issues.error(rel(file), "(file)", `a unit test has 20 to 30 questions (has ${qs.length})`);
    letterBalance(qs.map((q) => q.src.answer), rel(file), "(test order)", true);
    unitTests.set(unit, qs);
  }

  // Practice-test items, authored per area.
  const testItems: LoadedQuestion[] = [];
  for (const file of listYaml(path.join(CONTENT, "questions", "tests"))) {
    const area = path.basename(file).replace(/\.ya?ml$/, "");
    const qs = loadQuestionFile(file, ix, "test", seen);
    for (const q of qs) if (q.area !== area) issues.error(q.file, q.src.id, `skill ${q.src.skill} is in area ${q.area}, not ${area}`);
    testItems.push(...qs);
  }

  const lessons = loadLessons(ix);
  const flashcards = loadFlashcards(ix);

  // ---- cross checks: lesson checks and quizzes
  const bankById = new Map(bank.map((q) => [q.src.id, q]));
  const placed = new Map<string, string>();
  for (const [lid, L] of lessons) {
    const lessonSkills = new Set(cur.units.flatMap((u) => u.lessons).find((l) => l.id === lid)?.skills ?? []);
    for (const qid of L.checks) {
      const q = bankById.get(qid);
      if (!q) {
        issues.error(L.file, "::check", `no bank question "${qid}"`);
        continue;
      }
      if (q.src.use !== "check") issues.error(L.file, "::check", `"${qid}" is use: ${q.src.use}, not check`);
      if (!lessonSkills.has(q.src.skill)) issues.error(L.file, "::check", `"${qid}" belongs to skill ${q.src.skill}, which is not in this lesson`);
      if (placed.has(qid)) issues.error(L.file, "::check", `"${qid}" is placed twice`);
      placed.set(qid, lid);
    }
  }
  for (const q of bank) {
    if (q.src.use === "check" && !placed.has(q.src.id)) {
      const lid = ix.skills[q.src.skill]?.lesson;
      if (lid && lessons.has(lid)) issues.error(q.file, q.src.id, `use: check but not placed in lesson ${lid}`);
    }
  }

  // ---- lesson info
  const lessonInfo: Record<string, LessonInfo> = {};
  for (const u of cur.units) {
    for (const l of u.lessons) {
      const L = lessons.get(l.id);
      const quiz = bank.filter((q) => q.src.use === "quiz" && ix.skills[q.src.skill]?.lesson === l.id).map((q) => q.src.id);
      const checks = L?.checks ?? [];
      if (L) {
        const file = L.file;
        if (u.id !== "u0") {
          if (checks.length < 4) strictOr(file, "(lesson)", `only ${checks.length} checks (target 4 to 8)`);
          if (quiz.length < 8) strictOr(file, "(lesson)", `quiz has ${quiz.length} questions (target 8 to 12)`);
          if (quiz.length > 14) issues.warn(file, "(lesson)", `quiz has ${quiz.length} questions (target 8 to 12)`);
        }
        if (L.words < 900 && u.id !== "u0") strictOr(file, "(lesson)", `only ${L.words} words of text (target 1,400 to 2,800)`);
        for (const w of l.widgets ?? []) if (!L.widgets.includes(w)) strictOr(file, "(lesson)", `curriculum lists widget "${w}" but the lesson does not place it`);
        for (const term of l.vocab ?? []) {
          const t = term.toLowerCase();
          const short = t.replace(/\s*\(.*\)\s*/, "").trim();
          const found = L.strongs.some((s) => s.includes(short) || s.includes(t));
          if (!found) strictOr(file, "(vocab)", `Virginia term "${term}" is not defined in bold in this lesson`);
        }
        if (!L.hast.children.length) issues.error(file, "(lesson)", "lesson rendered empty");
      }
      lessonInfo[l.id] = {
        id: l.id,
        unit: u.id,
        n: l.n,
        code: `${u.n}.${l.n}`,
        title: l.title,
        summary: l.summary,
        minutes: l.minutes,
        skills: l.skills,
        objectives: l.objectives,
        sections: L?.sections ?? [],
        checks,
        quiz,
        widgets: L?.widgets ?? [],
        hasContent: !!L,
      };
    }
  }

  // ---- labels (12, 12b, 12c ...) ordered by tier then file order
  const qmeta: QMeta[] = [];
  for (const sid of ix.skillOrder) {
    const sk = ix.skills[sid];
    const qs = bank
      .map((q, i) => ({ q, i }))
      .filter(({ q }) => q.src.skill === sid)
      .sort((a, b) => TIER_RANK[a.q.src.tier] - TIER_RANK[b.q.src.tier] || a.i - b.i)
      .map(({ q }) => q);
    qs.forEach((q, k) => {
      qmeta.push({
        id: q.src.id,
        skill: sid,
        unit: sk.unit,
        lesson: sk.lesson,
        area: q.area,
        objective: q.objective,
        tier: q.src.tier,
        type: q.src.type,
        use: q.src.use ?? "bank",
        label: k === 0 ? `${sk.n}` : `${sk.n}${String.fromCharCode(97 + k)}`,
        time: q.time,
      });
    });
  }

  // ---- coverage
  const coverage: string[] = [];
  for (const u of cur.units.filter((x) => x.area)) {
    let line = `${u.id} ${u.area}:`;
    let total = 0;
    for (const l of u.lessons) {
      for (const sid of l.skills) {
        const qs = bank.filter((q) => q.src.skill === sid);
        total += qs.length;
        const tiers = { core: 0, competitive: 0, champion: 0 } as Record<Tier, number>;
        for (const q of qs) tiers[q.src.tier] += 1;
        if (lessons.has(l.id)) {
          if (qs.length < 6) strictOr(`content/questions/${u.id}.yaml`, sid, `skill has ${qs.length} questions (minimum 6)`);
          if (tiers.core < 1 || tiers.competitive < 2) strictOr(`content/questions/${u.id}.yaml`, sid, `tier mix ${tiers.core}/${tiers.competitive}/${tiers.champion} (need >=1 core, >=2 competitive)`);
        }
      }
    }
    const area = cur.areas.find((a) => a.id === u.area)!;
    const target = area.items * 8;
    line += ` ${total} bank questions (target ${target}), lessons ${u.lessons.filter((l) => lessons.has(l.id)).length}/${u.lessons.length}`;
    if (total < target && u.lessons.every((l) => lessons.has(l.id))) strictOr(`content/questions/${u.id}.yaml`, "(area)", `area has ${total} questions; target ${target}`);
    coverage.push(line);
  }
  for (const a of cur.areas) {
    for (const o of a.objectives) {
      const count = bank.filter((q) => q.objective === o.id).length;
      const unitDone = cur.units.find((u) => u.area === a.id)?.lessons.every((l) => lessons.has(l.id));
      if (unitDone && count < 10) strictOr("content/questions", o.id, `objective has ${count} bank questions (minimum 10)`);
    }
  }

  // ---- Virginia vocabulary flashcards
  const cardTerms = new Set(flashcards.filter((c) => c.virginia).map((c) => c.term.toLowerCase()));
  const missingTerms = VIRGINIA_TERMS.filter((t) => !cardTerms.has(t.toLowerCase()));
  if (flashcards.length && missingTerms.length) strictOr("content/flashcards", "(virginia)", `missing virginia cards: ${missingTerms.join(", ")}`);

  // ---- near duplicates
  const stems = [...bank, ...[...unitTests.values()].flat(), ...testItems].map((q) => ({ id: q.src.id, file: q.file, norm: normalizeStem(q.src.stem), opts: q.src.options.join("|").toLowerCase(), kind: q.file.includes("/tests/") || q.file.includes("unit-tests") ? "test" : "bank" }));
  for (let i = 0; i < stems.length; i++) {
    for (let j = i + 1; j < stems.length; j++) {
      const a = stems[i];
      const b = stems[j];
      if (a.norm === b.norm && a.opts === b.opts) {
        issues.error(b.file, b.id, `duplicate of ${a.id}`);
        continue;
      }
      const s = similarity(a.norm, b.norm);
      if (s >= 0.85) {
        const crossPool = a.kind !== b.kind || a.file !== b.file;
        if (crossPool && (a.kind === "test" || b.kind === "test")) issues.error(b.file, b.id, `too similar to ${a.id} (${s.toFixed(2)}); tests must not reuse bank questions`);
        else issues.warn(b.file, b.id, `very similar to ${a.id} (${s.toFixed(2)})`);
      }
    }
  }

  // ---- practice tests
  const practiceTests: PracticeTest[] = [];
  const toTestQuestion = (q: LoadedQuestion): TestQuestion => ({
    ...q.content,
    area: q.area,
    objective: q.objective,
    skill: q.src.skill,
    tier: q.src.tier,
    type: q.src.type,
    time: q.time,
  });
  for (let n = 1; n <= 5; n++) {
    const items = testItems.filter((q) => q.src.test === n);
    if (!items.length) continue;
    const file = `content/questions/tests (test ${n})`;
    let complete = true;
    for (const a of cur.areas) {
      const c = items.filter((q) => q.area === a.id).length;
      if (c !== a.items) {
        complete = false;
        strictOr(file, a.id, `test ${n} has ${c} ${a.id} items (needs ${a.items})`);
      }
    }
    if (!complete) continue;
    for (const a of cur.areas) for (const o of a.objectives) if (!items.some((q) => q.objective === o.id)) strictOr(file, o.id, `test ${n} has no question for objective ${o.id}`);
    const tierCount = { core: 0, competitive: 0, champion: 0 } as Record<Tier, number>;
    for (const q of items) tierCount[q.src.tier] += 1;
    const target = n === 5 ? { core: [15, 25], competitive: [40, 50], champion: [30, 40] } : { core: [30, 40], competitive: [40, 50], champion: [15, 25] };
    for (const t of ["core", "competitive", "champion"] as Tier[]) {
      const [lo, hi] = target[t];
      if (tierCount[t] < lo || tierCount[t] > hi) strictOr(file, t, `test ${n} has ${tierCount[t]} ${t} items (target ${lo} to ${hi})`);
    }
    // Tiebreakers: hardest items, spread across areas.
    const ranked = [...items].sort((a, b) => TIER_RANK[b.src.tier] - TIER_RANK[a.src.tier] || b.time - a.time || a.src.id.localeCompare(b.src.id));
    const tb = new Map<string, 1 | 2>();
    const perArea: Record<string, number> = {};
    for (const q of ranked) {
      if ([...tb.values()].filter((v) => v === 1).length >= 10) break;
      if ((perArea[q.area] ?? 0) >= 2 || q.src.tier !== "champion") continue;
      tb.set(q.src.id, 1);
      perArea[q.area] = (perArea[q.area] ?? 0) + 1;
    }
    const perArea2: Record<string, number> = {};
    for (const q of ranked) {
      if ([...tb.values()].filter((v) => v === 2).length >= 20) break;
      if (tb.has(q.src.id) || (perArea2[q.area] ?? 0) >= 4 || q.src.tier === "core") continue;
      tb.set(q.src.id, 2);
      perArea2[q.area] = (perArea2[q.area] ?? 0) + 1;
    }
    // Order: mixed areas, no long runs of one area or one answer letter.
    let ordered: LoadedQuestion[] | null = null;
    for (let seed = 1; seed <= 20000 && !ordered; seed++) {
      const rand = mulberry32(seed * 7919 + n);
      const arr = [...items];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      let ok = true;
      for (let i = 3; i < arr.length && ok; i++) {
        const sameLetter = arr[i].src.answer === arr[i - 1].src.answer && arr[i].src.answer === arr[i - 2].src.answer && arr[i].src.answer === arr[i - 3].src.answer;
        const sameArea = arr[i].area === arr[i - 1].area && arr[i].area === arr[i - 2].area && arr[i].area === arr[i - 3].area;
        if (sameLetter || sameArea) ok = false;
      }
      if (ok) ordered = arr;
    }
    if (!ordered) {
      issues.error(file, "(order)", "could not find an order without runs; check answer balance");
      continue;
    }
    letterBalance(ordered.map((q) => q.src.answer), file, "(assembled)", true);
    practiceTests.push({
      id: `pt${n}`,
      n,
      title: n === 5 ? "Practice Test 5: Championship" : `Practice Test ${n}`,
      minutes: 50,
      questions: ordered.map((q) => ({ ...toTestQuestion(q), ...(tb.has(q.src.id) ? { tb: tb.get(q.src.id) } : {}) })),
    });
  }

  // ---- unit tests
  const unitTestOut: UnitTest[] = [];
  for (const [unit, qs] of unitTests) {
    const u = cur.units.find((x) => x.id === unit);
    if (!u) continue;
    unitTestOut.push({ unit, title: `Unit ${u.n} Test`, minutes: Math.ceil(qs.length / 2), questions: qs.map(toTestQuestion) });
  }

  // ---- report
  const filter = ONLY.length ? (i: { file: string }) => matchesOnly(i.file) : undefined;
  issues.print(filter);
  console.log("\nCoverage");
  for (const line of coverage) console.log(`  ${line}`);
  console.log(
    `\nTotals: ${lessons.size} lessons, ${bank.length} bank questions, ${[...unitTests.values()].flat().length} unit-test questions, ${testItems.length} practice-test items (${practiceTests.length} complete tests), ${flashcards.length} flashcards`,
  );
  const errs = filter ? issues.errors.filter(filter) : issues.errors;
  const warns = filter ? issues.warnings.filter(filter) : issues.warnings;
  console.log(`${errs.length} errors, ${warns.length} warnings${ONLY.length ? ` (filtered to ${ONLY.join(", ")})` : ""}`);

  // ---- verification input for scripts/verify.py (one file per filter, so
  // parallel writers never read each other's half-written file)
  fs.mkdirSync(TMP, { recursive: true });
  const verifyInput = {
    questions: [...bank, ...[...unitTests.values()].flat(), ...testItems]
      .filter((q) => q.src.verify && matchesOnly(q.file))
      .map((q) => ({ id: q.src.id, file: q.file, verify: q.src.verify, options: q.src.options, answer: q.src.answer })),
    runnable: [...lessons.values()].flatMap((l) => l.runnable).filter((r) => matchesOnly(r.file)),
  };
  const verifyName = ONLY.length ? `verify-${ONLY.join("_").replace(/[^a-zA-Z0-9_-]/g, "")}.json` : "verify-input.json";
  fs.writeFileSync(path.join(TMP, verifyName), JSON.stringify(verifyInput, null, 1));

  if (CHECK_ONLY) {
    process.exit(errs.length ? 1 : 0);
  }
  if (issues.errors.length) {
    console.error("\nContent has errors; fix them before building.");
    process.exit(1);
  }

  // ---- write generated output
  fs.rmSync(OUT, { recursive: true, force: true });
  for (const d of ["lessons", "questions", "unit-tests", "tests"]) fs.mkdirSync(path.join(OUT, d), { recursive: true });

  const units: UnitInfo[] = cur.units.map((u) => {
    const ut = unitTests.get(u.id);
    return {
      id: u.id,
      n: u.n,
      area: u.area,
      title: u.title,
      summary: u.summary,
      lessons: u.lessons.map((l) => l.id),
      unitTest: ut ? { count: ut.length, minutes: Math.ceil(ut.length / 2) } : null,
    };
  });
  const catalog: Catalog = {
    areas: cur.areas.map((a) => ({ id: a.id, name: a.name, items: a.items, objectives: a.objectives.map((o) => ({ ...o, area: a.id })) })),
    units,
    lessons: lessonInfo,
    skills: ix.skills,
    skillOrder: ix.skillOrder,
    questions: qmeta,
    practiceTests: practiceTests.map((t) => ({ id: t.id, n: t.n, title: t.title, count: t.questions.length, minutes: t.minutes })),
    flashcardCount: flashcards.length,
    builtAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(OUT, "catalog.json"), JSON.stringify(catalog));
  for (const [id, L] of lessons) fs.writeFileSync(path.join(OUT, "lessons", `${id}.json`), JSON.stringify({ id, hast: L.hast }));
  const unitIds = cur.units.map((u) => u.id);
  for (const unit of unitIds) {
    const map: Record<string, QuestionContent> = {};
    for (const q of bank) if (ix.skills[q.src.skill]?.unit === unit) map[q.src.id] = q.content;
    fs.writeFileSync(path.join(OUT, "questions", `${unit}.json`), JSON.stringify(map));
  }
  for (const ut of unitTestOut) fs.writeFileSync(path.join(OUT, "unit-tests", `${ut.unit}.json`), JSON.stringify(ut));
  for (const t of practiceTests) fs.writeFileSync(path.join(OUT, "tests", `${t.id}.json`), JSON.stringify(t));
  fs.writeFileSync(path.join(OUT, "flashcards.json"), JSON.stringify(flashcards));
  const loaders = [
    "// Generated by scripts/build-content.ts. Lazy loaders for question content by unit.",
    'import type { QuestionContent } from "@/lib/content-types";',
    "",
    "export const questionLoaders: Record<string, () => Promise<Record<string, QuestionContent>>> = {",
    ...unitIds.map((u) => `  ${u}: () => import("./questions/${u}.json").then((m) => m.default as Record<string, QuestionContent>),`),
    "};",
    "",
  ].join("\n");
  fs.writeFileSync(path.join(OUT, "loaders.ts"), loaders);
  console.log(`\nWrote ${rel(OUT)}`);
}

main().catch((e) => {
  issues.print();
  console.error(e);
  process.exit(1);
});
