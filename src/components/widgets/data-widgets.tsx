"use client";

import { useMemo, useState } from "react";
import { Button, cn } from "@/components/ui/primitives";
import { mean, median, modes, phi, quartiles, round, variance } from "@/lib/stats";
import { Segmented, Slider, Stat, WidgetFrame } from "./frame";

// ------------------------------------------------------------ base converter

const BASES = [
  { base: 2, name: "Binary", prefix: "0b", digits: /^[01]+$/ },
  { base: 8, name: "Octal", prefix: "0o", digits: /^[0-7]+$/ },
  { base: 10, name: "Decimal", prefix: "", digits: /^[0-9]+$/ },
  { base: 16, name: "Hexadecimal", prefix: "0x", digits: /^[0-9a-f]+$/i },
] as const;

export function BaseConverter() {
  const [base, setBase] = useState<2 | 8 | 10 | 16>(10);
  const [text, setText] = useState("173");
  const def = BASES.find((b) => b.base === base)!;
  const clean = text.trim().replace(/^0[box]/i, "");
  const valid = clean.length > 0 && def.digits.test(clean);
  const value = valid ? parseInt(clean, base) : NaN;
  const ok = valid && value <= 65535;
  const bits = ok ? value.toString(2) : "";
  const width = Math.max(8, Math.ceil(bits.length / 4) * 4);
  const padded = bits.padStart(width, "0");
  return (
    <WidgetFrame title="Base converter" hint="Type a number up to 65,535 in any base">
      <div className="flex flex-wrap items-end gap-3">
        <Segmented
          label="Input base"
          value={String(base) as "2" | "8" | "10" | "16"}
          options={BASES.map((b) => ({ value: String(b.base) as "2" | "8" | "10" | "16", label: `Base ${b.base}` }))}
          onChange={(v) => {
            const nb = Number(v) as 2 | 8 | 10 | 16;
            if (ok) setText(value.toString(nb).toUpperCase());
            setBase(nb);
          }}
        />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          aria-label="Number to convert"
          className="h-9 w-44 rounded-[10px] border border-line bg-surface px-3 font-mono text-[15px] uppercase text-ink outline-none focus:border-ink"
        />
      </div>
      {!valid ? (
        <p className="mt-3 text-[13.5px] text-bad">That is not a valid base-{base} number. Base {base} uses the digits {base === 16 ? "0 to 9 and A to F" : `0 to ${base - 1}`}.</p>
      ) : !ok ? (
        <p className="mt-3 text-[13.5px] text-bad">Keep it at or below 65,535 (16 bits) for this demo.</p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {BASES.map((b) => (
              <Stat key={b.base} label={b.name} value={<span className="font-mono text-[15px]">{value.toString(b.base).toUpperCase()}</span>} sub={b.prefix ? `${b.prefix}${value.toString(b.base).toUpperCase()}` : "base 10"} />
            ))}
          </div>
          <p className="mt-5 text-[13px] text-ink-2">Binary place values. Each 1 adds its power of two; groups of four bits are one hex digit.</p>
          <div className="mt-2 overflow-x-auto">
            <div className="inline-flex gap-3">
              {Array.from({ length: width / 4 }, (_, g) => (
                <div key={g} className="flex flex-col items-center">
                  <div className="flex gap-1">
                    {padded
                      .slice(g * 4, g * 4 + 4)
                      .split("")
                      .map((bit, k) => {
                        const power = width - 1 - (g * 4 + k);
                        return (
                          <div key={k} className={cn("flex w-11 flex-col items-center rounded-[8px] border py-1.5", bit === "1" ? "border-accent-line bg-accent-soft" : "border-line")}>
                            <span className="font-mono text-[16px] font-semibold text-ink">{bit}</span>
                            <span className="tnum text-[10.5px] text-ink-3">{2 ** power}</span>
                          </div>
                        );
                      })}
                  </div>
                  <span className="mt-1 font-mono text-[12px] text-ink-3">{parseInt(padded.slice(g * 4, g * 4 + 4), 2).toString(16).toUpperCase()}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="tnum mt-3 text-[13.5px] text-ink-2">
            {bits
              .split("")
              .map((b, i) => (b === "1" ? 2 ** (bits.length - 1 - i) : null))
              .filter((x) => x !== null)
              .join(" + ") || "0"}{" "}
            = <span className="font-semibold text-ink">{value.toLocaleString("en-US")}</span>
          </p>
        </>
      )}
    </WidgetFrame>
  );
}

// ------------------------------------------------------------ stats explorer

export function StatsExplorer() {
  const [text, setText] = useState("2, 4, 4, 5, 10");
  const xs = useMemo(
    () =>
      text
        .split(/[,\s]+/)
        .filter((t) => t !== "")
        .map(Number)
        .filter(Number.isFinite),
    [text],
  );
  const ok = xs.length >= 2;
  const sorted = [...xs].sort((a, b) => a - b);
  const q = ok ? quartiles(xs) : null;
  const ms = ok ? modes(xs) : [];
  const lo = Math.min(...xs);
  const hi = Math.max(...xs);
  const span = hi - lo || 1;
  const add = (v: number) => setText((t) => `${t.trim().replace(/,\s*$/, "")}, ${Number(v.toFixed(2))}`);
  return (
    <WidgetFrame title="Statistics explorer" hint="Edit the numbers, separated by commas">
      <input value={text} onChange={(e) => setText(e.target.value)} aria-label="Dataset" className="h-10 w-full rounded-[10px] border border-line bg-surface px-3 font-mono text-[14.5px] text-ink outline-none focus:border-ink" />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => ok && add(hi + 3 * span)} disabled={!ok}>
          Add a high outlier
        </Button>
        <Button size="sm" onClick={() => ok && add(mean(xs))} disabled={!ok}>
          Add a value at the mean
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setText("2, 4, 4, 5, 10")}>
          Reset
        </Button>
      </div>
      {!ok ? (
        <p className="mt-4 text-[13.5px] text-ink-3">Enter at least two numbers.</p>
      ) : (
        <>
          <svg viewBox="0 0 520 70" className="mt-5 w-full" role="img" aria-label="Dot plot of the data">
            <line x1={20} x2={500} y1={52} y2={52} stroke="var(--axis)" />
            {(() => {
              const seen = new Map<number, number>();
              return sorted.map((v, i) => {
                const k = seen.get(v) ?? 0;
                seen.set(v, k + 1);
                const x = 20 + ((v - lo) / span) * 480;
                return <circle key={i} cx={x} cy={44 - k * 11} r={5} fill="var(--series-1)" />;
              });
            })()}
            <line x1={20 + ((mean(xs) - lo) / span) * 480} x2={20 + ((mean(xs) - lo) / span) * 480} y1={8} y2={56} stroke="var(--series-2)" strokeWidth={2} />
            <line x1={20 + ((median(xs) - lo) / span) * 480} x2={20 + ((median(xs) - lo) / span) * 480} y1={8} y2={56} stroke="var(--ink)" strokeWidth={2} />
            <text x={20} y={68} fontSize={11} fill="var(--ink-3)">
              {round(lo)}
            </text>
            <text x={500} y={68} fontSize={11} fill="var(--ink-3)" textAnchor="end">
              {round(hi)}
            </text>
          </svg>
          <p className="mt-1 flex gap-4 text-[12px] text-ink-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-[2px] w-3 bg-[var(--series-2)]" /> mean
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-[2px] w-3 bg-ink" /> median
            </span>
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="n" value={xs.length} />
            <Stat label="Mean" value={round(mean(xs), 3)} strong />
            <Stat label="Median" value={round(median(xs), 3)} strong />
            <Stat label="Mode" value={ms.length ? ms.map((m) => round(m)).join(", ") : "none"} />
            <Stat label="Range" value={round(hi - lo, 3)} />
            <Stat label="Q1 and Q3" value={`${round(q!.q1, 2)}, ${round(q!.q3, 2)}`} sub={`IQR ${round(q!.q3 - q!.q1, 2)}`} />
            <Stat label="Population SD (÷ N)" value={round(Math.sqrt(variance(xs, false)), 3)} sub={`variance ${round(variance(xs, false), 3)}`} />
            <Stat label="Sample SD (÷ n − 1)" value={round(Math.sqrt(variance(xs, true)), 3)} sub={`variance ${round(variance(xs, true), 3)}`} />
          </div>
        </>
      )}
    </WidgetFrame>
  );
}

// ------------------------------------------------------------ normal explorer

export function NormalExplorer() {
  const [z, setZ] = useState(1);
  const [mode, setMode] = useState<"left" | "between" | "right">("between");
  const area = mode === "left" ? phi(z) : mode === "right" ? 1 - phi(z) : phi(Math.abs(z)) - phi(-Math.abs(z));
  const W = 520;
  const H = 200;
  const x = (v: number) => 20 + ((v + 3.8) / 7.6) * (W - 40);
  const y = (v: number) => H - 30 - (v / 0.42) * (H - 50);
  const pdf = (v: number) => Math.exp(-0.5 * v * v) / Math.sqrt(2 * Math.PI);
  const curve: string[] = [];
  for (let i = 0; i <= 160; i++) {
    const v = -3.8 + (7.6 * i) / 160;
    curve.push(`${x(v).toFixed(1)},${y(pdf(v)).toFixed(1)}`);
  }
  const [a, b] = mode === "left" ? [-3.8, z] : mode === "right" ? [z, 3.8] : [-Math.abs(z), Math.abs(z)];
  const shade: string[] = [`M${x(a)},${y(0)}`];
  for (let i = 0; i <= 100; i++) {
    const v = a + ((b - a) * i) / 100;
    shade.push(`L${x(v).toFixed(1)},${y(pdf(v)).toFixed(1)}`);
  }
  shade.push(`L${x(b)},${y(0)}Z`);
  return (
    <WidgetFrame title="Area under the normal curve" hint="Move z and pick a region">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="Region"
          value={mode}
          onChange={setMode}
          options={[
            { value: "left", label: "Left of z" },
            { value: "between", label: "Between −z and z" },
            { value: "right", label: "Right of z" },
          ]}
        />
        <div className="flex gap-1.5">
          {[1, 2, 3].map((k) => (
            <Button key={k} size="sm" variant="ghost" onClick={() => (setZ(k), setMode("between"))}>
              ±{k}σ
            </Button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full" role="img" aria-label={`Shaded area ${round(area * 100, 2)} percent`}>
        <path d={shade.join("")} fill="var(--series-1)" fillOpacity={0.22} />
        <polyline points={curve.join(" ")} fill="none" stroke="var(--series-1)" strokeWidth={2} />
        <line x1={20} x2={W - 20} y1={y(0)} y2={y(0)} stroke="var(--axis)" />
        {[-3, -2, -1, 0, 1, 2, 3].map((k) => (
          <text key={k} x={x(k)} y={H - 10} textAnchor="middle" fontSize={11.5} fill="var(--ink-3)">
            {k}
          </text>
        ))}
      </svg>
      <div className="mt-2">
        <Slider label="z" value={z} min={-3.5} max={3.5} step={0.01} onChange={setZ} format={(v) => v.toFixed(2)} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat label="Shaded area" value={`${round(area * 100, 2)}%`} strong />
        <Stat label="As a probability" value={round(area, 4)} />
        <Stat label="Percentile of z" value={`${round(phi(z) * 100, 1)}th`} />
      </div>
    </WidgetFrame>
  );
}

// ------------------------------------------------------------ bayes explorer

export function BayesExplorer() {
  const [prev, setPrev] = useState(1);
  const [sens, setSens] = useState(95);
  const [fpr, setFpr] = useState(5);
  const N = 10000;
  const sick = (N * prev) / 100;
  const healthy = N - sick;
  const tp = (sick * sens) / 100;
  const fn = sick - tp;
  const fp = (healthy * fpr) / 100;
  const tn = healthy - fp;
  const post = tp / (tp + fp || 1);
  const f = (v: number) => Math.round(v).toLocaleString("en-US");
  return (
    <WidgetFrame title="Bayes with natural frequencies" hint="Out of 10,000 people">
      <div className="grid gap-4 sm:grid-cols-3">
        <Slider label="Prevalence (prior)" value={prev} min={0.1} max={50} step={0.1} onChange={setPrev} format={(v) => `${v}%`} />
        <Slider label="Sensitivity" value={sens} min={50} max={100} step={1} onChange={setSens} format={(v) => `${v}%`} />
        <Slider label="False positive rate" value={fpr} min={0} max={30} step={0.5} onChange={setFpr} format={(v) => `${v}%`} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[10px] border border-line p-3.5 text-[14px]">
          <p className="font-medium text-ink">{f(sick)} have the condition</p>
          <p className="mt-1 text-ink-2">
            {f(tp)} test positive <span className="text-ink-3">(true positives)</span>
          </p>
          <p className="text-ink-2">
            {f(fn)} test negative <span className="text-ink-3">(false negatives)</span>
          </p>
        </div>
        <div className="rounded-[10px] border border-line p-3.5 text-[14px]">
          <p className="font-medium text-ink">{f(healthy)} do not</p>
          <p className="mt-1 text-ink-2">
            {f(fp)} test positive <span className="text-ink-3">(false positives)</span>
          </p>
          <p className="text-ink-2">
            {f(tn)} test negative <span className="text-ink-3">(true negatives)</span>
          </p>
        </div>
      </div>
      <div className="mt-5">
        <p className="text-[13px] text-ink-2">Everyone who tested positive ({f(tp + fp)} people)</p>
        <div className="mt-2 flex h-4 overflow-hidden rounded-full bg-surface-3">
          <div className="h-full bg-[var(--series-1)]" style={{ width: `${post * 100}%` }} />
          <div className="h-full bg-[var(--series-2)] opacity-70" style={{ width: `${(1 - post) * 100}%`, marginLeft: post > 0 && post < 1 ? 2 : 0 }} />
        </div>
        <div className="mt-1.5 flex justify-between text-[12px] text-ink-3">
          <span>Truly have it: {f(tp)}</span>
          <span>False alarms: {f(fp)}</span>
        </div>
      </div>
      <div className="mt-4 rounded-[10px] bg-surface-2 px-4 py-3 text-[14.5px] text-ink">
        P(condition | positive) = {f(tp)} / ({f(tp)} + {f(fp)}) = <span className="font-semibold">{round(post * 100, 1)}%</span>
      </div>
    </WidgetFrame>
  );
}
