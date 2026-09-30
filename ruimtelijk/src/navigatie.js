"use strict";
// === SECTIE 88: NAVIGATIE — ONDERBALK, MEER IN DE KOP, PLANNING EN RUIMTES ===
/* ==========================================================================
   Stap 5, besluit 1. Onderin vijf vaste plekken: Mijn dag · Planning ·
   + Vastleggen · Mindmap · Ruimtes. "Meer" (Voortgang, Profiel, Instellingen,
   Gegevens, Help) zit in de kop, naast Zoeken en de knop voor Nate's berichten.

   Alles wat eerder een tab was (Komend, Afspraken, Meer) blijft bereikbaar:
   Komend is de kern van Planning, Afspraken staat in Planning en in Ruimtes,
   Meer zit in de kop. Het routeoverzicht staat in docs/routeoverzicht.md.

   Terug werkt zoals altijd (V.stapel); nieuw is dat de scrollpositie
   terugkomt: per tab, en bij Terug naar een vorig scherm.

   Ook hier: "Gedachte naar de mindmap" bovenaan + Vastleggen (besluit 3).
   ========================================================================== */

/* ---------- 88.1 De onderbalk ---------- */
const NV_TABS = [
  ["vandaag", "Mijn dag", "vandaag"], ["planning", "Planning", "komend"], ["start", null, "plus"],
  ["mindmap", "Mindmap", "mindmap"], ["ruimtes", "Ruimtes", "map"]
];
// TABS is een vaste lijst in de basis; we vullen hem opnieuw (welkom blijft een tab zonder knop).
TABS.length = 0; TABS.push("welkom", "vandaag", "planning", "start", "mindmap", "ruimtes");
VASTLEG_VIEWS.push("planning");
{
  const nav = $("#tabs");
  if (nav) nav.innerHTML = NV_TABS.map(([tab, naam, ico]) => naam
    ? `<button data-tab="${tab}"><svg><use href="#i-${ico}"/></svg><span>${naam}</span></button>`
    : `<button class="tab-plus" data-tab="${tab}" aria-label="Vastleggen"><svg><use href="#i-plus"/></svg></button>`).join("");
}
// Meer in de kop: de instellingenknop wordt de Meer-knop (Instellingen staat in Meer).
{
  const k = $("#instelknop");
  if (k) { k.setAttribute("aria-label", "Meer"); k.innerHTML = `<svg><use href="#i-meer"/></svg>`; k.onclick = () => ga("meer"); }
}

/* ---------- 88.2 Planning: de week, met de planhulpen erboven ---------- */
const NV_PLANNING = [["kalender", "Kalender", "komend"], ["overzicht", "Overzicht", "grafiek"], ["afspraken", "Afspraken", "groep"], ["projecten", "Projecten", "map"], ["checklists", "Checklists", "lijst"], ["filters", "Slimme lijsten", "bliksem"]];
function vwPlanning() {
  // In .nv-planning krijgen de bestaande dagknoppen van Komend een tikvlak van 44 px.
  return `<div class="nv-planning"><nav class="nv-chips" aria-label="Planhulpen">${NV_PLANNING.map(([v, n, i]) => `<button class="nv-chip" data-act="ga" data-view="${v}">${ico(i, "width:16px;height:16px")}${n}</button>`).join("")}</nav>${vwKomend()}</div>`;
}
Object.defineProperty(KOPPEN, "planning", { get: () => ["Planning", () => "week " + weekNummer(vandaagISO())], configurable: true, enumerable: true });

