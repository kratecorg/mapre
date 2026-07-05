# Code-Beispiel

```java
public record Slide(int index, String content) {
    public boolean hasContent() {
        return !content.isBlank();
    }
}
```

Syntax-Highlighting wird im Browser zur Laufzeit erzeugt.
