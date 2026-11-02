"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/components/ui/primitives";

// A basic four-function calculator with memory, square root and percent: the
// kind of on-screen calculator the testing platform provides. Immediate
// execution, like a handheld: 2 + 3 × 4 = 20.

type Op = "+" | "−" | "×" | "÷" | null;

function apply(a: number, b: number, op: Op): number {
  switch (op) {
    case "+":
      return a + b;
    case "−":
      return a - b;
    case "×":
      return a * b;
    case "÷":
      return b === 0 ? NaN : a / b;
    default:
      return b;
  }
}

function show(n: number): string {
  if (!Number.isFinite(n)) return "Error";
  const s = Number(n.toPrecision(12)).toString();
  return s.length > 14 ? n.toExponential(8) : s;
}

export function Calculator({ onClose }: { onClose: () => void }) {
  const [display, setDisplay] = useState("0");
  const [acc, setAcc] = useState<number | null>(null);
  const [op, setOp] = useState<Op>(null);
  const [fresh, setFresh] = useState(true);
  const [mem, setMem] = useState(0);
  const panel = useRef<HTMLDivElement>(null);

  const value = Number(display);
  const digit = useCallback(
    (d: string) => {
      if (display === "Error") {
        setDisplay(d === "." ? "0." : d);
        setFresh(false);
        return;
      }
      if (fresh) {
        setDisplay(d === "." ? "0." : d);
        setFresh(false);
      } else if (!(d === "." && display.includes(".")) && display.replace(/[-.]/g, "").length < 14) {
        setDisplay(display === "0" && d !== "." ? d : display + d);
      }
    },
    [display, fresh],
  );
  const operate = useCallback(
    (next: Op) => {
      const result = acc === null || fresh ? (acc === null ? value : acc) : apply(acc, value, op);
      setAcc(result);
      setDisplay(show(result));
      setOp(next);
      setFresh(true);
    },
    [acc, fresh, op, value],
  );
  const equals = useCallback(() => {
    if (op === null || acc === null) return;
    const r = apply(acc, value, op);
    setDisplay(show(r));
    setAcc(null);
    setOp(null);
    setFresh(true);
  }, [acc, op, value]);
  const clear = () => {
    setDisplay("0");
    setAcc(null);
    setOp(null);
    setFresh(true);
  };
  const back = useCallback(() => {
    if (fresh) return;
    setDisplay(display.length > 1 && !(display.length === 2 && display.startsWith("-")) ? display.slice(0, -1) : "0");
  }, [display, fresh]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!panel.current?.contains(document.activeElement)) return;
      if (/^[0-9.]$/.test(e.key)) digit(e.key);
      else if (e.key === "+") operate("+");
      else if (e.key === "-") operate("−");
      else if (e.key === "*") operate("×");
      else if (e.key === "/") operate("÷");
      else if (e.key === "Enter" || e.key === "=") equals();
      else if (e.key === "Backspace") back();
      else if (e.key === "Escape") onClose();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [digit, operate, equals, back, onClose]);

  const key = (label: string, onClick: () => void, tone: "num" | "op" | "fn" | "eq" = "num", wide = false) => (
    <button
      key={label}
      type="button"
      onClick={onClick}
      className={cn(
        "h-11 rounded-[10px] text-[15px] font-medium transition-colors",
        wide && "col-span-2",
        tone === "num" && "bg-surface-2 text-ink hover:bg-surface-3",
        tone === "op" && "bg-surface-3 text-ink hover:bg-line",
        tone === "fn" && "bg-transparent text-ink-2 hover:bg-surface-2",
        tone === "eq" && "bg-ink text-bg hover:opacity-90",
      )}
    >
      {label}
    </button>
  );

  return (
    <div ref={panel} tabIndex={-1} className="animate-fade-up fixed bottom-24 right-4 z-[60] w-[272px] rounded-[16px] border border-line bg-surface p-3 shadow-[var(--shadow-pop)] outline-none" role="dialog" aria-label="Calculator">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-[12.5px] font-medium text-ink-3">Calculator{mem !== 0 ? "  M" : ""}</span>
        <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full text-ink-3 hover:bg-surface-2 hover:text-ink" aria-label="Close calculator">
          <X size={15} />
        </button>
      </div>
      <div className="mb-3 flex items-center gap-1 rounded-[10px] bg-surface-2 py-1 pl-3 pr-1">
        <div className="tnum min-w-0 flex-1 truncate text-right text-[26px] font-medium text-ink" aria-live="polite">
          {display}
        </div>
        <button type="button" onClick={back} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] text-[15px] text-ink-3 hover:bg-surface-3 hover:text-ink" aria-label="Backspace">
          ⌫
        </button>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {key("MC", () => setMem(0), "fn")}
        {key("MR", () => (setDisplay(show(mem)), setFresh(true)), "fn")}
        {key("M−", () => (setMem(mem - value), setFresh(true)), "fn")}
        {key("M+", () => (setMem(mem + value), setFresh(true)), "fn")}
        {key("C", clear, "fn")}
        {key("√", () => (setDisplay(show(Math.sqrt(value))), setFresh(true)), "op")}
        {key("%", () => (setDisplay(show(acc !== null && (op === "+" || op === "−") ? (acc * value) / 100 : value / 100)), setFresh(true)), "op")}
        {key("÷", () => operate("÷"), "op")}
        {key("7", () => digit("7"))}
        {key("8", () => digit("8"))}
        {key("9", () => digit("9"))}
        {key("×", () => operate("×"), "op")}
        {key("4", () => digit("4"))}
        {key("5", () => digit("5"))}
        {key("6", () => digit("6"))}
        {key("−", () => operate("−"), "op")}
        {key("1", () => digit("1"))}
        {key("2", () => digit("2"))}
        {key("3", () => digit("3"))}
        {key("+", () => operate("+"), "op")}
        {key("±", () => setDisplay(show(-value)), "fn")}
        {key("0", () => digit("0"))}
        {key(".", () => digit("."))}
        {key("=", equals, "eq")}
      </div>
    </div>
  );
}
