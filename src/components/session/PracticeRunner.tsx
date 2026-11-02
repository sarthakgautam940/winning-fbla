"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import type { QuestionContent } from "@/lib/content-types";
import { qmeta } from "@/lib/catalog";
import { loadQuestions } from "@/lib/questions";
import { uid } from "@/lib/progress/store";
import type { Mode } from "@/lib/progress/types";
import { QuestionCard } from "@/components/question/QuestionCard";
import { Button, ProgressBar } from "@/components/ui/primitives";

// Instant-feedback practice: one question at a time, explanation after each.
export function PracticeRunner({ ids, title, mode = "bank", onExit }: { ids: string[]; title: string; mode?: Mode; onExit: () => void }) {
  const [content, setContent] = useState<Record<string, QuestionContent> | null>(null);
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState<Record<string, boolean>>({});
  const sessionId = useMemo(() => uid(), []);

  useEffect(() => {
    let alive = true;
    loadQuestions(ids).then((c) => alive && setContent(c));
    return () => {
      alive = false;
    };
  }, [ids]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onExit();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onExit]);

  const list = content ? ids.filter((id) => content[id]) : [];
  const done = index >= list.length && list.length > 0;
  const correct = Object.values(answered).filter(Boolean).length;
  const current = list[index];

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-bg">
      <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-4 sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-ink">{title}</p>
          <p className="tnum text-[12.5px] text-ink-3">{content ? (done ? "Finished" : `Question ${index + 1} of ${list.length}`) : "Loading"}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onExit}>
          <X size={16} />
          Close
        </Button>
      </div>
      <ProgressBar value={list.length ? Math.min(index, list.length) / list.length : 0} className="h-1 rounded-none" label="Session progress" />
      <div className="scrollbar-thin flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[760px] px-4 pb-16 pt-8 sm:px-6">
          {!content ? (
            <div className="h-80 animate-pulse rounded-[var(--radius-lg)] border border-line bg-surface-2/60" />
          ) : done ? (
            <div className="animate-fade-up rounded-[var(--radius-lg)] border border-line bg-surface px-6 py-10 text-center">
              <p className="text-[13.5px] text-ink-3">Session complete</p>
              <p className="tnum mt-2 text-[44px] font-semibold leading-none text-ink">
                {correct}
                <span className="text-[22px] font-medium text-ink-3"> / {Object.keys(answered).length}</span>
              </p>
              <p className="mt-2 text-[14.5px] text-ink-2">correct on the first check</p>
              <div className="mt-7 flex justify-center gap-2">
                <Button onClick={() => (setIndex(0), setAnswered({}))}>Go again</Button>
                <Button variant="primary" onClick={onExit}>
                  Done
                </Button>
              </div>
            </div>
          ) : current ? (
            <QuestionCard
              key={current}
              q={content[current]}
              meta={qmeta(current)}
              mode={mode}
              sessionId={sessionId}
              showSkill
              showLessonLink
              heading={null}
              onAnswered={(ok) => setAnswered((a) => (current in a ? a : { ...a, [current]: ok }))}
              footer={
                <Button variant="primary" onClick={() => setIndex((i) => i + 1)}>
                  {index === list.length - 1 ? "Finish" : "Next question"}
                  <ArrowRight size={16} />
                </Button>
              }
            />
          ) : (
            <p className="text-ink-2">No questions match.</p>
          )}
        </div>
      </div>
    </div>
  );
}
