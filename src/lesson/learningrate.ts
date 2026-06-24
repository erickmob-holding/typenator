import { hasData, polynomialRegression, type Polynomial, r2, Vector } from "@/math";
import { type KeySample, timeToSpeed } from "@/result";
import { type Target } from "./target.ts";

/**
 * Fits a learning curve to a key's recent speed samples and predicts how many
 * more lessons are needed to reach the target speed. Port of keybr's
 * LearningRate (plan §9): polynomial of degree 1/2/3 by sample count, accepted
 * only when R² >= 0.5.
 */
export class LearningRate {
  static from(
    samples: readonly KeySample[],
    target: Target,
  ): LearningRate | null {
    const recent = samples.slice(-30);
    return hasData(recent) ? new LearningRate(recent, target) : null;
  }

  readonly vIndex: Vector;
  readonly vSpeed: Vector;
  readonly mSpeed: Polynomial;
  readonly certainty: number = NaN;
  readonly learningRate: number = NaN;
  readonly remainingLessons: number = NaN;

  constructor(
    readonly samples: readonly KeySample[],
    readonly target: Target,
  ) {
    const { length } = samples;
    const vIndex = new Vector();
    const vSpeed = new Vector();
    for (let i = 0; i < length; i++) {
      vIndex.add(samples[i].index + 1);
      vSpeed.add(timeToSpeed(samples[i].filteredTimeToType));
    }
    const mSpeed = polynomialRegression(vIndex, vSpeed, degreeFor(length));
    this.vIndex = vIndex;
    this.vSpeed = vSpeed;
    this.mSpeed = mSpeed;

    const certainty = r2(vIndex, vSpeed, mSpeed);
    if (certainty >= 0.5) {
      const lastIndex = samples[length - 1].index + 1;
      this.certainty = certainty;
      this.learningRate = mSpeed.derivative().eval(lastIndex);
      for (let i = 1; i <= 50; i++) {
        if (mSpeed.eval(lastIndex + i) >= target.targetSpeed) {
          this.remainingLessons = i;
          break;
        }
      }
    }
  }
}

function degreeFor(length: number): number {
  if (length > 20) {
    return 3;
  }
  if (length > 10) {
    return 2;
  }
  return 1;
}
