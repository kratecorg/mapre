# Beispiel: Single-File-Präsentation

Dieses Beispiel baut aus einem Folienordner eine **einzige, in sich
geschlossene** `.html`-Datei. Sie enthält Folien, Styles und den Browser-Client
inline und läuft in allen drei Deploy-Varianten der
[Runtime-Spec](../../spec/runtime.spec.md#7-deploy-varianten):

- Webserver im Internet
- lokaler Webserver (`python3 -m http.server`)
- Doppelklick auf die Datei (`file://`)

## Bauen

`@mapre/runtime` muss zuvor gebaut sein (liefert den gebündelten Browser-Client):

```bash
pnpm --filter @mapre/runtime build
pnpm --filter @mapre/example-single-file build
```

Das Ergebnis liegt unter `dist/index.html` und kann direkt geöffnet werden.
