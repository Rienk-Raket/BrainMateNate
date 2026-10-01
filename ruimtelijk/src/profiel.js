"use strict";
// === SECTIE 76: PROFIEL – WIE BEN JIJ, EN WELKE AANPAK PAST ===
/* ==========================================================================
   Het profiel beschrijft de gebruiker: naam, geboortedatum (leeftijd wordt
   berekend), lengte, gewicht en een richting voor de aanpak. Die richting
   komt uit tien zelfreflectievragen of wordt met de hand gekozen.

   Belangrijk: de vragenlijst is GEEN test en geeft GEEN diagnose. Hij is
   niet gevalideerd. Hij geeft alleen een richting voor handvatten (hoe klussen
   worden ingedeeld, hoe lang blokken zijn, wanneer er pauze komt). Voor een
   echte beoordeling verwijzen we naar de huisarts; gevalideerde screeners
   zijn bijvoorbeeld de ASRS (ADHD) en de AQ-10 (autisme).

   Opslag: één record in de bestaande instellingen (sleutel "profiel"), dus
   geen nieuwe store. De richting stuurt ndAanpak(); andere modules lezen
   alleen die functie.
   ========================================================================== */

/* ---------- 76.1 Gegevens ---------- */
const PF_STANDAARD = { naam: "", geboortedatum: "", lengte: null, gewicht: null, nd: { antwoorden: [], richting: null, handmatig: null, energie: false, datum: null } };
function pfProfiel() {
  const p = inst("profiel", null) || {};
  return Object.assign({}, PF_STANDAARD, p, { nd: Object.assign({}, PF_STANDAARD.nd, p.nd || {}) });
}
async function pfZet(veranderd) {
  const p = Object.assign(pfProfiel(), veranderd);
  await zetInst("profiel", p);
  return p;
}
const pfNaam = () => (pfProfiel().naam || "").trim();
function pfLeeftijd(gd) {
  if (!gd) return null;
  const g = new Date(gd + "T12:00:00"), n = new Date();
  let l = n.getFullYear() - g.getFullYear();
  if (n.getMonth() < g.getMonth() || (n.getMonth() === g.getMonth() && n.getDate() < g.getDate())) l--;
  return l >= 0 && l < 130 ? l : null;
}
/* Gewicht: het profielveld, of anders de laatste meting uit Gezondheid. */
function pfGewicht() {
  const p = pfProfiel();
  const laatste = (S.vs_gewicht || []).filter(g => g.kg).sort((a, b) => b.datum.localeCompare(a.datum))[0];
  return laatste ? { kg: +laatste.kg, bron: "Gezondheid", datum: laatste.datum } : p.gewicht ? { kg: +p.gewicht, bron: "profiel" } : null;
}

/* ---------- 76.2 Tien vragen, drie dimensies ----------
   A = aandacht, beginnen, tijd (ADHD-kenmerken)
   S = prikkels, voorspelbaarheid, wisselen (autisme-kenmerken)
   E = energie (energiebeperking, zoals burn-out of ME/CVS)
   Antwoord 0–4: nooit, zelden, soms, vaak, heel vaak. */
// Vragen, schaal en richtingen komen uit de kennisbank (kennis/huishouden.json → FM_KENNIS).
const PF_VRAGEN = FM_KENNIS.vragen.lijst;
const PF_SCHAAL = FM_KENNIS.vragen.schaal;
const PF_RICHTINGEN = FM_KENNIS.richtingen;
function pfUitslag(antwoorden) {
  const som = d => PF_VRAGEN.reduce((a, [dim], i) => a + (dim === d ? (+antwoorden[i] || 0) : 0), 0);
  const A = som("A") / 16, Sx = som("S") / 16, E = som("E") / 8;
  const d = FM_KENNIS.vragen.drempels;
  let richting = "geen";
  if (A >= d.beide && Sx >= d.beide) richting = "audhd";
  else if (A >= d.enkel && A >= Sx) richting = "adhd";
  else if (Sx >= d.enkel) richting = "autisme";
  else if (E >= d.energie) richting = "energie";
  return { A, S: Sx, E, richting, energie: E >= d.energie };
}
/* De richting die telt: handmatig gekozen gaat voor de vragenlijst. */
function pfRichting() {
  const nd = pfProfiel().nd;
  return nd.handmatig || nd.richting || "geen";
}

