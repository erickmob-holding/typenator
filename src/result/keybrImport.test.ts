import { describe, expect, it } from "vitest";
import { parseKeybrExport } from "./keybrImport.ts";

const sampleEntry = (overrides = {}) => ({
  layout: "en-us",
  textType: "generated",
  timeStamp: "2026-06-10T22:35:26.000Z",
  length: 125,
  time: 65022,
  errors: 13,
  speed: 115.3,
  histogram: [
    { codePoint: 97, hitCount: 18, missCount: 4, timeToType: 302 },
    { codePoint: 101, hitCount: 27, missCount: 3, timeToType: 298 },
    { codePoint: 110, hitCount: 19, missCount: 1, timeToType: 301 },
    { codePoint: 114, hitCount: 17, missCount: 0, timeToType: 393 },
  ],
  ...overrides,
});

describe("parseKeybrExport", () => {
  it("converts keybr entries into native Results", () => {
    const summary = parseKeybrExport(JSON.stringify([sampleEntry()]));
    expect(summary.error).toBeUndefined();
    expect(summary.imported).toBe(1);
    const r = summary.results[0];
    expect(r.layout).toBe("us"); // en-us mapped
    expect(r.textType).toBe("generated");
    expect(r.timeStamp).toBe(Date.parse("2026-06-10T22:35:26.000Z")); // ISO -> epoch
    expect(r.length).toBe(125);
    expect(r.errors).toBe(13);
    expect(r.complexity).toBe(4);
    // speed is recomputed, not taken from the file
    expect(r.speed).toBeCloseTo((125 / (65022 / 1000)) * 60, 3);
  });

  it("rejects non-array and invalid JSON", () => {
    expect(parseKeybrExport("not json").error).toBeTruthy();
    expect(parseKeybrExport('{"a":1}').error).toBeTruthy();
  });

  it("skips entries that fail validation but keeps the good ones", () => {
    const tooShort = sampleEntry({ length: 2, time: 100, histogram: [] });
    const summary = parseKeybrExport(JSON.stringify([sampleEntry(), tooShort]));
    expect(summary.imported).toBe(1);
    expect(summary.skipped).toBe(1);
  });

  it("sorts imported results by time", () => {
    const a = sampleEntry({ timeStamp: "2026-06-15T10:00:00.000Z" });
    const b = sampleEntry({ timeStamp: "2026-06-10T10:00:00.000Z" });
    const summary = parseKeybrExport(JSON.stringify([a, b]));
    expect(summary.results[0].timeStamp).toBeLessThan(summary.results[1].timeStamp);
  });
});
