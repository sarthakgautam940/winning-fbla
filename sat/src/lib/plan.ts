import { TARGET } from "./engine";
import { questions } from "./bank";
import { addDays, dayKey, daysBetween } from "./dates";
import type { State } from "./store";

// The two-week plan. Learning runs through learnUntil (Dec 1 by default): every question
// reaches 5 of 5. Then two hardening days re-check every mastered question once (a miss
// sends it back to 3 of 5), one light review day on the most-missed questions, and the test.

export type Phase = "learn" | "harden" | "review" | "test" | "after";

export type Today = {
  today: string;
  phase: Phase;
  daysToTest: number;
  /** correct answers still needed for full mastery */
  remainingReps: number;
  /** correct answers to aim for today, and how many are done */
  target: number;
  done: number;
  /** questions to start for the first time today, and how many have been */
  newTarget: number;
  newDone: number;
  mastered: number;
  notStarted: number;
  /** mastered questions that still need the final check */
  toHarden: number;
  learnDaysLeft: number;
};

export function phaseOf(day: string, s: State["settings"]): Phase {
  if (day > s.testDate) return "after";
  if (day === s.testDate) return "test";
  if (day <= s.learnUntil) return "learn";
  if (day === addDays(s.testDate, -1)) return "review";
  return "harden";
}

export function planToday(state: State, now = Date.now()): Today {
  const s = state.settings;
  const today = dayKey(now);
  const phase = phaseOf(today, s);
  let remainingReps = 0;
  let mastered = 0;
  let notStarted = 0;
  let toHarden = 0;
  for (const q of questions) {
    const p = state.q[q.id];
    const c = p?.c ?? 0;
    remainingReps += Math.max(0, TARGET - c);
    if (c >= TARGET) {
      mastered++;
      if (!p?.h) toHarden++;
    }
    if (!p || p.n === 0) notStarted++;
  }
  let done = 0;
  let hardenedToday = 0;
  const firstSeen = new Map<string, string>();
  for (const [t, id, ok, , , mode] of state.log) {
    const d = dayKey(t);
    if (!firstSeen.has(id)) firstSeen.set(id, d);
    if (d !== today || !ok) continue;
    if (mode === "harden" && state.q[id]?.h && dayKey(state.q[id].h!) === today) hardenedToday++;
    else done++;
  }
  let newDone = 0;
  for (const d of firstSeen.values()) if (d === today) newDone++;

  const learnDaysLeft = today <= s.learnUntil ? daysBetween(today, s.learnUntil) + 1 : 0;
  const daysToTest = daysBetween(today, s.testDate);
  // Spread what was left at the start of today over the days that remain for it.
  const startOfDay = remainingReps + done;
  let target = 0;
  let newTarget = 0;
  if (phase === "learn") {
    target = Math.ceil(startOfDay / Math.max(1, learnDaysLeft));
    newTarget = Math.ceil((notStarted + newDone) / Math.max(1, learnDaysLeft - 1));
  } else if (phase === "harden" || phase === "review") {
    const daysLeft = Math.max(1, daysToTest - (phase === "review" ? 0 : 1));
    target = Math.ceil(startOfDay / daysLeft) + Math.ceil((toHarden + hardenedToday) / daysLeft);
    newTarget = notStarted + newDone;
    done += hardenedToday;
  }
  if (s.dailyGoal && phase !== "test" && phase !== "after") target = s.dailyGoal;
  return { today, phase, daysToTest, remainingReps, target, done, newTarget, newDone, mastered, notStarted, toHarden, learnDaysLeft };
}

export type PlanDay = { day: string; phase: Phase; done: number; attempts: number; target: number | null };

/** One row per day from the first study day (or today) through test day. */
export function planDays(state: State, now = Date.now()): PlanDay[] {
  const s = state.settings;
  const today = dayKey(now);
  const first = state.log.length ? dayKey(state.log[0][0]) : today;
  const start = first < today ? first : today;
  const per = new Map<string, { done: number; attempts: number }>();
  for (const [t, , ok] of state.log) {
    const d = dayKey(t);
    const r = per.get(d) ?? { done: 0, attempts: 0 };
    r.attempts++;
    if (ok) r.done++;
    per.set(d, r);
  }
  const t = planToday(state, now);
  const days: PlanDay[] = [];
  for (let d = start; d <= s.testDate; d = addDays(d, 1)) {
    const phase = phaseOf(d, s);
    const r = per.get(d) ?? { done: 0, attempts: 0 };
    let target: number | null = null;
    if (d === today) target = t.target;
    else if (d > today && phase === "learn") target = Math.ceil(Math.max(0, t.remainingReps - Math.max(0, t.target - t.done)) / Math.max(1, t.learnDaysLeft - 1));
    else if (d > today && (phase === "harden" || phase === "review")) target = Math.ceil(questions.length / 3);
    days.push({ day: d, phase, done: r.done, attempts: r.attempts, target });
  }
  return days;
}

export const PHASE_LABEL: Record<Phase, string> = {
  learn: "Learn and master",
  harden: "Harden",
  review: "Light review",
  test: "Test day",
  after: "After the test",
};

export const PHASE_NOTE: Record<Phase, string> = {
  learn: "Every question to 5 of 5. Start new ones each day and finish what is in progress.",
  harden: "One clean pass over every mastered question. A miss sends it back to 3 of 5.",
  review: "Short pass over the questions you missed most. Sleep early.",
  test: "No new studying. Warm up with two easy questions and go.",
  after: "Done.",
};
