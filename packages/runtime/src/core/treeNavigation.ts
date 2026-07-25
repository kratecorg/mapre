import type { TreeNode } from '@mapre/core';

/**
 * The current position within a multi-level deck: which slide (a flat index into
 * the depth-first slide list) and which reveal step.
 */
export interface NavigationState {
  slideIndex: number;
  stepIndex: number;
}

/**
 * Pure navigation state machine for a multi-level deck.
 *
 * The deck is flattened into depth-first order; each slide carries {@link
 * TreeNode} links describing its place in the tree. Left/right (`next`/
 * `previous`) move within the current path, following sibling links rather than
 * raw flat order. `enterDetail` (down) descends into a slide's detail branch and
 * `exitDetail` (up) returns to the branching parent. Advancing off the end of a
 * detail branch automatically returns to the main talk (the parent's next
 * sibling, climbing as needed).
 *
 * It is deliberately DOM- and framework-free so the same logic drives the
 * browser client, the presenter view, and unit tests alike. For a deck without
 * detail branches it behaves exactly like a flat linear navigation.
 */
export class TreeNavigation {
  private currentSlide: number;
  private currentStep: number;
  private readonly lastTrunkIndex: number;
  /** Remembers the parent's step when descending, restored on {@link exitDetail}. */
  private readonly returnStep = new Map<number, number>();

  constructor(
    private readonly nodes: readonly TreeNode[],
    private readonly stepCounts: readonly number[],
    start: NavigationState = { slideIndex: 0, stepIndex: 0 },
  ) {
    if (nodes.length === 0 || stepCounts.length === 0) {
      throw new Error('A deck needs at least one slide.');
    }

    this.currentSlide = clamp(start.slideIndex, 0, nodes.length - 1);
    this.currentStep = clamp(start.stepIndex, 0, this.lastStepOf(this.currentSlide));
    this.lastTrunkIndex = findLastTrunkIndex(nodes);
  }

  get slideIndex(): number {
    return this.currentSlide;
  }

  get stepIndex(): number {
    return this.currentStep;
  }

  get slideCount(): number {
    return this.nodes.length;
  }

  get isFirst(): boolean {
    return this.currentStep === 0 && !this.canRetreat();
  }

  get isLast(): boolean {
    return this.currentStep === this.lastStepOf(this.currentSlide) && this.forwardTarget() === -1;
  }

  /** Whether the current slide has a detail branch that {@link enterDetail} enters. */
  get hasDetail(): boolean {
    return this.nodes[this.currentSlide].child !== -1;
  }

  /** Whether {@link exitDetail} can move up to a parent slide. */
  get canExitDetail(): boolean {
    return this.nodes[this.currentSlide].parent !== -1;
  }

  /**
   * The slide the next move would advance to without changing state, or `-1`
   * when at the very end. Used by the presenter view to preview what comes next.
   */
  peekForward(): number {
    return this.forwardTarget();
  }

  /**
   * Reveals the next fragment, then moves to the next slide in the current path.
   * At the end of a detail branch it returns to the main talk automatically,
   * climbing to the nearest ancestor that has a following slide. Returns whether
   * the position changed.
   */
  next(): boolean {
    if (this.currentStep < this.lastStepOf(this.currentSlide)) {
      this.currentStep++;
      return true;
    }

    const target = this.forwardTarget();
    if (target === -1) {
      return false;
    }

    this.currentSlide = target;
    this.currentStep = 0;
    return true;
  }

  /**
   * Hides the last revealed fragment, then moves to the fully revealed previous
   * slide in the current path. At the start of a detail branch it returns to the
   * (fully revealed) branching parent. Returns whether the position changed.
   */
  previous(): boolean {
    if (this.currentStep > 0) {
      this.currentStep--;
      return true;
    }

    const node = this.nodes[this.currentSlide];
    const target = node.prevInPath !== -1 ? node.prevInPath : node.parent;
    if (target === -1) {
      return false;
    }

    this.currentSlide = target;
    this.currentStep = this.lastStepOf(target);
    return true;
  }

  /**
   * Descends into the current slide's detail branch, remembering the current
   * step so {@link exitDetail} can restore it. Returns whether it moved.
   */
  enterDetail(): boolean {
    const child = this.nodes[this.currentSlide].child;
    if (child === -1) {
      return false;
    }

    this.returnStep.set(this.currentSlide, this.currentStep);
    this.currentSlide = child;
    this.currentStep = 0;
    return true;
  }

  /**
   * Returns from a detail branch to its branching parent, restoring the step the
   * parent had when the branch was entered. Returns whether it moved.
   */
  exitDetail(): boolean {
    const parent = this.nodes[this.currentSlide].parent;
    if (parent === -1) {
      return false;
    }

    this.currentSlide = parent;
    this.currentStep = this.returnStep.get(parent) ?? this.lastStepOf(parent);
    return true;
  }

  /** Jumps to the start of the given slide. Returns whether the position changed. */
  goToSlide(slideIndex: number): boolean {
    if (slideIndex < 0 || slideIndex >= this.nodes.length) {
      return false;
    }
    if (slideIndex === this.currentSlide && this.currentStep === 0) {
      return false;
    }

    this.currentSlide = slideIndex;
    this.currentStep = 0;
    return true;
  }

  /**
   * Moves directly to an explicit position, clamping the step to the target
   * slide's range. Used to apply state received from another window.
   */
  goTo(slideIndex: number, stepIndex: number): boolean {
    if (slideIndex < 0 || slideIndex >= this.nodes.length) {
      return false;
    }

    const clampedStep = clamp(stepIndex, 0, this.lastStepOf(slideIndex));
    if (slideIndex === this.currentSlide && clampedStep === this.currentStep) {
      return false;
    }

    this.currentSlide = slideIndex;
    this.currentStep = clampedStep;
    return true;
  }

  /** Jumps to the first trunk slide. */
  first(): boolean {
    return this.goToSlide(0);
  }

  /** Jumps to the last trunk slide (the end of the main talk). */
  last(): boolean {
    return this.goToSlide(this.lastTrunkIndex);
  }

  /**
   * The slide the next move would advance to (a sibling, or an ancestor's next
   * sibling when at the end of a detail branch), or `-1` when at the very end.
   */
  private forwardTarget(): number {
    let index = this.currentSlide;
    while (index !== -1) {
      const node = this.nodes[index];
      if (node.nextInPath !== -1) {
        return node.nextInPath;
      }
      index = node.parent;
    }
    return -1;
  }

  private canRetreat(): boolean {
    const node = this.nodes[this.currentSlide];
    return node.prevInPath !== -1 || node.parent !== -1;
  }

  private lastStepOf(slideIndex: number): number {
    return this.stepCounts[slideIndex] - 1;
  }
}

/**
 * Finds the flat index of the last trunk (depth-0) slide, which marks the end of
 * the main talk for Home/End and progress reporting.
 */
function findLastTrunkIndex(nodes: readonly TreeNode[]): number {
  for (let index = nodes.length - 1; index >= 0; index--) {
    if (nodes[index].depth === 0) {
      return index;
    }
  }
  return nodes.length - 1;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
