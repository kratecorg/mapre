import { readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { parseDeck } from '@mapre/core';
import { loadDeckSource } from './loadDeck';

const STYLESHEET_DIRECTIVE = 'stylesheet';

/**
 * Resolves the absolute path of a deck's optional `stylesheet` directive without
 * reading the file. The deck's front matter may name an author stylesheet with
 * `[stylesheet: theme.css]: #`; its path is resolved relative to the slides
 * directory. Returns `undefined` when the deck sets no stylesheet.
 *
 * Exposed so watch-based tooling can observe the stylesheet for changes.
 */
export function resolveDeckStylesheetPath(directory: string): string | undefined {
  const { metadata } = parseDeck(loadDeckSource(directory));
  const stylesheet = metadata[STYLESHEET_DIRECTIVE];
  if (stylesheet === undefined || stylesheet.trim() === '') {
    return undefined;
  }

  const trimmed = stylesheet.trim();
  return isAbsolute(trimmed) ? trimmed : resolve(directory, trimmed);
}

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
  const stylesheetPath = resolveDeckStylesheetPath(directory);
  if (stylesheetPath === undefined) {
    return undefined;
  }

  try {
    return readFileSync(stylesheetPath, 'utf8');
  } catch (cause) {
    throw new Error(`Could not read stylesheet at ${stylesheetPath}`, { cause });
  }
}
