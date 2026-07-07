# Runtime-Spezifikation

Diese Spezifikation beschreibt die **Presentation Runtime** von mapre: die Schicht,
die einen geparsten `Deck` (siehe `packages/core`) anzeigt, steuert und über mehrere
Fenster/Displays hinweg synchronisiert.

Der Fokus liegt auf dem *Was* und den *Anforderungen*, nicht auf konkreter
Implementierung. Offene Punkte sind als solche markiert.

## 1. Ziele und Abgrenzung

- Die Runtime baut ausschließlich auf dem framework-agnostischen `Deck`-Modell auf.
- Parsing und Rendering-Bausteine (`@mapre/core`) bleiben frei von Runtime-Belangen.
- Die Runtime kapselt: Fensterverwaltung, Navigation, Synchronisation, Timer,
  Steuerelemente und mehrsprachigen/mehrkanaligen Folieninhalt.
- **Nicht** Teil dieser Spec: Netzwerk-Streaming an entfernte Zuschauer,
  Video-Konferenz-Integration (mögliche spätere Erweiterung, siehe §11).

## 2. Fenster-Modell

Die Runtime kennt zwei logische Fenstertypen:

### 2.1 Presentation Window (Publikumsansicht)

- Zeigt **eine** Folie formatfüllend an.
- Keine Steuerelemente, keine Zusatzinfos.
- Skaliert die Folie proportional in den verfügbaren Platz (Fit-to-Window).
- Kann mehrfach existieren: mehrere Presentation Windows zeigen ggf.
  unterschiedliche **Kanäle** derselben Folie an (siehe §5).

### 2.2 Presenter Window (Referentenansicht / Mirror Mode)

Zeigt zusätzlich zur aktuellen Folie:

- **Aktuelle Folie** (verkleinerte Vorschau).
- **Folgefolie** (verkleinerte Vorschau); am Deck-Ende ein Ende-Hinweis.
- **Speaker Notes** der aktuellen Folie (`Slide.notes`).
- **Timer** (siehe §4).
- **Steuerelemente** (siehe §3).
- **Fortschritt**: aktuelle Folien-Nr. / Gesamtzahl, optional Fortschrittsbalken.
- Optional: Übersicht der Fragmente/Reveal-Schritte der aktuellen Folie.

Ein Presenter Window kann ein oder mehrere Presentation Windows öffnen und steuern.
Der Presenter ist die **Quelle der Wahrheit** für den Navigationszustand.

## 3. Steuerelemente

Mindestanforderung:

- **Navigation**: nächste/vorherige Folie, nächstes/vorheriges Fragment
  (Reveal-Schritt), Sprung zu erster/letzter Folie, Sprung zu Foliennummer.
- **Zoom Presenter-Vorschau**: Vergrößern/Verkleinern der Vorschaufolien im
  Presenter Window (beeinflusst nur die Presenter-Ansicht).
- **Zoom Presentation**: Vergrößern/Verkleinern des Folieninhalts in den
  Presentation Windows (beeinflusst die Publikumsansicht; wird an alle
  Presentation Windows propagiert).
- **Timer-Steuerung**: Start/Pause/Reset (siehe §4).
- **Fenster**: Presentation Window öffnen/schließen, Vollbild umschalten.

Wünschenswert (eigene Ergänzungen):

- **Blackout / Whiteout**: Publikumsansicht temporär schwarz/weiß schalten
  (Aufmerksamkeit lenken), Presenter behält Kontrolle.
- **Folienübersicht (Overview/Grid)**: Rasteransicht aller Folien zum schnellen
  Springen.
- **Laserpointer / Zeiger**: Positionszeiger, der auf die Publikumsansicht
  gespiegelt wird.
- **Annotationen**: einfaches Freihand-Zeichnen auf der Folie (spiegelbar).
  *(Offen: Scope – ggf. spätere Ausbaustufe.)*

### 3.1 Eingabemethoden

- **Tastatur-Shortcuts** für alle Navigations- und Timer-Aktionen
  (z. B. `→`/`Space` weiter, `←` zurück, `F` Vollbild, `B` Blackout,
  `O` Overview, `0…9`+`Enter` Sprung). Presenter-Fernbedienungen (Clicker)
  senden i. d. R. `PageUp`/`PageDown` — diese müssen abgedeckt sein.
