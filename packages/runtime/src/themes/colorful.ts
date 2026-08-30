/**
 * "colorful" — a bold, playful theme with a gradient backdrop and a warm accent
 * palette. Code blocks get an opaque surface so they stay legible over the
 * lightest part of the gradient.
 */
export const COLORFUL_THEME = `
  :root {
    --mapre-stage-bg: #2a1140;
    --mapre-slide-bg: linear-gradient(135deg, #3b1d60 0%, #7c2d6f 60%, #c2410c 100%);
    --mapre-slide-fg: #fdf4ff;
    --mapre-heading-fg: #fde047;
    --mapre-accent: #fde047;
    --mapre-muted-fg: #e9d5ff;
    --mapre-code-bg: #2a1140;
    --mapre-code-fg: #f8fafc;
    --mapre-token-comment: #b4a0d8;
    --mapre-token-punctuation: #d8c8f0;
    --mapre-token-keyword: #fb7185;
    --mapre-token-string: #86efac;
    --mapre-token-number: #fde047;
    --mapre-token-function: #67e8f9;
    --mapre-token-builtin: #f0abfc;
    --mapre-font-body: system-ui, sans-serif;
    --mapre-font-mono: ui-monospace, monospace;
    --mapre-font-scale: 1;
    --mapre-columns-gap: 4cqw;
  }

  .slide-box .slide pre {
    box-shadow: 0 0.4cqh 1.2cqh rgba(15, 3, 30, 0.35);
  }
`;
