// Grid-in (student-produced response) checking. The College Board lists the accepted
// forms for each question ("-4.9, -49/10"). A response counts when it equals one of them
// in value: an equivalent fraction (98/20) or the same decimal with or without a leading
// zero (0.0465 for .0465). A shorter rounding (.05) does not count, as on the test.

export function parseNumber(raw: string): number | null {
  const s = raw.trim().replace(/\s+/g, "").replace(/−/g, "-");
  if (!s) return null;
  const frac = /^(-?)(\d+(?:\.\d+)?|\.\d+)\/(-?)(\d+(?:\.\d+)?|\.\d+)$/.exec(s);
  if (frac) {
    const num = parseFloat(frac[2]);
    const den = parseFloat(frac[4]);
    if (den === 0) return null;
    const sign = (frac[1] ? -1 : 1) * (frac[3] ? -1 : 1);
    return (sign * num) / den;
  }
  if (/^-?(\d+(\.\d*)?|\.\d+)$/.test(s)) return parseFloat(s);
  return null;
}

export function checkGridIn(response: string, accepted: string[]): boolean {
  const v = parseNumber(response);
  if (v === null) return false;
  return accepted.some((a) => {
    const t = parseNumber(a);
    return t !== null && Math.abs(v - t) < 1e-9;
  });
}

/** Characters a grid-in box accepts. */
export function cleanGridInput(raw: string): string {
  return raw.replace(/[^0-9./\-]/g, "").slice(0, 7);
}
