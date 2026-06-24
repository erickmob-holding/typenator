import { Histogram } from "./histogram.ts";
import { type Step } from "./types.ts";

export type Stats = {
  /** Total elapsed time of the lesson in milliseconds. */
  readonly time: number;
  /** Typing speed in characters per minute. */
  readonly speed: number;
  /** Number of characters typed. */
  readonly length: number;
  /** Number of typos. */
  readonly errors: number;
  /** Fraction of correct characters, 0..1. */
  readonly accuracy: number;
  readonly histogram: Histogram;
};

/**
 * Computes the summary statistics of a completed lesson from its keystrokes.
 * Mirrors keybr: the very first step (the trigger) is excluded from the
 * histogram so the initial reaction time does not pollute per-key timings.
 */
export function makeStats(steps: readonly Step[]): Stats {
  if (steps.length >= 2) {
    const length = steps.length;
    const time = Math.round(timeSpan(steps));
    const speed = computeSpeed(length, time);
    const errors = countErrors(steps);
    const accuracy = (length - errors) / length;
    return {
      time,
      speed,
      length,
      errors,
      accuracy,
      histogram: Histogram.from(steps.slice(1)),
    };
  }
  return {
    time: 0,
    speed: 0,
    length: 0,
    errors: 0,
    accuracy: 0,
    histogram: Histogram.empty,
  };
}

function timeSpan(steps: readonly Step[]): number {
  // timeToType on each step is the gap from the previous step, so the total
  // elapsed time is the sum of every gap after the first (trigger) step.
  let time = 0;
  for (let i = 1; i < steps.length; i++) {
    time += steps[i].timeToType;
  }
  return time;
}

export function countErrors(steps: readonly Step[]): number {
  let errors = 0;
  for (const step of steps) {
    if (step.typo) {
      errors += 1;
    }
  }
  return errors;
}

export function computeSpeed(length: number, time: number): number {
  return time > 0 ? (length / (time / 1000)) * 60 : 0;
}
