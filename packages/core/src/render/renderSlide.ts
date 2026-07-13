import { marked } from 'marked';
import Prism from 'prismjs';
import 'prismjs/components/prism-java.js';
import 'prismjs/components/prism-javascript.js';
import 'prismjs/components/prism-typescript.js';
import 'prismjs/components/prism-bash.js';
import 'prismjs/components/prism-json.js';
import type { RenderOptions, Slide } from '../types';
import { postprocessFragments, preprocessFragments } from '../parser/fragments';
import { applyTemplate } from './applyTemplate';
import { applyMarkup } from './markup';

marked.setOptions({ gfm: true, breaks: false });

/**
 * Renders a slide model to HTML. Fragments above `revealedFragments` are wrapped
 * in `hidden-fragment` markup so the runtime can hide them, and fenced code
 * blocks are highlighted with Prism unless disabled.
 *
 * This module is DOM-free so it can run in Node and in the browser alike.
 */
export function renderSlide(slide: Slide, options: RenderOptions = {}): string {
  const revealed = options.revealedFragments ?? slide.fragmentCount;
  const highlight = options.highlight ?? true;
  const source = selectChannelContent(slide, options.channel);

  const withMarkup = applyMarkup(source);
  const withFragments = preprocessFragments(withMarkup, revealed);
  let html = marked.parse(withFragments) as string;
  html = postprocessFragments(html);

  if (highlight) {
    html = applySyntaxHighlighting(html);
  }

  html = wrapInTemplate(slide, html, options);
  return withBackground(slide, html);
}

/**
 * Prepends a full-slide background layer when the slide sets a `background`
 * directive. A value that looks like a CSS color paints a solid colour;
 * anything else is treated as an image URL. The layer sits behind the content.
 */
function withBackground(slide: Slide, html: string): string {
  const background = slide.metadata.background;
  if (background === undefined || background.trim() === '') {
    return html;
  }

  return `<div class="slide-bg" style="${backgroundStyle(background.trim())}"></div>${html}`;
}

const COLOR_PATTERN = /^(#[0-9a-fA-F]{3,8}|(?:rgb|hsl)a?\([^)"]*\))$/;

function backgroundStyle(value: string): string {
  if (COLOR_PATTERN.test(value)) {
    return `background-color:${value}`;
  }

  const url = value.replace(/['"\\)]/g, '').replace(/\s+/g, ' ');
  return `background-image:url('${url}');background-size:cover;background-position:center`;
}

/**
 * Wraps the rendered body in the selected template, if any. A slide picks a
 * template through its `template` directive; when it sets none, a deck-level
 * `template` (passed via {@link RenderOptions.variables}) applies as the default.
 * A slide can opt out of a deck default with `template: none`. An absent or
 * unknown template leaves the plain body unchanged.
 */
function wrapInTemplate(slide: Slide, html: string, options: RenderOptions): string {
  const metadata = mergeChannelMetadata(slide, options.channel);
  const templateName = metadata.template ?? options.variables?.template;
  if (
    templateName === undefined ||
    templateName === '' ||
    templateName === 'none' ||
    options.templates === undefined
  ) {
    return html;
  }

  const template = options.templates[templateName];
  if (template === undefined) {
    return html;
  }

  const variables = { ...(options.variables ?? {}), ...metadata };
  return applyTemplate(template, variables, html);
}

/**
 * Merges the slide's own metadata with the metadata of the requested channel.
 * Channel metadata wins, so a channel can override `title`, `subheadline` or
 * even the `template` for its own rendering.
 */
function mergeChannelMetadata(
  slide: Slide,
  channel: string | undefined,
): Record<string, string> {
  if (channel === undefined) {
    return slide.metadata;
  }

  const channelMetadata = slide.channelMetadata[channel];
  if (channelMetadata === undefined) {
    return slide.metadata;
  }

  return { ...slide.metadata, ...channelMetadata };
}

/**
 * Picks the content for the requested channel, falling back to the slide's
 * default content when the channel has no content of its own.
 */
function selectChannelContent(slide: Slide, channel: string | undefined): string {
  if (channel === undefined) {
    return slide.content;
  }

  return slide.channels[channel] ?? slide.content;
}

function applySyntaxHighlighting(html: string): string {
  return html.replace(
    /<code class="language-(\w+)">([\s\S]*?)<\/code>/g,
    (_match, language, rawCode) => {
      const grammar = Prism.languages[language];
      if (!grammar) {
        return `<code class="language-${language}">${rawCode}</code>`;
      }

      const code = decodeHtmlEntities(rawCode);
      const highlighted = highlightPreservingHiddenSpans(code, grammar, language);
      return `<code class="language-${language}">${highlighted}</code>`;
    },
  );
}

/**
 * Highlights code while keeping `hidden-fragment` spans intact. The spans are
 * split out, each visible/hidden segment is highlighted individually, and the
 * hidden segments are re-wrapped afterwards.
 */
function highlightPreservingHiddenSpans(
  code: string,
  grammar: Prism.Grammar,
  language: string,
): string {
  const segments: Array<{ hidden: boolean; content: string }> = [];
  const spanPattern = /<span class="hidden-fragment">([\s\S]*?)<\/span>/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = spanPattern.exec(code)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ hidden: false, content: code.slice(lastIndex, match.index) });
    }
    segments.push({ hidden: true, content: match[1] });
    lastIndex = spanPattern.lastIndex;
  }

  if (lastIndex < code.length) {
    segments.push({ hidden: false, content: code.slice(lastIndex) });
  }

  return segments
    .map((segment) => {
      const highlighted = Prism.highlight(segment.content, grammar, language);
      if (segment.hidden) {
        return `<span class="hidden-fragment">${highlighted}</span>`;
      }
      return highlighted;
    })
    .join('');
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&');
}
