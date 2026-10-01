"use strict";
// === SECTIE 83: NIEUW IN LAGEN ===
/* ==========================================================================
   83. Nieuw in lagen
   Nieuw toont niet meer één lange rij tegels maar een boom die je laag voor
   laag ingaat:
     laag 0  Snel typen (klein blokje) + Persoonlijk, Werk, Financieel, Toolbox
     laag 1  groepen (bv. Toolbox → Beslissen, Ondernemen, Thuis …)
     laag 2  modules (de kaart opent het scherm van die module)
   De gekozen kaart vliegt naar voren, de andere schuiven terug en worden
   transparant; de lagen waar je doorheen ging blijven als dunne kaarten
   bovenaan staan (kruimelpad). Het statistiekpaneel rechts toont alleen de
   cijfers van wat er op dat moment op het scherm staat.
   Hergebruikt de rail (sectie 61: uitschuiven, vegen) en het paneel
   (sectie 66). Nieuw opent altijd op laag 0.
   ========================================================================== */
V.nwPad = V.nwPad || [];

/* ---------- 83.1 De boom ----------
   Knoop: { id, naam, uitleg, ill | ico, kids } of een blad met
   view/param, act (+ data) of modus (zet eerst een tabblad in dat scherm). */
const NWL_KLEUR = { persoonlijk: "#2f6fed", werk: "#c0202f", financieel: "#0f766e", toolbox: "#9a4f0a" };
function nwlBoom() {
  const filters = (S.filters || []).filter(f => f.vast).map(f => ({ naam: f.naam, ico: "bliksem", act: "filter-open", data: { id: f.id }, uitleg: "Vastgezette lijst" }));
  const hustles = (S.sh_hustles || []).filter(h => !h.gearchiveerd).slice(0, 4).map(h => ({ naam: h.naam, ico: "raket", view: "sh", param: h.id, uitleg: "Side hustle" }));
  const hhLijsten = (S.hh_lijsten || []).slice(0, 3).map(l => ({ naam: l.naam, ico: "bezem", view: "hhlijst", param: l.id, uitleg: "Schoonmaaklijst" }));
  const lijstjes = typeof ljLijsten === "function" ? ljLijsten().slice(0, 4).map(l => ({ naam: l.naam, ico: (typeof ljSoort === "function" ? ljSoort(l).ico : "lijst"), view: "lijstje", param: l.id, uitleg: "Lijstje" })) : [];
  const laatst = S.gebeurtenissen.length ? S.gebeurtenissen.slice().sort((a, b) => a.ts < b.ts ? 1 : -1)[0].tekst : "";
  const mindful = typeof mfMindfulGewoonte === "function" && mfMindfulGewoonte();
  return [
    { id: "persoonlijk", naam: "Persoonlijk", ill: "persoonlijk", uitleg: "Plannen, gezondheid, welzijn en groei", kids: [
      { id: "plannen", naam: "Plannen", ico: "vandaag", uitleg: "Taken, afspraken en lijsten", kids: [
        { naam: "Vandaag", ico: "vandaag", view: "vandaag" }, { naam: "Komend", ico: "komend", view: "komend" }, { naam: "Inbox", ico: "inbox", view: "inbox" },
        { naam: "Alle taken", ico: "check", view: "persoonlijk" }, { naam: "Afspraken", ico: "groep", view: "afspraken" }, { naam: "Kalender", ico: "komend", view: "kalender" },
        { naam: "Projecten", ico: "map", view: "projecten" }, { naam: "Checklists", ico: "lijst", view: "checklists" }, { naam: "Slimme lijsten", ico: "bliksem", view: "filters" }, ...filters] },
      { id: "gezondheid", naam: "Gezondheid", ill: "gezondheid", uitleg: "Eten, water, sport en gewicht", kids: [
        { naam: "Vandaag", ico: "hart", view: "gezondheid", modus: ["vsModus", "vandaag"] }, { naam: "Loggen", ico: "pen", view: "gezondheid", modus: ["vsModus", "loggen"] },
        { naam: "Doelen", ico: "doel", view: "gezondheid", modus: ["vsModus", "doelen"] }, { naam: "Planning", ico: "komend", view: "gezondheid", modus: ["vsModus", "planning"] },
        { naam: "Rookvrij", ico: "blad", view: "roken" }] },
      { id: "welzijn", naam: "Welzijn", ico: "hart", uitleg: "Dagboek, gewoontes en rust", kids: [
        { naam: "Dagboek", ico: "boek", view: "dagboek" }, { naam: "Gewoontes", ico: "vuur", view: "gewoontes" },
        ...(mindful ? [{ naam: "Mindful moment", ico: "anker", act: "mf-start", data: { id: "A1", min: "1", bron: "gewoonte" }, uitleg: "Eén minuut ademen, vinkt de gewoonte af" }] : []),
        { naam: "Anker", ico: "anker", view: "anker", uitleg: "Even landen" }] },
      { id: "mensen", naam: "Mensen", ico: "persoon", uitleg: "Wie hoort bij wat", kids: [
        { naam: "Personen", ico: "persoon", view: "personen" }, { naam: "Afspraken", ico: "groep", view: "afspraken" }] },
      { id: "groei", naam: "Groei", ill: "hobby", uitleg: "Hobby's en skills", kids: [{ naam: "HobbySkills", ill: "hobby", view: "hobbyskills" }] }] },
    { id: "werk", naam: "Werk", ill: "werk", uitleg: "Werktaken, meetings, documenten en tijd", kids: [
      { id: "werktaken", naam: "Werktaken", ico: "check", uitleg: "Wat er op je werkbord ligt", kids: [
        { naam: "Werkoverzicht", ill: "werk", view: "werk" }, { naam: "Nieuwe werktaak", ico: "plus", act: "werk-taak" }, { naam: "Projecten", ico: "map", view: "projecten" }] },
      { id: "meetings", naam: "Meetings", ico: "groep", uitleg: "Voorbereiden, notuleren, besluiten", kids: [
        { naam: "Werkafspraak", ico: "komend", act: "werk-afspraak" }, { naam: "Meetingverslag", ico: "groep", act: "werk-nieuw", data: { soort: "meeting" } },
        { naam: "Besluit vastleggen", ico: "hamer", act: "werk-nieuw", data: { soort: "besluit" } }, { naam: "Alle afspraken", ico: "groep", view: "afspraken" }] },
      { id: "documenten", naam: "Werkdocumenten", ico: "doc", uitleg: "Plannen, strategie en reflectie", kids: [
        { naam: "Reflectie", ico: "boek", act: "werk-nieuw", data: { soort: "reflectie" } }, { naam: "Strategie", ico: "kompas", act: "werk-nieuw", data: { soort: "strategie" } },
        { naam: "Meerjarenplan", ico: "trap", act: "werk-nieuw", data: { soort: "meerjarenplan" } }, { naam: "Werknotitie", ico: "pen", act: "werk-nieuw", data: { soort: "notitie" } }] },
      { id: "tijd", naam: "Tijd", ico: "tijd", uitleg: "Focustimer en uren", kids: [{ naam: "Focustimer", ico: "doel", view: "focus" }, { naam: "Tijdsregistratie", ico: "tijd", view: "tijd" }] }] },
    { id: "financieel", naam: "Financieel", ill: "financieel", uitleg: "Budget, vaste lasten, sparen en wensen", kids: [
      { id: "vandaag", naam: "Vandaag", ico: "portemonnee", uitleg: "Dagbudget en uitgaven", kids: [
        { naam: "Dagbudget", ico: "portemonnee", view: "financieel", modus: ["finModus", "budget"] }, { naam: "Uitgaven", ico: "euro", view: "financieel", modus: ["finModus", "uitgaven"] }] },
      { id: "vast", naam: "Vaste lasten", ico: "herhaal", uitleg: "Incasso's en verdeling", kids: [
        { naam: "Vaste lasten", ico: "herhaal", view: "financieel", modus: ["finModus", "vast"] }, { naam: "Incasso's", ico: "komend", view: "financieel", modus: ["finModus", "incasso"] }] },
      { id: "sparen", naam: "Sparen", ico: "euro", uitleg: "Inkomen verdelen in potjes", kids: [{ naam: "Potjes", ico: "euro", view: "financieel", modus: ["finModus", "potjes"] }] },
      { id: "wensen", naam: "Wensen", ill: "wishlist", uitleg: "Wishlist met koopcheck", kids: [{ naam: "Wishlist", ill: "wishlist", view: "wishlist" }] }] },
    { id: "toolbox", naam: "Toolbox", ill: "toolbox", uitleg: "Al je hulpmiddelen op één plek", kids: [
      { id: "beslissen", naam: "Beslissen", ill: "keuze", uitleg: "Keuzemachine en theorie", kids: [
        { naam: "Keuzemachine", ill: "keuze", view: "keuze" }, { naam: "Uitsteltest", ico: "vraag", view: "keuzetest", param: "profiel" }, { naam: "Keuzetheorie", ico: "boek", view: "keuzetheorie" }] },
      { id: "ondernemen", naam: "Ondernemen", ill: "sidehustle", uitleg: "Side hustles en ideeën", kids: [
        { naam: "Side Hustles", ill: "sidehustle", view: "sidehustles" }, { naam: "Ideeënbank", ico: "bliksem", view: "shideeen" }, ...hustles] },
      { id: "thuis", naam: "Thuis", ill: "huishouden", uitleg: "Huishouden, één klus tegelijk", kids: [
        { naam: "Huishouden", ill: "huishouden", view: "huishouden" }, ...hhLijsten, { naam: "Waarom zo?", ico: "vraag", view: "hhwaarom" }] },
      { id: "rust", naam: "Rust en focus", ill: "anker", uitleg: "Anker en focussessies", kids: [
        { naam: "Anker", ill: "anker", view: "anker" }, { naam: "Kies een oefening", ico: "anker", view: "ankerkies" }, { naam: "Focussessie", ico: "ster", act: "ses-taken", uitleg: "Je taken van vandaag, één kaart tegelijk" }] },
      { id: "denken", naam: "Denken", ill: "mindmap", uitleg: "Mindmaps en ideeën uittekenen", kids: [{ naam: "Mindmap", ill: "mindmap", view: "mindmap" }] },
      { id: "verzamelen", naam: "Verzamelen", ill: "lijstjes", uitleg: "Films, series, boeken en meer", kids: [
        { naam: "Lijstjes", ill: "lijstjes", view: "lijstjes" }, ...lijstjes, { naam: "Jouw jaar", ico: "ster", view: "ljjaar", param: vandaagISO().slice(0, 4) }] },
      { id: "inzicht", naam: "Inzicht", ill: "voortgang", uitleg: "Voortgang, terugblik en logboek", kids: [
        { naam: "Voortgang", ill: "voortgang", act: "vg-open" }, { naam: "Terugblik", ico: "grafiek", view: "stats" },
        { naam: "Logboek", ico: "logboek", view: "logboek", uitleg: laatst ? "Laatst: " + laatst.slice(0, 40) : "Alles wat je deed" }, { naam: "Zoeken", ico: "zoek", view: "zoeken" }] }] }
  ];
}
function nwlKnoop(pad) {
  let lijst = nwlBoom(), knoop = null;
  for (const id of pad) { knoop = lijst.find(k => k.id === id); if (!knoop || !knoop.kids) return null; lijst = knoop.kids; }
  return { knoop, kids: lijst };
}

