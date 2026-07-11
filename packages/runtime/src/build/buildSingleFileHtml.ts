import { parseDeck } from '@mapre/core';
import bundledClient from 'virtual:mapre-client';
import { assembleSingleFileHtml } from './assembleSingleFileHtml';

const DEFAULT_TITLE = 'mapre presentation';

/**
 * Options for {@link buildSingleFileHtml}.
 */
export interface BuildSingleFileHtmlOptions {
  /**
   * Overrides the bundled browser client. Mainly intended for tests; production
   * callers should rely on the client inlined into this package at build time.
   */
  clientScript?: string;
  /** Optional style override passed through to the assembler. */
  styles?: string;
  /**
   * Optional author stylesheet inlined after the baseline styles. Typically the
   * contents of a deck's `stylesheet` directive target.
   */
  extraStyles?: string;
  /**
   * Optional named HTML templates passed through to the assembler for slides
   * that select one via their `template` directive.
   */
  templates?: Record<string, string>;
  /**
   * Overrides the document title. Defaults to the deck's front-matter `title`,
   * or a generic fallback when none is set.
   */
  title?: string;
}

/**
 * Builds a single, self-contained HTML file for a deck from its raw markdown.
 * The markdown and the bundled browser client (which includes the parser and
 * renderer) are inlined, so the deck is rendered in the browser at runtime — the
 * same path a hosted web app would use. The output can be opened directly from
 * disk (`file://`), served by a local web server, or hosted on the internet
 * without any additional assets.
 */
export function buildSingleFileHtml(
  markdown: string,
  options: BuildSingleFileHtmlOptions = {},
): string {
  const title = options.title ?? deriveTitle(markdown);
  const clientScript = options.clientScript ?? bundledClient;

  return assembleSingleFileHtml({
    title,
    markdown,
    clientScript,
    styles: options.styles,
    extraStyles: options.extraStyles,
    templates: options.templates,
  });
}

/**
 * Derives the document title from the deck's front matter, falling back to a
 * generic title when none is present.
 */
function deriveTitle(markdown: string): string {
  return parseDeck(markdown).metadata.title ?? DEFAULT_TITLE;
}