- **Touch/Swipe** für Tablet-Nutzung in den Fenstern.
- **On-Screen-Buttons** im Presenter Window als Fallback ohne Tastatur.

## 4. Timer

- Modi: **Stoppuhr** (hochzählend) und **Countdown** (auf Zielzeit).
- Aktionen: Start, Pause, Reset.
- Optionale **Zieldauer** pro Vortrag; visuelle Warnung bei Annäherung/Überschreitung
  (z. B. Farbwechsel).
- Timer läuft im Presenter Window; Zustand überlebt einen Reload (siehe §7).
- Optional: **Slot-/Kapitel-Zeiten** je Folienbereich (Soll-Ist-Abgleich).
  *(Offen: erst nach Basis-Timer.)*

## 5. Mehrsprachigkeit / Mehrkanaliger Folieninhalt

Anforderung: Eine Folie kann **mehrere Inhalte** tragen, die über Metadaten
markiert sind. Inhaltsteil 1 erscheint auf Presentation Window 1, Teil 2 auf
Presentation Window 2 usw. Typische Anwendungen: parallele Sprachen (DE/EN) oder
inhaltlich getrennte Displays.

### 5.1 Konzept „Kanal“ (Channel/Track)

- Ein **Kanal** ist eine benannte Spur (z. B. `de`, `en`, `main`, `1`, `2`).
- Ein Folieninhalt wird per Metadaten einem Kanal zugeordnet.
- Jedes Presentation Window ist auf **genau einen Kanal** konfiguriert und zeigt
  den passenden Inhaltsteil der aktuellen Folie.
- Navigation/Timing ist **kanalübergreifend synchron**: Alle Fenster zeigen stets
  denselben Folien- und Fragment-Index, nur der Inhalt unterscheidet sich pro Kanal.

### 5.2 Direktiven-Syntax: Link-Reference-Definitionen

Metadaten und Kanal-Marker werden als **Markdown-Link-Reference-Definitionen**
notiert:

```markdown
[key: value]: #
```

Das ist gültiges CommonMark, wird von jedem konformen Renderer zu **nichts**
gerendert (kein sichtbarer Output) und bleibt im Rohtext kompakt und lesbar.

**Warum diese Syntax (statt `<!-- key: value -->`):**

- valides CommonMark, kein HTML — funktioniert auch bei Renderern, die HTML
  entfernen/escapen;
- reiht sich in den bestehenden `key: value`-Aufbau der Front-Matter ein;
- im Rohtext unaufdringlich und gut lesbar.

**Tradeoff / zu beachten:**

- `markdownlint` meldet solche Definitionen als „unused link reference
  definition“ (Regel **MD053**). Für Foliendateien muss MD053 deaktiviert
  werden (z. B. per `.markdownlint`-Config im Folienordner).
- Bei mehrfach identischem Label (z. B. `[channel: en]: #` in mehreren Folien)
  gilt CommonMark „first definition wins“ — unkritisch, da die Definition nie
  als Link referenziert wird.

> **Abhängigkeit zu `@mapre/core`:** Der Direktiven-Parser unterstützt die
> Link-Reference-Syntax (`matchDirective`, zusätzlich zu `<!-- key: value -->`).
> Das Slide-Modell trägt `channels: Record<string, string>` (Inhalt pro Kanal);
> `renderSlide(slide, { channel })` wählt den Kanal und fällt bei fehlendem
> Inhalt auf den Default zurück. Folien ohne Kanäle verhalten sich wie bisher
> (ein Eintrag unter dem Default-Kanal). **Status: implementiert.**

### 5.3 Geltungsbereiche

Dieselbe Syntax wirkt je nach Position auf drei Ebenen:

- **Deck-Ebene** — Direktiven ganz am Anfang des Decks (vor dem ersten
  Folieninhalt; bei `@mapre/node` am Kopf der ersten Datei). Setzen globale
  Defaults, z. B. `[defaultChannel: de]: #`, `[defaultBackground: foo.png]: #`,
  `[title: Mein Talk]: #`.
- **Folien-Ebene** — Direktiven am Kopf einer Folie (direkt nach dem `---`).
  Gelten für die **gesamte** Folie, z. B. `[layout: center]: #`,
  `[background: intro.png]: #`, `[duration: 3]: #`.
