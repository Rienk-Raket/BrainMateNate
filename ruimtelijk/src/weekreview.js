"use strict";
// === SECTIE 99: WEEKREVIEW EN PERSOONLIJKE EXPERIMENTEN (V10) ===
/* ==========================================================================
   Conceptvoorstel V10. Tien minuten per week:
   1. drie feiten zonder oordeel (uit wat je deed);
   2. één vraag: waar brak de keten? (de negen schakels uit het onderzoek);
   3. één aanpassing voor volgende week;
   4. die aanpassing als experiment van twee weken met één maat. Daarna:
      behouden, aanpassen of laten vallen.
   Plus: ervaren belasting (0–10) als wekelijkse maat uit het meetplan.

   Mijn dag toont vrijdagmiddag en in het weekend één kaart zolang de
   review van deze week nog niet gedaan is. Alles blijft lokaal
   (instellingen wrReviews en wrExperimenten).

   De kern (NATE-REVIEW-BEGIN/EINDE) is puur en wordt getest in tests/duur-review.test.mjs.
   ========================================================================== */

/* NATE-REVIEW-BEGIN */
const WR_SCHAKELS = [
  { id: "opmerken", naam: "Opmerken", tip: "Zet iets meteen in 'Wat speelt er?' zodra het opkomt." },
  { id: "besluiten", naam: "Besluiten", tip: "Kies elke ochtend één ding voor de Nu-kaart." },
  { id: "vastleggen", naam: "Vastleggen", tip: "Leg afspraken vast tijdens het gesprek, niet erna." },
  { id: "moment", naam: "Een moment kiezen", tip: "Geef elke taak een dag én een moment, bijvoorbeeld 'na het ontbijt'." },
  { id: "concreet", naam: "Concreet maken", tip: "Schrijf bij elke taak de eerste handeling op." },
  { id: "starten", naam: "Starten", tip: "Tik op 'Ik loop vast' zodra je twijfelt." },
  { id: "volhouden", naam: "Volhouden", tip: "Werk in blokken van een kwartier met de timer." },
  { id: "stoppen", naam: "Stoppen en wisselen", tip: "Laat Nate alarmen zetten voor stoppen en vertrekken." },
  { id: "evalueren", naam: "Terugkijken", tip: "Plan deze review vast in, bijvoorbeeld vrijdag om vier uur." }
];
const WR_MATEN = [
  { id: "taken", naam: "Taken afgerond", hoger: true },
  { id: "optijd", naam: "Afspraken gehaald", hoger: true },
  { id: "vaststap", naam: "Na 'Ik loop vast' binnen een dag een stap", hoger: true },
  { id: "belasting", naam: "Ervaren belasting (0–10)", hoger: false }
];
const WR_DUUR = 14;   // dagen per experiment

