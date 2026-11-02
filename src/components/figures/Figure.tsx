import type { FigureSpec, TreeNode } from "@/lib/content-types";
import { barPath, fmt, linear, niceTicks, SERIES, textWidth, type Scale } from "./scale";

// Every chart and diagram in lessons and questions is drawn here from a spec.
// Pure SVG and no hooks, so it renders on the server and inside client views.

type Spec<T extends FigureSpec["type"]> = Extract<FigureSpec, { type: T }>;

const W = 560;
const FONT = 12.5;
const INK2 = "var(--ink-2)";
const INK3 = "var(--ink-3)";
const GRID = "var(--grid)";
const AXIS = "var(--axis)";
const SURFACE = "var(--surface)";

function Frame({ caption, width = W, height, children, label }: { caption?: string; width?: number; height: number; children: React.ReactNode; label: string }) {
  return (
    <figure className="my-6 not-prose">
      <div className="rounded-[var(--radius-lg)] border border-line bg-surface px-3 py-4 sm:px-5">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={caption ?? label} className="mx-auto block h-auto w-full" style={{ maxWidth: width, fontFamily: "var(--font-sans)" }}>
          <title>{caption ?? label}</title>
          {children}
        </svg>
      </div>
      {caption ? <figcaption className="mt-2 px-1 text-[13.5px] leading-snug text-ink-2">{caption}</figcaption> : null}
    </figure>
  );
}

// ------------------------------------------------------------------- axes

function XAxis({ x, y0, ticks, label, height, labelFor }: { x: Scale; y0: number; ticks: number[]; label?: string; height: number; labelFor?: (v: number) => string }) {
  return (
    <g>
      <line x1={x.range[0]} x2={x.range[1]} y1={y0} y2={y0} stroke={AXIS} strokeWidth={1} />
      {ticks.map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={y0} y2={y0 + 4} stroke={AXIS} />
          <text x={x(t)} y={y0 + 17} textAnchor="middle" fontSize={FONT - 1} fill={INK3} className="tnum">
            {labelFor ? labelFor(t) : fmt(t)}
          </text>
        </g>
      ))}
      {label ? (
        <text x={(x.range[0] + x.range[1]) / 2} y={height - 6} textAnchor="middle" fontSize={FONT} fill={INK2}>
          {label}
        </text>
      ) : null}
    </g>
  );
}

function YAxis({ y, x0, x1, ticks, label, grid = true }: { y: Scale; x0: number; x1: number; ticks: number[]; label?: string; grid?: boolean }) {
  return (
    <g>
      {ticks.map((t) => (
        <g key={t}>
          {grid ? <line x1={x0} x2={x1} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} /> : null}
          <text x={x0 - 8} y={y(t) + 4} textAnchor="end" fontSize={FONT - 1} fill={INK3} className="tnum">
            {fmt(t)}
          </text>
        </g>
      ))}
      {label ? (
        <text transform={`translate(14 ${(y.range[0] + y.range[1]) / 2}) rotate(-90)`} textAnchor="middle" fontSize={FONT} fill={INK2}>
          {label}
        </text>
      ) : null}
    </g>
  );
}

function Legend({ items, x, y }: { items: { name: string; color: string; kind?: "dot" | "line" }[]; x: number; y: number }) {
  const starts = items.reduce<number[]>((acc, it, i) => [...acc, i === 0 ? x : acc[i - 1] + 22 + textWidth(items[i - 1].name, FONT - 0.5) + 14], []);
  return (
    <g>
      {items.map((it, i) => {
        const start = starts[i];
        return (
          <g key={it.name} transform={`translate(${start} ${y})`}>
            {it.kind === "line" ? <line x1={0} x2={14} y1={0} y2={0} stroke={it.color} strokeWidth={2.5} strokeLinecap="round" /> : <circle cx={6} cy={0} r={5} fill={it.color} />}
            <text x={20} y={4} fontSize={FONT - 0.5} fill={INK2}>
              {it.name}
            </text>
          </g>
        );
      })}
    </g>
  );
}

// --------------------------------------------------------------- histogram

function Histogram({ spec }: { spec: Spec<"histogram"> }) {
  const H = 300;
  const m = { l: 56, r: 16, t: 14, b: 50 };
  const lo = Math.min(...spec.bins.map((b) => b.from));
  const hi = Math.max(...spec.bins.map((b) => b.to));
  const maxC = Math.max(...spec.bins.map((b) => b.count));
  const yt = niceTicks(0, maxC, 5);
  const x = linear([lo, hi], [m.l, W - m.r]);
  const y = linear([0, yt.hi], [H - m.b, m.t]);
  const edges = [...new Set(spec.bins.flatMap((b) => [b.from, b.to]))].sort((a, b) => a - b);
  const step = edges.length > 12 ? Math.ceil(edges.length / 12) : 1;
  return (
    <Frame caption={spec.caption} height={H} label="Histogram">
      <YAxis y={y} x0={m.l} x1={W - m.r} ticks={yt.ticks} label={spec.yLabel ?? "Frequency"} />
      {spec.bins.map((b, i) => {
        const x0 = x(b.from) + 1;
        const x1 = x(b.to) - 1;
        const top = y(b.count);
        return <path key={i} d={barPath(x0, top, x1 - x0, H - m.b - top, "up", 3)} fill="var(--series-1)" />;
      })}
      <XAxis x={x} y0={H - m.b} ticks={edges.filter((_, i) => i % step === 0)} label={spec.xLabel} height={H} />
    </Frame>
  );
}

// --------------------------------------------------------------------- bar

