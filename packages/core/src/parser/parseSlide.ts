import type { Slide } from '../types';
import { splitChannels, DEFAULT_CHANNEL } from './channels';
import { detectMaxFragmentLevel } from './fragments';
import { extractSlideMetadata } from './metadata';

const NOTES_PATTERN = /^([\s\S]*?)\n\?\?\?[ \t]*\n([\s\S]*)$/;

/**
 * Options controlling how a slide chunk is parsed.
 */
export interface ParseSlideOptions {
  /** Channel used for content without an explicit `channel` directive. */
  defaultChannel?: string;
}

/**
 * Turns a single raw slide chunk into a structured {@link Slide}. Leading
 * directives become slide metadata, a trailing `???` block becomes speaker
 * notes (shared across channels), and `channel` directives split the remaining
 * content into per-channel sections.
 */
export function parseSlide(
  rawContent: string,
  index: number,
  options: ParseSlideOptions = {},
): Slide {
  const defaultChannel = options.defaultChannel ?? DEFAULT_CHANNEL;
  const { metadata, body } = extractSlideMetadata(rawContent.trim());

  let contentAndChannels = body;
  let notes: string | undefined;

  const notesMatch = body.match(NOTES_PATTERN);
  if (notesMatch) {
    contentAndChannels = notesMatch[1].trim();
    notes = notesMatch[2].trim();
  }

  const channels = splitChannels(contentAndChannels, defaultChannel);
  const content = channels[defaultChannel] ?? '';

  return {
    index,
    content,
    notes,
    fragmentCount: computeFragmentCount(channels),
    channels,
    metadata,
  };
}

/**
 * The number of reveal steps is the highest fragment level across all channels,
 * so navigation covers the most-fragmented channel and less-fragmented channels
 * simply show all of their content sooner.
 */
function computeFragmentCount(channels: Record<string, string>): number {
  let max = 0;
  for (const channelContent of Object.values(channels)) {
    max = Math.max(max, detectMaxFragmentLevel(channelContent));
  }
  return max;
}
