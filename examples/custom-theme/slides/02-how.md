# How it works

- The deck names a stylesheet in its front matter
- `@mapre/node` resolves it relative to the slides folder
- The runtime inlines it after the baseline styles, so it wins by cascade
- The result stays a single, self-contained `.html`

Scope your rules to `.slide-box` and `.slide` so the theme shows in the
presenter previews too.
