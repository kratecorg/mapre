# Multi-Level-Folien (Detail-Pfade) — Planung

Diese Spezifikation plant ein neues Feature für die mapre-Runtime: **Multi-Level-
Folien**. Neben dem linearen Hauptvortrag (dem *Trunk*) kann jede Folie einen
**Detail-Pfad** besitzen, in den der Referent bei Bedarf „abbiegt“ und danach
wieder in den Hauptvortrag zurückkehrt. Detail-Pfade können ihrerseits weitere
Detail-Pfade enthalten (beliebige Verschachtelung).

Der Fokus liegt auf dem *Was* und den Design-Entscheidungen. Konkrete
Umsetzungsschritte stehen am Ende (§13). Diese Datei ergänzt
[`runtime.spec.md`](runtime.spec.md); Begriffe wie *Presentation Window*,
*Presenter Window*, *Kanal* und *Sync* werden von dort übernommen.

## 1. Ziel & Motivation

Beispiel: Ein Vortrag über Software-Architektur enthält eine Folie zu
Domain-Driven Design. Kommt aus dem Publikum eine Frage, will der Referent statt
zur nächsten Hauptfolie zu einem Detail-Pfad abbiegen — z. B. drei Folien, die
DDD genauer erklären — und danach nahtlos im Hauptvortrag weitermachen.

Anforderungen (aus der Feature-Anfrage, inkl. beantworteter Rückfragen):

- **Globales Flag**: Das Feature ist pro Präsentation an- oder ausschaltbar und
  wird — wie `aspect` — in der ersten Folie (Front-Matter/Deck-Direktive)
  konfiguriert (§3).
- **Autoren-Syntax**: Detail-Folien liegen **immer** in einer eigenen `.md`-Datei
  oder einem eigenen Ordner und werden per Direktive referenziert, z. B.
  `[detail: ddd-details/]: #` oder `[detail: ddd-details.md]: #` (§4).
- **Ein Detail-Pfad pro Folie** (maximal einer) — die Runter-Taste hat damit
  genau ein Ziel (Rückfrage 1).
- **Navigation**: Links/Rechts bewegen sich **innerhalb des aktuellen Pfads**,
  **Runter** betritt den Detail-Pfad einer Folie, **Hoch** verlässt die Details
  wieder (§5).
- **Auto-Rückkehr**: Rechts auf der letzten Folie eines Detail-Pfads führt
  automatisch zurück in den Hauptvortrag, und zwar zur nächsten Folie der
  Eltern-Ebene (Rückfrage 2).
- **Abzweigen nur von einer ganzen Folie**, nicht von einem einzelnen
  Reveal-Schritt/Fragment (Rückfrage 4).
- **Overview**: Die Baumstruktur wird als „Git-Tree, aber von links nach rechts“
  dargestellt (§8).

## 2. Begriffe

- **Trunk (Hauptvortrag)**: die lineare Folienfolge des Projekts (aus `slides/`).
- **Branch / Detail-Pfad**: eine lineare Folienfolge, die an einer Trunk- oder
  Detail-Folie hängt. Wird aus einer `.md`-Datei oder einem Ordner geladen.
- **Node**: eine einzelne Folie an einer bestimmten Position im Baum.
- **Index-Pfad**: die Position eines Nodes als Array von Indizes,
  z. B. `[2]` = 3. Trunk-Folie, `[2, 0]` = 1. Detail-Folie davon,
  `[2, 0, 1]` = 2. Folie eines darunterliegenden Detail-Pfads.
- **Eltern-Folie**: die Folie, an der ein Detail-Pfad hängt (die abzweigende
  Folie).

Der Baum ist damit: **eine Folge von Trunk-Folien; jede Folie hat optional genau
einen Kind-Pfad; jede Folie eines Kind-Pfads hat wiederum optional einen
Kind-Pfad.**

## 3. Globales Flag

Deck-Ebene, wie `aspect` konfiguriert (Front-Matter der ersten Datei oder
führender Direktiven-Block):

```markdown
---
title: Architektur
aspect: 16:9
multiLevel: true
---
```

oder als Direktive:

```markdown
[multiLevel: true]: #
```

Landet in `deck.metadata.multiLevel`. Werte: `true`/`on` = an, sonst aus.

- **Flag aus (Default)**: `[detail: …]: #`-Direktiven werden **ignoriert**;
  Detail-Dateien werden weder geladen noch angezeigt. Das Deck verhält sich exakt
  wie heute (rein linearer Trunk). Hoch/Runter bleiben ohne Funktion.
