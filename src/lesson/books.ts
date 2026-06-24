import { type Settings } from "@/settings";
import { lessonLengthChars } from "./textgen.ts";

export type Book = {
  readonly id: string;
  readonly title: string;
  readonly author: string;
  readonly paragraphs: readonly string[];
};

// Public-domain excerpts (Project Gutenberg). Kept to a handful of paragraphs
// each — enough to type through for many lessons.
export const BOOKS: readonly Book[] = [
  {
    id: "alice",
    title: "Alice's Adventures in Wonderland",
    author: "Lewis Carroll",
    paragraphs: [
      "Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, and what is the use of a book, thought Alice, without pictures or conversations?",
      "So she was considering in her own mind, as well as she could, for the hot day made her feel very sleepy and stupid, whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.",
      "There was nothing so very remarkable in that; nor did Alice think it so very much out of the way to hear the Rabbit say to itself, Oh dear! Oh dear! I shall be late! But when the Rabbit actually took a watch out of its waistcoat-pocket, and looked at it, and then hurried on, Alice started to her feet.",
      "In another moment down went Alice after it, never once considering how in the world she was to get out again. The rabbit-hole went straight on like a tunnel for some way, and then dipped suddenly down, so suddenly that Alice had not a moment to think about stopping herself before she found herself falling down a very deep well.",
    ],
  },
  {
    id: "sherlock",
    title: "The Adventures of Sherlock Holmes",
    author: "Arthur Conan Doyle",
    paragraphs: [
      "To Sherlock Holmes she is always the woman. I have seldom heard him mention her under any other name. In his eyes she eclipses and predominates the whole of her sex. It was not that he felt any emotion akin to love for Irene Adler.",
      "All emotions, and that one particularly, were abhorrent to his cold, precise but admirably balanced mind. He was, I take it, the most perfect reasoning and observing machine that the world has seen, but as a lover he would have placed himself in a false position.",
      "I had seen little of Holmes lately. My marriage had drifted us away from each other. My own complete happiness, and the home-centred interests which rise up around the man who first finds himself master of his own establishment, were sufficient to absorb all my attention.",
      "One night it was the twentieth of March I was returning from a journey to a patient, when my way led me through Baker Street. As I passed the well-remembered door, I was seized with a keen desire to see Holmes again, and to know how he was employing his extraordinary powers.",
    ],
  },
  {
    id: "pride",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    paragraphs: [
      "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families.",
      "My dear Mr. Bennet, said his lady to him one day, have you heard that Netherfield Park is let at last? Mr. Bennet replied that he had not. But it is, returned she; for Mrs. Long has just been here, and she told me all about it.",
      "Mr. Bennet made no answer. Do you not want to know who has taken it? cried his wife impatiently. You want to tell me, and I have no objection to hearing it. This was invitation enough.",
      "Why, my dear, you must know, Mrs. Long says that Netherfield is taken by a young man of large fortune from the north of England; that he came down on Monday in a chaise and four to see the place, and was so much delighted with it that he agreed with Mr. Morris immediately.",
    ],
  },
];

export function bookById(id: string): Book {
  return BOOKS.find((b) => b.id === id) ?? BOOKS[0];
}

/** Builds the ordered word stream for a book, applying the text-shaping flags. */
export function bookWords(book: Book, settings: Settings): string[] {
  let text = book.paragraphs.join(" ");
  if (settings.books.lettersOnly) {
    text = text.replace(/[^\p{L}\s]/gu, "");
  }
  if (settings.books.lowercase) {
    text = text.toLowerCase();
  }
  return text.split(/\s+/).filter(Boolean);
}

export type BooksText = {
  readonly text: string;
  /** Number of words consumed, used to advance the saved position. */
  readonly consumedWords: number;
};

/**
 * Produces the next chunk of a book starting at `position`, wrapping around at
 * the end. Unlike guided mode, the words are taken in their original order so
 * you read the book as you type it.
 */
export function generateBooksText(settings: Settings, position: number): BooksText {
  const book = bookById(settings.books.book);
  const words = bookWords(book, settings);
  if (words.length === 0) {
    return { text: "", consumedWords: 0 };
  }
  const target = lessonLengthChars(settings);
  const start = ((position % words.length) + words.length) % words.length;
  const parts: string[] = [];
  let length = 0;
  let i = 0;
  while (length < target && i < words.length) {
    const word = words[(start + i) % words.length];
    parts.push(word);
    length += word.length + 1;
    i += 1;
  }
  return { text: parts.join(" "), consumedWords: i };
}
