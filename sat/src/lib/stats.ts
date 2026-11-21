import { TARGET } from "./engine";
import { questions, subs, subKeyOf, type SectionKey } from "./bank";
import { addDays, dayKey } from "./dates";
import type { State } from "./store";

// Analytics derived from the attempt log and per-question progress.

/** Per-answer time is capped so a question left open overnight doesn't count as study time. */
const CAP_MS = 4 * 60 * 1000;

export type Agg = {
  total: number;
  mastered: number;
  started: number;
  attempts: number;
  correct: number;
  firstTried: number;
  firstCorrect: number;
  ms: number;
};

function empty(): Agg {
  return { total: 0, mastered: 0, started: 0, attempts: 0, correct: 0, firstTried: 0, firstCorrect: 0, ms: 0 };
}

export function pct(n: number, d: number): number | null {
  return d ? Math.round((n / d) * 100) : null;
}

export type Breakdown = {
  all: Agg;
  section: Record<SectionKey, Agg>;
  category: Map<string, Agg>;
  sub: Map<string, Agg>;
};

export function breakdown(state: State): Breakdown {
  const all = empty();
  const section: Record<SectionKey, Agg> = { math: empty(), rw: empty() };
  const category = new Map<string, Agg>();
  const sub = new Map<string, Agg>();
  const meta = new Map(questions.map((q) => [q.id, q]));
  const buckets = (id: string) => {
    const q = meta.get(id)!;
    const ck = `${q.section}:${q.category}`;
    const sk = subKeyOf(q);
    if (!category.has(ck)) category.set(ck, empty());
    if (!sub.has(sk)) sub.set(sk, empty());
    return [all, section[q.section], category.get(ck)!, sub.get(sk)!];
  };
  for (const q of questions) {
    const p = state.q[q.id];
    for (const b of buckets(q.id)) {
      b.total++;
      if ((p?.c ?? 0) >= TARGET) b.mastered++;
      if (p && p.n > 0) b.started++;
      if (p?.f !== undefined) {
        b.firstTried++;
        if (p.f) b.firstCorrect++;
      }
    }
  }
  for (const [, id, ok, ms] of state.log) {
    if (!meta.has(id)) continue;
    for (const b of buckets(id)) {
      b.attempts++;
      if (ok) b.correct++;
      b.ms += Math.min(ms, CAP_MS);
    }
  }
  return { all, section, category, sub };
}

export type DayStat = { day: string; attempts: number; correct: number; ms: number };

export function daily(state: State, days = 14, now = Date.now()): DayStat[] {
  const today = dayKey(now);
  const map = new Map<string, DayStat>();
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(today, -i);
    map.set(d, { day: d, attempts: 0, correct: 0, ms: 0 });
  }
  for (const [t, , ok, ms] of state.log) {
    const r = map.get(dayKey(t));
    if (!r) continue;
    r.attempts++;
    if (ok) r.correct++;
    r.ms += Math.min(ms, CAP_MS);
  }
  return [...map.values()];
}

/** Consecutive days with at least one answer, ending today (or yesterday if nothing yet today). */
export function streak(state: State, now = Date.now()): number {
  const days = new Set(state.log.map(([t]) => dayKey(t)));
  let d = dayKey(now);
  if (!days.has(d)) d = addDays(d, -1);
  let n = 0;
  while (days.has(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

export type SubRank = { key: string; name: string; section: SectionKey; agg: Agg; firstAcc: number | null; acc: number | null };

/** Patterns ranked weakest first: first-try accuracy, then overall accuracy. */
export function weakest(b: Breakdown, limit = 8, minTried = 1): SubRank[] {
  const rows: SubRank[] = [];
  for (const s of subs) {
    const agg = b.sub.get(s.key);
    if (!agg || agg.firstTried < minTried) continue;
    rows.push({ key: s.key, name: s.name, section: s.section, agg, firstAcc: pct(agg.firstCorrect, agg.firstTried), acc: pct(agg.correct, agg.attempts) });
  }
  rows.sort((a, b) => (a.firstAcc ?? 101) - (b.firstAcc ?? 101) || (a.acc ?? 101) - (b.acc ?? 101) || b.agg.attempts - a.agg.attempts);
  return rows.slice(0, limit);
}

export function mostMissed(state: State, limit = 10) {
  return questions
    .map((q) => ({ q, w: state.q[q.id]?.w ?? 0, n: state.q[q.id]?.n ?? 0, c: state.q[q.id]?.c ?? 0 }))
    .filter((r) => r.w > 0)
    .sort((a, b) => b.w - a.w || b.w / b.n - a.w / a.n)
    .slice(0, limit);
}
