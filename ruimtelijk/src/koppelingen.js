"use strict";
/* ==========================================================================
   52. Koppelingen tussen schermen
   - "Verder naar": elk scherm eindigt met 2–4 verwante schermen.
   - Meer-scherm gegroepeerd in thema's (met HobbySkills en Instellingen).
   - HobbySkills op het startscherm, in Persoonlijk, op het dagoverzicht,
     in Terugblik en in Zoeken.
   ========================================================================== */
const VERWANT = {
  welkom: [["vandaag", "Vandaag"], ["overzicht", "Deze week"]],
  start: [["persoonlijk", "Persoonlijk"], ["hobbyskills", "HobbySkills"], ["logboek", "Logboek"]],
  vandaag: [["komend", "Komende 7 dagen"], ["kalender", "Kalender"], ["gewoontes", "Gewoontes"], ["dagboek", "Dagboek"]],
  komend: [["kalender", "Kalender"], ["overzicht", "Overzicht"], ["projecten", "Projecten"], ["afspraken", "Afspraken"]],
  afspraken: [["personen", "Personen"], ["kalender", "Kalender"], ["werk", "Werk"], ["logboek", "Logboek"]],
  afspraak: [["afspraken", "Alle afspraken"], ["personen", "Personen"], ["kalender", "Kalender"]],
  mindmap: [["projecten", "Projecten"], ["sidehustles", "Side Hustle"], ["hobbyskills", "HobbySkills"]],
  hobbyskills: [["gewoontes", "Gewoontes"], ["tijd", "Tijdsregistratie"], ["stats", "Terugblik"], ["mindmap", "Mindmap"]],
  hobbyskill: [["hobbyskills", "Alle hobby's & skills"], ["vandaag", "Vandaag"], ["logboek", "Logboek"]],
  gewoontes: [["hobbyskills", "HobbySkills"], ["gezondheid", "Gezondheid"], ["dagboek", "Dagboek"], ["stats", "Terugblik"]],
  dagboek: [["gewoontes", "Gewoontes"], ["logboek", "Logboek"], ["stats", "Terugblik"]],
  logboek: [["stats", "Terugblik"], ["dagboek", "Dagboek"], ["tijd", "Tijdsregistratie"]],
  stats: [["overzicht", "Overzicht"], ["gewoontes", "Gewoontes"], ["hobbyskills", "HobbySkills"], ["tijd", "Tijdsregistratie"]],
  projecten: [["mindmap", "Mindmap"], ["komend", "Komend"], ["checklists", "Checklists"]],
  project: [["projecten", "Alle projecten"], ["mindmap", "Mindmap"], ["komend", "Komend"]],
  kalender: [["komend", "Komend"], ["overzicht", "Overzicht"], ["afspraken", "Afspraken"]],
  dag: [["kalender", "Kalender"], ["komend", "Komend"], ["vandaag", "Vandaag"]],
  overzicht: [["kalender", "Kalender"], ["stats", "Terugblik"], ["komend", "Komend"]],
  financieel: [["overzicht", "Overzicht"], ["stats", "Terugblik"], ["sidehustles", "Side Hustle"]],
  werk: [["afspraken", "Afspraken"], ["tijd", "Tijdsregistratie"], ["projecten", "Projecten"]],
  werkdoc: [["werk", "Alle documenten"], ["afspraken", "Afspraken"]],
  gezondheid: [["gewoontes", "Gewoontes"], ["hobbyskills", "HobbySkills"], ["roken", "Rookvrij"], ["dagboek", "Dagboek"]],
  roken: [["gezondheid", "Gezondheid"], ["gewoontes", "Gewoontes"], ["financieel", "Financieel"]],
  sidehustles: [["mindmap", "Mindmap"], ["financieel", "Financieel"], ["projecten", "Projecten"]],
  checklists: [["projecten", "Projecten"], ["komend", "Komend"]],
  checklist: [["checklists", "Alle checklists"], ["vandaag", "Vandaag"]],
  personen: [["afspraken", "Afspraken"], ["logboek", "Logboek"]],
  tijd: [["focus", "Focus"], ["stats", "Terugblik"], ["hobbyskills", "HobbySkills"]],
  focus: [["tijd", "Tijdsregistratie"], ["vandaag", "Vandaag"]],
  inbox: [["komend", "Komend"], ["projecten", "Projecten"], ["zoeken", "Zoeken"]],
  meldingen: [["vandaag", "Vandaag"], ["afspraken", "Afspraken"], ["komend", "Komend"]],
  persoonlijk: [["vandaag", "Vandaag"], ["hobbyskills", "HobbySkills"], ["gewoontes", "Gewoontes"]],
  filters: [["zoeken", "Zoeken"], ["komend", "Komend"]],
  zoeken: [["filters", "Slimme lijsten"], ["logboek", "Logboek"]],
  instellingen: [["ontwerp", "Ontwerp"], ["backup", "Back-up"], ["help", "Uitleg"]],
  ontwerp: [["instellingen", "Instellingen"], ["stats", "Terugblik"], ["vandaag", "Vandaag"]],
  backup: [["instellingen", "Instellingen"], ["help", "Uitleg"]],
  help: [["instellingen", "Instellingen"], ["backup", "Back-up"]]
};
const VERWANT_ICO = {
  vandaag: "vandaag", komend: "komend", kalender: "komend", dag: "komend", overzicht: "grafiek", stats: "grafiek", projecten: "map", project: "map",
  checklists: "lijst", checklist: "lijst", afspraken: "groep", afspraak: "groep", personen: "persoon", mindmap: "mindmap", hobbyskills: "hobby",
  gewoontes: "vuur", dagboek: "boek", logboek: "logboek", tijd: "tijd", focus: "doel", financieel: "portemonnee", werk: "koffer",
  gezondheid: "hart", roken: "blad", sidehustles: "raket", filters: "bliksem", zoeken: "zoek", instellingen: "instel", backup: "download",
  help: "vraag", ontwerp: "ster", persoonlijk: "persoon", inbox: "inbox", meldingen: "inbox", welkom: "vandaag", start: "plus"
};
function verwantHTML() {
  const l = (VERWANT[V.view] || []).filter(([v]) => v !== V.view);
  if (!l.length) return "";
  return `<nav class="verwant" aria-label="Verder naar"><div class="klein">Verder naar</div><div class="chiprij">${l.map(([v, n]) =>
    `<button class="keuze" data-act="ga" data-view="${v}">${ico(VERWANT_ICO[v] || "pijlr", "width:15px;height:15px")}${esc(n)}</button>`).join("")}</div></nav>`;
}
RT_NA.push(() => {
  if (V.view === "mindmap") return;
  const s = $("#scherm");
  if (!s || s.querySelector(":scope > .verwant")) return;
  const h = verwantHTML();
  if (h) s.insertAdjacentHTML("beforeend", h);
});

