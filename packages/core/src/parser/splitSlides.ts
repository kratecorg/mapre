const SLIDE_SEPARATOR_PATTERN = /^-{3,}[ \t]*$/;
const FENCE_PATTERN = /^\s*(```+|~~~+)/;

/**
 * Splits a markdown document into raw slide chunks on standalone `---` lines.
 *
 * Separators inside fenced code blocks are ignored so that horizontal rules or
 * `---` lines within code samples do not accidentally break a slide. Callers are
 * responsible for filtering out empty chunks if they are not wanted.
 */
export function splitSlides(markdown: string): string[] {
  const lines = markdown.split('\n');
  const slides: string[] = [];
  let current: string[] = [];
  let openFence: string | null = null;

  for (const line of lines) {
    const fenceMatch = line.match(FENCE_PATTERN);
    if (fenceMatch) {
      if (openFence === null) {
        openFence = fenceMatch[1];
      } else if (line.trimStart().startsWith(openFence)) {
        openFence = null;
      }
      current.push(line);
      continue;
    }

    if (openFence === null && SLIDE_SEPARATOR_PATTERN.test(line)) {
      slides.push(current.join('\n').trim());
      current = [];
      continue;
    }

    current.push(line);
  }

  slides.push(current.join('\n').trim());
  return slides;
}
