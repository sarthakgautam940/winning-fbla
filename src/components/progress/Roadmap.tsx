"use client";

import { Check } from "lucide-react";
import type { CompEvent } from "@/lib/progress/types";
import { daysBetween, parseDate } from "@/lib/planner";
import { cn } from "@/components/ui/primitives";

// The season in date order: regionals, then states, then nationals. The event
// the plan aims at gets the filled marker; finished events get a check.
export function Roadmap({ events, today, targetId, className }: { events: CompEvent[]; today: Date; targetId: string | null; className?: string }) {
  const ordered = [...events].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <ol className={cn("flex flex-col gap-6", className)}>
      {ordered.map((e) => {
        const days = daysBetween(today, parseDate(e.date));
        const past = days < 0;
        const next = !past && e.id === targetId;
        const date = parseDate(e.date).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
        return (
          <li key={e.id} className="flex gap-3.5">
            <span
              aria-hidden
              className={cn(
                "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                past ? "bg-surface-3 text-ink-2" : next ? "bg-ink" : "border-2 border-line-strong bg-surface",
              )}
            >
              {past ? <Check size={12} strokeWidth={3} /> : next ? <span className="h-2 w-2 rounded-full bg-[var(--gold)]" /> : null}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn("text-[15px] font-semibold leading-snug", past ? "text-ink-3" : "text-ink")}>{e.name}</p>
              <p className="mt-0.5 text-[13px] text-ink-3">
                {date}
                {e.confirmed ? "" : ", estimated"}
              </p>
            </div>
            <div className="shrink-0 text-right">
              {past ? (
                <span className="text-[13px] font-medium text-ink-3">Done</span>
              ) : (
                <span className="tnum">
                  <span className={cn("text-[22px] font-bold leading-none tracking-[-0.02em]", next ? "text-ink" : "text-ink-3")}>{days}</span>
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
