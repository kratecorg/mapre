import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { isMultiLevelEnabled, parseDeck } from '@mapre/core';
import type { DeckSourceSegment, SegmentDetail } from '@mapre/core';
import { loadDeckSource } from './loadDeck';

/**
 * The slide directive that references a detail path (a `.md` file or a folder),
 * e.g. `[detail: ddd/]: #`.
 */
const DETAIL_KEY = 'detail';

/**
 * Loads a multi-level deck source tree from a slides directory.
 *
 * The trunk is loaded like a normal deck; every slide carrying a
 * `[detail: <path>]: #` directive is resolved to a nested {@link
 * DeckSourceSegment}. A path may point to a single `.md` file or to a folder of
 * markdown files (loaded in the same order as the trunk). Detail segments may
 * themselves reference further details, so branches nest to any depth.
 *
 * Paths are resolved relative to the segment's base directory (the slides
 * directory for the trunk, the referenced folder or the file's directory for a
 * detail), not relative to individual source files. Reference cycles are
 * detected and reported as errors.
 *
 * Detail references are only followed when the deck enables multi-level
 * navigation via its `multiLevel` metadata; otherwise the trunk is returned on
 * its own, exactly as before.
 */
export function loadDeckTreeSource(slidesDir: string): DeckSourceSegment {
  const markdown = loadDeckSource(slidesDir);
  const multiLevel = isMultiLevelEnabled(parseDeck(markdown).metadata);
  if (!multiLevel) {
    return { markdown, details: [] };
  }

  const baseDir = resolve(slidesDir);
  return { markdown, details: resolveDetails(markdown, baseDir, [baseDir]) };
}

/**
 * Resolves the detail branches referenced by the slides of one segment.
 *
 * @param markdown The segment's markdown.
 * @param baseDir Directory that this segment's relative detail paths resolve
 *   against.
 * @param ancestors Absolute paths of the detail targets already loaded along the
 *   current chain (plus the trunk's slides directory), used to detect cycles.
 */
function resolveDetails(markdown: string, baseDir: string, ancestors: string[]): SegmentDetail[] {
  const details: SegmentDetail[] = [];
  const deck = parseDeck(markdown);

  deck.slides.forEach((slide, slideLocalIndex) => {
    // A detail directive written as the very first line of a segment is parsed
    // as deck-level metadata (a leading directive block); treat that as a detail
    // on the first slide so it works wherever the directive sits.
    const reference =
      slide.metadata[DETAIL_KEY] ?? (slideLocalIndex === 0 ? deck.metadata[DETAIL_KEY] : undefined);
    if (reference === undefined || reference.trim() === '') {
      return;
    }

    details.push({
      slideLocalIndex,
      segment: loadDetailSegment(reference.trim(), baseDir, ancestors),
    });
  });

  return details;
}

/**
 * Loads a single detail segment referenced by `reference`, resolving it against
 * `baseDir` and recursing into its own detail references.
 */
function loadDetailSegment(
  reference: string,
  baseDir: string,
  ancestors: string[],
): DeckSourceSegment {
  const target = isAbsolute(reference) ? reference : resolve(baseDir, reference);

  if (!existsSync(target)) {
    throw new Error(`Detail path not found: "${reference}" (resolved to ${target})`);
  }

  if (ancestors.includes(target)) {
    throw new Error(`Detail reference cycle detected at "${reference}" (${target})`);
  }

  const isDirectory = statSync(target).isDirectory();
  const nextBaseDir = isDirectory ? target : dirname(target);
  const markdown = isDirectory ? loadDeckSource(target) : readFileSync(target, 'utf8').trim();

  return { markdown, details: resolveDetails(markdown, nextBaseDir, [...ancestors, target]) };
}
