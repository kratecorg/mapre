/**
 * The width/height ratio of the slide box. Slides are laid out on a box of this
 * shape, letterboxed into the available space.
 */
export interface AspectRatio {
  width: number;
  height: number;
}

const DEFAULT_ASPECT_RATIO: AspectRatio = { width: 16, height: 9 };
const ASPECT_PATTERN = /^(\d+(?:\.\d+)?)\s*[:/]\s*(\d+(?:\.\d+)?)$/;

/**
 * Parses an aspect ratio written as `W:H` or `W/H` (e.g. `16:9`, `4:3`). Falls
 * back to 16:9 for missing, malformed, or non-positive values so the slide box
 * always has a sane shape.
 */
export function parseAspectRatio(value: string | undefined): AspectRatio {
  if (value === undefined) {
    return DEFAULT_ASPECT_RATIO;
  }

  const match = value.trim().match(ASPECT_PATTERN);
  if (!match) {
    return DEFAULT_ASPECT_RATIO;
  }

  const width = Number(match[1]);
  const height = Number(match[2]);
  if (width <= 0 || height <= 0) {
    return DEFAULT_ASPECT_RATIO;
  }

  return { width, height };
}

/**
 * Applies the parsed aspect ratio to an element as the `--aspect-w` and
 * `--aspect-h` custom properties that the slide-box CSS derives its shape from.
 */
export function applyAspectRatio(element: HTMLElement, value: string | undefined): void {
  const { width, height } = parseAspectRatio(value);
  element.style.setProperty('--aspect-w', String(width));
  element.style.setProperty('--aspect-h', String(height));
}
