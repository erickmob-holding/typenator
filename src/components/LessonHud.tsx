import { useMemo, useState } from "react";
import {
  computeDailyGoal,
  LearningRate,
  resultsForLayout,
  Target,
  updateGuided,
} from "@/lesson";
import {
  findStreaks,
  type KeyStats,
  makeKeyStatsMap,
  makeSummaryStats,
  type Result,
  SpeedUnit,
  timeToSpeed,
} from "@/result";
import { type CodePoint } from "@/textinput";
import { useProgress } from "@/app/ProgressContext.tsx";
import { LineChart, type Point } from "./Charts.tsx";
import "./LessonHud.css";

type KeyView = {
  readonly codePoint: CodePoint;
  readonly char: string;
  readonly confidence: number | null;
  readonly included: boolean;
  readonly focused: boolean;
  readonly hasData: boolean;
};

/**
 * The keybr-style lesson HUD shown above the typing area: the current metrics
 * with deltas, the "All keys" indicator strip (per-key confidence colour + lock
 * state, with a hover popover of per-key stats), the focused key, accuracy
 * streaks, and the daily-goal bar.
 */
export function LessonHud({
  lastResult,
  invalid,
}: {
  lastResult: Result | null;
  invalid: boolean;
}) {
  const { settings, results, keyboard } = useProgress();
  const unit = SpeedUnit.fromId(settings.speedUnit);
  const guided = settings.lessonType === "guided";

  const layoutResults = useMemo(
    () => resultsForLayout(results, settings),
    [results, settings],
  );
  const summary = useMemo(() => makeSummaryStats(layoutResults), [layoutResults]);
  const target = useMemo(
    () => new Target(settings.targetSpeed),
    [settings.targetSpeed],
  );
  const statsMap = useMemo(
    () => makeKeyStatsMap([...keyboard.letters], layoutResults),
    [keyboard, layoutResults],
  );
  const lessonKeys = useMemo(
    () => updateGuided(statsMap, keyboard, settings),
    [statsMap, keyboard, settings],
  );
  const streaks = useMemo(() => findStreaks(layoutResults), [layoutResults]);
  const dailyGoal = useMemo(
    () => computeDailyGoal(results, settings),
    [results, settings],
  );

  // One view per letter, in alphabetical order for the strip.
  const keys = useMemo<KeyView[]>(() => {
    const included = new Set(
      lessonKeys.findIncludedKeys().map((k) => k.codePoint),
    );
    const focused = lessonKeys.findFocusedKey()?.codePoint ?? null;
    return [...keyboard.letters]
      .map((cp) => {
        const stats = statsMap.get(cp);
        return {
          codePoint: cp,
          char: String.fromCodePoint(cp).toUpperCase(),
          confidence: target.confidence(stats.timeToType),
          included: guided ? included.has(cp) : true,
          focused: guided ? focused === cp : false,
          hasData: stats.timeToType != null,
        };
      })
      .sort((a, b) => a.char.localeCompare(b.char));
  }, [keyboard, statsMap, lessonKeys, target, guided]);

  const [active, setActive] = useState<CodePoint | null>(null);
  const activeIndex = keys.findIndex((k) => k.codePoint === active);
  const focusedKey = keys.find((k) => k.focused) ?? null;

  return (
    <div className="hud">
      <div className="hud-row">
        <span className="hud-label">Metrics:</span>
        <Metric
          name="Speed"
          value={summary.count ? `${unit.measure(summary.speed.last).toFixed(1)}${unit.suffix}` : null}
          delta={summary.count > 1 ? `${signed(unit.measure(summary.speed.delta), 1)}${unit.suffix}` : null}
          up={summary.speed.delta >= 0}
        />
        <Metric
          name="Accuracy"
          value={summary.count ? `${(summary.accuracy.last * 100).toFixed(2)}%` : null}
          delta={summary.count > 1 ? `${signed(summary.accuracy.delta * 100, 2)}%` : null}
          up={summary.accuracy.delta >= 0}
        />
        <Metric
          name="Score"
          value={summary.count ? `${Math.round(summary.score.last)}` : null}
          delta={summary.count > 1 ? `${signed(summary.score.delta, 0)}` : null}
          up={summary.score.delta >= 0}
        />
      </div>

      <div className="hud-row">
        <span className="hud-label">All keys:</span>
        <div className="keystrip" onMouseLeave={() => setActive(null)}>
          {keys.map((k) => (
            <button
              key={k.codePoint}
              className={keyClass(k)}
              style={
                k.included && k.hasData
                  ? { backgroundColor: heatColor(k.confidence) }
                  : undefined
              }
              onMouseEnter={() => setActive(k.codePoint)}
              onFocus={() => setActive(k.codePoint)}
              title={`${k.char}${k.confidence != null ? ` — ${Math.round(k.confidence * 100)}% of target` : ""}`}
            >
              {k.char}
            </button>
          ))}
        </div>
      </div>

      {active != null && activeIndex >= 0 && (
        <KeyPopover
          view={keys[activeIndex]}
          stats={statsMap.get(active)}
          target={target}
          unit={unit}
          arrowLeft={`calc((100% - 0px) * ${(activeIndex + 0.5) / keys.length})`}
        />
      )}

      <div className="hud-row">
        <span className="hud-label">Current key:</span>
        <span className="hud-value">
          {focusedKey ? (
            <>
              <strong>{focusedKey.char}</strong>
              {focusedKey.confidence != null && (
                <span className="faint">
                  {" "}
                  — {Math.round(focusedKey.confidence * 100)}% of target speed
                </span>
              )}
            </>
          ) : guided ? (
            "All keys are unlocked."
          ) : (
            "All keys are in play."
          )}
        </span>
      </div>

      <div className="hud-row">
        <span className="hud-label">Accuracy:</span>
        <span className="hud-value">
          {streaks.length === 0 ? (
            <span className="faint">No accuracy streaks.</span>
          ) : (
            streaks.map((s, i) => (
              <span key={s.level} className="streak">
                {i > 0 && <span className="faint"> · </span>}
                {Math.round(s.level * 100)}%:{" "}
                <strong>{s.results.length}</strong>
              </span>
            ))
          )}
        </span>
      </div>

      <div className="hud-row">
        <span className="hud-label">Daily goal:</span>
        <span className="hud-value daily">
          <span className="daily-text">
            {Math.round(Math.min(1, dailyGoal.value) * 100)}%/{dailyGoal.goal} minutes
          </span>
          <span className="daily-bar">
            <span
              className="daily-fill"
              style={{ width: `${Math.min(100, dailyGoal.value * 100)}%` }}
            />
          </span>
          {invalid && (
            <span className="faint"> · last lesson too short to count</span>
          )}
          {lastResult && !invalid && <span className="faint"> · saved</span>}
        </span>
      </div>
    </div>
  );
}

