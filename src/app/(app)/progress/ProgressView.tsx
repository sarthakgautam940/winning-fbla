"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { catalog, getSkill } from "@/lib/catalog";
import type { AreaId } from "@/lib/content-types";
import { activitySeries, areaStats, pace, projectedScore, readinessBand, skillStats, streak, totals, weakestSkills } from "@/lib/analytics";
import { skillSet } from "@/lib/sets";
import { useProgress, useReady } from "@/lib/progress/store";
import { PracticeRunner } from "@/components/session/PracticeRunner";
import { Button, Card, cn, PageHeader, ProgressBar, SectionTitle, StatStrip } from "@/components/ui/primitives";
import { SkillGrid, SkillLegend } from "@/components/progress/SkillGrid";
import { ActivityChart } from "./ActivityChart";

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

      <StatStrip
        stats={[
          {
            label: "Projected score",
            value: proj.ready ? `${proj.low}–${proj.high}` : "Not yet",
            note: proj.ready ? `${band.label}. Out of 100, weighted like the real test; FBLA publishes no cut scores.` : `Answer ${proj.needed} more questions, or take a practice test, to see it.`,
          },
          { label: "Answered", value: tot.answered.toLocaleString(), note: tot.answered ? `${Math.round(tot.accuracy * 100)}% correct` : "No answers yet" },
          { label: "Study time", value: hours(tot.studyMs), note: "Reading and answering" },
          { label: "Streak", value: streak(p), note: "Days in a row" },
        ]}
      />

      <section className="mt-10">
        <h2 className="text-[19px] font-bold tracking-[-0.015em] text-ink">By test area</h2>
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
                <ProgressBar value={a.answered ? a.estimate : 0} tone={a.estimate >= 0.85 ? "good" : "ink"} className="order-3 col-span-2 sm:order-none sm:col-span-1" label={`${a.name} accuracy`} />
                <p className="tnum text-right text-[14px] text-ink">{a.answered ? `${Math.round(a.estimate * 100)}%` : "No data"}</p>
              </div>
            ))}
        </Card>
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="text-[19px] font-bold tracking-[-0.015em] text-ink">Weakest skills</h2>
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
          <h2 className="text-[19px] font-bold tracking-[-0.015em] text-ink">Pace under time pressure</h2>
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
        <h2 className="text-[19px] font-bold tracking-[-0.015em] text-ink">Last 28 days</h2>
        <Card className="mt-3 px-5 py-4">
          <ActivityChart days={days} />
        </Card>
      </section>

      {tests.length ? (
        <section className="mt-10">
          <h2 className="text-[19px] font-bold tracking-[-0.015em] text-ink">Tests</h2>
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
        <SectionTitle title="Every skill" action={<SkillLegend />} />
        <Card className="px-6 py-6">
          <SkillGrid stats={stats} onSelect={practice} />
          <p className="mt-5 border-t border-line pt-4 text-[13px] leading-relaxed text-ink-3">Mastered means at least four different questions right, a recent accuracy of 85% or better, and at least one Competitive or Champion question right. Select any skill to practice it here.</p>
        </Card>
      </section>

      {runner ? <PracticeRunner ids={runner.ids} title={runner.title} onExit={() => setRunner(null)} /> : null}
    </div>
  );
}