function Bar({ spec }: { spec: Spec<"bar"> }) {
  const multi = spec.series.length > 1;
  const horizontal = !!spec.horizontal;
  const H = horizontal ? Math.max(180, 56 + spec.categories.length * (multi && !spec.stacked ? 18 * spec.series.length + 16 : 36)) : 300;
  const longest = Math.max(...spec.categories.map((c) => textWidth(c, FONT - 1)));
  const m = horizontal ? { l: Math.min(200, longest + 20), r: 30, t: multi ? 34 : 12, b: 44 } : { l: 56, r: 16, t: multi ? 34 : 14, b: 56 };
  const totals = spec.categories.map((_, i) => (spec.stacked ? spec.series.reduce((s, se) => s + Math.max(0, se.values[i] ?? 0), 0) : Math.max(...spec.series.map((se) => se.values[i] ?? 0))));
  const minV = Math.min(0, ...spec.series.flatMap((s) => s.values));
  const vt = niceTicks(minV, Math.max(...totals), 5);
  const n = spec.categories.length;
  const legend = multi ? <Legend items={spec.series.map((s, i) => ({ name: s.name ?? `Series ${i + 1}`, color: SERIES[i] }))} x={horizontal ? m.l : m.l} y={14} /> : null;

  if (horizontal) {
    const v = linear([vt.lo, vt.hi], [m.l, W - m.r]);
    const band = (H - m.t - m.b) / n;
    return (
      <Frame caption={spec.caption} height={H} label="Bar chart">
        {legend}
        {vt.ticks.map((t) => (
          <g key={t}>
            <line x1={v(t)} x2={v(t)} y1={m.t} y2={H - m.b} stroke={GRID} />
            <text x={v(t)} y={H - m.b + 16} textAnchor="middle" fontSize={FONT - 1} fill={INK3} className="tnum">
              {fmt(t)}
            </text>
          </g>
        ))}
        {spec.categories.map((c, i) => {
          const cy = m.t + band * i + band / 2;
          let acc = 0;
          const k = spec.stacked || !multi ? 1 : spec.series.length;
          const th = Math.min(22, (band - 10) / k);
          return (
            <g key={c}>
              <text x={m.l - 10} y={cy + 4} textAnchor="end" fontSize={FONT - 0.5} fill={INK2}>
                {c}
              </text>
              {spec.series.map((s, j) => {
                const val = s.values[i] ?? 0;
                if (spec.stacked) {
                  const x0 = v(acc);
                  acc += val;
                  const last = j === spec.series.length - 1;
                  return <path key={j} d={last ? barPath(x0 + (j ? 1 : 0), cy - th / 2, v(acc) - x0 - (j ? 1 : 0), th, "right") : `M${x0 + (j ? 1 : 0)},${cy - th / 2}H${v(acc) - 1}V${cy + th / 2}H${x0 + (j ? 1 : 0)}Z`} fill={SERIES[j]} />;
                }
                const y0 = cy - (k * th + (k - 1) * 2) / 2 + j * (th + 2);
                return <path key={j} d={barPath(v(0), y0, v(val) - v(0), th, "right")} fill={SERIES[multi ? j : 0]} />;
              })}
              {!multi ? (
                <text x={v(spec.series[0].values[i] ?? 0) + 6} y={cy + 4} fontSize={FONT - 1} fill={INK2} className="tnum">
                  {fmt(spec.series[0].values[i] ?? 0)}
                </text>
              ) : null}
            </g>
          );
        })}
        <line x1={v(0)} x2={v(0)} y1={m.t} y2={H - m.b} stroke={AXIS} />
        {spec.yLabel ? (
          <text x={(m.l + W - m.r) / 2} y={H - 8} textAnchor="middle" fontSize={FONT} fill={INK2}>
            {spec.yLabel}
          </text>
        ) : null}
      </Frame>
    );
  }

  const v = linear([vt.lo, vt.hi], [H - m.b, m.t]);
  const band = (W - m.l - m.r) / n;
  return (
    <Frame caption={spec.caption} height={H} label="Bar chart">
      {legend}
      <YAxis y={v} x0={m.l} x1={W - m.r} ticks={vt.ticks} label={spec.yLabel} />
      {spec.categories.map((c, i) => {
        const cx = m.l + band * i + band / 2;
        const k = spec.stacked || !multi ? 1 : spec.series.length;
        const bw = Math.min(24, (band - 12) / k);
        let acc = 0;
        return (
          <g key={c}>
            {spec.series.map((s, j) => {
              const val = s.values[i] ?? 0;
              if (spec.stacked) {
                const yb = v(acc);
                acc += val;
                const last = j === spec.series.length - 1;
                const top = v(acc);
                return last ? (
                  <path key={j} d={barPath(cx - bw / 2, top, bw, yb - top - (j ? 2 : 0), "up")} fill={SERIES[j]} />
                ) : (
                  <rect key={j} x={cx - bw / 2} y={top} width={bw} height={Math.max(0, yb - top - (j ? 2 : 0))} fill={SERIES[j]} />
                );
              }
              const x0 = cx - (k * bw + (k - 1) * 2) / 2 + j * (bw + 2);
              const top = v(Math.max(0, val));
              return <path key={j} d={barPath(x0, top, bw, Math.abs(v(val) - v(0)), "up")} fill={SERIES[multi ? j : 0]} />;
            })}
            <text x={cx} y={H - m.b + 17} textAnchor="middle" fontSize={FONT - 1} fill={INK2}>
              {c.length > 16 && n > 4 ? `${c.slice(0, 15)}…` : c}
            </text>
          </g>
        );
      })}
      <line x1={m.l} x2={W - m.r} y1={v(0)} y2={v(0)} stroke={AXIS} />
      {spec.xLabel ? (
        <text x={(m.l + W - m.r) / 2} y={H - 8} textAnchor="middle" fontSize={FONT} fill={INK2}>
          {spec.xLabel}
        </text>
      ) : null}
    </Frame>
  );
}

// -------------------------------------------------------------- line, scatter

function extent(points: [number, number][], i: 0 | 1, extra: number[] = []): [number, number] {
  const vals = [...points.map((p) => p[i]), ...extra];
  return [Math.min(...vals), Math.max(...vals)];
}

