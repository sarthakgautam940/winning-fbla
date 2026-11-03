"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { catalog, getSkill, getUnit, lessonsOf } from "@/lib/catalog";
import { skillStats, unitTestTaken } from "@/lib/analytics";
import { useProgress, useReady } from "@/lib/progress/store";
import { Card, cn, LinkButton, ProgressBar } from "@/components/ui/primitives";

export function UnitView({ unitId }: { unitId: string }) {
  const p = useProgress();
  const ready = useReady();
  const u = getUnit(unitId)!;
  const lessons = lessonsOf(unitId);
  const area = catalog.areas.find((a) => a.id === u.area);
  const test = unitTestTaken(p, unitId);
  const stats = skillStats(p);
  const allDone = lessons.every((l) => p.lessons[l.id]?.done);
  const skills = lessons.flatMap((l) => l.skills);
  const mastered = skills.filter((s) => stats[s]?.level === "mastered").length;

  return (
    <div className="mx-auto max-w-4xl px-5 pb-16 pt-8 sm:px-8 lg:pt-12">
      <nav aria-label="Breadcrumb" className="text-[13.5px] text-ink-3">
        <Link href="/learn" className="hover:text-ink">
          Learn
        </Link>
      </nav>
      <p className="mt-4 text-[13.5px] font-medium text-ink-3">Unit {u.n}</p>
      <h1 className="mt-1 text-[32px] font-semibold leading-tight tracking-[-0.025em] text-ink">{u.title}</h1>
      <p className="mt-2 max-w-2xl text-[16px] leading-relaxed text-ink-2">{u.summary}</p>

      {area ? (
        <Card className="mt-6 px-5 py-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-[14px] font-semibold text-ink">
              {area.name}: {area.items} of 100 test questions
            </p>
            {ready ? (
              <p className="tnum text-[13px] text-ink-3">
                {mastered} of {skills.length} question types mastered
              </p>
            ) : null}
          </div>
          <ol className="mt-3 flex flex-col gap-1.5 text-[14px] text-ink-2">
            {area.objectives.map((o, i) => (
              <li key={o.id} className="grid grid-cols-[24px_1fr]">
                <span className="tnum text-ink-3">{i + 1}.</span>
                <span>{o.text}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[12.5px] text-ink-3">Objectives quoted from the official 2026-2027 guidelines.</p>
        </Card>
      ) : null}

      <ol className="mt-8 flex flex-col gap-2.5">
        {lessons.map((l) => {
          const st = p.lessons[l.id];
          const done = ready && !!st?.done;
          const started = ready && !done && (st?.seen?.length ?? 0) > 0;
          const runs = Object.values(p.sessions).filter((s) => s.kind === "quiz" && s.ref === l.id);
          const best = runs.length ? Math.max(...runs.map((s) => s.correct / s.total)) : null;
          const body = (
            <Card className={cn("grid grid-cols-[36px_1fr_auto] items-center gap-4 px-5 py-4 transition-colors", l.hasContent && "group-hover:border-line-strong")}>
              <span className={cn("flex h-9 w-9 items-center justify-center rounded-full border text-[13px] font-semibold", done ? "border-good-fill bg-good-fill text-white" : started ? "border-accent text-accent-ink" : "border-line-strong text-ink-3")}>
                {done ? <Check size={16} strokeWidth={2.5} /> : l.n}
              </span>
              <div className="min-w-0">
                <p className="text-[15.5px] font-medium text-ink">{l.title}</p>
                <p className="mt-0.5 truncate text-[13.5px] text-ink-3">{l.skills.map((s) => getSkill(s)?.name).join(", ") || l.summary}</p>
              </div>
              <div className="text-right text-[12.5px] text-ink-3">
                <p className="tnum">{l.minutes} min</p>
                {best !== null ? <p className="tnum mt-0.5">Quiz {Math.round(best * 100)}%</p> : null}
              </div>
            </Card>
          );
          return (
            <li key={l.id}>
              {l.hasContent ? (
                <Link href={`/learn/${u.id}/${l.id}`} className="group block">
                  {body}
                </Link>
              ) : (
                <div className="opacity-50">{body}</div>
              )}
            </li>
          );
        })}
      </ol>

      {u.unitTest ? (
        <Card className="mt-8 px-6 py-6">
          <p className="text-[13px] text-ink-3">Unit test</p>
          <h2 className="mt-1 text-[20px] font-semibold text-ink">Prove the whole unit</h2>
          <p className="mt-1.5 max-w-xl text-[14.5px] leading-relaxed text-ink-2">
            {u.unitTest.count} new questions in {u.unitTest.minutes} minutes, at real test pace. None of them appear anywhere else in the app.
            {!allDone && ready ? " Finish the lessons first for the most accurate result." : ""}
          </p>
          {test ? (
            <div className="mt-4 max-w-xs">
              <div className="flex justify-between text-[13px] text-ink-2">
                <span>Best score</span>
                <span className="tnum">
                  {test.best}/{test.total}
                </span>
              </div>
              <ProgressBar value={test.best / test.total} tone={test.best / test.total >= 0.8 ? "good" : "ink"} className="mt-1.5" />
            </div>
          ) : null}
          <LinkButton href={`/learn/${u.id}/test`} variant={allDone ? "primary" : "secondary"} className="mt-5">
            {test ? "Retake the unit test" : "Start the unit test"}
            <ArrowRight size={16} />
          </LinkButton>
        </Card>
      ) : null}
    </div>
  );
}
