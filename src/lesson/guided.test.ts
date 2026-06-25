import { describe, expect, it } from "vitest";
import { Keyboard, QWERTY } from "@/keyboard";
import { makeKeyStatsMap, Result } from "@/result";
import { Histogram } from "@/textinput";
import { DEFAULT_SETTINGS, type Settings } from "@/settings";
import { computeDailyGoal } from "./dailygoal.ts";
import { updateGuided } from "./guided.ts";
import { Target } from "./target.ts";

const keyboard = new Keyboard(QWERTY);
const cp = (ch: string) => ch.codePointAt(0)!;

function fastResult(chars: string, timePerKey: number, timeStamp = Date.now()): Result {
  const samples = [...new Set(chars)].map((ch) => ({
    codePoint: cp(ch),
    hitCount: 10,
    missCount: 0,
    timeToType: timePerKey,
  }));
  return new Result("us", "generated", timeStamp, chars.length, chars.length * timePerKey, 0, new Histogram(samples));
}

describe("Target.confidence", () => {
  it("is 1 exactly at the target speed", () => {
    const target = new Target(175); // 175 CPM => 342.857ms/char
    const timeAtTarget = 60000 / 175;
    expect(target.confidence(timeAtTarget)).toBeCloseTo(1, 6);
    expect(target.confidence(timeAtTarget / 2)).toBeCloseTo(2, 6); // twice as fast
  });
});

describe("guided algorithm", () => {
  it("starts with the 6 most frequent letters", () => {
    const map = makeKeyStatsMap([...keyboard.letters], []);
    const keys = updateGuided(map, keyboard, DEFAULT_SETTINGS);
    const included = keys.findIncludedKeys();
    expect(included).toHaveLength(6);
    expect(included.map((k) => k.char).sort()).toEqual(
      ["e", "n", "i", "t", "r", "l"].sort(),
    );
  });

  it("introduces a new letter only after the current set reaches target", () => {
    // Type the first 6 letters very fast (well above target) across enough
    // lessons that their smoothed time graduates them.
    const letters = "enitrl";
    const results: Result[] = [];
    for (let i = 0; i < 30; i++) {
      results.push(fastResult(letters, 100, Date.now() + i)); // 100ms/char => 600 CPM
    }
    const map = makeKeyStatsMap([...keyboard.letters], results);
    const keys = updateGuided(map, keyboard, DEFAULT_SETTINGS);
    const included = keys.findIncludedKeys();
    expect(included.length).toBeGreaterThan(6); // a 7th letter unlocked
  });

  it("focuses the weakest included key", () => {
    const results: Result[] = [];
    for (let i = 0; i < 10; i++) {
      // All six starting letters (keybr order: e n i t r l) have data;
      // 't' is the slowest of them.
      results.push(
        new Result("us", "generated", Date.now() + i, 60, 4000, 0, new Histogram([
          { codePoint: cp("e"), hitCount: 10, missCount: 0, timeToType: 120 },
          { codePoint: cp("n"), hitCount: 10, missCount: 0, timeToType: 130 },
          { codePoint: cp("i"), hitCount: 10, missCount: 0, timeToType: 140 },
          { codePoint: cp("t"), hitCount: 10, missCount: 0, timeToType: 900 },
          { codePoint: cp("r"), hitCount: 10, missCount: 0, timeToType: 120 },
          { codePoint: cp("l"), hitCount: 10, missCount: 0, timeToType: 150 },
        ])),
      );
    }
    const map = makeKeyStatsMap([...keyboard.letters], results);
    const keys = updateGuided(map, keyboard, DEFAULT_SETTINGS);
    expect(keys.findFocusedKey()?.char).toBe("t");
  });
});

describe("daily goal", () => {
  it("measures minutes practised today against the goal", () => {
    const settings: Settings = { ...DEFAULT_SETTINGS, dailyGoal: 30 };
    const r = new Result("us", "generated", Date.now(), 100, 15 * 60 * 1000, 0, new Histogram([
      { codePoint: cp("a"), hitCount: 1, missCount: 0, timeToType: 200 },
      { codePoint: cp("b"), hitCount: 1, missCount: 0, timeToType: 200 },
      { codePoint: cp("c"), hitCount: 1, missCount: 0, timeToType: 200 },
    ]));
    const goal = computeDailyGoal([r], settings);
    expect(goal.minutes).toBeCloseTo(15, 3);
    expect(goal.value).toBeCloseTo(0.5, 3);
  });
});
