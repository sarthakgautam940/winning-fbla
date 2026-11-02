// Small, dependency-free helpers for drawing charts as SVG.

export type Scale = ((v: number) => number) & { domain: [number, number]; range: [number, number] };

export function linear(domain: [number, number], range: [number, number]): Scale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0 || 1;
  const f = ((v: number) => r0 + ((v - d0) / span) * (r1 - r0)) as Scale;
  f.domain = domain;
  f.range = range;
  return f;
}

function niceStep(span: number, count: number): number {
  const raw = span / Math.max(1, count);
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = norm >= 7.5 ? 10 : norm >= 3.5 ? 5 : norm >= 1.5 ? 2 : 1;
  return step * mag;
}

// Round a [min, max] range outward to clean tick values.
export function niceTicks(min: number, max: number, count = 5): { ticks: number[]; lo: number; hi: number } {
  if (min === max) {
    const pad = Math.abs(min) || 1;
    min -= pad;
    max += pad;
  }
  const step = niceStep(max - min, count);
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Number(v.toFixed(10)));
  return { ticks, lo, hi };
}

export function fmt(v: number): string {
  if (!Number.isFinite(v)) return "";
  const abs = Math.abs(v);
  if (abs >= 1e6) return `${Number((v / 1e6).toFixed(1))}M`;
  if (abs >= 1e4) return `${Number((v / 1e3).toFixed(1))}K`;
  if (Number.isInteger(v)) return v.toLocaleString("en-US");
  return Number(v.toFixed(abs < 1 ? 3 : 2)).toString();
}

// Rough text width for layout without a DOM (Figtree averages ~0.55em).
export function textWidth(s: string, size: number): number {
  return s.length * size * 0.56;
}

// A bar whose data end is rounded (4px) and whose baseline end is square.
export function barPath(x: number, y: number, w: number, h: number, dir: "up" | "right", r = 4): string {
  if (w <= 0 || h <= 0) return "";
  const rr = Math.min(r, dir === "up" ? w / 2 : h / 2, dir === "up" ? h : w);
  if (dir === "up") {
    return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
  }
  return `M${x},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h - rr}Q${x + w},${y + h} ${x + w - rr},${y + h}H${x}Z`;
}

export const SERIES = ["var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)", "var(--series-5)", "var(--series-6)", "var(--series-7)", "var(--series-8)"];
