"use strict";
// === SECTIE 74: VOORTGANG – GEGEVENS, BRONNEN EN REKENWERK ===
/* ==========================================================================
   Voortgang: één overkoepelende plek voor al je vooruitgang.
   Deze sectie bevat alleen gegevens en rekenwerk; de omgeving zelf staat in
   sectie 75.

   Drie soorten voortgang komen samen:
   1. Automatisch uit de app: alles wat je al bijhoudt (taken, omzet, uren,
      sport, gewicht, rookvrij, gewoontes, Anker, hobby's …). Die bronnen
      lezen we alleen; er wordt niets dubbel opgeslagen.
   2. Eigen meters: alles wat de app nog niet kent (bladzijden gelezen,
      stappen, slaap, stemming, pushups …). Je logt zelf een waarde.
   3. Doelen: gekoppeld aan een automatische bron, een eigen meter of een
      stappenplan. Met start, doel, deadline en tempo.
   Mijlpalen worden berekend uit de bronnen (100 taken, € 1.000 omzet,
   30 dagen rookvrij …) en uit behaalde doelen.

   Opslag (DB_VERSIE 11): vg_doelen, vg_meters, vg_metingen (index op meterId
   en datum) en vg_terugblik. Bestaande stores blijven ongemoeid.
   ========================================================================== */

/* ---------- 74.1 Opslag ---------- */
WINKELS.vg_doelen = "id";
WINKELS.vg_meters = "id";
WINKELS.vg_metingen = "id";
WINKELS.vg_terugblik = "id";
DB_OPTIES.vg_metingen = { keyPath: "id", indexen: [["meterId", "meterId"], ["datum", "datum"]] };
S.vg_doelen = S.vg_doelen || [];
S.vg_meters = S.vg_meters || [];
S.vg_metingen = S.vg_metingen || [];
S.vg_terugblik = S.vg_terugblik || [];

/* ---------- 74.2 Levensgebieden ---------- */
const VG_GEBIEDEN = [
  { id: "gezondheid", naam: "Gezondheid", icoon: "hart" },
  { id: "geld", naam: "Geld", icoon: "euro" },
  { id: "werk", naam: "Werk", icoon: "koffer" },
  { id: "ondernemen", naam: "Ondernemen", icoon: "raket" },
  { id: "groei", naam: "Leren en hobby's", icoon: "hobby" },
  { id: "rust", naam: "Rust en gewoontes", icoon: "anker" },
  { id: "thuis", naam: "Thuis en taken", icoon: "huis" }
];
// Iconen als SVG (geen emoji in de bediening); g.ico levert de opmaak.
VG_GEBIEDEN.forEach(g => Object.defineProperty(g, "ico", { get: () => `<span class="vg-g">${ico(g.icoon)}</span>`, enumerable: false }));
const vgGebied = id => VG_GEBIEDEN.find(g => g.id === id) || VG_GEBIEDEN[VG_GEBIEDEN.length - 1];

/* ---------- 74.3 Automatische bronnen uit de app ----------
   We hergebruiken de metingen van het Nieuw-overzicht (sectie 67) en vullen
   aan met Anker en rookvrij. Elke bron: id, naam, eenheid, agg (som|gem),
   gebied, data() → [{d, v}], richting (omhoog|omlaag|neutraal). */
