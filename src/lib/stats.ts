// Statistics used by widgets and analytics. Quartiles use the median-of-halves
// method taught in the course (the median is excluded from both halves when n is odd).

export function mean(xs: number[]): number {
  return xs.reduce((s, x) => s + x, 0) / xs.length;
}

export function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function modes(xs: number[]): number[] {
  const c = new Map<number, number>();
  for (const x of xs) c.set(x, (c.get(x) ?? 0) + 1);
  const max = Math.max(...c.values());
  if (max === 1) return [];
  return [...c.entries()].filter(([, n]) => n === max).map(([v]) => v).sort((a, b) => a - b);
}

export function quartiles(xs: number[]): { q1: number; q2: number; q3: number } {
  const s = [...xs].sort((a, b) => a - b);
  const n = s.length;
  if (n < 2) return { q1: s[0], q2: s[0], q3: s[0] };
  const half = Math.floor(n / 2);
  const lower = s.slice(0, half);
  const upper = s.slice(n % 2 ? half + 1 : half);
  return { q1: median(lower), q2: median(s), q3: median(upper) };
}

export function variance(xs: number[], sample: boolean): number {
  const m = mean(xs);
  const ss = xs.reduce((s, x) => s + (x - m) ** 2, 0);
  return ss / (xs.length - (sample ? 1 : 0));
}

// Standard normal CDF via the Abramowitz and Stegun erf approximation (error < 1.5e-7).
export function phi(z: number): number {
  const t = 1 / (1 + 0.3275911 * (Math.abs(z) / Math.SQRT2));
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(z * z) / 2);
  return z >= 0 ? 0.5 * (1 + y) : 0.5 * (1 - y);
}

export function round(v: number, d = 2): string {
  if (!Number.isFinite(v)) return "n/a";
  return Number(v.toFixed(d)).toString();
}
