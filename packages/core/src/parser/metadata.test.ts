import { describe, expect, it } from 'vitest';
import { extractFrontMatter, extractSlideMetadata, parseKeyValueBlock } from './metadata';

describe('parseKeyValueBlock', () => {
  it('parses simple key/value pairs', () => {
    expect(parseKeyValueBlock('title: Intro\nauthor: Peter')).toEqual({
      title: 'Intro',
      author: 'Peter',
    });
  });

  it('keeps colons inside values', () => {
    expect(parseKeyValueBlock('aspect: 16:9')).toEqual({ aspect: '16:9' });
  });

  it('ignores blank lines and lines without a colon', () => {
    expect(parseKeyValueBlock('title: Intro\n\nnonsense\nlayout: center')).toEqual({
      title: 'Intro',
      layout: 'center',
    });
  });
});

describe('extractFrontMatter', () => {
  it('extracts a leading front matter block', () => {
    const { metadata, body } = extractFrontMatter('---\ntitle: Deck\n---\n# First slide');

    expect(metadata).toEqual({ title: 'Deck' });
    expect(body).toBe('# First slide');
  });

  it('returns empty metadata when there is no front matter', () => {
    const { metadata, body } = extractFrontMatter('# First slide\n\n---\n\n# Second');

    expect(metadata).toEqual({});
    expect(body).toBe('# First slide\n\n---\n\n# Second');
  });
});

describe('extractSlideMetadata', () => {
  it('extracts leading directive comments as metadata', () => {
    const { metadata, body } = extractSlideMetadata(
      '<!-- layout: center -->\n<!-- aspect: 16:9 -->\n# Title',
    );

    expect(metadata).toEqual({ layout: 'center', aspect: '16:9' });
    expect(body).toBe('# Title');
  });

  it('stops at the first content line', () => {
    const { metadata, body } = extractSlideMetadata('<!-- layout: center -->\n# Title\n<!-- x: y -->');

    expect(metadata).toEqual({ layout: 'center' });
    expect(body).toBe('# Title\n<!-- x: y -->');
  });

  it('leaves non-directive comments in the body', () => {
    const { metadata, body } = extractSlideMetadata('<!-- just a note -->\n# Title');

    expect(metadata).toEqual({});
    expect(body).toBe('<!-- just a note -->\n# Title');
  });
});
