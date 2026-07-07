import { describe, expect, it } from 'vitest';
import { presentationFiles, toSlug } from './scaffold';

describe('toSlug', () => {
  it('lowercases and replaces non-alphanumeric runs with a single dash', () => {
    expect(toSlug('My Great Talk!')).toBe('my-great-talk');
  });

  it('trims leading and trailing separators', () => {
    expect(toSlug('  --Hello--  ')).toBe('hello');
  });

  it('falls back to a default for empty input', () => {
    expect(toSlug('   ')).toBe('presentation');
  });
});

describe('presentationFiles', () => {
  it('creates package.json, tsconfig, gitignore and sample slides', () => {
    const files = presentationFiles('My Talk');

    expect(Object.keys(files).sort()).toEqual([
      '.gitignore',
      'package.json',
      'slides/01-intro.md',
      'slides/02-agenda.md',
      'tsconfig.json',
    ]);
  });

  it('uses a slugged package name and a mapre build script', () => {
    const manifest = JSON.parse(presentationFiles('My Talk')['package.json']);

    expect(manifest.name).toBe('my-talk');
    expect(manifest.scripts.build).toBe('mapre build slides -o dist/index.html');
    expect(manifest.devDependencies['@mapre/cli']).toBe('workspace:*');
  });

  it('embeds the display name in the intro slide front matter', () => {
    const intro = presentationFiles('My Talk')['slides/01-intro.md'];

    expect(intro).toContain('title: My Talk');
    expect(intro).toContain('# My Talk');
  });
});
