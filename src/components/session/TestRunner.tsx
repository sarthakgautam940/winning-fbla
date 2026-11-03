"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Calculator as CalcIcon, ChevronLeft, ChevronRight, Flag, Grid3x3, Pause, Play, X } from "lucide-react";
import type { Letter, QuestionContent } from "@/lib/content-types";
import { LETTERS } from "@/lib/content-types";
import { Figure } from "@/components/figures/Figure";
import { Options } from "@/components/question/Options";
import { Button, cn, Rich } from "@/components/ui/primitives";
import { clearActive, completeLesson, getProgress, recordAttempts, saveSession, setActive, uid, useProgress, useReady } from "@/lib/progress/store";
import type { ActiveSession, Mode, SessionKind } from "@/lib/progress/types";
import { Calculator } from "./Calculator";

export interface RunnerProps {
  kind: SessionKind;
  refId: string;
  title: string;
  questions: QuestionContent[];
  limitMs?: number;
  exitHref: string;
  realistic?: boolean; // practice tests: FBLA-style flag with a comment box
  lessonId?: string; // quizzes mark their lesson complete on submit
}

const MODE: Record<SessionKind, Mode> = { quiz: "quiz", unit: "unit", test: "test", drill: "drill", practice: "bank" };

// Identifies this page load. A saved attempt owned by a different page load
// is an earlier, unfinished attempt: the student chooses to resume or restart.
const PAGE_LOAD = Math.random().toString(36).slice(2);

