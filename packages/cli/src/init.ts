import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, resolve } from 'node:path';
import { assertThemeExists } from '@mapre/runtime';
import { presentationFiles } from './scaffold';

/**
 * Options for {@link initPresentation}.
 */
export interface InitPresentationOptions {
  /** Directory to create the presentation in. */
  targetDir: string;
  /** Display name for the presentation. Defaults to the directory name. */
  name?: string;
  /** Theme written into the scaffolded deck. Defaults to the default theme. */
  theme?: string;
  /** Base directory used to resolve relative paths. Defaults to `process.cwd()`. */
  cwd?: string;
}

/**
 * Scaffolds a new presentation folder with sample slides ready to build via
 * `mapre build`. Returns the absolute path of the created directory. Throws when
 * the target directory already exists.
 */
export function initPresentation(options: InitPresentationOptions): string {
  const cwd = options.cwd ?? process.cwd();
  const targetDir = isAbsolute(options.targetDir)
    ? options.targetDir
    : resolve(cwd, options.targetDir);

  if (existsSync(targetDir)) {
    throw new Error(`Target directory already exists: ${targetDir}`);
  }

  // Reject an unknown theme before any file is written, so a typo leaves no
  // half-scaffolded folder behind.
  if (options.theme !== undefined) {
    assertThemeExists(options.theme);
  }

  const name = options.name ?? basename(targetDir);
  const files = presentationFiles({ name, theme: options.theme });

  for (const [relativePath, content] of Object.entries(files)) {
    const filePath = join(targetDir, relativePath);
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, content, 'utf8');
  }

  return targetDir;
}
