import { DEFAULT_SETTINGS, mergeSettings, type Settings } from "./settings.ts";

const KEY = "typenator.settings";

/** Loads settings from localStorage, falling back to defaults. */
export function loadLocalSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      return mergeSettings(JSON.parse(raw));
    }
  } catch {
    // Ignore malformed storage.
  }
  return DEFAULT_SETTINGS;
}

export function saveLocalSettings(settings: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Storage may be unavailable (private mode); non-fatal.
  }
}
