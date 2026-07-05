import { describe, expect, it } from 'vitest';
import { parseSlide } from './parseSlide';

describe('parseSlide', () => {
  it('keeps plain content and records the index', () => {
    const slide = parseSlide('# Title\n\nBody text', 2);

    expect(slide.index).toBe(2);
    expect(slide.content).toBe('# Title\n\nBody text');
    expect(slide.notes).toBeUndefined();
    expect(slide.fragmentCount).toBe(0);
    expect(slide.metadata).toEqual({});
  });

  it('splits speaker notes off the content', () => {
    const slide = parseSlide('# Title\n\nBody\n???\nRemember to breathe', 0);

    expect(slide.content).toBe('# Title\n\nBody');
    expect(slide.notes).toBe('Remember to breathe');
  });

  it('extracts slide metadata directives', () => {
    const slide = parseSlide('<!-- layout: center -->\n# Title', 0);

    expect(slide.metadata).toEqual({ layout: 'center' });
    expect(slide.content).toBe('# Title');
  });

  it('counts fragments in the content', () => {
    const slide = parseSlide('@1 a @1\n@2 b @2', 0);

    expect(slide.fragmentCount).toBe(2);
  });

  it('handles metadata, content and notes together', () => {
    const slide = parseSlide('<!-- layout: center -->\n# Title\n\n@1 point @1\n???\nnote', 0);

    expect(slide.metadata).toEqual({ layout: 'center' });
    expect(slide.content).toBe('# Title\n\n@1 point @1');
    expect(slide.notes).toBe('note');
    expect(slide.fragmentCount).toBe(1);
  });
});
