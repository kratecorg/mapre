# Schrittweises Aufdecken

Mit `@N`-Markern lassen sich Inhalte nacheinander einblenden:

@1
- Erster Punkt erscheint bei Schritt 1
@1

@2
- Zweiter Punkt erscheint bei Schritt 2
@2

Auch in Code-Blöcken:

```java
record Slide(int index, String content) {}
@1
Slide first = new Slide(0, "# Hallo");
@1
```

???
Hier mit der Leertaste durch die Fragmente steppen.
