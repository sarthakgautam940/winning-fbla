"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui/primitives";

export const SECTIONS = [
  { id: "event", label: "The event" },
  { id: "formulas", label: "Formula sheet" },
  { id: "glossary", label: "Glossary" },
  { id: "objectives", label: "Objectives map" },
  { id: "databases", label: "Sample databases" },
  { id: "sources", label: "Sources" },
];

export function ReferenceNav() {
  const path = usePathname();
  return (
    <nav aria-label="Reference sections" className="mt-6 flex gap-1 overflow-x-auto shadow-[inset_0_-1px_0_var(--line)]">
      {SECTIONS.map((s) => {
        const active = path === `/reference/${s.id}`;
        return (
          <Link key={s.id} href={`/reference/${s.id}`} aria-current={active ? "page" : undefined} className={cn("shrink-0 border-b-2 px-3 py-2.5 text-[14px] transition-colors", active ? "border-ink font-medium text-ink" : "border-transparent text-ink-3 hover:text-ink")}>
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}
