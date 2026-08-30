import { describe, expect, it } from 'vitest';
import { presentationFiles } from './scaffold';

describe('presentationFiles', () => {
  it('creates a gitignore and sample slides only', () => {
    const files = presentationFiles({ name: 'My Talk' });

    expect(Object.keys(files).sort()).toEqual([
      '.gitignore',
      'slides/01-intro.md',
      'slides/02-agenda.md',
      'slides/03-columns.md',
    ]);
  });

  it('embeds the display name in the intro slide front matter', () => {
    const intro = presentationFiles({ name: 'My Talk' })['slides/01-intro.md'];

    expect(intro).toContain('title: My Talk');
    expect(intro).toContain('# My Talk');
  });

  it('writes the default theme when none is chosen', () => {
    const intro = presentationFiles({ name: 'My Talk' })['slides/01-intro.md'];

    expect(intro).toContain('theme: dark');
  });

  it('writes the chosen theme into the intro slide front matter', () => {
    const intro = presentationFiles({ name: 'My Talk', theme: 'light' })['slides/01-intro.md'];

    expect(intro).toContain('theme: light');
  });
});
