import { protectCode } from './protectCode';

/**
 * Options for a slide's column regions, taken from its `columns` and
 * `columns-align` directives.
 */
export interface ColumnsOptions {
  /** Column width specification, e.g. `3`, `2:1`, `2fr 1fr` or `60% 40%`. */
  tracks?: string;
  /** Vertical alignment of the columns: `top`, `center`, `bottom` or `stretch`. */
  align?: string;
}

const COLUMN_BREAK_PATTERN =
  /^[ \t]*(?:<!--[ \t]*column[ \t]*-->|\[[ \t]*column[ \t]*\]:[ \t]*#)[ \t]*$/;
const COLUMNS_END_PATTERN =
  /^[ \t]*(?:<!--[ \t]*end-columns[ \t]*-->|\[[ \t]*end-columns[ \t]*\]:[ \t]*#)[ \t]*$/;

/**
 * Turns flat column markers into grid markup.
 *
 * Each `<!-- column -->` (or `[column]: #`) line starts a column; the first one
 * opens a column region, so content above it — typically the slide heading —
 * keeps the full width. A region runs until `<!-- end-columns -->` or the end of
 * the slide, and a slide may contain several regions.
 *
 * The transform runs before the markdown parser and pads the wrappers with blank
 * lines, so each column's content is still parsed as markdown blocks.
 */
export function applyColumns(markdown: string, options: ColumnsOptions = {}): string {
  const { text, restore } = protectCode(markdown);
  return restore(wrapColumnRegions(text, options));
}

function wrapColumnRegions(text: string, options: ColumnsOptions): string {
  const result: string[] = [];
  let columns: string[][] | null = null;

  const closeRegion = (): void => {
    if (columns === null) {
      return;
    }
    result.push(...renderRegion(columns, options));
    columns = null;
  };

  for (const line of text.split('\n')) {
    if (COLUMN_BREAK_PATTERN.test(line)) {
      columns ??= [];
      columns.push([]);
      continue;
    }

    if (COLUMNS_END_PATTERN.test(line)) {
      closeRegion();
      continue;
    }

    if (columns === null) {
      result.push(line);
      continue;
    }

    columns[columns.length - 1].push(line);
  }

  closeRegion();
  return result.join('\n');
}

/**
 * Renders one region as a grid container with one child per column. Blank lines
 * around every tag keep the wrappers recognisable as HTML blocks while their
 * contents stay markdown.
 */
function renderRegion(columns: string[][], options: ColumnsOptions): string[] {
  const lines = ['', `<div class="columns"${buildStyleAttribute(columns.length, options)}>`, ''];

  for (const column of columns) {
    lines.push('<div class="column">', '', column.join('\n').trim(), '', '</div>', '');
  }

  lines.push('</div>', '');
  return lines;
}

function buildStyleAttribute(columnCount: number, options: ColumnsOptions): string {
  const declarations = [`--columns-tracks:${resolveTracks(columnCount, options.tracks)}`];
  const alignment = resolveAlignment(options.align);
  if (alignment !== undefined) {
    declarations.push(`--columns-align:${alignment}`);
  }

  return ` style="${declarations.join(';')}"`;
}

const ALIGNMENTS: Record<string, string> = {
  top: 'start',
  center: 'center',
  bottom: 'end',
  stretch: 'stretch',
};

function resolveAlignment(align: string | undefined): string | undefined {
  if (align === undefined) {
    return undefined;
  }
  return ALIGNMENTS[align.trim().toLowerCase()];
}

const COLUMN_COUNT_PATTERN = /^\d+$/;
const UNITLESS_NUMBER_PATTERN = /^\d+(?:\.\d+)?$/;
const TRACK_PATTERN = /^(?:auto|\d+(?:\.\d+)?(?:fr|%|px|em|rem|cqw|cqh)?)$/;
const MAX_COLUMN_COUNT = 12;

/**
 * Resolves a `columns` directive to a `grid-template-columns` value. The value
 * is rebuilt from validated tokens rather than passed through, so no author
 * input can escape the inline style. Anything unrecognised falls back to equal
 * columns.
 */
function resolveTracks(columnCount: number, spec: string | undefined): string {
  const tokens = (spec ?? '').trim().split(/[\s:]+/).filter(Boolean);

  if (tokens.length === 1 && COLUMN_COUNT_PATTERN.test(tokens[0])) {
    return equalTracks(Number(tokens[0]));
  }

  if (tokens.length === 0 || !tokens.every((token) => TRACK_PATTERN.test(token))) {
    return equalTracks(columnCount);
  }

  return tokens.map(toTrack).join(' ');
}

function equalTracks(columnCount: number): string {
  const count = Math.min(Math.max(columnCount, 1), MAX_COLUMN_COUNT);
  return `repeat(${count}, minmax(0, 1fr))`;
}

/**
 * Wraps flexible tracks in `minmax(0, …)`, without which a wide child such as a
 * code block stretches its column beyond the slide.
 */
function toTrack(token: string): string {
  if (token === 'auto') {
    return token;
  }

  if (UNITLESS_NUMBER_PATTERN.test(token)) {
    return `minmax(0, ${token}fr)`;
  }

  if (token.endsWith('fr')) {
    return `minmax(0, ${token})`;
  }

  return token;
}
