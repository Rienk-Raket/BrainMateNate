"use strict";
/* ==========================================================================
   54. Side Hustle — Theorie
   Korte lessen per fase (idee → groeien), gebaseerd op bekende methoden:
   effectuation, Lean Startup, The Mom Test, Value Proposition Design, SCRUM,
   Traction (Bullseye) en AARRR. Elke les eindigt met "Toepassen": een model
   invullen, een checklistpunt of experiment maken, of naar SCRUM.
   Gelezen-status en je eigen reflectie per side hustle staan in sh_leren
   (één record per les, id = les-id).
   ========================================================================== */
const SH_LES_ONDERWERPEN = {
  starten: ["Starten", "🌱"], klant: ["Klant & probleem", "🧑‍🤝‍🧑"], valideren: ["Valideren", "🧪"], waarde: ["Waarde & prijs", "💎"],
  werken: ["Werken & plannen", "🏃"], regels: ["Regels & geld", "⚖️"], groei: ["Klanten & groei", "📈"]
};
/* toepassen: ["model", sjId] | ["check", titel, categorie] | ["experiment", hypothese] | ["tab", tab] | ["instellingen"] */
const SH_LESSEN = [
  { id: "effectuation", titel: "Begin met wat je hebt", onderwerp: "starten", fasen: ["idee"], min: 4, emoji: "🧺",
    kort: "Ondernemers starten zelden met een groot plan. Ze beginnen met hun middelen en wat ze kunnen missen.",
    tekst: `Onderzoek van Saras Sarasvathy onder ervaren ondernemers laat zien dat zij anders denken dan managers. Ze voorspellen minder en *doen* meer. Dat heet **effectuation**.

## De vijf principes
- **Vogel in de hand**: begin met wie je bent, wat je weet en wie je kent. Niet met het perfecte idee.
- **Betaalbaar verlies**: bepaal vooraf wat je maximaal wilt inzetten aan geld en uren. Dan hoef je de toekomst niet te voorspellen.
- **Lappendeken**: zoek partners die zich willen committeren. Zij bepalen mee welke kant het op gaat.
- **Limonade**: verrassingen zijn geen tegenvallers maar kansen.
- **Piloot in het vliegtuig**: je beïnvloedt de toekomst door te handelen, niet door te wachten.

## Wat betekent dit voor jou?
Je side hustle hoeft niet af te hangen van een marktonderzoek. Hij hangt af van je middelen, je grens en je eerste stappen. Schrijf je middelen op en leg je betaalbaar verlies vast.`,
    punten: ["Start met je middelen, niet met een doel", "Leg vooraf vast wat je kunt missen", "Handel eerst, plan daarna bij"],
    toepassen: [["model", "sj.middelen"], ["instellingen"]], bron: "Sarasvathy, *Effectuation* (2008)" },
  { id: "probleem", titel: "Verliefd op het probleem", onderwerp: "klant", fasen: ["idee", "valideren"], min: 4, emoji: "🎯",
    kort: "Mensen kopen geen product, ze huren het in om een klus gedaan te krijgen.",
    tekst: `De meeste nieuwe producten mislukken niet omdat ze slecht gemaakt zijn, maar omdat niemand er echt op zat te wachten. Begin daarom bij het probleem.

## Jobs to be done
Clayton Christensen stelde de vraag: *welke klus probeert iemand gedaan te krijgen?* Een klant koopt geen boor, maar een gat in de muur, en eigenlijk een opgehangen schilderij.

## Drie vragen
- **Wie** heeft dit probleem, en in welke situatie?
- **Hoe vaak** speelt het, en hoe pijnlijk is het?
- **Wat doen ze nu**? Het huidige alternatief is je echte concurrent, ook als dat Excel of "niets doen" is.

Hoe concreter je klant, hoe makkelijker je hem vindt. "Iedereen" is geen doelgroep.`,
    punten: ["Beschrijf één concrete klant in één situatie", "Het huidige alternatief is je concurrent", "Pijn × frequentie bepaalt de waarde"],
    toepassen: [["model", "sj.persona"], ["check", "Vijf mensen uit je doelgroep spreken over hun probleem", "scope"]], bron: "Christensen e.a., *Competing Against Luck* (2016)" },
  { id: "leancanvas", titel: "Het Lean Canvas in twintig minuten", onderwerp: "starten", fasen: ["idee"], min: 3, emoji: "🧩",
    kort: "Je hele plan op één pagina, zodat je ziet welke aanname het riskantst is.",
    tekst: `Ash Maurya maakte het **Lean Canvas** als snelle variant van het Business Model Canvas, speciaal voor starters. Je vult het in twintig minuten in en past het vaak aan.

## Volgorde van invullen
1. Probleem en klantsegment
2. Unieke waardepropositie: één zin die zegt waarom je anders bent
3. Oplossing: de kleinste versie
4. Kanalen: hoe bereik je klanten?
5. Inkomsten en kosten
6. Kerncijfers: wat meet je?
7. Oneerlijk voordeel: wat kan niemand makkelijk kopiëren?

Twijfel je bij een vak? Schrijf je beste gok op en markeer het als aanname. Dat vak test je als eerste.`,
    punten: ["Eén pagina, snel en vaak bijwerken", "Onzekere vakken zijn aannames", "Oneerlijk voordeel mag leeg blijven"],
    toepassen: [["model", "sj.lean"]], bron: "Maurya, *Running Lean* (2012)" },
  { id: "aannames", titel: "Riskantste aanname eerst", onderwerp: "valideren", fasen: ["idee", "valideren"], min: 3, emoji: "🎲",
    kort: "Test eerst wat je hele idee onderuit haalt als het niet klopt.",
    tekst: `Elk idee rust op aannames: mensen hebben dit probleem, ze betalen deze prijs, je bereikt ze via dit kanaal. Ze zijn niet allemaal even belangrijk.

## Aannames in kaart
Zet elke aanname op twee assen:
- **Belangrijk**: valt je idee om als dit niet klopt?
- **Bewijs**: heb je al bewijs, of is het een gok?

De aannames die **belangrijk én onbewezen** zijn, test je eerst. Vaak is dat: *wil iemand hiervoor betalen?*

## Formuleer toetsbaar
"Wij geloven dat [klant] [gedrag] doet. We weten dat het klopt als [meetbaar resultaat] binnen [tijd]."`,
    punten: ["Belangrijk én onbewezen = eerst testen", "Schrijf aannames toetsbaar op", "Betalen is meestal de riskantste"],
    toepassen: [["model", "sj.aannames"], ["experiment", "Mijn riskantste aanname klopt"]], bron: "Bland & Osterwalder, *Testing Business Ideas* (2019)" },
  { id: "momtest", titel: "Het klantgesprek (The Mom Test)", onderwerp: "klant", fasen: ["valideren"], min: 4, emoji: "💬",
    kort: "Vraag naar wat mensen gedaan hebben, niet naar wat ze van je idee vinden.",
    tekst: `Iedereen, zelfs je moeder, zegt dat je idee goed is. Dat is aardig, maar het is geen bewijs. Rob Fitzpatrick schreef daarom regels voor gesprekken die wél iets opleveren.

## Drie regels
- **Praat over hun leven, niet over je idee.**
- **Vraag naar het verleden**, niet naar de toekomst. "Wanneer had je dit probleem voor het laatst?" is beter dan "Zou je dit kopen?".
- **Luister meer dan je praat.**

## Goede vragen
- Wat is het lastigste aan …?
- Wat heb je al geprobeerd om het op te lossen?
- Wat kostte dat je, in tijd of geld?
- Wie moet ik nog meer spreken?

Een compliment is geen data. Een toezegging wel: tijd, een voorbestelling of een introductie.`,
    punten: ["Vraag naar feiten uit het verleden", "Complimenten tellen niet", "Vraag om een toezegging"],
    toepassen: [["model", "sj.interview"], ["check", "Vijf klantgesprekken voeren volgens The Mom Test", "scope"]], bron: "Fitzpatrick, *The Mom Test* (2013)" },
  { id: "mvp", titel: "De kleinste test: vormen van een MVP", onderwerp: "valideren", fasen: ["valideren", "bouwen"], min: 4, emoji: "🧪",
    kort: "Een MVP is geen klein product, maar het kleinste experiment dat je iets leert.",
    tekst: `Een **Minimum Viable Product** is de goedkoopste manier om een aanname te testen met echt gedrag van klanten.

## Soorten MVP
- **Landingspagina**: beschrijf je aanbod en meet hoeveel mensen zich aanmelden.
- **Voorverkoop**: laat mensen vooraf betalen of reserveren. Het sterkste bewijs dat er is.
- **Concierge**: lever de dienst eerst helemaal met de hand, aan een paar klanten.
- **Wizard of Oz**: het lijkt automatisch, maar jij doet het werk achter de schermen.
- **Eén stuk**: maak één product en verkoop het, voordat je een voorraad aanlegt.

Kies de vorm die de aanname test met het minste werk. Bouw pas als het experiment slaagt.`,
    punten: ["MVP = experiment, geen mini-product", "Voorverkoop is het sterkste bewijs", "Eerst met de hand, dan automatiseren"],
    toepassen: [["experiment", "Mensen melden zich aan of betalen vooraf"], ["tab", "scrum"]], bron: "Ries, *The Lean Startup* (2011)" },
  { id: "experiment", titel: "Een goed experiment", onderwerp: "valideren", fasen: ["valideren"], min: 3, emoji: "📏",
    kort: "Bouwen, meten, leren: met een criterium dat je vooraf vastlegt.",
    tekst: `De **Bouwen-Meten-Leren-lus** van Eric Ries werkt alleen als je eerlijk meet. Leg daarom alles vast *voordat* je begint.

## Vier onderdelen
- **Hypothese**: wat geloof je?
- **Test**: wat ga je doen?
- **Meting**: wat tel je?
- **Criterium**: vanaf welk getal is het geslaagd?

## Voorbeeld
Hypothese: zzp'ers betalen € 19 per maand voor mijn sjabloon. Test: landingspagina met voorinschrijving, gedeeld met 200 contacten. Meting: aantal inschrijvingen. Criterium: 20 of meer in twee weken.

Na afloop kies je: **doorgaan**, **bijsturen** of **stoppen**. Een mislukt experiment is geen mislukking. Het bespaart je maanden bouwen.`,
    punten: ["Criterium vooraf vastleggen", "Tel gedrag, geen meningen", "Elke uitkomst levert een besluit op"],
    toepassen: [["experiment", "Mijn aanname klopt"]], bron: "Ries, *The Lean Startup* (2011)" },
  { id: "pivot", titel: "Doorgaan, bijsturen of stoppen", onderwerp: "valideren", fasen: ["valideren", "bouwen", "lanceren"], min: 3, emoji: "🧭",
    kort: "Een pivot is een koerswijziging op basis van wat je geleerd hebt.",
    tekst: `Na elk experiment neem je een besluit. Bijsturen heet een **pivot**: je verandert één onderdeel en houdt de rest.

## Veelvoorkomende pivots
- **Klantsegment**: het probleem is echt, maar voor een andere groep.
- **Probleem**: je klant heeft een ander, groter probleem.
- **Zoom**: één functie blijkt het hele product te zijn.
- **Kanaal**: dezelfde oplossing, een andere weg naar de klant.
- **Verdienmodel**: van eenmalig naar abonnement, of andersom.

## Wanneer stoppen?
Als je betaalbaar verlies op is, of als drie experimenten achter elkaar geen beweging laten zien. Stoppen is een besluit, geen falen. Leg vast wat je geleerd hebt.`,
    punten: ["Verander één ding tegelijk", "Je betaalbaar verlies is je stopregel", "Leg lessen vast, ook bij stoppen"],
    toepassen: [["model", "sj.aannames"]], bron: "Ries, *The Lean Startup* (2011)" },
  { id: "waardepropositie", titel: "Waarom kiest iemand voor jou?", onderwerp: "waarde", fasen: ["valideren", "bouwen"], min: 4, emoji: "💎",
    kort: "Het Value Proposition Canvas koppelt je aanbod aan de taken, pijnen en winsten van je klant.",
    tekst: `Het **Value Proposition Canvas** heeft twee helften.

## Klantprofiel (rechts)
- **Taken**: wat probeert je klant gedaan te krijgen?
- **Pijnen**: wat irriteert, kost te veel of gaat mis?
- **Winsten**: wat zou hem blij maken?

## Waardekaart (links)
- **Producten en diensten**: wat bied je aan?
- **Pijnverzachters**: welke pijn neem je weg?
- **Winstmakers**: welke winst lever je?

Je hebt een **fit** als je aanbod de belangrijkste pijnen en winsten raakt. Niet alle, maar de belangrijkste. Formuleer daarna je belofte in één zin.`,
    punten: ["Begin rechts, bij de klant", "Raak de belangrijkste pijnen", "Eén zin als belofte"],
    toepassen: [["model", "sj.vpc"]], bron: "Osterwalder e.a., *Value Proposition Design* (2014)" },
  { id: "prijs", titel: "Je prijs bepalen", onderwerp: "waarde", fasen: ["bouwen", "lanceren"], min: 5, emoji: "🏷️",
    kort: "Starters vragen bijna altijd te weinig. Reken van onderaf en kijk dan naar de waarde.",
    tekst: `Er zijn drie manieren om een prijs te bepalen. Gebruik ze samen.

## 1. Kostprijs plus
Tel alle kosten per stuk of per uur op en zet er een marge bovenop. Dit is je **ondergrens**.

## 2. Concurrentie
Wat kost het alternatief? Dat bepaalt wat klanten normaal vinden.

## 3. Waarde
Wat levert het de klant op, in tijd of geld? Een prijs van 10 tot 20% van de waarde is vaak redelijk.

## Uurtarief voor diensten
Je declareert niet al je uren. Reken met ongeveer 60% declarabele tijd, en tel belasting, verzekeringen, pensioen en vakantie mee. Een tarief onder de € 50 per uur is voor een zzp'er zelden gezond.

## Break-even
Vaste kosten per maand ÷ (prijs − variabele kosten per stuk) = aantal verkopen dat je nodig hebt om quitte te spelen.`,
    punten: ["Kostprijs is de ondergrens, geen prijs", "Niet elk uur is declarabel", "Ken je break-even-aantal"],
    toepassen: [["model", "sj.uurtarief"], ["model", "sj.breakeven"]], bron: "KVK, *Je tarief berekenen*; Nagle & Müller, *The Strategy and Tactics of Pricing*" },
  { id: "scrum", titel: "SCRUM voor één persoon", onderwerp: "werken", fasen: ["bouwen", "lanceren", "groeien"], min: 5, emoji: "🏃",
    kort: "Werk in korte sprints met een vast ritme. Ook als je alleen bent.",
    tekst: `SCRUM is gemaakt voor teams, maar het ritme werkt ook naast een baan.

## De onderdelen
- **Productdoel**: waar werk je deze maanden naartoe?
- **Backlog**: alles wat je zou kunnen doen, op volgorde van waarde.
- **Sprint**: een vaste periode van één tot vier weken met een doel.
- **Daily**: twee minuten per werkdag. Wat deed ik, wat ga ik doen, wat houdt me tegen?
- **Review**: wat heb ik opgeleverd, en wat vond de klant ervan?
- **Retrospective**: wat ging goed, wat kan beter, wat probeer ik volgende sprint?

## Definition of Ready en Done
Een kaart is **ready** als hij duidelijk en klein genoeg is. Hij is **done** als hij voldoet aan je vaste lijst, zoals "getest" en "bestanden bijgewerkt".

## Tip
Plan niet meer punten dan je vorige sprint haalde. Dat heet je **velocity**.`,
    punten: ["Kort ritme, vast doel", "Plan op je velocity", "Retro: één verbetering per sprint"],
    toepassen: [["tab", "scrum"]], bron: "Schwaber & Sutherland, *The Scrum Guide* (2020)" },
  { id: "moscow", titel: "Prioriteren: MoSCoW en impact", onderwerp: "werken", fasen: ["bouwen", "lanceren"], min: 3, emoji: "⚖️",
    kort: "Niet alles is even belangrijk. Kies bewust wat je níet doet.",
    tekst: `Met weinig tijd is kiezen belangrijker dan hard werken.

## MoSCoW
- **Must**: zonder dit werkt het niet.
- **Should**: belangrijk, maar het kan even zonder.
- **Could**: leuk als er tijd over is.
- **Won't**: bewust niet, in elk geval nu niet.

## Impact en moeite
Zet taken op twee assen. **Veel impact, weinig moeite** doe je eerst. **Weinig impact, veel moeite** schrap je.

Een goede sprint heeft ongeveer 60% Must. Als alles Must is, heb je niet gekozen.`,
    punten: ["Won't is ook een keuze", "Eerst veel impact, weinig moeite", "Niet alles is Must"],
    toepassen: [["tab", "scrum"]], bron: "DSDM Consortium; Clegg & Barker (1994)" },
  { id: "regels", titel: "Regels in Nederland op een rij", onderwerp: "regels", fasen: ["idee", "bouwen"], min: 5, emoji: "⚖️",
    kort: "KVK, btw, KOR en het urencriterium, met de bedragen van 2026.",
    tekst: `Dit is informatie, geen advies. Laat je situatie checken door een boekhouder of het KVK-adviesteam.

## Ondernemer of niet?
De Belastingdienst kijkt naar zelfstandigheid, meerdere opdrachtgevers, winst en ondernemersrisico. Ben je geen ondernemer, dan geef je je inkomsten op als **resultaat uit overig werk**.

## KVK
Inschrijven is verplicht zodra je een onderneming hebt. In 2026 kost dat eenmalig **€ 85,15**.

## Btw en de KOR
Je doet elk kwartaal btw-aangifte. Met de **kleineondernemersregeling** (omzet onder **€ 20.000** per jaar) reken je geen btw, maar trek je die ook niet af. Aanmelden kan tot vier weken voor een nieuw kwartaal.

## Urencriterium
Werk je **1.225 uur** per jaar aan je bedrijf, dan kun je zelfstandigenaftrek krijgen: **€ 1.200** in 2026, plus eventueel **€ 2.123** startersaftrek. Naast een fulltime baan haal je dat urencriterium meestal niet.

## Je werkgever
Check je arbeidscontract op nevenwerkzaamheden. Een verbod mag alleen met een goede reden.`,
    punten: ["Eerst bepalen: ondernemer of overig werk", "KOR onder € 20.000 omzet", "1.225 uur voor zelfstandigenaftrek"],
    toepassen: [["tab", "checklist"]], bron: "KVK en Belastingdienst (2026)" },
  { id: "eerste10", titel: "Je eerste tien klanten", onderwerp: "groei", fasen: ["valideren", "lanceren"], min: 4, emoji: "🔟",
    kort: "Doe dingen die niet schalen. Je eerste klanten win je één voor één.",
    tekst: `Paul Graham's advies aan starters: **doe dingen die niet schalen**. Je eerste tien klanten vind je niet via advertenties, maar persoonlijk.

## Waar vind je ze?
- Je eigen netwerk en het netwerk daarvan
- Online groepen waar je doelgroep al zit (Facebook, Reddit, Discord, LinkedIn)
- Lokale plekken: markten, verenigingen, bedrijven in de buurt
- Mensen met wie je al een klantgesprek had

## Hoe?
- Stuur persoonlijke berichten, geen massamail
- Help eerst, verkoop daarna
- Vraag elke klant om feedback en om een introductie

Houd ze bij in je klantentrechter: lead, gesprek, offerte, klant.`,
    punten: ["Persoonlijk, één voor één", "Ga waar je klant al is", "Vraag om feedback en introducties"],
    toepassen: [["check", "Lijst maken van 30 mensen die ik persoonlijk kan benaderen", "marketing"], ["tab", "dashboard"]], bron: "Graham, *Do Things That Don't Scale* (2013)" },
  { id: "kanalen", titel: "Een kanaal kiezen: de Bullseye", onderwerp: "groei", fasen: ["lanceren", "groeien"], min: 4, emoji: "🎯",
    kort: "Test een paar kanalen goedkoop en zet vol in op het kanaal dat werkt.",
    tekst: `In *Traction* beschrijven Gabriel Weinberg en Justin Mares negentien kanalen om klanten te krijgen, van SEO tot beurzen. De **Bullseye-methode** helpt kiezen.

## Drie ringen
1. **Buitenste ring**: bedenk voor elk kanaal één idee.
2. **Middelste ring**: kies de zes meest veelbelovende.
3. **Binnenste ring**: test de beste drie goedkoop en snel.

Zet dan al je energie op het ene kanaal dat werkt. De meeste starters versnipperen hun tijd over vijf kanalen tegelijk.

## Meet per kanaal
- Kosten per klant (in geld en uren)
- Aantal klanten
- Hoe lang het duurt`,
    punten: ["Test drie kanalen goedkoop", "Kies er daarna één", "Meet kosten per klant"],
    toepassen: [["model", "sj.kanalen"]], bron: "Weinberg & Mares, *Traction* (2015)" },
  { id: "aarrr", titel: "De klantentrechter meten (AARRR)", onderwerp: "groei", fasen: ["lanceren", "groeien"], min: 3, emoji: "📊",
    kort: "Vijf stappen van bezoeker tot ambassadeur. Verbeter eerst de zwakste stap.",
    tekst: `Dave McClure bedacht de **pirate metrics**, genoemd naar de afkorting AARRR.

- **Acquisition**: hoe vinden mensen je?
- **Activation**: hebben ze een goede eerste ervaring?
- **Retention**: komen ze terug?
- **Revenue**: betalen ze?
- **Referral**: vertellen ze het door?

Meet per stap hoeveel procent doorgaat naar de volgende. Verbeter altijd eerst de **zwakste stap**. Meer bezoekers helpen niet als niemand terugkomt.`,
    punten: ["Meet de doorstroom per stap", "Verbeter de zwakste stap eerst", "Retentie gaat voor groei"],
    toepassen: [["tab", "dashboard"]], bron: "McClure, *Startup Metrics for Pirates* (2007)" },
  { id: "northstar", titel: "Eén cijfer dat telt", onderwerp: "groei", fasen: ["groeien"], min: 3, emoji: "⭐",
    kort: "Kies één kerncijfer en een paar doelen per kwartaal. Meer kun je naast je baan niet volgen.",
    tekst: `Een **North Star-metriek** is het ene cijfer dat laat zien of je klanten waarde krijgen. Voor een webshop kan dat "tevreden bestellingen per week" zijn, voor een dienst "terugkerende klanten".

## OKR's
Per kwartaal kies je één tot drie **doelen (Objectives)**, elk met twee of drie **meetbare resultaten (Key Results)**.

Voorbeeld:
- Doel: klanten komen terug
- Resultaat 1: 30% van de klanten bestelt een tweede keer
- Resultaat 2: gemiddelde beoordeling 4,5 of hoger

Houd het klein. Naast een baan zijn drie doelen per kwartaal al veel.`,
    punten: ["Eén kerncijfer voor klantwaarde", "Maximaal drie doelen per kwartaal", "Resultaten zijn meetbaar"],
    toepassen: [["model", "sj.okr"], ["tab", "dashboard"]], bron: "Doerr, *Measure What Matters* (2018)" },
  { id: "tijd", titel: "Groeien naast je baan", onderwerp: "werken", fasen: ["bouwen", "lanceren", "groeien"], min: 3, emoji: "⏳",
    kort: "Tijd en energie zijn je schaarste middelen. Plan ze net zo serieus als geld.",
    tekst: `De meeste side hustles stoppen niet door geldgebrek, maar door gebrek aan tijd en energie.

## Tips
- **Vaste blokken**: plan twee of drie vaste momenten per week, net als een sportafspraak.
- **Energie**: doe denkwerk als je fris bent, en klusjes als je moe bent.
- **Kleine stappen**: een taak van 30 minuten die af is, is meer waard dan een grote die blijft liggen.
- **Automatiseer en schrap**: wat terugkomt, maak je een sjabloon van. Wat niets oplevert, stop je.
- **Bewaak je grens**: houd je betaalbaar verlies ook in uren in de gaten.

Registreer je uren. Dan zie je wat een klant echt kost, en of je richting het urencriterium gaat.`,
    punten: ["Vaste blokken in je week", "Klein en af gaat voor groot", "Houd je uren bij"],
    toepassen: [["instellingen"]], bron: "Newport, *Deep Work* (2016)" }
];
const shLes = id => SH_LESSEN.find(l => l.id === id);
const shLesRec = id => vind("sh_leren", id);
const shLesGelezen = id => !!(shLesRec(id) || {}).gelezen;
async function shLesBewaar(id, wijzig) {
  const r = Object.assign({ id, gelezen: false, gelezenOp: null, favoriet: false, notities: {} }, shLesRec(id) || {}, wijzig);
  await bewaar("sh_leren", r);
  return r;
}
function shLesAanbevolen(h) {
  return SH_LESSEN.filter(l => l.fasen.includes(h.fase) && !shLesGelezen(l.id)).slice(0, 3);
}