function Line({ spec }: { spec: Spec<"line"> }) {
  const H = 300;
  const multi = spec.series.length > 1;
  const m = { l: 56, r: 22, t: multi ? 34 : 14, b: 50 };
  const all = spec.series.flatMap((s) => s.points);
  const [x0, x1] = extent(all, 0);
  const [y0, y1] = extent(all, 1, [spec.yMin ?? Infinity, spec.yMax ?? -Infinity].filter(Number.isFinite));
  const xt = niceTicks(x0, x1, 6);
  const yt = niceTicks(spec.yMin ?? Math.min(0, y0), spec.yMax ?? y1, 5);
  const x = linear([xt.lo, xt.hi], [m.l, W - m.r]);
  const y = linear([yt.lo, yt.hi], [H - m.b, m.t]);
  return (
    <Frame caption={spec.caption} height={H} label="Line chart">
      {multi ? <Legend items={spec.series.map((s, i) => ({ name: s.name ?? `Series ${i + 1}`, color: SERIES[i], kind: "line" }))} x={m.l} y={14} /> : null}
      <YAxis y={y} x0={m.l} x1={W - m.r} ticks={yt.ticks} label={spec.yLabel} />
      {spec.series.map((s, i) => (
        <g key={i}>
          <polyline points={s.points.map((p) => `${x(p[0])},${y(p[1])}`).join(" ")} fill="none" stroke={SERIES[i]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {s.points.length <= 24
            ? s.points.map((p, k) => <circle key={k} cx={x(p[0])} cy={y(p[1])} r={4} fill={SERIES[i]} stroke={SURFACE} strokeWidth={2} />)
            : null}
        </g>
      ))}
      <XAxis x={x} y0={H - m.b} ticks={xt.ticks} label={spec.xLabel} height={H} />
    </Frame>
  );
}

function Scatter({ spec }: { spec: Spec<"scatter"> }) {
  const H = 320;
  const multi = spec.series.length > 1;
  const m = { l: 56, r: 18, t: multi ? 34 : 14, b: 50 };
  const all = [...spec.series.flatMap((s) => s.points), ...(spec.centroids ?? [])];
  const [x0, x1] = extent(all, 0);
  const [y0, y1] = extent(all, 1);
  const xt = niceTicks(x0, x1, 6);
  const yt = niceTicks(y0, y1, 5);
  const x = linear([xt.lo, xt.hi], [m.l, W - m.r]);
  const y = linear([yt.lo, yt.hi], [H - m.b, m.t]);
  const line = spec.line;
  let seg: [number, number, number, number] | null = null;
  if (line) {
    const ya = line.slope * xt.lo + line.intercept;
    const yb = line.slope * xt.hi + line.intercept;
    seg = [x(xt.lo), y(ya), x(xt.hi), y(yb)];
  }
  const isHi = (p: [number, number]) => spec.highlight?.some((h) => h[0] === p[0] && h[1] === p[1]);
  return (
    <Frame caption={spec.caption} height={H} label="Scatterplot">
      <defs>
        <clipPath id="plot-clip">
          <rect x={m.l} y={m.t} width={W - m.l - m.r} height={H - m.t - m.b} />
        </clipPath>
      </defs>
      {multi ? <Legend items={spec.series.map((s, i) => ({ name: s.name ?? `Group ${i + 1}`, color: SERIES[i] }))} x={m.l} y={14} /> : null}
      <YAxis y={y} x0={m.l} x1={W - m.r} ticks={yt.ticks} label={spec.yLabel} />
      {seg ? (
        <g clipPath="url(#plot-clip)">
          <line x1={seg[0]} y1={seg[1]} x2={seg[2]} y2={seg[3]} stroke={INK2} strokeWidth={2} strokeLinecap="round" />
        </g>
      ) : null}
      {spec.series.map((s, i) =>
        s.points.map((p, k) => (
          <circle key={`${i}-${k}`} cx={x(p[0])} cy={y(p[1])} r={isHi(p) ? 6 : 4.5} fill={SERIES[i]} stroke={isHi(p) ? INK2 : SURFACE} strokeWidth={2} />
        )),
      )}
      {spec.centroids?.map((c, i) => (
        <g key={`c${i}`} transform={`translate(${x(c[0])} ${y(c[1])})`}>
          <path d="M-7,-7L7,7M7,-7L-7,7" stroke={SURFACE} strokeWidth={6} strokeLinecap="round" />
          <path d="M-7,-7L7,7M7,-7L-7,7" stroke="var(--ink)" strokeWidth={2.5} strokeLinecap="round" />
        </g>
      ))}
      {line?.label && seg ? (
        <text x={seg[2] - 4} y={Math.max(m.t + 12, Math.min(H - m.b - 6, seg[3] - 8))} textAnchor="end" fontSize={FONT - 0.5} fill={INK2}>
          {line.label}
        </text>
      ) : null}
      <XAxis x={x} y0={H - m.b} ticks={xt.ticks} label={spec.xLabel} height={H} />
    </Frame>
  );
}

// ----------------------------------------------------------------- boxplot

function Boxplot({ spec }: { spec: Spec<"boxplot"> }) {
  const rowH = 54;
  const longest = Math.max(...spec.groups.map((g) => textWidth(g.label, FONT - 0.5)));
  const m = { l: Math.min(170, Math.max(40, longest + 18)), r: 22, t: 12, b: 48 };
  const H = m.t + m.b + rowH * spec.groups.length;
  const vals = spec.groups.flatMap((g) => [g.min, g.max, ...(g.outliers ?? [])]);
  const xt = niceTicks(Math.min(...vals), Math.max(...vals), 7);
  const x = linear([xt.lo, xt.hi], [m.l, W - m.r]);
  return (
    <Frame caption={spec.caption} height={H} label="Boxplot">
      {xt.ticks.map((t) => (
        <line key={t} x1={x(t)} x2={x(t)} y1={m.t} y2={H - m.b} stroke={GRID} />
      ))}
      {spec.groups.map((g, i) => {
        const cy = m.t + rowH * i + rowH / 2;
        const bh = 26;
        return (
          <g key={g.label}>
            <text x={m.l - 10} y={cy + 4} textAnchor="end" fontSize={FONT - 0.5} fill={INK2}>
              {g.label}
            </text>
            <line x1={x(g.min)} x2={x(g.q1)} y1={cy} y2={cy} stroke={INK2} strokeWidth={1.5} />
            <line x1={x(g.q3)} x2={x(g.max)} y1={cy} y2={cy} stroke={INK2} strokeWidth={1.5} />
            <line x1={x(g.min)} x2={x(g.min)} y1={cy - 8} y2={cy + 8} stroke={INK2} strokeWidth={1.5} />
            <line x1={x(g.max)} x2={x(g.max)} y1={cy - 8} y2={cy + 8} stroke={INK2} strokeWidth={1.5} />
            <rect x={x(g.q1)} y={cy - bh / 2} width={Math.max(1, x(g.q3) - x(g.q1))} height={bh} rx={4} fill="var(--series-1)" fillOpacity={0.16} stroke="var(--series-1)" strokeWidth={1.5} />
            <line x1={x(g.median)} x2={x(g.median)} y1={cy - bh / 2} y2={cy + bh / 2} stroke="var(--ink)" strokeWidth={2.5} />
            {(g.outliers ?? []).map((o, k) => (
              <circle key={k} cx={x(o)} cy={cy} r={4} fill={SURFACE} stroke={INK2} strokeWidth={1.5} />
            ))}
          </g>
        );
      })}
      <XAxis x={x} y0={H - m.b} ticks={xt.ticks} label={spec.axisLabel} height={H} />
    </Frame>
  );
}

// ----------------------------------------------------------------- dotplot

function Dotplot({ spec }: { spec: Spec<"dotplot"> }) {
  const counts = new Map<number, number>();
  for (const v of spec.values) counts.set(v, (counts.get(v) ?? 0) + 1);
  const maxStack = Math.max(...counts.values());
  const r = 6;
  const H = Math.max(140, 70 + maxStack * (2 * r + 3));
  const m = { l: 30, r: 30, b: 50 };
  const xt = niceTicks(Math.min(...spec.values), Math.max(...spec.values), 8);
  const x = linear([xt.lo, xt.hi], [m.l, W - m.r]);
  return (
    <Frame caption={spec.caption} height={H} label="Dot plot">
      {[...counts.entries()].map(([v, c]) =>
        Array.from({ length: c }, (_, k) => <circle key={`${v}-${k}`} cx={x(v)} cy={H - m.b - r - 3 - k * (2 * r + 3)} r={r} fill="var(--series-1)" />),
      )}
      <XAxis x={x} y0={H - m.b} ticks={xt.ticks} label={spec.xLabel} height={H} />
    </Frame>
  );
}

// ------------------------------------------------------------------ normal

function Normal({ spec }: { spec: Spec<"normal"> }) {
  const mu = spec.mean ?? 0;
  const sd = spec.sd ?? 1;
  const H = 250;
  const m = { l: 24, r: 24, t: 16, b: 48 };
  const x = linear([mu - 3.6 * sd, mu + 3.6 * sd], [m.l, W - m.r]);
  const pdf = (v: number) => Math.exp(-0.5 * ((v - mu) / sd) ** 2);
  const y = linear([0, 1.05], [H - m.b, m.t]);
  const N = 160;
  const pts: string[] = [];
  for (let i = 0; i <= N; i++) {
    const v = mu - 3.6 * sd + (7.2 * sd * i) / N;
    pts.push(`${x(v).toFixed(2)},${y(pdf(v)).toFixed(2)}`);
  }
  const area = (from: number | null, to: number | null) => {
    const a = Math.max(from ?? -Infinity, mu - 3.6 * sd);
    const b = Math.min(to ?? Infinity, mu + 3.6 * sd);
    if (b <= a) return "";
    const seg: string[] = [`M${x(a)},${y(0)}`];
    for (let i = 0; i <= 80; i++) {
      const v = a + ((b - a) * i) / 80;
      seg.push(`L${x(v).toFixed(2)},${y(pdf(v)).toFixed(2)}`);
    }
    seg.push(`L${x(b)},${y(0)}Z`);
    return seg.join("");
  };
  const ks = [-3, -2, -1, 0, 1, 2, 3];
  const axis = spec.axis ?? "sd";
  const label = (k: number) => {
    if (axis === "z") return k === 0 ? "0" : `${k}`;
    if (axis === "values") return fmt(mu + k * sd);
    return k === 0 ? "μ" : `μ${k > 0 ? "+" : "−"}${Math.abs(k) === 1 ? "" : Math.abs(k)}σ`;
  };
  return (
    <Frame caption={spec.caption} height={H} label="Normal curve">
      {(spec.shade ?? []).map((s, i) => (
        <path key={i} d={area(s.from, s.to)} fill="var(--series-1)" fillOpacity={0.2} />
      ))}
      {ks.map((k) => (
        <line key={k} x1={x(mu + k * sd)} x2={x(mu + k * sd)} y1={y(0)} y2={y(pdf(mu + k * sd))} stroke={GRID} strokeWidth={1} />
      ))}
      <polyline points={pts.join(" ")} fill="none" stroke="var(--series-1)" strokeWidth={2} strokeLinejoin="round" />
      {(spec.marks ?? []).map((v, i) => (
        <g key={i}>
          <line x1={x(v)} x2={x(v)} y1={y(0)} y2={m.t + 4} stroke={INK2} strokeWidth={1.5} />
          <text x={x(v)} y={m.t + 2} textAnchor="middle" fontSize={FONT - 1} fill={INK2}>
            {fmt(v)}
          </text>
        </g>
      ))}
      <line x1={m.l} x2={W - m.r} y1={y(0)} y2={y(0)} stroke={AXIS} />
      {ks.map((k) => (
        <text key={k} x={x(mu + k * sd)} y={y(0) + 18} textAnchor="middle" fontSize={FONT - 1} fill={INK3} className="tnum">
          {label(k)}
        </text>
      ))}
    </Frame>
  );
}

// ------------------------------------------------------------------- curve

const FNS: Record<Spec<"curve">["fn"], (v: number) => number> = {
  sigmoid: (v) => 1 / (1 + Math.exp(-v)),
  relu: (v) => Math.max(0, v),
  "leaky-relu": (v) => (v > 0 ? v : 0.1 * v),
  tanh: (v) => Math.tanh(v),
  step: (v) => (v >= 0 ? 1 : 0),
  linear: (v) => v,
  parabola: (v) => v * v,
  exp: (v) => Math.exp(v),
  log: (v) => (v > 0 ? Math.log(v) : NaN),
};

function Curve({ spec }: { spec: Spec<"curve"> }) {
  const H = 260;
  const m = { l: 50, r: 18, t: 14, b: 48 };
  const f = FNS[spec.fn];
  const [a, b] = spec.xRange;
  const samples: [number, number][] = [];
  for (let i = 0; i <= 240; i++) {
    const v = a + ((b - a) * i) / 240;
    const fv = f(v);
    if (Number.isFinite(fv)) samples.push([v, fv]);
  }
  const yr = spec.yRange ?? [Math.min(...samples.map((s) => s[1])), Math.max(...samples.map((s) => s[1]))];
  const xt = niceTicks(a, b, 6);
  const yt = niceTicks(yr[0], yr[1], 4);
  const x = linear([xt.lo, xt.hi], [m.l, W - m.r]);
  const y = linear([yt.lo, yt.hi], [H - m.b, m.t]);
  const clip = samples.filter((s) => s[1] >= yt.lo - 1e-9 && s[1] <= yt.hi + 1e-9);
  const path: string[] = [];
  for (let i = 0; i < clip.length; i++) {
    const jump = spec.fn === "step" && i > 0 && clip[i][1] !== clip[i - 1][1];
    path.push(`${i === 0 || jump ? "M" : "L"}${x(clip[i][0]).toFixed(2)},${y(clip[i][1]).toFixed(2)}`);
  }
  return (
    <Frame caption={spec.caption} height={H} label={`${spec.fn} curve`}>
      <YAxis y={y} x0={m.l} x1={W - m.r} ticks={yt.ticks} label={spec.yLabel} />
      {xt.lo < 0 && xt.hi > 0 ? <line x1={x(0)} x2={x(0)} y1={m.t} y2={H - m.b} stroke={AXIS} /> : null}
      {spec.hline !== undefined ? <line x1={m.l} x2={W - m.r} y1={y(spec.hline)} y2={y(spec.hline)} stroke={INK3} strokeWidth={1.5} /> : null}
      <path d={path.join("")} fill="none" stroke="var(--series-1)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      {(spec.marks ?? []).map((mk, i) => {
        const fy = f(mk.x);
        return (
          <g key={i}>
            <circle cx={x(mk.x)} cy={y(fy)} r={4.5} fill="var(--series-2)" stroke={SURFACE} strokeWidth={2} />
            {mk.label ? (
              <text x={x(mk.x) + 8} y={y(fy) - 8} fontSize={FONT - 0.5} fill={INK2}>
                {mk.label}
              </text>
            ) : null}
          </g>
        );
      })}
      <XAxis x={x} y0={y(Math.max(yt.lo, Math.min(0, yt.hi))) === H - m.b ? H - m.b : H - m.b} ticks={xt.ticks} label={spec.xLabel} height={H} />
    </Frame>
  );
}

