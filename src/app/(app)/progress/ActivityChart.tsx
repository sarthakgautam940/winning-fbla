"use client";

import { useState } from "react";
import type { DayActivity } from "@/lib/analytics";
import { niceTicks } from "@/components/figures/scale";
import { cn } from "@/components/ui/primitives";

// Stacked daily bars: correct (good) under wrong (critical), 2px surface gap,
// rounded data end only. Hover or focus a day for exact numbers; a table view
// carries the same values for anyone who prefers it.
export function ActivityChart({ days }: { days: DayActivity[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const W = 720;
  const H = 210;
  const m = { l: 34, r: 8, t: 12, b: 26 };
  const max = Math.max(4, ...days.map((d) => d.correct + d.wrong));
  const yt = niceTicks(0, max, 4);
  const band = (W - m.l - m.r) / days.length;
  const bw = Math.min(18, band - 4);
  const y = (v: number) => H - m.b - (v / yt.hi) * (H - m.t - m.b);
  const fmtDay = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const h = hover !== null ? days[hover] : null;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-4 text-[12.5px] text-ink-2">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[3px] bg-good-fill" /> Correct
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[3px] bg-bad-fill" /> Wrong
          </span>
        </div>
        <button type="button" onClick={() => setTable((t) => !t)} className="text-[12.5px] text-ink-3 underline-offset-4 hover:text-ink hover:underline">
          {table ? "Show chart" : "Show as table"}
        </button>
      </div>
      {table ? (
        <div className="max-h-72 overflow-y-auto rounded-[10px] border border-line">
          <table className="w-full text-[13px] tnum">
            <thead className="sticky top-0 bg-surface-2">
              <tr>
                <th className="px-3 py-1.5 text-left font-semibold text-ink-2">Day</th>
                <th className="px-3 py-1.5 text-right font-semibold text-ink-2">Correct</th>
                <th className="px-3 py-1.5 text-right font-semibold text-ink-2">Wrong</th>
                <th className="px-3 py-1.5 text-right font-semibold text-ink-2">Minutes</th>
              </tr>
            </thead>
            <tbody>
              {[...days].reverse().map((d) => (
                <tr key={d.day} className="border-t border-line">
                  <td className="px-3 py-1.5 text-ink-2">{fmtDay(d.day)}</td>
                  <td className="px-3 py-1.5 text-right text-ink">{d.correct}</td>
                  <td className="px-3 py-1.5 text-right text-ink">{d.wrong}</td>
                  <td className="px-3 py-1.5 text-right text-ink">{Math.round(d.ms / 60000)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Questions answered per day, correct and wrong">
            {yt.ticks.map((t) => (
              <g key={t}>
                <line x1={m.l} x2={W - m.r} y1={y(t)} y2={y(t)} stroke="var(--grid)" />
                <text x={m.l - 6} y={y(t) + 4} textAnchor="end" fontSize={11} fill="var(--ink-3)" className="tnum">
                  {t}
                </text>
              </g>
            ))}
            {days.map((d, i) => {
              const cx = m.l + band * i + band / 2;
              const x = cx - bw / 2;
              const yc = y(d.correct);
              const yw = y(d.correct + d.wrong);
              const base = H - m.b;
              const top = d.wrong ? yw : yc;
              return (
                <g key={d.day} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0} aria-label={`${fmtDay(d.day)}: ${d.correct} correct, ${d.wrong} wrong`}>
                  <rect x={cx - band / 2} y={m.t} width={band} height={H - m.t - m.b} fill="transparent" />
                  {d.correct ? <path d={d.wrong ? `M${x},${base}V${yc}H${x + bw}V${base}Z` : `M${x},${base}V${yc + 4}Q${x},${yc} ${x + 4},${yc}H${x + bw - 4}Q${x + bw},${yc} ${x + bw},${yc + 4}V${base}Z`} fill="var(--good-fill)" /> : null}
                  {d.wrong ? <path d={`M${x},${yc - (d.correct ? 2 : 0)}V${top + 4}Q${x},${top} ${x + 4},${top}H${x + bw - 4}Q${x + bw},${top} ${x + bw},${top + 4}V${yc - (d.correct ? 2 : 0)}Z`} fill="var(--bad-fill)" /> : null}
                  {hover === i ? <rect x={cx - band / 2 + 1} y={m.t} width={band - 2} height={H - m.t - m.b} fill="var(--ink)" opacity={0.05} rx={4} /> : null}
                  {i % 7 === days.length % 7 || i === days.length - 1 ? (
                    <text x={cx} y={H - 8} textAnchor="middle" fontSize={11} fill="var(--ink-3)">
                      {fmtDay(d.day)}
                    </text>
                  ) : null}
                </g>
              );
            })}
            <line x1={m.l} x2={W - m.r} y1={H - m.b} y2={H - m.b} stroke="var(--axis)" />
          </svg>
          {h ? (
            <div
              className={cn("pointer-events-none absolute top-1 rounded-[10px] border border-line bg-surface px-3 py-2 text-[12.5px] shadow-[var(--shadow-pop)]")}
              style={{ left: `${Math.min(80, Math.max(2, ((hover! + 0.5) / days.length) * 100 - 8))}%` }}
            >
              <p className="font-semibold text-ink">{fmtDay(h.day)}</p>
              <p className="tnum text-ink-2">
                {h.correct} correct, {h.wrong} wrong
              </p>
              <p className="tnum text-ink-3">{Math.round(h.ms / 60000)} min studied</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
