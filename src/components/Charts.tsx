import "./Charts.css";

export type Point = { x: number; y: number };

/** A lightweight SVG line chart with an optional fitted trend line. */
export function LineChart({
  data,
  trend,
  width = 720,
  height = 220,
  yLabel,
  color = "var(--accent)",
}: {
  data: Point[];
  trend?: Point[];
  width?: number;
  height?: number;
  yLabel?: string;
  color?: string;
}) {
  if (data.length === 0) {
    return <div className="chart-empty muted">No data yet — type a few lessons.</div>;
  }
  const pad = { top: 14, right: 14, bottom: 22, left: 40 };
  const xs = data.map((p) => p.x);
  const all = [...data, ...(trend ?? [])];
  const ys = all.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;

  const sx = (x: number) =>
    pad.left + ((x - minX) / spanX) * (width - pad.left - pad.right);
  const sy = (y: number) =>
    height - pad.bottom - ((y - minY) / spanY) * (height - pad.top - pad.bottom);

  const path = (pts: Point[]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"}${sx(p.x)},${sy(p.y)}`).join(" ");

  const ticks = 4;
  const gridY = Array.from({ length: ticks + 1 }, (_, i) => minY + (spanY * i) / ticks);

  return (
    <svg
      className="chart"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={yLabel ?? "chart"}
    >
      {gridY.map((gy, i) => (
        <g key={i}>
          <line
            x1={pad.left}
            x2={width - pad.right}
            y1={sy(gy)}
            y2={sy(gy)}
            className="chart-grid"
          />
          <text x={4} y={sy(gy) + 4} className="chart-axis">
            {Math.round(gy)}
          </text>
        </g>
      ))}
      <path d={path(data)} className="chart-line" style={{ stroke: color }} />
      {data.map((p, i) => (
        <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={2.4} style={{ fill: color }} />
      ))}
      {trend && trend.length > 1 && (
        <path d={path(trend)} className="chart-trend" />
      )}
    </svg>
  );
}
