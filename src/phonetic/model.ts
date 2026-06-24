import { type CodePoint } from "@/textinput";
import { type RNG } from "./rng.ts";
import { EN_WORDS } from "./wordlist-en.ts";

/** Which letters a lesson may use, and which one to emphasise. */
export type LetterFilter = {
  readonly allowed: ReadonlySet<CodePoint>;
  readonly focused: CodePoint | null;
};

type Counts = Map<CodePoint, number>;

function bump(counts: Counts, cp: CodePoint): void {
  counts.set(cp, (counts.get(cp) ?? 0) + 1);
}

/**
 * A character-level Markov model (order 2 with unigram fallback) trained on a
 * word corpus. It mirrors keybr's phonetic model: it produces pronounceable
 * pseudo-words restricted to a chosen subset of letters, which forces the
 * typist to react to letter sequences instead of recognising whole words.
 */
export class PhoneticModel {
  static fromWords(words: readonly string[]): PhoneticModel {
    const start: Counts = new Map();
    const unigram: Counts = new Map();
    const transition = new Map<CodePoint, Counts>();
    for (const word of words) {
      const cps = [...word].map((c) => c.codePointAt(0)!);
      if (cps.length === 0) {
        continue;
      }
      bump(start, cps[0]);
      for (let i = 0; i < cps.length; i++) {
        bump(unigram, cps[i]);
        if (i > 0) {
          let row = transition.get(cps[i - 1]);
          if (!row) {
            transition.set(cps[i - 1], (row = new Map()));
          }
          bump(row, cps[i]);
        }
      }
    }
    return new PhoneticModel(start, unigram, transition);
  }

  static english(): PhoneticModel {
    return PhoneticModel.fromWords(EN_WORDS);
  }

  private constructor(
    private readonly start: Counts,
    private readonly unigram: Counts,
    private readonly transition: Map<CodePoint, Counts>,
  ) {}

  /** Generates a single pseudo-word respecting the letter filter. */
  word(filter: LetterFilter, rng: RNG, minLen = 3, maxLen = 8): string {
    const allowed = [...filter.allowed];
    if (allowed.length === 0) {
      return "";
    }
    const targetLen = minLen + rng.int(maxLen - minLen + 1);
    const out: CodePoint[] = [];
    let prev: CodePoint | null = null;
    for (let i = 0; i < targetLen; i++) {
      const row = prev != null ? this.transition.get(prev) : this.start;
      const cp = this.#pick(row, filter, rng);
      out.push(cp);
      prev = cp;
    }
    return String.fromCodePoint(...out);
  }

  #pick(row: Counts | undefined, filter: LetterFilter, rng: RNG): CodePoint {
    const entries: [CodePoint, number][] = [];
    for (const cp of filter.allowed) {
      // Prefer the contextual (Markov) weight; fall back to the global letter
      // frequency so generation never stalls on a sparse small alphabet.
      const weight =
        (row?.get(cp) ?? 0) * 4 + (this.unigram.get(cp) ?? 0) + 1;
      const boost = cp === filter.focused ? 3 : 1;
      entries.push([cp, weight * boost]);
    }
    return rng.weighted(entries);
  }
}
