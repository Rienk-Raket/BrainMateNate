"use strict";
// === SECTIE 93: MIJN AANPAK — ÉÉN PROFIEL DAT DE APP AANPAST (V2) ===
/* ==========================================================================
   Conceptvoorstel V2, besluit Kas 2 oktober 2026: het oude profiel (tien
   vragen, sectie 76) vervalt. Vanaf nu stuurt het profiel uit de
   kennismaking (96 vragen, sectie 85/86) de hele app.

   - aanpak(): de profiel-service. Leest de patronen (hooguit drie) en geeft
     de richting door aan ndAanpak(), ndTip() en ndDichtheid(), die de
     modules al gebruiken (Huishouden, Anker, Lijstjes, Wishlist …).
   - Scherm "Mijn aanpak" (Meer → Profiel): de patronen, wat Nate al afstemt,
     en aanpassingen met een schakelaar, een "Waarom zeg je dit?" en het
     bewijsniveau. Nate zet niets nieuws aan: hij stelt voor, jij tikt.
   - Vaste indeling: dan verschuift er niets vanzelf (V4, Ruimtes).

   De kern (NATE-AANPAK-BEGIN/EINDE) is puur en wordt getest in tests/aanpak.test.mjs.
   ========================================================================== */

/* NATE-AANPAK-BEGIN */
/** Van patronen naar de richting die de bestaande modules kennen (adhd, autisme, audhd, energie, geen). */
function apRichting(top) {
  const ids = (top || []).map(c => c.id || c);
  const A = ids.includes("P1") || ids.includes("P2"), S = ids.includes("P3"), E = ids.includes("P7");
  return { richting: A && S ? "audhd" : A ? "adhd" : S ? "autisme" : E ? "energie" : "geen", energie: E };
}

const AP_BEWIJS = { direct: "Direct: bij ADHD onderzocht.", indirect: "Indirect: onderzocht, maar niet specifiek bij ADHD.", praktisch: "Praktisch: laag risico en nog een experiment, dus kijk of het bij jou werkt." };

/* Aanpassingen. "patronen" = voor wie Nate het voorstelt (bijlage A van het conceptvoorstel). */
const AP_AANPASSINGEN = [
  { id: "vast", label: "Vaste indeling", uitleg: "Niets verschuift vanzelf. Nate stelt alleen voor.", patronen: ["P3"],
    waarom: "Een scherm dat steeds hetzelfde is, kost minder energie om te lezen en geeft rust.", bewijs: "indirect" },
  { id: "rustig", label: "Rustig scherm", uitleg: "Weinig tegelijk, één voorstel.", patronen: ["P1", "P7"],
    waarom: "Minder keuzes op één scherm maakt kiezen makkelijker en sneller.", bewijs: "indirect" },
  { id: "beweging", label: "Minder beweging", uitleg: "Geen schuivende of stuiterende onderdelen.", patronen: ["P3", "P4"],
    waarom: "Beweging trekt aandacht; minder beweging geeft minder prikkels tijdens het lezen.", bewijs: "praktisch" },
  { id: "zacht", label: "Zachte toon van Nate", uitleg: "Nate praat rustiger en korter.", patronen: ["P5", "P7"],
    waarom: "Een vriendelijke toon na een lastig moment helpt om weer op te pakken in plaats van te vermijden.", bewijs: "praktisch" },
  { id: "vast-knop", label: "Ik loop vast op de Nu-kaart", uitleg: "Eén tik naar een eerste handeling.", patronen: ["P1", "P2", "P5"],
    waarom: "Op het moment dat je vastzit, helpt één kleine stap meer dan een plan.", bewijs: "praktisch" },
  { id: "wekker", label: "Wekker voor vertrekken", uitleg: "Bij afspraken van vandaag, via Opdrachten.", patronen: ["P1", "P2"],
    waarom: "Een alarm op het vertrekmoment helpt beter dan een lijst die je zelf nakijkt.", bewijs: "indirect" }
];

