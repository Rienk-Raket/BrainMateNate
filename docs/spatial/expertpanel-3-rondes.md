# Expertpanel: drie toetsrondes voor FutureMe Spatial v4

> **Wat dit is:** het verslag van drie rondes waarin drie specialisten de specificatie
> (v3, aangeleverd) en de bijbehorende prompt toetsen, verbeteren en aanvullen. Elke
> ronde zoeken ze ook naar nieuwe features, animaties, integraties, koppelingen,
> bewegende onderdelen, grafieken en tabellen.
>
> **Wat eruit kwam:**
> - [`futureme-spatial-specificatie-v4.md`](futureme-spatial-specificatie-v4.md): de specificatie
> - [`../prompts/futureme-spatial-uberprompt.md`](../prompts/futureme-spatial-uberprompt.md): de prompt voor Claude Opus 5.5
> - de herschreven ruimtelijke laag in `ruimtelijk/src/` en de gebouwde `index.html`
>
> **Bron:** [`bron/futureme-spatial-ux-ui-specificatie-v3.md`](bron/futureme-spatial-ux-ui-specificatie-v3.md)

---

## Het panel

| Persona | Rol | Kijkt vooral naar | Vaste vraag |
|---|---|---|---|
| **Iris Lindqvist** | Spatial Interaction Architect. Achtergrond in AR/visionOS-achtige interfaces en ruimtelijke navigatie. | Diepte, lagen, overgangen met oorsprong, gebaren, gedeelde elementen | *"Waar komt dit vandaan en waar gaat het heen?"* |
| **Joaquín Mbeki** | Motion & Haptics Director. Achtergrond in game-UI en motion-systemen voor mobiel. | Veren, timing, haptiek, framerate, batterij, `prefers-reduced-motion` | *"Voelt het fysiek, en blijft het 60 fps op een telefoon uit 2020?"* |
| **Meera Vos** | Data Experience & Accessibility Lead. Achtergrond in datavisualisatie en WCAG-audits. | Grafieken, tabellen, informatiearchitectuur, schermlezers, privacy, integraties | *"Kan iedereen dit begrijpen, en klopt het getal?"* |

**Werkwijze per ronde:** (1) ieder toetst het document en de prompt vanuit de eigen
discipline, (2) ieder stelt innovaties voor, (3) het panel besluit per punt:
**aangenomen** (komt in v4 en wordt gebouwd), **backlog** (goed idee, niet in deze
bouw) of **afgewezen** (met reden).

---

## Ronde 1: realiteitscheck

**Getoetst:** specificatie v3 en een eerste promptschets die v3 samenvat.

### Toetsing

**Iris.** v3 beschrijft een app die niet bestaat. Er staan `.layer`-secties, losse
`.page`-detailviews en een onderbalk met vijf knoppen in. FutureMe tekent schermen met
`teken()` in één `#scherm`, navigeert met `ga()`/`terug()`, opent details als bottom
sheet (`bladOpen()`) en heeft zes tabs met een verhoogde "+" in het midden. Een
implementatie volgens v3 zou de navigatie van ruim 40 views breken. v4 moet elk
voorschrift koppelen aan een echte selector of functie.

**Joaquín.** Er zitten fouten in de voorbeeldcode:
- `backdrop-filter` op `.aurora` doet niets, want er ligt niets onder;
- `body{overflow:hidden}` breekt het scrollgedrag van `#scherm` op iOS;
- `will-change` op elke laag kost geheugen;
- het budget "150 KB gzip" is onhaalbaar, want de hele app is ~1,8 MB ongecomprimeerd, bewust in één bestand.

Een realistisch budget geldt voor de *laag*, niet voor de app. De
duurtokens (`--duration-layer: 520ms`) zijn te traag voor tabwissels.

**Meera.** Deze punten raken toegankelijkheid en veiligheid:

