import { type Keyboard } from "@/keyboard";
import { type KeyStatsMap } from "@/result";
import { type Settings } from "@/settings";
import { lessonKeyFrom, LessonKeys } from "./lessonkey.ts";
import { Target } from "./target.ts";

/**
 * Decides which letters are in the current alphabet and which one to focus on,
 * given the user's per-key stats. Faithful port of keybr's GuidedLesson.update
 * (plan §7):
 *
 *  - Always keep at least `minSize` (6) letters.
 *  - Grow up to `maxSize`, which `alphabetSize` controls.
 *  - A new letter is only introduced once every already-included letter has
 *    reached the target speed (best confidence >= 1, or current confidence when
 *    `recoverKeys` is on).
 *  - The weakest included letter (lowest confidence < 1) becomes the focus.
 */
export function updateGuided(
  keyStatsMap: KeyStatsMap,
  keyboard: Keyboard,
  settings: Settings,
): LessonKeys {
  const target = new Target(settings.targetSpeed);
  const { alphabetSize, recoverKeys } = settings.guided;

  const ordered = orderedLetters(keyboard, settings);
  const minSize = 6;
  const maxSize = minSize + Math.round((ordered.length - minSize) * alphabetSize);

  const lessonKeys = new LessonKeys(
    ordered.map((cp) => lessonKeyFrom(keyStatsMap.get(cp), target)),
  );

  for (const lessonKey of lessonKeys.all) {
    const included = lessonKeys.findIncludedKeys();

    if (included.length < minSize) {
      lessonKeys.include(lessonKey.codePoint);
      continue;
    }
    if (included.length < maxSize) {
      lessonKeys.force(lessonKey.codePoint);
      continue;
    }
    if ((lessonKey.bestConfidence ?? 0) >= 1) {
      lessonKeys.include(lessonKey.codePoint);
      continue;
    }
    const ready = recoverKeys
      ? included.every((k) => (k.confidence ?? 0) >= 1)
      : included.every((k) => (k.bestConfidence ?? 0) >= 1);
    if (ready) {
      lessonKeys.include(lessonKey.codePoint);
    }
  }

  // Focus the least confident included key still below target.
  const confidenceOf = (k: { confidence: number | null; bestConfidence: number | null }) =>
    recoverKeys ? (k.confidence ?? 0) : (k.bestConfidence ?? 0);
  const weakest = lessonKeys
    .findIncludedKeys()
    .filter((k) => confidenceOf(k) < 1)
    .sort((a, b) => confidenceOf(a) - confidenceOf(b));
  if (weakest.length > 0) {
    lessonKeys.focus(weakest[0].codePoint);
  }

  return lessonKeys;
}

function orderedLetters(keyboard: Keyboard, settings: Settings) {
  if (settings.guided.keyboardOrder) {
    // Home row first, then the rest, as a simple keyboard-order heuristic.
    return [...keyboard.keys]
      .sort((a, b) => (b.home ? 1 : 0) - (a.home ? 1 : 0) || a.row - b.row)
      .map((k) => k.codePoint);
  }
  return [...keyboard.letters];
}
