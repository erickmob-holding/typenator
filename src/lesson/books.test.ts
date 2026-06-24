import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, type Settings } from "@/settings";
import { BOOKS, bookById, bookWords, generateBooksText } from "./books.ts";

const booksSettings = (patch: Partial<Settings["books"]> = {}): Settings => ({
  ...DEFAULT_SETTINGS,
  lessonType: "books",
  books: { ...DEFAULT_SETTINGS.books, ...patch },
});

describe("books mode", () => {
  it("starts at the beginning of the selected book", () => {
    const settings = booksSettings({ book: "alice" });
    const { text } = generateBooksText(settings, 0);
    expect(text.startsWith("Alice was beginning")).toBe(true);
  });

  it("continues from a later position", () => {
    const settings = booksSettings({ book: "alice" });
    const first = generateBooksText(settings, 0);
    const second = generateBooksText(settings, first.consumedWords);
    expect(second.text).not.toBe(first.text);
    // The second chunk begins with the word right after the first chunk.
    const words = bookWords(bookById("alice"), settings);
    expect(second.text.split(" ")[0]).toBe(words[first.consumedWords]);
  });

  it("wraps around at the end of the book", () => {
    const settings = booksSettings({ book: "alice" });
    const words = bookWords(bookById("alice"), settings);
    const { text } = generateBooksText(settings, words.length); // == position 0
    expect(text.startsWith("Alice was beginning")).toBe(true);
  });

  it("applies letters-only and lowercase shaping", () => {
    const settings = booksSettings({ lettersOnly: true, lowercase: true });
    const { text } = generateBooksText(settings, 0);
    expect(text).toMatch(/^[a-z ]+$/);
  });

  it("ships several books", () => {
    expect(BOOKS.length).toBeGreaterThanOrEqual(3);
  });
});
