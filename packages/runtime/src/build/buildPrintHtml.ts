import { DEFAULT_CHANNEL, parseDeck, renderSlide } from '@mapre/core';
import { parseAspectRatio } from '../browser/aspect';
import { collectChannels } from '../core/channels';
import { assemblePrintHtml } from './assemblePrintHtml';

const DEFAULT_TITLE = 'mapre presentation';

/**
 * Options for {@link buildPrintHtml}.
 */
export interface BuildPrintHtmlOptions {
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
  const deck = parseDeck(markdown);
  const title = options.title ?? deck.metadata.title ?? DEFAULT_TITLE;
  const aspect = parseAspectRatio(deck.metadata.aspect);
  const slideCount = deck.slides.length;
  const deckVariables = toStringRecord(deck.metadata);

  const pages = deck.slides.map((slide, index) =>
    renderSlide(slide, {
      channel: options.channel,
      templates: options.templates,
      variables: {
        ...deckVariables,
        pageNumber: String(index + 1),
        slideCount: String(slideCount),
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
 * Lists the channels a deck should be exported for: the deck's default channel
 * first, then every other channel used across its slides, sorted alphabetically.
 */
export function listDeckChannels(markdown: string): string[] {
  const deck = parseDeck(markdown);
  const defaultChannel = deck.metadata.defaultChannel ?? DEFAULT_CHANNEL;
  return collectChannels(deck, defaultChannel);
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