const VG_THEMA_GEBIED = { sh: "ondernemen", taken: "thuis", afspraken: "thuis", wishlist: "geld", gezondheid: "gezondheid", gewoontes: "rust", geld: "geld", hobby: "groei", werk: "werk" };
const VG_OMLAAG = new Set(["sh.kosten", "geld.uitgaven", "wishlist.gekocht"]);
const VG_NEUTRAAL = new Set(["gezondheid.kcal", "gezondheid.gewicht", "afspraken.aantal", "taken.nieuw", "wishlist.nieuw", "werk.afspraken"]);
function vgAutoBronnen() {
  const uit = [];
  if (typeof nwoMetingen === "function") {
    for (const [thema, gebied] of Object.entries(VG_THEMA_GEBIED)) {
      let ms = [];
      try { ms = nwoMetingen(thema); } catch (e) { ms = []; }
      ms.filter(m => m.soort === "tijd").forEach(m => {
        const id = thema + "." + m.id;
        uit.push({ id, naam: m.naam, eenheid: m.eenheid, agg: m.agg, gebied, data: () => m.data(""),
          richting: VG_OMLAAG.has(id) ? "omlaag" : VG_NEUTRAAL.has(id) ? "neutraal" : "omhoog", voorkeur: m.voorkeur });
      });
    }
  }
  const mf = () => (S.mf_sessies || []).filter(s => s.datum);
  uit.push({ id: "anker.momenten", naam: "Anker-momenten", eenheid: "aantal", agg: "som", gebied: "rust", richting: "omhoog", data: () => mf().map(s => ({ d: String(s.datum).slice(0, 10), v: 1 })) });
  uit.push({ id: "anker.minuten", naam: "Minuten met Anker", eenheid: "min", agg: "som", gebied: "rust", richting: "omhoog", data: () => mf().map(s => ({ d: String(s.datum).slice(0, 10), v: (s.duurSec || 0) / 60 })) });
  const rk = typeof rookCijfers === "function" ? rookCijfers() : null;
  if (rk) {
    uit.push({ id: "rook.dagen", naam: "Dagen rookvrij", eenheid: "aantal", agg: "som", gebied: "gezondheid", richting: "omhoog", telwoord: true,
      data: () => { const out = [], v = vandaagISO(); for (let d = rk.stop.slice(0, 10); d <= v && out.length < 20000; d = plusDagen(d, 1)) out.push({ d, v: d === v ? 0 : 1 }); return out; } });
  }
  return uit;
}
function vgBron(id) {
  if (String(id).startsWith("meter:")) return vgMeterBron(vind("vg_meters", id.slice(6)));
  return vgAutoBronnen().find(b => b.id === id) || null;
}

/* ---------- 74.4 Eigen meters ----------
   type: teller (+1), getal (waarde, bv. bladzijden of kg), janee (gedaan?),
         schaal (1–10, bv. slaap of energie), duur (minuten). */
const VG_METERTYPES = {
  teller: { naam: "Teller", uitleg: "Tik +1 als het gebeurt", agg: "som" },
  getal: { naam: "Getal", uitleg: "Een waarde, bv. bladzijden of km", agg: "som" },
  stand: { naam: "Stand", uitleg: "De laatste waarde telt, bv. gewicht of spaarsaldo", agg: "gem" },
  janee: { naam: "Ja of nee", uitleg: "Heb je het vandaag gedaan?", agg: "som" },
  schaal: { naam: "Schaal 1–10", uitleg: "Hoe was het? Bv. slaap of energie", agg: "gem" },
  duur: { naam: "Tijd", uitleg: "Minuten besteed", agg: "som" }
};
/* Grafieken uit sectie 67 kennen alleen vaste eenheden; eigen eenheden melden we daar aan. */
function vgEenheid(meter) {
  if (meter.type === "duur") return "min";
  if (meter.type === "schaal") { NWO_FMT.vg10 = NWO_FMT.vg10 || (x => nwoGetal(x, 1) + " / 10"); nwoKort.vg10 = nwoKort.vg10 || (x => nwoGetal(x, 1)); return "vg10"; }
  const e = (meter.eenheid || "").trim(), k = "vg:" + e;
  if (!NWO_FMT[k]) { NWO_FMT[k] = x => nwoGetal(x, 1) + (e ? " " + e : ""); nwoKort[k] = x => nwoGetal(x, 1); }
  return k;
}
function vgMeterBron(meter) {
  if (!meter) return null;
  return { id: "meter:" + meter.id, naam: meter.naam, eenheid: vgEenheid(meter), agg: (VG_METERTYPES[meter.type] || VG_METERTYPES.getal).agg,
    gebied: meter.gebied, richting: meter.richting || "omhoog", eigen: true, meter,
    data: () => S.vg_metingen.filter(x => x.meterId === meter.id).map(x => ({ d: x.datum, v: +x.waarde || 0 })) };
}
const vgMetingenVan = id => S.vg_metingen.filter(x => x.meterId === id).sort((a, b) => (b.datum + (b.ts || "")).localeCompare(a.datum + (a.ts || "")));

