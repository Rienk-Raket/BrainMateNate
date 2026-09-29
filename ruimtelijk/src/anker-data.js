"use strict";
// === SECTIE 69: ANKER – GEGEVENS, OEFENINGEN EN REGELS ===
/* ==========================================================================
   Anker: korte adem- en aandachtsoefeningen voor een vol hoofd.
   Deze sectie bevat alleen gegevens en rekenwerk, geen schermen:
   - de drie nieuwe opslagplekken (stores) in IndexedDB;
   - de instellingen van Anker (één record 'main');
   - de vaste lijst met oefeningen (MF_OEFENINGEN);
   - de regels voor voorstellen ("Help me kiezen") en het 7-dagenprogramma.
   Het voorvoegsel "mf" staat voor mindfulness; zo botst niets met de rest.
   ========================================================================== */

/* ---------- 69.1 Opslag: drie nieuwe stores ----------
   WINKELS is de lijst met stores van de hele app. Staat een store daar in,
   dan maakt de database-upgrade hem aan (alleen als hij nog niet bestaat),
   laadt de app hem bij het starten en gaat hij mee in back-up en import.
   mf_sessies heeft een oplopend nummer als sleutel en een index op datum;
   die extra opties staan in DB_OPTIES (de upgrade leest die uit). */
WINKELS.mf_sessies = "id";
WINKELS.mf_instellingen = "sleutel";
WINKELS.mf_programma = "id";
const DB_OPTIES = {
  mf_sessies: { keyPath: "id", autoIncrement: true, indexen: [["datum", "datum"]] }
};
S.mf_sessies = S.mf_sessies || [];
S.mf_instellingen = S.mf_instellingen || [];
S.mf_programma = S.mf_programma || [];

/* Een sessie opslaan. Nieuwe sessies hebben nog geen id: de database geeft
   dan zelf het volgende nummer, en dat zetten we terug op het object. */
function mfSessieOpslaan(sessie) {
  return new Promise((klaar, fout) => {
    try {
      const t = db.transaction("mf_sessies", "readwrite");
      const verzoek = t.objectStore("mf_sessies").put(sessie);
      verzoek.onsuccess = () => { sessie.id = verzoek.result; };
      t.oncomplete = () => {
        const i = S.mf_sessies.findIndex(x => x.id === sessie.id);
        if (i >= 0) S.mf_sessies[i] = sessie; else S.mf_sessies.push(sessie);
        klaar(sessie);
      };
      t.onerror = () => fout(t.error);
    } catch (e) { fout(e); }
  });
}

/* ---------- 69.2 Instellingen ----------
   Eén record met sleutel 'main'. Ontbreekt een veld (bijvoorbeeld na een
   update), dan vullen we het aan met de standaardwaarde. */
const MF_STANDAARD = {
  sleutel: "main",
  profiel: null,              // "volhoofd" | "anders" | "energie" | null
  prikkelarm: false,          // zet geluid, tonen, stem, animatie en trilling in één keer uit
  geluid: true,               // zachte gong aan begin en eind
  ademtonen: false,           // hoge toon bij inademen, lage bij uitademen
  stem: false,                // voorleesstem (Nederlands)
  animatie: true,             // ademcirkel die groeit en krimpt
  trilling: true,             // korte trilling (werkt niet op iPhone; dan gebeurt er niets)
  geenVasthouden: false,      // ademoefeningen zonder vasthoud-pauzes (bij duizeligheid of benauwdheid)
  ademIn: 4, ademUit: 6,      // seconden, voor "Lange uitademing"
  lettergrootte: "normaal",   // "normaal" | "groot" | "extra"
  introGezien: false,
  bodyscanGezien: false,      // waarschuwing bij de eerste bodyscan al getoond?
  mildKeuze: "neutraal",      // laatste keuze bij "Mild zijn voor jezelf"
  favorieten: [],
  koppelingen: { roken: false, werk: false, financieel: false, gewoonte: false, logboek: true },
  herinneringen: []           // [{ id, tijd: "08:30", dagen: [1,2,3,4,5] }]
};
function mfInst() {
  const r = S.mf_instellingen.find(x => x.sleutel === "main") || {};
  const uit = Object.assign({}, MF_STANDAARD, r);
  uit.koppelingen = Object.assign({}, MF_STANDAARD.koppelingen, r.koppelingen || {});
  uit.favorieten = Array.isArray(uit.favorieten) ? uit.favorieten.slice() : [];
  uit.herinneringen = Array.isArray(uit.herinneringen) ? uit.herinneringen.slice() : [];
  return uit;
}
/* Wijzigingen direct opslaan (geen opslaanknop nodig). */
async function mfInstZet(wijziging) {
  const nieuw = Object.assign(mfInst(), wijziging, { sleutel: "main" });
  S.mf_instellingen = [nieuw];
  try { await idbZet("mf_instellingen", nieuw); } catch (e) { opslagFout(e); }
  return nieuw;
}
const mfSysteemRustig = () => !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
/* Mag dit prikkeltje nu? Prikkelarm (in Anker of in de hele app) zet alles uit.
   Animatie staat ook uit als het toestel om minder beweging vraagt. */
