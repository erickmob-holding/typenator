import { type Finger, type KeyDef, type Layout } from "../keyboard.ts";

type Spec = [char: string, finger: Finger, home?: boolean];

// Each row lists keys left-to-right; offset is the cumulative key-unit position
// including the standard staggered row indents.
const rows: { indent: number; keys: Spec[] }[] = [
  {
    indent: 0,
    keys: [
      ["q", "lPinky"],
      ["w", "lRing"],
      ["e", "lMiddle"],
      ["r", "lIndex"],
      ["t", "lIndex"],
      ["y", "rIndex"],
      ["u", "rIndex"],
      ["i", "rMiddle"],
      ["o", "rRing"],
      ["p", "rPinky"],
    ],
  },
  {
    indent: 0.25,
    keys: [
      ["a", "lPinky", true],
      ["s", "lRing", true],
      ["d", "lMiddle", true],
      ["f", "lIndex", true],
      ["g", "lIndex"],
      ["h", "rIndex"],
      ["j", "rIndex", true],
      ["k", "rMiddle", true],
      ["l", "rRing", true],
      [";", "rPinky", true],
    ],
  },
  {
    indent: 0.75,
    keys: [
      ["z", "lPinky"],
      ["x", "lRing"],
      ["c", "lMiddle"],
      ["v", "lIndex"],
      ["b", "lIndex"],
      ["n", "rIndex"],
      ["m", "rIndex"],
      [",", "rMiddle"],
      [".", "rRing"],
      ["/", "rPinky"],
    ],
  },
];

const keys: KeyDef[] = [];
rows.forEach(({ indent, keys: rowKeys }, rowIndex) => {
  rowKeys.forEach(([char, finger, home], i) => {
    keys.push({
      char,
      codePoint: char.codePointAt(0)!,
      row: rowIndex + 1, // row 0 reserved for the (omitted) number row
      offset: indent + i,
      finger,
      home,
    });
  });
});

// English letters in descending frequency order; guided mode introduces them
// left-to-right along this list.
const frequencyOrder = "etaoinsrhldcumfpgwybvkxjqz"
  .split("")
  .map((c) => c.codePointAt(0)!);

export const QWERTY: Layout = {
  id: "us",
  name: "QWERTY (US)",
  family: "qwerty",
  keys,
  frequencyOrder,
};