/* ---------- 74.5 Waarden en periodes ---------- */
const VG_PERIODES = [["totaal", "Alles bij elkaar"], ["jaar", "Dit jaar"], ["maand", "Deze maand"], ["week", "Deze week"], ["laatste", "Laatste waarde"]];
function vgPeriodeVan(periode, v) {
  v = v || vandaagISO();
  if (periode === "week") return weekStart(v);
  if (periode === "maand") return v.slice(0, 7) + "-01";
  if (periode === "jaar") return v.slice(0, 4) + "-01-01";
  return "0000-00-00";
}
/* De huidige waarde van een bron in een periode. Gemiddelde-bronnen (zoals
   gewicht of een schaal) nemen de laatste waarde bij "totaal" en "laatste". */
function vgWaarde(bron, periode) {
  if (!bron) return 0;
  const v = vandaagISO(), pts = bron.data().filter(p => p.d && p.d <= v);
  if (periode === "laatste" || (bron.agg === "gem" && periode === "totaal")) {
    if (!pts.length) return null;
    return pts.reduce((a, p) => (p.d >= a.d ? p : a)).v;
  }
  const van = vgPeriodeVan(periode, v), l = pts.filter(p => p.d >= van);
  if (bron.agg === "gem") return l.length ? l.reduce((a, p) => a + p.v, 0) / l.length : null;
  return l.reduce((a, p) => a + p.v, 0);
}
const vgFmt = (bron, x) => x == null ? "—" : (NWO_FMT[bron && bron.eenheid] || NWO_FMT.aantal)(x);
/* Som in een datumvenster (voor "deze week tegenover vorige week"). */
function vgSomTussen(bron, van, tot) {
  const l = bron.data().filter(p => p.d >= van && p.d <= tot);
  if (bron.agg === "gem") return l.length ? l.reduce((a, p) => a + p.v, 0) / l.length : null;
  return l.reduce((a, p) => a + p.v, 0);
}

/* ---------- 74.6 Doelen ----------
   soort: "bron" (automatisch of eigen meter) of "stappen" (stappenplan).
   Voortgang = (nu − start) / (doel − start), dus ook "omlaag" werkt
   (bv. gewicht van 90 naar 80). */
