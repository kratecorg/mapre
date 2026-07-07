import { readdirSync, readFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

/**
 * The style assets of a presentation project, read from its `style/` folder:
 * concatenated CSS to inline, and named HTML templates keyed by file basename.
 */
export interface StyleAssets {
  css: string;
  templates: Record<string, string>;
}

/**
 * Reads a project's `style/` folder: every `*.css` file is concatenated (in
 * alphabetical order) into a single stylesheet, and every `*.html` file becomes
 * a named template keyed by its basename (e.g. `main-white.html` -> `main-white`).
 *
 * A missing folder yields empty assets, so the `style/` folder stays optional.
 */
export function loadStyleAssets(styleDir: string): StyleAssets {
  let entries: string[];
  try {
    entries = readdirSync(styleDir).sort();
  } catch {
    return { css: '', templates: {} };
  }

  const cssParts: string[] = [];
  const templates: Record<string, string> = {};

  for (const name of entries) {
    const extension = extname(name).toLowerCase();
    const fullPath = join(styleDir, name);

    if (extension === '.css') {
      cssParts.push(readFileSync(fullPath, 'utf8'));
    } else if (extension === '.html') {
      templates[basename(name, extension)] = readFileSync(fullPath, 'utf8');
    }
  }

  return { css: cssParts.join('\n'), templates };
}
