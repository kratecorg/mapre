# Detail slides

A deck usually runs on one track. Detail slides add a second dimension: a slide
can branch into a whole sub-deck that you only enter when it is worth it —
because someone asked, because the room is ahead of schedule, or because this
audience wants the code.

- `↓` enters the detail path of the current slide
- `↑` leaves it and returns to the parent slide, restoring its reveal step
- `→` at the end of a branch returns to the trunk automatically and continues

The trunk stays your main story. Nothing changes for the audience if you never
go down.

## Enabling it

Detail paths are opt-in per deck:

```markdown
---
title: My Talk
multiLevel: true
---
```

Accepted truthy values are `true`, `on`, `yes`, and `1`. Without the flag,
`detail` directives are ignored and the deck stays flat — handy for cutting the
extra material for a short slot without touching the slides.

## Branching a slide

Add a `detail` directive to the slide that should branch:

```markdown
[detail: ../details/ddd/]: #

# Domain-Driven Design

- bounded contexts
- aggregates
```

The target can be:

- a **markdown file** — split into slides by `---` like any other file;
- a **folder** — collected exactly like the slides folder (alphabetical,
  recursive).

Paths are resolved relative to the base directory of the current segment: the
slides folder for a trunk slide, and the referenced folder (or the file's
directory) for a nested detail. Detail files should live **outside** the slides
folder, otherwise they are collected twice — once as trunk slides and once as
the branch.

Branches nest: a detail slide may carry its own `detail` directive. Cycles are
detected and cut.

## A layout

```text
my-talk/
  slides/
    01-intro.md
    02-ddd.md          [detail: ../details/ddd/]: #
    03-outlook.md
  details/
    ddd/
      01-what.md
      02-blocks.md     [detail: ../aggregate.md]: #
      03-example.md
    aggregate.md
```

Slide numbers become hierarchical: the trunk counts `1`, `2`, `3`, the branch of
slide 2 counts `2.1`, `2.2`, `2.3`, and the branch of `2.2` counts `2.2.1`. The
slide counter in the presenter view shows `2.2 / 3` — your position in the
detail, against the length of the trunk.

## Navigating

| Key / control | Action |
| --- | --- |
| `↓` or the presenter's ▼ button | enter the detail path |
| `↑` or the presenter's ▲ button | leave it; the parent slide is shown fully revealed |
| `→` at the end of a branch | climb back and continue on the trunk |
| `←` at the start of a branch | back to the parent slide |
| `Home` / `End` | first and last **trunk** slide |
| `PageUp` / `PageDown` | plain previous/next, so a clicker keeps working |

The presenter's ▲/▼ buttons are only rendered for multi-level decks, and they
disable themselves when there is nowhere to go.

## Overview

For a multi-level deck the overview turns into a git-style tree: the trunk runs
left to right on the top lane, every branch gets its own lane below, and elbow
connectors show where it hangs off. Click any thumbnail to jump there — all
connected windows follow.

## Print and PDF

Print output flattens the tree depth-first, so a handout contains the trunk and
every branch in reading order, with the hierarchical numbers on the pages.

## Example

[`examples/multi-level/`](../examples/multi-level/) is a runnable deck with a
two-level branch, including the generator script that loads the tree via
`loadDeckTreeSource` and builds the single-file HTML.

## A gotcha

A `[detail: …]: #` on the very first line of the very first file is parsed as
*deck* metadata, not slide metadata — it is part of the leading directive block.
The loader handles that case and attaches the branch to slide 1, but it is
easier to read when the first slide starts with content.

See also: [Reference — slide directives](reference.md#slide-directives).
