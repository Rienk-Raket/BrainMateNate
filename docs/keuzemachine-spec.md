# Keuzemachine — product- en designspecificatie (FutureMe)

Sep 27, 2026 · @Kas

## Samenvatting

De Keuzemachine is een nieuwe FutureMe-module die je helpt een A/B-keuze af te ronden in minuten in plaats van dagen. Hij kent jouw uitstelprofiel (25 vragen, één keer) en stuurt op het moment vóór de keuze: een tijdsbudget, 'goed genoeg'-criteria, drie snelle checks en een concreet advies. De uitkomst rolt uit een lopende band: jouw valkuil voor deze keuze, handvatten, tips en een kort 'Als ik jou was'-advies met reden.

**Doelen**

1. Een keuze gaat van invoer tot besluit in maximaal 3 minuten voor alledaagse keuzes.
2. Het advies past bij het profiel: dezelfde keuze geeft een ander handvat voor een 'Speurder' dan voor een 'Beschermer'.
3. De gebruiker bouwt bewijs op dat twijfel achteraf meevalt (nazorgvraag na 2 dagen).
4. Alles werkt offline en blijft op het toestel, zoals de rest van FutureMe.

**Niet-doelen**

- Geen diagnose en geen screening op ADHD, autisme of andere aandoeningen. De test meet uitstelroutes, geen stoornissen.
- Geen keuzes met meer dan twee opties in versie 1.
- Geen advies bij crisis, gezondheid of andere keuzes met hoge risico's; daar verwijst de module door.

**Succescriteria (na 4 weken gebruik)**

- Minstens 70% van de ingevoerde dilemma's krijgt een besluit binnen het tijdsbudget.
- Gemiddelde twijfel bij de nazorgvraag ligt lager dan de verwachte twijfel bij invoer.
- Nul keer verlies van gegevens bij update, back-up of herstel.

## Uitgangssituatie: waar de module inhaakt

FutureMe is één zelfstandig HTML-bestand (ca. 1,4 MB, 21.700 regels) zonder externe bronnen. Nieuwe modules worden als eigen `<script>`-blok toegevoegd en haken in op bestaande patronen; de Keuzemachine volgt precies het patroon van HobbySkills (sectie 51) en Wishlist (sectie 60).

| Inhaakpunt | Bestaand patroon in index.html | Wat de Keuzemachine doet |
| --- | --- | --- |
| Opslag | `WINKELS` + `S`, IndexedDB `futureme`, `DB_VERSIE = 9` (sectie 3) | Voegt `km_profielen` en `km_dilemmas` toe en verhoogt `DB_VERSIE` naar 10 |
| Schrijven | `bewaar()`, `verwijder()`, `zetInst()` / `inst()` | Alleen via deze functies, nooit direct naar IndexedDB |
| Schermtitels | `Object.defineProperty(KOPPEN, …)` (sectie 51) | Koppen voor `keuze`, `keuzetest`, `keuzedilemma`, `keuzetheorie` |
| Routering | view-map in `teken()` met `typeof`-guards | Vier nieuwe views toevoegen aan die map |
| Meer-menu | `vwMeer` omwikkelen (sectie 60) | Kaart 'Keuzemachine' en 'Keuzetheorie' in groep 'Doen en groeien' |
| Tikacties | `document.addEventListener("click")` met eigen prefix (`hs-`) | Eigen prefix `km-` |
| Bladen en meldingen | `bladOpen()`, `toast()` | Voor vragen, bevestigingen en de munt-test |
| Taken | `maakTaakUitTekst()` | 'Zet een deadline' maakt een gewone FutureMe-taak |
| Verder naar | `VERWANT` / `VERWANT_ICO` | Koppeling Keuzemachine ⇄ Keuzetheorie |
| Lessen | `SH_LESSEN` + `vwShLes` (sectie 54) | Voorbeeld voor de theoriepagina als data-constante |

**Aandachtspunt opslag.** Nieuwe winkels ontstaan alleen in `onupgradeneeded`, dus alleen bij een hogere `DB_VERSIE`. Zonder verhoging falen `idbAlles()` en `bewaar()` stil op toestellen die al op versie 9 staan. Verhoog daarom naar 10 en test een upgrade vanaf een bestaande v9-database.

**Aandachtspunt back-up.** Controleer of de export (sectie 17, rond regel 6187) alle `WINKELS` meeneemt. Een eventuele API-sleutel voor de AI-laag mag nooit in de back-up of export terechtkomen.

## Gebruikersflows

De uitsteltest komt één keer vóór het eerste dilemma; daarna begint elke keuze direct bij het invoerscherm.

&#91;embedded content: gebruikersflow Keuzemachine · 2 beslismomenten, 1 lus\]

Wie 'nog niet' kiest, krijgt een deadline als FutureMe-taak en kan het dilemma later opnieuw door de machine halen.

**Tijdsbudget per flow**

| Flow | Stappen | Doel |
| --- | --- | --- |
| Eerste keer | Intro (1 scherm) → 25 vragen → profielkaart | Onder 5 minuten, onderbreken en hervatten kan |
| Alledaagse keuze | Invoer → checks → band → besluit | Onder 3 minuten |
| Grote keuze | Invoer → checks → band → deadline → later besluit | Besluit vóór de zelfgekozen deadline |
| Terugkijken | Keuzemachine → 'Mijn keuzes' → dilemma | Uitkomst, besluit en nazorg in één kaart |
| Test opnieuw | Profielkaart → 'Test opnieuw doen' | Aangeboden na 90 dagen, altijd handmatig mogelijk |

