# Theming

mapre ships four themes. A deck picks one, and from there you can adjust single
design tokens, add your own CSS, or wrap slides in HTML templates — without
forking any styles.

## Built-in themes

```markdown
---
title: My Talk
theme: high-contrast
---
```

| Theme | Use it for |
| --- | --- |
| `dark` | the default: slate background with a sky-blue accent |
| `light` | bright rooms, handouts, printing |
| `high-contrast` | large rooms and weak projectors; body text meets WCAG AAA (7:1) |
| `colorful` | meetups and lightning talks; gradient backdrop, warm accents |

`mapre build --theme light` and `mapre dev --theme light` override the
directive, so the same slides can be built for two different rooms. An unknown
name fails the build and lists the valid ones. `mapre init my-talk --theme light`
writes the directive into the scaffolded deck.

The presenter chrome — control bars, buttons, the notes panel — uses its own
`--mapre-chrome-*` tokens and is not affected by the deck theme. A light theme
therefore cannot make the controls unreadable. Switch the chrome separately with
the **UI** control in the presenter view.

## Design tokens

The baseline styles never hard-code colours or fonts; they reference custom
properties, and a theme redeclares them on `:root`. Overriding one token is
enough to adjust a theme instead of replacing it.

| Token | Controls |
| --- | --- |
| `--mapre-stage-bg` | the area around the slide box |
| `--mapre-slide-bg` | the slide background |
| `--mapre-slide-fg` | body text |
| `--mapre-heading-fg` | headings |
| `--mapre-accent` | links and accents |
| `--mapre-muted-fg` | secondary text |
| `--mapre-code-bg` | code block background |
| `--mapre-code-fg` | code text |
| `--mapre-token-comment` | syntax highlighting: comments |
| `--mapre-token-punctuation` | syntax highlighting: punctuation |
| `--mapre-token-keyword` | syntax highlighting: keywords |
| `--mapre-token-string` | syntax highlighting: strings |
| `--mapre-token-number` | syntax highlighting: numbers |
| `--mapre-token-function` | syntax highlighting: functions |
| `--mapre-token-builtin` | syntax highlighting: built-ins |
| `--mapre-font-body` | body font stack |
| `--mapre-font-mono` | monospace font stack |
| `--mapre-font-scale` | overall type scale |
| `--mapre-columns-gap` | gap between columns |

## Your own stylesheet

Name an author stylesheet in the deck front matter. The path is resolved
relative to the slides folder, and the file is inlined into the build:

```markdown
---
title: My Talk
theme: dark
stylesheet: ../theme.css
---
```

```css
:root {
  --mapre-accent: #e11d48;
  --mapre-stage-bg: #101010;
  --mapre-font-body: Georgia, serif;
}

.slide pre {
  font-size: 0.62em;
}
```

Alternatively — or in addition — put `*.css` files into the project's `style/`
folder; they are concatenated alphabetically and inlined too.

The cascade order is:

```text
baseline styles → theme → style/*.css → the deck's stylesheet directive
```

Everything is inlined into the single HTML file, so the deployed presentation
stays self-contained. That also means a CSS `url('resources/photo.jpg')`
resolves document-relative and works everywhere.

## Sizing against the slide box

The slide box is a fixed-aspect canvas with `container-type: size`, so container
query units are the reliable way to size things relative to the slide rather
than the window:

```css
.slide h1 {
  font-size: 9cqh;
}
```

```html
<img src="resources/diagram.png" style="height: 55cqh; width: auto" />
```

Use `cqh`/`cqw` in CSS or in a `style` attribute. The HTML `width` and `height`
*attributes* only accept plain pixel integers and silently ignore these units.

Two practical notes:

- The baseline body size (`4.3cqh`) makes code blocks overflow quickly. A rule
  like `.slide pre { font-size: .62em }` fits about 16 lines full width, about
  12 inside a column. Keep code lines under roughly 52 characters.
- The presenter view shows an **Overflow** warning when a slide exceeds its box.

## Class markup

To style parts of a slide without raw HTML, use `.class[content]` in the
markdown and define the class in your stylesheet:

```markdown
The rule is .warn[never in the domain layer].
```

```css
.warn {
  color: var(--mapre-accent);
  font-weight: 600;
}
```

See [Reference — class markup](reference.md#class-markup).

## Templates

Templates are HTML files in the project's `style/` folder, named after the file:
`style/title.html` becomes the template `title`. A slide selects one with the
`template` directive:

```markdown
[template: title]: #
[title: Clean Architecture]: #
[subheadline: for systems that are not Netflix]: #

Peter Muster · 2026
```

```html
<div class="title-slide">
  <h1>{{ title }}</h1>
  <p class="sub">{{ subheadline }}</p>
  <div class="body">{{ content }}</div>
</div>
```

- `{{ content }}` receives the rendered slide body as HTML.
- Every other placeholder is filled from the slide's directives, the deck front
  matter, and the built-ins `pageNumber` and `slideCount` — HTML-escaped, since
  those values come from plain-text directives.
- Unknown placeholders resolve to an empty string, so a template can offer
  optional slots.
- A `template` key in the deck front matter applies to every slide;
  `[template: none]: #` opts a single slide out.
- With [channels](channels.md), a channel's own directives override the slide's,
  so each channel can have its own title or even its own template.

## Full example

[`examples/custom-theme/`](../examples/custom-theme/) is a runnable deck with an
author stylesheet that overrides tokens and adds its own classes.
