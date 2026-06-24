import { type Result } from "./result.ts";

/** Aggregate of a single metric over a set of results. */
export type Metric = {
  /** The most recent value. */
  readonly last: number;
  /** Change in the last value compared to the running average. */
  readonly delta: number;
  readonly min: number;
  readonly max: number;
  readonly avg: number;
};

export type SummaryStats = {
  readonly count: number;
  /** Total typing time across all results, in milliseconds. */
  readonly time: number;
  readonly speed: Metric;
  readonly accuracy: Metric;
  readonly score: Metric;
};

class MutableMetric implements Metric {
  #last = 0;
  #delta = 0;
  #count = 0;
  #sum = 0;
  #min = 0;
  #max = 0;
  #avg = 0;

  get last() {
    return this.#last;
  }
  get delta() {
    return this.#delta;
  }
  get min() {
    return this.#min;
  }
  get max() {
    return this.#max;
  }
  get avg() {
    return this.#avg;
  }

  append(value: number): void {
    this.#count += 1;
    if (this.#count === 1) {
      this.#last = value;
      this.#delta = value;
      this.#sum = value;
      this.#min = value;
      this.#max = value;
      this.#avg = value;
    } else {
      this.#last = value;
      this.#delta = value - this.#avg;
      this.#sum += value;
      this.#min = Math.min(this.#min, value);
      this.#max = Math.max(this.#max, value);
      this.#avg = this.#sum / this.#count;
    }
  }

  freeze(): Metric {
    return {
      last: this.#last,
      delta: this.#delta,
      min: this.#min,
      max: this.#max,
      avg: this.#avg,
    };
  }
}

export function makeSummaryStats(results: readonly Result[]): SummaryStats {
  let count = 0;
  let time = 0;
  const speed = new MutableMetric();
  const accuracy = new MutableMetric();
  const score = new MutableMetric();
  for (const result of results) {
    count += 1;
    time += result.time;
    speed.append(result.speed);
    accuracy.append(result.accuracy);
    score.append(result.score);
  }
  return {
    count,
    time,
    speed: speed.freeze(),
    accuracy: accuracy.freeze(),
    score: score.freeze(),
  };
}
