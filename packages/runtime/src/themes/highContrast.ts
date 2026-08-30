/**
 * "high-contrast" — pure black and white with a single signal colour, bolder
 * headings and a larger base font size. Aimed at large rooms, weak projectors
 * and accessibility: body text reaches WCAG AAA (7:1) against the background.
 */
export const HIGH_CONTRAST_THEME = `
  :root {
    --mapre-stage-bg: #000000;
    --mapre-slide-bg: #000000;
    --mapre-slide-fg: #ffffff;
    --mapre-heading-fg: #ffd400;
    --mapre-accent: #ffd400;
    --mapre-muted-fg: #d4d4d4;
    --mapre-code-bg: #1a1a1a;
    --mapre-code-fg: #ffffff;
    --mapre-token-comment: #bdbdbd;
    --mapre-token-punctuation: #ffffff;
    --mapre-token-keyword: #ffd400;
    --mapre-token-string: #7ee787;
    --mapre-token-number: #ffab70;
    --mapre-token-function: #79c0ff;
    --mapre-token-builtin: #ff9ecb;
    --mapre-font-body: system-ui, sans-serif;
    --mapre-font-mono: ui-monospace, monospace;
    --mapre-font-scale: 1.1;
    --mapre-columns-gap: 5cqw;
  }

  .slide-box h1,
  .slide-box h2,
  .slide-box h3 {
    font-weight: 800;
  }

  .slide-box .slide {
    font-weight: 500;
  }
`;
