# Voortgang Brain-Mate Nate — stap 3 t/m 7

Bijgehouden volgens `docs/prompts/bouwprompt-brainmatenate.md`. Branch `claude/wizardly-cray-e2bzcv`
bouwt verder op `nate-basis` (stap 1 en 2, uit de bundle van de opzet-chat).

## Stand

| Stap | Status | Getest | Open |
|---|---|---|---|
| 3a Vragenbank, scoreweging, scorekern | Klaar | `node --test tests/*.test.mjs`: 9 scoringtests + keuzemachine groen; `bouw.py` controleert beide JSON-bestanden | — |
| 3b Kennismakingsflow en profielrapport | Klaar, review verwerkt | `tests/kennismaking.e2e.cjs`: 45 checks (390×844 licht, 360×740 donker + minder beweging, tikvlakken, focus, herladen, nul externe verzoeken, geen consolefouten); schermafbeeldingen bekeken | — |
| 4 Tips uit profiel | Klaar, review verwerkt | `tests/tips.test.mjs` (8 tests) + 5 e2e-checks: omdat-zin, bewijsniveau, één per dagdeel, Nate's stem, Niet meer tonen | — |
| 5 Navigatie en Mijn dag | Klaar, wacht op review | `tests/mijn-dag.e2e.cjs`: 47 checks (ring met klokje/buffer/bolletjes/wijzer, tijdlijn, Nu-kaart, pop-up met één actie, focus terug, dagstart, widgets, reistijd, onderbalk, Meer in de kop, Terug + scroll, Planning, Ruimtes, alle schermen tekenen, gedachte naar mindmap; 390 licht + 360 donker/minder beweging) | Review afgebroken (bestedingslimiet); eigen rooktests groen |
| 6 Chat met Nate | Klaar, wacht op review | `tests/intenties.test.mjs`: 39 tests, 30 voorbeeldzinnen waarvan 10 met tikfouten, alle zes regels, nood, gedachte; 8 e2e-checks in `mijn-dag.e2e.cjs` (paneel, tikfout, niet begrepen = 3 knoppen, gedachte pas na Ja, knop sluit paneel) | Review nog niet gedaan (limiet) |
| 7 Modules-audit | Klaar (alleen document) | `docs/modules-audit.md`: 19 modules, acties, advies, voorstel | Kas kiest per module |

## Bestanden van stap 3

- `kennis/vragenbank.json`, `kennis/scoreweging.json`: letterlijke kopieën (1.0.0-draft en 1.1.0).
- `ruimtelijk/src/nate-score.js`: pure scorekern (NATE-SCORE-BEGIN/EINDE).
- `ruimtelijk/src/kennismaking.js/.css`: flow (welkom → naam → 16 kern → 4 voorkeur → verdieping → context → dichtheid → samenvatting), rapport bovenaan Meer → Profiel, antwoorden wijzigen, hervatten na herladen, Nate's bericht bij pauze/later.
- `tests/scoring.test.mjs`, `tests/kennismaking.e2e.cjs`.
- Draaien: `python3 ruimtelijk/bouw.py && node --test tests/*.test.mjs && NODE_PATH=/opt/node22/lib/node_modules node tests/kennismaking.e2e.cjs`

## Bestanden van stap 4

