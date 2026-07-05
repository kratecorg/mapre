# Beispiel: Eine eigene Präsentation mit mapre

Dieses Beispiel zeigt, wie du mit mapre aus Markdown-Dateien eine Präsentation
baust.

## Folien schreiben

Alle Folien liegen im Ordner [`slides/`](./slides). Sie werden **alphabetisch**
eingelesen, wobei **Dateien und Ordner gleichwertig** behandelt werden. Ein
Ordner darf also zwischen zwei Dateien einsortiert sein:

```text
slides/
  01-titel.md          # zuerst
  02-themen/           # danach (alphabetisch zwischen 01 und 03)
    01-parsing.md
    02-fragmente.md
  03-danke.md          # zuletzt
```

Innerhalb einer Datei trennt eine `---`-Zeile einzelne Folien. Jede Datei bildet
außerdem automatisch eine neue Folien-Grenze.

Unterstützte Syntax (siehe Haupt-README für Details):

- Deck-Metadaten als führender `---`-Block (z. B. `title:`)
- `---` als Folientrenner
- `???` für Sprecher-Notizen
- `<!-- layout: center -->` als Layout-Hinweis pro Folie
- `@N ... @N` für schrittweises Aufdecken

## Bauen und ansehen

Aus dem Repository-Root:

```bash
pnpm install
pnpm build            # baut die Pakete und erzeugt dieses Beispiel
```

Oder nur dieses Beispiel (nachdem die Pakete gebaut wurden):

```bash
pnpm --filter @mapre/example-basic-presentation build
```

Anschließend `dist/index.html` im Browser öffnen. Navigation per Pfeiltasten
oder Leertaste; der Regler „Größe“ skaliert die Folien unabhängig – praktisch,
um denselben Foliensatz auf Laptop und Beamer passend darzustellen.
