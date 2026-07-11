import { describe, expect, it } from 'vitest';
import { formatHash, parseHash } from './hash';

describe('parseHash', () => {
  it('defaults to the presentation role for an empty hash', () => {
    expect(parseHash('')).toEqual({ role: 'presentation', channel: undefined });
  });

  it('reads the presenter role', () => {
    expect(parseHash('#presenter')).toEqual({ role: 'presenter', channel: undefined });
  });

  it('reads a presentation channel', () => {
    expect(parseHash('#presentation/de')).toEqual({ role: 'presentation', channel: 'de' });
  });

  it('reads a presenter channel', () => {
    expect(parseHash('#presenter/de')).toEqual({ role: 'presenter', channel: 'de' });
  });

  it('reads a 1-based slide position as a zero-based index', () => {
    expect(parseHash('#presenter@3')).toEqual({
      role: 'presenter',
      channel: undefined,
      slideIndex: 2,
      stepIndex: 0,
    });
  });

  it('reads a slide and reveal step', () => {
    expect(parseHash('#presentation/de@5.2')).toEqual({
      role: 'presentation',
      channel: 'de',
      slideIndex: 4,
      stepIndex: 2,
    });
  });

  it('ignores a malformed position', () => {
    expect(parseHash('#presenter@abc')).toEqual({ role: 'presenter', channel: undefined });
  });
});

describe('formatHash', () => {
  it('omits the channel when it equals the default', () => {
    const hash = formatHash({
      role: 'presentation',
      channel: 'main',
      defaultChannel: 'main',
      slideIndex: 0,
      stepIndex: 0,
    });
    expect(hash).toBe('#presentation@1');
  });

  it('includes a non-default channel', () => {
    const hash = formatHash({
      role: 'presentation',
      channel: 'de',
      defaultChannel: 'main',
      slideIndex: 2,
      stepIndex: 0,
    });
    expect(hash).toBe('#presentation/de@3');
  });

  it('includes a non-default channel for the presenter role', () => {
    const hash = formatHash({
      role: 'presenter',
      channel: 'de',
      defaultChannel: 'main',
      slideIndex: 2,
      stepIndex: 1,
    });
    expect(hash).toBe('#presenter/de@3.1');
  });

  it('omits the channel for the presenter role when it equals the default', () => {
    const hash = formatHash({
      role: 'presenter',
      channel: 'main',
      defaultChannel: 'main',
      slideIndex: 0,
      stepIndex: 0,
    });
    expect(hash).toBe('#presenter@1');
  });

  it('encodes the reveal step when present', () => {
    const hash = formatHash({
      role: 'presenter',
      defaultChannel: 'main',
      slideIndex: 2,
      stepIndex: 2,
    });
    expect(hash).toBe('#presenter@3.2');
  });

  it('round-trips through parseHash', () => {
    const hash = formatHash({
      role: 'presentation',
      channel: 'de',
      defaultChannel: 'main',
      slideIndex: 4,
      stepIndex: 1,
    });
    expect(parseHash(hash)).toEqual({
      role: 'presentation',
      channel: 'de',
      slideIndex: 4,
      stepIndex: 1,
    });
  });
});
