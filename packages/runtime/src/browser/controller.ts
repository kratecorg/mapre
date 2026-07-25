import type { Deck, DeckTree, TreeNode } from '@mapre/core';
import { DEFAULT_CHANNEL, renderSlide } from '@mapre/core';
import { collectChannels } from '../core/channels';
import { TreeNavigation } from '../core/treeNavigation';
import { createSync } from './sync';
import type { SyncMessage } from './sync';

/**
 * The two window roles the runtime supports. The role is encoded in the URL
 * hash so a second window can be opened from the same single-file document.
 */
export type Role = 'presentation' | 'presenter';

/**
 * The spotlight highlight: when active, the audience view dims and a bright
 * circle centred on ({@link Spotlight.x}, {@link Spotlight.y}) stays lit. The
 * coordinates are normalised (0–1) to the slide box.
 */
export interface Spotlight {
  readonly active: boolean;
  readonly x: number;
  readonly y: number;
}

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
  readonly navigation: TreeNavigation;
  /** Tree links for every slide, parallel to {@link Deck.slides}. */
  readonly nodes: readonly TreeNode[];
  /** Whether multi-level (detail-path) navigation is enabled for this deck. */
  readonly multiLevel: boolean;
  /** Number of trunk (top-level) slides — the length of the main talk. */
  readonly trunkCount: number;
  /** Channel names with the deck's default channel first, the rest sorted. */
  readonly channels: string[];
  next(): void;
  previous(): void;
  /** Descends into the current slide's detail branch (down). */
  enterDetail(): void;
  /** Returns from a detail branch to its branching parent (up). */
  exitDetail(): void;
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
  /** The current spotlight highlight state, shared across all synced windows. */
  getSpotlight(): Spotlight;
  /** Turns the spotlight highlight on or off across all synced windows. */
  setSpotlightActive(active: boolean): void;
  /**
   * Moves the spotlight's bright circle. Coordinates are normalised (0–1) to
   * the slide box so the highlight lands on the same slide point in every
   * window regardless of its size.
   */
  moveSpotlight(x: number, y: number): void;
  /** Subscribes to spotlight changes; returns an unsubscribe function. */
  onSpotlightChange(listener: () => void): () => void;
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
  /**
   * Subscribes to reload requests from the presenter (sent when this window
   * reconnects). The listener is invoked after the requested position has been
   * applied to the navigation, so it can persist that position before reloading.
   * Returns an unsubscribe function.
   */
  onReload(listener: () => void): () => void;
}

