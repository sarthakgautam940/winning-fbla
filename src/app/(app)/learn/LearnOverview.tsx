"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { catalog, getLesson } from "@/lib/catalog";
import { unitDone, unitTestTaken } from "@/lib/analytics";
import { useProgress, useReady } from "@/lib/progress/store";
import { Card, cn, LinkButton, PageHeader, ProgressBar } from "@/components/ui/primitives";

export function LearnOverview() {
  const p = useProgress();
  const ready = useReady();
  const next = catalog.units.flatMap((u) => u.lessons).find((id) => catalog.lessons[id]?.hasContent && !p.lessons[id]?.done);
  const nl = next ? getLesson(next) : undefined;
  const totalLessons = Object.keys(catalog.lessons).length;
  const doneLessons = Object.values(p.lessons).filter((l) => l.done).length;

  return (
    <div className="mx-auto max-w-5xl px-5 pb-16 pt-8 sm:px-8 lg:pt-12">
      <PageHeader
        title="Learn"
        description="Nine units in the order that builds understanding fastest. Read each lesson, answer its checks, then take its quiz. Each unit ends with a test."
        actions={ready ? <span className="tnum text-[14px] text-ink-2">{doneLessons} of {totalLessons} lessons done</span> : null}
      />

      {ready && nl ? (
        <Card className="mb-8 flex flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div className="min-w-0">
            <p className="text-[13px] text-ink-3">{doneLessons ? "Continue where you left off" : "Start here"}</p>
            <p className="mt-1 text-[18px] font-semibold text-ink">
              <span className="mr-2 text-ink-3">{nl.code}</span>
              {nl.title}
            </p>
            <p className="mt-1 text-[14px] text-ink-2">{nl.summary}</p>
          </div>
          <LinkButton href={`/learn/${nl.unit}/${nl.id}`} variant="primary">
            {p.lessons[nl.id]?.seen?.length ? "Continue" : "Start"}
            <ArrowRight size={16} />
          </LinkButton>
        </Card>
      ) : null}

      <ol className="flex flex-col gap-3">
        {catalog.units.map((u) => {
          const { done, total } = unitDone(p, u.id);
          const area = catalog.areas.find((a) => a.id === u.area);
          const test = unitTestTaken(p, u.id);
          const complete = ready && total > 0 && done === total;
          return (
            <li key={u.id}>
              <Link href={`/learn/${u.id}`} className="group block">
                <Card className="grid grid-cols-[44px_1fr] gap-4 px-5 py-5 transition-colors group-hover:border-line-strong sm:grid-cols-[44px_1fr_200px] sm:items-center">
                  <span className={cn("flex h-11 w-11 items-center justify-center rounded-[12px] text-[16px] font-semibold", complete ? "bg-good-fill text-white" : "bg-surface-2 text-ink-2")}>
                    {complete ? <Check size={20} strokeWidth={2.5} /> : u.n}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[17px] font-semibold text-ink">{u.title}</p>
                    <p className="mt-0.5 text-[14px] leading-relaxed text-ink-2">{u.summary}</p>
                    <p className="mt-2 text-[12.5px] text-ink-3">
                      {total} lessons
                      {area ? `, ${area.items} of 100 test questions` : ", strategy for test day"}
                      {u.unitTest ? `, unit test of ${u.unitTest.count}` : ""}
                    </p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <div className="flex items-baseline justify-between text-[12.5px] text-ink-3">
                      <span>{ready ? `${done}/${total} lessons` : " "}</span>
                      {test ? <span className="tnum">Test best {Math.round((test.best / test.total) * 100)}%</span> : null}
                    </div>
                    <ProgressBar value={ready && total ? done / total : 0} tone={complete ? "good" : "accent"} className="mt-1.5" label={`Unit ${u.n} progress`} />
                  </div>
                </Card>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
