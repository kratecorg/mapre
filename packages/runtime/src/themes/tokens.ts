/**
 * The design tokens every theme must define. The baseline styles reference these
 * custom properties instead of literal values, so a theme changes the look of a
 * deck by redeclaring them on `:root`.
 *
 * Presenter chrome (control bars, buttons, notes panel) is deliberately *not*
 * part of this catalog. Its tokens are named `--mapre-chrome-*` and live in the
 * baseline styles, so a light slide theme cannot render the surrounding controls
 * unreadable.
 */
export const THEME_TOKENS = [
  '--mapre-stage-bg',
  '--mapre-slide-bg',
  '--mapre-slide-fg',
  '--mapre-heading-fg',
  '--mapre-accent',
  '--mapre-muted-fg',
  '--mapre-code-bg',
  '--mapre-code-fg',
  '--mapre-token-comment',
  '--mapre-token-punctuation',
  '--mapre-token-keyword',
  '--mapre-token-string',
  '--mapre-token-number',
  '--mapre-token-function',
  '--mapre-token-builtin',
  '--mapre-font-body',
  '--mapre-font-mono',
  '--mapre-font-scale',
  '--mapre-columns-gap',
] as const;
