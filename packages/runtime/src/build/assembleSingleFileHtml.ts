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
  /**
   * Optional author stylesheet inlined after the baseline styles, so it wins by
   * cascade order. Comes from a deck's `stylesheet` directive (see
   * `@mapre/node`'s `loadDeckStyles`).
   */
  extraStyles?: string;
  /**
   * Optional named HTML templates, inlined so the browser can wrap slides that
   * select one through their `template` directive. Comes from a project's
   * `style/` folder (see `@mapre/node`'s `loadStyleAssets`).
   */
  templates?: Record<string, string>;
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
  const authorStyles = renderAuthorStyles(params.extraStyles);
  const templates = serializeJson(params.templates ?? {});

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>${styles}</style>${authorStyles}
</head>
<body>
  <div id="app"></div>
  <script id="mapre-source" type="application/json">${source}</script>
  <script id="mapre-templates" type="application/json">${templates}</script>
  <script>${clientScript}</script>
</body>
</html>
`;
}

/**
 * Renders the optional author stylesheet as a second `<style>` element placed
 * after the baseline styles, so equal-specificity rules win by source order.
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

/**
 * Serializes the markdown as a JSON string and escapes `<` so the payload cannot
 * break out of the surrounding `<script>` element (e.g. via `</script>` inside
 * the deck content).
 */
function serializeSource(markdown: string): string {
  return JSON.stringify(markdown).replace(/</g, '\\u003c');
}

/**
 * Serializes an arbitrary JSON value for inlining in a `<script>` element,
 * escaping `<` so it cannot break out (e.g. via `</script>` inside a template).
 */
function serializeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
