import type { Controller } from './controller';
import { query, toggleFullscreen } from './dom';
import { mountOverview } from './overview';
import { mountSpotlight } from './spotlight';
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
  '<div class="stage"><div class="slide-box"><div class="slide" id="stage-slide"></div></div><div class="spotlight" id="spotlight" aria-hidden="true"></div></div>';

const CONTROL_BAR = `
  <footer class="bar">
    <button id="prev" type="button" aria-label="Previous">&#9664;</button>
    <span id="counter"></span>
    <button id="next" type="button" aria-label="Next">&#9654;</button>
    <span id="channel-label" class="channel-label"></span>
    <button id="overview" type="button">Overview</button>
    <button id="highlight" type="button" aria-pressed="false">Highlight</button>
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
  const stage = query(root, '.stage');
  const spotlight = query(root, '#spotlight');
  const highlightButton = options.connected
    ? undefined
    : query<HTMLButtonElement>(root, '#highlight');

  function render(): void {
    const { navigation } = controller;
    slideBox.innerHTML = controller.render(navigation.slideIndex, navigation.stepIndex, channel);
    box.classList.toggle('show-box', controller.isBoxVisible());
    updateBar();
  }

  const spotlightMount = mountSpotlight({
    controller,
    overlay: spotlight,
    container: stage,
    slideBox: box,
    track: true,
    onActiveChange: (active) => {
      highlightButton?.setAttribute('aria-pressed', String(active));
      highlightButton?.classList.toggle('is-active', active);
    },
  });

  function updateBar(): void {
    if (options.connected) {
      return;
    }
    const { navigation, nodes, trunkCount } = controller;
    const label = nodes[navigation.slideIndex]?.pathLabel ?? String(navigation.slideIndex + 1);
    query(root, '#counter').textContent = `${label} / ${trunkCount}`;
    query<HTMLButtonElement>(root, '#prev').disabled = navigation.isFirst;
    query<HTMLButtonElement>(root, '#next').disabled = navigation.isLast;
  }

  let closeOverview: (() => void) | undefined;
  if (!options.connected) {
    wireControlBar(root, controller, channel, options.onOpenPresenter, toggleOverview);
    highlightButton?.addEventListener('click', () => {
      controller.setSpotlightActive(!controller.getSpotlight().active);
    });
  }

  function toggleOverview(): void {
    if (closeOverview) {
      closeOverview();
      return;
    }
    closeOverview = mountOverview(controller, {
      channel,
      onClose: () => {
        closeOverview = undefined;
      },
    });
  }

  const unsubscribe = controller.onChange(render);
  render();
  return () => {
    closeOverview?.();
    unsubscribe();
    spotlightMount.dispose();
  };
}

function wireControlBar(
  root: HTMLElement,
  controller: Controller,
  channel: string,
  onOpenPresenter: () => void,
  onToggleOverview: () => void,
): void {
  if (controller.channels.length > 1) {
    query(root, '#channel-label').textContent = channel;
  }

  query(root, '#next').addEventListener('click', () => controller.next());
  query(root, '#prev').addEventListener('click', () => controller.previous());
  query(root, '#overview').addEventListener('click', onToggleOverview);
  query(root, '#open-presenter').addEventListener('click', onOpenPresenter);
  query(root, '#fullscreen').addEventListener('click', toggleFullscreen);
  query(root, '#zoom').appendChild(
    createZoomControl(DEFAULT_SCALE, (value) => {
      document.documentElement.style.setProperty('--scale', String(value));
    }),
  );
}
