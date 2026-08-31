# Reference

Every command, flag, directive, and shortcut. For a guided walk-through, start
with [Getting started](getting-started.md).

## Table of contents

- [CLI](#cli)
- [Project layout](#project-layout)
- [Deck front matter](#deck-front-matter)
- [Slide syntax](#slide-syntax)
- [Slide directives](#slide-directives)
- [Columns](#columns)
- [Class markup](#class-markup)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [URL hash](#url-hash)
- [Presenter view](#presenter-view)
- [Programmatic API](#programmatic-api)

## CLI

The binary is `mapre` (or `node mapre.js` when you run the bundled single file).

### `mapre init <dir> [options]`

Scaffolds a new presentation folder: `slides/` with three sample slides and a
`.gitignore`.

| Option | Default | Description |
| --- | --- | --- |
| `<dir>` | — | target directory (required) |
| `--name <name>` | directory name | display name, used as deck title and intro heading |
| `--theme <theme>` | `dark` | theme written into the scaffolded front matter |

### `mapre build [projectDir] [options]`

Builds the presentation.

| Option | Default | Description |
| --- | --- | --- |
| `[projectDir]` | `.` | project directory |
| `-o`, `--out <file>` | `dist/presentation.html` | output HTML file |
| `-t`, `--title <title>` | deck `title` | override the document title |
| `--theme <theme>` | deck `theme` | override the theme; an unknown name fails the build |
| `--slides <dir>` | `<projectDir>/slides` | slides folder |
| `--style <dir>` | `<projectDir>/style` | style folder |
| `--resources <dir>` | `<projectDir>/resources` | resources folder |
| `--pdf` | off | also render each channel HTML to a PDF |

Outputs, all next to `--out`:

| File | Content |
| --- | --- |
| `presentation.html` | the interactive, self-contained presentation |
| `presentation-<channel>.html` | print-ready, one slide per page, one file per [channel](channels.md) |
| `presentation-<channel>.pdf` | only with `--pdf` |
| `resources/` | copy of the resources folder, if it exists |

The channel name in the filename is sanitised: anything outside
`A–Z a–z 0–9 . _ -` becomes `-`.

### `mapre dev [projectDir] [options]`

Builds, serves on localhost, and rebuilds when slides or the deck stylesheet
change. Takes all `build` options plus:

| Option | Default | Description |
| --- | --- | --- |
| `-p`, `--port <port>` | `4321` | port to listen on |

The server binds to `127.0.0.1` and serves the built HTML for **every** path, so
the per-channel print files are not reachable through it — build them and open
the file directly. Assets under `/resources/` are served from the project folder.
The page is not auto-reloaded; refresh the browser after a rebuild.

### PDF rendering

`--pdf` looks for a renderer in this order:

1. **Docker** — runs a containerised Chromium. Image
   `zenika/alpine-chrome:latest`, overridable with `MAPRE_CHROME_IMAGE`.
2. **System browser** — Chrome, Edge, or Chromium found via `MAPRE_CHROME`,
   `PUPPETEER_EXECUTABLE_PATH`, the usual per-OS install paths, or `PATH`.
3. **Nothing** — the step is skipped and the channel HTML files are kept.

| Variable | Effect |
| --- | --- |
| `MAPRE_CHROME_IMAGE` | Docker image used for rendering |
| `MAPRE_CHROME` | path to a Chrome/Edge/Chromium executable |
| `PUPPETEER_EXECUTABLE_PATH` | fallback executable path |

Use a Chromium-based browser for manual printing too: Firefox ignores the custom
`@page` size and clips the slides.

## Project layout

```text
my-talk/
  slides/       markdown files (required)
  style/        optional: *.css inlined alphabetically, *.html become named templates
  resources/    optional: images and other assets, copied next to the output
  dist/         build output
```

Slides are collected in presentation order:

- entries are sorted alphabetically at every directory level;
- files and directories sort together, so `02topics/` sorts between `01.md` and
  `03.md`;
- directories are entered recursively;
- non-markdown files and dot-entries are ignored.

Reference assets document-relative (`resources/photo.jpg`) from markdown and
from CSS alike — the CSS is inlined into the HTML, so both resolve the same way.

## Deck front matter

The deck front matter is the leading block of the first collected file. It can
be written as a `---` fenced block, or as a block of directives terminated by a
blank line:

```markdown
---
title: My Talk
theme: dark
aspect: 16:9
---
```

```markdown
[title: My Talk]: #
[theme: dark]: #

# First slide
```

| Key | Values | Default | Effect |
| --- | --- | --- | --- |
| `title` | text | `mapre presentation` | deck title and document title |
| `theme` | `light`, `dark`, `high-contrast`, `colorful` | `dark` | built-in [theme](theming.md) |
| `aspect` | `W:H` or `W/H`, e.g. `16:9`, `4:3`, `1.85:1` | `16:9` | aspect ratio of the slide box; an unparsable value falls back to `16:9` |
| `defaultChannel` | channel name | `main` | channel that unmarked content belongs to, see [Channels](channels.md) |
| `multiLevel` | `true`, `on`, `yes`, `1` | off | enables [detail slides](detail-slides.md) |
| `stylesheet` | path | — | author CSS, resolved relative to the slides folder and inlined |
| `template` | template name | — | default [template](theming.md#templates) for all slides |

Any other key is passed through as a template variable.

## Slide syntax

### Slide separators

A standalone `---` line splits slides. Separators inside fenced code blocks are
ignored. The end of a file also ends a slide, so one file per slide works too.

### Speaker notes

Everything after a `???` line belongs to the notes and is shown only in the
presenter view.

```markdown
# Title

Body

???
Notes for me, not for the room.
```

### Fragments

A `@N` marker on its own line opens a region revealed at step `N`; it runs to
the end of the slide unless a second `@N` closes it. The highest `N` on a slide
is its number of steps.

```markdown
text1
@1
text2
@2
text3
```

```markdown
@1
A block, revealed first, and closed again.
@1

The answer is @2 42 @2.

- always visible
@3
- revealed third
@3
```

- a marker alone on a line opens or closes a **block** region;
- markers within a line wrap an **inline** span;
- both work inside fenced code blocks, so code can grow line by line;
- several regions may share the same `N` and then appear together;
- regions nest, so an open `@1` region still applies inside a later `@2` one;
- a fragment region must stay inside a single column.

### Directives

Slide metadata is written as directives, in either of two forms:

```markdown
[key: value]: #
<!-- key: value -->
```

Prefer `[key: value]: #`. It is a CommonMark link reference definition; because
the label is never referenced as a link, a conforming renderer emits nothing —
the directive stays invisible in a plain markdown preview as well as on the
slide. markdownlint flags unused definitions (rule MD053); disable that rule for
slide folders. The HTML comment form is equivalent and mainly of interest when a
tool chokes on link references.

Directives are only recognised in the leading block of a slide, before any
content.

## Slide directives

| Directive | Values | Effect |
| --- | --- | --- |
| `columns` | `3`, `2:1`, `2fr 1fr`, `60% 40%`, `auto 1fr` | column track sizing (default: equal widths) |
| `columns-align` | `top`, `center`, `bottom`, `stretch` | vertical alignment inside a column region (default: `top`) |
| `background` | image path or CSS colour | full-slide background layer behind the content |
| `template` | template name or `none` | wrap the slide in a named [template](theming.md#templates); `none` opts out of a deck default |
| `title` | text | fills the `{{ title }}` placeholder of a template |
| `subheadline` | text | fills the `{{ subheadline }}` placeholder of a template |
| `channel` | channel name | starts a [channel](channels.md) section (not metadata) |
| `detail` | path to a `.md` file or folder | branches into a [detail path](detail-slides.md) |

A `background` value matching `#rgb`, `rgb()`, `rgba()`, `hsl()`, or `hsla()`
paints a solid colour; anything else is treated as an image URL rendered with
`background-size: cover`. For a full-bleed image slide, combine it with
`[template: none]: #`.

```markdown
[background: resources/title.png]: #
[template: none]: #
```

Any other directive key becomes a template variable for that slide.

## Columns

A `[column]: #` line starts a column. The first marker opens the column region,
so content above it — typically the heading — keeps the full width. The region
runs to the end of the slide, or to an `[end-columns]: #` line when something
should follow at full width again. A slide may hold several regions.

```markdown
[columns: 2fr 1fr]: #
[columns-align: center]: #

# What the tool must support

[column]: #

**What an ORM offers**

- an object graph across half the context

[column]: #

**What jOOQ offers**

- type-safe SQL, visible in the code

[end-columns]: #

Both are true at the same time.
```

The gap between columns comes from the theme token `--mapre-columns-gap`.
Markers inside fenced code blocks are left untouched. `<!-- column -->` and
`<!-- end-columns -->` work as alternative forms.

## Class markup

`.class[content]` attaches CSS classes to a piece of content without dropping to
raw HTML. Several classes chain as `.a.b[…]`, brackets are matched in balanced
pairs, and the content may itself contain markdown or nested markup.

```markdown
The rule is .warn[never in the domain layer].

.callout[
### Rule of thumb

Keep the dependency arrow pointing inwards.
]
```

Content starting on the same line becomes a `<span>`; content starting on the
next line becomes a `<div>`, so it can hold paragraphs, lists, and headings.
Code spans and fenced code blocks are left untouched. Style the classes from
your deck stylesheet — see [Theming](theming.md).

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `→`, `PageDown`, `Space` | next step, or next slide when fully revealed |
| `←`, `PageUp` | previous step or slide |
| `↓` | enter the [detail path](detail-slides.md) of the current slide |
| `↑` | leave the detail path, back to its parent slide |
| `Home` | first slide |
| `End` | last trunk slide |
| `H` | toggle the spotlight |
| `Escape` | close the overview |

`PageUp`/`PageDown` stay on plain next/previous so a presentation clicker keeps
working in multi-level decks.

## URL hash

The hash encodes what a window shows, so every window can be bookmarked and
survives a reload:

```text
#<role>[/<channel>][@<slide>[.<step>]]
```

| Part | Meaning |
| --- | --- |
| `role` | `presentation` (default) or `presenter` |
| `channel` | channel name; omitted when it is the deck default |
| `slide` | 1-based slide number |
| `step` | revealed fragments, omitted when `0` |

Examples: `#presenter`, `#presentation/de`, `#presentation@5`,
`#presenter/en@3.2`.

## Presenter view

Opened with the **Presenter** button in the control bar, or by loading the deck
with `#presenter`. It shows the current slide, a preview of what comes next,
speaker notes, and:

| Control | Purpose |
| --- | --- |
| Timer | start, pause, reset; survives a reload of the presenter window |
| Overview | grid of all slides — a tree for [multi-level decks](detail-slides.md); click to jump |
| Box | show the outline of the fixed-aspect slide box |
| Highlight | toggle the spotlight; move it with the pointer over the current-slide preview |
| Overflow warning | appears when a slide's content exceeds its box |
| Open presentation | opens an audience window; with several channels, one button per channel |
| Window list | every open audience window with zoom (`−`/`+`), focus, and close |
| UI | switch the surrounding chrome between dark and light, independent of the deck theme |
| View | switch the channel previewed in the presenter window |
| ▲ / ▼ | leave or enter a detail path (multi-level decks only) |

Audience windows opened from the presenter are *connected*: they show the stage
only, without a control bar, and follow the presenter's navigation, spotlight,
and zoom. Navigation is synced across all windows; the channel and the zoom are
per window. Connected windows announce themselves once a second, so a reloaded
presenter window picks them up again and re-syncs their position.

## Programmatic API

The parser and the slide model have no DOM or framework dependency, so they can
be used without the presentation runtime:

```ts
import { parseDeck, renderSlide } from '@mapre/core';

const deck = parseDeck('---\ntitle: Demo\n---\n\n# Hello\n\n@1\nlater\n@1');
const html = renderSlide(deck.slides[0], { revealedFragments: 0 });
```

### `@mapre/core`

| Export | Purpose |
| --- | --- |
| `parseDeck(markdown)` | markdown → `Deck` (metadata plus slides) |
| `parseSlide(raw, index, options?)` | parse a single slide |
| `splitSlides(markdown)` | split on `---`, respecting code fences |
| `splitChannels(content, defaultChannel?)` | split slide content per channel |
| `extractFrontMatter(markdown)` | `{ metadata, body }` for the deck block |
| `extractSlideMetadata(markdown)` | `{ metadata, body }` for a slide's directives |
| `matchDirective(line)` | `{ key, value }` for either directive form |
| `parseKeyValueBlock(text)` | parse a `key: value` block |
| `detectMaxFragmentLevel(markdown)` | number of reveal steps |
| `preprocessFragments(markdown, level)` / `postprocessFragments(html)` | fragment handling around the markdown parser |
| `renderSlide(slide, options?)` | slide → HTML; options: `revealedFragments`, `channel`, `highlight`, `templates`, `variables` |
| `applyColumns(markdown, options?)` | column markers → grid markup |
| `applyMarkup(markdown)` | `.class[…]` → `span`/`div` |
| `applyTemplate(template, variables, content)` | fill `{{ placeholders }}` |
| `buildDeckTree(segment)` / `isMultiLevelEnabled(metadata)` | multi-level tree model |
| `DEFAULT_CHANNEL`, `MULTI_LEVEL_KEY` | constants |

Types: `Deck`, `DeckMetadata`, `DeckTree`, `DeckSourceSegment`, `SegmentDetail`,
`Slide`, `SlideMetadata`, `TreeNode`, `RenderOptions`, `ParseSlideOptions`,
`ColumnsOptions`.

### `@mapre/node`

| Export | Purpose |
| --- | --- |
| `loadDeck(dir)` / `loadDeckSource(dir)` | deck, or its concatenated markdown, from a slides folder |
| `loadDeckTreeSource(dir)` | markdown plus the detail branches it references |
| `collectMarkdownFiles(dir)` | the files a deck is built from, in order |
| `loadDeckStyles(dir)` / `resolveDeckStylesheetPath(dir)` | the deck's `stylesheet` directive |
| `loadStyleAssets(styleDir)` | `{ css, templates }` from a `style/` folder |
| `copyResources(source, target)` | copy a resources folder |

### `@mapre/runtime`

| Export | Purpose |
| --- | --- |
| `buildSingleFileHtml(markdown, options?)` | the self-contained presentation HTML |
| `buildPrintHtml(markdown, options?)` | print HTML, one slide per page |
| `listDeckChannels(markdown, tree?)` | channel names of a deck |
| `assembleSingleFileHtml(params)` / `assemblePrintHtml(params)` | the pure assembly steps |
| `THEMES`, `THEME_NAMES`, `DEFAULT_THEME`, `THEME_TOKENS` | theme registry and token catalog |
| `resolveThemeStyles(name?)` / `assertThemeExists(name)` | theme CSS lookup and validation |
| `Navigation`, `Timer`, `formatDuration` | the runtime's pure building blocks |
