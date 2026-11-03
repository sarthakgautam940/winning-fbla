"use client";

import { Check } from "lucide-react";
import type { CompEvent } from "@/lib/progress/types";
import { daysBetween, parseDate } from "@/lib/planner";
import { cn } from "@/components/ui/primitives";

// The season as a vertical timeline: regionals, then states, then nationals.
// The event the plan aims at is marked in the accent color.

const STAGE: Record<CompEvent["level"], string> = {
  regional: "Regionals",
  state: "States",
  national: "Nationals",
  other: "Competition",
};

export function Roadmap({ events, today, targetId, className }: { events: CompEvent[]; today: Date; targetId: string | null; className?: string }) {
  const ordered = [...events].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <ol className={cn("flex flex-col", className)}>
      {ordered.map((e, i) => {
        const days = daysBetween(today, parseDate(e.date));
        const past = days < 0;
        const next = !past && e.id === targetId;
        const date = parseDate(e.date).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
        return (
          <li key={e.id} className="relative flex gap-3.5 pb-6 last:pb-0">
            {i < ordered.length - 1 ? <span aria-hidden className="absolute bottom-0 left-[11px] top-7 w-px bg-line-strong" /> : null}
            <span
              aria-hidden
              className={cn(
                "relative mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                past ? "border-ink bg-ink text-bg" : next ? "border-accent bg-accent" : "border-line-strong bg-surface",
              )}
            >
              {past ? <Check size={12} strokeWidth={3} /> : next ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn("text-[12.5px] font-semibold", next ? "text-accent-ink" : "text-ink-3")}>{STAGE[e.level]}</p>
              <p className="mt-0.5 text-[15px] font-semibold leading-snug text-ink">{e.name}</p>
              <p className="mt-0.5 text-[13px] text-ink-3">
                {date}
                {e.confirmed ? "" : ", estimated"}
              </p>
            </div>
            <div className="shrink-0 pt-3 text-right">
              {past ? (
                <span className="text-[13px] font-medium text-ink-3">Done</span>
              ) : (
                <span className="tnum">
                  <span className={cn("text-[22px] font-bold leading-none tracking-[-0.02em]", next ? "text-ink" : "text-ink-2")}>{days}</span>
                  <span className="ml-1 text-[12.5px] text-ink-3">{days === 1 ? "day" : "days"}</span>
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
