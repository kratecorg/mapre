# mapre

mapre is the main project for the presentation foundation. It is meant to host the reusable lower-level building blocks for slides and presentation experiences.

## Scope

The project has two distinct aspects:

1. Markdown parsing and slide generation
2. Slide presentation runtime, including mirror mode and presentation mode

## Markdown parser and slide layer

This part should be usable on its own. It is responsible for turning markdown into a slide-oriented representation and can be reused without the full presentation runtime.

Typical responsibilities include:

- parsing markdown into a structured intermediate model
- mapping markdown sections to slides
- handling slide-level metadata and layout hints
- exposing reusable APIs for other tools or runtimes

## Presentation runtime

This part builds on top of the slide model and focuses on how slides are shown.

Typical responsibilities include:

- rendering slides in presentation mode
- supporting mirror mode for presenter workflows
- managing navigation and current slide state
- handling display-specific concerns without coupling them to parsing

## Design goals

- Keep parsing and presentation concerns separable
- Make the markdown layer reusable outside the full app
- Keep the runtime flexible enough for different presentation surfaces
- Favor clear module boundaries over a single large monolith

## Repository layout

This is a pnpm workspace monorepo.

- `packages/core` — framework-agnostic markdown parser and slide model. It turns
  markdown into a structured `Deck` and can render slides to HTML. It has no
  runtime, DOM, or framework dependencies and is fully unit tested.
- `packages/node` — Node.js filesystem loader (`@mapre/node`) that assembles a
  deck from a `slides/` folder.
- `packages/cli` — command-line interface (`@mapre/cli`, `mapre` binary) to
  scaffold a new presentation (`mapre init`) and build a single-file HTML
  presentation (`mapre build`). Its build produces a single, self-contained
  `dist/mapre.js` that runs on any machine with Node 20+ — see
  [Distributing the CLI](#distributing-the-cli).
- `packages/runtime` — presentation runtime (`@mapre/runtime`). It builds a
  **self-contained, single-file HTML** presentation: the raw deck markdown and a
  bundled browser client (parser + renderer) are inlined, and the deck is
  **rendered in the browser at runtime** — the same path a hosted web app uses.
  This keeps one rendering path across all deploy targets: a hosted web server,
  a local `python3 -m http.server`, or a plain `file://` open.
- `examples/basic-presentation` — a runnable example showing how to author your
  own presentation from markdown files.
- `examples/single-file` — a runnable example that builds a single-file HTML
  presentation with `@mapre/runtime`. For the quickest way to author your own,
  use the `mapre` CLI (see [Distributing the CLI](#distributing-the-cli)).
- Additional packages (presenter view, window sync, timer, channels) will live
  under `packages/` as they are built, following the
  [runtime spec](spec/runtime.spec.md).

## Slides folder

`@mapre/node`'s `loadDeck(directory)` reads a slides folder in presentation
order:

- entries are sorted **alphabetically** at every directory level;
- **files and directories are equivalent** while sorting, so a folder named
  `02topics/` sorts between `01.md` and `03.md`;
- directories are entered recursively;
- non-markdown files and dot-entries are ignored.

```text
slides/
  01.md
  02topics/
    01-a.md
    02-b.md
  03.md
```


## Slide syntax

The `@mapre/core` parser understands a small, reveal.js-inspired markdown dialect:

- **Deck front matter**: an optional leading block delimited by `---` fences,
  containing `key: value` pairs (e.g. `title: My Talk`).
- **Slide separators**: a standalone `---` line splits slides. Separators inside
  fenced code blocks are ignored.
- **Speaker notes**: everything after a `???` line on a slide becomes notes.
- **Slide metadata / layout hints**: leading `<!-- key: value -->` directive
  comments, e.g. `<!-- layout: center -->` or `<!-- aspect: 16:9 -->`.
- **Progressive-reveal fragments**: `@N ... @N` marker pairs reveal content at
  step `N`, both in prose and inside code fences.

```markdown
---
title: Demo
---

<!-- layout: center -->
# Hello

@1
- revealed second
@1

???
Speaker notes for this slide.
```

## Development

Requires Node 20+ and pnpm.

```bash
pnpm install       # install workspace dependencies
pnpm test          # run all package tests
pnpm type-check    # type-check all packages
pnpm build         # build all packages
```

Continuous integration runs type-check, tests, and build via Gitea Actions
(`.gitea/workflows/ci.yml`).

## Distributing the CLI

The `mapre` CLI builds into a single, self-contained file that bundles every
workspace package and its dependencies. The only requirement on the target
machine is Node 20+ — no `pnpm install`, no `node_modules`, no platform-specific
binary.

```bash
pnpm build                                   # builds all packages in order
# hand over this one file:
packages/cli/dist/mapre.js
```

Order matters because the CLI bundle inlines the built output of `@mapre/core`,
`@mapre/node`, and `@mapre/runtime`, so those must be built first. The root
`pnpm build` already builds packages in dependency order.

On the receiving machine, run the file directly with Node:

```bash
node mapre.js init my-talk        # scaffold a presentation folder
cd my-talk
node ../mapre.js build            # write dist/index.html
```

The resulting `dist/index.html` is itself self-contained and opens from
`file://`, a local web server, or a hosted URL.

## Status

This repository is intended to become the dedicated foundation for the presentation stack. The README will be refined as the module split and implementation details settle.
