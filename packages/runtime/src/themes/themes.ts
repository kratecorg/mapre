import { COLORFUL_THEME } from './colorful';
import { DARK_THEME } from './dark';
import { HIGH_CONTRAST_THEME } from './highContrast';
import { LIGHT_THEME } from './light';

/**
 * The themes shipped with mapre, keyed by the name a deck selects through its
 * `theme` directive or the CLI's `--theme` flag.
 */
export const THEMES: Record<string, string> = {
  light: LIGHT_THEME,
  dark: DARK_THEME,
  'high-contrast': HIGH_CONTRAST_THEME,
  colorful: COLORFUL_THEME,
};

/**
 * Theme applied when a deck names none, chosen so existing decks keep their
 * previous look.
 */
export const DEFAULT_THEME = 'dark';

/**
 * All available theme names, in the order they are presented to users.
 */
export const THEME_NAMES: string[] = Object.keys(THEMES);

/**
 * Fails for a theme name that is not shipped, listing the valid names so a typo
 * surfaces at build time instead of silently producing an unstyled deck.
 */
export function assertThemeExists(name: string): void {
  if (THEMES[name] === undefined) {
    throw new Error(`Unknown theme: ${name}. Available themes: ${THEME_NAMES.join(', ')}`);
  }
}

/**
 * Resolves a theme name to its CSS, falling back to the default theme.
 */
export function resolveThemeStyles(name: string = DEFAULT_THEME): string {
  assertThemeExists(name);
  return THEMES[name];
}
