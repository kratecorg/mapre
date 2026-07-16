import { describe, expect, it } from 'vitest';
import { printStyles } from './printStyles';

describe('printStyles', () => {
  it('sets the aspect ratio custom properties from the given ratio', () => {
    const css = printStyles({ width: 4, height: 3 });

    expect(css).toContain('--aspect-w: 4');
    expect(css).toContain('--aspect-h: 3');
  });

  it('sizes the print page to the aspect ratio at the base width', () => {
    const css = printStyles({ width: 16, height: 9 });

    // 297mm wide at 16:9 -> 297 * 9 / 16 = 167.0625mm tall.
    expect(css).toContain('@page { size: 297mm 167.0625mm; margin: 0; }');
    expect(css).toContain('width: 297mm;');
    expect(css).toContain('height: 167.0625mm;');
  });

  it('lays out one slide per page with a page break after each', () => {
    const css = printStyles({ width: 16, height: 9 });

    expect(css).toContain('break-after: page;');
    expect(css).toContain('.print-page:last-child { break-after: auto; }');
  });

  it('forces slide backgrounds to print so PDFs keep their colours', () => {
    const css = printStyles({ width: 16, height: 9 });

    expect(css).toContain('print-color-adjust: exact;');
  });
});
