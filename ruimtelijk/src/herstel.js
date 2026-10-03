"use strict";
// === SECTIE 96: HERSTEL NA EEN GEMISTE AFSPRAAK (V8) ===
/* ==========================================================================
   Conceptvoorstel V8. Na een afspraak zonder uitkomst vraagt Mijn dag één
   keer: "Hoe ging het?" Geweest, of gemist. Bij gemist volgt een korte
   herstelroute (categorie 1 uit het onderzoek):
   1. de herstelzin: feit, menselijkheid, verantwoordelijkheid;
   2. een kant-en-klaar bericht om te kopiëren;
   3. opnieuw plannen, met het afspraakblad al ingevuld;
   4. één schakel aanpassen (niet het hele systeem).
   Geen rode meldingen, geen reset naar nul.

   De kern (NATE-HERSTEL-BEGIN/EINDE) is puur en wordt getest in tests/niveau-herstel.test.mjs.
   ========================================================================== */

/* NATE-HERSTEL-BEGIN */
const HS_ZIN = "Het is gebeurd, en het overkomt meer mensen dan je denkt. Je kunt het nu rechtzetten, één stap tegelijk.";
const HS_SCHAKELS = [
  { id: "agenda", label: "Stond niet in mijn agenda", tip: "Leg een afspraak meteen vast in Vastleggen, nog tijdens het gesprek.", actie: null },
  { id: "melding", label: "Melding kwam te laat of niet", tip: "Laat Nate de alarmen zetten: stoppen, voorbereiden en vertrekken.", actie: "alarmen" },
  { id: "reistijd", label: "Reistijd was te krap", tip: "Zet de standaardbuffer vóór vertrek vijf minuten ruimer.", actie: "buffer" },
  { id: "stoppen", label: "Stoppen met iets anders lukte niet", tip: "Een stopmoment vijf minuten eerder geeft lucht om af te ronden.", actie: "afronden" },
  { id: "vergeten", label: "Ik was het gewoon vergeten", tip: "Een wekker op het vertrekmoment helpt meer dan onthouden.", actie: "alarmen" }
];

const hsMin = s => { const m = /^(\d{1,2}):(\d{2})/.exec(s || ""); return m ? +m[1] * 60 + +m[2] : null; };
/** Afspraken die voorbij zijn en nog geen uitkomst of status hebben (vandaag en gisteren). nu = Date. */
function hsTeVragen(afspraken, nu, vandaag, gisteren) {
  const nuMin = nu.getHours() * 60 + nu.getMinutes();
  return (afspraken || []).filter(a => {
    if (!a || a.uitkomst || a.hsStatus || !a.datum || hsMin(a.tijd) == null) return false;
    if (a.datum === gisteren) return true;
    if (a.datum !== vandaag) return false;
    const eind = hsMin(a.eindTijd) != null && hsMin(a.eindTijd) > hsMin(a.tijd) ? hsMin(a.eindTijd) : hsMin(a.tijd) + 60;
    return eind <= nuMin;
  }).sort((x, y) => (x.datum + x.tijd < y.datum + y.tijd ? -1 : 1));
}

/** Kant-en-klaar bericht: kort erkennen, verantwoordelijkheid, nieuwe afspraak voorstellen. */
function hsBericht(a, dagNaam) {
  const wie = (a.personen && a.personen[0]) ? `Hoi ${a.personen[0]},` : "Hoi,";
  return `${wie}\n\nHet spijt me dat ik onze afspraak van ${dagNaam} om ${a.tijd} heb gemist. Dat lag aan mij.\nKunnen we een nieuwe afspraak maken? Ik pas me graag aan jouw agenda aan.\n\nGroet`;
}
/* NATE-HERSTEL-EINDE */

/* ---------- 96.1 De vraag op Mijn dag ---------- */
function hsKaartHTML() {
  const lijst = hsTeVragen(S.afspraken, new Date(), vandaagISO(), plusDagen(vandaagISO(), -1));
  const a = lijst[0]; if (!a) return "";
  return `<section class="card card-pad hs-kaart" aria-label="Hoe ging het?">
    <span class="labeltekst">Even terugkijken</span>
    <p class="hs-vraag">Hoe ging <b>${esc(a.titel)}</b> ${a.datum === vandaagISO() ? "vandaag" : "gisteren"} om ${esc(a.tijd)}?</p>
    <div class="hs-knoppen"><button class="knop primair" data-hs="geweest" data-id="${esc(a.id)}">${ico("check")} Geweest</button>
      <button class="knop rand" data-hs="gemist" data-id="${esc(a.id)}">Gemist</button></div>
    ${lijst.length > 1 ? `<p class="klein">Daarna nog ${lijst.length - 1}.</p>` : ""}
  </section>`;
}
{
  const _vw = vwVandaag;
  vwVandaag = function () {
    const h = _vw.apply(this, arguments), k = hsKaartHTML();
    if (!k) return h;
    // Na het dagniveau (V5), vóór de ring.
    const i = h.indexOf("</section>");
    return i >= 0 && h.indexOf("dn-blok") >= 0 && h.indexOf("dn-blok") < i ? h.slice(0, i + 10) + k + h.slice(i + 10) : k + h;
  };
}

