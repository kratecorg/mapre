import { readFileSync } from 'node:fs';
import { parseDeck } from '@mapre/core';
import type { Deck } from '@mapre/core';
import { collectMarkdownFiles } from './collectMarkdownFiles';

const FILE_SEPARATOR = '\n\n---\n\n';

/**
 * Reads and concatenates all markdown files from a slides directory into a
 * single deck source string, joining files with a slide separator between them.
 *
 * This is the exact markdown that {@link loadDeck} parses. It is exposed so
 * callers can embed the raw source and run the parse/render step elsewhere (for
 * example in a browser runtime), keeping a single rendering path across
 * deployments.
 */
export function loadDeckSource(directory: string): string {
  return collectMarkdownFiles(directory)
    .map((file) => readFileSync(file, 'utf8').trim())
    .filter((content) => content !== '')
    .join(FILE_SEPARATOR);
}

/**
 * Loads a full {@link Deck} from a slides directory. Deck-level front matter is
 * taken from the top of the first file.
 */
export function loadDeck(directory: string): Deck {
  return parseDeck(loadDeckSource(directory));
}
