/**
 * Baseline styles for the single-file presentation, covering both window roles
 * (audience presentation and presenter). Kept as a string so it can be inlined
 * into the generated HTML without any external stylesheet.
 *
 * Slide appearance is expressed through `--mapre-*` design tokens that a theme
 * declares on `.slide-box` (see `../themes`). Presenter chrome keeps its own
 * tokens so a light slide theme cannot render the surrounding controls
 * unreadable.
 */
export const STYLES = `
  :root {
    --scale: 1;
    --aspect-w: 16;
    --aspect-h: 9;

    --mapre-chrome-bg: #0f172a;
    --mapre-chrome-surface: #1e293b;
    --mapre-chrome-control-bg: #334155;
    --mapre-chrome-fg: #e2e8f0;
    --mapre-chrome-muted-fg: #94a3b8;
    --mapre-chrome-accent: #38bdf8;
    --mapre-chrome-warning-fg: #f59e0b;
  }

  /*
   * Light presenter chrome, toggled from the presenter view. Only the chrome
   * tokens change; the slide theme is untouched, so the previews keep looking
   * exactly like the audience windows.
   */
  :root.chrome-light {
    --mapre-chrome-bg: #eef1f5;
    --mapre-chrome-surface: #ffffff;
    --mapre-chrome-control-bg: #dbe1e9;
    --mapre-chrome-fg: #1f2933;
    --mapre-chrome-muted-fg: #5a6672;
    --mapre-chrome-accent: #1a5fa0;
    --mapre-chrome-warning-fg: #b45309;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: system-ui, sans-serif;
    background: var(--mapre-chrome-bg);
    color: var(--mapre-chrome-fg);
  }
  #app { height: 100vh; display: flex; flex-direction: column; }
  button {
    background: var(--mapre-chrome-control-bg);
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
    background: var(--mapre-slide-bg);
    color: var(--mapre-slide-fg);
    font-family: var(--mapre-font-body);
  }
  .slide-box.show-box { outline: 2px solid var(--mapre-chrome-accent); outline-offset: -1px; }
  .slide {
    position: relative;
    isolation: isolate;
    width: 100%;
    height: 100%;
    padding: 5cqh 6cqw;
    overflow: hidden;
    font-size: calc(var(--scale) * var(--mapre-font-scale) * 4.3cqh);
  }
  .slide-bg {
    position: absolute;
    inset: 0;
    z-index: -1;
    background-size: cover;
    background-position: center;
  }
  .slide h1, .slide h2, .slide h3 { color: var(--mapre-heading-fg); }
  .slide a { color: var(--mapre-accent); }
  .slide ul > li::marker, .slide ol > li::marker { color: var(--mapre-accent); }
  .slide blockquote { color: var(--mapre-muted-fg); border-left: 0.15em solid var(--mapre-accent); padding-left: 0.8em; }
  .slide pre {
    background: var(--mapre-code-bg);
    color: var(--mapre-code-fg);
    padding: 1em;
    border-radius: 0.5em;
    overflow: auto;
  }
  .slide code { font-family: var(--mapre-font-mono); }
  .hidden-fragment { display: none; }

  .token.comment, .token.prolog, .token.doctype, .token.cdata { color: var(--mapre-token-comment); }
  .token.punctuation { color: var(--mapre-token-punctuation); }
  .token.keyword, .token.boolean, .token.operator { color: var(--mapre-token-keyword); }
  .token.string, .token.char, .token.attr-value { color: var(--mapre-token-string); }
  .token.number, .token.constant, .token.symbol { color: var(--mapre-token-number); }
  .token.function, .token.class-name, .token.annotation { color: var(--mapre-token-function); }
  .token.builtin, .token.tag, .token.attr-name { color: var(--mapre-token-builtin); }

  /* Presentation (audience) view */
  .stage {
    flex: 1;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 0;
    container-type: size;
    background: var(--mapre-stage-bg);
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
    background: var(--mapre-chrome-surface);
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
    color: var(--mapre-chrome-muted-fg);
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
    background: var(--mapre-chrome-surface);
    border-radius: 0.5rem;
    padding: 0.75rem;
    overflow: hidden;
    container-type: size;
    position: relative;
  }
  .pv-notes > div {
    flex: 1;
    background: var(--mapre-chrome-surface);
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
    background: var(--mapre-chrome-surface);
    border-radius: 0.4rem;
    padding: 0.4rem 0.6rem;
  }
  .pv-window-label { flex: 1; min-width: 4rem; color: var(--mapre-chrome-fg); }
  .pv-window button { padding: 0.25em 0.6em; font-size: 0.85rem; }
  .pv-empty { color: var(--mapre-chrome-muted-fg); font-size: 0.85rem; }
  .pv-stage .slide { font-size: calc(var(--pv-scale, 1) * var(--mapre-font-scale) * 4.3cqh); }
  .pv-notes > div { white-space: pre-wrap; }
  .pv-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--mapre-chrome-muted-fg);
    margin-bottom: 0.25rem;
  }
  .pv-overflow {
    display: none;
    margin-left: 0.5em;
    color: var(--mapre-chrome-warning-fg);
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
  .pv-appearance { display: flex; align-items: center; gap: 0.5rem; }
  #pv-highlight.is-active { background: #38bdf8; color: #0f172a; }
  .pv-channels { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
  .pv-channel-view { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
  #pv-box-toggle.is-active,
  .pv-channel-view button.is-active,
  .pv-appearance button.is-active {
    background: var(--mapre-chrome-accent);
    color: var(--mapre-chrome-bg);
  }
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

  /*
   * Git-style tree layout for multi-level decks: the trunk on lane 0, each
   * detail branch on its own lane below, staggered by column. Items are placed
   * on an explicit grid; an SVG layer draws elbow connectors between them.
   */
  .overview-tree {
    --overview-col: 14rem;
    position: relative;
    flex: 1;
    min-height: 0;
    overflow: auto;
    display: grid;
    justify-content: start;
    align-content: start;
    gap: 1.25rem 1rem;
  }
  .overview-tree .overview-item { width: var(--overview-col); }
  .overview-connectors {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    overflow: visible;
  }
  .overview-connector {
    fill: none;
    stroke: #475569;
    stroke-width: 2;
  }
`;
