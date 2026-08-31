# Getting started

This guide takes a deck from an empty folder to a file you can hand over.

## Requirements

- Node 20 or newer
- pnpm (only if you build mapre yourself)

## Install the CLI

mapre is not published to a registry. Every tagged release attaches a single
self-contained `mapre.js` to the
[releases page](https://github.com/kratecorg/mapre/releases). Download it, put
it anywhere, and run it with Node — no install step, no `node_modules`, no
platform-specific binary:

```bash
curl -LO https://github.com/kratecorg/mapre/releases/latest/download/mapre.js
node mapre.js --help
```

The examples below write `mapre`; substitute `node path/to/mapre.js` when you
work from the downloaded file.

### Build from source instead

```bash
git clone https://github.com/kratecorg/mapre.git
cd mapre
pnpm install
pnpm build
```

`pnpm build` builds all packages in dependency order and writes the same
bundle to `packages/cli/dist/mapre.js`. Inside the repository you can then run
`pnpm exec mapre` from the repo root.

## Scaffold a deck

```bash
mapre init my-talk --theme dark
cd my-talk
```

`init` creates a project folder with a `slides/` folder, a few sample slides,
and a `.gitignore`. The full project layout is:

```text
my-talk/
  slides/       markdown files (required)
  style/        optional CSS and HTML templates
  resources/    optional images and other assets
  dist/         build output
```

## Write slides

A deck is a folder of markdown files. Inside a file, a line of `---` separates
slides; the end of a file also ends a slide.

```markdown
---
title: My Talk
theme: dark
aspect: 16:9
---

# My Talk

A subtitle line

---

# Agenda

- where we are
- where we want to be

???
Keep this short — five minutes at most.
```

The block between the leading `---` fences is the **deck front matter**. It
applies to the whole deck and must sit at the top of the first collected file.
Text after a `???` line becomes speaker notes, visible only in the presenter
view.

### Folders and ordering

Slides are read in presentation order:

- entries are sorted alphabetically at every directory level;
- files and directories sort together, so `02topics/` sorts between `01.md` and
  `03.md`;
- directories are entered recursively;
- non-markdown files and dot-entries are ignored.

```text
slides/
  01.intro.md
  02.topics/
    01.problem.md
    02.solution.md
  03.outro.md
```

Number your files and folders; put a handful of related slides in one file.

### Reveal content step by step

The simplest case is a single `@N` marker on its own line: everything below it
appears at step `N`.

```markdown
text1
@1
text2
@2
text3
```

`text1` is on the slide from the start, `text2` appears on the first step,
`text3` on the second. A slide built this way needs one marker per step and
nothing else.

Use a **second marker with the same number** to close a region again, so the
content below it becomes visible from the start:

```markdown
# Two problems

@1
The object graph grows across half the context.
@1

Both are the same problem seen from two sides.
```

The same works **inline**, wrapping a phrase inside a line:

```markdown
The answer is @1 42 @1 — and the question is the interesting part.
```

Markers work in prose, in lists, in tables, and inside fenced code blocks, so
code can grow line by line. Several regions may share the same number and then
appear together.

### Columns

Start a column with a `[column]: #` marker line. The first marker opens the
column region, so anything above it keeps the full width:

```markdown
# What the tool must support

[column]: #

**What an ORM offers**

- an object graph across half the context

[column]: #

**What jOOQ offers**

- type-safe SQL, visible in the code
```

`[column]: #` is a CommonMark link reference definition. Because the label is
never used as a link, a markdown preview renders nothing for it — the marker
stays invisible. Details and the column ratio directives are in the
[reference](reference.md#columns).

### Images and assets

Put binary assets in `resources/` and reference them document-relative, both in
markdown and in CSS:

```markdown
![Architecture](resources/architecture.png)
```

The build copies `resources/` next to the output file, so the same path works in
the dev server, on a web server, and from `file://`.

## Preview while writing

```bash
mapre dev            # http://127.0.0.1:4321
mapre dev -p 8080    # another port
```

The dev server rebuilds whenever a slide or the deck stylesheet changes. It does
not push a reload, so refresh the browser after a change.

Navigate with the arrow keys; open the presenter view from the control bar. The
full key map is in the [reference](reference.md#keyboard-shortcuts).

## Build

```bash
mapre build                              # dist/presentation.html
mapre build -o dist/index.html           # different output path
mapre build --theme light                # override the deck theme
```

`build` writes:

- `dist/presentation.html` — the interactive presentation, fully self-contained
  (markdown, styles, and the browser client are inlined). It opens from a web
  server, from a USB stick, or straight from `file://`.
- `dist/presentation-<channel>.html` — one print-ready file per
  [channel](channels.md), laying out one slide per page at the deck's aspect
  ratio. Open one and use Print → Save as PDF. Use a Chromium-based browser:
  Firefox ignores the custom page size and clips the slides.

## Export PDFs

```bash
mapre build --pdf
```

This renders every channel HTML to a PDF next to it, so no browser step is
needed. mapre prefers a containerised Chromium (via `docker`) and falls back to
a system Chrome/Edge/Chromium; if neither is available it keeps the HTML files
and tells you. See the [reference](reference.md#pdf-rendering) for the
environment variables that select the renderer.

## Several decks, one look

Point the folders elsewhere to build multiple decks that share styling and
assets:

```bash
mapre build . --slides slides/intro --out dist/intro/index.html
mapre build . --slides slides/deep-dive --out dist/deep-dive/index.html
```

## Next steps

- [Reference](reference.md) — every command, flag, and directive
- [Channels](channels.md) — several content variants in one deck
- [Detail slides](detail-slides.md) — branch a slide into a sub-deck
- [Theming](theming.md) — themes, design tokens, and templates
