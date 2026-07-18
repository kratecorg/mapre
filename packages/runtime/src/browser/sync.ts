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
 * - `zoom` sets the receiving window's content scale.
 * - `announce` lets a controlled presentation window make itself known to its
 *   opener, so the presenter can (re)register it — this is what allows windows
 *   to reconnect after the presenter is reloaded.
 * - `reload` tells the receiving window to reload itself, used to refresh a
 *   reconnected window so it picks up changed slides.
 */
export interface SyncMessage {
  kind: 'state' | 'request-state' | 'zoom' | 'announce' | 'reload';
  slideIndex?: number;
  stepIndex?: number;
  value?: number;
  /** Whether the fixed-aspect slide box outline should be shown. */
  showBox?: boolean;
  /** The channel of an announcing presentation window. */
  channel?: string;
}

/**
 * A channel that broadcasts messages to the opener and to any registered child
 * windows, delivers incoming messages to a handler, and can post to a single
 * target window.
 */
export interface Sync {
  broadcast(message: SyncMessage): void;
  register(window: Window): void;
  postTo(target: Window, message: SyncMessage): void;
}

interface TaggedMessage extends SyncMessage {
  [MESSAGE_TAG]: true;
}

/**
 * Creates a {@link Sync} channel and starts listening for incoming messages.
 * The handler receives the sending window (when available) so the receiver can
 * post back to or register that specific window.
 */
export function createSync(handler: (message: SyncMessage, source?: Window) => void): Sync {
  const children = new Set<Window>();

  window.addEventListener('message', (event: MessageEvent) => {
    const data = event.data as TaggedMessage | undefined;
    if (!data || data[MESSAGE_TAG] !== true) {
      return;
    }

    handler(
      {
        kind: data.kind,
        slideIndex: data.slideIndex,
        stepIndex: data.stepIndex,
        value: data.value,
        showBox: data.showBox,
        channel: data.channel,
      },
      (event.source as Window | null) ?? undefined,
    );
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

  function postTo(target: Window, message: SyncMessage): void {
    safePost(target, { [MESSAGE_TAG]: true, ...message });
  }

  return { broadcast, register, postTo };
}

function safePost(target: Window, message: TaggedMessage): void {
  try {
    target.postMessage(message, '*');
  } catch {
    // A closed or otherwise unreachable window must not break the sender.
  }
}
