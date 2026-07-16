import type { Deck } from '@mapre/core';

/**
 * Collects the channel names of a deck: the given default channel first, then
 * every other channel used across the slides, sorted alphabetically. The
 * default channel is always present so it can be selected even when no slide
 * carries default content.
 */
export function collectChannels(deck: Deck, defaultChannel: string): string[] {
  const names = new Set<string>();
  for (const slide of deck.slides) {
    for (const name of Object.keys(slide.channels)) {
      names.add(name);
    }
  }
  names.delete(defaultChannel);
  const rest = [...names].sort((first, second) => first.localeCompare(second));
  return [defaultChannel, ...rest];
}
