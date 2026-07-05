/**
 * Baseline styles for the single-file presentation. Kept as a string so it can
 * be inlined into the generated HTML without any external stylesheet.
 */
export const STYLES = `
  :root { --scale: 1.6; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: system-ui, sans-serif;
    background: #0f172a;
    color: #e2e8f0;
    height: 100vh;
    display: flex;
    flex-direction: column;
  }
  #stage {
    flex: 1;
    overflow: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }
  .slide {
    font-size: calc(var(--scale) * 1rem);
    max-width: 60ch;
  }
  .slide h1 { color: #38bdf8; }
  .slide pre {
    background: #1e293b;
    padding: 1em;
    border-radius: 0.5em;
    overflow: auto;
  }
  .slide code { font-family: ui-monospace, monospace; }
  .hidden-fragment { display: none; }
  .token.comment, .token.prolog, .token.doctype, .token.cdata { color: #64748b; }
  .token.punctuation { color: #94a3b8; }
  .token.keyword, .token.boolean, .token.operator { color: #f472b6; }
  .token.string, .token.char, .token.attr-value { color: #86efac; }
  .token.number, .token.constant, .token.symbol { color: #fbbf24; }
  .token.function, .token.class-name, .token.annotation { color: #7dd3fc; }
  .token.builtin, .token.tag, .token.attr-name { color: #38bdf8; }
  .bar {
    display: flex;
    gap: 1rem;
    align-items: center;
    justify-content: center;
    padding: 0.75rem;
    background: #1e293b;
  }
  .bar button {
    background: #334155;
    color: inherit;
    border: none;
    border-radius: 0.4em;
    padding: 0.4em 0.8em;
    cursor: pointer;
    font-size: 1rem;
  }
  .bar button:disabled { opacity: 0.4; cursor: default; }
  .zoom { display: flex; align-items: center; gap: 0.5rem; }
`;
