import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const MARKDOWN_EXTENSION = '.md';

/**
 * Collects markdown files from a slides directory in presentation order.
 *
 * Ordering rules:
 * - Entries are sorted alphabetically by name at every directory level.
 * - Files and directories are treated equally while sorting, so a directory
 *   named `02topics` sorts between `01.md` and `03.md`.
 * - Directories are entered recursively; their contents follow the directory's
 *   position in the parent ordering.
 * - Non-markdown files and dot-entries are ignored.
 *
 * @returns Absolute-or-relative file paths (matching the given `directory`),
 *   in the order they should appear in the deck.
 */
export function collectMarkdownFiles(directory: string): string[] {
  const entries = readdirSync(directory, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith('.'))
    .sort((first, second) => first.name.localeCompare(second.name));

  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectMarkdownFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith(MARKDOWN_EXTENSION)) {
      files.push(fullPath);
    }
  }

  return files;
}