- **Kanal-Abschnitt** — `[channel: xx]: #` teilt den Folieninhalt in
  kanalspezifische Abschnitte. Inhalt **vor** dem ersten Kanal-Marker gehört zum
  `defaultChannel`. Direktiven **innerhalb** eines Kanal-Abschnitts (z. B.
  `[background: en.png]: #`) gelten nur für diesen Kanal.

### 5.4 Keyword-Katalog

| Keyword            | Ebene            | Bedeutung                                                        | Status    |
| ------------------ | ---------------- | ---------------------------------------------------------------- | --------- |
| `title`            | Deck             | Deck-Titel                                                       | vorhanden |
| `aspect`           | Deck / Folie     | Seitenverhältnis (z. B. `16:9`)                                  | vorhanden |
| `layout`           | Folie            | Layout-Hinweis (z. B. `center`)                                  | vorhanden |
| `defaultChannel`   | Deck             | Kanal für unmarkierten Inhalt (sonst `main`)                     | neu       |
| `defaultBackground`| Deck             | Standard-Hintergrund für alle Folien                             | neu       |
| `channel`          | Kanal-Abschnitt  | Startet einen kanalspezifischen Inhaltsabschnitt                 | neu       |
| `background`       | Folie / Kanal    | Hintergrund (Bildpfad oder Farbe) für Folie bzw. Kanal-Abschnitt | neu       |
| `stylesheet`       | Deck             | Autor-CSS relativ zum Folienordner, wird ins HTML inlined (§9)  | vorhanden |
| `theme`            | Deck / Folie     | Styling-Theme (siehe §9)                                         | offen     |
| `duration`         | Folie            | Ziel-/Sollzeit in Minuten für Timer-Slots (siehe §4)            | offen     |
| `id`               | Folie            | Benannter Anker für Deep-Linking/Sprungmarken (siehe §8)        | offen     |
| `class`            | Folie / Kanal    | Zusätzliche CSS-Klasse(n)                                        | offen     |
| `transition`       | Folie            | Folienübergang                                                   | offen     |

Weitere Keywords lassen sich additiv ergänzen; unbekannte Keys werden als
generische Metadaten durchgereicht (wie bisher `SlideMetadata`).

### 5.5 Auflösungs- und Fallback-Regeln

- **Kanal ohne Inhalt:** Fehlt für den Kanal eines Presentation Window ein
  eigener Abschnitt, wird der Inhalt des `defaultChannel` angezeigt.
- **Unmarkierter Inhalt:** Inhalt ohne vorangehenden `[channel: …]: #`-Marker
  gehört zum `defaultChannel` (bzw. `main`, wenn kein Default gesetzt ist).
- **Hintergrund-Auflösung** (spezifisch schlägt allgemein):
  Kanal-`background` → Folien-`background` → Deck-`defaultBackground`.

Konkrete Beispiel-Folien liegen unter
[`spec/examples/multichannel/`](examples/multichannel/README.md).

## 6. Fenster-Synchronisation

Der Presenter ist die Steuerquelle; Presentation Windows sind Follower. Zu
synchronisierender Zustand:

- aktueller Folien-Index
- aktueller Fragment-/Reveal-Schritt
- Presentation-Zoomstufe
- Blackout/Whiteout-Status
- optional: Zeiger-/Annotationsdaten

### 6.1 Transportmechanismus (deploy-übergreifend)

Muss in **allen drei** Deploy-Varianten (§7) funktionieren, inkl. `file://`:

- **Primär**: `window.open()`-Referenz + `postMessage` zwischen Opener (Presenter)
  und geöffneten Presentation Windows. Funktioniert same-origin, auch bei `file://`.
- **Optional/Enhancement**: `BroadcastChannel` bzw. `storage`-Events, wenn
  verfügbar (bequemer für lose gekoppelte Tabs). *Achtung:* Diese sind unter
  `file://` teils eingeschränkt und dürfen nicht die einzige Lösung sein.
- **Robustheit**: Popup-Blocker abfangen (Fenster nur aus Nutzergeste öffnen),
  bei Verbindungsverlust re-synchronisieren, Presentation Window fordert beim
  Öffnen den aktuellen Vollzustand an (Handshake).

