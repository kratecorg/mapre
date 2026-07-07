import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { loadDeckSource, loadDeckStyles } from '@mapre/node';
import { buildSingleFileHtml } from '@mapre/runtime';

/**
 * Options for {@link buildPresentation}.
 */
export interface BuildPresentationOptions {
  /** Directory holding the markdown slides. */
  slidesDir: string;
  /** Output HTML file to write. */
  outFile: string;
  /** Overrides the document title (defaults to the deck front-matter title). */
  title?: string;
  /** Base directory used to resolve relative paths. Defaults to `process.cwd()`. */
  cwd?: string;
}

/**
 * Builds a self-contained single-file HTML presentation from a slides folder
 * and writes it to disk. Returns the absolute path of the written file.
 */
export function buildPresentation(options: BuildPresentationOptions): string {
  const cwd = options.cwd ?? process.cwd();
  const slidesDir = resolvePath(cwd, options.slidesDir);
  const outFile = resolvePath(cwd, options.outFile);

  const markdown = loadDeckSource(slidesDir);
  if (markdown.trim() === '') {
    throw new Error(`No markdown slides found in ${slidesDir}`);
  }

  const extraStyles = loadDeckStyles(slidesDir);
  const html = buildSingleFileHtml(markdown, { title: options.title, extraStyles });

  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, html, 'utf8');

  return outFile;
}

function resolvePath(cwd: string, target: string): string {
  return isAbsolute(target) ? target : resolve(cwd, target);
}
