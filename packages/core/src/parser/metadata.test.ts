import { describe, expect, it } from 'vitest';
import {
  extractFrontMatter,
  extractSlideMetadata,
  matchDirective,
  parseKeyValueBlock,
} from './metadata';

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

  it('extracts a leading directive block terminated by a blank line', () => {
    const { metadata, body } = extractFrontMatter('[title: Deck]: #\n[defaultChannel: de]: #\n\n# First');

    expect(metadata).toEqual({ title: 'Deck', defaultChannel: 'de' });
    expect(body).toBe('# First');
  });

  it('does not treat a lone leading directive followed by content as deck metadata', () => {
    const { metadata, body } = extractFrontMatter('[layout: center]: #\n# First');

    expect(metadata).toEqual({});
    expect(body).toBe('[layout: center]: #\n# First');
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

  it('supports link-reference directive syntax', () => {
    const { metadata, body } = extractSlideMetadata('[layout: center]: #\n[aspect: 16:9]: #\n# Title');

    expect(metadata).toEqual({ layout: 'center', aspect: '16:9' });
    expect(body).toBe('# Title');
  });

  it('stops at a channel directive and leaves it in the body', () => {
    const { metadata, body } = extractSlideMetadata('[layout: center]: #\n[channel: en]: #\n# Title');

    expect(metadata).toEqual({ layout: 'center' });
    expect(body).toBe('[channel: en]: #\n# Title');
  });
});

describe('matchDirective', () => {
  it('parses both directive forms', () => {
    expect(matchDirective('<!-- layout: center -->')).toEqual({ key: 'layout', value: 'center' });
    expect(matchDirective('[channel: en]: #')).toEqual({ key: 'channel', value: 'en' });
  });

  it('returns null for non-directive lines', () => {
    expect(matchDirective('# Title')).toBeNull();
    expect(matchDirective('[a link](https://example.com)')).toBeNull();
  });
});
