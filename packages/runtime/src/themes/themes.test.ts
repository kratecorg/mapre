import { describe, expect, it } from 'vitest';
import { DEFAULT_THEME, THEMES, THEME_NAMES, resolveThemeStyles } from './themes';
import { THEME_TOKENS } from './tokens';

/** WCAG AA for body text. */
const MIN_BODY_CONTRAST = 4.5;
/** WCAG AA for large text; slide headings always qualify as large. */
const MIN_HEADING_CONTRAST = 3;
/** WCAG AAA for body text, required of the high-contrast theme. */
const MIN_AAA_BODY_CONTRAST = 7;
/** WCAG AAA for large text, required of the high-contrast theme. */
const MIN_AAA_HEADING_CONTRAST = 4.5;

interface ContrastThreshold {
  body: number;
  heading: number;
}

const CONTRAST_THRESHOLDS: Record<string, ContrastThreshold> = {
  light: { body: MIN_BODY_CONTRAST, heading: MIN_HEADING_CONTRAST },
  dark: { body: MIN_BODY_CONTRAST, heading: MIN_HEADING_CONTRAST },
  'high-contrast': { body: MIN_AAA_BODY_CONTRAST, heading: MIN_AAA_HEADING_CONTRAST },
  colorful: { body: MIN_BODY_CONTRAST, heading: MIN_HEADING_CONTRAST },
};

describe('themes', () => {
  it('ships the four documented themes', () => {
    expect(THEME_NAMES).toEqual(['light', 'dark', 'high-contrast', 'colorful']);
  });

  it.each(THEME_NAMES)('%s declares every design token', (name) => {
    const tokens = parseTokens(THEMES[name]);

    expect(Object.keys(tokens).sort()).toEqual([...THEME_TOKENS].sort());
  });

  it.each(THEME_NAMES)('%s declares its tokens on the root element', (name) => {
    // The stage sits outside the slide box, so tokens must be inheritable by both.
    expect(THEMES[name].trimStart().startsWith(':root {')).toBe(true);
  });

  it.each(THEME_NAMES)('%s leaves the presenter chrome tokens alone', (name) => {
    expect(THEMES[name]).not.toMatch(/--mapre-chrome-/);
  });

  it.each(THEME_NAMES)('%s stays self-contained', (name) => {
    expect(THEMES[name]).not.toMatch(/@import/);
    expect(THEMES[name]).not.toMatch(/url\(/);
  });

  it.each(THEME_NAMES)('%s keeps body text readable on the slide background', (name) => {
    const tokens = parseTokens(THEMES[name]);

    expect(worstContrast(tokens['--mapre-slide-fg'], tokens['--mapre-slide-bg'])).toBeGreaterThanOrEqual(
      CONTRAST_THRESHOLDS[name].body,
    );
  });

  it.each(THEME_NAMES)('%s keeps headings readable on the slide background', (name) => {
    const tokens = parseTokens(THEMES[name]);

    expect(
      worstContrast(tokens['--mapre-heading-fg'], tokens['--mapre-slide-bg']),
    ).toBeGreaterThanOrEqual(CONTRAST_THRESHOLDS[name].heading);
  });

  it.each(THEME_NAMES)('%s keeps code readable on the code background', (name) => {
    const tokens = parseTokens(THEMES[name]);

    expect(worstContrast(tokens['--mapre-code-fg'], tokens['--mapre-code-bg'])).toBeGreaterThanOrEqual(
      CONTRAST_THRESHOLDS[name].body,
    );
  });
});

describe('resolveThemeStyles', () => {
  it('falls back to the default theme', () => {
    expect(resolveThemeStyles()).toBe(THEMES[DEFAULT_THEME]);
  });

  it('resolves a named theme', () => {
    expect(resolveThemeStyles('light')).toBe(THEMES.light);
  });

  it('rejects an unknown theme and lists the valid names', () => {
    expect(() => resolveThemeStyles('neon')).toThrow(
      'Unknown theme: neon. Available themes: light, dark, high-contrast, colorful',
    );
  });
});

/**
 * Extracts the `--mapre-*` custom property declarations from a theme's CSS.
 */
function parseTokens(css: string): Record<string, string> {
  const tokens: Record<string, string> = {};
  for (const [, name, value] of css.matchAll(/(--mapre-[a-z-]+)\s*:\s*([^;]+);/g)) {
    tokens[name] = value.trim();
  }
  return tokens;
}

/**
 * Contrast of a colour against a background value, taking the worst case across
 * every colour stop so gradient backgrounds are judged by their weakest point.
 */
function worstContrast(foreground: string, background: string): number {
  const [color] = extractColors(foreground);
  const ratios = extractColors(background).map((stop) => contrastRatio(color, stop));
  return Math.min(...ratios);
}

function extractColors(value: string): string[] {
  return value.match(/#[0-9a-f]{3,6}\b/gi) ?? [];
}

function contrastRatio(foreground: string, background: string): number {
  const [lighter, darker] = [relativeLuminance(foreground), relativeLuminance(background)].sort(
    (first, second) => second - first,
  );
  return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance(hex: string): number {
  const [red, green, blue] = toChannels(hex).map(linearize);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function linearize(channel: number): number {
  const srgb = channel / 255;
  if (srgb <= 0.03928) {
    return srgb / 12.92;
  }
  return ((srgb + 0.055) / 1.055) ** 2.4;
}

function toChannels(hex: string): number[] {
  const digits = hex.slice(1);
  const expanded = digits.length === 3 ? digits.replace(/./g, (digit) => digit + digit) : digits;
  return [0, 2, 4].map((offset) => Number.parseInt(expanded.slice(offset, offset + 2), 16));
}
