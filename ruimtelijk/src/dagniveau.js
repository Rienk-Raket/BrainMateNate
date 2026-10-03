"use strict";
// === SECTIE 95: EEN DAG MET ENERGIENIVEAUS (V5) ===
/* ==========================================================================
   Conceptvoorstel V5. Bovenaan Mijn dag één dagniveau: Minimum, Standaard
   of Extra. Nate stelt een niveau voor uit de energie van de check-in;
   jij kiest. Minimum: alleen de afspraken en één klein ding op de Nu-kaart,
   de rest is geparkeerd (niet verwijderd). Extra: meer zicht op wat daarna
   komt. De intentie van de dagstart blijft zichtbaar als kopregel.

   "Het minimum is geen mislukte standaardversie, maar een ontworpen
   continuïteitsmechanisme" (overkoepelend onderzoek, huishouden).

   De kern (NATE-NIVEAU-BEGIN/EINDE) is puur en wordt getest in tests/niveau-herstel.test.mjs.
   ========================================================================== */

/* NATE-NIVEAU-BEGIN */
const DN_NIVEAUS = [
  { id: "minimum", label: "Minimum", uitleg: "Afspraken en één klein ding. De rest wacht." },
  { id: "standaard", label: "Standaard", uitleg: "Een gewone dag." },
  { id: "extra", label: "Extra", uitleg: "Ruimte over: je ziet meer van wat daarna komt." }
];
/** Voorstel uit de energie van de check-in (1–5). Zonder check-in geen voorstel. */
function dnVoorstel(energie) {
  if (energie == null) return null;
  return energie <= 2 ? "minimum" : energie >= 5 ? "extra" : "standaard";
}
const dnMin = s => { const m = /^(\d{1,2}):(\d{2})/.exec(s || ""); return m ? +m[1] * 60 + +m[2] : null; };
/** Het kleinste open ding: korte duur eerst (zonder duur telt als 15 min), dan de volgorde van de lijst.
    Maar iets met een vaste tijd die nu bijna begint (binnen 30 min, of tot 15 min geleden) gaat altijd voor. */
function dnKlein(lijst, nuMin) {
  const l = lijst || [];
  if (nuMin != null) {
    const nu = l.filter(t => dnMin(t.tijd) != null && dnMin(t.tijd) >= nuMin - 15 && dnMin(t.tijd) <= nuMin + 30).sort((a, b) => dnMin(a.tijd) - dnMin(b.tijd));
    if (nu.length) return nu[0];
  }
  return l.map((t, i) => ({ t, i, d: +t.duur || 15 })).sort((a, b) => a.d - b.d || a.i - b.i).map(x => x.t)[0] || null;
}
/** De Nu-kaart per niveau. nu = { een, twee, rest }, alle = de geordende lijst open taken. */
function dnNu(nu, alle, niveau, nuMin) {
  const lijst = alle || [];
  if (niveau === "minimum") { const k = dnKlein(lijst, nuMin); return { een: k, twee: [], rest: 0, geparkeerd: Math.max(0, lijst.length - (k ? 1 : 0)) }; }
  if (niveau === "extra") return { een: lijst[0] || null, twee: lijst.slice(1, 5), rest: Math.max(0, lijst.length - 5), geparkeerd: 0 };
  return Object.assign({ geparkeerd: 0 }, nu);
}
/* NATE-NIVEAU-EINDE */

/** Het gekozen niveau van vandaag (of standaard). */
function dnNiveau() { const k = inst("dnNiveau", null); return k && k.datum === vandaagISO() ? k.niveau : "standaard"; }
const dnGekozen = () => { const k = inst("dnNiveau", null); return !!(k && k.datum === vandaagISO()); };

