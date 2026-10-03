"use strict";
// === SECTIE 92: EÉN INVOER VOOR ALLES (V3) ===
/* ==========================================================================
   Conceptvoorstel V3. Bovenaan Vastleggen één veld: "Wat speelt er?".
   De bestaande parser (Snel typen, parseNL) en Nate's intentieherkenning
   (sectie 89) werken samen. Nate toont wat hij begrijpt: afspraak, taak,
   gedachte of een plek in de app. Is hij zeker, dan één tik op Opslaan;
   twijfelt hij, dan kies jij. Nooit stilletjes gokken.

   Ook de chat in Nate's paneel biedt "Vastleggen" aan als je zin een datum
   of tijd heeft: dan opent dit veld met je tekst erin.

   De kern (NATE-VI-BEGIN/EINDE) is puur en wordt getest in tests/een-invoer.test.mjs.
   ========================================================================== */

/* NATE-VI-BEGIN */
const VI_AFSPRAAKWOORDEN = ["afspraak", "tandarts", "huisarts", "dokter", "arts", "kapper", "fysio", "fysiotherapeut", "psycholoog", "therapeut", "ziekenhuis", "orthodontist", "dierenarts",
  "gesprek", "meeting", "vergadering", "overleg", "sollicitatie", "sollicitatiegesprek", "date", "etentje", "lunch", "borrel", "verjaardag", "feestje", "bruiloft", "afspreken", "bezoek", "spreekuur", "intake", "controle"];
const VI_SOORTEN = {
  afspraak: { label: "Afspraak", knop: "Afspraak opslaan" },
  taak: { label: "Taak", knop: "Taak opslaan" },
  gedachte: { label: "Gedachte", knop: "In de mindmap" },
  zoek: { label: "Ergens heen", knop: "Ga erheen" }
};

/** Reistijd uit de tekst halen ("reistijd 25", "25 min reizen"). */
function viReistijd(tekst) {
  const s = String(tekst || "");
  const m = /\breis(?:tijd)?\s*:?\s*(\d{1,3}(?:[.,]\d)?)\s*(min(?:uten)?|m|uur|u)?\b/i.exec(s) || /\b(\d{1,3}(?:[.,]\d)?)\s*(min(?:uten)?|m|uur|u)\s+reizen\b/i.exec(s);
  if (!m) return { tekst: s, reistijd: 0 };
  const getal = parseFloat(m[1].replace(",", ".")), min = /^u/i.test(m[2] || "") ? getal * 60 : getal;
  return { tekst: (s.slice(0, m.index) + s.slice(m.index + m[0].length)).replace(/\s{2,}/g, " ").trim(), reistijd: Math.min(600, Math.round(min)) };
}

function viWoorden(tekst) {
  return String(tekst || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean);
}

/**
 * Wat bedoelt Kas? tekst = ruwe invoer, p = uitkomst van parseNL, r = uitkomst van ncBegrijp.
 * Geeft { soort, zeker, keuzes: [soort, soort], reden }.
 */
function viSoort(tekst, p, r) {
  const t = String(tekst || "").trim();
  if (!t) return { soort: null, zeker: false, keuzes: [], reden: "leeg" };
  if (r && r.uitkomst === "nood") return { soort: "nood", zeker: true, keuzes: ["nood"], reden: "nood" };
  if (r && r.uitkomst === "gedachte") return { soort: "gedachte", zeker: true, keuzes: ["gedachte"], reden: "gedachtewoord" };
  const w = viWoorden(t);
  const afspraakwoord = w.some(x => VI_AFSPRAAKWOORDEN.includes(x));
  const reis = /\breis(tijd)?\b|\breizen\b/i.test(t);
  const tijd = !!(p && p.tijd), datum = !!(p && p.datum);
  const vraag = /\?\s*$/.test(t) || ["waar", "hoe", "open", "naar"].includes(w[0]);
  if (vraag && r && r.uitkomst === "zeker" && !tijd) return { soort: "zoek", zeker: true, keuzes: ["zoek"], reden: "vraag" };
  if ((afspraakwoord || reis) && tijd) return { soort: "afspraak", zeker: true, keuzes: ["afspraak", "taak"], reden: "afspraakwoord en tijd" };
  if (afspraakwoord || reis) return { soort: "afspraak", zeker: false, keuzes: ["afspraak", "taak"], reden: "afspraakwoord zonder tijd" };
  const kaal = w.length === 1 || (w.length <= 3 && ["mijn", "de", "het"].includes(w[0]));   // "huishouden", "mijn wishlist"; niet "was ophangen"
  if (r && r.uitkomst === "zeker" && !tijd && !datum && kaal) return { soort: "zoek", zeker: false, keuzes: ["zoek", "taak"], reden: "lijkt een plek in de app" };
  if (p && (p.titel || datum)) return { soort: "taak", zeker: true, keuzes: ["taak", "afspraak"], reden: datum || tijd ? "datum of tijd" : "iets te doen" };
  return { soort: "gedachte", zeker: false, keuzes: ["gedachte", "taak"], reden: "niet herkend" };
}
/* NATE-VI-EINDE */

