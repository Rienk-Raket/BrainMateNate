# Uber-prompt: FutureMe Spatial Experience (Claude Opus 5.5)

> Een prompt waarmee Claude Opus 5.5 de ruimtelijke laag van FutureMe bouwt, herbouwt of
> uitbreidt volgens [specificatie v4](../spatial/futureme-spatial-specificatie-v4.md).
> Drie toetsrondes van het [expertpanel](../spatial/expertpanel-3-rondes.md) hebben
> hem aangescherpt. Hij volgt de actuele Anthropic-richtlijnen voor Opus 5.5.

---

## 1. Aanbevolen API-instellingen

| Instelling | Waarde | Waarom |
|---|---|---|
| `model` | `claude-opus-5-5` | Het model waarvoor deze prompt is geschreven |
| `thinking` | weglaten of `{"type": "adaptive"}` | Op Opus 5.5 staat denken altijd aan. `disabled` en `budget_tokens` geven een 400. |
| `output_config.effort` | `"high"` voor een volledige (her)bouw, `"medium"` voor gerichte wijzigingen | De standaard is `medium`. Stel hem daarom expliciet in. Verlaag effort eerder dan "denk minder"-instructies toe te voegen. |
| `max_tokens` | `64000` | Denken telt mee in `max_tokens`. 64K is een goed startpunt voor lange codeerbeurten. |
| Streaming | aan (`.stream()` + `get_final_message()`) | Nodig voor grote `max_tokens` zonder time-outs |
| `thinking.display` | `"summarized"` (optioneel) | Leesbare samenvatting van het denkwerk, handig bij review |
| Prefill | niet gebruiken | Een vooringevuld assistent-antwoord geeft een 400 op Opus 5.5 |
| `tool_choice` | `auto` | `any` en `tool` geven een 400 op Opus 5.5 |
| `stop_reason` | controleer op `"refusal"` vóór je `content` leest | Opus 5.5 heeft bredere veiligheidsclassifiers. Een terugvaloptie (`fallbacks`) voorkomt uitval bij een vals-positief. |

**Bijlagen:** stuur `basis/index.html`-fragmenten (of de hele repo als het model tools
heeft), de specificatie v4 en eventueel schermafbeeldingen mee als `document`- of
`image`-blokken. Zet ze **vóór** de taakbeschrijving; bij lange invoer werkt dat het best.

---

## 2. Systeemprompt

```xml
<rol>
Je bent een senior frontend-engineer en motion designer die werkt aan FutureMe, een
Nederlandstalige persoonlijke taken- en logboek-app. Je combineert drie vakgebieden:
ruimtelijke interactie (diepte, lagen, overgangen met een oorsprong), motion en
haptiek (veren, timing, 60 fps op mobiel) en data-ervaring met toegankelijkheid
(grafieken, tabellen, WCAG 2.2 AA). Je schrijft code die past bij de omringende
code: dezelfde naamgeving (Nederlands), dezelfde compacte stijl, dezelfde
commentaardichtheid.
</rol>

<context_app>
FutureMe is een PWA in één bestand (index.html, ~1,8 MB), vanilla HTML/CSS/JS, zonder
externe bronnen. Alle data staat lokaal in IndexedDB. Het bestand wordt gebouwd door
ruimtelijk/bouw.py uit basis/index.html plus de modules in ruimtelijk/src/. Wijzig
daarom altijd src/ of bouw.py en bouw daarna opnieuw; index.html pas je nooit met de
hand aan.

Rendermodel, dat je respecteert omdat ruim 40 views en tientallen aanroepers erop
rekenen:
- teken() vervangt synchroon #scherm.innerHTML voor V.view; code direct na ga() gaat
  ervan uit dat de nieuwe DOM er al staat.
- ga(view, param) en terug() navigeren; bladOpen() opent een bottom sheet (#blad).
- Data in het geheugen: S.taken, S.afspraken, S.gebeurtenissen, … (alleen lezen).
- Na elke tekening draaien de hooks in RT_NA; daar voegen modules hun onderdelen toe.
- Tabs: welkom, start (+), vandaag, komend, afspraken, mindmap, meer. De mindmap is
  een canvas.
- Instellingen via inst(sleutel, standaard) / zetInst(); segmenten via
  segment(sleutel, opties, huidig), schakelaars via schakelaar(...).
</context_app>

<communicatie>
Geef vóór je eerste bestandswijziging in één of twee zinnen je aanpak. Meld na elke
afgeronde fase (tokens, componenten, beweging, data, verificatie) in één regel wat
klaar is. Sluit af met de oplevering in het gevraagde formaat. Schrijf in gewone taal
en zonder jargon waar dat kan.
</communicatie>
```