/* ---------- 76.3 De aanpak per richting ----------
   Eén plek met alle knoppen waar andere modules aan draaien. Onderbouwing
   staat in het functioneel ontwerp (docs/huishouden-functioneel-ontwerp.md).
   - blokMax      : langste werkblok in minuten (daarna wordt een taak opgeknipt)
   - pauzeElke    : na zoveel minuten werk een geplande pauze (systematische pauzes)
   - pauzeMin     : lengte van die pauze
   - buffer       : factor op de geschatte tijd (planning-fallacy, tijdsblindheid)
   - volgorde     : "snelsucces" | "vast" | "zwaarEerst"
   - wisselSein   : seintje 1 minuut voor een wissel (overgangen)
   - variatie     : ruimtes afwisselen tegen verveling
   - afkoelUur    : wishlist-afkoelperiode (uren) voor aankopen boven € 50
   - maxSessie    : langste aangeraden sessie in minuten (null = geen)
   - ankerProfiel : bijpassend profiel in Anker */
const ND_AANPAK = FM_KENNIS.aanpak;
function ndAanpak() {
  const r = pfRichting(), a = Object.assign({ richting: r }, ND_AANPAK[r] || ND_AANPAK.geen);
  // Lage energie naast een andere richting: kortere sessies en langere pauzes.
  const ev = FM_KENNIS.energieVlag;
  if (r !== "energie" && pfProfiel().nd.energie) Object.assign(a, { pauzeElke: Math.min(a.pauzeElke, ev.pauzeElkeMax), pauzeMin: Math.max(a.pauzeMin, ev.pauzeMinMin), maxSessie: ev.maxSessie, extraEnergie: true });
  return a;
}

/* ---------- 76.4 Handvatten per plek in de app ----------
   Korte, concrete tips per richting. Altijd één zin, geen labels in koppen. */
const ND_TIPS = FM_KENNIS.tips;
function ndTip(plek) {
  const r = pfRichting(), t = ND_TIPS[plek];
  return t ? (t[r] || t.geen) : "";
}
function ndTipKaart(plek) {
  const tip = ndTip(plek), r = pfRichting();
  if (!tip || !inst("ndTips", true)) return "";
  const rr = PF_RICHTINGEN[r] || PF_RICHTINGEN.geen;
  const icoon = typeof ND_ICO === "object" ? ico(ND_ICO[r] || "blad") : rr.ico;
  return `<div class="nd-tip" role="note"><span class="nd-ico" aria-hidden="true">${icoon}</span><span>${esc(tip)}</span>
    <button class="nd-tipknop" data-act="ga" data-view="profiel" aria-label="Aanpak aanpassen in je profiel">${ico("pijlr")}</button></div>`;
}

/* ---------- 76.5 Scherm: Profiel ----------
   Uitklapbare secties (details/summary), zodat het rustig blijft. */
