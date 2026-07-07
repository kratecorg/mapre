const MIN_SCALE = 0.2;
const MAX_SCALE = 3;
const SCALE_STEP = 0.2;
const EPSILON = 1e-9;

/** The initial content scale, matching the CSS `--scale` default. */
export const DEFAULT_SCALE = 1;

/**
 * Creates a discrete zoom control: a minus button, the current value, and a plus
 * button. Each click changes the scale by a fixed step within a fixed range and
 * calls `onChange` with the new value.
 */
export function createZoomControl(
  initial: number,
  onChange: (value: number) => void,
): HTMLElement {
  let value = clamp(initial);

  const container = document.createElement('div');
  container.className = 'zoom-control';

  const minus = stepButton('\u2212', () => set(value - SCALE_STEP));
  const readout = document.createElement('span');
  readout.className = 'zoom-value';
  const plus = stepButton('+', () => set(value + SCALE_STEP));

  container.append(minus, readout, plus);
  render();
  return container;

  function set(next: number): void {
    const clamped = clamp(Math.round(next * 10) / 10);
    if (clamped === value) {
      return;
    }

    value = clamped;
    render();
    onChange(value);
  }

  function render(): void {
    readout.textContent = `${value.toFixed(1)}\u00d7`;
    minus.disabled = value <= MIN_SCALE + EPSILON;
    plus.disabled = value >= MAX_SCALE - EPSILON;
  }
}

function stepButton(label: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'zoom-step';
  button.textContent = label;
  button.addEventListener('click', onClick);
  return button;
}

function clamp(value: number): number {
  return Math.min(Math.max(value, MIN_SCALE), MAX_SCALE);
}
