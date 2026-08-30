import { protectCode } from './protectCode';

/**
 * Lightweight authoring markup that layers CSS-class hooks onto markdown,
 * without touching code spans or fenced code blocks.
 *
 * One form covers both inline and block usage: `.class[content]`. Several
 * classes chain as `.a.b[content]`, the bracketed content is matched with
 * balanced brackets, and it may itself contain markdown or nested class markup.
 *
 * The wrapper element is chosen by how the content starts:
 *
 * - Inline: `.red[wort]` (content begins on the same line) becomes
 *   `<span class="red">wort</span>`.
 * - Block: `.left-col[` followed by a newline becomes
 *   `<div class="left-col"> … </div>`, with blank lines inserted so the wrapped
 *   content is parsed as markdown blocks. A block wrapper may legally contain
 *   paragraphs, lists and headings — a span may not.
 *
 * The transform runs before the markdown parser, so the parser renders the
 * wrapper contents normally.
 */
export function applyMarkup(markdown: string): string {
  const { text, restore } = protectCode(markdown);
  return restore(applyClassMarkup(text));
}

const CLASS_RUN_PATTERN = /^(?:\.[-\w]+)+/;
const BLOCK_START_PATTERN = /^[ \t]*\r?\n/;

/**
 * Replaces `.class[content]` runs with a `<span>` (inline) or `<div>` (block)
 * carrying the classes, using balanced-bracket matching and recursing into the
 * content so nested markup works.
 */
function applyClassMarkup(text: string): string {
  let result = '';
  let index = 0;

  while (index < text.length) {
    const character = text[index];
    if (character === '.' && isClassBoundary(text, index)) {
      const match = text.slice(index).match(CLASS_RUN_PATTERN);
      if (match && text[index + match[0].length] === '[') {
        const openBracket = index + match[0].length;
        const closeBracket = findMatchingBracket(text, openBracket);
        if (closeBracket !== -1) {
          const classes = match[0].slice(1).split('.').join(' ');
          const inner = text.slice(openBracket + 1, closeBracket);
          result += wrap(classes, applyClassMarkup(inner), BLOCK_START_PATTERN.test(inner));
          index = closeBracket + 1;
          continue;
        }
      }
    }

    result += character;
    index += 1;
  }

  return result;
}

/**
 * Wraps processed content in a block `<div>` or an inline `<span>`. Block
 * wrappers are padded with blank lines so the parser treats the tag as an HTML
 * block and the content as markdown.
 */
function wrap(classes: string, content: string, block: boolean): string {
  if (block) {
    return `\n\n<div class="${classes}">\n\n${content.trim()}\n\n</div>\n\n`;
  }
  return `<span class="${classes}">${content}</span>`;
}

/**
 * A class run may only start at a boundary, so filenames like `logo.png[…]` or a
 * trailing `word.foo[` inside prose are left untouched.
 */
function isClassBoundary(text: string, index: number): boolean {
  if (index === 0) {
    return true;
  }
  return !/[\w.\]]/.test(text[index - 1]);
}

/**
 * Returns the index of the `]` that closes the `[` at `openIndex`, accounting for
 * nested brackets (e.g. an image `![alt]` inside the content), or -1 if unbalanced.
 */
function findMatchingBracket(text: string, openIndex: number): number {
  let depth = 0;
  for (let index = openIndex; index < text.length; index += 1) {
    if (text[index] === '[') {
      depth += 1;
    } else if (text[index] === ']') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }
  return -1;
}
