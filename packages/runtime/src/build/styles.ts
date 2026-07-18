/**
 * Baseline styles for the single-file presentation, covering both window roles
 * (audience presentation and presenter). Kept as a string so it can be inlined
 * into the generated HTML without any external stylesheet.
 */
export const STYLES = `
  :root { --scale: 1; --aspect-w: 16; --aspect-h: 9; }
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

  /*
   * The slide box is the fixed-aspect canvas every slide is laid out on. It is
   * letterboxed into the available stage and acts as a query container, so all
   * slide typography and spacing is expressed relative to the box (cqh/cqw)
   * rather than the window. The default aspect ratio is 16:9, overridable via
   * the deck's \`aspect\` directive.
   */
  .slide-box {
    aspect-ratio: var(--aspect-w) / var(--aspect-h);
    width: min(100cqw, 100cqh * var(--aspect-w) / var(--aspect-h));
    container-type: size;
    overflow: hidden;
    position: relative;
  }
  .slide-box.show-box { outline: 2px solid #38bdf8; outline-offset: -1px; }
  .slide {
    position: relative;
    isolation: isolate;
    width: 100%;
    height: 100%;
    padding: 5cqh 6cqw;
    overflow: hidden;
    font-size: calc(var(--scale) * 4.3cqh);
  }
  .slide-bg {
    position: absolute;
    inset: 0;
    z-index: -1;
    background-size: cover;
    background-position: center;
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

  /* Presentation (audience) view */
  .stage {
    flex: 1;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    min-height: 0;
    container-type: size;
    position: relative;
  }

  /*
   * Spotlight highlight: a dimming overlay above the slide with a bright
   * circular hole punched out by a radial gradient. It ignores pointer events
   * so the stage below still receives the mouse-move that steers the circle.
   */
  .spotlight {
    position: absolute;
    inset: 0;
    z-index: 10;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s ease;
    background: radial-gradient(
      circle var(--spot-r, 12rem) at var(--spot-x, 50%) var(--spot-y, 50%),
      transparent 0,
      transparent calc(var(--spot-r, 12rem) * 0.82),
      rgba(2, 6, 23, 0.72) var(--spot-r, 12rem)
    );
  }
  .spotlight.is-active { opacity: 1; }
  .bar {
    display: flex;
    gap: 1rem;
    align-items: center;
    justify-content: center;
    padding: 0.75rem;
    background: #1e293b;
  }
  .zoom { display: flex; align-items: center; gap: 0.5rem; }
  .zoom-control { display: flex; align-items: center; gap: 0.4rem; }
  .zoom-step {
    padding: 0.2em 0.55em;
    line-height: 1;
    font-size: 1rem;
  }
  .zoom-value {
    min-width: 3rem;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }
  .channel-label {
    color: #94a3b8;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .channel-label:empty { display: none; }
  #highlight.is-active { background: #38bdf8; color: #0f172a; }

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
  .pv-stage {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #1e293b;
    border-radius: 0.5rem;
    padding: 0.75rem;
    overflow: hidden;
    container-type: size;
    position: relative;
  }
  .pv-notes > div {
    flex: 1;
    background: #1e293b;
    border-radius: 0.5rem;
    padding: 1rem;
    overflow: auto;
    min-height: 0;
  }
  .pv-next, .pv-notes { display: flex; flex-direction: column; min-height: 0; flex: 1; }
  .pv-windows { display: flex; flex-direction: column; min-height: 0; }
  #pv-windows { display: flex; flex-direction: column; gap: 0.4rem; overflow: auto; }
  .pv-window {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
    background: #1e293b;
    border-radius: 0.4rem;
    padding: 0.4rem 0.6rem;
  }
  .pv-window-label { flex: 1; min-width: 4rem; color: #cbd5e1; }
  .pv-window button { padding: 0.25em 0.6em; font-size: 0.85rem; }
  .pv-empty { color: #64748b; font-size: 0.85rem; }
  .pv-stage .slide { font-size: calc(var(--pv-scale, 1) * 4.3cqh); }
  .pv-notes > div { white-space: pre-wrap; }
  .pv-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #94a3b8;
    margin-bottom: 0.25rem;
  }
  .pv-overflow {
    display: none;
    margin-left: 0.5em;
    color: #f59e0b;
    font-weight: 700;
    letter-spacing: 0;
    text-transform: none;
  }
  .pv-overflow.is-visible { display: inline; }
  .pv-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.5rem 0.25rem;
  }
  .pv-timer, .pv-nav, .pv-view { display: flex; align-items: center; gap: 0.75rem; }
  #pv-box-toggle.is-active { background: #38bdf8; color: #0f172a; }
  #pv-highlight.is-active { background: #38bdf8; color: #0f172a; }
  .pv-channels { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
  .pv-channel-view { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
  .pv-channel-view button.is-active { background: #38bdf8; color: #0f172a; }
  #pv-time { font-variant-numeric: tabular-nums; font-size: 1.75rem; }
  #pv-overview.is-active { background: #38bdf8; color: #0f172a; }

  /*
   * Overview overlay: a scrollable grid of every slide as a thumbnail. Each
   * thumbnail is a query container so the slide box letterboxes into it and the
   * cqh/cqw-based typography scales down, exactly like the stage does.
   */
  .overview {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: #0f172a;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem;
  }
  .overview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .overview-title {
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #94a3b8;
  }
  .overview-grid {
    --scale: 1;
    flex: 1;
    min-height: 0;
    overflow: auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
    gap: 1rem;
    align-content: start;
  }
  .overview-item {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 0.35rem;
    background: transparent;
    border: 2px solid #334155;
    border-radius: 0.5rem;
    cursor: pointer;
  }
  .overview-item:hover { border-color: #64748b; }
  .overview-item:focus-visible { outline: 2px solid #7dd3fc; outline-offset: 2px; }
  .overview-item.is-current { border-color: #38bdf8; }
  .overview-thumb {
    container-type: size;
    aspect-ratio: var(--aspect-w) / var(--aspect-h);
    width: 100%;
    background: #1e293b;
    border-radius: 0.4rem;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }
  .overview-number {
    color: #94a3b8;
    font-size: 0.8rem;
    font-variant-numeric: tabular-nums;
  }
`;
