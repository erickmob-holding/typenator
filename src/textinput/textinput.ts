import { makeStats, type Stats } from "./stats.ts";
import { Attr, type Char, type CodePoint, type Step } from "./types.ts";

export type AddResult =
  | { readonly type: "hit" }
  | { readonly type: "miss" }
  | { readonly type: "complete"; readonly stats: Stats };

/**
 * Drives a single lesson: holds the target text, the cursor position, and the
 * recorded keystrokes. The caller feeds typed code points and a timestamp; the
 * machine reports whether each key was a hit/miss and, when finished, the Stats.
 *
 * Behaviour matches keybr's default: the cursor only advances on the correct
 * key. The first wrong key at a position marks that character as a typo, but the
 * user must still type it correctly to move on.
 */
export class TextInput {
  readonly #text: readonly CodePoint[];
  readonly #steps: Step[] = [];
  #pos = 0;
  #typoHere = false;
  #lastTime = NaN;

  constructor(text: string) {
    this.#text = [...text].map((ch) => ch.codePointAt(0)!);
  }

  get length(): number {
    return this.#text.length;
  }

  get position(): number {
    return this.#pos;
  }

  get completed(): boolean {
    return this.#pos >= this.#text.length;
  }

  /** Code point the user is expected to type next, or null when finished. */
  get expected(): CodePoint | null {
    return this.#pos < this.#text.length ? this.#text[this.#pos] : null;
  }

  /** The text annotated with hit/miss/normal attributes for rendering. */
  chars(): Char[] {
    return this.#text.map((codePoint, index) => {
      let attr = Attr.Normal;
      if (index < this.#pos) {
        attr = Attr.Hit;
      } else if (index === this.#pos && this.#typoHere) {
        attr = Attr.Miss;
      }
      return { codePoint, attr };
    });
  }

  /** Feeds one typed code point. `time` is a monotonic timestamp in ms. */
  add(codePoint: CodePoint, time: number): AddResult {
    const expected = this.expected;
    if (expected == null) {
      return { type: "complete", stats: makeStats(this.#steps) };
    }

    if (codePoint === expected) {
      const timeToType = Number.isNaN(this.#lastTime) ? 0 : time - this.#lastTime;
      this.#lastTime = time;
      this.#steps.push({ codePoint, timeToType, typo: this.#typoHere });
      this.#pos += 1;
      this.#typoHere = false;
      if (this.completed) {
        return { type: "complete", stats: makeStats(this.#steps) };
      }
      return { type: "hit" };
    }

    this.#typoHere = true;
    return { type: "miss" };
  }

  /** Handles a backspace: steps the cursor back one position. */
  back(): void {
    if (this.#pos > 0) {
      this.#pos -= 1;
      this.#steps.pop();
      this.#typoHere = false;
    }
  }

  reset(): void {
    this.#steps.length = 0;
    this.#pos = 0;
    this.#typoHere = false;
    this.#lastTime = NaN;
  }
}
