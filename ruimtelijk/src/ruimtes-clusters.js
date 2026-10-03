"use strict";
// === SECTIE 94: RUIMTES IN VIJF CLUSTERS, MEER IN VIJF REGELS (V4) ===
/* ==========================================================================
   Conceptvoorstel V4, besluit Kas 2 oktober 2026.
   - Ruimtes: bovenaan "Voor jou, nu" (drie ruimtes met live status, gekozen
     op patronen, energie en tijdstip), daaronder vijf clusters, één
     tegelijk open. Met Vaste indeling (Mijn aanpak) verschuift er niets:
     dan staan er vaste drie bovenaan.
   - Meer: vijf regels (Voortgang, Profiel, Instellingen, Gegevens, Help),
     met bovenaan direct exporteren en importeren van alle gegevens (vraag
     Kas 3 oktober). De rest staat onder "Alle schermen" (ingeklapt), zodat
     elk scherm bereikbaar blijft.

   De kern (NATE-RUIMTES-BEGIN/EINDE) is puur en wordt getest in tests/aanpak.test.mjs.
   ========================================================================== */

/* NATE-RUIMTES-BEGIN */
const RV_CLUSTERS = [
  { id: "thuis", naam: "Thuis en spullen", ruimtes: ["huishouden", "lijstjes", "wishlist"] },
  { id: "lichaam", naam: "Lichaam en rust", ruimtes: ["anker", "gezondheid", "gewoontes", "dagboek", "roken"] },
  { id: "geld", naam: "Geld", ruimtes: ["financieel"] },
  { id: "mensen", naam: "Mensen en werk", ruimtes: ["persoonlijk", "werk", "personen"] },
  { id: "groeien", naam: "Groeien en maken", ruimtes: ["sidehustles", "hobbyskills", "keuze", "tijd"] }
];
const RV_VAST = ["persoonlijk", "huishouden", "anker"];
// Welke ruimtes passen bij een patroon (bijlage A van het conceptvoorstel).
const RV_PATROON = { P1: ["persoonlijk", "werk"], P2: ["sidehustles", "hobbyskills"], P3: ["anker", "dagboek"], P4: ["lijstjes"],
  P5: ["anker", "dagboek"], P6: ["huishouden", "gewoontes"], P7: ["anker", "gezondheid"] };
const RV_DAGDEEL = { ochtend: ["persoonlijk", "werk", "gewoontes"], middag: ["huishouden", "financieel", "werk"], avond: ["dagboek", "lijstjes", "anker"], nacht: ["anker", "dagboek"] };

/**
 * Drie ruimtes voor nu. ctx: { open: {ruimte: aantal open dingen}, patronen: ["P1",…], energie: 1–5 of null, dagdeel, vast }.
 * Punten: open dingen (max 3), patroon +2, dagdeel +1, lage energie +3 voor rust. Gelijke stand: vaste volgorde.
 */
function rvVoorJou(alle, ctx) {
  const c = ctx || {};
  if (c.vast) return RV_VAST.filter(r => alle.includes(r));
  const pat = new Set((c.patronen || []).flatMap(p => RV_PATROON[p] || []));
  const dd = new Set(RV_DAGDEEL[c.dagdeel] || []), laag = c.energie != null && c.energie <= 2;
  const punten = r => Math.min(3, (c.open || {})[r] || 0) + (pat.has(r) ? 2 : 0) + (dd.has(r) ? 1 : 0) + (laag && ["anker", "dagboek"].includes(r) ? 3 : 0);
  return alle.map((r, i) => ({ r, p: punten(r), i })).sort((a, b) => b.p - a.p || a.i - b.i).slice(0, 3).map(x => x.r);
}
/* NATE-RUIMTES-EINDE */

