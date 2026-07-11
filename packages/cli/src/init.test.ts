import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initPresentation } from './init';

describe('initPresentation', () => {
  let workDir: string;

  beforeEach(() => {
    workDir = mkdtempSync(join(tmpdir(), 'mapre-cli-'));
  });

  afterEach(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  it('writes the scaffold files into a new directory', () => {
    const target = initPresentation({ targetDir: 'my-talk', cwd: workDir });

    const intro = readFileSync(join(target, 'slides', '01-intro.md'), 'utf8');

    expect(intro).toContain('# my-talk');
  });

  it('uses the explicit name over the directory name', () => {
    const target = initPresentation({ targetDir: 'out', name: 'Launch Deck', cwd: workDir });

    const intro = readFileSync(join(target, 'slides', '01-intro.md'), 'utf8');
    expect(intro).toContain('title: Launch Deck');
  });

  it('refuses to overwrite an existing directory', () => {
    initPresentation({ targetDir: 'dup', cwd: workDir });

    expect(() => initPresentation({ targetDir: 'dup', cwd: workDir })).toThrow(
      /already exists/,
    );
  });
});