// -------------------------------------------------------------------- tree

interface Placed {
  node: TreeNode;
  x: number;
  y: number;
  w: number;
  leaf: boolean;
  parent?: Placed;
}

function Tree({ spec }: { spec: Spec<"tree"> }) {
  const placed: Placed[] = [];
  const leaves = (n: TreeNode): number => (n.children?.length ? n.children.reduce((s, c) => s + leaves(c), 0) : 1);
  const depth = (n: TreeNode): number => (n.children?.length ? 1 + Math.max(...n.children.map(depth)) : 1);
  const total = leaves(spec.root);
  const levels = depth(spec.root);
  const levelH = 92;
  const H = 40 + levels * levelH - 30;
  const unit = (W - 20) / total;
  const place = (n: TreeNode, left: number, d: number, parent?: Placed) => {
    const span = leaves(n) * unit;
    const leaf = !n.children?.length;
    const p: Placed = { node: n, x: 10 + left + span / 2, y: 26 + d * levelH, w: Math.min(span - 8, textWidth(n.label, FONT) + 26), leaf, parent };
    placed.push(p);
    let off = left;
    for (const c of n.children ?? []) {
      place(c, off, d + 1, p);
      off += leaves(c) * unit;
    }
  };
  place(spec.root, 0, 0);
  return (
    <Frame caption={spec.caption} height={H} label="Decision tree">
      {placed
        .filter((p) => p.parent)
        .map((p, i) => {
          const q = p.parent!;
          const mx = (p.x + q.x) / 2;
          const my = (p.y + q.y) / 2;
          return (
            <g key={`e${i}`}>
              <path d={`M${q.x},${q.y + 16}C${q.x},${my} ${p.x},${my} ${p.x},${p.y - 16}`} fill="none" stroke={AXIS} strokeWidth={1.5} />
              {p.node.edge ? (
                <g>
                  <rect x={mx - textWidth(p.node.edge, FONT - 1) / 2 - 6} y={my - 10} width={textWidth(p.node.edge, FONT - 1) + 12} height={19} rx={6} fill={SURFACE} />
                  <text x={mx} y={my + 4} textAnchor="middle" fontSize={FONT - 1} fill={INK3}>
                    {p.node.edge}
                  </text>
                </g>
              ) : null}
            </g>
          );
        })}
      {placed.map((p, i) => (
        <g key={`n${i}`}>
          <rect x={p.x - p.w / 2} y={p.y - 16} width={p.w} height={32} rx={9} fill={p.leaf ? "var(--accent-soft)" : SURFACE} stroke={p.leaf ? "var(--accent-line)" : "var(--line-strong)"} strokeWidth={1.2} />
          <text x={p.x} y={p.y + 4.5} textAnchor="middle" fontSize={FONT} fontWeight={p.leaf ? 600 : 500} fill="var(--ink)">
            {p.node.label}
          </text>
        </g>
      ))}
    </Frame>
  );
}

