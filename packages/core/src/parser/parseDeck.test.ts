import { describe, expect, it } from 'vitest';
import { parseDeck } from './parseDeck';

describe('parseDeck', () => {
  it('parses front matter and multiple slides', () => {
    const markdown = [
      '---',
      'title: Demo Deck',
      '---',
      '# Intro',
      '',
      '---',
      '',
      '# Second',
      '',
      'Body',
    ].join('\n');

    const deck = parseDeck(markdown);

    expect(deck.metadata).toEqual({ title: 'Demo Deck' });
    expect(deck.slides).toHaveLength(2);
    expect(deck.slides[0].content).toBe('# Intro');
    expect(deck.slides[0].index).toBe(0);
    expect(deck.slides[1].content).toBe('# Second\n\nBody');
    expect(deck.slides[1].index).toBe(1);
  });

  it('drops empty slides and reindexes the rest', () => {
    const deck = parseDeck('# One\n\n---\n\n---\n\n# Two');

    expect(deck.slides).toHaveLength(2);
    expect(deck.slides.map((slide) => slide.index)).toEqual([0, 1]);
    expect(deck.slides.map((slide) => slide.content)).toEqual(['# One', '# Two']);
  });

  it('works without front matter', () => {
    const deck = parseDeck('# Only');

    expect(deck.metadata).toEqual({});
    expect(deck.slides).toHaveLength(1);
    expect(deck.slides[0].content).toBe('# Only');
  });

  it('treats --- as a separator with Windows CRLF line endings', () => {
    const markdown = '# One\r\n\r\n---\r\n\r\n# Two';

    const deck = parseDeck(markdown);

    expect(deck.slides).toHaveLength(2);
    expect(deck.slides[0].content).toBe('# One');
    expect(deck.slides[1].content).toBe('# Two');
  });
});
