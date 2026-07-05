/**
 * Progressive-reveal fragment system based on `@N` markers.
 *
 * A pair of `@N` markers wraps content that becomes visible once at least `N`
 * fragments are revealed. Markers can wrap whole blocks (when on their own line)
 * or inline spans, and they work both in prose and inside fenced code blocks.
 */

/**
 * Returns the highest fragment level (`@N`) found in the markdown, which equals
 * the number of progressive-reveal steps on a slide.
 */
export function detectMaxFragmentLevel(markdown: string): number {
  const matches = markdown.matchAll(/@(\d+)/g);
  let max = 0;
  for (const match of matches) {
    const level = Number.parseInt(match[1], 10);
    if (level > max) {
      max = level;
    }
  }
  return max;
}

/**
 * Rewrites `@N` fragment markers into `hidden-fragment` wrappers based on how
 * many fragments are currently revealed. Content at or below `fragmentLevel`
 * stays visible; everything above is wrapped so it can be hidden via CSS.
 */
export function preprocessFragments(markdown: string, fragmentLevel: number): string {
  const lines = markdown.split('\n');
  const result: string[] = [];
  const blockStack: Array<{ level: number }> = [];
  let inHiddenDiv = false;
  let index = 0;

  function shouldBeHidden(): boolean {
    return blockStack.some((block) => fragmentLevel < block.level);
  }

  function openHiddenDiv(): void {
    if (inHiddenDiv) {
      return;
    }
    result.push('<div class="hidden-fragment">');
    result.push('');
    inHiddenDiv = true;
  }

  function closeHiddenDiv(): void {
    if (!inHiddenDiv) {
      return;
    }
    result.push('');
    result.push('</div>');
    inHiddenDiv = false;
  }

  while (index < lines.length) {
    const line = lines[index];

    if (isCodeFenceStart(line)) {
      closeHiddenDiv();
      const { codeBlock, nextIndex } = collectCodeBlock(lines, index);
      result.push(processCodeBlockFragments(codeBlock, fragmentLevel, blockStack));
      index = nextIndex;
      continue;
    }

    const markerMatch = line.match(/^@(\d+)\s*$/);
    if (markerMatch) {
      const wasHidden = shouldBeHidden();
      toggleBlockLevel(blockStack, Number.parseInt(markerMatch[1], 10));
      const isHidden = shouldBeHidden();

      if (wasHidden && !isHidden) {
        closeHiddenDiv();
      }

      index++;
      continue;
    }

    if (shouldBeHidden()) {
      if (!inHiddenDiv && line.trim() === '') {
        result.push(line);
        index++;
        continue;
      }
      openHiddenDiv();
    } else {
      closeHiddenDiv();
    }

    result.push(line);
    index++;
  }

  closeHiddenDiv();
  return processInlineFragments(result.join('\n'), fragmentLevel);
}

function processInlineFragments(markdown: string, fragmentLevel: number): string {
  const maxLevel = detectMaxFragmentLevel(markdown);

  let processed = markdown;
  for (let level = maxLevel; level >= 1; level--) {
    const shouldReveal = fragmentLevel >= level;
    const pattern = new RegExp(`@${level}(.*?)@${level}`, 'gs');

    processed = processed.replace(pattern, (_match, content) => {
      if (shouldReveal) {
        return content;
      }
      return `<span class="hidden-fragment">${content}</span>`;
    });
  }

  return processed;
}

function isCodeFenceStart(line: string): boolean {
  return /^\s*```/.test(line);
}

function collectCodeBlock(
  lines: string[],
  startIndex: number,
): { codeBlock: string; nextIndex: number } {
  const openingFence = lines[startIndex].match(/^\s*(```+)/)?.[1] ?? '```';
  let endIndex = startIndex + 1;

  while (endIndex < lines.length && !lines[endIndex].trimStart().startsWith(openingFence)) {
    endIndex++;
  }

  if (endIndex < lines.length) {
    endIndex++;
  }

  return {
    codeBlock: lines.slice(startIndex, endIndex).join('\n'),
    nextIndex: endIndex,
  };
}

