import { type Finger, type Hand, type Keyboard, type KeyDef } from "@/keyboard";
import { type CodePoint } from "@/textinput";
import "./Keyboard.css";

export type KeyHeat = {
  /** Confidence 0..1+ for coloring; null = no data. */
  readonly confidence: number | null;
  readonly included: boolean;
  readonly focused: boolean;
};

/** Finger → colour group. Left and right hands mirror each other so a colour
 * always means the same finger, the way keybr teaches the zones. */
const FINGER_GROUP: Record<Finger, string> = {
  lPinky: "pinky",
  rPinky: "pinky",
  lRing: "ring",
  rRing: "ring",
  lMiddle: "middle",
  rMiddle: "middle",
  lIndex: "index",
  rIndex: "index",
  thumb: "thumb",
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
  return (
    <div className="kbd" aria-hidden>
      <div className="kbd-split">
        <Half
          keyboard={keyboard}
          hand="left"
          heat={heat}
          nextKey={nextKey}
          highlightNext={highlightNext}
        />
        <Half
          keyboard={keyboard}
          hand="right"
          heat={heat}
          nextKey={nextKey}
          highlightNext={highlightNext}
        />
      </div>
      <div className="kbd-thumbs">
        <span className="kbd-key kbd-space fg-thumb">space</span>
      </div>
    </div>
  );
}

function Half({
  keyboard,
  hand,
  heat,
  nextKey,
  highlightNext,
}: {
  keyboard: Keyboard;
  hand: Hand;
  heat: Map<CodePoint, KeyHeat>;
  nextKey: CodePoint | null;
  highlightNext: boolean;
}) {
  const cols = new Map<number, KeyDef[]>();
  for (const key of keyboard.keys) {
    if (key.hand !== hand) continue;
    const list = cols.get(key.col) ?? [];
    list.push(key);
    cols.set(key.col, list);
  }

  return (
    <div className={`kbd-hand kbd-hand-${hand}`}>
      {[...cols.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([col, keys]) => {
          const finger = keys[0].finger;
          const group = FINGER_GROUP[finger];
          // The inner reach columns (T/G/B, Y/H/N) sit lower than the rest.
          const inner =
            (hand === "left" && col === 4) || (hand === "right" && col === 0);
          const stagger = inner ? "index-inner" : group;
          return (
            <div
              className="kbd-col"
              key={col}
              data-stagger={stagger}
            >
              {keys
                .slice()
                .sort((a, b) => a.row - b.row)
                .map((key) => {
                  const h = heat.get(key.codePoint);
                  const isNext = highlightNext && nextKey === key.codePoint;
                  return (
                    <span
                      key={key.codePoint}
                      className={[
                        "kbd-key",
                        `fg-${group}`,
                        h?.included ? "is-included" : "",
                        h?.focused ? "is-focused" : "",
                        isNext ? "is-next" : "",
                        key.home ? "is-home" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      style={
                        h?.confidence != null
                          ? { borderBottomColor: heatColor(h.confidence) }
                          : undefined
                      }
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
          );
        })}
    </div>
  );
}

/** Maps confidence (0 = slow, 1 = at target) to a red→green gradient. */
function heatColor(confidence: number): string {
  const t = Math.max(0, Math.min(1, confidence));
  const hue = t * 130; // 0 = red, 130 = green
  return `hsl(${hue}, 70%, 50%)`;
}
