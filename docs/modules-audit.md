# Modules-audit Brain-Mate Nate (stap 7, voorbereiding)

Stand: 1 oktober 2026, na stap 3–6. **Hier is nog niets van gebouwd.** Per module staan de
zichtbare acties (pariteit: wat je er nu kunt doen), het advies uit `kennis/adhd-theorie.json`
(veld `appAdvies`, met het domein erbij), en een voorstel: **toevoegen**, **kleiner maken** of
**laten vervallen**. Kas kiest per module; zet je keuze in de kolom "Kas kiest".

Bronnen voor de acties: de `data-act`-knoppen in `basis/index.html` en `ruimtelijk/src/*.js`,
en het routeoverzicht (`docs/routeoverzicht.md`). Bewijsniveau tussen haakjes: direct,
indirect of praktisch (experiment), zoals in de kennisbasis.

## Samenvatting

| Module | Voorstel in één zin | Kas kiest |
|---|---|---|
| Mijn dag | Toevoegen: als-dan-regel in de dagstart en geschatte vs. werkelijke duur | |
| Afspraken | Toevoegen: herinneringssoorten en herstel na missen | |
| Taken, projecten, checklists | Toevoegen: "Ik loop vast" en de werkwoordcheck; kleiner: filters/slimme lijsten achter Meer | |
| Mindmap | Toevoegen: "eerstvolgende stap naar Mijn dag" per tak | |
| Huishouden | Toevoegen: minimum/standaard/extra per klus; herstelronde | |
| Gewoontes | Toevoegen: invulzin "Nadat …, doe ik …" en drie standen; kleiner: streak als hoofdgetal | |
| Check-in en dagboek | Toevoegen: drie-woordennotitie en de knop "Het komt hard binnen" | |
| Anker | Houden; kleiner: herinneringen en programma's achter één knop | |
| Focus en tijd | Kleiner: één focusscherm in plaats van focus + tijdsregistratie | |
| Financieel en Wishlist | Toevoegen: afkoeltijd en patroonlogger als optie | |
| Rookvrij | Toevoegen: herstelprotocol na uitglijder (geen reset naar nul) | |
| Gezondheid | Kleiner: vier modi terug naar twee | |
| Werk | Houden zoals het is | |
| Side Hustle | Kleiner: Theorie, Modellen en SCRUM samen als één leeshoek | |
| HobbySkills | Houden; koppel sessies aan "Nadat …" | |
| Lijstjes | Houden zoals het is | |
| Keuzemachine | Laten vervallen: AI-instellingen (staan al uit); verder houden | |
| Voortgang | Toevoegen: "hervat na uitval" als succes | |
| Nate en profiel | Toevoegen: herstelzin na gemiste afspraak, profiel stuurt `ndAanpak()` | |

---

## Mijn dag (view `vandaag`)

- **Acties nu:** ring tikken (pop-up met één actie), tijdlijn tikken, Nu-kaart: Klaar / Openen, dagstart (energie, stemming, intentie), widgets kiezen (9 oude blokken), back-up maken.
- **Advies (plannen, afspraken):**
  - 1–2–rest: één kern, twee onderhoud, de rest ingeklapt (indirect). *Gedaan in stap 5.*
  - Dagstart van vijf minuten met één als-dan-regel (indirect). *Half: de dagstart is er, de als-dan-regel nog niet.*
  - Geschatte én werkelijke duur; de app stelt de gemeten duur voor (indirect).
  - Buffers zichtbaar op de ring (indirect). *Gedaan, voor afspraken met reistijd.*
- **Voorstel:** **toevoegen**: een veld "Als … dan …" in de dagstart, en na het afvinken een vraag naar de werkelijke duur (één tik, overslaan mag).

## Afspraken (views `afspraken`, `afspraak`)

- **Acties nu:** nieuw, bewerken, verwijderen, filter, taak eraan koppelen, voorstel als taak, naar agenda (.ics), personen; nieuw: reistijd en buffer.
- **Advies (afspraken):**
  - Invoer vraagt reistijd en voorbereiding, de app rekent stop- en vertrektijd (indirect). *Half: reistijd en buffer zijn er, stoptijd nog niet.*
  - Herinneringen met een soort (voorbereiden, stoppen, vertrekken) en tekst in actievorm (indirect).
  - Vertrektijd als klokje op de ring (indirect). *Gedaan.*
  - Na een gemiste afspraak een herstelzin en één systeemaanpassing (praktisch).