## Uitsteltest: 25 vragen, 7 routes

De test meet welke van zeven uitstelroutes bij de gebruiker het sterkst speelt en slaat een primaire en eventueel secundaire route op. De routes komen uit het literatuuronderzoek (Sirois & Pychyl 2013, Steel 2007, Sirois e.a. 2017, Appel & Gerlach 2025, Kinnaird e.a. 2019). Elk type krijgt een speelse naam, zodat het resultaat als een personage voelt en niet als een label.

| Route | Type in de app | Kern | Eerste handvat |
| --- | --- | --- | --- |
| A | De Beschermer | Uitstel beschermt tegen het oordeel van anderen | Privé-versie-test: wat kies je als niemand het ziet? |
| B | De Speurder | Blijft zoeken naar iets beters | Max. 3 opties en vooraf 'goed genoeg'-criteria |
| C | De Zekerzoeker | Wil zekerheid die er niet is | Informatiebudget, daarna kiezen met restrisico |
| D | De Motor-zonder-startknop | Weet het wel, komt niet op gang | Eerste stap van 2 minuten, timer, iemand erbij |
| E | De Deadline-sprinter | Kiest pas als de klok dwingt | Zelfgekozen deadline die iemand anders kent |
| F | De Kompaszoeker | Weet niet goed wat hij wil | Munt-test en kiezen op waarden in plaats van zin |
| G | De Batterijbewaker | Kiest slechter als hij moe of overprikkeld is | Belangrijke keuzes op een rustig moment plannen |

### Vragen 1 tot en met 18: stellingen

Antwoordschaal: Nooit (0) · Soms (1) · Vaak (2) · Bijna altijd (3). Elke stelling telt voor één route.

| Nr | Stelling | Route |
| --- | --- | --- |
| 1 | Ik stel een keuze uit omdat ik bang ben wat anderen ervan vinden. | A |
| 2 | Keuzes die anderen zien (kleding, cadeau, bericht) vind ik zwaarder dan keuzes die niemand ziet. | A |
| 3 | Als iemand zegt 'goeie keuze', durf ik veel sneller te beslissen. | A |
| 4 | Ik blijf zoeken naar een betere optie, ook als ik al een goede heb. | B |
| 5 | Ik lees meer reviews en vergelijkingen dan eigenlijk nodig is. | B |
| 6 | Als ik maar uit twee opties mocht kiezen, ging het me makkelijker af. | B |
| 7 | Ik wil zeker weten dat het goed afloopt voordat ik kies. | C |
| 8 | Moeilijk terug te draaien keuzes stel ik veel langer uit dan kleine. | C |
| 9 | Onzekerheid voelt lichamelijk onprettig, bijvoorbeeld onrustig of gespannen. | C |
| 10 | Ik stel ook taken uit waarbij niets te kiezen valt, zoals administratie of de afwas. | D |
| 11 | Ik weet wat ik wil kiezen, maar kom niet in actie. | D |
| 12 | Dit uitstellen herken ik al van vroeger, van school of huiswerk. | D |
| 13 | Ik kies pas echt als er een deadline aankomt. | E |
| 14 | Deadlines die ik mezelf stel, laat ik gemakkelijk schieten. | E |
| 15 | Als iemand vraagt 'waar heb je zin in?', weet ik het echt niet. | F |
| 16 | Ik merk pas later wat ik eigenlijk voelde bij een keuze. | F |
| 17 | Aan het eind van de dag of na drukte lukt kiezen veel slechter. | G |
| 18 | Veel prikkels (geluid, mensen, schermen) maken kiezen zwaarder. | G |

### Vragen 19 tot en met 25: situaties

Eén antwoord kiezen. Een antwoord geeft 3 punten aan de genoemde route; bij twee routes krijgt elk 2 punten. Een antwoord zonder route geeft 0 punten.

| Nr | Situatie | a | b | c | d |
| --- | --- | --- | --- | --- | --- |
| 19 | Je moet een nieuwe koptelefoon kiezen. Wat gebeurt er meestal? | Ik vergelijk dagenlang (B) | Ik vraag me af wat anderen ervan vinden (A) | Ik wacht tot de oude kapot is (E) | Ik weet niet eens welke ik mooi vind (F) |
| 20 | Vrijdagavond: wat eet je? | Geen idee waar ik zin in heb (F) | Te moe om te kiezen (G) | Ik scrol door menu's tot ik de beste heb (B) | Ik kies snel iets (geen route) |
| 21 | Je hebt gekozen. Daarna… | Blijf ik vergelijken en twijfelen (B + C) | Check ik hoe anderen reageren (A) | Twijfel ik even, dat gaat over (geen route) | Ben ik vooral opgelucht dat het klaar is (E) |
| 22 | Wat helpt jou het meest om eindelijk te kiezen? | Iemand die zegt dat het prima is (A) | Minder opties (B) | Meer informatie en zekerheid (C) | Een timer, spelletje of iemand erbij (D) |
| 23 | Hoe voelt vastzitten meestal? | Spanning of schaamte (A) | Verveling, ik kom niet op gang (D) | Overweldigd, het is te veel (G) | Leeg, ik weet niet wat ik wil (F) |
| 24 | Een keuze met een deadline over 3 weken. Wanneer begin je? | Meteen, maar ik rond pas op het eind af (B) | De laatste dagen (E) | Ik vergeet het tot het bijna te laat is (D) | Ik begin, raak overweldigd en leg het weg (G) |
| 25 | Wat zeg je het vaakst tegen jezelf? | 'Wat zullen ze denken?' (A) | 'Er is vast iets beters.' (B) | 'Wat als het misgaat?' (C) | 'Ik doe het straks wel.' (D + E) |

