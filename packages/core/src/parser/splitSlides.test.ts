import { describe, expect, it } from 'vitest';
import { splitSlides } from './splitSlides';

describe('splitSlides', () => {
  it('splits a document on standalone --- lines', () => {
    const slides = splitSlides('# One\n\n---\n\n# Two\n\n---\n\n# Three');

    expect(slides).toEqual(['# One', '# Two', '# Three']);
  });

  it('trims whitespace around each slide', () => {
    const slides = splitSlides('\n\n# One\n\n\n---\n   # Two   \n');

    expect(slides).toEqual(['# One', '# Two']);
  });

  it('ignores --- inside fenced code blocks', () => {
    const markdown = ['# Code', '', '```', 'above', '---', 'below', '```', '', '---', '', '# Next'].join(
      '\n',
    );

    const slides = splitSlides(markdown);

    expect(slides).toHaveLength(2);
    expect(slides[0]).toContain('---');
    expect(slides[0]).toContain('above');
    expect(slides[0]).toContain('below');
    expect(slides[1]).toBe('# Next');
  });

  it('treats --- with more than three dashes as a separator', () => {
    const slides = splitSlides('# One\n-----\n# Two');

    expect(slides).toEqual(['# One', '# Two']);
  });

  it('returns a single chunk when there is no separator', () => {
    expect(splitSlides('# Only slide')).toEqual(['# Only slide']);
  });
});
