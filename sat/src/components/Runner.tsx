"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import refSheet from "@/generated/ref.json";
import { Blocks } from "./Content";
import { DesmosPanel } from "./Desmos";
import { IconArrowLeft, IconBookmark, IconBulb, IconCalc, IconCheck, IconEye, IconPause, IconPlay, IconSheet, IconStrike, IconX } from "./icons";
import { byId, shortCode, subByKey, subKeyOf, teach, type Teach } from "@/lib/bank";
import { checkGridIn, cleanGridInput } from "@/lib/answer";
import { createEngine, nextQuestion, recordAnswer, remaining, TARGET, type Engine } from "@/lib/engine";
import { loadQuestion, type QData } from "@/lib/data";
import { needFor, recordAttempt, toggleBookmark, type Mode } from "@/lib/progress";
import { modeOf, poolFor, scopeFromParams } from "@/lib/scope";
import { getState, qs, update, useHydrated, useStore, type Scope } from "@/lib/store";
import { useNow } from "@/lib/useNow";
import { clock } from "@/lib/dates";
import { planToday } from "@/lib/plan";

type Phase = "loading" | "answer" | "feedback" | "done" | "empty";
type Result = { ok: boolean; response: string; before: number; after: number; mastered: boolean; ms: number };
type Tally = { answered: number; correct: number; mastered: number };

function sameScope(a: Scope, b: Scope) {
  return a.kind === b.kind && (a.value ?? "") === (b.value ?? "");
}

type Init = { engine: Engine; mode: Mode; review: Set<string>; scopeIds: string[]; first: string | null; tally: Tally; need: (id: string) => number };

/** Build or resume the session from saved progress (runs once, on the client). */
function initSession(scope: Scope): Init {
  const s = getState();
  const mode = modeOf(scope, s);
  const review = new Set<string>();
  const scopeIds = poolFor(scope, s);
  const need = (id: string) => {
    const left = needFor(getState(), id, mode);
    return left > 0 ? left : review.has(id) ? 1 : 0;
  };
  if (scope.start && needFor(s, scope.start, mode) <= 0) review.add(scope.start);
  const saved = s.session;
  let engine: Engine;
  let tally: Tally = { answered: 0, correct: 0, mastered: 0 };
  if (saved && sameScope(saved.scope, scope) && !scope.start && remaining(saved.engine) > 0) {
    engine = saved.engine;
    tally = { answered: saved.answered, correct: saved.correct, mastered: 0 };
  } else {
    engine = createEngine(scopeIds, need);
  }
  const first = nextQuestion(engine, need);
  return { engine, mode, review, scopeIds, first, tally, need };
}

export function Runner() {
  const params = useSearchParams();
  const key = params.toString();
  const scope = useMemo(() => scopeFromParams(new URLSearchParams(key)), [key]);
  const hydrated = useHydrated();
  if (!hydrated) return null;
  return <Session key={key} scope={scope} />;
}

