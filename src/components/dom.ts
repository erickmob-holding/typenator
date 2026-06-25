/**
 * True when an event target is a focusable text field (input, textarea, select,
 * or contenteditable). The practice screen listens for keystrokes on the whole
 * window, so it uses this to avoid hijacking typing meant for a form field —
 * e.g. the sign-in modal or the custom-text box.
 */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  const ce = target.getAttribute("contenteditable");
  const contentEditable =
    target.isContentEditable === true || ce === "" || ce === "true";
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    contentEditable
  );
}
