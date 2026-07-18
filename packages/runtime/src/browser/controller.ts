import type { Deck } from '@mapre/core';
import { DEFAULT_CHANNEL, renderSlide } from '@mapre/core';
import { collectChannels } from '../core/channels';
import { Navigation } from '../core/navigation';
import { createSync } from './sync';
import type { SyncMessage } from './sync';

/**
 * The two window roles the runtime supports. The role is encoded in the URL
 * hash so a second window can be opened from the same single-file document.
 */
export type Role = 'presentation' | 'presenter';

/**
 * A window opened from the presenter, tracked so it can be listed and resized.
 */
export interface ManagedWindow {
  readonly window: Window;
  readonly channel: string;
  readonly label: string;
}

/**
 * Shared presentation controller. It owns the {@link Navigation} state, keeps
 * every open window in sync, and handles global keyboard navigation. Views
 * subscribe via {@link Controller.onChange} and render their own DOM.
 */
export interface Controller {
  readonly deck: Deck;
  readonly navigation: Navigation;
  /** Channel names with the deck's default channel first, the rest sorted. */
  readonly channels: string[];
  next(): void;
  previous(): void;
  goToSlide(index: number): void;
  first(): void;
  last(): void;
  /** Subscribes to position changes; returns an unsubscribe function. */
  onChange(listener: () => void): () => void;
  /**
   * Renders a slide to HTML at the given position, applying the deck's templates
   * and variables (deck metadata plus built-ins like `pageNumber`).
   */
  render(slideIndex: number, stepIndex: number, channel?: string): string;
  openWindow(role: Role, channel?: string): void;
  /** Whether the fixed-aspect slide box outline is currently shown. */
  isBoxVisible(): boolean;
  /** Shows or hides the slide box outline across all synced windows. */
  setBoxVisible(active: boolean): void;
  /** The currently open child windows, with closed ones pruned. */
  listWindows(): ManagedWindow[];
  /** Subscribes to changes in the set of open windows; returns unsubscribe. */
  onWindowsChange(listener: () => void): () => void;
  /** Sets the content scale (text/zoom size) of a specific window. */
  zoomWindow(target: Window, value: number): void;
  /**
   * Announces this window to its opener so the opener can (re)register it. Used
   * by controlled presentation windows so they reconnect after the presenter
   * has been reloaded. A no-op when there is no opener.
   */
  announce(channel: string): void;
}

