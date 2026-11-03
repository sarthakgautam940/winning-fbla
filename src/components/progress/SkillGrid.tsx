"use client";

import Link from "next/link";
import { catalog, lessonsOf } from "@/lib/catalog";
import type { Level, SkillStat } from "@/lib/analytics";
import { cn } from "@/components/ui/primitives";

// One tile per skill, grouped by unit and colored by mastery: the whole
// curriculum at a glance. Each tile opens that skill on the Practice page, or
// calls onSelect when the page practices skills in place.

const LEVEL_TILE: Record<Level, string> = {
  new: "border-line-strong bg-surface text-ink-3",
  learning: "border-warn-line bg-warn-soft text-warn",
  proficient: "border-good-line bg-good-soft text-good",
  mastered: "border-good-fill bg-good-fill text-white",
};

export const LEVEL_LABEL: Record<Level, string> = {
  new: "Not started",
  learning: "Learning",
  proficient: "Proficient",
  mastered: "Mastered",
};

export function SkillGrid({ stats, onSelect }: { stats: Record<string, SkillStat>; onSelect?: (skill: string) => void }) {
  const units = catalog.units.filter((u) => u.area);
  return (
    <div className="flex flex-col divide-y divide-line">
      {units.map((u) => (
        <div key={u.id} className="grid gap-x-6 gap-y-2.5 py-4 first:pt-0 last:pb-0 sm:grid-cols-[168px_minmax(0,1fr)]">
          <p className="pt-2 text-[13.5px] leading-snug">
            <span className="font-semibold text-ink">Unit {u.n}</span> <span className="text-ink-3">{u.title}</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {lessonsOf(u.id)
              .flatMap((l) => l.skills)
              .map((sid) => {
                const s = catalog.skills[sid];
                const level = stats[sid]?.level ?? "new";
                const label = `${s.n}. ${s.name}: ${LEVEL_LABEL[level]}`;
                const tile = cn(
                  "tnum flex h-9 min-w-[38px] items-center justify-center rounded-[10px] border px-1.5 text-[12.5px] font-bold shadow-[0_2px_0_var(--line)] transition-transform duration-150 hover:-translate-y-px",
                  LEVEL_TILE[level],
                );
                return onSelect ? (
                  <button key={sid} type="button" onClick={() => onSelect(sid)} title={label} aria-label={`Practice skill ${s.n}, ${s.name}, ${LEVEL_LABEL[level]}`} className={tile}>
                    {s.n}
                  </button>
                ) : (
                  <Link key={sid} href={`/practice#skill-${sid}`} title={label} aria-label={`Skill ${s.n}, ${s.name}, ${LEVEL_LABEL[level]}`} className={tile}>
                    {s.n}
                  </Link>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkillLegend({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-ink-3", className)}>
      {(Object.keys(LEVEL_LABEL) as Level[]).map((l) => (
        <span key={l} className="inline-flex items-center gap-1.5">
          <span className={cn("h-3 w-3 rounded-[4px] border", LEVEL_TILE[l])} aria-hidden />
          {LEVEL_LABEL[l]}
        </span>
      ))}
    </div>
  );
}
