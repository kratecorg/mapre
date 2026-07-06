import { renderSlide } from '@mapre/core';
import type { Controller } from './controller';
import { query, toggleFullscreen } from './dom';

const TEMPLATE = `
  <div class="stage"><div class="slide" id="stage-slide"></div></div>
  <footer class="bar">
    <button id="prev" type="button" aria-label="Previous">&#9664;</button>
    <span id="counter"></span>
    <button id="next" type="button" aria-label="Next">&#9654;</button>
    <span id="channel-label" class="channel-label"></span>
    <button id="open-presenter" type="button">Presenter</button>
    <button id="fullscreen" type="button" aria-label="Fullscreen">&#9974;</button>
    <label class="zoom">Size
      <input id="zoom" type="range" min="1" max="4" step="0.1" value="1.6" />
    </label>
  </footer>`;

/**
 * Mounts the audience-facing view: a single full-window slide plus a control
 * bar. It renders the given channel and stays in sync with any other open
 * window via the controller.
 */
export function mountPresentationView(
  root: HTMLElement,
  controller: Controller,
  channel: string,
): void {
  root.innerHTML = TEMPLATE;

  const slideBox = query(root, '#stage-slide');
  const counter = query(root, '#counter');
  const previousButton = query<HTMLButtonElement>(root, '#prev');
  const nextButton = query<HTMLButtonElement>(root, '#next');
  const zoom = query<HTMLInputElement>(root, '#zoom');

  if (controller.channels.length > 1) {
    query(root, '#channel-label').textContent = channel;
  }

  function render(): void {
    const { navigation, deck } = controller;
    const slide = deck.slides[navigation.slideIndex];
    slideBox.innerHTML = renderSlide(slide, {
      revealedFragments: navigation.stepIndex,
      channel,
    });
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
