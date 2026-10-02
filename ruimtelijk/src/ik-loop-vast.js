"use strict";
// === SECTIE 90: IK LOOP VAST (V7) ===
/* ==========================================================================
   Conceptvoorstel V7. Eén knop op de Nu-kaart en in elk taakblad. Eén vraag:
   wat is het lastigst? Elk antwoord leidt naar één handeling (90-seconden-
   onderzoek en tabel "weerstand herkennen" uit categorie 3). Loslaten naar
   morgen is altijd een geldige keuze, zonder schuld.

   De kern (NATE-VAST-BEGIN/EINDE) is puur en wordt getest in tests/vast.test.mjs.
   Elk gebruik komt in de instelling ivLog (voor de meting "vast → stap binnen 24 uur").
   ========================================================================== */

/* NATE-VAST-BEGIN */
const IV_BEWIJS = "Praktisch: een samenvoeging van onderdelen uit ADHD-gerichte begeleiding, niet als geheel onderzocht. Probeer het als experiment.";
const IV_OORZAKEN = [
  { id: "onduidelijk", label: "Onduidelijk", sub: "Ik weet niet waar ik begin",
    zin: "Begin bij wat je handen als eerste doen.",
    vraag: "Wat is de eerste handeling?", voorbeelden: ["Bestand openen", "Telefoon pakken", "Spullen klaarleggen", "Eén zin opschrijven"],
    knop: "Opslaan en beginnen", actie: "stap", duur: 5, timer: true,
    waarom: "Een stap die met een werkwoord begint en een duidelijk eindpunt heeft, is makkelijker te starten dan een vage taak." },
  { id: "groot", label: "Te groot", sub: "Het voelt als een berg",
    zin: "Kies een stuk van vijf minuten.",
    vraag: "Wat past in vijf minuten?", voorbeelden: ["Eerste alinea", "Eén la", "Alleen de mail openen", "Vijf dingen opruimen"],
    knop: "Opslaan en 5 minuten starten", actie: "stap", duur: 5, timer: true,
    waarom: "Kleine stappen maken het begin lichter; de rest komt daarna aan de beurt." },
  { id: "saai", label: "Saai", sub: "Het trekt niet",
    zin: "Een kort blok van tien minuten, daarna mag je stoppen.",
    knop: "Start 10 minuten", actie: "timer", duur: 10,
    tweede: { label: "Afleiding parkeren", actie: "parkeer" },
    waarom: "Een blok met een duidelijk einde vraagt minder volhouden dan een open taak." },
  { id: "spannend", label: "Spannend", sub: "Ik zie er tegenop",
    zin: "Eerst even landen, dan een ruwe versie die niemand ziet.",
    knop: "Even landen", actie: "anker",
    tweede: { label: "Ruwe versie starten", actie: "timer", duur: 10 },
    waarom: "Spanning zakt vaak als je lijf eerst rustiger wordt en de lat tijdelijk lager ligt." },
  { id: "leeg", label: "Leeg", sub: "Ik heb er de energie niet voor",
    zin: "Op een lege dag telt de kleinste versie ook.",
    knop: "Twee minuten, dan stoppen", actie: "timer", duur: 2,
    tweede: { label: "Nieuw moment kiezen", actie: "uitstel" },
    waarom: "Een minimumversie houdt de draad vast zonder je leeg te trekken." }
];
const IV_LOSLATEN = { label: "Loslaten naar morgen", toast: "Staat op morgen. Een nieuw moment is ook een plan." };

function ivOorzaak(id) { return IV_OORZAKEN.find(o => o.id === id) || null; }

/** Een nieuwe eerste stap bovenaan de subtaken; dubbele tekst wordt niet nog eens toegevoegd. */
function ivMetStap(subtaken, tekst) {
  const t = String(tekst || "").trim();
  const lijst = (subtaken || []).slice();
  if (!t) return lijst;
  if (lijst.some(s => !s.af && String(s.tekst || "").trim().toLowerCase() === t.toLowerCase())) return lijst;
  return [{ tekst: t, af: false, eerste: true }].concat(lijst.map(s => { const k = Object.assign({}, s); delete k.eerste; return k; }));
}

