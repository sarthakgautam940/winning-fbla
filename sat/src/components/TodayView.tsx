"use client";

import Link from "next/link";
import { sectionName, subByKey } from "@/lib/bank";
import { TARGET } from "@/lib/engine";
import { PHASE_LABEL, PHASE_NOTE, planDays, planToday } from "@/lib/plan";
import { scopeHref } from "@/lib/scope";
import { breakdown, daily, pct, streak, weakest } from "@/lib/stats";
import { formatDay, formatDuration } from "@/lib/dates";
import { useStore } from "@/lib/store";
import { useNow } from "@/lib/useNow";

export function TodayView() {
  const state = useStore();
  const now = useNow();
  if (!now) return <div style={{ minHeight: 400 }} />;

  const t = planToday(state, now);
  const days = planDays(state, now);
  const b = breakdown(state);
  const today = daily(state, 1, now)[0];
  const weak = weakest(b, 5);
  const saved = state.session;
  const firstAcc = pct(b.all.firstCorrect, b.all.firstTried);
  const pace = t.target ? Math.min(100, Math.round((t.done / t.target) * 100)) : 0;

  let headline: string;
  if (t.phase === "test") headline = "Test day";
  else if (t.phase === "after") headline = "The SAT is done";
  else headline = `${t.daysToTest} ${t.daysToTest === 1 ? "day" : "days"} to the SAT`;

  let status: string;
  if (t.phase === "learn") {
    status =
      t.remainingReps === 0
        ? "Every question is mastered. Run the final hardening pass whenever you like."
        : `Today: ${t.target} correct answers keeps you on pace to master all 481 by ${formatDay(state.settings.learnUntil, { month: "long", day: "numeric" })}. Start about ${t.newTarget} new ${t.newTarget === 1 ? "question" : "questions"}.`;
  } else if (t.phase === "harden" || t.phase === "review") {
    status = `${PHASE_LABEL[t.phase]}: ${t.toHarden} mastered ${t.toHarden === 1 ? "question still needs" : "questions still need"} the final check${t.remainingReps ? `, and ${t.remainingReps} correct answers are left to master the rest` : ""}.`;
  } else if (t.phase === "test") {
    status = "No new studying today. Eat breakfast, bring your device charged, and trust the work.";
  } else {
    status = "Your progress is still here if you want to keep practicing.";
  }

  return (
    <div>
      <h1 className="title">{headline}</h1>
      <p className="subtitle">{status}</p>

      <div className="today-actions">
        <Link className="btn" href={scopeHref({ kind: "plan" })}>
          {saved && saved.scope.kind === "plan" && saved.answered > 0 ? "Continue today's session" : "Start today's session"}
        </Link>
        {saved && saved.scope.kind !== "plan" ? (
          <Link className="btn btn-ghost" href={scopeHref(saved.scope)}>
            Resume {saved.scope.label}
          </Link>
        ) : null}
        {t.phase !== "learn" || t.mastered > 0 ? (
          <Link className="btn btn-ghost" href={scopeHref({ kind: "harden" })}>
            Final hardening
          </Link>
        ) : null}
      </div>

      {t.target > 0 ? (
        <div className="pace">
          <div className="pace-row">
            <strong className="tnum">
              {t.done} of {t.target}
            </strong>
            <span className="muted">correct answers today</span>
            <span className="muted right tnum">{pace}%</span>
          </div>
          <div className="bar">
            <span style={{ width: `${pace}%` }} />
          </div>
          {t.phase === "learn" && t.newTarget ? (
            <div className="muted tnum" style={{ fontSize: 13.5, marginTop: 8 }}>
              New questions started today: {t.newDone} of {t.newTarget}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="strip section">
        <div>
          <div className="label">Mastered</div>
          <div className="value">{t.mastered}</div>
          <div className="note tnum">of 481 questions</div>
        </div>
        <div>
          <div className="label">Correct answers left</div>
          <div className="value">{t.remainingReps.toLocaleString()}</div>
          <div className="note">{t.notStarted} questions not started</div>
        </div>
        <div>
          <div className="label">First-try accuracy</div>
          <div className="value">{firstAcc === null ? "None yet" : `${firstAcc}%`}</div>
          <div className="note tnum">{b.all.firstTried} questions tried</div>
        </div>
        <div>
          <div className="label">Streak</div>
          <div className="value">{streak(state, now)}</div>
          <div className="note">{formatDuration(today.ms)} studied today</div>
        </div>
      </div>

      <div className="two-col section">
        <section>
          <h2 className="h2">The plan to December 5</h2>
          <div className="plan">
            {days.map((d, i) => {
              const isToday = d.day === t.today;
              const newPhase = i === 0 || days[i - 1].phase !== d.phase;
              const done = d.target ? Math.min(100, Math.round((d.done / d.target) * 100)) : 0;
              return (
                <div key={d.day}>
                  {newPhase ? (
                    <div className="plan-phase">
                      <strong>{PHASE_LABEL[d.phase]}</strong>
                      <span className="muted">{PHASE_NOTE[d.phase]}</span>
                    </div>
                  ) : null}
                  <div className={`plan-day${isToday ? " now" : ""}${d.day < t.today ? " past" : ""}`}>
                    <span className="plan-date tnum">{formatDay(d.day)}</span>
                    <span className="grow">{d.target ? <span className="bar thin">{<span style={{ width: `${done}%` }} />}</span> : null}</span>
                    <span className="plan-num tnum">
                      {d.day <= t.today ? d.done : ""}
                      {d.target ? <span className="muted"> / {d.target}</span> : d.day <= t.today && d.done ? null : <span className="muted">{d.phase === "test" ? "Test" : ""}</span>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside>
          <h2 className="h2">Sections</h2>
          {(["math", "rw"] as const).map((k) => {
            const a = b.section[k];
            return (
              <Link key={k} href={scopeHref({ kind: "section", value: k })} className="row" style={{ display: "block" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
                  <strong>{sectionName(k)}</strong>
                  <span className="muted tnum right">
                    {a.mastered} / {a.total}
                  </span>
                </div>
                <div className="bar">
                  <span style={{ width: `${(a.mastered / a.total) * 100}%` }} />
                </div>
                <div className="muted tnum" style={{ fontSize: 13, marginTop: 6 }}>
                  {a.started} started
                  {pct(a.firstCorrect, a.firstTried) !== null ? `, ${pct(a.firstCorrect, a.firstTried)}% right on the first try` : ""}
                </div>
              </Link>
            );
          })}

          <h2 className="h2" style={{ marginTop: 34 }}>
            Weakest patterns
          </h2>
          {weak.length ? (
            <div className="rows">
              {weak.map((w) => (
                <Link key={w.key} href={`/patterns/${w.key}/`} className="row">
                  <span className="tile" data-m={Math.round((w.agg.mastered / w.agg.total) * TARGET)} style={{ minWidth: 40, height: 34 }}>
                    {subByKey.get(w.key)!.n}
                  </span>
                  <span className="grow" style={{ fontSize: 14.5, lineHeight: 1.3 }}>
                    {w.name}
                    <span className="muted" style={{ display: "block", fontSize: 13 }}>
                      {sectionName(w.section)}
                    </span>
                  </span>
                  <span className="tnum" style={{ fontWeight: 700 }}>
                    {w.firstAcc}%
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="muted">Answer a few questions and the patterns you miss most will show up here.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
