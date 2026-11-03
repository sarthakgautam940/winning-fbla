"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Rich } from "@/components/ui/primitives";

interface Entry {
  id: string;
  term: string;
  back: string;
  lesson: string;
  unit: string;
  code: string;
}

export function GlossaryList({ cards }: { cards: Entry[] }) {
  const [q, setQ] = useState("");
  const sorted = useMemo(() => [...cards].sort((a, b) => a.term.localeCompare(b.term, undefined, { sensitivity: "base" })), [cards]);
  const query = q.trim().toLowerCase();
  const shown = query ? sorted.filter((c) => c.term.toLowerCase().includes(query) || c.back.toLowerCase().includes(query)) : sorted;
  const groups = new Map<string, Entry[]>();
  for (const c of shown) {
    const letter = /[a-z]/i.test(c.term[0]) ? c.term[0].toUpperCase() : "#";
    groups.set(letter, [...(groups.get(letter) ?? []), c]);
  }
  return (
    <div>
      <label className="relative block max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${cards.length} terms`} aria-label="Search the glossary" className="h-10 w-full rounded-[10px] border border-line bg-surface pl-9 pr-3 text-[14.5px] text-ink outline-none placeholder:text-ink-3 focus:border-ink" />
      </label>
      <div className="mt-8 flex flex-col gap-8">
        {[...groups.entries()].map(([letter, list]) => (
          <section key={letter}>
            <h2 className="mb-3 border-b border-line pb-1.5 text-[15px] font-semibold text-ink-3">{letter}</h2>
            <dl className="flex flex-col gap-4">
              {list.map((c) => (
                <div key={c.id} className="grid gap-1 sm:grid-cols-[220px_1fr] sm:gap-6">
                  <dt className="text-[15px] font-semibold text-ink">{c.term}</dt>
                  <dd>
                    <Rich html={c.back} className="text-[14.5px] text-ink-2" />
                    <Link href={`/learn/${c.unit}/${c.lesson}`} className="mt-1 inline-block text-[12.5px] font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                      Taught in {c.code}
                    </Link>
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
        {!shown.length ? <p className="text-[14.5px] text-ink-2">No terms match.</p> : null}
      </div>
    </div>
  );
}
