# Routeoverzicht Brain-Mate Nate

Stand na stap 5 (navigatie en Mijn dag). Doel: elk scherm blijft bereikbaar. De
rooktest `tests/mijn-dag.e2e.cjs` tekent alle schermen uit de eerste tabel één keer.

## Vaste plekken

| Plek | Wat | View |
|---|---|---|
| Onderbalk 1 | **Mijn dag**: Dagring, tijdlijn, Nu-kaart (1–2–rest), dagstart; widgets naar keuze | `vandaag` |
| Onderbalk 2 | **Planning**: de komende week, met Kalender, Overzicht, Afspraken, Projecten, Checklists en Slimme lijsten erboven | `planning` |
| Onderbalk 3 | **+ Vastleggen**: "Gedachte naar de mindmap" bovenaan, daaronder de lagen (Persoonlijk, Werk, Financieel, Toolbox) | `start` |
| Onderbalk 4 | **Mindmap** | `mindmap` |
| Onderbalk 5 | **Ruimtes**: elke module als kamer | `ruimtes` |
| Kop | **Werk** (filter), **Nate's berichten** (paneel), **Zoeken**, **Meer** | `zoeken`, `meer` |
| Rechtsonder | **Nate**: snel naar Mindmap, Vastleggen, Mijn dag, Zoeken; berichten en tip | paneel |

Tabs (`TABS`): `welkom` (zonder knop, alleen bij opstarten), `vandaag`, `planning`,
`start`, `mindmap`, `ruimtes`. Op een tab is er geen terugknop; overal anders wel.

## Waar staat elk scherm nu?

"Nieuw" = + Vastleggen → lagen (`nieuw-lagen.js`). "Verder naar" = de strook onderaan
elk scherm (`koppelingen.js`). "Meer" = de knop in de kop.

| View | Scherm | Nu te bereiken via |
|---|---|---|
| `welkom` | Dagoverzicht (briefing) | Bij opstarten; Meer → Ook → Dagoverzicht (daarna Mijn dag, zie `verweven.js`) |
| `komend` | Komende 7 dagen | Is de kern van Planning; Nieuw → Persoonlijk → Plannen; Verder naar |
| `afspraken` | Afspraken | Planning (knop); Ruimtes → Persoonlijk; Nieuw; Verder naar |
| `afspraak` | Eén afspraak | Tijdlijn en Dagring (pop-up → Afspraak openen); lijst in Afspraken |
| `meer` | Meer | Kop (was een tab) |
| `instellingen` | Instellingen | Meer (was de tandwielknop in de kop) |
| `profiel` | Profiel en rapport | Meer; Instellingen-kaart |
| `kennismaking` | Kennismaken met Nate | Eerste start; Meer → Ook; Profiel; Nate's bericht |
| `backup` | Gegevens (back-up) | Meer → Gegevens; back-upbanner |
| `help` | Uitleg | Meer → Help; Instellingen |
| `ontwerp` | Ontwerp | Meer → Ook; Instellingen |
| `zoeken` | Zoeken | Kop; Nate; Nieuw → Toolbox → Inzicht |
| `meldingen` | Nate's berichten | Meer → Ook; Nate's paneel |
| `inbox` | Inbox | Meer → Ook; Nieuw → Plannen |
| `overzicht` | Overzicht | Planning (knop); Meer → Ook |
| `kalender`, `projecten`, `checklists`, `filters` | Planhulpen | Planning (knoppen); Nieuw → Plannen |
| `project`, `checklist` | Eén project / lijst | Vanuit hun lijst |
| `logboek`, `stats` | Logboek, Terugblik | Meer → Ook; Nieuw → Inzicht |
| `focus` | Focustimer | Meer → Ook; Nieuw → Werk → Tijd |
| Voortgang (overlay) | Voortgang | Meer → Voortgang; Nieuw → Inzicht |
| `persoonlijk`, `werk`, `gezondheid`, `financieel`, `huishouden`, `sidehustles`, `hobbyskills`, `anker`, `gewoontes`, `dagboek`, `lijstjes`, `wishlist`, `keuze`, `personen`, `roken`, `tijd` | Modules | Ruimtes; Nieuw; Verder naar |
| `keuzetest`, `keuzetheorie`, `keuzedilemma` | Keuzemachine | Vanuit Keuzemachine; samenvatting kennismaking (uitsteltest) |
| `sh`, `shdoc`, `shles`, `shideeen` | Side hustle-details | Vanuit Side Hustle |
| `hobbyskill`, `wens`, `hhlijst`, `hhwaarom`, `lijstje`, `lijstitem`, `ljjaar`, `werkdoc` | Details | Vanuit hun module |
| `ankerintro`, `ankerkies`, `ankerhelp`, `ankerervaring`, `ankerinst`, `ankerbronnen` | Anker-schermen | Vanuit Anker |
| `dag` | Eén dag | Tijdlijn/kalender, ritmekaart |

## Gedrag

- **Terug** (`terug()`, `V.stapel`): zoals in FutureMe. Nieuw: de scrollpositie van het
  scherm dat je verliet komt terug (`navigatie.js`, 88.5), en elke tab onthoudt zijn eigen positie.
- **Tab wisselen** leegt de stapel (zoals altijd).
- **Dialogen** (onderblad) zetten de focus terug op de knop die ze opende (`mijn-dag.js`, 87.8).
