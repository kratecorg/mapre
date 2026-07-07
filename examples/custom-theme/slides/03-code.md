# Code stays readable

```java
public record Talk(String title, int durationMinutes) {

    public boolean isLightningTalk() {
        return durationMinutes <= 5;
    }
}
```
