import { describe, expect, it } from 'vitest';
import { presentationFiles } from './scaffold';

describe('presentationFiles', () => {
  it('creates a gitignore and sample slides only', () => {
    const files = presentationFiles('My Talk');

    expect(Object.keys(files).sort()).toEqual([
      '.gitignore',
      'slides/01-intro.md',
      'slides/02-agenda.md',
    ]);
  });

  it('embeds the display name in the intro slide front matter', () => {
    const intro = presentationFiles('My Talk')['slides/01-intro.md'];

    expect(intro).toContain('title: My Talk');
    expect(intro).toContain('# My Talk');
  });
});
