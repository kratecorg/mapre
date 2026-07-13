import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { copyResources, loadDeckSource, loadDeckStyles, loadStyleAssets } from '@mapre/node';
import { buildSingleFileHtml } from '@mapre/runtime';

/**
 * Options for {@link buildPresentation}.
 */
export interface BuildPresentationOptions {
  /**
   * Project directory holding the default `slides/`, `style/` and `resources/`
   * folders. Used for any folder not overridden below.
   */
  projectDir: string;
  /** Output HTML file to write. */
  outFile: string;
  /** Overrides the document title (defaults to the deck front-matter title). */
  title?: string;
  /** Overrides the slides folder (default: `<projectDir>/slides`). */
  slidesDir?: string;
  /** Overrides the style folder (default: `<projectDir>/style`). */
  styleDir?: string;
  /** Overrides the resources folder (default: `<projectDir>/resources`). */
  resourcesDir?: string;
  /** Base directory used to resolve relative paths. Defaults to `process.cwd()`. */
  cwd?: string;
}

/**
 * Builds a self-contained single-file HTML presentation from a project folder
 * and writes it to disk. The project has a fixed layout: `slides/` holds the
 * markdown, an optional `style/` folder holds CSS and HTML templates, and an
 * optional `resources/` folder holds static assets (images) that are copied
 * next to the output HTML so they can be referenced with document-relative
 * paths (e.g. `resources/photo.jpg`). Returns the absolute path of the written
 * file.
 */
export function buildPresentation(options: BuildPresentationOptions): string {
  const cwd = options.cwd ?? process.cwd();
  const { slidesDir, styleDir, resourcesDir } = resolveProjectDirs(cwd, options);
  const outFile = resolvePath(cwd, options.outFile);
  const outDir = dirname(outFile);

  const markdown = loadDeckSource(slidesDir);
  if (markdown.trim() === '') {
    throw new Error(`No markdown slides found in ${slidesDir}`);
  }

  const { css, templates } = loadStyleAssets(styleDir);
  const extraStyles = combineStyles(css, loadDeckStyles(slidesDir));
  const html = buildSingleFileHtml(markdown, { title: options.title, extraStyles, templates });

  mkdirSync(outDir, { recursive: true });
  writeFileSync(outFile, html, 'utf8');
  copyResources(resourcesDir, join(outDir, 'resources'));

  return outFile;
}

/**
 * The absolute source folders a presentation is built from. Each defaults to a
 * fixed subfolder of the project directory but can be overridden individually.
 */
export interface ProjectDirs {
  slidesDir: string;
  styleDir: string;
  resourcesDir: string;
}

/**
 * Resolves the slides, style and resources folders for a project, applying any
 * per-folder override and falling back to the fixed `<projectDir>/<name>`
 * layout otherwise.
 */
export function resolveProjectDirs(cwd: string, options: BuildPresentationOptions): ProjectDirs {
  const projectDir = resolvePath(cwd, options.projectDir);
  return {
    slidesDir: resolveDir(cwd, options.slidesDir, projectDir, 'slides'),
    styleDir: resolveDir(cwd, options.styleDir, projectDir, 'style'),
    resourcesDir: resolveDir(cwd, options.resourcesDir, projectDir, 'resources'),
  };
}

function resolveDir(
  cwd: string,
  override: string | undefined,
  projectDir: string,
  defaultName: string,
): string {
  if (override !== undefined) {
    return resolvePath(cwd, override);
  }
  return join(projectDir, defaultName);
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
