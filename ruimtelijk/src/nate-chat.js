"use strict";
// === SECTIE 89: CHAT MET NATE (LOKAAL) ===
/* ==========================================================================
   Stap 6. Je typt een zin in Nate's paneel; Nate zoekt uit waar je heen wilt.
   Geen AI en geen netwerk: alleen trefwoorden en synoniemen uit
   kennis/intenties.json (NATE_INTENTIES), ook met een tikfout.

   De regels, in deze volgorde:
   1. opschonen   — kleine letters, geen accenten of leestekens, stopwoorden eruit
   2. soort vraag — nood, gedachte, hulp, doen, vraag of waar
   3. bestemming  — punten per trefwoord (3) of synoniem (2); een tikfout kost 1 punt
   4. beslissen   — duidelijk de beste? Dan die, met één knop.
   5. twijfel     — twee keuzes, nooit stilletjes gokken
   6. niet begrepen — eerlijk zeggen en drie knoppen
   Bij woorden over zelfbeschadiging of verslaving gaat alles opzij: Nate
   verwijst naar 113 en de huisarts.

   Het begrijpen zelf is puur en wordt getest in tests/intenties.test.mjs.
   ========================================================================== */
/* NATE-CHAT-BEGIN */
// 1. Opschonen: "Wáár staat m'n DAGBOEK??" → "waar staat m n dagboek".
function ncSchoon(tekst) {
  return String(tekst || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim();
}
const ncBevat = (schoon, zin) => (" " + schoon + " ").includes(" " + ncSchoon(zin) + " ");
function ncWoorden(schoon, kennis) {
  const stop = new Set(kennis.stopwoorden.map(ncSchoon));
  return schoon.split(" ").filter(w => w && !stop.has(w));
}
// Afstand tussen twee woorden (Damerau): een letter erbij, eraf, anders, of twee
// letters omgewisseld ("mindamp") telt als één tikfout.
function ncAfstand(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
  }
  return d[a.length][b.length];
}
// Hoeveel tikfouten mag een woord hebben? Tot vier letters geen (anders wordt "doen"
// al "doel"), vanaf vijf letters één, vanaf acht letters twee.
const ncMarge = n => n >= 8 ? 2 : n >= 5 ? 1 : 0;
// 2. Soort vraag.
function ncSoort(schoon, kennis) {
  if (kennis.nood.woorden.some(w => ncBevat(schoon, w))) return "nood";
  if (kennis.gedachteWoorden.some(w => ncBevat(schoon, w))) return "gedachte";
  for (const soort of ["hulp", "doen", "vraag", "waar"]) if (kennis.soorten[soort].some(w => ncBevat(schoon, w))) return soort;
  return "waar";
}
// 3. Punten per bestemming: exact trefwoord 3, synoniem 2; met een tikfout één minder.
function ncPunten(b, schoon, woorden) {
  let punten = 0;
  for (const [lijst, waarde] of [[b.trefwoorden, 3], [b.synoniemen, 2]]) for (const term of lijst) {
    const t = ncSchoon(term);
    if (t.includes(" ")) { if (ncBevat(schoon, t)) punten += waarde; continue; }
    if (woorden.includes(t)) { punten += waarde; continue; }
    const m = ncMarge(t.length);
    if (m && woorden.some(w => w.length >= 5 && ncAfstand(w, t, m) <= m)) punten += waarde - 1;
  }
  return punten;
}
// Tekst na het gedachtewoord: "onthoud: bel oma" → "bel oma".
function ncGedachteTekst(tekst, kennis) {
  const t = String(tekst || "").trim(), laag = t.toLowerCase();
  const dubbele = t.indexOf(":");
  if (dubbele >= 0) return t.slice(dubbele + 1).trim();
  for (const w of kennis.gedachteWoorden.slice().sort((a, b) => b.length - a.length)) {
    const i = laag.indexOf(w);
    if (i >= 0) return (t.slice(0, i) + " " + t.slice(i + w.length)).replace(/\b(mijn|de|in|naar|zet|op)\s*$/i, "").replace(/\s+/g, " ").trim();
  }
  return "";
}
// 4–6. Beslissen. Uitkomst: nood, gedachte, zeker (1 keuze), twijfel (2), onbekend (3 knoppen).
function ncBegrijp(tekst, kennis) {
  const schoon = ncSchoon(tekst), woorden = ncWoorden(schoon, kennis), soort = ncSoort(schoon, kennis);
  const vind = id => kennis.bestemmingen.find(b => b.id === id);
  if (soort === "nood") return { uitkomst: "nood", soort, keuzes: [] };
  if (soort === "gedachte") {
    const rest = ncGedachteTekst(tekst, kennis);
    if (rest) return { uitkomst: "gedachte", soort, tekst: rest, keuzes: [vind("mindmap")] };
  }
  const scores = kennis.bestemmingen.map(b => ({ b, p: ncPunten(b, schoon, woorden) })).filter(x => x.p > 0).sort((a, b) => b.p - a.p);
  const [een, twee] = scores;
  // Duidelijk: minstens een synoniem (2 punten) en minstens 2 punten voor op de tweede.
  if (een && een.p >= 2 && (!twee || een.p - twee.p >= 2)) return { uitkomst: "zeker", soort, keuzes: [een.b] };
  if (een) {
    // Twijfel: altijd twee keuzes. Is er maar één kandidaat, dan Zoeken als tweede.
    const tweede = twee ? twee.b : vind(een.b.id === "zoeken" ? "mindmap" : "zoeken");
    return { uitkomst: "twijfel", soort, keuzes: [een.b, tweede] };
  }
  // Hulp zonder bestemming: Anker om te landen, of Mijn dag voor één klein ding.
  if (soort === "hulp") return { uitkomst: "twijfel", soort, keuzes: [vind("anker"), vind("mijndag")] };
  return { uitkomst: "onbekend", soort, keuzes: kennis.nietBegrepen.knoppen.map(vind) };
}
/* NATE-CHAT-EINDE */