/* ---------- Meer: gegroepeerd in thema's ---------- */
vwMeer = function () {
  const G = [
    ["Plannen", [
      ["welkom", "vandaag", "Dagoverzicht", "Je dag in een paar zinnen"],
      ["overzicht", "grafiek", "Overzicht", "Week, maand en vooruitblik"],
      ["kalender", "komend", "Kalender", "Maandweergave en tijdlijn"],
      ["projecten", "map", "Projecten", "Indelen en overzicht"],
      ["checklists", "lijst", "Checklists", "Boodschappen, inpaklijst, sjablonen"],
      ["filters", "bliksem", "Slimme lijsten", "Opgeslagen filters"],
      ["zoeken", "zoek", "Zoeken", "Alles doorzoeken"]]],
    ["Doen en groeien", [
      ["hobbyskills", "hobby", "HobbySkills", "Hobby's en skills bijhouden"],
      ["gewoontes", "vuur", "Gewoontes", "Streaks en weekoverzicht"],
      ["gezondheid", "hart", "Gezondheid", "Eten, sport, water en gewicht"],
      ["roken", "blad", "Rookvrij", "Wat stoppen je oplevert"],
      ["dagboek", "boek", "Dagboek", "Stemming, energie, gedachten"],
      ["tijd", "tijd", "Tijdsregistratie", "Focustimer en uren"]]],
    ["Mensen, werk en geld", [
      ["afspraken", "groep", "Afspraken", "Voorbereiding, notities, uitkomst"],
      ["personen", "persoon", "Personen", "Wie hoort bij wat"],
      ["werk", "koffer", "Werk", "Meetings, plannen, reflectie"],
      ["sidehustles", "raket", "Side Hustle", "Ideeën, sprints en modellen"],
      ["financieel", "portemonnee", "Financieel", "Dagbudget, uitgaven, vaste lasten"]]],
    ["Terugkijken", [
      ["logboek", "logboek", "Logboek", "Alles wat je deed"],
      ["stats", "grafiek", "Terugblik", "Weekcijfers"]]],
    ["App", [
      ["instellingen", "instel", "Instellingen", "Weergave, bediening, privacy"],
      ["ontwerp", "ster", "Ontwerp", "Glas, diepte en beweging"],
      ["backup", "download", "Back-up", "Export, import, agenda"],
      ["help", "vraag", "Uitleg", "Installeren en beperkingen"]]]
  ];
  let h = `<button class="knop breed rand" style="margin:10px 0 2px" data-act="start-knop" data-soort="foto">${ico("camera")} Foto of bestand bewaren bij een taak</button>`;
  G.forEach(([t, l]) => {
    h += sectie(t) + `<div class="menu-grid">` + l.map(([v, i, n, d]) =>
      `<button class="menu-kaart" data-act="ga" data-view="${v}">${ico(i)}<span class="nm">${n}</span><span class="ds">${d}</span></button>`).join("") + `</div>`;
  });
  const tot = S.taken.length, af = S.taken.filter(t => t.af).length;
  h += `<div class="hr"></div><div class="klein" style="text-align:center">
    FutureMe · ${tot} taken (${af} afgerond) · ${S.afspraken.length} afspraken · ${S.gebeurtenissen.length} logregels<br>
    Alles staat alleen op dit toestel.</div>`;
  return h;
};

