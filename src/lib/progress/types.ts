import type { Letter } from "@/lib/content-types";

// Where an answer was given. Analytics treat all modes alike except that
// "test" answers have no feedback until the end.
export type Mode = "check" | "quiz" | "unit" | "test" | "bank" | "drill" | "review";

export interface Attempt {
  id: string;
  q: string; // question id
  c: Letter | null; // chosen letter (null = left blank)
  ok: boolean;
  ms: number; // time spent on the question
  at: number; // epoch ms
  m: Mode;
  s?: string; // session id
}

export type SessionKind = "quiz" | "unit" | "test" | "drill" | "practice";

export interface SessionRecord {
  id: string;
  kind: SessionKind;
  ref: string; // lesson id, unit id, practice test id, or a label
  title: string;
  startedAt: number;
  finishedAt: number;
  questions: string[];
  answers: Record<string, Letter | null>;
  flags?: Record<string, string>; // practice-test challenge comments
  correct: number;
  total: number;
  ms: number; // active time used
  limitMs?: number;
  paused?: boolean;
}

export interface ActiveSession {
  key: string; // `${kind}:${ref}`
  id: string;
  kind: SessionKind;
  ref: string;
  title: string;
  questions: string[];
  answers: Record<string, Letter | null>;
  marks: string[];
  flags: Record<string, string>;
  index: number;
  startedAt: number;
  usedMs: number; // time used before the current resume
  resumedAt: number | null; // null while paused
  limitMs?: number;
  perQ: Record<string, number>;
  paused?: boolean;
  owner?: string; // which page load is driving it; another owner means "offer to resume"
  updatedAt: number;
}

export interface LessonState {
  seen: string[]; // section ids scrolled through
  done?: number; // when the lesson was finished
  at: number;
}

export interface CardState {
  box: number; // Leitner box 1-5
  due: number; // epoch ms
  reps: number;
  lapses: number;
  last: "got" | "missed";
  at: number;
}

export interface CompEvent {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  level: "regional" | "state" | "national" | "other";
  confirmed: boolean;
  note?: string;
}

export interface Settings {
  theme: "system" | "light" | "dark";
  events: CompEvent[];
  target: string | null; // event id the plan aims at
  studyDays: number[]; // 0 = Sunday
  minutesPerDay: number;
  at: number;
}

export interface Progress {
  v: 1;
  createdAt: number;
  attempts: Attempt[];
  sessions: Record<string, SessionRecord>;
  active: Record<string, ActiveSession>;
  lessons: Record<string, LessonState>;
  saved: Record<string, { on: boolean; at: number }>;
  notes: Record<string, { text: string; at: number }>;
  cards: Record<string, CardState>;
  study: Record<string, number>; // YYYY-MM-DD -> ms of reading time
  settings: Settings;
}
