> **Vervangen:** de ruimtelijke laag volgt nu [specificatie v4](spatial/futureme-spatial-specificatie-v4.md) en de [uber-prompt voor Claude Opus 5.5](prompts/futureme-spatial-uberprompt.md). Dit document blijft staan als geschiedenis.

# Ruimtelijke interface voor FutureMe — geoptimaliseerde ontwerpprompt

Dit document is de aangescherpte versie van de oorspronkelijke ontwerpbrief
("premium, futuristische uitstraling … glassmorphism … filmische animaties"),
toegespitst op FutureMe zoals de app nu in elkaar zit. De brief beschreef een
generieke mobiele app; hieronder staat per onderdeel **welk element van FutureMe**
het raakt, **wat er precies moet gebeuren** en **wat de grens is**. Onderaan staat de
compacte prompt die je letterlijk aan een model of ontwikkelaar kunt geven.

---

## 0. Kader: wat FutureMe is (en dus wat de prompt moet respecteren)

| Eigenschap | Gevolg voor het ontwerp |
|---|---|
| Eén bestand (`index.html`, ~900 KB), vanilla JS, geen bundler, geen externe bronnen | Alles inline; geen fonts/libraries van buiten; geen build-stap |
| PWA voor iPhone (Safari), ook Android/desktop | 60 fps op een iPhone uit 2020; `backdrop-filter` spaarzaam; `-webkit-` prefixen |
| Rendermodel: `teken()` vervangt `#scherm.innerHTML`, `ga(view, param)` / `terug()` navigeren, `bladOpen()` opent bottom sheets | Overgangen moeten **om** dit model heen: snapshot van het oude scherm, animatie, klaar. Geen herschrijving van views |
| Bestaande instellingen: thema (systeem/licht/donker), tekstgrootte, dichtheid, contrast, **prikkelarme modus** (`data-rust`), trillen | Ruimtelijke laag is een **eigen instelling** ("Ruimtelijke interface", standaard aan), staat automatisch uit bij prikkelarme modus en `prefers-reduced-motion` |
| Nederlandstalig, rustige typografie | Geen nieuwe lettertypes; tekst blijft ongewijzigd leesbaar |
| Data lokaal in IndexedDB | Geen wijziging aan het datamodel voor de interface-laag |

## 1. Algemene uitstraling → tokens en lagen

* **Drie lagen**: (1) een vaste achtergrondlaag met drie langzaam drijvende kleurvelden
  in accent-, paars- en groentint (40–60 s per cyclus, alleen `transform`), (2) de
  app-laag `#app` met glazen panelen, (3) zwevende lagen: bottom sheet, toast, burst.
* **Glas**: `header#top`, `nav#tabs`, `.card`, `.stat`, `.dagpaneel`, `.blad`, `#toast`,
  `#timerbalk`, `#bulkbalk` krijgen een halftransparante tint van hun bestaande kleur
  (`color-mix(... 70–85%, transparent)`), `backdrop-filter: blur()`, een 1px lichte
  rand en een glanslijn aan de bovenkant. Licht en donker thema gebruiken eigen
  rand-/glansvariabelen.
* **Kleur en typografie blijven wat ze zijn**. De accentkleur mag gloeien
  (`--rt-gloed`) op primaire knoppen, actieve tab en het lichtspoor.

## 2. Knoppen en interactie

| Element in FutureMe | Gedrag |
|---|---|
| `.knop`, `.icon-btn`, `.rijknop`, `.chip`, `.keuze`, `.segment button`, `nav#tabs button`, `.stat`, `.vink`, `.mini-vink` | Indrukken: `scale(.94–.985)` met verende curve; loslaten veert terug |
| Alle bovenstaande + `.knop3d` | Bij `pointerdown` ontstaat een zachte lichtgloed **op het aanraakpunt** (radiaal, 600 ms, geclipt op de knopvorm) |
| `.knop.primair`, `.tab-plus` | Zachte accentgloed als schaduw; lichtere gloed bij indrukken |
| `.knop3d` (startscherm) | Behoudt zijn 3D-druk; krijgt een lichtreflectie die bij indrukken over het paneel veegt |
| Knop → scherm | Een knop die naar een ander scherm leidt, is de **oorsprong** van de overgang (zie 3) |