const wrDag = d => Math.round(Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) / 86400000);
const wrISO = n => new Date(n * 86400000).toISOString().slice(0, 10);
/** Maandag van de week van een ISO-datum. */
function wrWeek(iso) { const n = wrDag(iso), wd = (new Date(n * 86400000).getUTCDay() + 6) % 7; return wrISO(n - wd); }
const wrIn = (d, van, tot) => !!d && d >= van && d <= tot;
/** Lokale datum van een tijdstempel (ts staat in UTC). */
function wrLokaal(ts) { const d = new Date(ts); return isNaN(d) ? "" : d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
/** Welke week bekijken we? Maandag t/m donderdag: de vorige week, als die nog niet teruggekeken is. */
function wrDoelWeek(vandaag, reviews) {
  const w = wrWeek(vandaag), wd = wrDag(vandaag) - wrDag(w), vorige = wrISO(wrDag(w) - 7);
  if (wd <= 3 && !(reviews || []).some(r => r.week === vorige)) return { week: vorige, van: vorige, tot: wrISO(wrDag(vorige) + 6) };
  return { week: w, van: w, tot: vandaag };
}

/** Feiten over een periode, uit losse lijsten (geen app-state nodig). */
function wrFeiten(d, van, tot) {
  const taken = (d.gebeurtenissen || []).filter(g => g.soort === "taak" && /^Afgerond/.test(g.tekst || "") && wrIn(g.datum || (g.ts || "").slice(0, 10), van, tot)).length;
  const afs = (d.afspraken || []).filter(a => wrIn(a.datum, van, tot) && a.hsStatus);
  const gehaald = afs.filter(a => a.hsStatus === "geweest").length, gemist = afs.filter(a => a.hsStatus === "gemist").length;
  const vast = (d.ivLog || []).filter(r => wrIn(wrLokaal(r.ts), van, tot));
  const dk = (d.dkLog || []).filter(r => r.werkelijk > 0 && r.geschat > 0 && wrIn(wrLokaal(r.ts), van, tot));
  const f = dk.length ? dk.map(r => r.werkelijk / r.geschat).sort((a, b) => a - b)[Math.floor(dk.length / 2)] : null;
  return { taken, gehaald, gemist, vast: vast.length, factor: f == null ? null : Math.round(f * 10) / 10, schattingen: dk.length };
}
/** De drie feiten als zinnen, neutraal. */
function wrZinnen(f) {
  const z = [`${f.taken} ${f.taken === 1 ? "taak" : "taken"} afgerond.`];
  if (f.gehaald + f.gemist) z.push(`${f.gehaald} van de ${f.gehaald + f.gemist} afspraken gehaald.`);
  else z.push("Geen afspraken teruggekeken.");
  if (f.schattingen >= 2 && f.factor) z.push(f.factor > 1.15 ? `Taken duurden meestal ${f.factor}× zo lang als geschat.` : f.factor < 0.85 ? `Taken gingen meestal sneller dan geschat (${f.factor}×).` : "Je schattingen klopten meestal.");
  else z.push(f.vast ? `${f.vast} keer 'Ik loop vast' gebruikt.` : "Nog te weinig schattingen om iets over tijd te zeggen.");
  return z;
}
/** Eén maat over een periode. */
function wrMaat(maat, d, van, tot) {
  const f = wrFeiten(d, van, tot);
  if (maat === "taken") return f.taken;
  if (maat === "optijd") return f.gehaald + f.gemist ? Math.round(f.gehaald / (f.gehaald + f.gemist) * 100) : null;
  if (maat === "vaststap") {
    const log = (d.ivLog || []).filter(r => wrIn(wrLokaal(r.ts), van, tot)); if (!log.length) return null;
    const dag = 864e5, binnen = (x, ts) => x && Date.parse(x) >= ts && Date.parse(x) - ts <= dag;
    const ok = log.filter(r => { const t = (d.taken || []).find(x => x.id === r.taakId), ts = Date.parse(r.ts); return t && (binnen(t.afOp, ts) || (t.subtaken || []).some(s => s.af && binnen(s.afOp, ts))); }).length;
    return Math.round(ok / log.length * 100);
  }
  if (maat === "belasting") { const b = (d.reviews || []).filter(r => r.belasting != null && wrIn(r.datum, van, tot)).map(r => r.belasting); return b.length ? Math.round(b.reduce((a, x) => a + x, 0) / b.length * 10) / 10 : null; }
  return null;
}
/** Stand van een experiment: bezig (dag x) of klaar; met de maat ervoor en tijdens. */
function wrExperimentStand(exp, d, vandaag) {
  const start = wrDag(exp.start), eind = start + WR_DUUR - 1, nu = wrDag(vandaag), dag = Math.min(WR_DUUR, nu - start + 1);
  let voor, tijdens;
  if (exp.maat === "belasting") {
    // De review op de startdag gaat over de week ervóór; die van dag 14 over de laatste experimentweek.
    voor = wrMaat("belasting", d, wrISO(start - WR_DUUR + 1), exp.start);
    tijdens = wrMaat("belasting", d, wrISO(start + 1), wrISO(Math.min(start + WR_DUUR, nu)));
  } else if (exp.maat === "taken") {
    // Aantallen: even lange periodes vergelijken, anders lijkt dag 2 een instorting.
    voor = wrMaat("taken", d, wrISO(start - dag), wrISO(start - 1));
    tijdens = wrMaat("taken", d, exp.start, wrISO(start + dag - 1));
  } else {
    voor = wrMaat(exp.maat, d, wrISO(start - WR_DUUR), wrISO(start - 1));
    tijdens = wrMaat(exp.maat, d, exp.start, wrISO(Math.min(eind, nu)));
  }
  return { dag, klaar: nu > eind, eind: wrISO(eind), voor, tijdens };
}
/** Moet de kaart op Mijn dag staan? Vrijdag vanaf 15 uur, zaterdag en zondag, als deze week nog niet gedaan of weggeklikt. */
function wrKaartNodig(nu, reviews, weg) {
  const wd = nu.getDay(), u = nu.getHours();
  if (!(wd === 6 || wd === 0 || (wd === 5 && u >= 15))) return false;
  const iso = nu.getFullYear() + "-" + String(nu.getMonth() + 1).padStart(2, "0") + "-" + String(nu.getDate()).padStart(2, "0"), w = wrWeek(iso);
  return !(reviews || []).some(r => r.week === w) && weg !== w;
}
/* NATE-REVIEW-EINDE */

const wrReviews = () => inst("wrReviews", []) || [];
const wrExps = () => inst("wrExperimenten", []) || [];
const wrData = () => ({ gebeurtenissen: S.gebeurtenissen, afspraken: S.afspraken, taken: S.taken, ivLog: inst("ivLog", []) || [], dkLog: inst("dkLog", []) || [], reviews: wrReviews() });
const wrActief = () => wrExps().find(e => e.status === "bezig") || null;

/* ---------- 99.1 Het scherm ---------- */
function vwWeekreview() {
  const v = vandaagISO(), doel = wrDoelWeek(v, wrReviews()), w = doel.week, d = wrData(), f = wrFeiten(d, doel.van, doel.tot);
  const gedaan = wrReviews().find(r => r.week === w), act = wrActief();
  if (V.wr && V.wr.week !== w) V.wr = null;   // geen keuzes van een andere week meenemen
  const st = V.wr || (V.wr = { week: w, schakel: null, tekst: "", maat: "taken", belasting: null });
  let h = "";
  if (act) {
    const s = wrExperimentStand(act, d, v), m = WR_MATEN.find(x => x.id === act.maat);
    h += `<section class="card card-pad wr-exp"><span class="labeltekst">Je experiment</span><p class="wr-exp-titel">${esc(act.aanpassing)}</p>
      <p class="klein">${s.klaar ? "Twee weken voorbij." : `Dag ${s.dag} van ${WR_DUUR}.`} Maat: ${esc(m.naam)}.</p>
      <div class="wr-vergelijk"><div><small>${act.maat === "taken" && !s.klaar ? "Even lang ervoor" : "Ervoor"}</small><b>${s.voor == null ? "–" : s.voor + (act.maat === "taken" || act.maat === "belasting" ? "" : "%")}</b></div>
        <div><small>${s.klaar ? "Tijdens" : "Tot nu toe"}</small><b>${s.tijdens == null ? "–" : s.tijdens + (act.maat === "taken" || act.maat === "belasting" ? "" : "%")}</b></div></div>
      ${s.klaar ? `<p>Wat doe je ermee?</p><div class="wr-knoppen"><button class="knop primair" data-wr-exp="behouden">Behouden</button><button class="knop rand" data-wr-exp="aanpassen">Aanpassen</button><button class="knop rand" data-wr-exp="vallen">Laten vallen</button></div>`
        : `<button class="iv-los" data-wr-exp="stoppen">Experiment stoppen</button>`}
      <details class="iv-waarom"><summary>Waarom zeg je dit?</summary><p>Of iets helpt, verschilt per persoon; twee weken met één maat laat zien wat voor jou werkt. Praktisch: een persoonlijk experiment, geen bewijs.</p></details></section>`;
  }
  if (st.aanpassen && !act) {
    h += `<section class="card card-pad wr-stap"><h3 class="hs-stap"><span>↻</span> Experiment aanpassen</h3>
      <label class="sr-only" for="wr-tekst">Aanpassing</label><textarea class="invoer" id="wr-tekst" rows="2" maxlength="160">${esc(st.tekst)}</textarea>
      <label class="labeltekst" for="wr-maat">Hoe merk je of het helpt?</label>
      <select class="invoer" id="wr-maat">${WR_MATEN.map(m => `<option value="${m.id}"${st.maat === m.id ? " selected" : ""}>${esc(m.naam)}</option>`).join("")}</select>
      <div class="wr-knoppen" style="margin-top:12px"><button class="knop breed primair" data-wr="herstart">Start opnieuw, twee weken</button></div></section>`;
  }
  h += `<section class="card card-pad wr-stap"><h3 class="hs-stap"><span>1</span> ${w === wrWeek(v) ? "Deze week" : "Vorige week"}, zonder oordeel</h3>
    <ul class="wr-feiten">${wrZinnen(f).map(z => `<li>${esc(z)}</li>`).join("")}</ul></section>`;
  if (gedaan) {
    h += `<section class="card card-pad"><p><b>Deze week al teruggekeken.</b> ${gedaan.schakel ? `Schakel: ${esc((WR_SCHAKELS.find(s => s.id === gedaan.schakel) || {}).naam || "")}.` : ""}</p>${gedaan.aanpassing ? `<p>Aanpassing: ${esc(gedaan.aanpassing)}</p>` : ""}</section>`;
    return h + wrGeschiedenisHTML();
  }
  h += `<section class="card card-pad wr-stap"><h3 class="hs-stap"><span>2</span> Waar brak de keten?</h3><p class="klein">Kies de eerste schakel die niet lukte. Eén is genoeg.</p>
    <div class="wr-schakels" role="radiogroup" aria-label="Schakel">${WR_SCHAKELS.map(s => `<button type="button" role="radio" class="keuze" data-wr-schakel="${s.id}" aria-checked="${st.schakel === s.id}">${esc(s.naam)}</button>`).join("")}
      <button type="button" role="radio" class="keuze" data-wr-schakel="geen" aria-checked="${st.schakel === "geen"}">Niets bijzonders</button></div></section>`;
  if (st.schakel && st.schakel !== "geen") {
    const tip = WR_SCHAKELS.find(s => s.id === st.schakel).tip;
    h += `<section class="card card-pad wr-stap"><h3 class="hs-stap"><span>3</span> Eén aanpassing</h3>
      <label class="sr-only" for="wr-tekst">Aanpassing</label><textarea class="invoer" id="wr-tekst" rows="2" maxlength="160">${esc(st.tekst || tip)}</textarea>
      <h3 class="hs-stap"><span>4</span> Twee weken uitproberen?</h3>
      ${act ? `<p class="klein">Er loopt al een experiment. Eén tegelijk houdt het overzichtelijk; deze aanpassing wordt bewaard.</p>` : `<label class="labeltekst" for="wr-maat">Hoe merk je of het helpt?</label>
      <select class="invoer" id="wr-maat">${WR_MATEN.map(m => `<option value="${m.id}"${st.maat === m.id ? " selected" : ""}>${esc(m.naam)}</option>`).join("")}</select>`}</section>`;
  }
  h += `<section class="card card-pad wr-stap"><label class="labeltekst" for="wr-belasting">Hoe zwaar voelde deze week? (0 = licht, 10 = heel zwaar)</label>
    <input type="range" id="wr-belasting" min="0" max="10" step="1" value="${st.belasting == null ? 5 : st.belasting}" aria-valuetext="${st.belasting == null ? "nog niet gekozen" : st.belasting}">
    <p class="klein" id="wr-belasting-tekst">${st.belasting == null ? "Schuif om te kiezen, of laat leeg." : `Gekozen: ${st.belasting}`}</p></section>`;
  const kanExp = st.schakel && st.schakel !== "geen" && !act;
  h += `<div class="wr-knoppen"><button class="knop breed primair" data-wr="klaar" ${st.schakel ? "" : "disabled"}>${kanExp ? "Start experiment van twee weken" : "Klaar voor deze week"}</button>
    ${kanExp ? `<button class="knop breed rand" data-wr="alleen">Alleen bewaren</button>` : ""}</div>`;
  return h + wrGeschiedenisHTML();
}
function wrGeschiedenisHTML() {
  const oud = wrExps().filter(e => e.status !== "bezig").slice(-3).reverse();
  if (!oud.length) return "";
  const naam = { behouden: "behouden", aanpassen: "aangepast", vallen: "losgelaten", gestopt: "gestopt" };
  return sectie("Eerdere experimenten") + `<div class="card">${oud.map(e => `<div class="rijknop wr-oud"><span class="nm">${esc(e.aanpassing)}<span class="klein" style="display:block">${esc(naam[e.status] || e.status)} · ${esc(datumLabel(e.start))}</span></span></div>`).join("")}</div>`;
}
Object.defineProperty(KOPPEN, "weekreview", { get: () => ["Weekreview", () => "Tien minuten terugkijken"], configurable: true, enumerable: true });

/* ---------- 99.2 Bediening ---------- */
document.addEventListener("input", e => {
  if (!V.wr) return;
  if (e.target.id === "wr-tekst") V.wr.tekst = e.target.value;
  if (e.target.id === "wr-belasting") { V.wr.belasting = +e.target.value; e.target.setAttribute("aria-valuetext", String(V.wr.belasting)); const t = $("#wr-belasting-tekst"); if (t) t.textContent = `Gekozen: ${V.wr.belasting}`; }
});
document.addEventListener("change", e => { if (V.wr && e.target.id === "wr-maat") V.wr.maat = e.target.value; });
// Tikken op het schuifje zonder te bewegen (bv. op 5) telt ook als keuze.
for (const soort of ["change", "pointerup"]) document.addEventListener(soort, e => {
  if (!V.wr || !e.target || e.target.id !== "wr-belasting") return;
  V.wr.belasting = +e.target.value; e.target.setAttribute("aria-valuetext", String(V.wr.belasting));
  const t = $("#wr-belasting-tekst"); if (t) t.textContent = `Gekozen: ${V.wr.belasting}`;
});
document.addEventListener("click", async e => {
  const s = e.target.closest && e.target.closest("[data-wr-schakel], [data-wr], [data-wr-exp], [data-wr-kaart]"); if (!s) return;
  e.preventDefault(); e.stopImmediatePropagation();
  const v = vandaagISO(), doel = wrDoelWeek(v, wrReviews()), w = doel.week;
  if (s.dataset.wrKaart) {
    if (s.dataset.wrKaart === "weg") { await zetInst("wrWeg", wrWeek(v)); teken(); return; }
    return ga("weekreview");
  }
  if (s.dataset.wrSchakel) {
    V.wr.schakel = s.dataset.wrSchakel; V.wr.tekst = "";
    teken(); const b = document.querySelector(`[data-wr-schakel="${s.dataset.wrSchakel}"]`); if (b) b.focus({ preventScroll: true });
    return;
  }
  if (s.dataset.wr === "herstart") {
    const st = V.wr, tekst = (st.tekst || "").trim();
    if (tekst && !wrActief()) await zetInst("wrExperimenten", wrExps().concat({ id: uid(), aanpassing: tekst, maat: st.maat || "taken", schakel: st.schakel, start: v, status: "bezig" }));
    V.wr = null; tril(6); teken(); toast("Aangepast experiment gestart.");
    return;
  }
  if (s.dataset.wr) {
    const st = V.wr, tekst = (st.tekst || (st.schakel && st.schakel !== "geen" ? WR_SCHAKELS.find(x => x.id === st.schakel).tip : "")).trim();
    await zetInst("wrReviews", wrReviews().concat({ week: w, datum: v, schakel: st.schakel, aanpassing: tekst, belasting: st.belasting, feiten: wrFeiten(wrData(), doel.van, doel.tot), ts: new Date().toISOString() }).slice(-104));
    if (s.dataset.wr === "klaar" && st.schakel && st.schakel !== "geen" && !wrActief() && tekst)
      await zetInst("wrExperimenten", wrExps().concat({ id: uid(), aanpassing: tekst, maat: st.maat || "taken", schakel: st.schakel, start: v, status: "bezig" }));
    V.wr = null; tril(6); teken();
    toast(s.dataset.wr === "klaar" && st.schakel && st.schakel !== "geen" ? "Experiment gestart. Over twee weken kijken we samen." : "Bewaard. Goed dat je even terugkeek.");
    return;
  }
  if (s.dataset.wrExp) {
    const act = wrActief(); if (!act) return;
    const status = { behouden: "behouden", aanpassen: "aanpassen", vallen: "vallen", stoppen: "gestopt" }[s.dataset.wrExp];
    await zetInst("wrExperimenten", wrExps().map(e => e.id === act.id ? Object.assign({}, e, { status, klaarOp: v }) : e));
    if (status === "aanpassen") V.wr = { week: w, schakel: act.schakel, tekst: act.aanpassing, maat: act.maat, belasting: null, aanpassen: true };
    teken();
    toast(status === "behouden" ? "Behouden. Dit hoort nu bij jouw aanpak." : status === "vallen" ? "Losgelaten. Ook dat is een uitkomst." : status === "aanpassen" ? "Pas het aan en start opnieuw." : "Gestopt.");
  }
}, true);

/* ---------- 99.3 Kaart op Mijn dag ---------- */
{
  const _vw = vwVandaag;
  vwVandaag = function () {
    const h = _vw.apply(this, arguments);
    const act = wrActief(), s = act ? wrExperimentStand(act, wrData(), vandaagISO()) : null;
    let k = "";
    if (wrKaartNodig(new Date(), wrReviews(), inst("wrWeg", null)))
      k = `<section class="card card-pad wr-kaart" aria-label="Weekreview"><span class="labeltekst">Weekreview</span><p>Tien minuten terugkijken: wat ging er, waar brak het, één aanpassing.</p>
        <div class="hs-knoppen"><button class="knop primair" data-wr-kaart="open">Beginnen</button><button class="knop rand" data-wr-kaart="weg">Niet deze week</button></div></section>`;
    else if (s && s.klaar)
      k = `<section class="card card-pad wr-kaart" aria-label="Experiment klaar"><span class="labeltekst">Experiment klaar</span><p>${esc(act.aanpassing)}</p><button class="knop breed primair" data-wr-kaart="open">Bekijk wat het deed</button></section>`;
    if (!k) return h;
    // Na het dagniveau en een eventuele herstelvraag, vóór de ring.
    const ring = h.indexOf('<section class="card card-pad fm-dagring');
    return ring > 0 ? h.slice(0, ring) + k + h.slice(ring) : h + k;
  };
}
/* Meer → Alle schermen. */
{
  const ook = NV_MEER[1][1];
  if (!ook.some(r => r[0] === "weekreview")) ook.splice(1, 0, ["weekreview", "Weekreview", "grafiek", "Tien minuten terugkijken en één ding uitproberen"]);
}