/** Welke aanpassingen stelt Nate voor bij deze patronen? */
function apVoorgesteld(top) {
  const ids = (top || []).map(c => c.id || c);
  return AP_AANPASSINGEN.filter(a => a.patronen.some(p => ids.includes(p))).map(a => a.id);
}
/* NATE-AANPAK-EINDE */

/* ---------- 93.1 De profiel-service ---------- */
function aanpak() {
  let top = [], disclaimer = "", klaar = false;
  try {
    const d = knData(), p = knProfiel(d);
    klaar = !!p.kernKlaar; disclaimer = p.disclaimer || "";
    top = klaar ? (p.top || []) : [];   // pas patronen na de zestien kernvragen (zoals de tips)
  } catch (e) { /* geen kennismaking: algemene aanpak */ }
  const r = apRichting(top);
  // Zonder kennismaking telt een eerder zelf gekozen richting nog (niet de tien vragen).
  const hand = !klaar && typeof pfProfiel === "function" ? pfProfiel().nd.handmatig : null;
  return { top, klaar, disclaimer, richting: hand || r.richting, energie: r.energie, voorgesteld: apVoorgesteld(top) };
}
// Opnieuw rekenen alleen als de kennismaking veranderd is (knZet en import zetten een nieuw object).
let apCache = null, apBron;
function apNu() {
  const bron = inst("nate_km", null);
  if (!apCache || bron !== apBron) {
    apCache = aanpak(); apBron = bron;
    // Anker krijgt een passend profiel (alleen als daar nog niets gekozen is).
    if (apCache.klaar && typeof pfSyncAnker === "function") setTimeout(() => pfSyncAnker().catch(() => {}), 0);
  }
  return apCache;
}

// Het oude profiel vervalt: de richting komt voortaan uit Mijn aanpak.
pfRichting = function () { return apNu().richting; };
ndAanpak = function () {
  const r = pfRichting(), a = Object.assign({ richting: r }, ND_AANPAK[r] || ND_AANPAK.geen), ev = FM_KENNIS.energieVlag;
  // Het oude energievinkje telt niet meer; de Batterij (P7) wel.
  if (r !== "energie" && apNu().energie) Object.assign(a, { pauzeElke: Math.min(a.pauzeElke, ev.pauzeElkeMax), pauzeMin: Math.max(a.pauzeMin, ev.pauzeMinMin), maxSessie: ev.maxSessie, extraEnergie: true });
  return a;
};

// Rustig scherm gaat niet meer vanzelf aan bij een richting: Nate stelt het voor in Mijn aanpak.
ndDichtheidStandaard = function () { return "normaal"; };

/* ---------- 93.2 Aanpassingen lezen en zetten (bestaande instellingen) ---------- */
const AP_LEES = {
  vast: () => !!inst("vasteIndeling", false),
  rustig: () => (typeof ndDichtheid === "function" ? ndDichtheid() : inst("ndDichtheid", "normaal")) === "rustig",
  beweging: () => inst("beweging", "vol") === "rustig",
  zacht: () => (typeof nateStand === "function" ? nateStand() : inst("nateEnergie", "normaal")) === "zacht",
  "vast-knop": () => inst("ivNu", true) !== false,
  wekker: () => (inst("tpAlarmen", {}) || {}).wekker !== false
};
const AP_ZET = {
  vast: aan => zetInst("vasteIndeling", aan),
  rustig: async aan => { if (aan) await zetInst("apVorigDicht", inst("ndDichtheid", null)); await zetInst("ndDichtheid", aan ? "rustig" : (inst("apVorigDicht", null) && inst("apVorigDicht") !== "rustig" ? inst("apVorigDicht") : "normaal")); },
  beweging: async aan => { await zetInst("beweging", aan ? "rustig" : "vol"); document.documentElement.dataset.beweging = aan ? "rustig" : "vol"; },
  zacht: async aan => {
    if (aan) { if (inst("nateEnergie", "normaal") !== "zacht") await zetInst("apVorigeToon", inst("nateEnergie", "normaal")); await zetInst("nateEnergie", "zacht"); }
    else await zetInst("nateEnergie", inst("apVorigeToon", "normaal") === "zacht" ? "normaal" : inst("apVorigeToon", "normaal"));
  },
  "vast-knop": aan => zetInst("ivNu", aan),
  wekker: aan => zetInst("tpAlarmen", Object.assign({}, inst("tpAlarmen", {}) || {}, { wekker: aan }))
};

