import type { DeckMetadata, DeckSourceSegment, DeckTree, Slide, TreeNode } from '../types';
import { parseDeck } from '../parser/parseDeck';

/**
 * The metadata key that turns multi-level (detail-path) navigation on for a
 * deck. Configured on the deck like `aspect`, e.g. `multiLevel: true`.
 */
export const MULTI_LEVEL_KEY = 'multiLevel';

const TRUTHY_VALUES = new Set(['true', 'on', 'yes', '1']);

/**
 * Reports whether multi-level navigation is enabled by the deck metadata. When
 * disabled, detail branches are ignored and the deck behaves as a flat, linear
 * presentation.
 */
export function isMultiLevelEnabled(metadata: DeckMetadata): boolean {
  const value = metadata[MULTI_LEVEL_KEY];
  return value !== undefined && TRUTHY_VALUES.has(value.trim().toLowerCase());
}

/**
 * Flattens a {@link DeckSourceSegment} tree into a depth-first {@link DeckTree}.
 *
 * Every slide (trunk and detail) is laid out in the order it is presented and
 * printed: a slide, then its entire detail branch, then the next sibling. Each
 * slide gets a parallel {@link TreeNode} carrying the links navigation needs
 * (previous/next sibling, parent, child) plus a lane/column for the overview.
 *
 * When multi-level navigation is disabled on the deck, detail branches are
 * dropped and the result is the flat trunk, matching the pre-feature behaviour.
 */
export function buildDeckTree(root: DeckSourceSegment): DeckTree {
  const metadata = parseDeck(root.markdown).metadata;
  const multiLevel = isMultiLevelEnabled(metadata);

  const slides: Slide[] = [];
  const nodes: TreeNode[] = [];
  let nextLane = 0;

  function walk(
    segment: DeckSourceSegment,
    parentFlat: number,
    depth: number,
    lane: number,
    baseColumn: number,
    labelPrefix: string,
  ): void {
    const segmentSlides = parseDeck(segment.markdown).slides;
    const detailByLocal = new Map<number, DeckSourceSegment>();
    if (multiLevel) {
      for (const detail of segment.details) {
        detailByLocal.set(detail.slideLocalIndex, detail.segment);
      }
    }

    const branch: number[] = [];
    let column = baseColumn;

    segmentSlides.forEach((slide, localIndex) => {
      const flatIndex = slides.length;
      slides.push({ ...slide, index: flatIndex });

      const pathLabel =
        labelPrefix === '' ? String(localIndex + 1) : `${labelPrefix}.${localIndex + 1}`;
      const node: TreeNode = {
        flatIndex,
        depth,
        parent: parentFlat,
        child: -1,
        prevInPath: -1,
        nextInPath: -1,
        lane,
        column,
        pathLabel,
      };
      nodes.push(node);
      branch.push(flatIndex);
      column++;

      const childSegment = detailByLocal.get(localIndex);
      if (childSegment && parseDeck(childSegment.markdown).slides.length > 0) {
        node.child = slides.length;
        walk(childSegment, flatIndex, depth + 1, ++nextLane, node.column + 1, pathLabel);
      }
    });

    linkSiblings(nodes, branch);
  }

  walk(root, -1, 0, 0, 0, '');

  const trunkCount = nodes.filter((node) => node.depth === 0).length;
  return { metadata, slides, nodes, multiLevel, trunkCount };
}

/**
 * Wires up previous/next links between the slides of one branch. The flat
 * indices are not contiguous (detail subtrees sit between siblings in
 * depth-first order), so siblings are linked explicitly through their ordered
 * flat indices.
 */
function linkSiblings(nodes: TreeNode[], branch: number[]): void {
  for (let position = 0; position < branch.length; position++) {
    const node = nodes[branch[position]];
    node.prevInPath = position > 0 ? branch[position - 1] : -1;
    node.nextInPath = position < branch.length - 1 ? branch[position + 1] : -1;
  }
}