/* ---------- 83.2 Cijfers per knoop (uitlegregel en paneel) ---------- */
const nwlN = x => Math.round(x || 0).toLocaleString("nl-NL");
const nwlMv = (x, e, m) => `${nwlN(x)} ${Math.round(x) === 1 ? e : m}`;
const nwlR = (label, waarde, sub) => ({ label, waarde: String(waarde), sub: sub || "" });
function nwlCijfers(pad) {
  const v = vandaagISO(), ws = weekStart(v), ym = v.slice(0, 7), van30 = plusDagen(v, -29), sleutel = pad.join("/");
  const open = typeof openTaken === "function" ? openTaken() : S.taken.filter(t => !t.af);
  const tv = typeof vwTussenstand === "function" ? vwTussenstand : () => "";
  const vt = typeof fmVandaagTaken === "function" ? fmVandaagTaken() : { open: [], af: [] };
  const rk = typeof rookCijfers === "function" ? rookCijfers() : null;
  const sport = (S.vs_sportlog || []).filter(l => l.datum >= ws).length;
  const water = (S.vs_logs || []).filter(l => l.datum === v && l.moment === "water").length;
  const werkOpen = open.filter(t => t.werk), meetings = S.afspraken.filter(a => a.werk && a.datum >= v && a.datum <= plusDagen(v, 6));
  const uren = S.tijdlog.filter(l => l.datum >= ws).reduce((a, l) => a + (l.seconden || 0), 0) / 3600;
  const uitMaand = S.uitgaven.filter(u => (u.datum || "").slice(0, 7) === ym).reduce((a, u) => a + (+u.bedrag || 0), 0);
  const b = typeof dagbudget === "function" ? dagbudget(v) : null;
  const ink = S.incassos.filter(i => i.actief);
  // Totaal van de incasso's, omgerekend naar per maand (week ×52/12, kwartaal /3, halfjaar /6, jaar /12).
  const inkMaand = ink.reduce((a, i) => { const f = (typeof FREQ === "object" && FREQ[i.freq]) || [0, 1]; return a + (i.freq === "week" ? (+i.bedrag || 0) * 52 / 12 : (+i.bedrag || 0) / (f[1] || 1)); }, 0);
  const wl = (S.wl_items || []).filter(x => (x.status || "actief") === "actief");
  const km = typeof kmBesloten === "function" ? kmBesloten().filter(d => d.besluit.op.slice(0, 10) >= ws).length : 0;
  const kmOpenN = typeof kmOpen === "function" ? kmOpen().length : 0;
  const shAct = (S.sh_hustles || []).filter(h => !h.gearchiveerd);
  const shOmzet = (S.sh_geld || []).filter(g => g.soort === "in" && (g.datum || "").startsWith(ym)).reduce((a, g) => a + g.bedrag / 100, 0);
  const shUren = S.tijdlog.filter(l => l.shId && l.datum >= ws).reduce((a, l) => a + l.seconden / 3600, 0);
  const hh = typeof hhWeekCijfers === "function" ? hhWeekCijfers() : { taken: 0, sessies: 0 };
  const mf = (S.mf_sessies || []).filter(s => (s.datum || (s.start || "").slice(0, 10)) >= ws).length;
  const ljBezig = (S.lj_items || []).filter(x => x.status === "bezig").length, ljAf = (S.lj_items || []).filter(x => x.status === "klaar" && (x.afgerond || "").startsWith(v.slice(0, 4))).length;
  const vgDoelen = (S.vg_doelen || []).filter(d => (d.status || "actief") === "actief").length;
  const hsMin = (S.hs_items || []).flatMap(x => x.sessies || []).filter(s => (s.datum || "") >= ws).reduce((a, s) => a + (+s.minuten || 0), 0);
  const gewWeek = S.gewoontelog.filter(l => l.datum >= ws).length;
  const checkins = S.dagboek.filter(d => d.checkinTs && d.datum >= ws).length;
  const lijsten = S.checklists.filter(c => !c.sjabloon);
  const T = {
    "persoonlijk": [tv("persoonlijk") || `${nwlN(open.length)} open taken`, [nwlR("Vandaag af", `${vt.af.length} / ${vt.open.length + vt.af.length}`), nwlR("Open taken", nwlN(open.length), `${open.filter(t => t.datum && t.datum < v).length} te laat`),
      nwlR("Afspraken deze week", nwlN(S.afspraken.filter(a => a.datum >= v && a.datum <= plusDagen(v, 6)).length)), nwlR("Gesport deze week", nwlMv(sport, "keer", "keer")), nwlR("Gewoontes deze week", nwlN(gewWeek))]],
    "werk": [tv("werk") || `${nwlN(werkOpen.length)} werktaken open`, [nwlR("Werktaken open", nwlN(werkOpen.length)), nwlR("Meetings komende 7 dagen", nwlN(meetings.length)), nwlR("Uren deze week", nwlN(uren)),
      nwlR("Werkdocumenten", nwlN(S.werkdocs.filter(d => d.status !== "archief").length))]],
    "financieel": [tv("financieel") || `${eur(uitMaand)} deze maand`, [...(b && b.maand ? [nwlR("Over vandaag", eur(b.over))] : []), nwlR("Uitgegeven deze maand", eur(uitMaand)),
      nwlR("Actieve incasso's", nwlN(ink.length), `± ${eur(inkMaand)} per maand`), nwlR("Totaal incasso's per maand", eur(inkMaand), `± ${eur(inkMaand * 12)} per jaar`), nwlR("Potjes", nwlN(S.potjes.length)), nwlR("Wensen", nwlN(wl.length))]],
    "toolbox": [[kmOpenN ? `${kmOpenN} open keuze${kmOpenN === 1 ? "" : "s"}` : "", ljBezig ? `${ljBezig} bezig in Lijstjes` : "", hh.sessies ? `${hh.taken} klussen` : ""].filter(Boolean).join(" · ") || "Al je hulpmiddelen op één plek",
      [nwlR("Besluiten deze week", nwlN(km), kmOpenN ? `${kmOpenN} open` : ""), nwlR("Side hustles", nwlN(shAct.length), shOmzet ? eur(shOmzet) + " omzet deze maand" : ""), nwlR("Huishoudklussen deze week", nwlN(hh.taken)),
        nwlR("Anker-momenten deze week", nwlN(mf)), nwlR("Lijstjes afgerond dit jaar", nwlN(ljAf), ljBezig ? `${ljBezig} bezig` : ""), nwlR("Actieve doelen", nwlN(vgDoelen))]],
    "persoonlijk/plannen": [`${vt.af.length} van ${vt.open.length + vt.af.length} af vandaag`, [nwlR("Open taken", nwlN(open.length)), nwlR("Te laat", nwlN(open.filter(t => t.datum && t.datum < v).length)),
      nwlR("Afgerond deze week", nwlN(S.taken.filter(t => t.af && (t.afOp || "") >= ws).length)), nwlR("Projecten", nwlN(S.projecten.length)), nwlR("Checklists", nwlN(lijsten.length))]],
    "persoonlijk/gezondheid": [[sport ? `${sport}× gesport` : "", rk ? `${rk.heleDagen} dagen rookvrij` : ""].filter(Boolean).join(" · ") || "Eten, water, sport en gewicht",
      [nwlR("Gesport deze week", nwlN(sport)), nwlR("Water vandaag", nwlMv(water, "glas", "glazen")), ...(rk ? [nwlR("Dagen rookvrij", nwlN(rk.heleDagen), eur(rk.bespaard) + " bespaard")] : []),
        nwlR("Eetmomenten vandaag", nwlN((S.vs_logs || []).filter(l => l.datum === v && l.moment !== "water").length))]],
    "persoonlijk/welzijn": [`${checkins} check-ins deze week`, [nwlR("Ochtend-check-ins deze week", nwlN(checkins)), nwlR("Gewoontes volbracht deze week", nwlN(gewWeek)), nwlR("Anker-momenten deze week", nwlN(mf)), nwlR("Dagboekdagen", nwlN(S.dagboek.length))]],
    "persoonlijk/mensen": [nwlMv(S.personen.length, "persoon", "personen"), [nwlR("Personen", nwlN(S.personen.length)), nwlR("Afspraken deze week", nwlN(S.afspraken.filter(a => a.datum >= v && a.datum <= plusDagen(v, 6)).length))]],
    "persoonlijk/groei": [hsMin ? `${hsMin} min geoefend deze week` : "Hobby's en skills", [nwlR("Hobby's en skills", nwlN((S.hs_items || []).length)), nwlR("Geoefend deze week", nwlN(hsMin) + " min")]],
    "werk/werktaken": [`${werkOpen.length} open`, [nwlR("Werktaken open", nwlN(werkOpen.length)), nwlR("Af deze week", nwlN(S.taken.filter(t => t.werk && t.af && (t.afOp || "") >= ws).length))]],
    "werk/meetings": [`${meetings.length} deze week`, [nwlR("Meetings komende 7 dagen", nwlN(meetings.length)), nwlR("Toezeggingen open", nwlN(S.afspraken.filter(a => a.werk && a.soort === "toezegging" && !a.uitkomst).length))]],
    "werk/documenten": [nwlMv(S.werkdocs.filter(d => d.status !== "archief").length, "document", "documenten"), [nwlR("Actieve documenten", nwlN(S.werkdocs.filter(d => d.status === "actief").length)), nwlR("Concepten", nwlN(S.werkdocs.filter(d => d.status === "concept").length))]],
    "werk/tijd": [`${nwlN(uren)} uur deze week`, [nwlR("Uren deze week", (Math.round(uren * 10) / 10).toString().replace(".", ",")), nwlR("Registraties deze week", nwlN(S.tijdlog.filter(l => l.datum >= ws).length))]],
    "financieel/vandaag": [b && b.maand ? `${eur(b.over)} over vandaag` : `${eur(uitMaand)} deze maand`, [...(b && b.maand ? [nwlR("Over vandaag", eur(b.over))] : []), nwlR("Uitgegeven deze maand", eur(uitMaand)), nwlR("Uitgaven deze maand", nwlN(S.uitgaven.filter(u => (u.datum || "").slice(0, 7) === ym).length))]],
    "financieel/vast": [ink.length ? `${nwlMv(ink.length, "incasso", "incasso's")} · ${eur(inkMaand)} p/m` : "Geen incasso's", [nwlR("Actieve incasso's", nwlN(ink.length)),
      nwlR("Totaal per maand", eur(inkMaand)), nwlR("Totaal per jaar", eur(inkMaand * 12))]],
    "financieel/sparen": [nwlMv(S.potjes.length, "potje", "potjes"), [nwlR("Potjes", nwlN(S.potjes.length))]],
    "financieel/wensen": [nwlMv(wl.length, "wens", "wensen"), [nwlR("Op de wishlist", nwlN(wl.length), eur(wl.reduce((a, x) => a + (+x.prijs || 0), 0))), nwlR("Gespaard", eur(wl.reduce((a, x) => a + (+x.gespaard || 0), 0)))]],
    "toolbox/beslissen": [km ? `${km} besluiten deze week` : kmOpenN ? `${kmOpenN} open` : "Een A/B-keuze in minuten", [nwlR("Besluiten deze week", nwlN(km)), nwlR("Open keuzes", nwlN(kmOpenN)), nwlR("XP", nwlN(inst("km_xp", 0)))]],
    "toolbox/ondernemen": [[shOmzet ? eur(shOmzet) + " deze maand" : "", shUren ? nwlN(shUren) + " uur deze week" : ""].filter(Boolean).join(" · ") || nwlMv(shAct.length, "side hustle", "side hustles"),
      [nwlR("Side hustles", nwlN(shAct.length)), nwlR("Omzet deze maand", eur(shOmzet)), nwlR("Uren deze week", (Math.round(shUren * 10) / 10).toString().replace(".", ",")),
        nwlR("Open ideeën", nwlN((S.sh_ideeen || []).filter(x => x.status === "open" || x.status === "onderzoek").length))]],
    "toolbox/thuis": [hh.sessies ? `${hh.taken} klussen deze week` : "Eén klus tegelijk", [nwlR("Klussen deze week", nwlN(hh.taken)), nwlR("Sessies deze week", nwlN(hh.sessies)), nwlR("Schoonmaaklijsten", nwlN((S.hh_lijsten || []).length))]],
    "toolbox/rust": [mf ? `${mf} momenten deze week` : "Even landen", [nwlR("Anker-momenten deze week", nwlN(mf)), nwlR("Focussessies deze week", nwlN((S.hh_sessies || []).filter(s => s.bron && s.bron !== "huishouden" && (s.datum || "") >= ws).length))]],
    "toolbox/denken": [nwlMv(S.mm_mindmaps.length, "mindmap", "mindmaps"), [nwlR("Mindmaps", nwlN(S.mm_mindmaps.length)), nwlR("Nodes", nwlN(S.mm_mindmaps.reduce((a, m) => a + (m.nodes || []).length, 0)))]],
    "toolbox/verzamelen": [[ljBezig ? `${ljBezig} bezig` : "", ljAf ? `${ljAf} afgerond dit jaar` : ""].filter(Boolean).join(" · ") || "Films, series, boeken en meer", [nwlR("Lijstjes", nwlN((S.lj_lijsten || []).length)), nwlR("Bezig", nwlN(ljBezig)), nwlR("Afgerond dit jaar", nwlN(ljAf))]],
    "toolbox/inzicht": [vgDoelen ? `${vgDoelen} actieve doelen` : "Voortgang, terugblik en logboek", [nwlR("Actieve doelen", nwlN(vgDoelen)), nwlR("Logregels", nwlN(S.gebeurtenissen.length)), nwlR("Taken afgerond in totaal", nwlN(S.taken.filter(t => t.af).length))]]
  };
  const t = T[sleutel];
  return t ? { samenvatting: t[0], rijen: t[1] } : null;
}

