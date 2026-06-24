import { Keyboard, type Layout } from "./keyboard.ts";
import { QWERTY } from "./layouts/qwerty.ts";

export * from "./keyboard.ts";
export { QWERTY } from "./layouts/qwerty.ts";

export const LAYOUTS: readonly Layout[] = [QWERTY];

export function layoutById(id: string): Layout {
  return LAYOUTS.find((l) => l.id === id) ?? QWERTY;
}

export function keyboardById(id: string): Keyboard {
  return new Keyboard(layoutById(id));
}
