import { renderSlide } from '@mapre/core';
import type { Controller } from './controller';
import { query, toggleFullscreen } from './dom';

const TEMPLATE = `
  <div class="stage"><div class="slide" id="stage-slide"></div></div>
  <footer class="bar">
    <button id="prev" type="button" aria-label="Previous">&#9664;</button>
    <span id="counter"></span>
    <button id="next" type="button" aria-label="Next">&#9654;</button>
    <button id="open-presenter" type="button">Presenter</button>
    <button id="fullscreen" type="button" aria-label="Fullscreen">&#9974;</button>
    <label class="zoom">Size
      <input id="zoom" type="range" min="1" max="4" step="0.1" value="1.6" />
    </label>
  </footer>`;

/**
 * Mounts the audience-facing view: a single full-window slide plus a control
 * bar. Navigation stays in sync with any other open window via the controller.
 */
export function mountPresentationView(root: HTMLElement, controller: Controller): void {
  root.innerHTML = TEMPLATE;

  const slideBox = query(root, '#stage-slide');
  const counter = query(root, '#counter');
  const previousButton = query<HTMLButtonElement>(root, '#prev');
  const nextButton = query<HTMLButtonElement>(root, '#next');
  const zoom = query<HTMLInputElement>(root, '#zoom');

  function render(): void {
    const { navigation, deck } = controller;
    const slide = deck.slides[navigation.slideIndex];
    slideBox.innerHTML = renderSlide(slide, { revealedFragments: navigation.stepIndex });
    counter.textContent = `${navigation.slideIndex + 1} / ${deck.slides.length}`;
    previousButton.disabled = navigation.isFirst;
    nextButton.disabled = navigation.isLast;
  }

  nextButton.addEventListener('click', () => controller.next());
  previousButton.addEventListener('click', () => controller.previous());
  query(root, '#open-presenter').addEventListener('click', () => controller.openWindow('presenter'));
  query(root, '#fullscreen').addEventListener('click', toggleFullscreen);
  zoom.addEventListener('input', () => {
    document.documentElement.style.setProperty('--scale', zoom.value);
  });

  controller.onChange(render);
  render();
}
