import { Histogram, type Stats } from "@/textinput";

/** The kind of text a lesson was generated from. */
export type TextType = "generated" | "natural" | "code" | "numbers";

export type ResultFilter = {
  readonly minLength: number;
  readonly minTime: number;
  readonly minComplexity: number;
  readonly minSpeed: number;
  readonly maxSpeed: number;
};

/**
 * A single completed lesson. Speed/accuracy/complexity/score are derived from
 * the raw counts exactly as keybr computes them, so stored results are the only
 * source of truth — every higher-level statistic is recomputed from these.
 */
export class Result {
  static readonly filter: ResultFilter = {
    minLength: 10,
    minTime: 1000,
    minComplexity: 1,
    minSpeed: 1,
    maxSpeed: Infinity,
  };

  static fromStats(
    layout: string,
    textType: TextType,
    timeStamp: number,
    stats: Stats,
  ): Result {
    return new Result(
      layout,
      textType,
      timeStamp,
      stats.length,
      stats.time,
      stats.errors,
      stats.histogram,
    );
  }

  static readonly isValid = (result: Result): boolean => result.validate();

  readonly complexity: number;
  readonly speed: number;
  readonly accuracy: number;
  readonly score: number;

  constructor(
    readonly layout: string,
    readonly textType: TextType,
    readonly timeStamp: number,
    readonly length: number,
    readonly time: number,
    readonly errors: number,
    readonly histogram: Histogram,
  ) {
    const { complexity } = histogram;
    let speed = 0;
    let accuracy = 0;
    let score = 0;
    if (length > 0 && time > 0 && complexity > 0) {
      speed = (length / (time / 1000)) * 60;
      accuracy = (length - errors) / length;
      score = ((speed * complexity) / (errors + 1)) * (length / 50);
    }
    this.complexity = complexity;
    this.speed = speed;
    this.accuracy = accuracy;
    this.score = score;
  }

  validate({
    minLength = Result.filter.minLength,
    minTime = Result.filter.minTime,
    minComplexity = Result.filter.minComplexity,
    minSpeed = Result.filter.minSpeed,
    maxSpeed = Result.filter.maxSpeed,
  }: Partial<ResultFilter> = {}): boolean {
    return (
      this.length >= minLength &&
      this.time >= minTime &&
      this.complexity >= minComplexity &&
      this.speed >= minSpeed &&
      this.speed <= maxSpeed &&
      this.histogram.validate()
    );
  }

  toJSON() {
    return {
      layout: this.layout,
      textType: this.textType,
      timeStamp: this.timeStamp,
      length: this.length,
      time: this.time,
      errors: this.errors,
      histogram: this.histogram.toJSON(),
    };
  }

  static fromJSON(json: ReturnType<Result["toJSON"]>): Result {
    return new Result(
      json.layout,
      json.textType as TextType,
      json.timeStamp,
      json.length,
      json.time,
      json.errors,
      new Histogram(json.histogram),
    );
  }
}
