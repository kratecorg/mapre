import { DEFAULT_CHANNEL, parseDeck } from '@mapre/core';
import { applyAspectRatio } from './aspect';
import { createController } from './controller';
import type { Role } from './controller';
import { formatHash, parseHash } from './hash';
import { mountPresentationView } from './presentationView';
import { mountPresenterView } from './presenterView';

/**
 * How often a controlled presentation window re-announces itself to its opener.
 * This lets the presenter re-register still-open windows after it is reloaded.
 */
const ANNOUNCE_INTERVAL_MS = 1000;

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
  const controller = createController(deck, readTemplates());
  const parsed = parseHash(location.hash);
  const defaultChannel = deck.metadata.defaultChannel ?? DEFAULT_CHANNEL;
  let activeChannel = parsed.channel ?? defaultChannel;

  // Restore the position from the URL so a reload continues where it left off.
  // A connected window is corrected moments later by the presenter's handshake.
  if (parsed.slideIndex !== undefined) {
    controller.navigation.goTo(parsed.slideIndex, parsed.stepIndex ?? 0);
  }

  // A presentation window opened by a presenter (i.e. it has an opener) is
  // controlled from there, so it hides its own control bar.
  const connected = window.opener != null;

  let dispose: (() => void) | undefined;
  let currentRole: Role = parsed.role;

  function writeHash(): void {
    const nextHash = formatHash({
      role: currentRole,
      channel: activeChannel,
      defaultChannel,
      slideIndex: controller.navigation.slideIndex,
      stepIndex: controller.navigation.stepIndex,
    });
    if (location.hash === nextHash) {
      return;
    }
    try {
      history.replaceState(null, '', nextHash);
    } catch {
      // Some browsers reject replaceState under file://; fall back to the hash.
      location.hash = nextHash;
    }
  }

  function show(nextRole: Role): void {
    dispose?.();
    currentRole = nextRole;
    if (nextRole === 'presenter') {
      dispose = mountPresenterView(root, controller, {
        channel: activeChannel,
        onChannelChange: (channel) => {
          activeChannel = channel;
          writeHash();
        },
      });
    } else {
      dispose = mountPresentationView(root, controller, activeChannel, {
        connected,
        onOpenPresenter: () => show('presenter'),
      });
    }
    writeHash();
  }

  controller.onChange(writeHash);
  show(parsed.role);

  // A controlled presentation window keeps announcing itself so the presenter
  // can re-adopt it after a reload (its window handles are lost on reload, but
  // the child still points at the presenter via `window.opener`).
  if (connected) {
    controller.announce(activeChannel);
    window.setInterval(() => controller.announce(activeChannel), ANNOUNCE_INTERVAL_MS);
  }
}

function readSource(): string {
  const element = document.getElementById('mapre-source');
  if (!element || !element.textContent) {
    throw new Error('Missing embedded deck source.');
  }
  return JSON.parse(element.textContent) as string;
}

/**
 * Reads the inlined named templates, if any. Absent or empty payloads yield an
 * empty map so decks without templates behave exactly as before.
 */
function readTemplates(): Record<string, string> {
  const element = document.getElementById('mapre-templates');
  if (!element || !element.textContent) {
    return {};
  }
  return JSON.parse(element.textContent) as Record<string, string>;
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