/* ---------- 96.2 De herstelroute ---------- */
function hsRoute(a) {
  const tekst = hsBericht(a, datumLabel(a.datum).toLowerCase());
  bladOpen("Gemist", `<p class="hs-zin">${esc(HS_ZIN)}</p>
    <h3 class="hs-stap"><span>1</span> Laat het weten</h3>
    <textarea class="invoer hs-bericht" id="hs-bericht" rows="6">${esc(tekst)}</textarea>
    <button class="knop breed rand" id="hs-kopie">${ico("sjabloon")} Bericht kopiëren</button>
    <h3 class="hs-stap"><span>2</span> Nieuwe afspraak</h3>
    <button class="knop breed rand" id="hs-plan">${ico("komend")} Opnieuw plannen</button>
    <h3 class="hs-stap"><span>3</span> Wat brak er?</h3>
    <p class="klein">Kies één ding. Nate stelt één aanpassing voor, geen nieuw systeem.</p>
    <div class="hs-schakels">${HS_SCHAKELS.map(s => `<button type="button" class="keuze" data-hs-schakel="${s.id}" aria-pressed="false">${esc(s.label)}</button>`).join("")}</div>
    <div id="hs-tip" aria-live="polite"></div>
    <details class="iv-waarom"><summary>Waarom zeg je dit?</summary><p>Mild zijn voor jezelf na een misser hangt samen met minder uitstellen daarna. Dat komt uit observationeel onderzoek, dus praktisch: probeer het als experiment.</p></details>`,
    `<button class="knop breed primair" id="hs-klaar">Klaar</button>`);
  $("#hs-kopie").onclick = async () => {
    const t = $("#hs-bericht").value;
    try { await navigator.clipboard.writeText(t); toast("Bericht gekopieerd"); } catch (e) { $("#hs-bericht").select(); toast("Selecteer en kopieer de tekst"); }
  };
  $("#hs-plan").onclick = () => {
    const kopie = { titel: a.titel, soort: a.soort, plek: a.plek, personen: (a.personen || []).slice(), reistijd: a.reistijd, buffer: a.buffer, voorbereiden: a.voorbereiden,
      voorbereiding: a.voorbereiding, tijd: a.tijd, eindTijd: a.eindTijd, datum: "" };
    openAfspraakBlad(null, kopie);
  };
  $("#bladinhoud").addEventListener("click", e => {
    const b = e.target.closest("[data-hs-schakel]"); if (!b) return;
    $$("[data-hs-schakel]").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    const s = HS_SCHAKELS.find(x => x.id === b.dataset.hsSchakel);
    a.hsOorzaak = s.id;
    const knop = s.actie === "alarmen" ? `<button class="knop breed rand" data-hs-actie="alarmen">Alarmen instellen</button>`
      : s.actie === "buffer" ? `<button class="knop breed rand" data-hs-actie="buffer">Buffer naar ${(typeof mdBufferStd === "function" ? mdBufferStd() : 10) + 5} minuten</button>`
      : s.actie === "afronden" ? `<button class="knop breed rand" data-hs-actie="afronden">Stopmoment 5 minuten eerder</button>` : "";
    $("#hs-tip").innerHTML = `<p class="hs-tip">${esc(s.tip)}</p>${knop}`;
  });
  $("#bladinhoud").addEventListener("click", async e => {
    const b = e.target.closest("[data-hs-actie]"); if (!b) return;
    const w = b.dataset.hsActie;
    if (w === "alarmen") { await hsBewaar(a); return tpUitleg(null); }
    if (w === "buffer") { await zetInst("mdBuffer", (typeof mdBufferStd === "function" ? mdBufferStd() : 10) + 5); toast(`Buffer staat nu op ${mdBufferStd()} minuten`); }
    if (w === "afronden") { const o = Object.assign({}, inst("tpAlarmen", {}) || {}); o.afronden = (+o.afronden || 5) + 5; await zetInst("tpAlarmen", o); toast(`Stoppen nu ${o.afronden} minuten vóór voorbereiden`); }
    b.disabled = true;
  });
  $("#hs-klaar").onclick = async () => { await hsBewaar(a); bladSluit(); teken(); toast("Genoteerd. Je hebt het opgepakt."); };
}
async function hsBewaar(a) {
  if (a.hsStatus === "gemist") { await bewaar("afspraken", a); return; }
  a.hsStatus = "gemist";
  await bewaar("afspraken", a);
  await logGebeurtenis("afspraak", `Gemist en opgepakt: ${a.titel}`, a.id).catch(() => {});
}

document.addEventListener("click", async e => {
  const b = e.target.closest && e.target.closest("[data-hs]"); if (!b) return;
  e.preventDefault(); e.stopImmediatePropagation();
  const a = vind("afspraken", b.dataset.id); if (!a) return;
  if (b.dataset.hs === "geweest") {
    a.hsStatus = "geweest"; await bewaar("afspraken", a);
    tril(6); teken(); toast("Fijn. Iets noteren kan in de afspraak.", "Openen", () => ga("afspraak", a.id));
  } else { await hsBewaar(a); teken(); hsRoute(a); }
}, true);