- **Voorstel:** **toevoegen**: een stoptijd ("stop met wat je doet") naast de vertrektijd, en na een afspraak zonder uitkomst een Nate-bericht met de herstelzin. Lokale meldingen zijn op iOS beperkt; Nate's berichten in de app zijn de veilige basis.

## Taken, projecten en checklists

- **Acties nu:** snel typen, vinken, plannen, prioriteit, duur, subtaken, projecten (nieuw, bewerken), checklists (nieuw, sjabloon, gebruiken, reset), slimme lijsten, sessie ("één kaartje tegelijk").
- **Advies (taken):**
  - Taak zonder werkwoord of met een vaag woord: Nate vraagt "Wat is de eerste handeling?" (indirect).
  - Knop "Ik loop vast" start het 90-secondenonderzoek (praktisch).
  - Mindmaptak voor grote projecten, alleen de eerstvolgende stap naar Mijn dag (praktisch).
  - Body doubling als experiment (praktisch).
- **Voorstel:** **toevoegen**: de werkwoordcheck bij opslaan en "Ik loop vast" in het taakblad. **Kleiner maken**: slimme lijsten en filters alleen via Meer of Planning, niet ook in Nieuw.

## Mindmap

- **Acties nu:** nodes maken, verplaatsen, kleuren, inklappen, checklist per node, portals, koppelen aan project/taak, exporteren naar checklist of project, PiP-vensters; nieuw: "Gedachte naar de mindmap" en de chat.
- **Advies (taken):** een tak is de plek om iets uit te pluizen; alleen de eerstvolgende stap gaat naar Mijn dag (praktisch).
- **Voorstel:** **toevoegen**: per node "Eerstvolgende stap naar Mijn dag" (maakt één taak voor vandaag, met de node als bron).

## Huishouden

- **Acties nu:** lijsten (nieuw, importeren, verwijderen), klussen, klaarzetten, sessie met kaartjes, dobbelsteen, reset in 5 minuten, uitleg "Waarom zo?".
- **Advies (huishouden):**
  - Elke klus met een minimum-, standaard- en extra-variant (indirect).
  - Startprocedure en een afsluitstap met "volgende stap noteren" (indirect).
  - Was en vaat als gesloten cyclus met een wachtfase (indirect).
  - Gemiste klussen stapelen niet op; Nate stelt één herstelronde voor (praktisch).
- **Voorstel:** **toevoegen**: de drie varianten per klus (keuze in de sessie) en een afsluitstap. Laat gemiste klussen niet als achterstand tellen.

## Gewoontes

- **Acties nu:** nieuw, vinken, streaks en weekoverzicht, bewerken.
- **Advies (routines, gewoontes aanleren en afleren):**
  - Anker plus venster in plaats van een vaste klokminuut (indirect).
  - Invulzin "Nadat …, doe ik …" met een check of de cue stabiel is (indirect).
  - Drie standen: gedaan, minimum, niet (praktisch).
  - Geen streak als hoofdgetal; "hervat na uitval" telt als succes (praktisch).
  - Na enkele weken: "Gaat het al vanzelf?" in plaats van een teller (praktisch).
- **Voorstel:** **toevoegen**: de invulzin en de drie standen. **Kleiner maken**: de streak wordt een bijzaak, en na een gemiste dag toont Nate alleen de minimumversie.

## Check-in en dagboek

- **Acties nu:** energie, stemming, intentie, dag afsluiten (wat ging goed, één ding voor morgen), dagboeknotitie.
- **Advies (emoties):**
  - Snelle "drie woorden"-notitie: aanleiding, lijf, impuls (indirect).
  - Knop "Het komt hard binnen": eerst Anker, daarna pas vragen (praktisch).
  - Bij zelfbeschadiging of ernstige ontregeling direct verwijzen (huisarts, 113). *Gedaan in de chat; de knop nog niet.*
- **Voorstel:** **toevoegen**: drie woorden in de check-in en het dagboek, en de knop "Het komt hard binnen" op Mijn dag (opent Anker).

## Anker

- **Acties nu:** oefening starten, kiezen, "Help me kiezen", favorieten, programma's, herinneringen, profiel, bronnen, gewoonte maken.
- **Advies (emoties):** eerst landen, daarna denken (praktisch).
- **Voorstel:** **houden**. **Kleiner maken**: herinneringen, programma's en profiel achter één knop "Instellen", zodat het eerste scherm alleen "Nu even landen" toont.

## Focus en tijd

