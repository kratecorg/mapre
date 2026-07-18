import type { Controller } from './controller';

/**
 * Options for {@link mountOverview}.
 */
export interface OverviewOptions {
  /** The channel whose content the thumbnails render. */
  channel: string;
  /** Invoked after the overview closes, so callers can reset their toggle. */
  onClose?: () => void;
}

/**
 * Mounts a full-window grid of every slide as clickable thumbnails. Picking a
 * thumbnail navigates the whole session there via the controller, which keeps
 * the presenter and every connected presentation window in sync, then closes
 * the overview. The overlay is appended to `document.body` so it sits above the
 * current view regardless of the window's role.
 *
 * Returns a dispose function that removes the overlay and detaches its
 * listeners; disposing also runs {@link OverviewOptions.onClose}.
 */
export function mountOverview(controller: Controller, options: OverviewOptions): () => void {
  const overlay = document.createElement('div');
  overlay.className = 'overview';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-label', 'Slide overview');

  overlay.append(createHeader(closeOverview), createGrid());
  document.body.appendChild(overlay);

  const items = Array.from(overlay.querySelectorAll<HTMLElement>('.overview-item'));

  function createGrid(): HTMLElement {
    const grid = document.createElement('div');
    grid.className = 'overview-grid';
    controller.deck.slides.forEach((slide, index) => {
      grid.appendChild(createItem(index, slide.fragmentCount));
    });
    return grid;
  }

  function createItem(index: number, fragmentCount: number): HTMLElement {
    const item = document.createElement('div');
    item.className = 'overview-item';
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', `Go to slide ${index + 1}`);

    const thumb = document.createElement('div');
    thumb.className = 'overview-thumb';
    const box = document.createElement('div');
    box.className = 'slide-box';
    const slide = document.createElement('div');
    slide.className = 'slide';
    // Render every fragment so a thumbnail shows the slide's full content.
    slide.innerHTML = controller.render(index, fragmentCount, options.channel);
    box.appendChild(slide);
    thumb.appendChild(box);

    const number = document.createElement('span');
    number.className = 'overview-number';
    number.textContent = String(index + 1);

    item.append(thumb, number);
    item.addEventListener('click', () => selectSlide(index));
    item.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectSlide(index);
      }
    });
    return item;
  }

  function selectSlide(index: number): void {
    controller.goToSlide(index);
    closeOverview();
  }

  function highlightCurrent(): void {
    const active = controller.navigation.slideIndex;
    items.forEach((item, index) => {
      item.classList.toggle('is-current', index === active);
    });
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeOverview();
    }
  }

  const unsubscribe = controller.onChange(highlightCurrent);
  document.addEventListener('keydown', onKeydown);
  highlightCurrent();
  items[controller.navigation.slideIndex]?.scrollIntoView({ block: 'nearest' });

  let disposed = false;

  function closeOverview(): void {
    if (disposed) {
      return;
    }
    disposed = true;
    unsubscribe();
    document.removeEventListener('keydown', onKeydown);
    overlay.remove();
    options.onClose?.();
  }

  return closeOverview;
}

function createHeader(onClose: () => void): HTMLElement {
  const header = document.createElement('div');
  header.className = 'overview-header';

  const title = document.createElement('span');
  title.className = 'overview-title';
  title.textContent = 'Overview';

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'overview-close';
  closeButton.textContent = 'Close';
  closeButton.addEventListener('click', onClose);

  header.append(title, closeButton);
  return header;
}
