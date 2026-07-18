import type { Controller } from './controller';

/** Spotlight circle radius as a fraction of the slide box height. */
export const SPOTLIGHT_RADIUS_FRACTION = 0.18;

/**
 * A mounted spotlight, wiring a dimming overlay to the shared controller state.
 */
export interface SpotlightMount {
  /** Re-projects the bright circle onto the current geometry. */
  render(): void;
  /** Detaches all listeners. */
  dispose(): void;
}

/**
 * Options for {@link mountSpotlight}.
 */
export interface SpotlightOptions {
  controller: Controller;
  /** The dimming overlay; must be an absolutely-positioned child of `container`. */
  overlay: HTMLElement;
  /** The positioning context the overlay fills (e.g. the stage). */
  container: HTMLElement;
  /** The slide box the normalised coordinates map onto. */
  slideBox: HTMLElement;
  /** Whether pointer movement over the container steers the spotlight. */
  track: boolean;
  /** Called whenever the active state changes, so a toggle button can reflect it. */
  onActiveChange?: (active: boolean) => void;
}

/**
 * Binds a dimming overlay to the controller's spotlight state. When active, a
 * bright circle sits over the slide box; the position is stored normalised to
 * the slide box, so it is projected back onto this window's own slide-box rect
 * and lands on the same slide point regardless of window size. When `track` is
 * set, moving the pointer over the container steers the spotlight and — because
 * the controller broadcasts the move — every synced window follows.
 */
export function mountSpotlight(options: SpotlightOptions): SpotlightMount {
  const { controller, overlay, container, slideBox, track, onActiveChange } = options;

  function render(): void {
    const spot = controller.getSpotlight();
    overlay.classList.toggle('is-active', spot.active);
    onActiveChange?.(spot.active);
    if (!spot.active) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const boxRect = slideBox.getBoundingClientRect();
    const centerX = boxRect.left - containerRect.left + spot.x * boxRect.width;
    const centerY = boxRect.top - containerRect.top + spot.y * boxRect.height;
    const radius = boxRect.height * SPOTLIGHT_RADIUS_FRACTION;
    overlay.style.setProperty('--spot-x', `${centerX}px`);
    overlay.style.setProperty('--spot-y', `${centerY}px`);
    overlay.style.setProperty('--spot-r', `${radius}px`);
  }

  function trackPointer(event: MouseEvent): void {
    if (!controller.getSpotlight().active) {
      return;
    }
    const boxRect = slideBox.getBoundingClientRect();
    controller.moveSpotlight(
      (event.clientX - boxRect.left) / boxRect.width,
      (event.clientY - boxRect.top) / boxRect.height,
    );
  }

  if (track) {
    container.addEventListener('mousemove', trackPointer);
  }
  const unsubscribe = controller.onSpotlightChange(render);
  // A resize changes the slide-box rect the spotlight is projected onto, so the
  // bright circle must be repositioned to stay on the same slide point.
  window.addEventListener('resize', render);
  render();

  return {
    render,
    dispose: () => {
      unsubscribe();
      if (track) {
        container.removeEventListener('mousemove', trackPointer);
      }
      window.removeEventListener('resize', render);
    },
  };
}