/** De eerste open stap (voor de Nu-kaart). */
function ivEersteStap(t) {
  const s = (t && t.subtaken || []).find(x => !x.af && String(x.tekst || "").trim());
  return s ? s.tekst : null;
}

/** Meting uit het plan: is na "Ik loop vast" binnen 24 uur een stap afgerond? */
function ivMeting(log, taken, nu) {
  const dag = 24 * 3600 * 1000, n = nu || Date.now();
  let gebruikt = 0, gevolgd = 0;
  for (const r of log || []) {
    const ts = Date.parse(r.ts); if (!(ts <= n)) continue;
    gebruikt++;
    const t = (taken || []).find(x => x.id === r.taakId);
    const binnen = x => x && Date.parse(x) >= ts && Date.parse(x) - ts <= dag;
    const klaar = t && (binnen(t.afOp) || (t.subtaken || []).some(s => s.af && binnen(s.afOp)));
    if (klaar) gevolgd++;
  }
  return { gebruikt, gevolgd };
}
/* NATE-VAST-EINDE */

const ivLog = () => inst("ivLog", []) || [];
async function ivLogVoeg(taakId, oorzaak, actie) {
  const log = ivLog().concat({ ts: new Date().toISOString(), taakId, oorzaak, actie }).slice(-200);
  await zetInst("ivLog", log);
}

function ivKnop(id, klasse) {
  return `<button type="button" class="knop rand iv-knop ${klasse || ""}" data-iv="${esc(id)}">${ico("bliksem")} Ik loop vast</button>`;
}

function ivOpen(taakId) {
  const t = vind("taken", taakId); if (!t) return;
  bladOpen("Wat is het lastigst?", `<p class="klein iv-titel">${esc(t.titel)}</p>
    <div class="iv-keuzes">${IV_OORZAKEN.map(o => `<button type="button" class="iv-keuze" data-iv-oorzaak="${o.id}"><b>${esc(o.label)}</b><small>${esc(o.sub)}</small></button>`).join("")}</div>
    <button type="button" class="iv-los" data-iv-los="1">${esc(IV_LOSLATEN.label)}</button>
    ${(m => m.gebruikt >= 3 ? `<p class="klein iv-meting">Eerder: ${m.gevolgd} van de ${m.gebruikt} keer kwam er binnen een dag een stap af.</p>` : "")(ivMeting(ivLog(), S.taken))}`);
  $("#bladinhoud").onclick = e => {
    const k = e.target.closest("[data-iv-oorzaak]");
    if (k) return ivRoute(t, ivOorzaak(k.dataset.ivOorzaak));
    if (e.target.closest("[data-iv-los]")) return ivLoslaten(t);
  };
}

