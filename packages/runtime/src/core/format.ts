const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_HOUR = SECONDS_PER_MINUTE * MINUTES_PER_HOUR;

/**
 * Formats a duration in milliseconds as `mm:ss`, or `h:mm:ss` once it reaches an
 * hour. Negative values are treated as zero.
 */
export function formatDuration(totalMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(totalMs / MS_PER_SECOND));
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE) % MINUTES_PER_HOUR;
  const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR);

  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(seconds).padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  }

  return `${paddedMinutes}:${paddedSeconds}`;
}
