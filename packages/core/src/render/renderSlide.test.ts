import { describe, expect, it } from 'vitest';
import { parseSlide } from '../parser/parseSlide';
import { renderSlide } from './renderSlide';

describe('renderSlide', () => {
  it('renders markdown to HTML', () => {
    const slide = parseSlide('# Title\n\n**bold**', 0);

    const html = renderSlide(slide);

    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<strong>bold</strong>');
  });

  it('hides fragments above the revealed level', () => {
    const slide = parseSlide('# Title\n\n@1\n**Later**\n@1', 0);

    const hidden = renderSlide(slide, { revealedFragments: 0 });
    expect(hidden).toContain('hidden-fragment');
    expect(hidden).toContain('<strong>Later</strong>');

    const revealed = renderSlide(slide, { revealedFragments: 1 });
    expect(revealed).not.toContain('hidden-fragment');
    expect(revealed).toContain('<strong>Later</strong>');
  });

  it('reveals all fragments by default', () => {
    const slide = parseSlide('@1\ntext\n@1', 0);

    expect(renderSlide(slide)).not.toContain('hidden-fragment');
  });

  it('applies Prism syntax highlighting to code blocks', () => {
    const slide = parseSlide('```java\nrecord Point(int x) {}\n```', 0);

    const html = renderSlide(slide);

    expect(html).toContain('language-java');
    expect(html).toContain('class="token');
  });

  it('skips highlighting when disabled', () => {
    const slide = parseSlide('```java\nint x = 1;\n```', 0);

    const html = renderSlide(slide, { highlight: false });

    expect(html).not.toContain('class="token');
    expect(html).toContain('language-java');
  });
});
