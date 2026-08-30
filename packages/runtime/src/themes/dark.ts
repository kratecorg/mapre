/**
 * "dark" — the default theme: a calm slate background with a sky-blue accent.
 * These values are the ones the runtime shipped with before themes existed, so
 * a deck without a `theme` directive keeps its previous look.
 */
export const DARK_THEME = `
  :root {
    --mapre-stage-bg: #0f172a;
    --mapre-slide-bg: #0f172a;
    --mapre-slide-fg: #e2e8f0;
    --mapre-heading-fg: #38bdf8;
    --mapre-accent: #38bdf8;
    --mapre-muted-fg: #94a3b8;
    --mapre-code-bg: #1e293b;
    --mapre-code-fg: #e2e8f0;
    --mapre-token-comment: #64748b;
    --mapre-token-punctuation: #94a3b8;
    --mapre-token-keyword: #f472b6;
    --mapre-token-string: #86efac;
    --mapre-token-number: #fbbf24;
    --mapre-token-function: #7dd3fc;
    --mapre-token-builtin: #38bdf8;
    --mapre-font-body: system-ui, sans-serif;
    --mapre-font-mono: ui-monospace, monospace;
    --mapre-font-scale: 1;
    --mapre-columns-gap: 4cqw;
  }
`;
