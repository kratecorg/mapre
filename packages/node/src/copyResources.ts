import { cpSync, existsSync } from 'node:fs';

/**
 * Copies a project's `resources/` folder (images and other static assets) into
 * the build output so the presentation can reference them with document-relative
 * paths (e.g. `resources/photo.jpg`). Such paths resolve identically for a
 * `file://` open, a static webserver, and the dev server.
 *
 * Large binary assets (multi-megabyte photos) are copied rather than inlined, so
 * the HTML stays small. A missing source folder is a no-op, keeping `resources/`
 * optional. Returns whether anything was copied.
 */
export function copyResources(resourcesDir: string, targetDir: string): boolean {
  if (!existsSync(resourcesDir)) {
    return false;
  }

  cpSync(resourcesDir, targetDir, { recursive: true });
  return true;
}
