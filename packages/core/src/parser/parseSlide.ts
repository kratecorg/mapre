import type { Slide } from '../types';
import { detectMaxFragmentLevel } from './fragments';
import { extractSlideMetadata } from './metadata';

const NOTES_PATTERN = /^([\s\S]*?)\n\?\?\?[ \t]*\n([\s\S]*)$/;

/**
 * Turns a single raw slide chunk into a structured {@link Slide}. Leading
 * directive comments become slide metadata and a trailing `???` block becomes
 * speaker notes.
 */
export function parseSlide(rawContent: string, index: number): Slide {
  const { metadata, body } = extractSlideMetadata(rawContent.trim());

  let content = body;
  let notes: string | undefined;

  const notesMatch = body.match(NOTES_PATTERN);
  if (notesMatch) {
    content = notesMatch[1].trim();
    notes = notesMatch[2].trim();
  }

  return {
    index,
    content,
    notes,
    fragmentCount: detectMaxFragmentLevel(content),
    metadata,
  };
}
