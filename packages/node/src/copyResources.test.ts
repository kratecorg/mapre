import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { copyResources } from './copyResources';

describe('copyResources', () => {
  let root: string;
  let sourceDir: string;
  let targetDir: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'mapre-resources-'));
    sourceDir = join(root, 'resources');
    targetDir = join(root, 'dist', 'resources');
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('returns false and copies nothing when the source folder is missing', () => {
    expect(copyResources(sourceDir, targetDir)).toBe(false);
  });

  it('copies files, including nested folders, into the target', () => {
    mkdirSync(join(sourceDir, 'photos'), { recursive: true });
    writeFileSync(join(sourceDir, 'logo.png'), 'logo-bytes');
    writeFileSync(join(sourceDir, 'photos', 'hero.jpg'), 'hero-bytes');

    expect(copyResources(sourceDir, targetDir)).toBe(true);
    expect(readFileSync(join(targetDir, 'logo.png'), 'utf8')).toBe('logo-bytes');
    expect(readFileSync(join(targetDir, 'photos', 'hero.jpg'), 'utf8')).toBe('hero-bytes');
  });
});
