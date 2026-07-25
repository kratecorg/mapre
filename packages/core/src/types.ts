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
 * A raw markdown segment plus the detail branches that hang off its slides.
 *
 * This is the framework-agnostic description of a multi-level deck: the trunk is
 * the root segment, and each {@link SegmentDetail} attaches a nested segment to
 * one of the segment's slides. It is produced with filesystem access (see
 * `@mapre/node`) and consumed by {@link DeckTree} building, so the same tree can
 * be rebuilt in a browser without touching the filesystem.
 */
export interface DeckSourceSegment {
  /** The concatenated markdown for this segment's slides. */
  markdown: string;
  /** Detail branches attached to individual slides of this segment. */
  details: SegmentDetail[];
}

/**
 * A detail branch attached to one slide of a {@link DeckSourceSegment}.
 */
export interface SegmentDetail {
  /** Zero-based position of the branching slide within its segment. */
  slideLocalIndex: number;
  /** The detail branch's own segment (which may nest further details). */
  segment: DeckSourceSegment;
}

/**
 * A deck flattened into depth-first order, with navigation links describing the
 * multi-level tree structure. {@link slides} holds every slide (trunk and
 * detail) in the order they are laid out and rendered; {@link nodes} is parallel
 * to it and carries the tree links for each slide.
 */
export interface DeckTree {
  metadata: DeckMetadata;
  slides: Slide[];
  nodes: TreeNode[];
  /** Whether multi-level navigation is enabled for this deck. */
  multiLevel: boolean;
  /** Number of trunk (top-level) slides — the length of the main talk. */
  trunkCount: number;
}

/**
 * Navigation and layout links for a single slide within a {@link DeckTree}. All
 * indices refer to positions in {@link DeckTree.slides}; `-1` means "none".
 */
export interface TreeNode {
  /** Position in {@link DeckTree.slides}. */
  flatIndex: number;
  /** Nesting depth: 0 for trunk slides, 1 for their details, and so on. */
  depth: number;
  /** The branching slide this detail hangs off, or `-1` for trunk slides. */
  parent: number;
  /** The first slide of this slide's detail branch, or `-1` when it has none. */
  child: number;
  /** Previous sibling in the same path, or `-1` at the path start. */
  prevInPath: number;
  /** Next sibling in the same path, or `-1` at the path end. */
  nextInPath: number;
  /** Overview row: the trunk is lane 0, each branch gets its own lane below. */
  lane: number;
  /** Overview column: horizontal position within the git-tree layout. */
  column: number;
  /** Hierarchical label for display, e.g. `2` (trunk) or `2.1.3` (nested). */
  pathLabel: string;
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
