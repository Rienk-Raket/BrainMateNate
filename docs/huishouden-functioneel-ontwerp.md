# Functioneel ontwerp: Huishouden en Profiel

**FutureMe · versie 1.0 · 26 september 2026 · status: gebouwd en getest**

> **Leidende bron:** de inhoud van dit document staat ook gestructureerd in `kennis/huishouden.json`. De app leest dat bestand bij het bouwen in (als `FM_KENNIS`) en de deelbare webpagina (`kennis/index.html`) toont het. Pas bij wijzigingen eerst het JSON-bestand aan.

| | |
|---|---|
| Product | FutureMe, een Nederlandstalige, persoonlijke PWA die offline werkt en alles in één `index.html` houdt |
| Modules | Huishouden (onder Persoonlijk) en Profiel (voor de hele app) |
| Broncode | `ruimtelijk/src/profiel.js` (sectie 76), `huishouden-data.js` (77), `huishouden.js` (78), `huishouden-sessie.js` (79), `huishouden.css` |
| Database | IndexedDB `futureme`, versie 11 → 12 (nieuw: `hh_lijsten`, `hh_sessies`) |
| Gerelateerd | Checklists (sjablonen), Anker, Voortgang, Logboek, Wishlist, Side Hustle, Komend |

---

## 1. Doel en reikwijdte

### 1.1 Probleem
Huishoudklussen vragen precies de vaardigheden die bij ADHD en autisme vaak meer moeite kosten:
- **Beginnen** (taakinitiatie).
- **Volhouden** zonder afgeleid te raken.
- **Tijd inschatten** en plannen.
- **Wisselen** tussen deeltaken.
- **Verdragen van prikkels**, zoals geur, geluid en textuur.

Bij energiebeperking (burn-out, ME/CVS) komt daar een harde grens aan inspanning bij. Het gevolg is uitstel en rommel. Rommel hangt samen met stress: vrouwen die hun huis als rommelig of "onaf" omschreven, hadden een ongunstiger dagverloop van het stresshormoon cortisol (Saxbe & Repetti, 2010).

### 1.2 Doel
Huishouden maakt van "ik moet het huis doen" een reeks kleine, afgebakende stappen die in de beschikbare tijd passen. Er is steeds maar één stap tegelijk in beeld, en de aanpak past bij hoe iemands brein werkt. Profiel levert daarvoor de richting: een zelfgekozen of via tien vragen gevonden aanpak die door de hele app heen werkt.

### 1.3 Binnen de reikwijdte
- **Profiel:**
  - naam, geboortedatum (de leeftijd wordt berekend), lengte en gewicht;
  - de aanpak-richting;
  - een begroeting met naam.
- **App-brede aanpak:** `ndAanpak()` en tips per onderdeel.
- **Huishouden:**
  - schoonmaaklijsten, en import van checklist-sjablonen die met "Schoonmaken" beginnen;
  - een planner op basis van beschikbare tijd;
  - een sessiescherm met tesseract en kaartjes;
  - een samenvatting na afloop;
  - persoonlijke tijdkalibratie;
  - extra's.
- **Koppelingen:** Voortgang, Logboek, Anker en Checklists.

### 1.4 Buiten de reikwijdte
- Diagnostiek of medische adviezen. De vragenlijst is uitdrukkelijk geen test.
- Synchronisatie tussen apparaten of delen met anderen. Alles blijft op het toestel.
- Pushmeldingen. Een PWA op iOS ondersteunt die beperkt, en de app gebruikt ze niet.

---

## 2. Doelgroep en ontwerpprincipes

### 2.1 Richtingen (profielen)

| Richting | Herkenbaar aan | Wat helpt (samengevat) |
|---|---|---|
| ⚡ ADHD-kenmerken | Moeite met beginnen, afleiding, tijd slecht inschatten, verveling bij herhaling | Korte blokken, snel succes eerst, zichtbare tijd, directe feedback |
| 🧩 Autisme-kenmerken | Gevoeligheid voor prikkels, behoefte aan voorspelbaarheid, wisselen kost moeite | Vaste volgorde, alles vooraf te zien, een seintje vóór een wissel, prikkeltips |
| 🔀 ADHD- én autisme-kenmerken | Beide | Korte blokken in een vaste volgorde, met een seintje vóór elke wissel |
| 🔋 Weinig energie | Uitputting na gewone inspanning | Kleine porties, zwaar werk vroeg, vaak rust, een maximale sessieduur (pacing) |
| 🌿 Geen duidelijke richting | — | De standaardaanpak |

### 2.2 Ontwerpprincipes
1. **Eén ding tegelijk.** De sessie toont één kaartje. Het plan is vooraf te bekijken, maar tijdens het werk is alleen "nu" zichtbaar. Dat vermindert keuzestress en helpt bij beginnen.
2. **De tijd zichtbaar maken.** Een aftellende klok en een balk vervangen het innerlijke tijdsgevoel.
3. **De planning past altijd.** Het plan gaat nooit over de opgegeven tijd heen. Wat niet past, schuift zonder oordeel door.
4. **Geen schuld, geen streaks.** Stoppen telt ook, en "overgeslagen" is een neutrale status. Er is geen reeks om vol te houden.
5. **De gebruiker houdt de regie.** Niets start vanzelf. Elk automatisch voorstel is aan te passen of te negeren.
6. **Prikkels kunnen uit.** Rust, Prikkelarm en `prefers-reduced-motion` zetten animatie, geluid en trillen uit, en alles blijft volledig bruikbaar.
7. **Eerlijk over bewijs.** Waar het bewijs zwak is, staat dat erbij (zie §4).
8. **Privé.** Er gaat niets van het toestel af. Het profiel gaat alleen mee in de eigen back-up.

