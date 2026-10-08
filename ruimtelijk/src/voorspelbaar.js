"use strict";
// === SECTIE 104: VOORSPELBAARHEID EN SENSORISCHE RUST (V13) ===
/* ==========================================================================
   Conceptvoorstel V13 (patronen Vuurtoren en Batterij). Niets verschuift
   vanzelf: Nate stelt voor in Mijn aanpak, jij zet het aan.
   - Morgen in het kort (scherm "morgen", en 's avonds een kaart op Mijn dag):
     per item tijd, duur, plek, met wie en wat daarna. Wat veranderd is sinds
     je vorige blik staat altijd bovenaan, tot je op "Gezien" tikt.
   - Op Mijn dag ook "Veranderd sinds gisteren" voor vandaag.
   - Prikkels vandaag (rustig, gewoon, veel) en een teller voor momenten met
     mensen. Bij veel prikkels of drie keer mensen: een rustblok voorstellen.
   Vaste indeling en Minder beweging bestonden al (V2, V4).

   De kern (NATE-VOORSPELBAAR-BEGIN/EINDE) is puur en wordt getest in tests/inclusief.test.mjs.
   ========================================================================== */

/* NATE-VOORSPELBAAR-BEGIN */
const VB_PRIKKELS = [
  { id: "rustig", label: "Rustig" },
  { id: "gewoon", label: "Gewoon" },
  { id: "veel", label: "Veel" }
];
const VB_RUST_MIN = 20, VB_MENSEN_VEEL = 3;
const vbMin = t => { const m = /^(\d{1,2}):(\d{2})/.exec(String(t || "")); return m ? +m[1] * 60 + +m[2] : null; };
const vbHHMM = m => String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");

/** Een item van een dag, in het kort. bron = wkItems-regel, extra = { plek }. */
function vbRegel(it, extra) {
  const start = vbMin(it.tijd), eindT = vbMin(it.eind);
  const duur = start == null ? (it.duur || null) : eindT != null && eindT > start ? eindT - start : (it.duur || null);
  return { sleutel: it.soort + ":" + it.id, soort: it.soort, id: it.id, titel: it.titel, tijd: it.tijd || "", start,
    eind: start != null && duur ? start + duur : null, duur, plek: (extra && extra.plek) || "", personen: it.personen || [] };
}
/** Op volgorde van tijd; zonder tijd achteraan. Elk item met tijd weet wat daarna komt. */
function vbDag(regels) {
  const met = regels.filter(r => r.start != null).sort((a, b) => a.start - b.start), zonder = regels.filter(r => r.start == null);
  met.forEach((r, i) => { r.daarna = met[i + 1] ? { titel: met[i + 1].titel, tijd: met[i + 1].tijd } : null; });
  return met.concat(zonder);
}
const vbKenmerk = r => [r.titel, r.tijd, r.duur || "", r.plek].join("|");
/** Een foto van een dag, om later te zien wat er veranderd is. */
function vbFoto(regels) {
  const f = {};
  for (const r of regels) f[r.sleutel] = { k: vbKenmerk(r), titel: r.titel, tijd: r.tijd };
  return f;
}
/** Wat is er nieuw, anders of weg sinds de foto? Zonder foto: niets (eerste blik). */
function vbVerschil(foto, regels) {
  const uit = { nieuw: [], anders: [], weg: [] };
  if (!foto) return uit;
  const nu = new Set();
  for (const r of regels) {
    nu.add(r.sleutel);
    const oud = foto[r.sleutel];
    if (!oud) uit.nieuw.push(r);
    else if (oud.k !== vbKenmerk(r)) uit.anders.push(Object.assign({ was: oud.tijd }, r));
  }
  for (const k of Object.keys(foto)) if (!nu.has(k)) uit.weg.push({ sleutel: k, titel: foto[k].titel, tijd: foto[k].tijd });
  return uit;
}
const vbAantalVerschil = v => v.nieuw.length + v.anders.length + v.weg.length;
/** Hoe vaak ben je met mensen (afspraken, taken en meetings met personen)? */
function vbMensen(regels) { return regels.filter(r => r.personen.length && r.soort !== "gewoonte").length; }
/** De eerste vrije ruimte van duur minuten vanaf `vanaf`, tussen de items met een tijd; null als de dag vol is. */
function vbVrijBlok(regels, vanaf, duur, dagEind) {
  const eind = dagEind == null ? 22 * 60 : dagEind;
  let t = Math.ceil(vanaf / 5) * 5;
  const bezet = regels.filter(r => r.start != null).map(r => [r.start, r.eind != null ? r.eind : r.start + 30]).sort((a, b) => a[0] - b[0]);
  for (const [s, e] of bezet) {
    if (e <= t) continue;
    if (s - t >= duur) break;
    t = Math.max(t, Math.ceil(e / 5) * 5);
  }
  return t + duur <= eind ? t : null;
}
/** Stelt Nate een rustblok voor? Bij veel prikkels, of vaak met mensen. */
function vbRustNodig(prikkels, mensen) { return prikkels === "veel" || mensen >= VB_MENSEN_VEEL; }
/* NATE-VOORSPELBAAR-EINDE */

