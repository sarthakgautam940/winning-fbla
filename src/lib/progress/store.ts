"use client";

import { useSyncExternalStore } from "react";
import type { Letter } from "@/lib/content-types";
import type { ActiveSession, Attempt, CardState, CompEvent, Progress, SessionRecord, Settings } from "./types";

// All progress lives in one versioned document in localStorage. Every write
// goes through `update`, which keeps the document immutable so React can
// compare snapshots cheaply.

const KEY = "wf-progress-v1";
const DAY = 24 * 60 * 60 * 1000;

export const DEFAULT_EVENTS: CompEvent[] = [
  {
    id: "regional",
    name: "Regional conference",
    date: "2027-02-15",
    level: "regional",
    confirmed: false,
    note: "Estimate. Virginia regions usually test between mid-February and mid-March. Set the real date when your adviser announces it.",
  },
  {
    id: "state",
    name: "State Leadership Conference",
    date: "2027-04-09",
    level: "state",
    confirmed: false,
    note: "Estimate. Virginia's SLC has been held in early to mid April in Reston. Update it when the 2027 date is published.",
  },
  {
    id: "nlc",
    name: "National Leadership Conference",
    date: "2027-06-23",
    level: "national",
    confirmed: true,
    note: "Columbus, Ohio, June 23 to 26, 2027.",
  },
];

export function defaultSettings(): Settings {
  return {
    theme: "light",
    events: DEFAULT_EVENTS,
    target: null,
    studyDays: [1, 2, 3, 4, 5, 6],
    minutesPerDay: 45,
    at: 0,
  };
}

export function emptyProgress(): Progress {
  return {
    v: 1,
    createdAt: Date.now(),
    attempts: [],
    sessions: {},
    active: {},
    lessons: {},
    saved: {},
    notes: {},
    cards: {},
    study: {},
    settings: defaultSettings(),
  };
}

const SERVER_SNAPSHOT: Progress = Object.freeze({ ...emptyProgress(), createdAt: 0 }) as Progress;

export function uid(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function dayKey(t: number | Date = Date.now()): string {
  const d = typeof t === "number" ? new Date(t) : t;
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function normalize(raw: unknown): Progress {
  const base = emptyProgress();
  if (!raw || typeof raw !== "object") return base;
  const p = raw as Partial<Progress>;
  return {
    v: 1,
    createdAt: typeof p.createdAt === "number" ? p.createdAt : base.createdAt,
    attempts: Array.isArray(p.attempts) ? p.attempts : [],
    sessions: p.sessions && typeof p.sessions === "object" ? p.sessions : {},
    active: p.active && typeof p.active === "object" ? p.active : {},
    lessons: p.lessons && typeof p.lessons === "object" ? p.lessons : {},
    saved: p.saved && typeof p.saved === "object" ? p.saved : {},
    notes: p.notes && typeof p.notes === "object" ? p.notes : {},
    cards: p.cards && typeof p.cards === "object" ? p.cards : {},
    study: p.study && typeof p.study === "object" ? p.study : {},
    settings: { ...base.settings, ...(p.settings ?? {}) },
  };
}

let state: Progress | null = null;
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function read(): Progress {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? normalize(JSON.parse(raw)) : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

function flush() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (!state) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked: progress stays in memory for this visit.
  }
}

function ensure(): Progress {
  if (state) return state;
  state = read();
  if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
      if (e.key !== KEY) return;
      state = read();
      listeners.forEach((l) => l());
    });
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flush();
    });
  }
  return state;
}

export function getProgress(): Progress {
  return typeof window === "undefined" ? SERVER_SNAPSHOT : ensure();
}

export function update(fn: (p: Progress) => Progress): void {
  state = fn(ensure());
  listeners.forEach((l) => l());
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 300);
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useProgress(): Progress {
  return useSyncExternalStore(subscribe, getProgress, () => SERVER_SNAPSHOT);
}

