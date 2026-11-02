import { catalog, qmeta } from "./catalog";
import type { AreaId, Tier } from "./content-types";
import type { Attempt, Progress } from "./progress/types";
import { dayKey } from "./progress/store";

// Everything the Progress, Home, Review and Plan pages show is derived here
// from the attempt log, so no number is ever stored twice.

const DAY = 24 * 60 * 60 * 1000;
const TIER_WEIGHT: Record<Tier, number> = { core: 0.85, competitive: 1, champion: 1.2 };
const HALF_LIFE_DAYS = 30;

export interface Meta {
  skill: string;
  area: AreaId;
  tier: Tier;
  objective: string;
}

const metaCache = new Map<string, Meta | null>();

export function metaOf(qid: string): Meta | null {
  if (metaCache.has(qid)) return metaCache.get(qid)!;
  const bank = qmeta(qid);
  const m = bank ? { skill: bank.skill, area: bank.area, tier: bank.tier, objective: bank.objective } : (catalog.testMeta[qid] ?? null);
  metaCache.set(qid, m);
  return m;
}

function weight(a: Attempt, m: Meta, now: number): number {
  const ageDays = Math.max(0, (now - a.at) / DAY);
  return Math.pow(0.5, ageDays / HALF_LIFE_DAYS) * TIER_WEIGHT[m.tier];
}

export type Level = "new" | "learning" | "proficient" | "mastered";

export interface SkillStat {
  skill: string;
  attempts: number;
  correct: number;
  estimate: number; // smoothed, recency-weighted accuracy (0..1)
  level: Level;
  lastAt: number | null;
}

export function skillStats(p: Progress, now = Date.now()): Record<string, SkillStat> {
  const acc: Record<string, { w: number; wok: number; n: number; ok: number; last: number; okIds: Set<string>; hardOk: boolean }> = {};
  for (const a of p.attempts) {
    const m = metaOf(a.q);
    if (!m) continue;
    const s = (acc[m.skill] ??= { w: 0, wok: 0, n: 0, ok: 0, last: 0, okIds: new Set(), hardOk: false });
    const w = weight(a, m, now);
    s.w += w;
    s.n += 1;
    s.last = Math.max(s.last, a.at);
    if (a.ok) {
      s.wok += w;
      s.ok += 1;
      s.okIds.add(a.q);
      if (m.tier !== "core") s.hardOk = true;
    }
  }
  const out: Record<string, SkillStat> = {};
  for (const sid of catalog.skillOrder) {
    const s = acc[sid];
    if (!s) {
      out[sid] = { skill: sid, attempts: 0, correct: 0, estimate: 0, level: "new", lastAt: null };
      continue;
    }
    const estimate = (s.wok + 1) / (s.w + 2);
    const level: Level = s.okIds.size >= 4 && estimate >= 0.85 && s.hardOk ? "mastered" : s.n >= 3 && estimate >= 0.65 ? "proficient" : "learning";
    out[sid] = { skill: sid, attempts: s.n, correct: s.ok, estimate, level, lastAt: s.last };
  }
  return out;
}

export interface AreaStat {
  area: AreaId;
  name: string;
  items: number;
  attempts: number;
  estimate: number;
  answered: boolean;
}

export function areaStats(p: Progress, now = Date.now()): AreaStat[] {
  const acc: Record<string, { w: number; wok: number; n: number }> = {};
  for (const a of p.attempts) {
    const m = metaOf(a.q);
    if (!m) continue;
    const s = (acc[m.area] ??= { w: 0, wok: 0, n: 0 });
    const w = weight(a, m, now);
    s.w += w;
    s.n += 1;
    if (a.ok) s.wok += w;
  }
  return catalog.areas.map((ar) => {
    const s = acc[ar.id];
    return {
      area: ar.id,
      name: ar.name,
      items: ar.items,
      attempts: s?.n ?? 0,
      estimate: s ? (s.wok + 1.5) / (s.w + 3) : 0.5,
      answered: !!s,
    };
  });
}

