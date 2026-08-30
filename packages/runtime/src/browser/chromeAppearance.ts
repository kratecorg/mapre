/**
 * Appearance of the presenter chrome (control bars, notes panel, buttons). This
 * is deliberately independent of the deck theme: how bright the controls should
 * be depends on the room and the presenter, not on the slides.
 */
export type ChromeAppearance = 'dark' | 'light';

/** Selectable appearances, in the order their buttons are rendered. */
export const CHROME_APPEARANCES: ChromeAppearance[] = ['dark', 'light'];

/** Appearance used when nothing has been stored yet. */
export const DEFAULT_CHROME_APPEARANCE: ChromeAppearance = 'dark';

const STORAGE_KEY = 'mapre:presenter-appearance';
const LIGHT_CLASS = 'chrome-light';

/**
 * The slice of the Web Storage API this module needs, so persistence can be
 * tested without a browser.
 */
export interface AppearanceStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/**
 * Returns `localStorage`, or null where it is unavailable. Browsers reject it on
 * some `file://` origins, and the single-file build is expected to run from
 * there, so absence is normal rather than exceptional.
 */
function defaultStorage(): AppearanceStorage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isChromeAppearance(value: string | null): value is ChromeAppearance {
  return value === 'dark' || value === 'light';
}

/**
 * Reads the stored appearance, falling back to the default for missing,
 * unreadable, or unrecognized values.
 */
export function readChromeAppearance(
  storage: AppearanceStorage | null = defaultStorage(),
): ChromeAppearance {
  if (storage === null) {
    return DEFAULT_CHROME_APPEARANCE;
  }

  try {
    const stored = storage.getItem(STORAGE_KEY);
    if (isChromeAppearance(stored)) {
      return stored;
    }
  } catch {
    // A storage that rejects reads is treated as absent.
  }

  return DEFAULT_CHROME_APPEARANCE;
}

/**
 * Persists the appearance. A storage that rejects writes (private mode, quota,
 * `file://`) is tolerated: the choice then simply lasts for the session.
 */
export function writeChromeAppearance(
  appearance: ChromeAppearance,
  storage: AppearanceStorage | null = defaultStorage(),
): void {
  if (storage === null) {
    return;
  }

  try {
    storage.setItem(STORAGE_KEY, appearance);
  } catch {
    // Persisting is a convenience, never a requirement.
  }
}

/**
 * Applies the appearance to the document root, where the `--mapre-chrome-*`
 * tokens are defined.
 */
export function applyChromeAppearance(root: HTMLElement, appearance: ChromeAppearance): void {
  root.classList.toggle(LIGHT_CLASS, appearance === 'light');
}
