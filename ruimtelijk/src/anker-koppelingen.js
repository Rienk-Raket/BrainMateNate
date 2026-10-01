"use strict";
// === SECTIE 72: ANKER – STARTTEGEL EN KOPPELINGEN ===
/* ==========================================================================
   Hoe Anker aansluit op de rest van de app:
   - een tegel op het startscherm (Nieuw). Tikken opent Anker; 0,5 seconde
     ingedrukt houden start meteen 1 minuut rustig ademen;
   - Logboek (standaard aan): elk moment wordt een regel;
   - Gewoonte (standaard uit): vinkt "Mindful moment" af;
   - Rookvrij, Financieel en Werk (standaard uit, en onzichtbaar tot je ze
     aanzet): een knop voor een korte oefening;
   - Herinneringen: terugkerende afspraken via de bestaande afsprakenfunctie.
   Back-up en import nemen de nieuwe stores vanzelf mee (zie sectie 69.1).
   ========================================================================== */

/* ---------- 72.1 Starttegel ---------- */
{
  const _start = vwStart;
  vwStart = function () {
    const h = _start();
    const n = mfWeekMomenten();
    const tegel = catKnop({ view: "anker", ill: "anker", naam: "Anker", uitleg: `Deze week: ${n} ${n === 1 ? "moment" : "momenten"}`, kleur: "#3a7ca5" })
      .replace('class="knop3d breed"', 'class="knop3d breed mf-tegel" aria-description="Houd ingedrukt om meteen 1 minuut rustig te ademen"');
    // Direct na Gezondheid; lukt dat niet, dan achteraan in het raster.
    const i = h.indexOf('data-view="gezondheid"'), j = i < 0 ? -1 : h.indexOf("</button>", i);
    if (j >= 0) return h.slice(0, j + 9) + tegel + h.slice(j + 9);
    const k = h.indexOf('<div class="startgrid">');
    return k < 0 ? h : h.slice(0, k + 23) + tegel + h.slice(k + 23);
  };
}
/* Lang indrukken (500 ms) = direct starten, zonder vragen. */
{
  let timer = 0, start = null, gestart = 0;
  document.addEventListener("pointerdown", e => {
    const t = e.target.closest && e.target.closest(".mf-tegel");
    if (!t || (e.pointerType === "mouse" && e.button !== 0)) return;
    start = { x: e.clientX, y: e.clientY };
    clearTimeout(timer);
    timer = setTimeout(async () => {
      start = null; gestart = Date.now();
      if (!mfInst().introGezien) await mfInstZet({ introGezien: true });
      if (typeof tril === "function") tril(20);
      mfStart("A1", { min: 1, bron: "snelstart" });
    }, 500);
  }, { passive: true });
  const stop = () => { clearTimeout(timer); start = null; };
  document.addEventListener("pointermove", e => { if (start && (Math.abs(e.clientX - start.x) > 10 || Math.abs(e.clientY - start.y) > 10)) stop(); }, { passive: true });
  document.addEventListener("pointerup", stop, { passive: true });
  document.addEventListener("pointercancel", stop, { passive: true });
  // Na een lange druk mag de "tik" die volgt Anker-home niet openen.
  document.addEventListener("click", e => {
    if (Date.now() - gestart < 800 && e.target.closest && e.target.closest(".mf-tegel")) { e.preventDefault(); e.stopPropagation(); }
  }, true);
  document.addEventListener("contextmenu", e => { if (e.target.closest && e.target.closest(".mf-tegel")) e.preventDefault(); });
}
/* In het Meer-scherm ook te vinden */
{
  const _meer = vwMeer;
  vwMeer = function () {
    const h = _meer();
    const kaart = `<button class="menu-kaart" data-act="ga" data-view="anker">${ico("hart")}<span class="nm">Anker</span><span class="ds">Even landen</span></button>`;
    const i = h.indexOf('data-view="gezondheid"'), j = i < 0 ? -1 : h.indexOf("</button>", i);
    return j < 0 ? h : h.slice(0, j + 9) + kaart + h.slice(j + 9);
  };
}
if (typeof VERWANT === "object") {
  VERWANT.anker = [["gezondheid", "Gezondheid"], ["persoonlijk", "Persoonlijk"]];
  VERWANT_ICO.anker = "hart";
}

/* ---------- 72.2 Na een sessie: logboek en gewoonte ----------
   Wordt aangeroepen als de sessie echt klaar is (na de meting, overslaan of
   sluiten). Elke sessie maar één keer. */
