import { makeFilter, type Filter } from "@/math";
import { type CodePoint } from "@/textinput";
import { type Result } from "./result.ts";

/** One per-lesson data point for a single key. */
export type KeySample = {
  readonly index: number;
  readonly timeStamp: number;
  readonly hitCount: number;
  readonly missCount: number;
  /** Raw mean time-to-type for the key in that lesson. */
  readonly timeToType: number;
  /** Exponentially smoothed (alpha = 0.1) time-to-type up to that lesson. */
  readonly filteredTimeToType: number;
};

export type KeyStats = {
  readonly codePoint: CodePoint;
  readonly samples: readonly KeySample[];
  /** Latest smoothed time-to-type, or null if never typed. */
  readonly timeToType: number | null;
  /** Best (minimum) smoothed time-to-type ever, or null. */
  readonly bestTimeToType: number | null;
};

export type KeyStatsMap = {
  readonly codePoints: readonly CodePoint[];
  readonly results: readonly Result[];
  get(codePoint: CodePoint): KeyStats;
} & Iterable<KeyStats>;

class MutableKeyStats implements KeyStats {
  readonly #samples: KeySample[] = [];
  readonly #filter: Filter = makeFilter(0.1);
  #index = 0;
  #timeToType: number | null = null;
  #bestTimeToType: number | null = null;

  constructor(readonly codePoint: CodePoint) {}

  get samples(): readonly KeySample[] {
    return this.#samples;
  }

  get timeToType(): number | null {
    return this.#timeToType;
  }

  get bestTimeToType(): number | null {
    return this.#bestTimeToType;
  }

  append(result: Result): void {
    const sample = result.histogram.get(this.codePoint);
    if (sample != null) {
      const { hitCount, missCount, timeToType } = sample;
      if (timeToType > 0) {
        const filteredTimeToType = this.#filter.add(timeToType);
        this.#samples.push({
          index: this.#index,
          timeStamp: result.timeStamp,
          hitCount,
          missCount,
          timeToType,
          filteredTimeToType,
        });
        this.#timeToType = filteredTimeToType;
        this.#bestTimeToType = Math.min(
          this.#bestTimeToType ?? Infinity,
          filteredTimeToType,
        );
      }
    }
    this.#index += 1;
  }

  freeze(): KeyStats {
    return {
      codePoint: this.codePoint,
      samples: [...this.#samples],
      timeToType: this.#timeToType,
      bestTimeToType: this.#bestTimeToType,
    };
  }
}

export function makeKeyStatsMap(
  codePoints: readonly CodePoint[],
  results: readonly Result[],
): KeyStatsMap {
  const mutable = new Map(
    codePoints.map((cp) => [cp, new MutableKeyStats(cp)]),
  );
  for (const result of results) {
    for (const stats of mutable.values()) {
      stats.append(result);
    }
  }
  const frozen = new Map(
    [...mutable].map(([cp, stats]) => [cp, stats.freeze()]),
  );
  const orderedCodePoints = [...codePoints];
  const orderedResults = [...results];
  return {
    get codePoints() {
      return orderedCodePoints;
    },
    get results() {
      return orderedResults;
    },
    get(codePoint: CodePoint): KeyStats {
      return (
        frozen.get(codePoint) ?? {
          codePoint,
          samples: [],
          timeToType: null,
          bestTimeToType: null,
        }
      );
    },
    [Symbol.iterator](): IterableIterator<KeyStats> {
      return frozen.values();
    },
  };
}
