import { Timer } from '../core/timer';
import type { TimerState } from '../core/timer';
import { formatDuration } from '../core/format';
import type { Controller, ManagedWindow } from './controller';
import { query } from './dom';
import { mountOverview } from './overview';
import { mountSpotlight } from './spotlight';
import { createZoomControl, DEFAULT_SCALE } from './zoomControl';

const TIMER_TICK_MS = 250;
const WINDOWS_TICK_MS = 1000;
const TIMER_STORAGE_PREFIX = 'mapre:timer:';

const TEMPLATE = `
  <div class="presenter">
    <section class="pv-current">
      <div class="pv-label">Current<span id="pv-overflow" class="pv-overflow" title="Slide content overflows the box">⚠ Overflow</span></div>
      <div class="pv-stage">
        <div class="slide-box" id="pv-current-box">
          <div class="slide" id="pv-current"></div>
        </div>
        <div class="spotlight" id="pv-spotlight" aria-hidden="true"></div>
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
        <button id="pv-overview" type="button">Overview</button>
        <button id="pv-box-toggle" type="button" aria-pressed="false">Box</button>
        <button id="pv-highlight" type="button" aria-pressed="false">Highlight</button>
      </div>
      <div class="pv-channel-view" id="pv-channel-view"></div>
      <div class="pv-channels" id="pv-channels"></div>
      <div class="pv-nav">
        <button id="prev" type="button" aria-label="Previous">&#9664;</button>
        <button id="pv-exit" type="button" aria-label="Exit detail (up)">&#9650;</button>
        <span id="counter"></span>
        <button id="pv-enter" type="button" aria-label="Enter detail (down)">&#9660;</button>
        <button id="next" type="button" aria-label="Next">&#9654;</button>
      </div>
    </footer>
  </div>`;

/**
 * Options for {@link mountPresenterView}.
 */
export interface PresenterViewOptions {
  /** The channel whose content the presenter previews render initially. */
  channel: string;
  /** Called when the presenter picks a different channel to preview. */
  onChannelChange: (channel: string) => void;
}

/**
 * Mounts the presenter view: the current slide, a preview of what the next step
 * reveals, speaker notes, a timer, and navigation controls. Navigation stays in
 * sync with the presentation windows via the controller.
 *
 * Returns a dispose function that detaches the view from the controller and
 * stops the timer interval.
 */
