"use strict";
// === SECTIE 107: SAMENVOEGEN — ÉÉN PLEK PER VRAAG (besluit Kas 9 oktober 2026) ===
/* ==========================================================================
   Vier samenvoegingen, elk met het beste van beide:
   1. Eén Inbox: "Nog indelen" en "Van Nate" (was: Inbox en Nate's berichten).
   2. Planning met drie zoomstanden: Morgen · Week · Maand
      (was: Morgen in het kort, Planning/Komend, Kalender en Overzicht-vooruitblik).
   3. Terugkijken: Dag · Week
      (was: Dagboek, Logboek, Weekreview en Overzicht week/maand in cijfers).
   4. Vastlopen: Ik loop vast kent ook "Ik kan niet kiezen" (Keuzemachine), en
      "Onduidelijk" geeft bij een vage taak de suggesties van de werkwoordcheck.
   De oude namen blijven werken (links, chat, zoeken): ga() stuurt ze door.
   Niets verdwijnt uit je gegevens; Logboek en Cijfers blijven als detailscherm.
   ========================================================================== */

/* NATE-SAMEN-BEGIN */
/** Oude schermnaam → nieuwe plek, met de stand die erbij hoort. Onbekend: null (niets doen). */
function smDoorsturen(view, ovModus) {
  switch (view) {
    case "meldingen": return { view: "inbox", zet: { inboxTab: "nate" } };
    case "morgen": return { view: "planning", zet: { plZoom: "morgen" } };
    case "komend": return { view: "planning", zet: { plZoom: "week" } };
    case "kalender": return { view: "planning", zet: { plZoom: "maand" } };
    case "overzicht": return ovModus === "vooruit" ? { view: "planning", zet: { plZoom: "maand" } } : { view: "terugkijken", zet: { tkModus: "week" } };
    case "dagboek": return { view: "terugkijken", zet: { tkModus: "dag" } };
    case "weekreview": return { view: "terugkijken", zet: { tkModus: "week" } };
    default: return null;
  }
}
/** Een segment met knoppen; één tabstop is niet nodig, het zijn gewone schakelknoppen. */
function smSegment(naam, keuzes, actief) {
  return `<div class="sm-segment" role="group" aria-label="${naam}">${keuzes.map(([k, l, extra]) =>
    `<button type="button" data-sm="${naam}" data-k="${k}" aria-pressed="${actief === k}">${l}${extra ? ` <span class="sm-tel">${extra}</span>` : ""}</button>`).join("")}</div>`;
}
/* NATE-SAMEN-EINDE */

/* ---------- 107.0 Doorsturen ---------- */
{
  const _ga = ga;
  ga = function (view, param, terugStap) {
    const d = smDoorsturen(view, V.ovModus);
    if (d) { Object.assign(V, d.zet); return _ga.call(this, d.view, param, terugStap); }
    return _ga.apply(this, arguments);
  };
}
const SM_STAND = { inbox: "inboxTab", planning: "plZoom", terugkijken: "tkModus" };
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest("[data-sm]"); if (!b) return;
  e.preventDefault(); e.stopImmediatePropagation();
  V[SM_STAND[b.dataset.sm]] = b.dataset.k;
  if (b.dataset.sm === "planning" && b.dataset.k === "maand") V.kalDatum = V.kalDatum || vandaagISO();
  tril(4); teken();
  const terug = document.querySelector(`#scherm [data-sm="${b.dataset.sm}"][data-k="${b.dataset.k}"]`); if (terug) terug.focus({ preventScroll: true });
  const s = $("#scherm"); if (s) s.scrollTop = 0;
}, true);

