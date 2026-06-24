import { useMemo } from "react";
import { updateGuided, Target, LearningRate, computeDailyGoal } from "@/lesson";
import {
  findStreaks,
  makeKeyStatsMap,
  makeSummaryStats,
  SpeedUnit,
} from "@/result";
import { useProgress } from "@/app/ProgressContext.tsx";
import { resultsForLayout } from "@/lesson";
import { LineChart, type Point } from "./Charts.tsx";
import { DailyGoalRing } from "./DailyGoalRing.tsx";
import { polynomialRegression, Vector } from "@/math";
import "./Profile.css";

export function Profile() {
  const { settings, results, keyboard } = useProgress();
  const unit = SpeedUnit.fromId(settings.speedUnit);
  const layoutResults = useMemo(
    () => resultsForLayout(results, settings),
    [results, settings],
  );

  const summary = useMemo(() => makeSummaryStats(layoutResults), [layoutResults]);
  const streaks = useMemo(() => findStreaks(layoutResults), [layoutResults]);
  const dailyGoal = useMemo(
    () => computeDailyGoal(results, settings),
    [results, settings],
  );

  const statsMap = useMemo(
    () => makeKeyStatsMap([...keyboard.letters], layoutResults),
    [keyboard, layoutResults],
  );
  const target = useMemo(() => new Target(settings.targetSpeed), [settings.targetSpeed]);

  const lessonKeys = useMemo(
    () => updateGuided(statsMap, keyboard, settings),
    [statsMap, keyboard, settings],
  );

  // Learning curve: speed of each lesson, with a fitted regression trend.
  const { curve, trend } = useMemo(() => {
    const curve: Point[] = layoutResults.map((r, i) => ({
      x: i + 1,
      y: unit.measure(r.speed),
    }));
    let trend: Point[] = [];
    if (curve.length >= 5) {
      const vx = new Vector(curve.map((p) => p.x));
      const vy = new Vector(curve.map((p) => p.y));
      const degree = curve.length > 20 ? 3 : curve.length > 10 ? 2 : 1;
      const model = polynomialRegression(vx, vy, degree);
      trend = curve.map((p) => ({ x: p.x, y: model.eval(p.x) }));
    }
    return { curve, trend };
  }, [layoutResults, unit]);

  // Prediction from the focused (weakest) key's learning rate.
  const prediction = useMemo(() => {
    const focused = lessonKeys.findFocusedKey();
    if (!focused) {
      return null;
    }
    return LearningRate.from(focused.stats.samples, target);
  }, [lessonKeys, target]);

  const keyRows = useMemo(
    () =>
      [...lessonKeys.findIncludedKeys()]
        .map((k) => ({
          char: k.char,
          confidence: k.confidence,
          speed: k.timeToType != null ? unit.measure(60000 / k.timeToType) : null,
          focused: k.isFocused,
        }))
        .sort((a, b) => (a.confidence ?? 0) - (b.confidence ?? 0)),
    [lessonKeys, unit],
  );

  if (layoutResults.length === 0) {
    return (
      <div className="container profile">
        <h2>Your progress</h2>
        <p className="muted">
          No lessons yet. Head to <strong>Practice</strong> and type a little —
          your speed, accuracy and per-key stats will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="container profile">
      <h2>Your progress</h2>

      <div className="stat-grid">
        <Stat label={`top speed (${unit.suffix})`} value={Math.round(unit.measure(summary.speed.max))} />
        <Stat label={`avg speed (${unit.suffix})`} value={Math.round(unit.measure(summary.speed.avg))} />
        <Stat label="best accuracy" value={`${Math.round(summary.accuracy.max * 100)}%`} />
        <Stat label="lessons" value={summary.count} />
        <Stat label="time" value={formatDuration(summary.time)} />
        <Stat
          label="top score"
          value={Math.round(summary.score.max).toLocaleString()}
        />
      </div>

      <div className="profile-cols">
        <section className="card grow">
          <h3>Learning curve <span className="faint">— speed per lesson</span></h3>
          <LineChart data={curve} trend={trend} yLabel="speed" />
          {prediction && Number.isFinite(prediction.remainingLessons) && (
            <p className="muted predict">
              At your current rate you should reach{" "}
              <strong>{unit.measure(settings.targetSpeed).toFixed(0)} {unit.suffix}</strong>{" "}
              on your weakest key in about{" "}
              <strong>{prediction.remainingLessons}</strong> more lessons
              <span className="faint"> (R²={prediction.certainty.toFixed(2)})</span>.
            </p>
          )}
        </section>

        <section className="card daily">
          <h3>Today</h3>
          <DailyGoalRing value={dailyGoal.value} />
          <p className="muted center">
            {dailyGoal.minutes.toFixed(0)} / {dailyGoal.goal} min
          </p>
        </section>
      </div>

      <section className="card">
        <h3>Per-key speed <span className="faint">— sorted by confidence</span></h3>
        <div className="key-grid">
          {keyRows.map((row) => (
            <div
              key={row.char}
              className={`key-cell ${row.focused ? "focused" : ""}`}
              title={
                row.confidence != null
                  ? `${Math.round(row.confidence * 100)}% of target speed`
                  : "not practised"
              }
            >
              <span className="key-char">{row.char}</span>
              <span
                className="key-bar"
                style={{
                  width: `${Math.min(100, (row.confidence ?? 0) * 100)}%`,
                  background: heatColor(row.confidence),
                }}
              />
              <span className="key-speed">
                {row.speed != null ? Math.round(row.speed) : "—"}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>Accuracy streaks</h3>
        {streaks.length === 0 ? (
          <p className="muted">No streaks yet.</p>
        ) : (
          <ul className="streaks">
            {streaks.map((s) => (
              <li key={s.level}>
                <strong>{Math.round(s.level * 100)}%+</strong> accuracy ·{" "}
                longest run of <strong>{s.results.length}</strong> lessons
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

function heatColor(confidence: number | null): string {
  if (confidence == null) {
    return "var(--text-faint)";
  }
  const t = Math.max(0, Math.min(1, confidence));
  return `hsl(${t * 130}, 70%, 50%)`;
}

function formatDuration(ms: number): string {
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 60) {
    return `${totalMin}m`;
  }
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${m}m`;
}
