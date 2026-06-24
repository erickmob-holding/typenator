import { describe, expect, it } from "vitest";
import { PhoneticModel } from "./model.ts";
import { makeRNG } from "./rng.ts";

const cp = (ch: string) => ch.codePointAt(0)!;

describe("PhoneticModel", () => {
  it("only emits letters from the allowed set", () => {
    const model = PhoneticModel.english();
    const allowed = new Set(["e", "t", "a", "o", "i", "n"].map(cp));
    const rng = makeRNG(42);
    for (let i = 0; i < 50; i++) {
      const word = model.word({ allowed, focused: null }, rng);
      for (const ch of word) {
        expect(allowed.has(cp(ch))).toBe(true);
      }
      expect(word.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("is deterministic for a given seed", () => {
    const model = PhoneticModel.english();
    const allowed = new Set(["e", "t", "a", "o", "i", "n"].map(cp));
    const a = model.word({ allowed, focused: null }, makeRNG(7));
    const b = model.word({ allowed, focused: null }, makeRNG(7));
    expect(a).toBe(b);
  });

  it("emphasises the focused letter", () => {
    const model = PhoneticModel.english();
    const allowed = new Set(["e", "t", "a", "o", "i", "n"].map(cp));
    const rng = makeRNG(99);
    let focusedCount = 0;
    let total = 0;
    for (let i = 0; i < 200; i++) {
      const word = model.word({ allowed, focused: cp("n") }, rng);
      for (const ch of word) {
        total += 1;
        if (ch === "n") {
          focusedCount += 1;
        }
      }
    }
    // 'n' is the rarest of the allowed letters yet should appear often.
    expect(focusedCount / total).toBeGreaterThan(0.12);
  });
});
