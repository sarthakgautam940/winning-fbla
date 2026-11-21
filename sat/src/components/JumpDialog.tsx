"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { findQuestion, subKeyOf } from "@/lib/bank";
import { scopeHref } from "@/lib/scope";

// Ctrl+Shift+F (or Cmd+Shift+F): type a question like 5c, M5c or R15z and open it.
export function JumpDialog() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [miss, setMiss] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setOpen(true);
        setValue("");
        setMiss(false);
        setTimeout(() => input.current?.focus(), 0);
      } else if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!open) return null;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = findQuestion(value);
    if (!q) {
      setMiss(true);
      return;
    }
    setOpen(false);
    router.push(scopeHref({ kind: "sub", value: subKeyOf(q), start: q.id }));
  };
  return (
    <div className="overlay" onMouseDown={() => setOpen(false)} data-noadvance>
      <form className="jump" onMouseDown={(e) => e.stopPropagation()} onSubmit={submit}>
        <label htmlFor="jump" className="h3">
          Jump to a question
        </label>
        <input
          id="jump"
          ref={input}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setMiss(false);
          }}
          placeholder="5c, M5c, or R15z"
          autoComplete="off"
        />
        <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>
          {miss ? "No question with that number." : "Math codes start with M, Reading and Writing codes with R. Without a letter, Math comes first."}
        </p>
      </form>
    </div>
  );
}
