"use client";

import { useSyncExternalStore } from "react";
import type { Engine } from "./engine";

// Progress lives in this browser (localStorage). Settings has Export and Import so it can
// be backed up or moved to another device.

/** Per-question progress. */
export type QS = {
  /** correct answers toward mastery (0..5) */
  c: number;
  /** attempts */
  n: number;
  /** wrong answers */
  w: number;
  /** last answered (ms) */
  t: number;
  /** first attempt was correct (1) or wrong (0) */
  f?: 0 | 1;
  /** mastered at (ms) */
  m?: number;
  /** passed the final hardening check at (ms) */
  h?: number;
  /** last answer was wrong */
  lw?: 1;
  /** bookmarked */
  bm?: 1;
};

/** [time, question id, correct, ms spent, response, mode] */
export type LogRow = [number, string, 0 | 1, number, string, string];

export type Settings = {
  testDate: string;
  learnUntil: string;
  dailyGoal: number | null;
  hideTimer: boolean;
};

export type Scope = { kind: "plan" | "section" | "category" | "sub" | "missed" | "bookmarked" | "harden" | "custom"; value?: string; label: string; start?: string };

export type SavedSession = { scope: Scope; engine: Engine; startedAt: number; answered: number; correct: number };

export type State = {
  v: 1;
  q: Record<string, QS>;
  log: LogRow[];
  settings: Settings;
  session: SavedSession | null;
};

export const DEFAULT_SETTINGS: Settings = {
  testDate: "2026-12-05",
  learnUntil: "2026-12-01",
  dailyGoal: null,
  hideTimer: false,
};

const KEY = "sat-bank-v1";

function fresh(): State {
  return { v: 1, q: {}, log: [], settings: { ...DEFAULT_SETTINGS }, session: null };
}

const EMPTY: State = fresh();
let current: State | null = null;
const listeners = new Set<() => void>();

function load(): State {
  if (current) return current;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      current = { ...fresh(), ...parsed, settings: { ...DEFAULT_SETTINGS, ...parsed.settings } };
      return current;
    }
  } catch {
    // storage blocked or corrupt: start fresh in memory
  }
  current = fresh();
  return current;
}

function save(s: State) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // quota or private mode: progress stays in memory for this tab
  }
}

function emit() {
  for (const l of listeners) l();
}

export function getState(): State {
  return typeof window === "undefined" ? EMPTY : load();
}

/** Apply a change to a copy of the state, save it, and notify subscribers. */
export function update(fn: (draft: State) => void) {
  const base = load();
  const draft: State = structuredClone(base);
  fn(draft);
  current = draft;
  save(draft);
  emit();
}

export function replaceState(next: State) {
  current = { ...fresh(), ...next, settings: { ...DEFAULT_SETTINGS, ...next.settings } };
  save(current);
  emit();
}

export function resetState() {
  current = fresh();
  save(current);
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      current = null;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useStore(): State {
  return useSyncExternalStore(subscribe, getState, () => EMPTY);
}

/** True after hydration, so pages can avoid flashing empty progress. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function qs(state: State, id: string): QS {
  return state.q[id] ?? { c: 0, n: 0, w: 0, t: 0 };
}
