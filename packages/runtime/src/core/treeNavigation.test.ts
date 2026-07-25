import { buildDeckTree } from '@mapre/core';
import type { DeckSourceSegment, DeckTree } from '@mapre/core';
import { describe, expect, it } from 'vitest';
import { TreeNavigation } from './treeNavigation';

function segment(markdown: string, details: DeckSourceSegment['details'] = []): DeckSourceSegment {
  return { markdown, details };
}

function navigationFor(tree: DeckTree, start?: { slideIndex: number; stepIndex: number }): TreeNavigation {
  return new TreeNavigation(
    tree.nodes,
    tree.slides.map((slide) => slide.fragmentCount + 1),
    start,
  );
}

// Trunk T1, T2 (branches into D1, D2, D3), T3. The branching parent T2 carries
// two fragments and the following trunk slide T3 carries one, matching the
// example deck's requirements.
const TRUNK = [
  '---',
  'multiLevel: true',
  '---',
  '',
  '# T1',
  '',
  '---',
  '',
  '# T2',
  '',
  '@1 first @1',
  '',
  '@2 second @2',
  '',
  '---',
  '',
  '# T3',
  '',
  '@1 later @1',
].join('\n');

const DETAIL = '# D1\n\n---\n\n# D2\n\n---\n\n# D3';

function exampleTree(): DeckTree {
  return buildDeckTree(segment(TRUNK, [{ slideLocalIndex: 1, segment: segment(DETAIL) }]));
}

describe('TreeNavigation', () => {
  it('rejects an empty deck', () => {
    expect(() => new TreeNavigation([], [])).toThrow();
  });

  it('reveals the branching parent fragments before its detail is entered', () => {
    const nav = navigationFor(exampleTree());

    expect(nav.next()).toBe(true); // -> T2, step 0
    expect(nav.slideIndex).toBe(1);
    expect(nav.stepIndex).toBe(0);

    expect(nav.next()).toBe(true); // T2 fragment 1
    expect(nav.stepIndex).toBe(1);
    expect(nav.next()).toBe(true); // T2 fragment 2
    expect(nav.stepIndex).toBe(2);

    // Right does NOT enter the detail branch; it moves to the next trunk slide.
    expect(nav.next()).toBe(true);
    expect(nav.slideIndex).toBe(5); // T3
    expect(nav.stepIndex).toBe(0);
  });

  it('enters a detail branch with enterDetail regardless of fragment state', () => {
    const nav = navigationFor(exampleTree());
    nav.next(); // T2

    expect(nav.hasDetail).toBe(true);
    expect(nav.enterDetail()).toBe(true);
    expect(nav.slideIndex).toBe(2); // D1
    expect(nav.stepIndex).toBe(0);
  });

  it('walks the detail path with left/right', () => {
    const nav = navigationFor(exampleTree());
    nav.next(); // T2
    nav.enterDetail(); // D1

    expect(nav.next()).toBe(true);
    expect(nav.slideIndex).toBe(3); // D2
    expect(nav.next()).toBe(true);
    expect(nav.slideIndex).toBe(4); // D3
  });

  it('auto-returns to the main talk after the last detail slide', () => {
    const nav = navigationFor(exampleTree());
    nav.next(); // T2
    nav.enterDetail(); // D1
    nav.next(); // D2
    nav.next(); // D3

    // Right on the last detail slide continues at the parent's next sibling.
    expect(nav.next()).toBe(true);
    expect(nav.slideIndex).toBe(5); // T3
    expect(nav.stepIndex).toBe(0);
  });

  it('returns to the fully revealed parent when going left at a branch start', () => {
    const nav = navigationFor(exampleTree());
    nav.next(); // T2 (has 2 fragments)
    nav.enterDetail(); // D1, step 0

    expect(nav.previous()).toBe(true);
    expect(nav.slideIndex).toBe(1); // T2
    expect(nav.stepIndex).toBe(2); // fully revealed
  });

  it('exitDetail restores the parent step captured on enter', () => {
    const nav = navigationFor(exampleTree());
    nav.next(); // T2, step 0
    nav.next(); // T2, step 1
    nav.enterDetail(); // D1 (remembers T2 step 1)
    nav.next(); // D2

    expect(nav.exitDetail()).toBe(true);
    expect(nav.slideIndex).toBe(1); // T2
    expect(nav.stepIndex).toBe(1); // restored
  });

  it('does nothing on exitDetail at the trunk level', () => {
    const nav = navigationFor(exampleTree());
    expect(nav.canExitDetail).toBe(false);
    expect(nav.exitDetail()).toBe(false);
  });

  it('reports isFirst and isLast against the main talk', () => {
    const tree = exampleTree();
    const nav = navigationFor(tree);
    expect(nav.isFirst).toBe(true);

    // Advance to the last trunk slide, fully revealed.
    nav.last();
    expect(nav.slideIndex).toBe(5); // T3
    nav.next(); // reveal T3 fragment
    expect(nav.stepIndex).toBe(1);
    expect(nav.isLast).toBe(true);
    expect(nav.next()).toBe(false);
  });

  it('Home/End jump to the trunk ends even from within a branch', () => {
    const nav = navigationFor(exampleTree());
    nav.next(); // T2
    nav.enterDetail(); // D1

    expect(nav.last()).toBe(true);
    expect(nav.slideIndex).toBe(5); // T3
    expect(nav.first()).toBe(true);
    expect(nav.slideIndex).toBe(0); // T1
  });

  it('behaves like flat linear navigation without detail branches', () => {
    const tree = buildDeckTree(segment('# A\n\n---\n\n# B\n\n---\n\n# C'));
    const nav = navigationFor(tree);

    expect(nav.hasDetail).toBe(false);
    expect(nav.enterDetail()).toBe(false);
    expect(nav.next()).toBe(true);
    expect(nav.slideIndex).toBe(1);
    expect(nav.next()).toBe(true);
    expect(nav.slideIndex).toBe(2);
    expect(nav.isLast).toBe(true);
    expect(nav.next()).toBe(false);
  });
});