function mfMag(soort) {
  const s = mfInst();
  if (s.prikkelarm || inst("rust", false)) return false;
  if (soort === "animatie" && mfSysteemRustig()) return false;
  return !!s[soort];
}

/* ---------- 69.3 De oefeningen ----------
   Staan vast in de code, niet in de database. Per oefening:
   id, naam, categorie, varianten (minuten), focus, beweging, inspanning,
   waarom, stappen, alsHetNietLukt (id van een alternatief), type en
   'wat': één zin wat je doet (voor de kaartjes in "Kies zelf").
   Type "adem": het ademritme herhaalt tot de tijd om is. Een fase "vast" is
   een korte pauze (adem vasthouden); die kun je in de instellingen uitzetten.
   Optioneel: 'tip' (één zin onder de ademcirkel).
   Type "stappen": de stappen worden verdeeld over de gekozen tijd. */
const MF_CATEGORIEEN = ["Ademen", "Kijken en bewegen", "Gedachten en gevoel", "Mild zijn"];
const MF_OEFENINGEN = [
  { id: "A1", naam: "Twee keer in, lang uit", categorie: "Ademen", varianten: [1, 3, 5], focus: "adem", beweging: false, inspanning: "geen", type: "adem",
    waarom: "Een lange uitademing remt je stresssysteem snel af.",
    wat: "Twee keer inademen, dan lang uitblazen.",
    stappen: ["Adem in door je neus.", "Adem er nog een klein beetje bij.", "Blaas langzaam uit door je mond."],
    ritme: [{ fase: "in", sec: 2, stap: 0, woord: "In" }, { fase: "bij", sec: 1, stap: 1, woord: "Nog iets in" }, { fase: "uit", sec: 6, stap: 2, woord: "Uit" }],
    alsHetNietLukt: "Z4" },
  { id: "A2", naam: "Lange uitademing", categorie: "Ademen", varianten: [1, 3, 5], focus: "adem", beweging: false, inspanning: "geen", type: "adem",
    waarom: "Langer uit dan in helpt je lichaam naar rust.",
    wat: "Rustig in, langer uit. Het tempo stel je zelf in.",
    stappen: ["Adem in en tel mee.", "Adem langer uit dan je inademde."],
    ritme: "instellingen",   // ademIn en ademUit komen uit de instellingen
    alsHetNietLukt: "Z1" },
  { id: "A3", naam: "Ademtellen", categorie: "Ademen", varianten: [3, 5], focus: "adem", beweging: false, inspanning: "geen", type: "teller",
    waarom: "Tellen geeft je aandacht een concreet houvast.",
    wat: "Tik bij elke uitademing en tel tot 10.",
    stappen: ["Adem rustig in en uit.", "Tik bij elke uitademing.", "Na 10 begin je weer bij 1."],
    alsHetNietLukt: "Z5" },
  { id: "A4", naam: "Adempauze in 3 stappen", categorie: "Ademen", varianten: [3], focus: "gedachten", beweging: false, inspanning: "geen", type: "stappen",
    waarom: "Een korte pauze tussen twee dingen in.",
    wat: "Opmerken, adem, dan je hele lichaam.",
    stappen: ["Stap 1: Wat merk je nu? Gedachten, gevoel, lichaam.", "Stap 2: Richt je aandacht alleen op je adem.", "Stap 3: Merk je hele lichaam op, van top tot teen."],
    alsHetNietLukt: "Z1" },
  /* A5–A10: toegevoegd na online onderzoek (zie MF_BRONNEN_ADEM). */
  { id: "A5", naam: "Vierkant ademen", categorie: "Ademen", varianten: [1, 3, 5], focus: "adem", beweging: false, inspanning: "geen", type: "adem",
    waarom: "Een vast ritme van vier geeft houvast als je hoofd vol zit.",
    wat: "Vier tellen in, vast, uit en vast.",
    stappen: ["Adem in door je neus.", "Houd je adem zacht vast.", "Adem rustig uit.", "Wacht even voor je weer inademt."],
    ritme: [{ fase: "in", sec: 4, stap: 0, woord: "In" }, { fase: "vast", sec: 4, stap: 1, woord: "Vast" }, { fase: "uit", sec: 4, stap: 2, woord: "Uit" }, { fase: "vast", sec: 4, stap: 3, woord: "Vast" }],
    tip: "Duizelig? Sla het vasthouden over of stop.",
    alsHetNietLukt: "A2" },
  { id: "A6", naam: "Zes keer per minuut", categorie: "Ademen", varianten: [1, 3, 5, 10], focus: "adem", beweging: false, inspanning: "geen", type: "adem",
    waarom: "Rond zes ademhalingen per minuut lopen hartslag en adem in de pas.",
    wat: "Vijf tellen in, vijf tellen uit.",
    stappen: ["Adem vijf tellen rustig in.", "Adem vijf tellen rustig uit."],
    ritme: [{ fase: "in", sec: 5, stap: 0, woord: "In" }, { fase: "uit", sec: 5, stap: 1, woord: "Uit" }],
    tip: "Niet dieper ademen, alleen langzamer.",
    alsHetNietLukt: "A1" },
  { id: "A7", naam: "4-7-8 ademen", categorie: "Ademen", varianten: [1, 3], focus: "adem", beweging: false, inspanning: "geen", type: "adem",
    waarom: "Een pauze en een lange uitademing vertragen je adem. Vaak gebruikt bij inslapen.",
    wat: "Vier in, zeven vast, acht uit.",
    stappen: ["Adem in door je neus.", "Houd je adem vast.", "Blaas langzaam uit door je mond."],
    ritme: [{ fase: "in", sec: 4, stap: 0, woord: "In" }, { fase: "vast", sec: 7, stap: 1, woord: "Vast" }, { fase: "uit", sec: 8, stap: 2, woord: "Uit" }],
    tip: "Te lang? Tel sneller, de verhouding telt.",
    alsHetNietLukt: "A6" },
  { id: "A8", naam: "Neuriënd uitademen", categorie: "Ademen", varianten: [1, 3, 5], focus: "lichaam", beweging: false, inspanning: "geen", type: "adem",
    waarom: "Neuriën maakt je uitademing vanzelf lang. De trilling voelt voor velen rustig.",
    wat: "Rustig in, neuriënd uit met je mond dicht.",
    stappen: ["Adem in door je neus.", "Neurie zacht op je uitademing, mond dicht."],
    ritme: [{ fase: "in", sec: 4, stap: 0, woord: "In" }, { fase: "uit", sec: 8, stap: 1, woord: "Neurie" }],
    tip: "Liever stil? Adem dan gewoon lang uit.",
    alsHetNietLukt: "A2" },
  { id: "A9", naam: "Buikademhaling", categorie: "Ademen", varianten: [1, 3, 5], focus: "lichaam", beweging: false, inspanning: "geen", type: "adem",
    waarom: "Ademen vanuit je buik vertraagt je adem en geeft je aandacht een plek.",
    wat: "Hand op je buik, rustig in en uit.",
    stappen: ["Adem in. Je buik komt naar voren onder je hand.", "Adem uit. Je buik zakt terug."],
    ritme: [{ fase: "in", sec: 5, stap: 0, woord: "In" }, { fase: "uit", sec: 7, stap: 1, woord: "Uit" }],
    tip: "Leg een hand op je buik. Liggen mag ook.",
    alsHetNietLukt: "Z4" },
  { id: "A10", naam: "Om en om door je neus", categorie: "Ademen", varianten: [1, 3, 5], focus: "adem", beweging: false, inspanning: "geen", type: "adem",
    waarom: "Het wisselen vraagt net genoeg aandacht om gedachten even los te laten.",
    wat: "Links in, rechts uit, rechts in, links uit.",
    stappen: ["Duim op je rechterneusgat. Adem in door links.", "Wissel: links dicht. Adem uit door rechts.", "Adem in door rechts.", "Wissel weer. Adem uit door links."],
    ritme: [{ fase: "in", sec: 4, stap: 0, woord: "In links" }, { fase: "uit", sec: 6, stap: 1, woord: "Uit rechts" }, { fase: "in", sec: 4, stap: 2, woord: "In rechts" }, { fase: "uit", sec: 6, stap: 3, woord: "Uit links" }],
    tip: "Verstopte neus? Adem dan rustig zonder vingers.",
    alsHetNietLukt: "A6" },
  { id: "Z1", naam: "5-4-3-2-1", categorie: "Kijken en bewegen", varianten: [2, 4], focus: "extern", beweging: false, inspanning: "geen", type: "stappen",
    waarom: "Aandacht naar buiten helpt bij te veel prikkels.",
    wat: "Noem wat je ziet, voelt, hoort, ruikt en proeft.",
    stappen: ["Noem 5 dingen die je ziet.", "Noem 4 dingen die je voelt.", "Noem 3 dingen die je hoort.", "Noem 2 dingen die je ruikt.", "Noem 1 ding dat je proeft."],
    alsHetNietLukt: "Z4" },
  { id: "Z2", naam: "Rustig lopen", categorie: "Kijken en bewegen", varianten: [3, 5, 10], focus: "extern", beweging: true, inspanning: "licht", type: "stappen",
    waarom: "Bewegen mag. Lopen is ook oefenen.",
    wat: "Loop in je eigen tempo en voel je voeten.",
    stappen: ["Loop in je eigen tempo.", "Voel je voeten de grond raken.", "Merk op wat je ziet, zonder te stoppen.", "Dwaal je af? Terug naar je voeten."],
    alsHetNietLukt: "Z4" },
  { id: "Z3", naam: "Korte bodyscan", categorie: "Kijken en bewegen", varianten: [3, 6], focus: "lichaam", beweging: false, inspanning: "geen", type: "stappen",
    waarom: "Spanning opmerken maakt loslaten makkelijker.",
    wat: "Voeten, handen, schouders: wat merk je?",
    stappen: ["Voel je voeten. Wat merk je?", "Voel je handen. Warm, koud, tintelend?", "Voel je schouders. Mogen ze iets zakken?"],
    optIn: "Deze oefening richt je aandacht op je lichaam. Dat kan soms onprettig voelen. Je kunt elke plek overslaan. Stoppen mag altijd.",
    overslaan: true,
    alsHetNietLukt: "Z1" },
  { id: "Z4", naam: "Handen drukken", categorie: "Kijken en bewegen", varianten: [1, 2], focus: "lichaam", beweging: false, inspanning: "geen", type: "stappen",
    waarom: "Stevige druk geeft je lichaam snel houvast.",
    wat: "Druk je handen en voeten stevig aan en laat los.",
    stappen: ["Druk je handpalmen 5 tellen stevig tegen elkaar.", "Laat los.", "Druk je voeten stevig in de grond.", "Laat los. Herhaal."],
    alsHetNietLukt: "Z1" },
  { id: "Z5", naam: "Iets boeiends bekijken", categorie: "Kijken en bewegen", varianten: [3, 5], focus: "extern", beweging: false, inspanning: "geen", type: "stappen",
    waarom: "Iets wat je boeit is een sterk anker.",
    wat: "Bekijk een voorwerp dat je interessant vindt.",
    stappen: ["Pak iets wat je interessant vindt.", "Bekijk de vorm en de kleuren.", "Zoek een detail dat je nog niet zag.", "Dwaal je af? Kijk weer naar het object."],
    alsHetNietLukt: "A1" },
  { id: "G1", naam: "Stop-minuut", categorie: "Gedachten en gevoel", varianten: [1], focus: "gedachten", beweging: false, inspanning: "geen", type: "stappen",
    waarom: "Eén minuut ruimte voor je een keuze maakt.",
    wat: "Stoppen, één keer ademen, dan bewust kiezen.",
    stappen: ["Stop wat je doet.", "Adem één keer rustig in en uit.", "Kijk: wat wil ik nu echt?", "Ga verder met een bewuste keuze."],
    alsHetNietLukt: "A1" },
  { id: "G2", naam: "Gedachten een naam geven", categorie: "Gedachten en gevoel", varianten: [3, 5], focus: "gedachten", beweging: false, inspanning: "geen", type: "labels",
    waarom: "Gedachten benoemen maakt ze minder dwingend.",
    wat: "Tik het soort gedachte en ga terug naar je adem.",
    stappen: ["Adem rustig.", "Komt er een gedachte? Tik het soort.", "Ga terug naar je adem."],
    labels: ["plannen", "zorgen", "herinneren", "oordelen", "anders"],
    alsHetNietLukt: "Z1" },
  { id: "G3", naam: "Trek laten wegzakken", categorie: "Gedachten en gevoel", varianten: [3, 5], focus: "lichaam", beweging: false, inspanning: "geen", type: "golf",
    waarom: "Trek zwelt aan en zakt weer af, ook zonder toe te geven.",
    wat: "Kijk hoe sterk de trek is en adem mee.",
    stappen: ["Hoe sterk is de trek nu? 0 tot 10.", "Waar voel je de trek in je lichaam?", "Adem mee. Je hoeft niets te doen.", "Merk op of de trek verandert.", "Hoe sterk is hij nu?"],
    meetStappen: { 0: "begin", 3: "midden", 4: "eind" },
    alsHetNietLukt: "A1" },
  { id: "G4", naam: "Gevoel benoemen", categorie: "Gedachten en gevoel", varianten: [2], focus: "lichaam", beweging: false, inspanning: "geen", type: "stappen",
    waarom: "Een woord voor een gevoel maakt het beter hanteerbaar.",
    wat: "Kies waar je iets voelt en welk woord past.",
    stappen: ["Waar in je lichaam voel je iets?", "Welk woord past het best?", "Adem rustig. Het gevoel mag er zijn."],
    keuzes: { 0: ["hoofd", "keel", "borst", "buik", "handen", "benen"], 1: ["onrustig", "boos", "verdrietig", "bang", "moe", "blij", "leeg", "overprikkeld", "weet ik niet"] },
    alsHetNietLukt: "Z1" },
  { id: "V1", naam: "Mild zijn voor jezelf", categorie: "Mild zijn", varianten: [2, 4], focus: "gedachten", beweging: false, inspanning: "geen", type: "stappen",
    waarom: "Vriendelijk tegen jezelf praten verzacht een lastig moment.",
    wat: "Drie zinnen voor een lastig moment, neutraal of warm.",
    uitleg: "Mild zijn kan eerst oud ongemak oproepen. Dat is normaal. Kies gerust neutraal.",
    stappen: ["Dit is nu lastig.", "Iedereen heeft soms lastige momenten.", "Wat heb ik nu nodig?"],
    stappenWarm: ["Dit doet pijn en dat mag.", "Ik ben niet de enige die dit voelt.", "Mag ik mild zijn voor mezelf."],
    warmHint: "Leg je hand op je borst, als je wilt.",
    alsHetNietLukt: "Z4" }
];
const mfOef = id => MF_OEFENINGEN.find(o => o.id === id) || null;
const mfRustigLabel = o => o.inspanning === "geen" ? "rustig zitten of liggen" : "";
/* Standaardduur: de eerste variant van 3 minuten of langer (anders de langste). */
const mfStandaardMin = o => o.varianten.find(m => m >= 3) || o.varianten[o.varianten.length - 1];
function mfDuurTekst(o) {
  const v = o.varianten;
  return v.length === 1 ? `${v[0]} min` : `${v.slice(0, -1).join(", ")} of ${v[v.length - 1]} min`;
}

