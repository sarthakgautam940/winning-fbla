"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Plus, Trash2 } from "lucide-react";
import { buildPlan, daysBetween, parseDate } from "@/lib/planner";
import { dayKey, uid, updateSettings, useProgress, useReady } from "@/lib/progress/store";
import type { CompEvent } from "@/lib/progress/types";
import { Button, Card, cn, PageHeader, SectionTitle } from "@/components/ui/primitives";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const LEVELS: Record<CompEvent["level"], string> = { regional: "Regional", state: "State", national: "National", other: "Other" };
const STAGE: Record<CompEvent["level"], string> = { regional: "Regionals", state: "States", national: "Nationals", other: "Competition" };
const MILESTONES_SHOWN = 6;

const longDate = (d: string) => parseDate(d).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
const shortDate = (d: string) => parseDate(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export function PlanView() {
  const p = useProgress();
  const ready = useReady();
  const today = useMemo(() => new Date(), []);
  const plan = useMemo(() => buildPlan(p, today), [p, today]);
  const [showAll, setShowAll] = useState(false);
  const s = p.settings;

  const setEvents = (events: CompEvent[]) => updateSettings({ events });
  const patchEvent = (id: string, patch: Partial<CompEvent>) => setEvents(s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  if (!ready) return <div className="h-screen" />;

  const ordered = [...s.events].sort((a, b) => a.date.localeCompare(b.date));
  const weeks = new Map<string, typeof plan.days>();
  for (const d of plan.days) {
    const dt = parseDate(d.date);
    const monday = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() - ((dt.getDay() + 6) % 7));
    const k = dayKey(monday);
    weeks.set(k, [...(weeks.get(k) ?? []), d]);
  }
  const weekList = [...weeks.entries()];
  const shownWeeks = showAll ? weekList : weekList.slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-5 pb-16 pt-8 sm:px-8 lg:pt-12">
      <PageHeader title="Plan" description="Your road from regionals to nationals, and a day-by-day schedule toward the competition you are aiming at. It rebuilds from today every time you open it." />

      {/* Season roadmap */}
      <Card className="px-6 py-7 sm:px-8">
        <ol className={cn("grid gap-9 md:gap-6", ordered.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2")}>
          {ordered.map((e, i) => {
            const left = daysBetween(today, parseDate(e.date));
            const past = left < 0;
            const isTarget = !past && plan.target?.id === e.id;
            const before = isTarget ? plan.milestones.filter((m) => m.label !== e.name) : [];
            return (
              <li key={e.id} className="min-w-0">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2",
                      past ? "border-ink bg-ink text-bg" : isTarget ? "border-accent bg-accent" : "border-line-strong bg-surface",
                    )}
                  >
                    {past ? <Check size={13} strokeWidth={3} /> : isTarget ? <span className="h-2.5 w-2.5 rounded-full bg-white" /> : null}
                  </span>
                  {i < ordered.length - 1 ? <span aria-hidden className="hidden h-px flex-1 bg-line-strong md:block" /> : null}
                </div>
                <p className={cn("mt-4 text-[13px] font-semibold", isTarget ? "text-accent-ink" : "text-ink-3")}>
                  {STAGE[e.level]}
                  {isTarget ? ", plan target" : ""}
                </p>
                <p className="mt-1 text-[18px] font-bold leading-snug tracking-[-0.015em] text-ink">{e.name}</p>
                <p className="mt-1 text-[13.5px] text-ink-3">
                  {longDate(e.date)}
                  {e.confirmed ? "" : ", estimated"}
                </p>
                <p className="tnum mt-4">
                  {past ? (
                    <span className="text-[15px] font-semibold text-ink-3">Done</span>
                  ) : (
                    <>
                      <span className={cn("text-[38px] font-bold leading-none tracking-[-0.03em]", isTarget ? "text-ink" : "text-ink-2")}>{left}</span>
                      <span className="ml-1.5 text-[14px] text-ink-3">{left === 1 ? "day" : "days"}</span>
                    </>
                  )}
                </p>
                {before.length ? (
                  <ul className="mt-5 flex flex-col gap-2 border-t border-line pt-4">
                    {before.slice(0, MILESTONES_SHOWN).map((m) => (
                      <li key={`${m.label}-${m.date}`} className="flex items-baseline justify-between gap-3 text-[13.5px]">
                        <span className="min-w-0 text-ink-2">{m.label}</span>
                        <span className="tnum shrink-0 text-ink-3">{shortDate(m.date)}</span>
                      </li>
                    ))}
                    {before.length > MILESTONES_SHOWN ? <li className="text-[13px] text-ink-3">{before.length - MILESTONES_SHOWN} more in the schedule below</li> : null}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ol>
        {plan.target ? <p className={cn("mt-8 border-t border-line pt-5 text-[14.5px] leading-relaxed", plan.status === "behind" || plan.status === "tight" ? "text-warn" : "text-ink-2")}>{plan.statusNote} <span className="tnum text-ink-3">{plan.lessonsLeft} lessons left, {plan.studyDaysLeft} study days before {plan.target.name}.</span></p> : null}
      </Card>

      <div className="mt-10 grid gap-x-8 gap-y-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section>
          <SectionTitle
            title="Competitions"
            action={
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEvents([...s.events, { id: uid(), name: "New competition", date: dayKey(new Date(today.getTime() + 30 * 86400000)), level: "other", confirmed: true }])}
              >
                <Plus size={15} />
                Add
              </Button>
            }
          />
          <Card className="divide-y divide-line">
            {ordered.map((e) => {
              const left = daysBetween(today, parseDate(e.date));
              const isTarget = plan.target?.id === e.id;
              return (
                <div key={e.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <input value={e.name} onChange={(ev) => patchEvent(e.id, { name: ev.target.value })} aria-label="Competition name" className="min-w-0 flex-1 bg-transparent text-[15.5px] font-semibold text-ink outline-none" />
                    <input type="date" value={e.date} onChange={(ev) => ev.target.value && patchEvent(e.id, { date: ev.target.value, confirmed: true })} aria-label={`Date of ${e.name}`} className="h-9 rounded-full border border-line-strong bg-surface px-3 text-[13.5px] text-ink outline-none focus:border-ink" />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
                    <span className="text-ink-3">{LEVELS[e.level]}</span>
                    <span className={cn("tnum", left < 0 ? "text-ink-3" : "text-ink-2")}>{left < 0 ? "past" : left === 0 ? "today" : `in ${left} days`}</span>
                    {!e.confirmed ? <span className="text-warn">estimated date</span> : null}
                    <span className="flex-1" />
                    {left >= 0 ? (
                      <button type="button" onClick={() => updateSettings({ target: e.id })} className={cn("font-semibold", isTarget ? "text-accent-ink" : "text-ink-3 hover:text-ink")} aria-pressed={isTarget}>
                        {isTarget ? "Plan target" : "Aim the plan here"}
                      </button>
                    ) : null}
                    {!["regional", "state", "nlc"].includes(e.id) ? (
                      <button type="button" onClick={() => setEvents(s.events.filter((x) => x.id !== e.id))} className="text-ink-3 hover:text-bad" aria-label={`Remove ${e.name}`}>
                        <Trash2 size={14} />
                      </button>
                    ) : null}
                  </div>
                  {e.note && !e.confirmed ? <p className="mt-2 text-[13px] leading-snug text-ink-3">{e.note}</p> : null}
                  {e.note && e.confirmed && e.id === "nlc" ? <p className="mt-2 text-[13px] text-ink-3">{e.note}</p> : null}
                </div>
              );
            })}
          </Card>
        </section>

        <section>
          <SectionTitle title="Your week" />
          <Card className="px-5 py-5">
            <p className="text-[13.5px] font-medium text-ink-3">Days you can study</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {WEEKDAYS.map((d, i) => {
                const on = s.studyDays.includes(i);
                return (
                  <button key={d} type="button" aria-pressed={on} onClick={() => updateSettings({ studyDays: on ? s.studyDays.filter((x) => x !== i) : [...s.studyDays, i].sort() })} className={cn("h-9 w-12 rounded-full border text-[13px] font-semibold transition-colors", on ? "border-ink bg-ink text-bg" : "border-line-strong bg-surface text-ink-3 hover:border-ink-3")}>
                    {d}
                  </button>
                );
              })}
            </div>
            <label className="mt-6 block">
              <span className="flex justify-between text-[13.5px]">
                <span className="font-medium text-ink-3">Minutes a day</span>
                <span className="tnum font-semibold text-ink">{s.minutesPerDay}</span>
              </span>
              <input type="range" min={15} max={180} step={5} value={s.minutesPerDay} onChange={(e) => updateSettings({ minutesPerDay: Number(e.target.value) })} className="mt-2 w-full accent-[var(--ink)]" />
            </label>
          </Card>
        </section>
      </div>

      <section className="mt-10">
        <SectionTitle title="Schedule" />
        {plan.days.length ? (
          <div className="flex flex-col gap-6">
            {shownWeeks.map(([wk, ds]) => (
              <div key={wk}>
                <p className="mb-2 text-[13.5px] font-semibold text-ink-3">Week of {parseDate(wk).toLocaleDateString(undefined, { month: "long", day: "numeric" })}</p>
                <Card className="divide-y divide-line">
                  {ds.map((d) => (
                    <div key={d.date} className="grid gap-2 px-5 py-3.5 sm:grid-cols-[130px_1fr]">
                      <p className={cn("text-[13.5px]", d.date === dayKey(today) ? "font-semibold text-accent-ink" : "font-medium text-ink-3")}>{d.date === dayKey(today) ? "Today" : parseDate(d.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</p>
                      <ul className="flex flex-col gap-1.5">
                        {d.tasks.map((t) => (
                          <li key={t.id} className="flex items-baseline justify-between gap-3 text-[14.5px]">
                            <Link href={t.href} className={cn("hover:underline hover:underline-offset-4", t.kind === "practice-test" ? "font-bold text-ink" : "font-medium text-ink")}>
                              {t.title}
                            </Link>
                            <span className="tnum shrink-0 text-[13px] text-ink-3">{t.minutes} min</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </Card>
              </div>
            ))}
            {weekList.length > 3 ? (
              <Button variant="secondary" onClick={() => setShowAll((v) => !v)} className="self-start">
                {showAll ? "Show fewer weeks" : `Show all ${weekList.length} weeks`}
              </Button>
            ) : null}
          </div>
        ) : (
          <p className="text-[14.5px] text-ink-2">{plan.statusNote}</p>
        )}
      </section>
    </div>
  );
}
