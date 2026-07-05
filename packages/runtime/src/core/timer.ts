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
}