/* ---------- Tabblad ---------- */
function vwShTheorie(h) {
  const f = V.shTh || (V.shTh = { onderwerp: "alle" });
  const gelezen = SH_LESSEN.filter(l => shLesGelezen(l.id)).length, pct = Math.round(gelezen / SH_LESSEN.length * 100);
  const aanb = shLesAanbevolen(h);
  let u = `<div class="card card-pad sh-th-kop">
      <div class="ring" style="--p:${pct};--rc:var(--sh)"><span>${gelezen}</span></div>
      <div style="flex:1;min-width:0"><b>${gelezen} van ${SH_LESSEN.length} lessen gelezen</b>
        <div class="klein">Korte lessen van 3 tot 5 minuten. Elke les eindigt met iets wat je meteen toepast op ${esc(h.naam)}.</div></div></div>`;
  if (aanb.length) u += sectie("Voor de fase " + shFaseNaam(h.fase)) + `<div class="sh-th-aanbevolen">${aanb.map(l => shLesKaart(l, h, true)).join("")}</div>`;
  u += `<div class="chiprij scroll" style="margin-top:14px">${[["alle", "Alle"], ...Object.entries(SH_LES_ONDERWERPEN).map(([k, [n, e]]) => [k, e + " " + n])].map(([k, n]) =>
    `<button class="keuze" data-sh="th-filter" data-o="${k}" aria-pressed="${f.onderwerp === k}">${n}</button>`).join("")}</div>`;
  const lijst = SH_LESSEN.filter(l => f.onderwerp === "alle" || l.onderwerp === f.onderwerp);
  SH_FASEN.forEach(([fase, fnaam]) => {
    const r = lijst.filter(l => l.fasen[0] === fase);
    if (!r.length) return;
    u += sectie(fnaam, `${r.filter(l => shLesGelezen(l.id)).length}/${r.length}`) + `<div class="card sh-th-lijst">${r.map(l => shLesRij(l, h)).join("")}</div>`;
  });
  u += `<p class="klein sh-disclaimer">${ico("boek", "width:14px;height:14px;vertical-align:-2px")} De lessen vatten bekende methoden samen. Onderaan elke les staat de bron.</p>`;
  return u;
}
function shLesKaart(l, h, groot) {
  return `<button class="sh-th-kaart" data-sh="th-open" data-les="${l.id}" data-id="${h.id}">
    <span class="em">${l.emoji}</span><b>${esc(l.titel)}</b><span class="klein">${esc(l.kort)}</span>
    <span class="sh-th-meta">${l.min} min · ${esc(SH_LES_ONDERWERPEN[l.onderwerp][0])}</span></button>`;
}
function shLesRij(l, h) {
  const g = shLesGelezen(l.id), r = shLesRec(l.id);
  return `<button class="rijknop sh-th-rij${g ? " gelezen" : ""}" data-sh="th-open" data-les="${l.id}" data-id="${h.id}">
    <span class="sh-th-em">${l.emoji}</span>
    <span class="nm"><b>${esc(l.titel)}</b><span class="klein" style="display:block">${l.min} min · ${esc(SH_LES_ONDERWERPEN[l.onderwerp][0])}${r && r.favoriet ? " · ★" : ""}</span></span>
    <span class="rechts">${g ? `<span class="sh-th-vink">${ico("check", "width:13px;height:13px")}</span>` : ""}${ico("pijlr", "width:16px;height:16px;color:var(--line2)")}</span></button>`;
}

