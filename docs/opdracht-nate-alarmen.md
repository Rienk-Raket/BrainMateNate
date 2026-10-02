# Opdracht "Nate alarmen" (eenmalig instellen)

Brain-Mate Nate kan op iOS geen melding sturen als de app dicht is, want daarvoor is een server nodig. De app Opdrachten kan wel herinneringen en wekkers zetten, lokaal op je iPhone. Nate geeft de tijden als tekst door via een lokale link (`shortcuts://run-shortcut`); er gaat niets over internet.

## Stappen

1. Open **Opdrachten** en tik op **+**. Noem de opdracht **Nate alarmen** (precies zo, of pas de naam aan in Nate).
2. **Haal woordenboek op uit** *Invoer van opdracht* (Get Dictionary from Input).
3. **Haal waarde op voor** `alarmen` in *Woordenboek* (Get Dictionary Value).
4. **Herhaal met elk** (Repeat with Each) item in *Woordenboekwaarde*. Daarbinnen:
   1. **Haal waarde op voor** `moment` in *Herhaalitem*, daarna **Haal datums op uit invoer** (Get Dates from Input).
   2. **Voeg nieuwe herinnering toe** (Add New Reminder): titel = waarde `titel`, waarschuw = *Datums*, notities = waarde `notitie`.
   3. **Als** (If) waarde `wekker` *is* `ja`: **Maak wekker aan** (Create Alarm) op *Datums*, label = waarde `titel`. Zie je die actie niet, sla hem over; de herinnering blijft.
5. Bij de eerste vraag om toestemming voor Herinneringen en Klok: **Sta altijd toe**.
6. In Nate: open een afspraak met een tijd → **Alarmen instellen** → **Test: herinnering over 2 minuten**. Krijg je die, tik op **Opdracht staat klaar**.

De namen van de acties kunnen per iOS-versie iets anders heten; zoek op het Engelse woord als het Nederlandse niet werkt.

## Wat Nate doorgeeft

```json
{ "app": "BrainMateNate", "versie": 1,
  "alarmen": [
    { "soort": "stoppen", "moment": "2026-10-02 13:10", "titel": "NU afronden: over 5 minuten voorbereiden voor Tandarts", "notitie": "Tandarts · begint 14:00 · Stationsweg 12", "wekker": "nee" },
    { "soort": "voorbereiden", "moment": "2026-10-02 13:15", "titel": "NU spullen pakken voor Tandarts", "notitie": "…", "wekker": "nee" },
    { "soort": "vertrekken", "moment": "2026-10-02 13:25", "titel": "NU jas aan en vertrekken naar Tandarts", "notitie": "…", "wekker": "ja" } ] }
```

Terugrekenen: vertrekken = begin − reistijd − buffer (standaard 10); voorbereiden = vertrekken − voorbereidingstijd (standaard 10); stoppen = 5 minuten daarvoor. Zonder reistijd vallen vertrekken en de buffer weg. Momenten die al voorbij zijn, worden niet doorgegeven.

## Reserve

**Naar Agenda** (.ics) bevat dezelfde drie alarmen plus het bestaande alarm 15 minuten vooraf.
