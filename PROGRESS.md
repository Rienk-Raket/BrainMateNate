# Voortgang Brain-Mate Nate — stap 3 t/m 7

Bijgehouden volgens `docs/prompts/bouwprompt-brainmatenate.md`. Branch `claude/wizardly-cray-e2bzcv`
bouwt verder op `nate-basis` (stap 1 en 2, uit de bundle van de opzet-chat).

## Stand

| Stap | Status | Getest | Open |
|---|---|---|---|
| 3a Vragenbank, scoreweging, scorekern | Klaar | `node --test tests/*.test.mjs`: 9 scoringtests + keuzemachine groen; `bouw.py` controleert beide JSON-bestanden | — |
| 3b Kennismakingsflow en profielrapport | Klaar, review verwerkt | `tests/kennismaking.e2e.cjs`: 45 checks (390×844 licht, 360×740 donker + minder beweging, tikvlakken, focus, herladen, nul externe verzoeken, geen consolefouten); schermafbeeldingen bekeken | — |
| 4 Tips uit profiel | Klaar, review verwerkt | `tests/tips.test.mjs` (8 tests) + 5 e2e-checks: omdat-zin, bewijsniveau, één per dagdeel, Nate's stem, Niet meer tonen | — |
| 5 Navigatie en Mijn dag | Klaar, wacht op review | `tests/mijn-dag.e2e.cjs`: 47 checks (ring met klokje/buffer/bolletjes/wijzer, tijdlijn, Nu-kaart, pop-up met één actie, focus terug, dagstart, widgets, reistijd, onderbalk, Meer in de kop, Terug + scroll, Planning, Ruimtes, alle schermen tekenen, gedachte naar mindmap; 390 licht + 360 donker/minder beweging) | Reviewsubagent |
| 6 Chat met Nate | Klaar, wacht op review | `tests/intenties.test.mjs`: 39 tests, 30 voorbeeldzinnen waarvan 10 met tikfouten, alle zes regels, nood, gedachte; 8 e2e-checks in `mijn-dag.e2e.cjs` (paneel, tikfout, niet begrepen = 3 knoppen, gedachte pas na Ja, knop sluit paneel) | Reviewsubagent |
| 7 Modules-audit | Nog niet begonnen | — | — |

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
