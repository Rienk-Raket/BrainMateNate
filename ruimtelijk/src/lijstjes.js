"use strict";
// === SECTIE 81: LIJSTJES ===
/* ==========================================================================
   81. Lijstjes — films, series, boeken, podcasts, games, albums, restaurants,
   plekken, recepten en eigen lijsten. Opslaan, bijhouden, beoordelen en
   notities, plus een paar slimme hulpjes:
   - Snel loggen in één regel: "Dune (2024) *4.5 #scifi @Sam" wordt titel,
     jaar, cijfer, tag en tip-gever; je ziet live wat de app ervan maakt.
   - Wat nu?: de app kiest iets voor je op basis van tijd, sfeer, je
     check-in-energie, hoe graag je iets wilt en wie het je aanraadde.
   - Duels: twee dingen naast elkaar, tik wat je beter vond; zo ontstaat je
     eigen ranglijst (Elo), die soms iets anders zegt dan je sterren.
   - Opruimen: oude "wil ik"-dingen één voor één langs (vegen of tikken).
   - Tips van: per persoon hoe goed hun tips uitpakken.
   - Jouw jaar: een terugblik met maanden, smaak, hoogtepunten en delen.
   - Voortgang per aflevering of bladzijde, opnieuw beleven met een nieuw
     cijfer, een jaardoel via Voortgang en sporen op de Dagring.
   Opslag (DB_VERSIE 13): lj_lijsten en lj_items. Afbeeldingen in bijlagen.
   ========================================================================== */

/* ---------- 81.1 Opslag ---------- */
WINKELS.lj_lijsten = "id";
WINKELS.lj_items = "id";
S.lj_lijsten = S.lj_lijsten || [];
S.lj_items = S.lj_items || [];
V.ljStatus = V.ljStatus || {};
V.ljTag = V.ljTag || {};
V.ljAlles = V.ljAlles || {};

/* ---------- 81.2 Soorten ----------
   w: de drie statusnamen (wil, bezig, klaar) in de taal van de soort. */
const LJ_SOORTEN = {
  film: { naam: "Films", een: "film", ico: "film", w: ["Wil ik zien", "Aan het kijken", "Gezien"], maker: "Regisseur", lengte: "Duur (min)", waar: ["Bioscoop", "Netflix", "Prime Video", "Disney+", "Videoland", "HBO Max", "NPO Start"], vb: "Dune: Part Two (2024) *4.5 #scifi @Sam" },
  serie: { naam: "Series", een: "serie", ico: "tv", w: ["Wil ik zien", "Aan het kijken", "Gezien"], maker: "Maker", lengte: "Minuten per aflevering", totaal: "Afleveringen", eenheid: "afl.", waar: ["Netflix", "Prime Video", "Disney+", "Videoland", "HBO Max", "NPO Start", "Apple TV+"], vb: "Severance 3/19 #thriller" },
  boek: { naam: "Boeken", een: "boek", ico: "boek", w: ["Wil ik lezen", "Aan het lezen", "Gelezen"], maker: "Auteur", totaal: "Bladzijden", eenheid: "blz.", waar: ["Papier", "E-book", "Luisterboek", "Bibliotheek"], vb: "Het smelt 0/320 @Noor" },
  podcast: { naam: "Podcasts", een: "podcast", ico: "mic", w: ["Wil ik luisteren", "Aan het luisteren", "Geluisterd"], maker: "Host", lengte: "Minuten per aflevering", totaal: "Afleveringen", eenheid: "afl.", waar: ["Spotify", "Apple Podcasts", "NPO Luister", "YouTube"], vb: "De Dag #nieuws" },
  game: { naam: "Games", een: "game", ico: "game", w: ["Wil ik spelen", "Aan het spelen", "Uitgespeeld"], maker: "Studio", waar: ["PlayStation", "Xbox", "Switch", "PC", "Mobiel"], vb: "Hades II !bezig" },
  muziek: { naam: "Albums", een: "album", ico: "noot", w: ["Wil ik luisteren", "Aan het luisteren", "Geluisterd"], maker: "Artiest", lengte: "Duur (min)", waar: ["Spotify", "Apple Music", "Vinyl", "Live"], vb: "Blond (2016) *5" },
  restaurant: { naam: "Restaurants", een: "restaurant", ico: "bestek", w: ["Wil ik proberen", "Gereserveerd", "Geweest"], maker: "Keuken", waarLabel: "Plaats", waar: [], vb: "Pho 91 #vietnamees @Lotte" },
  plek: { naam: "Plekken", een: "plek", ico: "plek", w: ["Wil ik heen", "Gepland", "Geweest"], maker: "Land", waarLabel: "Wanneer", waar: ["Weekendje", "Zomer", "Winter", "Ooit"], vb: "Lofoten #natuur" },
  recept: { naam: "Recepten", een: "recept", ico: "pan", w: ["Wil ik maken", "Op het menu", "Gemaakt"], maker: "Van", lengte: "Bereidingstijd (min)", waar: [], vb: "Shakshuka #snel" },
  eigen: { naam: "Eigen lijst", een: "item", ico: "lijst", w: ["Wil ik", "Bezig", "Gedaan"], maker: "Van", waar: [], vb: "Iets nieuws #idee" }
};
const LJ_STATUS = ["wil", "bezig", "klaar", "gestopt"];
const LJ_SFEER = [["licht", "Licht"], ["spannend", "Spannend"], ["diep", "Diep"]];
const LJ_ZIN = [[1, "Ooit"], [2, "Graag"], [3, "Heel graag"]];
const LJ_GEVOEL = ["Gelachen", "Geraakt", "Gespannen", "Aan het denken gezet", "Ontspannen", "Geïnspireerd", "Verveeld"];
const LJ_STOFFIG = 180;   // dagen op de wil-lijst zonder dat je ernaar keek
const LJ_KLEUR = "#e0532f";
if (typeof MODULES === "object") MODULES.lijstjes = { naam: "Lijstjes", kleur: LJ_KLEUR, ico: "lijstjes", view: "lijstjes" };
TL_SOORTEN.lijstjes = TL_SOORTEN.lijstjes || ["Lijstjes", LJ_KLEUR];
if (typeof LOGFILTERS !== "undefined" && Array.isArray(LOGFILTERS) && !LOGFILTERS.some(f => f[0] === "lijstjes")) LOGFILTERS.push(["lijstjes", "Lijstjes"]);
if (typeof VW_SPOOR_SOORTEN !== "undefined" && !VW_SPOOR_SOORTEN.includes("lijstjes")) VW_SPOOR_SOORTEN.push("lijstjes");

/* ---------- 81.3 Hulpjes ---------- */
const ljSoort = l => LJ_SOORTEN[(l && l.soort) || "eigen"] || LJ_SOORTEN.eigen;
const ljLijst = id => vind("lj_lijsten", id);
const ljLijsten = () => S.lj_lijsten.filter(l => !l.archief).sort((a, b) => (a.volgorde || 0) - (b.volgorde || 0));
const ljItems = lijstId => S.lj_items.filter(x => !lijstId || x.lijstId === lijstId);
const ljStatusNaam = (l, st) => st === "gestopt" ? "Gestopt" : ljSoort(l).w[Math.max(0, LJ_STATUS.indexOf(st))];
const ljIco = (l, stijl) => l && l.emoji ? `<span class="lj-emoji" aria-hidden="true">${esc(l.emoji)}</span>` : ico(ljSoort(l).ico, stijl);
const ljDagen = iso => iso ? Math.max(0, dagVerschil(vandaagISO(), iso.slice(0, 10))) : 0;
const ljStoffig = x => x.status === "wil" && ljDagen(x.gecheckt || x.gemaakt) > LJ_STOFFIG;
const ljCijfer = s => (s / 2).toLocaleString("nl-NL", { maximumFractionDigits: 1 });
const ljGem = lijst => { const m = lijst.filter(x => x.score); return m.length ? m.reduce((a, x) => a + x.score, 0) / m.length : 0; };
const ljMv = (n, e, m) => `${n} ${n === 1 ? e : m}`;
const ljElo = x => x.elo != null ? x.elo : 1000 + ((x.score || 6) - 6) * 40;
const ljJaar = () => vandaagISO().slice(0, 4);
function ljSterren(score, extra) {
  if (!score) return "";
  let h = "";
  for (let n = 1; n <= 5; n++) h += `<span class="lj-s ${score >= n * 2 ? "vol" : score === n * 2 - 1 ? "half" : ""}">★</span>`;
  return `<span class="lj-sterren${extra ? " " + extra : ""}" role="img" aria-label="${ljCijfer(score)} van 5 sterren">${h}</span>`;
}
/* Sterren invoeren: tik een ster voor heel, nog eens voor half; de eerste ster drie keer wist. */
function ljSterInvoer(score, attr) {
  let h = "";
  for (let n = 1; n <= 5; n++) h += `<button type="button" class="lj-s ${score >= n * 2 ? "vol" : score === n * 2 - 1 ? "half" : ""}" ${attr}="${n}" aria-label="${n} ${n === 1 ? "ster" : "sterren"}">★</button>`;
  return `<span class="lj-sterinvoer">${h}<span class="lj-sterwaarde">${score ? ljCijfer(score) : "—"}</span></span>`;
}
const ljVolgendeScore = (score, n) => score === n * 2 ? n * 2 - 1 : score === n * 2 - 1 ? (n === 1 ? 0 : n * 2) : n * 2;
function ljDuim(x, l, klein) {
  const bl = x.afbeelding && vind("bijlagen", x.afbeelding);
  const u = bl ? bijlageURL(bl) : null;
  return u ? `<img class="lj-duim${klein ? " klein" : ""}" src="${u}" alt="">` : `<span class="lj-duim zonder${klein ? " klein" : ""}" aria-hidden="true">${ljIco(l)}</span>`;
}
function ljMeta(x, l) {
  const s = ljSoort(l), m = [];
  if (x.jaar) m.push(x.jaar);
  if (x.maker) m.push(esc(x.maker));
  if (x.lengte && s.lengte && !s.totaal) m.push(duurTekst(+x.lengte));
  if (x.waar) m.push(esc(x.waar));
  return m.join(" · ");
}
/* Tips van: hoe goed pakken de tips van iemand uit? */
function ljTipgevers(lijstId) {
  const per = {};
  ljItems(lijstId).filter(x => x.tipVan).forEach(x => {
    const k = x.tipVan.trim(); if (!k) return;
    const p = per[k.toLowerCase()] || (per[k.toLowerCase()] = { naam: k, n: 0, beoordeeld: 0, som: 0 });
    p.n++; if (x.score) { p.beoordeeld++; p.som += x.score; }
  });
  return Object.values(per).map(p => Object.assign(p, { gem: p.beoordeeld ? p.som / p.beoordeeld : 0 })).sort((a, b) => b.gem - a.gem || b.n - a.n);
}
const ljTipgever = naam => naam ? ljTipgevers().find(p => p.naam.toLowerCase() === naam.trim().toLowerCase()) : null;

/* ---------- 81.4 Snel loggen in één regel ----------
   #tag · @naam (tip van) · *4.5 of 4.5* (sterren) · (2024) of een jaartal
   aan het eind · 3/19 (voortgang) · !bezig, !klaar, !gestopt (status). */
