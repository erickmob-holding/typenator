import { type Keyboard } from "@/keyboard";
import { makeRNG, PhoneticModel, type RNG } from "@/phonetic";
import { makeKeyStatsMap, type Result } from "@/result";
import { type Settings } from "@/settings";
import { updateGuided } from "./guided.ts";
import { type LessonKeys } from "./lessonkey.ts";
import { generateGuidedText, lessonLengthChars, wordStream } from "./textgen.ts";
import { generateBooksText } from "./books.ts";
import { generateCodeText } from "./code.ts";
import { EN_WORDS } from "@/phonetic";

export type GeneratedLesson = {
  readonly text: string;
  /** Present only for guided lessons. */
  readonly lessonKeys: LessonKeys | null;
  /** For books mode: how many words were consumed, to advance the position. */
  readonly consumedWords?: number;
};

/** Filters the result history down to the ones for the active layout. */
export function resultsForLayout(
  results: readonly Result[],
  settings: Settings,
): Result[] {
  return results.filter((r) => r.layout === settings.layout);
}

/**
 * Produces the next lesson for the current settings. Guided mode runs the
 * adaptive algorithm; other modes draw from their own text source. The history
 * is used to drive the guided algorithm's per-key confidence.
 */
export function makeLesson(
  settings: Settings,
  keyboard: Keyboard,
  model: PhoneticModel,
  history: readonly Result[],
  seed: number = Date.now(),
): GeneratedLesson {
  const rng = makeRNG(seed);
  const results = resultsForLayout(history, settings);

  switch (settings.lessonType) {
    case "guided": {
      const keyStatsMap = makeKeyStatsMap([...keyboard.letters], results);
      const lessonKeys = updateGuided(keyStatsMap, keyboard, settings);
      const text = generateGuidedText(model, lessonKeys, settings, rng);
      return { text, lessonKeys };
    }
    case "wordlist":
      return { text: fromWordList(settings, rng), lessonKeys: null };
    case "custom":
      return { text: fromCustomText(settings, rng), lessonKeys: null };
    case "numbers":
      return { text: fromNumbers(settings, rng), lessonKeys: null };
    case "books": {
      const { text, consumedWords } = generateBooksText(
        settings,
        settings.books.position,
      );
      return { text, lessonKeys: null, consumedWords };
    }
    case "code":
      return { text: generateCodeText(settings, rng), lessonKeys: null };
    default:
      return { text: fromWordList(settings, rng), lessonKeys: null };
  }
}

function fromWordList(settings: Settings, rng: RNG): string {
  const pool = EN_WORDS.filter(
    (w) => !settings.wordList.longWordsOnly || w.length >= 5,
  ).slice(0, settings.wordList.wordListSize);
  const next = wordStream(() => pool[rng.int(pool.length)], settings, rng);
  return buildTo(next, lessonLengthChars(settings));
}

function fromCustomText(settings: Settings, rng: RNG): string {
  let content = settings.customText.content.trim();
  if (settings.customText.lettersOnly) {
    content = content.replace(/[^\p{L}\s]/gu, "");
  }
  if (settings.customText.lowercase) {
    content = content.toLowerCase();
  }
  const words = content.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return "type something in settings";
  }
  if (settings.customText.randomize) {
    const next = wordStream(() => words[rng.int(words.length)], settings, rng);
    return buildTo(next, lessonLengthChars(settings));
  }
  return words.join(" ");
}

function fromNumbers(settings: Settings, rng: RNG): string {
  // Benford's law biases the leading digit toward smaller values.
  const benfordLeading = () => {
    const r = rng.next();
    let cum = 0;
    for (let d = 1; d <= 9; d++) {
      cum += Math.log10(1 + 1 / d);
      if (r < cum) {
        return d;
      }
    }
    return 9;
  };
  const numbers: string[] = [];
  let length = 0;
  const target = lessonLengthChars(settings);
  while (length < target) {
    const digits = 2 + rng.int(4);
    let n = settings.numbers.benford ? String(benfordLeading()) : String(1 + rng.int(9));
    for (let i = 1; i < digits; i++) {
      n += String(rng.int(10));
    }
    numbers.push(n);
    length += n.length + 1;
  }
  return numbers.join(" ");
}

function buildTo(next: () => string, targetChars: number): string {
  const parts: string[] = [];
  let length = 0;
  while (length < targetChars) {
    const word = next();
    parts.push(word);
    length += word.length + 1;
  }
  return parts.join(" ");
}
