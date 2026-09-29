# Geoptimaliseerde prompt: Huishouden, Profiel en neurodiversiteitsprofiel

Herschreven volgens de actuele promptrichtlijnen van Anthropic voor Claude Opus 5.5 (september 2026):

- [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- [Prompting Claude Opus 5.5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5)

## Wat er is veranderd

| Richtlijn | Wat dat betekent in deze prompt |
|---|---|
| **Uitkomst, context, grenzen, verificatie en klaar-conditie** noemen. Dat is het meest betrouwbare patroon voor Opus 5.5. | Er zijn aparte blokken `<doel>`, `<context>`, `<grenzen>`, `<klaar_als>`. |
| **Leg uit waarom** een eis bestaat, niet alleen wát. | Elke ontwerpkeuze krijgt één zin reden (bijvoorbeeld: waarom kaartjes één voor één verschijnen). |
| **XML-tags** voor prompts die instructies, context en invoer mengen. | Alle secties staan in vaste, beschrijvende tags. |
| **Zeg wat wél moet**, niet alleen wat niet mag. | Bijvoorbeeld "geen diagnose" is herschreven tot "presenteer het als richting en verwijs naar de huisarts". |
| **Onderzoek**: geef succescriteria en laat bronnen verifiëren. | Er staat een blok `<onderzoek>` met het type bronnen dat telt en hoe je ze vermeldt. |
| **Geen "controleer het nog eens"-instructies**. Opus 5.5 controleert zichzelf al; extra verificatie-opdrachten maken het trager. | In plaats daarvan staan er concrete acceptatiecriteria in. |
| **Frontend**: noem concrete stijlen die je níet wilt. Een algemene opmerking als "vermijd een AI-look" werkt slecht. | Het sessiescherm krijgt precieze visuele eisen en een korte lijst stijlen om te vermijden. |
| **Toon voor langere autonome taken**: noem wanneer stoppen wél gewenst is. | Er is een blok `<werkwijze>` met stopmomenten. |
| **Eén vraag per punt, genummerd** als volgorde of volledigheid telt. | De functies zijn genummerd, zodat niets wegvalt. |

## De prompt

```xml
<rol>
Je bent een senior front-end ontwikkelaar en productontwerper met kennis van
gedragswetenschap en neurodiversiteit (ADHD, autisme, energiebeperkende
aandoeningen). Je werkt aan FutureMe: een Nederlandstalige, persoonlijke PWA
in één index.html (vanilla JS, IndexedDB, geen frameworks, geen CDN's),
opgebouwd uit bronbestanden in ruimtelijk/src die ruimtelijk/bouw.py samenvoegt.
</rol>

<doel>
Bouw een module Huishouden (onder het tabblad Persoonlijk) en een app-breed
Profiel. Samen helpen ze iemand die snel afgeleid is, moeilijk begint en vaak
te laat is om een huishoudklus echt af te maken. Lever daarnaast een
functioneel specificatiedocument.
</doel>

<context>
De gebruiker is volwassen en herkent zich in ADHD-achtige kenmerken:
moeite met beginnen (taakinitiatie), snel afgeleid, tijd slecht inschatten.
Andere gebruikers kunnen zich meer in autisme of in weinig energie herkennen.
De app is privé en offline: niets verlaat het toestel. Bestaande modules
(Checklists met sjablonen, Anker, Voortgang, Taken, Wishlist, Side Hustle)
blijven werken; bestaande gegevens mogen nooit verloren gaan.
</context>

<onderzoek>
Onderbouw de ontwerpkeuzes met wetenschappelijke bronnen: meta-analyses,
gerandomiseerde studies of peer-reviewed reviews. Blogs tellen niet als bewijs.
Onderwerpen: taakinitiatie en executieve functies bij ADHD en autisme,
tijdsperceptie (tijdsblindheid), de planning-fallacy, geplande pauzes
(Pomodoro), implementatie-intenties, directe beloning en uitstelaversie,
body doubling, visuele schema's en voorspelbaarheid bij autisme, pacing bij
energiebeperking, en rommel en stress thuis.
Vermeld per bron auteur, jaar, steekproef en wat het wél en níet laat zien.
Is het bewijs zwak of ontbreekt het, zeg dat dan eerlijk.
</onderzoek>

<functies>
1. Profiel (app-breed, altijd te wijzigen, via uitklapbare secties):
   naam, geboortedatum (leeftijd wordt berekend), lengte, gewicht, en een
   vragenlijst van 10 vragen die een richting geeft (ADHD-kenmerken,
   autisme-kenmerken, beide, weinig energie, of geen duidelijke richting).
   Presenteer de uitkomst als richting voor handvatten, niet als diagnose,
   en verwijs voor een echte beoordeling naar de huisarts. Dit is een
   zelfreflectie en geen gevalideerde test; misleiden zou schadelijk zijn.
   De gebruiker kan de richting handmatig kiezen of overschrijven.
2. Begroeting: toon linksboven op de startpagina "Goedemorgen [naam]"
   (of middag/avond/nacht), zodra een naam is ingevuld.
3. App-brede aanpassing: de profielrichting stuurt de indeling van klussen,
   taken, planning, side hustles en wishlist-afwegingen (bijvoorbeeld een
   afkoelperiode bij impulsaankopen). Dat helpt omdat elke richting andere
   handvatten nodig heeft.
4. Huishouden-tab met een eigen icoon: een blinkende vloer die gebezemd wordt.
5. Import: toon alleen checklist-sjablonen waarvan de naam met "Schoonmaken"
   begint. Bouw die om tot een schoonmaaklijst met taken, ruimtes en een
   geschatte duur.
6. Plannen: na het kiezen van een lijst geeft de gebruiker op hoeveel tijd
   er is. De app deelt taken in behapbare blokken met geplande pauzes,
   passend bij de profielrichting, inclusief een tijdbuffer
   (vanwege de planning-fallacy).
7. Sessiescherm:
   - donker, met in het midden een draaiende, pulserende, lichtgevende
     tesseract;
   - één zwart kaartje met een dikke witte "geborduurde" rand: de taak, de
     tijd en zo nodig een tip;
   - Start zet de timer aan; wegvegen betekent klaar, waarna de volgende taak
     of een geplande pauze komt;
   - de tesseract wordt per kaartje feller en ontploft bij het laatste, waarna
     de app terugkeert naar Huishouden met een samenvatting.
   Eén kaartje tegelijk verlaagt keuzestress en helpt bij beginnen.
8. Extra's die schoonmaken makkelijker of leuker maken, zoals een
   meeluistermodus (temptation bundling), een virtuele meewerker
   (body doubling), een dobbelsteen tegen keuzestress en een
   "reset in 5 minuten".
</functies>

<ontwerp>
Het sessiescherm is een aparte, donkere wereld; de rest van de app houdt
zijn huidige stijl. Vermijd: crèmekleurige achtergronden, cursieve
accentwoorden in koppen, genummerde "01/02/03"-labels en pilvormige knoppen
als enige knopvorm.
Respecteer prefers-reduced-motion en de bestaande instellingen Rust en
Prikkelarm: zonder animatie blijft alles bruikbaar. Tikdoelen zijn minimaal
44 px. Alles moet met een schermlezer werken, en vegen heeft altijd een
knop als alternatief.
</ontwerp>

<grenzen>
- Verhoog DB_VERSIE met precies 1 en maak alleen nieuwe stores aan.
- Geen externe scripts of diensten; alles werkt offline.
- Geen diagnose-labels als kop; geen streak-tellers die schuldgevoel geven.
- Nieuwe code in genummerde secties met Nederlands commentaar, in
  ruimtelijk/src, en opgenomen in bouw.py.
</grenzen>

<werkwijze>
Werk zelfstandig door tot alles klaar is. Stop alleen als iets echt niet
verder kan zonder mijn input. Geef tussendoor korte statusregels. Test in
een headless browser (licht en donker, iPhone-formaat), commit met een
Nederlandse commitboodschap en push naar de werkbranch en main.
</werkwijze>

<klaar_als>
- Een oude database (versie N) opent als N+1 met alle gegevens intact.
- Een sjabloon "Schoonmaken – Keuken" verschijnt als import; "Inpaklijst" niet.
- Met 30 minuten en profiel ADHD ontstaat een plan met blokken van
  hooguit 15 minuten, geplande pauzes en een buffer; het plan past in de tijd.
- De sessie loopt van eerste kaartje tot explosie en samenvatting, ook zonder
  animatie en met alleen knoppen.
- De begroeting toont de naam; het profiel is volledig aan te passen.
- De profielrichting verandert zichtbaar iets in Huishouden, Wishlist en Anker.
- Er is een functioneel specificatiedocument met werking, mechanieken,
  onderbouwing, bronnen en extra functies.
</klaar_als>
```