function ivRoute(t, o) {
  if (!o) return;
  const invoer = o.actie === "stap";
  const tweede = o.tweede ? `<button class="knop breed rand" id="iv-tweede">${esc(o.tweede.label)}</button>` : "";
  bladOpen(o.label, `<p class="iv-zin">${esc(o.zin)}</p>
    ${invoer ? `<div class="veld"><label for="iv-stap">${esc(o.vraag)}</label>
      <input class="invoer" id="iv-stap" type="text" autocomplete="off" enterkeyhint="done" value="${esc(ivEersteStap(t) || "")}" placeholder="${esc(o.voorbeelden[0])}"></div>
      <div class="chiprij iv-voorbeelden">${o.voorbeelden.map(v => `<button type="button" class="keuze" data-iv-vb="${esc(v)}">${esc(v)}</button>`).join("")}</div>` : ""}
    <details class="iv-waarom"><summary>Waarom zeg je dit?</summary><p>${esc(o.waarom)} ${esc(IV_BEWIJS)}</p></details>
    <button type="button" class="iv-los" id="iv-los">${esc(IV_LOSLATEN.label)}</button>`,
    `<button class="knop breed primair" id="iv-doe">${esc(o.knop)}</button>${tweede}`);
  const veld = $("#iv-stap");
  if (veld) {
    $("#bladinhoud").addEventListener("click", e => { const v = e.target.closest("[data-iv-vb]"); if (v) { veld.value = v.dataset.ivVb; veld.focus(); } });
    veld.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); $("#iv-doe").click(); } };
    setTimeout(() => veld.focus(), 260);
  }
  $("#iv-los").onclick = () => ivLoslaten(t);
  $("#iv-doe").onclick = () => ivDoe(t, o, { actie: o.actie, duur: o.duur, timer: o.timer }, veld && veld.value);
  if (o.tweede) $("#iv-tweede").onclick = () => ivDoe(t, o, o.tweede, veld && veld.value);
}

async function ivDoe(t, o, stap, tekst) {
  let bovenaan = true;
  if (stap.actie === "stap") {
    if (!String(tekst || "").trim()) { toast("Schrijf eerst één handeling op"); return; }
    const voor = (t.subtaken || []).length;
    t.subtaken = normaliseerSubtaken(ivMetStap(t.subtaken, tekst));
    bovenaan = t.subtaken.length > voor;
    await bewaar("taken", t);
  }
  await ivLogVoeg(t.id, o.id, stap.actie);
  bladSluit();
  if (stap.actie === "anker") { ga("anker"); return; }
  if (stap.actie === "uitstel") { openSnoozeBlad(t.id); return; }
  if (stap.actie === "parkeer") {
    bladVraag("Afleiding parkeren", "", "Wat schiet je te binnen?", async tekst2 => {
      if (!tekst2) return;
      await logGebeurtenis("notitie", "Geparkeerd: " + tekst2);
      startTimer(t.id); teken(); toast("Geparkeerd. Tien minuten lopen.");
    }, true);
    return;
  }
  if (stap.actie === "timer" || stap.timer) startTimer(t.id);
  teken();
  if (stap.actie === "stap") toast((bovenaan ? "Eerste stap staat bovenaan." : "Die stap stond er al.") + (stap.timer ? " De timer loopt." : ""));
}

async function ivLoslaten(t) {
  t.datum = plusDagen(vandaagISO(), 1); t.tijd = t.tijd || "";
  t.uitgesteld = (t.uitgesteld || 0) + 1; t.uitgesteldTot = null;
  await bewaar("taken", t);
  if (typeof plangMeldingen === "function") plangMeldingen();
  await ivLogVoeg(t.id, "los", "morgen");
  bladSluit(); teken(); toast(IV_LOSLATEN.toast);
}

// Knop in het taakblad, naast Timer.
{
  const _open = openTaakBlad;
  openTaakBlad = function (id) {
    const r = _open.apply(this, arguments);
    const t = id && vind("taken", id), timer = $('#bladinhoud [data-taakactie="timer"]') || $('#blad [data-taakactie="timer"]');
    if (t && !t.af && timer && !$("#blad [data-iv]")) timer.insertAdjacentHTML("beforebegin", ivKnop(t.id, "klein"));
    return r;
  };
}
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest("[data-iv]"); if (!b) return;
  e.preventDefault(); e.stopImmediatePropagation();
  ivOpen(b.dataset.iv);   // bladOpen vervangt een open taakblad meteen
}, true);

// Tijdstip bij het afvinken van een subtaak (voor de meting hierboven).
{
  const _vink = subVink;
  subVink = function (lijst, i) {
    const af = _vink.apply(this, arguments);
    if (lijst && lijst[i]) { if (af) lijst[i].afOp = new Date().toISOString(); else delete lijst[i].afOp; }
    return af;
  };
}
