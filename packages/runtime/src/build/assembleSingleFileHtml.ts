import { STYLES } from './styles';

/**
 * Everything needed to assemble a single-file HTML presentation.
 */
export interface AssembleSingleFileHtmlParams {
  /** Presentation title, used for the document title. */
  title: string;
  /** Raw deck markdown to embed and render in the browser at runtime. */
  markdown: string;
  /** The bundled browser client as JavaScript source (parser + renderer). */
  clientScript: string;
  /** Optional style override; defaults to the built-in {@link STYLES}. */
  styles?: string;
}

/**
 * Assembles a fully self-contained HTML document. The raw markdown, styles, and
 * browser client are all inlined, so the result has no external references and
 * runs from a plain `file://` open as well as from any static web server.
 *
 * The deck is rendered in the browser at runtime, using the exact same
 * markdown-to-HTML path a hosted web app would use. This keeps a single
 * rendering path across all deployment targets.
 *
 * This function is pure string assembly and stays free of filesystem access so
 * it can be unit tested in isolation.
 */
export function assembleSingleFileHtml(params: AssembleSingleFileHtmlParams): string {
  const { title, markdown, clientScript } = params;
  const styles = params.styles ?? STYLES;
  const source = serializeSource(markdown);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>${styles}</style>
</head>
<body>
  <div id="app"></div>
  <script id="mapre-source" type="application/json">${source}</script>
  <script>${clientScript}</script>
</body>
</html>
`;
}

/**
 * Serializes the markdown as a JSON string and escapes `<` so the payload cannot
 * break out of the surrounding `<script>` element (e.g. via `</script>` inside
 * the deck content).
 */
function serializeSource(markdown: string): string {
  return JSON.stringify(markdown).replace(/</g, '\\u003c');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
