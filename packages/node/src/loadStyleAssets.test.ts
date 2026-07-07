import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadStyleAssets } from './loadStyleAssets';

describe('loadStyleAssets', () => {
  let styleDir: string;

  beforeEach(() => {
    styleDir = mkdtempSync(join(tmpdir(), 'mapre-style-'));
  });

  afterEach(() => {
    rmSync(styleDir, { recursive: true, force: true });
  });

  it('returns empty assets when the folder is missing', () => {
    expect(loadStyleAssets(join(styleDir, 'nope'))).toEqual({ css: '', templates: {} });
  });

  it('concatenates css files in alphabetical order', () => {
    writeFileSync(join(styleDir, 'b.css'), '.b {}');
    writeFileSync(join(styleDir, 'a.css'), '.a {}');

    expect(loadStyleAssets(styleDir).css).toBe('.a {}\n.b {}');
  });

  it('reads html files as templates keyed by basename', () => {
    writeFileSync(join(styleDir, 'main-white.html'), '<main>{{content}}</main>');

    expect(loadStyleAssets(styleDir).templates).toEqual({
      'main-white': '<main>{{content}}</main>',
    });
  });

  it('ignores unrelated files', () => {
    writeFileSync(join(styleDir, 'notes.txt'), 'ignored');
    mkdirSync(join(styleDir, 'sub'));

    expect(loadStyleAssets(styleDir)).toEqual({ css: '', templates: {} });
  });
});