## 3. Navigatie tussen pagina's (om `ga()`/`terug()`/`teken()` heen)

* Bij elke `pointerdown` wordt het dichtstbijzijnde kaart-/rij-/knop-element en zijn
  rechthoek onthouden.
* **Vooruit** (`ga` naar een dieper scherm): het oude scherm (een kloon van `#scherm`)
  zakt naar de achtergrond (`scale .94`, vervaging, opacity 0); het nieuwe scherm
  onthult zich met `clip-path: inset()` **vanuit de rechthoek van de aangetikte kaart**
  tot het volle scherm; een lichte "oorsprong-geest" groeit mee en lost op.
* **Terug**: het detailscherm **krimpt terug naar de kaart** waaruit het kwam
  (`inset()` naar de bewaarde rechthoek), terwijl het ouderscherm vanuit de diepte naar
  voren komt. De oorsprong-rechthoeken worden per navigatiestap op een stapel bewaard,
  parallel aan `V.stapel`.
* **Tabwissel**: dieptewissel met een lichte zijwaartse parallax in de richting van de
  tab-volgorde. De actieve tab in `nav#tabs` krijgt een lichtspoor dat als één lint van de
  oude naar de nieuwe tab glijdt (uitgerekt in het midden van de beweging).
* **Zelfde view, andere parameter** (bv. andere dag): zachte crossfade.
* **Herteken zonder navigatie** (afvinken, filter): géén schermovergang; wel de
  data-effecten uit §5.
* De koptekst (`#titel`, `#ondertitel`) is het gedeelde element: blijft op zijn plaats,
  alleen de tekst wisselt met een korte opkomst.
* Alle overgangen 300–460 ms, `cubic-bezier(.22,1,.36,1)`, nooit twee tegelijk;
  `mindmap` (canvas) krijgt geen snapshot/clip.

## 4. Diepte en lagen

* Bottom sheet open (`#blad.open`): `#app` schuift naar achteren
  (`scale(.965)`, `blur(5px)`, opacity .8), de overlay krijgt blur; het blad komt met een
  verende curve omhoog en zijn inhoud staggert per veld in (40 ms per veld).
* Het element dat het blad opende, blijft licht uitgelicht (oorsprong).
* Scroll: kaarten die onder de glazen koptekst verdwijnen, wijken licht terug
  (`scale`, opacity) — alleen `transform`/`opacity`, geen filters tijdens scrollen.
* Parallax: de achtergrondlaag beweegt mee met scrollen (5%) en met kantelen (Android
  automatisch; iOS via een knop in Instellingen die toestemming vraagt; muis op desktop).

## 5. Data en informatie (bij het openen van een scherm)

| Element | Effect |
|---|---|
| `.stat .getal`, `.dp-stat b`, `.bal3d`, `.ring > span`, `.hs-getal` | Tellen op van 0 naar de waarde (700 ms, ease-out), met behoud van Nederlandse opmaak (`1.234,50`, `%`, `€`) |
| Bij herteken zonder navigatie | Getallen tellen van hun **vorige** waarde naar de nieuwe; het element komt kort naar voren |
| `.ring` (conic-gradient met `--p`) | `@property --p` zodat de cirkel zich vloeibaar vult |
| `.balk > i` | Vult van 0 naar de breedte (800 ms) |
| `svg polyline/path` in Terugblik, Gezondheid, Side Hustle, HobbySkills | Tekenen zichzelf van links naar rechts (`stroke-dashoffset`) |
| `svg rect` (staafjes) | Groeien vanaf de basislijn, 28 ms na elkaar |
| Nieuwe `.taak`-regel na herteken | Zachte lichtpuls (1,3 s) voordat hij "op zijn plaats valt" |
| Lijsten na navigatie | Kinderen van `#scherm` en de eerste rijen van kaarten komen gestaffeld op (32 / 24 ms) |