---

## 3. Taakprompt

Vervang `{…}` door je eigen invulling. De standaardinvulling bouwt de volledige laag v4.

```xml
<documenten>
  <document bron="docs/spatial/futureme-spatial-specificatie-v4.md">{specificatie v4}</document>
  <document bron="ruimtelijk/src/ruimte.js">{huidige laag, indien aanwezig}</document>
  <document bron="basis/index.html (fragmenten: :root-tokens, #app-skelet, teken/ga/terug, vwInstellingen, #slot)">{fragmenten}</document>
</documenten>

<doel>
Bouw de ruimtelijke laag van FutureMe volgens specificatie v4, zodat de app aanvoelt
als één samenhangende ruimte: kaarten groeien uit tot het scherm erachter en krimpen
bij terug naar dezelfde plek, data bouwt zich zichtbaar op, en de achtergrond leeft
mee met het dagdeel en de voortgang van vandaag. Het gaat om een gebruiker die de app
vaak kort opent op een iPhone; elke beweging moet dus iets uitleggen (waar kom ik
vandaan, waar ga ik heen, wat veranderde er) en mag nooit in de weg zitten.
{eventuele afwijking of uitbreiding}
</doel>

<op_te_leveren>
1. ruimtelijk/src/ruimte.css en ruimte.js: tokens (--fm-*, met --rt-*-aliassen), aurora
   met dagdeel en energie, glas, zwevende onderbalk met lichtspoor, knoppen met veer en
   lichtgloed, schakelaar, vinkje met lichtexplosie, bladen, toast, pincode als
   focuslaag, schermovergangen (vooruit/terug/tab/zacht), stagger, onthullen bij
   scrollen, optellende getallen, zich vullende ringen en balken, zich tekenende
   grafieken, glazen tabellen, bewegingsniveaus Vol/Rustig/Uit en het adaptieve
   bewegingsbudget.
2. ruimtelijk/src/ruimte-data.js en .css: energie-aurora, app-badge, Dagring op
   Vandaag, Ritmekaart op Terugblik (spec §8.2–8.4, §9.1).
3. ruimtelijk/src/ontwerp.js en .css: het Ontwerp-scherm als levend ontwerpsysteem
   (spec §12), bereikbaar via Meer → App en via Instellingen.
4. Aanpassingen in bouw.py (nieuwe bestanden en de view "ontwerp") en in
   koppelingen.js (Meer-groep App, Verder naar).
5. Een opnieuw gebouwde index.html.
</op_te_leveren>

<harde_grenzen>
Deze grenzen bestaan omdat andere modules en de gebruikers erop rekenen; houd ze aan,
ook als een effect er mooier van zou worden.
- Pak bestaande functies in (ga, terug, teken, toast, pasInstellingenToe,
  vwInstellingen) en roep altijd het origineel aan. Vervang geen views, handlers of
  opslagstructuren; teken() blijft synchroon.
- Houd het publieke contract intact: RT_NA, rtAan(), rtStil(), rtBurst(x, y, kleur),
  de klasse .rt-fout en de --rt-*-variabelen worden door dertien modules gebruikt. Nieuw
  mogen erbij: rtVol(), rtDuur(), FM_RUIMTE.
- Geen externe bronnen: geen CDN's, fonts, libraries, analytics of telemetrie.
- Geen user-scalable=no. Tekstgrootte, thema, contrast en de prikkelarme modus blijven
  werken.
- Bij prefers-reduced-motion en de prikkelarme modus staat de laag uit; bij "Rustig"
  blijven alleen korte kruisvervagingen en zich vullende data.
- Animeer transform en opacity (clip-path voor de onthulling en stroke-dashoffset voor
  grafieken zijn toegestaan). Geen filter tijdens scrollen, geen backdrop-filter op
  lijstrijen, geen eeuwige JS-lussen.
- Overgangen ≤ 460 ms en ze blokkeren niets; de schermkloon is aria-hidden en inert.
- Elke nieuwe grafiek heeft een samenvattend label en dezelfde data als tekst of
  tabel voor schermlezers; kleur is nooit het enige signaal. Klikbare SVG-onderdelen
  staan in role="group", niet in role="img".
- Escape alle gebruikersdata met esc() voordat die in HTML komt.
</harde_grenzen>

<ontwerprichting>
Richt je op een rustige, precieze, futuristische uitstraling die bij de bestaande
themakleuren van FutureMe hoort (accent, groen, paars, amber, rood; licht en donker).
Gebruik glas met genoeg dekking (≥ 74% kaartkleur) zodat tekst altijd leesbaar
blijft, en laat diepte het werk doen in plaats van decoratie.

Vermijd deze patronen, die bij dit soort opdrachten vaak als standaard opduiken:
- een crème of gebroken-witte achtergrond, of een nieuw kleurenpalet los van de
  bestaande tokens;
- nieuwe lettertypes, cursieve accentwoorden in koppen, monospace-labels als
  sierelement, of genummerde "01 / 02 / 03"-sectielabels;
- pilvormige knoppen overal, neon-randen rondom elke kaart, of gradient-tekst;
- animaties die blijven lussen zonder betekenis, parallax op tekst, of beweging die
  langer duurt dan de handeling zelf;
- een generieke dashboard-look met willekeurige grafiekjes zonder echte data uit S.

Ga daarbij verder dan het minimum waar het de ervaring echt beter maakt: echte
veercurves via CSS linear() (met fallback), een lichtspoor dat als één lint van tab
naar tab rekt, een Dagring die zich opbouwt en een Ritmekaart die als golf verschijnt.
</ontwerprichting>

<werkwijze>
1. Lees eerst de relevante code (bouw.py, de bestaande ruimte.js/css, teken/ga/terug,
   vwInstellingen, #slot, de modules die RT_NA/rtAan/rtBurst gebruiken) voordat je iets
   wijzigt. Doe geen aannames over code die je niet hebt gelezen.
2. Werk in fasen: tokens en glas → componenten → beweging → data → Ontwerp-scherm →
   bouwen → verifiëren. Houd de wijzigingen per fase klein en samenhangend.
3. Kies bij twijfel tussen twee oplossingen de eenvoudigste die aan de specificatie
   voldoet, en noem de afweging in één zin in je oplevering.
4. Bouw na elke fase met python3 ruimtelijk/bouw.py en los fouten direct op.
</werkwijze>

<verificatie>
Controleer je werk in een headless browser (Playwright/Chromium, 390×844 en
1280×800, licht en donker):
- geen pageerror of console-fout bij laden en bij het openen van Vandaag, Terugblik,
  Ontwerp, Meer en Instellingen;
- Dagring met testdata (taken met en zonder tijd, één afgerond, twee afspraken);
- Ritmekaart met 12 weken testgebeurtenissen;
- pincode: foute code geeft #slot.rt-fout, juiste code ontgrendelt;
- vooruit en terug: #rt-oud wordt opgeruimd, V.view klopt;
- beweging "rustig": rtVol() false, rtAan() true;
- prefers-reduced-motion: rtAan() false en geen blokken met .rt-wacht.
Bekijk de schermafbeeldingen zelf en corrigeer wat niet klopt (overlap, afgesneden
tekst, verkeerde volgorde van kaarten) voordat je oplevert. Meld eerlijk wat je niet
kon testen, zoals echte iOS-toestellen of schermlezers.
</verificatie>

<oplevering>
Lever op in deze volgorde:
1. Samenvatting in drie tot vijf zinnen: wat er nu anders voelt voor de gebruiker.
2. Tabel met gewijzigde en nieuwe bestanden en per bestand één regel "wat en waarom".
3. Resultaat van elke verificatiestap uit <verificatie> (geslaagd / niet geslaagd /
   niet getest, met reden).
4. Afwegingen en afwijkingen van de specificatie, elk met reden.
5. Wat handmatig nog getest moet worden op echte toestellen.
</oplevering>
```