### Scoring

1. Tel per route de punten en deel door het maximum van die route. Bereken dat maximum in code uit de vragenlijst zelf, zodat een aangepaste vraag de normalisatie niet breekt. Resultaat: een score van 0 tot 100 per route.
2. **Primair** = hoogste score. Bij gelijke stand wint de route met de meeste punten uit vragen 19 tot en met 25.
3. **Secundair** = tweede score, alleen als die minstens 50 is en minstens 70% van de primaire score.
4. **Gemengd profiel** als de drie hoogste scores binnen 10 punten liggen. De profielkaart toont dan drie routes met gelijke nadruk.
5. **Laag profiel** als alle scores onder 30 liggen: 'Uitstel speelt bij jou weinig. De machine helpt vooral met snel afronden.'

### Signalen buiten de routes

Deze signalen stellen geen diagnose. Ze tonen hooguit één rustige zin onder de profielkaart met een link naar de theoriepagina.

- **Breedte-signaal**: vraag 10 en 12 allebei 2 of hoger. Tekst: 'Je stelt ook dingen uit waar niets te kiezen valt, en dat herken je van vroeger. Speelt dit op meerdere terreinen en zit het je in de weg, dan kan een gesprek met je huisarts helpen.'
- **Kompas-signaal**: vraag 15 en 16 allebei 2 of hoger. Verwijst naar de theorie over het herkennen van voorkeuren.

### Profielkaart

- Type-naam en illustratie van de primaire route, plus de secundaire route als badge.
- Een staafje per route (0 tot 100) in de volgorde A tot G, zodat vergelijken tussen testen makkelijk is.
- Drie zinnen uitleg in gewone taal: wat er gebeurt, waarom, en het eerste handvat.
- Knoppen: 'Naar de Keuzemachine', 'Lees de theorie', 'Test opnieuw doen'.
- Onderaan altijd: 'Dit is een zelftest over uitstelgewoonten, geen diagnose.'

### Gedrag van de test

- Eén vraag per scherm, voortgangsbalk '7 van 25', vorige-knop, automatisch door na het kiezen van een antwoord.
- Antwoorden worden per vraag bewaard; wie de app sluit, hervat bij de volgende open vraag.
- Elke afgeronde test is een nieuw record. De module gebruikt altijd het nieuwste profiel; oudere blijven zichtbaar als verloop.

## Beslismotor

De motor combineert drie bronnen: wat de gebruiker over het dilemma invult, het nieuwste profiel en de kennis uit de theoriepagina. Hij draait standaard volledig lokaal en deterministisch: dezelfde invoer geeft altijd dezelfde uitkomst. Een optionele AI-laag (zie Techniek) mag alleen de teksten verrijken, nooit de veiligheidsregels overslaan.

### Invoer

| Veld | Type | Verplicht | Doel |
| --- | --- | --- | --- |
| Optie A, optie B | tekst, max. 80 tekens + notitie max. 300 | ja | De twee kanten van het dilemma |
| Inzet | klein · middel · groot | ja (standaard klein) | Bepaalt het tijdsbudget |
| Omkeerbaar | ja · deels · nee | ja (standaard ja) | Omkeerbare keuzes verdienen weinig tijd |
| Deadline | datum of geen | nee | Voor route E en voor de taak |
| Zichtbaar voor anderen | ja · nee | nee | Voor route A |
| Check 1: trek | schuif van 'sterk A' tot 'sterk B' (−2 tot +2) | ja | Het onderbuikgevoel |
| Check 2: privé-keuze | A · B · weet niet | ja | 'Wat kies je als niemand het ooit weet?' |
| Check 3: terugdraaien | A makkelijker · B makkelijker · gelijk | ja | Welke kant laat meer deuren open |

### Stations op de band (ook de volgorde van de analyse)

1. **Weegschaal**: leest inzet en omkeerbaarheid en zet het tijdsbudget.
2. **Valkuil-scanner**: koppelt de primaire en secundaire route aan kenmerken van dit dilemma, bijvoorbeeld route A plus 'zichtbaar = ja'.
3. **Kompas**: combineert de drie checks tot een voorkeur voor A of B.
4. **Advieskamer**: stelt de uitkomstkaart samen uit handvatten, tips en het advies.

### Tijdsbudget

| Inzet | Omkeerbaar ja | Omkeerbaar deels | Omkeerbaar nee |
| --- | --- | --- | --- |
| Klein | 2 minuten | 5 minuten | 15 minuten |
| Middel | 15 minuten | 1 uur | 1 dag |
| Groot | 1 dag | 3 dagen | 1 week, met vaste denkmomenten |

Een gebruikersdeadline die eerder valt dan het budget wint altijd.

### Uitkomstkaart