/* ---------- 94.1 Live status per ruimte ---------- */
const rvVeilig = f => { try { return f(); } catch (e) { return null; } };
function rvStatus(view) {
  const v = vandaagISO();
  switch (view) {
    case "persoonlijk": { const n = fmVandaagTaken().open.length; return n ? [n, `${n} ${n === 1 ? "taak" : "taken"} vandaag`] : [0, "Niets open vandaag"]; }
    case "werk": { const n = +werkTelling() || 0; return [n, n ? `${n} vandaag` : ""]; }
    case "gewoontes": { const g = gewoontesVoor(v), af = g.filter(x => gewoonteAf(x.id, v)).length; return g.length ? [g.length - af, `${af} van ${g.length} vandaag`] : [0, ""]; }
    case "dagboek": return S.dagboek.some(d => d.datum === v) ? [0, "Vandaag geschreven"] : [1, "Nog niets vandaag"];
    case "wishlist": { const n = wlAlle("actief").length; return [0, n ? `${n} op je lijst` : ""]; }
    case "financieel": return geldTelling() === "!" ? [2, "Let op je dagbudget"] : [0, ""];
    case "hobbyskills": { const n = +hsTelling() || 0; return [n, n ? `${n} bezig` : ""]; }
    case "sidehustles": return [shTelling() ? 1 : 0, ""];   // getal staat als badge
    case "gezondheid": return [vsTelling() ? 1 : 0, ""];
    case "anker": return [0, "Eén minuut landen"];
  }
  return [0, ""];
}
function rvDagdeel() { const u = new Date().getHours(); return u < 6 ? "nacht" : u < 12 ? "ochtend" : u < 18 ? "middag" : "avond"; }

/* ---------- 94.2 Het scherm Ruimtes ---------- */
function rvKamerHTML(r, groot) {
  const st = rvVeilig(() => rvStatus(r.view)) || [0, ""], tel = rvVeilig(() => r.telling ? r.telling() : "");
  return `<button class="card nv-kamer${groot ? " rv-groot" : ""}" data-act="ga" data-view="${r.view}">
    <span class="nv-kamer-ico" aria-hidden="true">${ico(r.ico)}</span><span class="nv-kamer-tekst"><b>${esc(r.naam)}</b><small>${esc(st[1] || r.uitleg)}</small></span>${!st[1] && tel ? `<span class="nv-telling">${esc(String(tel))}</span>` : ""}</button>`;
}
vwRuimtes = function () {
  const per = Object.fromEntries(NV_RUIMTES.map(r => [r.view, r])), alle = NV_RUIMTES.map(r => r.view);
  const ap = typeof apNu === "function" ? apNu() : { top: [] }, vast = !!inst("vasteIndeling", false);
  const open = {}; for (const v of alle) open[v] = (rvVeilig(() => rvStatus(v)) || [0])[0];
  const nu = rvVoorJou(alle, { open, patronen: ap.top.map(c => c.id), energie: rvVeilig(() => dcEnergie()), dagdeel: rvDagdeel(), vast });
  const gekozen = V.rvOpen === undefined ? null : V.rvOpen;
  let h = `<section class="rv-nu" aria-label="Voor jou, nu"><h2 class="labeltekst">${vast ? "Vast bovenaan" : "Voor jou, nu"}</h2>
    <div class="nv-kamers rv-nu-lijst">${nu.map(v => rvKamerHTML(per[v], true)).join("")}</div>
    ${vast ? "" : `<details class="iv-waarom"><summary>Waarom deze drie?</summary><p>Nate kijkt naar wat er open staat, je patronen, je energie en het tijdstip (praktisch: nog een experiment). Wil je dat niets verschuift, zet dan Vaste indeling aan in Mijn aanpak.</p></details>`}</section>`;
  h += RV_CLUSTERS.map(c => {
    const kamers = c.ruimtes.filter(v => per[v]), isOpen = gekozen === c.id;
    return `<section class="rv-cluster${isOpen ? " open" : ""}">
      <button type="button" class="rv-kop" data-rv="${c.id}" aria-expanded="${isOpen}"><b>${esc(c.naam)}</b><small>${kamers.map(v => esc(per[v].naam)).join(" · ")}</small>${ico("pijlr", "width:16px;height:16px")}</button>
      ${isOpen ? `<div class="nv-kamers">${kamers.map(v => rvKamerHTML(per[v])).join("")}</div>` : ""}</section>`;
  }).join("");
  return h;
};
document.addEventListener("click", e => {
  const k = e.target.closest && e.target.closest("[data-rv]"); if (!k) return;
  e.preventDefault(); e.stopImmediatePropagation();
  V.rvOpen = V.rvOpen === k.dataset.rv ? null : k.dataset.rv;   // één cluster tegelijk open
  teken();
  const doel = document.querySelector(`[data-rv="${k.dataset.rv}"]`); if (doel) doel.focus({ preventScroll: true });
}, true);