export interface Projection {
  score: number;
  low: number;
  high: number;
  ready: boolean; // enough evidence to show it
  needed: number; // answers still needed before it is shown
  latestTest: { score: number; at: number } | null;
}

const MIN_ANSWERS = 60;

export function projectedScore(p: Progress, now = Date.now()): Projection {
  const areas = areaStats(p, now);
  let score = 0;
  let variance = 0;
  const effective: Record<string, number> = {};
  for (const a of p.attempts) {
    const m = metaOf(a.q);
    if (m) effective[m.area] = (effective[m.area] ?? 0) + weight(a, m, now);
  }
  for (const a of areas) {
    score += a.items * a.estimate;
    variance += (a.items * a.items * a.estimate * (1 - a.estimate)) / ((effective[a.area] ?? 0) + 3);
  }
  const tests = Object.values(p.sessions)
    .filter((s) => s.kind === "test" && s.total >= 100)
    .sort((a, b) => b.finishedAt - a.finishedAt);
  const latest = tests[0] ? { score: tests[0].correct, at: tests[0].finishedAt } : null;
  if (latest && now - latest.at < 45 * DAY) {
    score = 0.5 * score + 0.5 * latest.score;
    variance *= 0.5;
  }
  const half = 1.28 * Math.sqrt(variance);
  const answered = p.attempts.filter((a) => metaOf(a.q)).length;
  return {
    score: Math.round(score),
    low: Math.max(0, Math.round(score - half)),
    high: Math.min(100, Math.round(score + half)),
    ready: answered >= MIN_ANSWERS || !!latest,
    needed: Math.max(0, MIN_ANSWERS - answered),
    latestTest: latest,
  };
}

export function readinessBand(score: number): { label: string; note: string } {
  if (score >= 90) return { label: "Championship range", note: "Scores here contend for the top of the national field. Tiebreakers on hard questions decide places." };
  if (score >= 80) return { label: "National finalist range", note: "A strong score at any level. Push Champion questions and speed to climb." };
  if (score >= 70) return { label: "State placement range", note: "Solid. Close the weakest areas first; each one is worth up to 20 points." };
  if (score >= 55) return { label: "Building", note: "The foundations are forming. Finish the lessons and work the mistakes log." };
  return { label: "Getting started", note: "Work through the course in order; scores rise fastest in the first units." };
}

// --------------------------------------------------------------- activity

export function activeDays(p: Progress): Set<string> {
  const days = new Set<string>();
  for (const a of p.attempts) days.add(dayKey(a.at));
  for (const [d, ms] of Object.entries(p.study)) if (ms > 60 * 1000) days.add(d);
  return days;
}

export function streak(p: Progress, now = Date.now()): number {
  const days = activeDays(p);
  let count = 0;
  let t = now;
  if (!days.has(dayKey(t))) t -= DAY; // today not started yet; count from yesterday
  while (days.has(dayKey(t))) {
    count += 1;
    t -= DAY;
  }
  return count;
}

export interface DayActivity {
  day: string;
  correct: number;
  wrong: number;
  byTier: Record<Tier, { correct: number; wrong: number }>;
  ms: number;
}

export function activitySeries(p: Progress, days: number, now = Date.now()): DayActivity[] {
  const out: DayActivity[] = [];
  const index = new Map<string, DayActivity>();
  for (let i = days - 1; i >= 0; i--) {
    const d = dayKey(now - i * DAY);
    const row: DayActivity = { day: d, correct: 0, wrong: 0, byTier: { core: { correct: 0, wrong: 0 }, competitive: { correct: 0, wrong: 0 }, champion: { correct: 0, wrong: 0 } }, ms: p.study[d] ?? 0 };
    out.push(row);
    index.set(d, row);
  }
  for (const a of p.attempts) {
    const row = index.get(dayKey(a.at));
    if (!row) continue;
    const m = metaOf(a.q);
    if (a.ok) row.correct += 1;
    else row.wrong += 1;
    if (m) row.byTier[m.tier][a.ok ? "correct" : "wrong"] += 1;
    row.ms += a.ms;
  }
  return out;
}

