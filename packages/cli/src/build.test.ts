import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildPresentation } from './build';

describe('buildPresentation', () => {
  let root: string;
  let slidesDir: string;
  let outFile: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'mapre-build-'));
    slidesDir = join(root, 'slides');
    outFile = join(root, 'dist', 'index.html');
    mkdirSync(slidesDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('copies the resources folder next to the output HTML', () => {
    writeFileSync(join(slidesDir, '01.md'), '# Title');
    const resourcesDir = join(root, 'resources');
    mkdirSync(join(resourcesDir, 'photos'), { recursive: true });
    writeFileSync(join(resourcesDir, 'photos', 'hero.jpg'), 'hero-bytes');

    buildPresentation({ projectDir: root, outFile });

    const copied = join(dirname(outFile), 'resources', 'photos', 'hero.jpg');
    expect(readFileSync(copied, 'utf8')).toBe('hero-bytes');
  });

  it('builds without a resources folder', () => {
    writeFileSync(join(slidesDir, '01.md'), '# Title');

    buildPresentation({ projectDir: root, outFile });

    expect(existsSync(outFile)).toBe(true);
    expect(existsSync(join(dirname(outFile), 'resources'))).toBe(false);
  });

  it('honors per-folder overrides and copies resources next to the output', () => {
    const h18Slides = join(root, 'slides', 'H18');
    const sharedResources = join(root, 'resources');
    const h18Out = join(root, 'dist', 'H18', 'index.html');
    mkdirSync(h18Slides, { recursive: true });
    mkdirSync(sharedResources, { recursive: true });
    writeFileSync(join(h18Slides, '01.md'), '# H18');
    writeFileSync(join(sharedResources, 'logo.png'), 'logo-bytes');

    buildPresentation({
      projectDir: root,
      outFile: h18Out,
      slidesDir: h18Slides,
      resourcesDir: sharedResources,
    });

    expect(existsSync(h18Out)).toBe(true);
    const copied = join(dirname(h18Out), 'resources', 'logo.png');
    expect(readFileSync(copied, 'utf8')).toBe('logo-bytes');
  });
});

describe('buildPresentation channel exports', () => {
  let root: string;
  let slidesDir: string;
  let outFile: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'mapre-print-'));
    slidesDir = join(root, 'slides');
    outFile = join(root, 'dist', 'presentation.html');
    mkdirSync(slidesDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('writes a single channel file next to the presentation for a single-channel deck', () => {
    writeFileSync(join(slidesDir, '01.md'), '# Title');

    const result = buildPresentation({ projectDir: root, outFile });

    expect(result.presentation).toBe(outFile);
    expect(result.channelFiles).toEqual([join(dirname(outFile), 'presentation-main.html')]);
    expect(readFileSync(result.channelFiles[0], 'utf8')).toContain('@page');
  });

  it('writes one channel file per channel for a multi-channel deck', () => {
    const markdown = [
      '---',
      'defaultChannel: de',
      '---',
      '',
      '[channel: de]: #',
      '# Hallo',
      '',
      '[channel: en]: #',
      '# Hello',
    ].join('\n');
    writeFileSync(join(slidesDir, '01.md'), markdown);

    const result = buildPresentation({ projectDir: root, outFile });

    const outDir = dirname(outFile);
    expect(result.channelFiles).toEqual([
      join(outDir, 'presentation-de.html'),
      join(outDir, 'presentation-en.html'),
    ]);
    expect(readFileSync(join(outDir, 'presentation-de.html'), 'utf8')).toContain('Hallo');
    expect(readFileSync(join(outDir, 'presentation-en.html'), 'utf8')).toContain('Hello');
  });
});

