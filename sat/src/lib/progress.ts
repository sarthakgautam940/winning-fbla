"use client";

import { TARGET } from "./engine";
import { qs, update, type State } from "./store";

export type Mode = "learn" | "harden";

/** How many correct answers a question still needs in this mode. */
export function needFor(state: State, id: string, mode: Mode): number {
  const q = qs(state, id);
  if (mode === "harden") return q.c >= TARGET ? (q.h ? 0 : 1) : TARGET - q.c;
  return Math.max(0, TARGET - q.c);
}

/**
 * Save one answer. Learning: a correct answer adds one toward the five. Hardening (the
 * final check on mastered questions): a correct answer passes the check; a wrong one drops
 * the question back to 3 of 5, so it has to be earned again.
 */
export function recordAttempt(id: string, ok: boolean, ms: number, response: string, mode: Mode) {
  const now = Date.now();
  update((s) => {
    const q = { ...qs(s, id) };
    q.n += 1;
    q.t = now;
    if (q.f === undefined) q.f = ok ? 1 : 0;
    if (ok) {
      delete q.lw;
      if (mode === "harden" && q.c >= TARGET) {
        q.h = now;
      } else {
        q.c = Math.min(TARGET, q.c + 1);
        if (q.c >= TARGET) {
          q.m = q.m ?? now;
          if (mode === "harden") q.h = now;
        }
      }
    } else {
      q.w += 1;
      q.lw = 1;
      if (mode === "harden" && q.c >= TARGET) {
        q.c = 3;
        delete q.m;
        delete q.h;
      }
    }
    s.q[id] = q;
    s.log.push([now, id, ok ? 1 : 0, Math.round(ms), response, mode]);
  });
}

export function toggleBookmark(id: string) {
  update((s) => {
    const q = { ...qs(s, id) };
    if (q.bm) delete q.bm;
    else q.bm = 1;
    s.q[id] = q;
  });
}
