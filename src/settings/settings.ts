/**
 * The full Typenator settings model. Field names and default values mirror
 * keybr's `lessonProps` (see plan §13) plus display preferences. Settings are
 * persisted locally and, when signed in, synced to the user's Firestore doc.
 */
export type LessonType =
  | "guided"
  | "wordlist"
  | "books"
  | "custom"
  | "code"
  | "numbers";

export type Settings = {
  /** Schema version, for forward migrations. */
  readonly version: number;

  // --- Lesson selection ---
  readonly lessonType: LessonType;
  /** Keyboard layout id. */
  readonly layout: string;
  /** 0 = a short lesson, 1 = a long lesson. */
  readonly lessonLength: number;

  // --- Guided mode (the adaptive algorithm) ---
  readonly guided: {
    /** Mix real dictionary words in with the pseudo-words. */
    readonly naturalWords: boolean;
    /** Introduce letters in keyboard-row order instead of by frequency. */
    readonly keyboardOrder: boolean;
    /** 0 = smallest alphabet, 1 = include every letter. */
    readonly alphabetSize: number;
    /** Require current speed (not just best) to be at target before advancing. */
    readonly recoverKeys: boolean;
  };

  // --- Other lesson modes ---
  readonly wordList: { readonly wordListSize: number; readonly longWordsOnly: boolean };
  readonly numbers: { readonly benford: boolean };
  readonly customText: {
    readonly content: string;
    readonly lettersOnly: boolean;
    readonly lowercase: boolean;
    readonly randomize: boolean;
  };
  readonly books: {
    /** Id of the selected book. */
    readonly book: string;
    /** Running word position; advances as you type through the book. */
    readonly position: number;
    readonly lettersOnly: boolean;
    readonly lowercase: boolean;
  };
  readonly code: {
    /** Id of the selected programming syntax. */
    readonly syntax: string;
  };

  // --- Text shaping (apply across modes) ---
  /** Fraction of words that get a leading capital, 0..1. */
  readonly capitals: number;
  /** Fraction of words followed by punctuation, 0..1. */
  readonly punctuators: number;
  /** Repeat each generated word N times in a row, 1..10. */
  readonly repeatWords: number;

  // --- Goals ---
  /** Target typing speed in CPM (75..750). 175 CPM = 35 WPM. */
  readonly targetSpeed: number;
  /** Daily practice goal in minutes (0..120). */
  readonly dailyGoal: number;

  // --- Display ---
  readonly speedUnit: string;
  readonly theme: "light" | "dark";
  readonly sounds: boolean;
  /** Highlight the next key on the on-screen keyboard. */
  readonly highlightKey: boolean;
  /** Stop and wait on a typo instead of letting the user race ahead. */
  readonly stopOnError: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  version: 1,
  lessonType: "guided",
  layout: "us",
  lessonLength: 0,
  guided: {
    naturalWords: true,
    keyboardOrder: false,
    alphabetSize: 0,
    recoverKeys: false,
  },
  wordList: { wordListSize: 1000, longWordsOnly: false },
  numbers: { benford: true },
  customText: {
    content: "The quick brown fox jumps over the lazy dog.",
    lettersOnly: true,
    lowercase: true,
    randomize: false,
  },
  books: { book: "alice", position: 0, lettersOnly: false, lowercase: false },
  code: { syntax: "javascript" },
  capitals: 0,
  punctuators: 0,
  repeatWords: 1,
  targetSpeed: 175,
  dailyGoal: 30,
  speedUnit: "wpm",
  theme: "dark",
  sounds: false,
  highlightKey: true,
  stopOnError: true,
};

/** Deep-merges stored settings over the defaults so new fields get defaults. */
export function mergeSettings(partial: unknown): Settings {
  if (typeof partial !== "object" || partial == null) {
    return DEFAULT_SETTINGS;
  }
  const p = partial as Record<string, unknown>;
  const obj = (key: keyof Settings) =>
    typeof p[key] === "object" && p[key] != null ? (p[key] as object) : {};
  return {
    ...DEFAULT_SETTINGS,
    ...p,
    guided: { ...DEFAULT_SETTINGS.guided, ...obj("guided") },
    wordList: { ...DEFAULT_SETTINGS.wordList, ...obj("wordList") },
    numbers: { ...DEFAULT_SETTINGS.numbers, ...obj("numbers") },
    customText: { ...DEFAULT_SETTINGS.customText, ...obj("customText") },
    books: { ...DEFAULT_SETTINGS.books, ...obj("books") },
    code: { ...DEFAULT_SETTINGS.code, ...obj("code") },
  } as Settings;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
