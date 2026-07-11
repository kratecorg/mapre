/**
 * Builds the set of files for a scaffolded presentation as a map of
 * relative path to file content. This is a pure function so it can be tested
 * without touching the filesystem.
 */
export function presentationFiles(name: string): Record<string, string> {
  return {
    '.gitignore': 'dist\n',
    'slides/01-intro.md': introSlide(name),
    'slides/02-agenda.md': agendaSlide(),
  };
}

function introSlide(name: string): string {
  return `---
title: ${name}
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