// ----------------------------------------------------------------- network

function Network({ spec }: { spec: Spec<"network"> }) {
  const H = 300;
  const m = { l: 40, r: 40, t: 24, b: 44 };
  const L = spec.layers.length;
  const lx = (i: number) => m.l + ((W - m.l - m.r) * i) / (L - 1);
  const ny = (count: number, j: number) => m.t + ((H - m.t - m.b) * (j + 0.5)) / count;
  const names = spec.labels ?? spec.layers.map((_, i) => (i === 0 ? "Input" : i === L - 1 ? "Output" : L > 3 ? `Hidden ${i}` : "Hidden"));
  return (
    <Frame caption={spec.caption} height={H} label="Neural network">
      {spec.layers.slice(0, -1).map((cnt, i) =>
        Array.from({ length: cnt }, (_, a) =>
          Array.from({ length: spec.layers[i + 1] }, (_, b) => (
            <line key={`${i}-${a}-${b}`} x1={lx(i)} y1={ny(cnt, a)} x2={lx(i + 1)} y2={ny(spec.layers[i + 1], b)} stroke={AXIS} strokeWidth={1} />
          )),
        ),
      )}
      {spec.layers.map((cnt, i) =>
        Array.from({ length: cnt }, (_, j) => (
          <circle key={`${i}-${j}`} cx={lx(i)} cy={ny(cnt, j)} r={13} fill={i === 0 || i === L - 1 ? "var(--accent-soft)" : SURFACE} stroke={i === 0 || i === L - 1 ? "var(--series-1)" : INK2} strokeWidth={1.6} />
        )),
      )}
      {names.map((n, i) => (
        <text key={i} x={lx(i)} y={H - 14} textAnchor="middle" fontSize={FONT} fill={INK2}>
          {n}
        </text>
      ))}
    </Frame>
  );
}

