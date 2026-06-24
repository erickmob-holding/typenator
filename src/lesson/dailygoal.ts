import { type Result, Today } from "@/result";
import { type Settings } from "@/settings";

export type DailyGoal = {
  /** Goal in minutes. */
  readonly goal: number;
  /** Progress toward the goal, 0..1+ (clamped by the UI). */
  readonly value: number;
  /** Minutes practised today. */
  readonly minutes: number;
};

/** Sums today's practice time and compares it against the daily goal (§11). */
export function computeDailyGoal(
  results: readonly Result[],
  settings: Settings,
  today: Today = new Today(),
): DailyGoal {
  const goal = settings.dailyGoal;
  let timeMs = 0;
  for (const result of results) {
    if (today.includes(result.timeStamp)) {
      timeMs += result.time;
    }
  }
  const minutes = timeMs / 1000 / 60;
  return {
    goal,
    minutes,
    value: goal > 0 ? minutes / goal : 0,
  };
}
