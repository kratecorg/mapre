/**
 * Cross-window synchronisation over `postMessage`.
 *
 * The presenter window is opened from the presentation window, so the two share
 * an opener/child relationship. Messages travel along that relationship, which
 * works across every deployment target — including a plain `file://` open, where
 * `BroadcastChannel` and same-origin checks are unreliable.
 */

const MESSAGE_TAG = '__mapre_sync';

/**
 * A message exchanged between windows.
 *
 * - `state` carries the current navigation position.
 * - `request-state` asks other windows to reply with their current `state`,
 *   which is how a freshly opened window catches up.
 */
export interface SyncMessage {
  kind: 'state' | 'request-state';
  slideIndex?: number;
  stepIndex?: number;
}

/**
 * A channel that broadcasts messages to the opener and to any registered child
 * windows, and delivers incoming messages to a handler.
 */
export interface Sync {
  broadcast(message: SyncMessage): void;
  register(window: Window): void;
}

interface TaggedMessage extends SyncMessage {
  [MESSAGE_TAG]: true;
}

/**
 * Creates a {@link Sync} channel and starts listening for incoming messages.
 */
export function createSync(handler: (message: SyncMessage) => void): Sync {
  const children = new Set<Window>();

  window.addEventListener('message', (event: MessageEvent) => {
    const data = event.data as TaggedMessage | undefined;
    if (!data || data[MESSAGE_TAG] !== true) {
      return;
    }

    handler({ kind: data.kind, slideIndex: data.slideIndex, stepIndex: data.stepIndex });
  });

  function broadcast(message: SyncMessage): void {
    const tagged: TaggedMessage = { [MESSAGE_TAG]: true, ...message };

    if (window.opener) {
      safePost(window.opener as Window, tagged);
    }

    for (const child of children) {
      if (child.closed) {
        children.delete(child);
        continue;
      }
      safePost(child, tagged);
    }
  }

  function register(target: Window): void {
    children.add(target);
  }

  return { broadcast, register };
}

function safePost(target: Window, message: TaggedMessage): void {
  try {
    target.postMessage(message, '*');
  } catch {
    // A closed or otherwise unreachable window must not break the sender.
  }
}
