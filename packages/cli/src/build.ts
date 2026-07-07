import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { loadDeckSource, loadDeckStyles, loadStyleAssets } from '@mapre/node';
import { buildSingleFileHtml } from '@mapre/runtime';

/**
 * Options for {@link buildPresentation}.
 */
export interface BuildPresentationOptions {
  /**
   * Project directory holding the fixed `slides/` and (optional) `style/`
   * folders.
   */
  projectDir: string;
  /** Output HTML file to write. */
  outFile: string;
  /** Overrides the document title (defaults to the deck front-matter title). */
  title?: string;
  /** Base directory used to resolve relative paths. Defaults to `process.cwd()`. */
  cwd?: string;
}

/**
 * Builds a self-contained single-file HTML presentation from a project folder
 * and writes it to disk. The project has a fixed layout: `slides/` holds the
 * markdown, and an optional `style/` folder holds CSS and HTML templates.
 * Returns the absolute path of the written file.
 */
export function buildPresentation(options: BuildPresentationOptions): string {
  const cwd = options.cwd ?? process.cwd();
  const projectDir = resolvePath(cwd, options.projectDir);
  const slidesDir = join(projectDir, 'slides');
  const styleDir = join(projectDir, 'style');
  const outFile = resolvePath(cwd, options.outFile);

  const markdown = loadDeckSource(slidesDir);
  if (markdown.trim() === '') {
    throw new Error(`No markdown slides found in ${slidesDir}`);
  }

  const { css, templates } = loadStyleAssets(styleDir);
  const extraStyles = combineStyles(css, loadDeckStyles(slidesDir));
  const html = buildSingleFileHtml(markdown, { title: options.title, extraStyles, templates });

  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, html, 'utf8');

  return outFile;
}

/**
 * Combines the `style/` folder CSS with any CSS named by the deck's legacy
 * `stylesheet` directive, dropping empty parts. Returns undefined when there is
 * no author CSS at all.
 */
function combineStyles(folderCss: string, directiveCss: string | undefined): string | undefined {
  const combined = [folderCss, directiveCss ?? '']
    .map((part) => part.trim())
    .filter((part) => part !== '')
    .join('\n');
  return combined === '' ? undefined : combined;
}

function resolvePath(cwd: string, target: string): string {
  return isAbsolute(target) ? target : resolve(cwd, target);
}
