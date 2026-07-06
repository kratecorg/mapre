import { describe, expect, it } from 'vitest';
import { splitChannels, DEFAULT_CHANNEL } from './channels';

describe('splitChannels', () => {
  it('puts unmarked content under the default channel', () => {
    const channels = splitChannels('# Hello\n\nBody', DEFAULT_CHANNEL);

    expect(channels).toEqual({ main: '# Hello\n\nBody' });
  });

  it('splits content by channel directives', () => {
    const content = ['# Hallo', '', '[channel: en]: #', '', '# Hello'].join('\n');

    const channels = splitChannels(content, 'de');

    expect(channels).toEqual({ de: '# Hallo', en: '# Hello' });
  });

  it('treats content before the first marker as the default channel', () => {
    const content = ['default text', '[channel: en]: #', 'english'].join('\n');

    const channels = splitChannels(content, 'de');

    expect(channels.de).toBe('default text');
    expect(channels.en).toBe('english');
  });

  it('omits an empty default section when a slide starts with a channel', () => {
    const content = ['[channel: en]: #', 'english only'].join('\n');

    const channels = splitChannels(content, 'de');

    expect(channels).toEqual({ en: 'english only' });
  });

  it('concatenates repeated channel sections', () => {
    const content = ['[channel: en]: #', 'one', '[channel: en]: #', 'two'].join('\n');

    expect(splitChannels(content, 'de').en).toBe('one\n\ntwo');
  });
});