// ------------------------------------------------------------------- graph

function Graph({ spec }: { spec: Spec<"graph"> }) {
  const H = 340;
  const pad = 46;
  const px = (v: number) => pad + ((W - 2 * pad) * v) / 100;
  const py = (v: number) => 30 + ((H - 60) * v) / 100;
  const nodes = new Map(spec.nodes.map((n) => [n.id, { ...n, cx: px(n.x), cy: py(n.y), w: textWidth(n.label, FONT) + 28, h: 34 }]));
  const directed = spec.directed !== false;
  // Point where the segment from (x1,y1) toward the box center exits the box.
  const exit = (box: { cx: number; cy: number; w: number; h: number }, tx: number, ty: number) => {
    const dx = tx - box.cx;
    const dy = ty - box.cy;
    const sx = Math.abs(dx) > 0 ? box.w / 2 / Math.abs(dx) : Infinity;
    const sy = Math.abs(dy) > 0 ? box.h / 2 / Math.abs(dy) : Infinity;
    const s = Math.min(sx, sy);
    return [box.cx + dx * s, box.cy + dy * s];
  };
  return (
    <Frame caption={spec.caption} height={H} label="Graph diagram">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0L10,5L0,10z" fill={INK2} />
        </marker>
      </defs>
      {spec.edges.map((e, i) => {
        const a = nodes.get(e.from);
        const b = nodes.get(e.to);
        if (!a || !b) return null;
        const [x1, y1] = exit(a, b.cx, b.cy);
        const [x2, y2] = exit(b, a.cx, a.cy);
        const shrink = directed ? 3 : 0;
        const len = Math.hypot(x2 - x1, y2 - y1) || 1;
        const ex = x2 - ((x2 - x1) / len) * shrink;
        const ey = y2 - ((y2 - y1) / len) * shrink;
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={ex} y2={ey} stroke={INK2} strokeWidth={1.5} markerEnd={directed ? "url(#arrow)" : undefined} />
            {e.label ? (
              <g>
                <rect x={(x1 + x2) / 2 - textWidth(e.label, FONT - 1.5) / 2 - 5} y={(y1 + y2) / 2 - 10} width={textWidth(e.label, FONT - 1.5) + 10} height={18} rx={5} fill={SURFACE} />
                <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 + 3.5} textAnchor="middle" fontSize={FONT - 1.5} fill={INK3}>
                  {e.label}
                </text>
              </g>
            ) : null}
          </g>
        );
      })}
      {[...nodes.values()].map((n) => (
        <g key={n.id}>
          <rect x={n.cx - n.w / 2} y={n.cy - n.h / 2} width={n.w} height={n.h} rx={17} fill={SURFACE} stroke="var(--series-1)" strokeWidth={1.6} />
          <text x={n.cx} y={n.cy + 4.5} textAnchor="middle" fontSize={FONT} fontWeight={500} fill="var(--ink)">
            {n.label}
          </text>
        </g>
      ))}
    </Frame>
  );
}

// -------------------------------------------------------------------- flow

function Flow({ spec }: { spec: Spec<"flow"> }) {
  const n = spec.steps.length;
  if (spec.cycle) {
    const H = 400;
    const cx = W / 2;
    const cy = H / 2;
    const R = 140;
    const pos = spec.steps.map((_, i) => {
      const t = -Math.PI / 2 + (2 * Math.PI * i) / n;
      return [cx + R * Math.cos(t) * 1.25, cy + R * Math.sin(t)];
    });
    return (
      <Frame caption={spec.caption} height={H} label="Process cycle">
        <defs>
          <marker id="flow-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0,0L10,5L0,10z" fill={INK3} />
          </marker>
        </defs>
        <ellipse cx={cx} cy={cy} rx={R * 1.25} ry={R} fill="none" stroke={GRID} strokeWidth={10} />
        {pos.map((p, i) => {
          const q = pos[(i + 1) % n];
          const mx = (p[0] + q[0]) / 2;
          const my = (p[1] + q[1]) / 2;
          const ox = (mx - cx) * 0.18;
          const oy = (my - cy) * 0.18;
          return <path key={`a${i}`} d={`M${p[0] + (q[0] - p[0]) * 0.32},${p[1] + (q[1] - p[1]) * 0.32}Q${mx + ox},${my + oy} ${p[0] + (q[0] - p[0]) * 0.68},${p[1] + (q[1] - p[1]) * 0.68}`} fill="none" stroke={INK3} strokeWidth={1.5} markerEnd="url(#flow-arrow)" />;
        })}
        {pos.map((p, i) => {
          const w = Math.max(96, textWidth(spec.steps[i], FONT) + 26);
          return (
            <g key={i}>
              <rect x={p[0] - w / 2} y={p[1] - 19} width={w} height={38} rx={11} fill={SURFACE} stroke="var(--series-1)" strokeWidth={1.5} />
              <text x={p[0]} y={p[1] + 4.5} textAnchor="middle" fontSize={FONT} fontWeight={500} fill="var(--ink)">
                {spec.steps[i]}
              </text>
            </g>
          );
        })}
      </Frame>
    );
  }
  // Linear flow, wrapping into rows.
  const perRow = n <= 4 ? n : Math.ceil(n / 2);
  const rows = Math.ceil(n / perRow);
  const gap = 28;
  const bw = (W - 20 - gap * (perRow - 1)) / perRow;
  const H = 30 + rows * 70;
  return (
    <Frame caption={spec.caption} height={H} label="Process flow">
      <defs>
        <marker id="flow-arrow-l" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,0L10,5L0,10z" fill={INK3} />
        </marker>
      </defs>
      {spec.steps.map((s, i) => {
        const r = Math.floor(i / perRow);
        const c = i % perRow;
        const x = 10 + c * (bw + gap);
        const y = 20 + r * 70;
        const lines = wrap(s, bw - 16, FONT);
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={46} rx={10} fill={SURFACE} stroke="var(--series-1)" strokeWidth={1.5} />
            {lines.map((ln, k) => (
              <text key={k} x={x + bw / 2} y={y + 23 + (k - (lines.length - 1) / 2) * 14 + 4} textAnchor="middle" fontSize={FONT - (lines.length > 1 ? 1 : 0)} fontWeight={500} fill="var(--ink)">
                {ln}
              </text>
            ))}
            {c < perRow - 1 && i < n - 1 ? <line x1={x + bw + 3} y1={y + 23} x2={x + bw + gap - 4} y2={y + 23} stroke={INK3} strokeWidth={1.5} markerEnd="url(#flow-arrow-l)" /> : null}
            {c === perRow - 1 && i < n - 1 ? <path d={`M${x + bw / 2},${y + 48}V${y + 58}H${10 + bw / 2}V${y + 66}`} fill="none" stroke={INK3} strokeWidth={1.5} markerEnd="url(#flow-arrow-l)" /> : null}
          </g>
        );
      })}
    </Frame>
  );
}