V.vi = V.vi || { tekst: "", keuze: null };

function viBegrijp(tekst) {
  const { tekst: zonderReis, reistijd } = viReistijd(tekst);
  const p = parseNL(zonderReis), r = typeof ncBegrijp === "function" ? ncBegrijp(tekst, NATE_INTENTIES) : null;
  const s = viSoort(tekst, p, r);
  return { p, r, s, reistijd, soort: V.vi.keuze || s.soort };
}

function viVoorbeeldHTML(tekst) {
  if (!tekst.trim()) return `<p class="vi-hint">Typ of spreek in (microfoon op je toetsenbord). Bijvoorbeeld: <i>tandarts morgen 14:00 reistijd 25</i> of <i>idee: moestuin op het balkon</i>.</p>`;
  const b = viBegrijp(tekst), soort = b.soort;
  if (soort === "nood") return `<p class="vi-nate">${esc(NATE_INTENTIES.nood.antwoord)}</p><div class="vi-acties"><a class="knop primair" href="tel:08000113">Bel 113</a><a class="knop rand" href="tel:112">Bel 112</a></div>`;
  const chip = (k, v) => v ? `<span class="chip">${esc(k)} ${esc(v)}</span>` : "";
  const titel = soort === "gedachte" && b.r && b.r.uitkomst === "gedachte" ? b.r.tekst : (b.p.titel || tekst.trim());
  let wat = "";
  if (soort === "zoek") { const doel = b.r && b.r.keuzes && b.r.keuzes[0]; wat = doel ? `Ik breng je naar <b>${esc(doel.naam)}</b>.` : "Ik weet nog niet waarheen."; }
  else wat = `<b>${esc(titel)}</b>`;
  const twijfel = !b.s.zeker && !V.vi.keuze;
  return `<p class="vi-nate">${twijfel ? `${esc(VI_SOORTEN[b.s.keuzes[0]].label)} of ${esc(VI_SOORTEN[b.s.keuzes[1]].label.toLowerCase())}? Kies maar.` : `Ik zie een <b>${esc(VI_SOORTEN[soort].label.toLowerCase())}</b>.`}</p>
    <div class="vi-wat">${wat}<div class="chiprij">${chip("📅", b.p.datum ? datumLabel(b.p.datum) : "")}${chip("🕑", b.p.tijd || "")}${b.reistijd ? chip("🚶", b.reistijd + " min reistijd") : ""}${(b.p.personen || []).map(x => chip("👤", x)).join("")}</div></div>
    <div class="vi-soorten" role="radiogroup" aria-label="Soort">${["afspraak", "taak", "gedachte"].concat(soort === "zoek" || b.s.keuzes.includes("zoek") ? ["zoek"] : []).map(k => `<button type="button" role="radio" class="keuze" data-vi-soort="${k}" aria-checked="${!twijfel && soort === k}">${esc(VI_SOORTEN[k].label)}</button>`).join("")}</div>
    <button type="button" class="knop breed primair vi-op" data-vi="op" ${twijfel ? "disabled" : ""}>${esc(twijfel ? "Kies eerst wat het is" : VI_SOORTEN[soort].knop)}</button>`;
}

function viVeldHTML() {
  return `<section class="vi" aria-label="Wat speelt er?">
    <label class="vi-label" for="vi-veld">Wat speelt er?</label>
    <textarea class="invoer vi-veld" id="vi-veld" rows="2" maxlength="300" enterkeyhint="done" autocomplete="off" placeholder="Afspraak, taak, gedachte of vraag">${esc(V.vi.tekst)}</textarea>
    <div class="vi-uit" id="vi-uit" aria-live="polite">${viVoorbeeldHTML(V.vi.tekst)}</div>
  </section>`;
}

