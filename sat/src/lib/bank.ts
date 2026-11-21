import raw from "@/generated/bank.json";
import teachRaw from "@/generated/teach.json";

export type SectionKey = "math" | "rw";

export type QMeta = {
  id: string;
  code: string;
  section: SectionKey;
  category: string;
  sub: number;
  pattern: string;
  type: "mc" | "spr";
  domain: string;
  skill: string;
};

export type Sub = { n: number; key: string; name: string; qs: string[] };
export type Category = { name: string; subs: Sub[] };
export type Section = { key: SectionKey; name: string; categories: Category[] };

export type Teach = { what: string; how: string[]; desmos?: string | null; trap: string };

type Raw = { sections: Section[]; questions: QMeta[] };
const data = raw as Raw;

export const sections: Section[] = data.sections;
export const questions: QMeta[] = data.questions;
export const teach = teachRaw as Record<string, Teach>;

export const byId = new Map(questions.map((q) => [q.id, q]));
export const byCode = new Map(questions.map((q) => [q.code.toLowerCase(), q]));

export type SubInfo = Sub & { section: SectionKey; category: string };
export const subs: SubInfo[] = sections.flatMap((s) => s.categories.flatMap((c) => c.subs.map((sub) => ({ ...sub, section: s.key, category: c.name }))));
export const subByKey = new Map(subs.map((s) => [s.key, s]));

export function subKeyOf(q: QMeta): string {
  return `${q.section === "math" ? "m" : "r"}${q.sub}`;
}

/** Tile label: "M5c" shows as "5c" inside its section. */
export function shortCode(code: string): string {
  return code.slice(1);
}

export function sectionName(key: SectionKey): string {
  return key === "math" ? "Math" : "Reading and Writing";
}

export const TOTAL = questions.length;

/** Find a question from what someone types: "5c", "M5c", "r15z", or a College Board ID. */
export function findQuestion(input: string, preferred: SectionKey = "math"): QMeta | undefined {
  const s = input.trim().toLowerCase().replace(/\s+/g, "");
  if (!s) return undefined;
  if (byCode.has(s)) return byCode.get(s);
  const pref = preferred === "math" ? "m" : "r";
  const other = preferred === "math" ? "r" : "m";
  return byCode.get(pref + s) ?? byCode.get(other + s) ?? byId.get(s);
}