/* ---------- 88.3 Ruimtes: elke module als een kamer ---------- */
const NV_RUIMTES = [
  { view: "persoonlijk", naam: "Persoonlijk", ico: "check", uitleg: "Taken, afspraken en alles er tussenin" },
  { view: "werk", naam: "Werk", ico: "koffer", uitleg: "Meetings, plannen, reflectie", telling: () => typeof werkTelling === "function" ? werkTelling() : "" },
  { view: "gezondheid", naam: "Gezondheid", ico: "hart", uitleg: "Eten, sport, water en gewicht", telling: () => typeof vsTelling === "function" ? vsTelling() : "" },
  { view: "financieel", naam: "Financieel", ico: "portemonnee", uitleg: "Dagbudget, uitgaven en incasso's", telling: () => typeof geldTelling === "function" ? geldTelling() : "" },
  { view: "huishouden", naam: "Huishouden", ico: "bezem", uitleg: "Eén klus tegelijk" },
  { view: "sidehustles", naam: "Side Hustle", ico: "raket", uitleg: "Ideeën, sprints en modellen", telling: () => typeof shTelling === "function" ? shTelling() : "" },
  { view: "hobbyskills", naam: "HobbySkills", ico: "hobby", uitleg: "Hobby's en skills bijhouden" },
  { view: "anker", naam: "Anker", ico: "anker", uitleg: "Even landen" },
  { view: "gewoontes", naam: "Gewoontes", ico: "vuur", uitleg: "Streaks en weekoverzicht" },
  { view: "dagboek", naam: "Dagboek", ico: "boek", uitleg: "Stemming, energie, gedachten" },
  { view: "lijstjes", naam: "Lijstjes", ico: "lijst", uitleg: "Films, series, boeken en meer" },
  { view: "wishlist", naam: "Wishlist", ico: "ster", uitleg: "Wat je wilt kopen, met koopcheck" },
  { view: "keuze", naam: "Keuzemachine", ico: "keuze", uitleg: "Kiezen zonder uitstel" },
  { view: "personen", naam: "Personen", ico: "persoon", uitleg: "Wie hoort bij wat" },
  { view: "roken", naam: "Rookvrij", ico: "blad", uitleg: "Wat stoppen je oplevert" },
  { view: "tijd", naam: "Tijdsregistratie", ico: "tijd", uitleg: "Focustimer en uren" }
];
function vwRuimtes() {
  return `<div class="nv-kamers">${NV_RUIMTES.map(r => { const t = r.telling ? r.telling() : ""; return `<button class="card nv-kamer" data-act="ga" data-view="${r.view}">
    <span class="nv-kamer-ico" aria-hidden="true">${ico(r.ico)}</span><span class="nv-kamer-tekst"><b>${esc(r.naam)}</b><small>${esc(r.uitleg)}</small></span>${t ? `<span class="nv-telling">${esc(String(t))}</span>` : ""}</button>`; }).join("")}</div>`;
}
Object.defineProperty(KOPPEN, "ruimtes", { get: () => ["Ruimtes", () => "Elke module een eigen plek"], configurable: true, enumerable: true });

/* ---------- 88.4 Meer: in de kop, kort en compleet ----------
   Bovenaan wat besluit 1 noemt; daaronder "Ook" met alles wat niet in een tab,
   Planning of Ruimtes zit, zodat elk scherm bereikbaar blijft. */
const NV_MEER = [
  ["Meer", [["vg", "Voortgang", "doel", "Al je vooruitgang op één plek"], ["profiel", "Profiel", "persoon", "Wie je bent en wat bij je past"], ["instellingen", "Instellingen", "instel", "Maak de app van jou"], ["backup", "Gegevens", "download", "Back-up, exporteren en herstellen"], ["help", "Help", "vraag", "Installeren en gebruik"]]],
  ["Ook", [["welkom", "Dagoverzicht", "vandaag", "Je dag in een paar zinnen"], ["overzicht", "Overzicht", "grafiek", "Week, maand en vooruitblik"], ["logboek", "Logboek", "logboek", "Alles wat je deed"], ["stats", "Terugblik", "grafiek", "Deze week in cijfers"], ["inbox", "Inbox", "inbox", "Nog niet ingedeeld"], ["meldingen", "Nate’s berichten", "inbox", "Alle berichten en herinneringen"], ["kennismaking", "Kennismaken met Nate", "vraag", "Vragen, profiel en tips"], ["focus", "Focustimer", "doel", "Eén ding tegelijk"], ["ontwerp", "Ontwerp", "instel", "Beweging, kleur en lettertype"]]]
];
vwMeer = function () {
  return NV_MEER.map(([kop, rijen]) => sectie(kop) + `<div class="card">${rijen.map(([v, n, i, u]) => `<button class="rijknop nv-rij" ${v === "vg" ? 'data-act="vg-open"' : `data-act="ga" data-view="${v}"`}>
    ${ico(i, "width:20px;height:20px;color:var(--accent)")}<span class="nm"><b>${esc(n)}</b><small>${esc(u)}</small></span>${ico("pijlr", "width:16px;height:16px;color:var(--line2)")}</button>`).join("")}</div>`).join("");
};

