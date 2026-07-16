import type { AspectRatio } from '../browser/aspect';
import { STYLES } from './styles';
import { printStyles } from './printStyles';

/**
 * Everything needed to assemble a self-contained print HTML document.
 */
export interface AssemblePrintHtmlParams {
  /** Presentation title, used for the document title. */
  title: string;
  /**
   * Pre-rendered slide bodies, one per page and in order. Each entry is the
   * inner HTML of a `.slide` (the output of `renderSlide`).
   */
  pages: string[];
  /** Aspect ratio every page is sized to. */
  aspect: AspectRatio;
  /** Optional baseline style override; defaults to the built-in {@link STYLES}. */
  styles?: string;
  /**
   * Optional author stylesheet inlined after the baseline and print styles so
   * it wins by cascade order. Comes from a deck's `stylesheet` directive and/or
   * the project's `style/` folder.
   */
  extraStyles?: string;
}

/**
 * Assembles a fully self-contained, print-optimised HTML document. Every slide
 * is laid out on its own page sized to the deck's aspect ratio, so a browser's
 * "Print to PDF" produces one full-bleed slide per PDF page.
 *
 * Slides are pre-rendered (no runtime rendering), because a print/PDF flow needs
 * all slides present in the static document at once. The function is pure string
 * assembly and free of filesystem or DOM access, so it can be unit tested in
 * isolation.
 */
export function assemblePrintHtml(params: AssemblePrintHtmlParams): string {
  const { title, pages, aspect } = params;
  const styles = params.styles ?? STYLES;
  const authorStyles = renderAuthorStyles(params.extraStyles);
  const body = pages.map(renderPage).join('\n    ');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>${styles}</style>
  <style>${printStyles(aspect)}</style>${authorStyles}
</head>
<body class="print">
  <div class="print-pages">
    ${body}
  </div>
</body>
</html>
`;
}

/**
 * Wraps a rendered slide body in a fixed-aspect page. The nested `.slide-box`
 * reuses the baseline layout so slide typography and backgrounds match the
 * on-screen audience view exactly.
 */
function renderPage(slide: string): string {
  return `<div class="print-page"><div class="slide-box"><div class="slide">${slide}</div></div></div>`;
}

/**
 * Renders the optional author stylesheet as a `<style>` element after the
 * baseline and print styles, so equal-specificity rules win by source order.
 * Returns an empty string when no author styles are given.
 */
function renderAuthorStyles(extraStyles: string | undefined): string {
  if (extraStyles === undefined || extraStyles.trim() === '') {
    return '';
  }

  return `\n  <style>${sanitizeStyles(extraStyles)}</style>`;
}

/**
 * Neutralizes any `</style` sequence so author CSS cannot break out of the
 * surrounding `<style>` element. CSS has no legitimate need for that sequence.
 */
function sanitizeStyles(css: string): string {
  return css.replace(/<\/style/gi, '<\\/style');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
