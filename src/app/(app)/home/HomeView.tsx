"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Check, ClipboardCheck, Layers, RotateCcw, Zap } from "lucide-react";
import { catalog, getLesson } from "@/lib/catalog";
import { dueCardCount, mistakes, streak } from "@/lib/analytics";
import { buildPlan, daysBetween, parseDate } from "@/lib/planner";
import { dayKey, useProgress, useReady } from "@/lib/progress/store";
import { useNow } from "@/lib/use-now";
import { Card, cn, LinkButton, ProgressBar } from "@/components/ui/primitives";

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
  const todays = plan.days[0]?.date === dayKey(today) ? plan.days[0].tasks : [];
  const nextId = catalog.units.flatMap((u) => u.lessons).find((id) => catalog.lessons[id]?.hasContent && !p.lessons[id]?.done);
  const next = nextId ? getLesson(nextId) : undefined;
  const due = dueCardCount(p, CARD_IDS);
  const unseenCards = CARD_IDS.filter((id) => !p.cards[id]).length;
  const open = mistakes(p).filter((m) => !m.fixed).length;
  const days = streak(p);
  const nextTest = catalog.practiceTests.find((t) => !Object.values(p.sessions).some((s) => s.kind === "test" && s.ref === t.id));
  const doneLessons = Object.values(p.lessons).filter((l) => l.done).length;
  const totalLessons = Object.keys(catalog.lessons).length;

  if (!ready || !now) return <div className="h-screen" />;

  return (
    <div className="animate-fade-up mx-auto max-w-5xl px-5 pb-16 pt-8 sm:px-8 lg:pt-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-semibold tracking-[-0.025em] text-ink">
            {greeting(today.getHours())}, Ashwath.
          </h1>
          <p className="mt-1.5 text-[15px] text-ink-2">
            {days > 1 ? `${days}-day streak. ` : ""}
            {doneLessons ? `${doneLessons} of ${totalLessons} lessons done.` : "Your course is ready. Start with the first lesson."}
          </p>
        </div>
      </header>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        {/* Continue */}
        <Card className="flex flex-col justify-between px-6 py-6">
          {next ? (
            <>
              <div>
                <p className="text-[13px] text-ink-3">{doneLessons ? "Up next" : "Start here"}</p>
                <p className="mt-1.5 text-[13.5px] font-medium text-ink-3">
                  Unit {catalog.units.find((u) => u.id === next.unit)?.n}, lesson {next.n}
                </p>
                <h2 className="mt-1 text-[22px] font-semibold leading-snug tracking-[-0.015em] text-ink">{next.title}</h2>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-2">{next.summary}</p>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <LinkButton href={`/learn/${next.unit}/${next.id}`} variant="primary">
                  {p.lessons[next.id]?.seen?.length ? "Continue lesson" : "Start lesson"}
                  <ArrowRight size={16} />
                </LinkButton>
                <span className="text-[13px] text-ink-3">{next.minutes} minutes</span>
              </div>
            </>
          ) : (
            <div>
              <p className="text-[13px] text-ink-3">Course complete</p>
              <h2 className="mt-1 text-[22px] font-semibold text-ink">Every lesson is done</h2>
              <p className="mt-1.5 text-[14.5px] text-ink-2">Keep sharp with practice tests, review, and speed drills.</p>
            </div>
          )}
          <div className="mt-6">
            <div className="flex justify-between text-[12.5px] text-ink-3">
              <span>Course progress</span>
              <span className="tnum">
                {doneLessons}/{totalLessons}
              </span>
            </div>
            <ProgressBar value={doneLessons / Math.max(1, totalLessons)} className="mt-1.5" />
          </div>
        </Card>

        {/* Countdown */}
        <Card className="px-6 py-6">
          {plan.target ? (
            <>
              <p className="text-[13px] text-ink-3">Next competition</p>
              <p className="mt-1.5 text-[16px] font-semibold text-ink">{plan.target.name}</p>
              <p className="mt-4 text-[56px] font-semibold leading-none tracking-[-0.03em] text-ink">
                {Math.max(0, daysBetween(today, parseDate(plan.target.date)))}
                <span className="ml-2 text-[18px] font-medium tracking-normal text-ink-3">days</span>
              </p>
              <p className="mt-3 text-[13.5px] text-ink-2">
                {parseDate(plan.target.date).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                {plan.target.confirmed ? "" : ", estimated"}
              </p>
              <p className={cn("mt-3 text-[13.5px] leading-snug", plan.status === "behind" || plan.status === "tight" ? "text-warn" : "text-ink-2")}>{plan.statusNote}</p>
              <Link href="/plan" className="mt-4 inline-block text-[13.5px] text-accent-ink underline-offset-4 hover:underline">
                Open the plan
              </Link>
            </>
          ) : (
            <>
              <p className="text-[13px] text-ink-3">Next competition</p>
              <p className="mt-2 text-[15px] text-ink-2">No upcoming date is set.</p>
              <LinkButton href="/plan" className="mt-4">
                Set a date
              </LinkButton>
            </>
          )}
        </Card>
      </div>

      {/* Today */}
      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[18px] font-semibold text-ink">Today</h2>
          <Link href="/plan" className="text-[13.5px] text-ink-3 hover:text-ink">
            Full schedule
          </Link>
        </div>
        <Card className="mt-3 divide-y divide-line">
          {todays.length ? (
            todays.map((t) => (
              <Link key={t.id} href={t.href} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-2/60">
                <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border", t.done ? "border-good-fill bg-good-fill text-white" : "border-line-strong")}>{t.done ? <Check size={14} strokeWidth={3} /> : null}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-medium text-ink">{t.title}</span>
                  <span className="block text-[13px] text-ink-3">{t.detail}</span>
                </span>
                <span className="tnum shrink-0 text-[13px] text-ink-3">{t.minutes} min</span>
              </Link>
            ))
          ) : (
            <p className="px-5 py-4 text-[14.5px] text-ink-2">{plan.target ? "Today is a rest day in your plan. A short flashcard review keeps things fresh." : "Set a competition date on the Plan page to get daily tasks."}</p>
          )}
          {due || unseenCards ? (
            <Link href="/flashcards" className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-2/60">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line-strong text-ink-3">
                <Layers size={14} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium text-ink">Flashcards</span>
                <span className="block text-[13px] text-ink-3">{due ? `${due} cards are due for review` : `${unseenCards} cards not yet studied`}</span>
              </span>
              <span className="tnum shrink-0 text-[13px] text-ink-3">5 min</span>
            </Link>
          ) : null}
        </Card>
      </section>

      {/* Quick starts */}
      <section className="mt-10">
        <h2 className="text-[18px] font-semibold text-ink">Quick practice</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <QuickLink href="/practice/drill" icon={<Zap size={18} />} title="Speed drill" body="20 questions, 10 minutes, at the pace of the real test." />
          <QuickLink href="/review" icon={<RotateCcw size={18} />} title="Review mistakes" body={open ? `${open} questions are waiting to be fixed.` : "No open mistakes. Saved questions live here too."} />
          <QuickLink
            href={nextTest ? `/tests/${nextTest.id}` : "/tests"}
            icon={<ClipboardCheck size={18} />}
            title={nextTest ? nextTest.title : "Practice tests"}
            body={nextTest ? "100 questions, 50 minutes, real format." : "All practice tests taken. Review your results."}
          />
        </div>
      </section>
    </div>
  );
}

function QuickLink({ href, icon, title, body }: { href: string; icon: React.ReactNode; title: string; body: string }) {
  return (
    <Link href={href} className="group">
      <Card className="h-full px-5 py-4 transition-colors group-hover:border-line-strong">
        <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-surface-2 text-ink-2">{icon}</span>
        <p className="mt-3 text-[15px] font-semibold text-ink">{title}</p>
        <p className="mt-1 text-[13.5px] leading-snug text-ink-2">{body}</p>
      </Card>
    </Link>
  );
}
