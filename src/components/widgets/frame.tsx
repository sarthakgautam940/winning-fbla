import { cn } from "@/components/ui/primitives";

export function WidgetFrame({ title, hint, children, className }: { title: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("not-prose my-8 rounded-[var(--radius-lg)] border border-line bg-surface", className)}>
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-5 py-3">
        <p className="text-[14px] font-semibold text-ink">
          <span className="mr-2 text-ink-3">Interactive</span>
          {title}
        </p>
        {hint ? <p className="text-[12.5px] text-ink-3">{hint}</p> : null}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Stat({ label, value, sub, strong }: { label: string; value: React.ReactNode; sub?: React.ReactNode; strong?: boolean }) {
  return (
    <div className="rounded-[10px] border border-line px-3 py-2.5">
      <p className="text-[12px] text-ink-3">{label}</p>
      <p className={cn("tnum mt-0.5 text-[17px] text-ink", strong ? "font-semibold" : "font-medium")}>{value}</p>
      {sub ? <p className="mt-0.5 text-[11.5px] text-ink-3">{sub}</p> : null}
    </div>
  );
}

export function Slider({ label, value, min, max, step, onChange, format }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; format?: (v: number) => string }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-[13px]">
        <span className="text-ink-2">{label}</span>
        <span className="tnum font-medium text-ink">{format ? format(value) : value}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1.5 w-full accent-[var(--accent)]" />
    </label>
  );
}

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap rounded-[10px] border border-line bg-surface-2 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn("rounded-[8px] px-3 py-1.5 text-[13px] font-medium transition-colors", value === o.value ? "bg-surface text-ink shadow-[0_1px_2px_rgba(0,0,0,0.08)]" : "text-ink-3 hover:text-ink")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function MiniTable({ columns, rows, highlight, className }: { columns: string[]; rows: (string | number | null)[][]; highlight?: (i: number) => "good" | "bad" | "dim" | null; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-[10px] border border-line", className)}>
      <table className="w-full border-collapse text-[13px] tnum">
        <thead>
          <tr className="bg-surface-2">
            {columns.map((c) => (
              <th key={c} className="border-b border-line px-3 py-1.5 text-left font-semibold text-ink-2">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const h = highlight?.(i);
            return (
              <tr key={i} className={cn(h === "good" && "bg-good-soft", h === "bad" && "bg-bad-soft", h === "dim" && "opacity-40")}>
                {r.map((v, j) => (
                  <td key={j} className={cn("border-b border-line px-3 py-1.5 [tr:last-child_&]:border-b-0", v === null && "italic text-ink-3")}>
                    {v === null ? "NULL" : typeof v === "number" && !Number.isInteger(v) ? Number(v.toFixed(4)) : v}
                  </td>
                ))}
              </tr>
            );
          })}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-3 text-center text-ink-3">
                No rows
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