/* ---------- 107.1 Eén Inbox ---------- */
{
  const _indelen = vwInbox, _nate = vwMeldingen;
  vwInbox = function () {
    const tab = V.inboxTab || "indelen", n = openTaken().filter(t => !t.projectId).length, nieuw = meldingenOngelezenAantal();
    return smSegment("inbox", [["indelen", "Nog indelen", n || ""], ["nate", "Van Nate", nieuw || ""]], tab)
      + `<div class="sm-inbox">${tab === "nate" ? _nate.apply(this, arguments) : _indelen.apply(this, arguments)}</div>`;
  };
  vwMeldingen = vwInbox;
  Object.defineProperty(KOPPEN, "inbox", { get: () => ["Inbox", () => (V.inboxTab || "indelen") === "nate" ? meldingenOnderschrift() : "Nog niet ingedeeld"], configurable: true, enumerable: true });
  // Een nieuw bericht terwijl je in de Inbox kijkt: meteen tonen (de basis keek naar "meldingen").
  if (typeof meldingMaak === "function") {
    const _maak = meldingMaak;
    meldingMaak = async function () { const r = await _maak.apply(this, arguments); if (V.view === "inbox" && V.inboxTab === "nate") teken(); return r; };
  }
}

/* ---------- 107.2 Planning: Morgen · Week · Maand ---------- */
{
  const _week = vwPlanning;
  // De chips Kalender en Overzicht zijn nu de zoomstand Maand.
  for (let i = NV_PLANNING.length - 1; i >= 0; i--) if (["kalender", "overzicht"].includes(NV_PLANNING[i][0])) NV_PLANNING.splice(i, 1);
  vwPlanning = function () {
    const z = V.plZoom || "week";
    let h = smSegment("planning", [["morgen", "Morgen"], ["week", "Week"], ["maand", "Maand"]], z);
    if (z === "morgen") h += vwMorgen();
    else if (z === "maand") h += vwKalender() + sectie("Komende 14 dagen") + ovVooruit();
    else h += _week.apply(this, arguments);
    return h;
  };
  const zoomKop = { morgen: () => langDatumLabel(plusDagen(vandaagISO(), 1)), week: () => "week " + weekNummer(vandaagISO()),
    maand: () => { const d = parseISO(V.kalDatum || vandaagISO()); return MAANDNAMEN[d.getMonth()] + " " + d.getFullYear(); } };
  Object.defineProperty(KOPPEN, "planning", { get: () => ["Planning", () => zoomKop[V.plZoom || "week"]()], configurable: true, enumerable: true });
}

/* ---------- 107.3 Terugkijken: Dag · Week ---------- */
function smLogKort(dagen) {
  const v = vandaagISO(), van = plusDagen(v, -(dagen - 1));
  const items = S.gebeurtenissen.filter(g => (typeof werkOk !== "function" || werkOk(g)) && (g.datum || (g.ts || "").slice(0, 10)) >= van)
    .sort((a, b) => a.ts < b.ts ? 1 : -1).slice(0, 30);
  if (!items.length) return `<div class="card card-pad klein">Nog niets gelogd de laatste dagen.</div>`;
  let dag = "", h = `<div class="card card-pad sm-log">`;
  for (const g of items) {
    const d = g.datum || g.ts.slice(0, 10);
    if (d !== dag) { dag = d; h += `<p class="sm-logdag">${esc(datumLabel(d, true))}</p>`; }
    h += `<p class="sm-logregel"><span class="mono">${esc((g.ts || "").slice(11, 16))}</span> ${esc(g.tekst)}</p>`;
  }
  return h + `</div>`;
}
function vwTerugkijken() {
  const m = V.tkModus || "dag";
  let h = smSegment("terugkijken", [["dag", "Dag"], ["week", "Week"]], m) + `<div class="sm-tk">`;
  if (m === "week") {
    h += vwWeekreview();
    h += sectie("Je week in cijfers") + ovWeek().replace(/<button class="knop rand" data-act="ov" data-m="vooruit">[\s\S]*?<\/button>/, "");
  } else {
    // Eerst vandaag (stemming en notitie), dan wat je deed, dan de eerdere notities.
    const db = vwDagboek(), log = sectie("Wat je deed") + smLogKort(3) + `<button class="knop breed rand sm-heel" data-act="ga" data-view="logboek">${ico("logboek")} Heel logboek</button>`;
    const i = db.indexOf('data-act="dagboek-nu"'), j = i < 0 ? -1 : db.indexOf("</div>", db.indexOf("</button>", i));
    h += j < 0 ? db + log : db.slice(0, j + 6) + log + db.slice(j + 6);
  }
  return h + `</div>`;
}
Object.defineProperty(KOPPEN, "terugkijken", { get: () => ["Terugkijken", () => (V.tkModus || "dag") === "week" ? "Je week, en één ding om te proberen" : "Hoe was je dag?"], configurable: true, enumerable: true });