/* ---------- 83.3 Weergave ---------- */
function nwlBeeld(k) {
  if (k.ill) return `<svg class="ill3d" viewBox="0 0 100 80" aria-hidden="true" focusable="false"><use href="#ill-${k.ill}"/></svg>`;
  return `<svg class="ill3d nwl-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#i-${k.ico || "pijlr"}"/></svg>`;
}
/* Tussenstand van een module (zoals de oude tegels op Nieuw die hadden). */
function nwlTussenstand(k) {
  try {
    if (k.view === "anker" && typeof mfWeekMomenten === "function") { const n = mfWeekMomenten(); return `Deze week: ${n} ${n === 1 ? "moment" : "momenten"}`; }
    if (k.view === "lijstjes" && typeof ljTussenstand === "function") return ljTussenstand();
    if (k.view === "keuze" && typeof kmTussenstand === "function") return kmTussenstand();
    if (k.view && typeof vwTussenstand === "function") return vwTussenstand(k.view) || "";
  } catch (e) { return ""; }
  return "";
}
function nwlKaartHTML(k, pad, kleur) {
  const eigen = pad.concat(k.id || []), c = k.kids ? nwlCijfers(eigen) : null;
  const uitleg = (c && c.samenvatting) || (!k.kids && nwlTussenstand(k)) || k.uitleg || "";
  const anker = !k.kids && k.view === "anker";
  let attrs;
  if (k.kids) attrs = k.kids.length === 1 && !k.kids[0].kids ? nwlBladAttrs(k.kids[0]) + ` data-nwl-direct="1"` : `data-act="nwl-in" data-id="${esc(k.id)}"`;
  else attrs = nwlBladAttrs(k);
  return `<button class="knop3d breed nwl-kaart${anker ? " mf-tegel" : ""}" style="--k:${kleur}" ${attrs}${anker ? ` aria-description="Houd ingedrukt om meteen 1 minuut rustig te ademen"` : ""} aria-label="${esc(k.naam)}${uitleg ? ": " + esc(uitleg) : ""}">
    ${nwlBeeld(k)}
    <span class="tekst3d"><span class="nm3d" style="display:block">${esc(k.naam)}${k.kids && !(k.kids.length === 1 && !k.kids[0].kids) ? `<span class="nwl-dieper" aria-hidden="true">${ico("pijlr")}</span>` : ""}</span>${uitleg ? `<span class="ds3d" style="display:block">${esc(uitleg)}</span>` : ""}</span>
  </button>`;
}
function nwlBladAttrs(k) {
  if (k.modus) return `data-act="nwl-ga" data-view="${esc(k.view)}" data-mk="${esc(k.modus[0])}" data-mv="${esc(k.modus[1])}"`;
  if (k.act) return `data-act="${esc(k.act)}"` + Object.entries(k.data || {}).map(([a, w]) => ` data-${a}="${esc(w)}"`).join("");
  return `data-act="ga" data-view="${esc(k.view)}"${k.param != null ? ` data-param="${esc(k.param)}"` : ""}`;
}
const NWL_ILL_ICO = { persoonlijk: "persoon", werk: "koffer", financieel: "portemonnee", toolbox: "hamer", keuze: "keuze", sidehustle: "raket", huishouden: "bezem", anker: "anker",
  mindmap: "mindmap", lijstjes: "lijstjes", voortgang: "doel", gezondheid: "hart", hobby: "hobby", wishlist: "cadeau" };
