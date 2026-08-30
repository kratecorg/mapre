#!/usr/bin/env bash
# Verifies the shipped CLI bundle can scaffold a deck and build a self-contained
# presentation for every theme. Run after `pnpm -r build`.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLI="$REPO_ROOT/packages/cli/dist/mapre.js"
THEMES=(light dark high-contrast colorful)

if [[ ! -f "$CLI" ]]; then
  echo "Missing $CLI — run 'pnpm -r build' first." >&2
  exit 1
fi

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

DECK_DIR="$WORK_DIR/deck"
node "$CLI" init "$DECK_DIR" >/dev/null

for theme in "${THEMES[@]}"; do
  out="$WORK_DIR/out/$theme.html"
  node "$CLI" build "$DECK_DIR" --theme "$theme" --out "$out" >/dev/null

  if [[ ! -s "$out" ]]; then
    echo "Theme $theme produced no output at $out" >&2
    exit 1
  fi

  # A self-contained deck must open from file:// without any network access.
  if grep -Eq '(src|href)="(https?:)?//' "$out"; then
    echo "Theme $theme references an external resource:" >&2
    grep -Eo '(src|href)="(https?:)?//[^"]*"' "$out" >&2
    exit 1
  fi

  echo "ok: $theme"
done

echo "Smoke test passed for ${#THEMES[@]} themes."
