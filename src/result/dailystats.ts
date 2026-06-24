import { LocalDate } from "./localdate.ts";
import { type Result } from "./result.ts";
import { makeSummaryStats, type SummaryStats } from "./summarystats.ts";

export type DailyStats = {
  readonly date: LocalDate;
  readonly results: readonly Result[];
  readonly stats: SummaryStats;
};

/** Groups results by local calendar day, each with its own summary stats. */
export class DailyStatsMap implements Iterable<DailyStats> {
  readonly #map = new Map<string, DailyStats>();
  readonly #today: DailyStats;

  constructor(results: readonly Result[], today: LocalDate = LocalDate.now()) {
    const byDate = new Map<string, Result[]>();
    for (const result of results) {
      const key = String(LocalDate.of(result.timeStamp));
      const list = byDate.get(key);
      if (list) {
        list.push(result);
      } else {
        byDate.set(key, [result]);
      }
    }
    for (const [key, list] of byDate) {
      const [y, m, d] = key.split("-").map(Number);
      this.#map.set(key, makeStats(new LocalDate(y, m, d), list));
    }
    this.#today = this.#map.get(String(today)) ?? makeStats(today, []);
  }

  [Symbol.iterator](): IterableIterator<DailyStats> {
    return this.#map.values();
  }

  get today(): DailyStats {
    return this.#today;
  }

  /** Days sorted ascending, suitable for a calendar/heatmap. */
  toSortedArray(): DailyStats[] {
    return [...this.#map.values()].sort(
      (a, b) => a.date.daysSince(b.date) * -1,
    );
  }
}

function makeStats(date: LocalDate, results: readonly Result[]): DailyStats {
  return { date, results, stats: makeSummaryStats(results) };
}
