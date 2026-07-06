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
}
