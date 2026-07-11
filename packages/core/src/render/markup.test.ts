import { describe, expect, it } from 'vitest';
import { applyMarkup } from './markup';

describe('applyMarkup — inline class spans', () => {
  it('wraps a single class', () => {
    expect(applyMarkup('das ist .red[roter] Text')).toBe(
      'das ist <span class="red">roter</span> Text',
    );
  });

  it('chains multiple classes', () => {
    expect(applyMarkup('.bold.red[stark]')).toBe('<span class="bold red">stark</span>');
  });

  it('supports nested spans', () => {
    expect(applyMarkup('.a[x .b[y] z]')).toBe(
      '<span class="a">x <span class="b">y</span> z</span>',
    );
  });

  it('keeps an image (with brackets) inside a span', () => {
    expect(applyMarkup('.fig[![alt](p.png)]')).toBe('<span class="fig">![alt](p.png)</span>');
  });

  it('ignores a dotted word that is not a class run', () => {
    expect(applyMarkup('see logo.png[note]')).toBe('see logo.png[note]');
  });

  it('leaves class syntax inside inline code untouched', () => {
    expect(applyMarkup('use `.red[x]` verbatim')).toBe('use `.red[x]` verbatim');
  });

  it('leaves class syntax inside fenced code untouched', () => {
    const md = '```\n.red[x]\n```';
    expect(applyMarkup(md)).toBe(md);
  });
});

describe('applyMarkup — block class divs', () => {
  it('emits a div when a newline follows the opening bracket', () => {
    const md = '.columns[\nleft\n]';
    expect(applyMarkup(md)).toBe('\n\n<div class="columns">\n\nleft\n\n</div>\n\n');
  });

  it('keeps sibling column blocks separate', () => {
    const md = '.left[\n**a**\n]\n.right[\n**b**\n]';
    const out = applyMarkup(md);
    expect(out).toContain('<div class="left">');
    expect(out).toContain('<div class="right">');
  });

  it('treats same-line content as an inline span, not a block', () => {
    expect(applyMarkup('.red[wort]')).toBe('<span class="red">wort</span>');
  });

  it('nests a span inside a block div', () => {
    const out = applyMarkup('.col[\n.red[x]\n]');
    expect(out).toContain('<div class="col">');
    expect(out).toContain('<span class="red">x</span>');
  });
});
