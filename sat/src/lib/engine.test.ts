import { describe, expect, it } from "vitest";
import { createEngine, nextQuestion, recordAnswer, setRandom, TARGET, MAX_WINDOW } from "./engine";

let seed = 42;
setRandom(() => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
});

function simulate(n: number, accuracy: (id: string, k: number) => boolean, steps = 5000) {
  const counts = new Map<string, number>();
  const ids = Array.from({ length: n }, (_, i) => `q${i}`);
  const need = (id: string) => TARGET - (counts.get(id) ?? 0);
  const e = createEngine(ids, need);
  const shown: string[] = [];
  for (let t = 0; t < steps; t++) {
    const id = nextQuestion(e, need);
    if (!id) break;
    shown.push(id);
    const c = counts.get(id) ?? 0;
    const ok = accuracy(id, shown.length);
    const nc = ok ? c + 1 : c;
    counts.set(id, nc);
    recordAnswer(e, id, ok, nc, TARGET - nc);
  }
  return { shown, counts, e };
}

describe("mastery scheduler", () => {
  it("masters every question with exactly five correct answers when always right", () => {
    const { shown, counts } = simulate(30, () => true);
    expect(shown.length).toBe(30 * TARGET);
    for (const v of counts.values()) expect(v).toBe(TARGET);
  });

  it("never shows the same question twice in a row while others remain", () => {
    const { shown } = simulate(25, (_id, k) => k % 3 !== 0);
    for (let i = 1; i < shown.length; i++) {
      if (shown[i] === shown[i - 1]) {
        // only allowed when it is the very last question left
        const rest = new Set(shown.slice(i));
        expect(rest.size).toBe(1);
      }
    }
  });

  it("keeps repeats near: a question returns within a bounded number of steps", () => {
    const { shown } = simulate(60, (_id, k) => k % 4 !== 0);
    const last = new Map<string, number>();
    let worst = 0;
    shown.forEach((id, i) => {
      if (last.has(id)) worst = Math.max(worst, i - last.get(id)!);
      last.set(id, i);
    });
    expect(worst).toBeLessThanOrEqual(MAX_WINDOW + 8);
  });

  it("brings a missed question back after a short gap, not immediately", () => {
    const { shown } = simulate(10, (id, k) => !(id === "q0" && k === 1));
    const firstTwo = shown.map((id, i) => (id === "q0" ? i : -1)).filter((i) => i >= 0).slice(0, 2);
    expect(firstTwo[1] - firstTwo[0]).toBeGreaterThanOrEqual(3);
    expect(firstTwo[1] - firstTwo[0]).toBeLessThanOrEqual(6);
  });

  it("finishes with wrong answers mixed in and counts only correct answers", () => {
    const { counts, e } = simulate(20, (_id, k) => k % 2 === 0);
    for (const v of counts.values()) expect(v).toBe(TARGET);
    expect(e.active.length).toBe(0);
  });
});
