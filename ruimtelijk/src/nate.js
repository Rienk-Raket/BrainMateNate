"use strict";
// === SECTIE 84: NATE — MASCOTTE, BERICHTEN EN GIDS ===
/* ==========================================================================
   Nate is de enige afzender van tips, hints en meldingen.

   - Ruststand: een klein capibaraatje, half achter de rechterrand, boven de
     onderbalk. Hij bedekt geen knoppen en beweegt niet uit zichzelf.
   - Tik je op hem, dan opent zijn paneel: snel naar (mindmap vooraan),
     zijn berichten (met "Waarom?") en straks de chat (stap 6).
   - De oude Inbox (meldingen) blijft bestaan als "Nate's berichten"; de knop
     bovenin opent voortaan Nate's paneel.

   Uiterlijk: assets/nate/nate.svg. Vervang dat bestand door een eigen tekening
   met dezelfde naam, en Nate ziet er overal anders uit (geen bouwstap nodig).
   Lukt laden niet (bv. bij file://), dan valt hij terug op de ingebouwde kopie
   NATE_SVG_DATA die bouw.py uit hetzelfde bestand maakt.

   Kennis: NATE_ADHD (uit kennis/adhd-theorie.json) levert de "klein idee voor
   vandaag"-tip, met uitleg waarom en hoe sterk het bewijs is.
   ========================================================================== */

/* ---------- 84.1 Instellingen en teksten ---------- */
const NATE_BEELD = "assets/nate/nate.svg";
const NATE_TEKST = {
  naam: "Nate",
  knopLabel: "Nate, je gids. Tik om te openen",
  begroet: n => n ? `Hoi ${n}` : "Hoi",
  onder: "Ik help je met je dag, op jouw manier.",
  snel: "Snel naar",
  berichten: "Berichten van Nate",
  geenBerichten: "Geen nieuwe berichten. Rustig zo.",
  alle: n => `Alle berichten bekijken (${n})`,
  waarom: "Waarom zeg je dit?",
  gelezen: "Gelezen",
  nietMeer: "Niet meer tonen",
  chatStraks: "Straks kun je hier ook met me praten en me vragen waar iets staat.",
  tipTitel: "Klein idee voor vandaag",
  bewijsNaam: { direct: "direct bij ADHD onderzocht", indirect: "onderzocht, maar niet specifiek bij ADHD", praktisch: "nog een experiment: probeer of het bij jou werkt" }
};
/* Snel naar: de mindmap staat bewust vooraan en is de grootste knop,
   zodat je een gedachte meteen kwijt kunt. */
const NATE_SNEL = [
  { view: "mindmap", label: "Mindmap openen", groot: true },
  { view: "start", label: "Iets vastleggen" },
  { view: "vandaag", label: "Mijn dag" },
  { view: "zoeken", label: "Zoeken" }
];
const nateInst = (k, std) => (typeof inst === "function" ? inst(k, std) : std);
const nateNaam = () => (typeof pfNaam === "function" ? (pfNaam() || "").split(/\s+/)[0] : "");

/* ---------- 84.2 De tip van vandaag uit de ADHD-kennisbasis ----------
   Eén tip per dag, altijd de "minimale interventie" van één domein. De keuze
   draait nu per dag rond; in stap 4 kiest Nate op basis van je profiel. */
function nateTipVanVandaag() {
  if (typeof NATE_ADHD !== "object" || !nateInst("nateTips", true)) return null;
  const dagen = Math.floor(Date.parse(vandaagISO() + "T12:00:00") / 86400000);
  const dom = NATE_ADHD.domeinen[dagen % NATE_ADHD.domeinen.length];
  const id = "tip-" + vandaagISO();
  if (nateInst("nateVerborgen", []).includes(id) || nateInst("nateVerborgen", []).includes("dom-" + dom.id)) return null;
  const bewijs = (dom.interventies[0] || {}).bewijs;
  return {
    id, bron: "nate", titel: NATE_TEKST.tipTitel, tekst: dom.minimaleInterventie,
    waarom: `${dom.waaromKort || dom.theorie.split(". ")[0] + "."} (Uit het onderzoek over ${dom.naam.toLowerCase()}.)` +
      (bewijs ? ` Hoe sterk is dit? ${NATE_TEKST.bewijsNaam[bewijs]}.` : ""),
    domein: dom.id
  };
}

/* ---------- 84.3 Alle berichten op één rij ----------
   Nate's eigen tip, de live signalen van de app en de opgeslagen berichten
   uit de oude Inbox. Nieuwste eerst, ongelezen boven gelezen. */
function nateBerichten() {
  const uit = [];
  const tip = nateTipVanVandaag();
  if (tip && !nateInst("nateGelezen_" + tip.id, false)) uit.push(tip);
  if (typeof meldingenSignalen === "function")
    meldingenSignalen().forEach((s, i) => uit.push(Object.assign({ id: "sig-" + i, bron: "signaal" }, s)));
  if (typeof S === "object" && Array.isArray(S.meldingen))
    S.meldingen.filter(m => !m.gelezen).sort((a, b) => (b.ts || "").localeCompare(a.ts || ""))
      .forEach(m => uit.push(Object.assign({ bron: "melding" }, m)));
  return uit;
}
const nateAantal = () => nateBerichten().length;

