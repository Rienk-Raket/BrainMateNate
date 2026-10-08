"use strict";
// === SECTIE 105: LEZEN — VOORLEZEN EN RUIMERE TEKST (V14) ===
/* ==========================================================================
   Conceptvoorstel V14 (patroon Vertaler). Geen speciaal dyslexielettertype:
   daar is geen voordeel voor gevonden. Wel:
   - Voorlezen: een luidsprekerknop bij Nate's berichten, de chat en elke
     "Waarom zeg je dit?". De stem van je iPhone, zonder internet.
   - Ruime tekst: meer regelafstand, letter- en woordafstand.
   - Grotere tekst: de bestaande tekstgrootte, als één schakelaar.
   - Inspreken: het invoerveld wijst al naar de microfoon van het toetsenbord.
   Alles staat in Mijn aanpak; Nate stelt het voor bij de Vertaler (P4).

   De kern (NATE-LEZEN-BEGIN/EINDE) is puur en wordt getest in tests/inclusief.test.mjs.
   ========================================================================== */

/* NATE-LEZEN-BEGIN */
/** De tekst om voor te lezen: zonder knoppen, schermlezer-labels en dubbele witruimte. */
function lzTekst(el) {
  if (!el) return "";
  const k = el.cloneNode(true);
  k.querySelectorAll("button, .sr-only, .nate-acties, .lz-lees, summary, script, style").forEach(x => x.remove());
  return String(k.textContent || "").replace(/\s+/g, " ").trim();
}
/** Een Nederlandse stem kiezen: eerst nl-NL, dan elke nl-stem, anders geen (dan kiest het toestel). */
function lzStem(stemmen) {
  const l = stemmen || [];
  return l.find(v => /^nl[-_]NL/i.test(v.lang)) || l.find(v => /^nl/i.test(v.lang)) || null;
}
/* NATE-LEZEN-EINDE */

const LZ_DOELEN = ".nc-nate, .nate-bericht, .iv-waarom > p, .vb-morgenkaart, .md-nu h2";
const lzAan = id => !!inst(id, false);

/* ---------- 105.1 Voorlezen ---------- */
let lzBezig = null;
function lzStop() { try { if ("speechSynthesis" in window) speechSynthesis.cancel(); } catch (e) {} if (lzBezig) lzBezig.setAttribute("aria-pressed", "false"); lzBezig = null; }
function lzLees(knop) {
  const doel = knop.closest(LZ_DOELEN) || knop.parentElement;
  if (lzBezig === knop) { lzStop(); return; }
  lzStop();
  if (!("speechSynthesis" in window)) { toast("Voorlezen werkt niet in deze browser"); return; }
  const tekst = lzTekst(doel); if (!tekst) return;
  const u = new SpeechSynthesisUtterance(tekst), stem = lzStem(speechSynthesis.getVoices());
  u.lang = stem ? stem.lang : "nl-NL"; if (stem) u.voice = stem; u.rate = 0.95;
  u.onend = u.onerror = () => { if (lzBezig === knop) { knop.setAttribute("aria-pressed", "false"); lzBezig = null; } };
  lzBezig = knop; knop.setAttribute("aria-pressed", "true");
  speechSynthesis.speak(u);
}
const lzKnop = () => `<button type="button" class="lz-lees" aria-label="Lees voor" aria-pressed="false"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg></button>`;
function lzKnoppen() {
  if (!lzAan("lzVoorlezen")) { document.querySelectorAll(".lz-lees").forEach(b => b.remove()); return; }
  document.querySelectorAll(LZ_DOELEN).forEach(el => {
    if (el.querySelector(":scope > .lz-lees") || !lzTekst(el)) return;
    el.insertAdjacentHTML("beforeend", lzKnop());
  });
}
// Ook in het Nate-paneel, de chat en bladen (buiten #scherm): kijken wat er verschijnt.
{
  let gepland = false;
  new MutationObserver(() => {
    if (gepland) return; gepland = true;
    requestAnimationFrame(() => { gepland = false; lzKnoppen(); });
  }).observe(document.body, { childList: true, subtree: true });
}
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest(".lz-lees"); if (!b) return;
  e.preventDefault(); e.stopImmediatePropagation();
  lzLees(b);
}, true);
// Stoppen bij een ander scherm.
RT_NA.push(() => { if (lzBezig && !document.body.contains(lzBezig)) lzStop(); });

/* ---------- 105.2 Ruime tekst ---------- */
{
  const _toe = pasInstellingenToe;
  pasInstellingenToe = function () {
    const r = _toe.apply(this, arguments);
    document.documentElement.dataset.ruim = lzAan("lzRuim") ? "1" : "0";
    return r;
  };
}

/* ---------- 105.3 In Mijn aanpak ---------- */
AP_AANPASSINGEN.push(
  { id: "voorlezen", label: "Voorlezen", uitleg: "Een luidsprekerknop bij Nate en bij elke uitleg. Zonder internet.", patronen: ["P4"],
    waarom: "Horen en lezen tegelijk maakt een tekst lichter om te verwerken.", bewijs: "indirect" },
  { id: "ruim", label: "Ruime tekst", uitleg: "Meer ruimte tussen regels, woorden en letters.", patronen: ["P4"],
    waarom: "Meer ruimte tussen letters hielp in onderzoek bij dyslexie sneller en nauwkeuriger lezen. Een speciaal dyslexielettertype hielp niet, daarom zit dat er niet in.", bewijs: "indirect" },
  { id: "groot", label: "Grotere tekst", uitleg: "Alle tekst een maat groter.", patronen: ["P4"],
    waarom: "Grotere letters kosten minder moeite om te lezen, zeker op een telefoon.", bewijs: "praktisch" }
);
Object.assign(AP_LEES, {
  voorlezen: () => lzAan("lzVoorlezen"),
  ruim: () => lzAan("lzRuim"),
  groot: () => ["groot", "extra"].includes(inst("tekst", "normaal"))
});
Object.assign(AP_ZET, {
  voorlezen: async aan => { await zetInst("lzVoorlezen", aan); if (!aan) lzStop(); },
  ruim: async aan => { await zetInst("lzRuim", aan); pasInstellingenToe(); },
  groot: async aan => {
    if (aan) { await zetInst("lzVorigeTekst", inst("tekst", "normaal")); await zetInst("tekst", "groot"); }
    else { const v = inst("lzVorigeTekst", "normaal"); await zetInst("tekst", ["groot", "extra"].includes(v) ? "normaal" : v); }
    pasInstellingenToe();
  }
});