| # | Bevinding in v3 | Waarom het fout is |
|---|---|---|
| 1 | `user-scalable=no, maximum-scale=1` | Schendt WCAG 1.4.4 (zoomen) |
| 2 | `gtag()`-analytics | In strijd met "geen externe bronnen, alles lokaal" |
| 3 | `showModuleError` zet `message` ongefilterd in `innerHTML` | XSS-risico |
| 4 | Mindmap met `Math.random()`-posities | Elke render ziet er anders uit, dus onvoorspelbaar. De echte mindmap is al een canvas-editor. |
| 5 | Mock-API's als vervanging van de state | FutureMe heeft `S` plus IndexedDB. Een tweede state-laag geeft dubbele waarheid. |
| 6 | Percentages als "60% snellere laadtijd", "40% minder bugs" | Niet onderbouwd, horen niet in een specificatie |
| 7 | `import … from 'web-vitals'` | Externe dependency |

### Innovaties voorgesteld

| Van | Voorstel | Besluit |
|---|---|---|
| Iris | **Tokens v4 bovenop de bestaande kleuren** (`--fm-*`), met aliassen voor de oude `--rt-*`-namen zodat modules blijven werken | ✅ Aangenomen |
| Iris | **Zwevende onderbalk als glazen eiland** (v3 §4.8) toegepast op de echte `nav#tabs`, inclusief "+" en lichtspoor | ✅ Aangenomen |
| Joaquín | **Bewegingsniveaus Vol / Rustig / Uit** in plaats van alleen aan/uit | ✅ Aangenomen |
| Joaquín | **Aurora per dagdeel**: ochtend warm, middag helder, avond oranje-roze, nacht indigo | ✅ Aangenomen |
| Meera | **Dagring**: 24-uursklok op Vandaag, afspraken als bogen, taken als punten, wijzer voor nu | ✅ Aangenomen |
| Meera | Sparklines in elke stat-tegel | ⏸ Backlog. De tegels tonen tellingen zonder tijdreeks; eerst een meetreeks per tegel nodig. |
| Joaquín | Geluidseffecten bij afronden | ❌ Afgewezen. Past niet bij een app die je in de trein of op kantoor opent. Haptiek bestaat al via `tril()`. |

**Prompt na ronde 1:** de promptschets verwees naar v3-selectors. Herschreven zodat de
prompt eerst de echte architectuur als context geeft (`teken`/`ga`/`terug`/`bladOpen`,
`RT_NA`, `bouw.py`) en pas daarna de gewenste ervaring beschrijft.

---

## Ronde 2: beweging en levende data

**Getoetst:** v4-α (v3 vertaald naar de echte app plus de besluiten uit ronde 1) en prompt P2.

### Toetsing

**Iris.** Moeten schermovergangen via de View Transitions API?
`document.startViewTransition()` roept de update **asynchroon** aan. FutureMe-code gaat
er overal van uit dat `teken()` synchroon de DOM bijwerkt (bijvoorbeeld
`ga(); $("#scherm").scrollTop = 0`). Overstappen breekt tientallen aanroepers.
**Besluit:** de WAAPI-kloon met `clip-path` vanuit de aangetikte kaart blijft; de View
Transitions API gaat naar de backlog voor het moment dat `teken()` asynchroon wordt.

**Joaquín.** "Veer" is nu een `cubic-bezier` met overshoot. Dat is geen veer: er is maar
één uitschieter en geen natrillen. Met CSS `linear()` (Safari 17.2+, Chrome 113+,
Firefox 112+) past een echte gedempte veer in een token, zonder JS-lus. Een fallback via
`@supports` blijft nodig. Daarnaast:
- **Adaptief bewegingsbudget:** frames tellen tijdens elke overgang en bij aanhoudend
  < 40 fps zelf terugschakelen naar "licht" (geen glasvervaging op kaarten, aurora stil).
  Dit vangt ook iOS-energiebesparing op (rAF op 30 fps).
- **Aurora pauzeren als het tabblad verborgen is.** Dat scheelt batterij.

