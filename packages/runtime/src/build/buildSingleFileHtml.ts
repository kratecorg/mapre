import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseDeck } from '@mapre/core';
import { assembleSingleFileHtml } from './assembleSingleFileHtml';

const DEFAULT_TITLE = 'mapre presentation';

/**
 * Options for {@link buildSingleFileHtml}.
 */
export interface BuildSingleFileHtmlOptions {
  /**
   * Overrides the bundled browser client. Mainly intended for tests; production
   * callers should rely on the client shipped alongside the package.
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
  const clientScript = options.clientScript ?? readBundledClient();

  return assembleSingleFileHtml({
    title,
    markdown,
    clientScript,
    styles: options.styles,
    extraStyles: options.extraStyles,
  });
}

/**
 * Derives the document title from the deck's front matter, falling back to a
 * generic title when none is present.
 */
function deriveTitle(markdown: string): string {
  return parseDeck(markdown).metadata.title ?? DEFAULT_TITLE;
}

/**
 * Reads the pre-bundled browser client that sits next to the built entry point.
 * The client is produced by the package's build step (esbuild) as `client.js`.
 */
function readBundledClient(): string {
  const clientUrl = new URL('./client.js', import.meta.url);
  return readFileSync(fileURLToPath(clientUrl), 'utf8');
}
