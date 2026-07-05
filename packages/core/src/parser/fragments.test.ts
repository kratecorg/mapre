import { describe, expect, it } from 'vitest';
import {
  detectMaxFragmentLevel,
  postprocessFragments,
  preprocessFragments,
} from './fragments';

describe('detectMaxFragmentLevel', () => {
  it('returns 0 when there are no markers', () => {
    expect(detectMaxFragmentLevel('# No fragments here')).toBe(0);
  });

  it('returns the highest fragment level found', () => {
    expect(detectMaxFragmentLevel('@1 a @1\n@3 b @3\n@2 c @2')).toBe(3);
  });
});

describe('preprocessFragments', () => {
  it('wraps hidden block fragments in a hidden-fragment div', () => {
    const markdown = ['# Title', '', '@1', '**Section**', '@1'].join('\n');

    const hidden = preprocessFragments(markdown, 0);
    expect(hidden).toContain('<div class="hidden-fragment">');
    expect(hidden).toContain('**Section**');
    expect(hidden).not.toContain('@1');
  });

  it('reveals block fragments once the level is reached', () => {
    const markdown = ['# Title', '', '@1', '**Section**', '@1'].join('\n');

    const revealed = preprocessFragments(markdown, 1);
    expect(revealed).not.toContain('hidden-fragment');
    expect(revealed).toContain('**Section**');
    expect(revealed).not.toContain('@1');
  });

  it('hides block fragments inside code fences as spans', () => {
    const markdown = ['```java', 'visible();', '@1', 'hidden();', '@1', 'again();', '```'].join('\n');

    const hidden = preprocessFragments(markdown, 0);
    expect(hidden).toContain('<span class="hidden-fragment">hidden();</span>');
    expect(hidden).not.toContain('<div class="hidden-fragment">');
    expect(hidden).not.toContain('@1');

    const revealed = preprocessFragments(markdown, 1);
    expect(revealed).toContain('hidden();');
    expect(revealed).not.toContain('hidden-fragment');
  });
});

describe('postprocessFragments', () => {
  it('restores escaped hidden-fragment spans inside code blocks', () => {
    const escaped =
      '<code class="language-java">&lt;span class=&quot;hidden-fragment&quot;&gt;x();&lt;/span&gt;</code>';

    expect(postprocessFragments(escaped)).toBe(
      '<code class="language-java"><span class="hidden-fragment">x();</span></code>',
    );
  });
});