function vwProfiel() {
  const p = pfProfiel(), l = pfLeeftijd(p.geboortedatum), gw = pfGewicht(), r = pfRichting(), rr = PF_RICHTINGEN[r];
  const bmi = gw && p.lengte ? gw.kg / Math.pow(p.lengte / 100, 2) : null;
  const open = V.pfOpen || "over";
  const sectie2 = (id, titel, sub, inhoud) => `<details class="pf-sectie" data-pf="${id}"${open === id ? " open" : ""}><summary><span><b>${titel}</b><small>${esc(sub)}</small></span>${ico("pijlr")}</summary><div class="pf-inhoud">${inhoud}</div></details>`;
  let h = `<div class="pf-kop"><div class="pf-avatar" aria-hidden="true">${esc((p.naam || "?").trim().slice(0, 1).toUpperCase() || "?")}</div>
    <div><b>${esc(p.naam || "Jouw profiel")}</b><span>${[l != null ? l + " jaar" : "", rr ? pfIco(r) + " " + esc(rr.kort) : ""].filter(Boolean).join(" · ") || "Vul in wat je wilt; alles is optioneel"}</span></div></div>`;
  h += sectie2("over", "Over jou", [p.naam, l != null ? l + " jaar" : ""].filter(Boolean).join(" · ") || "Naam en geboortedatum", `
    <div class="veld"><label for="pf-naam">Naam</label><input class="invoer" id="pf-naam" value="${esc(p.naam)}" maxlength="40" autocomplete="given-name" placeholder="Hoe mag de app je noemen?"></div>
    <div class="veld"><label for="pf-gd">Geboortedatum</label><input class="invoer" id="pf-gd" type="date" value="${esc(p.geboortedatum)}" max="${vandaagISO()}"></div>
    <p class="pf-klein pf-leeftijd" aria-live="polite">${pfLeeftijdTekst(l)}</p>`);
  h += sectie2("lichaam", "Lichaam", [p.lengte ? p.lengte + " cm" : "", gw ? nwoGetal(gw.kg, 1) + " kg" : ""].filter(Boolean).join(" · ") || "Lengte en gewicht", `
    <div class="pf-twee"><div class="veld"><label for="pf-lengte">Lengte (cm)</label><input class="invoer" id="pf-lengte" type="number" inputmode="numeric" min="50" max="250" value="${p.lengte || ""}"></div>
      <div class="veld"><label for="pf-gewicht">Gewicht (kg)</label><input class="invoer" id="pf-gewicht" type="number" inputmode="decimal" step="0.1" min="20" max="400" value="${p.gewicht || ""}"></div></div>
    ${gw && gw.bron === "Gezondheid" ? `<p class="pf-klein">Laatste meting in Gezondheid: <b>${nwoGetal(gw.kg, 1)} kg</b> (${esc(datumLabel(gw.datum))}). Die gebruikt de app voor berekeningen.</p>` : ""}
    ${bmi ? `<p class="pf-klein">BMI: <b>${nwoGetal(bmi, 1)}</b>. Een BMI zegt weinig over één persoon; zie het als ruwe indicatie.</p>` : ""}`);
  const nd = p.nd, uit = nd.antwoorden.length === 10 ? pfUitslag(nd.antwoorden) : null;
  h += sectie2("aanpak", "Aanpak die bij je past", rr ? rr.naam : "Nog niet gekozen", `
    <p class="pf-klein">De app past de indeling van klussen, taken, planning, side hustles en wishlist-afwegingen aan op de richting die bij je past. Kies zelf, of beantwoord tien korte vragen.</p>
    <div class="veld"><label for="pf-richting">Mijn richting</label><select class="invoer" id="pf-richting">
      <option value=""${!nd.handmatig ? " selected" : ""}>${nd.richting ? "Uit de vragen: " + esc(PF_RICHTINGEN[nd.richting].naam) : "Nog niet gekozen (algemeen)"}</option>
      ${Object.entries(PF_RICHTINGEN).map(([k, v]) => `<option value="${k}"${nd.handmatig === k ? " selected" : ""}>${esc(v.naam)}</option>`).join("")}</select></div>
    ${rr ? `<div class="pf-richting"><b>${pfIco(r)} ${esc(rr.naam)}</b><p>${esc(rr.uitleg)}</p>${pfAanpakLijst()}</div>` : ""}
    ${uit ? `<div class="pf-scores" aria-label="Uitkomst van de vragen">${[["Aandacht en beginnen", uit.A], ["Prikkels en voorspelbaarheid", uit.S], ["Energie", uit.E]].map(([n, v]) => `<div class="pf-score"><span>${n}</span><i><b style="width:${Math.round(v * 100)}%"></b></i><small>${Math.round(v * 100)}%</small></div>`).join("")}
      <p class="pf-klein">Ingevuld: ${esc(datumLabel(nd.datum).toLowerCase())}.</p></div>` : ""}
    <button class="knop breed ${uit ? "rand" : "primair"}" data-act="pf-vragen">${uit ? "Vragen opnieuw invullen" : "Tien vragen beantwoorden"}</button>
    <p class="pf-let"><b>Geen diagnose.</b> ${esc(FM_KENNIS.vragen.geenDiagnose)}</p>
    <button class="knop breed rand" data-act="ga" data-view="hhwaarom">Waarom deze aanpak? Onderbouwing en bronnen</button>`);
  const dicht = typeof ndDichtheid === "function" ? ndDichtheid() : "normaal", dichtStd = typeof ndDichtheidStandaard === "function" ? ndDichtheidStandaard() : "normaal";
  h += sectie2("app", "In de app", `${typeof ND_DICHTHEID === "object" ? ND_DICHTHEID[dicht].naam + " scherm · " : ""}${inst("ndTips", true) ? "tips aan" : "tips uit"}`, `
    ${typeof ND_DICHTHEID === "object" ? `<div class="veld"><span class="labeltekst">Hoeveel tegelijk op je scherm</span>
      <div class="segment pf-seg" role="group">${Object.entries(ND_DICHTHEID).map(([k, d]) => `<button data-act="pf-dicht" data-w="${k}" aria-pressed="${dicht === k}">${d.naam}${k === dichtStd ? " ·" : ""}</button>`).join("")}</div>
      <p class="pf-klein">Rustig: 5 regels per lijst, 1 voorstel, geen “Verder naar”. Normaal: 10 regels, 3 voorstellen. Alles: niets ingekort. Het puntje staat bij wat past bij je richting.</p></div>` : ""}
    ${typeof VS_KOPPELINGEN === "object" ? `<span class="labeltekst" style="display:block;margin-top:12px">Slimme koppelingen (als voorstel op Vandaag)</span>
      <ul class="schakels">${VS_KOPPELINGEN.map(([k, t]) => `<li class="schakel"><span class="tekst"><b>${esc(t.split(" → ")[1][0].toUpperCase() + t.split(" → ")[1].slice(1))}</b><small>${esc(t.split(" → ")[0])}</small></span>
        <button class="toggle" data-act="pf-vs" data-k="${k}" aria-pressed="${inst("vsAan_" + k, true)}" aria-label="${esc(t)}"></button></li>`).join("")}</ul>` : ""}
    <ul class="schakels">
      <li class="schakel"><span class="tekst"><b>Tips per onderdeel</b><small>Eén korte tip bovenaan Persoonlijk, Komend, Side Hustle, Wishlist en Huishouden.</small></span>
      <button class="toggle" data-act="pf-tips" aria-pressed="${inst("ndTips", true)}" aria-label="Tips per onderdeel"></button></li></ul>
    <p class="pf-klein">Alles blijft op dit toestel. Je profiel gaat mee in je back-up.</p>`);
  return `<div class="pf">${h}</div>`;
}
const pfIco = r => typeof ND_ICO === "object" ? `<span class="vg-g">${ico(ND_ICO[r] || "blad")}</span>` : (PF_RICHTINGEN[r] || {}).ico || "";
const pfLeeftijdTekst = l => l != null ? `Leeftijd: <b>${l} jaar</b>` : "Je leeftijd wordt berekend uit je geboortedatum.";
function pfAanpakLijst() {
  const a = ndAanpak();
  const rij = (n, w) => `<li><span>${n}</span><b>${w}</b></li>`;
  return `<ul class="pf-aanpak">
    ${rij("Langste werkblok", a.blokMax + " min")}
    ${rij("Pauze", `${a.pauzeMin} min na elke ${a.pauzeElke} min`)}
    ${rij("Extra tijd bij plannen", "+" + Math.round((a.buffer - 1) * 100) + "%")}
    ${rij("Volgorde", FM_KENNIS.volgordeNamen[a.volgorde])}
    ${rij("Seintje voor een wissel", a.wisselSein ? "Ja" : "Nee")}
    ${a.maxSessie ? rij("Langste sessie", a.maxSessie + " min") : ""}
    ${rij("Afkoelen bij aankopen > € 50", a.afkoelUur + " uur")}
    ${typeof ndDichtheid === "function" ? rij("Tegelijk op je scherm", ND_DICHTHEID[ndDichtheid()].naam) : ""}</ul>`;
}
/* De vragen in een onderblad, één scherm, grote tikdoelen. */
function pfVragenBlad() {
  const ant = pfProfiel().nd.antwoorden.slice();
  const inhoud = `<p class="pf-klein" style="margin-top:0">Hoe vaak herken je dit bij jezelf, de laatste maanden? Er is geen goed of fout.</p>
    <ol class="pf-vragen">${PF_VRAGEN.map(([, v], i) => `<li><p>${esc(v)}</p><div class="pf-antw" role="radiogroup" aria-label="Vraag ${i + 1}">${PF_SCHAAL.map((s, w) => `<button role="radio" data-pfv="${i}" data-w="${w}" aria-checked="${ant[i] === w}">${s}</button>`).join("")}</div></li>`).join("")}</ol>`;
  bladOpen("Tien vragen", inhoud, `<button class="knop breed primair" id="pf-v-ok">Bekijk mijn richting</button>`);
  $("#bladinhoud").addEventListener("click", e => {
    const b = e.target.closest("[data-pfv]"); if (!b) return;
    const i = +b.dataset.pfv; ant[i] = +b.dataset.w;
    $$(`#bladinhoud [data-pfv="${i}"]`).forEach(x => x.setAttribute("aria-checked", String(x === b)));
    const vol = b.closest("li").nextElementSibling; if (vol && ant[i + 1] == null) vol.scrollIntoView({ block: "nearest", behavior: "smooth" });
  });
  $("#pf-v-ok").onclick = async () => {
    const leeg = PF_VRAGEN.findIndex((_, i) => ant[i] == null);
    if (leeg >= 0) { toast(`Vraag ${leeg + 1} is nog leeg`); return; }
    const u = pfUitslag(ant), p = pfProfiel();
    await pfZet({ nd: Object.assign({}, p.nd, { antwoorden: ant, richting: u.richting, energie: u.energie, datum: vandaagISO() }) });
    await pfSyncAnker();
    bladSluit(); V.pfOpen = "aanpak"; teken();
    toast("Richting: " + PF_RICHTINGEN[pfRichting()].naam);
  };
}
/* Anker krijgt een passend profiel, maar alleen als je daar nog niets koos. */
async function pfSyncAnker() {
  if (typeof mfInst !== "function") return;
  const a = ndAanpak();
  if (!mfInst().profiel && a.ankerProfiel) await mfInstZet({ profiel: a.ankerProfiel });
}

