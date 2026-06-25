import { Histogram, type Sample } from "@/textinput";
import { Result, type TextType } from "./result.ts";

/**
 * keybr's "Export data" produces a JSON array whose entries are nearly identical
 * to our own Result shape — the only differences are the layout id and an ISO
 * timestamp. This parses that export into native Results so a full keybr history
 * can be imported with all per-key stats intact.
 *
 * keybr entry:
 *   { layout: "en-us", textType: "generated", timeStamp: "2026-06-10T22:35:26.000Z",
 *     length, time, errors, speed, histogram: [{codePoint, hitCount, missCount, timeToType}] }
 */

// Maps keybr layout ids to ours. Unknown layouts are kept as-is (they simply
// won't display until that layout is added).
const LAYOUT_MAP: Record<string, string> = {
  "en-us": "us",
};

const TEXT_TYPES: readonly TextType[] = [
  "generated",
  "natural",
  "code",
  "numbers",
];

export type ImportSummary = {
  readonly results: Result[];
  /** Valid results ready to import. */
  readonly imported: number;
  /** Entries that were malformed or failed validation. */
  readonly skipped: number;
  /** Set when the file could not be parsed at all. */
  readonly error?: string;
};

export function parseKeybrExport(text: string): ImportSummary {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { results: [], imported: 0, skipped: 0, error: "This is not a valid JSON file." };
  }
  if (!Array.isArray(data)) {
    return {
      results: [],
      imported: 0,
      skipped: 0,
      error: "Expected a keybr data export — a JSON array of lessons.",
    };
  }

  const results: Result[] = [];
  let skipped = 0;
  for (const entry of data) {
    const result = convert(entry);
    if (result && result.validate()) {
      results.push(result);
    } else {
      skipped += 1;
    }
  }
  results.sort((a, b) => a.timeStamp - b.timeStamp);
  return { results, imported: results.length, skipped };
}

function convert(entry: unknown): Result | null {
  if (typeof entry !== "object" || entry == null) {
    return null;
  }
  const e = entry as Record<string, unknown>;

  const timeStamp =
    typeof e.timeStamp === "string"
      ? Date.parse(e.timeStamp)
      : Number(e.timeStamp);
  if (!Number.isFinite(timeStamp)) {
    return null;
  }

  const rawLayout = typeof e.layout === "string" ? e.layout : "us";
  const layout = LAYOUT_MAP[rawLayout] ?? rawLayout;
  const textType: TextType = TEXT_TYPES.includes(e.textType as TextType)
    ? (e.textType as TextType)
    : "generated";

  if (!Array.isArray(e.histogram)) {
    return null;
  }
  const samples: Sample[] = [];
  for (const s of e.histogram) {
    if (s && typeof s === "object" && Number.isFinite((s as Sample).codePoint)) {
      const sample = s as Record<string, number>;
      samples.push({
        codePoint: sample.codePoint,
        hitCount: int(sample.hitCount),
        missCount: int(sample.missCount),
        timeToType: int(sample.timeToType),
      });
    }
  }

  try {
    return new Result(
      layout,
      textType,
      timeStamp,
      int(e.length),
      int(e.time),
      int(e.errors),
      new Histogram(samples),
    );
  } catch {
    return null;
  }
}

function int(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}