---

## 3. Informatiearchitectuur en navigatie

```
Persoonlijk ─┬─ tegel "Huishouden" ─► Huishouden (startpagina)
Meer ────────┘                           ├─ Samenvatting van de laatste sessie
                                         ├─ ✦ Start een schoonmaaksessie ─► onderblad "Klaarzetten" ─► Sessie (eigen scherm)
                                         ├─ ⚡ Reset in 5 min / 🎲 Gooi een klus
                                         ├─ Aan de beurt (ritme)
                                         ├─ Mijn lijsten ─► hhlijst (bewerken)
                                         ├─ Importeer uit Checklists / Startlijst / Eigen lijst
                                         ├─ Deze week (cijfers)
                                         ├─ Wat de app over jouw tijd leerde
                                         └─ Extra's (luistertip, meewerker, geluid)
Checklists ─► sjabloon "Schoonmaken …" ─► knop "Gebruik in Huishouden"
Instellingen ─► kaart Profiel ─► Profiel (uitklapbare secties)
Welkom (landingspagina) ─► titel "Goedemorgen <naam>"
```

**Weergaven:**
- `huishouden`, `hhlijst` (met als parameter het lijst-id) en `profiel`.
- De sessie is geen view, maar een aparte laag (`#hh-sessie`, z-index 95) boven de app.

---

## 4. Wetenschappelijke onderbouwing

Per bevinding staan hieronder de ontwerpkeuze, de bron en een eerlijke inschatting van de sterkte van het bewijs.

