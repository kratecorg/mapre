import { describe, expect, it } from 'vitest';
import { DEFAULT_THEME, THEMES } from '../themes/themes';
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

  it('applies the default theme when the deck names none', () => {
    const html = buildSingleFileHtml(markdown, { clientScript: '' });

    expect(html).toContain(THEMES[DEFAULT_THEME]);
  });

  it('applies the theme named by the deck front matter', () => {
    const themed = ['---', 'theme: light', '---', '', '# Hello'].join('\n');

    expect(buildSingleFileHtml(themed, { clientScript: '' })).toContain(THEMES.light);
  });

  it('honours an explicit theme override', () => {
    const themed = ['---', 'theme: light', '---', '', '# Hello'].join('\n');
    const html = buildSingleFileHtml(themed, { clientScript: '', theme: 'high-contrast' });

    expect(html).toContain(THEMES['high-contrast']);
  });

  it('rejects an unknown theme', () => {
    const themed = ['---', 'theme: neon', '---', '', '# Hello'].join('\n');

    expect(() => buildSingleFileHtml(themed, { clientScript: '' })).toThrow(/Unknown theme: neon/);
  });

  it('inlines the author stylesheet after the theme so it wins by cascade', () => {
    const html = buildSingleFileHtml(markdown, {
      clientScript: '',
      extraStyles: '.slide { color: red; }',
    });

    expect(html.indexOf('.slide { color: red; }')).toBeGreaterThan(
      html.indexOf(THEMES[DEFAULT_THEME]),
    );
  });
});