function vgDoelStand(d) {
  if (d.soort === "stappen") {
    const st = d.stappen || [], af = st.filter(s => s.af).length;
    return { nu: af, start: 0, doel: st.length, p: st.length ? af / st.length : 0, tekst: `${af} van ${st.length} stappen` };
  }
  const bron = vgBron(d.bron);
  const nu = vgWaarde(bron, d.periode || "totaal");
  const start = +d.start || 0, doel = +d.doel || 0;
  let p = doel === start ? (nu != null && (doel >= start ? nu >= doel : nu <= doel) ? 1 : 0) : ((nu == null ? start : nu) - start) / (doel - start);
  p = Math.max(0, Math.min(1, p));
  return { nu, start, doel, p, bron, tekst: `${vgFmt(bron, nu)} van ${vgFmt(bron, doel)}` };
}
/* Tempo: ligt je voortgang voor of achter op een rechte lijn naar de deadline? */
function vgTempo(d, stand) {
  stand = stand || vgDoelStand(d);
  if (d.status === "behaald" || stand.p >= 1) return { code: "behaald", tekst: "Behaald", ico: "✓" };
  if (!d.deadline) return { code: "geen", tekst: "Geen deadline", ico: "" };
  const v = vandaagISO(), begin = (d.gemaakt || v).slice(0, 10);
  if (v > d.deadline) return { code: "verlopen", tekst: "Deadline voorbij", ico: "!" };
  const totaal = Math.max(1, dagVerschil(d.deadline, begin)), verstreken = Math.max(0, dagVerschil(v, begin));
  const verwacht = verstreken / totaal, rest = dagVerschil(d.deadline, v);
  const nog = `nog ${rest} ${rest === 1 ? "dag" : "dagen"}`;
  if (stand.p >= verwacht - .05) return { code: "op", tekst: "Op schema · " + nog, ico: "↗", verwacht };
  if (stand.p >= verwacht - .2) return { code: "iets", tekst: "Iets achter · " + nog, ico: "→", verwacht };
  return { code: "achter", tekst: "Achter op schema · " + nog, ico: "↘", verwacht };
}
const vgActieveDoelen = () => S.vg_doelen.filter(d => (d.status || "actief") === "actief");
/* Behaald? Dan één keer vastleggen, loggen en melden. Wordt na elke wijziging aangeroepen. */
async function vgControleerDoelen() {
  const nieuw = [];
  for (const d of vgActieveDoelen()) {
    const st = vgDoelStand(d);
    if (st.p >= 1 && (d.soort === "stappen" ? st.doel > 0 : true) && (d.soort !== "bron" || st.nu != null)) {
      const x = Object.assign({}, d, { status: "behaald", behaaldOp: new Date().toISOString() });
      await bewaar("vg_doelen", x);
      if (typeof logGebeurtenis === "function") await logGebeurtenis("voortgang", `Doel behaald: ${d.naam}`, d.id);
      nieuw.push(x);
    }
  }
  return nieuw;
}

/* ---------- 74.7 Mijlpalen ----------
   Berekend, niet opgeslagen: de datum is het moment waarop het opgetelde
   totaal een drempel passeerde. Zo kloppen ze ook na import of wijziging. */
