import { type LetterFilter, type PhoneticModel, type RNG } from "@/phonetic";
import { type Settings } from "@/settings";
import { type LessonKeys } from "./lessonkey.ts";

const PUNCTUATORS = [",", ".", ";", ":", "!", "?"];

/** Approximate character count for a lesson, scaled by the length setting. */
export function lessonLengthChars(settings: Settings): number {
  return Math.round(25 + settings.lessonLength * 45); // 25..70 chars
}

/**
 * Builds the text for a guided lesson: a stream of phonetic pseudo-words made
 * only from the included letters (emphasising the focused one), then shaped by
 * the capitals / punctuators / repeat-words settings.
 */
export function generateGuidedText(
  model: PhoneticModel,
  lessonKeys: LessonKeys,
  settings: Settings,
  rng: RNG,
): string {
  const included = lessonKeys.findIncludedKeys();
  const focused = lessonKeys.findFocusedKey();
  const filter: LetterFilter = {
    allowed: new Set(included.map((k) => k.codePoint)),
    focused: focused?.codePoint ?? null,
  };

  const target = lessonLengthChars(settings);
  const words = wordStream(() => model.word(filter, rng), settings, rng);
  return assemble(words, target);
}

/** Shapes a raw word generator into capitalised / punctuated / repeated words. */
export function wordStream(
  nextWord: () => string,
  settings: Settings,
  rng: RNG,
): () => string {
  const repeat = Math.max(1, Math.round(settings.repeatWords));
  let pending: string[] = [];
  return () => {
    if (pending.length === 0) {
      let word = nextWord();
      if (word.length === 0) {
        word = "?";
      }
      if (rng.next() < settings.capitals) {
        word = word[0].toUpperCase() + word.slice(1);
      }
      if (rng.next() < settings.punctuators) {
        word = word + PUNCTUATORS[rng.int(PUNCTUATORS.length)];
      }
      pending = new Array(repeat).fill(word);
    }
    return pending.shift()!;
  };
}

function assemble(next: () => string, targetChars: number): string {
  const parts: string[] = [];
  let length = 0;
  while (length < targetChars) {
    const word = next();
    parts.push(word);
    length += word.length + 1; // +1 for the joining space
  }
  return parts.join(" ");
}
