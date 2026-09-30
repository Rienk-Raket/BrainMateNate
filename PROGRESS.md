# Voortgang Brain-Mate Nate — stap 3 t/m 7

Bijgehouden volgens `docs/prompts/bouwprompt-brainmatenate.md`. Branch `claude/wizardly-cray-e2bzcv`
bouwt verder op `nate-basis` (stap 1 en 2, uit de bundle van de opzet-chat).

## Stand

| Stap | Status | Getest | Open |
|---|---|---|---|
| 3a Vragenbank, scoreweging, scorekern | Klaar | `node --test tests/*.test.mjs`: 9 scoringtests + keuzemachine groen; `bouw.py` controleert beide JSON-bestanden | — |
| 3b Kennismakingsflow en profielrapport | Klaar, wacht op review | `tests/kennismaking.e2e.cjs`: 45 checks (390×844 licht, 360×740 donker + minder beweging, tikvlakken, focus, herladen, nul externe verzoeken, geen consolefouten); schermafbeeldingen bekeken | Reviewsubagent |
| 4 Tips uit profiel | Nog niet begonnen | — | — |
| 5 Navigatie en Mijn dag | Nog niet begonnen | — | — |
| 6 Chat met Nate | Nog niet begonnen | — | — |
| 7 Modules-audit | Nog niet begonnen | — | — |

## Bestanden van stap 3

- `kennis/vragenbank.json`, `kennis/scoreweging.json`: letterlijke kopieën (1.0.0-draft en 1.1.0).
- `ruimtelijk/src/nate-score.js`: pure scorekern (NATE-SCORE-BEGIN/EINDE).
- `ruimtelijk/src/kennismaking.js/.css`: flow (welkom → naam → 16 kern → 4 voorkeur → verdieping → context → dichtheid → samenvatting), rapport bovenaan Meer → Profiel, antwoorden wijzigen, hervatten na herladen, Nate's bericht bij pauze/later.
- `tests/scoring.test.mjs`, `tests/kennismaking.e2e.cjs`.
- Draaien: `python3 ruimtelijk/bouw.py && node --test tests/*.test.mjs && NODE_PATH=/opt/node22/lib/node_modules node tests/kennismaking.e2e.cjs`

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
