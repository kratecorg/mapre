/**
 * A serialisable snapshot of a {@link Timer}. Because `startedAt` is an absolute
 * timestamp from the same clock as `now`, a running timer keeps advancing across
 * the gap while it is stored (e.g. during a page reload).
 */
export interface TimerState {
  running: boolean;
  accumulatedMs: number;
  startedAt: number;
}

/**
 * A simple stopwatch for the presenter view. Time comes from an injectable
 * `now` function so the timer can be unit tested with a fake clock and stays
 * free of any global-time or DOM dependencies.
 */
export class Timer {
  private running = false;
  private accumulatedMs = 0;
  private startedAt = 0;

  constructor(private readonly now: () => number = () => Date.now()) {}

  get isRunning(): boolean {
    return this.running;
  }

  start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    this.startedAt = this.now();
  }

  pause(): void {
    if (!this.running) {
      return;
    }

    this.accumulatedMs += this.now() - this.startedAt;
    this.running = false;
  }

  reset(): void {
    this.running = false;
    this.accumulatedMs = 0;
    this.startedAt = 0;
  }

  /** Toggles between running and paused. */
  toggle(): void {
    if (this.running) {
      this.pause();
      return;
    }

    this.start();
  }

  elapsedMs(): number {
    if (this.running) {
      return this.accumulatedMs + (this.now() - this.startedAt);
    }

    return this.accumulatedMs;
  }

  /** Captures the current state so it can be restored later. */
  getState(): TimerState {
    return {
      running: this.running,
      accumulatedMs: this.accumulatedMs,
      startedAt: this.startedAt,
    };
  }

  /** Restores a previously captured state, e.g. after a page reload. */
  restore(state: TimerState): void {
    this.running = state.running;
    this.accumulatedMs = state.accumulatedMs;
    this.startedAt = state.startedAt;
  }
}
