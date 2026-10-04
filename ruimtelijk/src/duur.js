"use strict";
// === SECTIE 98: DUURKALIBRATIE EN GEMETEN REISTIJD (V9) ===
/* ==========================================================================
   Conceptvoorstel V9. De app leert van wat iets echt kostte, zonder oordeel.
   - Taken: na afronden van een taak met een geschatte duur vraagt Mijn dag
     één keer "hoe lang duurde het?" (korter, ongeveer, langer, veel langer).
     Liep de timer op die taak, dan meet de app het zelf en vraagt niets.
   - Bij een nieuwe, vergelijkbare taak: "vergelijkbare taken duurden meestal
     ± 30 min", met een knop om dat over te nemen.
   - Afspraken: na "Geweest" (V8) één vraag naar de werkelijke reistijd. In het
     afspraakblad stelt Nate na een paar keer de gemeten tijd voor.

   Alles in instellingen (dkLog, dkReis), dus het gaat mee in de export.
   De kern (NATE-DUUR-BEGIN/EINDE) is puur en wordt getest in tests/duur-review.test.mjs.
   ========================================================================== */

/* NATE-DUUR-BEGIN */
const DK_KEUZES = [["korter", "Korter", 0.6], ["ongeveer", "Ongeveer zo", 1], ["langer", "Langer", 1.5], ["veel", "Veel langer", 2]];
const DK_STOP = new Set(["de", "het", "een", "en", "van", "voor", "met", "naar", "op", "in", "aan", "om", "te", "bij", "mijn", "je"]);

