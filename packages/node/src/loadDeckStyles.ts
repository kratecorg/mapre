import { readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { parseDeck } from '@mapre/core';
import { loadDeckSource } from './loadDeck';

const STYLESHEET_DIRECTIVE = 'stylesheet';

/**
 * Resolves a deck's optional `stylesheet` directive to CSS source. The deck's
 * front matter may name an author stylesheet with `[stylesheet: theme.css]: #`;
 * its path is resolved relative to the slides directory and its contents are
 * returned for inlining into the built presentation.
 *
 * Returns `undefined` when the deck sets no stylesheet. Throws when the named
 * file cannot be read, so a typo surfaces at build time instead of silently
 * dropping the theme.
 */
export function loadDeckStyles(directory: string): string | undefined {
  const { metadata } = parseDeck(loadDeckSource(directory));
  const stylesheet = metadata[STYLESHEET_DIRECTIVE];
  if (stylesheet === undefined || stylesheet.trim() === '') {
    return undefined;
  }

  const stylesheetPath = resolveStylesheetPath(directory, stylesheet.trim());
  try {
    return readFileSync(stylesheetPath, 'utf8');
  } catch (cause) {
    throw new Error(`Could not read stylesheet '${stylesheet}' at ${stylesheetPath}`, {
      cause,
    });
  }
}

/**
 * Resolves the stylesheet path relative to the slides directory. Absolute paths
 * are honoured as-is for callers that need them.
 */
function resolveStylesheetPath(directory: string, stylesheet: string): string {
  return isAbsolute(stylesheet) ? stylesheet : resolve(directory, stylesheet);
}
