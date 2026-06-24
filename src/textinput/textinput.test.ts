import { describe, expect, it } from "vitest";
import { Histogram, validateSample } from "./histogram.ts";
import { TextInput } from "./textinput.ts";
import { type Step } from "./types.ts";

const cp = (ch: string) => ch.codePointAt(0)!;

function typeAll(input: TextInput, text: string, startTime = 1000, gap = 100) {
  let time = startTime;
  let last;
  for (const ch of text) {
    last = input.add(cp(ch), time);
    time += gap;
  }
  return last!;
}

describe("TextInput", () => {
  it("advances on correct keys and completes", () => {
    const input = new TextInput("abc");
    expect(input.add(cp("a"), 1000)).toEqual({ type: "hit" });
    expect(input.add(cp("b"), 1100)).toEqual({ type: "hit" });
    const result = input.add(cp("c"), 1200);
    expect(result.type).toBe("complete");
  });

  it("flags a typo but does not advance on a wrong key", () => {
    const input = new TextInput("abc");
    input.add(cp("a"), 1000);
    expect(input.add(cp("x"), 1100)).toEqual({ type: "miss" });
    expect(input.position).toBe(1); // still on 'b'
    input.add(cp("b"), 1200);
    expect(input.position).toBe(2);
  });
});

describe("makeStats", () => {
  it("computes speed and accuracy", () => {
    const input = new TextInput("hello");
    const result = typeAll(input, "hello", 1000, 100);
    expect(result.type).toBe("complete");
    if (result.type === "complete") {
      const { stats } = result;
      expect(stats.length).toBe(5);
      expect(stats.errors).toBe(0);
      expect(stats.accuracy).toBe(1);
      // 5 chars, 4 gaps of 100ms = 400ms => (5 / 0.4) * 60 = 750 CPM
      expect(stats.speed).toBeCloseTo(750, 3);
    }
  });
});

describe("Histogram", () => {
  it("excludes typo time from the mean and counts misses", () => {
    const steps: Step[] = [
      { codePoint: cp("a"), timeToType: 100, typo: false },
      { codePoint: cp("a"), timeToType: 200, typo: true },
      { codePoint: cp("a"), timeToType: 300, typo: false },
    ];
    const h = Histogram.from(steps);
    const sample = h.get(cp("a"))!;
    expect(sample.hitCount).toBe(3);
    expect(sample.missCount).toBe(1);
    expect(sample.timeToType).toBe(200); // mean of 100 and 300 only
  });

  it("rejects implausible per-key timings", () => {
    expect(validateSample({ codePoint: 1, hitCount: 1, missCount: 0, timeToType: 10 })).toBe(false);
    expect(validateSample({ codePoint: 1, hitCount: 1, missCount: 0, timeToType: 20000 })).toBe(false);
    expect(validateSample({ codePoint: 1, hitCount: 1, missCount: 0, timeToType: 200 })).toBe(true);
  });
});