const VB_BEWIJS = "Indirect: minder prikkels, een vaste structuur en wijzigingen op tijd melden worden genoemd in richtlijnen en in de W3C-richtlijn voor cognitieve toegankelijkheid (COGA). Het onderzoek is smaller dan voor ADHD, dus kijk wat bij jou werkt.";

/* ---------- 104.1 Gegevens van een dag ---------- */
function vbRegels(datum) {
  const bron = { taak: "taken", afspraak: "afspraken", werkdoc: "werkdocs" };
  return vbDag((typeof wkItems === "function" ? wkItems(datum) : []).filter(it => {
    if (it.deadline) return false;   // een deadline is geen moment op de dag
    const o = bron[it.soort] && vind(bron[it.soort], it.id);
    return !(o && typeof werkOk === "function" && !werkOk(o));
  }).map(it => {
    const o = it.soort === "afspraak" ? vind("afspraken", it.id) : null;
    return vbRegel(it, { plek: o && o.plek });
  }));
}
const vbFotos = () => inst("vbFotos", {}) || {};
/** De foto van een dag; de eerste keer wordt hij gemaakt (dat is je eerste blik). */
async function vbFotoVan(datum, regels) {
  const f = vbFotos();
  if (f[datum]) return f[datum];
  const nieuw = {};
  for (const [d, v] of Object.entries(f)) if (d >= vandaagISO()) nieuw[d] = v;   // oude dagen opruimen
  nieuw[datum] = vbFoto(regels);
  await zetInst("vbFotos", nieuw);
  return null;
}
async function vbGezien(datum) {
  await zetInst("vbFotos", Object.assign({}, vbFotos(), { [datum]: vbFoto(vbRegels(datum)) }));
}
const vbAan = id => !!inst(id, false);

/* ---------- 104.2 Het scherm Morgen in het kort ---------- */
function vbTijdTekst(r) { return r.start == null ? "" : r.eind != null ? `${r.tijd}–${vbHHMM(r.eind)}` : r.tijd; }
function vbRegelHTML(r) {
  const wie = r.personen.join(", ");
  const regels = [r.duur ? `${r.duur} min` : "", r.plek, wie ? "met " + wie : ""].filter(Boolean).join(" · ");
  return `<li class="vb-item"><time>${esc(vbTijdTekst(r) || "Zonder tijd")}</time><span><b>${esc(r.titel)}</b>${regels ? `<small>${esc(regels)}</small>` : ""}
    ${r.start != null ? `<small class="vb-daarna">${r.daarna ? `Daarna: ${esc(r.daarna.titel)} om ${esc(r.daarna.tijd)}` : "Daarna niets meer gepland"}</small>` : ""}</span></li>`;
}
function vbVerschilHTML(v, datum, kop) {
  if (!vbAantalVerschil(v)) return "";
  const r = (lbl, x) => `<li><span class="vb-label">${lbl}</span> ${esc(x.titel)}${x.tijd ? ` · ${esc(x.tijd)}` : ""}${x.was && x.was !== x.tijd ? ` <small>(was ${esc(x.was || "zonder tijd")})</small>` : ""}</li>`;
  return `<section class="card card-pad vb-veranderd" aria-label="${esc(kop)}"><span class="labeltekst">${esc(kop)}</span>
    <ul>${v.nieuw.map(x => r("Nieuw", x)).join("")}${v.anders.map(x => r("Anders", x)).join("")}${v.weg.map(x => r("Weg", x)).join("")}</ul>
    <button type="button" class="knop rand vb-gezien" data-vb-gezien="${esc(datum)}">Gezien</button></section>`;
}
function vbMensenHTML(n, wanneer) {
  if (!n) return "";
  return `<p class="vb-mensen">${wanneer} ${n} keer met mensen.${n >= VB_MENSEN_VEEL ? " Een rustblok ertussen kan helpen." : ""}</p>`;
}
function vwMorgen() {
  const datum = plusDagen(vandaagISO(), 1), regels = vbRegels(datum), f = vbFotos()[datum];
  if (!f) vbFotoVan(datum, regels);
  let h = vbVerschilHTML(vbVerschil(f, regels), datum, "Veranderd sinds je vorige blik");
  if (!regels.length) h += `<div class="card card-pad"><p>Morgen staat er nog niets. Een lege dag is ook een plan.</p></div>`;
  else h += `<div class="card card-pad"><ol class="vb-lijst">${regels.map(vbRegelHTML).join("")}</ol>${vbMensenHTML(vbMensen(regels), "Morgen ben je")}</div>`;
  if (vbMensen(regels) >= VB_MENSEN_VEEL) h += `<button class="knop breed rand" data-vb-rust="${esc(datum)}">Rustblok morgen plannen</button>`;
  h += `<details class="iv-waarom"><summary>Waarom zeg je dit?</summary><p>Weten wat er komt, hoe lang het duurt en wat er daarna gebeurt, maakt een dag voorspelbaar. ${esc(VB_BEWIJS)}</p></details>`;
  return h;
}
Object.defineProperty(KOPPEN, "morgen", { get: () => ["Morgen in het kort", () => langDatumLabel(plusDagen(vandaagISO(), 1))], configurable: true, enumerable: true });