const VG_DREMPELS = {
  aantal: [1, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
  eur: [100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000],
  uur: [1, 10, 25, 50, 100, 250, 500, 1000, 2500],
  min: [60, 300, 600, 1500, 3000, 6000, 15000, 30000]
};
const vgEuro = n => "€ " + nwoGetal(n);
const VG_MP_TEKST = {
  "taken.af": n => `${nwoGetal(n)} ${n === 1 ? "taak" : "taken"} afgerond`,
  "werk.af": n => `${nwoGetal(n)} ${n === 1 ? "werktaak" : "werktaken"} afgerond`,
  "sh.omzet": n => `${vgEuro(n)} omzet met side hustles`,
  "sh.uren": n => `${nwoGetal(n)} uur aan side hustles gewerkt`,
  "sh.ideeen": n => `${nwoGetal(n)} ${n === 1 ? "idee" : "ideeën"} in de ideeënbank`,
  "gezondheid.sport": n => `${nwoGetal(n)} ${n === 1 ? "sportsessie" : "sportsessies"}`,
  "gezondheid.bespaard": n => `${vgEuro(n)} bespaard door niet te roken`,
  "gezondheid.niet": n => `${nwoGetal(n)} sigaretten niet gerookt`,
  "gewoontes.volbracht": n => `${nwoGetal(n)} keer een gewoonte volbracht`,
  "hobby.minuten": n => `${nwoGetal(n / 60)} uur geoefend aan hobby's en skills`,
  "hobby.sessies": n => `${nwoGetal(n)} ${n === 1 ? "oefensessie" : "oefensessies"}`,
  "anker.momenten": n => `${nwoGetal(n)} ${n === 1 ? "Anker-moment" : "Anker-momenten"}`
};
const VG_ROOK_DAGEN = [1, 3, 7, 14, 30, 60, 90, 180, 365, 730, 1095];
const VG_KILO = [1, 2.5, 5, 7.5, 10, 15, 20, 25];
function vgDrempelsVoor(bron) {
  if (bron.id === "gezondheid.niet") return [100, 500, 1000, 2500, 5000, 10000, 20000];
  return VG_DREMPELS[bron.eenheid] || null;
}
function vgMijlpalen() {
  const uit = [], v = vandaagISO(), bronnen = vgAutoBronnen();
  for (const b of bronnen) {
    const tekst = VG_MP_TEKST[b.id], dr = tekst && vgDrempelsVoor(b);
    if (!dr) continue;
    const pts = b.data().filter(p => p.d && p.d <= v).sort((x, y) => x.d.localeCompare(y.d));
    let som = 0, i = 0;
    for (const p of pts) {
      som += p.v;
      while (i < dr.length && som >= dr[i] - 1e-9) { uit.push({ id: `${b.id}@${dr[i]}`, datum: p.d, titel: tekst(dr[i]), gebied: b.gebied, bron: b.id }); i++; }
    }
  }
  const rk = typeof rookCijfers === "function" ? rookCijfers() : null;
  if (rk) VG_ROOK_DAGEN.forEach(n => { const d = plusDagen(rk.stop.slice(0, 10), n); if (d <= v) uit.push({ id: "rook@" + n, datum: d, titel: `${n} ${n === 1 ? "dag" : "dagen"} rookvrij`, gebied: "gezondheid", bron: "rook.dagen" }); });
  const gw = (S.vs_gewicht || []).filter(g => g.datum && g.kg).sort((a, b) => a.datum.localeCompare(b.datum));
  if (gw.length > 1) {
    const eerste = +gw[0].kg;
    let i = 0;
    for (const g of gw) while (i < VG_KILO.length && eerste - +g.kg >= VG_KILO[i] - 1e-9) { uit.push({ id: "kg@" + VG_KILO[i], datum: g.datum, titel: `${nwoGetal(VG_KILO[i], 1)} kg lichter dan je eerste meting`, gebied: "gezondheid", bron: "gezondheid.gewicht" }); i++; }
  }
  S.vg_doelen.filter(d => d.status === "behaald" && d.behaaldOp).forEach(d => uit.push({ id: "doel@" + d.id, datum: d.behaaldOp.slice(0, 10), titel: `Doel behaald: ${d.naam}`, gebied: d.gebied, doel: d.id }));
  return uit.sort((a, b) => b.datum.localeCompare(a.datum) || a.titel.localeCompare(b.titel));
}
/* De eerstvolgende drempels: waar ben je bijna? */
function vgVolgendeMijlpalen() {
  const uit = [], v = vandaagISO();
  for (const b of vgAutoBronnen()) {
    const tekst = VG_MP_TEKST[b.id], dr = tekst && vgDrempelsVoor(b);
    if (!dr) continue;
    const som = b.data().filter(p => p.d && p.d <= v).reduce((a, p) => a + p.v, 0);
    if (som <= 0) continue;
    const vol = dr.find(x => x > som + 1e-9), vorige = [0].concat(dr).filter(x => x <= som + 1e-9).pop();
    if (vol) uit.push({ titel: tekst(vol), p: (som - vorige) / (vol - vorige), nu: som, doel: vol, bron: b, gebied: b.gebied });
  }
  const rk = typeof rookCijfers === "function" ? rookCijfers() : null;
  if (rk) { const d = rk.dagen, vol = VG_ROOK_DAGEN.find(n => n > d); if (vol) { const vorige = [0].concat(VG_ROOK_DAGEN).filter(n => n <= d).pop(); uit.push({ titel: `${vol} dagen rookvrij`, p: (d - vorige) / (vol - vorige), gebied: "gezondheid" }); } }
  return uit.sort((a, b) => b.p - a.p);
}

/* ---------- 74.8 Levensgebieden in één oogopslag ----------
   Voortgang = gemiddelde van de actieve doelen in dat gebied.
   Activiteit = aantal vastgelegde dingen in de laatste 30 dagen, met de
   30 dagen daarvoor als vergelijking. Gevoel = je laatste terugblik (1–10). */
function vgGebiedStand(gebiedId, bronnen) {
  const v = vandaagISO(), van = plusDagen(v, -29), pv = plusDagen(v, -59), pt = plusDagen(v, -30);
  const doelen = vgActieveDoelen().filter(d => d.gebied === gebiedId);
  const p = doelen.length ? doelen.reduce((a, d) => a + vgDoelStand(d).p, 0) / doelen.length : null;
  let nu = 0, voor = 0;
  (bronnen || vgAutoBronnen()).concat(S.vg_meters.map(vgMeterBron)).filter(b => b && b.gebied === gebiedId).forEach(b => {
    b.data().forEach(x => { if (x.d >= van && x.d <= v) nu++; else if (x.d >= pv && x.d <= pt) voor++; });
  });
  const tb = S.vg_terugblik.filter(t => t.gevoel && t.gevoel[gebiedId]).sort((a, b) => (b.ts || "").localeCompare(a.ts || ""))[0];
  return { doelen: doelen.length, p, activiteit: nu, vorige: voor, gevoel: tb ? tb.gevoel[gebiedId] : null };
}

/* ---------- 74.9 Terugblik ---------- */
function vgTerugblikPeriode(soort, ankerDatum) {
  const d = ankerDatum || vandaagISO();
  if (soort === "maand") {
    const van = d.slice(0, 7) + "-01", volg = nwoVolgMaand(van), tot = plusDagen(volg, -1);
    const [y, m] = van.split("-").map(Number);
    return { id: "maand-" + van.slice(0, 7), soort, van, tot, naam: `${MAANDNAMEN[m - 1]} ${y}`, vorigeVan: (m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`) + "-01" };
  }
  const van = weekStart(d), tot = plusDagen(van, 6);
  return { id: "week-" + van, soort, van, tot, naam: `Week ${weekNummer(van)} · ${datumLabel(van)} – ${datumLabel(tot)}`, vorigeVan: plusDagen(van, -7) };
}
/* Automatische samenvatting: wat ging omhoog of omlaag ten opzichte van de periode ervoor? */
function vgSamenvatting(per) {
  const lengte = dagVerschil(per.tot, per.van) + 1;
  // Loopt de periode nog? Vergelijk dan eerlijk: tot vandaag tegenover evenveel dagen van de periode ervoor.
  const v = vandaagISO(), lopend = per.tot > v, tot = lopend ? v : per.tot;
  const pv = per.vorigeVan, pt = lopend ? plusDagen(pv, dagVerschil(v, per.van)) : plusDagen(per.van, -1);
  const rijen = [];
  vgAutoBronnen().concat(S.vg_meters.map(vgMeterBron)).filter(Boolean).forEach(b => {
    if (b.richting === "neutraal" && !b.eigen) return;
    const nu = vgSomTussen(b, per.van, tot), voor = vgSomTussen(b, pv, pt);
    if ((nu == null || nu === 0) && (voor == null || voor === 0)) return;
    rijen.push({ b, nu, voor, verschil: (nu || 0) - (voor || 0) });
  });
  const ms = vgMijlpalen().filter(m => m.datum >= per.van && m.datum <= per.tot);
  const behaald = S.vg_doelen.filter(d => d.behaaldOp && d.behaaldOp.slice(0, 10) >= per.van && d.behaaldOp.slice(0, 10) <= per.tot);
  return { lopend, rijen: rijen.sort((a, b) => Math.abs(b.verschil) / (Math.abs(b.voor || 0) + 1) - Math.abs(a.verschil) / (Math.abs(a.voor || 0) + 1)), mijlpalen: ms, behaald, lengte };
}
