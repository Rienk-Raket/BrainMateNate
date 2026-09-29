# FutureMe: Spatial Experience
## UX/UI-specificatie v4.0: de ruimtelijke laag zoals hij gebouwd is

> **Doel:** FutureMe voelt als één samenhangende digitale ruimte. Kaarten openen zich tot
> het scherm erachter, data bouwt zich zichtbaar op, en de achtergrond leeft mee met je
> dag. Dat gebeurt zonder in te leveren op leesbaarheid, voorspelbaarheid,
> toegankelijkheid of snelheid.
>
> | | |
> |---|---|
> | **Versie** | 4.0 (26-09-2026) |
> | **Status** | Gebouwd en getest (zie §13) |
> | **Vervangt** | v3.0 ([`bron/`](bron/futureme-spatial-ux-ui-specificatie-v3.md)) en de ruimtelijke laag van `docs/ruimtelijke-interface-prompt.md` |
> | **Totstandkoming** | Drie toetsrondes door een expertpanel ([verslag](expertpanel-3-rondes.md)) |
> | **Prompt** | [`../prompts/futureme-spatial-uberprompt.md`](../prompts/futureme-spatial-uberprompt.md) |
> | **In de app** | Meer → App → **Ontwerp** (levende samenvatting van dit document) |

---

## Leeswijzer

| Je bent… | Lees eerst |
|---|---|
| Ontwikkelaar die iets wijzigt | §2 Kader, §3 Architectuur, §13 Acceptatie |
| Ontwerper | §1 Visie, §4 Tokens, §6 Componenten, §7 Beweging |
| Toegankelijkheid of QA | §10 Toegankelijkheid, §11 Performance, §13 Testplan |
| Iemand die een AI-model laat bouwen | De [uber-prompt](../prompts/futureme-spatial-uberprompt.md); die verwijst terug naar dit document |

## Inhoud

