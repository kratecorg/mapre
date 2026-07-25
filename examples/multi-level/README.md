# Example: Multi-Level Slides

A presentation with **detail paths**: the main talk (the *trunk*) has a slide
that can branch into a nested detail path and then return to the main talk.

## Structure

```text
slides/                     # the trunk (main talk)
  01-intro.md
  02-architektur.md         # branching slide: has fragments + [detail: ../details/ddd/]
  03-ausblick.md            # following slide: also has fragments
details/
  ddd/                      # DDD detail path (a folder of slides)
    01-was.md
    02-bausteine.md         # branches again: [detail: ../aggregate.md]
    03-beispiel.md
  aggregate.md              # nested detail (referenced from 02-bausteine.md)
```

The tree looks like this in the overview:

```text
1 ── 2 ─────────── 3
     └─ 2.1 ─ 2.2 ─ 2.3
              └─ 2.2.1
```

## Enabling the feature

Multi-level navigation is turned on per deck, next to `aspect`, in the first
slide's front matter:

```markdown
---
title: Multi-Level Demo
aspect: 16:9
multiLevel: true
---
```

A slide references its detail path — a `.md` file or a folder of `.md` files —
with a `detail` directive at the head of the slide:

```markdown
[detail: ../details/ddd/]: #
```

Paths resolve relative to the segment's base directory (the `slides/` folder for
the trunk, the referenced folder or file's directory for a detail).

## Navigation

| Key            | Action                                             |
| -------------- | -------------------------------------------------- |
| `→` / `←`      | Move within the current path                       |
| `↓`            | Enter the current slide's detail path              |
| `↑`            | Return to the branching slide                      |
| `Home` / `End` | Jump to the first / last slide of the main talk    |

Right on the last slide of a detail path automatically returns to the main talk.

## Build

```bash
pnpm --filter @mapre/example-multi-level build
# open dist/index.html
```