/* ---------- 88.5 Scrollpositie: per tab, en bij Terug ---------- */
{
  const _ga = ga, _terug = terug;
  V.nvScroll = {};
  ga = function (view, param, terugStap) {
    const s = $("#scherm"), top = s ? s.scrollTop : 0, vorige = V.view, diepte = V.stapel.length;
    const r = _ga.apply(this, arguments);
    // Basis pusht {view, param}; de scrollpositie van het verlaten scherm komt erbij.
    if (!terugStap && V.stapel.length > diepte) V.stapel[V.stapel.length - 1].scroll = top;
    if (TABS.includes(vorige) && vorige !== V.view) V.nvScroll[vorige] = top;
    if (TABS.includes(V.view) && V.view !== vorige && V.nvScroll[V.view] && s) s.scrollTop = V.nvScroll[V.view];
    return r;
  };
  terug = function () {
    const bovenste = V.stapel[V.stapel.length - 1], top = bovenste ? bovenste.scroll : null;
    const r = _terug.apply(this, arguments);
    if (top != null && $("#scherm")) $("#scherm").scrollTop = top;
    return r;
  };
}

/* ---------- 88.6 Gedachte naar de mindmap (besluit 3) ----------
   Eén regel bovenaan + Vastleggen. Landt in de tak "Losse gedachten" van je
   huidige mindmap; is er nog geen mindmap, dan maakt Nate er een. */
const NV_TAK = "Losse gedachten";
async function nvGedachte(tekst) {
  let mm = mmHuidige();
  if (!mm) mm = await mmNieuw("Mijn mindmap");
  const root = mm.nodes.find(n => n.id === mm.rootId);
  let tak = mm.nodes.find(n => n.parentId === root.id && n.tekst === NV_TAK);
  if (!tak) { tak = mmNode({ parentId: root.id, tekst: NV_TAK, x: -190, y: 200, kleur: MM_KLEUREN[5] }); mm.nodes.push(tak); }
  const n = mm.nodes.filter(x => x.parentId === tak.id).length;
  mm.nodes.push(mmNode({ parentId: tak.id, tekst, x: tak.x - 60, y: tak.y + 70 + n * 52, kleur: tak.kleur }));
  mm.updatedAt = Date.now();
  await bewaar("mm_mindmaps", mm);
  if (typeof logGebeurtenis === "function") await logGebeurtenis("notitie", "Gedachte naar de mindmap: " + tekst, mm.id);
  return mm;
}
function nvGedachteHTML() {
  return `<form class="nv-gedachte" autocomplete="off"><label class="labeltekst" for="nv-gedachte">Gedachte naar de mindmap</label>
    <div class="nv-gedachte-rij"><input class="invoer" id="nv-gedachte" maxlength="140" placeholder="Eén regel is genoeg" enterkeyhint="send">
    <button class="knop primair" type="submit" aria-label="Naar de mindmap">${ico("mindmap")}</button></div></form>`;
}
{
  const _s = vwStart;
  vwStart = function () { return ((V.nwPad || []).length ? "" : nvGedachteHTML()) + _s.apply(this, arguments); };
}
document.addEventListener("submit", async e => {
  const f = e.target.closest && e.target.closest(".nv-gedachte"); if (!f) return;
  e.preventDefault();
  const veld = f.querySelector("#nv-gedachte"), tekst = veld.value.trim(); if (!tekst) return;
  const mm = await nvGedachte(tekst);
  veld.value = ""; tril(6);
  toast(`Staat in je mindmap, onder ${NV_TAK}`, "Bekijken", () => ga("mindmap", mm.id));
});
