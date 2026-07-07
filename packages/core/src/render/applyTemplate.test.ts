import { describe, expect, it } from 'vitest';
import { applyTemplate } from './applyTemplate';

describe('applyTemplate', () => {
  it('inserts the raw content for the content placeholder', () => {
    const html = applyTemplate('<main>{{content}}</main>', {}, '<p>Body</p>');
    expect(html).toBe('<main><p>Body</p></main>');
  });

  it('fills and escapes variable placeholders', () => {
    const html = applyTemplate('<h1>{{ title }}</h1>', { title: 'A & B <x>' }, '');
    expect(html).toBe('<h1>A &amp; B &lt;x&gt;</h1>');
  });

  it('resolves unknown placeholders to an empty string', () => {
    const html = applyTemplate('<p>{{missing}}</p>', {}, '');
    expect(html).toBe('<p></p>');
  });

  it('supports repeated and spaced placeholders', () => {
    const html = applyTemplate('{{a}}-{{ a }}', { a: 'x' }, '');
    expect(html).toBe('x-x');
  });
});
