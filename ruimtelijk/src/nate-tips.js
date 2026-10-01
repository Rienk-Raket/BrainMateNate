"use strict";
// === SECTIE 86: NATE'S TIP VAN DE DAG UIT JE PROFIEL ===
/* ==========================================================================
   Stap 4. Nate kiest zijn tip niet meer op toerbeurt, maar op basis van je
   profiel uit de kennismaking (sectie 85): de subthema's waar je de meeste
   steun bij wilt, gekoppeld aan de domeinen van kennis/adhd-theorie.json
   (veld "subthemas", volgens de route A → B uit 04_scorelogica-en-routing).

   Hooguit één nieuw bericht per dagdeel (ochtend, middag, avond). Elke tip
   heeft een omdat-zin die naar je antwoord verwijst en een bewijsniveau.
   Zonder profiel (nog niet kennisgemaakt, of "Later") valt Nate terug op een
   algemene tip die per dagdeel rondgaat. "Niet meer tonen" blijft werken via
   nateVerborgen ("dom-<domein>").

   Het kiezen zelf is puur (geen DOM, geen opslag) en wordt getest in
   tests/tips.test.mjs.
   ========================================================================== */
/* NATE-TIPS-BEGIN */
const NT_DAGDELEN = ["ochtend", "middag", "avond"];
// Voor 12 uur ochtend, voor 18 uur middag, daarna avond.
function ntDagdeel(uur) { return uur < 12 ? "ochtend" : uur < 18 ? "middag" : "avond"; }

// Kandidaten: de subthema's met de grootste behoefte, elk vertaald naar één domein.
// Zonder behoefte-score (nog geen verdieping) telt de kernvraag, maar alleen vanaf "soms".
function ntKandidaten(profiel, antwoorden, domeinen, verborgen, cfg) {
  const weg = new Set(verborgen || []);
  const dims = Object.values(profiel && profiel.dims || {}).map(d => {
    const kern = nsScore(antwoorden[d.id + ".Q1"], cfg);
    const score = d.behoefte !== null && d.behoefte !== undefined ? d.behoefte : (kern !== null && kern >= 2 ? kern * 25 : null);
    return { id: d.id, score };
  }).filter(d => d.score !== null).sort((a, b) => b.score - a.score);
  const uit = [];
  for (const d of dims) for (const dom of domeinen) {
    if (!dom.subthemas.includes(d.id) || weg.has("dom-" + dom.id) || uit.some(u => u.domein.id === dom.id)) continue;
    uit.push({ domein: dom, dim: d.id, score: d.score });
  }
  return uit;
}
// Eén keuze per dagdeel: de kandidaten gaan rond over de dagdelen, zodat je niet drie
// keer per dag hetzelfde hoort. Zonder kandidaten: een algemene tip op toerbeurt.
function ntKies(kandidaten, domeinen, verborgen, dagIndex, dagdeel) {
  const n = dagIndex * 3 + NT_DAGDELEN.indexOf(dagdeel);
  // + dagIndex: elke dag schuift de reeks één plek op, ook bij drie of zes kandidaten.
  if (kandidaten.length) return Object.assign({ algemeen: false }, kandidaten[(n + dagIndex) % kandidaten.length]);
  const weg = new Set(verborgen || []);
  const alle = domeinen.filter(dom => !weg.has("dom-" + dom.id));
  return alle.length ? { domein: alle[n % alle.length], dim: null, score: null, algemeen: true } : null;
}
// Het antwoord dat de behoefte droeg: de hoogste score van kernvraag en impactvraag,
// maar alleen vanaf "soms". Anders (bv. alleen "Speelt wel") geen citaat.
function ntSterksteAntwoord(bank, dim, antwoorden, cfg) {
  let beste = null;
  for (const id of [dim + ".Q1", dim + ".Q2"]) {
    const s = nsScore(antwoorden[id], cfg), q = bank.questions.find(x => x.question_id === id);
    if (q && s !== null && s >= 2 && (!beste || s > beste.s)) beste = { s, label: (q.response_options.find(o => o.value === antwoorden[id]) || {}).label };
  }
  return beste ? beste.label.toLowerCase() : null;
}
// De omdat-zin verwijst naar het antwoord; daarna het bewijsniveau van de eerste interventie.
function ntWaarom(keuze, bank, antwoorden, bewijsNaam, cfg) {
  const dom = keuze.domein, q = keuze.dim ? bank.questions.find(x => x.question_id === keuze.dim + ".Q1") : null;
  const label = q ? ntSterksteAntwoord(bank, keuze.dim, antwoorden, cfg) : null;
  const omdat = !q ? "Omdat we nog niet hebben kennisgemaakt, kies ik een algemene tip."
    : label ? `Omdat je bij ${q.subtheme_name.toLowerCase()} "${label}" antwoordde.`
    : `Omdat je bij ${q.subtheme_name.toLowerCase()} aangaf dat het speelt.`;
  const bewijs = (dom.interventies[0] || {}).bewijs;
  return `${omdat} ${dom.waaromKort} (Uit het onderzoek over ${dom.naam.toLowerCase()}.)` + (bewijs ? ` Hoe sterk is dit? ${bewijsNaam[bewijs]}.` : "");
}
/* NATE-TIPS-EINDE */

// Nate's tip van dit dagdeel; vervangt de toerbeurt uit sectie 84.2.
nateTipVanVandaag = function () {
  if (typeof NATE_ADHD !== "object" || !nateInst("nateTips", true)) return null;
  const d = knData(), verborgen = nateInst("nateVerborgen", []);
  const dagdeel = ntDagdeel(new Date().getHours()), id = `tip-${vandaagISO()}-${dagdeel}`;
  if (verborgen.includes(id)) return null;
  // Alleen met de zestien kernvragen is er een profiel om op te kiezen.
  const profiel = nsKernKlaar(NATE_VRAGENBANK, d.antwoorden) ? knProfiel(d) : null;
  const dagen = Math.floor(Date.parse(vandaagISO() + "T12:00:00") / 86400000);
  const keuze = ntKies(ntKandidaten(profiel, d.antwoorden, NATE_ADHD.domeinen, verborgen, NATE_SCOREWEGING), NATE_ADHD.domeinen, verborgen, dagen, dagdeel);
  if (!keuze) return null;
  const dom = keuze.domein;
  return {
    id, bron: "nate", titel: nateZeg(NATE_TEKST.tipTitel), tekst: dom.nate ? nateZeg(dom.nate) : dom.minimaleInterventie,
    waarom: ntWaarom(keuze, NATE_VRAGENBANK, d.antwoorden, NATE_TEKST.bewijsNaam, NATE_SCOREWEGING), domein: dom.id
  };
};

// "Niet meer tonen": het domein gaat weg, en in dit dagdeel komt er geen andere tip voor
// in de plaats (hooguit één nieuw bericht per dagdeel). Eén schrijfactie, dus geen race
// met de handler in nate.js; die slaan we hier over.
document.addEventListener("click", async e => {
  const el = e.target.closest && e.target.closest('#nate-paneel [data-nate="niet-meer"]'); if (!el) return;
  e.preventDefault(); e.stopImmediatePropagation();
  const dagdeel = ntDagdeel(new Date().getHours());
  await zetInst("nateVerborgen", nateInst("nateVerborgen", []).concat(el.dataset.id, `tip-${vandaagISO()}-${dagdeel}`));
  nateTeken(); nateStipBijwerken(); toast(NATE_TEKST.nietMeerToast);
}, true);