function nwlPaneelHTML(pad, kids) {
  const open = V.nwlOpen || null;
  const themas = kids.map(k => ({ k, c: k.kids ? nwlCijfers(pad.concat(k.id)) : null })).filter(x => x.c && x.c.rijen.length);
  let h = "";
  if (pad.join("/") === "toolbox/ondernemen" || (pad.length === 1 && pad[0] === "toolbox" && open === "ondernemen")) h += typeof nwoDiagram === "function" ? nwoDiagram() : "";
  const huidig = pad.length ? nwlCijfers(pad) : null;
  if (!themas.length && huidig) themas.push({ k: { id: "_hier", naam: nwlKnoop(pad).knoop.naam, ico: nwlKnoop(pad).knoop.ico, ill: nwlKnoop(pad).knoop.ill }, c: huidig });
  h += `<div class="nwo-stats"><div class="nwo-statkop">Statistieken${pad.length ? " · " + esc(nwlKnoop(pad).knoop.naam) : ""}</div>${themas.map(({ k, c }) => {
    const o = open === k.id || themas.length === 1;
    return `<div class="nwo-thema${o ? " open" : ""}" data-thema-id="${esc(k.id)}">
      <button class="nwo-themakop" data-act="nwl-klap" data-id="${esc(k.id)}" aria-expanded="${o}">
        <span class="nwo-ico nwl-pico" aria-hidden="true" style="color:${NWL_KLEUR[pad[0] || k.id] || "var(--accent)"}">${ico(k.ico || NWL_ILL_ICO[k.ill] || "grafiek")}</span>
        <span class="nwo-tn"><b>${esc(k.naam)}</b><small>${esc(c.samenvatting)}</small></span>
        ${ico("pijlr", `width:14px;height:14px;flex:0 0 auto;color:var(--faint);transform:rotate(${o ? 90 : 0}deg);transition:transform .2s`)}</button>
      ${o ? `<div class="nwo-rijen"><div class="nwo-rijenkop">Kerncijfers</div>${c.rijen.map(x => `<div class="nwo-rij"><span>${esc(x.label)}${x.sub ? `<small>${esc(x.sub)}</small>` : ""}</span><b>${esc(x.waarde)}</b></div>`).join("")}</div>` : ""}
    </div>`;
  }).join("")}</div>`;
  return h;
}
function nwlStapelHTML(pad) {
  if (!pad.length) return "";
  const namen = ["Nieuw"].concat(pad.map((_, i) => nwlKnoop(pad.slice(0, i + 1)).knoop.naam));
  const kleur = NWL_KLEUR[pad[0]];
  return `<nav class="nwl-stapel" aria-label="Waar je bent" style="--k:${kleur}">
    <button class="nwl-terug" data-act="nwl-terug" aria-label="Eén laag terug">${ico("pijll")}</button>
    <ol>${namen.map((n, i) => i < namen.length - 1
      ? `<li style="--d:${namen.length - 1 - i}"><button class="nwl-laag" data-act="nwl-naar" data-diepte="${i}">${esc(n)}</button></li>`
      : `<li class="nu" aria-current="page"><span>${esc(n)}</span></li>`).join("")}</ol>
  </nav>`;
}
function vwNieuwLagen() {
  let pad = V.nwPad || [];
  let r = pad.length ? nwlKnoop(pad) : { knoop: null, kids: nwlBoom() };
  if (!r) { pad = V.nwPad = []; r = { knoop: null, kids: nwlBoom() }; }
  const kleurVan = k => NWL_KLEUR[pad[0] || k.id] || "var(--accent)";
  const open = V.nwOpen, kh = V.nwKnopH ? `;--nw-kh:${V.nwKnopH}px` : "";
  const richting = V.nwlRichting ? ` nwl-${V.nwlRichting}` : "";
  const snel = pad.length ? "" : `<button class="nwl-snel" data-act="start-knop" data-soort="snel" aria-label="Snel typen"><svg aria-hidden="true" viewBox="0 0 24 24"><use href="#i-aa"/></svg></button>`;
  return `${nwlStapelHTML(pad)}
  <div class="nw-rail nwl-rail${open ? " open" : ""}${richting}${pad.length ? " nwl-diep" : ""}" style="--nw-p:${open ? 1 : 0}${kh}">
    <div class="nw-paneel" aria-hidden="${!!open}">${nwlPaneelHTML(pad, r.kids)}</div>
    ${snel}
    ${r.kids.map((k, n) => `<div class="nw-slot" style="--i:${n}">${nwlKaartHTML(k, pad, kleurVan(k))}</div>`).join("")}
  </div>`;
}
{
  const _s = vwStart;
  vwStart = function () { return vwNieuwLagen(); };
  void _s;
}
/* Hoogte: kaarten iets breder dan hoog (max. 80 px), samen even hoog als het paneel. */
const NWL_MIN = 56, NWL_MAX = 80, NWL_GAT = 12;
nwoHoogte = function () {
  const rail = $(".nw-rail"), p = rail && rail.querySelector(".nw-paneel");
  if (!rail) return;
  const slots = rail.querySelectorAll(".nw-slot"), n = slots.length, snel = rail.querySelector(".nwl-snel");
  const beschikbaar = (p ? p.offsetHeight : 0) - (snel ? snel.offsetHeight + NWL_GAT : 0) - NWL_GAT * (n - 1);
  const kh = n ? Math.max(NWL_MIN, Math.min(NWL_MAX, +(beschikbaar / n).toFixed(2))) : NWL_MAX;
  V.nwKnopH = kh;
  rail.style.setProperty("--nw-kh", kh + "px");
  rail.classList.toggle("nw-laag", kh < 70);
  rail.style.minHeight = (p ? p.offsetHeight + 8 : 0) + "px";
};