/* ---------- Startscherm (Nieuw): tegel HobbySkills naast Side Hustle ---------- */
/* (Dode omwikkeling van vwStart verwijderd: Vastleggen tekent sinds nieuw-lagen.js zijn eigen lagen. Kleine verbetering 6.) */

/* ---------- Persoonlijk: strook naar HobbySkills ---------- */
if (typeof vwPersoonlijk === "function") {
  const _p = vwPersoonlijk;
  vwPersoonlijk = function () {
    const h = _p();
    const strip = `<button class="startstrip" data-act="ga" data-view="hobbyskills">
      ${ico("hobby", "width:20px;height:20px;color:var(--muted)")}
      <span class="nm">HobbySkills: ${esc(hsKort())}</span>
      ${ico("pijlr", "width:16px;height:16px;color:var(--line2)")}</button>`;
    const i = h.indexOf('<button class="startstrip"');
    return i < 0 ? h + strip : h.slice(0, i) + strip + h.slice(i);
  };
}

/* ---------- Dagoverzicht: widget met de sessies van vandaag ---------- */
if (typeof vwWelkom === "function") {
  const _w = vwWelkom;
  vwWelkom = function () {
    const h = _w(), w = hsWidget();
    if (!w) return h;
    const merk = '<button class="knop breed primair wk-knop"', i = h.indexOf(merk);
    return i < 0 ? h + w : h.slice(0, i) + w + h.slice(i);
  };
}

/* ---------- Terugblik: minuten per hobby/skill deze week ---------- */
{
  const _st = vwStats;
  vwStats = function () {
    let h = _st();
    const alle = hsAlle();
    if (!alle.length) return h;
    const ws = weekStart(vandaagISO());
    const rijen = alle.map(x => ({ x, min: hsMinuten(hsSessiesWeek(x, ws)) })).filter(r => r.min || r.x.status === "bezig").sort((a, b) => b.min - a.min);
    const tot = rijen.reduce((a, r) => a + r.min, 0);
    h += sectie("HobbySkills deze week", hsDuur(tot), `<button class="actie" data-act="ga" data-view="hobbyskills">Alles</button>`);
    h += `<div class="card">` + (rijen.length ? rijen.map(r => `<button class="rijknop" data-act="ga" data-view="hobbyskill" data-param="${r.x.id}">
        <span style="font-size:20px;line-height:1">${r.x.emoji}</span><span class="nm">${esc(r.x.naam)}</span>
        <span class="rechts">${hsDuur(r.min)}${r.x.doelMin ? " / " + hsDuur(r.x.doelMin) : ""}${ico("pijlr", "width:16px;height:16px;color:var(--line2)")}</span></button>`).join("")
      : leeg("🎨", "Nog geen sessies deze week")) + `</div>`;
    return h;
  };
}

