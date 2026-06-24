/**
 * Exponential smoothing filter.
 * @see https://en.wikipedia.org/wiki/Exponential_smoothing
 *
 * keybr smooths each key's time-to-type with alpha = 0.1 so a single fast or
 * slow lesson does not swing a key's measured speed.
 */
export type Filter = {
  /** Number of samples added so far. */
  readonly n: number;
  /** Adds a new sample and returns the current smoothed value. */
  add(v: number): number;
};

export const makeFilter = (alpha: number): Filter => {
  let n = 0;
  let value = NaN;

  return {
    get n(): number {
      return n;
    },
    add: (v: number): number => {
      n++;
      if (n > 1) {
        value = alpha * v + (1 - alpha) * value;
      } else {
        value = v;
      }
      return value;
    },
  };
};