/* ---------- 84.4 Nate in ruststand ---------- */
function nateBeeldHTML(klasse) {
  const reserve = typeof NATE_SVG_DATA === "string" ? NATE_SVG_DATA : "";
  return `<img class="${klasse || ""}" src="${NATE_BEELD}" alt="" draggable="false"${reserve ? ` onerror="this.onerror=null;this.src='${reserve}'"` : ""}>`;
}
function nateMaak() {
  if (document.getElementById("nate")) return;
  const knop = document.createElement("button");
  knop.id = "nate"; knop.type = "button";
  knop.setAttribute("aria-label", NATE_TEKST.knopLabel);
  knop.setAttribute("aria-haspopup", "dialog");
  knop.innerHTML = nateBeeldHTML() + `<span class="nate-stip" hidden></span>`;
  knop.addEventListener("click", () => nateOpen());
  document.body.appendChild(knop);

  const p = document.createElement("div");
  p.id = "nate-paneel";
  p.innerHTML = `<div class="nate-achter" data-nate="sluit"></div>
    <section class="nate-vel" role="dialog" aria-modal="true" aria-labelledby="nate-titel" tabindex="-1"></section>`;
  document.body.appendChild(p);
  p.addEventListener("click", nateKlik);
  p.addEventListener("keydown", e => { if (e.key === "Escape") nateSluit(); });

  // Stap opzij als er een blad (onderscherm) van de app openstaat.
  const overlay = document.getElementById("overlay");
  if (overlay && "MutationObserver" in window)
    new MutationObserver(() => document.body.classList.toggle("nate-weg", overlay.classList.contains("open")))
      .observe(overlay, { attributes: true, attributeFilter: ["class"] });
  nateStipBijwerken();
}
function nateStipBijwerken() {
  const stip = document.querySelector("#nate .nate-stip");
  if (!stip) return;
  let n = 0; try { n = nateAantal(); } catch (e) { n = 0; }
  stip.hidden = n === 0;
  document.getElementById("nate").setAttribute("aria-label", NATE_TEKST.knopLabel + (n ? `. ${n} ${n === 1 ? "bericht" : "berichten"}` : ""));
}

/* ---------- 84.5 Het paneel ---------- */
let nateOpener = null;
function nateOpen() {
  nateMaak();
  nateOpener = document.activeElement;
  const p = document.getElementById("nate-paneel");
  nateTeken();
  p.classList.add("open", "komt");
  document.body.classList.add("nate-open");
  requestAnimationFrame(() => requestAnimationFrame(() => p.classList.remove("komt")));
  p.querySelector(".nate-vel").focus();
}
function nateSluit() {
  const p = document.getElementById("nate-paneel");
  if (!p || !p.classList.contains("open")) return;
  p.classList.remove("open");
  document.body.classList.remove("nate-open");
  nateStipBijwerken();
  if (nateOpener && document.contains(nateOpener)) nateOpener.focus();
}
function nateTeken() {
  const vel = document.querySelector("#nate-paneel .nate-vel");
  if (!vel) return;
  const berichten = nateBerichten();
  const toon = berichten.slice(0, 3);
  const totaal = (typeof S === "object" && Array.isArray(S.meldingen) ? S.meldingen.length : 0);
  vel.innerHTML = `
    <div class="nate-kop">${nateBeeldHTML()}
      <div><h2 id="nate-titel">${esc(NATE_TEKST.begroet(nateNaam()))}</h2><p>${esc(NATE_TEKST.onder)}</p></div>
      <button class="nate-sluit" data-nate="sluit" aria-label="Sluiten">×</button></div>
    <h3 class="nate-sectie">${NATE_TEKST.snel}</h3>
    <div class="nate-snel">${NATE_SNEL.map(s => `<button type="button" data-nate="ga" data-view="${s.view}"${s.groot ? ' class="groot"' : ""}>${esc(s.label)}</button>`).join("")}</div>
    <h3 class="nate-sectie">${NATE_TEKST.berichten}</h3>
    ${toon.length ? `<ul class="nate-berichten">${toon.map(nateBerichtHTML).join("")}</ul>` : `<p class="nate-leeg">${NATE_TEKST.geenBerichten}</p>`}
    ${totaal ? `<button type="button" class="nate-meer" data-nate="ga" data-view="meldingen">${esc(NATE_TEKST.alle(totaal))}</button>` : ""}
    <p class="nate-voet">${NATE_TEKST.chatStraks}</p>`;
}
function nateBerichtHTML(b) {
  const van = b.bron === "nate" ? "Nate" : (b.onderwerp ? "Nate · " + b.onderwerp : "Nate");
  // Bij berichten zonder eigen uitleg zegt Nate eerlijk waar het vandaan komt.
  const waarom = b.waarom || (b.bron === "signaal" ? "Dit zie ik nu in je app. Het verdwijnt vanzelf als het is opgelost." : "Dit bericht kwam van een onderdeel van de app" + (b.onderwerp ? ` (${b.onderwerp})` : "") + ".");
  const acties = [];
  if (b.actieView) acties.push(`<button type="button" class="primair" data-nate="ga" data-view="${esc(b.actieView)}"${b.actieParam ? ` data-param="${esc(b.actieParam)}"` : ""}>Bekijken</button>`);
  if (b.bron === "melding") acties.push(`<button type="button" data-nate="gelezen" data-id="${esc(b.id)}">${NATE_TEKST.gelezen}</button>`);
  if (b.bron === "nate") acties.push(`<button type="button" data-nate="gelezen-tip" data-id="${esc(b.id)}">${NATE_TEKST.gelezen}</button>`,
    `<button type="button" data-nate="niet-meer" data-id="dom-${esc(b.domein)}">${NATE_TEKST.nietMeer}</button>`);
  return `<li class="nate-bericht"><span class="nate-van">${esc(van)}</span><b>${esc(b.titel || "")}</b>${b.tekst ? `<p>${esc(b.tekst)}</p>` : ""}
    <details><summary>${NATE_TEKST.waarom}</summary><p>${esc(waarom)}</p></details>
    ${acties.length ? `<div class="nate-acties">${acties.join("")}</div>` : ""}</li>`;
}
async function nateKlik(e) {
  const el = e.target.closest("[data-nate]");
  if (!el) return;
  const soort = el.dataset.nate;
  if (soort === "sluit") nateSluit();
  else if (soort === "ga") { nateSluit(); ga(el.dataset.view, el.dataset.param || null); }
  else if (soort === "gelezen") { await meldingLezen(el.dataset.id); nateTeken(); nateStipBijwerken(); if (typeof meldingenBadgeBijwerken === "function") meldingenBadgeBijwerken(); }
  else if (soort === "gelezen-tip") { await zetInst("nateGelezen_" + el.dataset.id, true); nateTeken(); nateStipBijwerken(); }
  else if (soort === "niet-meer") {
    await zetInst("nateVerborgen", nateInst("nateVerborgen", []).concat(el.dataset.id));
    nateTeken(); nateStipBijwerken();
    toast("Oké, dit soort tip laat ik voortaan weg. Terugzetten kan in Instellingen.");
  }
}

