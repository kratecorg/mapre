[background: backgrounds/topic.png]: #
[duration: 3]: #

# Kanäle im Detail

Der Folien-Hintergrund (`background`) und die Sollzeit (`duration`, in Minuten)
gelten für die **gesamte** Folie, also für alle Kanäle.

- ein Kanal pro Presentation Window
- Inhalt vor dem ersten `[channel: …]: #` gehört zum `defaultChannel`

@1
- dieser Punkt erscheint erst im nächsten Reveal-Schritt
@1

[channel: en]: #
[background: backgrounds/topic-en.png]: #

# Channels in detail

This channel overrides the background via its own `background` directive, which
takes precedence over the slide-level background for the `en` channel.

- one channel per presentation window

@1
- this bullet appears on the next reveal step
@1

???
Speaker notes are shared across channels and only shown in the presenter window.

---

# Mehrere Folien pro Datei

Eine einzelne `.md`-Datei kann mehrere Folien enthalten. Sie werden durch eine
alleinstehende `---`-Zeile getrennt. Innerhalb einer Datei gelten dieselben
Kanal- und Metadaten-Regeln wie über Dateigrenzen hinweg.

[channel: en]: #

# Multiple slides per file

The `en` channel continues to work across every slide in the file — the split by
`---` only separates slides, not channels.