/* ---------- Les lezen ---------- */
function shLesToepassenKnop(t, h, l) {
  const [soort, a, b] = t;
  if (soort === "model") {
    const m = typeof shModel === "function" ? shModel(a) : null;
    const heb = shVan("sh_bestanden", h.id).find(x => x.sjabloonId === a && !x.verwijderdOp);
    return `<button class="rijknop" data-sh="th-model" data-sj="${a}" data-id="${h.id}">${ico("sjabloon", "width:19px;height:19px;color:var(--sh)")}
      <span class="nm"><b>${heb ? "Open" : "Vul in"}: ${esc(m ? m.naam : a)}</b><span class="klein" style="display:block">${heb ? (heb.voortgang || 0) + "% ingevuld" : "Wordt een bestand bij " + esc(h.naam)}</span></span></button>`;
  }
  if (soort === "check") {
    const heb = shVan("sh_checks", h.id).some(c => c.sleutel === "les." + l.id);
    return `<button class="rijknop" data-sh="th-check" data-les="${l.id}" data-id="${h.id}" data-t="${esc(a)}" data-c="${b || "eigen"}"${heb ? " disabled" : ""}>${ico("lijst", "width:19px;height:19px;color:var(--sh)")}
      <span class="nm"><b>${heb ? "Staat op je checklist" : "Op je checklist"}: ${esc(a)}</b></span></button>`;
  }
  if (soort === "experiment") return `<button class="rijknop" data-sh="th-exp" data-id="${h.id}" data-t="${esc(a)}">${ico("bliksem", "width:19px;height:19px;color:var(--sh)")}
      <span class="nm"><b>Experiment opzetten</b><span class="klein" style="display:block">Hypothese, test, meting en criterium</span></span></button>`;
  if (soort === "tab") { const def = SH_TABS.find(x => x[0] === a); return `<button class="rijknop" data-sh="th-tab" data-tab="${a}" data-id="${h.id}">${ico(def ? def[2] : "pijlr", "width:19px;height:19px;color:var(--sh)")}
      <span class="nm"><b>Naar ${esc(def ? def[1] : a)}</b></span></button>`; }
  if (soort === "instellingen") return `<button class="rijknop" data-sh="instellingen" data-id="${h.id}">${ico("instel", "width:19px;height:19px;color:var(--sh)")}
      <span class="nm"><b>Betaalbaar verlies en uren instellen</b></span></button>`;
  return "";
}
function vwShLes() {
  const l = shLes(V.param);
  if (!l) return leeg("🤷", "Deze les bestaat niet");
  const h = shH(V.shLesH) || shH(inst("shLaatste", null)) || shActief()[0] || null;
  const r = shLesRec(l.id) || {}, g = !!r.gelezen;
  const i = SH_LESSEN.indexOf(l), vorige = SH_LESSEN[i - 1], volgende = SH_LESSEN[i + 1];
  let u = `<div class="sh-werk sh-les" style="${h ? shStijl(h) : "--sh:var(--accent);--sh-zacht:var(--accent-soft)"}">
    <div class="sh-les-kop"><span class="em">${l.emoji}</span>
      <div><div class="klein">${esc(SH_LES_ONDERWERPEN[l.onderwerp][1] + " " + SH_LES_ONDERWERPEN[l.onderwerp][0])} · ${l.min} min</div>
        <div class="chiprij" style="margin-top:6px">${l.fasen.map(f => `<span class="chip">${shFaseNaam(f)}</span>`).join("")}</div></div>
      <button class="icon-btn" data-sh="th-fav" data-les="${l.id}" aria-label="${r.favoriet ? "Uit favorieten" : "Bewaren als favoriet"}" aria-pressed="${!!r.favoriet}" style="margin-left:auto;color:${r.favoriet ? "var(--amber)" : "var(--muted)"}">${ico("ster")}</button></div>
    <p class="sh-les-kort">${esc(l.kort)}</p>
    <div class="card card-pad sh-md sh-les-tekst">${shMd(l.tekst)}</div>
    <div class="card card-pad sh-les-punten"><b>Onthoud</b><ul>${l.punten.map(p => `<li>${esc(p)}</li>`).join("")}</ul></div>`;
  if (h) {
    u += sectie("Toepassen op " + h.emoji + " " + h.naam) + `<div class="card">${l.toepassen.map(t => shLesToepassenKnop(t, h, l)).join("")}</div>`;
    u += `<div class="veld"><label for="sh-les-not">Jouw gedachten bij deze les</label>
      <textarea class="invoer" id="sh-les-not" data-les="${l.id}" data-id="${h.id}" placeholder="Wat betekent dit voor ${esc(h.naam)}?" style="min-height:90px">${esc((r.notities || {})[h.id] || "")}</textarea>
      <div class="klein sh-bewaard" id="sh-les-bewaard" aria-live="polite"></div></div>`;
  }
  u += `<p class="klein">Bron: ${shMd(l.bron).replace(/^<p>|<\/p>$/g, "")}</p>
    <button class="knop breed ${g ? "rand" : "primair"}" data-sh="th-gelezen" data-les="${l.id}">${g ? ico("check") + " Gelezen" + (r.gelezenOp ? " op " + esc(datumLabel(r.gelezenOp.slice(0, 10))) : "") : "Markeer als gelezen"}</button>
    <div class="knoprij" style="margin-top:10px">
      ${vorige ? `<button class="knop rand klein" data-sh="th-open" data-les="${vorige.id}" data-id="${h ? h.id : ""}">${ico("pijll")} ${esc(vorige.titel)}</button>` : ""}
      ${volgende ? `<button class="knop rand klein" data-sh="th-open" data-les="${volgende.id}" data-id="${h ? h.id : ""}">${esc(volgende.titel)} ${ico("pijlr")}</button>` : ""}</div>
  </div>`;
  return u;
}
Object.defineProperty(KOPPEN, "shles", {
  get: () => { const l = shLes(V.param); return [l ? l.titel : "Les", () => { const h = shH(V.shLesH); return h ? "Theorie · " + h.naam : "Theorie"; }]; },
  configurable: true, enumerable: true
});

