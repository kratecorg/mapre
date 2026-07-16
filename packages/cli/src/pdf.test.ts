import { describe, expect, it, vi } from 'vitest';
import {
  detectPdfRenderer,
  generateChannelPdfs,
  toPdfPath,
  type PdfRenderer,
  type RendererProbe,
} from './pdf';

function probe(overrides: Partial<RendererProbe>): RendererProbe {
  return {
    isDockerAvailable: () => false,
    dockerImage: () => 'test-image',
    findChromeExecutable: () => undefined,
    ...overrides,
  };
}

describe('detectPdfRenderer', () => {
  it('prefers Docker when it is available', () => {
    const renderer = detectPdfRenderer(
      probe({ isDockerAvailable: () => true, findChromeExecutable: () => '/usr/bin/chrome' }),
    );

    expect(renderer).toEqual({ kind: 'docker', image: 'test-image' });
  });

  it('falls back to a system Chrome when Docker is unavailable', () => {
    const renderer = detectPdfRenderer(
      probe({ isDockerAvailable: () => false, findChromeExecutable: () => '/usr/bin/chrome' }),
    );

    expect(renderer).toEqual({ kind: 'chrome', executable: '/usr/bin/chrome' });
  });

  it('reports none when neither Docker nor a browser is available', () => {
    expect(detectPdfRenderer(probe({}))).toEqual({ kind: 'none' });
  });
});

describe('toPdfPath', () => {
  it('swaps the html extension for pdf', () => {
    expect(toPdfPath('/out/presentation-en.html')).toBe('/out/presentation-en.pdf');
  });
});

describe('generateChannelPdfs', () => {
  function reporter() {
    const logs: string[] = [];
    const errors: string[] = [];
    return {
      reporter: { log: (m: string) => logs.push(m), error: (m: string) => errors.push(m) },
      logs,
      errors,
    };
  }

  it('renders a pdf next to each html file and keeps the html', () => {
    const { reporter: rep, logs } = reporter();
    const render = vi.fn();
    const renderer: PdfRenderer = { kind: 'chrome', executable: '/usr/bin/chrome' };

    const pdfs = generateChannelPdfs({
      htmlFiles: ['/out/presentation-de.html', '/out/presentation-en.html'],
      reporter: rep,
      renderer,
      render,
    });

    expect(pdfs).toEqual(['/out/presentation-de.pdf', '/out/presentation-en.pdf']);
    expect(render).toHaveBeenCalledTimes(2);
    expect(render).toHaveBeenCalledWith(renderer, '/out/presentation-de.html', '/out/presentation-de.pdf');
    expect(logs.some((line) => line.includes('Built PDF -> /out/presentation-de.pdf'))).toBe(true);
  });

  it('skips generation and keeps the html when no renderer is available', () => {
    const { reporter: rep, logs } = reporter();
    const render = vi.fn();

    const pdfs = generateChannelPdfs({
      htmlFiles: ['/out/presentation-de.html'],
      reporter: rep,
      renderer: { kind: 'none' },
      render,
    });

    expect(pdfs).toEqual([]);
    expect(render).not.toHaveBeenCalled();
    expect(logs.some((line) => line.includes('skipping PDF export'))).toBe(true);
  });

  it('keeps going and reports when one file fails', () => {
    const { reporter: rep, errors } = reporter();
    const render = vi.fn((_r: PdfRenderer, html: string) => {
      if (html.includes('de')) {
        throw new Error('boom');
      }
    });

    const pdfs = generateChannelPdfs({
      htmlFiles: ['/out/presentation-de.html', '/out/presentation-en.html'],
      reporter: rep,
      renderer: { kind: 'chrome', executable: '/usr/bin/chrome' },
      render,
    });

    expect(pdfs).toEqual(['/out/presentation-en.pdf']);
    expect(errors.some((line) => line.includes('PDF export failed for /out/presentation-de.html'))).toBe(true);
  });
});
