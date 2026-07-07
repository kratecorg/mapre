import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadDeckStyles } from './loadDeckStyles';

describe('loadDeckStyles', () => {
  let slidesDir: string;

  beforeEach(() => {
    slidesDir = mkdtempSync(join(tmpdir(), 'mapre-styles-'));
  });

  afterEach(() => {
    rmSync(slidesDir, { recursive: true, force: true });
  });

  it('returns undefined when the deck names no stylesheet', () => {
    writeFileSync(join(slidesDir, '01.md'), '---\ntitle: Demo\n---\n\n# Hello');

    expect(loadDeckStyles(slidesDir)).toBeUndefined();
  });

  it('reads the stylesheet named in the deck front matter', () => {
    writeFileSync(join(slidesDir, 'theme.css'), '.slide { color: red; }');
    writeFileSync(join(slidesDir, '01.md'), '---\nstylesheet: theme.css\n---\n\n# Hello');

    expect(loadDeckStyles(slidesDir)).toBe('.slide { color: red; }');
  });

  it('throws a helpful error when the stylesheet is missing', () => {
    writeFileSync(join(slidesDir, '01.md'), '---\nstylesheet: missing.css\n---\n\n# Hello');

    expect(() => loadDeckStyles(slidesDir)).toThrow(/missing\.css/);
  });
});
