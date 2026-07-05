/**
 * The current position within a deck: which slide and which reveal step.
 */
export interface NavigationState {
  slideIndex: number;
  stepIndex: number;
}

/**
 * Pure navigation state machine for a deck. It is deliberately DOM- and
 * framework-free so the same logic drives the browser client, the presenter
 * view, and unit tests alike.
 *
 * Each slide has one or more reveal steps (progressive fragments). Advancing
 * walks through the steps of the current slide before moving on to the next
 * slide, mirroring how a presenter clicks through content.
 */
export class Navigation {
  private currentSlide: number;
  private currentStep: number;

  constructor(
    private readonly stepCounts: readonly number[],
    start: NavigationState = { slideIndex: 0, stepIndex: 0 },
  ) {
    if (stepCounts.length === 0) {
      throw new Error('A deck needs at least one slide.');
    }

    this.currentSlide = clamp(start.slideIndex, 0, stepCounts.length - 1);
    this.currentStep = clamp(start.stepIndex, 0, this.lastStepOf(this.currentSlide));
  }

  get slideIndex(): number {
    return this.currentSlide;
  }

  get stepIndex(): number {
    return this.currentStep;
  }

  get slideCount(): number {
    return this.stepCounts.length;
  }

  get isFirst(): boolean {
    return this.currentSlide === 0 && this.currentStep === 0;
  }

  get isLast(): boolean {
    const onLastSlide = this.currentSlide === this.stepCounts.length - 1;
    return onLastSlide && this.currentStep === this.lastStepOf(this.currentSlide);
  }

  /**
   * Reveals the next fragment, or moves to the start of the next slide when the
   * current slide is fully revealed. Returns whether the position changed.
   */
  next(): boolean {
    if (this.currentStep < this.lastStepOf(this.currentSlide)) {
      this.currentStep++;
      return true;
    }

    if (this.currentSlide < this.stepCounts.length - 1) {
      this.currentSlide++;
      this.currentStep = 0;
      return true;
    }

    return false;
  }

  /**
   * Hides the last revealed fragment, or moves to the fully revealed previous
   * slide. Returns whether the position changed.
   */
  previous(): boolean {
    if (this.currentStep > 0) {
      this.currentStep--;
      return true;
    }

    if (this.currentSlide > 0) {
      this.currentSlide--;
      this.currentStep = this.lastStepOf(this.currentSlide);
      return true;
    }

    return false;
  }

  /**
   * Jumps to the start of the given slide. Returns whether the position changed.
   */
  goToSlide(slideIndex: number): boolean {
    if (slideIndex < 0 || slideIndex >= this.stepCounts.length) {
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
   * slide's range. Used to apply state received from another window. Returns
   * whether the position changed.
   */
  goTo(slideIndex: number, stepIndex: number): boolean {
    if (slideIndex < 0 || slideIndex >= this.stepCounts.length) {
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

  private lastStepOf(slideIndex: number): number {
    return this.stepCounts[slideIndex] - 1;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