function Session({ scope }: { scope: Scope }) {
  const state = useStore();
  const now = useNow();
  const [init] = useState(() => initSession(scope));
  const { engine, mode, review, scopeIds, need } = init;

  const [current, setCurrent] = useState<string | null>(init.first);
  const [turn, setTurn] = useState(0);
  const [data, setData] = useState<QData | null>(null);
  const [phase, setPhase] = useState<Phase>(init.first ? "loading" : "empty");
  const [result, setResult] = useState<Result | null>(null);
  const [struck, setStruck] = useState<Set<string>>(new Set());
  const [grid, setGrid] = useState("");
  const [calc, setCalc] = useState(false);
  const [ref, setRef] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [tally, setTally] = useState<Tally>(init.tally);
  // clock: when the question appeared, time spent paused, and when the current pause began
  const [clockState, setClockState] = useState({ start: 0, pausedMs: 0, pauseAt: 0 });
  const [tick, setTick] = useState(0);
  const paused = clockState.pauseAt > 0;

  // Load the current question.
  useEffect(() => {
    if (!current) return;
    let alive = true;
    loadQuestion(current).then((q) => {
      if (!alive) return;
      setData(q);
      setPhase("answer");
      const t = performance.now();
      setClockState({ start: t, pausedMs: 0, pauseAt: 0 });
      setTick(t);
      window.scrollTo({ top: 0 });
      // warm the cache for the rest of the working set
      engine.active.forEach((slot) => void loadQuestion(slot.id).catch(() => {}));
    });
    return () => {
      alive = false;
    };
  }, [current, turn, engine]);

  // timer
  useEffect(() => {
    if (phase !== "answer" || paused) return;
    const t = setInterval(() => setTick(performance.now()), 500);
    return () => clearInterval(t);
  }, [phase, paused]);
  const elapsed = phase === "answer" && !paused ? Math.max(0, tick - clockState.start - clockState.pausedMs) : 0;

  const togglePause = () => {
    if (phase !== "answer") return;
    const t = performance.now();
    setClockState((c) => (c.pauseAt ? { ...c, pausedMs: c.pausedMs + (t - c.pauseAt), pauseAt: 0 } : { ...c, pauseAt: t }));
  };

  const answer = useCallback(
    (response: string) => {
      if (phase !== "answer" || !current || !data || paused) return;
      const ok = data.type === "mc" ? response === data.answer : checkGridIn(response, data.answer as string[]);
      const ms = performance.now() - clockState.start - clockState.pausedMs;
      const before = qs(getState(), current).c;
      recordAttempt(current, ok, ms, response, mode);
      const after = qs(getState(), current).c;
      if (ok) review.delete(current);
      recordAnswer(engine, current, ok, after, need(current));
      const mastered = before < TARGET && after >= TARGET;
      const next: Tally = { answered: tally.answered + 1, correct: tally.correct + (ok ? 1 : 0), mastered: tally.mastered + (mastered ? 1 : 0) };
      setTally(next);
      update((s) => {
        s.session = { scope, engine, startedAt: s.session && sameScope(s.session.scope, scope) ? s.session.startedAt : Date.now(), answered: next.answered, correct: next.correct };
      });
      setResult({ ok, response, before, after, mastered, ms });
      setShowWhy(!ok);
      setPhase("feedback");
    },
    [phase, current, data, paused, clockState, mode, review, engine, need, tally, scope],
  );

  const advance = useCallback(() => {
    if (phase !== "feedback") return;
    const next = nextQuestion(engine, need);
    setResult(null);
    setStruck(new Set());
    setGrid("");
    setShowWhy(false);
    if (!next) {
      setCurrent(null);
      setData(null);
      setPhase("done");
      update((s) => {
        if (s.session && sameScope(s.session.scope, scope)) s.session = null;
      });
      return;
    }
    setPhase("loading");
    setCurrent(next);
    setTurn((t) => t + 1);
  }, [phase, engine, need, scope]);

  // Click anywhere to continue (not on controls, links, panels, or while selecting text).
  useEffect(() => {
    if (phase !== "feedback") return;
    const armedAt = performance.now();
    const onClick = (e: MouseEvent) => {
      if (performance.now() - armedAt < 250) return;
      const el = e.target as HTMLElement;
      if (el.closest("[data-noadvance], a, button, input, .desmos, .refsheet")) return;
      if (window.getSelection()?.toString()) return;
      advance();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [phase, advance]);

  // Keyboard: A-D or 1-4 to answer, Enter / Space / right arrow to continue.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (phase === "feedback" && (e.key === "Enter" || e.key === " " || e.key === "ArrowRight")) {
        if (tag === "BUTTON" && e.key !== "ArrowRight") return;
        e.preventDefault();
        advance();
        return;
      }
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (phase === "answer" && data?.type === "mc") {
        const k = e.key.toUpperCase();
        const idx = "ABCD".indexOf(k) >= 0 ? "ABCD".indexOf(k) : "1234".indexOf(e.key);
        if (idx >= 0 && data.choices[idx]) {
          e.preventDefault();
          answer(data.choices[idx].l);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, data, answer, advance]);

  const meta = current ? byId.get(current) : undefined;
  const subKey = meta ? subKeyOf(meta) : "";
  const sub = subKey ? subByKey.get(subKey) : undefined;
  const note = subKey ? teach[subKey] : undefined;
  const p = current ? qs(state, current) : null;
  const today = now ? planToday(state, now) : null;
  const scopeDone = scopeIds.filter((id) => (state.q[id]?.c ?? 0) >= TARGET).length;

  return (
    <div className={`runner${calc || ref ? " split" : ""}`}>
      <header className="rhead" data-noadvance>
        <div className="rhead-l">
          <Link href="/bank/" className="icon-btn" aria-label="Back to the question bank">
            <IconArrowLeft />
          </Link>
          <div className="rscope">
            <strong>{scope.label}</strong>
            {scopeIds.length ? (
              <span className="muted tnum">
                {scopeDone} of {scopeIds.length} mastered
              </span>
            ) : null}
          </div>
        </div>
        <div className="rhead-c">
          {!state.settings.hideTimer ? (
            <>
              <button className="icon-btn" onClick={togglePause} aria-label={paused ? "Resume" : "Pause"} disabled={phase !== "answer"}>
                {paused ? <IconPlay /> : <IconPause />}
              </button>
              <span className="clock tnum">{clock(phase === "feedback" && result ? result.ms : elapsed)}</span>
            </>
          ) : null}
          <button
            className="icon-btn"
            onClick={() => update((s) => void (s.settings.hideTimer = !s.settings.hideTimer))}
            aria-label={state.settings.hideTimer ? "Show timer" : "Hide timer"}
            title={state.settings.hideTimer ? "Show timer" : "Hide timer"}
          >
            <IconEye off={!state.settings.hideTimer} />
          </button>
        </div>
        <div className="rhead-r">
          {today && scope.kind === "plan" ? (
            <span className="today-chip tnum" title="Correct answers today toward today's target">
              {today.done} / {today.target} today
            </span>
          ) : null}
          <button className="icon-btn" aria-pressed={ref} onClick={() => setRef((v) => !v)} aria-label="Reference sheet" title="Reference sheet">
            <IconSheet />
          </button>
          <button className="icon-btn" aria-pressed={calc} onClick={() => setCalc((v) => !v)} aria-label="Desmos calculator" title="Desmos calculator">
            <IconCalc />
          </button>
        </div>
      </header>

      <div className="rbody">
        <main className="qpane">
          {phase === "empty" ? (
            <EmptySet scope={scope} />
          ) : phase === "done" ? (
            <Done tally={tally} />
          ) : (
            <div className="qcol">
              {meta && sub ? (
                <div className="qmeta" data-noadvance>
                  <span className="tile" data-m={Math.min(p?.c ?? 0, TARGET)}>
                    {shortCode(meta.code)}
                  </span>
                  <div className="grow">
                    <Link href={`/patterns/${subKey}/`} className="qsub">
                      {sub.n}. {sub.name}
                    </Link>
                    <div className="muted qcat">
                      {meta.section === "math" ? "Math" : "Reading and Writing"}, {meta.category}
                    </div>
                  </div>
                  <Pips c={p?.c ?? 0} pop={result?.ok ? result.after : -1} />
                  <button className="icon-btn" aria-pressed={!!p?.bm} onClick={() => current && toggleBookmark(current)} aria-label={p?.bm ? "Remove bookmark" : "Bookmark"} title="Bookmark">
                    <IconBookmark filled={!!p?.bm} />
                  </button>
                </div>
              ) : null}

              {data && phase !== "loading" ? (
                <div className={`question${paused ? " paused" : ""}`} data-qid={current ?? undefined}>
                  {paused ? (
                    <button className="paused-cover" onClick={togglePause} data-noadvance>
                      <IconPlay size={28} />
                      Paused. Click to resume.
                    </button>
                  ) : null}
                  <Blocks blocks={data.stem} />
                  {data.type === "mc" ? (
                    <div className="choices">
                      {data.choices.map((ch) => {
                        let st = "idle";
                        if (result) {
                          if (ch.l === data.answer) st = "correct";
                          else if (ch.l === result.response) st = "wrong";
                          else st = "dim";
                        } else if (struck.has(ch.l)) st = "struck";
                        return (
                          <div className="choice-row" key={ch.l}>
                            <div
                              role="button"
                              tabIndex={phase === "answer" ? 0 : -1}
                              className="choice"
                              data-state={st}
                              aria-label={`Choice ${ch.l}`}
                              onClick={(e) => {
                                if (phase === "answer") {
                                  e.stopPropagation();
                                  answer(ch.l);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (phase === "answer" && (e.key === "Enter" || e.key === " ")) {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  answer(ch.l);
                                }
                              }}
                            >
                              <span className="letter">{st === "correct" ? <IconCheck size={16} /> : st === "wrong" ? <IconX size={16} /> : ch.l}</span>
                              <div className="ccontent">
                                <Blocks blocks={ch.c} />
                              </div>
                            </div>
                            {phase === "answer" ? (
                              <button
                                className="strike"
                                aria-pressed={struck.has(ch.l)}
                                aria-label={struck.has(ch.l) ? `Restore choice ${ch.l}` : `Cross out choice ${ch.l}`}
                                title="Cross out"
                                onClick={() =>
                                  setStruck((prev) => {
                                    const n = new Set(prev);
                                    if (n.has(ch.l)) n.delete(ch.l);
                                    else n.add(ch.l);
                                    return n;
                                  })
                                }
                              >
                                <IconStrike size={18} />
                              </button>
                            ) : (
                              <span className="strike-space" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <form
                      className="gridin"
                      data-noadvance
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (grid.trim()) answer(grid.trim());
                      }}
                    >
                      <input
                        className={`field${result ? (result.ok ? " ok" : " bad") : ""}`}
                        value={result ? result.response : grid}
                        onChange={(e) => setGrid(cleanGridInput(e.target.value))}
                        placeholder="Your answer"
                        inputMode="decimal"
                        autoComplete="off"
                        disabled={phase !== "answer"}
                        aria-label="Your answer"
                        autoFocus
                      />
                      {phase === "answer" ? (
                        <button className="btn" type="submit" disabled={!grid.trim()}>
                          Check
                        </button>
                      ) : null}
                      <p className="muted gridhelp">Type a whole number, a fraction like 7/2, or a decimal like 3.5. Negative answers start with a minus sign.</p>
                    </form>
                  )}
                </div>
              ) : (
                <div className="loading muted">Loading the question</div>
              )}

              {phase === "feedback" && result && data ? (
                <Feedback result={result} data={data} note={note} showWhy={showWhy} setShowWhy={setShowWhy} subName={sub?.name ?? ""} />
              ) : null}
            </div>
          )}
        </main>
        <aside className="refsheet" style={{ display: ref ? "block" : "none" }} data-noadvance>
          <div className="panel-head">
            <strong>Reference</strong>
            <button className="icon-btn" onClick={() => setRef(false)} aria-label="Close reference sheet">
              <IconX />
            </button>
          </div>
          <div className="refbody">
            {(refSheet as { label: string; html?: string; text?: string }[]).map((r) => (
              <div key={r.label} className="refrow">
                <div className="muted">{r.label}</div>
                {r.html ? <div dangerouslySetInnerHTML={{ __html: r.html }} /> : <div>{r.text}</div>}
              </div>
            ))}
          </div>
        </aside>
        <aside className="calcpanel" style={{ display: calc ? "flex" : "none" }} data-noadvance>
          <div className="panel-head">
            <strong>Calculator</strong>
            <button className="icon-btn" onClick={() => setCalc(false)} aria-label="Close calculator">
              <IconX />
            </button>
          </div>
          <DesmosPanel visible={calc} />
        </aside>
      </div>
    </div>
  );
}

function Pips({ c, pop }: { c: number; pop: number }) {
  return (
    <span className="pips" title={`${Math.min(c, TARGET)} of ${TARGET} correct`} aria-label={`${Math.min(c, TARGET)} of ${TARGET} correct`}>
      {Array.from({ length: TARGET }, (_, i) => (
        <span key={i} className={`${i < c ? "on" : ""}${i + 1 === pop ? " pop" : ""}`} />
      ))}
    </span>
  );
}

function Feedback({
  result,
  data,
  note,
  showWhy,
  setShowWhy,
  subName,
}: {
  result: Result;
  data: QData;
  note: Teach | undefined;
  showWhy: boolean;
  setShowWhy: (v: boolean) => void;
  subName: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    box.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);
  const correctText = data.type === "mc" ? `The answer is ${data.answer}.` : `Accepted answers: ${(data.answer as string[]).join(", ")}.`;
  return (
    <section className="feedback" data-ok={result.ok ? "1" : "0"} ref={box}>
      <div className="fb-head">
        <div>
          <div className="fb-title">{result.ok ? (result.mastered ? "Correct. Mastered." : "Correct.") : "Not this time."}</div>
          <div className="muted">
            {result.ok ? `${Math.min(result.after, TARGET)} of ${TARGET} toward mastery.` : `${correctText} It still counts ${Math.min(result.after, TARGET)} of ${TARGET}, and it will come back in a few questions.`}
          </div>
        </div>
        {result.ok && !showWhy ? (
          <button className="link" onClick={() => setShowWhy(true)} data-noadvance>
            Show the explanation
          </button>
        ) : null}
      </div>
      {showWhy ? (
        <>
          <div className="fb-block">
            <h3 className="h3">Explanation</h3>
            <Blocks blocks={data.rationale} className="qtext rationale" />
          </div>
          {note ? (
            <div className="fb-block teach">
              <h3 className="h3">
                <IconBulb size={18} /> The pattern: {subName}
              </h3>
              <p>{note.what}</p>
              <ol>
                {note.how.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ol>
              {note.desmos ? (
                <p>
                  <strong>Desmos:</strong> {note.desmos}
                </p>
              ) : null}
              <p>
                <strong>Trap:</strong> {note.trap}
              </p>
            </div>
          ) : null}
        </>
      ) : null}
      <p className="advance-hint">Click anywhere or press Enter to continue</p>
    </section>
  );
}

function Done({ tally }: { tally: { answered: number; correct: number; mastered: number } }) {
  const pct = tally.answered ? Math.round((tally.correct / tally.answered) * 100) : 0;
  return (
    <div className="done">
      <h1 className="title">Set complete</h1>
      <p className="subtitle">
        {tally.answered ? `${tally.answered} answers, ${tally.correct} correct (${pct}%). ${tally.mastered} ${tally.mastered === 1 ? "question" : "questions"} mastered this session.` : "Every question in this set is mastered."}
      </p>
      <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
        <Link className="btn" href="/">
          Today
        </Link>
        <Link className="btn btn-ghost" href="/bank/">
          Question bank
        </Link>
      </div>
    </div>
  );
}

function EmptySet({ scope }: { scope: Scope }) {
  const msg =
    scope.kind === "missed"
      ? "Nothing missed yet."
      : scope.kind === "bookmarked"
        ? "No bookmarks yet. Use the bookmark button on any question."
        : scope.kind === "harden"
          ? "Nothing to harden: master some questions first, or every mastered question already passed its check."
          : "Every question in this set is mastered.";
  return (
    <div className="done">
      <h1 className="title">{scope.label}</h1>
      <p className="subtitle">{msg}</p>
      <div style={{ marginTop: 24 }}>
        <Link className="btn" href="/bank/">
          Question bank
        </Link>
      </div>
    </div>
  );
}
