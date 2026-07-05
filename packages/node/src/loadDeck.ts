import { readFileSync } from 'node:fs';
import { parseDeck } from '@mapre/core';
import type { Deck } from '@mapre/core';
import { collectMarkdownFiles } from './collectMarkdownFiles';

const FILE_SEPARATOR = '\n\n---\n\n';

/**
 * Loads a full {@link Deck} from a slides directory.
 *
 * All markdown files are gathered via {@link collectMarkdownFiles}, joined with
 * a slide separator between files, and parsed as a single deck. Deck-level front
 * matter is therefore taken from the top of the first file.
 */
export function loadDeck(directory: string): Deck {
  const markdown = collectMarkdownFiles(directory)
    .map((file) => readFileSync(file, 'utf8').trim())
    .filter((content) => content !== '')
    .join(FILE_SEPARATOR);

  return parseDeck(markdown);
}