- `kennis/adhd-theorie.json`: per domein een veld `subthemas` (Deel A-subthema's uit de vragenbank, via de route A → B uit 04). A2.1 (sensorisch) en A3.4 (lezen) hebben geen ADHD-domein en dus geen tip.
- `ruimtelijk/src/nate-tips.js`: pure tipkiezer (NATE-TIPS-BEGIN/EINDE) + vervanging van `nateTipVanVandaag()`: kandidaten op behoefte (of kernscore vanaf "soms"), één keuze per dagdeel die rondgaat, omdat-zin met het antwoord en het bewijsniveau; zonder profiel een algemene tip met eerlijke omdat-zin.
- `tests/tips.test.mjs`.

## Bestanden van stap 5

- `ruimtelijk/src/mijn-dag.js/.css`: Mijn dag (Dagring + tijdlijn + één Nu-kaart + dagstart; oude blokken als widgets die je zelf aanzet), vertrekklokje en buffer op de ring, pop-up met één primaire actie, focus terug na elk onderblad.
- `ruimtelijk/src/navigatie.js/.css`: onderbalk (Mijn dag · Planning · + · Mindmap · Ruimtes), Meer in de kop (Voortgang, Profiel, Instellingen, Gegevens, Help + "Ook"), Planning, Ruimtes, scrollpositie bij Terug en per tab, "Gedachte naar de mindmap".
- `bouw.py` stap 10: reistijd en buffer in het afspraakblad.
- `docs/routeoverzicht.md`, `tests/mijn-dag.e2e.cjs`.

## Bestanden van stap 6

- `kennis/intenties.json`: bestemmingen (view of act), trefwoorden, synoniemen, stopwoorden, soorten vragen, gedachtewoorden, nood (113/112/huisarts), niet begrepen (drie knoppen). `bouw.py` controleert de vorm.
- `ruimtelijk/src/nate-chat.js/.css`: pure kern (NATE-CHAT-BEGIN/EINDE) met de zes regels; tikfouten via Damerau-afstand (vanaf 5 letters één fout, vanaf 8 twee); chat onderaan Nate's paneel, gesprek alleen in deze sessie (niets bewaard); gedachte naar de mindmap pas na "Ja".

## Review stap 3 en 4 (verwerkt)

1. Samenvatting bereikt = klaar (anders opende de kennismaking na de uitsteltest bij elke start opnieuw).
2. Omdat-zin citeert het sterkste antwoord (kern of impact, vanaf "soms"); anders "aangaf dat het speelt".
3. "Niet meer tonen": ook geen andere tip in hetzelfde dagdeel.
4. Wijzigen werkt ook voor een vraag die niet meer in de route staat.
Kleiner: tip gaat over de dagen rond (ook bij 3/6 kandidaten); geen procentteken in een vlagtekst.
Open (letterlijk gelaten): de vijf compensatievragen hebben `scoring_role: resource` in de vragenbank en tellen dus niet als kosten (twijfel 1).

## Bronnen

- De bouwprompt verwijst naar `bronnen/`; die map bestaat bewust niet (repo is openbaar, afspraak met Kas). 01–10 en het onderzoek kwamen als bijlage; vragenbank en scoreweging staan in `kennis/`.

## Twijfels over de scoring (letterlijke lezing gekozen)

1. **Itemrol per vraag.** herkenning→frequency, impact→impact, context→context_variation, herstel→recovery_cost, compensatie→current_resource (gewicht 0), ervaring→observed_effect, voorkeur→preference, haalbaarheid→feasibility, barrière→barrier. Geen vraag heeft `compensation_cost`; R komt alleen uit herstelvragen.
2. **Contextbreedte (C).** Uit de gekozen levensgebieden per geopend subthema (CTX02 wordt per subthema gesteld, "per relevant patroon" in 08).
3. **Clusterprominentie.** Alleen interpreteerbare dimensies, gewichten herverdeeld, score pas als ≥ 50% van het clustergewicht bekend is.
4. **Top-clusters.** Hooguit drie, alleen vanaf 25.
5. **Fit hoog/laag.** Grens 50.
6. **Oplossingsfit.** 45/25/30 herverdeeld over de aanwezige delen (elk B-subthema heeft voorkeur óf haalbaarheid).
7. **Profiel na alleen de kern.** Zonder impactvraag (Q2) geen cluster; het rapport zegt dan eerlijk dat er meer nodig is.
8. **Route naar Deel B.** Vier hoogste op behoefte, anders signaal, anders kernscore; tot 44 vragen.
9. **Contextmodule.** Antwoordopties zijn een ontwerpkeuze (`KN_CTX_OPTIES`); "groot", "sterk" en "sterk_wisselend" zetten de vlaggen.
10. **Microstap.** Uit de casus (`recommended_first_microstep`) van het subthema met de hoogste behoefte; modules uit `app_module_ids` van de kernvraag.

## Afwijkingen en bekende punten

- `node --test tests/` werkt niet in Node 22 (map = module); gebruik `node --test tests/*.test.mjs`.
- `tests/keuzemachine.e2e.cjs` faalt op 5 punten, ook op het onaangeroerde `nate-basis`: 3× de verwijderde AI-laag (stap 2), 1× een FutureMe-commit (d99ca35) die niet in deze repo zit, 1× timing. Niet aangeraakt.
- Het oude profielscherm (sectie 76, reserve voor `ndAanpak()`) heeft schakelaars van 31 px en toont procenten; buiten de scope van stap 3.
- Tikvlaktest meet `offsetWidth/Height` (lay-out), omdat de inschuif-animatie van de ruimtelijke laag tijdelijk schaalt.

## Besluiten Kas, 2 oktober 2026 (conceptvoorstel app-structuur)

1. V4 Ruimtes in vijf clusters met "Voor jou, nu": ja, met schakelaar Vaste indeling.
2. V2 Mijn aanpak: ja, het oude profiel (10 vragen) vervalt zodra Mijn aanpak er is.
3. V6 alarmen: geen .ics als hoofdroute. Gekozen: **Opdrachten-brug** (Herinneringen + Klok-wekker via een eenmalig ingestelde Opdracht, lokaal). .ics blijft reserve.
4. Pixellettertype alleen voor logo en decoratie; kopjes leesbaar.
5. Eerst V7, V6 en V3.

## Stap 8: V7 Ik loop vast

- `ruimtelijk/src/ik-loop-vast.js/.css` (sectie 90). Knop op de Nu-kaart en in het taakblad. Vijf oorzaken (onduidelijk, te groot, saai, spannend, leeg), elk één handeling; loslaten naar morgen altijd zichtbaar; "Waarom zeg je dit?" met bewijsniveau Praktisch.
- Eerste handeling wordt de bovenste subtaak en staat op de Nu-kaart. Gebruik in instelling `ivLog` (meting: vast → afgerond binnen 24 uur, `ivMeting`).
- Tests: `tests/vast.test.mjs` (pure kern), `tests/voorstellen.e2e.cjs` (V7-deel). E2e-tests van Mijn dag draaien nu met een vaste klok (10:42); 's avonds liepen tijden tegen 23:59 aan.

## Stap 9: V6 Terugplannen en alarmen via Opdrachten

- `ruimtelijk/src/terugplannen.js/.css` (sectie 91). Terugrekenen vanaf het begin: stoppen, voorbereiden, vertrekken. In de tijdlijn van Mijn dag en als keten op het afspraakscherm. Nieuw veld Voorbereiden (min) in het afspraakblad (`bouw.py` stap 11, gaat mee bij herhalingen).
- Opdrachten-brug: lokale link `shortcuts://run-shortcut?name=Nate alarmen&input=text&text=<JSON>`; eerste keer uitleg met stappenplan en testknop; wekker alleen bij vertrekken (schakelbaar). Handleiding: `docs/opdracht-nate-alarmen.md`. Instellingen `tpAlarmen`, `tpIngesteld`; per afspraak `tpGezet`.
- .ics-reserve krijgt dezelfde drie alarmen.
- Nog niet: gemeten reistijd (mediaan na 5–10 afspraken) → samen met V9 duurkalibratie.
- Niet te testen hier: of Opdrachten op Kas' iOS-versie de JSON zo leest. Eerste echte test op de iPhone met de testknop.

## Stap 10: V3 Eén invoer voor alles

- `ruimtelijk/src/een-invoer.js/.css` (sectie 92). Veld "Wat speelt er?" bovenaan Vastleggen (alleen op het hoogste niveau). Parser (parseNL) + intentieherkenning (ncBegrijp) samen: afspraak, taak, gedachte of een plek in de app; reistijd uit de tekst ("reistijd 25"). Zeker → één tik opslaan; twijfel → Kas kiest eerst (knop uit tot er een keuze is). Eén tik corrigeert het type. Nood gaat voor alles (113/112).
- De chat in Nate's paneel biedt "Vastleggen" aan als de zin een datum of tijd heeft; Vastleggen opent met de tekst erin.
- Het Aa-knopje (Snel typen) is verborgen naast het veld. "Gedachte naar de mindmap" (besluit 3, stap 5) is op Vastleggen opgegaan in het nieuwe veld (besluit Kas, 2 oktober); in de chat blijft "onthoud: …" werken.
- Spraak: via de microfoon van het iOS-toetsenbord. De Web Speech API is bewust niet gebruikt (kan audio naar een server sturen).
- Tests: `tests/een-invoer.test.mjs` (kern met de echte intentieherkenning), V3-deel van `tests/voorstellen.e2e.cjs`.

## Review stap 8–10 (verwerkt)

1. Wekker in Klok kent geen datum: alleen een wekker voor afspraken van vandaag (payload `wekker`), herinneringen voor elke dag. Recept zegt dit.
2. "Doorgegeven om …" in lokale tijd (was UTC).
3. Eén invoer: afspraak houdt herhaling (`reeksNieuw`), labels; project als notitie.
4. Recept uitgeschreven: "Ontvang invoer: Tekst", elke sleutel met eigen Haal-waarde-stap, naam uit de instelling.
5. Link naar Opdrachten synchroon na de tik (iOS blokkeert anders).
6. Buffer uit dezelfde instelling als de Dagring (`mdBuffer`).
7. "reistijd: 25" en "reistijd 1,5 uur" herkend.
8. Loslaten naar morgen heft oud uitstel op en plant meldingen opnieuw.
9. .ics-alarmen van terugplannen alleen bij afspraken met reistijd; stoptekst klopt ook zonder voorbereiden.
10. Meting werkt: subtaken krijgen `afOp` bij afvinken; na 3× gebruik toont het oorzakenblad "x van de y keer kwam er binnen een dag een stap af".
Kleiner: dubbel opslaan voorkomen, Enter tijdens IME, eerlijke toast als de stap er al stond.
Bekend (niet van deze stappen): `keuzemachine.e2e.cjs` faalt nu op 6 punten, ook op main (e914d31); de zesde ("versnelde band") is timing.

## Stap 11: V2 Mijn aanpak (oude profiel vervalt)

- `ruimtelijk/src/mijn-aanpak.js/.css` (sectie 93). Profiel-service `aanpak()`: patronen uit de kennismaking → richting voor de bestaande modules (`apRichting`: P1/P2 → adhd, P3 → autisme, beide → audhd, P7 → energie of energievlag). `pfRichting` en `ndAanpak` lezen voortaan hieruit; de tien oude vragen en het energievinkje tellen niet meer (besluit 2).
- Scherm "Mijn aanpak" (view `aanpak`, via Meer → Profiel): patronen met metafoor, "Wat Nate al afstemt" (blokken, pauzes, afkoeltijd), zes aanpassingen met schakelaar, label "Nate stelt voor", "Waarom zeg je dit?" en bewijsniveau. Niets gaat vanzelf aan. Aanpassingen gebruiken bestaande instellingen (`ndDichtheid`, `beweging`, `nateEnergie`, `tpAlarmen.wekker`) plus nieuw `vasteIndeling` en `ivNu`.
- Profiel: het oude blok "Aanpak die bij je past" (tien vragen) is weg; bovenaan staat de ingang naar Mijn aanpak.

## Stap 12: V4 Ruimtes in vijf clusters, Meer in vijf regels, export/import

- `ruimtelijk/src/ruimtes-clusters.js/.css` (sectie 94). Ruimtes: "Voor jou, nu" (drie ruimtes met live status, `rvVoorJou`: open dingen, patroon, dagdeel, lage energie), vijf clusters (Thuis en spullen, Lichaam en rust, Geld, Mensen en werk, Groeien en maken), één tegelijk open. Vaste indeling → vaste drie (Persoonlijk, Huishouden, Anker).
- Meer: bovenaan "Je gegevens" met **Alles exporteren** (één JSON met alle 55 opslagplekken, inclusief bijlagen) en **Importeren** (samenvoegen of alles vervangen; ook oude FutureMe-back-ups). Daaronder de vijf regels; "Alle schermen" ingeklapt.
- `bouw.py` stap 12: bestandsnaam `brainmatenate-gegevens-…json`; samenvoegen vergelijkt op de echte sleutel (`id` of `sleutel`).
- Bekend: samenvoegen van twee verschillende installaties geeft dubbele starttaken (andere id's). Bewust zo gelaten: er gaat niets verloren.

## Quick win 1: leesbare kopjes (besluit 4)

- `ruimtelijk/src/leesbaar.css`: titels, kopjes, labels en tabnamen in het systeemlettertype; het pixellettertype blijft alleen decoratie.

Tests: `tests/aanpak.test.mjs` (kern V2 en V4), `tests/structuur.e2e.cjs` (31 checks, inclusief export → import in een lege app).

## Review stap 11–12 (verwerkt)

1. Patronen pas na de zestien kernvragen (zoals de tips); daarvoor algemene aanpak.
2. Samenvoegen houdt bestaande instellingen (een afgeronde kennismaking blijft staan; een niet-afgeronde wordt aangevuld), slaat dubbele open taken (zelfde titel en datum) over en past instellingen meteen toe.
3. Zachte toon: schakelaar toont de echte stand; staat hij vanzelf aan (rustig scherm of weinig energie), dan staat dat erbij. Uitzetten zet je vorige keuze terug (ook bij Rustig scherm).
4. Rustig scherm gaat niet meer vanzelf aan bij een richting (`ndDichtheidStandaard` = normaal); Nate stelt het voor. Tekst aangepast: "Jij beslist wat aan staat."
5. Minder beweging geldt overal: `prefers-reduced-motion` antwoordt "ja" als het aan staat, plus een CSS-stop op animaties.
6. Ruimtes: geen kaal getal als ondertitel; het getal staat als badge.
7. Anker krijgt een passend profiel zodra de kennismaking klaar is.
8. Tipkaart wijst naar Mijn aanpak.
9. Geen labels als "Autisme-kenmerken" in Profiel en Instellingen: de metaforen. Een eerder zelf gekozen richting telt nog zolang er geen kennismaking is.
10. Nacht (0–6 uur) apart: rust en dagboek.
11. Waarom-teksten hooguit twee zinnen.
12. Samenvoegen vergelijkt op de sleutel uit `WINKELS`.