- **Acties nu:** focustimer, snooze, subtaken, volgende; aparte tijdsregistratie met losse timer.
- **Advies (plannen):** geschatte vs. werkelijke duur (indirect); werkblokken op je eigen aandachtsspanne (indirect).
- **Voorstel:** **kleiner maken**: één focusscherm dat ook de tijd registreert, en de gemeten duur gaat terug naar de taak.

## Financieel en Wishlist

- **Acties nu:** dagbudget, uitgaven, vaste lasten, incasso's, potjes; wensen met koopcheck, sparen, groeperen.
- **Advies (gewoontes afleren):**
  - Afkoeltijd op de Wishlist als frictie vóór een impulsaankoop (praktisch).
  - Een lichte patroonlogger (trigger, gedrag, opbrengst) als optie (praktisch).
  - Bij gokken of grote financiële schade verwijzen naar hulp. *Gedaan in de chat.*
- **Voorstel:** **toevoegen**: afkoeltijd (bijvoorbeeld 48 uur) vóór "Gekocht", met Nate's uitleg.

## Rookvrij

- **Acties nu:** doel, instellen, loggen, opnieuw beginnen.
- **Advies (gewoontes afleren):** na een uitglijder het herstelprotocol en nooit een reset naar nul (praktisch).
- **Voorstel:** **toevoegen**: "Uitglijder" naast "Opnieuw beginnen". Die telt mee als data en zet de teller niet op nul.

## Gezondheid

- **Acties nu:** vier modi (vandaag, loggen, doelen, planning), water, eten, sport, gewicht, producten.
- **Advies:** geen apart domein in de kennisbasis; het valt onder routines (anker, minimumversie).
- **Voorstel:** **kleiner maken**: twee modi ("Vandaag" en "Doelen"); loggen en planning gaan erin op.

## Werk

- **Acties nu:** werktaken, meetings, verslagen, besluiten, documenten met mijlpalen, filter.
- **Advies:** valt onder plannen en afspraken (zie daar).
- **Voorstel:** **houden**. De voorstellen bij Afspraken en Taken gelden hier ook.

## Side Hustle

- **Acties nu:** ideeënbank, hustles, SCRUM-bord, theorie, modellen, dashboard, documenten.
- **Advies:** taken opdelen (eerstvolgende stap), plannen (één kern per dag).
- **Voorstel:** **kleiner maken**: Theorie en Modellen samen als één leeshoek, zodat het bord en de eerstvolgende kaart vooraan staan.

## HobbySkills

- **Acties nu:** nieuw, sessies, mijlpalen, niveau, bronnen, plan, waarom.
- **Advies (gewoontes aanleren):** "Nadat …, doe ik …" en een minimumversie van twee minuten.
- **Voorstel:** **houden**. Bied bij een nieuwe hobby de invulzin aan.

## Lijstjes

- **Acties nu:** lijsten, items, beoordelen, duel, jaarlijst, delen.
- **Advies:** geen domein; een rustige plek zonder druk.
- **Voorstel:** **houden zoals het is**.

## Keuzemachine

- **Acties nu:** dilemma's, uitsteltest, theorie, A/B-duel, munt, parkeren, nazorg; AI-instellingen (uitgeschakeld in stap 2).
- **Advies:** past bij taken (uitstel) en gewoontes afleren; de uitsteltest zit nu in de kennismaking.
- **Voorstel:** **laten vervallen**: de resten van de AI-instellingen (sleutel- en modelveld). Verder houden.

## Voortgang

- **Acties nu:** overzicht over modules en doelen (overlay).
- **Advies (routines, gewoontes aanleren):** "hervat na uitval" als succes, geen streak als hoofdgetal (praktisch).
- **Voorstel:** **toevoegen**: een regel "Hervat na een pauze: n keer" bovenaan.

## Nate en profiel

- **Acties nu:** paneel (snel naar, berichten, tip, chat), kennismaking, profielrapport, antwoorden wijzigen, tips aan of uit, energie (Zacht, Normaal, Vol gas).
- **Advies (alle domeinen):** herstelzin na gemiste dingen; nooit RSD of een diagnose. *Gedaan in teksten en tests.*
- **Voorstel:** **toevoegen**:
  - Laat het nieuwe profiel `ndAanpak()` sturen, zodat de oude tien vragen kunnen vervallen. Dat is een beslissing voor Kas, want de oude richting stuurt nu de dichtheid, Huishouden en Anker.
  - Een herstelzin in Nate's berichten na een gemiste afspraak of klus.
