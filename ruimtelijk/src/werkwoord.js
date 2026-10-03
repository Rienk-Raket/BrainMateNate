"use strict";
// === SECTIE 101: WERKWOORDCHECK — "WAT IS DE EERSTE HANDELING?" (V12) ===
/* ==========================================================================
   Conceptvoorstel V12. Taken als "belasting", "regelen" of "tandarts" zijn
   te vaag om te starten (schakel 5: concreet maken). Nate vraagt één keer
   naar de eerste handeling, met suggesties; overslaan mag altijd.
   - Vastleggen ("Wat speelt er?"): direct na het opslaan van een vage taak.
   - Taakblad: een knop "Eerste handeling kiezen" bij een vage taak zonder stappen.
   - Nu-kaart: "Nog vaag?" bij een vage taak zonder eerste handeling.
   De eerste handeling wordt de bovenste subtaak (zoals bij Ik loop vast, V7)
   en staat op de Nu-kaart. Per taak hooguit één keer gevraagd (wwGevraagd).

   De kern (NATE-WERKWOORD-BEGIN/EINDE) is puur en wordt getest in tests/frictie-werkwoord.test.mjs.
   ========================================================================== */

/* NATE-WERKWOORD-BEGIN */
const WW_VAAG = ["regelen", "doen", "fixen", "uitzoeken", "oppakken", "afhandelen", "organiseren", "iets", "dingen", "zaken", "gedoe", "spullen", "kijken", "nadenken"];
const WW_GEBIEDEND = ["bel", "mail", "app", "koop", "schrijf", "maak", "stuur", "betaal", "plan", "lees", "zoek", "pak", "leg", "zet", "breng", "haal", "check", "vul", "print", "open", "was", "ruim", "boek", "vraag", "zeg", "geef", "teken", "scan", "upload", "download", "bestel"];
const WW_SUGGESTIES = [
  [/belasting|aangifte|toeslag/, ["Inlogpagina openen", "Map met papieren pakken", "DigiD-app klaarzetten"]],
  [/tandarts|huisarts|dokter|kapper|afspraak/, ["Telefoonnummer opzoeken", "Agenda openen voor een datum", "Bellen tijdens openingstijd"]],
  [/administratie|post|papieren|brief/, ["Stapel op tafel leggen", "Bovenste brief openen", "Prullenbak ernaast zetten"]],
  [/verjaardag|cadeau/, ["Datum in de agenda zetten", "Drie ideeën opschrijven", "Budget kiezen"]],
  [/opruimen|schoonmaken|huis|kamer|keuken|zolder/, ["Eén vuilniszak pakken", "Timer op 5 minuten", "Alles van één plank pakken"]],
  [/verzekering|abonnement|contract/, ["Polis of contract opzoeken", "Website openen", "Klantnummer opschrijven"]]
];
const WW_STANDAARD = ["Bestand openen", "Telefoon pakken", "Spullen klaarleggen", "Eén zin opschrijven"];

function wwWoorden(t) { return String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]+/g, " ").trim().split(/\s+/).filter(Boolean); }
/** Is deze taaktitel te vaag om te starten? Vaag woord, of geen werkwoord (geen -en-vorm en geen gebiedende wijs). */
function wwVaag(titel) {
  const w = wwWoorden(titel);
  if (!w.length) return false;
  if (w.some(x => WW_VAAG.includes(x))) return true;
  if (w.some(x => WW_GEBIEDEND.includes(x))) return false;
  const werkwoord = w.some(x => x.length >= 5 && /(en|eren|elen)$/.test(x) && !["keuken", "toeslagen", "papieren", "spullen", "zaken", "dingen", "kinderen", "boodschappen"].includes(x));
  return !werkwoord && w.length <= 4;
}
/** Drie suggesties voor de eerste handeling, passend bij de titel. */
function wwSuggesties(titel) {
  const t = wwWoorden(titel).join(" ");
  for (const [re, s] of WW_SUGGESTIES) if (re.test(t)) return s;
  return WW_STANDAARD.slice(0, 3);
}
/** Moet Nate vragen? Vaag, open, nog niet gevraagd en nog geen open stap. */
function wwVragen(t) {
  return !!t && !t.af && !t.wwGevraagd && wwVaag(t.titel) && !(t.subtaken || []).some(s => !s.af && String(s.tekst || "").trim());
}
/* NATE-WERKWOORD-EINDE */

