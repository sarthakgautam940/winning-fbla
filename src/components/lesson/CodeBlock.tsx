"use client";

import { useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

const LANG: Record<string, string> = { python: "Python", sql: "SQL", r: "R", json: "JSON", bash: "Shell", yaml: "YAML", csv: "CSV", xml: "XML", text: "Text", output: "Output" };

export function CodeBlock({ lang, children }: { lang: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    const text = ref.current?.querySelector("pre")?.textContent ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // clipboard blocked; nothing to do
    }
  };
  return (
    <div className="code-block group relative my-5" ref={ref}>
      <div className="pointer-events-none absolute right-3 top-2 z-10 flex items-center gap-2">
        <span className="text-[11.5px] font-medium text-ink-3">{LANG[lang] ?? lang}</span>
        {lang !== "output" ? (
          <button
            type="button"
            onClick={copy}
            className="pointer-events-auto flex h-6 w-6 items-center justify-center rounded-md text-ink-3 opacity-0 transition-opacity hover:bg-surface-3 hover:text-ink focus:opacity-100 group-hover:opacity-100"
            aria-label="Copy code"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
        ) : null}
      </div>
      {children}
    </div>
  );
}