/* ---------- 69.4 Sessies tellen (zonder streaks) ---------- */
const mfDatum = s => String(s.datum || "").slice(0, 10);
function mfSessiesVan(van, tot) { return S.mf_sessies.filter(s => mfDatum(s) >= van && mfDatum(s) <= tot); }
function mfDezeWeek() { const v = vandaagISO(); return mfSessiesVan(weekStart(v), v); }
/* Twee keer op rij "onrustiger" bij dezelfde oefening? (alleen sessies met een meting tellen) */
function mfTweeKeerOnrustiger(oefId) {
  const l = S.mf_sessies.filter(s => s.oefeningId === oefId && s.nameting).sort((a, b) => String(a.datum).localeCompare(String(b.datum)));
  return l.length >= 2 && l.slice(-2).every(s => s.nameting === "onrustiger");
}
function mfOnrustigInZevenDagen() {
  const v = vandaagISO();
  return mfSessiesVan(plusDagen(v, -6), v).filter(s => s.nameting === "onrustiger").length;
}

/* ---------- 69.5 Voorstellen ("Help me kiezen") ----------
   Alleen vaste regels, geen AI. Niets start vanzelf: dit geeft alleen een lijst.
   antwoorden: { drukte: 1-5 | null, energie: 1-5 | null, tijd: 1|3|5|10 | null } */