1. **Kern** in één zin: 'Een kleine, omkeerbare keuze. Je budget is 2 minuten.'
2. **Jouw valkuil hier**: één zin uit de tekstbank van de primaire route, aangevuld als het dilemma die route versterkt.
3. **Handvatten**: precies drie stappen. Twee uit de primaire route, één uit de secundaire (of een algemene als die ontbreekt).
4. **Tips**: twee korte tips, elk met een 'Waarom?'-link naar de juiste plek op de theoriepagina.
5. **Als ik jou was**: A of B, met een reden van maximaal drie zinnen.
6. **Acties**: 'Ik kies A', 'Ik kies B', 'Munt-test', 'Nog niet: zet een deadline'.

### Regels voor 'Als ik jou was'

De motor telt punten voor A en B. Positief = A, negatief = B.

| Signaal | Gewicht | Waarom |
| --- | --- | --- |
| Privé-keuze A of B | ±3 | Haalt het oordeel van anderen weg; sterkste signaal |
| Trek −2 tot +2 | ×1 (A-kant positief) | Het onderbuikgevoel telt, maar niet alleen |
| Terugdraaien: één kant makkelijker | ±1 | Bij twijfel de kant die deuren openhoudt |
| Route B primair en beide opties voldoen | trek ×2 | Een Speurder heeft een stopregel nodig, geen extra analyse |
| Route A primair en zichtbaar = ja | privé-keuze ×1,5 | Juist hier telt de privé-test het zwaarst |

- Uitkomst groter dan 0: A; kleiner dan 0: B.
- Uitkomst 0: de motor kiest de optie die makkelijker terug te draaien is. Is ook dat gelijk, dan zegt hij eerlijk dat beide goed genoeg zijn en biedt de munt-test aan: 'Let op je eerste reactie als de munt valt.'
- De reden is opgebouwd uit de twee zwaarste signalen, bijvoorbeeld: 'Als niemand het ooit zou weten, kies je B. En B kun je later nog terugdraaien. Dat maakt B voor jou de rustigste keuze.'
- Toon: vriendelijk, direct, in de jij-vorm, nooit dwingend. Onder het advies staat altijd: 'Jij beslist. Dit is een zetje, geen opdracht.'

### Tekstbank per route (voorbeelden)

| Route | Valkuil-zin | Handvat 1 | Handvat 2 | Tip |
| --- | --- | --- | --- | --- |
| A | 'Je stelt uit omdat anderen kunnen meekijken.' | Doe de privé-versie-test en noteer je antwoord | Vraag jezelf: wie beoordeelt dit echt, en hoe erg is dat? | Eén keer 'gewoon' kiezen en het laten zien, is oefenen |
| B | 'Je zoekt verder terwijl je al iets goeds hebt.' | Schrijf 3 'goed genoeg'-criteria op | De eerste optie die aan alle drie voldoet, wint | Stop met reviews lezen na 3 stuks |
| C | 'Je wacht op zekerheid die er niet komt.' | Stel een informatiebudget: wat wil je nog weten, max. 3 dingen | Kies daarna met het restrisico erbij | Noteer wat er in het slechtste geval gebeurt, en wat je dan doet |
| D | 'Je weet het wel, maar de start hapert.' | Zet een timer op 2 minuten en doe alleen stap één | Vraag iemand erbij, ook online | Beloon jezelf direct na het kiezen |
| E | 'Je wacht tot de klok beslist.' | Zet nu een deadline die iemand anders kent | Plan het besluit als afspraak | Een deadline van buiten werkt beter dan een eigen voornemen |
| F | 'Je weet niet goed wat je wilt.' | Doe de munt-test en let op je eerste reactie | Kies op wat je belangrijk vindt, niet op zin | Maak vaste standaardkeuzes voor terugkerende dingen |
| G | 'Je kiest nu met een lege batterij.' | Is dit een grote keuze? Plan hem voor morgenochtend | Kleine keuze? Neem de standaardoptie | Minder prikkels tijdens het kiezen: scherm weg, rustige plek |

De tekstbank staat als data-constante in de module, zodat teksten zonder codewijziging te verbeteren zijn.

### Veiligheidsregels

- **Gevoelige onderwerpen**: bevat A, B of een notitie woorden rond zelfbeschadiging, zelfmoord, geweld, medicatie of een medische behandeling, dan geeft de module geen advies en geen 'Als ik jou was'. Hij toont alleen een rustige kaart met hulp: 113 Zelfmoordpreventie (0800-0113 of 113.nl), de huisarts, of 112 bij direct gevaar. De woordlijst staat als data-constante en is uitbreidbaar.
- **Geld, recht, gezondheid**: bij deze onderwerpen blijft het advies beschikbaar, maar met één extra zin: 'Laat dit ook checken door iemand met verstand van zaken.'
- **Geen diagnose-taal**: de module gebruikt nooit woorden als ADHD, autisme of stoornis in uitkomstkaarten. Die staan alleen op de theoriepagina.

## Theoriepagina: Keuzetheorie

De theoriepagina is een eigen view `keuzetheorie`, bereikbaar via Meer → Doen en groeien → Keuzetheorie en via elke 'Waarom?'-link op een uitkomstkaart. De inhoud staat als data-constante `KM_THEORIE` in de module, net als `SH_LESSEN` in sectie 54. Bron voor alle teksten: het rapport 'Keuzes maken, uitstel en neurodiversiteit' uit dit gesprek.

