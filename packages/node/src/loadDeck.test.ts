import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadDeck } from './loadDeck';

const fixtureDir = fileURLToPath(new URL('../test/fixtures/deck', import.meta.url));

describe('loadDeck', () => {
  it('assembles one slide per file in directory order', () => {
    const deck = loadDeck(fixtureDir);

    expect(deck.slides.map((slide) => slide.content)).toEqual([
      '# One',
      '# Two-A',
      '# Two-B',
      '# Three',
    ]);
  });

  it('takes deck front matter from the first file', () => {
    const deck = loadDeck(fixtureDir);

    expect(deck.metadata).toEqual({ title: 'Example Deck' });
  });

  it('reindexes slides sequentially across files', () => {
    const deck = loadDeck(fixtureDir);

    expect(deck.slides.map((slide) => slide.index)).toEqual([0, 1, 2, 3]);
  });
});
