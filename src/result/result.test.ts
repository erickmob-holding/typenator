import { describe, expect, it } from "vitest";
import { Histogram } from "@/textinput";
import { findStreaks } from "./accuracy.ts";
import { makeKeyStatsMap } from "./keystats.ts";
import { Result } from "./result.ts";
import { speedToTime, SpeedUnit, timeToSpeed } from "./speedunit.ts";
import { makeSummaryStats } from "./summarystats.ts";

const cp = (ch: string) => ch.codePointAt(0)!;

function histogram(time: number) {
  return new Histogram([
    { codePoint: cp("a"), hitCount: 10, missCount: 0, timeToType: time },
    { codePoint: cp("b"), hitCount: 10, missCount: 0, timeToType: time },
    { codePoint: cp("c"), hitCount: 10, missCount: 0, timeToType: time },
  ]);
}

describe("Result metrics", () => {
  it("computes speed, accuracy and score per the keybr formulas", () => {
    // 60 chars in 30s => 120 CPM. 3 distinct chars, 2 errors.
    const r = new Result("us", "generated", Date.now(), 60, 30_000, 2, histogram(500));
    expect(r.speed).toBeCloseTo(120, 6);
    expect(r.accuracy).toBeCloseTo((60 - 2) / 60, 6);
    expect(r.complexity).toBe(3);
    // score = (speed * complexity / (errors+1)) * (length/50)
    expect(r.score).toBeCloseTo((120 * 3) / 3 * (60 / 50), 6);
  });

  it("rejects too-short results", () => {
    const r = new Result("us", "generated", Date.now(), 5, 30_000, 0, histogram(500));
    expect(r.validate()).toBe(false);
  });
});

describe("speed units", () => {
  it("converts CPM to WPM by dividing by 5", () => {
    expect(SpeedUnit.WPM.measure(175)).toBe(35);
    expect(SpeedUnit.CPM.measure(175)).toBe(175);
  });

  it("round-trips speed and time", () => {
    expect(speedToTime(timeToSpeed(400))).toBeCloseTo(400, 6);
  });
});

describe("key stats", () => {
  it("smooths per-key time with alpha = 0.1 and tracks the best", () => {
    const results = [
      new Result("us", "generated", 1, 30, 10_000, 0, histogram(500)),
      new Result("us", "generated", 2, 30, 10_000, 0, histogram(300)),
    ];
    const map = makeKeyStatsMap([cp("a")], results);
    const stats = map.get(cp("a"));
    // First sample 500, second: 0.1*300 + 0.9*500 = 480
    expect(stats.samples).toHaveLength(2);
    expect(stats.timeToType).toBeCloseTo(480, 6);
    expect(stats.bestTimeToType).toBeCloseTo(480, 6);
  });
});

describe("summary stats and streaks", () => {
  it("tracks min/max/avg/last/delta and accuracy streaks", () => {
    const mk = (errors: number) =>
      new Result("us", "generated", Date.now(), 100, 30_000, errors, histogram(500));
    const results = [mk(0), mk(0), mk(10), mk(0)];
    const summary = makeSummaryStats(results);
    expect(summary.count).toBe(4);
    expect(summary.accuracy.max).toBeCloseTo(1, 6);

    const streaks = findStreaks(results);
    const perfect = streaks.find((s) => s.level === 1.0)!;
    expect(perfect.results).toHaveLength(2); // first two before the dip
  });
});