/* ---------- 93.3 Het scherm Mijn aanpak ---------- */
function apAutoHTML() {
  const a = ndAanpak(), regels = [];
  if (a.blokMax) regels.push(`Klussen in blokken van hooguit ${a.blokMax} minuten`);
  if (a.pauzeElke) regels.push(`Na ${a.pauzeElke} minuten een pauze van ${a.pauzeMin} minuten`);
  if (a.afkoelUur) regels.push(`Bij aankopen boven € 50 eerst ${a.afkoelUur} uur afkoelen`);
  if (a.extraEnergie || a.richting === "energie") regels.push("Kortere sessies, want energie is kostbaar");
  return regels.length ? `<ul class="ap-auto">${regels.map(r => `<li>${esc(r)}</li>`).join("")}</ul>` : "";
}
function vwAanpak() {
  const ap = aanpak();
  let h = "";
  h += `<div class="card card-pad ap-patronen"><span class="labeltekst">Jouw patronen</span>`;
  if (!ap.klaar) h += `<p>Nog geen patronen. Na de kennismaking kan Nate de app op je afstemmen.</p><button class="knop breed primair" data-act="ga" data-view="kennismaking">Kennismaken met Nate</button>`;
  else if (!ap.top.length) h += `<p>In je antwoorden zie ik weinig gemelde behoefte. Je krijgt de standaardaanpak; alles hieronder kun je zelf aanzetten.</p>`;
  else h += `<ul class="ap-lijst">${ap.top.map(c => `<li><b>${esc(c.metafoor)}</b><small>${esc(c.naam)}</small></li>`).join("")}</ul>${ap.top.length > 1 ? `<p class="klein">Meerdere patronen tegelijk is heel gewoon. Er is geen winnaar.</p>` : ""}`;
  h += `</div>`;
  const auto = apAutoHTML();
  if (auto) h += sectie("Wat Nate al afstemt") + `<div class="card card-pad">${auto}<details class="iv-waarom"><summary>Waarom zeg je dit?</summary><p>Korte blokken met pauzes en een afkoeltijd bij aankopen sluiten aan bij je patronen. ${esc(AP_BEWIJS.praktisch)}</p></details></div>`;
  h += sectie("Aanpassingen") + `<p class="klein ap-uitleg">Bij een voorstel van Nate staat een label. Jij beslist wat aan staat.</p>`;
  h += `<ul class="ap-aanpassingen">${AP_AANPASSINGEN.map(a => {
    const aan = AP_LEES[a.id](), voor = ap.voorgesteld.includes(a.id);
    const vanzelf = a.id === "zacht" && aan && inst("nateEnergie", "normaal") !== "zacht";
    return `<li class="card ap-rij"><button type="button" class="ap-schakel" data-ap="${a.id}" aria-pressed="${aan}"${vanzelf ? " disabled" : ""}>
        <span class="tekst"><b>${esc(a.label)}</b>${voor ? `<span class="ap-voorstel">Nate stelt voor</span>` : ""}<small>${esc(vanzelf ? "Staat vanzelf aan bij een rustig scherm of weinig energie." : a.uitleg)}</small></span>
        <span class="toggle" aria-hidden="true" aria-pressed="${aan}"></span></button>
      <details class="iv-waarom"><summary>Waarom zeg je dit?</summary><p>${esc(a.waarom)} ${esc(AP_BEWIJS[a.bewijs])}</p></details></li>`;
  }).join("")}</ul>`;
  h += `<p class="kn-disclaimer">${esc(ap.disclaimer || "Dit is geen diagnose. Het profiel helpt alleen om de app op je af te stemmen.")}</p>`;
  if (ap.klaar) h += `<button class="knop breed rand" data-act="ga" data-view="kennismaking">Antwoorden bekijken of wijzigen</button>`;
  return h;
}
Object.defineProperty(KOPPEN, "aanpak", { get: () => ["Mijn aanpak", () => "Hoe Nate de app afstemt"], configurable: true, enumerable: true });