/* ---------- 89.1 Nate's antwoorden ----------
   Hooguit twee zinnen, één uitroepteken, geen "moet". */
const NC_TEKST = {
  label: "Vraag Nate",
  plaats: "Bijvoorbeeld: waar staat mijn dagboek?",
  zeker: { zacht: n => `Hier is ${n}.`, normaal: n => `Komt eraan: ${n}.`, vol: n => `Hup, naar ${n}!` },
  twijfel: (a, b) => `Bedoel je ${a} of ${b}? Kies maar.`,
  hulp: { zacht: "Je hoeft niet de hele berg op. Wil je even landen, of één klein ding kiezen?", normaal: "Je hoeft niet de hele berg op, alleen je schoenen aan. Even landen, of één klein ding kiezen?" },
  gedachte: t => `Zal ik "${t}" in je mindmap zetten, bij Losse gedachten?`,
  gedachteJa: "Ja, zet erin",
  gedachteNee: "Nee, laat maar",
  gedachteKlaar: "Staat erin. Je hoofd is weer een beetje leger.",
  naar: n => `Naar ${n}`
};
V.nateChat = V.nateChat || [];   // alleen voor deze sessie, niets wordt bewaard

function ncKnop(b, primair) {
  const doel = b.act ? `data-nate="chat-act" data-actie="${esc(b.act)}"` : `data-nate="ga" data-view="${esc(b.view)}"`;
  return `<button type="button" class="${primair ? "primair" : ""}" ${doel}>${esc(NC_TEKST.naar(b.naam))}</button>`;
}
function ncAntwoord(r) {
  const k = r.keuzes.filter(Boolean);
  if (r.uitkomst === "nood") return { tekst: NATE_INTENTIES.nood.antwoord, knoppen: `<a class="primair" href="tel:08000113">Bel 113</a><a href="tel:112">Bel 112</a>` };
  if (r.uitkomst === "gedachte") return { tekst: NC_TEKST.gedachte(r.tekst), knoppen: `<button type="button" class="primair" data-nate="chat-gedachte" data-tekst="${esc(r.tekst)}">${NC_TEKST.gedachteJa}</button><button type="button" data-nate="chat-nee">${NC_TEKST.gedachteNee}</button>` };
  if (r.uitkomst === "zeker") return { tekst: nateZeg(NC_TEKST.zeker, k[0].naam), knoppen: ncKnop(k[0], true) };
  if (r.uitkomst === "twijfel") return { tekst: r.soort === "hulp" && k[0].id === "anker" ? nateZeg(NC_TEKST.hulp) : NC_TEKST.twijfel(k[0].naam, k[1].naam), knoppen: k.map((b, i) => ncKnop(b, i === 0)).join("") };
  return { tekst: NATE_INTENTIES.nietBegrepen.antwoord, knoppen: k.map(b => ncKnop(b, false)).join("") };
}
function ncHTML() {
  const regels = V.nateChat.slice(-4).map(x => x.van === "jij"
    ? `<li class="nc-jij"><span class="sr-only">Jij: </span>${esc(x.tekst)}</li>`
    : `<li class="nc-nate"><span class="sr-only">Nate: </span>${esc(x.tekst)}${x.knoppen ? `<div class="nate-acties">${x.knoppen}</div>` : ""}</li>`).join("");
  return `<h3 class="nate-sectie">${NC_TEKST.label}</h3>
    ${regels ? `<ul class="nc-gesprek" aria-live="polite">${regels}</ul>` : ""}
    <form class="nc-vorm" autocomplete="off"><label class="sr-only" for="nc-veld">${NC_TEKST.label}</label>
      <input class="invoer" id="nc-veld" maxlength="160" placeholder="${esc(NC_TEKST.plaats)}" enterkeyhint="send">
      <button class="knop primair" type="submit" aria-label="Versturen">${ico("stuur")}</button></form>`;
}