- **Flag an**: Detail-Direktiven werden aufgelöst und der Baum aufgebaut (§4),
  Hoch/Runter navigieren zwischen den Ebenen (§5).

> Entscheidung: Bei ausgeschaltetem Flag werden Detail-Folien **nicht** linear
> eingehängt, sondern komplett weggelassen. So kann man dasselbe Projekt mit
> einem Schalter zwischen „schlanker Hauptvortrag“ und „mit Details“ umschalten.

## 4. Autoren-Syntax

### 4.1 Detail-Referenz

Eine Folie erhält ihren Detail-Pfad über eine Direktive am Folienkopf (gleiche
Link-Reference-Syntax wie `background`, `template` etc.):

```markdown
[detail: ddd-details/]: #

# Domain-Driven Design

Kernидее …
```

Der Wert ist entweder:

- **eine `.md`-Datei** (`[detail: ddd.md]: #`): Ihr Inhalt wird wie ein Deck
  gelesen und per `---` in mehrere Detail-Folien getrennt.
- **ein Ordner** (`[detail: ddd/]: #`, endet auf `/` oder ist ein Verzeichnis):
  Alle `*.md` darin werden — wie der Trunk in `slides/` — sortiert und zu einem
  Detail-Pfad zusammengefügt (`loadDeckSource`-Semantik).

Die Direktive ist Folien-Metadatum (`slide.metadata.detail`); der Parser braucht
dafür **keine** Sonderbehandlung — nur der Loader (§6) und die Runtime (§7)
interpretieren sie.

### 4.2 Pfad-Auflösung

- Pfade werden **relativ zur Wurzel des Segments** aufgelöst, in dem die
  Direktive steht:
  - Trunk-Folien → relativ zum `slides/`-Ordner des Projekts.
  - Folien eines Detail-Segments → relativ zu dessen Basisordner (der
    referenzierte Ordner bzw. das Verzeichnis der referenzierten Datei).
- Diese Regel vermeidet das Problem, dass ein Ordner-Deck beim Zusammenfügen die
  Herkunftsdatei einzelner Folien verliert: Auflösung erfolgt **immer** relativ
  zur Segment-Basis, nie relativ zur einzelnen Quelldatei.

### 4.3 Verschachtelung & Schutz

- Eine Detail-Folie darf selbst wieder `[detail: …]: #` tragen → beliebige Tiefe.
- **Zyklen** (ein Detail referenziert einen Vorfahren) werden über eine Menge der
  bereits besuchten absoluten Pfade in der aktuellen Kette erkannt; ein Zyklus
  ist ein Build-Fehler mit klarer Meldung.
- Fehlende Datei/Ordner → Build-Fehler mit Pfadangabe.
- `markdownlint` MD053 ist für Foliendateien bereits deaktiviert (gilt auch für
  `detail`).

### 4.4 Beispiel-Struktur

```text
project/
  slides/
    01-intro.md        # multiLevel: true, aspect …
    02-ddd.md          # enthält [detail: ../details/ddd/]: #
    03-ausblick.md
  details/
    ddd/
      01-was.md        # ggf. selbst [detail: aggregate.md]: #
      02-bausteine.md
      03-beispiel.md
      aggregate.md
```

## 5. Navigationsmodell

Zustand = **Index-Pfad** (§2) + **stepIndex** (Fragment-Schritt der aktuellen
Folie). Beispiel: Pfad `[2, 0]`, Step `1`.

| Taste                 | Aktion                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `→` / `Space` / `PageDown` | Nächstes Fragment; sonst nächste Folie **im aktuellen Pfad**. Am Pfad-Ende eines Detail-Pfads: **Auto-Rückkehr** (§5.1). |
| `←` / `PageUp`        | Vorheriges Fragment; sonst vorherige Folie im aktuellen Pfad (voll enthüllt). Am Pfad-Anfang eines Detail-Pfads: zurück zur Eltern-Folie (§5.2). |
| `↓` (Runter)          | Betritt den Detail-Pfad der aktuellen Folie (falls vorhanden), Position `[…, 0]`, Step 0. Sonst: keine Aktion.           |
| `↑` (Hoch)            | Verlässt den aktuellen Detail-Pfad → zurück zur Eltern-Folie (§5.3). Auf Trunk-Ebene: keine Aktion.                      |
| `Home` / `End`        | Erste / letzte Folie **des Trunk** (springt auf Ebene 0).                                                                |

### 5.1 Auto-Rückkehr (Rechts am Detail-Pfad-Ende)

