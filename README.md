# Brain-Mate Nate

Een rustige, persoonlijke webapp die een neurodivergent brein helpt met dagstructuur,
voortgang en zelfinzicht, met de capibara Nate als gids. Alles blijft op je eigen toestel
(IndexedDB): geen account, geen server, geen tracking.

**Stand:** stap 2 van fase 2. De app is een kopie van de nieuwste FutureMe
(databaseversie 14) met een eigen naam en database, plus Nate: de capibara rechtsonder
opent een paneel met snel naar (mindmap vooraan), zijn berichten met uitleg waarom, en
elke dag één klein idee uit het ADHD-onderzoek. De kennismaking met de BrainMate
Nate-vragenbank, de nieuwe navigatie en Mijn dag volgen in de volgende stappen. Het ontwerp staat in het fase 1-document (Claude Doc) en in de
PRD "FutureMe Neurodivergent" v2.

## Draaien

Open `index.html` via een kleine webserver (de service worker werkt niet vanaf `file://`):

```
python3 -m http.server 8000
```

en ga naar <http://localhost:8000>.

## Publiceren (GitHub Pages)

1. Ga op GitHub naar **Settings → Pages**.
2. Kies bij *Source* **Deploy from a branch**, branch `main`, map `/ (root)`, en sla op.
3. Na een minuut staat de app op `https://rienk-raket.github.io/BrainMateNate/`.
4. Open die link in Safari op je iPhone → Deel → **Zet op beginscherm**.

## Aanpassen en opnieuw bouwen

`index.html` wordt **gebouwd**; pas hem niet met de hand aan. Wijzig `basis/index.html`
of een bestand in `ruimtelijk/src/`, en draai daarna:

```
python3 ruimtelijk/bouw.py
```

| Pad | Wat |
|---|---|
| `index.html` | De gebouwde app (niet met de hand aanpassen) |
| `sw.js` | Service worker: netwerk eerst, anders de opgeslagen kopie (cache `brainmatenate-v1`) |
| `basis/index.html` | De basis-app, gelijk aan FutureMe |
| `ruimtelijk/src/` | Alle modules als losse bestanden (zie de FutureMe-uitleg in `docs/`) |
| `ruimtelijk/bouw.py` | Bouwt `index.html`; stap 8 geeft de app de naam Brain-Mate Nate en de database `brainmatenate` |
| `kennis/huishouden.json` | Kennisbank Huishouden (wordt `FM_KENNIS` in de app) |
| `kennis/adhd-theorie.json` | ADHD-kennisbasis uit het onderzoek (Categorie 1–8): theorie, bewijsniveau, handvatten en advies per module. Wordt `NATE_ADHD` |
| `assets/nate/nate.svg` | **Nate's uiterlijk.** Vervang dit bestand door je eigen tekening met dezelfde naam; geen bouwstap nodig |
| `ruimtelijk/src/nate.js`, `nate.css` | Nate: ruststand, paneel, berichten, tip van de dag, instellingen |
| `docs/` | Specificaties en onderzoek uit FutureMe |
| `tests/` | `node tests/keuzemachine.test.mjs` (rekenkern Keuzemachine) |

## Gegevens uit FutureMe meenemen

Brain-Mate Nate heeft een eigen database, dus je FutureMe-gegevens staan er niet vanzelf in.
Maak in FutureMe een back-up (Meer → Back-up → Exporteren) en importeer dat bestand hier
via dezelfde plek.
