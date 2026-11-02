"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { catalog } from "@/lib/catalog";
import { useProgress, useReady } from "@/lib/progress/store";
import { Card, EmptyState, LinkButton, PageHeader } from "@/components/ui/primitives";

export function TestsView() {
  const p = useProgress();
  const ready = useReady();
  const runs = Object.values(p.sessions)
    .filter((s) => s.kind === "test")
    .sort((a, b) => b.finishedAt - a.finishedAt);

  return (
    <div className="mx-auto max-w-5xl px-5 pb-16 pt-8 sm:px-8 lg:pt-12">
      <PageHeader
        title="Practice tests"
        description="Five full tests in the real format: 100 questions in 50 minutes, the eight areas in their official proportions, mixed in order. Each test is new material that appears nowhere else in the app."
      />

      {catalog.practiceTests.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {catalog.practiceTests.map((t) => {
            const mine = runs.filter((r) => r.ref === t.id);
            const best = mine.length ? Math.max(...mine.map((r) => r.correct)) : null;
            const active = p.active[`test:${t.id}`];
            return (
              <Card key={t.id} className="flex flex-col px-6 py-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-[18px] font-semibold text-ink">{t.title}</h2>
                  {ready && best !== null ? <span className="tnum text-[14px] font-medium text-ink-2">Best {best}/100</span> : null}
                </div>
                <p className="mt-1 text-[13.5px] text-ink-3">
                  {t.count} questions, {t.minutes} minutes{t.n === 5 ? ", championship difficulty" : ""}
                </p>
                <p className="mt-3 flex-1 text-[14px] leading-relaxed text-ink-2">
                  {t.n === 5
                    ? "A dress rehearsal at the hardest level: more Champion questions than any other test. Take it in the final week."
                    : t.n === 1
                      ? "Realistic national difficulty. Take it once you have finished the first three units to see where you stand."
                      : "Realistic national difficulty, with all 44 objectives covered."}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {ready && active ? (
                    <LinkButton href={`/tests/${t.id}`} variant="primary">
                      Resume, question {active.index + 1}
                    </LinkButton>
                  ) : (
                    <LinkButton href={`/tests/${t.id}`} variant={mine.length ? "secondary" : "primary"}>
                      {mine.length ? "Retake" : "Start test"}
                      <ArrowRight size={16} />
                    </LinkButton>
                  )}
                  {mine[0] ? (
                    <Link href={`/report?s=${mine[0].id}`} className="text-[13.5px] text-accent-ink underline-offset-4 hover:underline">
                      Review last attempt
                    </Link>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState title="Practice tests are being assembled" body="They appear here once all 500 questions pass verification." />
      )}

      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-[18px] font-semibold text-ink">Take it like the real thing</h2>
          <ul className="mt-3 flex flex-col gap-2 text-[14.5px] leading-relaxed text-ink-2">
            <li>One sheet of scratch paper and a pencil. No notes, no phone, no other tabs.</li>
            <li>Use only the built-in basic calculator, the same kind the testing platform provides.</li>
            <li>Do not pause. The real clock never stops, and the test submits itself at 0:00.</li>
            <li>Answer every question. A blank scores zero and a guess costs nothing.</li>
            <li>Use the flag the way FBLA intends: for a question you believe is flawed, with a short reason. Keep your own revisit list on scratch paper.</li>
          </ul>
        </div>
        <div>
          <h2 className="text-[18px] font-semibold text-ink">How each test is built</h2>
          <ul className="mt-3 flex flex-col gap-1.5 text-[14px] text-ink-2">
            {catalog.areas.map((a) => (
              <li key={a.id} className="flex justify-between gap-4 border-b border-line pb-1.5">
                <span>{a.name}</span>
                <span className="tnum text-ink-3">{a.items}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-3">Tests 1 to 4 run about 35% Core, 45% Competitive, 20% Champion; Test 5 about 20%, 45%, 35%. Ten Champion questions in each test are scored as a tiebreaker set, as at nationals.</p>
        </div>
      </section>

      {ready && runs.length ? (
        <section className="mt-12">
          <h2 className="text-[18px] font-semibold text-ink">History</h2>
          <Card className="mt-3 divide-y divide-line">
            {runs.map((r) => (
              <Link key={r.id} href={`/report?s=${r.id}`} className="flex items-center justify-between gap-4 px-5 py-3 text-[14px] hover:bg-surface-2/60">
                <span className="text-ink">{r.title.replace("Data Science & AI: ", "")}</span>
                <span className="text-ink-3">{new Date(r.finishedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                <span className="tnum font-medium text-ink">{r.correct}/100</span>
              </Link>
            ))}
          </Card>
        </section>
      ) : null}
    </div>
  );
}