/* ---------- Zoeken: hobby's en skills doorzoeken ---------- */
{
  const _z = vwZoeken;
  vwZoeken = function () {
    let h = _z();
    if (!V.zoek.trim()) return h;
    const res = hsZoek(V.zoek);
    if (!res.length) return h;
    const ws = weekStart(vandaagISO());
    h += sectie("Hobby's en skills", res.length) + `<div class="hs-lijst">${res.slice(0, 10).map(x => hsKaart(x, ws)).join("")}</div>`;
    return h;
  };
}

/* ---------- Horizontale balken houden hun scrollpositie ----------
   Een tik op een filterchip tekent het scherm opnieuw; zonder dit sprong een
   horizontaal gescrolde balk (tijdlijnfilters, logboek, afspraken …) terug
   naar het begin. Alleen bij hertekenen op hetzelfde scherm. */
function hScrollSleutels(s) {
  const tel = {}, uit = [];
  s.querySelectorAll("*").forEach(el => {
    if (el.scrollWidth <= el.clientWidth + 1) return;
    const ov = getComputedStyle(el).overflowX;
    if (ov !== "auto" && ov !== "scroll") return;
    const k = el.tagName + "." + [...el.classList].filter(c => !c.startsWith("rt-")).join(".");
    tel[k] = (tel[k] || 0) + 1;
    uit.push([k + "#" + tel[k], el]);
  });
  return uit;
}
{
  const _t = teken;
  teken = function () {
    const s = $("#scherm"), zelfde = s && s.dataset.hsView === V.view + "|" + (V.param || "");
    const bewaard = zelfde ? hScrollSleutels(s).filter(([, el]) => el.scrollLeft > 0).map(([k, el]) => [k, el.scrollLeft]) : [];
    _t();
    if (!s) return;
    s.dataset.hsView = V.view + "|" + (V.param || "");
    if (!bewaard.length) return;
    const nu = new Map(hScrollSleutels(s));
    bewaard.forEach(([k, x]) => { const el = nu.get(k); if (el) el.scrollLeft = x; });
  };
}

/* ---------- Titel passend in de kop ---------- */
function titelPassend() {
  const t = $("#titel"), kop = $("#top");
  if (!t || !kop) return;
  const past = () => t.scrollWidth <= t.clientWidth + 1;
  t.style.fontSize = ""; t.classList.remove("tweeregels", "breek"); kop.classList.remove("krap");
  if (!t.textContent || past()) return;
  kop.classList.add("krap");
  if (past()) return;
  const basis = parseFloat(getComputedStyle(t).fontSize), min = Math.max(15, basis * .68);
  for (let px = basis - 1; px >= min; px--) { t.style.fontSize = px + "px"; if (past()) return; }
  // Twee regels: begin weer wat groter en krimp tot alles zichtbaar is (minimaal 14px).
  t.classList.add("tweeregels");
  // Eerst zonder woorden te breken (ook het langste woord moet passen), pas daarna midden in een woord.
  const pastTwee = () => t.scrollHeight <= t.clientHeight + 2 && t.scrollWidth <= t.clientWidth + 1;
  for (let px = Math.round(basis * .8); px >= 14; px--) { t.style.fontSize = px + "px"; if (pastTwee()) return; }
  t.classList.add("breek");
  for (let px = Math.round(basis * .8); px >= 14; px--) { t.style.fontSize = px + "px"; if (pastTwee()) return; }
}
{
  let wacht = 0;
  const plan = () => { cancelAnimationFrame(wacht); wacht = requestAnimationFrame(titelPassend); };
  const t = $("#titel");
  if (t) new MutationObserver(plan).observe(t, { childList: true, characterData: true, subtree: true });
  const b = $("#terug");
  if (b) new MutationObserver(plan).observe(b, { attributes: true, attributeFilter: ["class"] });
  window.addEventListener("resize", plan);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(plan);
}
