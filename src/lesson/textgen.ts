import { EN_WORDS, type LetterFilter, type PhoneticModel, type RNG } from "@/phonetic";
import { type Settings } from "@/settings";
import { type CodePoint } from "@/textinput";
import { type LessonKeys } from "./lessonkey.ts";

const PUNCTUATORS = [",", ".", ";", ":", "!", "?"];

/** Share of words drawn from the dictionary when "Mix in real words" is on. */
const NATURAL_WORD_RATIO = 0.5;

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
  const words = wordStream(nextGuidedWord(model, filter, settings, rng), settings, rng);
  return assemble(words, target);
}

/**
 * Picks the raw word source for a guided lesson. Both word modes draw on the
 * dictionary words spellable from the included letters: "real" uses only those,
 * "mixed" blends them with phonetic pseudo-words. When no real word can be
 * formed yet (a tiny alphabet) we fall back to pseudo-words so generation never
 * stalls.
 */
function nextGuidedWord(
  model: PhoneticModel,
  filter: LetterFilter,
  settings: Settings,
  rng: RNG,
): () => string {
  const pseudo = () => model.word(filter, rng);
  const realWords = wordsFromLetters(filter.allowed);
  if (realWords.length === 0) {
    return pseudo;
  }
  const real = () => realWords[rng.int(realWords.length)];
  if (settings.guided.wordMode === "real") {
    return real;
  }
  return () => (rng.next() < NATURAL_WORD_RATIO ? real() : pseudo());
}

/** Dictionary words spellable using only the given letters. */
function wordsFromLetters(allowed: ReadonlySet<CodePoint>): string[] {
  return EN_WORDS.filter(
    (w) => w.length >= 2 && [...w].every((c) => allowed.has(c.codePointAt(0)!)),
  );
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
