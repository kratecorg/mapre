import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, parse, resolve } from 'node:path';
import { copyResources, loadDeckSource, loadDeckStyles, loadStyleAssets } from '@mapre/node';
import { buildPrintHtml, buildSingleFileHtml, listDeckChannels } from '@mapre/runtime';

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
 * paths (e.g. `resources/photo.jpg`).
 *
 * Alongside the interactive presentation, one print-to-PDF HTML per channel is
 * written next to it (e.g. `presentation-en.html`); each lays out one slide per
 * page at the deck's aspect ratio, ready to be printed to PDF from a browser.
 * Returns the paths of all written HTML files.
 */
export function buildPresentation(options: BuildPresentationOptions): BuildResult {
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

  const channelFiles = listDeckChannels(markdown).map((channel) => {
    const printHtml = buildPrintHtml(markdown, {
      channel,
      title: options.title,
      extraStyles,
      templates,
    });
    const channelFile = channelPrintPath(outFile, channel);
    writeFileSync(channelFile, printHtml, 'utf8');
    return channelFile;
  });

  copyResources(resourcesDir, join(outDir, 'resources'));

  return { presentation: outFile, channelFiles };
}

/**
 * The files written by {@link buildPresentation}: the interactive single-file
 * presentation plus one print-to-PDF HTML per channel written alongside it.
 */
export interface BuildResult {
  /** The interactive single-file presentation. */
  presentation: string;
  /** Per-channel print-to-PDF HTML files, one per channel. */
  channelFiles: string[];
}

/**
 * Builds the path of a channel's print HTML next to the main output file, by
 * inserting the channel name into the base file name (e.g.
 * `dist/presentation.html` + channel `en` -> `dist/presentation-en.html`).
 */
function channelPrintPath(outFile: string, channel: string): string {
  const { dir, name, ext } = parse(outFile);
  const extension = ext === '' ? '.html' : ext;
  return join(dir, `${name}-${toFileName(channel)}${extension}`);
}

/**
 * Turns a channel name into a safe file-name stem by replacing any character
 * outside `[A-Za-z0-9._-]` with a hyphen, so channel names like `de/DE` or
 * spaces never produce nested paths or invalid file names.
 */
function toFileName(channel: string): string {
  return channel.replace(/[^A-Za-z0-9._-]+/g, '-');
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