/* ---------- 84.6 Aansluiten op de rest van de app ---------- */
// De Inbox-knop bovenin opent voortaan Nate's paneel.
document.addEventListener("click", e => {
  const knop = e.target.closest && e.target.closest("#inboxknop");
  if (!knop) return;
  e.preventDefault(); e.stopImmediatePropagation();
  nateOpen();
}, true);
{
  const k = document.getElementById("inboxknop");
  if (k) k.setAttribute("aria-label", "Berichten van Nate");
}
// De oude Inbox heet voortaan "Nate's berichten".
Object.defineProperty(KOPPEN, "meldingen", {
  get: () => ["Nate’s berichten", () => (typeof meldingenOnderschrift === "function" ? meldingenOnderschrift() : "")],
  configurable: true, enumerable: true
});
// Stipje bijwerken zodra de app zijn eigen badge bijwerkt.
if (typeof meldingenBadgeBijwerken === "function") {
  const _badge = meldingenBadgeBijwerken;
  meldingenBadgeBijwerken = function () { _badge.apply(this, arguments); nateStipBijwerken(); };
}
// Instellingen → Nate: tips aan/uit en weggelegde tips terugzetten.
if (typeof vwInstellingen === "function") {
  const _inst = vwInstellingen;
  vwInstellingen = function () {
    const aan = nateInst("nateTips", true), weg = nateInst("nateVerborgen", []).length;
    return `${typeof sectie === "function" ? sectie("Nate") : "<h2>Nate</h2>"}
      <ul class="schakels"><li class="schakel"><span class="tekst"><b>Klein idee voor vandaag</b><small>Eén tip per dag uit het ADHD-onderzoek, met uitleg waarom.</small></span>
        <button class="toggle" data-nate-inst="tips" aria-pressed="${aan}" aria-label="Tip van Nate per dag"></button></li></ul>
      ${weg ? `<button class="knop breed rand" data-nate-inst="terug">Weggelegde tips terugzetten (${weg})</button>` : ""}` + _inst.apply(this, arguments);
  };
}
document.addEventListener("click", async e => {
  const el = e.target.closest && e.target.closest("[data-nate-inst]");
  if (!el) return;
  if (el.dataset.nateInst === "tips") await zetInst("nateTips", !nateInst("nateTips", true));
  else if (el.dataset.nateInst === "terug") { await zetInst("nateVerborgen", []); toast("Alle tips zijn weer aan."); }
  teken(); nateStipBijwerken();
});
// Nate verschijnt zodra de pagina klaar is (de app bewaart S pas na start()).
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(nateMaak, 0));
else setTimeout(nateMaak, 0);
