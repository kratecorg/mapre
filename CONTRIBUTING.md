# Contributing to mapre

Thanks for helping improve mapre.

## Ways to contribute

- report bugs and UX issues
- improve the markdown parser, rendering, or runtime behavior
- add tests for regressions and edge cases
- improve documentation, examples, and developer ergonomics
- contribute fixes or new features with a focused pull request

## Development setup

This repository is a pnpm workspace.

```bash
pnpm install
pnpm build
pnpm test
```

The workspace is organized around packages such as:

- `packages/core` for the parser and slide model
- `packages/node` for file loading and deck assembly
- `packages/runtime` for the browser runtime
- `packages/cli` for the CLI tool

## Working on a change

1. Fork the repository and create a feature branch.
2. Keep changes focused and avoid unrelated refactors.
3. Add or update tests for behavior you change.
4. Run the relevant validation commands before opening a pull request.
5. Keep commit messages clear and scoped to the change.

## Pull request guidelines

- target the default branch
- describe the problem and the solution clearly
- include any breaking changes or migration notes
- mention tests run and results
- keep the diff small and reviewable

## Code quality

- prefer clear, small, well-named functions
- keep module boundaries explicit
- avoid adding new runtime dependencies without a strong reason
- maintain compatibility with the project’s Node 20+ requirement

## Reporting issues

For bug reports and feature requests, use the GitHub issue tracker.

For security vulnerabilities, use the private security reporting path instead of a public issue.
