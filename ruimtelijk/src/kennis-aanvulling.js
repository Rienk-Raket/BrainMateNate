"use strict";
// === SECTIE 106: KENNISGATEN DICHTEN (V15) ===
/* ==========================================================================
   Conceptvoorstel V15. kennis/aanvulling.json voegt zes domeinen toe
   (prikkels, voorspelbaarheid, communicatie, lezen, steun, werk en studie),
   in dezelfde vorm als de ADHD-kennisbasis. Status: concept. Nate gebruikt
   ze pas als je "Nieuwe kennis (concept)" aanzet in Mijn aanpak; daar kun
   je ze ook eerst lezen. bouw.py zet het bestand als NATE_AANVULLING in de app.
   ========================================================================== */

/* NATE-AANVULLING-BEGIN */
/** De domeinen die Nate gebruikt: de basis, plus de aanvulling als die aanstaat. */
function kaDomeinen(basis, aanvulling, aan) {
  return aan ? basis.concat((aanvulling || []).filter(d => !basis.some(b => b.id === d.id))) : basis;
}
/* NATE-AANVULLING-EINDE */

if (typeof NATE_ADHD === "object" && typeof NATE_AANVULLING === "object") {
  const basis = NATE_ADHD.domeinen;
  const extra = NATE_AANVULLING.domeinen.map(d => Object.assign({ concept: true }, d));
  Object.defineProperty(NATE_ADHD, "domeinen", { get: () => kaDomeinen(basis, extra, !!inst("kennisConcept", false)), configurable: true, enumerable: true });

  AP_AANPASSINGEN.push({ id: "kennis", label: "Nieuwe kennis (concept)", uitleg: "Tips over prikkels, voorspelbaarheid, gesprekken, lezen, steun en werk.", patronen: ["P3", "P4", "P7"],
    waarom: "De kennisbasis ging vooral over ADHD. Deze aanvulling dekt de rest, maar is nog niet nagekeken door een professional; lees hem eerst hieronder.", bewijs: "praktisch" });
  AP_LEES.kennis = () => !!inst("kennisConcept", false);
  AP_ZET.kennis = aan => zetInst("kennisConcept", aan);

  const BEWIJS = { direct: "Direct", indirect: "Indirect", praktisch: "Praktisch" };
  const kaHTML = () => `<details class="card card-pad ka-lees"><summary>Nieuwe kennis lezen (concept)</summary>
    <p class="klein">${esc(NATE_AANVULLING.meta.geenDiagnose)} Nog niet nagekeken door een professional.</p>
    ${extra.map(d => `<section class="ka-domein"><h3>${esc(d.naam)}</h3><p>${esc(d.theorie)}</p>
      <ul>${d.interventies.map(i => `<li><b>${esc(i.naam)}</b> <span class="ka-bewijs">${BEWIJS[i.bewijs]}</span><br>${esc(i.uitleg)}</li>`).join("")}</ul>
      <p class="klein"><b>Kleinste stap:</b> ${esc(d.minimaleInterventie)}</p><p class="klein"><b>Zoek hulp als:</b> ${esc(d.opschalen)}</p></section>`).join("")}
    <p class="klein">Bronnen: ${NATE_AANVULLING.bronnen.map(b => esc(b.tekst)).join(" · ")}</p></details>`;
  const _vw = vwAanpak;
  vwAanpak = function () {
    const h = _vw.apply(this, arguments), i = h.indexOf('<p class="kn-disclaimer">');
    return i < 0 ? h + kaHTML() : h.slice(0, i) + kaHTML() + h.slice(i);
  };
}