| Id | Hoofdstuk | Inhoud | Leestijd |
| --- | --- | --- | --- |
| `waarom` | Waarom kiezen moeilijk is | Maximizing, keuze-overload, verwachte spijt, vermoeidheid; wat stevig bewezen is en wat niet | 4 min |
| `uitstel` | Waar uitstel vandaan komt | Uitstel als stemmingsherstel, deadlines, perfectionistische zorgen tegenover streven | 4 min |
| `route-a` t/m `route-g` | De zeven routes | Per route: kern, signalen, hoe je hem herkent, wat helpt, één bron | 2 min elk |
| `handvatten` | Wat helpt bij kiezen | Goed-genoeg-criteria, als-dan-plannen, tijdsbudget, max. 3 opties, standaardkeuzes, omkeerbaarheid | 5 min |
| `experimenten` | Zes korte experimenten | Privé-versie, twee-opties, informatie-stop, keuzeloze taak, munt-test, tijdstip | 3 min |
| `dagboek` | Beslisdagboek | Het 14-dagenformat en de scoringsleutel | 3 min |
| `bewijs` | Hoe sterk is het bewijs | Tabel stevig, gemengd en zwak, inclusief ego depletion, RSD en 'interest-based nervous system' | 3 min |
| `grijs` | Neurodiversiteit en grijze gebieden | ADHD, autisme, AuDHD, alexithymie, hoogsensitiviteit; nadrukkelijk zonder diagnose | 5 min |
| `hulp` | Wanneer hulp zinvol is | Signalen, route via huisarts en POH-GGZ, wat je meeneemt | 2 min |
| `bronnen` | Bronnen | Lijst van de gebruikte studies met jaartal en tijdschrift | — |

**Opbouw per hoofdstuk**: titel, leestijd, drie tot vijf korte alinea's, een kader 'Probeer dit' met één actie in de app (bijvoorbeeld 'Open de Keuzemachine' of 'Doe de munt-test'), en onderaan de bron.

**Gelezen-status**: een vinkje per hoofdstuk, opgeslagen in `instellingen` onder `km_gelezen`. Het profiel markeert de hoofdstukken van de eigen routes met 'Voor jou'.

**Toon**: gewone taal, korte zinnen, geen jargon zonder uitleg. Onzekerheid in het onderzoek wordt benoemd, niet weggepoetst.

## UI- en interactieontwerp

De Keuzemachine moet voelen als een speelse machine binnen de rustige FutureMe-stijl: dezelfde kaarten, radii, knoppen en kleurtokens, met één opvallend moment, de lopende band. Alles is gebouwd met HTML, CSS en inline SVG; geen bibliotheken, geen externe afbeeldingen of fonts.

### Schermen

| View | Titel (KOPPEN) | Inhoud |
| --- | --- | --- |
| `keuze` | Keuzemachine · '3 keuzes deze week' | Profielkaartje bovenaan, grote knop 'Nieuw dilemma', lijst 'Open' en 'Besloten', XP-balk |
| `keuzetest` | Uitsteltest · '7 van 25' | Eén vraag per scherm, grote antwoordknoppen, voortgangsbalk |
| `keuzedilemma` | titel van het dilemma | Invoer, checks, band, uitkomstkaart en besluit in één doorlopend scherm |
| `keuzetheorie` | Keuzetheorie · 'Waarom kiezen lastig is' | Hoofdstukkenlijst en leesweergave |

### Invoerscherm: A tegenover B

- Twee kaarten naast elkaar (onder 360 px breed: onder elkaar), met een grote letter A en B in een badge. A gebruikt `--accent`, B gebruikt `--purple`.
- Tussen de kaarten een ronde 'VS'-badge. Leeg veld = placeholder 'Bijvoorbeeld: nieuwe laptop nu kopen'.
- Daaronder drie rijen segmentknoppen voor inzet, omkeerbaar en zichtbaar, plus een optionele datum.
- Na 'Verder' schuiven de drie checks één voor één in beeld. De trek-schuif heeft vijf vaste standen met 44 px tikvlakken.
- Hoofdknop onderaan: 'Stop ze in de machine' in de bestaande `knop3d`-stijl.

### De lopende band

| Tijd | Wat de gebruiker ziet | Aria-live-tekst |
| --- | --- | --- |
| 0,0 – 0,6 s | Kaart A en B krimpen tot blokjes en landen op de band links | 'Je keuzes gaan de machine in' |
| 0,6 – 1,4 s | Band loopt, rollers draaien, blokjes rijden de machine in | — |
| 1,4 – 2,0 s | Station 1 Weegschaal licht op, lampje groen | 'Tijdsbudget bepaald' |
| 2,0 – 2,6 s | Station 2 Valkuil-scanner, scanlijn glijdt over de blokjes | 'Je valkuil herkend' |
| 2,6 – 3,2 s | Station 3 Kompas, naald zwaait en valt stil richting A of B | 'Je voorkeur gewogen' |
| 3,2 – 3,8 s | Station 4 Advieskamer, de machine schudt kort | 'Advies samengesteld' |
| 3,8 – 4,4 s | Rechts rolt een capsule uit, klikt open en wordt de uitkomstkaart | 'Je uitkomst is klaar' |

