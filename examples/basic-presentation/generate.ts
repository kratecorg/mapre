import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import { renderSlide } from '@mapre/core';
import { loadDeck } from '@mapre/node';

interface RenderedSlide {
  /** One pre-rendered HTML string per fragment step (0..fragmentCount). */
  steps: string[];
  notes: string;
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const slidesDir = join(scriptDir, 'slides');
const outputDir = join(scriptDir, 'dist');
const outputFile = join(outputDir, 'index.html');

const deck = loadDeck(slidesDir);
const title = deck.metadata.title ?? 'mapre presentation';

const slides: RenderedSlide[] = deck.slides.map((slide) => ({
  steps: Array.from({ length: slide.fragmentCount + 1 }, (_, step) =>
    renderSlide(slide, { revealedFragments: step }),
  ),
  notes: slide.notes ?? '',
}));

mkdirSync(outputDir, { recursive: true });
writeFileSync(outputFile, renderViewer(title, slides), 'utf8');

console.log(`Rendered ${slides.length} slides -> ${outputFile}`);

/**
 * Builds a self-contained HTML viewer. The deck is embedded as JSON and a small
 * client script handles navigation, progressive fragments, and an independent
 * zoom control that hints at the presentation-mode sizing feature.
 */
function renderViewer(deckTitle: string, deckSlides: RenderedSlide[]): string {
  const deckJson = JSON.stringify(deckSlides).replace(/</g, '\\u003c');

  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(deckTitle)}</title>
  <style>${styles()}</style>
</head>
<body>
  <main id="stage" aria-live="polite"></main>
  <footer class="bar">
    <button id="prev" type="button" aria-label="Zurück">◀</button>
    <span id="counter">1 / ${deckSlides.length}</span>
    <button id="next" type="button" aria-label="Weiter">▶</button>
    <label class="zoom">
      Größe
      <input id="zoom" type="range" min="1" max="4" step="0.1" value="1.6" />
    </label>
  </footer>
  <script>
    const SLIDES = ${deckJson};
    ${clientScript()}
  </script>
</body>
</html>
`;
}

function styles(): string {
  return `
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
    .zoom { display: flex; align-items: center; gap: 0.5rem; }
    .token.keyword { color: #c084fc; }
    .token.string { color: #86efac; }
    .token.comment { color: #64748b; }
    .token.number, .token.boolean { color: #fbbf24; }
    .token.function, .token.class-name { color: #38bdf8; }
    .token.punctuation, .token.operator { color: #94a3b8; }
  `;
}

function clientScript(): string {
  return `
    let slideIndex = 0;
    let step = 0;
    const stage = document.getElementById('stage');
    const counter = document.getElementById('counter');
    const zoom = document.getElementById('zoom');

    function render() {
      const slide = SLIDES[slideIndex];
      stage.innerHTML = '<section class="slide">' + slide.steps[step] + '</section>';
      counter.textContent = (slideIndex + 1) + ' / ' + SLIDES.length;
    }

    function next() {
      const maxStep = SLIDES[slideIndex].steps.length - 1;
      if (step < maxStep) {
        step += 1;
      } else if (slideIndex < SLIDES.length - 1) {
        slideIndex += 1;
        step = 0;
      }
      render();
    }

    function prev() {
      if (step > 0) {
        step -= 1;
      } else if (slideIndex > 0) {
        slideIndex -= 1;
        step = SLIDES[slideIndex].steps.length - 1;
      }
      render();
    }

    document.getElementById('next').addEventListener('click', next);
    document.getElementById('prev').addEventListener('click', prev);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === ' ') { event.preventDefault(); next(); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); prev(); }
    });
    zoom.addEventListener('input', () => {
      document.documentElement.style.setProperty('--scale', zoom.value);
    });

    render();
  `;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
