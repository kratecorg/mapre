import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildDeckTree } from '@mapre/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadDeckTreeSource } from './loadDeckTreeSource';

describe('loadDeckTreeSource', () => {
  let root: string;
  let slidesDir: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'mapre-tree-'));
    slidesDir = join(root, 'slides');
    mkdirSync(slidesDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  function write(relativePath: string, content: string): void {
    const fullPath = join(root, relativePath);
    mkdirSync(join(fullPath, '..'), { recursive: true });
    writeFileSync(fullPath, content);
  }

  it('returns the trunk on its own when multi-level is disabled', () => {
    write('slides/01.md', '---\ntitle: Talk\n---\n\n[detail: ../details/ddd.md]: #\n\n# DDD');
    write('details/ddd.md', '# Detail');

    const source = loadDeckTreeSource(slidesDir);

    expect(source.details).toEqual([]);
  });

  it('resolves a detail file relative to the slides directory', () => {
    write(
      'slides/01.md',
      '---\ntitle: Talk\nmultiLevel: true\n---\n\n# Intro\n\n---\n\n[detail: ../details/ddd.md]: #\n\n# DDD',
    );
    write('details/ddd.md', '# What is DDD\n\n---\n\n# Bausteine');

    const source = loadDeckTreeSource(slidesDir);

    expect(source.details).toHaveLength(1);
    expect(source.details[0].slideLocalIndex).toBe(1);

    const tree = buildDeckTree(source);
    expect(tree.slides.map((slide) => slide.content)).toEqual([
      '# Intro',
      '# DDD',
      '# What is DDD',
      '# Bausteine',
    ]);
    expect(tree.nodes.map((node) => node.depth)).toEqual([0, 0, 1, 1]);
  });

  it('resolves a detail folder and follows nested details relative to that folder', () => {
    write(
      'slides/01.md',
      '---\ntitle: Talk\nmultiLevel: true\n---\n\n[detail: ../details/ddd/]: #\n\n# DDD',
    );
    // Nested detail path is relative to the ddd/ folder, not the slides dir.
    // The referenced file lives outside the folder so it is not also collected
    // as one of the folder's own slides.
    write('details/ddd/01.md', '# Was\n\n---\n\n[detail: ../aggregate.md]: #\n\n# Bausteine');
    write('details/ddd/02.md', '# Beispiel');
    write('details/aggregate.md', '# Aggregate');

    const tree = buildDeckTree(loadDeckTreeSource(slidesDir));

    // Depth-first: DDD, Was, Bausteine, Aggregate, Beispiel.
    expect(tree.slides.map((slide) => slide.content)).toEqual([
      '# DDD',
      '# Was',
      '# Bausteine',
      '# Aggregate',
      '# Beispiel',
    ]);
    expect(tree.nodes.map((node) => node.depth)).toEqual([0, 1, 1, 2, 1]);
  });

  it('throws a clear error for a missing detail path', () => {
    write('slides/01.md', '---\nmultiLevel: true\n---\n\n[detail: nope.md]: #\n\n# X');

    expect(() => loadDeckTreeSource(slidesDir)).toThrow(/Detail path not found/);
  });

  it('detects reference cycles', () => {
    write(
      'slides/01.md',
      '---\nmultiLevel: true\n---\n\n[detail: ../details/a.md]: #\n\n# X',
    );
    write('details/a.md', '[detail: b.md]: #\n\n# A');
    write('details/b.md', '[detail: a.md]: #\n\n# B');

    expect(() => loadDeckTreeSource(slidesDir)).toThrow(/cycle/i);
  });
});