/* ---------- 89.2 In Nate's paneel ---------- */
{
  const _teken = nateTeken;
  nateTeken = function () {
    _teken.apply(this, arguments);
    const voet = document.querySelector("#nate-paneel .nate-voet");
    if (voet) voet.outerHTML = `<div class="nc">${ncHTML()}</div>`;
  };
}
document.addEventListener("submit", e => {
  const f = e.target.closest && e.target.closest(".nc-vorm"); if (!f) return;
  e.preventDefault();
  const veld = f.querySelector("#nc-veld"), tekst = veld.value.trim(); if (!tekst) return;
  const a = ncAntwoord(ncBegrijp(tekst, NATE_INTENTIES));
  V.nateChat.push({ van: "jij", tekst }, { van: "nate", tekst: a.tekst, knoppen: a.knoppen });
  nateTeken();
  const nieuw = $("#nc-veld"); if (nieuw) nieuw.focus();
});
document.addEventListener("click", async e => {
  const el = e.target.closest && e.target.closest('#nate-paneel [data-nate^="chat-"]'); if (!el) return;
  e.preventDefault(); e.stopImmediatePropagation();
  const soort = el.dataset.nate;
  if (soort === "chat-gedachte") {
    await nvGedachte(el.dataset.tekst);
    V.nateChat.push({ van: "nate", tekst: NC_TEKST.gedachteKlaar });
    nateTeken(); tril(6);
  } else if (soort === "chat-nee") { V.nateChat.push({ van: "nate", tekst: "Prima." }); nateTeken(); }
  else if (soort === "chat-act") {
    nateSluit();
    const b = document.createElement("button"); b.dataset.act = el.dataset.actie; b.hidden = true;
    document.body.appendChild(b); b.click(); b.remove();
  }
}, true);