## 7. Deploy-Varianten

Die Runtime muss identisch in drei Auslieferungsformen laufen:

1. **Webserver im Internet** — statische Assets, normal gehostet.
2. **Lokaler Webserver** — z. B. `python3 -m http.server`; keine Server-Logik
   erforderlich, rein statisch.
3. **Single-File-HTML** — alles (JS, CSS, Folieninhalt, Assets als Data-URIs) in
   **eine** `.html` gebündelt, per Doppelklick (`file://`) lauffähig.

Konsequenzen:

- **Keine** Server-seitige Laufzeitlogik; die Runtime ist rein clientseitig.
- Kein Angewiesensein auf Fetch relativer Ressourcen im Single-File-Modus
  (Assets müssen inline vorliegen).
- Persistenz (Timer, letzte Folie, Zoom) nur über clientseitige Mittel
  (`localStorage`/URL-Hash); im `file://`-Fall Grenzen beachten und tolerieren.
- Ein Build-/Bundling-Schritt erzeugt die Single-File-Variante aus demselben Code.

## 8. Persistenz & Deep-Linking

- **Deep-Link**: aktuelle Folie (und optional Fragment) im URL-Hash, damit
  Reload/Teilen an derselben Stelle fortsetzt (z. B. `#/3/2`).
- **Wiederaufnahme**: Timer- und Navigationszustand nach Reload wiederherstellen,
  soweit die Deploy-Variante Persistenz erlaubt.

## 9. Rendering & Darstellung

- Folien werden proportional in den Viewport skaliert (konfigurierbares
  Seitenverhältnis, vgl. `aspect`-Direktive).
- Fragment-/Reveal-Schritte nutzen `RenderOptions.revealedFragments` aus `@mapre/core`.
- Syntax-Highlighting optional über `RenderOptions.highlight`.
- **Barrierefreiheit**: sinnvolle ARIA-Rollen, Tastatur-Bedienbarkeit,
  Respektierung von `prefers-reduced-motion`.
- **Autor-Stylesheet**: Die Deck-Direktive `stylesheet` benennt eine CSS-Datei
  relativ zum Folienordner. Beim Build liest `@mapre/node` (`loadDeckStyles`)
  diese Datei und inlined sie **nach** den Baseline-Styles, sodass sie per
  Kaskade gewinnt — das Ergebnis bleibt eine einzige, in sich geschlossene
  `.html`. Empfehlung: Regeln auf `.stage`/`.stage .slide` beschränken, damit
  die Presenter-Ansicht ihr eigenes Styling behält. Beispiel:
  [`examples/fau-theme/`](../examples/fau-theme/README.md). **Status: implementiert.**
- **Themes**: benannte Styling-Presets über die `theme`-Direktive.
  *(Offen: Theme-Mechanismus als Preset-Bündel über CSS-Variablen.)*

## 10. Zusätzliche Ideen (zur Diskussion)

Über die Kernanforderungen hinaus, priorisierbar:

- **PDF-/Print-Export** der Publikumsansicht (ein Folie pro Seite).
- **Autoplay / zeitgesteuerter Vorlauf** für Kiosk-Betrieb.
- **Confidence-Monitor**-Feinschliff (große Uhr, klare Notes-Typografie).
- **Mehrere Monitore**: Merken, welches Fenster auf welchen Screen gehört
  (`window.screen`/Multi-Screen-API, wo verfügbar).
- **Offline-Fähigkeit** für die Webserver-Varianten (Service Worker) — nicht
  nötig für Single-File.
- **Foliennummern/Kapitelmarken** und Sprungmarken-Navigation.

## 11. Spätere Erweiterungen (außerhalb dieser Spec)

- Netzwerk-Synchronisation an entfernte Zuschauer (Follow-the-Presenter live).
- Serverseitige Features (Analytics, geteilte Steuerung mehrerer Referenten).

## 12. Offene Punkte

- Konkrete Metadaten-Syntax für Kanäle (§5.2).
- Modelländerung in `@mapre/core` für mehrkanaligen Folieninhalt (§5).
- Scope von Annotationen/Zeiger (§3).
- Theme-Mechanismus (§9).
- Paketgrenze der Runtime unter `packages/` (Name/Aufteilung Presenter vs.
  Presentation).
