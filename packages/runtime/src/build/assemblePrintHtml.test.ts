import { describe, expect, it } from 'vitest';
import { assemblePrintHtml } from './assemblePrintHtml';

const aspect = { width: 16, height: 9 };

describe('assemblePrintHtml', () => {
  it('escapes the document title', () => {
    const html = assemblePrintHtml({ title: 'A & B <c>', pages: [], aspect });

    expect(html).toContain('<title>A &amp; B &lt;c&gt;</title>');
  });

  it('wraps each page in a fixed-aspect print page', () => {
    const html = assemblePrintHtml({ title: 'T', pages: ['<h1>One</h1>', '<h1>Two</h1>'], aspect });

    const pageCount = html.match(/class="print-page"/g)?.length ?? 0;
    expect(pageCount).toBe(2);
    expect(html).toContain('<div class="slide"><h1>One</h1></div>');
    expect(html).toContain('<div class="slide"><h1>Two</h1></div>');
  });

  it('inlines the print styles derived from the aspect ratio', () => {
    const html = assemblePrintHtml({ title: 'T', pages: [], aspect });

    expect(html).toContain('@page { size: 297mm 167.0625mm; margin: 0; }');
  });

  it('inlines author styles after the baseline styles', () => {
    const html = assemblePrintHtml({
      title: 'T',
      pages: [],
      aspect,
      extraStyles: '.slide { color: hotpink; }',
    });

    expect(html).toContain('.slide { color: hotpink; }');
  });

  it('neutralises a </style> break-out attempt in author styles', () => {
    const html = assemblePrintHtml({
      title: 'T',
      pages: [],
      aspect,
      extraStyles: '</style><script>alert(1)</script>',
    });

    expect(html).not.toContain('</style><script>');
  });
});
