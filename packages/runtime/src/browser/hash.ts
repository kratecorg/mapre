import type { Role } from './controller';

/**
 * A window's location within the deck, decoded from or encoded into the URL
 * hash. The role and channel select the view; the optional position restores
 * the exact slide and reveal step on reload.
 */
export interface HashState {
  role: Role;
  channel?: string;
  slideIndex?: number;
  stepIndex?: number;
}

/**
 * Parses the URL hash into a {@link HashState}. The grammar is
 * `#<role>[/<channel>][@<slide>[.<step>]]`, where the slide is 1-based and the
 * step is an optional zero-based reveal index, e.g. `#presenter@3.2` or
 * `#presentation/de@5`.
 */
export function parseHash(hash: string): HashState {
  const [path, position] = hash.replace(/^#/, '').split('@');
  const [rolePart, channelPart] = path.split('/');
  const role: Role = rolePart === 'presenter' ? 'presenter' : 'presentation';
  const { slideIndex, stepIndex } = parsePosition(position);
  return { role, channel: channelPart || undefined, slideIndex, stepIndex };
}

/**
 * Encodes a {@link HashState} back into a URL hash. The channel is included only
 * when it differs from the deck's default channel, keeping default URLs clean.
 * The position is always encoded so a reload restores the exact spot.
 */
export function formatHash(state: HashState & { defaultChannel: string }): string {
  const base =
    state.role === 'presenter'
      ? 'presenter'
      : presentationSegment(state.channel ?? state.defaultChannel, state.defaultChannel);
  return `#${base}${formatPosition(state.slideIndex ?? 0, state.stepIndex ?? 0)}`;
}

function presentationSegment(channel: string, defaultChannel: string): string {
  return channel === defaultChannel ? 'presentation' : `presentation/${channel}`;
}

/**
 * Encodes a position as `@slide` (1-based) with an optional `.step` suffix for
 * revealed fragments, e.g. `@3` or `@3.2`.
 */
function formatPosition(slideIndex: number, stepIndex: number): string {
  const slide = slideIndex + 1;
  return stepIndex > 0 ? `@${slide}.${stepIndex}` : `@${slide}`;
}

/**
 * Parses a `slide.step` position suffix into zero-based indices. The slide part
 * is 1-based in the URL; the step is optional and zero-based. Returns an empty
 * object when the suffix is absent or malformed.
 */
function parsePosition(position: string | undefined): {
  slideIndex?: number;
  stepIndex?: number;
} {
  if (!position) {
    return {};
  }

  const [slidePart, stepPart] = position.split('.');
  const slide = Number(slidePart);
  if (!Number.isInteger(slide) || slide < 1) {
    return {};
  }

  const step = Number(stepPart);
  const stepIndex = Number.isInteger(step) && step >= 0 ? step : 0;
  return { slideIndex: slide - 1, stepIndex };
}
