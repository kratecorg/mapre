import { describe, expect, it } from 'vitest';
import { parseSlide } from '../parser/parseSlide';
import { renderSlide } from './renderSlide';

describe('renderSlide', () => {
  it('renders the requested channel and falls back to default content', () => {
    const slide = parseSlide('# Hallo\n\n[channel: en]: #\n\n# Hello', 0, { defaultChannel: 'de' });

    expect(renderSlide(slide, { channel: 'en' })).toContain('<h1>Hello</h1>');
    expect(renderSlide(slide, { channel: 'de' })).toContain('<h1>Hallo</h1>');
    // A channel without its own content falls back to the default.
    expect(renderSlide(slide, { channel: 'fr' })).toContain('<h1>Hallo</h1>');
  });

  it('renders markdown to HTML', () => {
    const slide = parseSlide('# Title\n\n**bold**', 0);

    const html = renderSlide(slide);

    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<strong>bold</strong>');
  });

  it('hides fragments above the revealed level', () => {
    const slide = parseSlide('# Title\n\n@1\n**Later**\n@1', 0);

    const hidden = renderSlide(slide, { revealedFragments: 0 });
    expect(hidden).toContain('hidden-fragment');
    expect(hidden).toContain('<strong>Later</strong>');

    const revealed = renderSlide(slide, { revealedFragments: 1 });
    expect(revealed).not.toContain('hidden-fragment');
    expect(revealed).toContain('<strong>Later</strong>');
  });

  it('reveals all fragments by default', () => {
    const slide = parseSlide('@1\ntext\n@1', 0);

    expect(renderSlide(slide)).not.toContain('hidden-fragment');
  });

  it('applies Prism syntax highlighting to code blocks', () => {
    const slide = parseSlide('```java\nrecord Point(int x) {}\n```', 0);

    const html = renderSlide(slide);

    expect(html).toContain('language-java');
    expect(html).toContain('class="token');
  });

  it('skips highlighting when disabled', () => {
    const slide = parseSlide('```java\nint x = 1;\n```', 0);

    const html = renderSlide(slide, { highlight: false });

    expect(html).not.toContain('class="token');
    expect(html).toContain('language-java');
  });

  it('turns inline class markup into spans', () => {
    const slide = parseSlide('das ist .red[rot]', 0);

    expect(renderSlide(slide)).toContain('<span class="red">rot</span>');
  });

  it('prepends an image background layer for the background directive', () => {
    const slide = parseSlide('[background: bg.png]: #\n\n# Hi', 0);

    const html = renderSlide(slide);

    expect(html).toContain('class="slide-bg"');
    expect(html).toContain("background-image:url('bg.png')");
  });

  it('uses a solid colour background when the value is a colour', () => {
    const slide = parseSlide('[background: #0a2540]: #\n\nBody', 0);

    expect(renderSlide(slide)).toContain('background-color:#0a2540');
  });

  it('applies a deck-level template when the slide sets none', () => {
    const slide = parseSlide('# Hi', 0);

    const html = renderSlide(slide, {
      templates: { card: '<section>{{content}}</section>' },
      variables: { template: 'card' },
    });

    expect(html).toBe('<section><h1>Hi</h1>\n</section>');
  });

  it('lets a slide opt out of the deck template with "none"', () => {
    const slide = parseSlide('[template: none]: #\n\n# Hi', 0);

    const html = renderSlide(slide, {
      templates: { card: '<section>{{content}}</section>' },
      variables: { template: 'card' },
    });

    expect(html).not.toContain('<section>');
    expect(html).toContain('<h1>Hi</h1>');
  });

  it('lets a slide template override the deck default', () => {
    const slide = parseSlide('[template: hero]: #\n\n# Hi', 0);

    const html = renderSlide(slide, {
      templates: {
        card: '<section>{{content}}</section>',
        hero: '<header>{{content}}</header>',
      },
      variables: { template: 'card' },
    });

    expect(html).toContain('<header>');
  });

  it('fills template placeholders from the rendered channel metadata', () => {
    const raw =
      '[title: DE Titel]: #\n\n# Hallo\n\n[channel: en]: #\n[title: EN Title]: #\n\n# Hello';
    const slide = parseSlide(raw, 0, { defaultChannel: 'de' });
    const templates = { card: '<section><h2>{{title}}</h2>{{content}}</section>' };

    const en = renderSlide(slide, { channel: 'en', templates, variables: { template: 'card' } });
    const de = renderSlide(slide, { channel: 'de', templates, variables: { template: 'card' } });

    expect(en).toContain('<h2>EN Title</h2>');
    expect(en).toContain('<h1>Hello</h1>');
    expect(de).toContain('<h2>DE Titel</h2>');
    expect(de).toContain('<h1>Hallo</h1>');
  });

  it('lets a channel override the template selection', () => {
    const raw = '# Hallo\n\n[channel: en]: #\n[template: hero]: #\n\n# Hello';
    const slide = parseSlide(raw, 0, { defaultChannel: 'de' });
    const templates = {
      card: '<section>{{content}}</section>',
      hero: '<header>{{content}}</header>',
    };

    expect(renderSlide(slide, { channel: 'en', templates, variables: { template: 'card' } })).toContain(
      '<header>',
    );
    expect(renderSlide(slide, { channel: 'de', templates, variables: { template: 'card' } })).toContain(
      '<section>',
    );
  });
});
