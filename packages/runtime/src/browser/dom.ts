/**
 * Returns the element matching `selector` within `root`, throwing when it is
 * missing so wiring mistakes fail loudly instead of silently doing nothing.
 */
export function query<T extends HTMLElement = HTMLElement>(
  root: ParentNode,
  selector: string,
): T {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }
  return element;
}

/**
 * Toggles fullscreen for the whole document.
 */
export function toggleFullscreen(): void {
  if (document.fullscreenElement) {
    void document.exitFullscreen();
    return;
  }

  void document.documentElement.requestFullscreen();
}