/* ---------- 101.1 Het vraagblok (inline, geen pop-up) ---------- */
function wwVraagHTML(t, klasse) {
  return `<div class="ww-vraag ${klasse || ""}" data-ww-taak="${esc(t.id)}">
    <p class="ww-zin">Wat is de eerste handeling voor <b>${esc(t.titel)}</b>?</p>
    <label class="sr-only" for="ww-veld-${esc(t.id)}">Eerste handeling</label>
    <input class="invoer ww-veld" id="ww-veld-${esc(t.id)}" maxlength="80" autocomplete="off" enterkeyhint="done" placeholder="${esc(wwSuggesties(t.titel)[0])}">
    <div class="chiprij ww-suggesties">${wwSuggesties(t.titel).map(s => `<button type="button" class="keuze" data-ww-vb="${esc(s)}">${esc(s)}</button>`).join("")}</div>
    <div class="ww-knoppen"><button type="button" class="knop primair" data-ww="op">Opslaan</button><button type="button" class="knop rand" data-ww="over">Overslaan</button></div>
    <details class="iv-waarom"><summary>Waarom zeg je dit?</summary><p>Een stap die met een werkwoord begint en meteen kan starten, is makkelijker te beginnen dan een vage taak. Indirect: dit komt uit onderzoek naar plannen en taakopdeling, niet specifiek bij ADHD.</p></details>
  </div>`;
}
async function wwBewaar(id, tekst) {
  const t = vind("taken", id); if (!t) return;
  t.wwGevraagd = true;
  if (tekst && tekst.trim()) t.subtaken = normaliseerSubtaken(ivMetStap(t.subtaken, tekst.trim()));
  await bewaar("taken", t);
}
document.addEventListener("click", async e => {
  const vb = e.target.closest && e.target.closest("[data-ww-vb]");
  if (vb) { const v = vb.closest(".ww-vraag").querySelector(".ww-veld"); v.value = vb.dataset.wwVb; v.focus(); return; }
  const b = e.target.closest && e.target.closest("[data-ww]"); if (!b) return;
  e.preventDefault(); e.stopImmediatePropagation();
  const blok = b.closest(".ww-vraag"), id = blok.dataset.wwTaak, tekst = b.dataset.ww === "op" ? blok.querySelector(".ww-veld").value : "";
  if (b.dataset.ww === "op" && !tekst.trim()) { toast("Schrijf eerst één handeling op, of sla over"); return; }
  await wwBewaar(id, tekst);
  if (blok.classList.contains("ww-vi")) { blok.remove(); }
  tril(6); teken();
  if (tekst) toast("Eerste handeling staat bovenaan.");
}, true);
document.addEventListener("keydown", e => {
  if (e.key !== "Enter" || !e.target.classList || !e.target.classList.contains("ww-veld")) return;
  e.preventDefault(); const k = e.target.closest(".ww-vraag").querySelector('[data-ww="op"]'); if (k) k.click();
});

/* ---------- 101.2 Vastleggen: direct na het opslaan ---------- */
{
  const _op = viOpslaanNu;
  viOpslaanNu = async function () {
    const voor = new Set(S.taken.map(t => t.id));
    const r = await _op.apply(this, arguments);
    const nieuw = S.taken.find(t => !voor.has(t.id));
    if (nieuw && wwVragen(nieuw)) {
      // Na teken(): het blok komt onder het veld, waar je net typte.
      setTimeout(() => { const uit = document.querySelector("#scherm #vi-uit"); if (uit) uit.innerHTML = wwVraagHTML(nieuw, "ww-vi"); }, 0);
    }
    return r;
  };
}

/* ---------- 101.3 Taakblad: knop bij een vage taak zonder stappen ---------- */
{
  const _open = openTaakBlad;
  openTaakBlad = function (id) {
    const r = _open.apply(this, arguments), t = id && vind("taken", id), titel = $("#f-titel");
    if (t && titel && wwVragen(t) && !$("#ww-knop"))
      titel.closest(".veld").insertAdjacentHTML("beforeend", `<button type="button" class="dk-neem ww-knop" id="ww-knop" data-iv-route="${esc(t.id)}">Nog vaag? Eerste handeling kiezen</button>`);
    return r;
  };
}
/* ---------- 101.4 Nu-kaart: "Nog vaag?" ---------- */
{
  const _html = mdNuHTML;
  mdNuHTML = function () {
    let h = _html.apply(this, arguments);
    const een = mdNu().een;
    if (een && wwVragen(een) && !(typeof ivEersteStap === "function" && ivEersteStap(een)))
      h = h.replace('<div class="md-nu-acties">', `<p class="ww-nu"><button type="button" class="dk-neem" data-iv-route="${esc(een.id)}">Nog vaag? Eerste handeling kiezen</button></p><div class="md-nu-acties">`);
    return h;
  };
}
// Beide knoppen openen de route "Onduidelijk" van Ik loop vast (V7): één plek voor de eerste handeling.
document.addEventListener("click", async e => {
  const b = e.target.closest && e.target.closest("[data-iv-route]"); if (!b) return;
  e.preventDefault(); e.stopImmediatePropagation();
  const t = vind("taken", b.dataset.ivRoute); if (!t) return;
  t.wwGevraagd = true; await bewaar("taken", t);
  ivRoute(t, ivOorzaak("onduidelijk"));
}, true);
