import type { AspectRatio } from '../browser/aspect';

/**
 * Base page width in millimetres for the print layout. The page height is
 * derived from the deck's aspect ratio so every printed page matches the slide
 * shape exactly and prints edge-to-edge (no letterboxing on paper).
 */
const PAGE_WIDTH_MM = 297;

/**
 * Builds the print-specific stylesheet for a print export. It sets the deck's
 * aspect ratio on the slide box, lays out one slide per page, and — under
 * `@media print` — sizes every physical page to that same aspect ratio with no
 * margins so slides print full-bleed, one per page.
 *
 * This is pure string assembly (no DOM), so it can be unit tested in isolation.
 */
export function printStyles(aspect: AspectRatio): string {
  const width = PAGE_WIDTH_MM;
  const height = round(PAGE_WIDTH_MM * (aspect.height / aspect.width));

  return `
  :root { --aspect-w: ${aspect.width}; --aspect-h: ${aspect.height}; --scale: 1; }
  html, body { margin: 0; padding: 0; }
  body.print { background: #475569; }
  .print-pages {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
  }
  .print-page {
    width: ${width}mm;
    height: ${height}mm;
    background: #0f172a;
    overflow: hidden;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    container-type: size;
    /* Keep slide background colours and images when saving to PDF; browsers
     * otherwise drop them unless the user enables "Background graphics". */
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.35), 0 10px 28px rgba(0, 0, 0, 0.45);
  }

  @media print {
    @page { size: ${width}mm ${height}mm; margin: 0; }
    body.print { background: #fff; }
    .print-pages { display: block; gap: 0; padding: 0; }
    .print-page {
      box-shadow: none;
      break-after: page;
      break-inside: avoid;
    }
    .print-page:last-child { break-after: auto; }
  }
`;
}

/**
 * Rounds a millimetre value to four decimals so derived page heights stay
 * precise without emitting noisy floating-point tails.
 */
function round(value: number): number {
  return Math.round(value * 10000) / 10000;
}