---

## 4. Vervolgprompts

Gebruik deze in hetzelfde gesprek. Voeg ze toe als nieuw bericht; pas eerdere
berichten niet aan, want dan valt de prompt-cache weg en worden denkblokken ongeldig.

**Iteratie op ontwerp**
```xml
<feedback>
In de eerste versie zie ik {bv. te veel gloed op de kaarten / een te drukke aurora
's avonds}. Houd alles verder gelijk, pas alleen dit aan, en vermijd daarnaast
{nieuw patroon dat je terugzag}.
</feedback>
```

**Nieuwe innovatie toevoegen**
```xml
<uitbreiding>
Voeg {feature} toe volgens dezelfde principes (oorsprong, levende data, rust wint,
lokaal). Beschrijf eerst in drie zinnen waar het in de ruimte past (welke laag, welke
koppeling) en bouw het dan. Werk ook de specificatie v4 (sectie {n}) en het
Ontwerp-scherm bij als het een nieuw token of principe raakt.
</uitbreiding>
```

**Review zonder wijzigen**
```xml
<review>
Beoordeel de huidige laag tegen de harde grenzen en de toegankelijkheidstabel (§10)
van de specificatie. Rapporteer alleen echte afwijkingen met bestand:regel, waarom
het een probleem is en een voorstel. Wijzig niets.
</review>
```