Rechts auf der letzten Folie eines Detail-Pfads (und letztem Fragment) springt
zur **nächsten Folie der Eltern-Ebene** — also dorthin, wo der Hauptvortrag nach
der abzweigenden Folie weitergeht. Ist die Eltern-Folie selbst die letzte ihres
Pfads, greift dieselbe Regel rekursiv (ggf. bis zum Deck-Ende → `isLast`).

### 5.2 Links am Detail-Pfad-Anfang

Symmetrisch: Links auf der ersten Folie eines Detail-Pfads (Step 0) kehrt zur
**Eltern-Folie** zurück (voll enthüllt), sodass man rückwärts sauber aus dem
Detail-Pfad herausläuft.

### 5.3 Hoch (Details verlassen)

`↑` kehrt zur Eltern-Folie zurück. Offene Detailentscheidung: Auf welchem
Fragment-Stand landet die Eltern-Folie?

> Entscheidung: Die Eltern-Folie wird auf dem Step wiederhergestellt, den sie
> beim Abbiegen (`↓`) hatte. Dazu merkt sich der Navigator pro Ebene den
> Rückkehr-Step. Fallback: voll enthüllt.

### 5.4 Zusammenspiel mit Fragmenten

- `↓`/`↑` sind ausschließlich für Ebenenwechsel; sie verändern nie den
  Fragment-Stand der aktuellen Folie (Abzweigen nur von der ganzen Folie —
  Rückfrage 4).
- `←`/`→` verhalten sich innerhalb eines Pfads wie die heutige
  `next()`/`previous()`-Logik (erst Fragmente, dann Folienwechsel).

## 6. Datenmodell & Loader

### 6.1 `@mapre/core` (rein, DOM-/FS-frei)

- **Kein** neues Parsing für `detail` nötig (generisches Metadatum).
- Neuer Baum-Typ, z. B.:

  ```ts
  interface DeckNode {
    slide: Slide;              // die gerenderte Folie
    detail?: DeckBranch;       // optionaler Kind-Pfad
  }
  interface DeckBranch {
    nodes: DeckNode[];
  }
  interface DeckTree {
    metadata: DeckMetadata;    // inkl. multiLevel, aspect …
    root: DeckBranch;          // der Trunk
  }
  ```

- Baum-Aufbau aus bereits geladenen Markdown-Segmenten: `buildDeckTree(segments)`
  o. Ä. (pure), damit sowohl Node-Loader als auch die Browser-Runtime denselben
  Baum erzeugen. Der Loader liefert die *rohen* Segment-Markdowns samt
  Eltern-Beziehung; der Baumbau ordnet sie den Folien zu (per `detail`-Direktive).
- Alternativ pragmatisch: `Slide` bekommt ein optionales Feld
  `detailKey?: string` (Auflösungsschlüssel), und der Baum wird über eine flache
  Segment-Map (`Record<key, string markdown>`) rekonstruiert. Genaue Aufteilung
  in der Umsetzung festzurren (§13).

### 6.2 `@mapre/node` (Filesystem)

- Neuer Loader `loadDeckTreeSource(projectDir, opts)`, der:
  1. den Trunk wie bisher lädt (`loadDeckSource`),
  2. jede Folie auf `[detail: …]: #` prüft,
  3. den referenzierten Pfad relativ zur Segment-Basis auflöst (§4.2),
  4. Datei **oder** Ordner lädt (Ordner = `loadDeckSource`-Semantik),
  5. rekursiv weiter auflöst (mit Zyklen-/Fehlerprüfung, §4.3),
  6. eine **einbettbare Struktur** liefert: eine Liste/Map aller Segment-Markdowns
     mit stabilen Schlüsseln und Eltern-Zuordnung.
- **Resources**: In Detail-Ordnern referenzierte Bilder müssen weiterhin
  funktionieren. Bestehende Regel (`resources/` wird nach `dirname(outFile)`
  kopiert) beibehalten; Detail-Segmente referenzieren Assets dokument-relativ
  wie bisher. Ggf. zusätzliche Detail-`resources/` mitkopieren (offener Punkt,
  §12).

### 6.3 Single-File / Runtime-Embedding

- Heute bettet der Build **einen** Markdown-String ein; die Browser-Runtime
  parst ihn (`parseDeck` + `renderSlide`).
- Neu: Der Build bettet die **komplette Segment-Struktur** als JSON ein (alle
  Trunk- und Detail-Markdowns, aufgelöst zur Build-Zeit). Der Browser kann kein
  Filesystem lesen (v. a. unter `file://`), deshalb **muss** die gesamte
  Auflösung zur Build-/Load-Zeit passieren.
- Die Browser-Runtime baut daraus per `buildDeckTree` denselben Baum wie der
  Node-Loader.

## 7. Runtime-Änderungen

