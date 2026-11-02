import { catalog } from "./catalog";
import type { AreaId, QMeta } from "./content-types";
import type { Progress } from "./progress/types";
import { latestResult, skillStats } from "./analytics";
import { shuffle } from "./questions";

// Builders for dynamic practice sets. Quiz questions stay out of practice until
// their lesson quiz has been taken, so quizzes are never spoiled.

function eligible(p: Progress): QMeta[] {
  const quizTaken = new Set(Object.values(p.sessions).filter((s) => s.kind === "quiz").map((s) => s.ref));
  return catalog.questions.filter((q) => q.use !== "quiz" || quizTaken.has(q.lesson));
}

function studiedUnits(p: Progress): Set<string> {
  const units = new Set<string>();
  for (const [lid, st] of Object.entries(p.lessons)) {
    if (st.done || st.seen.length) {
      const l = catalog.lessons[lid];
      if (l) units.add(l.unit);
    }
  }
  return units;
}

// A timed drill: proportional to the real test's areas, fast question types first.
export function buildDrill(p: Progress, size = 20, seed = Date.now()): string[] {
  const studied = studiedUnits(p);
  const pool = eligible(p).filter((q) => studied.size === 0 || studied.has(q.unit));
  const fast = pool.filter((q) => q.time <= 45);
  const source = fast.length >= size ? fast : pool;
  const byArea = new Map<AreaId, QMeta[]>();
  for (const q of shuffle(source, seed)) byArea.set(q.area, [...(byArea.get(q.area) ?? []), q]);
  const picks: string[] = [];
  const areas = catalog.areas.filter((a) => byArea.has(a.id));
  const totalItems = areas.reduce((s, a) => s + a.items, 0) || 1;
  for (const a of areas) {
    const want = Math.max(1, Math.round((a.items / totalItems) * size));
    picks.push(...(byArea.get(a.id) ?? []).slice(0, want).map((q) => q.id));
  }
  return shuffle(picks, seed + 1).slice(0, size);
}

// Mixed review: open mistakes first, then weak skills, then older correct answers.
export function buildReview(p: Progress, size = 20, seed = Date.now()): string[] {
  const latest = latestResult(p);
  const stats = skillStats(p);
  const pool = eligible(p);
  const wrong = pool.filter((q) => latest.get(q.id) === false);
  const weak = pool.filter((q) => !latest.has(q.id) && stats[q.skill]?.attempts && stats[q.skill].estimate < 0.7);
  const unseen = pool.filter((q) => !latest.has(q.id) && studiedUnits(p).has(q.unit));
  const old = pool.filter((q) => latest.get(q.id) === true);
  const out: string[] = [];
  for (const group of [shuffle(wrong, seed), shuffle(weak, seed + 1), shuffle(unseen, seed + 2), shuffle(old, seed + 3)]) {
    for (const q of group) {
      if (out.length >= size) break;
      if (!out.includes(q.id)) out.push(q.id);
    }
  }
  return out;
}

export function skillSet(p: Progress, skill: string): string[] {
  const latest = latestResult(p);
  const qs = eligible(p).filter((q) => q.skill === skill);
  const order = (id: string) => (latest.get(id) === false ? 0 : !latest.has(id) ? 1 : 2);
  return [...qs].sort((a, b) => order(a.id) - order(b.id)).map((q) => q.id);
}

export function lessonPracticeSet(p: Progress, lessonId: string): string[] {
  const lesson = catalog.lessons[lessonId];
  if (!lesson) return [];
  const qs = eligible(p).filter((q) => q.lesson === lessonId && q.use !== "check");
  const fallback = qs.length >= 4 ? qs : catalog.questions.filter((q) => q.lesson === lessonId && q.use !== "quiz");
  return fallback.map((q) => q.id);
}
