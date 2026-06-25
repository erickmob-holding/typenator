import { type Finger, type KeyDef, type Layout } from "../keyboard.ts";

type Spec = [char: string, finger: Finger, home?: boolean];

// Each row lists keys left-to-right. The first five belong to the left hand and
// the last five to the right hand of a split keyboard; the column index within
// the hand drives the on-screen column-staggered layout.
const rows: Spec[][] = [
  [
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
  [
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
  [
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
];

const HALF = 5; // keys per hand in each row

const keys: KeyDef[] = [];
rows.forEach((rowKeys, rowIndex) => {
  rowKeys.forEach(([char, finger, home], i) => {
    const left = i < HALF;
    keys.push({
      char,
      codePoint: char.codePointAt(0)!,
      row: rowIndex + 1, // row 0 reserved for the (omitted) number row
      hand: left ? "left" : "right",
      col: left ? i : i - HALF,
      finger,
      home,
    });
  });
});

// Letter introduction order, matching keybr's English phonetic model. Guided
// mode unlocks letters left-to-right along this list, and the "All keys" HUD
// shows them in this order too (so it lines up with keybr).
const frequencyOrder = "enitrlsauodychgmpbkvwfzxqj"
  .split("")
  .map((c) => c.codePointAt(0)!);

export const QWERTY: Layout = {
  id: "us",
  name: "QWERTY (US)",
  family: "qwerty",
  keys,
  frequencyOrder,
};
