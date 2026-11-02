"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { catalog, getSkill, lessonsOf } from "@/lib/catalog";
import type { AreaId } from "@/lib/content-types";
import { activitySeries, areaStats, pace, projectedScore, readinessBand, skillStats, streak, totals, weakestSkills, type Level } from "@/lib/analytics";
import { skillSet } from "@/lib/sets";
import { useProgress, useReady } from "@/lib/progress/store";
import { PracticeRunner } from "@/components/session/PracticeRunner";
import { Button, Card, cn, PageHeader, ProgressBar } from "@/components/ui/primitives";
import { ActivityChart } from "./ActivityChart";

const LEVEL_STYLE: Record<Level, string> = {
  new: "bg-surface-3",
  learning: "bg-[#86b6ef] dark:bg-[#1c5cab]",
  proficient: "bg-[#3987e5]",
  mastered: "bg-[#184f95] dark:bg-[#9ec5f4]",
};
const LEVEL_LABEL: Record<Level, string> = { new: "Not started", learning: "Learning", proficient: "Proficient", mastered: "Mastered" };

function hours(ms: number) {
  const h = ms / 3600000;
  return h >= 10 ? `${Math.round(h)} h` : h >= 1 ? `${h.toFixed(1)} h` : `${Math.round(ms / 60000)} min`;
}

