import { type Result } from "./result.ts";

export type Streak = {
  /** Accuracy threshold of this streak, e.g. 1.0, 0.97, 0.95. */
  readonly level: number;
  /** The longest consecutive run of results at or above the level. */
  readonly results: readonly Result[];
};

export const STREAK_LEVELS = [1.0, 0.97, 0.95] as const;

/**
 * Finds the longest consecutive run of results meeting each accuracy threshold.
 * Mirrors keybr's three streak levels (perfect / 97% / 95%).
 */
export function findStreaks(results: readonly Result[]): Streak[] {
  return STREAK_LEVELS.map((level) => ({
    level,
    results: longestRun(results, level),
  })).filter((streak) => streak.results.length > 0);
}

function longestRun(results: readonly Result[], level: number): Result[] {
  let best: Result[] = [];
  let current: Result[] = [];
  for (const result of results) {
    if (result.accuracy >= level) {
      current.push(result);
      if (current.length > best.length) {
        best = [...current];
      }
    } else {
      current = [];
    }
  }
  return best;
}
