# Opdracht "Nate alarmen" (eenmalig instellen)

Brain-Mate Nate kan op iOS geen melding sturen als de app dicht is, want daarvoor is een server nodig. De app Opdrachten kan wel herinneringen en wekkers zetten, lokaal op je iPhone. Nate geeft de tijden als tekst door via een lokale link (`shortcuts://run-shortcut`); er gaat niets over internet.

## Stappen

1. Open **Opdrachten**, tik op **+** en noem de opdracht **Nate alarmen** (precies zo, of pas de naam aan in Nate).
2. Tik op **ⓘ** (details) en zet **Ontvang invoer van** aan, soort **Tekst** (Receive Text input). Anders komt de tekst uit Nate niet binnen.
3. **Haal woordenboek op uit** *Invoer van opdracht* (Get Dictionary from Input).
4. **Haal waarde op voor** sleutel `alarmen` in *Woordenboek* (Get Dictionary Value).
5. **Herhaal met elk** item in *Woordenboekwaarde* (Repeat with Each). Daarbinnen, in deze volgorde:
   1. **Haal waarde op voor** `moment` in *Herhaalitem*, daarna **Haal datums op uit** die waarde (Get Dates from Input). Hernoem het resultaat naar *Wanneer*.
   2. **Haal waarde op voor** `titel` in *Herhaalitem*. Hernoem naar *Titel*.
   3. **Haal waarde op voor** `notitie` in *Herhaalitem*. Hernoem naar *Notitie*.
   4. **Voeg nieuwe herinnering toe** (Add New Reminder): titel *Titel*, waarschuw op *Wanneer*, notities *Notitie*.
   5. **Haal waarde op voor** `wekker` in *Herhaalitem*, daarna **Als** die waarde *is* `ja` (If): **Maak wekker aan** om *Wanneer* met label *Titel* (Create Alarm). Zie je die actie niet, sla hem over; de herinnering blijft.
6. Bij de eerste vraag om toestemming voor Herinneringen en Klok: **Sta altijd toe**.
7. In Nate: open een afspraak met een tijd → **Alarmen instellen** → **Test: herinnering over 2 minuten**. Krijg je die, tik op **Opdracht staat klaar**.

Een wekker in Klok kent alleen een kloktijd, geen datum. Daarom zet Nate `wekker` alleen op `ja` als de afspraak **vandaag** is; tik op de dag zelf nog eens op de knop. Herinneringen werken voor elke dag.

De namen van de acties kunnen per iOS-versie iets anders heten; zoek op het Engelse woord als het Nederlandse niet werkt.

## Wat Nate doorgeeft

```json
{ "app": "BrainMateNate", "versie": 1,
  "alarmen": [
    { "soort": "stoppen", "moment": "2026-10-02 13:10", "titel": "NU afronden waar je mee bezig bent, straks Tandarts", "notitie": "Tandarts · begint 14:00 · Stationsweg 12", "wekker": "nee" },
    { "soort": "voorbereiden", "moment": "2026-10-02 13:15", "titel": "NU spullen pakken voor Tandarts", "notitie": "…", "wekker": "nee" },
    { "soort": "vertrekken", "moment": "2026-10-02 13:25", "titel": "NU jas aan en vertrekken naar Tandarts", "notitie": "…", "wekker": "ja" } ] }
```

Terugrekenen: vertrekken = begin − reistijd − buffer (standaard 10); voorbereiden = vertrekken − voorbereidingstijd (standaard 10); stoppen = 5 minuten daarvoor. Zonder reistijd vallen vertrekken en de buffer weg. Momenten die al voorbij zijn, worden niet doorgegeven.

## Reserve

**Naar Agenda** (.ics) bevat bij een afspraak met reistijd dezelfde drie alarmen plus het bestaande alarm 15 minuten vooraf.
