[columns: 2:1]: #

# Spalten

[column]: #

Die Marker lassen sich auch als **Link-Reference-Definition** schreiben:
`[column]: #`. Das ist gültiges CommonMark und rendert zu nichts, weil das Label
nie als Link referenziert wird.

```markdown
[column]: #
linke Spalte
[column]: #
rechte Spalte
[end-columns]: #
```

[column]: #

**Diese Folie**

- `columns: 2:1`
- zwei Spalten
- Fazit über die volle Breite

[end-columns]: #

Marker innerhalb eines Code-Blocks bleiben unangetastet — siehe links.
