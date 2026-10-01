# Brain-Mate Nate — werkafspraken voor Claude Code

## Wat dit is
Persoonlijke, offline PWA (fork van FutureMe, databaseversie 14) voor één gebruiker op een iPhone.
Nate de capibara is de gids en de enige afzender van tips en berichten. Taal: Nederlands.

## Bouwen en testen
- `index.html` wordt gebouwd: `python3 ruimtelijk/bouw.py`. Pas `index.html` nooit met de hand aan.
- Nieuwe code komt in `ruimtelijk/src/` en wordt in `bouw.py` opgenomen. Wijzig `basis/index.html` niet; omwikkel bestaande functies zoals de andere modules doen.
- Tests: `node --test tests/` en `node tests/keuzemachine.test.mjs`, plus een Playwright-rooktest (390 × 844, licht en donker, minder beweging): geen consolefouten en nul externe verzoeken.
- Kennis staat in `kennis/*.json`, los van de code. Pas teksten en advies daar aan.

## Vaste regels
- Geen netwerkverzoeken naar buiten, geen API-koppelingen, geen analytics. `bouw.py` stopt bij een API-adres; laat dat zo.
- Vragenbank en scoreweging letterlijk overnemen: ontbrekend is nooit 0, geen totaalscore, geen percentages of diagnoses.
- Toegankelijkheid: tikvlakken minstens 44 × 44 px, focus zichtbaar, `prefers-reduced-motion` wint, niets alleen met kleur.
- Nate's stem: kort, motiverend met een knipoog, geen "moet", geen schuld. Zie `docs/prompts/bouwprompt-brainmatenate.md`.
- Code voor een beginner: korte functies, Nederlandse commentaarregels die uitleggen waarom.

## Stoppen en vragen
Werk door zolang een stap geen input nodig heeft. Stop en vraag het alleen als je niet verder kunt, of vóór iets dat moeilijk terug te draaien is: verwijderen, force-pushen, pushen naar `main`, de databaseversie verhogen, of iets buiten deze repo aanpassen.

## Voortgang
Houd `PROGRESS.md` bij (stap, status, tests, open punten) en commit na elke stap.
