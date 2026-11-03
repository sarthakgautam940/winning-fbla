"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, ClipboardCheck } from "lucide-react";
import { catalog } from "@/lib/catalog";
import { projectedScore, readinessBand } from "@/lib/analytics";
import { useProgress, useReady } from "@/lib/progress/store";
import { Card, EmptyState, LinkButton, PageHeader, SectionTitle } from "@/components/ui/primitives";

export function TestsView() {
  const p = useProgress();
  const ready = useReady();
  const projection = useMemo(() => projectedScore(p), [p]);
  const runs = Object.values(p.sessions)
    .filter((s) => s.kind === "test")
    .sort((a, b) => b.finishedAt - a.finishedAt);

  return (
    <div className="mx-auto max-w-5xl px-5 pb-16 pt-8 sm:px-8 lg:pt-12">
      <PageHeader title="Practice tests" description="Five full tests in the real format: 100 questions in 50 minutes, the eight areas in their official proportions, mixed in order. Every question is new and appears nowhere else in the app." />

      {ready ? (
        <Card className="mb-10 px-7 py-7 text-center">
          <p className="text-[13.5px] font-semibold text-ink-3">Projected score</p>
          {projection.ready ? (
            <>
              <p className="tnum mt-2 text-[52px] font-bold leading-none tracking-[-0.035em] text-ink">
                {projection.low}–{projection.high}
                <span className="ml-2 text-[18px] font-semibold tracking-normal text-ink-3">of 100</span>
              </p>
              <p className="mx-auto mt-3 max-w-lg text-[14.5px] leading-relaxed text-ink-2">
                <span className="font-semibold text-ink">{readinessBand(projection.score).label}.</span> {readinessBand(projection.score).note}
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 text-[34px] font-bold leading-none tracking-[-0.03em] text-ink-2">Not enough answers yet</p>
              <p className="tnum mx-auto mt-3 max-w-md text-[14.5px] leading-relaxed text-ink-2">Answer {projection.needed} more questions anywhere in the app, and your projected score range appears here.</p>
            </>
          )}
        </Card>
      ) : null}

      {catalog.practiceTests.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {catalog.practiceTests.map((t) => {
            const mine = runs.filter((r) => r.ref === t.id);
            const best = mine.length ? Math.max(...mine.map((r) => r.correct)) : null;
            const active = ready ? p.active[`test:${t.id}`] : undefined;
            const status = active ? `Paused at question ${active.index + 1}.` : best !== null ? `Best score ${best} of 100.` : t.n === 5 ? "Championship difficulty. Take it in the final week." : t.n === 1 ? "Take it once the first three units are done." : "Realistic national difficulty.";
            return (
              <Card key={t.id} className="flex flex-col px-6 py-6">
                <div className="flex items-start gap-3">
                  <ClipboardCheck size={20} className="mt-1 shrink-0 text-ink-2" />
                  <div className="min-w-0">
                    <h2 className="text-[21px] font-bold leading-tight tracking-[-0.02em] text-ink">{t.title}</h2>
                    <p className="tnum mt-1.5 text-[14px] text-ink-2">{status}</p>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {active ? (
                    <LinkButton href={`/tests/${t.id}`} variant="accent">
                      Resume test
                      <ArrowRight size={16} />
                    </LinkButton>
                  ) : (
                    <LinkButton href={`/tests/${t.id}`} variant={mine.length ? "secondary" : "primary"}>
                      {mine.length ? "Retake" : "Start test"}
                      <ArrowRight size={16} />
                    </LinkButton>
                  )}
                  {mine[0] ? (
                    <Link href={`/report?s=${mine[0].id}`} className="text-[14px] font-semibold text-ink-2 underline-offset-4 hover:text-ink hover:underline">
                      Review last attempt
                    </Link>
                  ) : (
                    <span className="tnum text-[13.5px] text-ink-3">
                      {t.count} questions, {t.minutes} minutes
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={<ClipboardCheck size={20} />} title="Practice tests are being assembled" body="All five appear here once their 500 questions pass verification." />
      )}

      <div className="mt-12 grid gap-x-8 gap-y-10 lg:grid-cols-2">
        <section>
          <SectionTitle title="Take it like the real thing" />
          <Card className="px-6 py-5">
            <ul className="flex flex-col gap-2.5 text-[14.5px] leading-relaxed text-ink-2">
              <li>One sheet of scratch paper and a pencil. No notes, no phone, no other tabs.</li>
              <li>Use only the built-in basic calculator, the same kind the testing platform provides.</li>
              <li>Do not pause. The real clock never stops, and the test submits itself at 0:00.</li>
              <li>Answer every question. A blank scores zero and a guess costs nothing.</li>
              <li>Use the flag the way FBLA intends: for a question you believe is flawed, with a short reason. Keep your own revisit list on scratch paper.</li>
            </ul>
          </Card>
        </section>
        <section>
          <SectionTitle title="How each test is built" />
          <Card className="px-6 py-5">
            <ul className="flex flex-col text-[14.5px] text-ink-2">
              {catalog.areas.map((a) => (
                <li key={a.id} className="flex justify-between gap-4 border-b border-line py-2 first:pt-0 last:border-b-0 last:pb-0">
                  <span>{a.name}</span>
                  <span className="tnum font-semibold text-ink">{a.items}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-line pt-4 text-[13.5px] leading-relaxed text-ink-3">Tests 1 to 4 run about 35% Core, 45% Competitive, and 20% Champion; Test 5 about 20%, 45%, and 35%. Ten Champion questions in each test are scored as a tiebreaker set, as at nationals.</p>
          </Card>
        </section>
      </div>

      {ready && runs.length ? (
        <section className="mt-12">
          <SectionTitle title="History" />
          <Card className="divide-y divide-line">
            {runs.map((r) => (
              <Link key={r.id} href={`/report?s=${r.id}`} className="flex items-center justify-between gap-4 px-5 py-3.5 text-[14.5px] transition-colors first:rounded-t-[var(--radius-lg)] last:rounded-b-[var(--radius-lg)] hover:bg-surface-2/60">
                <span className="font-medium text-ink">{r.title.replace("Data Science & AI: ", "")}</span>
                <span className="text-ink-3">{new Date(r.finishedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                <span className="tnum font-bold text-ink">{r.correct}/100</span>
              </Link>
            ))}
          </Card>
        </section>
      ) : null}
    </div>
  );
}