export function ProgressView() {
  const p = useProgress();
  const ready = useReady();
  const [runner, setRunner] = useState<{ ids: string[]; title: string } | null>(null);
  const stats = useMemo(() => skillStats(p), [p]);
  const areas = useMemo(() => areaStats(p), [p]);
  const proj = useMemo(() => projectedScore(p), [p]);
  const tot = useMemo(() => totals(p), [p]);
  const days = useMemo(() => activitySeries(p, 28), [p]);
  const sp = useMemo(() => pace(p), [p]);
  const weak = weakestSkills(stats, 5);
  const band = readinessBand(proj.score);
  const tests = Object.values(p.sessions)
    .filter((s) => s.kind === "test" || s.kind === "unit")
    .sort((a, b) => a.finishedAt - b.finishedAt);

  if (!ready) return <div className="h-screen" />;

  const practice = (sid: string) => {
    const ids = skillSet(p, sid);
    if (ids.length) setRunner({ ids, title: `Skill ${getSkill(sid)?.n}: ${getSkill(sid)?.name}` });
  };

  return (
    <div className="mx-auto max-w-5xl px-5 pb-16 pt-8 sm:px-8 lg:pt-12">
      <PageHeader title="Progress" description="Where you stand on the real test, built from every answer you have given. Recent answers count more than old ones, and harder questions count more than easier ones." />

      <div className="grid gap-3 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <Card className="px-5 py-5">
          <p className="text-[13px] text-ink-3">Projected score</p>
          {proj.ready ? (
            <>
              <p className="mt-1 text-[48px] font-semibold leading-none tracking-[-0.03em] text-ink">
                {proj.low}
                <span className="text-ink-3">–</span>
                {proj.high}
              </p>
              <p className="mt-2 text-[14px] font-medium text-ink">{band.label}</p>
              <p className="mt-1 text-[12.5px] leading-snug text-ink-3">Out of 100, weighted by how many questions each area has on the test. Guidance only; FBLA publishes no cut scores.</p>
            </>
          ) : (
            <>
              <p className="mt-2 text-[15px] font-medium text-ink">Not enough answers yet</p>
              <p className="mt-1 text-[13px] leading-snug text-ink-2">Answer {proj.needed} more questions, or take a practice test, and a projection appears here.</p>
            </>
          )}
        </Card>
        <Card className="px-5 py-5">
          <p className="text-[13px] text-ink-3">Answered</p>
          <p className="tnum mt-1 text-[30px] font-semibold text-ink">{tot.answered.toLocaleString()}</p>
          <p className="tnum mt-1 text-[13px] text-ink-2">{tot.answered ? `${Math.round(tot.accuracy * 100)}% correct` : "No answers yet"}</p>
        </Card>
        <Card className="px-5 py-5">
          <p className="text-[13px] text-ink-3">Study time</p>
          <p className="tnum mt-1 text-[30px] font-semibold text-ink">{hours(tot.studyMs)}</p>
          <p className="mt-1 text-[13px] text-ink-2">reading and answering</p>
        </Card>
        <Card className="px-5 py-5">
          <p className="text-[13px] text-ink-3">Streak</p>
          <p className="tnum mt-1 text-[30px] font-semibold text-ink">{streak(p)}</p>
          <p className="mt-1 text-[13px] text-ink-2">days in a row</p>
        </Card>
      </div>

      <section className="mt-10">
        <h2 className="text-[18px] font-semibold text-ink">By test area</h2>
        <p className="mt-1 text-[13.5px] text-ink-3">Sorted by points at stake: the share of the test times the room you have to improve.</p>
        <Card className="mt-3 divide-y divide-line">
          {[...areas]
            .sort((a, b) => b.items * (1 - b.estimate) - a.items * (1 - a.estimate))
            .map((a) => (
              <div key={a.area} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-5 py-3.5 sm:grid-cols-[1fr_220px_110px]">
                <div className="min-w-0">
                  <p className="truncate text-[14.5px] font-medium text-ink">{a.name}</p>
                  <p className="tnum text-[12.5px] text-ink-3">
                    {a.items} of 100 questions, {a.attempts} answered
                  </p>
                </div>
                <ProgressBar value={a.answered ? a.estimate : 0} tone={a.estimate >= 0.85 ? "good" : "accent"} className="order-3 col-span-2 sm:order-none sm:col-span-1" label={`${a.name} accuracy`} />
                <p className="tnum text-right text-[14px] text-ink">{a.answered ? `${Math.round(a.estimate * 100)}%` : "No data"}</p>
              </div>
            ))}
        </Card>
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="text-[18px] font-semibold text-ink">Weakest skills</h2>
          <Card className="mt-3 divide-y divide-line">
            {weak.length ? (
              weak.map((s) => (
                <div key={s.skill} className="flex items-center gap-4 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] text-ink">
                      <span className="tnum mr-1.5 text-ink-3">{getSkill(s.skill)?.n}</span>
                      {getSkill(s.skill)?.name}
                    </p>
                    <p className="tnum text-[12.5px] text-ink-3">
                      {s.correct}/{s.attempts} correct
                    </p>
                  </div>
                  <span className="tnum text-[14px] font-medium text-ink">{Math.round(s.estimate * 100)}%</span>
                  <Button size="sm" onClick={() => practice(s.skill)}>
                    Practice
                  </Button>
                </div>
              ))
            ) : (
              <p className="px-5 py-4 text-[14px] text-ink-2">Answer a few questions in at least one skill and your weakest ones appear here.</p>
            )}
          </Card>
        </section>
        <section>
          <h2 className="text-[18px] font-semibold text-ink">Pace under time pressure</h2>
          <Card className="mt-3 px-5 py-4">
            {sp.overall !== null ? (
              <>
                <p className="text-[14px] text-ink-2">
                  Average <span className="tnum font-semibold text-ink">{sp.overall.toFixed(0)} seconds</span> per question in timed sets. The real test allows 30.
                </p>
                <ul className="mt-3 flex flex-col gap-1.5">
                  {catalog.areas.map((a) =>
                    sp.byArea[a.id as AreaId] !== undefined ? (
                      <li key={a.id} className="flex justify-between gap-3 text-[13.5px]">
                        <span className="truncate text-ink-2">{a.name}</span>
                        <span className={cn("tnum", (sp.byArea[a.id as AreaId] ?? 0) > 30 ? "font-medium text-warn" : "text-ink")}>{sp.byArea[a.id as AreaId]!.toFixed(0)} s</span>
                      </li>
                    ) : null,
                  )}
                </ul>
              </>
            ) : (
              <p className="text-[14px] text-ink-2">Take a quiz, drill, or test and your seconds per question appear here, by area.</p>
            )}
          </Card>
        </section>
      </div>

      <section className="mt-10">
        <h2 className="text-[18px] font-semibold text-ink">Last 28 days</h2>
        <Card className="mt-3 px-5 py-4">
          <ActivityChart days={days} />
        </Card>
      </section>

      {tests.length ? (
        <section className="mt-10">
          <h2 className="text-[18px] font-semibold text-ink">Tests</h2>
          <Card className="mt-3 divide-y divide-line">
            {[...tests].reverse().map((t) => (
              <Link key={t.id} href={`/report?s=${t.id}`} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-5 py-3 text-[14px] hover:bg-surface-2/60">
                <span className="truncate text-ink">{t.title.replace("Data Science & AI: ", "")}</span>
                <span className="text-ink-3">{new Date(t.finishedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                <span className="tnum font-medium text-ink">
                  {t.correct}/{t.total}
                </span>
              </Link>
            ))}
          </Card>
        </section>
      ) : null}

      <section className="mt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-[18px] font-semibold text-ink">Every question type</h2>
          <div className="flex flex-wrap gap-3 text-[12.5px] text-ink-2">
            {(Object.keys(LEVEL_LABEL) as Level[]).map((l) => (
              <span key={l} className="inline-flex items-center gap-1.5">
                <span className={cn("h-3 w-3 rounded-[3px]", LEVEL_STYLE[l])} /> {LEVEL_LABEL[l]}
              </span>
            ))}
          </div>
        </div>
        <Card className="mt-3 px-5 py-4">
          <div className="flex flex-col gap-4">
            {catalog.units
              .filter((u) => u.area)
              .map((u) => (
                <div key={u.id} className="grid gap-2 sm:grid-cols-[200px_1fr]">
                  <p className="text-[13.5px] text-ink-2">
                    {u.n}. {u.title}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {lessonsOf(u.id)
                      .flatMap((l) => l.skills)
                      .map((sid) => {
                        const st = stats[sid];
                        const sk = getSkill(sid)!;
                        return (
                          <button
                            key={sid}
                            type="button"
                            onClick={() => practice(sid)}
                            title={`${sk.n}. ${sk.name}: ${LEVEL_LABEL[st.level]}${st.attempts ? `, ${Math.round(st.estimate * 100)}%` : ""}`}
                            aria-label={`${sk.name}, ${LEVEL_LABEL[st.level]}`}
                            className={cn("h-5 w-5 rounded-[4px] transition-transform hover:scale-110", LEVEL_STYLE[st.level])}
                          />
                        );
                      })}
                  </div>
                </div>
              ))}
          </div>
          <p className="mt-4 text-[12.5px] text-ink-3">Mastered means at least four different questions right, a recent accuracy of 85% or better, and at least one Competitive or Champion question right. Click any square to practice that skill.</p>
        </Card>
      </section>

      {runner ? <PracticeRunner ids={runner.ids} title={runner.title} onExit={() => setRunner(null)} /> : null}
    </div>
  );
}
