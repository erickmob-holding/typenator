import { describe, expect, it } from "vitest";
import { makeFilter } from "./filter.ts";
import { Polynomial, r2 } from "./polynomial.ts";
import { linearRegression, polynomialRegression } from "./regression.ts";
import { Vector } from "./vector.ts";

describe("exponential filter (alpha = 0.1)", () => {
  it("returns the first sample unchanged", () => {
    const f = makeFilter(0.1);
    expect(f.add(100)).toBe(100);
  });

  it("blends subsequent samples toward the new value", () => {
    const f = makeFilter(0.1);
    f.add(100);
    // 0.1 * 200 + 0.9 * 100 = 110
    expect(f.add(200)).toBeCloseTo(110, 6);
  });
});

describe("polynomial", () => {
  it("evaluates and differentiates a cubic", () => {
    const p = Polynomial.from([1, 2, 3, 4]); // 1 + 2x + 3x^2 + 4x^3
    expect(p.eval(2)).toBe(1 + 4 + 12 + 32);
    // derivative: 2 + 6x + 12x^2
    expect(p.derivative().eval(2)).toBe(2 + 12 + 48);
  });
});

describe("regression", () => {
  it("fits a perfect line", () => {
    const vx = new Vector([0, 1, 2, 3]);
    const vy = new Vector([1, 3, 5, 7]); // y = 1 + 2x
    const m = linearRegression(vx, vy);
    expect(m.eval(4)).toBeCloseTo(9, 6);
    expect(r2(vx, vy, m)).toBeCloseTo(1, 6);
  });

  it("fits a quadratic", () => {
    const vx = new Vector([0, 1, 2, 3, 4]);
    const vy = new Vector([0, 1, 4, 9, 16]); // y = x^2
    const m = polynomialRegression(vx, vy, 2);
    expect(m.eval(5)).toBeCloseTo(25, 4);
  });
});
