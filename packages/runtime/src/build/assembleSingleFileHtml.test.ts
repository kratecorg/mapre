import { describe, expect, it } from 'vitest';
import { assembleSingleFileHtml } from './assembleSingleFileHtml';

const markdown = '# One\n\n---\n\n# Two';

describe('assembleSingleFileHtml', () => {
  it('inlines the markdown source, styles, and client script', () => {
    const html = assembleSingleFileHtml({
      title: 'Demo',
      markdown,
      clientScript: 'console.log("client");',
      styles: '.slide { color: red; }',
    });

    expect(html).toContain('.slide { color: red; }');
    expect(html).toContain('console.log("client");');
    expect(html).toContain(JSON.stringify(markdown).replace(/</g, '\\u003c'));
  });

  it('escapes the title to prevent markup injection', () => {
    const html = assembleSingleFileHtml({
      title: 'Demo & <Talk>',
      markdown,
      clientScript: '',
    });

    expect(html).toContain('<title>Demo &amp; &lt;Talk&gt;</title>');
  });

  it('escapes "<" in the embedded source so it cannot break out of the script tag', () => {
    const dangerous = '# One <script>alert(1)</script>';
    const html = assembleSingleFileHtml({ title: 'Demo', markdown: dangerous, clientScript: '' });

    expect(html).not.toContain('<script>alert(1)');
    expect(html).toContain('\\u003cscript>alert(1)\\u003c/script>');
  });

  it('has no external references', () => {
    const html = assembleSingleFileHtml({ title: 'Demo', markdown, clientScript: '' });

    expect(html).not.toMatch(/<link\b/);
    expect(html).not.toMatch(/src=["']https?:/);
  });
});
