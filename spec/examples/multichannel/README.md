# Beispiel: Mehrkanaliges Deck

Dieses Mini-Deck demonstriert die Metadaten- und Kanal-Syntax aus §5 der
[Runtime-Spec](../../runtime.spec.md). Es folgt der Ordner-Konvention von
`@mapre/node` (`loadDeck`): Dateien werden alphabetisch sortiert und mit `---`
zu einem Deck verbunden; Deck-Defaults stehen am Kopf der **ersten** Datei.

## Kanäle in diesem Beispiel

- `de` — deutscher Inhalt (Default-Kanal)
- `en` — englischer Inhalt

Ein Presentation Window auf Kanal `de` zeigt die deutschen Abschnitte, ein
zweites auf `en` die englischen. Navigation und Timer laufen synchron.

## Dateien

- [`slides/01-title.md`](slides/01-title.md) — Deck-Defaults + Titelfolie in zwei Kanälen
- [`slides/02-content.md`](slides/02-content.md) — **mehrere Folien pro Datei** (durch `---` getrennt), Folien-Hintergrund, `duration`, per-Kanal-Hintergrund
- [`slides/03-fallback.md`](slides/03-fallback.md) — nur Default-Kanal (Fallback für `en`)

> Hinweis: `markdownlint` (Regel MD053) würde die `[key: value]: #`-Direktiven
> als „unused link reference“ melden. In einem Folienordner ist MD053 daher zu
> deaktivieren.
