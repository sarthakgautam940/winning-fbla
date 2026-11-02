import { catalog } from "./catalog";
import type { CompEvent, Progress } from "./progress/types";
import { dayKey } from "./progress/store";

// The plan is recomputed from current progress on every view, so it always
// starts from today and never shows stale or overdue tasks.

export type TaskKind = "lesson" | "unit-test" | "practice-test" | "review" | "drill";

export interface PlanTask {
  id: string;
  kind: TaskKind;
  title: string;
  detail: string;
  href: string;
  minutes: number;
  done: boolean;
}

export interface PlanDay {
  date: string;
  tasks: PlanTask[];
}

export interface Plan {
  target: CompEvent | null;
  daysLeft: number | null;
  days: PlanDay[];
  lessonsLeft: number;
  studyDaysLeft: number;
  status: "ahead" | "on-track" | "tight" | "behind" | "complete" | "no-date";
  statusNote: string;
  milestones: { label: string; date: string }[];
}

const DAY = 24 * 60 * 60 * 1000;

export function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function daysBetween(a: Date, b: Date): number {
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((ub - ua) / DAY);
}

export function upcomingEvents(p: Progress, today = new Date()): CompEvent[] {
  return [...p.settings.events].filter((e) => daysBetween(today, parseDate(e.date)) >= 0).sort((a, b) => a.date.localeCompare(b.date));
}

export function targetEvent(p: Progress, today = new Date()): CompEvent | null {
  const upcoming = upcomingEvents(p, today);
  if (p.settings.target) {
    const chosen = upcoming.find((e) => e.id === p.settings.target);
    if (chosen) return chosen;
  }
  return upcoming[0] ?? null;
}

interface Work {
  task: PlanTask;
  weight: number; // in "lesson units"
  unitEnd?: string;
}

function remainingWork(p: Progress): Work[] {
  const work: Work[] = [];
  for (const u of catalog.units) {
    for (const lid of u.lessons) {
      const l = catalog.lessons[lid];
      if (!l || p.lessons[lid]?.done) continue;
      work.push({
        weight: 1,
        task: {
          id: `lesson:${lid}`,
          kind: "lesson",
          title: `Lesson ${l.code}: ${l.title}`,
          detail: l.quiz.length ? `Read, answer the checks, then take the ${l.quiz.length}-question quiz` : "Read and answer the checks",
          href: `/learn/${u.id}/${lid}`,
          minutes: l.minutes + (l.quiz.length ? Math.ceil(l.quiz.length * 0.75) : 0),
          done: false,
        },
      });
    }
    if (u.unitTest && !Object.values(p.sessions).some((s) => s.kind === "unit" && s.ref === u.id)) {
      work.push({
        weight: 0.6,
        unitEnd: u.id,
        task: {
          id: `unit-test:${u.id}`,
          kind: "unit-test",
          title: `Unit ${u.n} test`,
          detail: `${u.unitTest.count} questions in ${u.unitTest.minutes} minutes, then review every miss`,
          href: `/learn/${u.id}/test`,
          minutes: u.unitTest.minutes + 10,
          done: false,
        },
      });
    }
  }
  return work;
}

function practiceTestTasks(p: Progress): PlanTask[] {
  return catalog.practiceTests
    .filter((t) => !Object.values(p.sessions).some((s) => s.kind === "test" && s.ref === t.id))
    .map((t) => ({
      id: `practice-test:${t.id}`,
      kind: "practice-test" as const,
      title: t.title,
      detail: "Full test under real conditions: 100 questions, 50 minutes. Review it the same day.",
      href: `/tests/${t.id}`,
      minutes: 80,
      done: false,
    }));
}

const REVIEW: PlanTask = { id: "review", kind: "review", title: "Mistakes and weak skills", detail: "Redo missed questions, then practice your three weakest skills", href: "/review", minutes: 25, done: false };
const DRILL: PlanTask = { id: "drill", kind: "drill", title: "Speed drill", detail: "20 mixed questions in 10 minutes", href: "/practice/drill", minutes: 12, done: false };

