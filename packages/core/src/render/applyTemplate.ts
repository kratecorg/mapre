/**
 * Substitutes `{{ key }}` placeholders in a template string.
 *
 * The special `content` placeholder receives the already-rendered slide body as
 * raw HTML. Every other placeholder is filled from `variables` and HTML-escaped,
 * since those values come from plain-text directives. Unknown placeholders
 * resolve to an empty string so a template can offer optional slots.
 */
export function applyTemplate(
  template: string,
  variables: Record<string, string>,
  content: string,
): string {
  return template.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_match, key: string) => {
    if (key === 'content') {
      return content;
    }
    const value = variables[key];
    return value === undefined ? '' : escapeHtml(value);
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
