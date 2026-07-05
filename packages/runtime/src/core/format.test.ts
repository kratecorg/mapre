import { describe, expect, it } from 'vitest';
import { formatDuration } from './format';

describe('formatDuration', () => {
  it('formats sub-minute durations as mm:ss', () => {
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(5000)).toBe('00:05');
    expect(formatDuration(65_000)).toBe('01:05');
  });

  it('adds an hours segment once past an hour', () => {
    expect(formatDuration(3_600_000)).toBe('1:00:00');
    expect(formatDuration(3_725_000)).toBe('1:02:05');
  });

  it('treats negative values as zero', () => {
    expect(formatDuration(-1000)).toBe('00:00');
  });
});
