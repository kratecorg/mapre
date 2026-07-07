import { renderSlide } from '@mapre/core';
import type { Controller } from './controller';
import { query, toggleFullscreen } from './dom';
import { createZoomControl, DEFAULT_SCALE } from './zoomControl';

/**
 * Options for {@link mountPresentationView}.
 */
export interface PresentationViewOptions {
  /**
   * Whether this window is controlled by a presenter. When true, the control
   * bar is hidden and navigation happens from the presenter window.
   */
  connected: boolean;
  /** Switches this window into presenter mode in place. */
  onOpenPresenter: () => void;
}

const STAGE =
  '<div class="stage"><div class="slide-box"><div class="slide" id="stage-slide"></div></div></div>';

const CONTROL_BAR = `
  <footer class="bar">
    <button id="prev" type="button" aria-label="Previous">&#9664;</button>
    <span id="counter"></span>
    <button id="next" type="button" aria-label="Next">&#9654;</button>
    <span id="channel-label" class="channel-label"></span>
    <button id="open-presenter" type="button">Presenter</button>
    <button id="fullscreen" type="button" aria-label="Fullscreen">&#9974;</button>
    <span id="zoom" class="zoom"></span>
  </footer>`;

/**
 * Mounts the audience-facing view: a single full-window slide, and — unless the
 * window is controlled by a presenter — a control bar. It renders the given
 * channel and stays in sync with any other open window via the controller.
 *
 * Returns a dispose function that detaches the view from the controller.
 */
export function mountPresentationView(
  root: HTMLElement,
  controller: Controller,
  channel: string,
  options: PresentationViewOptions,
): () => void {
  root.innerHTML = options.connected ? STAGE : STAGE + CONTROL_BAR;

  const slideBox = query(root, '#stage-slide');
  const box = query(root, '.slide-box');

  function render(): void {
    const { navigation, deck } = controller;
    const slide = deck.slides[navigation.slideIndex];
    slideBox.innerHTML = renderSlide(slide, {
      revealedFragments: navigation.stepIndex,
      channel,
    });
    box.classList.toggle('show-box', controller.isBoxVisible());
    updateBar();
  }

  function updateBar(): void {
    if (options.connected) {
      return;
    }
    const { navigation, deck } = controller;
    query(root, '#counter').textContent = `${navigation.slideIndex + 1} / ${deck.slides.length}`;
    query<HTMLButtonElement>(root, '#prev').disabled = navigation.isFirst;
    query<HTMLButtonElement>(root, '#next').disabled = navigation.isLast;
  }

  if (!options.connected) {
    wireControlBar(root, controller, channel, options.onOpenPresenter);
  }

  const unsubscribe = controller.onChange(render);
  render();
  return unsubscribe;
}

function wireControlBar(
  root: HTMLElement,
  controller: Controller,
  channel: string,
  onOpenPresenter: () => void,
): void {
  if (controller.channels.length > 1) {
    query(root, '#channel-label').textContent = channel;
  }

  query(root, '#next').addEventListener('click', () => controller.next());
  query(root, '#prev').addEventListener('click', () => controller.previous());
  query(root, '#open-presenter').addEventListener('click', onOpenPresenter);
  query(root, '#fullscreen').addEventListener('click', toggleFullscreen);
  query(root, '#zoom').appendChild(
    createZoomControl(DEFAULT_SCALE, (value) => {
      document.documentElement.style.setProperty('--scale', String(value));
    }),
  );
}
