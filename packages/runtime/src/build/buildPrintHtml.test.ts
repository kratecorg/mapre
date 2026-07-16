import { describe, expect, it } from 'vitest';
import { buildPrintHtml, listDeckChannels } from './buildPrintHtml';

const multiChannel = [
  '---',
  'title: My Talk',
  'aspect: 4:3',
  'defaultChannel: de',
  '---',
  '',
  '[channel: de]: #',
  '# Hallo',
  '',
  '[channel: en]: #',
  '# Hello',
  '',
  '---',
  '',
  '[channel: de]: #',
  '# Tschüss',
  '',
  '[channel: en]: #',
  '# Bye',
].join('\n');

describe('buildPrintHtml', () => {
  it('derives the title from the deck front matter', () => {
    const html = buildPrintHtml('---\ntitle: Deck\n---\n\n# Hi');

    expect(html).toContain('<title>Deck</title>');
  });

  it('honours an explicit title override', () => {
    const html = buildPrintHtml('# Hi', { title: 'Override' });

    expect(html).toContain('<title>Override</title>');
  });

  it('renders one print page per slide', () => {
    const html = buildPrintHtml(multiChannel);

    const pageCount = html.match(/class="print-page"/g)?.length ?? 0;
    expect(pageCount).toBe(2);
  });

  it('applies the deck aspect ratio to the page size', () => {
    const html = buildPrintHtml(multiChannel);

    // 4:3 at 297mm wide -> 297 * 3 / 4 = 222.75mm tall.
    expect(html).toContain('@page { size: 297mm 222.75mm; margin: 0; }');
  });

  it('renders the requested channel content', () => {
    const en = buildPrintHtml(multiChannel, { channel: 'en' });
    const de = buildPrintHtml(multiChannel, { channel: 'de' });

    expect(en).toContain('Hello');
    expect(en).toContain('Bye');
    expect(de).toContain('Hallo');
    expect(de).toContain('Tschüss');
  });
});

describe('listDeckChannels', () => {
  it('returns the default channel first, then the rest sorted', () => {
    expect(listDeckChannels(multiChannel)).toEqual(['de', 'en']);
  });

  it('returns the implicit default channel for a single-channel deck', () => {
    expect(listDeckChannels('# Hi')).toEqual(['main']);
  });
});