function clock(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

export function TestRunner({ kind, refId, title, questions, limitMs, exitHref, realistic, lessonId }: RunnerProps) {
  const router = useRouter();
  const ready = useReady();
  const progress = useProgress();
  const owner = `${PAGE_LOAD}${useId()}`;
  const key = `${kind}:${refId}`;
  const ids = useMemo(() => questions.map((q) => q.id), [questions]);

  const stored = ready ? progress.active[key] : undefined;
  const sameSet = !!stored && stored.questions.join() === ids.join();
  const session = sameSet && stored.owner === owner ? stored : null;
  const resumeOffer = sameSet && stored.owner !== owner ? stored : null;

  const [now, setNow] = useState(0);
  const [showMap, setShowMap] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [flagOpen, setFlagOpen] = useState(false);
  const [hideTimer, setHideTimer] = useState(false);
  const [out, setOut] = useState<Record<string, Letter[]>>({});
  const switchedAt = useRef(0);
  const submitted = useRef(false);

  const start = useCallback(() => {
    const t = Date.now();
    switchedAt.current = t;
    setActive({ key, id: uid(), kind, ref: refId, title, questions: ids, answers: {}, marks: [], flags: {}, index: 0, startedAt: t, usedMs: 0, resumedAt: t, limitMs, perQ: {}, owner, updatedAt: t });
  }, [key, kind, refId, title, ids, limitMs, owner]);

  // A new attempt starts on its own unless an earlier one is waiting.
  useEffect(() => {
    if (!ready || submitted.current) return;
    const live = getProgress().active[key];
    if (!live || live.questions.join() !== ids.join()) start();
  }, [ready, key, ids, start]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const resume = (s: ActiveSession) => {
    const t = Date.now();
    switchedAt.current = t;
    setActive({ ...s, owner, resumedAt: s.paused ? null : t });
  };

  const elapsed = session?.resumedAt && now ? Math.max(0, now - session.resumedAt) : 0;
  const used = session ? session.usedMs + elapsed : 0;
  const remaining = limitMs ? limitMs - used : null;
  const paused = !!session && session.resumedAt === null;

  const finish = useCallback(() => {
    if (!session || submitted.current) return;
    submitted.current = true;
    const t = Date.now();
    const perQ = { ...session.perQ };
    const cur = session.questions[session.index];
    if (session.resumedAt) perQ[cur] = (perQ[cur] ?? 0) + (t - switchedAt.current);
    const usedMs = session.usedMs + (session.resumedAt ? t - session.resumedAt : 0);
    let correct = 0;
    const attempts = questions.map((q) => {
      const c = session.answers[q.id] ?? null;
      const ok = c === q.answer;
      if (ok) correct += 1;
      return { q: q.id, c, ok, ms: Math.round(perQ[q.id] ?? 0), at: t, m: MODE[kind], s: session.id };
    });
    recordAttempts(attempts);
    saveSession({
      id: session.id,
      kind,
      ref: refId,
      title,
      startedAt: session.startedAt,
      finishedAt: t,
      questions: session.questions,
      answers: session.answers,
      flags: Object.keys(session.flags).length ? session.flags : undefined,
      correct,
      total: questions.length,
      ms: Math.min(usedMs, limitMs ?? usedMs),
      limitMs,
      paused: session.paused,
    });
    if (lessonId) completeLesson(lessonId);
    clearActive(key);
    router.replace(`/report?s=${session.id}`);
  }, [session, questions, kind, refId, title, limitMs, lessonId, key, router]);

  // Auto-submit at 0:00, as the real platform does.
  useEffect(() => {
    if (remaining !== null && remaining <= 0 && session && !paused && now) finish();
  }, [remaining, session, paused, now, finish]);

  const go = useCallback(
    (i: number) => {
      if (!session) return;
      const t = Date.now();
      const cur = session.questions[session.index];
      const perQ = { ...session.perQ };
      if (session.resumedAt) perQ[cur] = (perQ[cur] ?? 0) + (t - (switchedAt.current || t));
      switchedAt.current = t;
      setActive({ ...session, index: Math.max(0, Math.min(session.questions.length - 1, i)), perQ });
      setFlagOpen(false);
    },
    [session],
  );

  const choose = useCallback(
    (l: Letter) => {
      if (!session || paused) return;
      const q = session.questions[session.index];
      setActive({ ...session, answers: { ...session.answers, [q]: session.answers[q] === l ? null : l } });
    },
    [session, paused],
  );

  const toggleMark = useCallback(() => {
    if (!session) return;
    const q = session.questions[session.index];
    setActive({ ...session, marks: session.marks.includes(q) ? session.marks.filter((x) => x !== q) : [...session.marks, q] });
  }, [session]);

  const togglePause = () => {
    if (!session) return;
    const t = Date.now();
    if (session.resumedAt) {
      const cur = session.questions[session.index];
      setActive({ ...session, usedMs: session.usedMs + (t - session.resumedAt), resumedAt: null, paused: true, perQ: { ...session.perQ, [cur]: (session.perQ[cur] ?? 0) + (t - (switchedAt.current || t)) } });
    } else {
      switchedAt.current = t;
      setActive({ ...session, resumedAt: t });
    }
  };

  const exit = () => {
    if (session?.resumedAt) {
      const t = Date.now();
      setActive({ ...session, usedMs: session.usedMs + (t - session.resumedAt), resumedAt: null, paused: !!limitMs });
    }
    router.push(exitHref);
  };

  // Keyboard: A to D choose, arrows move, M marks.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!session || confirm || flagOpen || showMap) return;
      const tgt = e.target as HTMLElement | null;
      if (tgt && (tgt.tagName === "INPUT" || tgt.tagName === "TEXTAREA" || tgt.closest('[role="dialog"]'))) return;
      const k = e.key.toUpperCase();
      const i = ["A", "B", "C", "D"].indexOf(k);
      if (i >= 0) choose(LETTERS[i]);
      else if (e.key === "ArrowRight") go(session.index + 1);
      else if (e.key === "ArrowLeft") go(session.index - 1);
      else if (k === "M") toggleMark();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [session, confirm, flagOpen, showMap, choose, go, toggleMark]);

  if (resumeOffer) {
    const answered = Object.values(resumeOffer.answers).filter(Boolean).length;
    return (
      <Overlay>
        <div className="mx-auto mt-[18vh] max-w-md px-5 text-center">
          <h1 className="text-[22px] font-semibold text-ink">{title}</h1>
          <p className="mt-2 text-[15px] text-ink-2">
            You have an unfinished attempt: {answered} of {resumeOffer.questions.length} answered
            {resumeOffer.limitMs ? `, ${clock(resumeOffer.limitMs - resumeOffer.usedMs)} left` : ""}.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button variant="primary" onClick={() => resume(resumeOffer)}>
              Resume
            </Button>
            <Button onClick={start}>Start over</Button>
          </div>
        </div>
      </Overlay>
    );
  }
  if (!session) return <Overlay />;

  const q = questions[session.index];
  const chosen = session.answers[q.id] ?? null;
  const marked = session.marks.includes(q.id);
  const answeredCount = session.questions.filter((id) => session.answers[id]).length;
  const unanswered = session.questions.length - answeredCount;
  const low = remaining !== null && remaining < 5 * 60 * 1000;

  return (
    <Overlay>
      {/* Top bar */}
      <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-3 sm:px-5">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-ink">{title}</p>
          <p className="text-[12.5px] text-ink-3">
            Question {session.index + 1} of {questions.length}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setHideTimer((h) => !h)}
            className={cn("tnum rounded-[8px] px-2.5 py-1.5 text-[15px] font-semibold", low ? "text-bad" : "text-ink")}
            aria-label={hideTimer ? "Show timer" : "Hide timer"}
            title={hideTimer ? "Show timer" : "Hide timer"}
          >
            {hideTimer ? "Show time" : remaining !== null ? clock(remaining) : clock(used)}
          </button>
          <Button variant="ghost" size="sm" onClick={togglePause} aria-label={paused ? "Resume" : "Pause"} title={realistic ? "The real test cannot be paused" : undefined}>
            {paused ? <Play size={15} /> : <Pause size={15} />}
            <span className="hidden sm:inline">{paused ? "Resume" : "Pause"}</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowCalc((v) => !v)} aria-pressed={showCalc}>
            <CalcIcon size={15} />
            <span className="hidden sm:inline">Calculator</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={exit} aria-label="Save and exit">
            <X size={16} />
            <span className="hidden sm:inline">Exit</span>
          </Button>
        </div>
      </div>

      {/* Question */}
      <div className="scrollbar-thin flex-1 overflow-y-auto">
        {paused ? (
          <div className="mx-auto mt-[16vh] max-w-sm px-5 text-center">
            <p className="text-[18px] font-semibold text-ink">Paused</p>
            <p className="mt-1.5 text-[14.5px] text-ink-2">The clock is stopped and the question is hidden.{realistic ? " The real test cannot be paused, so use this sparingly." : ""}</p>
            <Button variant="primary" className="mt-5" onClick={togglePause}>
              Resume
            </Button>
          </div>
        ) : (
          <div className="mx-auto max-w-[760px] px-5 pb-10 pt-8 sm:pt-10">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="tnum text-[13px] font-semibold text-ink-3">{session.index + 1}.</span>
              <button
                type="button"
                onClick={toggleMark}
                className={cn("inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[12.5px] font-medium transition-colors", marked ? "border-warn-line bg-warn-soft text-warn" : "border-line text-ink-3 hover:text-ink")}
                aria-pressed={marked}
                title="Your own reminder to come back (M)"
              >
                <Bookmark size={13} fill={marked ? "currentColor" : "none"} />
                {marked ? "Marked to revisit" : "Mark to revisit"}
              </button>
              {realistic ? (
                <button
                  type="button"
                  onClick={() => setFlagOpen((v) => !v)}
                  className={cn("inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[12.5px] font-medium transition-colors", session.flags[q.id] !== undefined ? "border-bad-line bg-bad-soft text-bad" : "border-line text-ink-3 hover:text-ink")}
                  aria-pressed={session.flags[q.id] !== undefined}
                  title="Flag a question you believe is flawed, as on the real test"
                >
                  <Flag size={13} />
                  {session.flags[q.id] !== undefined ? "Flagged" : "Flag for review"}
                </button>
              ) : null}
            </div>
            {flagOpen && realistic ? (
              <FlagBox
                key={q.id}
                initial={session.flags[q.id] ?? "please review"}
                flagged={session.flags[q.id] !== undefined}
                onSave={(v) => {
                  setActive({ ...session, flags: { ...session.flags, [q.id]: v } });
                  setFlagOpen(false);
                }}
                onRemove={() => {
                  const flags = { ...session.flags };
                  delete flags[q.id];
                  setActive({ ...session, flags });
                  setFlagOpen(false);
                }}
              />
            ) : null}
            <Rich html={q.stem} className="q-stem" />
            {q.figure ? <Figure spec={q.figure} /> : null}
            <div className="mt-6">
              <Options
                name={`Question ${session.index + 1}`}
                options={q.options}
                selected={chosen}
                onSelect={choose}
                size="lg"
                eliminated={realistic ? [] : (out[q.id] ?? [])}
                onToggleEliminate={realistic ? undefined : (l) => setOut((o) => ({ ...o, [q.id]: (o[q.id] ?? []).includes(l) ? (o[q.id] ?? []).filter((x) => x !== l) : [...(o[q.id] ?? []), l] }))}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-t border-line bg-surface px-3 sm:px-5">
        <Button onClick={() => go(session.index - 1)} disabled={session.index === 0 || paused}>
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Previous</span>
        </Button>
        <Button variant="ghost" onClick={() => setShowMap(true)} disabled={paused}>
          <Grid3x3 size={16} />
          <span className="tnum">
            {answeredCount}/{questions.length} answered
          </span>
        </Button>
        {session.index < questions.length - 1 ? (
          <Button variant="primary" onClick={() => go(session.index + 1)} disabled={paused}>
            <span className="hidden sm:inline">Next</span>
            <ChevronRight size={16} />
          </Button>
        ) : (
          <Button variant="primary" onClick={() => setConfirm(true)} disabled={paused}>
            Review and submit
          </Button>
        )}
      </div>

      {showCalc ? <Calculator onClose={() => setShowCalc(false)} /> : null}

      {showMap ? (
        <Dialog onClose={() => setShowMap(false)} title="All questions">
          <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10">
            {session.questions.map((id, i) => {
              const a = session.answers[id];
              const m = session.marks.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => (go(i), setShowMap(false))}
                  className={cn(
                    "tnum relative h-9 rounded-[8px] border text-[13px] font-medium",
                    a ? "border-ink bg-ink text-bg" : "border-line-strong text-ink-2 hover:bg-surface-2",
                    i === session.index && "ring-2 ring-accent ring-offset-2 ring-offset-surface",
                  )}
                  aria-label={`Question ${i + 1}${a ? ", answered" : ", not answered"}${m ? ", marked" : ""}`}
                >
                  {i + 1}
                  {m ? <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-surface bg-warn-fill" /> : null}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-[12.5px] text-ink-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-[3px] bg-ink" /> answered
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-[3px] border border-line-strong" /> not answered
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-warn-fill" /> marked to revisit
            </span>
          </div>
          <div className="mt-5 flex justify-end">
            <Button variant="primary" onClick={() => (setShowMap(false), setConfirm(true))}>
              Review and submit
            </Button>
          </div>
        </Dialog>
      ) : null}

      {confirm ? (
        <Dialog onClose={() => setConfirm(false)} title="Submit your answers?">
          <ul className="flex flex-col gap-1.5 text-[14.5px] text-ink-2">
            <li>
              <span className="tnum font-semibold text-ink">{answeredCount}</span> answered
            </li>
            <li className={unanswered ? "text-bad" : ""}>
              <span className="tnum font-semibold">{unanswered}</span> unanswered{unanswered ? ". Blanks score zero and there is no penalty for guessing, so fill them in." : ""}
            </li>
            <li>
              <span className="tnum font-semibold text-ink">{session.marks.length}</span> marked to revisit
            </li>
          </ul>
          <div className="mt-6 flex justify-end gap-2">
            <Button onClick={() => setConfirm(false)}>Keep working</Button>
            <Button variant="primary" onClick={finish}>
              Submit
            </Button>
          </div>
        </Dialog>
      ) : null}
    </Overlay>
  );
}

function FlagBox({ initial, flagged, onSave, onRemove }: { initial: string; flagged: boolean; onSave: (v: string) => void; onRemove: () => void }) {
  const [text, setText] = useState(initial);
  return (
    <div className="animate-fade-up mb-5 rounded-[12px] border border-line bg-surface-2 p-4">
      <p className="text-[13.5px] text-ink-2">On the real test, a flag sends the question to FBLA&apos;s review team and gives no extra time. Write a short reason, then move on.</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} className="mt-2 w-full rounded-[10px] border border-line bg-surface p-2.5 text-[14px] text-ink outline-none focus:border-ink" aria-label="Reason for flagging" />
      <div className="mt-2 flex gap-2">
        <Button size="sm" variant="primary" onClick={() => onSave(text)}>
          Save flag
        </Button>
        {flagged ? (
          <Button size="sm" variant="ghost" onClick={onRemove}>
            Remove flag
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function Overlay({ children }: { children?: React.ReactNode }) {
  return <div className="fixed inset-0 z-40 flex flex-col bg-bg">{children}</div>;
}

export function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="animate-fade-in absolute inset-0 bg-black/35" aria-label="Close" onClick={onClose} />
      <div className="animate-fade-up relative max-h-[85dvh] w-full max-w-xl overflow-y-auto rounded-t-[18px] border border-line bg-surface p-5 shadow-[var(--shadow-pop)] sm:rounded-[18px] sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[17px] font-semibold text-ink">{title}</h2>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-ink-3 hover:bg-surface-2 hover:text-ink" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
