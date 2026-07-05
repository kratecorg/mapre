import { describe, expect, it } from 'vitest';
import { Navigation } from './navigation';

describe('Navigation', () => {
  it('rejects an empty deck', () => {
    expect(() => new Navigation([])).toThrow();
  });

  it('starts at the first slide and step', () => {
    const nav = new Navigation([1, 1]);

    expect(nav.slideIndex).toBe(0);
    expect(nav.stepIndex).toBe(0);
    expect(nav.isFirst).toBe(true);
  });

  it('reveals fragments before advancing to the next slide', () => {
    const nav = new Navigation([3, 1]);

    expect(nav.next()).toBe(true);
    expect(nav.stepIndex).toBe(1);
    expect(nav.next()).toBe(true);
    expect(nav.stepIndex).toBe(2);

    expect(nav.next()).toBe(true);
    expect(nav.slideIndex).toBe(1);
    expect(nav.stepIndex).toBe(0);
  });

  it('does not advance past the last step of the last slide', () => {
    const nav = new Navigation([1, 2]);

    nav.next();
    nav.next();

    expect(nav.isLast).toBe(true);
    expect(nav.next()).toBe(false);
    expect(nav.slideIndex).toBe(1);
    expect(nav.stepIndex).toBe(1);
  });

  it('steps back into the fully revealed previous slide', () => {
    const nav = new Navigation([3, 1]);
    nav.next();
    nav.next();
    nav.next();

    expect(nav.slideIndex).toBe(1);
    expect(nav.previous()).toBe(true);
    expect(nav.slideIndex).toBe(0);
    expect(nav.stepIndex).toBe(2);
  });

  it('does not move before the first slide', () => {
    const nav = new Navigation([2, 1]);

    expect(nav.previous()).toBe(false);
    expect(nav.isFirst).toBe(true);
  });

  it('jumps to a slide and resets the step', () => {
    const nav = new Navigation([3, 2, 1]);
    nav.next();
    nav.next();

    expect(nav.goToSlide(2)).toBe(true);
    expect(nav.slideIndex).toBe(2);
    expect(nav.stepIndex).toBe(0);
  });

  it('ignores out-of-range or redundant jumps', () => {
    const nav = new Navigation([2, 1]);

    expect(nav.goToSlide(-1)).toBe(false);
    expect(nav.goToSlide(5)).toBe(false);
    expect(nav.goToSlide(0)).toBe(false);
  });

  it('clamps an out-of-range start position', () => {
    const nav = new Navigation([2, 2], { slideIndex: 9, stepIndex: 9 });

    expect(nav.slideIndex).toBe(1);
    expect(nav.stepIndex).toBe(1);
  });
});
