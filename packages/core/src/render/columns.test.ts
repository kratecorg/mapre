import { describe, expect, it } from 'vitest';
import { applyColumns } from './columns';

describe('applyColumns — region detection', () => {
  it('leaves markdown without markers untouched', () => {
    const markdown = '# Title\n\nJust prose.';
    expect(applyColumns(markdown)).toBe(markdown);
  });

  it('wraps each marker section in a column', () => {
    const out = applyColumns('<!-- column -->\nleft\n<!-- column -->\nright');
    expect(out).toContain('<div class="columns"');
    expect(out.match(/<div class="column">/g)).toHaveLength(2);
    expect(out).toContain('left');
    expect(out).toContain('right');
  });

  it('keeps content above the first marker at full width', () => {
    const out = applyColumns('# Title\n\n<!-- column -->\nleft\n<!-- column -->\nright');
    expect(out.indexOf('# Title')).toBeLessThan(out.indexOf('<div class="columns"'));
  });

  it('accepts the link-reference marker form', () => {
    const out = applyColumns('[column]: #\nleft\n[column]: #\nright');
    expect(out.match(/<div class="column">/g)).toHaveLength(2);
  });

  it('closes a region at the end marker and resumes full width', () => {
    const out = applyColumns('<!-- column -->\nleft\n<!-- end-columns -->\nfooter');
    expect(out.indexOf('footer')).toBeGreaterThan(out.lastIndexOf('</div>'));
  });

  it('accepts the link-reference end marker form', () => {
    const out = applyColumns('[column]: #\nleft\n[end-columns]: #\nfooter');
    expect(out.indexOf('footer')).toBeGreaterThan(out.lastIndexOf('</div>'));
  });

  it('supports several regions on one slide', () => {
    const out = applyColumns(
      '<!-- column -->\na\n<!-- end-columns -->\nbetween\n<!-- column -->\nb',
    );
    expect(out.match(/<div class="columns"/g)).toHaveLength(2);
  });

  it('ignores an end marker outside a region', () => {
    expect(applyColumns('<!-- end-columns -->\ntext')).toBe('text');
  });

  it('leaves markers inside fenced code untouched', () => {
    const markdown = '```\n<!-- column -->\n```';
    expect(applyColumns(markdown)).toBe(markdown);
  });

  it('pads wrappers with blank lines so the content stays markdown', () => {
    const out = applyColumns('<!-- column -->\n- a\n<!-- column -->\n- b');
    expect(out).toContain('<div class="column">\n\n- a\n\n</div>');
  });
});

describe('applyColumns — track resolution', () => {
  it('defaults to equal columns derived from the marker count', () => {
    const out = applyColumns('<!-- column -->\na\n<!-- column -->\nb\n<!-- column -->\nc');
    expect(out).toContain('--columns-tracks:repeat(3, minmax(0, 1fr))');
  });

  it('reads a plain number as a column count', () => {
    const out = applyColumns('<!-- column -->\na', { tracks: '4' });
    expect(out).toContain('--columns-tracks:repeat(4, minmax(0, 1fr))');
  });

  it('expands a ratio into flexible tracks', () => {
    const out = applyColumns('<!-- column -->\na\n<!-- column -->\nb', { tracks: '2:1' });
    expect(out).toContain('--columns-tracks:minmax(0, 2fr) minmax(0, 1fr)');
  });

  it('wraps fr tracks in minmax so wide children cannot stretch a column', () => {
    const out = applyColumns('<!-- column -->\na', { tracks: '2fr 1fr' });
    expect(out).toContain('--columns-tracks:minmax(0, 2fr) minmax(0, 1fr)');
  });

  it('passes fixed units through unchanged', () => {
    const out = applyColumns('<!-- column -->\na', { tracks: '60% 40%' });
    expect(out).toContain('--columns-tracks:60% 40%');
  });

  it('keeps auto tracks as-is', () => {
    const out = applyColumns('<!-- column -->\na', { tracks: 'auto 1fr' });
    expect(out).toContain('--columns-tracks:auto minmax(0, 1fr)');
  });

  it('falls back to equal columns for an unsupported unit', () => {
    const out = applyColumns('<!-- column -->\na\n<!-- column -->\nb', { tracks: '1vw 2vw' });
    expect(out).toContain('--columns-tracks:repeat(2, minmax(0, 1fr))');
  });

  it('rejects a track value that tries to escape the inline style', () => {
    const out = applyColumns('<!-- column -->\na', {
      tracks: '1fr" onload="alert(1)',
    });
    expect(out).not.toContain('onload');
    expect(out).toContain('--columns-tracks:repeat(1, minmax(0, 1fr))');
  });

  it('clamps an absurd column count', () => {
    const out = applyColumns('<!-- column -->\na', { tracks: '99' });
    expect(out).toContain('--columns-tracks:repeat(12, minmax(0, 1fr))');
  });
});

describe('applyColumns — alignment', () => {
  it('omits the alignment property when none is set', () => {
    const out = applyColumns('<!-- column -->\na');
    expect(out).not.toContain('--columns-align');
  });

  it('maps the named alignment onto align-items values', () => {
    const out = applyColumns('<!-- column -->\na', { align: 'bottom' });
    expect(out).toContain('--columns-align:end');
  });

  it('ignores an unknown alignment', () => {
    const out = applyColumns('<!-- column -->\na', { align: 'sideways' });
    expect(out).not.toContain('--columns-align');
  });
});