**Meera.** Grafieken zijn nu alleen visueel. Voor elke nieuwe grafiek geldt:
- de SVG krijgt een samenvattend label;
- dezelfde data staat in een tabel voor schermlezers (`.fm-sr`);
- kleur is nooit het enige signaal (vorm: boog/punt/holle punt; legenda met vormen).

Ook moeten SVG-elementen die klikbaar zijn in een `role="group"` staan, niet in
`role="img"`. Anders verbergt `img` de knoppen voor hulpsoftware.

### Innovaties voorgesteld

| Van | Voorstel | Besluit |
|---|---|---|
| Joaquín | **Veercurves als `linear()`-tokens** (`--fm-veer`, `--fm-veer-zacht`) met fallback | ✅ Aangenomen |
| Joaquín | **Adaptief bewegingsbudget** (fps-meting, `data-budget="licht"`, één melding) | ✅ Aangenomen |
| Meera | **Ritmekaart**: heatmap van 12 weken op Terugblik, met reeks, langste reeks, meest actieve weekdag, tik op een dag opent die dag, plus een tabel voor schermlezers | ✅ Aangenomen |
| Meera | **Energie-aurora**: het groene aurora-veld groeit mee met het deel van de taken van vandaag dat af is (`--fm-energie`) | ✅ Aangenomen |
| Iris | **Onthullen bij scrollen**: blokken onder de vouw komen op zodra ze in beeld schuiven (IntersectionObserver, eenmalig) | ✅ Aangenomen |
| Iris | **Glanslicht dat de aanwijzer volgt** plus **kantelen tot 4°** op kaarten, alleen met muis/pen | ✅ Aangenomen |
| Meera | **Glazen tabellen**: vaste kop, tabulaire cijfers, rij licht op bij focus en hover | ✅ Aangenomen |
| Iris | Vegen tussen tabs | ❌ Afgewezen. Botst met vegen over taken (afvinken/uitstellen). |
| Joaquín | 3D-achtergrond met WebGL | ❌ Afgewezen. Te zwaar voor de doelgroep-toestellen, en voegt niets toe dat de aurora niet al doet. |

**Prompt na ronde 2:** effecten zijn in de prompt nu gekoppeld aan **waarom** ze
bestaan (oorsprong, betekenis, toegankelijkheid). Er zijn harde acceptatiecriteria
toegevoegd, plus een lijst met concrete stijlpatronen om te vermijden in plaats van
"maak het niet generiek".

---

## Ronde 3: samenhang, integraties en toetsbaarheid

**Getoetst:** v4-β en prompt P3.

### Toetsing

**Iris.** De specificatie is compleet, maar leeft alleen in `docs/`. Wie de app gebruikt
ziet nooit waarom iets beweegt. Voorstel: een **Ontwerp-scherm** in de app zelf, als
levend ontwerpsysteem. Het toont principes, een dieptekaart die in 3D uitklapt,
kleurtokens, bewegingsdemo's en de status van de laag. Zo is het document "leesbaar en
integreerbaar" in `index.html`.

**Joaquín.** De publieke API van de laag moet vastliggen, want dertien modules gebruiken
`RT_NA`, `rtAan`, `rtBurst`, de klasse `.rt-fout` of `--rt-veer`. v4 noemt deze
expliciet als contract. Nieuwe functies (`rtVol`, `rtDuur`, `FM_RUIMTE`) komen erbij.
Verder: de pincode (v3 §3.6/§4.9) wordt de **focuslaag** van v4:
- glazen toetsen boven de aurora;
- bolletjes die opveren bij invoer;
- bij een foute code trillen de bolletjes rood;
- na ontgrendelen komt de app uit de diepte naar voren.

**Meera.** Integraties uit v3 (Google Calendar, Todoist, Spotify, Health) vragen een
backend met OAuth. FutureMe is bewust lokaal, zonder server. v4 legt daarom een
**adaptercontract** vast (normaliseren naar interne objecten, bron en laatste sync
tonen, alles opt-in), maar bouwt alleen integraties die zonder server en zonder
datalek werken:
- **App-badge** (Badging API): het aantal open taken van vandaag op het app-icoon;
- **koppelingen tussen schermen**: Dagring-boog opent de afspraak, Dagring-punt opent de
  taak, Ritmekaart-dag opent de dag.