/* ---------- 104.3 Op Mijn dag: veranderd, prikkels, rustblok, en 's avonds morgen ---------- */
const vbPrikkels = () => { const p = inst("vbPrikkels", null); return p && p.datum === vandaagISO() ? p.niveau : null; };
function vbRustTaak(datum) { return S.taken.find(t => t.rustblok && t.datum === datum && !t.af) || null; }
function vbPrikkelHTML() {
  const n = vbPrikkels(), regels = vbRegels(vandaagISO()), mensen = vbMensen(regels), rust = vbRustTaak(vandaagISO());
  const nu = new Date(), vrij = vbVrijBlok(regels, nu.getHours() * 60 + nu.getMinutes() + 5, VB_RUST_MIN);
  let voorstel = "";
  if (vbRustNodig(n, mensen)) voorstel = rust ? `<p class="vb-rust">Je rustblok staat om ${esc(rust.tijd)}.</p>`
    : `<p class="vb-rust">${n === "veel" ? "Veel prikkels vandaag." : `Vandaag ${mensen} keer met mensen.`} Twintig minuten rust helpt je lijf om te zakken.</p>
      <div class="vb-knoppen">${vrij != null ? `<button class="knop primair" data-vb-rust="${esc(vandaagISO())}">Rustblok om ${vbHHMM(vrij)}</button>` : ""}<button class="knop rand" data-act="ga" data-view="anker">Nu even landen</button></div>`;
  return `<section class="card card-pad vb-prikkels" aria-label="Prikkels vandaag">
    <div class="dn-kop"><span class="labeltekst">Prikkels vandaag</span>${mensen ? `<small>${mensen} keer met mensen</small>` : ""}</div>
    <div class="dn-keuzes" role="radiogroup" aria-label="Prikkels vandaag">${VB_PRIKKELS.map(x => `<button type="button" role="radio" class="dn-keuze" data-vbp="${x.id}" aria-checked="${n === x.id}" tabindex="${n === x.id || (!n && x.id === "rustig") ? 0 : -1}">${esc(x.label)}</button>`).join("")}</div>
    ${voorstel}
    <details class="iv-waarom"><summary>Waarom zeg je dit?</summary><p>Prikkels en contact met mensen kosten energie, ook als het leuk is. Een vast rustblok geeft herstel voordat je leeg bent. ${esc(VB_BEWIJS)}</p></details>
  </section>`;
}
function vbMorgenKaartHTML() {
  const datum = plusDagen(vandaagISO(), 1), regels = vbRegels(datum), f = vbFotos()[datum];
  if (!f) vbFotoVan(datum, regels);
  const v = vbVerschil(f, regels), n = vbAantalVerschil(v), eerste = regels.slice(0, 3);
  return `<section class="card card-pad vb-morgenkaart" aria-label="Morgen in het kort"><span class="labeltekst">Morgen in het kort</span>
    ${n ? `<p class="vb-let">${n} ${n === 1 ? "ding is" : "dingen zijn"} veranderd.</p>` : ""}
    ${eerste.length ? `<ul class="vb-kort">${eerste.map(r => `<li><time>${esc(r.tijd || "—")}</time> ${esc(r.titel)}${r.plek ? ` <small>· ${esc(r.plek)}</small>` : ""}</li>`).join("")}</ul>${regels.length > 3 ? `<p class="klein">En nog ${regels.length - 3}.</p>` : ""}` : `<p>Nog niets gepland.</p>`}
    <button class="knop breed rand" data-act="ga" data-view="morgen">Bekijk morgen</button></section>`;
}
{
  const _vw = vwVandaag;
  vwVandaag = function () {
    let voor = "", na = "";
    if (vbAan("vbMorgen")) {
      const v = vandaagISO(), f = vbFotos()[v];
      voor += vbVerschilHTML(vbVerschil(f, vbRegels(v)), v, "Veranderd sinds gisteren");
      if (new Date().getHours() >= 16) na += vbMorgenKaartHTML();
    }
    if (vbAan("vbPrikkelsAan")) voor += vbPrikkelHTML();
    return voor + _vw.apply(this, arguments) + na;
  };
}

