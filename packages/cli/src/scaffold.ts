import { DEFAULT_THEME } from '@mapre/runtime';

/**
 * Inputs for {@link presentationFiles}.
 */
export interface ScaffoldOptions {
  /** Display name, used as the deck title and intro heading. */
  name: string;
  /** Theme written into the deck front matter. Defaults to the default theme. */
  theme?: string;
}

/**
 * Builds the set of files for a scaffolded presentation as a map of
 * relative path to file content. This is a pure function so it can be tested
 * without touching the filesystem.
 */
export function presentationFiles(options: ScaffoldOptions): Record<string, string> {
  return {
    '.gitignore': 'dist\n',
    'slides/01-intro.md': introSlide(options),
    'slides/02-agenda.md': agendaSlide(),
    'slides/03-columns.md': columnsSlide(),
  };
}

function introSlide({ name, theme }: ScaffoldOptions): string {
  return `---
title: ${name}
theme: ${theme ?? DEFAULT_THEME}
---

# ${name}

Edit the markdown in \`slides/\` and rebuild with \`mapre build\`.
`;
}

function agendaSlide(): string {
  return `## Agenda

- First point
- Second point

@1
- Revealed on the next step
@1

???
Speaker notes go here.
`;
}

function columnsSlide(): string {
  return `## Two Columns

<!-- column -->

**Left**

- Every column starts with a marker
- The first marker opens the region

<!-- column -->

**Right**

- The heading above stays full width
- \`<!-- end-columns -->\` gives it back
`;
}