const LJ_STATUSWOORD = { wil: "wil", later: "wil", bezig: "bezig", nu: "bezig", klaar: "klaar", gezien: "klaar", gelezen: "klaar", gedaan: "klaar", geweest: "klaar", gespeeld: "klaar", uit: "klaar", af: "klaar", gemaakt: "klaar", geluisterd: "klaar", gestopt: "gestopt", stop: "gestopt" };
function ljParse(tekst) {
  const r = { titel: "", tags: [], score: 0, jaar: null, tipVan: "", status: null, stand: null, totaal: null };
  let s = " " + String(tekst || "").replace(/\s+/g, " ") + " ";
  s = s.replace(/\s#([\p{L}\p{N}_-]+)(?=\s)/gu, (m, t) => { if (!r.tags.includes(t.toLowerCase())) r.tags.push(t.toLowerCase()); return " "; });
  s = s.replace(/\s@([\p{L}\p{N}_.'-]+)(?=\s)/gu, (m, n) => { r.tipVan = n.replace(/_/g, " "); return " "; });
  s = s.replace(/\s!([\p{L}]+)(?=\s)/gu, (m, w) => { const st = LJ_STATUSWOORD[w.toLowerCase()]; if (!st) return m; r.status = st; return " "; });
  s = s.replace(/\s(★{1,5})(½)?(?=\s)/g, (m, st, h) => { r.score = st.length * 2 + (h ? 1 : 0); return " "; });
  s = s.replace(/\s(?:[*★]\s?([0-5](?:[.,]5)?)|([0-5](?:[.,]5)?)\s?[*★])(?=\s)/g, (m, a, b) => { r.score = Math.min(10, Math.round(parseFloat((a || b).replace(",", ".")) * 2)); return " "; });
  s = s.replace(/\s(\d{1,5})\s?\/\s?(\d{1,5})(?=\s)/, (m, a, b) => { r.stand = +a; r.totaal = +b; return " "; });
  s = s.replace(/\s\(((?:18|19|20)\d{2})\)(?=\s)/, (m, j) => { r.jaar = +j; return " "; });
  if (!r.jaar) {
    const max = +ljJaar() + 3;
    s = s.replace(/\s((?:18|19|20)\d{2})\s*$/, (m, j) => +j <= max ? (r.jaar = +j, " ") : m);
  }
  r.titel = s.replace(/\s+/g, " ").trim().replace(/^[-–:·,]\s*|\s*[-–:·,]$/g, "");
  if (!r.titel && r.jaar) { r.titel = String(r.jaar); r.jaar = null; }
  if (!r.status) r.status = r.score ? "klaar" : r.stand ? (r.totaal && r.stand >= r.totaal ? "klaar" : "bezig") : "wil";
  return r;
}
function ljParseChips(p, l) {
  if (!p.titel) return "";
  const c = [`<span class="lj-pchip titel">${esc(p.titel)}</span>`];
  if (p.jaar) c.push(`<span class="lj-pchip">${p.jaar}</span>`);
  if (p.score) c.push(`<span class="lj-pchip">${ljSterren(p.score)}</span>`);
  if (p.stand != null) c.push(`<span class="lj-pchip">${p.stand}${p.totaal ? " / " + p.totaal : ""} ${esc(ljSoort(l).eenheid || "")}</span>`);
  p.tags.forEach(t => c.push(`<span class="lj-pchip">#${esc(t)}</span>`));
  if (p.tipVan) c.push(`<span class="lj-pchip">tip van ${esc(p.tipVan)}</span>`);
  c.push(`<span class="lj-pchip status">${esc(ljStatusNaam(l, p.status))}</span>`);
  return c.join("");
}

/* ---------- 81.5 Opslaan, status en sporen ---------- */
function ljNieuwItem(l, p) {
  const nu = new Date().toISOString();
  const x = { id: uid(), lijstId: l.id, titel: p.titel, status: p.status || "wil", score: p.score || 0, jaar: p.jaar || null, maker: p.maker || "", waar: p.waar || "",
    lengte: p.lengte || null, totaal: p.totaal || null, stand: p.stand != null ? p.stand : null, tags: p.tags || [], sfeer: p.sfeer || "", zin: p.zin || 0, tipVan: p.tipVan || "",
    notitie: p.notitie || "", citaat: "", gevoel: [], link: p.link || "", afbeelding: null, keer: [], gemaakt: nu, volgorde: Date.now() };
  if (x.status === "bezig" || x.status === "klaar") x.gestart = vandaagISO();
  if (x.status === "klaar") x.afgerond = vandaagISO();
  return x;
}
async function ljLog(x, tekst) {
  if (typeof logGebeurtenis === "function") await logGebeurtenis("lijstjes", tekst, x.id);
}
async function ljZetStatus(x, st, stil) {
  const l = ljLijst(x.lijstId), oud = x.status;
  if (oud === st) return;
  x.status = st;
  if (st === "bezig" && !x.gestart) x.gestart = vandaagISO();
  if (st === "klaar") { x.afgerond = vandaagISO(); if (!x.gestart) x.gestart = x.afgerond; if (x.totaal) x.stand = x.totaal; }
  if (st === "wil") { x.gestart = null; x.afgerond = null; }
  await bewaar("lj_items", x);
  if (st === "bezig" || st === "klaar") await ljLog(x, `${ljStatusNaam(l, st)}: ${x.titel}${st === "klaar" && x.score ? " · " + ljCijfer(x.score) + "★" : ""}`);
  if (!stil) tril(st === "klaar" ? 12 : 8);
}
/* Klaar → meteen vragen hoe het was (sterren en gevoel), in één blad. */
function ljBeoordeelBlad(x, klaar) {
  const l = ljLijst(x.lijstId);
  let score = x.score || 0, gevoel = (x.gevoel || []).slice();
  const inhoud = () => `<p class="klein" style="margin:2px 0 12px">${esc(x.titel)}</p>
    <div class="veld"><span class="labeltekst">Hoe was het?</span>${ljSterInvoer(score, "data-ljb-ster")}</div>
    <div class="veld"><span class="labeltekst">Wat deed het met je?</span><div class="keuzerij">${LJ_GEVOEL.map(g => `<button class="keuze" data-ljb-gev="${esc(g)}" aria-pressed="${gevoel.includes(g)}">${esc(g)}</button>`).join("")}</div></div>
    <div class="veld"><label for="ljb-citaat">Wat blijft hangen? (mag leeg)</label><input class="invoer" id="ljb-citaat" value="${esc(x.citaat || "")}" placeholder="Een zin, scène of gedachte"></div>`;
  bladOpen(`${ljStatusNaam(l, "klaar")}!`, inhoud(), `<button class="knop breed primair" id="ljb-ok">Bewaren</button>`);
  const bi = $("#bladinhoud");
  bi.addEventListener("click", e => {
    const st = e.target.closest("[data-ljb-ster]"), gv = e.target.closest("[data-ljb-gev]");
    if (!st && !gv) return;
    const c = ($("#ljb-citaat") || {}).value;
    if (st) score = ljVolgendeScore(score, +st.dataset.ljbSter);
    if (gv) { const g = gv.dataset.ljbGev, i = gevoel.indexOf(g); if (i >= 0) gevoel.splice(i, 1); else gevoel.push(g); }
    bi.innerHTML = inhoud(); if (c != null) $("#ljb-citaat").value = c;
  });
  $("#ljb-ok").onclick = async () => {
    x.score = score; x.gevoel = gevoel; x.citaat = (($("#ljb-citaat") || {}).value || "").trim();
    if (x.score && x.elo == null) x.elo = ljElo(x);
    await bewaar("lj_items", x);
    bladSluit(); teken();
    toast(x.score ? `${ljCijfer(x.score)} sterren voor ${x.titel}` : "Bewaard");
    if (klaar) klaar();
  };
}
async function ljKlaar(x, knop) {
  await ljZetStatus(x, "klaar");
  if (knop && typeof rtBurst === "function" && typeof rtAan === "function" && rtAan()) { const r = knop.getBoundingClientRect(); rtBurst(r.left + r.width / 2, r.top + r.height / 2); }
  teken();
  ljBeoordeelBlad(x);
}

/* ---------- 81.6 Koppen ---------- */
function ljOnderschrift() {
  const j = ljJaar(), af = S.lj_items.filter(x => x.status === "klaar" && (x.afgerond || "").startsWith(j)).length, bz = S.lj_items.filter(x => x.status === "bezig").length;
  return S.lj_lijsten.length ? [bz ? `${bz} bezig` : "", af ? `${af} afgerond in ${j}` : ""].filter(Boolean).join(" · ") || ljMv(ljLijsten().length, "lijstje", "lijstjes") : "Films, series, boeken en meer";
}
Object.defineProperty(KOPPEN, "lijstjes", { get: () => ["Lijstjes", ljOnderschrift], configurable: true, enumerable: true });
Object.defineProperty(KOPPEN, "lijstje", { get: () => { const l = ljLijst(V.param); return [l ? l.naam : "Lijstje", () => { if (!l) return ""; const it = ljItems(l.id); return `${it.filter(x => x.status === "wil").length} ${ljSoort(l).w[0].toLowerCase()} · ${it.filter(x => x.status === "klaar").length} ${ljSoort(l).w[2].toLowerCase()}`; }]; }, configurable: true, enumerable: true });
Object.defineProperty(KOPPEN, "lijstitem", { get: () => { const x = vind("lj_items", V.param), l = x && ljLijst(x.lijstId); return [x ? x.titel : "Lijstje", () => l ? l.naam : ""]; }, configurable: true, enumerable: true });
Object.defineProperty(KOPPEN, "ljjaar", { get: () => ["Jouw jaar", () => `${V.param || ljJaar()} in lijstjes`], configurable: true, enumerable: true });

/* ---------- 81.7 Overzicht: alle lijstjes ---------- */
function ljBezigRij(x) {
  const l = ljLijst(x.lijstId), s = ljSoort(l);
  const p = x.totaal ? Math.min(100, Math.round((x.stand || 0) / x.totaal * 100)) : null;
  return `<div class="lj-bezig" data-lj-rij="${x.id}">
    <button class="lj-bezighoofd" data-act="ga" data-view="lijstitem" data-param="${x.id}">
      ${ljDuim(x, l, true)}
      <span class="lj-info"><span class="lj-naam">${esc(x.titel)}</span>
        <span class="lj-meta">${x.totaal ? `${x.stand || 0} van ${x.totaal} ${esc(s.eenheid || "")}` : esc(ljStatusNaam(l, "bezig"))} · ${esc(l ? l.naam : "")}</span>
        ${p != null ? `<span class="lj-balk"><i style="width:${p}%"></i></span>` : ""}</span>
    </button>
    ${x.totaal ? `<button class="lj-plus" data-act="lj-plus" data-id="${x.id}" aria-label="Eén ${esc(s.eenheid || "stap")} verder: ${esc(x.titel)}">+1</button>`
      : `<button class="lj-klaarknop" data-act="lj-klaar" data-id="${x.id}" aria-label="${esc(ljStatusNaam(l, "klaar"))}: ${esc(x.titel)}">${ico("check")}</button>`}
  </div>`;
}
function vwLijstjes() {
  const lijsten = ljLijsten();
  if (!lijsten.length) {
    return `<div class="card card-pad lj-intro">
      <span class="lj-introico" aria-hidden="true">${ico("lijstjes")}</span>
      <h2>Alles wat je wilt zien, lezen en proberen</h2>
      <p class="klein">Houd films, series, boeken en meer bij. Beoordeel wat je deed, schrijf op wat bleef hangen en laat de app kiezen als je het niet weet.</p></div>
      ${sectie("Begin met een lijstje")}
      <div class="lj-soortgrid">${Object.entries(LJ_SOORTEN).map(([k, s]) => `<button class="card lj-soort" data-act="lj-maak" data-soort="${k}">${ico(s.ico)}<span>${esc(s.naam)}</span></button>`).join("")}</div>`;
  }
  const j = ljJaar(), alle = S.lj_items;
  const afJaar = alle.filter(x => x.status === "klaar" && (x.afgerond || "").startsWith(j));
  const wil = alle.filter(x => x.status === "wil"), bezig = alle.filter(x => x.status === "bezig").sort((a, b) => (b.bijgewerkt || b.gestart || "").localeCompare(a.bijgewerkt || a.gestart || ""));
  const gem = ljGem(afJaar), stoffig = wil.filter(ljStoffig).length;
  let h = `<div class="card lj-held">
    <div class="lj-heldcijfers">
      <div><b>${afJaar.length}</b><span>afgerond in ${j}</span></div>
      <div><b>${gem ? ljCijfer(gem) : "—"}</b><span>gemiddeld ★</span></div>
      <div><b>${wil.length}</b><span>op je lijstjes</span></div>
    </div>
    <button class="knop breed primair" data-act="lj-watnu">${ico("dobbel")} Wat nu?</button>
  </div>`;
  if (bezig.length) {
    const max = typeof ndMax === "function" ? ndMax("lijst") : Infinity, open = V.ljAlles.bezig;
    const toon = open || !isFinite(max) ? bezig : bezig.slice(0, Math.max(3, Math.min(max, 5)));
    h += sectie("Bezig", bezig.length) + `<div class="card lj-bezigkaart">${toon.map(ljBezigRij).join("")}${toon.length < bezig.length ? `<button class="nd-meer" data-act="lj-meer" data-k="bezig">Toon nog ${bezig.length - toon.length}</button>` : ""}</div>`;
  }
  h += sectie("Je lijstjes", lijsten.length) + `<div class="lj-lijstgrid">${lijsten.map(l => {
    const it = ljItems(l.id), s = ljSoort(l), g = ljGem(it);
    const w = it.filter(x => x.status === "wil").length, k = it.filter(x => x.status === "klaar").length, b = it.filter(x => x.status === "bezig").length;
    return `<button class="card lj-lijstkaart" data-act="ga" data-view="lijstje" data-param="${l.id}">
      <span class="lj-lijstico" style="--mk:${LJ_KLEUR}">${ljIco(l)}</span>
      <span class="lj-lijstnaam">${esc(l.naam)}</span>
      <span class="lj-lijstsub">${w} ${esc(s.w[0].toLowerCase())}${b ? ` · ${b} bezig` : ""}</span>
      <span class="lj-lijstsub">${k} ${esc(s.w[2].toLowerCase())}${g ? ` · ${ljCijfer(g)}★` : ""}</span>
    </button>`; }).join("")}
    <button class="lj-lijstkaart lj-nieuwkaart" data-act="lj-nieuwlijst">${ico("plus")}<span class="lj-lijstnaam">Nieuw lijstje</span></button></div>`;
  h += sectie("Slimme hulpjes") + `<div class="card lj-hulp">
    <button data-act="lj-duel">${ico("trofee")}<span><b>Duels</b><small>Tik wat je beter vond; zo ontstaat je eigen ranglijst</small></span>${ico("pijlr", "width:16px;height:16px;color:var(--faint)")}</button>
    <button data-act="lj-opruim">${ico("bezem")}<span><b>Opruimen${stoffig ? ` <em class="lj-tel">${stoffig}</em>` : ""}</b><small>${stoffig ? `${ljMv(stoffig, "ding staat", "dingen staan")} al een half jaar te wachten` : "Nog steeds zin in alles op je lijstjes?"}</small></span>${ico("pijlr", "width:16px;height:16px;color:var(--faint)")}</button>
    <button data-act="ga" data-view="ljjaar" data-param="${j}">${ico("ster")}<span><b>Jouw jaar</b><small>Maanden, smaak, hoogtepunten en je beste tipgever</small></span>${ico("pijlr", "width:16px;height:16px;color:var(--faint)")}</button>
  </div>`;
  h += `<button class="card vw-naarvg" data-act="vw-voortgang" data-tab="meters" data-bron="lijstjes.klaar"><span class="vs-ico" aria-hidden="true">${ico("doel")}</span><span class="vs-tekst"><b>Lijstjes in Voortgang</b><small>Zet een jaardoel, bv. 24 boeken in ${j}</small></span>${ico("pijlr", "width:16px;height:16px;color:var(--faint)")}</button>`;
  return h;
}

/* ---------- 81.8 Eén lijstje ---------- */
const LJ_SORT = [["nieuw", "Nieuwste eerst"], ["cijfer", "Hoogste cijfer"], ["rang", "Jouw ranglijst (duels)"], ["zin", "Meeste zin"], ["titel", "Titel A–Z"], ["jaar", "Jaar (nieuw → oud)"], ["wacht", "Langst op de lijst"]];
function ljSorteer(lijst, s) {
  const f = {
    nieuw: (a, b) => (b.afgerond || b.gemaakt || "").localeCompare(a.afgerond || a.gemaakt || ""),
    cijfer: (a, b) => (b.score || 0) - (a.score || 0) || ljElo(b) - ljElo(a),
    rang: (a, b) => ljElo(b) - ljElo(a),
    zin: (a, b) => (b.zin || 0) - (a.zin || 0) || (a.gemaakt || "").localeCompare(b.gemaakt || ""),
    titel: (a, b) => a.titel.localeCompare(b.titel, "nl"),
    jaar: (a, b) => (b.jaar || 0) - (a.jaar || 0),
    wacht: (a, b) => (a.gemaakt || "").localeCompare(b.gemaakt || "")
  }[s] || ((a, b) => (b.gemaakt || "").localeCompare(a.gemaakt || ""));
  return lijst.slice().sort(f);
}
function ljRij(x, l, rang) {
  const meta = ljMeta(x, l), s = ljSoort(l);
  let rechts;
  if (x.status === "wil") rechts = `<button class="lj-start" data-act="lj-begin" data-id="${x.id}" aria-label="${esc(ljStatusNaam(l, "bezig"))}: ${esc(x.titel)}">${ico("play")}</button>`;
  else if (x.status === "bezig") rechts = x.totaal ? `<button class="lj-plus" data-act="lj-plus" data-id="${x.id}" aria-label="Eén ${esc(s.eenheid || "stap")} verder">+1</button>` : `<button class="lj-klaarknop" data-act="lj-klaar" data-id="${x.id}" aria-label="${esc(ljStatusNaam(l, "klaar"))}: ${esc(x.titel)}">${ico("check")}</button>`;
  else rechts = `<span class="lj-rechtsinfo">${x.score ? ljSterren(x.score) : `<small>${esc(ljStatusNaam(l, x.status))}</small>`}</span>`;
  const onder = [];
  if (x.status === "bezig" && x.totaal) onder.push(`${x.stand || 0}/${x.totaal} ${esc(s.eenheid || "")}`);
  if (x.status === "wil" && x.zin) onder.push(`<span class="lj-zin" role="img" aria-label="${esc(LJ_ZIN[x.zin - 1][1])}">${ico("hart", "width:12px;height:12px").repeat(x.zin)}</span>`);
  if (x.tipVan) onder.push(`tip van ${esc(x.tipVan)}`);
  if (ljStoffig(x)) onder.push(`<span class="lj-stof">al ${Math.round(ljDagen(x.gemaakt) / 30)} maanden</span>`);
  if (x.keer && x.keer.length) onder.push(`${x.keer.length + 1}× ${esc(s.w[2].toLowerCase())}`);
  return `<div class="lj-rij" data-lj-rij="${x.id}">
    <button class="lj-rijhoofd" data-act="ga" data-view="lijstitem" data-param="${x.id}">
      ${rang ? `<span class="lj-rang">${rang}</span>` : ""}${ljDuim(x, l, true)}
      <span class="lj-info"><span class="lj-naam">${esc(x.titel)}</span>
        ${meta ? `<span class="lj-meta">${meta}</span>` : ""}
        ${onder.length ? `<span class="lj-meta">${onder.join(" · ")}</span>` : ""}
        ${(x.tags || []).length ? `<span class="lj-tags">${x.tags.slice(0, 3).map(t => `<i>#${esc(t)}</i>`).join("")}</span>` : ""}</span>
    </button>${rechts}</div>`;
}
function vwLijstje() {
  const l = ljLijst(V.param);
  if (!l) return leeg("", "Dit lijstje bestaat niet meer");
  const s = ljSoort(l), it = ljItems(l.id);
  const tel = st => it.filter(x => x.status === st).length;
  const st = V.ljStatus[l.id] || (tel("wil") ? "wil" : tel("bezig") ? "bezig" : tel("klaar") ? "klaar" : "wil");
  const tag = V.ljTag[l.id] || "";
  const sort = inst("ljSort_" + l.id, st === "klaar" ? "nieuw" : "zin");
  let rij = it.filter(x => st === "alle" || x.status === st);
  if (tag) rij = rij.filter(x => (x.tags || []).includes(tag));
  rij = ljSorteer(rij, sort);
  const tags = {}; it.forEach(x => (x.tags || []).forEach(t => { tags[t] = (tags[t] || 0) + 1; }));
  let h = `<div class="card lj-snel">
    <div class="lj-snelrij"><input class="invoer" id="lj-snel" type="text" placeholder="${esc(s.vb)}" enterkeyhint="done" autocomplete="off" autocapitalize="sentences" aria-label="Snel toevoegen aan ${esc(l.naam)}" aria-describedby="lj-snelhulp"></div>
    <div class="lj-preview" id="lj-preview" aria-live="polite"></div>
    <div class="knoprij"><button class="knop primair" data-act="lj-toevoegen" data-id="${l.id}">${ico("plus")} Toevoegen</button>
      <button class="knop rand" data-act="lj-details" data-id="${l.id}">Met details…</button></div>
    <details class="lj-snelhulp" id="lj-snelhulp"><summary>Slim typen</summary>
      <p><b>#tag</b> · <b>@naam</b> tip van · <b>*4.5</b> sterren · <b>(2024)</b> jaar · <b>3/19</b> voortgang · <b>!bezig</b> of <b>!klaar</b>. Sterren betekenen: al ${esc(s.w[2].toLowerCase())}.</p></details>
  </div>`;
  h += `<div class="chiprij scroll lj-status">${[["wil", s.w[0]], ["bezig", s.w[1]], ["klaar", s.w[2]], ["gestopt", "Gestopt"], ["alle", "Alles"]].filter(([k]) => k === "alle" || k === st || tel(k)).map(([k, n]) =>
    `<button class="keuze" data-act="lj-status" data-id="${l.id}" data-s="${k}" aria-pressed="${st === k}">${esc(n)} <span class="klein">${k === "alle" ? it.length : tel(k)}</span></button>`).join("")}</div>`;
  if (Object.keys(tags).length || it.length > 3) h += `<div class="lj-balk2">
    ${Object.keys(tags).length ? `<div class="chiprij scroll lj-tagrij">${Object.entries(tags).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([t, n]) => `<button class="keuze" data-act="lj-tag" data-id="${l.id}" data-t="${esc(t)}" aria-pressed="${tag === t}">#${esc(t)} <span class="klein">${n}</span></button>`).join("")}</div>` : ""}
    <label class="lj-sortlabel">${ico("lijst", "width:15px;height:15px")}<select id="lj-sort" data-id="${l.id}" aria-label="Sorteren">${LJ_SORT.map(([k, n]) => `<option value="${k}"${sort === k ? " selected" : ""}>${n}</option>`).join("")}</select></label></div>`;
  if (!rij.length) h += `<div class="card">${leeg("", it.length ? "Niets in deze selectie" : `Nog niets op ${l.naam}`, it.length ? "" : "Typ hierboven een titel. Met sterren erbij staat hij meteen bij " + esc(s.w[2].toLowerCase()) + ".")}</div>`;
  else {
    const max = typeof ndMax === "function" ? ndMax("lijst") : Infinity, k = "l_" + l.id;
    const toon = V.ljAlles[k] || !isFinite(max) || rij.length <= max + 2 ? rij : rij.slice(0, max);
    h += `<div class="card lj-lijst">${toon.map((x, i) => ljRij(x, l, sort === "rang" || (sort === "cijfer" && st === "klaar") ? i + 1 : 0)).join("")}
      ${toon.length < rij.length ? `<button class="nd-meer" data-act="lj-meer" data-k="${k}">Toon nog ${rij.length - toon.length}</button>` : ""}</div>`;
  }
  const kl = tel("klaar"), stoffig = it.filter(ljStoffig).length;
  h += sectie("Met dit lijstje") + `<div class="card lj-hulp">
    ${tel("wil") || tel("bezig") ? `<button data-act="lj-watnu" data-id="${l.id}">${ico("dobbel")}<span><b>Wat nu?</b><small>Laat de app iets kiezen uit ${esc(l.naam.toLowerCase())}</small></span>${ico("pijlr", "width:16px;height:16px;color:var(--faint)")}</button>` : ""}
    ${kl >= 2 ? `<button data-act="lj-duel" data-id="${l.id}">${ico("trofee")}<span><b>Duels</b><small>${kl} ${esc(s.w[2].toLowerCase())} · bouw je eigen ranglijst</small></span>${ico("pijlr", "width:16px;height:16px;color:var(--faint)")}</button>` : ""}
    ${stoffig ? `<button data-act="lj-opruim" data-id="${l.id}">${ico("bezem")}<span><b>Opruimen <em class="lj-tel">${stoffig}</em></b><small>Nog steeds zin in wat al lang wacht?</small></span>${ico("pijlr", "width:16px;height:16px;color:var(--faint)")}</button>` : ""}
    <button data-act="lj-delen" data-id="${l.id}">${ico("deel")}<span><b>Delen</b><small>Je top of je hele lijst als tekst, of als CSV</small></span>${ico("pijlr", "width:16px;height:16px;color:var(--faint)")}</button>
    <button data-act="lj-jaardoel" data-id="${l.id}">${ico("doel")}<span><b>Jaardoel</b><small>Bv. 12 ${esc(s.naam.toLowerCase())} in ${ljJaar()}, in Voortgang</small></span>${ico("pijlr", "width:16px;height:16px;color:var(--faint)")}</button>
  </div>
  <div class="knoprij" style="margin-top:14px"><button class="knop rand" data-act="lj-lijstbewerk" data-id="${l.id}">${ico("pen")} Lijstje bewerken</button>
    <button class="knop gevaar" data-act="lj-lijstweg" data-id="${l.id}">${ico("prullenbak")} Verwijderen</button></div>`;
  return h;
}

/* ---------- 81.9 Eén ding ---------- */
function vwLijstItem() {
  const x = vind("lj_items", V.param);
  if (!x) return leeg("", "Dit staat niet meer op je lijstje");
  const l = ljLijst(x.lijstId), s = ljSoort(l);
  const bl = x.afbeelding && vind("bijlagen", x.afbeelding), afb = bl ? bijlageURL(bl) : null;
  const meta = ljMeta(x, l);
  let h = `<div class="lj-hero${afb ? " met" : ""}">${afb ? `<img src="${afb}" alt="${esc(x.titel)}">` : `<span class="lj-heroico" aria-hidden="true">${ljIco(l)}</span>`}</div>
    <div class="lj-kop"><div class="lj-titel">${esc(x.titel)}</div>${meta ? `<div class="lj-meta">${meta}</div>` : ""}</div>
    <div class="lj-seg" role="radiogroup" aria-label="Status">${LJ_STATUS.map(st => `<button role="radio" aria-checked="${x.status === st}" data-act="lj-zet" data-id="${x.id}" data-s="${st}">${esc(ljStatusNaam(l, st))}</button>`).join("")}</div>`;
  // Eén hoofdactie, passend bij de status.
  if (x.status === "wil") h += `<button class="knop breed primair lj-hoofd" data-act="lj-begin" data-id="${x.id}">${ico("play")} ${esc(ljStatusNaam(l, "bezig"))}</button>`;
  else if (x.status === "bezig") h += `<button class="knop breed primair lj-hoofd" data-act="lj-klaar" data-id="${x.id}">${ico("check")} ${esc(ljStatusNaam(l, "klaar"))}</button>`;
  else if (x.status === "klaar") h += `<button class="knop breed primair lj-hoofd" data-act="lj-opnieuw" data-id="${x.id}">${ico("herhaal")} Opnieuw beleefd</button>`;
  if (x.status === "klaar" || x.score) h += `<div class="card card-pad lj-oordeel">
      <div class="lj-oordeelkop"><span class="labeltekst">Jouw oordeel</span>${ljSterInvoer(x.score || 0, "data-lj-ster")}</div>
      ${(x.gevoel || []).length ? `<div class="chiprij">${x.gevoel.map(g => `<span class="chip">${esc(g)}</span>`).join("")}</div>` : ""}
      ${x.citaat ? `<blockquote class="lj-citaat">${esc(x.citaat)}</blockquote>` : ""}
      <button class="knop klein rand" data-act="lj-beoordeel" data-id="${x.id}">${ico("pen")} ${(x.gevoel || []).length || x.citaat ? "Gevoel en citaat aanpassen" : "Wat deed het met je?"}</button>
    </div>`;
  if (x.totaal || (s.totaal && x.status === "bezig")) {
    const p = x.totaal ? Math.min(100, Math.round((x.stand || 0) / x.totaal * 100)) : 0;
    h += `<div class="card card-pad lj-voortgang"><div class="lj-vgkop"><b>${x.stand || 0}${x.totaal ? ` van ${x.totaal}` : ""} ${esc(s.eenheid || "")}</b><span>${x.totaal ? p + "%" : ""}</span></div>
      <div class="balk" style="height:9px;margin:8px 0 10px"><i style="width:${p}%;background:var(--accent)"></i></div>
      <div class="knoprij"><button class="knop klein rand" data-act="lj-min" data-id="${x.id}" aria-label="Eén terug">−1</button>
        <button class="knop klein rand" data-act="lj-plus" data-id="${x.id}">+1 ${esc(s.eenheid || "")}</button>
        <button class="knop klein rand" data-act="lj-stand" data-id="${x.id}">Stand invullen</button></div></div>`;
  }
  const tg = ljTipgever(x.tipVan);
  const feiten = [
    ["Op je lijstje sinds", `${esc(datumLabel((x.gemaakt || "").slice(0, 10) || vandaagISO()))}`],
    x.gestart ? ["Begonnen", esc(datumLabel(x.gestart))] : null,
    x.afgerond ? [ljStatusNaam(l, "klaar"), `${esc(datumLabel(x.afgerond))}${x.gemaakt && dagVerschil(x.afgerond, x.gemaakt.slice(0, 10)) > 0 ? ` · na ${ljMv(dagVerschil(x.afgerond, x.gemaakt.slice(0, 10)), "dag", "dagen")}` : ""}`] : null,
    x.tipVan ? ["Tip van", `${esc(x.tipVan)}${tg && tg.beoordeeld >= 2 ? ` · gem. ${ljCijfer(tg.gem)}★ over ${tg.beoordeeld} tips` : ""}`] : null,
    x.zin ? ["Hoe graag", esc(LJ_ZIN.find(z => z[0] === x.zin)[1])] : null,
    x.sfeer ? ["Sfeer", esc((LJ_SFEER.find(z => z[0] === x.sfeer) || ["", x.sfeer])[1])] : null,
    x.lengte && s.lengte ? [s.lengte.replace(/ \(.*\)/, ""), duurTekst(+x.lengte)] : null,
    x.status === "klaar" && ljItems(l.id).filter(y => y.status === "klaar" && y.duels).length >= 3 && x.duels ? ["Jouw ranglijst", `#${ljSorteer(ljItems(l.id).filter(y => y.status === "klaar"), "rang").findIndex(y => y.id === x.id) + 1} van ${ljItems(l.id).filter(y => y.status === "klaar").length}`] : null
  ].filter(Boolean);
  h += `<div class="lj-feiten">${feiten.map(([k, v]) => `<div><span>${esc(k)}</span><b>${v}</b></div>`).join("")}</div>`;
  if ((x.tags || []).length) h += `<div class="chiprij" style="margin:10px 0">${x.tags.map(t => `<span class="chip">#${esc(t)}</span>`).join("")}</div>`;
  if (x.link) h += `<a class="knop breed rand" style="margin:10px 0" href="${esc(x.link)}" target="_blank" rel="noopener noreferrer">${ico("ketting")} Openen</a>`;
  h += sectie("Notities", null, `<button class="actie" data-act="lj-notitie" data-id="${x.id}">${x.notitie ? "Bewerken" : "Schrijven"}</button>`) +
    `<div class="card card-pad"><p class="${x.notitie ? "" : "klein"}" style="margin:0;white-space:pre-wrap">${x.notitie ? esc(x.notitie) : "Nog geen notities. Wat vond je ervan, wat wil je onthouden?"}</p></div>`;
  if ((x.keer || []).length) h += sectie("Eerder " + s.w[2].toLowerCase(), x.keer.length) + `<div class="card">${x.keer.slice().reverse().map(k => `<div class="lj-keer"><span>${esc(datumLabel(k.datum, true))}</span>${k.score ? ljSterren(k.score) : "<small>geen cijfer</small>"}</div>`).join("")}
    ${x.keer.some(k => k.score) && x.score ? `<p class="klein" style="margin:8px 14px 12px">${(() => { const eerst = x.keer.find(k => k.score).score; return x.score > eerst ? "Het wordt beter bij elke keer." : x.score < eerst ? "De eerste keer was het mooiste." : "Je oordeel is stabiel."; })()}</p>` : ""}</div>`;
  h += `<div class="knoprij" style="margin:16px 0 4px"><button class="knop rand" data-act="lj-bewerk" data-id="${x.id}">${ico("pen")} Bewerken</button>
    <button class="knop rand" data-act="lj-itemdeel" data-id="${x.id}">${ico("deel")} Aanraden</button></div>
    <div class="knoprij"><button class="knop gevaar" data-act="lj-weg" data-id="${x.id}">${ico("prullenbak")} Verwijderen</button></div>`;
  return h;
}

/* ---------- 81.10 Bladen: lijstje en ding bewerken ---------- */
function ljLijstBlad(id, soort) {
  const bestaand = id ? ljLijst(id) : null;
  const l = bestaand ? Object.assign({}, bestaand) : { id: uid(), naam: "", soort: soort || "film", emoji: "", volgorde: Date.now(), gemaakt: new Date().toISOString() };
  const teken2 = () => {
    $("#bladinhoud").innerHTML = `
      <div class="veld"><span class="labeltekst">Soort</span><div class="keuzerij">${Object.entries(LJ_SOORTEN).map(([k, s]) => `<button class="keuze" data-ljl-soort="${k}" aria-pressed="${l.soort === k}">${ico(s.ico, "width:15px;height:15px")} ${esc(s.naam)}</button>`).join("")}</div></div>
      <div class="veld"><label for="ljl-naam">Naam</label><input class="invoer" id="ljl-naam" value="${esc(l.naam)}" placeholder="${esc(ljSoort(l).naam)}" maxlength="40"></div>
      <div class="veld"><label for="ljl-emoji">Eigen icoon (emoji, mag leeg)</label><input class="invoer" id="ljl-emoji" value="${esc(l.emoji || "")}" placeholder="Bv. 🍿" maxlength="4" style="max-width:120px"></div>`;
  };
  bladOpen(bestaand ? "Lijstje bewerken" : "Nieuw lijstje", "", `<button class="knop breed primair" id="ljl-ok">${bestaand ? "Opslaan" : "Maken"}</button>`);
  teken2();
  $("#bladinhoud").addEventListener("click", e => {
    const b = e.target.closest("[data-ljl-soort]"); if (!b) return;
    l.naam = $("#ljl-naam").value; l.emoji = $("#ljl-emoji").value; l.soort = b.dataset.ljlSoort; teken2();
  });
  $("#ljl-ok").onclick = async () => {
    l.naam = ($("#ljl-naam").value || "").trim() || ljSoort(l).naam; l.emoji = ($("#ljl-emoji").value || "").trim();
    await bewaar("lj_lijsten", l); bladSluit();
    if (bestaand) { teken(); toast("Opgeslagen"); } else { tril(8); ga("lijstje", l.id); }
  };
}
async function ljMaakLijst(soort) {
  const s = LJ_SOORTEN[soort] || LJ_SOORTEN.eigen;
  if (soort === "eigen") return ljLijstBlad(null, "eigen");
  const l = { id: uid(), naam: s.naam, soort, emoji: "", volgorde: Date.now(), gemaakt: new Date().toISOString() };
  await bewaar("lj_lijsten", l); tril(8); ga("lijstje", l.id);
}
function ljItemBlad(id, lijstId, voor) {
  const bestaand = id ? vind("lj_items", id) : null;
  const x = bestaand ? JSON.parse(JSON.stringify(bestaand)) : ljNieuwItem(ljLijst(lijstId), Object.assign({ titel: "" }, voor || {}));
  x.tags = x.tags || []; x.gevoel = x.gevoel || [];
  let nieuweAfb = null, meerdere = false;
  const namen = [...new Set(S.personen.map(p => p.naam).concat(S.lj_items.map(y => y.tipVan)).filter(Boolean))].slice(0, 60);
  const keuze = (attr, lijst, huidig) => `<div class="keuzerij">${lijst.map(([k, n]) => `<button class="keuze" ${attr}="${k}" aria-pressed="${huidig === k}">${esc(n)}</button>`).join("")}</div>`;
  const teken2 = () => {
    const l = ljLijst(x.lijstId), s = ljSoort(l);
    const bi = $("#bladinhoud"), st = bi.scrollTop;
    requestAnimationFrame(() => { const b2 = $("#bladinhoud"); if (b2) b2.scrollTop = st; });
    if (meerdere) {
      bi.innerHTML = `<p class="klein" style="margin:0 0 10px">Eén per regel. Slim typen werkt ook hier: sterren, #tags, @naam, (jaar).</p>
        <div class="veld"><textarea class="invoer" id="ljm-regels" style="min-height:200px" placeholder="${esc(s.vb)}&#10;…"></textarea></div>
        <button class="knop klein rand" id="ljm-een">Toch één met details</button>`;
      return;
    }
    const afb = nieuweAfb ? URL.createObjectURL(nieuweAfb) : (() => { const b = x.afbeelding && vind("bijlagen", x.afbeelding); return b ? bijlageURL(b) : null; })();
    bi.innerHTML = `
      ${!bestaand ? `<button class="knop klein rand" id="ljm-meer" style="margin-bottom:10px">${ico("lijst", "width:15px;height:15px")} Meerdere tegelijk plakken</button>` : ""}
      <div class="lj-afbveld">${afb ? `<img src="${afb}" alt="">` : `<span>${ljIco(l)}</span>`}
        <div class="knoprij"><button class="knop klein rand" id="lji-foto">${ico("camera")} ${afb ? "Andere afbeelding" : "Poster of foto"}</button>${afb ? `<button class="knop klein rand" id="lji-fotoweg">${ico("x")} Weg</button>` : ""}</div></div>
      <div class="veld"><label for="lji-titel">Titel</label><input class="invoer" id="lji-titel" value="${esc(x.titel)}" placeholder="${esc(s.vb.replace(/\s[#@*!(0-9].*$/, ""))}"></div>
      ${ljLijsten().length > 1 ? `<div class="veld"><label for="lji-lijst">Lijstje</label><select class="invoer" id="lji-lijst">${ljLijsten().map(q => `<option value="${q.id}"${q.id === x.lijstId ? " selected" : ""}>${esc(q.naam)}</option>`).join("")}</select></div>` : ""}
      <div class="veld"><span class="labeltekst">Status</span>${keuze("data-lji-st", LJ_STATUS.map(k => [k, ljStatusNaam(l, k)]), x.status)}</div>
      ${x.status === "klaar" || x.score ? `<div class="veld"><span class="labeltekst">Sterren</span>${ljSterInvoer(x.score || 0, "data-lji-ster")}</div>` : ""}
      <div class="rij2"><div class="veld"><label for="lji-jaar">Jaar</label><input class="invoer" id="lji-jaar" inputmode="numeric" value="${x.jaar || ""}" placeholder="${ljJaar()}"></div>
        <div class="veld"><label for="lji-maker">${esc(s.maker)}</label><input class="invoer" id="lji-maker" value="${esc(x.maker || "")}"></div></div>
      <div class="veld"><label for="lji-waar">${esc(s.waarLabel || "Waar")}</label><input class="invoer" id="lji-waar" value="${esc(x.waar || "")}" list="lji-waarlijst"><datalist id="lji-waarlijst">${(s.waar || []).map(w => `<option value="${esc(w)}">`).join("")}</datalist></div>
      ${s.lengte || s.totaal ? `<div class="rij2">${s.lengte ? `<div class="veld"><label for="lji-lengte">${esc(s.lengte)}</label><input class="invoer" id="lji-lengte" inputmode="numeric" value="${x.lengte || ""}"></div>` : ""}
        ${s.totaal ? `<div class="veld"><label for="lji-totaal">${esc(s.totaal)}</label><input class="invoer" id="lji-totaal" inputmode="numeric" value="${x.totaal || ""}"></div>` : ""}</div>` : ""}
      ${x.status === "wil" ? `<div class="veld"><span class="labeltekst">Hoe graag?</span>${keuze("data-lji-zin", LJ_ZIN, x.zin)}</div>` : ""}
      <div class="veld"><span class="labeltekst">Sfeer</span>${keuze("data-lji-sfeer", LJ_SFEER, x.sfeer)}<small class="vg-hint">Wat nu? gebruikt dit om iets te kiezen dat past bij je dag.</small></div>
      <div class="veld"><label for="lji-tip">Tip van</label><input class="invoer" id="lji-tip" value="${esc(x.tipVan || "")}" list="lji-namen" placeholder="Wie raadde het aan?"><datalist id="lji-namen">${namen.map(n => `<option value="${esc(n)}">`).join("")}</datalist></div>
      <div class="veld"><label for="lji-tags">Tags (met komma's)</label><input class="invoer" id="lji-tags" value="${esc(x.tags.join(", "))}" placeholder="scifi, met vrienden"></div>
      <div class="veld"><label for="lji-link">Link</label><input class="invoer" id="lji-link" type="url" inputmode="url" value="${esc(x.link || "")}" placeholder="https://…"></div>
      <div class="veld"><label for="lji-not">Notities</label><textarea class="invoer" id="lji-not" style="min-height:70px">${esc(x.notitie || "")}</textarea></div>`;
  };
  bladOpen(bestaand ? "Bewerken" : `Nieuw in ${(ljLijst(x.lijstId) || {}).naam || "je lijstje"}`, "", `<button class="knop breed primair" id="lji-ok">${bestaand ? "Opslaan" : "Toevoegen"}</button>`);
  teken2();
  const lees = () => {
    if (meerdere) return;
    const w = s => ($(s) || {}).value;
    const v = s => (w(s) || "").trim();
    x.titel = v("#lji-titel"); if ($("#lji-lijst")) x.lijstId = w("#lji-lijst");
    x.jaar = parseInt(v("#lji-jaar"), 10) || null; x.maker = v("#lji-maker"); x.waar = v("#lji-waar");
    if ($("#lji-lengte")) x.lengte = parseInt(v("#lji-lengte"), 10) || null;
    if ($("#lji-totaal")) x.totaal = parseInt(v("#lji-totaal"), 10) || null;
    x.tipVan = v("#lji-tip"); x.tags = v("#lji-tags").split(",").map(t => t.trim().replace(/^#/, "").toLowerCase()).filter(Boolean);
    let u = v("#lji-link"); if (u && !/^https?:\/\//i.test(u)) u = "https://" + u; x.link = u; x.notitie = v("#lji-not");
  };
  $("#bladinhoud").addEventListener("click", e => {
    const t = e.target, g = a => t.closest(`[${a}]`);
    const st = g("data-lji-st"), ster = g("data-lji-ster"), zin = g("data-lji-zin"), sf = g("data-lji-sfeer");
    if (st) { lees(); x.status = st.dataset.ljiSt; teken2(); }
    else if (ster) { lees(); x.score = ljVolgendeScore(x.score || 0, +ster.dataset.ljiSter); teken2(); }
    else if (zin) { lees(); x.zin = x.zin === +zin.dataset.ljiZin ? 0 : +zin.dataset.ljiZin; teken2(); }
    else if (sf) { lees(); x.sfeer = x.sfeer === sf.dataset.ljiSfeer ? "" : sf.dataset.ljiSfeer; teken2(); }
    else if (t.closest("#ljm-meer")) { lees(); meerdere = true; $("#lji-ok").textContent = "Alles toevoegen"; teken2(); }
    else if (t.closest("#ljm-een")) { meerdere = false; $("#lji-ok").textContent = "Toevoegen"; teken2(); }
    else if (t.closest("#lji-foto")) {
      lees();
      const k = document.createElement("input"); k.type = "file"; k.accept = "image/*"; k.className = "verborgen"; document.body.appendChild(k);
      k.onchange = () => { if (k.files && k.files[0]) { nieuweAfb = k.files[0]; teken2(); } k.remove(); };
      k.click();
    } else if (t.closest("#lji-fotoweg")) { lees(); nieuweAfb = null; x.afbeelding = null; teken2(); }
  });
  $("#lji-ok").onclick = async () => {
    if (meerdere) {
      const l = ljLijst(x.lijstId), regels = ($("#ljm-regels").value || "").split(/\n+/).map(r => r.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "").trim()).filter(Boolean);
      if (!regels.length) { toast("Plak of typ minstens één regel"); return; }
      let n = 0;
      for (const r of regels) { const p = ljParse(r); if (!p.titel) continue; await bewaar("lj_items", Object.assign(ljNieuwItem(l, p), { volgorde: Date.now() + n })); n++; }
      bladSluit(); teken(); toast(`${ljMv(n, "ding", "dingen")} toegevoegd aan ${l.naam}`); return;
    }
    lees();
    if (!x.titel) { toast("Vul een titel in"); $("#lji-titel").focus(); return; }
    if (nieuweAfb && typeof wlAfbeelding === "function") { try { x.afbeelding = await wlAfbeelding(nieuweAfb); } catch (e) { toast("Deze afbeelding kon niet gelezen worden"); } }
    const oudStatus = bestaand ? bestaand.status : null;
    if (x.status === "wil") { x.gestart = null; x.afgerond = null; }
    if ((x.status === "bezig" || x.status === "klaar") && !x.gestart) x.gestart = vandaagISO();
    if (x.status === "klaar" && !x.afgerond) x.afgerond = vandaagISO();
    if (x.score && x.elo == null) x.elo = ljElo(x);
    x.bijgewerkt = new Date().toISOString();
    await bewaar("lj_items", x);
    if (oudStatus !== x.status && (x.status === "bezig" || x.status === "klaar")) await ljLog(x, `${ljStatusNaam(ljLijst(x.lijstId), x.status)}: ${x.titel}`);
    bladSluit();
    if (!bestaand) { tril(8); toast(`Op ${(ljLijst(x.lijstId) || {}).naam || "je lijstje"} gezet`, "Bekijken", () => ga("lijstitem", x.id), 5000); teken(); }
    else { teken(); toast("Opgeslagen"); }
  };
}
async function ljSnelToevoegen(lijstId) {
  const l = ljLijst(lijstId), inp = $("#lj-snel");
  if (!l || !inp) return;
  const p = ljParse(inp.value);
  if (!p.titel) { toast("Typ een titel"); inp.classList.add("rt-fout"); inp.focus(); setTimeout(() => inp.classList.remove("rt-fout"), 600); return; }
  const x = ljNieuwItem(l, p);
  if (x.score) x.elo = ljElo(x);
  await bewaar("lj_items", x);
  if (x.status !== "wil") await ljLog(x, `${ljStatusNaam(l, x.status)}: ${x.titel}${x.score ? " · " + ljCijfer(x.score) + "★" : ""}`);
  V.ljStatus[l.id] = x.status;
  tril(8); teken();
  const rij = document.querySelector(`[data-lj-rij="${x.id}"]`); if (rij) rij.classList.add("lj-in");
  toast(`${x.titel} staat bij ${ljStatusNaam(l, x.status).toLowerCase()}`, "Details", () => ljItemBlad(x.id), 5000);
  const n = $("#lj-snel"); if (n) n.focus();
}

/* ---------- 81.11 Wat nu? ----------
   Kandidaten: alles wat je wilt of waar je mee bezig bent. De score telt
   bezig (afmaken), hoe graag, sfeer, tijd, check-in-energie, wie het
   aanraadde en hoe lang het al wacht; een beetje toeval houdt het fris. */
const LJ_TIJD = [[30, "½ uur"], [60, "1 uur"], [120, "2 uur"], [0, "Maakt niet uit"]];
function ljKandidaten(o) {
  const energie = typeof dcEnergie === "function" ? dcEnergie() : null;
  return S.lj_items.filter(x => (x.status === "wil" || x.status === "bezig") && (!o.lijstId || x.lijstId === o.lijstId)).map(x => {
    const l = ljLijst(x.lijstId), s = ljSoort(l), r = [];
    let p = 20;
    if (x.status === "bezig") { p += 28; r.push("Je was er al mee bezig: afmaken geeft rust"); }
    if (x.zin) { p += x.zin * 8; if (x.zin === 3) r.push("Je wilde dit heel graag"); }
    if (o.sfeer && x.sfeer) { if (x.sfeer === o.sfeer) { p += 22; r.push(`Past bij je zin in iets ${(LJ_SFEER.find(z => z[0] === o.sfeer) || ["", ""])[1].toLowerCase()}s`); } else p -= 18; }
    const len = +x.lengte || 0, perSessie = !!s.totaal || !s.lengte;
    if (o.tijd && len && !perSessie) { if (len > o.tijd) return null; p += 8; r.push(`Past in je tijd (${duurTekst(len)})`); }
    else if (o.tijd && len && perSessie && len <= o.tijd) { p += 5; r.push(`Eén ${s.eenheid === "afl." ? "aflevering" : "keer"} past (${duurTekst(len)})`); }
    if (energie && energie <= 2) { if (x.sfeer === "licht") { p += 12; r.push("Licht, en je energie is vandaag laag"); } if (len > 120 && !perSessie) p -= 12; if (x.sfeer === "diep") p -= 8; }
    const tg = ljTipgever(x.tipVan);
    if (tg && tg.beoordeeld >= 2 && tg.gem >= 7) { p += 10; r.push(`Tip van ${x.tipVan}, en die tips vind je goed (${ljCijfer(tg.gem)}★)`); }
    else if (x.tipVan) { p += 3; r.push(`Tip van ${x.tipVan}`); }
    const dagen = ljDagen(x.gemaakt);
    if (dagen > 60) { p += Math.min(12, dagen / 30); r.push(`Staat al ${Math.round(dagen / 30)} maanden op je lijstje`); }
    p += Math.random() * 12;
    if (!r.length) r.push(`Van je lijstje ${l ? l.naam : ""}`);
    return { x, l, p, r };
  }).filter(Boolean).sort((a, b) => b.p - a.p);
}
function ljWatNu(lijstId) {
  const energie = typeof dcEnergie === "function" ? dcEnergie() : null, avond = new Date().getHours() >= 18;
  const o = { lijstId: lijstId || "", tijd: avond ? 120 : 60, sfeer: energie && energie <= 2 ? "licht" : "" };
  let lijst = [], pos = 0, anders = 0;
  const lijsten = ljLijsten().filter(l => ljItems(l.id).some(x => x.status === "wil" || x.status === "bezig"));
  const kiesRij = (attr, opties, huidig) => `<div class="keuzerij">${opties.map(([k, n]) => `<button class="keuze" ${attr}="${k}" aria-pressed="${String(huidig) === String(k)}">${esc(n)}</button>`).join("")}</div>`;
  const vorm = () => `
    ${lijsten.length > 1 ? `<div class="veld"><span class="labeltekst">Uit</span>${kiesRij("data-wn-l", [["", "Alle lijstjes"]].concat(lijsten.map(l => [l.id, l.naam])), o.lijstId)}</div>` : ""}
    <div class="veld"><span class="labeltekst">Hoeveel tijd heb je?</span>${kiesRij("data-wn-t", LJ_TIJD, o.tijd)}</div>
    <div class="veld"><span class="labeltekst">Waar heb je zin in?</span>${kiesRij("data-wn-s", [["", "Maakt niet uit"]].concat(LJ_SFEER), o.sfeer)}
      ${energie && typeof DC_ENERGIE !== "undefined" && DC_ENERGIE[energie - 1] ? `<small class="vg-hint">Je energie vandaag (check-in): ${esc(DC_ENERGIE[energie - 1].toLowerCase())}${energie <= 2 ? ", dus iets lichts staat bovenaan" : ""}.</small>` : ""}</div>
    <div class="lj-rad" id="wn-rad" aria-live="polite"></div>`;
  const toonKeuze = () => {
    const k = lijst[pos], rad = $("#wn-rad");
    if (!rad) return;
    if (!k) { rad.innerHTML = `<p class="klein" style="text-align:center">Niets gevonden dat past. Probeer meer tijd of een andere sfeer.</p>`; return; }
    rad.innerHTML = `<div class="card card-pad lj-keuze">
      <div class="lj-keuzekop">${ljDuim(k.x, k.l)}<div><span class="labeltekst">${esc(k.l ? k.l.naam : "")}</span><b class="lj-keuzetitel">${esc(k.x.titel)}</b><span class="lj-meta">${ljMeta(k.x, k.l)}</span></div></div>
      <ul class="lj-redenen">${k.r.slice(0, 3).map(t => `<li>${ico("check", "width:14px;height:14px")} ${esc(t)}</li>`).join("")}</ul>
      ${anders >= 3 && typeof kmStopHint === "function" ? `<p class="lj-inzicht lj-stophint">${ico("keuze", "width:16px;height:16px")} <span>${esc(kmStopHint())}</span></p>` : ""}
      <div class="knoprij"><button class="knop primair" id="wn-doe">${esc(k.x.status === "bezig" ? "Verder" : ljStatusNaam(k.l, "bezig"))}</button><button class="knop rand" id="wn-ander">Een andere</button></div></div>`;
  };
  const draai = () => {
    lijst = ljKandidaten(o); pos = 0;
    const top = lijst.slice(0, 5);
    if (top.length > 1) { const som = top.reduce((a, k) => a + Math.max(1, k.p), 0); let r = Math.random() * som; pos = top.findIndex(k => (r -= Math.max(1, k.p)) <= 0); if (pos < 0) pos = 0; }
    const rad = $("#wn-rad"); if (!rad) return;
    const stil = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (stil || lijst.length < 2) return toonKeuze();
    const namen = lijst.slice(0, 12).map(k => k.x.titel);
    let i = 0, wacht = 45;
    rad.innerHTML = `<div class="lj-rol"><span id="wn-rol"></span></div>`;
    const stap = () => {
      const el = $("#wn-rol"); if (!el) return;
      el.textContent = namen[i++ % namen.length]; el.classList.remove("tik"); void el.offsetWidth; el.classList.add("tik");
      tril(4); wacht *= 1.18;
      if (wacht < 320) setTimeout(stap, wacht); else setTimeout(toonKeuze, 260);
    };
    stap();
  };
  bladOpen("Wat nu?", vorm(), `<button class="knop breed primair" id="wn-kies">${ico("dobbel")} Kies voor me</button>`);
  const bi = $("#bladinhoud");
  bi.addEventListener("click", async e => {
    const t = e.target, l = t.closest("[data-wn-l]"), ti = t.closest("[data-wn-t]"), sf = t.closest("[data-wn-s]");
    if (l || ti || sf) {
      if (l) o.lijstId = l.dataset.wnL; if (ti) o.tijd = +ti.dataset.wnT; if (sf) o.sfeer = sf.dataset.wnS;
      bi.innerHTML = vorm(); if (lijst.length) { lijst = ljKandidaten(o); pos = 0; toonKeuze(); }
    } else if (t.closest("#wn-ander")) { anders++; pos = (pos + 1) % Math.max(1, lijst.length); toonKeuze(); }
    else if (t.closest("#wn-doe")) {
      const k = lijst[pos]; if (!k) return;
      if (k.x.status === "wil") await ljZetStatus(k.x, "bezig");
      bladSluit(); ga("lijstitem", k.x.id); toast("Veel plezier");
    }
  });
  $("#wn-kies").onclick = draai;
}

/* ---------- 81.12 Duels: je eigen ranglijst ---------- */
function ljDuel(lijstId) {
  const kandLijst = id => ljItems(id).filter(x => x.status === "klaar");
  if (!lijstId) { const best = ljLijsten().map(l => [l.id, kandLijst(l.id).length]).sort((a, b) => b[1] - a[1])[0]; lijstId = best && best[1] >= 2 ? best[0] : null; }
  if (!lijstId) { toast("Rond eerst minstens twee dingen af in een lijstje"); return; }
  let l = ljLijst(lijstId), ronde = 0, paar = null;
  const RONDES = 10, gezien = new Set(), start = {};
  kandLijst(l.id).forEach(x => { start[x.id] = ljElo(x); });
  const kies = () => {
    const pool = kandLijst(l.id); if (pool.length < 2) return null;
    const minD = Math.min(...pool.map(x => x.duels || 0));
    const a = pool.filter(x => (x.duels || 0) === minD).sort(() => Math.random() - .5)[0];
    const rest = pool.filter(x => x.id !== a.id && !gezien.has([a.id, x.id].sort().join("|"))).sort((p, q) => Math.abs(ljElo(p) - ljElo(a)) - Math.abs(ljElo(q) - ljElo(a)));
    const b = (rest.length ? rest : pool.filter(x => x.id !== a.id)).slice(0, 3).sort(() => Math.random() - .5)[0];
    return Math.random() < .5 ? [a, b] : [b, a];
  };
  const kaart = (x, kant) => `<button class="card lj-duelkaart" data-duel="${kant}">${ljDuim(x, l)}<b>${esc(x.titel)}</b><span class="lj-meta">${ljMeta(x, l)}</span>${x.score ? ljSterren(x.score) : ""}</button>`;
  const lijstKeuze = () => { const ls = ljLijsten().filter(q => kandLijst(q.id).length >= 2); return ls.length > 1 ? `<div class="chiprij scroll" style="margin-bottom:10px">${ls.map(q => `<button class="keuze" data-duel-l="${q.id}" aria-pressed="${q.id === l.id}">${esc(q.naam)}</button>`).join("")}</div>` : ""; };
  const tekenDuel = () => {
    paar = kies();
    const bi = $("#bladinhoud"); if (!bi) return;
    if (!paar || ronde >= RONDES) return tekenUitslag();
    bi.innerHTML = `${lijstKeuze()}<p class="lj-duelvraag">Wat vond je beter?</p>
      <div class="lj-duel">${kaart(paar[0], 0)}<span class="lj-vs">of</span>${kaart(paar[1], 1)}</div>
      <div class="knoprij" style="margin-top:12px"><button class="knop rand" data-duel="gelijk">Even goed</button><button class="knop rand" data-duel="stop">Klaar</button></div>
      <div class="lj-duelteller"><span style="width:${ronde / RONDES * 100}%"></span></div>`;
  };
  const tekenUitslag = () => {
    const bi = $("#bladinhoud"); if (!bi) return;
    teken();
    const rang = ljSorteer(kandLijst(l.id), "rang");
    const verrassing = rang.slice(0, 10).find((x, i) => x.score && rang.slice(i + 1).some(y => y.score > x.score));
    const stijger = rang.map(x => [x, ljElo(x) - (start[x.id] || ljElo(x))]).sort((a, b) => b[1] - a[1])[0];
    bi.innerHTML = `${lijstKeuze()}<p class="klein" style="margin:0 0 10px">${ronde ? `${ljMv(ronde, "duel", "duels")} gespeeld.` : ""} Dit is nu jouw top van ${esc(l.naam.toLowerCase())}:</p>
      <ol class="lj-top">${rang.slice(0, 10).map(x => `<li><span>${esc(x.titel)}</span>${x.score ? ljSterren(x.score) : ""}</li>`).join("")}</ol>
      ${verrassing ? `<p class="lj-inzicht">${ico("bliksem", "width:16px;height:16px")} <span><b>${esc(verrassing.titel)}</b> staat hoger dan je sterren doen vermoeden. In duels kies je er vaker voor.</span></p>` : ""}
      ${stijger && stijger[1] > 20 ? `<p class="lj-inzicht">${ico("grafiek", "width:16px;height:16px")} <span>Grootste stijger: <b>${esc(stijger[0].titel)}</b></span></p>` : ""}
      <div class="knoprij"><button class="knop primair" data-duel="meer">Nog 10 duels</button></div>`;
  };
  bladOpen("Duels", "", "");
  tekenDuel();
  $("#bladinhoud").addEventListener("click", async e => {
    const lk = e.target.closest("[data-duel-l]");
    if (lk) { l = ljLijst(lk.dataset.duelL); ronde = 0; kandLijst(l.id).forEach(x => { start[x.id] = ljElo(x); }); return tekenDuel(); }
    const b = e.target.closest("[data-duel]"); if (!b) return;
    const w = b.dataset.duel;
    if (w === "stop") return tekenUitslag();
    if (w === "meer") { ronde = 0; return tekenDuel(); }
    if (!paar) return;
    const [a, c] = paar, ea = ljElo(a), ec = ljElo(c), verw = 1 / (1 + Math.pow(10, (ec - ea) / 400));
    const uitslag = w === "gelijk" ? .5 : w === "0" ? 1 : 0, K = 32;
    a.elo = Math.round(ea + K * (uitslag - verw)); c.elo = Math.round(ec + K * ((1 - uitslag) - (1 - verw)));
    a.duels = (a.duels || 0) + 1; c.duels = (c.duels || 0) + 1;
    gezien.add([a.id, c.id].sort().join("|"));
    await bewaar("lj_items", a); await bewaar("lj_items", c);
    tril(6); ronde++;
    if (w !== "gelijk") { const kaartEl = b.closest(".lj-duelkaart"); if (kaartEl) { kaartEl.classList.add("wint"); await new Promise(r => setTimeout(r, 220)); } }
    tekenDuel();
  });
}

/* ---------- 81.13 Opruimen: nog steeds zin? ----------
   Oude wil-dingen één voor één. Rechts vegen = houden, links = weg,
   omhoog = heel graag. Alles is aan het eind in één tik terug te zetten. */
function ljOpruimen(lijstId) {
  const pool = S.lj_items.filter(x => x.status === "wil" && (!lijstId || x.lijstId === lijstId))
    .sort((a, b) => (ljStoffig(b) - ljStoffig(a)) || (a.gecheckt || a.gemaakt || "").localeCompare(b.gecheckt || b.gemaakt || "")).slice(0, 10);
  if (!pool.length) { toast("Er staat niets te wachten"); return; }
  let i = 0; const weg = [], houden = [], graag = [];
  const kaart = () => {
    const x = pool[i], l = ljLijst(x.lijstId), d = ljDagen(x.gemaakt);
    return `<div class="lj-stapel"><div class="card lj-ruimkaart" id="lj-ruim" data-id="${x.id}">
      ${ljDuim(x, l)}<b>${esc(x.titel)}</b><span class="lj-meta">${ljMeta(x, l)}</span>
      <span class="klein">${esc(l ? l.naam : "")} · ${d < 2 ? "net toegevoegd" : d < 60 ? `${d} dagen op je lijstje` : `${Math.round(d / 30)} maanden op je lijstje`}${x.tipVan ? ` · tip van ${esc(x.tipVan)}` : ""}</span>
      <span class="lj-veeg weg">Weg</span><span class="lj-veeg houd">Houden</span><span class="lj-veeg graag">Heel graag</span></div></div>
      <p class="klein" style="text-align:center;margin:10px 0">Nog steeds zin in? ${i + 1} van ${pool.length}</p>
      <div class="lj-ruimknoppen"><button class="knop rand" data-ruim="weg">${ico("x")} Weg</button><button class="knop rand" data-ruim="graag">${ico("hart")} Heel graag</button><button class="knop primair" data-ruim="houd">${ico("check")} Houden</button></div>`;
  };
  const klaar = () => {
    $("#bladinhoud").innerHTML = `<div class="lj-ruimklaar">${ico("bezem", "width:36px;height:36px;color:var(--accent)")}<b>Opgeruimd</b>
      <p class="klein">${[weg.length ? `${weg.length} weg` : "", houden.length ? `${houden.length} gehouden` : "", graag.length ? `${graag.length} heel graag` : ""].filter(Boolean).join(" · ") || "Niets veranderd"}</p>
      ${weg.length ? `<button class="knop rand" data-ruim="terug">${ico("herhaal")} Weggehaalde terugzetten</button>` : ""}</div>`;
    teken();
  };
  const doe = async (w, animatie) => {
    const x = pool[i]; if (!x) return;
    const el = $("#lj-ruim");
    if (el && animatie !== false && !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) { el.classList.add("uit-" + w); await new Promise(r => setTimeout(r, 230)); }
    if (w === "weg") { weg.push(JSON.parse(JSON.stringify(x))); await verwijder("lj_items", x.id); }
    else { x.gecheckt = new Date().toISOString(); if (w === "graag") { x.zin = 3; graag.push(x.id); } else houden.push(x.id); await bewaar("lj_items", x); }
    tril(6); i++;
    if (i >= pool.length) return klaar();
    $("#bladinhoud").innerHTML = kaart(); koppelVeeg();
  };
  const koppelVeeg = () => {
    const el = $("#lj-ruim"); if (!el) return;
    let x0 = 0, y0 = 0, dx = 0, dy = 0, aan = false;
    el.addEventListener("pointerdown", e => { aan = true; x0 = e.clientX; y0 = e.clientY; dx = dy = 0; el.setPointerCapture(e.pointerId); el.style.transition = "none"; });
    el.addEventListener("pointermove", e => {
      if (!aan) return; dx = e.clientX - x0; dy = e.clientY - y0;
      el.style.transform = `translate(${dx}px,${Math.min(0, dy)}px) rotate(${dx / 18}deg)`;
      el.dataset.richting = dy < -60 && Math.abs(dy) > Math.abs(dx) ? "graag" : dx > 50 ? "houd" : dx < -50 ? "weg" : "";
    });
    const los = () => {
      if (!aan) return; aan = false; el.style.transition = ""; const r = el.dataset.richting;
      if (r) doe(r); else { el.style.transform = ""; el.dataset.richting = ""; }
    };
    el.addEventListener("pointerup", los); el.addEventListener("pointercancel", los);
  };
  bladOpen("Opruimen", kaart(), "");
  koppelVeeg();
  $("#bladinhoud").addEventListener("click", async e => {
    const b = e.target.closest("[data-ruim]"); if (!b) return;
    if (b.dataset.ruim === "terug") { for (const x of weg) await bewaar("lj_items", x); toast(`${ljMv(weg.length, "ding", "dingen")} teruggezet`); weg.length = 0; bladSluit(); teken(); return; }
    doe(b.dataset.ruim);
  });
}

/* ---------- 81.14 Jouw jaar ---------- */
function ljJaarCijfers(jaar, lijstId) {
  const af = S.lj_items.filter(x => x.status === "klaar" && (x.afgerond || "").startsWith(jaar) && (!lijstId || x.lijstId === lijstId));
  const extra = S.lj_items.flatMap(x => (x.keer || []).filter(k => (k.datum || "").startsWith(jaar)).map(() => x)).filter(x => !lijstId || x.lijstId === lijstId);
  const maanden = Array.from({ length: 12 }, (_, m) => af.filter(x => +x.afgerond.slice(5, 7) === m + 1).length);
  const tags = {}, gevoel = {};
  af.forEach(x => { (x.tags || []).forEach(t => { tags[t] = (tags[t] || 0) + 1; }); (x.gevoel || []).forEach(g => { gevoel[g] = (gevoel[g] || 0) + 1; }); });
  let minuten = 0, blz = 0;
  af.forEach(x => { const s = ljSoort(ljLijst(x.lijstId)); if (s.totaal === "Bladzijden") blz += +x.totaal || 0; else if (s.totaal && x.lengte) minuten += (+x.lengte) * (+x.totaal || 1); else if (s.lengte && x.lengte) minuten += +x.lengte; });
  const beste = ljSorteer(af.filter(x => x.score), "cijfer")[0];
  const wacht = af.filter(x => x.gemaakt).map(x => [x, dagVerschil(x.afgerond, x.gemaakt.slice(0, 10))]).sort((a, b) => b[1] - a[1])[0];
  const per = {}; af.forEach(x => { per[x.lijstId] = (per[x.lijstId] || 0) + 1; });
  const tip = (() => { const p = {}; af.filter(x => x.tipVan && x.score).forEach(x => { const k = x.tipVan.toLowerCase(); (p[k] = p[k] || { naam: x.tipVan, n: 0, som: 0 }); p[k].n++; p[k].som += x.score; }); return Object.values(p).filter(q => q.n >= 2).sort((a, b) => b.som / b.n - a.som / a.n)[0]; })();
  return { af, extra, maanden, tags: Object.entries(tags).sort((a, b) => b[1] - a[1]), gevoel: Object.entries(gevoel).sort((a, b) => b[1] - a[1]), minuten, blz, beste, wacht, per, tip, gem: ljGem(af) };
}
function vwLjJaar() {
  const jaar = String(V.param || ljJaar()), lijstId = V.ljJaarLijst || "";
  const c = ljJaarCijfers(jaar, lijstId);
  const jaren = [...new Set(S.lj_items.filter(x => x.afgerond).map(x => x.afgerond.slice(0, 4)).concat([ljJaar()]))].sort().reverse();
  let h = "";
  if (jaren.length > 1) h += `<div class="chiprij scroll">${jaren.map(j => `<button class="keuze" data-act="ga" data-view="ljjaar" data-param="${j}" aria-pressed="${j === jaar}">${j}</button>`).join("")}</div>`;
  const ls = ljLijsten().filter(l => S.lj_items.some(x => x.lijstId === l.id && (x.afgerond || "").startsWith(jaar)));
  if (ls.length > 1) h += `<div class="chiprij scroll" style="margin-top:8px">${[["", "Alles"]].concat(ls.map(l => [l.id, l.naam])).map(([k, n]) => `<button class="keuze" data-act="lj-jaarlijst" data-id="${k}" aria-pressed="${lijstId === k}">${esc(n)}</button>`).join("")}</div>`;
  if (!c.af.length) return h + `<div class="card">${leeg("", `Nog niets afgerond in ${jaar}`, "Alles wat je afrondt, komt hier samen: per maand, je smaak en je hoogtepunten.")}</div>`;
  const max = Math.max(1, ...c.maanden), nuM = jaar === ljJaar() ? new Date().getMonth() : 12;
  h += `<div class="card lj-held lj-jaarheld">
    <span class="labeltekst">${jaar}</span>
    <div class="lj-jaargetal">${c.af.length}</div><span class="klein">${lijstId && ljLijst(lijstId) ? esc(ljLijst(lijstId).naam.toLowerCase()) : "dingen van je lijstjes"} afgerond${c.extra.length ? ` · ${c.extra.length}× opnieuw` : ""}</span>
    <div class="lj-heldcijfers">
      <div><b>${c.gem ? ljCijfer(c.gem) : "—"}</b><span>gemiddeld ★</span></div>
      ${c.minuten ? `<div><b>${Math.round(c.minuten / 60).toLocaleString("nl-NL")}</b><span>uur kijken en luisteren</span></div>` : ""}
      ${c.blz ? `<div><b>${c.blz.toLocaleString("nl-NL")}</b><span>bladzijden</span></div>` : ""}
    </div></div>`;
  h += sectie("Per maand") + `<div class="card card-pad"><div class="lj-maanden" role="img" aria-label="Afgerond per maand: ${c.maanden.map((n, m) => `${["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"][m]} ${n}`).join(", ")}">${c.maanden.map((n, m) => `<div class="lj-maand${m === nuM ? " nu" : ""}${m > nuM ? " later" : ""}"><span class="lj-maandn">${n || ""}</span><i style="height:${Math.round(n / max * 100)}%"></i><small>${"jfmamjjasond"[m]}</small></div>`).join("")}</div></div>`;
  const hoogte = [];
  if (c.beste) hoogte.push(["ster", "Beste van het jaar", `${esc(c.beste.titel)} ${ljSterren(c.beste.score)}`]);
  if (c.wacht && c.wacht[1] > 30) hoogte.push(["tijd", "Het langst gewacht", `${esc(c.wacht[0].titel)} · ${Math.round(c.wacht[1] / 30)} maanden op je lijstje`]);
  if (c.tip) hoogte.push(["persoon", "Beste tipgever", `${esc(c.tip.naam)} · gem. ${ljCijfer(c.tip.som / c.tip.n)}★ over ${c.tip.n} tips`]);
  if (c.gevoel.length) hoogte.push(["hart", "Wat het vaakst met je deed", `${esc(c.gevoel[0][0])} (${c.gevoel[0][1]}×)`]);
  const topMaand = c.maanden.indexOf(Math.max(...c.maanden));
  if (c.af.length >= 4) hoogte.push(["grafiek", "Je drukste maand", `${["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"][topMaand]} (${c.maanden[topMaand]})`]);
  if (hoogte.length) h += sectie("Hoogtepunten") + `<div class="card lj-hoogte">${hoogte.map(([i, k, v]) => `<div>${ico(i, "width:18px;height:18px;color:var(--accent)")}<span><small>${k}</small><b>${v}</b></span></div>`).join("")}</div>`;
  if (c.tags.length) { const tmax = c.tags[0][1]; h += sectie("Je smaak") + `<div class="card card-pad lj-smaak">${c.tags.slice(0, 6).map(([t, n]) => `<div><span>#${esc(t)}</span><i style="width:${Math.round(n / tmax * 100)}%"></i><b>${n}</b></div>`).join("")}</div>`; }
  if (!lijstId && Object.keys(c.per).length > 1) h += sectie("Per lijstje") + `<div class="card">${Object.entries(c.per).sort((a, b) => b[1] - a[1]).map(([id, n]) => { const l = ljLijst(id); return l ? `<button class="lj-rijhoofd lj-perlijst" data-act="ga" data-view="lijstje" data-param="${id}">${ljIco(l, "width:18px;height:18px")}<span class="lj-naam">${esc(l.naam)}</span><b>${n}</b></button>` : ""; }).join("")}</div>`;
  h += `<button class="knop breed primair" style="margin-top:14px" data-act="lj-jaardeel" data-j="${jaar}">${ico("deel")} Deel je jaar</button>`;
  return h;
}
function ljJaarTekst(jaar) {
  const c = ljJaarCijfers(jaar, V.ljJaarLijst || "");
  const r = [`Mijn ${jaar} in lijstjes`, `${c.af.length} afgerond${c.gem ? `, gemiddeld ${ljCijfer(c.gem)} sterren` : ""}`];
  Object.entries(c.per).sort((a, b) => b[1] - a[1]).forEach(([id, n]) => { const l = ljLijst(id); if (l) r.push(`• ${l.naam}: ${n}`); });
  if (c.beste) r.push(`Beste: ${c.beste.titel} (${ljCijfer(c.beste.score)}★)`);
  const top = ljSorteer(c.af.filter(x => x.score), "cijfer").slice(0, 5);
  if (top.length > 1) { r.push("", "Top " + top.length + ":"); top.forEach((x, i) => r.push(`${i + 1}. ${x.titel}${x.jaar ? ` (${x.jaar})` : ""} ${"★".repeat(Math.floor(x.score / 2))}${x.score % 2 ? "½" : ""}`)); }
  return r.join("\n");
}

/* ---------- 81.15 Delen ---------- */
async function ljDeelTekst(tekst, titel) {
  try { if (navigator.share) { await navigator.share({ title: titel, text: tekst }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(tekst); toast("Tekst gekopieerd"); } catch (e) { bladOpen(titel, `<textarea class="invoer" style="min-height:220px" readonly>${esc(tekst)}</textarea>`, ""); }
}
function ljDeelBlad(l) {
  const it = ljItems(l.id), s = ljSoort(l);
  const sterTekst = x => x.score ? " " + "★".repeat(Math.floor(x.score / 2)) + (x.score % 2 ? "½" : "") : "";
  const regel = x => `${x.titel}${x.jaar ? ` (${x.jaar})` : ""}${sterTekst(x)}`;
  bladOpen(`${l.naam} delen`, `<div class="lj-deelopties">
    <button class="card" data-deel="top">${ico("trofee")}<span><b>Mijn top 10</b><small>Op cijfer en duels</small></span></button>
    <button class="card" data-deel="wil">${ico("lijst")}<span><b>${esc(s.w[0])}</b><small>Handig als iemand een cadeau zoekt</small></span></button>
    <button class="card" data-deel="alles">${ico("doc")}<span><b>Hele lijst</b><small>Alles, per status</small></span></button>
    <button class="card" data-deel="csv">${ico("download")}<span><b>CSV-bestand</b><small>Voor Excel, Numbers of Letterboxd-achtige apps</small></span></button></div>`, "");
  $("#bladinhoud").addEventListener("click", async e => {
    const b = e.target.closest("[data-deel]"); if (!b) return;
    const w = b.dataset.deel;
    if (w === "csv") {
      const q = v => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
      const kop = ["Titel", "Status", "Sterren", "Jaar", s.maker, s.waarLabel || "Waar", "Tags", "Tip van", "Toegevoegd", "Afgerond", "Notitie"];
      const rijen = it.map(x => [x.titel, ljStatusNaam(l, x.status), x.score ? x.score / 2 : "", x.jaar || "", x.maker, x.waar, (x.tags || []).join(" "), x.tipVan, (x.gemaakt || "").slice(0, 10), x.afgerond || "", x.notitie].map(q).join(";"));
      bladSluit(); await deelOfDownload(`${l.naam.replace(/[^\p{L}\p{N} _-]/gu, "")}.csv`, "﻿" + [kop.map(q).join(";")].concat(rijen).join("\n"), "text/csv;charset=utf-8"); return;
    }
    let tekst;
    if (w === "top") { const t = ljSorteer(it.filter(x => x.status === "klaar"), it.some(x => x.duels) ? "rang" : "cijfer").slice(0, 10); tekst = `Mijn top ${t.length} ${l.naam.toLowerCase()}\n` + t.map((x, i) => `${i + 1}. ${regel(x)}`).join("\n"); }
    else if (w === "wil") tekst = `${l.naam}: ${s.w[0].toLowerCase()}\n` + ljSorteer(it.filter(x => x.status === "wil"), "zin").map(x => "• " + regel(x)).join("\n");
    else tekst = [l.naam].concat(["bezig", "wil", "klaar"].filter(st => it.some(x => x.status === st)).map(st => `\n${ljStatusNaam(l, st)}:\n` + ljSorteer(it.filter(x => x.status === st), st === "klaar" ? "cijfer" : "zin").map(x => "• " + regel(x)).join("\n"))).join("\n");
    bladSluit(); await ljDeelTekst(tekst, l.naam);
  });
}

/* ---------- 81.16 Acties ---------- */
document.addEventListener("click", async e => {
  const el = e.target.closest && e.target.closest("[data-act^='lj-']");
  if (!el) return;
  const id = el.dataset.id, x = id ? vind("lj_items", id) : null;
  switch (el.dataset.act) {
    case "lj-maak": await ljMaakLijst(el.dataset.soort); break;
    case "lj-nieuwlijst": ljLijstBlad(null); break;
    case "lj-lijstbewerk": ljLijstBlad(id); break;
    case "lj-lijstweg": {
      const l = ljLijst(id); if (!l) break;
      bevestigVerwijderen(async () => { for (const y of ljItems(l.id)) { await verwijder("lj_items", y.id); if (y.afbeelding) await verwijder("bijlagen", y.afbeelding); } await verwijder("lj_lijsten", l.id); terug(); toast(`${l.naam} verwijderd`); });
      break;
    }
    case "lj-toevoegen": await ljSnelToevoegen(id); break;
    case "lj-details": { const inp = $("#lj-snel"), p = ljParse(inp ? inp.value : ""); ljItemBlad(null, id, p.titel ? p : {}); break; }
    case "lj-status": V.ljStatus[id] = el.dataset.s; teken(); break;
    case "lj-tag": V.ljTag[id] = V.ljTag[id] === el.dataset.t ? "" : el.dataset.t; teken(); break;
    case "lj-meer": V.ljAlles[el.dataset.k] = true; teken(); break;
    case "lj-begin": if (x) { await ljZetStatus(x, "bezig"); teken(); toast(`${ljStatusNaam(ljLijst(x.lijstId), "bezig")}: ${x.titel}`); } break;
    case "lj-klaar": if (x) await ljKlaar(x, el); break;
    case "lj-zet": if (x) { if (el.dataset.s === "klaar") await ljKlaar(x, el); else { await ljZetStatus(x, el.dataset.s); teken(); } } break;
    case "lj-plus": case "lj-min": {
      if (!x) break;
      x.stand = Math.max(0, (x.stand || 0) + (el.dataset.act === "lj-plus" ? 1 : -1));
      if (x.totaal) x.stand = Math.min(x.totaal, x.stand);
      x.bijgewerkt = new Date().toISOString();
      if (x.status === "wil" && x.stand) { await ljZetStatus(x, "bezig", true); }
      await bewaar("lj_items", x); tril(5);
      if (x.totaal && x.stand >= x.totaal && x.status !== "klaar") { await ljKlaar(x, el); break; }
      teken(); break;
    }
    case "lj-stand": if (x) bladVraag(`Waar ben je? (${ljSoort(ljLijst(x.lijstId)).eenheid || "stand"})`, String(x.stand || ""), x.totaal ? `0 – ${x.totaal}` : "Bv. 12", async w => {
      const n = parseInt(w, 10); if (!(n >= 0)) return; x.stand = x.totaal ? Math.min(x.totaal, n) : n; x.bijgewerkt = new Date().toISOString();
      if (x.status === "wil" && n) await ljZetStatus(x, "bezig", true);
      await bewaar("lj_items", x); if (x.totaal && x.stand >= x.totaal && x.status !== "klaar") return ljKlaar(x); teken();
    }); break;
    case "lj-opnieuw": if (x) {
      x.keer = x.keer || []; x.keer.push({ datum: x.afgerond || vandaagISO(), score: x.score || 0 });
      x.afgerond = vandaagISO(); await bewaar("lj_items", x);
      await ljLog(x, `Opnieuw ${ljStatusNaam(ljLijst(x.lijstId), "klaar").toLowerCase()}: ${x.titel}`);
      teken(); ljBeoordeelBlad(x);
    } break;
    case "lj-beoordeel": if (x) ljBeoordeelBlad(x); break;
    case "lj-notitie": if (x) bladVraag("Notities", x.notitie || "", "Wat vond je ervan? Wat wil je onthouden?", async w => { x.notitie = w; await bewaar("lj_items", x); teken(); }, true); break;
    case "lj-bewerk": if (x) ljItemBlad(x.id); break;
    case "lj-weg": if (x) bevestigVerwijderen(async () => { await verwijder("lj_items", x.id); if (x.afbeelding) await verwijder("bijlagen", x.afbeelding); if (V.view === "lijstitem") terug(); else teken(); toast("Verwijderd"); }); break;
    case "lj-itemdeel": if (x) {
      const l = ljLijst(x.lijstId);
      const t = [`${x.titel}${x.jaar ? ` (${x.jaar})` : ""}`, x.score ? `Mijn oordeel: ${"★".repeat(Math.floor(x.score / 2))}${x.score % 2 ? "½" : ""}` : "", x.citaat ? `“${x.citaat}”` : "", x.link || ""].filter(Boolean).join("\n");
      await ljDeelTekst(t, l ? l.naam : "Lijstjes");
    } break;
    case "lj-watnu": if (!S.lj_items.some(y => y.status === "wil" || y.status === "bezig")) toast("Zet eerst iets op een lijstje"); else ljWatNu(id); break;
    case "lj-duel": ljDuel(id); break;
    case "lj-opruim": ljOpruimen(id); break;
    case "lj-delen": { const l = ljLijst(id); if (l) ljDeelBlad(l); break; }
    case "lj-jaardoel": {
      const l = ljLijst(id); if (!l || typeof vgOpen !== "function" || typeof vgDoelBlad !== "function") break;
      const al = ljItems(l.id).filter(y => y.status === "klaar" && (y.afgerond || "").startsWith(ljJaar())).length;
      vgOpen("doelen");
      vgDoelBlad({ soort: "bron", bron: "lijstjes.klaar." + l.id, periode: "jaar", naam: `${Math.max(12, al + 6)} ${l.naam.toLowerCase()} in ${ljJaar()}`, gebied: "groei", start: 0, doel: Math.max(12, al + 6), deadline: ljJaar() + "-12-31" });
      break;
    }
    case "lj-jaarlijst": V.ljJaarLijst = id || ""; teken(); break;
    case "lj-jaardeel": await ljDeelTekst(ljJaarTekst(el.dataset.j), `Mijn ${el.dataset.j} in lijstjes`); break;
  }
});
/* Sterren op de detailpagina: meteen bewaren. */
document.addEventListener("click", async e => {
  const b = e.target.closest && e.target.closest("[data-lj-ster]");
  if (!b || V.view !== "lijstitem") return;
  const x = vind("lj_items", V.param); if (!x) return;
  x.score = ljVolgendeScore(x.score || 0, +b.dataset.ljSter);
  if (x.score && x.elo == null) x.elo = ljElo(x);
  await bewaar("lj_items", x); tril(5); teken();
});
RT_NA.push(() => {
  if (V.view !== "lijstje") return;
  const inp = $("#lj-snel"), pv = $("#lj-preview"), so = $("#lj-sort"), l = ljLijst(V.param);
  if (inp && pv && l) {
    const upd = () => { const p = ljParse(inp.value); pv.innerHTML = inp.value.trim() ? ljParseChips(p, l) : ""; };
    inp.oninput = upd;
    inp.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); ljSnelToevoegen(l.id); } };
  }
  if (so) so.onchange = async () => { await zetInst("ljSort_" + so.dataset.id, so.value); teken(); };
});

/* ---------- 81.17 Ingangen: Nieuw, Persoonlijk en Meer (drie routes) ---------- */
function ljTussenstand() {
  const bz = S.lj_items.filter(x => x.status === "bezig").length, af = S.lj_items.filter(x => x.status === "klaar" && (x.afgerond || "").startsWith(ljJaar())).length;
  return [bz ? `${bz} bezig` : "", af ? `${af} afgerond dit jaar` : ""].filter(Boolean).join(" · ") || "Films, series, boeken en meer";
}
{
  const _s = vwStart;
  vwStart = function () {
    let h = _s.apply(this, arguments);
    if (h.includes('data-view="lijstjes"')) return h;
    const tegel = catKnop({ view: "lijstjes", ill: "lijstjes", naam: "Lijstjes", uitleg: ljTussenstand(), kleur: LJ_KLEUR, telling: S.lj_items.filter(x => x.status === "bezig").length || "" });
    const i = h.indexOf('data-view="hobbyskills"'), j = i < 0 ? -1 : h.indexOf("</button>", i);
    return j < 0 ? h : h.slice(0, j + 9) + tegel + h.slice(j + 9);
  };
}
if (typeof vwPersoonlijk === "function") {
  const _p = vwPersoonlijk;
  vwPersoonlijk = function () {
    const h = _p.apply(this, arguments);
    const strip = `<button class="startstrip" data-act="ga" data-view="lijstjes">
      ${ico("lijstjes", "width:20px;height:20px;color:var(--muted)")}
      <span class="nm">Lijstjes: ${esc(ljTussenstand())}</span>
      ${ico("pijlr", "width:16px;height:16px;color:var(--line2)")}</button>`;
    const i = h.lastIndexOf('<button class="startstrip"');
    if (i < 0) return h + strip;
    const j = h.indexOf("</button>", i) + 9;
    return h.slice(0, j) + strip + h.slice(j);
  };
}
{
  const _meer = vwMeer;
  vwMeer = function () {
    const h = _meer.apply(this, arguments);
    const kaart = `<button class="menu-kaart" data-act="ga" data-view="lijstjes">${ico("lijstjes")}<span class="nm">Lijstjes</span><span class="ds">Films, series, boeken en meer</span></button>`;
    const i = h.indexOf('data-view="hobbyskills"');
    if (i < 0) return h;
    const j = h.indexOf("</button>", i) + 9;
    return h.slice(0, j) + kaart + h.slice(j);
  };
}

/* ---------- 81.18 Voortgang: afgerond, totaal en per lijstje ---------- */
if (typeof vgAutoBronnen === "function") {
  const _vg = vgAutoBronnen;
  vgAutoBronnen = function () {
    const uit = _vg();
    uit.push({ id: "lijstjes.klaar", naam: "Lijstjes: afgerond", eenheid: "aantal", agg: "som", gebied: "groei", richting: "omhoog", data: () => S.lj_items.flatMap(x => (x.status === "klaar" && x.afgerond ? [{ d: x.afgerond, v: 1 }] : []).concat((x.keer || []).map(k => ({ d: k.datum, v: 1 })))) });
    ljLijsten().forEach(l => uit.push({ id: "lijstjes.klaar." + l.id, naam: `${l.naam}: ${ljSoort(l).w[2].toLowerCase()}`, eenheid: "aantal", agg: "som", gebied: "groei", richting: "omhoog",
      data: () => ljItems(l.id).filter(x => x.status === "klaar" && x.afgerond).map(x => ({ d: x.afgerond, v: 1 })) }));
    return uit;
  };
  if (typeof VG_MP_TEKST === "object") VG_MP_TEKST["lijstjes.klaar"] = n => `${nwoGetal(n)} dingen van je lijstjes afgerond`;
}
