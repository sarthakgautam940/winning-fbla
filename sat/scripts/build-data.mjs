// Builds the app's data from the extracted bank (sat/data/extracted, made by scripts/extract).
//   public/data/q/<id>.json   one question: stem, choices, answer, rationale (LaTeX pre-rendered)
//   public/data/glyphs.svg    the glyph sprite every math expression and figure draws from
//   public/data/img/*.png     the few raster figures kept as images
//   src/generated/bank.json   the index the app imports: sections, categories, patterns, questions
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import katex from "katex";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = path.join(root, "data", "extracted");
const pub = path.join(root, "public", "data");
const gen = path.join(root, "src", "generated");

const questions = JSON.parse(fs.readFileSync(path.join(src, "questions.json"), "utf8"));
const teach = {
  ...JSON.parse(fs.readFileSync(path.join(root, "data", "teach-math.json"), "utf8")),
  ...JSON.parse(fs.readFileSync(path.join(root, "data", "teach-rw.json"), "utf8")),
};

fs.rmSync(pub, { recursive: true, force: true });
fs.mkdirSync(path.join(pub, "q"), { recursive: true });
fs.mkdirSync(path.join(pub, "img"), { recursive: true });
fs.mkdirSync(gen, { recursive: true });

let texCount = 0;
function renderTex(tex) {
  texCount++;
  // MathType set these at full size, so fractions use display style
  return katex.renderToString(`\\displaystyle ${tex}`, { throwOnError: true, output: "html", strict: "ignore" });
}

const EM = 9; // points per em in the source layout
function convertInline(items) {
  // a space between math and closing punctuation (" ?") would let the punctuation wrap alone
  items = items.map((c, i) => {
    const prev = items[i - 1];
    if ("t" in c && prev && !("t" in prev) && !("br" in prev) && /^ [?.,;:!)]/.test(c.t)) return { ...c, t: c.t.slice(1) };
    return c;
  });
  return items.map((c) => {
    if ("tex" in c) return { k: renderTex(c.tex) };
    if ("m" in c) {
      const out = { m: c.m, w: c.w, h: c.h, vw: +(c.w * EM).toFixed(2), vh: +(c.h * EM).toFixed(2) };
      if (c.va !== null && c.va !== undefined) out.va = c.va;
      return out;
    }
    return c;
  });
}
function convertBlocks(blocks) {
  return blocks.map((b) => {
    if (b.k === "fig") return { ...b, vw: +(b.w * EM).toFixed(2), vh: +(b.h * EM).toFixed(2) };
    return { ...b, c: convertInline(b.c) };
  });
}

// Grid-in answers: "-4.9, -49/10" -> ["-4.9", "-49/10"]
function acceptList(answer) {
  return answer
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const index = [];
const seenCodes = new Set();
for (const q of questions) {
  if (seenCodes.has(q.code)) throw new Error("duplicate code " + q.code);
  seenCodes.add(q.code);
  const type = q.choices.length ? "mc" : "spr";
  if (type === "mc" && !/^[A-D]$/.test(q.answer)) throw new Error(`bad answer ${q.code} ${q.answer}`);
  if (type === "spr" && !q.answer) throw new Error(`missing answer ${q.code}`);
  const out = {
    id: q.id,
    code: q.code,
    type,
    stem: convertBlocks(q.stem),
    choices: q.choices.map((c) => ({ l: c.l, c: convertBlocks(c.c) })),
    answer: type === "mc" ? q.answer : acceptList(q.answer),
    rationale: convertBlocks(q.rationale),
  };
  fs.writeFileSync(path.join(pub, "q", `${q.id}.json`), JSON.stringify(out));
  index.push({
    id: q.id,
    code: q.code,
    section: q.section,
    category: q.category,
    sub: q.sub,
    pattern: q.pattern,
    type,
    domain: q.meta.domain,
    skill: q.meta.skill,
  });
}

// Sections > categories > subcategories, in taxonomy order
const sections = [];
for (const q of index) {
  let sec = sections.find((s) => s.key === q.section);
  if (!sec) {
    sec = { key: q.section, name: q.section === "math" ? "Math" : "Reading and Writing", categories: [] };
    sections.push(sec);
  }
  let cat = sec.categories.find((c) => c.name === q.category);
  if (!cat) {
    cat = { name: q.category, subs: [] };
    sec.categories.push(cat);
  }
  let sub = cat.subs.find((s) => s.n === q.sub);
  if (!sub) {
    const full = questions.find((x) => x.id === q.id);
    sub = { n: q.sub, key: `${q.section === "math" ? "m" : "r"}${q.sub}`, name: full.subName, qs: [] };
    cat.subs.push(sub);
  }
  sub.qs.push(q.id);
}
// teaching notes must cover every pattern
for (const sec of sections) {
  for (const cat of sec.categories) {
    for (const sub of cat.subs) {
      if (!teach[sub.key]) throw new Error(`no teaching note for ${sub.key} ${sub.name}`);
    }
  }
}

fs.writeFileSync(path.join(gen, "bank.json"), JSON.stringify({ sections, questions: index }));
fs.writeFileSync(path.join(gen, "teach.json"), JSON.stringify(teach));

// The SAT math reference sheet, rendered once
const REF = [
  ["Circle", "A=\\pi r^{2}\\qquad C=2\\pi r"],
  ["Rectangle", "A=\\ell w"],
  ["Triangle", "A=\\tfrac{1}{2}bh"],
  ["Pythagorean theorem", "c^{2}=a^{2}+b^{2}"],
  ["Special right triangles", "30^{\\circ}\\text{-}60^{\\circ}\\text{-}90^{\\circ}:\\ x,\\ x\\sqrt{3},\\ 2x\\qquad 45^{\\circ}\\text{-}45^{\\circ}\\text{-}90^{\\circ}:\\ s,\\ s,\\ s\\sqrt{2}"],
  ["Rectangular prism", "V=\\ell wh"],
  ["Cylinder", "V=\\pi r^{2}h"],
  ["Sphere", "V=\\tfrac{4}{3}\\pi r^{3}"],
  ["Cone", "V=\\tfrac{1}{3}\\pi r^{2}h"],
  ["Pyramid", "V=\\tfrac{1}{3}\\ell wh"],
];
const refSheet = REF.map(([label, tex]) => ({ label, html: katex.renderToString(tex, { output: "html", throwOnError: true }) }));
refSheet.push({ label: "Also given", text: "A circle has 360 degrees of arc, or 2\u03c0 radians. The angles of a triangle add to 180 degrees." });
fs.writeFileSync(path.join(gen, "ref.json"), JSON.stringify(refSheet));

// Glyph sprite: hidden SVG with one path per glyph
const sprite = fs.readFileSync(path.join(src, "glyphs.svg"), "utf8");
fs.writeFileSync(path.join(pub, "glyphs.svg"), sprite);
for (const f of fs.readdirSync(path.join(src, "img"))) {
  fs.copyFileSync(path.join(src, "img", f), path.join(pub, "img", f));
}
console.log(`bank: ${index.length} questions, ${texCount} LaTeX expressions rendered`);
