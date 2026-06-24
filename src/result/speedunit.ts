/**
 * Speed is stored internally as characters-per-minute (CPM). A SpeedUnit
 * converts that base value into the unit the user chose to display.
 */
export class SpeedUnit {
  static readonly WPM = new SpeedUnit("wpm", 1 / 5, "Words per minute", "wpm");
  static readonly WPS = new SpeedUnit("wps", 1 / 300, "Words per second", "wps");
  static readonly CPM = new SpeedUnit("cpm", 1, "Characters per minute", "cpm");
  static readonly CPS = new SpeedUnit("cps", 1 / 60, "Characters per second", "cps");

  static readonly ALL = [
    SpeedUnit.WPM,
    SpeedUnit.WPS,
    SpeedUnit.CPM,
    SpeedUnit.CPS,
  ] as const;

  static fromId(id: string): SpeedUnit {
    return SpeedUnit.ALL.find((u) => u.id === id) ?? SpeedUnit.WPM;
  }

  private constructor(
    readonly id: string,
    readonly factor: number,
    readonly name: string,
    readonly suffix: string,
  ) {
    Object.freeze(this);
  }

  /** Converts a CPM value into this unit. */
  measure(cpm: number): number {
    return cpm * this.factor;
  }

  toString(): string {
    return this.id;
  }
}

/**
 * Convert time-to-type in milliseconds to typing speed in characters per minute.
 */
export function timeToSpeed(v: number): number {
  if (!Number.isFinite(v) || v === 0) {
    throw new Error();
  }
  return (60 * 1000) / v;
}

/**
 * Convert typing speed in characters per minute to time-to-type in milliseconds.
 */
export function speedToTime(v: number): number {
  if (!Number.isFinite(v) || v === 0) {
    throw new Error();
  }
  return 1000 / (v / 60);
}
