import { Check, X } from "lucide-react";
import type { Letter, QuestionContent } from "@/lib/content-types";
import { LETTERS } from "@/lib/content-types";
import { cn, Rich } from "@/components/ui/primitives";

// Feedback after an answer: verdict, the reasoning, and why each other choice fails.
export function Explanation({ q, chosen, className }: { q: QuestionContent; chosen: Letter | null; className?: string }) {
  const ok = chosen === q.answer;
  return (
    <div className={cn("animate-fade-up rounded-[12px] border border-line bg-surface-2/60 p-4 sm:p-5", className)}>
      <div className="flex items-center gap-2">
        <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-white", ok ? "bg-good-fill" : "bg-bad-fill")} aria-hidden>
          {ok ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
        </span>
        <p className={cn("text-[15px] font-semibold", ok ? "text-good" : "text-bad")}>
          {ok ? "Correct" : chosen ? `Not quite. The answer is ${q.answer}.` : `Left blank. The answer is ${q.answer}.`}
        </p>
      </div>
      <Rich html={q.explain} className="mt-3 text-[15px]" />
      {Object.keys(q.why).length ? (
        <div className="mt-4 border-t border-line pt-3.5">
          <p className="mb-2 text-[13px] font-medium text-ink-3">Why the other choices are wrong</p>
          <ul className="flex flex-col gap-2">
            {LETTERS.filter((L) => L !== q.answer && q.why[L]).map((L) => (
              <li key={L} className="flex gap-3 text-[14.5px] leading-relaxed">
                <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold", chosen === L ? "border-bad-fill text-bad" : "border-line-strong text-ink-3")}>{L}</span>
                <span className="rich text-ink-2" dangerouslySetInnerHTML={{ __html: q.why[L] ?? "" }} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
