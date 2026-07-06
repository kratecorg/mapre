/**
 * Baseline styles for the single-file presentation, covering both window roles
 * (audience presentation and presenter). Kept as a string so it can be inlined
 * into the generated HTML without any external stylesheet.
 */
export const STYLES = `
  :root { --scale: 1.6; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: system-ui, sans-serif;
    background: #0f172a;
    color: #e2e8f0;
  }
  #app { height: 100vh; display: flex; flex-direction: column; }
  button {
    background: #334155;
    color: inherit;
    border: none;
    border-radius: 0.4em;
    padding: 0.4em 0.8em;
    cursor: pointer;
    font-size: 1rem;
  }
  button:disabled { opacity: 0.4; cursor: default; }

  .slide { font-size: calc(var(--scale) * 1rem); }
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

  /* Presentation (audience) view */
  .stage {
    flex: 1;
    overflow: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    min-height: 0;
  }
  .stage .slide { max-width: 60ch; }
  .bar {
    display: flex;
    gap: 1rem;
    align-items: center;
    justify-content: center;
    padding: 0.75rem;
    background: #1e293b;
  }
  .zoom { display: flex; align-items: center; gap: 0.5rem; }
  .channel-label {
    color: #94a3b8;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .channel-label:empty { display: none; }

  /* Presenter view */
  .presenter {
    flex: 1;
    display: grid;
    grid-template-columns: 2fr 1fr;
    grid-template-rows: 1fr auto;
    grid-template-areas: "current side" "bar bar";
    gap: 1rem;
    padding: 1rem;
    min-height: 0;
  }
  .pv-current { grid-area: current; }
  .pv-side { grid-area: side; }
  .pv-bar { grid-area: bar; }
  .pv-current, .pv-side { display: flex; flex-direction: column; min-height: 0; gap: 1rem; }
  .pv-current > .slide,
  .pv-next > .slide,
  .pv-notes > div {
    flex: 1;
    background: #1e293b;
    border-radius: 0.5rem;
    padding: 1rem;
    overflow: auto;
    min-height: 0;
  }
  .pv-next, .pv-notes { display: flex; flex-direction: column; min-height: 0; flex: 1; }
  .pv-current > .slide { font-size: calc(var(--pv-scale, 1.3) * 1rem); }
  .pv-next > .slide { font-size: 0.8rem; }
  .pv-notes > div { white-space: pre-wrap; }
  .pv-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #94a3b8;
    margin-bottom: 0.25rem;
  }
  .pv-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.5rem 0.25rem;
  }
  .pv-timer, .pv-nav { display: flex; align-items: center; gap: 0.75rem; }
  .pv-channels { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
  #pv-time { font-variant-numeric: tabular-nums; font-size: 1.75rem; }
`;
