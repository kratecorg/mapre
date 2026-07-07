# Example: theme via the `stylesheet` directive

This example themes a presentation entirely through a deck directive — no code
changes needed. The deck front matter names an author stylesheet:

```markdown
---
title: Custom Theme Demo
stylesheet: ../theme-paper.css
---
```

At build time, `@mapre/node`'s `loadDeckStyles(slidesDir)` resolves that path
relative to the slides folder, reads the CSS, and the runtime inlines it after
the baseline styles — so it wins by cascade order and still produces a single,
self-contained `.html` file.

The bundled [theme-paper.css](theme-paper.css) is a neutral light theme. Rules
are scoped to the slide box (`.slide-box`) and the slide (`.slide`), which exist
in both the audience stage and the presenter previews — so the theme looks
identical everywhere, while the surrounding presenter chrome keeps its own
styling.

## Run it

```bash
pnpm install
pnpm --filter @mapre/example-custom-theme build
```

Then open `dist/index.html` in a browser, or use the dev server to rebuild on
change:

```bash
pnpm --filter @mapre/cli exec mapre dev examples/custom-theme/slides
```
