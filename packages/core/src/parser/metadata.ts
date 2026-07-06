/**
 * Parses a simple `key: value` block into a record. Blank lines and lines
 * without a colon are ignored. Only the first colon separates key and value, so
 * values may contain colons (e.g. `aspect: 16:9`).
 */
export function parseKeyValueBlock(text: string): Record<string, string> {
  const result: Record<string, string> = {};

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (line === '') {
      continue;
    }

    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    if (key === '') {
      continue;
    }

    result[key] = line.slice(separatorIndex + 1).trim();
  }

  return result;
}

const FRONT_MATTER_PATTERN = /^---[ \t]*\n([\s\S]*?)\n---[ \t]*(?:\n|$)/;

/**
 * Extracts an optional leading front matter block delimited by `---` fences.
 * The block is only recognised at the very start of the document, which keeps
 * it from clashing with `---` slide separators later in the deck.
 */
export function extractFrontMatter(markdown: string): {
  metadata: Record<string, string>;
  body: string;
} {
  const match = markdown.match(FRONT_MATTER_PATTERN);
  if (match) {
    return {
      metadata: parseKeyValueBlock(match[1]),
      body: markdown.slice(match[0].length),
    };
  }

  const leadingBlock = extractLeadingDirectiveBlock(markdown);
  if (leadingBlock) {
    return leadingBlock;
  }

  return { metadata: {}, body: markdown };
}

/**
 * Extracts a deck-level metadata block written as a leading run of directive
 * lines (`[key: value]: #` or `<!-- key: value -->`) at the very start of the
 * document. The block must be terminated by a blank line; if non-directive
 * content appears before any blank line, the directives belong to the first
 * slide instead and this returns null.
 */
function extractLeadingDirectiveBlock(markdown: string): {
  metadata: Record<string, string>;
  body: string;
} | null {
  const lines = markdown.split('\n');
  const metadata: Record<string, string> = {};
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (line === '') {
      break;
    }

    const directive = matchDirective(line);
    if (!directive) {
      return null;
    }

    metadata[directive.key] = directive.value;
    index++;
  }

  if (index === 0 || index >= lines.length) {
    return null;
  }

  return { metadata, body: lines.slice(index + 1).join('\n') };
}

const HTML_DIRECTIVE_PATTERN = /^<!--\s*([^:<>]+?)\s*:\s*(.*?)\s*-->$/;
const LINK_REFERENCE_DIRECTIVE_PATTERN = /^\[\s*([^:\]]+?)\s*:\s*(.*?)\s*\]:\s*#\s*$/;

/**
 * Recognises a single directive line in either supported form:
 * `<!-- key: value -->` or the markdown link-reference form `[key: value]: #`.
 * Returns the parsed key/value, or null when the line is not a directive.
 */
export function matchDirective(line: string): { key: string; value: string } | null {
  const html = line.match(HTML_DIRECTIVE_PATTERN);
  if (html) {
    return { key: html[1].trim(), value: html[2].trim() };
  }

  const linkReference = line.match(LINK_REFERENCE_DIRECTIVE_PATTERN);
  if (linkReference) {
    return { key: linkReference[1].trim(), value: linkReference[2].trim() };
  }

  return null;
}

/**
 * Extracts leading directive lines from a slide as slide-level metadata. Parsing
 * stops at the first line that is neither blank nor a directive, and also at a
 * `channel` directive, which begins a channel section rather than metadata.
 */
export function extractSlideMetadata(content: string): {
  metadata: Record<string, string>;
  body: string;
} {
  const lines = content.split('\n');
  const metadata: Record<string, string> = {};
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();

    if (line === '') {
      index++;
      continue;
    }

    const directive = matchDirective(line);
    if (!directive || directive.key === 'channel') {
      break;
    }

    metadata[directive.key] = directive.value;
    index++;
  }

  return {
    metadata,
    body: lines.slice(index).join('\n').trim(),
  };
}
