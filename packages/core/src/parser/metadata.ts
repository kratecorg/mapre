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
  if (!match) {
    return { metadata: {}, body: markdown };
  }

  return {
    metadata: parseKeyValueBlock(match[1]),
    body: markdown.slice(match[0].length),
  };
}

const DIRECTIVE_PATTERN = /^<!--\s*([^:<>]+?)\s*:\s*(.*?)\s*-->$/;

/**
 * Extracts leading `<!-- key: value -->` directive comments from a slide as
 * slide-level metadata. Parsing stops at the first line that is neither blank
 * nor a directive, so directives must appear at the top of the slide.
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

    const match = line.match(DIRECTIVE_PATTERN);
    if (!match) {
      break;
    }

    metadata[match[1].trim()] = match[2].trim();
    index++;
  }

  return {
    metadata,
    body: lines.slice(index).join('\n').trim(),
  };
}
