import { matchDirective } from './metadata';

/**
 * The channel used for content that carries no explicit `channel` directive.
 */
export const DEFAULT_CHANNEL = 'main';

/**
 * Splits a slide's content into per-channel sections.
 *
 * A `[channel: name]: #` directive starts a new section; everything before the
 * first such directive belongs to `defaultChannel`. Sections for the same
 * channel are concatenated. Empty sections are dropped, so a slide without any
 * channel directive yields a single entry under `defaultChannel`.
 */
export function splitChannels(
  content: string,
  defaultChannel: string = DEFAULT_CHANNEL,
): Record<string, string> {
  const sections: Array<{ channel: string; lines: string[] }> = [
    { channel: defaultChannel, lines: [] },
  ];

  for (const line of content.split('\n')) {
    const directive = matchDirective(line.trim());
    if (directive && directive.key === 'channel') {
      sections.push({ channel: directive.value, lines: [] });
      continue;
    }

    sections[sections.length - 1].lines.push(line);
  }

  const channels: Record<string, string> = {};
  for (const section of sections) {
    const text = section.lines.join('\n').trim();
    if (text === '') {
      continue;
    }

    channels[section.channel] = channels[section.channel]
      ? `${channels[section.channel]}\n\n${text}`
      : text;
  }

  return channels;
}
