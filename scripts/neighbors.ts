// Review aid for the rule that tests must not reuse or closely paraphrase bank
// questions. The validator's near-duplicate check (bigram Jaccard >= 0.85) only
// catches near-verbatim copies; this lists the closest stems by content-word
// overlap so a person can judge paraphrases.
//
//   npx tsx scripts/neighbors.ts --map u1        every question for u1's skills, by skill
//   npx tsx scripts/neighbors.ts pt1-dl          nearest stems for matching test items
//   npx tsx scripts/neighbors.ts ut3 --virginia <studyguide.txt>
//                                                also compare with the Virginia guide's
//                                                questions (text from pdftotext; not stored here)

import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

const ROOT = path.resolve(__dirname, "..");
const QDIR = path.join(ROOT, "content", "questions");

type Q = { id: string; skill: string; tier: string; stem: string; answer: string; words: Set<string> };

const STOP = new Set(
  "a an the of to in is are was be for on with and or which what that this these it its as by at from does do each one how why best most into than then their they there when who whose will would can could should about after before more less not only all any same".split(" "),
);

function contentWords(s: string): Set<string> {
  const words = s
    .toLowerCase()
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[^a-z0-9%.\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !STOP.has(w));
  return new Set(words);
}

function overlap(a: Set<string>, b: Set<string>): number {
  let shared = 0;
  for (const w of a) if (b.has(w)) shared += 1;
  return shared / (a.size + b.size - shared || 1);
}

function loadDir(dir: string): Q[] {
  const out: Q[] = [];
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) out.push(...loadDir(p));
    else if (f.endsWith(".yaml")) {
      for (const q of YAML.parse(fs.readFileSync(p, "utf8")) ?? []) {
        out.push({ id: q.id, skill: q.skill, tier: q.tier, stem: String(q.stem).trim(), answer: q.options["ABCD".indexOf(q.answer)], words: contentWords(q.stem) });
      }
    }
  }
  return out;
}

function oneLine(s: string, max: number): string {
  const t = s
    .replace(/```[a-z]*\n([\s\S]*?)```/g, (_m, code: string) => `[${code.replace(/\s+/g, " ").trim().slice(0, 40)}]`)
    .replace(/\s+/g, " ")
    .trim();
  return t.length > max ? `${t.slice(0, max - 3)}...` : t;
}

function virginiaStems(file: string): { label: string; words: Set<string>; stem: string }[] {
  const raw = fs.readFileSync(file, "latin1").replace(/\r/g, "");
  const sections: [string, string][] = [
    ["MC", raw.slice(raw.lastIndexOf("Section 1:"), raw.lastIndexOf("Section 2:"))],
    ["OA", raw.slice(raw.lastIndexOf("Section 2:"), raw.lastIndexOf("Section 3:"))],
  ];
  const out: { label: string; words: Set<string>; stem: string }[] = [];
  for (const [tag, text] of sections) {
    const parts = text.split(/Question (\d+): /);
    for (let i = 1; i + 1 < parts.length; i += 2) {
      const body = parts[i + 1];
      const end = body.indexOf("?");
      const stem = (end >= 0 ? body.slice(0, end + 1) : body.split("\n")[0]).replace(/\s+/g, " ").trim();
      out.push({ label: `${tag}${parts[i]}`, words: contentWords(stem), stem });
    }
  }
  return out;
}

const args = process.argv.slice(2);
const bank = fs.readdirSync(QDIR).filter((d) => /^u\d+$/.test(d)).flatMap((d) => loadDir(path.join(QDIR, d)));
const unitTests = loadDir(path.join(QDIR, "unit-tests"));
const practice = fs.existsSync(path.join(QDIR, "tests")) ? loadDir(path.join(QDIR, "tests")) : [];
const all = [...bank, ...unitTests, ...practice];

if (args[0] === "--map") {
  const unit = args[1];
  const cur = YAML.parse(fs.readFileSync(path.join(ROOT, "content", "curriculum.yaml"), "utf8"));
  const skills: string[] = cur.units.find((u: { id: string }) => u.id === unit)?.lessons.flatMap((l: { skills?: string[] }) => l.skills ?? []) ?? [];
  if (!skills.length) throw new Error(`no skills found for unit ${unit}`);
  for (const s of skills) {
    const rows = all.filter((q) => q.skill === s);
    console.log(`\n## ${s} (${rows.length})`);
    for (const q of rows) console.log(`${q.id} ${q.tier.slice(0, 5)} | ${oneLine(q.stem, 100)} => ${oneLine(String(q.answer), 48)}`);
  }
} else {
  const filter = args[0] ?? "";
  const vIndex = args.indexOf("--virginia");
  const virginia = vIndex >= 0 ? virginiaStems(args[vIndex + 1]) : [];
  const targets = [...unitTests, ...practice].filter((q) => q.id.includes(filter));
  for (const t of targets) {
    const near = all
      .filter((o) => o.id !== t.id)
      .map((o) => ({ o, s: overlap(t.words, o.words) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, 3);
    console.log(`\n${t.id} [${t.skill}] ${oneLine(t.stem, 140)} => ${oneLine(String(t.answer), 40)}`);
    for (const { o, s } of near) console.log(`   ${s.toFixed(2)} ${o.id}${o.skill === t.skill ? "" : ` [${o.skill}]`}: ${oneLine(o.stem, 110)} => ${oneLine(String(o.answer), 30)}`);
    if (virginia.length) {
      const v = virginia.map((x) => ({ x, s: overlap(t.words, x.words) })).sort((a, b) => b.s - a.s)[0];
      console.log(`   ${v.s.toFixed(2)} Virginia ${v.x.label}: ${oneLine(v.x.stem, 100)}`);
    }
  }
}
