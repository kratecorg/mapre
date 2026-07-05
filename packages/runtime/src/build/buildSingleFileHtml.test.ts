import { describe, expect, it } from 'vitest';
import { buildSingleFileHtml } from './buildSingleFileHtml';

const markdown = ['---', 'title: My Talk', '---', '', '# Hello'].join('\n');

describe('buildSingleFileHtml', () => {
  it('derives the document title from the deck front matter', () => {
    const html = buildSingleFileHtml(markdown, { clientScript: '' });

    expect(html).toContain('<title>My Talk</title>');
  });

  it('falls back to a generic title when none is set', () => {
    const html = buildSingleFileHtml('# Hello', { clientScript: '' });

    expect(html).toContain('<title>mapre presentation</title>');
  });

  it('honours an explicit title override', () => {
    const html = buildSingleFileHtml(markdown, { clientScript: '', title: 'Custom' });

    expect(html).toContain('<title>Custom</title>');
  });

  it('embeds the raw markdown for runtime rendering', () => {
    const html = buildSingleFileHtml(markdown, { clientScript: '' });

    expect(html).toContain(JSON.stringify(markdown).replace(/</g, '\\u003c'));
  });
});