## 6. Micro-interacties

* `.toggle`: de knop beweegt met een veer, rekt uit bij indrukken, gloeit groen als hij aan staat.
* `.vink`: het vinkje wordt getekend als een penseelstreek (`stroke-dashoffset`), de cirkel
  pop-t; bij afronden een korte lichtexplosie (ring + 10 deeltjes) vanuit het vinkje.
* Foutmelding: toasts met "mislukt / ongeldig / vul …" trillen kort en krijgen een rode gloed.
* Toast komt uit de diepte (schaal + blur → scherp).
* Uitklappen van subtaken (`.uitklap`) ontvouwt vanaf de bovenkant.
* Veegacties tonen de onderliggende actie al (bestaand gedrag, behouden).

## 7. Harde grenzen (acceptatiecriteria)

1. Geen enkele bestaande functie, handler of opslagstructuur wordt vervangen; alleen
   ingepakt (`ga`, `terug`, `teken`, `toast`, `pasInstellingenToe`, `vwInstellingen`).
2. Uit met één schakelaar (Instellingen → Weergave → "Ruimtelijke interface"), automatisch
   uit bij prikkelarme modus en `prefers-reduced-motion`.
3. Tekstcontrast en -grootte ongewijzigd; alle tekst blijft op ondoorzichtig genoeg glas.
4. Geen `filter` tijdens scrollen; `backdrop-filter` alleen op panelen, niet op rijen.
5. Elke animatie heeft een oorsprong en bestemming die de gebruiker kan aanwijzen
   (kaart → scherm, scherm → kaart, tab → tab, vinkje → explosie, 0 → waarde).
6. Maximaal ~450 ms per overgang; het scherm is direct bedienbaar (animaties blokkeren niets).
7. Werkt in Safari 16.4+, Chrome/Edge 111+, Firefox 128+ (`@property`, `color-mix`, WAAPI).

---

## De compacte prompt (klaar om te gebruiken)

> Geef FutureMe (één-bestands PWA, vanilla JS, Nederlandstalig, rendermodel
> `teken()`/`ga()`/`terug()`/`bladOpen()`) een premium, ruimtelijke interface als
> **losse laag** (één `<style>`- en één `<script>`-blok, geen externe bronnen, geen
> wijziging van views of datamodel). Actief via de nieuwe instelling "Ruimtelijke
> interface" (standaard aan), uit bij prikkelarme modus en `prefers-reduced-motion`.
>
> **Lagen & glas.** Vaste achtergrond met drie langzaam drijvende kleurvelden in accent/paars/groen.
> `header#top`, `nav#tabs`, `.card`, `.stat`, `.dagpaneel`, `.blad`, `#toast` als glas:
> halftransparante tint van hun eigen kleur, `backdrop-filter`, 1px lichte rand, glanslijn.
> Kleuren en typografie ongewijzigd.
>
> **Knoppen.** Indrukken = verend `scale(.94–.985)`; lichtgloed vanuit het aanraakpunt
> (600 ms, geclipt op de knop); primaire knoppen en de "+"-tab gloeien in de accentkleur;
> `.knop3d` houdt zijn 3D-druk en krijgt een lichtveeg.
>
> **Navigatie.** Onthoud bij `pointerdown` de aangetikte kaart/rij. Vooruit: oude scherm
> (kloon van `#scherm`) zakt naar achteren (scale .94, blur, fade); nieuwe scherm onthult zich
> met `clip-path: inset()` vanuit de kaart naar vol scherm, met een meegroeiende
> oorsprong-geest. Terug: het detail krimpt terug naar precies die kaart (stapel van
> rechthoeken naast `V.stapel`), het ouderscherm komt uit de diepte. Tabs: dieptewissel met
> zijwaartse parallax en een lichtspoor dat als lint onder de tabs glijdt. Zelfde view:
> crossfade. Herteken zonder navigatie: geen schermovergang. Koptekst blijft staan, alleen
> de tekst wisselt. 300–460 ms, `cubic-bezier(.22,1,.36,1)`. Mindmap uitgezonderd.
>
> **Diepte.** Blad open: `#app` scale .965 + blur 5px + dim; blad veert omhoog; velden
> staggeren 40 ms. Kaarten die onder de koptekst schuiven wijken licht terug (alleen
> transform/opacity). Achtergrond parallax bij scrollen en kantelen (iOS via
> toestemmingsknop in Instellingen).
>
> **Data.** Bij openen: `.stat .getal`, `.dp-stat b`, `.bal3d`, `.ring > span` tellen op
> van 0 (700 ms, Nederlandse opmaak behouden); `.ring` vult vloeibaar via `@property --p`;
> `.balk > i` groeit; `svg polyline/path` tekenen zichzelf; `svg rect` groeien vanaf de
> basis; lijsten staggeren op. Bij herteken: getallen vloeien van oude naar nieuwe waarde;
> nieuwe `.taak`-regels pulsen kort.
>
> **Micro.** `.toggle` als fysiek onderdeel (veer, uitrekken, groene gloed). `.vink` als
> penseelstreek + lichtexplosie bij afronden. Fout-toasts trillen met rode gloed. Toast uit de
> diepte. `.uitklap` ontvouwt.
>
> **Grenzen.** Alles inpakken, niets vervangen; 60 fps op iPhone; geen `filter` tijdens
> scrollen; elke beweging heeft aanwijsbare oorsprong en bestemming; ≤ 450 ms; tekst altijd
> leesbaar. Safari 16.4+, Chrome 111+, Firefox 128+.