| # | Bevinding | Ontwerpkeuze | Bron | Sterkte |
|---|---|---|---|---|
| W1 | Kinderen en jongeren met ADHD schatten tijd minder nauwkeurig en minder precies in (Hedges' g ≈ 0,4–0,66), en overschatten tijd vaker. Het onderzoek betreft 27 studies, 1.620 mensen met ADHD en 1.249 controles. | Een aftellende klok en balk op elk kaartje; een tijdbuffer; kalibratie op de werkelijke duur. | Zheng e.a., 2022, *J. Atten. Disord.* | Meta-analyse, redelijk. Het gaat om jongeren; de resultaten zijn doorgetrokken naar volwassenen. |
| W2 | Mensen onderschatten stelselmatig hoe lang hun eigen taken duren (de planning-fallacy). Scriptiestudenten dachten 34 dagen nodig te hebben en deden er 55,5 over. | Een buffer van 15–30% per richting op elke schatting. De planner leert van de werkelijke tijden (§6.4). | Buehler, Griffin & Ross, 1994, *JPSP* | Klassiek en vaak herhaald. Sterk. |
| W3 | Vaste, geplande pauzes gaven minder vermoeidheid en afleiding en meer concentratie en motivatie dan zelf gekozen pauzes, bij dezelfde hoeveelheid afgerond werk. | Pauzes staan in het plan (na elke `pauzeElke` minuten), als eigen kaartje met een timer. | Biwer e.a., 2023, *Br. J. Educ. Psychol.* | Eén gerandomiseerde studie bij studenten. Matig. |
| W4 | Als-dan-plannen (implementatie-intenties) verhogen de kans dat een doel lukt; het effect is middelgroot tot groot (d = 0,65; 94 studies, ruim 8.000 deelnemers). Ze helpen vooral bij het beginnen. | Het kaartje beschrijft een concrete handeling ("Afval weggooien", niet "keuken"). Tips per taak geven de eerste stap. De tip bij Taken stelt een als-dan-plan voor. | Gollwitzer & Sheeran, 2006, *Adv. Exp. Soc. Psychol.* | Meta-analyse. Sterk. |
| W5 | Bij ADHD is er een sterke voorkeur voor kleine, directe beloningen boven grotere, latere (uitstelaversie). | Snel succes eerst: de kortste klus vooraan (≤ 5 min). Direct zichtbare feedback: het kaartje vliegt naar de stapel "gedaan" en de tesseract wordt feller. | Marx e.a., 2021, *J. Atten. Disord.* (meta-analyse) | Sterk voor het fenomeen. Dat deze specifieke vorm werkt, is niet getoetst. |
| W6 | Temptation bundling, oftewel iets leuks alleen samen met een moetje doen, gaf in een veldexperiment in het begin 51% meer sportschoolbezoek. Dat effect zakte later weg. | Veld "Alleen tijdens schoonmaken luister ik naar …", met een herinnering op het eerste kaartje. | Milkman, Minson & Volpp, 2014, *Management Science* | Eén veldexperiment; het effect neemt af. Matig. |
| W7 | Body doubling (werken in aanwezigheid van een ander) wordt veel gebruikt. De eerste studies zijn positief: een EEG-studie (n = 26) en een VR-studie (n = 12). Grote gerandomiseerde studies ontbreken. | Meewerker "Tess": een rustige aanwezigheid (de tesseract) met af en toe een zinnetje, standaard aan en uit te zetten. | ACM ASSETS 2025 (EEG); VR-studie 2025 (arXiv) | Zwak en vroeg. Eerlijk als experiment gepresenteerd. |
| W8 | Visuele activiteitenschema's gelden bij autisme als evidence-based practice. Wel is onduidelijk welk onderdeel precies werkt. | Het hele plan is vooraf te zien, in een vaste volgorde per ruimte, met een seintje één minuut vóór een wissel van ruimte. | Knight e.a., 2015 (review); Mouzakes e.a., 2025 (componentenreview) | Redelijk. Het onderdeel "voorspelbaarheid" op zich is onzeker. |
| W9 | Ongeveer driekwart van de autistische volwassenen meldt moeite met dagelijks schoonmaken; executieve functies hangen samen met dagelijkse vaardigheden. Sensorische prikkels (geur, textuur) spelen mee. | Prikkeltip bij klussen met middelen: "geurvrij middel of handschoenen"; een prikkelarme pauze. | Studie naar executieve functies bij volwassenen met ASS (PMC10127455); enquêtes in de praktijk | Correlationeel. Matig. |
| W10 | Bij energiebeperkende aandoeningen raden richtlijnen energiemanagement (pacing) aan: activiteiten opdelen, rust inplannen en pieken vermijden. | Blokken van hooguit 8 minuten, pauzes van 8 minuten, een maximale sessie van 45 minuten, zwaar werk vroeg, een energiecheck die zware klussen weglaat. | NICE-richtlijn NG206 (ME/CFS), 2021 | Richtlijn op basis van consensus en bewijs. |
| W11 | Rommel thuis hangt samen met een ongunstiger stresspatroon (cortisol). | Motivatie: "Reset in 5 dingen" maakt de zichtbare rommel snel kleiner. | Saxbe & Repetti, 2010, *PSPB* (n = 60) | Correlationeel. Zwak tot matig. |
| W12 | De vijf-dingen-aanpak (afval, afwas, was, dingen met een plek, dingen zonder plek) maakt opruimen behapbaar voor wie overweldigd raakt. | Startlijst "Reset in 5 dingen". | K.C. Davis, *How to Keep House While Drowning* (2022) | Praktijkbron, niet wetenschappelijk. |
| W13 | Screeners zoals de ASRS-6 (ADHD, AUC ≈ 0,90) en de AQ-10 (autisme) zijn gevalideerd. Een zelfgemaakte vragenlijst is dat niet. | De tien vragen zijn uitdrukkelijk zelfreflectie en geen test. De uitkomst is een richting voor handvatten, met verwijzing naar de huisarts. | Kessler e.a., 2007 (ASRS); Booth e.a., 2013 (AQ-10) | Principe van eerlijkheid. |

---

## 5. Functionele eisen

Notatie: **FR-xx**. Alle eisen zijn gebouwd en getest (§11).

### 5.1 Profiel
- **FR-01** De gebruiker kan naam, geboortedatum, lengte (cm) en gewicht (kg) invullen. Alles is optioneel en altijd te wijzigen, en wordt meteen opgeslagen bij het verlaten van een veld.
- **FR-02** De leeftijd wordt berekend uit de geboortedatum, met correctie als de verjaardag dit jaar nog niet is geweest.
- **FR-03** Gewicht: de laatste meting uit Gezondheid gaat vóór het profielveld. De bron wordt getoond. Een BMI verschijnt alleen als lengte en gewicht bekend zijn, met de kanttekening dat een BMI weinig zegt over één persoon.
- **FR-04** Het profiel bestaat uit vier uitklapbare secties: Over jou, Lichaam, Aanpak die bij je past, en In de app. De open sectie blijft onthouden.
- **FR-05** Tien vragen op een vijfpuntsschaal (nooit … heel vaak), in drie dimensies: A (aandacht en beginnen, 4 vragen), S (prikkels en voorspelbaarheid, 4) en E (energie, 2). Alle vragen zijn verplicht voordat er een uitkomst komt.
- **FR-06** Uitkomst: de richting volgt uit genormaliseerde scores (§6.1). Scores per dimensie worden als balken met percentage getoond.
- **FR-07** Via een keuzelijst "Mijn richting" kan de gebruiker de uitkomst van de vragen handmatig overschrijven.
- **FR-08** Bij elke uitkomst staat de tekst "Geen diagnose …", met verwijzing naar de huisarts.
- **FR-09** De aanpak wordt als tabel getoond: werkblok, pauze, buffer, volgorde, wisselseintje, maximale sessieduur en afkoelperiode.
- **FR-10** Anker krijgt een passend profiel ("anders" of "energie"), maar alleen als daar nog niets gekozen is.
- **FR-11** De titel van de landingspagina toont "Goedemorgen/Goedemiddag/Goedenavond/Goedenacht [voornaam]" zodra er een naam is ingevuld.
- **FR-12** Instellingen tonen bovenaan een profielkaart met initiaal, naam, leeftijd en richting.

### 5.2 App-brede aanpak
- **FR-13** `ndAanpak()` is de enige bron voor aanpakparameters (§6.2). Andere modules lezen alleen deze functie.
- **FR-14** Eén tipkaart per onderdeel, aan te passen via het profiel en uit te zetten met "Tips per onderdeel":
  - Persoonlijk (taken);
  - Komend (planning);
  - Side Hustle;
  - Wishlist (afkoelperiode van 72 of 24 uur bij aankopen boven € 50);
  - Huishouden.

### 5.3 Schoonmaaklijsten
- **FR-15** Een lijst heeft een naam, icoon, ritme (elke 1–30 dagen of geen) en taken. Een taak heeft een tekst, ruimte, minuten, zwaarte (licht, gemiddeld of zwaar), prioriteit (moet, normaal of bonus) en een aan/uit-stand.
- **FR-16** Er zijn vier startlijsten: Reset in 5 dingen, Keuken, Badkamer en Weekschoonmaak. Ze worden gekopieerd en zijn daarna vrij aan te passen.
- **FR-17** Een taak toevoegen: de duur komt uit de tekst ("(10 min)") of uit een trefwoordschatting; de zwaarte uit trefwoorden.
- **FR-18** Minuten ±1 per tik (1–120). De prioriteit wisselt per tik. Een taak kan uit (doet dan niet mee) of weg.
- **FR-19** "Aan de beurt" sorteert lijsten op achterstand: dagen sinds de laatste keer gedeeld door het ritme. Lijsten vanaf 80% van hun ritme verschijnen daar.

### 5.4 Import uit Checklists
- **FR-20** Alleen checklist-**sjablonen** waarvan de naam met "Schoonmaken" begint (hoofdletters maken niet uit) verschijnen als importeerbaar. Gewone checklists en andere sjablonen niet.
- **FR-21** Omzetting:
  - kopjes (`# Keuken` of `-- Keuken`) worden ruimtes;
  - `!` aan het begin betekent moet; `(bonus)` of `?` betekent bonus;
  - `(10 min)` wordt de duur;
  - het voorvoegsel "Schoonmaken –" valt weg uit de lijstnaam.
- **FR-22** Opnieuw importeren werkt de bestaande lijst bij. Aanpassingen die de gebruiker maakte (zoals minuten) blijven behouden bij taken met dezelfde tekst en ruimte.
- **FR-23** In een passend sjabloon in Checklists staat de knop "Gebruik in Huishouden" (of "Bijwerken").
- **FR-24** Is er geen passend sjabloon, dan kan de gebruiker een voorbeeldsjabloon "Schoonmaken – Keuken" laten aanmaken.

### 5.5 Sessie klaarzetten
- **FR-25** Het onderblad bevat een keuze voor de lijst, de beschikbare tijd (5, 10, 15, 20, 30, 45, 60 of 90 min; de laatste keuze wordt onthouden) en een optionele energiecheck (1–5).
- **FR-26** Het plan wordt bij elke wijziging opnieuw berekend en getoond:
  - de kaartjes, pauzes en minuten;
  - het totaal en de buffer;
  - wat nu niet past;
  - notities, zoals een maximale sessieduur of weinig energie.
- **FR-27** Het plan past **altijd** binnen de beschikbare tijd, of binnen de maximale sessieduur als die korter is.

### 5.6 De sessie
- **FR-28** Het scherm is donker en vult het hele beeld. In het midden draait, pulseert en gloeit een tesseract. Daaronder staat één zwart kaartje met een dikke witte rand en een gestikte binnenrand.
- **FR-29** Een kaartje toont:
  - "Klus n van N" en de ruimte;
  - de titel (bij opgeknipte taken "deel x van y");
  - de minuten ("aangepast op jouw tempo" als de kalibratie meespeelt);
  - een tip als die iets toevoegt;
  - de knoppen Start en Sla over.
- **FR-30** Start zet de timer aan: een aftellende klok, een balk, en de knoppen Klaar ✓ en Sla over.
- **FR-31** Klaar kan op drie manieren: naar rechts vegen (> 100 px), de knop Klaar of de pijl naar rechts. Het kaartje vliegt naar de stapel "gedaan" (een teller met gestapelde kaartjes).
- **FR-32** Sla over (naar links vegen, de knop of de pijl naar links) legt het kaartje één keer achteraan de rij. Bij de laatste klus geldt het als overgeslagen.
- **FR-33** Pauzes zijn eigen kaartjes, met een timer en een tip die bij de richting past.
- **FR-34** Als de tijd om is, verschijnen een zacht seintje (toon en trilling, als dat mag), de klok in amber en de knop "+2 min". De klok telt door met "+m:ss".
- **FR-35** Wisselseintje (bij de richtingen autisme en beide): één minuut voor het einde verschijnt "Over een minuut: naar [ruimte]", ook voor de schermlezer.
- **FR-36** De tesseract wordt feller naarmate er meer klussen gedaan zijn: gedaan gedeeld door het totaal (§6.5).
- **FR-37** Na de laatste klus ontploft de tesseract: schokgolf, deeltjes en een witte flits (ongeveer 1,5 s). Daarna gaat de app terug naar Huishouden met de samenvatting.
- **FR-38** Stop werkt pas bij twee keer tikken binnen 3,5 s ("Echt stoppen?"). Wat af is, blijft bewaard en de sessie telt als gestopt.
- **FR-39** Het scherm blijft aan (Wake Lock, als het toestel dat ondersteunt).

### 5.7 Samenvatting en leren
- **FR-40** De samenvatting toont:
  - een neutrale, bemoedigende zin;
  - het aantal gedane klussen van het totaal;
  - de gewerkte minuten;
  - de afwijking ten opzichte van de planning;
  - per klus de gebruikte tijd en de status;
  - wat blijft staan.
- **FR-41** Persoonlijke kalibratie: vanaf twee metingen van dezelfde klus gebruikt de planner een factor tussen werkelijke en geschatte tijd (§6.4). Het blok "Wat de app over jouw tijd leerde" laat de grootste afwijkingen zien.

### 5.8 Extra's
- **FR-42** ⚡ Reset in 5 min: maakt zo nodig de startlijst aan en zet een plan van 5 minuten klaar.
- **FR-43** 🎲 Gooi een klus: kiest willekeurig een klus van hooguit 5 minuten uit alle lijsten, met "Nog een keer" en "Start".
- **FR-44** 🎧 Luistertip (temptation bundling): een vrij tekstveld dat op het eerste kaartje verschijnt.
- **FR-45** 👥 Meewerker Tess (body doubling): een regel onder de tesseract, en elke 2,5 minuut werk een rustig zinnetje. Alleen zichtbaar, niet voorgelezen.
- **FR-46** Geluid en trillen apart aan of uit. Rust en Prikkelarm (Anker) gaan altijd voor.

### 5.9 Koppelingen
- **FR-47** Het logboek krijgt een regel per sessie ("Schoonmaken: n klussen, m min (lijst)"), met het filter "Huishouden".
- **FR-48** Voortgang krijgt de automatische bronnen "Minuten schoongemaakt" en "Huishoudklussen gedaan" (gebied Thuis en taken), plus mijlpalen (1, 10, 25 … klussen, en uren).
- **FR-49** Na elke sessie controleert Voortgang of er doelen behaald zijn.

---

## 6. Mechanieken

### 6.1 Van antwoorden naar richting
```
A = som(A-vragen) / 16   S = som(S-vragen) / 16   E = som(E-vragen) / 8        (elke vraag 0–4)
als A ≥ 0,56 en S ≥ 0,56      → audhd
anders als A ≥ 0,50 en A ≥ S  → adhd
anders als S ≥ 0,50           → autisme
anders als E ≥ 0,62           → energie
anders                        → geen
energie-vlag = E ≥ 0,62   (verzwaart elke andere richting: pauze na ≤ 20 min, pauze ≥ 8 min, sessie ≤ 60 min)
```
Een handmatige keuze gaat altijd vóór de uitkomst van de vragen.

### 6.2 Aanpakparameters (`ND_AANPAK`)

| Richting | Blok max. | Pauze na | Pauze | Buffer | Volgorde | Wisselseintje | Max. sessie | Afkoelperiode |
|---|---|---|---|---|---|---|---|---|
| adhd | 10 min | 25 min | 5 min | +25% | snel succes eerst | nee | — | 72 u |
| autisme | 15 min | 30 min | 5 min | +20% | vast per ruimte | ja | — | 24 u |
| audhd | 10 min | 25 min | 5 min | +30% | vast per ruimte | ja | — | 72 u |
| energie | 8 min | 15 min | 8 min | +30% | zwaar eerst | nee | 45 min | 24 u |
| geen | 20 min | 45 min | 5 min | +15% | vast per ruimte | nee | — | 24 u |

### 6.3 De planner (`hhMaakPlan`)
1. **Capaciteit:** `cap` is de gekozen tijd, begrensd door de maximale sessieduur.
   - Energie 1–2: de buffer gaat 10 procentpunt omhoog en zware klussen vallen weg, tenzij ze "moet" zijn.
2. **Schatting per klus:** `m = afronden(basis × kalibratiefactor)`.
3. **Kosten van een selectie:**
   - `werk × buffer + (ceil(werk × buffer / pauzeElke) − 1) × pauzeMin`.
4. **Selectie:**
   - Bij snel succes wordt eerst de kortste klus van hooguit 5 minuten gereserveerd.
   - Daarna gaat de planner gretig door de klussen, op volgorde moet → normaal → bonus en binnen elke groep in lijstvolgorde. Een klus komt erbij zolang de kosten ≤ `cap` blijven.
   - Past er niets, dan komt toch de kleinste klus in het plan, zodat er altijd iets is om mee te beginnen.
5. **Volgorde:**
   - *Vast:* per ruimte, in de volgorde van de lijst.
   - *Snel succes:* de korte klus vooraan, daarna per ruimte.
   - *Zwaar eerst:* op zwaarte aflopend.
   - Met *variatie* wisselen zware en lichte klussen elkaar af binnen een ruimte.
6. **Opknippen:** `totaal = afronden(m × buffer)` wordt verdeeld over `ceil(totaal / blokMax)` delen ("deel x van y").
7. **Pauzes:** na elke opgetelde `pauzeElke` minuten werk komt een pauzekaartje, maar nooit als laatste kaartje.
8. **Tips en seintjes:**
   - een taaktip op trefwoord;
   - varianten per richting (prikkeltip, "alleen deze", "mag zittend");
   - een `wissel` wanneer de volgende klus in een andere ruimte is.
9. **Garantie:** als afronden het totaal boven `cap` brengt, gaat er telkens één minuut af van het langste kaartje tot het past.

### 6.4 Persoonlijke tijdkalibratie
Voor elke klus wordt een sleutel gemaakt: de tekst in kleine letters, zonder duuraanduiding en leestekens.

```
factor(sleutel) = Σ werkelijke minuten / Σ basisminuten     over alle gedane keren
```
- De factor wordt pas gebruikt vanaf 2 metingen.
- Hij is begrensd tussen 0,5 en 3.
- Op het kaartje staat "aangepast op jouw tempo" als de factor meer dan 10% afwijkt.
- Dit richt zich rechtstreeks op W1 en W2: de app leert je echte tijd, in plaats van te vertrouwen op een gevoel dat stelselmatig afwijkt.

### 6.5 De tesseract
- **Geometrie:**
  - 16 hoekpunten (±1)⁴;
  - 32 ribben: paren die in precies één bit verschillen.
- **Rotatie** per frame in de vlakken XW, YW en ZW, plus een langzame XZ-kanteling. De snelheid is `0,22 + 0,55·i`, waarbij `i` de helderheid is (0–1).
- **Projectie** in twee stappen:
  1. 4D → 3D met perspectief `2,6 / (2,6 − 0,9·w)`;
  2. 3D → 2D met `4,2 / (4,2 − 0,8·z)`.
- **Licht:**
  - twee lagen lijnen: een brede gloed met schaduwvervaging `10 + 34i`, en een witte kern;
  - hoekpunten als lichtpunten;
  - een radiale gloed daarachter, begrensd tot de rand van het canvas;
  - de tint schuift van cyaan (hue 190) naar goud (hue 40) naarmate `i` stijgt.
- **Puls:** `sin(t · (1,6 + 1,4i)) · (0,5 + 0,5i)`, verwerkt in de gloed.
- **Helderheid:** `i` beweegt vloeiend naar `gedaan / totaal`, met een factor van 2,2 per seconde.
- **Explosie:**
  - 192 deeltjes, verdeeld langs de ribben, met een snelheid naar buiten;
  - een schokgolfring die vervaagt richting de rand;
  - een witte flits via CSS;
  - duur ongeveer 1,5 s.
- **Minder beweging:** er wordt één stilstaand beeld getekend, alleen opnieuw als de helderheid verandert, en er is geen explosie.

### 6.6 Vegen
- Pointer Events op het kaartje.
- De richting wordt pas vastgelegd na 10 px beweging. Bij een verticale beweging mag de pagina gewoon scrollen.
- Tijdens het slepen draait het kaartje mee (`dx/22` graden). Vanaf 70 px gloeit het groen (gedaan) of amber (later).
- Bij loslaten boven de 100 px gaat het kaartje weg; anders veert het terug.
- Knoppen en toetsen doen hetzelfde, dus vegen is nooit nodig.

---

## 7. Datamodel

### 7.1 `hh_lijsten` (keyPath `id`)
| Veld | Type | Betekenis |
|---|---|---|
| id | string | uid |
| naam, emoji | string | weergave |
| ritme | number | elke n dagen (0 = geen) |
| bron | { soort: "start"\|"checklist"\|"eigen", id } | herkomst; `checklist` verwijst naar het sjabloon |
| taken | Taak[] | zie hieronder |
| laatstGedaan | ISO-tijd \| null | gezet na een sessie met ≥ 1 gedane klus |
| gemaakt, bijgewerkt | ISO-tijd | |

**Taak:** `{ id, tekst, ruimte, min, zwaar: 0|1|2, prio: "moet"|"normaal"|"bonus", uit: boolean }`

### 7.2 `hh_sessies` (keyPath `id`, index `datum`)
| Veld | Betekenis |
|---|---|
| lijstId, lijstNaam | de lijst waaruit gepland is |
| datum, ts, gestart | datum (JJJJ-MM-DD), eindtijd, starttijd |
| beschikbaar, energie, richting | invoer en aanpak op het moment van plannen |
| werkMin, pauzeMin | gepland |
| resultaat[] | `{ soort, tekst, ruimte, taakId, min, basisMin, deel, delen, status: "gedaan"\|"overgeslagen"\|"niet", sec }` |
| werkSec, duurSec, afgebroken | gewerkte seconden, totale duur, of de sessie gestopt is |

### 7.3 Profiel (in `instellingen`, sleutel `profiel`)
`{ naam, geboortedatum, lengte, gewicht, nd: { antwoorden[10], richting, handmatig, energie, datum } }`

Andere instellingen:
- `ndTips`
- `hhLuister`
- `hhMeewerker`
- `hhGeluid`
- `hhLaatsteMin`

### 7.4 Migratie
- `DB_VERSIE` gaat van 11 naar 12.
- `onupgradeneeded` maakt alleen stores aan die nog ontbreken, met opties (index) uit `DB_OPTIES`.
- Getest: een database van versie 11 met gegevens opent als versie 12 met alles intact.
- Export en import nemen de nieuwe stores automatisch mee.

---

## 8. Toegankelijkheid en prikkels

- Alle acties zijn knoppen van minimaal 44 px (in de sessie 48–54 px). Vegen is alleen een snelkoppeling.
- De sessie is een `role="dialog"` met `aria-modal`. Nieuwe kaartjes, de timerstart, het wisselseintje, "tijd om" en het einde worden gemeld via `aria-live="assertive"`.
- Toetsen: → start of klaar, ← overslaan, Esc stoppen.
- Contrast: witte tekst op zwart in de sessie, focusrand in cyaan.
- `prefers-reduced-motion` en de instelling Rust zetten uit: rotatie, explosie, kaartanimaties, geluid en trillen.
- Prikkelarm (Anker) zet geluid en trillen ook hier uit.
- Tips staan nooit in de kop, en richtingen worden nooit als koptekst gebruikt: in Huishouden verschijnt geen "ADHD".

## 9. Privacy en veiligheid
- Er gaan geen gegevens van het toestel af, en er zijn geen externe scripts.
- De vragenlijst stelt geen diagnose. Dat staat op drie plekken: in de profieltekst, in de kaart "Geen diagnose" en in dit document.
- Het profiel staat in de lokale back-up. De gebruiker bepaalt zelf waar die heen gaat.

## 10. Niet-functionele eisen
| Eis | Invulling |
|---|---|
| Offline | Geen netwerk nodig; draait als PWA uit de cache |
| Prestaties | De tesseract is 32 lijnen op canvas (DPR ≤ 2); de lus pauzeert tekenen bij stilstand in de modus met minder beweging |
| Robuustheid | Wake Lock en audio staan in try/catch; ontbreekt `navigator.vibrate` (iPhone), dan gebeurt er niets |
| Onderhoud | Parameters staan op één plek (`ND_AANPAK`); schattingen en tips in tabellen (`HH_SCHATTING`, `HH_TIPS`) |

---

## 11. Acceptatietests (uitgevoerd in headless Chromium, 390×844)

De tests zijn gedraaid in licht, donker en met minder beweging. Resultaat: **alle tests slagen, zonder fouten in de console**. Ook de regressietests voor Anker (37) en Voortgang (15) slagen.

| # | Test | Resultaat |
|---|---|---|
| T1 | Een database van versie 11 met gegevens opent als versie 12; gegevens zijn intact en de nieuwe stores bestaan | ✔ |
| T2 | Leeftijd uit 14-03-1992 → 34 | ✔ |
| T3 | Vragen A-hoog / S-laag → richting ADHD; Anker-profiel → "anders" | ✔ |
| T4 | Begroeting: "Goedenavond Kas" | ✔ |
| T5 | Tips in Persoonlijk, Komend, Wishlist (noemt 72 uur) en Side Hustle | ✔ |
| T6 | Tegel Huishouden in Persoonlijk | ✔ |
| T7 | Import toont alléén "Schoonmaken – Badkamer" (niet "Inpaklijst schoonmaakspullen", niet de gewone checklist "Schoonmaken keuken") | ✔ |
| T8 | Omzetting: ruimtes uit kopjes, `! Wc (6 min)` → moet/6, `(bonus)` → bonus | ✔ |
| T9 | Plannen voor ADHD/30, autisme/30, energie/90, geen/60 en ADHD/5 passen allemaal in de tijd; geen kaartje langer dan het blokmaximum | ✔ |
| T10 | ADHD: eerste kaartje ≤ 3 min (snel succes); energie: maximaal 45 min | ✔ |
| T11 | Tijd- en energiekeuze plannen opnieuw; bij energie 1 verschijnt de melding | ✔ |
| T12 | Sessie: donker scherm, kaartje, timer loopt, vegen naar rechts → gedaan | ✔ |
| T13 | Overslaan legt het kaartje achteraan | ✔ |
| T14 | Tijd om → amber en "+2 min" | ✔ |
| T15 | Laatste kaartje → explosie → Huishouden met samenvatting, logregel en sessie opgeslagen; de helderheid steeg | ✔ |
| T16 | Kalibratie: 1,8× trager gemeten → factor 1,80 | ✔ |
| T17 | Stop (twee keer tikken) bewaart een sessie als gestopt | ✔ |
| T18 | Dobbelsteen kiest een klus van ≤ 5 min | ✔ |
| T19 | De knop "Gebruik in Huishouden" staat alleen bij sjablonen die met Schoonmaken beginnen | ✔ |
| T20 | Voortgang kent de huishoud-bronnen en -mijlpalen | ✔ |
| T21 | Export bevat `hh_lijsten`, `hh_sessies` en het profiel; na herladen is alles bewaard | ✔ |

**Nog te testen op iPhone:**
1. Vegen met de duim, als app op het beginscherm.
2. Of het scherm aan blijft (Wake Lock, iOS 16.4+).
3. De flits en de explosie op een 120-Hz-scherm.
4. VoiceOver door een volledige sessie.
5. Het geluidje met de stille modus aan (iOS dempt Web Audio dan).

---

## 12. Extra functies

### 12.1 Gebouwd
| Functie | Waarom leuk of handig | Onderbouwing |
|---|---|---|
| ⚡ **Reset in 5 min** | Het snelste zichtbare resultaat met de minste beslissingen | W11, W12 |
| 🎲 **Gooi een klus** | Keuzestress weg: de dobbelsteen kiest, jij begint | W4, W5 |
| 🎧 **Luistertip** | Je podcast of luisterboek alleen tijdens het schoonmaken | W6 |
| 👥 **Meewerker Tess** | Het gevoel dat je niet alleen bezig bent | W7 (experimenteel) |
| 📈 **"Wat de app over jouw tijd leerde"** | Je ziet je echte tempo; de planning klopt steeds beter | W1, W2 |
| 🔁 **Aan de beurt** | Het ritme per lijst laat zien wat het langst is blijven liggen | — |
| 🏁 **Voortgang-mijlpalen** | 10, 25, 50 … klussen en uren schoongemaakt, zonder reeks die je kunt breken | W5 |
| 🧵 **Stapel "gedaan"** | Kaartjes stapelen zich zichtbaar op | W5 |

### 12.2 Voorstellen voor een volgende versie
1. **Kamerkaart:** een plattegrond van je huis met per ruimte een kleur voor "hoe lang geleden".
2. **Samen schoonmaken:** twee telefoons in hetzelfde netwerk tonen elkaars kaartjes (body doubling met een echt persoon). Dit vraagt wel om een verbinding, en het uitgangspunt "niets verlaat je telefoon" moet dan worden heroverwogen.
3. **Timer-soundtracks:** een afspeellijst waarvan de duur gelijk is aan het plan, zodat de muziek laat horen hoeveel tijd er nog is.
4. **Foto voor en na**, alleen lokaal: zichtbaar resultaat als beloning.
5. **"Doe het nu"-regel:** een klus van ≤ 2 minuten die tijdens de sessie opvalt, krijgt een eigen snelknop.
6. **Seizoenslijsten:** de voorjaarsschoonmaak verschijnt automatisch als voorstel in maart.
7. **Aanpak meten:** A/B binnen de eigen gegevens, bijvoorbeeld blokken van 10 tegenover 15 minuten, om te zien wat voor jou het meeste afmaakt.

---

## 13. Begrippen
| Begrip | Betekenis |
|---|---|
| Taakinitiatie | Het vermogen om aan een taak te beginnen |
| Tijdsblindheid | Een afwijkende beleving en inschatting van tijd, vaak bij ADHD |
| Planning-fallacy | De algemene neiging om de eigen taakduur te onderschatten |
| Pacing | Energie verdelen door activiteiten op te delen en rust in te plannen |
| Body doubling | Een taak doen in aanwezigheid van een ander |
| Temptation bundling | Iets aantrekkelijks alleen koppelen aan een minder leuke taak |
| Tesseract | Een vierdimensionale kubus (hyperkubus), hier geprojecteerd naar 2D |

## 14. Bronnen
1. Zheng, Q., Wang, X., Chiu, K. Y., & Shum, K. K. (2022). Time perception deficits in children and adolescents with ADHD: a meta-analysis. *Journal of Attention Disorders.* https://journals.sagepub.com/doi/abs/10.1177/1087054720978557
2. Buehler, R., Griffin, D., & Ross, M. (1994). Exploring the "planning fallacy". *Journal of Personality and Social Psychology, 67*(3), 366–381. https://web.mit.edu/curhan/www/docs/Articles/biases/67_J_Personality_and_Social_Psychology_366,_1994.pdf
3. Biwer, F., e.a. (2023). Understanding effort regulation: comparing 'Pomodoro' breaks and self-regulated breaks. *British Journal of Educational Psychology.* https://pubmed.ncbi.nlm.nih.gov/36859717/
4. Gollwitzer, P. M., & Sheeran, P. (2006). Implementation intentions and goal achievement: a meta-analysis of effects and processes. *Advances in Experimental Social Psychology, 38.* https://psycnet.apa.org/record/2007-19538-002
5. Marx, I., Hacker, T., Yu, X., Cortese, S., & Sonuga-Barke, E. (2021). ADHD and the choice of small immediate over larger delayed rewards: a comparative meta-analysis. *Journal of Attention Disorders.* https://journals.sagepub.com/doi/abs/10.1177/1087054718772138
6. Milkman, K. L., Minson, J. A., & Volpp, K. G. M. (2014). Holding the Hunger Games hostage at the gym: an evaluation of temptation bundling. *Management Science, 60*(2), 283–299. https://pubsonline.informs.org/doi/10.1287/mnsc.2013.1784
7. Reading between the lines: exploring body doubling in ADHD using EEG (2025). *ACM SIGACCESS ASSETS.* https://dl.acm.org/doi/full/10.1145/3663547.3759743
8. You are not alone: designing body doubling for ADHD in virtual reality (2025). arXiv. https://arxiv.org/pdf/2509.12153
9. Knight, V., Sartini, E., & Spriggs, A. D. (2015). Evaluating visual activity schedules as evidence-based practice for individuals with autism spectrum disorders. *J. Autism Dev. Disord.* https://pubmed.ncbi.nlm.nih.gov/25081593/
10. Mouzakes e.a. (2025). A closer examination of the visual schedule component of interventions to improve transitions. *Behavioral Interventions.* https://onlinelibrary.wiley.com/doi/10.1002/bin.70028
11. Executive functions in daily living skills: a study in adults with autism spectrum disorder (2023). https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10127455/
12. NICE (2021). *Myalgic encephalomyelitis (or encephalopathy)/chronic fatigue syndrome: diagnosis and management* (NG206). https://www.nice.org.uk/guidance/ng206
13. Saxbe, D. E., & Repetti, R. (2010). No place like home: home tours correlate with daily patterns of mood and cortisol. *Personality and Social Psychology Bulletin.* https://journals.sagepub.com/doi/10.1177/0146167209352864
14. Davis, K. C. (2022). *How to Keep House While Drowning.* Simon Element. (praktijkbron)
15. Kessler, R. C., e.a. (2007). Validity of the WHO Adult ADHD Self-Report Scale (ASRS) Screener in a representative sample of health plan members. https://pubmed.ncbi.nlm.nih.gov/17623385/
16. Booth, T., e.a. (2013). Brief report: an evaluation of the AQ-10 as a brief screening instrument for ASD in adults. https://pubmed.ncbi.nlm.nih.gov/23640304/
17. CHADD. Is doing household chores related to executive functioning? https://chadd.org/attention-article/is-doing-household-chores-related-to-executive-functioning/
18. Anthropic (2026). Prompting best practices; Prompting Claude Opus 5.5. https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices, https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5 (voor de geoptimaliseerde prompt in `docs/prompts/`)
