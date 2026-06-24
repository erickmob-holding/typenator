import { describe, expect, it } from "vitest";
import { makeRNG } from "@/phonetic";
import { DEFAULT_SETTINGS, type Settings } from "@/settings";
import { generateCodeText, SYNTAXES, syntaxById } from "./code.ts";

const codeSettings = (syntax: string): Settings => ({
  ...DEFAULT_SETTINGS,
  lessonType: "code",
  code: { syntax },
});

describe("code mode", () => {
  it("offers several syntaxes", () => {
    expect(SYNTAXES.map((s) => s.id)).toContain("javascript");
    expect(SYNTAXES.map((s) => s.id)).toContain("python");
  });

  it("generates non-empty, single-line snippets for each syntax", () => {
    for (const syntax of SYNTAXES) {
      const text = generateCodeText(codeSettings(syntax.id), makeRNG(1));
      expect(text.length).toBeGreaterThan(20);
      expect(text).not.toContain("\n"); // typeable without Enter
    }
  });

  it("is deterministic for a given seed", () => {
    const a = generateCodeText(codeSettings("javascript"), makeRNG(5));
    const b = generateCodeText(codeSettings("javascript"), makeRNG(5));
    expect(a).toBe(b);
  });

  it("falls back to the first syntax for an unknown id", () => {
    expect(syntaxById("nope")).toBe(SYNTAXES[0]);
  });
});
