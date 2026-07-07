import { DEFAULT_CHANNEL, parseDeck } from '@mapre/core';
import { applyAspectRatio } from './aspect';
import { createController } from './controller';
import type { Role } from './controller';
import { mountPresentationView } from './presentationView';
import { mountPresenterView } from './presenterView';

/**
 * Browser entry point for the single-file presentation. It reads the embedded
 * markdown, parses it at runtime, and mounts the view for the current window
 * role (presentation or presenter). Both windows are driven by a shared
 * controller that keeps them in sync.
 */
function start(): void {
  const deck = parseDeck(readSource());
  if (deck.slides.length === 0) {
    throw new Error('The deck has no slides.');
  }
  if (deck.metadata.title) {
    document.title = deck.metadata.title;
  }

  applyAspectRatio(document.documentElement, deck.metadata.aspect);

  const root = requireElement('app');
  const controller = createController(deck);
  const { role, channel } = parseHash(location.hash);
  const activeChannel = channel ?? deck.metadata.defaultChannel ?? DEFAULT_CHANNEL;

  // A presentation window opened by a presenter (i.e. it has an opener) is
  // controlled from there, so it hides its own control bar.
  const connected = window.opener != null;

  let dispose: (() => void) | undefined;

  function show(nextRole: Role): void {
    dispose?.();
    if (nextRole === 'presenter') {
      dispose = mountPresenterView(root, controller);
      return;
    }

    dispose = mountPresentationView(root, controller, activeChannel, {
      connected,
      onOpenPresenter: () => show('presenter'),
    });
  }

  show(role);
}

function parseHash(hash: string): { role: Role; channel?: string } {
  const [rolePart, channelPart] = hash.replace(/^#/, '').split('/');
  const role: Role = rolePart === 'presenter' ? 'presenter' : 'presentation';
  return { role, channel: channelPart || undefined };
}

function readSource(): string {
  const element = document.getElementById('mapre-source');
  if (!element || !element.textContent) {
    throw new Error('Missing embedded deck source.');
  }
  return JSON.parse(element.textContent) as string;
}

function requireElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing required element: #${id}`);
  }
  return element;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}
