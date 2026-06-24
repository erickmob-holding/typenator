import { speedToTime } from "@/result";

/**
 * The target speed expressed as a per-key confidence. confidence = the ratio of
 * the time-to-type allowed at the target speed to the user's actual time. A
 * value >= 1 means the key is at or above the target speed and has "graduated".
 */
export class Target {
  constructor(readonly targetSpeed: number) {}

  confidence(timeToType: number | null): number | null {
    if (timeToType == null) {
      return null;
    }
    if (!Number.isFinite(timeToType) || timeToType === 0) {
      return null;
    }
    return speedToTime(this.targetSpeed) / timeToType;
  }
}