function mfVoorstellen(antwoorden) {
  const a = antwoorden || {}, s = mfInst(), profiel = s.profiel;
  let lijst = MF_OEFENINGEN.slice();
  const weinigEnergie = profiel === "energie" || (a.energie != null && a.energie <= 2);
  const veelDrukte = a.drukte != null && a.drukte >= 4;
  // Weinig energie: alleen rustig zitten of liggen, uit deze vier.
  // A6 (zes per minuut) en A9 (buikademhaling) kunnen liggend en kosten geen inspanning.
  if (weinigEnergie) lijst = lijst.filter(o => ["A2", "Z4", "A1", "V1", "A6", "A9"].includes(o.id));
  // Druk hoofd: alleen aandacht naar buiten of bewegen, uit deze vier.
  if (veelDrukte) lijst = lijst.filter(o => ["Z1", "Z4", "Z2", "A1"].includes(o.id));
  // Bij profiel "weinig energie" nooit Rustig lopen.
  if (profiel === "energie") lijst = lijst.filter(o => o.id !== "Z2");
  if (!lijst.length) lijst = [mfOef("A1"), mfOef("Z4")];
  // Past het in de tijd die je hebt?
  if (a.tijd) { const past = lijst.filter(o => o.varianten.some(m => m <= a.tijd)); if (past.length) lijst = past; }
  // Volgorde: bij "mijn brein werkt anders" eerst naar buiten of bewegen, met weinig stappen.
  const punten = o => {
    let p = 0;
    if (profiel === "anders" && (o.focus === "extern" || o.beweging)) p += 3;
    if (profiel === "anders" && o.stappen.length <= 4) p += 1;
    if (s.favorieten.includes(o.id)) p += 1;
    if (mfTweeKeerOnrustiger(o.id)) p -= 100;   // twee keer onrustiger: onderaan
    return p;
  };
  return lijst.map((o, i) => ({ o, p: punten(o), i })).sort((x, y) => y.p - x.p || x.i - y.i).map(x => x.o);
}
/* Welke duur kies je bij een voorstel? De langste variant die in je tijd past. */
function mfMinVoor(o, tijd) {
  if (!tijd) return mfStandaardMin(o);
  const past = o.varianten.filter(m => m <= tijd);
  return past.length ? past[past.length - 1] : o.varianten[0];
}
/* Het doel volgt uit de antwoorden (er komt geen aparte vraag voor). */
function mfDoel(a) {
  if (!a) return null;
  if (a.energie != null && a.energie <= 2) return "opladen";
  if (a.drukte != null && a.drukte >= 4) return "prikkels dempen";
  if (a.drukte == null && a.energie == null) return null;
  return "landen";
}

