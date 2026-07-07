/**
 * Builds the set of files for a scaffolded presentation as a map of
 * relative path to file content. This is a pure function so it can be tested
 * without touching the filesystem.
 */
export function presentationFiles(name: string): Record<string, string> {
  const slug = toSlug(name);

  return {
    'package.json': `${JSON.stringify(packageManifest(slug), null, 2)}\n`,
    'tsconfig.json': `${JSON.stringify(tsconfigManifest(), null, 2)}\n`,
    '.gitignore': 'dist\n',
    'slides/01-intro.md': introSlide(name),
    'slides/02-agenda.md': agendaSlide(),
  };
}

/**
 * Converts a free-form name into a filesystem- and package-friendly slug.
 */
export function toSlug(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug === '' ? 'presentation' : slug;
}

function packageManifest(slug: string): unknown {
  return {
    name: slug,
    version: '0.0.0',
    private: true,
    type: 'module',
    scripts: {
      build: 'mapre build slides -o dist/index.html',
    },
    devDependencies: {
      '@mapre/cli': 'workspace:*',
    },
  };
}

function tsconfigManifest(): unknown {
  return {
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'bundler',
      strict: true,
      types: ['node'],
      noEmit: true,
    },
    include: ['**/*.ts'],
    exclude: ['node_modules', 'dist'],
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