1. [Visie en principes](#1-visie-en-principes)
2. [Kader: hoe FutureMe werkt](#2-kader-hoe-futureme-werkt)
3. [Architectuur van de laag](#3-architectuur-van-de-laag)
4. [Design tokens](#4-design-tokens)
5. [Lagen en diepte](#5-lagen-en-diepte)
6. [Componenten](#6-componenten)
7. [Beweging](#7-beweging)
8. [Levende data](#8-levende-data)
9. [Integraties en koppelingen](#9-integraties-en-koppelingen)
10. [Toegankelijkheid (WCAG 2.2 AA)](#10-toegankelijkheid-wcag-22-aa)
11. [Performance](#11-performance)
12. [Ontwerp-scherm in de app](#12-ontwerp-scherm-in-de-app)
13. [Acceptatiecriteria en testplan](#13-acceptatiecriteria-en-testplan)
14. [Backlog](#14-backlog)
15. [Probleemoplossing](#15-probleemoplossing)
16. [Bijlage A: van v3 naar v4](#bijlage-a-van-v3-naar-v4)

---

## 1. Visie en principes

> FutureMe moet aanvoelen als **één samenhangende ruimte**, niet als een verzameling
> losse schermen. Je gaat dieper in informatie; kaarten veranderen logisch in hun
> detail, de achtergrond reageert op je dag, en een getal laat zien waar het vandaan komt.

| # | Principe | Wat het betekent in de praktijk |
|---|---|---|
| 1 | **Eén ruimte** | Een detailscherm groeit uit de aangetikte kaart en krimpt bij *terug* naar precies die kaart. Bladen komen uit de diepte; de app wijkt naar achteren. |
| 2 | **Beweging met oorsprong** | Elke animatie heeft een aanwijsbare oorzaak en bestemming: kaart → scherm, tab → tab, vinkje → lichtexplosie, 0 → waarde. |
| 3 | **Data die leeft** | Cijfers tellen op, ringen vullen zich, lijnen tekenen zich, de Dagring bouwt zich op. |
| 4 | **Rust wint** | Leesbaarheid, voorspelbaarheid en toegankelijkheid gaan voor effect. *Rustig* en *Uit* zijn volwaardige standen, geen noodoplossing. |
| 5 | **Lokaal en privé** | Geen externe bronnen, geen analytics, geen server. Alles blijft op het toestel. |

**Vergelijking**

| Gewone app | FutureMe Spatial v4 |
|---|---|
| Harde wissel tussen schermen | Kaart groeit uit tot scherm, terug krimpt naar de kaart |
| Statische getallen | Getallen tellen op; bij een wijziging vloeien ze van oud naar nieuw |
| Vaste achtergrond | Aurora kleurt per dagdeel en groeit mee met je voortgang |
| Menubalk | Zwevend glazen eiland met een lichtspoor dat van tab naar tab glijdt |
| Eén bewegingsstand | Vol / Rustig / Uit plus automatisch terugschakelen bij haperen |

---

## 2. Kader: hoe FutureMe werkt

Deze eigenschappen van de app bepalen wat wel en niet kan. v3 ging uit van een
andere architectuur; v4 volgt de echte app.

| Eigenschap | Gevolg voor de laag |
|---|---|
| Eén bestand `index.html` (~1,8 MB), vanilla JS, geen externe bronnen | Alles inline. Geen fonts, libraries of CDN's van buiten. |
| Gebouwd door `ruimtelijk/bouw.py` uit `basis/index.html` + `ruimtelijk/src/*` | Wijzigingen gaan in `src/`, nooit met de hand in `index.html` |
| Rendermodel: `teken()` vervangt `#scherm.innerHTML`; `ga(view, param)` en `terug()` navigeren; `bladOpen()` opent een bottom sheet | Overgangen gaan **om** dit model heen: kloon van het oude scherm, animatie, opruimen. Views worden niet herschreven. `teken()` blijft synchroon. |
| Data in IndexedDB, in het geheugen als `S` (`S.taken`, `S.afspraken`, `S.gebeurtenissen`, …) | De laag **leest** alleen uit `S`. Geen eigen state, geen mock-API's. |
| Zes tabs: Vandaag, Komend, **+** (Vastleggen), Afspraken, Mindmap, Meer | Het lichtspoor slaat de "+" over. De mindmap (canvas) krijgt geen schermkloon. |
| Instellingen: thema, tekstgrootte, dichtheid, contrast, **prikkelarme modus**, trillen | De ruimtelijke laag is een eigen instelling en gaat automatisch uit bij prikkelarm en `prefers-reduced-motion` |
| PWA voor iPhone (Safari) en Android/desktop | Doeltoestel: iPhone uit 2020 op 60 fps. `-webkit-`-prefixen. `backdrop-filter` spaarzaam. |

**Bewust geschrapt uit v3** (onderbouwing in [bijlage A](#bijlage-a-van-v3-naar-v4)):
- `user-scalable=no`;
- analytics;
- `.layer`/`.page`-structuur;
- mock-API-namespace;
- DOM-mindmap met willekeurige posities;
- `body{overflow:hidden}`;
- de 150 KB-appbudgetregel;
- ononderbouwde percentages.

---

## 3. Architectuur van de laag

### 3.1 Bestanden

| Bestand | Inhoud |
|---|---|
| `ruimtelijk/src/ruimte.css` | Tokens, aurora, glas, eiland-onderbalk, knoppen, tabs, schakelaar, vinkje, bladen, toast, pincode, overgangen, tabellen |
| `ruimtelijk/src/ruimte.js` | Instellingen, bewegingsniveaus, adaptief budget, aanraking en gloed, navigatie-wrappers, overgangen, data-animaties, lichtspoor, pincode, parallax |
| `ruimtelijk/src/ruimte-data.js` / `.css` | Energie-aurora, app-badge, **Dagring**, **Ritmekaart** |
| `ruimtelijk/src/ontwerp.js` / `.css` | **Ontwerp-scherm** (levend ontwerpsysteem) |
| `ruimtelijk/bouw.py` | Voegt alles in de juiste volgorde samen tot `index.html` |

Na elke wijziging: `python3 ruimtelijk/bouw.py`.

### 3.2 Inpakken, niet vervangen

De laag vervangt geen bestaande functie. Hij pakt er vijf in en roept altijd het origineel aan:

| Functie | Wat de wrapper toevoegt |
|---|---|
| `ga(view, param, terugStap)` | Bepaalt het soort overgang (vooruit / terug / tab / zacht) en onthoudt de aangetikte kaart |
| `terug()` | Haalt de oorsprong-rechthoek van de stapel, zodat het detail terugkrimpt naar die kaart |
| `teken()` | Kloont het oude scherm, tekent, draait de `RT_NA`-hooks, animeert, meet fps |
| `toast()` | Laat fouten trillen met een rode gloed |
| `pasInstellingenToe()` / `vwInstellingen()` | Zet `data-ruimte` en `data-beweging` en voegt de instellingen toe |

### 3.3 Publiek contract (andere modules rekenen hierop)

| Naam | Type | Gebruikt door | Betekenis |
|---|---|---|---|
| `RT_NA` | array van functies | koppelingen, huishouden, fin-vast, retro, sh-ideeën, wishlist, hobbyskills, … | Hooks die na **elke** tekening draaien, ook met de laag uit |
| `rtAan()` | functie → bool | incasso-bellen, mm-export, sh-scrum, wishlist | Laag aan én geen `prefers-reduced-motion` |
| `rtVol()` | functie → bool | nieuw in v4 | Aan én beweging "vol" én budget niet "licht" |
| `rtStil()` | functie → bool | incasso-bellen | Toestel vraagt om minder beweging |
| `rtBurst(x, y, kleur?)` | functie | mm-export, hobbyskills, sh-scrum, wishlist | Lichtexplosie (alleen bij `rtVol()`) |
| `rtDuur(ms)` | functie → ms | nieuw in v4 | Duur die meeschaalt met het bewegingsniveau |
| `.rt-fout` | CSS-klasse | hobbyskills, wishlist, sh-ideeën | Invoerveld trilt rood |
| `--rt-veer`, `--rt-ease`, … | CSS-aliassen | hobbyskills.css | Verwijzen naar de nieuwe `--fm-*`-tokens |
| `FM_RUIMTE` | object | Ontwerp-scherm | `versie`, gemeten `fps`, budgetstatus |

### 3.4 Toestand op `<html>`

| Attribuut | Waarden | Gezet door |
|---|---|---|
| `data-ruimte` | `1` / `0` | Instelling *Ruimtelijke interface* (uit bij prikkelarm) |
| `data-beweging` | `vol` / `rustig` | Instelling *Beweging* |
| `data-budget` | `licht` / (leeg) | Adaptief budget (§7.5) |
| `data-dagdeel` | `ochtend` / `middag` / `avond` / `nacht` | Klok, elke 5 minuten |
| `data-blad` | `1` / `0` | Bottom sheet open |
| `data-verborgen` | `1` / `0` | Tabblad onzichtbaar (aurora pauzeert) |

"Uit" is `data-ruimte="0"` óf `prefers-reduced-motion: reduce`. In dat laatste geval zet
de basisstijl ook alle animaties en overgangen uit.

---

## 4. Design tokens

Alle tokens staan op `html[data-ruimte="1"]` en bouwen voort op de bestaande
themakleuren (`--accent`, `--green`, `--purple`, `--card`, `--bg`, …). Licht en donker
zijn daarmee automatisch geregeld.

### 4.1 Glas en schaduw

| Token | Licht | Donker | Gebruik |
|---|---|---|---|
| `--fm-glas` | `color-mix(--card 74%, transparent)` | idem | Kaarten, tegels, menukaarten |
| `--fm-glas-sterk` | `color-mix(--card 86%, transparent)` | idem | Tabelkop; kaarten in budget "licht" |
| `--fm-rand` | `rgba(255,255,255,.62)` | `rgba(255,255,255,.08)` | 1 px binnenrand |
| `--fm-glans` | `rgba(255,255,255,.85)` | `rgba(255,255,255,.12)` | Glanslijn bovenrand |
| `--fm-spec` | `rgba(255,255,255,.55)` | `rgba(255,255,255,.16)` | Glanslicht dat de aanwijzer volgt |
| `--fm-schaduw` / `-diep` | zacht / diep | donkerder | Kaarten / eiland |
| `--fm-gloed` | accent 38% | idem | Focusring, actieve tab, oorsprong |

### 4.2 Aurora

| Token | Standaard | Betekenis |
|---|---|---|
| `--fm-a1…a4` | accent, paars, groen, cyaan | Kleur van de vier velden; per dagdeel overschreven (§5.2) |
| `--fm-blob` | `.2` licht / `.3` donker | Basisdekking van de velden |
| `--fm-energie` | `0 … 1` | Deel van de taken van vandaag dat af is; laat het groene veld groeien |

### 4.3 Beweging

| Token | Waarde | Waarvoor |
|---|---|---|
| `--fm-ease` | `cubic-bezier(.22,1,.36,1)` | Standaardcurve: snel weg, zacht aankomen |
| `--fm-veer` | `linear(…)` gedempte veer, ζ ≈ 0,55, ~12% overshoot | Indrukken, tabs, vinkjes, schakelaar |
| `--fm-veer-zacht` | `linear(…)` ζ ≈ 0,78, ~2% overshoot | Bladen, onthullen, Dagring, dieptekaart |
| `--fm-d-druk` | 180 ms | Indrukken |
| `--fm-d-tab` | 420 ms (rustig 220) | Tabwissel |
| `--fm-d-scherm` | 460 ms (rustig 240) | Kaart → scherm |
| `--fm-d-lijst` | 500 ms (rustig 260) | Opkomen van lijsten |
| `--fm-d-data` | 900 ms (rustig 400) | Ringen, grafieken |

Waar `linear()` niet wordt ondersteund, valt `--fm-veer` via `@supports` terug op
`cubic-bezier(.2,.9,.25,1.25)`. De veercurve is berekend als staprespons van een
gedempte oscillator (26 samples) en staat letterlijk in `ruimte.css`.

### 4.4 Diepte en maat

| Token | Waarde |
|---|---|
| `--fm-z-achter` / `-inhoud` / `-nav` / `-blad` / `-focus` | 0 / 1 / 40 / 60 / 200 |
| `--fm-nav-onder` | `max(10px, safe-area-bottom − 4px)` |
| `--navh` | `58px + --fm-nav-onder + 6px`. Alle bestaande "boven de onderbalk"-elementen (toast, timerbalk, bulkbalk, scrollruimte) schuiven automatisch mee. |

---

## 5. Lagen en diepte

### 5.1 Dieptekaart

| Laag | z | Onderdelen | Beweging |
|---|---|---|---|
| **Focus** | 200 | Pincode (`#slot`) | Glazen toetsen; fout = rode trilling; ontgrendelen = app komt uit de diepte |
| **Blad** | 60 | `.blad` + `.overlay` | Veert omhoog; velden staggeren 40 ms; `#app` schaalt naar .965 met 5 px blur |
| **Navigatie** | 40 | `header#top`, zwevende `nav#tabs` | Glas met sterke blur; lichtspoor onder de actieve tab |
| **Kaarten** | 1 | `.card`, `.stat`, `.dagpaneel`, `.menu-kaart` | Glas; indrukken met veer; kantelen en glanslicht (muis/pen) |
| **Inhoud** | 1 | `#scherm` | Overgangen, onthullen bij scrollen, kaarten die onder de kop wegdeinzen |
| **Achtergrond** | 0 | `#rt-achtergrond` (4 velden + korrel) | Drijft 46–64 s per cyclus; parallax bij scrollen en kantelen |

### 5.2 Aurora

- Vier radiale velden van `74vmax`, alleen `transform` geanimeerd, plus een statische
  korrellaag (SVG-ruis, 5% dekking) tegen kleurbanden.
- **Dagdeel:**

  | Dagdeel | Tijd | Kleuren |
  |---|---|---|
  | Ochtend | 6–12 | amber, accent, roze |
  | Middag | 12–18 | accent, paars, cyaan |
  | Avond | 18–23 | oranje, paars, magenta |
  | Nacht | 23–6 | indigo, diep-indigo, hemelsblauw; lagere dekking |

- **Energie:** dekking van het groene veld = `blob × (0,45 + energie × 1,1)`. Wie de dag
  afrondt, ziet de ruimte groener worden.
- Pauzeert bij *Rustig*, bij budget *licht* en als het tabblad verborgen is.

### 5.3 Wijken bij scrollen

Kaarten die onder de glazen kop verdwijnen, schalen tot 94% en vervagen tot 55%
dekking. Alleen `transform` en `opacity`, en pas als de onderkant bijna uit beeld is,
zodat hoge kaarten leesbaar blijven. De aurora verschuift 5% van de scrollafstand
(alleen bij *Vol*).

---

## 6. Componenten

### 6.1 Glazen panelen
`.card`, `.stat`, `.dagpaneel` en `.menu-kaart` via `:where()`, zodat gekleurde
varianten (`.card.rood` e.d.) blijven winnen. Het glas bestaat uit:
- `backdrop-filter: blur(14px) saturate(150%)`;
- een glanslijn aan de bovenrand;
- een 1 px binnenrand;
- een zachte schaduw.

**Alleen muis/pen:** een glanslicht volgt de aanwijzer (`--mx/--my`, geanimeerd via
`@property --fm-hover`). Kaarten tot 260 px hoog kantelen maximaal 4° richting de
aanwijzer. Bij indrukken vervalt de kanteling.

### 6.2 Knoppen

| Element | Gedrag |
|---|---|
| `.knop`, `.icon-btn`, `.chip`, `.keuze`, `.segment button`, cijfertoetsen | Indrukken `scale(.94)` in 180 ms, loslaten veert terug met `--fm-veer` |
| `.rijknop`, `.menu-kaart`, `.hs-kaart` | `scale(.985)` |
| `.stat`, `.dp-stat`, `.wk-tegel` | `scale(.97)` |
| Alle bovenstaande | Lichtgloed vanuit het aanraakpunt (620 ms, geclipt op de vorm) |
| `.knop.primair`, `.tab-plus` | Accentverloop met accentschaduw |
| `.knop3d` (Vastleggen) | Behoudt de eigen 3D-druk; een lichtveeg glijdt over het paneel |
| Focus (toetsenbord) | 2 px accentrand + 6 px gloedring (`:focus-visible`) |

### 6.3 Zwevende onderbalk (eiland)
- `nav#tabs` zweeft `--fm-nav-onder` boven de rand, maximaal 560 px breed en gecentreerd.
- Radius 26 px, glas met blur 24 px, binnenglans en diepe schaduw.
- Achter het eiland ligt een verloop naar de achtergrondkleur, zodat tekst niet door de naden leest.
- De "+" blijft verhoogd. De ring eromheen is halftransparant.
- **Lichtspoor:** 3 px accentlijn onder de actieve tab. Bij een wissel rekt hij zich uit tot hij beide tabs overspant en trekt dan samen naar de nieuwe (480 ms, als één lint).

### 6.4 Schakelaar, vinkje, bladen, toast
- **Schakelaar:** de knop rekt uit bij indrukken, veert naar de nieuwe stand en gloeit groen als hij aan staat.
- **Vinkje:** het vinkje wordt als penseelstreek getekend (`stroke-dashoffset`) en de cirkel veert op. Bij afronden volgt een lichtexplosie: een ring en 10 deeltjes, in de kleur van het onderdeel.
- **Blad:** komt uit de diepte met `--fm-veer-zacht`. Het element dat het blad opende blijft licht omlijnd (oorsprong).
- **Toast:** komt uit de diepte (schaal plus blur naar scherp). Een fouttoast trilt en krijgt een rode gloed. Herkend aan tekst als "mislukt", "ongeldig", "vul eerst…".

### 6.5 Pincode (focuslaag)
- `#slot` is glas met blur 30 px boven de aurora. De toetsen zijn glazen druppels.
- **Invoer:** elk bolletje veert op en gloeit.
- **Foute code** ("Onjuiste code" / "Codes verschillen"): de bolletjes trillen rood en de tekst kleurt rood.
- **Ontgrendelen:** de app komt uit de diepte naar voren (schaal .94 → 1, blur 10 → 0, 520 ms).

### 6.6 Tabellen
Voor elke `table` in `#scherm`:
- een glazen, vaste kop (`position: sticky`);
- tabulaire cijfers;
- een rij die oplicht bij hover of focus (accent 8%).

### 6.7 Verder naar
Elk scherm eindigt met 2–4 verwante schermen. Het Ontwerp-scherm is opgenomen:
Instellingen → Ontwerp, en Ontwerp → Instellingen / Terugblik / Vandaag.

---

## 7. Beweging

### 7.1 Overgangscatalogus

| Soort | Wanneer | Oud scherm | Nieuw scherm | Duur |
|---|---|---|---|---|
| **Vooruit** | `ga()` naar een dieper scherm | Zakt weg (scale .94, blur 8 px, fade) | Onthult zich met `clip-path: inset()` vanuit de aangetikte kaart; een lichtgevende "oorsprong-geest" groeit mee | 380 / 460 ms |
| **Terug** | `terug()` | Krimpt terug naar de kaart waaruit het kwam | Komt uit de diepte (scale .94 → 1) | 400 / 440 ms |
| **Tab** | Tabwissel | Schuift weg tegen de tabrichting in | Schuift in vanuit de tabrichting | 340 / 420 ms |
| **Zacht** | Zelfde view, andere parameter | Fade | Kort omhoog | 240 / 300 ms |
| **Geen** | Hertekenen zonder navigatie (afvinken, filter) | – | Alleen data-effecten (§8) | – |
| **Rustig** (alle soorten) | Beweging *Rustig* | Fade 200 ms | Fade 240 ms | – |

De koptitel wisselt met een korte opkomst (360 ms). De mindmap krijgt geen kloon.
Overgangen blokkeren niets: het nieuwe scherm is direct bedienbaar en de kloon is
`inert`.

**Waarom geen View Transitions API?** `document.startViewTransition()` werkt de DOM
asynchroon bij. FutureMe-code verwacht dat `teken()` synchroon is (`ga(); scrollTop = 0`
en tientallen vergelijkbare aanroepen). De WAAPI-kloon geeft hetzelfde beeld zonder dat
contract te breken. Zie §14.

### 7.2 Na het tekenen

| Effect | Wanneer | Detail |
|---|---|---|
| Stagger | Na navigatie | Kinderen van `#scherm` 32 ms na elkaar; rijen in kaarten 24 ms |
| Onthullen bij scrollen | Blokken onder de vouw | Wachten onzichtbaar (`opacity 0`, 22 px lager) tot ze in beeld komen, en komen dan op met `--fm-veer-zacht`. Eenmalig per render. Alleen bij *Vol*. |
| Nieuwe regel | Hertekenen met nieuwe taken (≤ 6) | Lichtpuls van 1,3 s |

### 7.3 Aanraking en aanwijzer
- **Lichtgloed** vanuit het aanraakpunt op alle knoppen (§6.2).
- **Parallax:** de aurora beweegt tot 14 px mee met kantelen (Android automatisch, iOS
  na toestemming via Instellingen) of met de muis op desktop. Alleen bij *Vol*.
- **Kantelen en glanslicht** op kaarten, alleen met muis/pen (§6.1).

### 7.4 Bewegingsniveaus

| Niveau | Hoe | Wat blijft | Wat vervalt |
|---|---|---|---|
| **Vol** | Standaard | Alles | – |
| **Rustig** | Instellingen → Beweging → Rustig | Glas, kruisvervaging, ringen en grafieken (korter), lichtspoor | Veren, schaal/blur in overgangen, oorsprong-geest, deeltjes, kantelen, parallax, optellende getallen, onthullen bij scrollen, drijvende aurora |
| **Uit** | Ruimtelijke interface uit, prikkelarme modus, of toestel met "beweging verminderen" | Basis-app | Hele laag (bij `prefers-reduced-motion` ook alle basisanimaties) |

### 7.5 Adaptief bewegingsbudget
- Tijdens elke overgang telt de laag frames (420 ms).
- Zijn 3 van de laatste 5 metingen onder 40 fps, dan wordt `data-budget="licht"` gezet
  voor de rest van de sessie:
  - geen glasvervaging op kaarten (wel sterkere tint);
  - aurora stil;
  - geen kantelen, deeltjes of optellen;
  - overgangen zoals bij *Rustig*.
- De gebruiker krijgt één melding: *"Beweging vereenvoudigd zodat alles soepel blijft"*.
- Dit vangt ook iOS-energiebesparing op, die animaties op 30 fps zet.
- De gemeten waarden staan op het Ontwerp-scherm.

---

## 8. Levende data

### 8.1 Bestaande elementen

| Element | Effect |
|---|---|
| `.stat .getal`, `.dp-stat > b`, `.bal3d`, `.ring > span`, `.hs-getal`, `[data-fm-tel]` | Tellen op van 0 (700 ms, ease-out) met Nederlandse opmaak (`1.234,50`, `%`, `€`). Bij hertekenen vloeien ze van de vorige naar de nieuwe waarde en komen ze kort naar voren. |
| `.ring` (`--p`, via `@property`) | Vult vloeibaar |
| `.balk > i`, `.ug-balk > i`, `.hs-balk > i` | Groeien vanaf 0 |
| SVG `polyline`/`path` (zonder vulling) | Tekenen zichzelf van links naar rechts |
| SVG `rect` (staafjes) | Groeien vanaf de basislijn, 28 ms na elkaar |

### 8.2 Dagring (nieuw, op Vandaag)
Een 24-uursklok direct onder de dagkaart. Uit te zetten in Instellingen.

| Onderdeel | Codering (vorm + kleur) | Interactie |
|---|---|---|
| Buitenbaan | Grijze ring, uurstreepjes, labels 0/6/12/18 | – |
| Daglicht 07–19 u | Zachte amberboog binnenin | – |
| Afspraken | Paarse boog van begin tot eind (standaard 60 min) | Tik of Enter opent de afspraak |
| Taken met tijd | Accentpunt; afgerond = **holle** groene cirkel | Tik of Enter opent het taakblad |
| Voortgang | Groene binnenring = % van de taken van vandaag af | – |
| Nu | Rode wijzer met ademende punt; midden toont tijd en "N open · P%" | Loopt elke 30 s mee |

- **Opbouw:** de bogen en punten veren op (70 ms na elkaar) en de wijzer draait in.
- **Leeg:** de uitleg *"Zet een tijd bij een taak of afspraak en hij verschijnt op de ring"*.
- **Toegankelijk:** `role="group"` met een samenvattend label, elk item als knop met label, en een volledige lijst in `.fm-sr`.

### 8.3 Ritmekaart (nieuw, op Terugblik)
Een heatmap van 12 weken (maandag–zondag) onder de kerncijfers.

- **Bron:** `S.gebeurtenissen` (logregels) plus taken afgerond op die dag.
- **Niveaus:** 0–4 in vijf tinten groen, geschaald op het maximum. Dagen in de toekomst worden niet getoond.
- **Kengetallen** (tellen op): dagen op rij actief, langste reeks, totaal aantal activiteiten.
- **Inzicht:** *"Je bent het vaakst actief op woensdag"*.
- **Interactie:** tik op een dag opent die dag (`ga("dag", datum)`).
- **Animatie:** de cellen komen als een diagonale golf op (vertraging = (kolom + rij) × 22 ms).
- **Toegankelijk:**
  - samenvattend label op de SVG;
  - volledige tabel (week × dag) met `caption` en `scope` voor schermlezers;
  - een legenda "minder → meer".

### 8.4 Energie-aurora
Na elke tekening geldt `--fm-energie = af vandaag / (af vandaag + open t/m vandaag)`.
Het groene aurora-veld volgt met een overgang van 1,6 s.

---

## 9. Integraties en koppelingen

### 9.1 Gebouwd (lokaal, zonder server)

| Integratie | Wat | Randvoorwaarde |
|---|---|---|
| **App-badge** (Badging API) | Aantal open taken van vandaag op het app-icoon; leeg bij 0 | Alleen waar `navigator.setAppBadge` bestaat. Fouten worden stil genegeerd. |
| **Dagring → afspraak / taak** | Boog opent `ga("afspraak", id)`, punt opent `openTaakBlad(id)` | – |
| **Ritmekaart → dag** | `ga("dag", datum)` | – |
| **Ontwerp ↔ Instellingen** | Knoppen in beide richtingen en *Verder naar* | – |
| Bestaand, ongewijzigd | ICS-export naar agenda, back-up/import, meldingen zolang de app open is | – |

### 9.2 Adaptercontract voor externe bronnen (specificatie, nog niet gebouwd)
Voor toekomstige koppelingen met agenda's, takenlijsten, muziek of gezondheid:

1. **Geen tokens in de app.** OAuth loopt via een eigen proxy (serverless). De app
   praat alleen met die proxy, met expliciete toestemming per dienst.
2. **Normaliseren** naar de interne objecten (`taak`, `afspraak`, `gebeurtenis`) met
   `bron` en `bronId`. De interface kent geen provider-specifieke velden.
3. **Zichtbaar:** bron en laatste synchronisatie per item. Handmatig synchroniseren kan
   altijd. Fouten over authenticatie staan in gewone taal in de Inbox.
4. **Opt-in en omkeerbaar:** een koppeling staat standaard uit. Uitzetten verwijdert de
   geïmporteerde items op verzoek.
5. **Offline eerst:** geïmporteerde data landt in IndexedDB. De app blijft volledig
   werken zonder netwerk.

---

## 10. Toegankelijkheid (WCAG 2.2 AA)

| Criterium | Hoe v4 eraan voldoet |
|---|---|
| 1.4.4 Tekst vergroten | Geen `user-scalable=no`. Tekstgrootte-instelling blijft leidend (`--t`). |
| 1.4.3 Contrast | Tekst staat op glas met ≥ 74% kaartdekking. Het Ontwerp-scherm meet het contrast van elk token live. |
| 1.4.1 Kleur niet het enige signaal | Dagring: boog vs. punt vs. holle punt, plus legenda. Ritmekaart: legenda plus tabel. Fout: trilling plus tekst. |
| 2.1.1 Toetsenbord | Dagring-items hebben `tabindex="0"` en werken met Enter/Spatie. Alles werkt met gewone knoppen. |
| 2.4.7 / 2.4.11 Focus zichtbaar en niet verborgen | 2 px accentrand plus gloedring. Het eiland laat scrollruimte (`--navh`), zodat focus niet onder de balk verdwijnt. |
| 2.3.3 Animatie door interactie | `prefers-reduced-motion` zet alles uit. *Rustig* en *Uit* staan in de app. |
| 2.2.2 Pauzeren | De aurora pauzeert bij *Rustig*, budget *licht* en een verborgen tabblad. De ademende punt alleen bij *Vol*. |
| 1.1.1 Niet-tekstuele inhoud | Grafieken hebben een label plus `.fm-sr`-lijst of -tabel. Decoratie is `aria-hidden`. |
| 4.1.2 Naam, rol, waarde | Interactieve SVG-onderdelen in `role="group"` (niet `img`), met `role="button"` en een label |
| Schermkloon | Tijdens overgangen `aria-hidden` en `inert` |

---

## 11. Performance

| Regel | Invulling |
|---|---|
| Alleen `transform` en `opacity` animeren | Uitzonderingen: `clip-path` bij de onthulling (compositor in moderne browsers) en `stroke-dashoffset` bij grafieken |
| `backdrop-filter` spaarzaam | Kop, eiland, bladen en kaarten; nooit op rijen. Budget *licht* haalt het van kaarten af. |
| Geen `filter` tijdens scrollen | Wijken bij scrollen gebruikt alleen `transform` en `opacity` |
| Geen eeuwige JS-lussen | Getallen via rAF tot klaar. Wijzer elke 30 s, dagdeel elke 5 min. Pointermove en scroll gethrottled met rAF. |
| Geen dubbele state | Leest `S`; schrijft niets naar IndexedDB |
| Omvang van de laag | ≈ 83 KB bron, ≈ 28 KB gzip (ruimte, ruimte-data, ontwerp; JS + CSS). Budget: ≤ 100 KB bron / ≤ 35 KB gzip. |
| Frame-doel | 60 fps op een iPhone uit 2020. Onder 40 fps schakelt het budget automatisch terug. |

---

## 12. Ontwerp-scherm in de app

Het Ontwerp-scherm is de leesbare, ingebouwde versie van dit document.

**Waar:** Meer → App → **Ontwerp**, of Instellingen → Weergave → *Ontwerpsysteem bekijken*.

| Sectie | Inhoud |
|---|---|
| Intro | Versie, kernvisie en verwijzing naar `docs/spatial/` |
| Principes | De vijf principes als veegbare kaarten (scroll-snap) |
| Dieptekaart | Vijf lagen met hun token. *Uitklappen* kantelt de stapel in 3D. |
| Kleur en contrast | Negen tokens met live gemeten contrast op de kaartkleur (AA / AA groot / decoratief) |
| Beweging | Zes bewegingstokens met een knop *Speel*: indrukken, tabwissel, oorsprong-geest, optellen tot € 1.234,50, lichtexplosie, veer |
| Status | Bewegingsniveau, dagdeel, energie, gemeten fps, thema, contrast, plus een knop naar Instellingen |

---

## 13. Acceptatiecriteria en testplan

### 13.1 Harde criteria

1. Geen bestaande functie, handler of opslagstructuur is vervangen. Wijzigingen gaan
   alleen via wrappers en `RT_NA`.
2. De laag gaat uit met één schakelaar. Hij staat automatisch uit bij prikkelarm en
   `prefers-reduced-motion`. *Rustig* werkt als tussenstand.
3. Tekstcontrast en -grootte zijn ongewijzigd leesbaar in licht en donker.
4. Elke beweging heeft een aanwijsbare oorsprong en bestemming. Een overgang duurt
   ≤ 460 ms en blokkeert niets.
5. Geen console-fouten in: laden, navigeren, bladen, pincode, Rustig, reduced motion,
   desktop.
6. Het publieke contract (§3.3) werkt voor alle bestaande modules.
7. Werkt in Safari 16.4+, Chrome/Edge 111+, Firefox 128+. Veren via `linear()` waar
   ondersteund, anders een fallback.

### 13.2 Uitgevoerde tests (Chromium, 390×844 en 1280×800)

| Scenario | Resultaat |
|---|---|
| Laden en alle hoofdschermen (Vandaag, Terugblik, Ontwerp, Meer, Instellingen), donker en licht | ✅ geen fouten |
| Dagring met 4 taken (1 af) en 2 afspraken | ✅ bogen, punten, voortgang 20%, wijzer |
| Ritmekaart met 12 weken testdata | ✅ golf, reeksen, weekdag-inzicht |
| Pincode fout → rode trilling (`#slot.rt-fout`); goed → ontgrendeld | ✅ |
| Beweging *Rustig* → `rtVol()` = false, `rtAan()` = true | ✅ |
| Vooruit (Meer → Gewoontes) en terug; schermkloon opgeruimd | ✅ |
| `prefers-reduced-motion` → laag uit, geen wachtende blokken | ✅ |
| Adaptief budget in een headless browser (~32 fps) → *licht* plus één melding | ✅ (gedrag zoals bedoeld) |
| Desktop 1280 px → eiland gecentreerd, glanslicht op kaarten | ✅ |

### 13.3 Nog handmatig te testen op toestellen
- iPhone (Safari 16.4+ en 17.2+ voor `linear()`), Android mid-range, iPad;
- VoiceOver en TalkBack op de Dagring en Ritmekaart;
- iOS-energiebesparing (verwacht: budget *licht*);
- liggend/staand wisselen en > 100 taken.

---

## 14. Backlog

| Idee | Waarom nog niet | Wat nodig is |
|---|---|---|
| View Transitions API | `teken()` is synchroon en aanroepers rekenen daarop | Asynchroon rendercontract |
| Titelmorph kaart → kop | Meetwerk per view | Gedeelde-elementregistratie per view |
| Sparklines in stat-tegels | Tegels hebben geen tijdreeks | Meetreeks per tegel (7–30 dagen) |
| Externe bronnen (agenda, taken, gezondheid) | Vraagt een OAuth-proxy | Adaptercontract §9.2 plus proxy |
| Wake Lock bij focus-timer en Anker | Hoort bij die modules | Kleine koppeling in `anker-speler.js` / timer |
| Scroll-gedreven animaties (`animation-timeline: view()`) | Nog niet in Safari | IntersectionObserver blijft de fallback |

---

## 15. Probleemoplossing

| Probleem | Oorzaak | Oplossing |
|---|---|---|
| Alles voelt vlakker dan verwacht | Budget *licht* is actief (traag toestel of energiebesparing) | Ontwerp → Status. Herladen reset het budget. |
| Geen beweging | Beweging verminderen aan op het toestel, prikkelarm aan, of de laag uit | Instellingen → Weergave |
| Dagring ontbreekt | Instelling *Dagring op Vandaag* uit | Aanzetten in Instellingen |
| Iets onder de onderbalk is niet te bereiken | Eigen element gebruikt een vaste `bottom` | `bottom: calc(var(--navh) + …)` gebruiken |
| Een module-animatie loopt bij *Rustig* toch | Module gebruikt `rtAan()` | Gebruik `rtVol()` voor decoratieve beweging |
| Wijziging niet zichtbaar | `index.html` niet opnieuw gebouwd | `python3 ruimtelijk/bouw.py` |

---

## Bijlage A: van v3 naar v4

| v3-onderdeel | In v4 | Reden |
|---|---|---|
| §3.2 viewport `user-scalable=no` | **Geschrapt** | WCAG 1.4.4 |
| §3.3 `.layer`-secties, §3.4 5-knops-nav | **Vervangen** door de echte `#scherm` + `nav#tabs` (6 tabs) | Architectuur van FutureMe |
| §3.5 kaarten met `data-detail` → `.page` | **Vervangen** door oorsprong-onthulling rond `ga()` | Details zijn schermen of bladen |
| §3.6 / §4.9 pincode-overlay | **Overgenomen** als focuslaag op `#slot` | – |
| §4.1 tokens | **Overgenomen en uitgebreid** als `--fm-*` bovenop de themakleuren | Licht en donker, veren |
| §4.3 aurora | **Overgenomen**, zonder zinloze `backdrop-filter`, met dagdeel en energie | – |
| §4.5 kaartgloed, §4.6 ripple | **Overgenomen** (glanslicht voor muis, gloed voor aanraking) | – |
| §4.7 tabs met lichtspoor, §4.8 zwevende nav | **Overgenomen** als eiland met één glijdend lint | – |
| §4.10 lijst-enter, §4.11 grafieken | **Overgenomen** (stagger, tekenen, groeien) | – |
| §4.12 DOM-mindmap | **Geschrapt** | Bestaande canvas-mindmap |
| §4.13 detailpagina's | **Vervangen** door §7.1 | – |
| §4.14 reduced motion | **Uitgebreid** tot Vol / Rustig / Uit plus adaptief budget | – |
| §5 `FutureMe`-namespace en mock-API's | **Geschrapt**; alleen `FM_RUIMTE` voor status | Dubbele state vermeden |
| §5.4 `gtag`, §8.3 `web-vitals` | **Geschrapt** | Privacy, geen externe bronnen |
| §5.11 fout-HTML met ruwe `message` | **Geschrapt** | XSS; de app heeft eigen toasts |
| §6 integraties | **Adaptercontract** (§9.2) plus lokale integraties (§9.1) | Geen server |
| §8.2 budget 150 KB voor de app | **Vervangen** door een budget voor de laag | De app is bewust één bestand |
| Percentages ("60% sneller" e.d.) | **Geschrapt** | Niet onderbouwd |

*Einde van de specificatie. FutureMe Spatial Experience v4.0*