/* ---------- 69.6 Programma "7 dagen landen" ----------
   Een gemiste dag schuift gewoon door; er is geen einddatum. */
const MF_PROGRAMMA = ["A1", "Z1", "A3", "Z2", "G2", "V1", "A4"];
function mfProgrammaDagen() { return MF_PROGRAMMA.map(id => id === "Z2" && mfInst().profiel === "energie" ? "Z4" : id); }
const mfProgramma = () => S.mf_programma.find(p => p.id === "landen7") || null;
async function mfProgrammaZet(p) {
  const i = S.mf_programma.findIndex(x => x.id === p.id);
  if (i >= 0) S.mf_programma[i] = p; else S.mf_programma.push(p);
  try { await idbZet("mf_programma", p); } catch (e) { opslagFout(e); }
}
async function mfProgrammaStart() {
  await mfProgrammaZet({ id: "landen7", gestart: new Date().toISOString(), voltooideDagen: [], huidigeDag: 0 });
}
/* Na een sessie uit het programma: dag afvinken en doorschuiven. */
async function mfProgrammaVerder(oefId) {
  const p = mfProgramma(); if (!p) return;
  const dagen = mfProgrammaDagen();
  if (p.huidigeDag > 6 || dagen[p.huidigeDag] !== oefId) return;
  p.voltooideDagen = (p.voltooideDagen || []).concat(oefId);
  p.huidigeDag = Math.min(7, (p.huidigeDag || 0) + 1);
  await mfProgrammaZet(p);
}