/* ---------- 94.3 Meer: vijf regels, met gegevens bovenaan ---------- */
function rvGegevensHTML() {
  const l = inst("laatsteBackup", null), d = l ? new Date(l) : null;
  return `<section class="card card-pad rv-gegevens" aria-label="Je gegevens">
    <span class="labeltekst">Je gegevens</span>
    <p class="klein">Alles staat alleen op dit toestel. Laatste export: ${d ? `${esc(datumLabel(dISO(d)).toLowerCase())} om ${pad(d.getHours())}:${pad(d.getMinutes())}` : "nog nooit"}.</p>
    <div class="rv-gegevens-knoppen">
      <button class="knop primair" data-act="backup-json" data-bijlagen="1">${ico("download")} Alles exporteren</button>
      <button class="knop rand" data-rvg="import">${ico("upload")} Importeren</button>
    </div>
    <p class="klein">Exporteren maakt één bestand met al je gegevens, inclusief foto's en bijlagen. Bewaar het in Bestanden of iCloud.</p>
  </section>`;
}
function rvImportBlad() {
  bladOpen("Gegevens importeren", `<p>Kies een exportbestand van Brain-Mate Nate (of een oude FutureMe-back-up).</p>
    <div class="card">
      <button class="rijknop" data-act="backup-import" data-modus="samenvoegen">${ico("upload", "width:20px;height:20px;color:var(--accent)")}
        <span class="nm">Samenvoegen<span class="klein" style="display:block">Voegt toe wat ontbreekt en houdt wat er al is</span></span></button>
      <button class="rijknop" data-act="backup-import" data-modus="vervangen">${ico("upload", "width:20px;height:20px;color:var(--red)")}
        <span class="nm">Alles vervangen<span class="klein" style="display:block">Wist wat er nu staat en zet het bestand terug</span></span></button>
    </div>
    <p class="klein">Twijfel je? Kies Samenvoegen: wat er al staat, blijft staan.</p>`);
}
document.addEventListener("click", e => {
  const k = e.target.closest && e.target.closest("[data-rvg]"); if (!k) return;
  e.preventDefault(); e.stopImmediatePropagation();
  rvImportBlad();
}, true);
// Na de keuze in het blad sluit het blad (de bestandskiezer opent via de bestaande actie).
document.addEventListener("click", e => {
  const k = e.target.closest && e.target.closest('#blad [data-act="backup-import"]');
  if (k) setTimeout(() => bladSluit(), 0);
});

{
  const hoofd = NV_MEER[0][1], ook = NV_MEER[1][1];
  vwMeer = function () {
    const rij = ([v, n, i, u]) => `<button class="rijknop nv-rij" ${v === "vg" ? 'data-act="vg-open"' : `data-act="ga" data-view="${v}"`}>
      ${ico(i, "width:20px;height:20px;color:var(--accent)")}<span class="nm"><b>${esc(n)}</b><small>${esc(u)}</small></span>${ico("pijlr", "width:16px;height:16px;color:var(--line2)")}</button>`;
    return rvGegevensHTML() + `<div class="card">${hoofd.map(rij).join("")}</div>
      <details class="rv-alle"><summary>Alle schermen</summary><div class="card">${ook.map(rij).join("")}</div></details>`;
  };
}
