import { buildDeckTree, DEFAULT_CHANNEL, renderSlide } from '@mapre/core';
import type { DeckSourceSegment, DeckTree } from '@mapre/core';
import { parseAspectRatio } from '../browser/aspect';
import { collectChannels } from '../core/channels';
import { assemblePrintHtml } from './assemblePrintHtml';

const DEFAULT_TITLE = 'mapre presentation';

/**
 * Options for {@link buildPrintHtml}.
 */
export interface BuildPrintHtmlOptions {
  /**
   * Optional multi-level source tree. When given, every slide (trunk and detail)
   * is printed in depth-first order with hierarchical page numbers; otherwise the
   * plain markdown is printed as a flat deck.
   */
  sourceTree?: DeckSourceSegment;
  /**
   * Which channel to render. When omitted, each slide's default content is
   * used. A channel without its own content falls back to the default.
   */
  channel?: string;
  /**
   * Overrides the document title. Defaults to the deck's front-matter `title`,
   * or a generic fallback when none is set.
   */
  title?: string;
  /**
   * Optional author stylesheet inlined after the baseline styles, so it wins by
   * cascade order. Comes from a deck's `stylesheet` directive and/or a project's
   * `style/` folder.
   */
  extraStyles?: string;
  /**
   * Optional named HTML templates for slides that select one via their
   * `template` directive.
   */
  templates?: Record<string, string>;
  /** Optional baseline style override; passed through to the assembler. */
  styles?: string;
}

/**
 * Builds a self-contained, print-optimised HTML document for one channel of a
 * deck. Every slide is pre-rendered (with all fragments revealed) and laid out
 * on its own page sized to the deck's aspect ratio, so a browser's
 * "Print to PDF" yields one full-bleed slide per PDF page.
 */
export function buildPrintHtml(markdown: string, options: BuildPrintHtmlOptions = {}): string {
  const tree = options.sourceTree ? buildDeckTree(options.sourceTree) : flatTree(markdown);
  const title = options.title ?? tree.metadata.title ?? DEFAULT_TITLE;
  const aspect = parseAspectRatio(tree.metadata.aspect);
  const deckVariables = toStringRecord(tree.metadata);

  const pages = tree.slides.map((slide, index) =>
    renderSlide(slide, {
      channel: options.channel,
      templates: options.templates,
      variables: {
        ...deckVariables,
        pageNumber: tree.nodes[index]?.pathLabel ?? String(index + 1),
        slideCount: String(tree.trunkCount),
      },
    }),
  );

  return assemblePrintHtml({
    title,
    pages,
    aspect,
    styles: options.styles,
    extraStyles: options.extraStyles,
  });
}

/**
 * Wraps plain markdown in a trunk-only {@link DeckTree}, so print rendering has a
 * single code path whether or not a multi-level source tree is provided.
 */
function flatTree(markdown: string): DeckTree {
  return buildDeckTree({ markdown, details: [] });
}

/**
 * Lists the channels a deck should be exported for: the deck's default channel
 * first, then every other channel used across its slides, sorted alphabetically.
 * Includes detail slides when a multi-level source tree is provided.
 */
export function listDeckChannels(markdown: string, sourceTree?: DeckSourceSegment): string[] {
  const tree = sourceTree ? buildDeckTree(sourceTree) : flatTree(markdown);
  const defaultChannel = tree.metadata.defaultChannel ?? DEFAULT_CHANNEL;
  return collectChannels({ metadata: tree.metadata, slides: tree.slides }, defaultChannel);
}

/**
 * Narrows a metadata record to defined string values, so it can seed template
 * variables without carrying `undefined` entries.
 */
function toStringRecord(metadata: Record<string, string | undefined>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}
