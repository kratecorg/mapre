import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_CHROME_APPEARANCE,
  applyChromeAppearance,
  readChromeAppearance,
  writeChromeAppearance,
  type AppearanceStorage,
} from './chromeAppearance';

const STORAGE_KEY = 'mapre:presenter-appearance';

function fakeStorage(initial: Record<string, string> = {}): AppearanceStorage {
  const entries = new Map(Object.entries(initial));
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => {
      entries.set(key, value);
    },
  };
}

function rejectingStorage(): AppearanceStorage {
  return {
    getItem: () => {
      throw new Error('denied');
    },
    setItem: () => {
      throw new Error('denied');
    },
  };
}

describe('readChromeAppearance', () => {
  it('defaults to dark when nothing is stored', () => {
    expect(readChromeAppearance(fakeStorage())).toBe('dark');
    expect(DEFAULT_CHROME_APPEARANCE).toBe('dark');
  });

  it('returns the stored appearance', () => {
    expect(readChromeAppearance(fakeStorage({ [STORAGE_KEY]: 'light' }))).toBe('light');
  });

  it('falls back to the default for an unrecognized value', () => {
    expect(readChromeAppearance(fakeStorage({ [STORAGE_KEY]: 'sepia' }))).toBe('dark');
  });

  it('falls back to the default without storage', () => {
    expect(readChromeAppearance(null)).toBe('dark');
  });

  it('tolerates a storage that rejects reads', () => {
    expect(readChromeAppearance(rejectingStorage())).toBe('dark');
  });
});

describe('writeChromeAppearance', () => {
  it('persists the appearance', () => {
    const storage = fakeStorage();

    writeChromeAppearance('light', storage);

    expect(storage.getItem(STORAGE_KEY)).toBe('light');
  });

  it('tolerates a storage that rejects writes', () => {
    expect(() => writeChromeAppearance('light', rejectingStorage())).not.toThrow();
  });

  it('does nothing without storage', () => {
    expect(() => writeChromeAppearance('light', null)).not.toThrow();
  });
});

describe('applyChromeAppearance', () => {
  it('toggles the light class on the root element', () => {
    const classList = { toggle: vi.fn() };
    const root = { classList } as unknown as HTMLElement;

    applyChromeAppearance(root, 'light');
    expect(classList.toggle).toHaveBeenCalledWith('chrome-light', true);

    applyChromeAppearance(root, 'dark');
    expect(classList.toggle).toHaveBeenCalledWith('chrome-light', false);
  });
});
