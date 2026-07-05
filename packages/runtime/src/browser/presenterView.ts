import { renderSlide } from '@mapre/core';
import { Timer } from '../core/timer';
import { formatDuration } from '../core/format';
import type { Controller } from './controller';
import { query } from './dom';

const TIMER_TICK_MS = 250;

const TEMPLATE = `
  <div class="presenter">
    <section class="pv-current">
      <div class="pv-label">Current</div>
      <div class="slide" id="pv-current"></div>
    </section>
    <aside class="pv-side">
      <section class="pv-next">
        <div class="pv-label">Next</div>
        <div class="slide" id="pv-next"></div>
      </section>
      <section class="pv-notes">
        <div class="pv-label">Notes</div>
        <div id="pv-notes"></div>
      </section>
    </aside>
    <footer class="pv-bar">
      <div class="pv-timer">
        <span id="pv-time">00:00</span>
        <button id="pv-toggle" type="button">Start</button>
        <button id="pv-reset" type="button">Reset</button>
      </div>
      <div class="pv-nav">
        <button id="prev" type="button" aria-label="Previous">&#9664;</button>
        <span id="counter"></span>
        <button id="next" type="button" aria-label="Next">&#9654;</button>
      </div>
    </footer>
  </div>`;

/**
 * Mounts the presenter view: the current slide, a preview of what the next step
 * reveals, speaker notes, a timer, and navigation controls. Navigation stays in
 * sync with the presentation window via the controller.
 */
export function mountPresenterView(root: HTMLElement, controller: Controller): void {
  root.innerHTML = TEMPLATE;
  document.title = `${controller.deck.metadata.title ?? 'mapre'} \u2013 Presenter`;

  const currentBox = query(root, '#pv-current');
  const nextBox = query(root, '#pv-next');
  const notesBox = query(root, '#pv-notes');
  const counter = query(root, '#counter');
  const previousButton = query<HTMLButtonElement>(root, '#prev');
  const nextButton = query<HTMLButtonElement>(root, '#next');
  const timeLabel = query(root, '#pv-time');
  const toggleButton = query(root, '#pv-toggle');

  const timer = new Timer();

  function renderPreview(): void {
    const { navigation, deck } = controller;
    const slide = deck.slides[navigation.slideIndex];

    currentBox.innerHTML = renderSlide(slide, { revealedFragments: navigation.stepIndex });
    nextBox.innerHTML = renderNextPreview();
    notesBox.textContent = slide.notes ?? '';
    counter.textContent = `${navigation.slideIndex + 1} / ${deck.slides.length}`;
    previousButton.disabled = navigation.isFirst;
    nextButton.disabled = navigation.isLast;
  }

  /**
   * Renders whatever the Next action will reveal: the next fragment of the
   * current slide, or the start of the following slide.
   */
  function renderNextPreview(): string {
    const { navigation, deck } = controller;
    const slide = deck.slides[navigation.slideIndex];

    if (navigation.stepIndex < slide.fragmentCount) {
      return renderSlide(slide, { revealedFragments: navigation.stepIndex + 1 });
    }
    if (navigation.slideIndex + 1 < deck.slides.length) {
      return renderSlide(deck.slides[navigation.slideIndex + 1], { revealedFragments: 0 });
    }
    return '<em>End</em>';
  }

  function renderTimer(): void {
    timeLabel.textContent = formatDuration(timer.elapsedMs());
    toggleButton.textContent = timer.isRunning ? 'Pause' : 'Start';
  }

  nextButton.addEventListener('click', () => controller.next());
  previousButton.addEventListener('click', () => controller.previous());
  toggleButton.addEventListener('click', () => {
    timer.toggle();
    renderTimer();
  });
  query(root, '#pv-reset').addEventListener('click', () => {
    timer.reset();
    renderTimer();
  });

  controller.onChange(renderPreview);
  renderPreview();
  renderTimer();
  window.setInterval(renderTimer, TIMER_TICK_MS);
}
