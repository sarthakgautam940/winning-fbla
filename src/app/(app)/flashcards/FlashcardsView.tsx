"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Check, RotateCcw, X } from "lucide-react";
import type { Flashcard } from "@/lib/content-types";
import { catalog, getSkill, lessonsOf } from "@/lib/catalog";
import { shuffle } from "@/lib/questions";
import { reviewCard, useProgress, useReady } from "@/lib/progress/store";
import { useNow } from "@/lib/use-now";
import { Button, Card, cn, PageHeader, ProgressBar, Rich } from "@/components/ui/primitives";

type Deck = { id: string; title: string; note: string; cards: Flashcard[] };

export function FlashcardsView() {
  const p = useProgress();
  const ready = useReady();
  const [all, setAll] = useState<Flashcard[] | null>(null);
  const [unit, setUnit] = useState("all");
  const [skill, setSkill] = useState("all");
  const [session, setSession] = useState<{ title: string; cards: Flashcard[] } | null>(null);

  useEffect(() => {
    import("@/generated/flashcards.json").then((m) => setAll(m.default as Flashcard[]));
  }, []);

  const now = useNow();
  const decks: Deck[] = useMemo(() => {
    if (!all) return [];
    const scoped = all.filter((c) => (unit === "all" || c.unit === unit) && (skill === "all" || c.skill === skill));
    const due = scoped.filter((c) => p.cards[c.id] && p.cards[c.id].due <= now);
    const missed = scoped.filter((c) => p.cards[c.id]?.last === "missed");
    const fresh = scoped.filter((c) => !p.cards[c.id]);
    const virginia = scoped.filter((c) => c.virginia);
    return [
      { id: "due", title: "Due for review", note: "Cards whose review date has arrived, spaced by how well you know them.", cards: due },
      { id: "missed", title: "Missed last time", note: "Every card you marked as missed and have not yet gotten right.", cards: missed },
      { id: "new", title: "Not studied yet", note: "Cards you have never seen.", cards: fresh },
      { id: "all", title: "Everything in scope", note: "Every card that matches the filters, shuffled.", cards: scoped },
      { id: "virginia", title: "Official vocabulary", note: "The vocabulary list from the Virginia FBLA study guide, all of it taught in the lessons.", cards: virginia },
    ];
  }, [all, unit, skill, p.cards, now]);

  const unitSkills = unit === "all" ? [] : lessonsOf(unit).flatMap((l) => l.skills);
  const known = all ? all.filter((c) => (p.cards[c.id]?.box ?? 0) >= 3).length : 0;

  return (
    <div className="mx-auto max-w-5xl px-5 pb-16 pt-8 sm:px-8 lg:pt-12">
      <PageHeader
        title="Flashcards"
        description="Terms, formulas and distinctions from every lesson. Flip, then be honest: cards you miss come back soon, cards you know come back later."
        actions={ready && all ? <span className="tnum text-[14px] text-ink-2">{known} of {all.length} well known</span> : null}
      />

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-ink-3">
          Unit
          <span className="relative">
          <select
            value={unit}
            onChange={(e) => {
              setUnit(e.target.value);
              setSkill("all");
            }}
            className="h-10 appearance-none rounded-full border border-line-strong bg-surface pl-4 pr-10 text-[14px] font-medium text-ink outline-none transition-colors hover:border-ink-3 focus:border-ink"
          >
            <option value="all">All units</option>
            {catalog.units
              .filter((u) => u.area)
              .map((u) => (
                <option key={u.id} value={u.id}>
                  Unit {u.n}: {u.title}
                </option>
              ))}
          </select>
          <ChevronDown size={16} aria-hidden className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
          </span>
        </label>
        {unit !== "all" ? (
          <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-ink-3">
            Skill
            <span className="relative">
            <select value={skill} onChange={(e) => setSkill(e.target.value)} className="max-w-[300px] h-10 appearance-none rounded-full border border-line-strong bg-surface pl-4 pr-10 text-[14px] font-medium text-ink outline-none transition-colors hover:border-ink-3 focus:border-ink">
              <option value="all">All skills in this unit</option>
              {unitSkills.map((s) => (
                <option key={s} value={s}>
                  {getSkill(s)?.n}. {getSkill(s)?.name}
                </option>
              ))}
            </select>
            <ChevronDown size={16} aria-hidden className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
            </span>
          </label>
        ) : null}
      </div>

      <Card className="mt-6 flex flex-col gap-0.5 p-2">
        {decks.map((d) => (
          <div key={d.id} className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-[12px] px-4 py-4 sm:flex-nowrap">
            <div className="min-w-0 flex-1">
              <p className="text-[15.5px] font-semibold text-ink">
                {d.title}
                <span className="tnum ml-2 text-[14px] font-medium text-ink-3">{ready ? d.cards.length : ""}</span>
              </p>
              <p className="mt-0.5 text-[13.5px] leading-snug text-ink-2">{d.note}</p>
            </div>
            <Button size="sm" variant={d.id === "due" && d.cards.length ? "primary" : "secondary"} disabled={!d.cards.length} onClick={() => setSession({ title: d.title, cards: shuffle(d.cards).slice(0, 40) })} className="shrink-0">
              Study {Math.min(40, d.cards.length) || ""}
            </Button>
          </div>
        ))}
      </Card>

      <p className="mt-8 text-[13.5px] text-ink-3">To look up a single term, use the glossary in Reference.</p>

      {session ? <CardSession title={session.title} cards={session.cards} onClose={() => setSession(null)} /> : null}
    </div>
  );
}