export function totals(p: Progress) {
  const answered = p.attempts.length;
  const correct = p.attempts.filter((a) => a.ok).length;
  const studyMs = Object.values(p.study).reduce((s, v) => s + v, 0) + p.attempts.reduce((s, a) => s + Math.min(a.ms, 5 * 60 * 1000), 0);
  const distinct = new Set(p.attempts.map((a) => a.q)).size;
  return { answered, correct, accuracy: answered ? correct / answered : 0, studyMs, distinct };
}

// Seconds per question under time pressure (tests, unit tests, drills, quizzes).
export function pace(p: Progress): { overall: number | null; byArea: Partial<Record<AreaId, number>> } {
  const timed = p.attempts.filter((a) => (a.m === "test" || a.m === "unit" || a.m === "drill" || a.m === "quiz") && a.ms > 0);
  if (!timed.length) return { overall: null, byArea: {} };
  const sums: Record<string, { s: number; n: number }> = {};
  for (const a of timed) {
    const m = metaOf(a.q);
    if (!m) continue;
    const r = (sums[m.area] ??= { s: 0, n: 0 });
    r.s += a.ms;
    r.n += 1;
  }
  const byArea: Partial<Record<AreaId, number>> = {};
  for (const [k, v] of Object.entries(sums)) byArea[k as AreaId] = v.s / v.n / 1000;
  return { overall: timed.reduce((s, a) => s + a.ms, 0) / timed.length / 1000, byArea };
}

// --------------------------------------------------------------- mistakes

export interface MistakeEntry {
  qid: string;
  wrongCount: number;
  lastAt: number;
  fixed: boolean; // most recent attempt was correct
}

export function mistakes(p: Progress): MistakeEntry[] {
  const map = new Map<string, MistakeEntry>();
  for (const a of p.attempts) {
    const cur = map.get(a.q);
    if (!a.ok) map.set(a.q, { qid: a.q, wrongCount: (cur?.wrongCount ?? 0) + 1, lastAt: a.at, fixed: false });
    else if (cur) map.set(a.q, { ...cur, lastAt: a.at, fixed: true });
  }
  return [...map.values()].sort((a, b) => b.lastAt - a.lastAt);
}

export function latestResult(p: Progress): Map<string, boolean> {
  const out = new Map<string, boolean>();
  for (const a of p.attempts) out.set(a.q, a.ok);
  return out;
}

// --------------------------------------------------------------- course progress

export function lessonDone(p: Progress, lessonId: string): boolean {
  return !!p.lessons[lessonId]?.done;
}

export function unitDone(p: Progress, unitId: string): { done: number; total: number } {
  const u = catalog.units.find((x) => x.id === unitId);
  const total = u?.lessons.length ?? 0;
  const done = (u?.lessons ?? []).filter((l) => lessonDone(p, l)).length;
  return { done, total };
}

export function unitTestTaken(p: Progress, unitId: string): { best: number; total: number } | null {
  const runs = Object.values(p.sessions).filter((s) => s.kind === "unit" && s.ref === unitId);
  if (!runs.length) return null;
  const best = runs.reduce((a, b) => (b.correct / b.total > a.correct / a.total ? b : a));
  return { best: best.correct, total: best.total };
}

export function dueCardCount(p: Progress, cardIds: string[], now = Date.now()): number {
  return cardIds.filter((id) => p.cards[id] && p.cards[id].due <= now).length;
}

export function weakestSkills(stats: Record<string, SkillStat>, n = 5): SkillStat[] {
  return Object.values(stats)
    .filter((s) => s.attempts >= 2)
    .sort((a, b) => a.estimate - b.estimate || b.attempts - a.attempts)
    .slice(0, n);
}
