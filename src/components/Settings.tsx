import { useRef, useState } from "react";
import { parseKeybrExport, type Result, SpeedUnit } from "@/result";
import { LAYOUTS } from "@/keyboard";
import { BOOKS, SYNTAXES } from "@/lesson";
import {
  type GuidedWordMode,
  type LessonType,
  type Settings as TSettings,
} from "@/settings";
import { useProgress } from "@/app/ProgressContext.tsx";
import "./Settings.css";

const WORD_MODES: { id: GuidedWordMode; label: string }[] = [
  { id: "real", label: "Real words only" },
  { id: "mixed", label: "Real + pseudo" },
];

const LESSON_TYPES: { id: LessonType; label: string }[] = [
  { id: "guided", label: "Guided (adaptive)" },
  { id: "wordlist", label: "Common words" },
  { id: "books", label: "Books" },
  { id: "code", label: "Code" },
  { id: "custom", label: "Custom text" },
  { id: "numbers", label: "Numbers" },
];

export function Settings() {
  const { settings, updateSettings, results, importResults, resetResults } =
    useProgress();
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
          <Field
            label="Words"
            hint="Real words only, or real words blended with generated pseudo-words."
          >
            <div className="seg">
              {WORD_MODES.map((m) => (
                <button
                  key={m.id}
                  className={`seg-btn ${settings.guided.wordMode === m.id ? "active" : ""}`}
                  onClick={() => set("guided", { ...settings.guided, wordMode: m.id })}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </Field>
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

      <DataCard
        results={results}
        importResults={importResults}
        resetResults={resetResults}
      />
    </div>
  );
}

function DataCard({
  results,
  importResults,
  resetResults,
}: {
  results: readonly Result[];
  importResults: (r: readonly Result[]) => Promise<number>;
  resetResults: () => Promise<void>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function onReset() {
    setResetting(true);
    setStatus(null);
    try {
      await resetResults();
      setStatus({ ok: true, text: "Progress reset. Your settings were kept." });
    } catch {
      setStatus({ ok: false, text: "Could not reset your progress." });
    } finally {
      setResetting(false);
      setConfirming(false);
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-importing the same file
    if (!file) {
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const text = await file.text();
      const summary = parseKeybrExport(text);
      if (summary.error) {
        setStatus({ ok: false, text: summary.error });
        return;
      }
      const added = await importResults(summary.results);
      const skippedNote = summary.skipped ? `, ${summary.skipped} skipped` : "";
      const dupNote =
        added < summary.imported
          ? ` (${summary.imported - added} already imported)`
          : "";
      setStatus({
        ok: true,
        text: `Imported ${added} of ${summary.imported} lessons${dupNote}${skippedNote}. Your stats are updated.`,
      });
    } catch {
      setStatus({ ok: false, text: "Could not read that file." });
    } finally {
      setBusy(false);
    }
  }

  function onExport() {
    const json = JSON.stringify(
      results.map((r) => r.toJSON()),
      null,
      0,
    );
    const url = URL.createObjectURL(
      new Blob([json], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "typenator-data.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="card">
      <h3>Data</h3>
      <p className="muted data-hint">
        Import your progress from keybr. On keybr, open your account and choose
        “Export data” to download a JSON file, then load it here — your full
        per-key history is reconstructed.
      </p>
      <div className="data-actions">
        <button
          className="btn btn-primary"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          {busy ? "Importing…" : "Import from keybr (JSON)"}
        </button>
        <button className="btn" onClick={onExport} disabled={results.length === 0}>
          Export my data
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={onFile}
        />
      </div>

      <div className="data-reset">
        {confirming ? (
          <div className="data-confirm">
            <span className="muted">
              Delete all {results.length} lessons? This can't be undone.
            </span>
            <button className="btn btn-danger" disabled={resetting} onClick={onReset}>
              {resetting ? "Resetting…" : "Yes, reset progress"}
            </button>
            <button
              className="btn"
              disabled={resetting}
              onClick={() => setConfirming(false)}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            className="btn btn-danger-ghost"
            disabled={results.length === 0}
            onClick={() => setConfirming(true)}
          >
            Reset my progress
          </button>
        )}
      </div>

      {status && (
        <p className={`data-status ${status.ok ? "ok" : "err"}`}>{status.text}</p>
      )}
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {hint && <div className="field-hint faint">{hint}</div>}
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
