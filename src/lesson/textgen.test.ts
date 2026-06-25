import { describe, expect, it } from "vitest";
import { Keyboard, QWERTY } from "@/keyboard";
import { makeKeyStatsMap } from "@/result";
import { EN_WORDS, makeRNG, PhoneticModel } from "@/phonetic";
import { DEFAULT_SETTINGS } from "@/settings";
import { generateGuidedText } from "./textgen.ts";
import { updateGuided } from "./guided.ts";

const keyboard = new Keyboard(QWERTY);
const model = PhoneticModel.english();
const realWords = new Set(EN_WORDS);

// Letters unlocked at the very start of guided mode.
const lessonKeys = updateGuided(
  makeKeyStatsMap([...keyboard.letters], []),
  keyboard,
  DEFAULT_SETTINGS,
);
const allowed = new Set(
  lessonKeys.findIncludedKeys().map((k) => k.char),
);

function wordsIn(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

describe("generateGuidedText — word mode", () => {
  it("emits only real dictionary words in 'real' mode", () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      guided: { ...DEFAULT_SETTINGS.guided, wordMode: "real" as const },
    };
    for (let seed = 0; seed < 20; seed++) {
      for (const w of wordsIn(generateGuidedText(model, lessonKeys, settings, makeRNG(seed)))) {
        expect(realWords.has(w)).toBe(true);
      }
    }
  });

  it("blends real and pseudo words in 'mixed' mode", () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      guided: { ...DEFAULT_SETTINGS.guided, wordMode: "mixed" as const },
    };
    // Sample several lessons so we don't depend on a single seed.
    const seen = new Set<string>();
    for (let seed = 0; seed < 20; seed++) {
      for (const w of wordsIn(generateGuidedText(model, lessonKeys, settings, makeRNG(seed)))) {
        seen.add(w);
      }
    }
    expect([...seen].some((w) => realWords.has(w))).toBe(true); // some real
    expect([...seen].some((w) => !realWords.has(w))).toBe(true); // some pseudo
  });

  it("only uses the unlocked letters in either mode", () => {
    for (const wordMode of ["real", "mixed"] as const) {
      const settings = {
        ...DEFAULT_SETTINGS,
        guided: { ...DEFAULT_SETTINGS.guided, wordMode },
      };
      for (let seed = 0; seed < 20; seed++) {
        const text = generateGuidedText(model, lessonKeys, settings, makeRNG(seed));
        for (const ch of text.replace(/\s+/g, "")) {
          expect(allowed.has(ch)).toBe(true);
        }
      }
    }
  });
});