function KeyPopover({
  view,
  stats,
  target,
  unit,
  arrowLeft,
}: {
  view: KeyView;
  stats: KeyStats;
  target: Target;
  unit: SpeedUnit;
  arrowLeft: string;
}) {
  const lastSample = stats.samples.at(-1) ?? null;
  const lastSpeed = lastSample ? timeToSpeed(lastSample.filteredTimeToType) : null;
  const topSpeed = stats.bestTimeToType != null ? timeToSpeed(stats.bestTimeToType) : null;
  const lastConf = target.confidence(stats.timeToType);
  const bestConf = target.confidence(stats.bestTimeToType);
  const lr = LearningRate.from(stats.samples, target);

  const curve: Point[] = stats.samples.map((s) => ({
    x: s.index + 1,
    y: unit.measure(timeToSpeed(s.filteredTimeToType)),
  }));
  const trend: Point[] =
    lr && Number.isFinite(lr.certainty)
      ? curve.map((p) => ({ x: p.x, y: unit.measure(lr.mSpeed.eval(p.x)) }))
      : [];

  const rate = lr ? unit.measure(lr.learningRate) : NaN;
  const rateEmoji = !Number.isFinite(rate) ? "" : rate > 0.05 ? " 🙂" : rate < -0.05 ? " 🙁" : " 😐";

  return (
    <div className="key-popover card">
      <span className="key-popover-arrow" style={{ left: arrowLeft }} />
      <div className="key-popover-head">
        <span
          className="key-badge"
          style={{ backgroundColor: view.hasData ? heatColor(view.confidence) : "var(--key-bg)" }}
        >
          {view.char}
        </span>
        <span>
          <span className="faint">Last speed:</span>{" "}
          <strong>{lastSpeed != null ? `${unit.measure(lastSpeed).toFixed(1)}${unit.suffix}` : "—"}</strong>
          {lastConf != null && <span className="faint"> ({Math.round(lastConf * 100)}%)</span>}
        </span>
        <span>
          <span className="faint">Top speed:</span>{" "}
          <strong>{topSpeed != null ? `${unit.measure(topSpeed).toFixed(1)}${unit.suffix}` : "—"}</strong>
          {bestConf != null && <span className="faint"> ({Math.round(bestConf * 100)}%)</span>}
        </span>
        <span>
          <span className="faint">Learning rate:</span>{" "}
          <strong className={Number.isFinite(rate) ? (rate >= 0 ? "good" : "bad") : ""}>
            {Number.isFinite(rate) ? `${signed(rate, 1)}${unit.suffix}/lesson` : "—"}
          </strong>
          {rateEmoji}
        </span>
      </div>

      <p className="key-popover-note faint">
        {lr && Number.isFinite(lr.remainingLessons)
          ? `About ${lr.remainingLessons} more lessons to reach the target on this key.`
          : "Need more data to compute the remaining lessons to unlock this letter."}
      </p>

      {curve.length >= 2 && (
        <LineChart data={curve} trend={trend} height={140} yLabel="speed" />
      )}
    </div>
  );
}

function Metric({
  name,
  value,
  delta,
  up,
}: {
  name: string;
  value: string | null;
  delta: string | null;
  up: boolean;
}) {
  return (
    <span className="metric">
      <span className="faint">{name}:</span>{" "}
      <span className="metric-value">{value ?? "—"}</span>
      {delta && (
        <span className={`metric-delta ${up ? "good" : "bad"}`}>
          {" "}
          ({up ? "↑" : "↓"}
          {delta})
        </span>
      )}
    </span>
  );
}

function keyClass(k: KeyView): string {
  const cls = ["key"];
  if (!k.included) {
    cls.push("locked");
  } else if (!k.hasData) {
    cls.push("nodata");
  }
  if (k.focused) {
    cls.push("focused");
  }
  return cls.join(" ");
}

/** Maps confidence (0 = slow .. 1 = at target) to a red→green colour. */
function heatColor(confidence: number | null): string {
  if (confidence == null) {
    return "var(--key-bg)";
  }
  const t = Math.max(0, Math.min(1, confidence));
  return `hsl(${t * 130}, 60%, 42%)`;
}

function signed(value: number, digits: number): string {
  const v = value.toFixed(digits);
  return value >= 0 ? `+${v}` : v;
}
