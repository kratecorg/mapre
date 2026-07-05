import type { Deck } from '../types';
import { extractFrontMatter } from './metadata';
import { parseSlide } from './parseSlide';
import { splitSlides } from './splitSlides';

/**
 * Parses a full markdown document into a {@link Deck}. An optional leading front
 * matter block becomes deck metadata, and the remaining `---`-separated sections
 * become slides. Empty sections are dropped.
 */
export function parseDeck(markdown: string): Deck {
  const { metadata, body } = extractFrontMatter(markdown);
  const slides = splitSlides(body)
    .filter((chunk) => chunk.trim() !== '')
    .map((chunk, index) => parseSlide(chunk, index));

  return { metadata, slides };
}
