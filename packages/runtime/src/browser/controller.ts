import type { Deck } from '@mapre/core';
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
  /** Distinct channel names across the deck, sorted alphabetically. */
  readonly channels: string[];
  next(): void;
  previous(): void;
  goToSlide(index: number): void;
  first(): void;
  last(): void;
  onChange(listener: () => void): void;
  openWindow(role: Role, channel?: string): void;
}

export function createController(deck: Deck): Controller {
  const navigation = new Navigation(deck.slides.map((slide) => slide.fragmentCount + 1));
  const slideCount = deck.slides.length;
  const channels = collectChannels(deck);
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
    },
    openWindow: (role: Role, channel?: string) => {
      const url = new URL(location.href);
      url.hash = channel ? `${role}/${channel}` : role;
      const child = window.open(url.toString(), `mapre-${role}-${channel ?? 'default'}`);
      if (child) {
        sync.register(child);
      }
    },
  };
}

/**
 * Collects the distinct channel names used anywhere in the deck, sorted for a
 * stable presentation in the UI.
 */
function collectChannels(deck: Deck): string[] {
  const names = new Set<string>();
  for (const slide of deck.slides) {
    for (const name of Object.keys(slide.channels)) {
      names.add(name);
    }
  }
  return [...names].sort((first, second) => first.localeCompare(second));
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
