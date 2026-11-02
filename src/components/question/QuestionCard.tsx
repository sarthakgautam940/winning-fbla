"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bookmark, RotateCcw } from "lucide-react";
import type { Letter, QMeta, QuestionContent } from "@/lib/content-types";
import { LETTERS } from "@/lib/content-types";
import { Figure } from "@/components/figures/Figure";
import { Button, cn, Rich, TierLabel } from "@/components/ui/primitives";
import { recordAttempt, toggleSaved, useProgress } from "@/lib/progress/store";
import type { Mode } from "@/lib/progress/types";
import { getSkill } from "@/lib/catalog";
import { Options } from "./Options";
import { Explanation } from "./Explanation";

export interface QuestionCardProps {
  q: QuestionContent;
  meta?: QMeta;
  mode: Mode;
  sessionId?: string;
  heading?: React.ReactNode;
  showSkill?: boolean;
  showLessonLink?: boolean;
  resumeLast?: boolean; // show the last answer given in this mode (lesson checks)
  onAnswered?: (ok: boolean, choice: Letter) => void;
  footer?: React.ReactNode;
  className?: string;
}

export function QuestionCard({ q, meta, mode, sessionId, heading, showSkill, showLessonLink, resumeLast, onAnswered, footer, className }: QuestionCardProps) {
  const progress = useProgress();
  const [selected, setSelected] = useState<Letter | null>(null);
  const [checked, setChecked] = useState(false);
  const [out, setOut] = useState<Letter[]>([]);
  const shownAt = useRef<number | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const restored = useRef(false);

  // Lesson checks reopen in their answered state.
  useEffect(() => {
    if (!resumeLast || restored.current || !progress.createdAt) return;
    restored.current = true;
    for (let i = progress.attempts.length - 1; i >= 0; i--) {
      const a = progress.attempts[i];
      if (a.q === q.id && a.m === mode && a.c) {
        setSelected(a.c);
        setChecked(true);
        return;
      }
    }
  }, [resumeLast, progress, q.id, mode]);

  // Time starts when the question is first on screen.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && shownAt.current === null) shownAt.current = Date.now();
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const check = () => {
    if (!selected || checked) return;
    const ok = selected === q.answer;
    const ms = Math.min(5 * 60 * 1000, Date.now() - (shownAt.current ?? Date.now()));
    recordAttempt({ q: q.id, c: selected, ok, ms, m: mode, s: sessionId });
    setChecked(true);
    onAnswered?.(ok, selected);
  };

  const retry = () => {
    setSelected(null);
    setChecked(false);
    setOut([]);
    shownAt.current = Date.now();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
    const k = e.key.toUpperCase();
    const idx = ["A", "B", "C", "D"].indexOf(k) >= 0 ? ["A", "B", "C", "D"].indexOf(k) : ["1", "2", "3", "4"].indexOf(k);
    if (idx >= 0 && !checked) {
      setSelected(LETTERS[idx]);
      e.preventDefault();
    } else if (e.key === "Enter" && !checked && selected) {
      check();
      e.preventDefault();
    }
  };

  const saved = !!progress.saved[q.id]?.on;
  const skill = meta ? getSkill(meta.skill) : undefined;

  return (
    <div ref={root} onKeyDown={onKey} className={cn("rounded-[var(--radius-lg)] border border-line bg-surface p-5 sm:p-6", className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 text-[13px] text-ink-3">
          {heading}
          {showSkill && skill ? (
            <span className="block truncate">
              Skill {skill.n}: {skill.name}
            </span>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {meta ? <TierLabel tier={meta.tier} /> : null}
          <button
            type="button"
            onClick={() => toggleSaved(q.id)}
            className={cn("flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-surface-2", saved ? "text-accent" : "text-ink-3")}
            aria-pressed={saved}
            aria-label={saved ? "Remove from saved" : "Save question"}
            title={saved ? "Saved" : "Save for later"}
          >
            <Bookmark size={17} fill={saved ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      <Rich html={q.stem} className="q-stem" />
      {q.figure ? <Figure spec={q.figure} /> : null}

      <div className="mt-5">
        <Options
          name={q.id}
          options={q.options}
          selected={selected}
          onSelect={(l) => setSelected(l)}
          answer={checked ? q.answer : undefined}
          eliminated={out}
          onToggleEliminate={(l) => setOut((s) => (s.includes(l) ? s.filter((x) => x !== l) : [...s, l]))}
        />
      </div>

      {!checked ? (
        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="hidden text-[12.5px] text-ink-3 sm:block">Press A to D to choose, Enter to check.</p>
          <Button variant="primary" onClick={check} disabled={!selected}>
            Check answer
          </Button>
        </div>
      ) : (
        <>
          <Explanation q={q} chosen={selected} className="mt-5" />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={retry}>
                <RotateCcw size={14} />
                Try again
              </Button>
              {showLessonLink && meta ? (
                <Link href={`/learn/${meta.unit}/${meta.lesson}`} className="text-[13.5px] text-accent-ink underline-offset-4 hover:underline">
                  Review the lesson
                </Link>
              ) : null}
            </div>
            {footer}
          </div>
        </>
      )}
    </div>
  );
}