/* Omzet/uren wisselen in het diagram (Ondernemen) hertekent dit paneel, niet het oude. */
nwoHerteken = function () {
  const p = $(".nw-paneel"), pad = V.nwPad || [], r = pad.length ? nwlKnoop(pad) : { kids: nwlBoom() };
  if (p && r) { p.innerHTML = nwlPaneelHTML(pad, r.kids); nwoHoogte(); }
};

/* ---------- 83.4 Lagen wisselen: vliegen en vervagen ---------- */
const nwlStil = () => !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
function nwlNaar(pad, richting, bron) {
  const rail = $(".nwl-rail");
  const klaar = () => { V.nwPad = pad; V.nwlRichting = richting === "in" ? "binnen" : "terugkomst"; V.nwlOpen = null; teken(); $("#scherm").scrollTop = 0; setTimeout(() => { V.nwlRichting = null; }, 50); };
  if (!rail || nwlStil()) return klaar();
  rail.classList.add(richting === "in" ? "nwl-weg-in" : "nwl-weg-terug");
  if (bron) { const s = bron.closest(".nw-slot"); if (s) s.classList.add("nwl-gekozen"); }
  const st = $(".nwl-stapel"); if (st && richting !== "in") st.classList.add("nwl-krimp");
  tril(6);
  setTimeout(klaar, 300);
}
document.addEventListener("click", e => {
  const el = e.target.closest && e.target.closest("[data-act^='nwl-']");
  if (!el) return;
  const a = el.dataset.act;
  if (a === "nwl-in") nwlNaar((V.nwPad || []).concat(el.dataset.id), "in", el);
  else if (a === "nwl-terug") nwlNaar((V.nwPad || []).slice(0, -1), "terug");
  else if (a === "nwl-naar") nwlNaar((V.nwPad || []).slice(0, +el.dataset.diepte), "terug");
  else if (a === "nwl-klap") { V.nwlOpen = V.nwlOpen === el.dataset.id ? null : el.dataset.id; const p = $(".nw-paneel"), pad = V.nwPad || [], r = pad.length ? nwlKnoop(pad) : { kids: nwlBoom() };
    if (p && r) { p.innerHTML = nwlPaneelHTML(pad, r.kids); requestAnimationFrame(nwoHoogte); } }
  else if (a === "nwl-ga") { V[el.dataset.mk] = el.dataset.mv; ga(el.dataset.view); }
});
/* Nieuw opent altijd op laag 0; terug via de app gaat eerst een laag omhoog. */
{
  const _ga = ga;
  ga = function (view) { if (view === "start" && V.view !== "start") { V.nwPad = []; V.nwlOpen = null; } return _ga.apply(this, arguments); };
  const _t = terug;
  terug = function () { if (V.view === "start" && (V.nwPad || []).length) return nwlNaar(V.nwPad.slice(0, -1), "terug"); return _t.apply(this, arguments); };
}
