# mapre

mapre is presentation software for the browser. You write slides in markdown,
and mapre turns them into a **single, self-contained HTML file** that runs from a
web server, from a USB stick, or straight from `file://` — no runtime, no
plugins, no internet connection. On top of that file you get a presenter view, a
slide overview, a timer, and multi-window support.

The focus is presentations. But mapre is layered, so the markdown parser and
slide model (`@mapre/core`) are DOM-free and can be used on their own — for a
slide preview in another app, a static site generator, or any tool that needs
markdown turned into slides.

## The name

**ma**rkdown + **pre**sentation = **mapre**.

## What makes it different

- **Channels** — one deck, several content variants. A slide can carry an
  English and a German version, or a short and a long take, side by side in the
  same file. Each window picks its own channel, so the audience screen can show
  one language while a second screen shows another. See
  [Channels](docs/channels.md).
- **Very flexible reveals** — progressive reveal is not limited to list items. A
  single `@1` line reveals everything below it; a second `@1` closes the region
  again. A region wraps *anything*: a paragraph, a table row, a phrase in the
  middle of a sentence, or a few lines inside a fenced code block.
- **Detail slides** — a slide can branch into a whole sub-deck. Arrow down enters
  the detail path, arrow up leaves it, and navigation returns to the trunk
  automatically at the end of a branch. Ideal for material you only show when
  someone asks. See [Detail slides](docs/detail-slides.md).
- **Aspect ratios** — the slide box is a fixed-aspect canvas (`16:9`, `4:3`,
  `1.85:1`, …) that letterboxes into any window. Typography scales with the box,
  so a slide looks the same on a laptop, on a beamer, and in the PDF export.
- **Slides across many files and folders** — a deck is a folder tree. Chapters
  become subfolders; files and folders are sorted together alphabetically. Large
  decks stay reviewable and mergeable.
- **Single-file deployment** — `mapre build` inlines markdown, styles, and the
  browser client into one HTML file. Alongside it you get one print-ready HTML
  per channel, and with `--pdf` the PDFs as well.
- **Presenter view with real multi-window support** — open as many audience
  windows as you have displays, each on its own channel and zoom level. All
  windows stay in sync and reconnect after a reload.
- **Spotlight** — dim the slide and highlight the area under the pointer,
  mirrored on every connected window.
- **Invisible directives** — slide metadata uses the CommonMark link-reference
  form `[key: value]: #`, so the source still renders cleanly in any markdown
  preview.

## A slide

```markdown
---
title: My Talk
theme: dark
---

# Hello

- always visible

@1
- appears on the first step
@1

???
Speaker notes, visible only in the presenter view.
```

Build it:

```bash
mapre init my-talk
cd my-talk
mapre dev            # preview on http://127.0.0.1:4321
mapre build          # write dist/presentation.html
```

## Documentation

- [Getting started](docs/getting-started.md) — install, scaffold, author,
  preview, build, and hand over a deck.
- [Reference](docs/reference.md) — every CLI command and flag, every front matter
  key and slide directive, keyboard shortcuts, URL hashes, and the programmatic
  API.
- [Channels](docs/channels.md) — several content variants in one deck.
- [Detail slides](docs/detail-slides.md) — branching a slide into a sub-deck.
- [Theming](docs/theming.md) — built-in themes, design tokens, author
  stylesheets, and slide templates.

## Examples

| Example | Shows |
| --- | --- |
| [`examples/basic-presentation`](examples/basic-presentation/) | a deck with fragments, columns, and speaker notes |
| [`examples/single-file`](examples/single-file/) | building a self-contained HTML file with `@mapre/runtime` |
| [`examples/custom-theme`](examples/custom-theme/) | overriding design tokens from an author stylesheet |
| [`examples/multi-level`](examples/multi-level/) | detail paths and the tree overview |

## Packages

This is a pnpm workspace monorepo.

| Package | Purpose |
| --- | --- |
| `@mapre/core` | markdown parser, slide model, and HTML rendering — no DOM, no framework, usable standalone |
| `@mapre/node` | filesystem loader that assembles a deck from a slides folder |
| `@mapre/runtime` | browser runtime (navigation, presenter view, window sync) plus the single-file and print builders |
| `@mapre/cli` | the `mapre` command: `init`, `dev`, `build` |

The design goals behind that split: keep parsing and presentation separable,
keep the markdown layer reusable outside the app, and favour explicit module
boundaries over one monolith.

## Contributing

Requires Node 20+ and pnpm. See [CONTRIBUTING.md](CONTRIBUTING.md) for the
development setup and pull request guidelines.

## License

[MIT](LICENSE)

mapre bundles [marked](https://github.com/markedjs/marked) and
[Prism](https://github.com/PrismJS/prism) into its build artifacts. Their
licenses are reproduced in
[THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) and travel with every
generated presentation.
