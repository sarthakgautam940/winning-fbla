"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button, cn } from "@/components/ui/primitives";

// A worked example the student steps through: try the problem, then reveal
// one step at a time (or everything at once).
export function WorkedExample({ title, problem, steps, answer }: { title: string; problem: React.ReactNode; steps: React.ReactNode[]; answer?: React.ReactNode }) {
  const [shown, setShown] = useState(0);
  const total = steps.length + (answer ? 1 : 0);
  const done = shown >= total;
  return (
    <section className="not-prose my-7 overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface">
      <header className="flex items-center justify-between gap-3 border-b border-line bg-surface-2/50 px-5 py-3">
        <p className="text-[13.5px] font-semibold text-ink">
          <span className="text-ink-3">Worked example</span>
          {title ? <span className="ml-2">{title}</span> : null}
        </p>
        {!done ? (
          <button type="button" className="text-[13px] text-ink-3 underline-offset-4 hover:text-ink hover:underline" onClick={() => setShown(total)}>
            Show all
          </button>
        ) : (
          <button type="button" className="text-[13px] text-ink-3 underline-offset-4 hover:text-ink hover:underline" onClick={() => setShown(0)}>
            Hide steps
          </button>
        )}
      </header>
      <div className="rich px-5 pt-4 text-[16px]">{problem}</div>
      <ol className="mt-3 flex flex-col">
        {steps.map((s, i) => (
          <li key={i} className={cn("grid grid-cols-[28px_1fr] gap-3 px-5 py-3 transition-opacity", i < shown ? "animate-fade-up" : "hidden")}>
            <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-surface-3 text-[12px] font-semibold text-ink-2">{i + 1}</span>
            <div className="rich text-[15.5px]">{s}</div>
          </li>
        ))}
      </ol>
      {answer && shown > steps.length ? (
        <div className="animate-fade-up mx-5 mb-4 rounded-[10px] border border-good-line bg-good-soft px-4 py-3">
          <div className="rich text-[15.5px] font-medium">{answer}</div>
        </div>
      ) : null}
      {!done ? (
        <div className="flex items-center justify-between gap-3 px-5 pb-5 pt-2">
          <p className="text-[13px] text-ink-3">{shown === 0 ? "Try it first, then reveal the steps." : `Step ${Math.min(shown, steps.length)} of ${steps.length}`}</p>
          <Button variant="secondary" size="sm" onClick={() => setShown((n) => n + 1)}>
            {shown === 0 ? "Show step 1" : shown < steps.length ? `Show step ${shown + 1}` : "Show answer"}
            <ChevronDown size={15} />
          </Button>
        </div>
      ) : (
        <div className="pb-2" />
      )}
    </section>
  );
}
