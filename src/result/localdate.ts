/** A calendar day in the user's local timezone, used to group daily stats. */
export class LocalDate {
  static now(): LocalDate {
    return LocalDate.of(Date.now());
  }

  static of(timeStamp: number): LocalDate {
    const d = new Date(timeStamp);
    return new LocalDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
  }

  constructor(
    readonly year: number,
    readonly month: number,
    readonly day: number,
  ) {
    Object.freeze(this);
  }

  /** Whole days between this date and another (other - this). */
  daysSince(other: LocalDate): number {
    const a = Date.UTC(this.year, this.month - 1, this.day);
    const b = Date.UTC(other.year, other.month - 1, other.day);
    return Math.round((a - b) / 86_400_000);
  }

  toString(): string {
    const mm = String(this.month).padStart(2, "0");
    const dd = String(this.day).padStart(2, "0");
    return `${this.year}-${mm}-${dd}`;
  }
}

/** The window of "today" in local time, used by the daily goal. */
export class Today {
  readonly #start: number;
  readonly #end: number;

  constructor(now: number = Date.now()) {
    const d = new Date(now);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    this.#start = start;
    this.#end = start + 86_400_000;
  }

  includes(timeStamp: number): boolean {
    return timeStamp >= this.#start && timeStamp < this.#end;
  }
}
