import { fileURLToPath } from 'node:url';
import { relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { collectMarkdownFiles } from './collectMarkdownFiles';

const fixtureDir = fileURLToPath(new URL('../test/fixtures/deck', import.meta.url));

function relativeNames(paths: string[]): string[] {
  return paths.map((path) => relative(fixtureDir, path).split(/[\\/]/).join('/'));
}

describe('collectMarkdownFiles', () => {
  it('orders files and directories together, alphabetically, recursing into directories', () => {
    const files = collectMarkdownFiles(fixtureDir);

    expect(relativeNames(files)).toEqual([
      '01.md',
      '02ordner/a.md',
      '02ordner/b.md',
      '03.md',
    ]);
  });

  it('ignores non-markdown files', () => {
    const files = collectMarkdownFiles(fixtureDir);

    expect(relativeNames(files)).not.toContain('notes.txt');
  });
});