function dkWoorden(t) {
  return String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(w => w.length > 1 && !DK_STOP.has(w));
}
function dkLijkt(a, b) {
  const x = new Set(dkWoorden(a)), y = new Set(dkWoorden(b));
  if (!x.size || !y.size) return 0;
  let gedeeld = 0; for (const w of x) if (y.has(w)) gedeeld++;
  return gedeeld / (x.size + y.size - gedeeld);
}
function dkMediaan(l) {
  const s = (l || []).filter(x => x > 0).sort((a, b) => a - b); if (!s.length) return null;
  const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
/** Vergelijkbare eerdere taken (minstens de helft van de woorden gedeeld) → mediane werkelijke duur. */
function dkVoorstel(titel, log, zonderId) {
  const lijk = (log || []).filter(r => r.werkelijk > 0 && r.taakId !== zonderId && dkLijkt(titel, r.titel) >= 0.5);
  if (!lijk.length) return null;
  return { min: Math.max(1, Math.round(dkMediaan(lijk.map(r => r.werkelijk)))), n: lijk.length };
}
/** Hoe verhoudt het echte werk zich tot de schatting (mediaan van werkelijk/geschat)? */
function dkFactor(log) {
  const f = dkMediaan((log || []).filter(r => r.werkelijk > 0 && r.geschat > 0).map(r => r.werkelijk / r.geschat));
  return f == null ? null : Math.round(f * 10) / 10;
}
/** Lokale datum (JJJJ-MM-DD) van een tijdstempel; afOp en ts staan in UTC. */
function dkLokaal(ts) { const d = new Date(ts); return isNaN(d) ? "" : d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
/** Welke taak van vandaag wacht nog op de vraag? Afgerond vandaag (lokale tijd), met schatting, nog niet in het logboek. */
function dkTeVragen(taken, log, vandaag) {
  const gehad = new Set((log || []).map(r => r.taakId));
  return (taken || []).filter(t => t.af && t.duur > 0 && t.afOp && dkLokaal(t.afOp) === vandaag && !gehad.has(t.id))
    .sort((a, b) => (a.afOp < b.afOp ? 1 : -1))[0] || null;
}
/** Reistijd: eerst dezelfde plek (minstens 2 keer), anders de gewone verhouding (minstens 3 keer) op de geplande tijd. */
function dkReisVoorstel(plek, gepland, reis) {
  const p = String(plek || "").trim().toLowerCase(), r = (reis || []).filter(x => x.werkelijk > 0);
  const zelfde = p ? r.filter(x => String(x.plek || "").trim().toLowerCase() === p) : [];
  if (zelfde.length >= 2) return { min: Math.round(dkMediaan(zelfde.map(x => x.werkelijk))), n: zelfde.length, bron: "plek" };
  if (r.length >= 3 && gepland > 0) {
    const f = dkMediaan(r.filter(x => x.gepland > 0).map(x => x.werkelijk / x.gepland));
    if (f) return { min: Math.round(gepland * f), n: r.length, bron: "verhouding" };
  }
  return null;
}
/* NATE-DUUR-EINDE */

const dkLog = () => inst("dkLog", []) || [];
// Voor voorstellen en verhoudingen alleen metingen van taken die nog af zijn (of niet meer bestaan); een ongedane taak telt niet.
const dkLogGeldig = () => dkLog().filter(r => { const t = vind("taken", r.taakId); return !t || t.af; });
const dkReis = () => inst("dkReis", []) || [];
async function dkBewaar(r) { await zetInst("dkLog", dkLog().filter(x => x.taakId !== r.taakId).concat(r).slice(-300)); }

/* ---------- 98.1 Liep de timer? Dan meten we zelf ----------
   Via de gebeurtenisbus (V1 fase 2) in plaats van vinkTaak te omwikkelen. */
bus.on("taak.voorKlaar", async ({ id }) => {
  // Loopt de timer op deze taak? Eerst stoppen, zodat die tijd meetelt.
  if (T.taakId === id && (T.actief || T.opgebouwd)) await stopTimer(true);
  // Opnieuw afronden is een nieuwe meting: een oude (bv. van vóór "Ongedaan") vervalt.
  if (dkLog().some(x => x.taakId === id)) await zetInst("dkLog", dkLog().filter(x => x.taakId !== id));
});
bus.on("taak.klaar", async ({ taak: t }) => {
  if (!t.af || !(t.duur > 0) || dkLog().some(x => x.taakId === t.id)) return;
  const sec = (S.tijdlog || []).filter(l => l.taakId === t.id).reduce((a, l) => a + (+l.seconden || 0), 0);
  if (sec >= 60) { await dkBewaar({ taakId: t.id, titel: t.titel, geschat: +t.duur, werkelijk: Math.round(sec / 60), bron: "timer", ts: new Date().toISOString() }); teken(); }
});
bus.on("taak.heropend", async ({ id }) => {
  if (dkLog().some(x => x.taakId === id)) await zetInst("dkLog", dkLog().filter(x => x.taakId !== id));
});

/* ---------- 98.2 De vraag op Mijn dag ---------- */
function dkVraagHTML() {
  const t = dkTeVragen(S.taken, dkLog(), vandaagISO()); if (!t) return "";
  return `<section class="card card-pad dk-vraag" aria-label="Hoe lang duurde het?">
    <p class="dk-tekst">Hoe lang duurde <b>${esc(t.titel)}</b>? Je schatte ${t.duur} min.</p>
    <div class="dk-keuzes">${DK_KEUZES.map(([k, n]) => `<button type="button" class="keuze" data-dk="${k}" data-id="${esc(t.id)}">${esc(n)}</button>`).join("")}</div>
    <button type="button" class="iv-los" data-dk="weetniet" data-id="${esc(t.id)}">Weet ik niet</button>
  </section>`;
}
{
  const _html = mdNuHTML;
  mdNuHTML = function () { return dkVraagHTML() + _html.apply(this, arguments); };
}
document.addEventListener("click", async e => {
  const b = e.target.closest && e.target.closest("[data-dk]"); if (!b) return;
  e.preventDefault(); e.stopImmediatePropagation();
  const t = vind("taken", b.dataset.id); if (!t) return;
  const k = DK_KEUZES.find(x => x[0] === b.dataset.dk);
  await dkBewaar({ taakId: t.id, titel: t.titel, geschat: +t.duur, werkelijk: k ? Math.round(t.duur * k[2]) : 0, bron: k ? "schatting" : "onbekend", ts: new Date().toISOString() });
  tril(6); teken(); if (k) toast("Genoteerd. Zo leert de planning mee.");
}, true);

/* ---------- 98.3 Voorstel in het taakblad ---------- */
{
  const _open = openTaakBlad;
  openTaakBlad = function (id) {
    const r = _open.apply(this, arguments);
    const veld = $("#f-duur"), titel = $("#f-titel") || $("#bladinhoud input.invoer");
    if (!veld) return r;
    const toon = () => {
      const oud = $("#dk-hint"); if (oud) oud.remove();
      const v = dkVoorstel(titel ? titel.value : "", dkLogGeldig(), id); if (!v) return;
      veld.closest(".veld").insertAdjacentHTML("beforeend", `<p class="klein dk-hint" id="dk-hint">Vergelijkbare taken duurden meestal ± ${v.min} min (${v.n}×). <button type="button" class="dk-neem" data-dk-neem="${v.min}">Neem over</button></p>`);
    };
    toon();
    if (titel) titel.addEventListener("change", toon);
    return r;
  };
}
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest("[data-dk-neem]"); if (!b) return;
  e.preventDefault(); const v = $("#f-duur"); if (v) { v.value = b.dataset.dkNeem; v.dispatchEvent(new Event("input", { bubbles: true })); }
  b.closest(".dk-hint").textContent = `Duur op ${b.dataset.dkNeem} min gezet.`;
}, true);

