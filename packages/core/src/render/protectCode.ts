const PLACEHOLDER_PREFIX = '\u0000';
const PLACEHOLDER_SUFFIX = '\u0001';

/**
 * A masked markdown text plus the function that puts the original code back.
 */
export interface ProtectedCode {
  text: string;
  restore: (text: string) => string;
}

/**
 * Replaces fenced code blocks and inline code with single-token placeholders so
 * markup transforms never rewrite anything inside code. Returns the masked text
 * and a function that restores the originals.
 */
export function protectCode(markdown: string): ProtectedCode {
  const store: string[] = [];
  const stash = (match: string): string => {
    const index = store.length;
    store.push(match);
    return `${PLACEHOLDER_PREFIX}${index}${PLACEHOLDER_SUFFIX}`;
  };

  let text = markdown.replace(/```[\s\S]*?```/g, stash);
  text = text.replace(/`[^`\n]*`/g, stash);

  const restore = (value: string): string =>
    value.replace(
      new RegExp(`${PLACEHOLDER_PREFIX}(\\d+)${PLACEHOLDER_SUFFIX}`, 'g'),
      (_match, index: string) => store[Number(index)],
    );

  return { text, restore };
}