/* ---------- 76.6 Tikken en typen ---------- */
document.addEventListener("click", async e => {
  const el = e.target.closest && e.target.closest("[data-act^='pf-']");
  if (!el) return;
  if (el.dataset.act === "pf-vragen") pfVragenBlad();
  else if (el.dataset.act === "pf-tips") { await zetInst("ndTips", !inst("ndTips", true)); V.pfOpen = "app"; teken(); }
  else if (el.dataset.act === "pf-dicht") { await zetInst("ndDichtheid", el.dataset.w === (typeof ndDichtheidStandaard === "function" ? ndDichtheidStandaard() : "") ? null : el.dataset.w); V.pfOpen = "app"; teken(); }
  else if (el.dataset.act === "pf-vs") { const k = "vsAan_" + el.dataset.k; await zetInst(k, !inst(k, true)); V.pfOpen = "app"; teken(); }
});
/* Geboortedatum: op iPhone meldt het datumwiel elke draai als wijziging.
   Opnieuw tekenen zou het wiel dan sluiten. Daarom slaan we de datum stil op
   (het wiel blijft open) en tekenen we pas opnieuw als het veld de focus
   verliest, dus na "Gereed". */
let pfDatumGewijzigd = false;
document.addEventListener("input", e => { if (e.target && e.target.id === "pf-gd") pfDatumStil(e.target); });
async function pfDatumStil(t) {
  if (!t.value || t.value === pfProfiel().geboortedatum) return;
  pfDatumGewijzigd = true;
  await pfZet({ geboortedatum: t.value });
  const el = document.querySelector(".pf-leeftijd"); if (el) el.innerHTML = pfLeeftijdTekst(pfLeeftijd(t.value));
}
document.addEventListener("focusout", e => {
  if (!e.target || e.target.id !== "pf-gd" || !pfDatumGewijzigd) return;
  pfDatumGewijzigd = false; V.pfOpen = "over";
  setTimeout(() => { if (V.view === "profiel" && document.activeElement?.id !== "pf-gd") { teken(); toast("Opgeslagen"); } }, 50);
});
document.addEventListener("change", async e => {
  const t = e.target; if (!t || !t.id || !t.id.startsWith("pf-") || V.view !== "profiel") return;
  if (t.id === "pf-gd") { await pfDatumStil(t); return; }
  const p = pfProfiel();
  if (t.id === "pf-naam") await pfZet({ naam: t.value.trim().slice(0, 40) });
  else if (t.id === "pf-lengte") await pfZet({ lengte: t.value ? Math.round(+t.value) : null });
  else if (t.id === "pf-gewicht") await pfZet({ gewicht: t.value ? Math.round(+t.value * 10) / 10 : null });
  else if (t.id === "pf-richting") { await pfZet({ nd: Object.assign({}, p.nd, { handmatig: t.value || null }) }); await pfSyncAnker(); V.pfOpen = "aanpak"; }
  else return;
  V.pfOpen = V.pfOpen || "over";
  const d = t.closest("details"); if (d) V.pfOpen = d.dataset.pf;
  teken(); toast("Opgeslagen");
});
document.addEventListener("toggle", e => { const d = e.target; if (d && d.classList && d.classList.contains("pf-sectie") && d.open) V.pfOpen = d.dataset.pf; }, true);