---

## Uitbreidingen die in dezelfde bouw zijn meegenomen

Naast de interface-laag bevat `ruimtelijk/index.html`:

* **HobbySkills** (hobby's die je doet of wilt gaan doen, skills die je wilt
  ontwikkelen), bereikbaar via Nieuw, Meer, Persoonlijk en het dagoverzicht, niet in de onderbalk: sessies loggen met minuten en beoordeling, weekdoel, geplande dagen,
  niveau (skills), mijlpalen die je als taak kunt inplannen, bronnen, 12-weken-grafiek,
  streaks, dagoverzicht-widget, koppelingen naar Terugblik, Zoeken, Logboek en Persoonlijk.
* **Logischere koppelingen** tussen schermen: elk scherm eindigt met "Verder naar"
  (2–4 verwante schermen), het Meer-scherm is gegroepeerd in thema's, het startscherm en
  de Persoonlijk-hub verwijzen naar HobbySkills, Terugblik en Zoeken nemen HobbySkills mee.
* **Filterbalken blijven staan**: een horizontaal gescrolde balk (tijdlijnfilters, logboek,
  afspraken …) houdt zijn positie als je een filter aan- of uitzet.
* **Checklist-sjablonen** per soort hobby of skill (muziek, taal, sport, beeldend, foto en
  video, schrijven, tech, koken, ambacht, tuin, denksport, mindfulness, algemeen), in vier
  fasen: Starten, Oefenen, Verdiepen, Delen. Een skill krijgt extra punten om voortgang te
  meten, een hobby punten voor plezier en ritme. De app raadt de soort uit naam en icoon.
* **Als mindmap**: een hobby, skill of side hustle wordt met één tik een mindmap. De kern
  linkt terug naar het origineel. Hoofdtakken: checklist (per fase of categorie, als
  afvinkbare stappen), doelen en mijlpalen, voortgang, bronnen en ideeën; bij een side hustle
  ook de 5 pijlers, het werkbord, experimenten, klanten en geld en tijd. Afvinken loopt in
  twee richtingen gelijk met de app. "Bijwerken" voegt later nieuwe punten toe zonder eigen
  nodes of indeling te wijzigen. Ingangen: HobbySkills-detail, de Side Hustle-werkruimte,
  het snelmenu van een side hustle en het importblad van de mindmap.