/* ---------- 98.4 Gemeten reistijd ---------- */
// Na "Geweest" (V8) met reistijd: één vraag naar de echte reistijd.
bus.on("afspraak.geweest", ({ afspraak }) => { if (+afspraak.reistijd > 0) dkReisVraag(afspraak); });
function dkReisVraag(a) {
  if (!(+a.reistijd > 0)) return;
  const r = +a.reistijd, opties = [[Math.max(1, r - 10), "Korter"], [r, `Zoals gepland (${r})`], [r + 10, `+10 min`], [r + 20, `+20 min`]];
  bladOpen("Hoe lang was de reis?", `<p>Gepland: ${r} minuten naar ${esc(a.plek || a.titel)}.</p>
    <div class="dk-keuzes">${opties.map(([m, n]) => `<button type="button" class="keuze" data-dk-reis="${m}">${esc(n)}</button>`).join("")}</div>
    <p class="klein">Na een paar keer stelt Nate de gemeten tijd voor in het afspraakblad.</p>`);
  $("#bladinhoud").onclick = async e => {
    const b = e.target.closest("[data-dk-reis]"); if (!b) return;
    await zetInst("dkReis", dkReis().concat({ afspraakId: a.id, plek: a.plek || "", gepland: r, werkelijk: +b.dataset.dkReis, ts: new Date().toISOString() }).slice(-100));
    bladSluit(); toast("Genoteerd.");
    setTimeout(() => { const v = document.querySelector("[data-hs]") || document.querySelector('[data-dn][aria-checked="true"]'); if (v) v.focus({ preventScroll: true }); }, 320);
  };
}
{
  const _open = openAfspraakBlad;
  openAfspraakBlad = function () {
    const r = _open.apply(this, arguments);
    const reis = $("#a-reis"), plek = $("#a-plek"); if (!reis) return r;
    const toon = () => {
      const oud = $("#dk-reis-hint"); if (oud) oud.remove();
      const v = dkReisVoorstel(plek ? plek.value : "", +reis.value || 0, dkReis());
      if (!v || v.min === (+reis.value || 0)) return;
      reis.closest(".veld").insertAdjacentHTML("afterend", `<p class="klein dk-hint" id="dk-reis-hint">${v.bron === "plek" ? `Naar deze plek duurde het meestal ${v.min} min (${v.n}×).` : `Je reizen duren meestal wat anders dan gepland: ± ${v.min} min.`} <button type="button" class="dk-neem" data-dk-reisneem="${v.min}">Gebruik ${v.min}</button></p>`);
    };
    toon();
    if (plek) plek.addEventListener("change", toon);
    reis.addEventListener("change", toon);
    return r;
  };
}
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest("[data-dk-reisneem]"); if (!b) return;
  e.preventDefault(); const v = $("#a-reis"); if (v) v.value = b.dataset.dkReisneem;
  b.closest(".dk-hint").textContent = `Reistijd op ${b.dataset.dkReisneem} min gezet.`;
}, true);
