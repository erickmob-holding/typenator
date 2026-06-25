import { type CodePoint } from "@/textinput";

/** A physical key position on the on-screen keyboard. */
export type KeyDef = {
  /** Lowercase character produced by the key. */
  readonly char: string;
  readonly codePoint: CodePoint;
  /** Row index, 0 = number row .. 4 = space row. */
  readonly row: number;
  /** Which half of a split keyboard the key lives on. */
  readonly hand: Hand;
  /** Column within the hand, 0 = leftmost rendered column. */
  readonly col: number;
  /** Which finger should press the key (for hints/coloring). */
  readonly finger: Finger;
  /** Home-row key (where fingers rest). */
  readonly home?: boolean;
};

export type Hand = "left" | "right" | "thumb";

export type Finger =
  | "lPinky"
  | "lRing"
  | "lMiddle"
  | "lIndex"
  | "rIndex"
  | "rMiddle"
  | "rRing"
  | "rPinky"
  | "thumb";

export type Layout = {
  readonly id: string;
  readonly name: string;
  readonly family: string;
  readonly keys: readonly KeyDef[];
  /** Letters in descending order of frequency in the language. */
  readonly frequencyOrder: readonly CodePoint[];
};

export class Keyboard {
  readonly #byCodePoint: Map<CodePoint, KeyDef>;

  constructor(readonly layout: Layout) {
    this.#byCodePoint = new Map(layout.keys.map((k) => [k.codePoint, k]));
  }

  get keys(): readonly KeyDef[] {
    return this.layout.keys;
  }

  /** The alphabet letters of the layout, in frequency order. */
  get letters(): readonly CodePoint[] {
    return this.layout.frequencyOrder;
  }

  keyOf(codePoint: CodePoint): KeyDef | null {
    return this.#byCodePoint.get(codePoint) ?? null;
  }
}