export function createController(
  deck: Deck,
  templates: Record<string, string> = {},
): Controller {
  const navigation = new Navigation(deck.slides.map((slide) => slide.fragmentCount + 1));
  const slideCount = deck.slides.length;
  const defaultChannel = deck.metadata.defaultChannel ?? DEFAULT_CHANNEL;
  const deckVariables = toStringRecord(deck.metadata);
  const channels = collectChannels(deck, defaultChannel);
  const listeners: Array<() => void> = [];
  const openedWindows: ManagedWindow[] = [];
  const windowListeners: Array<() => void> = [];
  const channelCounts = new Map<string, number>();
  let boxVisible = false;

  const sync = createSync(handleMessage);

  function snapshot(): SyncMessage {
    return {
      kind: 'state',
      slideIndex: navigation.slideIndex,
      stepIndex: navigation.stepIndex,
      showBox: boxVisible,
    };
  }

  function emit(broadcast: boolean): void {
    for (const listener of listeners) {
      listener();
    }
    if (broadcast) {
      sync.broadcast(snapshot());
    }
  }

  function go(move: () => boolean): void {
    if (move()) {
      emit(true);
    }
  }

  function handleMessage(message: SyncMessage, source?: Window): void {
    if (message.kind === 'request-state') {
      sync.broadcast(snapshot());
      return;
    }

    if (message.kind === 'announce') {
      if (source) {
        registerWindow(source, message.channel ?? 'presentation');
      }
      return;
    }

    if (message.kind === 'zoom') {
      applyZoom(message.value);
      return;
    }

    const boxChanged = message.showBox !== undefined && message.showBox !== boxVisible;
    if (message.showBox !== undefined) {
      boxVisible = message.showBox;
    }

    const moved = navigation.goTo(message.slideIndex ?? 0, message.stepIndex ?? 0);
    if (moved || boxChanged) {
      emit(false);
    }
  }

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    const move = keyToMove(event.key, navigation, slideCount);
    if (!move) {
      return;
    }

    event.preventDefault();
    go(move);
  });

  // Ask an already-open window (the opener) for the current position so a newly
  // opened window catches up instead of resetting everyone to the first slide.
  sync.broadcast({ kind: 'request-state' });

  const controller: Controller = {
    deck,
    navigation,
    channels,
    next: () => go(() => navigation.next()),
    previous: () => go(() => navigation.previous()),
    goToSlide: (index: number) => go(() => navigation.goToSlide(index)),
    first: () => go(() => navigation.goToSlide(0)),
    last: () => go(() => navigation.goToSlide(slideCount - 1)),
    onChange: (listener: () => void) => {
      listeners.push(listener);
      return () => {
        const position = listeners.indexOf(listener);
        if (position >= 0) {
          listeners.splice(position, 1);
        }
      };
    },
    render: (slideIndex: number, stepIndex: number, channel?: string) =>
      renderSlide(deck.slides[slideIndex], {
        revealedFragments: stepIndex,
        channel,
        templates,
        variables: {
          ...deckVariables,
          pageNumber: String(slideIndex + 1),
          slideCount: String(slideCount),
        },
      }),
    openWindow: (role: Role, channel?: string) => {
      const url = new URL(location.href);
      url.hash = channel ? `${role}/${channel}` : role;
      // '_blank' opens a fresh window on every call, so the same channel can be
      // shown on several displays at once. The features string asks the browser
      // for a chrome-less popup window rather than a tab.
      const child = window.open(url.toString(), '_blank', windowFeatures());
      if (!child) {
        return;
      }

      registerWindow(child, channel ?? role);
    },
    listWindows: () => {
      for (let index = openedWindows.length - 1; index >= 0; index--) {
        if (openedWindows[index].window.closed) {
          openedWindows.splice(index, 1);
        }
      }
      return [...openedWindows];
    },
    onWindowsChange: (listener: () => void) => {
      windowListeners.push(listener);
      return () => {
        const position = windowListeners.indexOf(listener);
        if (position >= 0) {
          windowListeners.splice(position, 1);
        }
      };
    },
    zoomWindow: (target: Window, value: number) => {
      sync.postTo(target, { kind: 'zoom', value });
    },
    announce: (channel: string) => {
      if (window.opener) {
        sync.postTo(window.opener as Window, { kind: 'announce', channel });
      }
    },
    isBoxVisible: () => boxVisible,
    setBoxVisible: (active: boolean) => {
      if (active === boxVisible) {
        return;
      }
      boxVisible = active;
      emit(true);
    },
  };

  /**
   * Registers a window as controlled: it starts receiving sync updates and, if
   * not already tracked, is added to the window list and sent the current state
   * so it catches up. Called both when opening a window and when a window
   * (re)announces itself after the presenter has been reloaded.
   */
  function registerWindow(target: Window, name: string): void {
    sync.register(target);

    if (openedWindows.some((entry) => entry.window === target)) {
      return;
    }

    const count = (channelCounts.get(name) ?? 0) + 1;
    channelCounts.set(name, count);
    openedWindows.push({ window: target, channel: name, label: `${name} #${count}` });
    notifyWindows();
    sync.postTo(target, snapshot());
  }

  function notifyWindows(): void {
    for (const listener of windowListeners) {
      listener();
    }
  }

  return controller;
}

/**
 * Narrows a metadata record to defined string values, so it can seed template
 * variables without carrying `undefined` entries.
 */
function toStringRecord(metadata: Record<string, string | undefined>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Applies a content scale to the current window by setting the `--scale` custom
 * property that slide font sizes are derived from.
 */
function applyZoom(value: number | undefined): void {
  if (value === undefined) {
    return;
  }

  document.documentElement.style.setProperty('--scale', String(value));
}

/**
 * Builds a `window.open` features string that requests a separate, chrome-less
 * popup window sized relative to the available screen.
 */
function windowFeatures(): string {
  const width = Math.round(window.screen.availWidth * 0.6);
  const height = Math.round(window.screen.availHeight * 0.6);
  return `popup,width=${width},height=${height}`;
}

function keyToMove(
  key: string,
  navigation: Navigation,
  slideCount: number,
): (() => boolean) | undefined {
  switch (key) {
    case 'ArrowRight':
    case 'PageDown':
    case ' ':
      return () => navigation.next();
    case 'ArrowLeft':
    case 'PageUp':
      return () => navigation.previous();
    case 'Home':
      return () => navigation.goToSlide(0);
    case 'End':
      return () => navigation.goToSlide(slideCount - 1);
    default:
      return undefined;
  }
}
