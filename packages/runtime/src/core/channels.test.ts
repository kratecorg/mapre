import { parseDeck } from '@mapre/core';
import { describe, expect, it } from 'vitest';
import { collectChannels } from './channels';

const DEFAULT_CHANNEL = 'main';

describe('collectChannels', () => {
  it('returns just the default channel for a single-channel deck', () => {
    const deck = parseDeck('# Hello');

    expect(collectChannels(deck, DEFAULT_CHANNEL)).toEqual([DEFAULT_CHANNEL]);
  });

  it('lists the default channel first, then the rest sorted alphabetically', () => {
    const markdown = [
      '# Slide',
      '',
      '[channel: en]: #',
      'English',
      '',
      '[channel: de]: #',
      'Deutsch',
    ].join('\n');
    const deck = parseDeck(markdown);

    expect(collectChannels(deck, DEFAULT_CHANNEL)).toEqual([DEFAULT_CHANNEL, 'de', 'en']);
  });

  it('always includes the default channel even when no slide carries default content', () => {
    const markdown = ['[channel: en]: #', 'English', '', '[channel: de]: #', 'Deutsch'].join('\n');
    const deck = parseDeck(markdown);

    const channels = collectChannels(deck, 'de');
    expect(channels[0]).toBe('de');
    expect(channels).toContain('en');
  });
});
