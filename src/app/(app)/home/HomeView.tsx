"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Check, ChevronRight, ClipboardCheck, Layers, RotateCcw, Zap } from "lucide-react";
import { catalog, getLesson } from "@/lib/catalog";
import { dueCardCount, mistakes, skillStats, streak } from "@/lib/analytics";
import { buildPlan, daysBetween, parseDate } from "@/lib/planner";
import { dayKey, useProgress, useReady } from "@/lib/progress/store";
import { useNow } from "@/lib/use-now";
import { Card, cn, LinkButton, ProgressBar, SectionTitle } from "@/components/ui/primitives";
import { Roadmap } from "@/components/progress/Roadmap";
import { SkillGrid, SkillLegend } from "@/components/progress/SkillGrid";

const CARD_IDS = catalog.cardIds;

function greeting(h: number) {
  if (h < 5) return "Working late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function HomeView() {
  const p = useProgress();
  const ready = useReady();
  const now = useNow();
  const today = useMemo(() => new Date(now), [now]);
  const plan = useMemo(() => buildPlan(p, today), [p, today]);
  const stats = useMemo(() => skillStats(p), [p]);
  const todays = plan.days[0]?.date === dayKey(today) ? plan.days[0].tasks : [];
  const nextId = catalog.units.flatMap((u) => u.lessons).find((id) => catalog.lessons[id]?.hasContent && !p.lessons[id]?.done);
  const next = nextId ? getLesson(nextId) : undefined;
  const due = dueCardCount(p, CARD_IDS);
  const unseenCards = CARD_IDS.filter((id) => !p.cards[id]).length;
  const open = mistakes(p).filter((m) => !m.fixed).length;
  const days = streak(p);
  const tests = catalog.practiceTests;
  const takenTests = new Set(Object.values(p.sessions).filter((s) => s.kind === "test").map((s) => s.ref));
  const nextTest = tests.find((t) => !takenTests.has(t.id));
  const doneLessons = Object.values(p.lessons).filter((l) => l.done).length;
  const totalLessons = Object.keys(catalog.lessons).length;
  const target = plan.target;
  const daysToTarget = target ? Math.max(0, daysBetween(today, parseDate(target.date))) : null;

  if (!ready || !now) return <div className="h-screen" />;

  const status = [
    doneLessons ? `${doneLessons} of ${totalLessons} lessons done.` : "Your course is ready.",
    target && daysToTarget !== null ? `${target.name} in ${daysToTarget} ${daysToTarget === 1 ? "day" : "days"}.` : null,
    days > 1 ? `${days}-day streak.` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const testRow = !tests.length
    ? { title: "Practice tests", detail: "Five full tests: 100 questions in 50 minutes each.", href: "/tests" }
    : nextTest
      ? { title: nextTest.title, detail: "100 questions, 50 minutes, the real format.", href: `/tests/${nextTest.id}` }
      : { title: "Practice tests", detail: `All ${tests.length} taken. Review your results.`, href: "/tests" };

  return (
    <div className="animate-fade-up mx-auto max-w-6xl px-5 pb-16 pt-8 sm:px-8 lg:pt-12">
      <header>
        <h1 className="text-[32px] font-bold leading-[1.1] tracking-[-0.03em] text-ink sm:text-[36px]">
          {greeting(today.getHours())}, Ashwath.
        </h1>
        <p className="mt-2.5 text-[15.5px] text-ink-2">{status}</p>
      </header>

      <div className="mt-9 grid gap-x-8 gap-y-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-10">
          {/* Continue */}
          <Card className="px-7 py-7">
            {next ? (
              <>
                <h2 className="text-[26px] font-bold leading-tight tracking-[-0.025em] text-ink">{next.title}</h2>
                <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-ink-2">{next.summary}</p>
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <LinkButton href={`/learn/${next.unit}/${next.id}`} variant="primary" size="lg">
                    {p.lessons[next.id]?.seen?.length ? "Continue lesson" : "Start lesson"}
                    <ArrowRight size={17} />
                  </LinkButton>
                  <span className="tnum text-[14px] text-ink-3">
                    Unit {catalog.units.find((u) => u.id === next.unit)?.n}, lesson {next.n}, {next.minutes} minutes
                  </span>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-[26px] font-bold tracking-[-0.025em] text-ink">Every lesson is done</h2>
                <p className="mt-2 text-[15px] text-ink-2">Stay sharp with practice tests, mixed review, and speed drills.</p>
              </>
            )}
            <div className="mt-8">
              <div className="flex items-baseline justify-between text-[13.5px]">
                <span className="font-medium text-ink-2">Course progress</span>
                <span className="tnum text-ink-3">
                  {doneLessons} of {totalLessons} lessons
                </span>
              </div>
              <ProgressBar value={doneLessons / Math.max(1, totalLessons)} className="mt-2.5" label="Course progress" />
            </div>
          </Card>

          {/* Today */}
          <section>
            <SectionTitle
              title="Today"
              action={
                <Link href="/plan" className="hover:text-ink">
                  Full schedule
                </Link>
              }
            />
            <Card className="flex flex-col gap-0.5 p-2">
              {todays.length ? (
                todays.map((t) => (
                  <Link key={t.id} href={t.href} className="flex items-center gap-4 rounded-[12px] px-4 py-3.5 transition-colors hover:bg-surface-2/70">
                    <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2", t.done ? "border-good-fill bg-good-fill text-white" : "border-line-strong")}>{t.done ? <Check size={14} strokeWidth={3} /> : null}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold text-ink">{t.title}</span>
                      <span className="block text-[13.5px] text-ink-3">{t.detail}</span>
                    </span>
                    <span className="tnum shrink-0 text-[13.5px] text-ink-3">{t.minutes} min</span>
                  </Link>
                ))
              ) : (
                <p className="px-4 py-3.5 text-[14.5px] text-ink-2">{target ? "Today is a rest day in your plan. A short flashcard review keeps things fresh." : "Set a competition date on the Plan page to get daily tasks."}</p>
              )}
              {due || unseenCards ? (
                <Link href="/flashcards" className="flex items-center gap-4 rounded-[12px] px-4 py-3.5 transition-colors hover:bg-surface-2/70">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-line-strong text-ink-3">
                    <Layers size={13} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-ink">Flashcards</span>
                    <span className="block text-[13.5px] text-ink-3">{due ? `${due} cards are due for review` : `${unseenCards} cards not yet studied`}</span>
                  </span>
                  <span className="tnum shrink-0 text-[13.5px] text-ink-3">5 min</span>
                </Link>
              ) : null}
            </Card>
          </section>

          {/* Skills */}
          <section>
            <SectionTitle
              title="Skills"
              action={
                <Link href="/progress" className="hover:text-ink">
                  Full progress
                </Link>
              }
            />
            <Card className="px-6 py-6">
              <SkillLegend className="mb-5" />
              <SkillGrid stats={stats} />
            </Card>
          </section>
        </div>

        {/* Rail */}
        <aside className="flex min-w-0 flex-col gap-10">
          <section>
            <SectionTitle
              title="Road to nationals"
              action={
                <Link href="/plan" className="hover:text-ink">
                  Plan
                </Link>
              }
            />
            <Card className="px-6 py-6">
              <Roadmap events={p.settings.events} today={today} targetId={target?.id ?? null} />
              {target ? <p className={cn("mt-6 rounded-[12px] bg-surface-2 px-4 py-3 text-[13.5px] leading-snug", plan.status === "behind" || plan.status === "tight" ? "text-warn" : "text-ink-2")}>{plan.statusNote}</p> : null}
            </Card>
          </section>

          <section>
            <SectionTitle title="Practice now" />
            <Card className="flex flex-col gap-0.5 p-2">
              <ActionRow href="/practice/drill" icon={<Zap size={16} />} title="Speed drill" detail="20 questions in 10 minutes, at real test pace." />
              <ActionRow href="/review" icon={<RotateCcw size={16} />} title="Review mistakes" detail={open ? `${open} ${open === 1 ? "question is" : "questions are"} waiting to be fixed.` : "No open mistakes. Saved questions live here too."} />
              <ActionRow href={testRow.href} icon={<ClipboardCheck size={16} />} title={testRow.title} detail={testRow.detail} />
            </Card>
          </section>
        </aside>
      </div>
    </div>
  );
}

function ActionRow({ href, icon, title, detail }: { href: string; icon: React.ReactNode; title: string; detail: string }) {
  return (
    <Link href={href} className="group flex items-center gap-3.5 rounded-[12px] px-4 py-3.5 transition-colors hover:bg-surface-2/70">
      <span className="shrink-0 text-ink-2">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-ink">{title}</span>
        <span className="block text-[13.5px] leading-snug text-ink-3">{detail}</span>
      </span>
      <ChevronRight size={16} className="shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
