import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Checks the five practice tests exactly as the app serves them, after the
// content build has assembled and shuffled them.

interface Question {
  id: string;
  options: string[];
  answer: string;
}

interface PracticeTest {
  id: string;
  minutes: number;
  questions: Question[];
}

const QUOTAS: Record<string, number> = { dl: 20, ps: 15, da: 15, tl: 10, ai: 10, ml: 10, pr: 10, pe: 10 };

const tests: PracticeTest[] = [1, 2, 3, 4, 5].map((n) =>
  JSON.parse(fs.readFileSync(path.join(process.cwd(), "src/generated/tests", `pt${n}.json`), "utf8")),
);

const areaOf = (q: Question) => q.id.split("-")[1];

function longestRun(values: string[]): number {
  let best = 0;
  let run = 0;
  values.forEach((v, i) => {
    run = i > 0 && v === values[i - 1] ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return best;
}

describe.each(tests)("$id", (test) => {
  it("has 100 questions and a 50-minute limit", () => {
    expect(test.questions).toHaveLength(100);
    expect(test.minutes).toBe(50);
  });

  it("matches the official count for every area", () => {
    const counts: Record<string, number> = {};
    for (const q of test.questions) counts[areaOf(q)] = (counts[areaOf(q)] ?? 0) + 1;
    expect(counts).toEqual(QUOTAS);
  });

  it("gives every question four options and a key among them", () => {
    for (const q of test.questions) {
      expect(q.options).toHaveLength(4);
      expect(["A", "B", "C", "D"]).toContain(q.answer);
    }
  });

  it("keeps each answer letter between 20 and 30 percent", () => {
    for (const letter of ["A", "B", "C", "D"]) {
      const share = test.questions.filter((q) => q.answer === letter).length;
      expect(share).toBeGreaterThanOrEqual(20);
      expect(share).toBeLessThanOrEqual(30);
    }
  });

  it("never runs four of the same letter or area in a row", () => {
    expect(longestRun(test.questions.map((q) => q.answer))).toBeLessThan(4);
    expect(longestRun(test.questions.map(areaOf))).toBeLessThan(4);
  });
});

it("never reuses a question across the five tests", () => {
  const ids = tests.flatMap((t) => t.questions.map((q) => q.id));
  expect(new Set(ids).size).toBe(500);
});