/* ---------- 76.7 Ingangen en app-brede aanpassingen ---------- */
Object.defineProperty(KOPPEN, "profiel", { get: () => ["Profiel", () => "Wie je bent en wat bij je past"], configurable: true, enumerable: true });
/* De begroeting op de landingspagina krijgt je naam: "Goedemorgen Kas". */
{
  const _groet = groet;
  groet = function () { const n = pfNaam(); return n ? `${_groet()} ${n.split(/\s+/)[0]}` : _groet(); };
}
/* Profiel bovenaan de instellingen. */
{
  const _inst = vwInstellingen;
  vwInstellingen = function () {
    const p = pfProfiel(), rr = PF_RICHTINGEN[pfRichting()], l = pfLeeftijd(p.geboortedatum);
    return `${sectie("Profiel")}<button class="card pf-instkaart" data-act="ga" data-view="profiel">
      <span class="pf-avatar klein" aria-hidden="true">${esc((p.naam || "?").slice(0, 1).toUpperCase())}</span>
      <span class="pf-instt"><b>${esc(p.naam || "Stel je profiel in")}</b><small>${[l != null ? l + " jaar" : "", pfIco(pfRichting()) + " " + esc(rr.naam)].filter(Boolean).join(" · ")}</small></span>${ico("pijlr", "width:16px;height:16px;color:var(--faint)")}</button>` + _inst();
  };
}
/* Tips bovenaan de plekken waar de aanpak het meest verschil maakt. */
{
  // voor: tekst waar de tip vóór moet komen; niet gevonden = bovenaan.
  const wrap = (naam, plek, voor) => {
    if (typeof window[naam] !== "function") return;
    const oud = window[naam];
    window[naam] = function () { const h = oud.apply(this, arguments); const tip = ndTipKaart(plek); if (!tip) return h;
      const i = voor ? h.indexOf(voor) : -1;
      return i >= 0 ? h.slice(0, i) + tip + h.slice(i) : tip + h; };
  };
  wrap("vwPersoonlijk", "taken", '<div class="startgrid">');
  wrap("vwKomend", "planning");
  wrap("vwSideHustles", "sidehustle");
  wrap("vwWishlist", "wishlist");
}
