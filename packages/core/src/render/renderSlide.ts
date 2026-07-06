import { marked } from 'marked';
import Prism from 'prismjs';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import type { RenderOptions, Slide } from '../types';
import { postprocessFragments, preprocessFragments } from '../parser/fragments';

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

  const withFragments = preprocessFragments(source, revealed);
  let html = marked.parse(withFragments) as string;
  html = postprocessFragments(html);

  if (highlight) {
    html = applySyntaxHighlighting(html);
  }

  return html;
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
