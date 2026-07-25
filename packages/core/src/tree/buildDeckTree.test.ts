import { describe, expect, it } from 'vitest';
import type { DeckSourceSegment } from '../types';
import { buildDeckTree, isMultiLevelEnabled } from './buildDeckTree';

function segment(markdown: string, details: DeckSourceSegment['details'] = []): DeckSourceSegment {
  return { markdown, details };
}

describe('isMultiLevelEnabled', () => {
  it('recognises truthy values case-insensitively', () => {
    expect(isMultiLevelEnabled({ multiLevel: 'true' })).toBe(true);
    expect(isMultiLevelEnabled({ multiLevel: 'On' })).toBe(true);
    expect(isMultiLevelEnabled({ multiLevel: 'YES' })).toBe(true);
    expect(isMultiLevelEnabled({ multiLevel: '1' })).toBe(true);
  });

  it('treats absent or non-truthy values as disabled', () => {
    expect(isMultiLevelEnabled({})).toBe(false);
    expect(isMultiLevelEnabled({ multiLevel: 'false' })).toBe(false);
    expect(isMultiLevelEnabled({ multiLevel: 'off' })).toBe(false);
  });
});

describe('buildDeckTree (flat / multi-level disabled)', () => {
  it('flattens a plain deck as a linear trunk', () => {
    const tree = buildDeckTree(segment('# A\n\n---\n\n# B\n\n---\n\n# C'));

    expect(tree.multiLevel).toBe(false);
    expect(tree.slides).toHaveLength(3);
    expect(tree.trunkCount).toBe(3);
    expect(tree.nodes.map((node) => node.depth)).toEqual([0, 0, 0]);
    expect(tree.nodes.map((node) => node.nextInPath)).toEqual([1, 2, -1]);
    expect(tree.nodes.map((node) => node.prevInPath)).toEqual([-1, 0, 1]);
    expect(tree.nodes.map((node) => node.pathLabel)).toEqual(['1', '2', '3']);
  });

  it('ignores detail branches when the flag is off', () => {
    const tree = buildDeckTree(
      segment('# A\n\n---\n\n# B', [{ slideLocalIndex: 0, segment: segment('# Detail') }]),
    );

    expect(tree.multiLevel).toBe(false);
    expect(tree.slides).toHaveLength(2);
    expect(tree.nodes.every((node) => node.child === -1)).toBe(true);
  });
});

describe('buildDeckTree (multi-level enabled)', () => {
  const trunk = '---\nmultiLevel: true\n---\n\n# Trunk 1\n\n---\n\n# Trunk 2\n\n---\n\n# Trunk 3';

  it('attaches a detail branch to its slide in depth-first order', () => {
    const tree = buildDeckTree(
      segment(trunk, [
        { slideLocalIndex: 1, segment: segment('# D1\n\n---\n\n# D2') },
      ]),
    );

    expect(tree.multiLevel).toBe(true);
    expect(tree.trunkCount).toBe(3);
    // Depth-first: Trunk1, Trunk2, D1, D2, Trunk3.
    expect(tree.slides.map((slide) => slide.content)).toEqual([
      '# Trunk 1',
      '# Trunk 2',
      '# D1',
      '# D2',
      '# Trunk 3',
    ]);
    expect(tree.nodes.map((node) => node.depth)).toEqual([0, 0, 1, 1, 0]);

    const trunk2 = tree.nodes[1];
    expect(trunk2.child).toBe(2);
    expect(trunk2.nextInPath).toBe(4); // Trunk3, not the detail
    expect(tree.nodes[2].parent).toBe(1);
    expect(tree.nodes[2].nextInPath).toBe(3);
    expect(tree.nodes[3].nextInPath).toBe(-1);
    expect(tree.nodes[2].pathLabel).toBe('2.1');
    expect(tree.nodes[3].pathLabel).toBe('2.2');
  });

  it('supports nested detail branches', () => {
    const nested = segment('# D1\n\n---\n\n# D2', [
      { slideLocalIndex: 1, segment: segment('# DD1') },
    ]);
    const tree = buildDeckTree(segment(trunk, [{ slideLocalIndex: 0, segment: nested }]));

    // Depth-first: Trunk1, D1, D2, DD1, Trunk2, Trunk3.
    expect(tree.slides.map((slide) => slide.content)).toEqual([
      '# Trunk 1',
      '# D1',
      '# D2',
      '# DD1',
      '# Trunk 2',
      '# Trunk 3',
    ]);
    expect(tree.nodes.map((node) => node.depth)).toEqual([0, 1, 1, 2, 0, 0]);
    expect(tree.nodes[3].parent).toBe(2);
    expect(tree.nodes[3].pathLabel).toBe('1.2.1');
    // Lanes: trunk 0, first detail 1, nested detail 2.
    expect(tree.nodes.map((node) => node.lane)).toEqual([0, 1, 1, 2, 0, 0]);
  });

  it('lays out a staircase of columns for the overview', () => {
    const tree = buildDeckTree(
      segment(trunk, [{ slideLocalIndex: 1, segment: segment('# D1\n\n---\n\n# D2') }]),
    );

    // Trunk columns 0,1,2 (Trunk3 is column 2); detail starts at parent column + 1.
    const byLabel = new Map(tree.nodes.map((node) => [node.pathLabel, node]));
    expect(byLabel.get('1')?.column).toBe(0);
    expect(byLabel.get('2')?.column).toBe(1);
    expect(byLabel.get('2.1')?.column).toBe(2);
    expect(byLabel.get('2.2')?.column).toBe(3);
    expect(byLabel.get('3')?.column).toBe(2);
  });

  it('drops empty detail segments', () => {
    const tree = buildDeckTree(
      segment(trunk, [{ slideLocalIndex: 0, segment: segment('   ') }]),
    );

    expect(tree.slides).toHaveLength(3);
    expect(tree.nodes[0].child).toBe(-1);
  });
});
