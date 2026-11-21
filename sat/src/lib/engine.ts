// The mastery scheduler.
//
// A question is mastered after 5 correct answers. A wrong answer never counts toward the 5.
// Within a session the scheduler keeps a small working set of questions and spaces their
// repeats so that a question never shows twice in a row or right after itself, but always
// comes back within a bounded number of steps:
//
//   after a wrong answer        it returns after 2 other questions
//   after correct answer 1..4   it returns after 3, 5, 8, then 12 other questions
//
// The working set starts at WINDOW questions and grows (up to MAX_WINDOW) only when nothing
// in it is due, so the gaps are honored and even the longest one stays near. All state is
// plain data, so a session survives reloads.

export const TARGET = 5;
export const WINDOW = 6;
/** Steps until the next showing after correct answer number k (index = corrects so far). */
export const GAP_CORRECT = [0, 4, 6, 9, 13, 13];
/** Steps until the next showing after a wrong answer. */
export const GAP_WRONG = 3;

export type Slot = {
  id: string;
  /** Step at which the question may show again. */
  due: number;
  /** Correct answers still needed in this session. */
  left: number;
  /** Times shown in this session. */
  seen: number;
};

export type Engine = {
  pool: string[];
  active: Slot[];
  step: number;
  recent: string[];
  done: string[];
  window: number;
};

export type Need = (id: string) => number;

let rand: () => number = Math.random;
/** Tests can make the shuffle repeatable. */
export function setRandom(fn: () => number) {
  rand = fn;
}

/** Start a session. pool is in priority order; need(id) is how many correct answers it still needs. */
export function createEngine(pool: string[], need: Need, window = WINDOW): Engine {
  const seen = new Set<string>();
  const clean = pool.filter((id) => {
    if (seen.has(id) || need(id) <= 0) return false;
    seen.add(id);
    return true;
  });
  return { pool: clean, active: [], step: 0, recent: [], done: [], window };
}

function fill(e: Engine, need: Need, limit: number) {
  while (e.active.length < limit && e.pool.length) {
    const id = e.pool.shift()!;
    const left = need(id);
    if (left > 0) e.active.push({ id, due: e.step, left, seen: 0 });
    else e.done.push(id);
  }
}

/** Upper bound on the working set, so every question comes back within about a dozen steps. */
export const MAX_WINDOW = 12;

/** Choose the next question, or null when the session is complete. Mutates e. */
export function nextQuestion(e: Engine, need: Need): string | null {
  fill(e, need, e.window);
  if (e.active.length === 0) return null;

  // Never repeat the last question; avoid the last two when there is room.
  const block = e.active.length >= 3 ? 2 : e.active.length === 2 ? 1 : 0;
  const recent = block ? e.recent.slice(-block) : [];
  let candidates = e.active.filter((s) => !recent.includes(s.id));
  if (candidates.length === 0) candidates = e.active;

  let due = candidates.filter((s) => s.due <= e.step);
  if (!due.length && e.pool.length && e.active.length < MAX_WINDOW) {
    // Nothing is due yet: bring in a new question rather than repeat one early.
    fill(e, need, e.active.length + 1);
    due = e.active.filter((s) => s.due <= e.step && !recent.includes(s.id));
  }
  const pool = due.length ? due : candidates;
  pool.sort((a, b) => a.due - b.due || a.seen - b.seen || b.left - a.left);
  // Among questions that came due at about the same time, pick at random so the order
  // never settles into a pattern you could learn instead of the questions.
  const near = pool.filter((s) => s.due <= pool[0].due + 2);
  return near[Math.floor(rand() * near.length)].id;
}

/** Record an answer for id. newLeft is how many correct answers it still needs afterward. */
export function recordAnswer(e: Engine, id: string, ok: boolean, correctSoFar: number, newLeft: number): Engine {
  e.step += 1;
  e.recent.push(id);
  if (e.recent.length > 4) e.recent.shift();
  const i = e.active.findIndex((s) => s.id === id);
  if (i < 0) return e;
  const slot = e.active[i];
  slot.seen += 1;
  slot.left = newLeft;
  if (newLeft <= 0) {
    e.active.splice(i, 1);
    e.done.push(id);
    return e;
  }
  const gap = ok ? GAP_CORRECT[Math.min(Math.max(correctSoFar, 1), GAP_CORRECT.length - 1)] : GAP_WRONG;
  slot.due = e.step + gap - 1;
  return e;
}

export function remaining(e: Engine): number {
  return e.pool.length + e.active.length;
}
