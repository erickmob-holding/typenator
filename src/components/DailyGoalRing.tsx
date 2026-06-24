/** A circular progress ring for the daily-goal widget. */
export function DailyGoalRing({ value, size = 132 }: { value: number; size?: number }) {
  const pct = Math.max(0, Math.min(1, value));
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const done = value >= 1;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="daily goal">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--bg-elev-2)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={done ? "var(--good)" : "var(--accent)"}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.4s" }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="26"
        fontWeight="700"
        fill="var(--text)"
      >
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}
