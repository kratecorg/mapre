import { renderSlide } from '@mapre/core';
import { Timer } from '../core/timer';
import { formatDuration } from '../core/format';
import type { Controller, ManagedWindow } from './controller';
import { query } from './dom';
import { createZoomControl, DEFAULT_SCALE } from './zoomControl';

const TIMER_TICK_MS = 250;
const WINDOWS_TICK_MS = 1000;

const TEMPLATE = `
  <div class="presenter">
    <section class="pv-current">
      <div class="pv-label">Current</div>
      <div class="pv-stage">
        <div class="slide-box" id="pv-current-box">
          <div class="slide" id="pv-current"></div>
        </div>
      </div>
    </section>
    <aside class="pv-side">
      <section class="pv-next">
        <div class="pv-label">Next</div>
        <div class="pv-stage">
          <div class="slide-box">
            <div class="slide" id="pv-next"></div>
          </div>
        </div>
      </section>
      <section class="pv-notes">
        <div class="pv-label">Notes</div>
        <div id="pv-notes"></div>
      </section>
      <section class="pv-windows">
        <div class="pv-label">Windows</div>
        <div id="pv-windows"></div>
        <div id="pv-windows-empty" class="pv-empty">No open windows</div>
      </section>
    </aside>
    <footer class="pv-bar">
      <div class="pv-timer">
        <span id="pv-time">00:00</span>
        <button id="pv-toggle" type="button">Start</button>
        <button id="pv-reset" type="button">Reset</button>
      </div>
      <div class="pv-view">
        <button id="pv-box-toggle" type="button" aria-pressed="false">Box</button>
      </div>
      <div class="pv-channels" id="pv-channels"></div>
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
 * sync with the presentation windows via the controller.
 *
 * Returns a dispose function that detaches the view from the controller and
 * stops the timer interval.
 */
export function mountPresenterView(root: HTMLElement, controller: Controller): () => void {
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
  const boxToggleButton = query(root, '#pv-box-toggle');
  const currentSlideBox = query(root, '#pv-current-box');

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

  boxToggleButton.addEventListener('click', () => {
    controller.setBoxVisible(!controller.isBoxVisible());
    renderBoxState();
  });

  function renderBoxState(): void {
    const active = controller.isBoxVisible();
    currentSlideBox.classList.toggle('show-box', active);
    boxToggleButton.classList.toggle('is-active', active);
    boxToggleButton.setAttribute('aria-pressed', String(active));
  }

  mountChannelButtons(query(root, '#pv-channels'), controller);

  const windows = mountWindowList(
    query(root, '#pv-windows'),
    query(root, '#pv-windows-empty'),
    controller,
  );

  const unsubscribe = controller.onChange(() => {
    renderPreview();
    renderBoxState();
  });
  renderPreview();
  renderBoxState();
  renderTimer();
  const intervalId = window.setInterval(renderTimer, TIMER_TICK_MS);
  const windowsIntervalId = window.setInterval(windows.refresh, WINDOWS_TICK_MS);

  return () => {
    unsubscribe();
    windows.dispose();
    window.clearInterval(intervalId);
    window.clearInterval(windowsIntervalId);
  };
}

/**
 * Renders the list of open windows, adding and removing rows as windows open and
 * close so that in-progress input (e.g. a typed size) is never clobbered. Each
 * row can resize, focus, or close its window.
 */
function mountWindowList(
  container: HTMLElement,
  emptyLabel: HTMLElement,
  controller: Controller,
): { refresh: () => void; dispose: () => void } {
  const rows = new Map<Window, HTMLElement>();

  function refresh(): void {
    const managed = controller.listWindows();
    const live = new Set(managed.map((entry) => entry.window));

    for (const [win, row] of rows) {
      if (!live.has(win)) {
        row.remove();
        rows.delete(win);
      }
    }

    for (const entry of managed) {
      if (!rows.has(entry.window)) {
        const row = createWindowRow(entry, controller, refresh);
        rows.set(entry.window, row);
        container.appendChild(row);
      }
    }

    emptyLabel.style.display = managed.length === 0 ? '' : 'none';
  }

  const unsubscribe = controller.onWindowsChange(refresh);
  refresh();

  return { refresh, dispose: unsubscribe };
}

function createWindowRow(
  entry: ManagedWindow,
  controller: Controller,
  onChange: () => void,
): HTMLElement {
  const row = document.createElement('div');
  row.className = 'pv-window';

  const label = document.createElement('span');
  label.className = 'pv-window-label';
  label.textContent = entry.label;

  const zoom = createZoomControl(DEFAULT_SCALE, (value) => {
    controller.zoomWindow(entry.window, value);
  });

  const focus = actionButton('Focus', () => entry.window.focus());
  const close = actionButton('Close', () => {
    entry.window.close();
    onChange();
  });

  row.append(label, zoom, focus, close);
  return row;
}

function actionButton(text: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = text;
  button.addEventListener('click', onClick);
  return button;
}

/**
 * Adds buttons that open presentation windows. A single-channel deck gets one
 * "Open presentation" button; a multi-channel deck gets one button per channel
 * so each display can show its own channel.
 */
function mountChannelButtons(container: HTMLElement, controller: Controller): void {
  if (controller.channels.length <= 1) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Open presentation';
    button.addEventListener('click', () => controller.openWindow('presentation'));
    container.appendChild(button);
    return;
  }

  const label = document.createElement('span');
  label.className = 'pv-label';
  label.textContent = 'Open channel';
  container.appendChild(label);

  for (const channel of controller.channels) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = channel;
    button.addEventListener('click', () => controller.openWindow('presentation', channel));
    container.appendChild(button);
  }
}