/* ---------- Acties ---------- */
Object.assign(SH_ACT, {
  "th-filter": el => { V.shTh.onderwerp = el.dataset.o; teken(); },
  "th-open": el => { if (el.dataset.id) V.shLesH = el.dataset.id; ga("shles", el.dataset.les); },
  "th-gelezen": async el => {
    const g = !shLesGelezen(el.dataset.les);
    await shLesBewaar(el.dataset.les, { gelezen: g, gelezenOp: g ? shNu() : null });
    if (g) { tril(10); const l = shLes(el.dataset.les); if (V.shLesH) await logGebeurtenis("sidehustle", `Les gelezen: ${l.titel}`, V.shLesH, { shId: V.shLesH }); }
    teken(); toast(g ? "Gelezen" : "Weer ongelezen");
  },
  "th-fav": async el => { const r = shLesRec(el.dataset.les) || {}; await shLesBewaar(el.dataset.les, { favoriet: !r.favoriet }); teken(); },
  "th-model": async el => { const h = shH(el.dataset.id); if (h && typeof shModelOpen === "function") await shModelOpen(h, el.dataset.sj); },
  "th-check": async el => {
    const h = shH(el.dataset.id); if (!h || el.disabled) return;
    await shBewaarVeel([["sh_checks", shCheckRecord(h, { titel: el.dataset.t, categorie: el.dataset.c || "eigen", prioriteit: "middel", sleutel: "les." + el.dataset.les, volgorde: Date.now() })]]);
    teken(); toast("Op je checklist gezet", "Bekijken", async () => { h.laatsteTab = "checklist"; await bewaar("sh_hustles", h); ga("sh", h.id); });
  },
  "th-exp": el => { const h = shH(el.dataset.id); if (h && typeof shExperimentBlad === "function") shExperimentBlad(h, null, { hypothese: el.dataset.t }); },
  "th-tab": async el => { const h = shH(el.dataset.id); if (!h) return; h.laatsteTab = el.dataset.tab; await bewaar("sh_hustles", h); ga("sh", h.id); }
});
SH_NA.push(() => {
  const t = $("#sh-les-not"); if (!t) return;
  t.oninput = () => {
    const s = $("#sh-les-bewaard"); if (s) s.textContent = "Bewaren…";
    clearTimeout(t._t);
    t._t = setTimeout(async () => {
      const r = shLesRec(t.dataset.les) || {}, n = Object.assign({}, r.notities || {});
      n[t.dataset.id] = t.value;
      await shLesBewaar(t.dataset.les, { notities: n });
      const s2 = $("#sh-les-bewaard"); if (s2) s2.textContent = "Bewaard";
    }, 700);
  };
});
