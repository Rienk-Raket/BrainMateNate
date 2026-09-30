# Voortgang Brain-Mate Nate — stap 3 t/m 7

Bijgehouden volgens `docs/prompts/bouwprompt-brainmatenate.md`. Branch `claude/wizardly-cray-e2bzcv`
bouwt verder op `nate-basis` (stap 1 en 2, uit de bundle van de opzet-chat).

## Stand

| Stap | Status | Getest | Open |
|---|---|---|---|
| 3a Vragenbank, scoreweging, scorekern | Klaar | `node --test tests/*.test.mjs`: 9 scoringtests + keuzemachine groen; `bouw.py` controleert beide JSON-bestanden | — |
| 3b Kennismakingsflow en profielrapport | Bezig | — | — |
| 4 Tips uit profiel | Nog niet begonnen | — | — |
| 5 Navigatie en Mijn dag | Nog niet begonnen | — | — |
| 6 Chat met Nate | Nog niet begonnen | — | — |
| 7 Modules-audit | Nog niet begonnen | — | — |

## Bronnen

- `kennis/vragenbank.json`: letterlijke kopie van `03_volledige-vragenbank.json` (schema 1.0.0-draft, 96 vragen, 32 casussen).
- `kennis/scoreweging.json`: letterlijke kopie van `scoreweging-config-v1.1.json` (schema 1.1.0).
- De bouwprompt verwijst naar `bronnen/`; die map bestaat bewust niet. 04 en 08 kwamen als bijlage, onderzoek via `kennis/adhd-theorie.json` en bijlagen.
- De ruwe bronnen (01–10, onderzoek Categorie 1–8, overkoepelend document) staan bewust niet in Git: de repo is openbaar (afspraak met Kas).

## Twijfels over de scoring (letterlijke lezing gekozen)

1. **Itemrol per vraag.** De vragenbank noemt `item_purpose`, de scoreweging noemt rollen. Koppeling: herkenning→frequency, impact→impact, context→context_variation, herstel→recovery_cost, compensatie→current_resource (gewicht 0), ervaring→observed_effect, voorkeur→preference, haalbaarheid→feasibility, barrière→barrier. Geen enkele vraag heeft `compensation_cost`; R komt dus alleen uit herstelvragen.
2. **Contextbreedte (C).** Komt uit de gekozen levensgebieden per patroon (CTX02, 08 "per relevant patroon"), niet uit de contextvragen (die tellen mee in het signaal).
3. **Clusterprominentie.** 08 zegt "gewogen combinatie van al berekende dimensies" zonder regel voor ontbrekende dimensies. Gekozen: alleen interpreteerbare dimensies, gewichten herverdeeld, en pas een score als minstens 50% van het clustergewicht bekend is.
4. **Top-clusters.** Hooguit drie, en alleen vanaf 25 (onder 25 = "weinig gemelde behoefte").
5. **Fit hoog/laag.** 08 noemt "hoog" en "laag" zonder grens; gekozen: 50 (grens van de band "duidelijk").
6. **Oplossingsfit.** Elk B-subthema heeft voorkeur óf haalbaarheid, dus de 45/25/30-gewichten worden over de aanwezige delen herverdeeld.
7. **Profiel na alleen de 16 kernvragen.** Een dimensie is pas te interpreteren met impact (Q2), die pas bij verdieping komt. Na alleen de kern toont het rapport dus de open domeinen en "onvoldoende informatie", geen clusters.
8. **Route naar Deel B.** Rangorde van de vier hoogste behoeften op behoefte, anders signaal, anders kernscore; B-vragen worden toegevoegd tot de route 44 vragen telt.
9. **Antwoordopties contextmodule.** De bronnen geven alleen de prompttekst. De vlaggen gaan af bij "groot" (CTX05–10), "sterk" (CTX04) en "sterk_wisselend" (CTX03); de opties zelf zijn een ontwerpkeuze voor stap 3b.

## Afwijkingen

- `node --test tests/` werkt niet in Node 22 (map wordt als module gezien); gebruik `node --test tests/*.test.mjs`.