Ook voegt Meera een **live contrastcontrole** toe aan het Ontwerp-scherm: elk kleurtoken
toont zijn contrast op de kaartkleur van het huidige thema (AA / AA groot / decoratief).

### Innovaties voorgesteld

| Van | Voorstel | Besluit |
|---|---|---|
| Iris | **Ontwerp-scherm** (Meer → App → Ontwerp, en vanuit Instellingen) met uitklapbare 3D-dieptekaart en principes als veegbare kaarten | ✅ Aangenomen |
| Meera | **Live contrastcontrole** van kleurtokens volgens WCAG 2.2 | ✅ Aangenomen |
| Joaquín | **Pincode als focuslaag** met rode trilling en onthulling van de app | ✅ Aangenomen |
| Meera | **App-badge** met open taken van vandaag | ✅ Aangenomen |
| Iris | **Gloeiende "nu"-punt** op de Dagring die langzaam ademt (alleen bij beweging Vol) | ✅ Aangenomen |
| Meera | Adaptercontract voor externe bronnen (agenda, taken, gezondheid) | ✅ Aangenomen als **specificatie**; bouw ⏸ backlog (vraagt een OAuth-proxy) |
| Joaquín | Wake Lock tijdens focus-timer en Anker-sessie | ⏸ Backlog. Hoort bij die modules, niet bij de ruimtelijke laag. |
| Iris | Shared-element-morph van kaarttitel naar koptitel | ⏸ Backlog. De koptitel wisselt al met een korte opkomst; een echte morph vraagt meetwerk per view. |
| Meera | Web Vitals meten in de app | ❌ Afgewezen. Zou een externe library of telemetrie vragen. De fps-meting van het budget volstaat en blijft lokaal. |

**Prompt na ronde 3 (definitief):** opgebouwd volgens de actuele Anthropic-richtlijnen
voor Claude Opus 5.5:
- rol en context in XML-blokken;
- motivatie per eis, harde grenzen apart van ontwerpwensen;
- concrete stijlpatronen om te vermijden;
- verificatie- en zelfcontrolestappen, een vast opleverformaat en het gewenste ritme van voortgangsupdates;
- aanbevolen API-instellingen: `effort` expliciet, `max_tokens` ruim genoeg voor denken en antwoord, streaming.

---

## Samenvatting van alle besluiten

| Categorie | Aangenomen en gebouwd | Backlog | Afgewezen |
|---|---|---|---|
| **Features** | Dagring, Ritmekaart, Ontwerp-scherm, bewegingsniveaus, adaptief budget | Sparklines per tegel, adapters voor externe bronnen, Wake Lock | Web Vitals-telemetrie |
| **Animaties** | `linear()`-veren, onthullen bij scrollen, kantelen, glanslicht, ademende nu-punt, cellengolf in de Ritmekaart, opbouw van de Dagring, pincode-trilling en -onthulling | View Transitions API, shared-element-titelmorph | Geluidseffecten, WebGL |
| **Integraties** | App-badge (Badging API) | OAuth-proxy voor agenda/taken/gezondheid | Analytics (gtag) |
| **Koppelingen** | Dagring → afspraak/taak, Ritmekaart → dag, Instellingen ↔ Ontwerp, Verder naar | | Vegen tussen tabs |
| **Bewegend** | Aurora per dagdeel en energie, 3D-dieptekaart, zwevend eiland met lichtspoor | | |
| **Grafieken** | Dagring (radiaal), Ritmekaart (heatmap), bestaande ringen, balken en lijnen die zich opbouwen | Sparklines | |
| **Tabellen** | Glazen tabellen (vaste kop, tabulaire cijfers, focusrij), tabellen voor schermlezers bij elke nieuwe grafiek | | |
