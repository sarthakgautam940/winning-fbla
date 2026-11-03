"use client";

import { Check, X } from "lucide-react";
import type { Letter } from "@/lib/content-types";
import { LETTERS } from "@/lib/content-types";
import { cn } from "@/components/ui/primitives";

export interface OptionsProps {
  name: string;
  options: string[];
  selected: Letter | null;
  onSelect?: (l: Letter) => void;
  answer?: Letter; // set once the answer is revealed
  eliminated?: Letter[];
  onToggleEliminate?: (l: Letter) => void;
  disabled?: boolean;
  size?: "md" | "lg";
}

export function Options({ name, options, selected, onSelect, answer, eliminated = [], onToggleEliminate, disabled, size = "md" }: OptionsProps) {
  const revealed = answer !== undefined;
  return (
    <div role="radiogroup" aria-label={`${name} answer choices`} className="flex flex-col gap-2.5">
      {options.map((html, i) => {
        const L = LETTERS[i];
        const isSel = selected === L;
        const isAns = revealed && answer === L;
        const isWrongPick = revealed && isSel && answer !== L;
        const isOut = !revealed && eliminated.includes(L);
        return (
          <div key={L} className="group relative">
            <button
              type="button"
              role="radio"
              aria-checked={isSel}
              disabled={disabled || revealed}
              onClick={() => onSelect?.(L)}
              className={cn(
                "flex w-full items-start gap-3.5 rounded-[12px] border px-4 text-left transition-[background-color,border-color,opacity] duration-150",
                size === "lg" ? "py-3.5" : "py-3",
                !revealed && !isSel && "border-line bg-surface hover:border-line-strong hover:bg-surface-2",
                !revealed && isSel && "border-ink bg-surface-2 shadow-[inset_0_0_0_1px_var(--ink)]",
                isAns && "border-good-line bg-good-soft",
                isWrongPick && "border-bad-line bg-bad-soft",
                revealed && !isAns && !isWrongPick && "border-line bg-surface opacity-60",
                isOut && "opacity-45",
                onToggleEliminate && !revealed && "pr-11",
              )}
            >
              <span
                className={cn(
                  "mt-px flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[13px] font-semibold transition-colors",
                  !revealed && !isSel && "border-line-strong text-ink-2",
                  !revealed && isSel && "border-ink bg-ink text-bg",
                  isAns && "border-good-fill bg-good-fill text-white",
                  isWrongPick && "border-bad-fill bg-bad-fill text-white",
                  revealed && !isAns && !isWrongPick && "border-line-strong text-ink-3",
                )}
                aria-hidden
              >
                {isAns ? <Check size={15} strokeWidth={3} /> : isWrongPick ? <X size={15} strokeWidth={3} /> : L}
              </span>
              <span className={cn("rich q-option min-w-0 flex-1 pt-[3px] text-[15.5px] text-ink", isOut && "line-through decoration-ink-3")}>
                <span className="sr-only">{`Choice ${L}: `}</span>
                <span dangerouslySetInnerHTML={{ __html: html }} />
              </span>
            </button>
            {onToggleEliminate && !revealed ? (
              <button
                type="button"
                onClick={() => onToggleEliminate(L)}
                className={cn(
                  "absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-ink-3 transition-opacity hover:bg-surface-3 hover:text-ink",
                  isOut ? "opacity-100" : "opacity-0 focus:opacity-100 group-hover:opacity-100",
                )}
                aria-label={isOut ? `Restore choice ${L}` : `Cross out choice ${L}`}
                title={isOut ? "Restore" : "Cross out"}
              >
                <X size={15} />
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
