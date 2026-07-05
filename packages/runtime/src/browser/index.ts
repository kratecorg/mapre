import { parseDeck } from '@mapre/core';
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

  const root = requireElement('app');
  const controller = createController(deck);

  if (roleFromHash() === 'presenter') {
    mountPresenterView(root, controller);
    return;
  }

  mountPresentationView(root, controller);
}

function roleFromHash(): Role {
  return location.hash.replace(/^#/, '') === 'presenter' ? 'presenter' : 'presentation';
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