/* ---------- 107.4 Vastlopen: één ingang ---------- */
IV_OORZAKEN.push({ id: "kiezen", label: "Kan niet kiezen", sub: "Twijfel tussen opties",
  zin: "Laat de Keuzemachine meedenken, met een tijdsbudget.", knop: "Naar de Keuzemachine", actie: "keuze",
  waarom: "Twijfel kost vaak meer dan een minder goede keuze. Een vast tijdsbudget en een eerlijke vergelijking maken kiezen lichter." });
{
  const _route = ivRoute;
  ivRoute = function (t, o) {
    // Onduidelijk bij een vage taak: de suggesties van de werkwoordcheck (passend bij de titel).
    if (o && o.id === "onduidelijk" && typeof wwVaag === "function" && wwVaag(t.titel))
      o = Object.assign({}, o, { voorbeelden: wwSuggesties(t.titel).concat(o.voorbeelden).filter((x, i, a) => a.indexOf(x) === i).slice(0, 4) });
    return _route.call(this, t, o);
  };
  const _doe = ivDoe;
  ivDoe = async function (t, o, stap, tekst) {
    if (stap && stap.actie === "keuze") {
      await ivLogVoeg(t.id, o.id, "keuze"); bladSluit();
      if (typeof kmProfiel !== "function" || !kmProfiel()) { ga("keuze"); toast("Doe eerst de korte uitsteltest"); return; }
      const bestaand = S.km_dilemmas.find(d => d.bron && d.bron.module === "taak" && d.bron.id === t.id && d.status !== "besloten");
      if (bestaand) { ga("keuzedilemma", bestaand.id); return; }
      const d = kmNieuwDilemma({ a: { titel: String(t.titel).slice(0, 80), notitie: "" }, b: { titel: "", notitie: "" },
        context: { inzet: "klein", omkeerbaar: "ja", deadline: t.datum || null, zichtbaar: false }, bron: { module: "taak", id: t.id } });
      await kmBewaarDilemma(d); ga("keuzedilemma", d.id);
      return;
    }
    // Een eerste handeling via Ik loop vast telt ook als antwoord op de werkwoordcheck.
    if (stap && stap.actie === "stap" && String(tekst || "").trim()) t.wwGevraagd = true;
    return _doe.apply(this, arguments);
  };
}

/* ---------- 107.5 Navigatie: één regel per plek ---------- */
{
  const ook = NV_MEER[1][1], weg = ["meldingen", "logboek", "stats", "weekreview", "overzicht"];
  for (let i = ook.length - 1; i >= 0; i--) if (weg.includes(ook[i][0])) ook.splice(i, 1);
  const inbox = ook.find(r => r[0] === "inbox"); if (inbox) inbox[3] = "Nog indelen en berichten van Nate";
  ook.splice(0, 0, ["terugkijken", "Terugkijken", "logboek", "Dagboek, logboek en je week"]);
  // In Ruimtes wordt Dagboek: Terugkijken (zelfde plek in Lichaam en rust).
  const db = NV_RUIMTES.find(r => r.view === "dagboek");
  if (db) Object.assign(db, { naam: "Terugkijken", uitleg: "Dagboek, logboek en je week" });
}