- **Machine**: één inline SVG van ca. 340 × 180, met de band als herhalend streeppatroon dat met `stroke-dashoffset` beweegt. Vier stations als ronde lampjes met een label eronder. Kleuren alleen via de bestaande tokens, zodat licht en donker vanzelf werken.
- **Animatie**: CSS keyframes op `transform` en `opacity`, aangestuurd door klassen die JavaScript per station zet. Geen layout-animaties, zodat het ook op oudere iPhones 60 fps haalt.
- **Overslaan**: tik op de machine of op 'Overslaan' springt direct naar de uitkomst.
- **Minder beweging**: bij `prefers-reduced-motion: reduce` geen band en geen schudden; de stations lichten in 0,8 s na elkaar op en de kaart verschijnt met een fade van 200 ms.
- **Haptiek**: `navigator.vibrate(12)` bij de klik van de capsule, alleen als de browser het ondersteunt. Geen geluid.
- **Tweede keer**: een dilemma dat opnieuw door de machine gaat, krijgt een versnelde band van 2 seconden.

### Munt-test

Een blad met een munt waarop A en B staan. Tik draait de munt 1,2 s met een 3D-flip (`rotateY`) en toont de uitkomst. Daarna twee knoppen: 'Opgelucht' en 'Teleurgesteld'. De reactie wordt bewaard en in de reden verwerkt: 'Je was teleurgesteld toen A viel. Dat zegt dat je eigenlijk B wilt.'

### Gamificatie

- **XP**: 10 voor een besluit, +10 als het binnen het tijdsbudget valt, +5 voor de nazorgvraag, +5 voor een gelezen theoriehoofdstuk. Bewaard in `instellingen` onder `km_xp`.
- **Levels**: Twijfelaar (0), Knopendoorhakker (100), Keuzekenner (300), Beslismeester (700), Kompasmeester (1500).
- **Badges**: 'Eerste knoop doorgehakt', '5 keer binnen budget', 'Munt-moedig' (munt-test gedaan en de uitkomst gevolgd), 'Goed-genoeg-held' (5 besluiten zonder terugdraaien), 'Spijt valt mee' (5 nazorgscores onder 3), 'Theorie-lezer' (alle hoofdstukken).
- **Beslisreeks**: aantal dagen achter elkaar met minstens één besluit, getoond als vlammetje zoals bij Gewoontes.
- **Geen straf**: XP gaat nooit omlaag, een reeks die breekt krijgt geen rode melding. Uitstellen mag; de module beloont alleen het afronden.

### Stijl en tokens

- Kaarten: `--card`, `--radius` (16 px), `--shadow`. Tekst: `--text`, `--muted`. Tikvlakken minimaal `--tap` (44 px).
- Accenten: A = `--accent`, B = `--purple`, budget-status = `--green` / `--amber`, veiligheidskaart = `--red-soft` met `--red`.
- Tekstgrootte schaalt mee met `--t`, zodat de instelling 'tekstgrootte' ook hier werkt.
- **Vermijden**: crème of gebroken witte achtergronden, cursieve accentwoorden in koppen, genummerde '01/02/03'-labels, monospace-labels, gradients en glow-effecten, confetti. De module moet lijken op de rest van FutureMe, niet op een losse AI-demo.

### Toegankelijkheid

- Alle knoppen zijn echte `<button>`-elementen met zichtbare focusring.
- De machine-SVG heeft `role='img'` en een `aria-label`; de voortgang loopt via één `aria-live='polite'`-regio.
- Contrast minimaal 4,5:1 in licht en donker thema.
- De test en het invoerscherm werken volledig met VoiceOver; de trek-schuif is een radiogroep met vijf opties.

## Datamodel en opslag

Twee nieuwe winkels met sleutel `id`, plus een paar sleutels in `instellingen`. `DB_VERSIE` gaat van 9 naar 10; bestaande gegevens blijven onaangeroerd.

**Winkel `km_profielen`** (één record per afgeronde test; ook een lopende test, met `klaar: false`)

```json
{
  "id": "uid()",
  "versie": 1,
  "gemaakt": "2026-09-27T10:12:00.000Z",
  "klaar": true,
  "antwoorden": [2, 1, 3, 0, "...25 waarden: 0-3 of 'a'-'d'"],
  "scores": { "A": 72, "B": 81, "C": 40, "D": 22, "E": 64, "F": 35, "G": 30 },
  "primair": "B",
  "secundair": "A",
  "soort": "normaal | gemengd | laag",
  "signalen": { "breedte": false, "kompas": false }
}
```

**Winkel `km_dilemmas`**

```json
{
  "id": "uid()",
  "gemaakt": "ISO", "bijgewerkt": "ISO",
  "status": "concept | open | besloten | geparkeerd",
  "a": { "titel": "Laptop nu kopen", "notitie": "" },
  "b": { "titel": "Wachten tot Black Friday", "notitie": "" },
  "context": { "inzet": "klein | middel | groot", "omkeerbaar": "ja | deels | nee", "deadline": "YYYY-MM-DD | null", "zichtbaar": false },
  "checks": { "trek": -1, "prive": "A | B | ?", "terug": "A | B | gelijk", "munt": { "viel": "A", "reactie": "opgelucht | teleurgesteld" } },
  "profielId": "id van het gebruikte profiel",
  "uitkomst": { "bron": "lokaal | ai", "advies": "A | B | gelijk", "reden": "...", "valkuil": "...", "handvatten": ["...", "...", "..."], "tips": [{ "tekst": "...", "theorie": "route-b" }], "budgetMin": 2, "veiligheid": "geen | disclaimer | geblokkeerd" },
  "besluit": { "keuze": "A | B | null", "op": "ISO", "binnenBudget": true, "taakId": "id van deadline-taak of null" },
  "nazorg": { "verwacht": 6, "score": 2, "op": "ISO" }
}
```