export function mountPresenterView(
  root: HTMLElement,
  controller: Controller,
  options: PresenterViewOptions,
): () => void {
  root.innerHTML = TEMPLATE;
  document.title = `${controller.deck.metadata.title ?? 'mapre'} \u2013 Presenter`;

  let channel = options.channel;

  const currentBox = query(root, '#pv-current');
  const nextBox = query(root, '#pv-next');
  const notesBox = query(root, '#pv-notes');
  const counter = query(root, '#counter');
  const previousButton = query<HTMLButtonElement>(root, '#prev');
  const nextButton = query<HTMLButtonElement>(root, '#next');
  const timeLabel = query(root, '#pv-time');
  const toggleButton = query(root, '#pv-toggle');
  const boxToggleButton = query(root, '#pv-box-toggle');
  const highlightButton = query(root, '#pv-highlight');
  const currentSlideBox = query(root, '#pv-current-box');
  const currentStage = query(root, '.pv-current .pv-stage');
  const currentSpotlight = query(root, '#pv-spotlight');
  const overflowBadge = query(root, '#pv-overflow');

  const overviewButton = query(root, '#pv-overview');

  const detailControls = controller.multiLevel
    ? { enter: query<HTMLButtonElement>(root, '#pv-enter'), exit: query<HTMLButtonElement>(root, '#pv-exit') }
    : undefined;
  if (detailControls) {
    detailControls.enter.addEventListener('click', () => controller.enterDetail());
    detailControls.exit.addEventListener('click', () => controller.exitDetail());
  } else {
    query(root, '#pv-enter').remove();
    query(root, '#pv-exit').remove();
  }

  const timerStorageKey = `${TIMER_STORAGE_PREFIX}${controller.deck.metadata.title ?? ''}`;
  const timer = new Timer();
  const restoredTimer = loadTimerState(timerStorageKey);
  if (restoredTimer) {
    timer.restore(restoredTimer);
  }

  function renderPreview(): void {
    const { navigation, deck } = controller;
    const slide = deck.slides[navigation.slideIndex];

    currentBox.innerHTML = controller.render(navigation.slideIndex, navigation.stepIndex, channel);
    nextBox.innerHTML = renderNextPreview();
    notesBox.textContent = slide.notes ?? '';
    counter.textContent = formatCounter();
    previousButton.disabled = navigation.isFirst;
    nextButton.disabled = navigation.isLast;
    renderDetailControls();
    updateOverflowWarning();
  }

  /**
   * Shows the current position. In a multi-level deck this is the hierarchical
   * path label (e.g. `2.1`) out of the number of trunk slides; otherwise the
   * plain slide number.
   */
  function formatCounter(): string {
    const { navigation, nodes, trunkCount } = controller;
    const label = nodes[navigation.slideIndex]?.pathLabel ?? String(navigation.slideIndex + 1);
    return `${label} / ${trunkCount}`;
  }

  /**
   * Reflects the detail-branch affordances: enables the down button when the
   * current slide has a detail path and the up button when inside one.
   */
  function renderDetailControls(): void {
    if (!detailControls) {
      return;
    }
    const { navigation } = controller;
    detailControls.enter.disabled = !navigation.hasDetail;
    detailControls.exit.disabled = !navigation.canExitDetail;
  }

  /**
   * Flags when the current slide's content exceeds its fixed-aspect box, so the
   * presenter can trim it. Content is clipped rather than shrunk, so the warning
   * is the only cue that something is cut off.
   */
  function updateOverflowWarning(): void {
    const overflowing =
      currentBox.scrollHeight > currentBox.clientHeight + 1 ||
      currentBox.scrollWidth > currentBox.clientWidth + 1;
    overflowBadge.classList.toggle('is-visible', overflowing);
  }

  /**
   * Renders whatever the Next action will reveal: the next fragment of the
   * current slide, or the start of the following slide in the current path
   * (which, at the end of a detail branch, is the main talk it returns to).
   */
  function renderNextPreview(): string {
    const { navigation } = controller;
    const slide = controller.deck.slides[navigation.slideIndex];

    if (navigation.stepIndex < slide.fragmentCount) {
      return controller.render(navigation.slideIndex, navigation.stepIndex + 1, channel);
    }
    const forward = navigation.peekForward();
    if (forward !== -1) {
      return controller.render(forward, 0, channel);
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
    saveTimerState(timerStorageKey, timer.getState());
    renderTimer();
  });
  query(root, '#pv-reset').addEventListener('click', () => {
    timer.reset();
    saveTimerState(timerStorageKey, timer.getState());
    renderTimer();
  });

  boxToggleButton.addEventListener('click', () => {
    controller.setBoxVisible(!controller.isBoxVisible());
    renderBoxState();
  });

  highlightButton.addEventListener('click', () => {
    controller.setSpotlightActive(!controller.getSpotlight().active);
  });

  let closeOverview: (() => void) | undefined;
  overviewButton.addEventListener('click', () => {
    if (closeOverview) {
      closeOverview();
      return;
    }
    overviewButton.classList.add('is-active');
    closeOverview = mountOverview(controller, {
      channel,
      onClose: () => {
        closeOverview = undefined;
        overviewButton.classList.remove('is-active');
      },
    });
  });

  function renderBoxState(): void {
    const active = controller.isBoxVisible();
    currentSlideBox.classList.toggle('show-box', active);
    boxToggleButton.classList.toggle('is-active', active);
    boxToggleButton.setAttribute('aria-pressed', String(active));
  }

  // The presenter's own current-slide preview is the primary pointer surface:
  // moving the mouse over it steers the spotlight, which the controller
  // broadcasts so every presentation window follows.
  const spotlightMount = mountSpotlight({
    controller,
    overlay: currentSpotlight,
    container: currentStage,
    slideBox: currentSlideBox,
    track: true,
    onActiveChange: (active) => {
      highlightButton.classList.toggle('is-active', active);
      highlightButton.setAttribute('aria-pressed', String(active));
    },
  });

  mountChannelButtons(query(root, '#pv-channels'), controller);

  const channelSwitch = mountChannelSwitch(query(root, '#pv-channel-view'), controller, (selected) => {
    if (selected === channel) {
      return;
    }
    channel = selected;
    channelSwitch.setActive(channel);
    renderPreview();
    options.onChannelChange(channel);
  });
  channelSwitch.setActive(channel);

  const windows = mountWindowList(
    query(root, '#pv-windows'),
    query(root, '#pv-windows-empty'),
    controller,
  );

  const unsubscribe = controller.onChange(() => {
    renderPreview();
    renderBoxState();
    spotlightMount.render();
  });
  renderPreview();
  renderBoxState();
  renderTimer();
  const intervalId = window.setInterval(renderTimer, TIMER_TICK_MS);
  const windowsIntervalId = window.setInterval(windows.refresh, WINDOWS_TICK_MS);

  return () => {
    unsubscribe();
    spotlightMount.dispose();
    windows.dispose();
    closeOverview?.();
    window.clearInterval(intervalId);
    window.clearInterval(windowsIntervalId);
  };
}

/**
 * Loads a persisted timer state, tolerating storage being unavailable (e.g. some
 * `file://` contexts) or the payload being malformed.
 */
function loadTimerState(key: string): TimerState | undefined {
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) {
      return undefined;
    }

    const parsed = JSON.parse(raw) as Partial<TimerState>;
    if (
      typeof parsed.running !== 'boolean' ||
      typeof parsed.accumulatedMs !== 'number' ||
      typeof parsed.startedAt !== 'number'
    ) {
      return undefined;
    }

    return { running: parsed.running, accumulatedMs: parsed.accumulatedMs, startedAt: parsed.startedAt };
  } catch {
    return undefined;
  }
}

/**
 * Persists the timer state so it survives a presenter reload. Failures are
 * swallowed because the timer must keep working even without storage.
 */
function saveTimerState(key: string, state: TimerState): void {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(state));
  } catch {
    // Storage may be unavailable; the timer still works in-memory.
  }
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

/**
 * A mounted channel switch, exposing a way to reflect the active channel in the
 * button highlight.
 */
interface ChannelSwitch {
  setActive(channel: string): void;
}

/**
 * Adds buttons that switch which channel the presenter's own previews render.
 * This is local to the presenter window and does not affect audience windows;
 * the choice is persisted by the caller via {@link PresenterViewOptions}. A
 * single-channel deck gets no switch (there is nothing to choose).
 */
function mountChannelSwitch(
  container: HTMLElement,
  controller: Controller,
  onSelect: (channel: string) => void,
): ChannelSwitch {
  if (controller.channels.length <= 1) {
    return { setActive: () => {} };
  }

  const label = document.createElement('span');
  label.className = 'pv-label';
  label.textContent = 'View';
  container.appendChild(label);

  const buttons = new Map<string, HTMLButtonElement>();
  for (const channel of controller.channels) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = channel;
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => onSelect(channel));
    buttons.set(channel, button);
    container.appendChild(button);
  }

  return {
    setActive(active: string): void {
      for (const [name, button] of buttons) {
        const isActive = name === active;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
      }
    },
  };
}