export function createController(
  tree: DeckTree,
  templates: Record<string, string> = {},
): Controller {
  const deck: Deck = { metadata: tree.metadata, slides: tree.slides };
  const nodes = tree.nodes;
  const navigation = new TreeNavigation(
    nodes,
    tree.slides.map((slide) => slide.fragmentCount + 1),
  );
  const trunkCount = tree.trunkCount;
  const defaultChannel = deck.metadata.defaultChannel ?? DEFAULT_CHANNEL;
  const deckVariables = toStringRecord(deck.metadata);
  const channels = collectChannels(deck, defaultChannel);
  const listeners: Array<() => void> = [];
  const openedWindows: ManagedWindow[] = [];
  const windowListeners: Array<() => void> = [];
  const reloadListeners: Array<() => void> = [];
  const channelCounts = new Map<string, number>();
  const spotlightListeners: Array<() => void> = [];
  let boxVisible = false;
  let spotlight: Spotlight = { active: false, x: 0.5, y: 0.5 };

  const sync = createSync(handleMessage);

  function snapshot(): SyncMessage {
    return {
      kind: 'state',
      slideIndex: navigation.slideIndex,
      stepIndex: navigation.stepIndex,
      showBox: boxVisible,
      spotActive: spotlight.active,
      spotX: spotlight.x,
      spotY: spotlight.y,
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

  function emitSpotlight(): void {
    for (const listener of spotlightListeners) {
      listener();
    }
  }

  /**
   * Adopts the spotlight state carried by a sync message and reports whether it
   * actually changed, so callers only notify listeners on a real update.
   */
  function applySpotlight(message: SyncMessage): boolean {
    const active = message.spotActive ?? spotlight.active;
    const x = message.spotX ?? spotlight.x;
    const y = message.spotY ?? spotlight.y;
    if (active === spotlight.active && x === spotlight.x && y === spotlight.y) {
      return false;
    }
    spotlight = { active, x, y };
    return true;
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
        const adopted = registerWindow(source, message.channel ?? 'presentation');
        // A window that is adopted via an announce (rather than being freshly
        // opened) is reconnecting to a reloaded presenter; reload it so it picks
        // up any changed slides. The current position travels with the request
        // so the window restores exactly where it was instead of resetting.
        if (adopted) {
          sync.postTo(source, {
            kind: 'reload',
            slideIndex: navigation.slideIndex,
            stepIndex: navigation.stepIndex,
          });
        }
      }
      return;
    }

    if (message.kind === 'reload') {
      navigation.goTo(message.slideIndex ?? navigation.slideIndex, message.stepIndex ?? navigation.stepIndex);
      for (const listener of reloadListeners) {
        listener();
      }
      return;
    }

    if (message.kind === 'zoom') {
      applyZoom(message.value);
      return;
    }

    if (message.kind === 'spotlight') {
      applySpotlight(message);
      emitSpotlight();
      return;
    }

    const boxChanged = message.showBox !== undefined && message.showBox !== boxVisible;
    if (message.showBox !== undefined) {
      boxVisible = message.showBox;
    }

    const spotlightChanged = applySpotlight(message);

    const moved = navigation.goTo(message.slideIndex ?? 0, message.stepIndex ?? 0);
    if (moved || boxChanged) {
      emit(false);
    }
    if (spotlightChanged) {
      emitSpotlight();
    }
  }

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'h' || event.key === 'H') {
      event.preventDefault();
      controller.setSpotlightActive(!controller.getSpotlight().active);
      return;
    }

    const move = keyToMove(event.key, navigation);
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
    nodes,
    multiLevel: tree.multiLevel,
    trunkCount,
    channels,
    next: () => go(() => navigation.next()),
    previous: () => go(() => navigation.previous()),
    enterDetail: () => go(() => navigation.enterDetail()),
    exitDetail: () => go(() => navigation.exitDetail()),
    goToSlide: (index: number) => go(() => navigation.goToSlide(index)),
    first: () => go(() => navigation.first()),
    last: () => go(() => navigation.last()),
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
          pageNumber: nodes[slideIndex]?.pathLabel ?? String(slideIndex + 1),
          slideCount: String(trunkCount),
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
    onReload: (listener: () => void) => {
      reloadListeners.push(listener);
      return () => {
        const position = reloadListeners.indexOf(listener);
        if (position >= 0) {
          reloadListeners.splice(position, 1);
        }
      };
    },
    isBoxVisible: () => boxVisible,
    setBoxVisible: (active: boolean) => {
      if (active === boxVisible) {
        return;
      }
      boxVisible = active;
      emit(true);
    },
    getSpotlight: () => spotlight,
    setSpotlightActive: (active: boolean) => {
      if (active === spotlight.active) {
        return;
      }
      spotlight = { ...spotlight, active };
      sync.broadcast({ kind: 'spotlight', spotActive: active, spotX: spotlight.x, spotY: spotlight.y });
      emitSpotlight();
    },
    moveSpotlight: (x: number, y: number) => {
      const clampedX = clamp01(x);
      const clampedY = clamp01(y);
      if (clampedX === spotlight.x && clampedY === spotlight.y) {
        return;
      }
      spotlight = { ...spotlight, x: clampedX, y: clampedY };
      sync.broadcast({
        kind: 'spotlight',
        spotActive: spotlight.active,
        spotX: clampedX,
        spotY: clampedY,
      });
      emitSpotlight();
    },
    onSpotlightChange: (listener: () => void) => {
      spotlightListeners.push(listener);
      return () => {
        const position = spotlightListeners.indexOf(listener);
        if (position >= 0) {
          spotlightListeners.splice(position, 1);
        }
      };
    },
  };

  /**
   * Registers a window as controlled: it starts receiving sync updates and, if
   * not already tracked, is added to the window list and sent the current state
   * so it catches up. Called both when opening a window and when a window
   * (re)announces itself after the presenter has been reloaded. Returns whether
   * the window was newly adopted (i.e. not already tracked).
   */
  function registerWindow(target: Window, name: string): boolean {
    sync.register(target);

    if (openedWindows.some((entry) => entry.window === target)) {
      return false;
    }

    const count = (channelCounts.get(name) ?? 0) + 1;
    channelCounts.set(name, count);
    openedWindows.push({ window: target, channel: name, label: `${name} #${count}` });
    notifyWindows();
    sync.postTo(target, snapshot());
    return true;
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

/** Clamps a value into the normalised 0–1 range used for spotlight coordinates. */
function clamp01(value: number): number {
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
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
  navigation: TreeNavigation,
): (() => boolean) | undefined {
  switch (key) {
    case 'ArrowRight':
    case 'PageDown':
    case ' ':
      return () => navigation.next();
    case 'ArrowLeft':
    case 'PageUp':
      return () => navigation.previous();
    case 'ArrowDown':
      return () => navigation.enterDetail();
    case 'ArrowUp':
      return () => navigation.exitDetail();
    case 'Home':
      return () => navigation.first();
    case 'End':
      return () => navigation.last();
    default:
      return undefined;
  }
}