- `nazorg.verwacht` vraagt bij het besluit: 'Hoeveel twijfel verwacht je over 2 dagen? (0 tot 10)'. Na 2 dagen komt de echte vraag via de bestaande Inbox-meldingen (sectie 41). Het verschil voedt de badge 'Spijt valt mee' en de zin op de hoofdpagina: 'Je twijfel was gemiddeld 3 punten lager dan je verwachtte.'
- `profielId` legt vast met welk profiel het advies is gemaakt, zodat oude uitkomsten niet veranderen na een nieuwe test.

**Sleutels in `instellingen`**

| Sleutel | Waarde | In back-up |
| --- | --- | --- |
| `km_xp` | getal | ja |
| `km_badges` | lijst van badge-id's met datum | ja |
| `km_gelezen` | lijst van theorie-id's | ja |
| `km_ai` | `{ aan: false, model: "claude-opus-5-5" }` | ja |
| `km_sleutel` | API-sleutel voor de AI-laag | **nee**, altijd uitgesloten van export en back-up |

**Back-up en herstel**: beide winkels gaan mee in de gewone back-up. Een back-up uit versie 9 moet zonder fouten terug te zetten zijn in versie 10 (lege Keuzemachine). Wissen van alle gegevens (bestaande functie) wist ook de Keuzemachine en de sleutel.

## Techniek

De module is één nieuw `<script>`-blok, sectie 67 'Keuzemachine', geplaatst na sectie 66 en vóór de slotaanroep `start()`. De rekenkern bestaat uit pure functies zonder DOM of opslag, zodat ze los te testen zijn.

### Code-opbouw

| Onderdeel | Functie(s) | Verantwoordelijkheid |
| --- | --- | --- |
| Data | `KM_VRAGEN`, `KM_ROUTES`, `KM_TEKSTEN`, `KM_THEORIE`, `KM_GEVOELIG`, `KM_BADGES` | Alle inhoud als constanten, geen tekst verspreid door de code |
| Rekenkern | `kmScore(antwoorden)`, `kmBudget(context)`, `kmAdvies(dilemma, profiel)`, `kmVeiligheid(tekst)` | Puur en deterministisch; geeft objecten terug zoals in het datamodel |
| Opslag | `kmBewaarProfiel`, `kmBewaarDilemma` | Dunne laag over `bewaar()` |
| Views | `vwKeuze`, `vwKeuzeTest`, `vwKeuzeDilemma`, `vwKeuzeTheorie` | Geven HTML-strings terug, net als de rest van de app |
| Band | `kmSpeelBand(el, uitkomst)` | Zet stationklassen, respecteert reduced motion en overslaan |
| Acties | click-handler voor `data-act` met prefix `km-` | Eén `switch` zoals bij HobbySkills |
| Koppelingen | omwikkeling van `vwMeer`, `KOPPEN`, `VERWANT`, meldingen | Geen wijzigingen in bestaande functies behalve de view-map en `DB_VERSIE` |

### Optionele AI-laag

Standaard uit. De lokale motor is volledig bruikbaar zonder. Aanzetten kan in Instellingen → Keuzemachine, met een eigen API-sleutel.

- **Wat de AI mag doen**: de valkuil-zin, de drie handvatten, de tips en de reden bij 'Als ik jou was' herschrijven zodat ze beter bij de woorden van het dilemma passen. De keuze A of B blijft die van de lokale motor, tenzij de lokale motor 'gelijk' geeft.
- **Wat eerst gebeurt**: `kmVeiligheid()` draait altijd lokaal vóór een AI-aanroep. Een geblokkeerd dilemma wordt nooit verstuurd.
- **Wat wordt verstuurd**: alleen A, B, notities, context, checks en de routecodes plus scores. Geen namen van andere modules, geen taken, geen andere gegevens. Het instellingenscherm toont dit letterlijk voordat de gebruiker de laag aanzet.
- **Aanroep**: `POST https://api.anthropic.com/v1/messages` met de headers `x-api-key`, `anthropic-version` en `anthropic-dangerous-direct-browser-access: true`. Model instelbaar, standaard `claude-opus-5-5`. Zet de effort-parameter op `low`: dat houdt denktijd en kosten laag, betrouwbaarder dan een prompt-instructie. Zet `max_tokens` op minstens 16.000, omdat denktokens meetellen, ook als ze niet worden teruggegeven.
- **Antwoord lezen**: kies blokken op `type`, niet op positie. Het eerste blok kan een `thinking`-blok zijn. Verwacht alleen JSON in het `text`-blok volgens een vast schema; valideer het en val bij elke afwijking terug op de lokale teksten.
- **Systeemprompt**: kort, met het doel, het JSON-schema, de tekstbank als voorbeeldtoon en de regel 'geen diagnose-taal, geen medische of juridische claims'. Geen instructies als 'denk stap voor stap'. De dilemmatekst staat in een eigen blok `<dilemma>` en geldt als data, niet als instructie.
- **Time-out en fouten**: na 8 seconden of bij een fout toont de band gewoon de lokale uitkomst, met een klein label 'offline advies'. Een `stop_reason` van `refusal` geeft ook de lokale uitkomst.
- **Sleutel**: alleen in `instellingen.km_sleutel`, nooit in back-up, export, logboek of foutmeldingen. Knop 'Sleutel wissen' in de instellingen.

