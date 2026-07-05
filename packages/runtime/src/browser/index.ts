import { parseDeck, renderSlide } from '@mapre/core';
import { Navigation } from '../core/navigation';

/**
 * Browser entry point for the single-file presentation. It reads the embedded
 * markdown, parses and renders it at runtime with the same `@mapre/core` path a
 * hosted web app would use, and drives a {@link Navigation} state machine.
 */
function start(): void {
  const deck = parseDeck(readSource());
  if (deck.slides.length === 0) {
    throw new Error('The deck has no slides.');
  }

  const navigation = new Navigation(deck.slides.map((slide) => slide.fragmentCount + 1));

  const stage = requireElement('stage');
  const counter = requireElement('counter');
  const previousButton = requireElement('prev') as HTMLButtonElement;
  const nextButton = requireElement('next') as HTMLButtonElement;
  const zoom = requireElement('zoom') as HTMLInputElement;

  if (deck.metadata.title) {
    document.title = deck.metadata.title;
  }

  function render(): void {
    const slide = deck.slides[navigation.slideIndex];
    const html = renderSlide(slide, { revealedFragments: navigation.stepIndex });
    stage.innerHTML = `<div class="slide">${html}</div>`;
    counter.textContent = `${navigation.slideIndex + 1} / ${deck.slides.length}`;
    previousButton.disabled = navigation.isFirst;
    nextButton.disabled = navigation.isLast;
  }

  function apply(move: () => boolean): void {
    if (move()) {
      render();
    }
  }

  nextButton.addEventListener('click', () => apply(() => navigation.next()));
  previousButton.addEventListener('click', () => apply(() => navigation.previous()));

  document.addEventListener('keydown', (event) => {
    if (!handleKey(event.key, navigation, deck.slides.length, render)) {
      return;
    }
    event.preventDefault();
  });

  zoom.addEventListener('input', () => {
    document.documentElement.style.setProperty('--scale', zoom.value);
  });

  render();
}

/**
 * Maps a keyboard key to a navigation action. Returns whether the key was
 * handled so the caller can prevent the browser's default behaviour.
 */
function handleKey(
  key: string,
  navigation: Navigation,
  slideCount: number,
  render: () => void,
): boolean {
  const move = keyToMove(key, navigation, slideCount);
  if (!move) {
    return false;
  }

  if (move()) {
    render();
  }
  return true;
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
