import { describe, expect, it } from 'vitest';
import { parseAspectRatio } from './aspect';

describe('parseAspectRatio', () => {
  it('parses a "W:H" ratio', () => {
    expect(parseAspectRatio('16:9')).toEqual({ width: 16, height: 9 });
  });

  it('parses a "W/H" ratio', () => {
    expect(parseAspectRatio('4/3')).toEqual({ width: 4, height: 3 });
  });

  it('tolerates surrounding whitespace and decimals', () => {
    expect(parseAspectRatio(' 1.85 : 1 ')).toEqual({ width: 1.85, height: 1 });
  });

  it('defaults to 16:9 when unset', () => {
    expect(parseAspectRatio(undefined)).toEqual({ width: 16, height: 9 });
  });

  it('defaults to 16:9 for malformed values', () => {
    expect(parseAspectRatio('widescreen')).toEqual({ width: 16, height: 9 });
  });

  it('defaults to 16:9 for non-positive values', () => {
    expect(parseAspectRatio('0:9')).toEqual({ width: 16, height: 9 });
  });
});