function CardSession({ title, cards, onClose }: { title: string; cards: Flashcard[]; onClose: () => void }) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [tally, setTally] = useState({ got: 0, missed: 0 });
  const card = cards[i];
  const done = i >= cards.length;

  const grade = useCallback(
    (got: boolean) => {
      if (!card || !flipped) return;
      reviewCard(card.id, got);
      setTally((t) => (got ? { ...t, got: t.got + 1 } : { ...t, missed: t.missed + 1 }));
      setFlipped(false);
      setI((n) => n + 1);
    },
    [card, flipped],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        if (!done) setFlipped((f) => !f);
        e.preventDefault();
      } else if (e.key === "1") grade(false);
      else if (e.key === "2") grade(true);
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [grade, done, onClose]);

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-bg">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-surface px-4 sm:px-6">
        <div>
          <p className="text-[14px] font-semibold text-ink">{title}</p>
          <p className="tnum text-[12.5px] text-ink-3">{done ? "Done" : `Card ${i + 1} of ${cards.length}`}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X size={16} />
          Close
        </Button>
      </div>
      <ProgressBar value={i / cards.length} className="h-1 rounded-none" label="Deck progress" />
      <div className="flex flex-1 items-center justify-center overflow-y-auto px-4 py-8">
        {done ? (
          <div className="animate-fade-up text-center">
            <p className="text-[13.5px] text-ink-3">Deck finished</p>
            <p className="tnum mt-2 text-[40px] font-semibold text-ink">
              {tally.got} <span className="text-[20px] font-medium text-ink-3">known,</span> {tally.missed} <span className="text-[20px] font-medium text-ink-3">to review</span>
            </p>
            <Button variant="primary" className="mt-6" onClick={onClose}>
              Done
            </Button>
          </div>
        ) : (
          <div className="w-full max-w-xl">
            <button
              type="button"
              onClick={() => setFlipped((f) => !f)}
              className={cn("block min-h-[300px] w-full rounded-[20px] border bg-surface px-8 py-10 text-center shadow-[var(--shadow-card)] transition-colors", flipped ? "border-line-strong" : "border-line hover:border-line-strong")}
              aria-label={flipped ? "Show the term" : "Show the definition"}
            >
              {!flipped ? (
                <div className="flex min-h-[220px] flex-col items-center justify-center">
                  <p className="text-[12.5px] text-ink-3">{getSkill(card.skill)?.name}</p>
                  <p className="mt-3 text-[28px] font-semibold leading-tight tracking-[-0.015em] text-ink">{card.term}</p>
                  <p className="mt-6 text-[12.5px] text-ink-3">Click or press Space to flip</p>
                </div>
              ) : (
                <div className="animate-fade-in text-left">
                  <p className="text-[15px] font-semibold text-ink">{card.term}</p>
                  <Rich html={card.back} className="mt-3 text-[16px]" />
                </div>
              )}
            </button>
            <div className={cn("mt-5 grid grid-cols-2 gap-3 transition-opacity", flipped ? "opacity-100" : "pointer-events-none opacity-30")}>
              <Button size="lg" onClick={() => grade(false)} className="border-bad-line text-bad">
                <RotateCcw size={16} />
                Missed it
                <span className="ml-1 text-[12px] text-ink-3">1</span>
              </Button>
              <Button size="lg" onClick={() => grade(true)} className="border-good-line text-good">
                <Check size={16} />
                Got it
                <span className="ml-1 text-[12px] text-ink-3">2</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
