# Channels

A channel is a content variant inside the same deck. One slide can carry an
English and a German version, a short and a long take, or a version with client
numbers and one without — all in the same file, next to each other.

Every window picks the channel it shows. Navigation stays in sync across
windows, the channel does not. So the projector can run the English deck while
the screen on your desk shows the German one, on the same slide.

## Writing channels

A `[channel: name]: #` line starts a channel section. Everything before the
first such line belongs to the deck's default channel:

```markdown
# Clean Architecture

The dependency arrow points inwards.

[channel: de]: #

# Clean Architecture

Der Abhängigkeitspfeil zeigt nach innen.
```

Rules:

- The default channel is `main`, changeable per deck with
  `defaultChannel: <name>` in the front matter.
- Sections of the same channel on one slide are concatenated, so you can
  interleave shared and variant content.
- Empty sections are dropped.
- A slide without any channel directive has only default content, and every
  channel falls back to it. Translate only the slides that need it.
- Directives at the start of a channel section (`[title: …]: #`,
  `[background: …]: #`, `[template: …]: #`, …) apply to that channel only and
  override the slide-level ones.
- Speaker notes are shared by all channels.
- Reveal steps are counted across the whole slide, so a `@1` in one channel and
  a `@1` in another advance together.

## A deck with an explicit default

```markdown
---
title: Clean Architecture
defaultChannel: en
---

# Where we are

- one deployment, many reasons to change

[channel: de]: #

# Wo wir stehen

- ein Deployment, viele Änderungsgründe
```

Slides that exist only in English simply have no `de` section — the `de` window
shows the English content for them.

## Presenting with channels

- The presenter view lists one **Open channel** button per channel. Each click
  opens a new window, so the same channel can go to two displays.
- The **View** control switches the channel previewed inside the presenter
  window itself.
- A window's channel is part of its URL: `#presentation/de`. The default channel
  is left out of the hash, so `#presentation` stays clean.
- Channels are ordered with the default first, the rest alphabetically.

## Building with channels

`mapre build` writes one print-ready HTML per channel next to the output:

```text
dist/presentation.html        the interactive deck, all channels inside
dist/presentation-en.html     print layout, English
dist/presentation-de.html     print layout, German
```

With `--pdf` each of those is rendered to a PDF as well. This is the fastest way
to produce a handout per language from one source.

## Ideas beyond translation

- **Audience variants** — a `client` channel with the numbers, a `public`
  channel without.
- **Talk lengths** — a `short` channel that skips the deep dives.
- **Speaker crib** — a channel you preview in the presenter window with extra
  cues, while the audience window runs the plain one.

See also: [Reference — slide directives](reference.md#slide-directives).