/* ---------- 95.1 Nu-kaart volgens het niveau ---------- */
{
  const _nu = mdNu;
  mdNu = function () {
    const nu = _nu.apply(this, arguments), n = dnNiveau();
    if (n === "standaard") return Object.assign({ geparkeerd: 0 }, nu);
    const alle = [nu.een].concat(nu.twee).filter(Boolean);
    // De volledige lijst opnieuw opbouwen (mdNu geeft er maar drie terug).
    const { open } = fmVandaagTaken(), nuMin = new Date().getHours() * 60 + new Date().getMinutes();
    const metTijd = open.filter(t => fmMin(t.tijd) != null).sort((a, b) => fmMin(a.tijd) - fmMin(b.tijd));
    const komend = metTijd.filter(t => fmMin(t.tijd) >= nuMin - 15), voorbij = metTijd.filter(t => !komend.includes(t));
    const lijst = komend.concat(open.filter(t => fmMin(t.tijd) == null).sort(sorteerTaken), voorbij);
    return dnNu(nu, lijst.length ? lijst : alle, n, nuMin);
  };
  const _html = mdNuHTML;
  mdNuHTML = function () {
    let h = _html.apply(this, arguments);
    const g = mdNu().geparkeerd;
    if (g) h = h.replace(/<\/div>\s*$/, `<p class="dn-geparkeerd">${g} ${g === 1 ? "ding wacht" : "dingen wachten"} even. Er gaat niets weg.</p></div>`);
    return h;
  };
}

/* ---------- 95.2 Het blok bovenaan Mijn dag ---------- */
function dnBlokHTML() {
  const d = typeof dcVandaag === "function" ? dcVandaag() : null, e = typeof dcEnergie === "function" ? dcEnergie() : null;
  const voorstel = dnVoorstel(e), n = dnNiveau(), gekozen = dnGekozen();
  const energie = e != null ? `Energie: ${DC_ENERGIE[e - 1].toLowerCase()}` : "Nog geen check-in";
  const hint = !gekozen && voorstel && voorstel !== "standaard" ? `<p class="dn-hint">${voorstel === "minimum" ? "Weinig energie vandaag. Minimum past misschien beter." : "Veel energie vandaag. Extra kan ook."}</p>` : "";
  return `<section class="card card-pad dn-blok" aria-label="Dagniveau">
    ${d && d.intentie ? `<p class="dn-intentie"><span class="labeltekst">Vandaag</span> ${esc(d.intentie)}</p>` : ""}
    <div class="dn-kop"><span class="labeltekst">Dagniveau</span><small>${esc(energie)}</small></div>
    <div class="dn-keuzes" role="radiogroup" aria-label="Dagniveau">${DN_NIVEAUS.map(x => `<button type="button" role="radio" class="dn-keuze" data-dn="${x.id}" aria-checked="${n === x.id}" tabindex="${n === x.id ? 0 : -1}">${esc(x.label)}${!gekozen && voorstel === x.id && x.id !== "standaard" ? `<span class="dn-voorstel" aria-hidden="true">•</span><span class="sr-only"> (voorstel van Nate)</span>` : ""}</button>`).join("")}</div>
    ${hint}
    <p class="klein dn-uitleg">${esc(DN_NIVEAUS.find(x => x.id === n).uitleg)}</p>
    ${n === "minimum" ? `<button class="knop breed rand dn-landen" data-act="ga" data-view="anker">${ico("anker")} Even landen (1 minuut)</button>` : ""}
    <details class="iv-waarom"><summary>Waarom zeg je dit?</summary><p>Een kleinere versie op een zware dag houdt de draad vast, zodat je niet helemaal stilvalt. Praktisch: laag risico en nog een experiment, dus kijk of het bij jou werkt.</p></details>
  </section>`;
}
{
  const _vw = vwVandaag;
  vwVandaag = function () { return dnBlokHTML() + _vw.apply(this, arguments); };
}
async function dnKies(id) {
  await zetInst("dnNiveau", { datum: vandaagISO(), niveau: id });
  tril(6); teken();
  const terug = document.querySelector(`[data-dn="${id}"]`); if (terug) terug.focus({ preventScroll: true });
}
// Pijltjes, Home en End in de radiogroep (één tabstop, zoals een echte radiogroep).
document.addEventListener("keydown", e => {
  const b = e.target.closest && e.target.closest("[data-dn]"); if (!b) return;
  const ids = DN_NIVEAUS.map(x => x.id), i = ids.indexOf(b.dataset.dn);
  const j = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: ids.length - 1 }[e.key];
  if (j == null) return;
  e.preventDefault(); dnKies(ids[(j + ids.length) % ids.length]);
});
document.addEventListener("click", async e => {
  const b = e.target.closest && e.target.closest("[data-dn]"); if (!b) return;
  e.preventDefault(); e.stopImmediatePropagation();
  return dnKies(b.dataset.dn);
}, true);
