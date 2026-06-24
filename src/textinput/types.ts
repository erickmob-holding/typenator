export type CodePoint = number;

/**
 * One recorded keystroke while typing a lesson.
 * - `codePoint` is the expected character at this position.
 * - `timeToType` is the milliseconds elapsed since the previous keystroke.
 * - `typo` is true when the user's first attempt at this character was wrong.
 */
export type Step = {
  readonly codePoint: CodePoint;
  readonly timeToType: number;
  readonly typo: boolean;
};

/** Visual state of a character in the lesson text, used for rendering. */
export const enum Attr {
  Normal = 0,
  Hit = 1,
  Miss = 2,
  Garbage = 3,
}

export type Char = {
  readonly codePoint: CodePoint;
  readonly attr: Attr;
};
