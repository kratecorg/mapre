---
name: mapre
description: 'Create, rewrite, structure, and visually validate slide decks for the Mapre markdown presentation system. Use when generating presentations, talks, workshops, speaker notes, reveal steps, diagrams, themes, channels, or detail slides in a Mapre project.'
argument-hint: 'Describe the topic, audience, duration, and desired outcome'
user-invocable: true
disable-model-invocation: false
---

# Mapre Presentation Authoring

Create coherent, visual presentations as Mapre markdown. Treat the deck as a
spoken story, not as a document split across screens.

## Start With Local Context

Before writing:

1. Find the deck root and inspect its `slides/`, `style/`, and `resources/`
   folders, plus `mapre.js` or the package scripts used to build it.
2. Read the opening slides, one representative content chapter, and the ending.
   Preserve the deck's language, voice, file naming, directives, custom classes,
   templates, and visual system.
3. Reuse existing assets and established slide patterns where they fit.
4. For a new deck, establish the topic, audience, duration, language, desired
   audience outcome, and available source material. Ask only for information
   that cannot be inferred from the request or repository.

Do not change Mapre's implementation when the task is to author a presentation.
Do not edit generated files under `dist/`.

## Design the Story

Draft a short narrative spine before drafting slides:

1. **Opening**: create tension, a question, or a concrete situation.
2. **Problem**: make the audience recognise why the topic matters.
3. **Development**: introduce one idea at a time and support it with evidence,
   examples, comparisons, code, or diagrams.
4. **Resolution**: connect the ideas into a clear answer.
5. **Ending**: leave one memorable conclusion or actionable next step.

Estimate roughly one substantial slide per two minutes, then adjust for demos,
discussion, code, and intentionally fast visual sequences. Prefer a useful
through-line over filling a requested slide count.

## Write Slides for Projection

- Give each slide one job and one dominant idea.
- Use assertion headlines when possible. A title should convey the point, not
  merely name the topic.
- Keep text terse. Move nuance, transitions, examples, and citations into
  speaker notes after `???`.
- Replace long bullet lists with a sequence, comparison, diagram, image, or
  several slides. Avoid more than five bullets on one slide.
- Use concrete examples before abstractions when teaching a new concept.
- Make code examples minimal, readable, and relevant to the spoken argument.
  Keep code lines short enough for projection.
- Use fragments only when the reveal supports pacing, suspense, or explanation.
  Do not reveal every bullet by habit.
- Introduce visual rhythm by alternating sparse statements, diagrams, examples,
  comparisons, and code. Do not turn every slide into the same layout.
- Write speaker notes as concise prompts for delivery, not a verbatim script,
  unless the user explicitly requests a script.
- Do not invent facts, quotations, metrics, citations, or product capabilities.
  Mark unresolved claims clearly in notes and ask for a source when necessary.

## Use Mapre Syntax

The first collected markdown file may define deck metadata:

```markdown
---
title: A Clear Talk Title
theme: dark
aspect: 16:9
---
```

Separate slides with a standalone `---`, or organize chapters in numbered files
and folders. Mapre recursively sorts entries alphabetically, so preserve or
create a sortable naming scheme such as:

```text
slides/
  00.intro.md
  01.problem/
    01.context.md
    02.consequence.md
  02.solution.md
  03.outro.md
```

Use preferred link-reference directives at the start of a slide:

```markdown
[background: resources/architecture.png]: #
[template: none]: #

# The system has one source of truth
```

Use speaker notes after `???`:

```markdown
# The deployment is pull-driven

The server reconciles itself with Git.

???
Pause here and contrast this with a CI system pushing over SSH.
```

Use numbered fragment regions for purposeful progressive disclosure:

```markdown
# One change, three consequences

@1
- the desired state is reviewable
@2
- drift becomes detectable
@3
- rollback becomes a Git operation
```

Close a fragment with the same marker when later content should remain visible
from the beginning:

```markdown
@1
The apparent shortcut creates hidden state.
@1

That hidden state is the actual problem.
```

Use columns for genuine comparison or parallel structure:

```markdown
[columns: 1fr 1fr]: #
[columns-align: center]: #

# Push and pull answer different questions

[column]: #

## Push

CI decides when and where to deploy.

[column]: #

## Pull

The target reconciles itself continuously.
```

Use `.class[content]` for semantic emphasis and define reusable classes in the
deck stylesheet instead of scattering raw HTML or inline styles.

## Visual Assets

Presentations should use visual material when it communicates faster than text.
Prefer, in order:

1. existing project assets;
2. diagrams generated from the repository's established source format;
3. screenshots or real product imagery;
4. newly created assets whose source remains editable.

Store assets under `resources/` and reference them document-relative:

```markdown
![System context](resources/system-context.svg)
```

For a full-bleed image, use a background and remove template chrome:

```markdown
[background: resources/opening.jpg]: #
[template: none]: #
```

Do not use decorative images that add no meaning. Do not create diagrams as
fragile space-aligned text. Keep labels large, contrast high, and diagrams
simple enough to understand while listening.

## Styling

For existing decks, extend their design language rather than replacing it. For
new decks, start with a built-in theme and add a small `style/theme.css` only
when the content needs a distinct visual grammar.

- Use Mapre design tokens for colors and fonts.
- Size against the slide box with `cqh` and `cqw`, not viewport units.
- Use expressive typography with a reliable fallback and enough contrast for a
  projector.
- Avoid a single repeated card layout, excessive rounded boxes, ornamental
  gradients, and presentation text that explains the interface.
- Keep custom classes semantic and reusable, such as `.lead`, `.diagram`, or
  `.comparison`.
- Keep code compact. As a practical starting point, `.slide pre` may use
  `font-size: 0.62em`; code inside columns often needs less.

Read [theming](../../../docs/theming.md) before adding templates, custom design
tokens, or substantial CSS.

## Optional Mapre Features

Use these only when the presentation calls for them:

- **Channels** for translations or audience variants. Read
  [channels](../../../docs/channels.md).
- **Detail slides** for optional deep dives entered from the main story. Enable
  `multiLevel: true`, keep detail files outside `slides/`, and read
  [detail slides](../../../docs/detail-slides.md).
- **Templates** for repeated structural chrome, not for one-off slide layouts.

Consult the [Mapre reference](../../../docs/reference.md) instead of guessing
about directives or CLI options.

## Validate Every Deck

After editing:

1. Run the repository's existing Mapre build command. For a bundled CLI this is
   commonly `node mapre.js build`; from the Mapre repository use
   `pnpm exec mapre build` with the appropriate project and folder options.
2. Fix parser, asset, stylesheet, and build errors before continuing.
3. Start the existing Mapre dev command and inspect the actual presentation at
   a 16:9 desktop viewport and a smaller viewport.
4. Walk through every slide and every fragment. Check for vertical overflow,
   clipped or missing images, overly long code lines, weak contrast, unreadable
   labels, accidental empty slides, and inconsistent pacing.
5. Check presenter notes and any channels or detail paths that were changed.
6. For PDF work, run the project's PDF build and inspect the generated PDF with
   a Chromium-based renderer. Do not use Firefox as the fidelity reference.

When a slide overflows, first remove or split content. Reduce typography only
when the content is already irreducible. Finish by reporting which files were
changed, which build was run, and any visual checks that could not be completed.