function toggleBlockLevel(blockStack: Array<{ level: number }>, level: number): void {
  const openBlockIndex = findLastIndex(blockStack, (block) => block.level === level);

  if (openBlockIndex >= 0) {
    blockStack.splice(openBlockIndex, 1);
  } else {
    blockStack.push({ level });
  }
}

function processCodeBlockFragments(
  codeBlock: string,
  fragmentLevel: number,
  outerBlockStack: Array<{ level: number }> = [],
): string {
  const lines = codeBlock.split('\n');
  if (lines.length < 2) {
    return processInlineFragments(codeBlock, fragmentLevel);
  }

  const openingFence = lines[0];
  const hasClosingFence = lines.length > 1 && lines[lines.length - 1].trim().startsWith('```');
  const codeLines = lines.slice(1, hasClosingFence ? -1 : undefined);
  const closingFence = hasClosingFence ? lines[lines.length - 1] : undefined;
  const processedCode = processCodeBlockMarkers(codeLines, fragmentLevel, outerBlockStack);

  return [openingFence, processedCode, ...(closingFence ? [closingFence] : [])].join('\n');
}

function processCodeBlockMarkers(
  lines: string[],
  fragmentLevel: number,
  outerBlockStack: Array<{ level: number }>,
): string {
  const result: string[] = [];
  const blockStack: Array<{ level: number; outer: boolean }> = outerBlockStack.map((block) => ({
    ...block,
    outer: true,
  }));
  let pendingPrefix = blockStack.some((block) => fragmentLevel < block.level)
    ? '<span class="hidden-fragment">'
    : '';
  let inHiddenSpan = pendingPrefix.length > 0;

  function shouldBeHidden(): boolean {
    return blockStack.some((block) => fragmentLevel < block.level);
  }

  function openHiddenSpan(): void {
    pendingPrefix += '<span class="hidden-fragment">';
    inHiddenSpan = true;
  }

  function closeHiddenSpan(): void {
    if (pendingPrefix) {
      pendingPrefix += '</span>';
    } else if (result.length > 0) {
      result[result.length - 1] += '</span>';
    }
    inHiddenSpan = false;
  }

  for (const line of lines) {
    const match = line.match(/^\s*@(\d+)\s*$/);

    if (match) {
      const wasHidden = shouldBeHidden();
      const level = Number.parseInt(match[1], 10);
      const openBlockIndex = findLastIndex(
        blockStack,
        (block) => block.level === level && !block.outer,
      );

      if (openBlockIndex >= 0) {
        blockStack.splice(openBlockIndex, 1);
      } else {
        blockStack.push({ level, outer: false });
      }

      const isHidden = shouldBeHidden();
      if (!wasHidden && isHidden) {
        openHiddenSpan();
      }
      if (wasHidden && !isHidden) {
        closeHiddenSpan();
      }
      continue;
    }

    result.push(`${pendingPrefix}${line}`);
    pendingPrefix = '';
  }

  if (inHiddenSpan) {
    closeHiddenSpan();
  }
  if (pendingPrefix) {
    result.push(pendingPrefix);
  }

  return result.join('\n');
}

function findLastIndex<T>(array: T[], predicate: (item: T) => boolean): number {
  for (let i = array.length - 1; i >= 0; i--) {
    if (predicate(array[i])) {
      return i;
    }
  }
  return -1;
}

/**
 * Repairs `hidden-fragment` spans that Marked escaped while rendering fenced
 * code blocks, restoring them to real HTML tags.
 */
export function postprocessFragments(html: string): string {
  return html.replace(/<code([^>]*)>([\s\S]*?)<\/code>/g, (_match, attrs, content) => {
    const repaired = content
      .replace(/&lt;span class=&quot;hidden-fragment&quot;&gt;/g, '<span class="hidden-fragment">')
      .replace(/&lt;\/span&gt;/g, '</span>');
    return `<code${attrs}>${repaired}</code>`;
  });
}