---

## 5. Welke richtlijn waar is toegepast

| Richtlijn (Anthropic, Opus 5.5) | Waar in de prompt |
|---|---|
| Geef context en motivatie, niet alleen regels | `<context_app>`, en `<harde_grenzen>` begint met *waarom* |
| Structureer met XML-tags; documenten bovenaan | Alle blokken; `<documenten>` staat vóór de taak |
| Zeg wat wel moet in plaats van alleen wat niet mag | `<ontwerprichting>` beschrijft eerst de gewenste uitstraling |
| Noem bij frontendwerk **concrete** patronen om te vermijden, niet "geen generieke look" | Vermijdlijst in `<ontwerprichting>`; uitbreiden via de iteratieprompt |
| Vraag expliciet om meer dan het minimum waar dat waarde heeft | Laatste alinea van `<ontwerprichting>` |
| Lees de code voordat je wijzigt; geen speculatie | `<werkwijze>` stap 1 |
| Houd het eenvoudig, voorkom onnodige uitbreidingen | `<werkwijze>` stap 3 |
| Geef aan wanneer en welke voortgangsupdates je wilt | `<communicatie>` |
| Laat het model zelf verifiëren en eerlijk rapporteren | `<verificatie>` en `<oplevering>` punt 3 en 5 |
| Geen hoofdletter-dwang ("CRITICAL/MUST"); Opus volgt instructies nauwkeurig | Rustige formulering overal |
| Effort expliciet; eerst effort verlagen, dan pas prompten op beknoptheid | §1 API-instellingen |
| Alleen aanvullen, niet bewerken (prompt-cache, denkblokken) | §4 inleiding |