### 7.1 Baum-Navigation

- Neue, pure `TreeNavigation` (analog `packages/runtime/src/core/navigation.ts`,
  eigenständig getestet), die den Index-Pfad + Step hält und `next`, `previous`,
  `enterDetail` (↓), `exitDetail` (↑), `goToPath` (Sync/Deep-Link), `first`,
  `last`, `isFirst`, `isLast` implementiert — inklusive Auto-Rückkehr (§5.1) und
  Rückkehr-Step-Merken (§5.3).
- Die bestehende flache `Navigation` bleibt für den Fall „Flag aus“ nutzbar, oder
  `TreeNavigation` degeneriert bei reinem Trunk exakt zum heutigen Verhalten.

### 7.2 Controller

- `createController` baut aus `DeckTree` statt aus flachem `Deck`.
- `render(...)` adressiert Folien künftig über den Index-Pfad statt eines
  einzelnen `slideIndex`.
- Tastatur: `↓`/`↑` ergänzen (`keyToMove` erweitern; `ArrowDown`→`enterDetail`,
  `ArrowUp`→`exitDetail`). `Home`/`End` springen auf Trunk-Ebene.
- `goToSlide`/Overview-Sprünge werden zu `goToPath(indexPath)`.

### 7.3 Deep-Linking (Hash)

- Der Hash muss den Index-Pfad kodieren, z. B. `#/2/0/1@3`
  (Pfad `2/0/1`, Step `3`). Rolle/Kanal bleiben wie bisher (`#presenter`,
  `#presentation/en`) und werden mit dem Pfad kombiniert.
- Wiederaufnahme nach Reload wie in [`runtime.spec.md`](runtime.spec.md) §8,
  nur mit Pfad statt Index.

### 7.4 Sync

- `SyncMessage` trägt künftig `path: number[]` (Index-Pfad) statt bzw. zusätzlich
  zu `slideIndex`. `snapshot()` und `goTo`→`goToPath` entsprechend anpassen.
- Alle angeschlossenen Presentation Windows folgen weiterhin synchron
  (kanalübergreifend, §5 runtime.spec).
- Rückwärtskompatibilität innerhalb einer Session unkritisch (alle Fenster teilen
  dasselbe Single-File-Dokument, also dieselbe Nachrichten-Version).

## 8. Overview als „Git-Tree von links nach rechts“

Erweiterung der bestehenden `mountOverview` (`src/browser/overview.ts`).

### 8.1 Darstellung

- **Trunk** läuft horizontal in **Zeile 0** (Lane 0), links → rechts.
- Ein **Detail-Pfad** bekommt eine eigene **Lane** darunter und läuft ebenfalls
  horizontal, beginnend unter/rechts seiner Eltern-Folie.
- **Verschachtelte** Detail-Pfade bekommen jeweils eine weitere Lane darunter.
- **Verbinder**: Von jeder abzweigenden Folie führt eine Elbow-Linie (runter,
  dann rechts) zur ersten Folie ihres Detail-Pfads — wie ein `git log --graph`,
  nur um 90° gedreht.

```text
Lane 0:  [1]───[2]───[3]───[4]
                │
Lane 1:         └─[2.1]───[2.2]───[2.3]
                            │
Lane 2:                     └─[2.2.1]───[2.2.2]
```

### 8.2 Layout-Algorithmus (Skizze)

- Tiefensuche über den Baum; jede Folie erhält `(lane, column)`:
  - Trunk-Folien: `lane = 0`, `column = fortlaufend`.
  - Beim Betreten eines Detail-Pfads: `lane = nächste freie Lane` (Zähler),
    `column` startet bei `column(Eltern) + 1` und läuft weiter.
- Umsetzung per CSS-Grid mit expliziten `grid-row` (Lane) / `grid-column`
  (Spalte); Verbinder als absolut positionierte Linien oder als
  Pseudo-Elemente/SVG-Overlay.
- Jede Node ist ein klickbares Thumbnail (`controller.render(path, fullFragments,
  channel)`); Klick → `goToPath(...)` → schließt Overview, synchronisiert alle
  Fenster (wie heute bei `goToSlide`).
- Aktuelle Position hervorgehoben (`.is-current`), aktualisiert via
  `controller.onChange`.

### 8.3 Interaktion

- Toggle-Buttons wie bisher (`#overview` / `#pv-overview`), `Escape` schließt.
  Offener `O`-Shortcut aus runtime.spec §3 kann hier gleich mitgeplant werden.
- Horizontales/vertikales Scrollen für große Bäume; Trunk-Lane bleibt bevorzugt
  sichtbar.