/* ---------- 69.7 Teksten die letterlijk zo moeten blijven ---------- */
const MF_TEKST = {
  introTitel: "Anker — even landen",
  introRegel: "Gratis, zonder reclame, niets verlaat je telefoon. Geen wondermiddel, wel een goed begin.",
  snelknop: "● 1 minuut rustig ademen",
  profielVraag: "Wat past bij jou? (kies één, altijd te wijzigen)",
  profielen: [
    ["volhoofd", "Gewoon een vol hoofd", "drukke week, lange dag, veel malen."],
    ["anders", "Mijn brein werkt anders", "bijvoorbeeld ADHD, autisme of snel overprikkeld. Kortere stappen, meer beweging, minder stilte."],
    ["energie", "Weinig energie", "bijvoorbeeld burn-out of ME/CVS. Alleen oefeningen 'rustig zitten of liggen'."]
  ],
  zoWerktHet: "1–10 minuten, één zin per stap. Anker stelt voor, jij beslist. Stoppen mag altijd. Met schermlezer krijg je precies dezelfde oefeningen.",
  bewijs: "Korte mindfulness helpt volwassenen met ADHD of autisme gemiddeld bij stress en piekeren — ongeveer even goed als andere hulp, niet bij iedereen. Voor energieziekten is weinig onderzoek.",
  gratis: "FutureMe is een persoonlijk project. Er is geen reclame, geen abonnement en er komt geen upgrade. Er valt aan jou niets te verdienen.",
  voetregel: "Geen behandeling. Houden klachten aan? Praat met je huisarts of behandelaar."
};
const MF_PROFIELNAAM = { volhoofd: "vol hoofd", anders: "mijn brein werkt anders", energie: "weinig energie" };
const MF_BRONNEN = [
  ["Radboudumc (Janssen e.a., 2019)", "120 volwassenen met ADHD, 8 weken groepstraining.", "Minder ADHD-klachten, milder voor zichzelf.", "Grote verbetering van plannen en organiseren direct na de training."],
  ["Meta-analyse volwassenen met ADHD (2025)", "10 studies.", "Aandacht verbetert.", "Beter dan andere psychologische hulp; veel studies zijn klein."],
  ["Tilburg University (Spek e.a., 2013)", "42 autistische volwassenen, 9 weken.", "Minder angst, somberheid en piekeren.", "Vergelijking met een andere behandeling."],
  ["Canada (Lunsky e.a., 2025)", "63 autistische volwassenen, 6 weken online met korte oefeningen.", "Minder stress, milder voor zichzelf.", "Betere lichaamswaarneming."],
  ["VK (Gaigg e.a., 2020)", "54 autistische volwassenen, zelfhulp online.", "Bij ruim 3 op 4 minder angst.", "Groot onderzoek; kleine groep."],
  ["Stanford (Balban e.a., 2023)", "114 volwassenen, 5 minuten per dag.", "Lange uitademing verbeterde de stemming het meest.", "Specifiek onderzocht bij ADHD of autisme."]
];
/* Hoeveel onderzoek is er naar deze ademoefening? Eerlijk in één woord. */
const MF_BEWIJS = { A1: "veel", A2: "veel", A5: "enig", A6: "veel", A7: "weinig", A8: "enig", A9: "enig", A10: "enig" };
const MF_BEWIJS_TEKST = { veel: "veel onderzoek", enig: "enig onderzoek", weinig: "weinig onderzoek" };
const MF_TEKST_ADEM = "Ademoefeningen verminderen stress gemiddeld een beetje tot matig. Langzaam ademen met een lange uitademing is het best onderzocht. Voor vierkant ademen en 4-7-8 is minder bewijs.";
const MF_BRONNEN_ADEM = [
  ["Oxford (Fincham e.a., 2023)", "Meta-analyse: 12 gerandomiseerde studies, 785 volwassenen.", "Ademoefeningen verminderen stress een beetje tot matig.", "Welke techniek het best werkt; veel studies hadden matige kwaliteit."],
  ["Stanford (Balban e.a., 2023)", "111 volwassenen, 5 minuten per dag, een maand. Twee keer in, lang uit, vierkant ademen en meditatie.", "Alle groepen voelden zich beter; lange uitademing (Twee keer in, lang uit) het meest.", "Vierkant ademen was niet beter dan de andere ademoefeningen."],
  ["Goessl e.a., 2017 (Zes keer per minuut)", "Meta-analyse: 24 studies met ademen op je rustritme, 484 mensen.", "Duidelijk minder stress en angst.", "Meestal met apparaat en begeleiding, niet alleen met een app."],
  ["Pisa (Zaccaro e.a., 2018)", "Overzicht van 15 studies naar langzaam ademen, minder dan 10 keer per minuut.", "Meer hartslagvariatie en een rustiger, alerter gevoel.", "Vooral gezonde mensen; weinig over klachten."],
  ["Beijing (Ma e.a., 2017, buikademhaling)", "40 volwassenen, 8 weken, 20 keer oefenen.", "Minder negatieve gevoelens, betere aandacht, lager stresshormoon.", "Kleine groep; geoefend met een feedbackapparaat."],
  ["Thailand (Vierra e.a., 2022, 4-7-8)", "43 jonge volwassenen, één keer oefenen.", "Hartslagvariatie en bloeddruk gingen iets gunstiger.", "Effect op stress of slaap op langere termijn."],
  ["New Delhi (Ghati e.a., 2021, neuriën)", "Mensen met hoge bloeddruk, één keer neuriënd uitademen.", "Meer rustsignaal in het hartritme.", "Bloeddruk daalde niet meteen; één sessie."],
  ["Overzicht om en om ademen (2017)", "44 gerandomiseerde studies naar ademen door één neusgat tegelijk.", "Gunstig voor hartslag en ademhaling.", "Uitvoering verschilt per studie; weinig over angst of stress."]
];
const MF_BRON_SLOT = "Oefenen kan soms ongemakkelijk voelen. Dat komt vaker voor bij wie het al zwaar heeft. Stoppen mag altijd.";
