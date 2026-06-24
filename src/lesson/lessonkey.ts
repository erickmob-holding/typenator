import { type KeyStats } from "@/result";
import { type CodePoint } from "@/textinput";
import { type Target } from "./target.ts";

/** A layout letter annotated with the user's progress toward the target. */
export type LessonKey = {
  readonly codePoint: CodePoint;
  readonly char: string;
  readonly stats: KeyStats;
  readonly timeToType: number | null;
  readonly bestTimeToType: number | null;
  readonly confidence: number | null;
  readonly bestConfidence: number | null;
  readonly isIncluded: boolean;
  readonly isFocused: boolean;
  readonly isForced: boolean;
};

export function lessonKeyFrom(stats: KeyStats, target: Target): LessonKey {
  return {
    codePoint: stats.codePoint,
    char: String.fromCodePoint(stats.codePoint),
    stats,
    timeToType: stats.timeToType,
    bestTimeToType: stats.bestTimeToType,
    confidence: target.confidence(stats.timeToType),
    bestConfidence: target.confidence(stats.bestTimeToType),
    isIncluded: false,
    isFocused: false,
    isForced: false,
  };
}

/** An ordered, mutable view over the lesson keys for the guided algorithm. */
export class LessonKeys implements Iterable<LessonKey> {
  readonly #keys: LessonKey[];
  readonly #index: Map<CodePoint, number>;

  constructor(keys: readonly LessonKey[]) {
    this.#keys = keys.map((k) => ({ ...k }));
    this.#index = new Map(this.#keys.map((k, i) => [k.codePoint, i]));
  }

  [Symbol.iterator](): IterableIterator<LessonKey> {
    return this.#keys[Symbol.iterator]();
  }

  get all(): readonly LessonKey[] {
    return this.#keys;
  }

  findIncludedKeys(): LessonKey[] {
    return this.#keys.filter((k) => k.isIncluded);
  }

  findFocusedKey(): LessonKey | null {
    return this.#keys.find((k) => k.isFocused) ?? null;
  }

  include(cp: CodePoint): void {
    this.#patch(cp, { isIncluded: true });
  }

  force(cp: CodePoint): void {
    this.#patch(cp, { isIncluded: true, isForced: true });
  }

  focus(cp: CodePoint): void {
    this.#patch(cp, { isIncluded: true, isFocused: true });
  }

  #patch(cp: CodePoint, patch: Partial<LessonKey>): void {
    const i = this.#index.get(cp);
    if (i != null) {
      this.#keys[i] = { ...this.#keys[i], ...patch };
    }
  }
}
