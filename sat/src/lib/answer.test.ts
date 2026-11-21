import { describe, expect, it } from "vitest";
import { checkGridIn, parseNumber } from "./answer";

describe("grid-in answers", () => {
  it("parses integers, decimals, fractions, and negatives", () => {
    expect(parseNumber("403")).toBe(403);
    expect(parseNumber(".0465")).toBeCloseTo(0.0465);
    expect(parseNumber("-49/10")).toBeCloseTo(-4.9);
    expect(parseNumber("−3")).toBe(-3);
    expect(parseNumber("abc")).toBeNull();
    expect(parseNumber("1/0")).toBeNull();
  });
  it("accepts any listed form and equivalent fractions", () => {
    const acc = ["-4.9", "-49/10"];
    expect(checkGridIn("-4.9", acc)).toBe(true);
    expect(checkGridIn("-49/10", acc)).toBe(true);
    expect(checkGridIn("-98/20", acc)).toBe(true);
    expect(checkGridIn("4.9", acc)).toBe(false);
  });
  it("accepts a leading zero but not a shorter rounding", () => {
    const acc = [".0465", "2/43"];
    expect(checkGridIn("0.0465", acc)).toBe(true);
    expect(checkGridIn("2/43", acc)).toBe(true);
    expect(checkGridIn(".05", acc)).toBe(false);
  });
});
