import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { makeLesson, resultsForLayout, Target } from "@/lesson";
import { makeKeyStatsMap, Result, type TextType } from "@/result";
import { Attr, TextInput, type CodePoint } from "@/textinput";
import { useProgress } from "@/app/ProgressContext.tsx";
import { OnScreenKeyboard, type KeyHeat } from "./Keyboard.tsx";
import { LessonHud } from "./LessonHud.tsx";
import "./Practice.css";

const TEXT_TYPE: Record<string, TextType> = {
  guided: "generated",
  wordlist: "natural",
  books: "natural",
  custom: "natural",
  code: "code",
  numbers: "numbers",
};

export function Practice() {
  const { settings, results, keyboard, model, appendResult } = useProgress();

  const [seed, setSeed] = useState(() => Date.now());
  const lesson = useMemo(
    () => makeLesson(settings, keyboard, model, results, seed),
    // Regenerate when the seed changes or settings/layout change. Results feed
    // the guided algorithm but we deliberately keep the same lesson mid-typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seed, settings, keyboard, model],
  );

  const inputRef = useRef(new TextInput(lesson.text));
  const [, force] = useState(0);
  const rerender = useCallback(() => force((n) => n + 1), []);
  const [lastResult, setLastResult] = useState<Result | null>(null);
  const [invalid, setInvalid] = useState(false);

  // Rebuild the input whenever a new lesson text is produced.
  useEffect(() => {
    inputRef.current = new TextInput(lesson.text);
    setInvalid(false);
    rerender();
  }, [lesson.text, rerender]);

  const nextLesson = useCallback(() => setSeed(Date.now()), []);

  const finish = useCallback(
    (result: Result) => {
      if (result.validate()) {
        appendResult(result);
        setLastResult(result);
        setInvalid(false);
      } else {
        setInvalid(true);
      }
      nextLesson();
    },
    [appendResult, nextLesson],
  );

  // Keyboard capture.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }
      const input = inputRef.current;
      if (e.key === "Backspace") {
        e.preventDefault();
        input.back();
        rerender();
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        nextLesson();
        return;
      }
      if (e.key.length !== 1) {
        return; // ignore Shift, arrows, etc.
      }
      e.preventDefault();
      const cp = e.key.codePointAt(0)!;
      const outcome = input.add(cp, performance.now());
      if (outcome.type === "complete") {
        finish(
          Result.fromStats(
            settings.layout,
            TEXT_TYPE[settings.lessonType] ?? "generated",
            Date.now(),
            outcome.stats,
          ),
        );
      } else {
        rerender();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [finish, nextLesson, rerender, settings.layout, settings.lessonType]);

  // Per-key heat for the on-screen keyboard, from the guided algorithm.
  const heat = useMemo(() => {
    const map = new Map<CodePoint, KeyHeat>();
    const target = new Target(settings.targetSpeed);
    const layoutResults = resultsForLayout(results, settings);
    const statsMap = makeKeyStatsMap([...keyboard.letters], layoutResults);
    const includedSet = new Set(
      lesson.lessonKeys?.findIncludedKeys().map((k) => k.codePoint) ?? [],
    );
    const focused = lesson.lessonKeys?.findFocusedKey()?.codePoint ?? null;
    for (const cp of keyboard.letters) {
      const confidence = target.confidence(statsMap.get(cp).timeToType);
      map.set(cp, {
        confidence: confidence != null ? Math.min(confidence, 1) : null,
        included: includedSet.has(cp),
        focused: focused === cp,
      });
    }
    return map;
  }, [results, settings, keyboard, lesson.lessonKeys]);

  const input = inputRef.current;
  const chars = input.chars();
  const nextKey = input.expected;

  return (
    <div className="practice">
      <LessonHud lastResult={lastResult} invalid={invalid} />

      <div className="lesson-text" role="textbox" aria-label="Lesson text">
        {chars.map((ch, i) => (
          <span
            key={i}
            className={
              ch.attr === Attr.Hit
                ? "ch-hit"
                : ch.attr === Attr.Miss
                  ? "ch-miss"
                  : i === input.position
                    ? "ch-cursor"
                    : "ch-todo"
            }
          >
            {String.fromCodePoint(ch.codePoint)}
          </span>
        ))}
      </div>

      <p className="hint faint">
        Just start typing. <kbd>Tab</kbd> skips the lesson · <kbd>Backspace</kbd>{" "}
        corrects.
      </p>

      <OnScreenKeyboard
        keyboard={keyboard}
        heat={heat}
        nextKey={nextKey}
        highlightNext={settings.highlightKey}
      />
    </div>
  );
}

