import type { Deck } from '../types';
import { DEFAULT_CHANNEL } from './channels';
import { extractFrontMatter } from './metadata';
import { parseSlide } from './parseSlide';
import { splitSlides } from './splitSlides';

/**
 * Matches Windows (`\r\n`) and classic Mac (`\r`) line endings so the parser can
 * normalize any source to Unix newlines before splitting on standalone `---`
 * lines.
 */
const NON_UNIX_LINE_ENDING_PATTERN = /\r\n?/g;

/**
 * Parses a full markdown document into a {@link Deck}. An optional leading front
 * matter block becomes deck metadata, and the remaining `---`-separated sections
 * become slides. Empty sections are dropped.
 */
export function parseDeck(markdown: string): Deck {
  const normalized = markdown.replace(NON_UNIX_LINE_ENDING_PATTERN, '\n');
  const { metadata, body } = extractFrontMatter(normalized);
  const defaultChannel = metadata.defaultChannel ?? DEFAULT_CHANNEL;
  const slides = splitSlides(body)
    .filter((chunk) => chunk.trim() !== '')
    .map((chunk, index) => parseSlide(chunk, index, { defaultChannel }));

  return { metadata, slides };
}
