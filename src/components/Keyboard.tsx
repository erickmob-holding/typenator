import { type Keyboard } from "@/keyboard";
import { type CodePoint } from "@/textinput";
import "./Keyboard.css";

export type KeyHeat = {
  /** Confidence 0..1+ for coloring; null = no data. */
  readonly confidence: number | null;
  readonly included: boolean;
  readonly focused: boolean;
};

export function OnScreenKeyboard({
  keyboard,
  heat,
  nextKey,
  highlightNext,
}: {
  keyboard: Keyboard;
  heat: Map<CodePoint, KeyHeat>;
  nextKey: CodePoint | null;
  highlightNext: boolean;
}) {
  const rows = new Map<number, (typeof keyboard.keys)[number][]>();
  for (const key of keyboard.keys) {
    const list = rows.get(key.row) ?? [];
    list.push(key);
    rows.set(key.row, list);
  }

  return (
    <div className="kbd" aria-hidden>
      {[...rows.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([row, keys]) => (
          <div className="kbd-row" key={row}>
            {keys.map((key) => {
              const h = heat.get(key.codePoint);
              const isNext =
                highlightNext && nextKey === key.codePoint;
              return (
                <span
                  key={key.codePoint}
                  className={[
                    "kbd-key",
                    h?.included ? "is-included" : "",
                    h?.focused ? "is-focused" : "",
                    isNext ? "is-next" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{
                    marginLeft: `${(key.offset % 1) * 2.6}rem`,
                    ...(h?.confidence != null
                      ? { borderBottomColor: heatColor(h.confidence) }
                      : null),
                  }}
                  title={`${key.char} — ${
                    h?.confidence != null
                      ? `${Math.round(h.confidence * 100)}% of target`
                      : "not practised"
                  }`}
                >
                  {key.char}
                </span>
              );
            })}
          </div>
        ))}
      <div className="kbd-row">
        <span className="kbd-key kbd-space">space</span>
      </div>
    </div>
  );
}

/** Maps confidence (0 = slow, 1 = at target) to a red→green gradient. */
function heatColor(confidence: number): string {
  const t = Math.max(0, Math.min(1, confidence));
  const hue = t * 130; // 0 = red, 130 = green
  return `hsl(${hue}, 70%, 50%)`;
}
