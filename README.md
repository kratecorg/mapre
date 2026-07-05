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

## Status

This repository is intended to become the dedicated foundation for the presentation stack. The README will be refined as the module split and implementation details settle.
