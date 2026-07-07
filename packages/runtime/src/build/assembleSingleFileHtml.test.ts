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

  it('inlines author styles after the baseline styles so they win by cascade', () => {
    const html = assembleSingleFileHtml({
      title: 'Demo',
      markdown,
      clientScript: '',
      styles: '.slide { color: red; }',
      extraStyles: '.slide { color: green; }',
    });

    const baselineIndex = html.indexOf('.slide { color: red; }');
    const authorIndex = html.indexOf('.slide { color: green; }');
    expect(baselineIndex).toBeGreaterThanOrEqual(0);
    expect(authorIndex).toBeGreaterThan(baselineIndex);
  });

  it('omits the author style element when no extra styles are given', () => {
    const html = assembleSingleFileHtml({ title: 'Demo', markdown, clientScript: '' });

    expect(html.match(/<style>/g)).toHaveLength(1);
  });

  it('neutralizes a "</style>" breakout inside author styles', () => {
    const html = assembleSingleFileHtml({
      title: 'Demo',
      markdown,
      clientScript: '',
      extraStyles: '.x {}</style><script>alert(1)</script>',
    });

    expect(html).not.toContain('</style><script>alert(1)');
    expect(html).toContain('<\\/style>');
  });
});