## 9. Rendering & Seitennummern

- `renderSlide` bleibt unverändert (arbeitet auf einer einzelnen `Slide`).
- Template-Variablen `pageNumber`/`slideCount` sind mehrdeutig, sobald es Ebenen
  gibt.

> Entscheidung: **Hierarchische Nummerierung** — Trunk-Folien `1, 2, 3`;
> Detail-Folien `2.1, 2.2`; verschachtelt `2.2.1`. `slideCount` bleibt die Anzahl
> der **Trunk**-Folien (Hauptvortrags-Länge); Detail-Folien zeigen ihre
> hierarchische Nummer. Genaues Format in der Umsetzung finalisieren.

## 10. Print / PDF-Export

- Export erfolgt in **Tiefensuche-Reihenfolge**: Trunk-Folie, danach ihr
  kompletter Detail-Pfad (rekursiv), dann die nächste Trunk-Folie usw. — die
  natürliche „ausgeklappte“ Lesereihenfolge.
- Bei ausgeschaltetem Flag: nur der Trunk (wie heute).
- `buildPrintHtml` / `listDeckChannels` müssen den Baum ablaufen statt einer
  flachen Liste. Seitennummern hierarchisch (§9).

## 11. Deploy-Varianten

Keine Abweichung von [`runtime.spec.md`](runtime.spec.md) §7: rein clientseitig,
alle Segmente zur Build-Zeit eingebettet. Insbesondere `file://` funktioniert,
weil **kein** Nachladen von Detail-Dateien zur Laufzeit stattfindet.

## 12. Offene Punkte

- Genaue Paket-/Modul-Aufteilung des Baum-Modells (`@mapre/core` vs. Runtime) und
  Signatur von `buildDeckTree` (§6.1).
- Detail-eigene `resources/`-Ordner: mitkopieren oder nur das Projekt-`resources/`
  nutzen? (§6.2)
- Endgültiges Format der hierarchischen Seitennummer und `slideCount`-Semantik
  (§9).
- Verhalten von `Home`/`End` in tiefen Pfaden (aktuell: Sprung auf Trunk-Ebene).
- Overview: SVG-Verbinder vs. CSS-Pseudo-Elemente; Scroll-/Zoom-Verhalten bei
  sehr breiten/tiefen Bäumen (§8).
- Optionaler `O`-Shortcut für die Overview (aus runtime.spec offen).
- Soll die Presenter-Ansicht (nächste Folie / Fortschritt) den Ebenenwechsel
  besonders anzeigen (z. B. „→ Detail“ / „↑ zurück“)? (Nice-to-have)

## 13. Umsetzungsschritte (Vorschlag, testgetrieben)

1. **Core-Modell**: `DeckTree`/`DeckNode`/`DeckBranch` + `buildDeckTree` aus
   Segment-Map; Unit-Tests (inkl. Verschachtelung, fehlende/zyklische Referenz).
2. **Node-Loader**: `loadDeckTreeSource` (rekursive Auflösung Datei/Ordner,
   relative Basis, Zyklen-Guard); Unit-Tests mit Fixture-Ordnern.
3. **TreeNavigation** (runtime/core): next/prev/enter/exit/goToPath +
   Auto-Rückkehr + Rückkehr-Step; umfangreiche Unit-Tests (Kanten: Pfad-Anfang/
   -Ende, verschachtelt, Flag aus).
4. **Embedding/Build**: Segment-JSON statt Einzel-String einbetten; Browser baut
   `buildDeckTree`.
5. **Controller**: auf Baum umstellen, `↓`/`↑` Tasten, `goToPath`, Hash-Format,
   Sync-`path`.
6. **Overview-Tree**: Layout (Lanes/Spalten) + Verbinder + Klick-Navigation.
7. **Print/PDF**: Tiefensuche-Reihenfolge + hierarchische Nummern.
8. **Beispielprojekt** unter `spec/examples/multi-level/` (Trunk + verschachtelte
   Details) und README.
9. **Doku**: `runtime.spec.md` referenziert dieses Feature; README-Hinweis.

## 14. Testplan (Kurz)

- Core: Baumbau, Fehlerfälle, Zyklen.
- Node: Datei- vs. Ordner-Detail, relative Auflösung, verschachtelt.
- TreeNavigation: alle Tasten × alle Kanten (Anfang/Ende/verschachtelt/Flag aus),
  Auto-Rückkehr, Rückkehr-Step.
- Browser (headless, wie bisher, `python3 -m http.server`): Abbiegen/Zurück,
  Sync über Fenster, Overview-Baum klickbar, Deep-Link-Hash.