// True once the client has read local storage (avoids flashing empty states).
export function useReady(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

// ------------------------------------------------------------------ actions

export function recordAttempt(a: Omit<Attempt, "id" | "at"> & { at?: number }): Attempt {
  const attempt: Attempt = { id: uid(), at: a.at ?? Date.now(), ...a };
  update((p) => ({ ...p, attempts: [...p.attempts, attempt] }));
  return attempt;
}

export function recordAttempts(list: Omit<Attempt, "id">[]): void {
  update((p) => ({ ...p, attempts: [...p.attempts, ...list.map((a) => ({ id: uid(), ...a }))] }));
}

export function saveSession(s: SessionRecord): void {
  update((p) => ({ ...p, sessions: { ...p.sessions, [s.id]: s } }));
}

export function setActive(s: ActiveSession): void {
  update((p) => ({ ...p, active: { ...p.active, [s.key]: { ...s, updatedAt: Date.now() } } }));
}

export function clearActive(key: string): void {
  update((p) => {
    if (!p.active[key]) return p;
    const active = { ...p.active };
    delete active[key];
    return { ...p, active };
  });
}

export function markSection(lessonId: string, sectionId: string): void {
  update((p) => {
    const cur = p.lessons[lessonId] ?? { seen: [], at: 0 };
    if (cur.seen.includes(sectionId)) return p;
    return { ...p, lessons: { ...p.lessons, [lessonId]: { ...cur, seen: [...cur.seen, sectionId], at: Date.now() } } };
  });
}

export function completeLesson(lessonId: string): void {
  update((p) => {
    const cur = p.lessons[lessonId] ?? { seen: [], at: 0 };
    if (cur.done) return p;
    return { ...p, lessons: { ...p.lessons, [lessonId]: { ...cur, done: Date.now(), at: Date.now() } } };
  });
}

export function toggleSaved(qid: string): void {
  update((p) => {
    const on = !p.saved[qid]?.on;
    return { ...p, saved: { ...p.saved, [qid]: { on, at: Date.now() } } };
  });
}

export function setNote(qid: string, text: string): void {
  update((p) => ({ ...p, notes: { ...p.notes, [qid]: { text, at: Date.now() } } }));
}

const BOX_DAYS = [0, 1, 3, 7, 14, 30];

export function reviewCard(cardId: string, got: boolean): void {
  update((p) => {
    const prev: CardState | undefined = p.cards[cardId];
    const box = got ? Math.min(5, (prev?.box ?? 0) + 1) : 1;
    const now = Date.now();
    const next: CardState = {
      box,
      due: got ? now + BOX_DAYS[box] * DAY : now + 10 * 60 * 1000,
      reps: (prev?.reps ?? 0) + 1,
      lapses: (prev?.lapses ?? 0) + (got ? 0 : 1),
      last: got ? "got" : "missed",
      at: now,
    };
    return { ...p, cards: { ...p.cards, [cardId]: next } };
  });
}

export function addStudyTime(ms: number): void {
  if (ms <= 0) return;
  const key = dayKey();
  update((p) => ({ ...p, study: { ...p.study, [key]: (p.study[key] ?? 0) + ms } }));
}

export function updateSettings(patch: Partial<Settings>): void {
  update((p) => ({ ...p, settings: { ...p.settings, ...patch, at: Date.now() } }));
}

export function resetProgress(): void {
  update((p) => ({ ...emptyProgress(), settings: p.settings }));
  flush();
}

// Merge two documents (import or another device). Attempts and finished
// sessions are append-only, so a union is always safe; everything else keeps
// the most recent write.
export function mergeProgress(a: Progress, b: Progress): Progress {
  const attempts = new Map<string, Attempt>();
  for (const x of [...a.attempts, ...b.attempts]) attempts.set(x.id, x);
  const newer = <T extends { at: number }>(x: Record<string, T>, y: Record<string, T>): Record<string, T> => {
    const out: Record<string, T> = { ...x };
    for (const [k, v] of Object.entries(y)) if (!out[k] || v.at > out[k].at) out[k] = v;
    return out;
  };
  const active: Record<string, ActiveSession> = { ...a.active };
  for (const [k, v] of Object.entries(b.active)) if (!active[k] || v.updatedAt > active[k].updatedAt) active[k] = v;
  for (const k of Object.keys(active)) if (a.sessions[active[k].id] || b.sessions[active[k].id]) delete active[k];
  const lessons: Progress["lessons"] = { ...a.lessons };
  for (const [k, v] of Object.entries(b.lessons)) {
    const cur = lessons[k];
    lessons[k] = cur
      ? { seen: [...new Set([...cur.seen, ...v.seen])], done: cur.done && v.done ? Math.min(cur.done, v.done) : (cur.done ?? v.done), at: Math.max(cur.at, v.at) }
      : v;
  }
  const study: Record<string, number> = { ...a.study };
  for (const [k, v] of Object.entries(b.study)) study[k] = Math.max(study[k] ?? 0, v);
  return {
    v: 1,
    createdAt: Math.min(a.createdAt, b.createdAt),
    attempts: [...attempts.values()].sort((x, y) => x.at - y.at),
    sessions: { ...a.sessions, ...b.sessions },
    active,
    lessons,
    saved: newer(a.saved, b.saved),
    notes: newer(a.notes, b.notes),
    cards: newer(a.cards, b.cards),
    study,
    settings: b.settings.at > a.settings.at ? b.settings : a.settings,
  };
}

export function importProgress(json: string): { ok: boolean; message: string } {
  try {
    const incoming = normalize(JSON.parse(json));
    update((p) => mergeProgress(p, incoming));
    flush();
    return { ok: true, message: `Imported ${incoming.attempts.length} answers and merged them with this device.` };
  } catch {
    return { ok: false, message: "That file is not a Winning FBLA progress export." };
  }
}

export function exportProgress(): string {
  return JSON.stringify(ensure(), null, 0);
}

export function lastAnswer(p: Progress, qid: string): Letter | null | undefined {
  for (let i = p.attempts.length - 1; i >= 0; i--) if (p.attempts[i].q === qid) return p.attempts[i].c;
  return undefined;
}