/* ---------- 104.4 Handelingen ---------- */
async function vbKiesPrikkels(id) {
  await zetInst("vbPrikkels", { datum: vandaagISO(), niveau: id });
  tril(6); teken();
  const b = document.querySelector(`#scherm [data-vbp="${id}"]`); if (b) b.focus({ preventScroll: true });
}
async function vbPlanRust(datum) {
  if (vbRustTaak(datum)) { toast("Er staat al een rustblok"); return; }
  const nu = new Date(), vanaf = datum === vandaagISO() ? nu.getHours() * 60 + nu.getMinutes() + 5 : 12 * 60;
  const t0 = vbVrijBlok(vbRegels(datum), vanaf, VB_RUST_MIN);
  if (t0 == null) { toast("Geen vrije twintig minuten gevonden"); return; }
  const t = await maakTaakUitTekst("Rustblok", { datum, tijd: vbHHMM(t0), duur: VB_RUST_MIN, rustblok: true, notitie: "Twintig minuten zonder scherm en zonder mensen." });
  tril(6); teken();
  if (t) toast(`Rustblok om ${t.tijd}`, "Bewerken", () => openTaakBlad(t.id));
}
document.addEventListener("click", async e => {
  const t = e.target.closest && e.target.closest("[data-vbp], [data-vb-gezien], [data-vb-rust]"); if (!t) return;
  e.preventDefault(); e.stopImmediatePropagation();
  if (t.dataset.vbp) return vbKiesPrikkels(t.dataset.vbp);
  if (t.dataset.vbGezien) { await vbGezien(t.dataset.vbGezien); tril(6); teken(); toast("Gezien"); return; }
  if (t.dataset.vbRust) return vbPlanRust(t.dataset.vbRust);
}, true);
document.addEventListener("keydown", e => {
  const b = e.target.closest && e.target.closest("[data-vbp]"); if (!b) return;
  const ids = VB_PRIKKELS.map(x => x.id), i = ids.indexOf(b.dataset.vbp);
  const j = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: ids.length - 1 }[e.key];
  if (j == null) return;
  e.preventDefault(); vbKiesPrikkels(ids[(j + ids.length) % ids.length]);
});

/* ---------- 104.5 In Mijn aanpak: voorstellen, niet opleggen ---------- */
AP_AANPASSINGEN.push(
  { id: "morgen", label: "Morgen in het kort", uitleg: "'s Avonds wat er morgen komt; wijzigingen bovenaan.", patronen: ["P3"],
    waarom: "Weten wat er komt en wat er veranderd is, geeft rust en voorkomt verrassingen.", bewijs: "indirect" },
  { id: "prikkels", label: "Prikkels en rustblok", uitleg: "Op Mijn dag: prikkels kiezen, en een rustblok bij een volle dag.", patronen: ["P3", "P7"],
    waarom: "Prikkels en contact kosten energie. Een rustblok op tijd geeft herstel voordat je leeg bent.", bewijs: "indirect" }
);
Object.assign(AP_LEES, { morgen: () => vbAan("vbMorgen"), prikkels: () => vbAan("vbPrikkelsAan") });
Object.assign(AP_ZET, { morgen: aan => zetInst("vbMorgen", aan), prikkels: aan => zetInst("vbPrikkelsAan", aan) });