const MF_GEMELD = new Set();
if (typeof TL_SOORTEN === "object") TL_SOORTEN.anker = ["Anker", "#3a7ca5"];
if (typeof LOGFILTERS !== "undefined" && Array.isArray(LOGFILTERS)) LOGFILTERS.push(["anker", "Anker"]);
async function mfNaSessie(sessie, fase) {
  if (fase !== "klaar" || !sessie || sessie.id == null || MF_GEMELD.has(sessie.id)) return;
  MF_GEMELD.add(sessie.id);
  const s = mfInst(), o = mfOef(sessie.oefeningId);
  if (s.koppelingen.logboek && o) {
    const min = Math.max(1, Math.round((sessie.duurSec || 0) / 60));
    const na = sessie.afgebroken ? "gestopt" : (sessie.nameting || "geen meting");
    await logGebeurtenis("anker", `Anker: ${o.naam}, ${min} min, ${na}${sessie.notitie ? " — " + sessie.notitie : ""}`, String(sessie.id));
  }
  // Mindful moment en Anker-moment zijn hetzelfde: bestaat de gewoonte, dan telt elk moment van 1 minuut of langer.
  if ((s.koppelingen.gewoonte || mfMindfulGewoonte()) && (sessie.duurSec || 0) >= 60) {
    const g = mfMindfulGewoonte(), d = vandaagISO();
    if (g && !gewoonteAf(g.id, d)) await bewaar("gewoontelog", { id: g.id + "|" + d, gewoonteId: g.id, datum: d, ts: new Date().toISOString() });
  }
}
const mfMindfulGewoonte = () => S.gewoontes.find(g => !g.archief && String(g.naam || "").trim().toLowerCase() === "mindful moment") || null;
async function mfMindfulMaak() {
  if (mfMindfulGewoonte()) { toast("Die gewoonte bestaat al"); return; }
  await bewaar("gewoontes", { id: uid(), naam: "Mindful moment", dagen: [], kleur: "#3a7ca5", gemaakt: new Date().toISOString(), archief: false });
  toast("Gewoonte “Mindful moment” aangemaakt");
}

/* ---------- 72.3 Knoppen in Rookvrij, Financieel en Werk (alleen als aangezet) ---------- */
function mfPauzeKnop(id, min, bron, titel) {
  const o = mfOef(id);
  return `<button class="mf-pauzeknop" data-act="mf-start" data-id="${id}" data-min="${min}" data-bron="${bron}">
    <span class="mf-pauzeicoon" aria-hidden="true">${ico("anker")}</span><span><b>${titel}</b><small>${esc(o.naam)} · ${min} min</small></span></button>`;
}
{
  const _roken = vwRoken;
  vwRoken = function () { const h = _roken(); return mfInst().koppelingen.roken ? mfPauzeKnop("G3", 3, "roken", "Even pauze") + h : h; };
  const _fin = vwFinancieel;
  vwFinancieel = function () { const h = _fin(); return mfInst().koppelingen.financieel ? mfPauzeKnop("G1", 1, "financieel", "Even pauze") + h : h; };
  const _werk = vwWerk;
  vwWerk = function () { const h = _werk(); return mfInst().koppelingen.werk ? mfPauzeKnop("A4", 3, "werk", "Focus-start") + h : h; };
}

/* ---------- 72.4 Herinneringen via de afsprakenfunctie ---------- */
async function mfHerinneringMaak(tijd, dagen) {
  if (!/^\d{2}:\d{2}$/.test(tijd)) { toast("Kies een tijd"); return; }
  const id = uid();
  const herhaal = !dagen.length || dagen.length === 7 ? { soort: "dag", elke: 1 } : { soort: "week", elke: 1, dagen: dagen.slice().sort() };
  const a = {
    id: uid(), soort: "gesprek", titel: "Anker: even landen", datum: eersteHerhaalDatum(herhaal), totDatum: "", tijd, eindTijd: "", deadline: "",
    plek: "", personen: [], voorbereiding: "Een kort moment voor jezelf. Open FutureMe en kies Anker.", notities: "", uitkomst: "",
    gemaakt: new Date().toISOString(), herhaal, mfHerinnering: id
  };
  await bewaar("afspraken", a);
  if (typeof reeksNaOpslaan === "function") await reeksNaOpslaan("afspraken", a, null);
  const s = mfInst();
  await mfInstZet({ herinneringen: s.herinneringen.concat({ id, tijd, dagen: herhaal.dagen || [0, 1, 2, 3, 4, 5, 6] }) });
  toast(`Herinnering om ${tijd} staat in je afspraken`);
}
async function mfHerinneringWeg(id) {
  const v = vandaagISO();
  // Toekomstige afspraken van deze herinnering weghalen; wat al geweest is, blijft staan.
  for (const a of S.afspraken.filter(a => a.mfHerinnering === id && (a.datum || "") >= v)) await verwijder("afspraken", a.id);
  const s = mfInst();
  await mfInstZet({ herinneringen: s.herinneringen.filter(r => r.id !== id) });
  toast("Herinnering verwijderd");
}