function wrap(s: string, width: number, size: number): string[] {
  const words = s.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (textWidth(next, size) > width && cur) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

// --------------------------------------------------------------- confusion

function Confusion({ spec }: { spec: Spec<"confusion"> }) {
  const pos = spec.positive ?? "Positive";
  const neg = spec.negative ?? "Negative";
  const H = 250;
  const x0 = 170;
  const y0 = 64;
  const cw = 170;
  const ch = 76;
  const cells = [
    { r: 0, c: 0, k: "TP", v: spec.tp, ok: true, name: "True positive" },
    { r: 0, c: 1, k: "FN", v: spec.fn, ok: false, name: "False negative" },
    { r: 1, c: 0, k: "FP", v: spec.fp, ok: false, name: "False positive" },
    { r: 1, c: 1, k: "TN", v: spec.tn, ok: true, name: "True negative" },
  ];
  return (
    <Frame caption={spec.caption} height={H} label="Confusion matrix">
      <text x={x0 + cw} y={20} textAnchor="middle" fontSize={FONT} fontWeight={600} fill={INK2}>
        Predicted
      </text>
      <text x={x0 + cw / 2} y={46} textAnchor="middle" fontSize={FONT} fill={INK2}>
        {pos}
      </text>
      <text x={x0 + cw * 1.5} y={46} textAnchor="middle" fontSize={FONT} fill={INK2}>
        {neg}
      </text>
      <text transform={`translate(24 ${y0 + ch}) rotate(-90)`} textAnchor="middle" fontSize={FONT} fontWeight={600} fill={INK2}>
        Actual
      </text>
      <text x={x0 - 14} y={y0 + ch / 2 + 4} textAnchor="end" fontSize={FONT} fill={INK2}>
        {pos}
      </text>
      <text x={x0 - 14} y={y0 + ch * 1.5 + 4} textAnchor="end" fontSize={FONT} fill={INK2}>
        {neg}
      </text>
      {cells.map((c) => (
        <g key={c.k}>
          <rect x={x0 + c.c * cw + 1} y={y0 + c.r * ch + 1} width={cw - 2} height={ch - 2} rx={8} fill={c.ok ? "var(--good-soft)" : "var(--bad-soft)"} stroke={c.ok ? "var(--good-line)" : "var(--bad-line)"} />
          <text x={x0 + c.c * cw + cw / 2} y={y0 + c.r * ch + 34} textAnchor="middle" fontSize={22} fontWeight={600} fill="var(--ink)" className="tnum">
            {fmt(c.v)}
          </text>
          <text x={x0 + c.c * cw + cw / 2} y={y0 + c.r * ch + 56} textAnchor="middle" fontSize={FONT - 1} fill={INK2}>
            {c.name} ({c.k})
          </text>
        </g>
      ))}
    </Frame>
  );
}

// ------------------------------------------------------- venn, nested, pyramid, pie

function Venn({ spec }: { spec: Spec<"venn"> }) {
  const H = 300;
  const three = spec.sets.length === 3;
  const r = three ? 92 : 105;
  const centers: [number, number][] = three
    ? [
        [W / 2 - 62, 118],
        [W / 2 + 62, 118],
        [W / 2, 210],
      ]
    : [
        [W / 2 - 70, 150],
        [W / 2 + 70, 150],
      ];
  const labelPos: [number, number][] = three
    ? [
        [W / 2 - 120, 92],
        [W / 2 + 120, 92],
        [W / 2, 262],
      ]
    : [
        [W / 2 - 115, 150],
        [W / 2 + 115, 150],
      ];
  return (
    <Frame caption={spec.caption} height={H} label="Venn diagram">
      {centers.map((c, i) => (
        <circle key={i} cx={c[0]} cy={c[1]} r={r} fill={SERIES[i]} fillOpacity={0.13} stroke={SERIES[i]} strokeWidth={1.6} />
      ))}
      {spec.sets.map((s, i) =>
        wrap(s.label, 110, FONT).map((ln, k, arr) => (
          <text key={`${i}-${k}`} x={labelPos[i][0]} y={labelPos[i][1] + (k - (arr.length - 1) / 2) * 15 + 4} textAnchor="middle" fontSize={FONT} fontWeight={500} fill="var(--ink)">
            {ln}
          </text>
        )),
      )}
      {spec.center ? (
        <text x={W / 2} y={three ? 152 : 154} textAnchor="middle" fontSize={FONT} fontWeight={650} fill="var(--ink)">
          {spec.center}
        </text>
      ) : null}
    </Frame>
  );
}

function Nested({ spec }: { spec: Spec<"nested"> }) {
  const n = spec.layers.length;
  const H = 90 + n * 46;
  return (
    <Frame caption={spec.caption} height={H} label="Nested regions">
      {spec.layers.map((label, i) => {
        const inset = i * 34;
        const x = 20 + inset;
        const y = 12 + i * 40;
        const w = W - 40 - inset * 2;
        const h = H - 24 - i * 80;
        return (
          <g key={i}>
            <rect x={x} y={y} width={w} height={Math.max(36, h)} rx={18} fill={SERIES[0]} fillOpacity={0.06 + i * 0.05} stroke="var(--series-1)" strokeOpacity={0.5 + i * 0.12} strokeWidth={1.4} />
            <text x={W / 2} y={y + 25} textAnchor="middle" fontSize={FONT + 0.5} fontWeight={600} fill="var(--ink)">
              {label}
            </text>
          </g>
        );
      })}
    </Frame>
  );
}

function Pyramid({ spec }: { spec: Spec<"pyramid"> }) {
  const n = spec.levels.length;
  const H = 30 + n * 52;
  const top = 20;
  const lh = 50;
  const maxW = 420;
  return (
    <Frame caption={spec.caption} height={H} label="Pyramid">
      {spec.levels.map((label, i) => {
        const w0 = (maxW * (i + 0.6)) / (n + 0.6);
        const w1 = (maxW * (i + 1.6)) / (n + 0.6);
        const y = top + i * lh;
        const cx = W / 2;
        return (
          <g key={i}>
            <path d={`M${cx - w0 / 2},${y}H${cx + w0 / 2}L${cx + w1 / 2},${y + lh - 4}H${cx - w1 / 2}Z`} fill="var(--series-1)" fillOpacity={0.1 + (i / n) * 0.22} stroke="var(--series-1)" strokeWidth={1.2} strokeLinejoin="round" />
            <text x={cx} y={y + lh / 2 + 3} textAnchor="middle" fontSize={FONT} fontWeight={600} fill="var(--ink)">
              {label}
            </text>
          </g>
        );
      })}
    </Frame>
  );
}

function Pie({ spec }: { spec: Spec<"pie"> }) {
  const H = 280;
  const cx = 170;
  const cy = H / 2;
  const r = 105;
  const total = spec.slices.reduce((s, x) => s + x.value, 0);
  const angles = spec.slices.reduce<number[]>((acc, s) => [...acc, acc[acc.length - 1] + (2 * Math.PI * s.value) / total], [-Math.PI / 2]);
  return (
    <Frame caption={spec.caption} height={H} label="Pie chart">
      {spec.slices.map((s, i) => {
        const a0 = angles[i];
        const a1 = angles[i + 1];
        const large = a1 - a0 > Math.PI ? 1 : 0;
        const d = `M${cx},${cy}L${cx + r * Math.cos(a0)},${cy + r * Math.sin(a0)}A${r},${r} 0 ${large} 1 ${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)}Z`;
        return <path key={i} d={d} fill={SERIES[i]} stroke={SURFACE} strokeWidth={2} />;
      })}
      {spec.slices.map((s, i) => (
        <g key={`l${i}`} transform={`translate(330 ${cy - (spec.slices.length * 24) / 2 + i * 24 + 12})`}>
          <circle cx={0} cy={0} r={6} fill={SERIES[i]} />
          <text x={14} y={4.5} fontSize={FONT} fill={INK2}>
            {s.label}
            <tspan fill={INK3} className="tnum">{`  ${Math.round((s.value / total) * 1000) / 10}%`}</tspan>
          </text>
        </g>
      ))}
    </Frame>
  );
}

function Pixels({ spec }: { spec: Spec<"pixels"> }) {
  const rows = spec.grid.length;
  const cols = Math.max(...spec.grid.map((r) => r.length));
  const cell = Math.min(46, Math.floor(480 / cols));
  const width = cols * cell + 40;
  const H = rows * cell + 30;
  return (
    <Frame caption={spec.caption} width={width} height={H} label="Pixel grid">
      {spec.grid.map((row, r) =>
        row.map((v, c) => (
          <g key={`${r}-${c}`}>
            <rect x={20 + c * cell} y={15 + r * cell} width={cell - 2} height={cell - 2} rx={3} fill={`rgb(${v},${v},${v})`} stroke="var(--line)" />
            {cell >= 34 ? (
              <text x={20 + c * cell + (cell - 2) / 2} y={15 + r * cell + cell / 2 + 3} textAnchor="middle" fontSize={10.5} fill={v > 140 ? "#17171a" : "#ffffff"} className="tnum">
                {v}
              </text>
            ) : null}
          </g>
        )),
      )}
    </Frame>
  );
}

// ------------------------------------------------------------------- entry

export function Figure({ spec }: { spec: FigureSpec }) {
  switch (spec.type) {
    case "histogram":
      return <Histogram spec={spec} />;
    case "bar":
      return <Bar spec={spec} />;
    case "line":
      return <Line spec={spec} />;
    case "scatter":
      return <Scatter spec={spec} />;
    case "boxplot":
      return <Boxplot spec={spec} />;
    case "dotplot":
      return <Dotplot spec={spec} />;
    case "normal":
      return <Normal spec={spec} />;
    case "curve":
      return <Curve spec={spec} />;
    case "tree":
      return <Tree spec={spec} />;
    case "network":
      return <Network spec={spec} />;
    case "graph":
      return <Graph spec={spec} />;
    case "flow":
      return <Flow spec={spec} />;
    case "confusion":
      return <Confusion spec={spec} />;
    case "venn":
      return <Venn spec={spec} />;
    case "nested":
      return <Nested spec={spec} />;
    case "pyramid":
      return <Pyramid spec={spec} />;
    case "pie":
      return <Pie spec={spec} />;
    case "pixels":
      return <Pixels spec={spec} />;
  }
}
