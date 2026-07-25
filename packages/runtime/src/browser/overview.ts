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
  const nodes = controller.nodes;
  const isTree = controller.multiLevel && nodes.some((node) => node.depth > 0);

  const content = isTree ? createTree() : createGrid();
  overlay.append(createHeader(closeOverview), content);
  document.body.appendChild(overlay);

  const items = Array.from(overlay.querySelectorAll<HTMLElement>('.overview-item'));

  let redrawConnectors: (() => void) | undefined;
  if (isTree) {
    redrawConnectors = () => drawConnectors(content);
    // Measure after layout so the connector coordinates match the placed items.
    requestAnimationFrame(() => redrawConnectors?.());
    window.addEventListener('resize', redrawConnectors);
  }

  function createGrid(): HTMLElement {
    const grid = document.createElement('div');
    grid.className = 'overview-grid';
    controller.deck.slides.forEach((slide, index) => {
      grid.appendChild(createItem(index, slide.fragmentCount));
    });
    return grid;
  }

  /**
   * Lays the slides out as a left-to-right git-style tree: the trunk on lane 0,
   * each detail branch on its own lane below, staggered by column. An SVG layer
   * draws elbow connectors from each branching slide to the start of its branch.
   */
  function createTree(): HTMLElement {
    const tree = document.createElement('div');
    tree.className = 'overview-tree';

    const laneCount = Math.max(...nodes.map((node) => node.lane)) + 1;
    const columnCount = Math.max(...nodes.map((node) => node.column)) + 1;
    tree.style.gridTemplateRows = `repeat(${laneCount}, auto)`;
    tree.style.gridTemplateColumns = `repeat(${columnCount}, var(--overview-col, 14rem))`;

    const connectors = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    connectors.classList.add('overview-connectors');
    tree.appendChild(connectors);

    controller.deck.slides.forEach((slide, index) => {
      const node = nodes[index];
      const item = createItem(index, slide.fragmentCount);
      item.style.gridRow = String(node.lane + 1);
      item.style.gridColumn = String(node.column + 1);
      tree.appendChild(item);
    });

    return tree;
  }

  /**
   * Draws the branch connectors into the tree's SVG layer, using the measured
   * positions of the placed items relative to the tree container.
   */
  function drawConnectors(tree: HTMLElement): void {
    const svg = tree.querySelector<SVGSVGElement>('.overview-connectors');
    if (!svg) {
      return;
    }

    svg.setAttribute('width', String(tree.scrollWidth));
    svg.setAttribute('height', String(tree.scrollHeight));
    svg.setAttribute('viewBox', `0 0 ${tree.scrollWidth} ${tree.scrollHeight}`);
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    nodes.forEach((node, index) => {
      // Connect a branching parent to the first slide of its detail branch.
      if (node.parent === -1 || node.prevInPath !== -1) {
        return;
      }
      const parent = items[node.parent];
      const child = items[index];
      if (!parent || !child) {
        return;
      }

      const startX = parent.offsetLeft + parent.offsetWidth / 2;
      const startY = parent.offsetTop + parent.offsetHeight;
      const endX = child.offsetLeft;
      const endY = child.offsetTop + child.offsetHeight / 2;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${startX} ${startY} V ${endY} H ${endX}`);
      path.setAttribute('class', 'overview-connector');
      svg.appendChild(path);
    });
  }

  function createItem(index: number, fragmentCount: number): HTMLElement {
    const item = document.createElement('div');
    item.className = 'overview-item';
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', `Go to slide ${nodes[index]?.pathLabel ?? index + 1}`);

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
    number.textContent = nodes[index]?.pathLabel ?? String(index + 1);

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
    if (redrawConnectors) {
      window.removeEventListener('resize', redrawConnectors);
    }
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
