import { SpeedUnit } from "@/result";
import { LAYOUTS } from "@/keyboard";
import { BOOKS, SYNTAXES } from "@/lesson";
import { type LessonType, type Settings as TSettings } from "@/settings";
import { useProgress } from "@/app/ProgressContext.tsx";
import "./Settings.css";

const LESSON_TYPES: { id: LessonType; label: string }[] = [
  { id: "guided", label: "Guided (adaptive)" },
  { id: "wordlist", label: "Common words" },
  { id: "books", label: "Books" },
  { id: "code", label: "Code" },
  { id: "custom", label: "Custom text" },
  { id: "numbers", label: "Numbers" },
];

export function Settings() {
  const { settings, updateSettings } = useProgress();
  const unit = SpeedUnit.fromId(settings.speedUnit);

  const set = <K extends keyof TSettings>(key: K, value: TSettings[K]) =>
    updateSettings({ [key]: value } as Partial<TSettings>);

  return (
    <div className="container settings">
      <h2>Settings</h2>

      <section className="card">
        <h3>Lesson</h3>
        <Field label="Type">
          <div className="seg">
            {LESSON_TYPES.map((t) => (
              <button
                key={t.id}
                className={`seg-btn ${settings.lessonType === t.id ? "active" : ""}`}
                onClick={() => set("lessonType", t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Keyboard layout">
          <select
            value={settings.layout}
            onChange={(e) => set("layout", e.target.value)}
          >
            {LAYOUTS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </Field>

        <Slider
          label="Lesson length"
          value={settings.lessonLength}
          min={0}
          max={1}
          step={0.1}
          format={(v) => (v < 0.34 ? "short" : v < 0.67 ? "medium" : "long")}
          onChange={(v) => set("lessonLength", v)}
        />
      </section>

      <section className="card">
        <h3>Goals</h3>
        <Slider
          label="Target speed"
          value={settings.targetSpeed}
          min={75}
          max={750}
          step={5}
          format={(v) => `${Math.round(unit.measure(v))} ${unit.suffix}`}
          onChange={(v) => set("targetSpeed", v)}
        />
        <Slider
          label="Daily goal"
          value={settings.dailyGoal}
          min={0}
          max={120}
          step={5}
          format={(v) => `${v} min`}
          onChange={(v) => set("dailyGoal", v)}
        />
      </section>

      {settings.lessonType === "guided" && (
        <section className="card">
          <h3>Guided mode</h3>
          <Toggle
            label="Mix in real words"
            hint="Blend dictionary words with the generated pseudo-words."
            value={settings.guided.naturalWords}
            onChange={(v) => set("guided", { ...settings.guided, naturalWords: v })}
          />
          <Toggle
            label="Keyboard-row order"
            hint="Introduce letters by keyboard position instead of by frequency."
            value={settings.guided.keyboardOrder}
            onChange={(v) => set("guided", { ...settings.guided, keyboardOrder: v })}
          />
          <Toggle
            label="Recover keys"
            hint="Require current (not just best) speed at target before adding letters."
            value={settings.guided.recoverKeys}
            onChange={(v) => set("guided", { ...settings.guided, recoverKeys: v })}
          />
          <Slider
            label="Alphabet size"
            value={settings.guided.alphabetSize}
            min={0}
            max={1}
            step={0.05}
            format={(v) => `${Math.round(v * 100)}%`}
            onChange={(v) => set("guided", { ...settings.guided, alphabetSize: v })}
          />
        </section>
      )}

      {settings.lessonType === "books" && (
        <section className="card">
          <h3>Books</h3>
          <Field label="Book">
            <select
              value={settings.books.book}
              onChange={(e) =>
                set("books", {
                  ...settings.books,
                  book: e.target.value,
                  position: 0,
                })
              }
            >
              {BOOKS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} — {b.author}
                </option>
              ))}
            </select>
          </Field>
          <Toggle
            label="Letters only"
            hint="Strip punctuation and numbers from the text."
            value={settings.books.lettersOnly}
            onChange={(v) =>
              set("books", { ...settings.books, lettersOnly: v, position: 0 })
            }
          />
          <Toggle
            label="Lowercase"
            value={settings.books.lowercase}
            onChange={(v) =>
              set("books", { ...settings.books, lowercase: v, position: 0 })
            }
          />
          <div className="field">
            <button
              className="btn"
              onClick={() => set("books", { ...settings.books, position: 0 })}
            >
              Restart from the beginning
            </button>
          </div>
        </section>
      )}

      {settings.lessonType === "code" && (
        <section className="card">
          <h3>Code</h3>
          <Field label="Syntax">
            <div className="seg">
              {SYNTAXES.map((s) => (
                <button
                  key={s.id}
                  className={`seg-btn ${settings.code.syntax === s.id ? "active" : ""}`}
                  onClick={() => set("code", { syntax: s.id })}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </Field>
        </section>
      )}

      {settings.lessonType === "custom" && (
        <section className="card">
          <h3>Custom text</h3>
          <Field label="Your text">
            <textarea
              rows={4}
              value={settings.customText.content}
              onChange={(e) =>
                set("customText", { ...settings.customText, content: e.target.value })
              }
            />
          </Field>
          <Toggle
            label="Letters only"
            value={settings.customText.lettersOnly}
            onChange={(v) => set("customText", { ...settings.customText, lettersOnly: v })}
          />
          <Toggle
            label="Lowercase"
            value={settings.customText.lowercase}
            onChange={(v) => set("customText", { ...settings.customText, lowercase: v })}
          />
          <Toggle
            label="Randomize word order"
            value={settings.customText.randomize}
            onChange={(v) => set("customText", { ...settings.customText, randomize: v })}
          />
        </section>
      )}

      {settings.lessonType === "numbers" && (
        <section className="card">
          <h3>Numbers</h3>
          <Toggle
            label="Benford distribution"
            hint="Bias leading digits toward smaller values, like real-world data."
            value={settings.numbers.benford}
            onChange={(v) => set("numbers", { ...settings.numbers, benford: v })}
          />
        </section>
      )}

      <section className="card">
        <h3>Text shaping</h3>
        <Slider
          label="Capital letters"
          value={settings.capitals}
          min={0}
          max={1}
          step={0.05}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => set("capitals", v)}
        />
        <Slider
          label="Punctuation"
          value={settings.punctuators}
          min={0}
          max={1}
          step={0.05}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => set("punctuators", v)}
        />
        <Slider
          label="Repeat each word"
          value={settings.repeatWords}
          min={1}
          max={10}
          step={1}
          format={(v) => `${v}×`}
          onChange={(v) => set("repeatWords", v)}
        />
      </section>

      <section className="card">
        <h3>Display</h3>
        <Field label="Speed unit">
          <div className="seg">
            {SpeedUnit.ALL.map((u) => (
              <button
                key={u.id}
                className={`seg-btn ${settings.speedUnit === u.id ? "active" : ""}`}
                onClick={() => set("speedUnit", u.id)}
              >
                {u.suffix.toUpperCase()}
              </button>
            ))}
          </div>
        </Field>
        <Toggle
          label="Dark theme"
          value={settings.theme === "dark"}
          onChange={(v) => set("theme", v ? "dark" : "light")}
        />
        <Toggle
          label="Highlight next key"
          value={settings.highlightKey}
          onChange={(v) => set("highlightKey", v)}
        />
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="field">
      <label>
        {label} <span className="field-val">{format(value)}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function Toggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="toggle" onClick={() => onChange(!value)}>
      <div>
        <div className="toggle-label">{label}</div>
        {hint && <div className="toggle-hint faint">{hint}</div>}
      </div>
      <span className={`switch ${value ? "on" : ""}`} role="switch" aria-checked={value}>
        <span className="knob" />
      </span>
    </div>
  );
}
