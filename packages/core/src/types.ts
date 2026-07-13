/**
 * A full presentation parsed from markdown.
 *
 * A deck is the top-level unit the parser produces. It is intentionally free of
 * any rendering or runtime concerns so it can be reused outside the presentation
 * app.
 */
export interface Deck {
  metadata: DeckMetadata;
  slides: Slide[];
}

/**
 * Deck-level key/value metadata, taken from an optional leading front matter
 * block. `title` is surfaced explicitly because most consumers need it.
 */
export interface DeckMetadata {
  title?: string;
  [key: string]: string | undefined;
}

/**
 * A single slide in structured form.
 */
export interface Slide {
  /** Zero-based position of the slide within the deck. */
  index: number;
  /** Slide markdown body, with metadata directives and speaker notes removed. */
  content: string;
  /** Optional speaker notes, taken from the `???` section of the slide. */
  notes?: string;
  /** Number of progressive-reveal fragments (`@N` markers) on the slide. */
  fragmentCount: number;
  /**
   * Slide content split by channel. The key is the channel name; the value is
   * that channel's markdown. Slides without a `channel` directive have a single
   * entry under the deck's default channel. `content` mirrors the default
   * channel for convenience.
   */
  channels: Record<string, string>;
  /** Slide-level layout hints and other directives. */
  metadata: SlideMetadata;
  /**
   * Per-channel metadata, taken from directives at the start of a channel
   * section. These override {@link metadata} when that channel is rendered, so
   * a channel can supply its own `title`, `subheadline`, `template`, etc.
   */
  channelMetadata: Record<string, SlideMetadata>;
}

/**
 * Slide-level key/value metadata, taken from leading `<!-- key: value -->`
 * directive comments. Layout hints such as `layout` or `aspect` live here.
 */
export type SlideMetadata = Record<string, string>;

/**
 * Options controlling how a slide model is rendered to HTML.
 */
export interface RenderOptions {
  /**
   * How many fragments to reveal. Fragments with a level above this value stay
   * hidden. Defaults to all fragments revealed.
   */
  revealedFragments?: number;
  /** Whether to apply Prism syntax highlighting to fenced code blocks. */
  highlight?: boolean;
  /**
   * Which channel to render. When omitted, the slide's default content is used.
   * A channel without its own content falls back to the default content.
   */
  channel?: string;
  /**
   * Named HTML templates the slide can select through its `template` directive.
   * The keyed template wraps the rendered slide body, with `{{content}}` marking
   * where the body goes and `{{key}}` placeholders filled from {@link variables}
   * and the slide's own metadata.
   */
  templates?: Record<string, string>;
  /**
   * Values available to template placeholders, such as deck-level metadata and
   * built-ins (e.g. `pageNumber`). The slide's own metadata takes precedence.
   */
  variables?: Record<string, string>;
}