### Prestaties en offline

- Extra bestandsgrootte maximaal 90 kB, inclusief theorieteksten en de machine-SVG.
- Eerste weergave van `keuze` onder 50 ms op een iPhone 12 met 100 dilemma's in de lijst.
- Zonder netwerk werken alle functies behalve de AI-laag; de service worker hoeft niet te veranderen.
- Geen `localStorage` of `sessionStorage`; alles via de bestaande IndexedDB-laag.

## Acceptatiecriteria en verificatie

De module is af als alle criteria hieronder aantoonbaar slagen: met testuitvoer, schermafbeeldingen of een upgrade-log, niet met 'zou moeten werken'.

### Functioneel

- [ ] Meer toont 'Keuzemachine' en 'Keuzetheorie' in de groep 'Doen en groeien'.
- [ ] Zonder profiel opent de Keuzemachine de intro van de uitsteltest; met profiel direct het overzicht.
- [ ] De test bewaart elk antwoord direct en hervat na herladen bij de eerste open vraag.
- [ ] `kmScore` geeft de juiste primaire route voor 7 testprofielen (elk één route maximaal), plus de gevallen 'gemengd', 'laag' en een gelijke stand.
- [ ] `kmBudget` geeft alle 9 cellen van de budgettabel correct terug; een eerdere deadline wint.
- [ ] `kmAdvies` volgt de gewichtentabel; bij een stand van 0 wint de makkelijk terug te draaien optie, en anders 'gelijk' met de munt-test.
- [ ] `kmVeiligheid` blokkeert alle woorden uit `KM_GEVOELIG`; een geblokkeerd dilemma toont alleen de hulpkaart en wordt nooit naar de AI-laag gestuurd.
- [ ] 'Nog niet: zet een deadline' maakt een gewone taak die in Vandaag of Komend verschijnt.
- [ ] De nazorgvraag verschijnt 2 dagen na een besluit in de Inbox.
- [ ] XP, levels en badges kloppen na een reeks van 5 testdilemma's.

### Opslag en veiligheid

- [ ] Upgrade van een v9-database met bestaande taken, afspraken en HobbySkills naar v10: niets verdwijnt, beide nieuwe winkels bestaan.
- [ ] Back-up exporteren en in een schone browser terugzetten geeft dezelfde profielen en dilemma's.
- [ ] `km_sleutel` komt niet voor in de back-up-JSON (zoek letterlijk op de testsleutel).
- [ ] Geen fouten in de console bij het doorlopen van alle vier de views.

### Weergave

- [ ] Schermafbeeldingen op 390 × 844 en 360 × 740, in licht én donker thema, van: testvraag, profielkaart, invoer A/B, band halverwege, uitkomstkaart, theoriehoofdstuk.
- [ ] De band speelt in ongeveer 4,4 s, is over te slaan, en toont bij reduced motion geen beweging.
- [ ] Alle tikvlakken zijn minimaal 44 × 44 px; contrast minimaal 4,5:1.
- [ ] De module oogt als FutureMe: geen van de stijlen uit de lijst 'Vermijden' komt voor.

### Verificatieplan voor de bouw

| Controle | Hoe | Bewijs |
| --- | --- | --- |
| Rekenkern | Node-script `tests/keuzemachine.test.mjs` dat de pure functies uit het bestand haalt en fixtures draait | Uitvoer met alle tests groen |
| Upgrade | Playwright: laad een v9-kopie met testgegevens, open de nieuwe versie, lees de winkels uit | Log met aantallen per winkel voor en na |
| Flows | Playwright op mobiel formaat: test invullen, dilemma, band, besluit, deadline | Schermafbeeldingen per stap |
| Onafhankelijke review | Subagent in schone context vergelijkt de diff met dit document | Lijst met gaten die correctheid of eisen raken |

## Buiten scope en open beslissingen

**Buiten scope voor versie 1**

- Keuzes met drie of meer opties, en wegen met eigen criteria per optie.
- Het 14-dagen beslisdagboek als invoerscherm; in versie 1 staat het alleen als uitleg op de theoriepagina.
- Delen van een dilemma met anderen, of meldingen buiten de app (FutureMe meldt alleen terwijl de app open is).
- Synchronisatie tussen toestellen.

**Open beslissingen**

- [ ] Blijft de AI-laag in versie 1, of komt hij pas in versie 1.1 na een week gebruik van de lokale motor?
- [ ] Standaardmodel voor de AI-laag: `claude-opus-5-5` op effort `low`, of een goedkoper model voor snellere antwoorden?
- [ ] Tegel voor de Keuzemachine ook op het Nieuw-scherm naast HobbySkills, of alleen via Meer?
- [ ] Termijn voor het aanbod 'Test opnieuw doen': 90 dagen, of eerder na 20 besluiten?
- [ ] Namen van de zeven types: zo houden, of eerst zelf een week testen?

De geoptimaliseerde prompt om dit met Claude Code te bouwen staat in Claude Code-prompt.
