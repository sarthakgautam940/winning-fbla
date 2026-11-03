import { describe, expect, it } from "vitest";
import { projectedScore, readinessBand } from "./analytics";
import { catalog } from "./catalog";
import { emptyProgress } from "./progress/store";
import { buildDrill } from "./sets";

describe("speed drill", () => {
  it("draws 20 distinct bank questions, never a quiz question before its quiz is taken", () => {
    const ids = buildDrill(emptyProgress(), 20, 42);
    const bank = new Map(catalog.questions.map((q) => [q.id, q]));
    expect(ids).toHaveLength(20);
    expect(new Set(ids).size).toBe(20);
    for (const id of ids) {
      expect(id).not.toMatch(/^(pt|ut)\d/);
      expect(bank.get(id)?.use).not.toBe("quiz");
    }
  });
});

describe("readiness bands", () => {
  it.each([
    [100, "Championship range"],
    [90, "Championship range"],
    [89, "National finalist range"],
    [80, "National finalist range"],
    [79, "State placement range"],
    [70, "State placement range"],
    [69, "Building"],
    [55, "Building"],
    [54, "Getting started"],
    [0, "Getting started"],
  ])("a score of %i is %s", (score, label) => {
    expect(readinessBand(score).label).toBe(label);
  });
});

describe("projected score", () => {
  it("stays hidden, with a valid range, until there is enough evidence", () => {
    const p = projectedScore(emptyProgress());
    expect(p.ready).toBe(false);
    expect(p.needed).toBe(60);
    expect(p.latestTest).toBeNull();
    expect(p.low).toBeGreaterThanOrEqual(0);
    expect(p.low).toBeLessThanOrEqual(p.score);
    expect(p.score).toBeLessThanOrEqual(p.high);
    expect(p.high).toBeLessThanOrEqual(100);
  });
});
