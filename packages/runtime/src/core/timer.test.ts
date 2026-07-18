import { describe, expect, it } from 'vitest';
import { Timer } from './timer';

/**
 * A controllable clock so timer behaviour can be tested deterministically.
 */
function fakeClock(): { now: () => number; advance: (ms: number) => void } {
  let current = 0;
  return {
    now: () => current,
    advance: (ms: number) => {
      current += ms;
    },
  };
}

describe('Timer', () => {
  it('starts at zero and is not running', () => {
    const timer = new Timer(() => 0);

    expect(timer.isRunning).toBe(false);
    expect(timer.elapsedMs()).toBe(0);
  });

  it('accumulates elapsed time while running', () => {
    const clock = fakeClock();
    const timer = new Timer(clock.now);

    timer.start();
    clock.advance(1500);

    expect(timer.isRunning).toBe(true);
    expect(timer.elapsedMs()).toBe(1500);
  });

  it('freezes elapsed time while paused', () => {
    const clock = fakeClock();
    const timer = new Timer(clock.now);

    timer.start();
    clock.advance(1000);
    timer.pause();
    clock.advance(5000);

    expect(timer.isRunning).toBe(false);
    expect(timer.elapsedMs()).toBe(1000);
  });

  it('resumes from the accumulated time', () => {
    const clock = fakeClock();
    const timer = new Timer(clock.now);

    timer.start();
    clock.advance(1000);
    timer.pause();
    timer.start();
    clock.advance(500);

    expect(timer.elapsedMs()).toBe(1500);
  });

  it('resets to zero', () => {
    const clock = fakeClock();
    const timer = new Timer(clock.now);

    timer.start();
    clock.advance(2000);
    timer.reset();

    expect(timer.isRunning).toBe(false);
    expect(timer.elapsedMs()).toBe(0);
  });

  it('toggles between running and paused', () => {
    const clock = fakeClock();
    const timer = new Timer(clock.now);

    timer.toggle();
    expect(timer.isRunning).toBe(true);
    timer.toggle();
    expect(timer.isRunning).toBe(false);
  });

  it('restores a paused state', () => {
    const clock = fakeClock();
    const timer = new Timer(clock.now);

    timer.restore({ running: false, accumulatedMs: 2000, startedAt: 0 });

    expect(timer.isRunning).toBe(false);
    expect(timer.elapsedMs()).toBe(2000);
  });

  it('keeps advancing a restored running timer across the stored gap', () => {
    const clock = fakeClock();
    clock.advance(10000);
    const timer = new Timer(clock.now);

    // Simulates a reload: the timer was started 3s ago and stays running.
    timer.restore({ running: true, accumulatedMs: 0, startedAt: 7000 });

    expect(timer.isRunning).toBe(true);
    expect(timer.elapsedMs()).toBe(3000);
  });

  it('round-trips its state via getState/restore', () => {
    const clock = fakeClock();
    const source = new Timer(clock.now);
    source.start();
    clock.advance(1200);
    source.pause();

    const target = new Timer(clock.now);
    target.restore(source.getState());

    expect(target.isRunning).toBe(false);
    expect(target.elapsedMs()).toBe(1200);
  });
});