export function buildPlan(p: Progress, today = new Date()): Plan {
  const target = targetEvent(p, today);
  const work = remainingWork(p);
  const tests = practiceTestTasks(p);
  const lessonsLeft = work.filter((w) => w.task.kind === "lesson").length;

  if (!target) {
    return { target: null, daysLeft: null, days: [], lessonsLeft, studyDaysLeft: 0, status: "no-date", statusNote: "Add your next competition date to get a day-by-day plan.", milestones: [] };
  }

  const eventDate = parseDate(target.date);
  const daysLeft = daysBetween(today, eventDate);
  const studyDates: Date[] = [];
  for (let i = 0; i < daysLeft; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    if (p.settings.studyDays.includes(d.getDay())) studyDates.push(d);
  }
  const N = studyDates.length;
  const days: PlanDay[] = studyDates.map((d) => ({ date: dayKey(d), tasks: [] }));
  const milestones: { label: string; date: string }[] = [];

  if (N === 0) {
    return { target, daysLeft, days, lessonsLeft, studyDaysLeft: 0, status: work.length || tests.length ? "behind" : "complete", statusNote: daysLeft <= 0 ? "Competition day. Trust your preparation." : "No study days are left before this event. Adjust your study days in Settings.", milestones };
  }

  // Practice tests: spaced through the final stretch, the last one a few days out.
  const testSlots: number[] = [];
  if (tests.length) {
    const fractions = N >= 20 ? [0.55, 0.7, 0.8, 0.88] : [0.5, 0.65, 0.78, 0.86];
    const last = Math.max(0, N - (N >= 8 ? 3 : 1));
    const picks = tests.length === 1 ? [last] : [...fractions.slice(0, tests.length - 1).map((f) => Math.floor(f * (N - 1))), last];
    for (const k of picks) {
      let slot = Math.min(N - 1, Math.max(0, k));
      while (testSlots.includes(slot) && slot < N - 1) slot += 1;
      testSlots.push(slot);
    }
  }
  tests.forEach((t, i) => {
    const slot = testSlots[i];
    if (slot === undefined) return;
    days[slot].tasks.push(t);
    milestones.push({ label: t.title, date: days[slot].date });
  });

  // Lessons and unit tests: spread evenly over learning days (about the first
  // 85 percent of the time), skipping practice-test days.
  const learnEnd = Math.max(1, Math.min(N, Math.ceil(N * 0.85)));
  const learnDays = days.slice(0, learnEnd).filter((_, i) => !testSlots.includes(i));
  const totalWeight = work.reduce((s, w) => s + w.weight, 0);
  const perDay = learnDays.length ? totalWeight / learnDays.length : totalWeight;
  let dayIdx = 0;
  let filled = 0;
  for (const w of work) {
    if (!learnDays.length) break;
    if (filled + w.weight > Math.max(perDay, 1) + 0.25 && dayIdx < learnDays.length - 1) {
      dayIdx += 1;
      filled = 0;
    }
    learnDays[dayIdx].tasks.push(w.task);
    filled += w.weight;
    if (w.unitEnd) milestones.push({ label: `Finish Unit ${catalog.units.find((u) => u.id === w.unitEnd)?.n}`, date: learnDays[dayIdx].date });
  }

  // Remaining days: review, drills, and mixed practice.
  days.forEach((d, i) => {
    const hasTest = d.tasks.some((t) => t.kind === "practice-test");
    if (!d.tasks.length) d.tasks.push(i % 2 ? { ...DRILL, id: `drill:${d.date}` } : { ...REVIEW, id: `review:${d.date}` });
    else if (!hasTest && i >= learnEnd) d.tasks.push({ ...REVIEW, id: `review:${d.date}` });
  });
  milestones.push({ label: target.name, date: target.date });
  milestones.sort((a, b) => a.date.localeCompare(b.date));

  const minutesPerDay = Math.max(15, p.settings.minutesPerDay);
  const needPerDay = learnDays.length ? (work.reduce((s, w) => s + w.task.minutes, 0) / learnDays.length) : 0;
  let status: Plan["status"];
  let statusNote: string;
  if (!work.length && !tests.length) {
    status = "complete";
    statusNote = "Every lesson and test is done. Keep your edge with review, drills, and flashcards.";
  } else if (needPerDay <= minutesPerDay * 0.7) {
    status = "ahead";
    statusNote = `About ${Math.round(needPerDay)} minutes a day finishes the course with time for every practice test.`;
  } else if (needPerDay <= minutesPerDay) {
    status = "on-track";
    statusNote = `About ${Math.round(needPerDay)} minutes a day keeps you on schedule.`;
  } else if (needPerDay <= minutesPerDay * 1.5) {
    status = "tight";
    statusNote = `This needs about ${Math.round(needPerDay)} minutes a day, more than the ${minutesPerDay} you set. Add a little time or a study day.`;
  } else {
    status = "behind";
    statusNote = `This needs about ${Math.round(needPerDay)} minutes a day. Add study days, or prioritize the larger areas (Data Literacy, Statistics, Data Analysis) first.`;
  }

  return { target, daysLeft, days, lessonsLeft, studyDaysLeft: N, status, statusNote, milestones };
}