let viBezig = false;
async function viOpslaan() {
  if (viBezig) return;
  viBezig = true;
  try { await viOpslaanNu(); } finally { viBezig = false; }
}
async function viOpslaanNu() {
  const tekst = V.vi.tekst.trim(); if (!tekst) return;
  const b = viBegrijp(tekst), soort = b.soort;
  if (!b.s.zeker && !V.vi.keuze) return;
  let toastTekst = "", terug = null;
  if (soort === "taak") {
    const t = await maakTaakUitTekst(viReistijd(tekst).tekst); if (!t) { toast("Niets herkend"); return; }
    toastTekst = "Taak opgeslagen" + (t.datum ? " · " + datumLabel(t.datum) : ""); terug = () => openTaakBlad(t.id);
  } else if (soort === "afspraak") {
    const p = b.p, a = { id: uid(), titel: p.titel || tekst, soort: "gesprek", datum: p.datum || (p.tijd ? vandaagISO() : null), tijd: p.tijd || "", eindTijd: "",
      plek: "", personen: p.personen || [], voorbereiding: "", notities: "", uitkomst: "", reistijd: b.reistijd || 0, buffer: null,
      herhaal: p.herhaal || null, labels: p.labels || [], gemaakt: new Date().toISOString() };
    if (p.project) a.notities = "#" + p.project;
    await bewaar("afspraken", a);
    if (a.herhaal && typeof reeksNieuw === "function") await reeksNieuw("afspraken", a); await logGebeurtenis("afspraak", "Afspraak vastgelegd: " + a.titel, a.id).catch(() => {});
    toastTekst = "Afspraak opgeslagen" + (a.datum ? " · " + datumLabel(a.datum) : ""); terug = () => openAfspraakBlad(a.id);
  } else if (soort === "gedachte") {
    await nvGedachte(b.r && b.r.uitkomst === "gedachte" ? b.r.tekst : tekst);
    toastTekst = "In je mindmap, bij Losse gedachten"; terug = () => ga("mindmap");
  } else if (soort === "zoek") {
    const doel = b.r && b.r.keuzes && b.r.keuzes[0];
    V.vi = { tekst: "", keuze: null };
    if (doel && doel.view) return ga(doel.view);
    if (doel && doel.act) { const k = document.createElement("button"); k.dataset.act = doel.act; k.hidden = true; document.body.appendChild(k); k.click(); k.remove(); }
    return;
  }
  V.vi = { tekst: "", keuze: null };
  tril(6); teken();
  toast(toastTekst, terug ? "Bewerken" : null, terug);
}

/* ---------- In Vastleggen, boven de lagen ---------- */
{
  const _start = vwStart;
  vwStart = function () {
    const h = _start.apply(this, arguments);
    if (V.nwPad && V.nwPad.length) return h;
    // Besluit Kas 2 oktober: "Gedachte naar de mindmap" gaat op in dit veld (Gedachte is een van de soorten).
    const oud = typeof nvGedachteHTML === "function" ? nvGedachteHTML() : "";
    return viVeldHTML() + (oud ? h.replace(oud, "") : h);
  };
}
document.addEventListener("input", e => {
  if (!e.target || e.target.id !== "vi-veld") return;
  V.vi.tekst = e.target.value; V.vi.keuze = null;
  const uit = $("#vi-uit"); if (uit) uit.innerHTML = viVoorbeeldHTML(V.vi.tekst);
});
document.addEventListener("keydown", e => {
  if (e.target && e.target.id === "vi-veld" && e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); viOpslaan(); }
});
document.addEventListener("click", e => {
  const k = e.target.closest && e.target.closest("[data-vi-soort], [data-vi]"); if (!k) return;
  e.preventDefault(); e.stopImmediatePropagation();
  if (k.dataset.viSoort) { V.vi.keuze = k.dataset.viSoort; const uit = $("#vi-uit"); if (uit) uit.innerHTML = viVoorbeeldHTML(V.vi.tekst); return; }
  if (k.dataset.vi === "op") viOpslaan();
}, true);

/* ---------- De chat biedt Vastleggen aan bij een datum of tijd ---------- */
{
  const _begrijp = ncBegrijp;
  ncBegrijp = function (tekst) { V.ncLaatste = tekst; return _begrijp.apply(this, arguments); };
  const _antw = ncAntwoord;
  ncAntwoord = function (r) {
    const a = _antw.apply(this, arguments);
    if (!r || ["nood", "gedachte", "zeker"].includes(r.uitkomst) || r.soort === "hulp") return a;
    const p = parseNL(viReistijd(V.ncLaatste || "").tekst);
    if (!(p.datum || p.tijd)) return a;
    return { tekst: "Dit klinkt als iets om vast te leggen. Zal ik het klaarzetten?",
      knoppen: `<button type="button" class="primair" data-nate="vastleg" data-tekst="${esc(V.ncLaatste)}">Vastleggen</button>` + a.knoppen };
  };
}
document.addEventListener("click", e => {
  const el = e.target.closest && e.target.closest('#nate-paneel [data-nate="vastleg"]'); if (!el) return;
  e.preventDefault(); e.stopImmediatePropagation();
  V.vi = { tekst: el.dataset.tekst || "", keuze: null };
  nateSluit(); V.nwPad = []; ga("start");
  setTimeout(() => { const v = $("#vi-veld"); if (v) { v.focus(); v.setSelectionRange(v.value.length, v.value.length); } }, 300);
}, true);
