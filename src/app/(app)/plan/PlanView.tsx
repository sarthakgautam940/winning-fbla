"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { buildPlan, daysBetween, parseDate } from "@/lib/planner";
import { dayKey, uid, updateSettings, useProgress, useReady } from "@/lib/progress/store";
import type { CompEvent } from "@/lib/progress/types";
import { Button, Card, cn, PageHeader } from "@/components/ui/primitives";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const LEVELS: Record<CompEvent["level"], string> = { regional: "Regional", state: "State", national: "National", other: "Other" };

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
    <div className="mx-auto max-w-5xl px-5 pb-16 pt-8 sm:px-8 lg:pt-12">
      <PageHeader title="Plan" description="A schedule built from what you have finished and the date you are aiming at. It rebuilds itself every time, so it always starts from today." />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="px-5 py-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-ink">Competitions</h2>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEvents([...s.events, { id: uid(), name: "New competition", date: dayKey(new Date(today.getTime() + 30 * 86400000)), level: "other", confirmed: true }])}
            >
              <Plus size={15} />
              Add
            </Button>
          </div>
          <ul className="mt-3 flex flex-col gap-3">
            {[...s.events]
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((e) => {
                const left = daysBetween(today, parseDate(e.date));
                const isTarget = plan.target?.id === e.id;
                return (
                  <li key={e.id} className={cn("rounded-[12px] border px-4 py-3", isTarget ? "border-accent-line bg-accent-soft/40" : "border-line")}>
                    <div className="flex flex-wrap items-center gap-2">
                      <input value={e.name} onChange={(ev) => patchEvent(e.id, { name: ev.target.value })} aria-label="Competition name" className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-ink outline-none" />
                      <input type="date" value={e.date} onChange={(ev) => ev.target.value && patchEvent(e.id, { date: ev.target.value, confirmed: true })} aria-label={`Date of ${e.name}`} className="h-8 rounded-[8px] border border-line bg-surface px-2 text-[13.5px] text-ink outline-none focus:border-accent" />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px]">
                      <span className="text-ink-3">{LEVELS[e.level]}</span>
                      <span className={cn("tnum", left < 0 ? "text-ink-3" : "text-ink-2")}>{left < 0 ? "past" : left === 0 ? "today" : `in ${left} days`}</span>
                      {!e.confirmed ? <span className="text-warn">estimated date</span> : null}
                      <span className="flex-1" />
                      {left >= 0 ? (
                        <button type="button" onClick={() => updateSettings({ target: e.id })} className={cn("font-medium", isTarget ? "text-accent-ink" : "text-ink-3 hover:text-ink")} aria-pressed={isTarget}>
                          {isTarget ? "Plan target" : "Aim the plan here"}
                        </button>
                      ) : null}
                      {!["regional", "state", "nlc"].includes(e.id) ? (
                        <button type="button" onClick={() => setEvents(s.events.filter((x) => x.id !== e.id))} className="text-ink-3 hover:text-bad" aria-label={`Remove ${e.name}`}>
                          <Trash2 size={14} />
                        </button>
                      ) : null}
                    </div>
                    {e.note && !e.confirmed ? <p className="mt-1.5 text-[12.5px] leading-snug text-ink-3">{e.note}</p> : null}
                    {e.note && e.confirmed && e.id === "nlc" ? <p className="mt-1.5 text-[12.5px] text-ink-3">{e.note}</p> : null}
                  </li>
                );
              })}
          </ul>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="px-5 py-5">
            <h2 className="text-[16px] font-semibold text-ink">Your week</h2>
            <p className="mt-1 text-[13px] text-ink-3">Days you can study</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {WEEKDAYS.map((d, i) => {
                const on = s.studyDays.includes(i);
                return (
                  <button key={d} type="button" aria-pressed={on} onClick={() => updateSettings({ studyDays: on ? s.studyDays.filter((x) => x !== i) : [...s.studyDays, i].sort() })} className={cn("h-9 w-11 rounded-[9px] border text-[13px] font-medium", on ? "border-ink bg-ink text-bg" : "border-line text-ink-3 hover:border-line-strong")}>
                    {d}
                  </button>
                );
              })}
            </div>
            <label className="mt-4 block">
              <span className="flex justify-between text-[13px]">
                <span className="text-ink-3">Minutes a day</span>
                <span className="tnum font-medium text-ink">{s.minutesPerDay}</span>
              </span>
              <input type="range" min={15} max={180} step={5} value={s.minutesPerDay} onChange={(e) => updateSettings({ minutesPerDay: Number(e.target.value) })} className="mt-1.5 w-full accent-[var(--accent)]" />
            </label>
          </Card>
          <Card className="px-5 py-5">
            <h2 className="text-[16px] font-semibold text-ink">Status</h2>
            <p className={cn("mt-2 text-[14.5px] leading-relaxed", plan.status === "behind" || plan.status === "tight" ? "text-warn" : "text-ink-2")}>{plan.statusNote}</p>
            <p className="tnum mt-2 text-[13px] text-ink-3">
              {plan.lessonsLeft} lessons left, {plan.studyDaysLeft} study days
              {plan.target ? ` before ${plan.target.name}` : ""}
            </p>
          </Card>
        </div>
      </div>

      {plan.milestones.length ? (
        <section className="mt-10">
          <h2 className="text-[18px] font-semibold text-ink">Milestones</h2>
          <ol className="mt-4 flex flex-wrap gap-2">
            {plan.milestones.map((m) => (
              <li key={`${m.label}-${m.date}`} className="rounded-[10px] border border-line bg-surface px-3 py-2">
                <p className="text-[13.5px] font-medium text-ink">{m.label}</p>
                <p className="tnum text-[12px] text-ink-3">{parseDate(m.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="text-[18px] font-semibold text-ink">Schedule</h2>
        {plan.days.length ? (
          <div className="mt-4 flex flex-col gap-6">
            {shownWeeks.map(([wk, ds]) => (
              <div key={wk}>
                <p className="mb-2 text-[13px] font-medium text-ink-3">Week of {parseDate(wk).toLocaleDateString(undefined, { month: "long", day: "numeric" })}</p>
                <Card className="divide-y divide-line">
                  {ds.map((d) => (
                    <div key={d.date} className="grid gap-2 px-5 py-3 sm:grid-cols-[120px_1fr]">
                      <p className={cn("text-[13.5px]", d.date === dayKey(today) ? "font-semibold text-ink" : "text-ink-3")}>{d.date === dayKey(today) ? "Today" : parseDate(d.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</p>
                      <ul className="flex flex-col gap-1">
                        {d.tasks.map((t) => (
                          <li key={t.id} className="flex items-baseline justify-between gap-3 text-[14px]">
                            <Link href={t.href} className={cn("hover:underline hover:underline-offset-4", t.kind === "practice-test" ? "font-semibold text-ink" : "text-ink")}>
                              {t.title}
                            </Link>
                            <span className="tnum shrink-0 text-[12.5px] text-ink-3">{t.minutes} min</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </Card>
              </div>
            ))}
            {weekList.length > 3 ? (
              <Button variant="ghost" onClick={() => setShowAll((v) => !v)} className="self-start">
                {showAll ? "Show fewer weeks" : `Show all ${weekList.length} weeks`}
              </Button>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-[14.5px] text-ink-2">{plan.statusNote}</p>
        )}
      </section>
    </div>
  );
}
