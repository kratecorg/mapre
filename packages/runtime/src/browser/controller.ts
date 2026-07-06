import type { Deck } from '@mapre/core';
import { DEFAULT_CHANNEL } from '@mapre/core';
import { Navigation } from '../core/navigation';
import { createSync } from './sync';
import type { SyncMessage } from './sync';

/**
 * The two window roles the runtime supports. The role is encoded in the URL
 * hash so a second window can be opened from the same single-file document.
 */
export type Role = 'presentation' | 'presenter';

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
  openWindow(role: Role, channel?: string): void;
}

export function createController(deck: Deck): Controller {
  const navigation = new Navigation(deck.slides.map((slide) => slide.fragmentCount + 1));
  const slideCount = deck.slides.length;
  const defaultChannel = deck.metadata.defaultChannel ?? DEFAULT_CHANNEL;
  const channels = collectChannels(deck, defaultChannel);
  const listeners: Array<() => void> = [];

  const sync = createSync(handleMessage);

  function snapshot(): SyncMessage {
    return {
      kind: 'state',
      slideIndex: navigation.slideIndex,
      stepIndex: navigation.stepIndex,
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

  function handleMessage(message: SyncMessage): void {
    if (message.kind === 'request-state') {
      sync.broadcast(snapshot());
      return;
    }

    if (navigation.goTo(message.slideIndex ?? 0, message.stepIndex ?? 0)) {
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

  return {
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
    openWindow: (role: Role, channel?: string) => {
      const url = new URL(location.href);
      url.hash = channel ? `${role}/${channel}` : role;
      // '_blank' opens a fresh window on every call, so the same channel can be
      // shown on several displays at once. The features string asks the browser
      // for a chrome-less popup window rather than a tab.
      const child = window.open(url.toString(), '_blank', windowFeatures());
      if (child) {
        sync.register(child);
      }
    },
  };
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

/**
 * Collects the channel names for the UI: the deck's default channel first, then
 * every other channel used in the deck, sorted alphabetically. The default is
 * always present so it can be opened even when no slide carries default content.
 */
function collectChannels(deck: Deck, defaultChannel: string): string[] {
  const names = new Set<string>();
  for (const slide of deck.slides) {
    for (const name of Object.keys(slide.channels)) {
      names.add(name);
    }
  }
  names.delete(defaultChannel);
  const rest = [...names].sort((first, second) => first.localeCompare(second));
  return [defaultChannel, ...rest];
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