document.addEventListener("click", async e => {
  const b = e.target.closest && e.target.closest("[data-ap]"); if (!b) return;
  e.preventDefault(); e.stopImmediatePropagation();
  const aan = b.getAttribute("aria-pressed") !== "true";
  await AP_ZET[b.dataset.ap](aan);
  apCache = null; tril(6); teken();
}, true);

/* ---------- 93.4 Profiel: het oude aanpakblok wordt Mijn aanpak ---------- */
{
  const _pf = vwProfiel;
  vwProfiel = function () {
    let h = _pf.apply(this, arguments);
    const ap = aanpak();
    const kaart = `<button class="card card-pad ap-ingang" data-act="ga" data-view="aanpak"><span class="tekst"><b>Mijn aanpak</b><small>${ap.top.length ? esc(ap.top.map(c => c.metafoor).join(" · ")) : "Hoe Nate de app op je afstemt"}</small></span>${ico("pijlr", "width:16px;height:16px;color:var(--line2)")}</button>`;
    // Het oude blok met de tien vragen eruit.
    const i = h.indexOf('<details class="pf-sectie" data-pf="aanpak"');
    if (i >= 0) { const j = h.indexOf("</details>", i); h = h.slice(0, i) + h.slice(j + 10); }
    return kaart + h;
  };
}

/* ---------- 93.5 Geen labels: metaforen in de kop van Profiel en Instellingen ---------- */
function apKort() { const ap = apNu(); return ap.top.length ? ap.top.map(c => c.metafoor).join(" · ") : "Algemene aanpak"; }
{
  const _tip = ndTipKaart;
  ndTipKaart = function () { return _tip.apply(this, arguments).replace('data-view="profiel" aria-label="Aanpak aanpassen in je profiel"', 'data-view="aanpak" aria-label="Mijn aanpak"'); };
  const _inst = vwInstellingen;
  vwInstellingen = function () {
    const r = pfRichting(), rr = PF_RICHTINGEN[r] || PF_RICHTINGEN.geen;
    return _inst.apply(this, arguments).replace(pfIco(r) + " " + esc(rr.naam), esc(apKort()));
  };
  const _pf = vwProfiel;
  vwProfiel = function () {
    const r = pfRichting(), rr = PF_RICHTINGEN[r];
    const h = _pf.apply(this, arguments);
    return rr ? h.replace(pfIco(r) + " " + esc(rr.kort), esc(apKort())) : h;
  };
}

/* ---------- 93.6 Minder beweging overal (niet alleen in de ruimtelijke laag) ----------
   Modules kijken naar prefers-reduced-motion; met "Minder beweging" aan antwoordt
   die vraag ook "ja". De CSS hieronder stopt de rest van de animaties. */
{
  const _mm = window.matchMedia && window.matchMedia.bind(window);
  if (_mm) window.matchMedia = function (q) {
    const m = _mm(q);
    if (!/prefers-reduced-motion:\s*reduce/.test(q) || inst("beweging", "vol") !== "rustig") return m;
    return new Proxy(m, { get: (t, k) => k === "matches" ? true : (typeof t[k] === "function" ? t[k].bind(t) : t[k]) });
  };
}
