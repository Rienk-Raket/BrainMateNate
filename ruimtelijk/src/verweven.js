"use strict";
// === SECTIE 80: VERWEVEN – DE APP ALS ÉÉN GEHEEL ===
/* ==========================================================================
   Keuzes (september 2026):
   - Het hart is Welkom (briefing) → Vandaag → Nieuw. Welkom is een korte
     briefing en verschijnt alleen bij de eerste keer openen sinds verversen.
     Vandaag is waar alles samenkomt: elke module laat daar een spoor achter.
     Vanaf Nieuw kun je overal heen, en de tegels tonen tussenstanden.
   - Voortgang is leidend: andere overzichten verwijzen ernaar.
   - Eén sessie-motor: taken, checklists, projecten en side hustles kunnen
     net als Huishouden een kaartjes-sessie starten; wat je afmaakt, wordt
     in de bron afgevinkt.
   - Het profiel bepaalt hoeveel er tegelijk op je scherm staat.
   - Vijf slimme koppelingen als voorstel (nooit automatisch).
   - Dagritme: ochtend-check-in en avondafsluiting, als uitdaging (geen reeks).
   - Mindful moment en Anker-moment zijn hetzelfde.
   ========================================================================== */

/* ---------- 80.1 Modulekleuren en iconen (één plek) ----------
   Een modulekleur hoort alleen op het icoon, de tegel en het spoor op de
   Dagring; knoppen en balken gebruiken de accentkleur van de app. */
const MODULES = {
  anker: { naam: "Anker", kleur: "#3a7ca5", ico: "anker", view: "anker" },
  huishouden: { naam: "Huishouden", kleur: "#0e7490", ico: "bezem", view: "huishouden" },
  voortgang: { naam: "Voortgang", kleur: "#4f46e5", ico: "doel", act: "vg-open" },
  sidehustle: { naam: "Side hustle", kleur: "#d97706", ico: "raket", view: "sidehustles" },
  hobbyskill: { naam: "HobbySkills", kleur: "#0f766e", ico: "hobby", view: "hobbyskills" },
  sport: { naam: "Sport", kleur: "var(--gezond)", ico: "sport", view: "gezondheid" },
  dagboek: { naam: "Dagboek", kleur: "var(--accent)", ico: "boek", view: "dagboek" },
  geld: { naam: "Uitgaven", kleur: "var(--green)", ico: "euro", view: "financieel" },
  gewoonte: { naam: "Gewoontes", kleur: "var(--amber)", ico: "vuur", view: "gewoontes" },
  sessie: { naam: "Sessie", kleur: "#7c3aed", ico: "ster", view: "vandaag" }
};
TL_SOORTEN.sidehustle = TL_SOORTEN.sidehustle || ["Side hustle", MODULES.sidehustle.kleur];
TL_SOORTEN.hobbyskill = TL_SOORTEN.hobbyskill || ["HobbySkills", MODULES.hobbyskill.kleur];
TL_SOORTEN.sessie = TL_SOORTEN.sessie || ["Sessies", MODULES.sessie.kleur];
if (typeof LOGFILTERS !== "undefined" && Array.isArray(LOGFILTERS)) {
  for (const [k, n] of [["sidehustle", "Side hustle"], ["hobbyskill", "HobbySkills"], ["sessie", "Sessies"]]) if (!LOGFILTERS.some(f => f[0] === k)) LOGFILTERS.push([k, n]);
}
/* Iconen per profielrichting (in plaats van emoji in de bediening). */
const ND_ICO = { adhd: "bliksem", autisme: "puzzel", audhd: "kompas", energie: "batterij", geen: "blad" };

/* ---------- 80.2 Dagritme: check-in en afsluiting ----------
   Beide komen in het dagboekrecord van vandaag (bestaande store): de
   dagboekweergave toont stemming en energie dus meteen mee. */
const DC_ENERGIE = ["Leeg", "Laag", "Gaat", "Goed", "Vol"];
const dcVandaag = () => S.dagboek.find(d => d.datum === vandaagISO()) || null;
const dcEnergieLabel = n => n <= 2 ? "laag" : n === 3 ? "midden" : "hoog";
/* Energie van vandaag als getal 1–5 (ook uit een oud dagboek met laag/midden/hoog). */
function dcEnergie() {
  const d = dcVandaag(); if (!d) return null;
  if (d.energieNr) return d.energieNr;
  return { laag: 2, midden: 3, hoog: 4 }[d.energie] || null;
}
async function dcBewaar(velden) {
  const d = Object.assign({ id: uid(), datum: vandaagISO(), stemming: null, energie: null, tekst: "", dankbaar: "", gemaakt: new Date().toISOString() }, dcVandaag() || {}, velden);
  await bewaar("dagboek", d);
  return d;
}
function dcCheckinHTML(klein) {
  const d = dcVandaag();
  if (d && d.checkinTs && !V.dcWijzig) {
    return `<div class="card dc-kaart dc-klaar"><span class="dc-ico" aria-hidden="true">${ico("check")}</span>
      <span class="dc-tekst"><b>Ingecheckt</b><small>Energie ${esc(DC_ENERGIE[(d.energieNr || 3) - 1].toLowerCase())}${d.stemming ? " · " + STEMMINGEN[d.stemming - 1] : ""}${d.intentie ? " · " + esc(d.intentie) : ""}</small></span>
      <button class="dc-link" data-act="dc-wijzig">Wijzig</button></div>`;
  }
  const w = dcWeekTelling();
  return `<section class="card dc-kaart dc-open" aria-labelledby="dc-kop">
    <div class="dc-kop"><h2 id="dc-kop">Ochtend-check-in</h2><span class="klein">${w.checkins} van ${w.dagen} dagen deze week</span></div>
    <div class="veld"><span class="labeltekst">Energie</span><div class="dc-schaal" role="radiogroup" aria-label="Energie">${DC_ENERGIE.map((n, i) => `<button role="radio" data-dce="${i + 1}" aria-checked="${(d && d.energieNr) === i + 1}">${n}</button>`).join("")}</div></div>
    <div class="veld"><span class="labeltekst">Stemming</span><div class="dc-schaal" role="radiogroup" aria-label="Stemming">${STEMMINGEN.map((e, i) => `<button role="radio" data-dcs="${i + 1}" aria-checked="${(d && d.stemming) === i + 1}" aria-label="Stemming ${i + 1} van 5">${e}</button>`).join("")}</div></div>
    ${klein ? "" : `<div class="veld"><label for="dc-intentie">Waar ga je vandaag voor?</label><input class="invoer" id="dc-intentie" maxlength="80" value="${esc((d && d.intentie) || "")}" placeholder="Eén ding is genoeg"></div>`}
    <button class="knop breed primair" data-act="dc-opslaan">Check in</button></section>`;
}
function dcAfsluitingHTML() {
  const d = dcVandaag(), uur = new Date().getHours();
  if (d && d.afsluitTs && !V.dcAfWijzig) return `<div class="card dc-kaart dc-klaar"><span class="dc-ico" aria-hidden="true">${ico("check")}</span>
    <span class="dc-tekst"><b>Dag afgesloten</b><small>${d.afsluiting && d.afsluiting.goed ? esc(d.afsluiting.goed) : "Goed gedaan."}</small></span><button class="dc-link" data-act="dc-af-wijzig">Wijzig</button></div>`;
  if (uur < 18 && !V.dcAfWijzig) return "";
  return `<section class="card dc-kaart dc-open" aria-labelledby="dc-af-kop">
    <div class="dc-kop"><h2 id="dc-af-kop">Dag afsluiten</h2><span class="klein">twee minuten</span></div>
    <div class="veld"><label for="dc-goed">Wat ging goed?</label><input class="invoer" id="dc-goed" maxlength="120" value="${esc((d && d.afsluiting && d.afsluiting.goed) || "")}" placeholder="Hoe klein ook"></div>
    <div class="veld"><label for="dc-morgen">Eén ding voor morgen</label><input class="invoer" id="dc-morgen" maxlength="80" value="${esc((d && d.afsluiting && d.afsluiting.morgen) || "")}" placeholder="Dan hoef je er morgen niet over na te denken"></div>
    <label class="dc-vink"><input type="checkbox" id="dc-alstaak" checked> Zet het als taak voor morgen</label>
    <button class="knop breed primair" data-act="dc-afsluiten">Sluit de dag af</button></section>`;
}
function dcWeekTelling() {
  const ws = weekStart(vandaagISO()), dagen = dagVerschil(vandaagISO(), ws) + 1;
  return { dagen, checkins: S.dagboek.filter(d => d.datum >= ws && d.checkinTs).length, afgesloten: S.dagboek.filter(d => d.datum >= ws && d.afsluitTs).length };
}

/* ---------- 80.3 De briefing: alleen de eerste keer sinds verversen ----------
   Welkom opent bij het starten (als dat je startscherm is). Zodra je verder
   gaat, verdwijnt hij uit de terug-stapel en brengt een verwijzing naar
   Welkom je naar Vandaag, tot je de app ververst. */
V.briefingGezien = false;
{
  const _ga = ga;
  ga = function (view, param, terugStap) {
    if (view === "welkom" && V.briefingGezien) view = "vandaag";
    if (V.view === "welkom" && view !== "welkom") V.briefingGezien = true;
    const r = _ga(view, param, terugStap);
    if (V.briefingGezien) V.stapel = V.stapel.filter(s => s.view !== "welkom");
    return r;
  };
}
{
  const _w = vwWelkom;
  vwWelkom = function () {
    const h = _w.apply(this, arguments);
    const d = dcVandaag(), check = !(d && d.checkinTs) || V.dcWijzig ? dcCheckinHTML(false) : "";
    const vs = vsHTML("briefing");
    // Kort houden: check-in en voorstellen bovenaan, de rest van de briefing eronder.
    return `<div class="vw-briefing">${check}${vs}</div>` + h;
  };
}

/* De briefing blijft kort: de categorietegels (Werk, Persoonlijk, Sociaal …)
   gaan eraf; die schermen zijn al via Nieuw, Meer of de tabbalk te bereiken
   (hooguit drie routes per scherm). */
RT_NA.push(() => {
  if (V.view !== "welkom") return;
  const t = document.querySelector("#scherm .wk-tegels"); if (t) t.remove();
  document.querySelectorAll("#scherm .ug-naar[data-act='ga']").forEach(e => { e.removeAttribute("data-act"); e.removeAttribute("data-view"); });
});

/* ---------- 80.4 Vijf slimme koppelingen (voorstellen) ----------
   Nooit automatisch: een kaart met één actie en "Niet nu" (voor vandaag).
   Elke koppeling is uit te zetten in Profiel → In de app. */
const VS_KOPPELINGEN = [
  ["rust", "Weinig energie of een lage stemming → even landen met Anker"],
  ["huishouden", "Een schoonmaaklijst is aan de beurt → korte sessie"],
  ["doel", "Een doel loopt achter en de deadline nadert → volgende stap"],
  ["wens", "Genoeg gespaard voor een wens → rustig beslissen"],
  ["sidehustle", "Deze week nog niets aan je side hustle → blok van 25 minuten"]
];
const vsAan = k => inst("vsAan_" + k, true);
const vsNietNu = k => (inst("vsNietNu", {}) || {})[k] === vandaagISO();
function vsVoorstellen() {
  const uit = [], v = vandaagISO(), d = dcVandaag(), en = dcEnergie();
  if (vsAan("rust") && ((en != null && en <= 2) || (d && d.stemming && d.stemming <= 2)) && typeof mfStart === "function")
    uit.push({ k: "rust", ico: "anker", titel: "Even landen", tekst: "Je gaf aan dat het zwaar is. Eén minuut rustig ademen helpt je lichaam naar rust.", knop: "1 minuut ademen" });
  if (vsAan("huishouden") && typeof hhAanDeBeurt === "function") {
    const b = hhAanDeBeurt().find(x => x.te >= 1);
    if (b) uit.push({ k: "huishouden", ico: "bezem", titel: `${b.l.naam} is aan de beurt`, tekst: b.dagen == null ? "Nog nooit gedaan. Tien minuten is genoeg om te beginnen." : `${b.dagen} dagen geleden. Tien minuten is genoeg om te beginnen.`, knop: "10 minuten", data: b.l.id });
  }
  if (vsAan("doel") && typeof vgActieveDoelen === "function") {
    const doel = vgActieveDoelen().filter(x => x.deadline && x.deadline >= v && dagVerschil(x.deadline, v) <= 7).map(x => ({ x, t: vgTempo(x) })).find(y => ["iets", "achter"].includes(y.t.code));
    if (doel) uit.push({ k: "doel", ico: "doel", titel: doel.x.naam, tekst: `${vgDoelStand(doel.x).tekst}. ${doel.t.tekst}.`, knop: "Naar het doel", data: doel.x.id });
  }
  if (vsAan("wens") && S.wl_items) {
    const w = S.wl_items.find(x => (x.status || "actief") === "actief" && +x.prijs > 0 && +x.gespaard >= +x.prijs);
    if (w) {
      const a = typeof ndAanpak === "function" ? ndAanpak() : { afkoelUur: 24 };
      const klaar = w.gemaakt ? new Date(new Date(w.gemaakt).getTime() + a.afkoelUur * 3600e3) : null, afkoelen = +w.prijs > 50 && klaar && klaar > new Date();
      uit.push({ k: "wens", ico: "cadeau", titel: `Genoeg gespaard: ${w.naam}`, tekst: afkoelen ? `De afkoelperiode loopt nog tot ${datumLabel(klaar.toISOString().slice(0, 10)).toLowerCase()}. Daarna rustig beslissen.` : "Kijk nog één keer naar de koopcheck en beslis dan.", knop: "Naar de wens", data: w.id });
    }
  }
  if (vsAan("sidehustle") && typeof shActief === "function") {
    const ws = weekStart(v), h = shActief().find(h => !S.tijdlog.some(l => l.shId === h.id && (l.datum || "") >= ws));
    if (h) uit.push({ k: "sidehustle", ico: "raket", titel: `Tijd voor ${h.naam}`, tekst: "Deze week nog niets gedaan. Een blok van 25 minuten houdt het levend.", knop: "Start 25 minuten", data: h.id });
  }
  return uit.filter(x => !vsNietNu(x.k));
}
function vsHTML(plek) {
  const l = vsVoorstellen(), max = ndMax("voorstellen");
  if (!l.length) return "";
  return `<section class="vs" aria-label="Voorstellen voor vandaag">${l.slice(0, max).map(x => `<div class="card vs-kaart">
    <span class="vs-ico" aria-hidden="true">${ico(x.ico)}</span>
    <span class="vs-tekst"><b>${esc(x.titel)}</b><small>${esc(x.tekst)}</small></span>
    <span class="vs-knoppen"><button class="knop klein primair" data-act="vs-doe" data-k="${x.k}" data-d="${esc(x.data || "")}">${esc(x.knop)}</button>
      <button class="vs-niet" data-act="vs-niet" data-k="${x.k}">Niet nu</button></span></div>`).join("")}</section>`;
}
async function vsDoe(k, data) {
  if (k === "rust") mfStart("A1", { min: 1, bron: "voorstel" });
  else if (k === "huishouden") hhKlaarzetten(data, 10, dcEnergie());
  else if (k === "doel") { vgOpen("doelen"); V.vg.stapel = [{ soort: "doel", id: data }]; vgTeken(); }
  else if (k === "wens") ga("wens", data);
  else if (k === "sidehustle") {
    const h = shH(data), kaarten = sesShKaarten(h);
    if (kaarten.length) sesKlaarzetten(sesVanSh(h, kaarten), { min: 25, terug: ["sh", h.id], bron: "sidehustle" });
    else ga("sh", data);
  }
}

/* ---------- 80.5 Vandaag: het hart ----------
   Na de dagring: check-in (als die er nog niet is), voorstellen, een
   startkaart voor een kaartjes-sessie met je taken, en 's avonds de
   afsluiting. Anker, Huishouden, Side Hustle, HobbySkills, Sport, Voortgang
   en het dagboek laten een spoor achter op de Dagring. */
RT_NA.push(() => {
  if (V.view !== "vandaag") return;
  const s = $("#scherm"); if (!s || s.querySelector(".vw-hart")) return;
  const open = typeof fmVandaagTaken === "function" ? fmVandaagTaken().open : [];
  const d = dcVandaag();
  let h = "";
  if (!(d && d.checkinTs)) h += dcCheckinHTML(true);
  h += vsHTML("vandaag");
  if (open.length) {
    const min = open.reduce((a, t) => a + (+t.duur || 10), 0);
    h += `<button class="card vw-sessie" data-act="ses-taken"><span class="vs-ico" aria-hidden="true">${ico("ster")}</span>
      <span class="vs-tekst"><b>Aan de slag met je taken</b><small>${open.length} ${open.length === 1 ? "taak" : "taken"} · ± ${min} min · één kaartje tegelijk</small></span>${ico("pijlr", "width:16px;height:16px;color:var(--faint)")}</button>`;
  }
  h += dcAfsluitingHTML();
  const plek = s.querySelector(".fm-dagring") || s.querySelector(":scope > .dagpaneel, :scope > .card");
  const blok = `<div class="vw-hart">${h}</div>`;
  if (plek) plek.insertAdjacentHTML("afterend", blok); else s.insertAdjacentHTML("afterbegin", blok);
});
/* Sporen op de Dagring: alles wat modules vandaag in het logboek zetten. */
const VW_SPOOR_SOORTEN = ["anker", "huishouden", "sidehustle", "hobbyskill", "sport", "voortgang", "dagboek", "geld", "gewoonte", "sessie"];
if (typeof FM_SPOREN !== "undefined") FM_SPOREN.push(() => {
  const v = vandaagISO();
  return S.gebeurtenissen.filter(g => VW_SPOOR_SOORTEN.includes(g.soort) && g.ts && (g.datum || vandaagVan(g.ts)) === v).map(g => {
    const t = new Date(g.ts), m = MODULES[g.soort] || {};
    return { min: t.getHours() * 60 + t.getMinutes(), tijd: pad(t.getHours()) + ":" + pad(t.getMinutes()), kleur: m.kleur || "var(--muted)", label: g.tekst, view: m.view, act: m.act };
  });
});
const vandaagVan = ts => { const d = new Date(ts); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

/* ---------- 80.6 Eén sessie-motor ----------
   Elke lijst wordt een schoonmaaklijst-vorm { naam, taken[] } met per taak
   een bron. De planner en het sessiescherm van Huishouden doen de rest.
   Een afgerond kaartje (laatste deel) wordt in de bron afgevinkt. */
const sesTaak = (tekst, ruimte, min, prio, bron) => ({ id: uid(), tekst, ruimte, min: Math.max(1, Math.round(min)), zwaar: hhZwaarte(tekst), prio, uit: false, bron });
function sesVanTaken(taken, naam) {
  return { naam: naam || "Je taken", emoji: "", taken: taken.map(t => sesTaak(t.titel || "Taak", t.projectId ? ((vind("projecten", t.projectId) || {}).naam || "Taken") : (t.werk ? "Werk" : "Taken"), +t.duur || 10, t.prioriteit && t.prioriteit <= 2 ? "moet" : "normaal", { soort: "taak", id: t.id })) };
}
function sesVanChecklist(c) {
  let ruimte = c.naam;
  const taken = [];
  (c.items || []).forEach((it, i) => {
    if (typeof clSectie === "function" && clSectie(it)) { ruimte = String(it.tekst).replace(/^\s*(#+|--)\s*/, "") || c.naam; return; }
    if (!it.af) taken.push(sesTaak(it.tekst, ruimte, hhSchat(it.tekst), "normaal", { soort: "checklist", id: c.id, i }));
  });
  return { naam: c.naam, emoji: "", taken };
}
const sesShKaarten = h => { if (!h) return []; const klaar = new Set(shVan("sh_kolommen", h.id).filter(k => k.rol === "klaar").map(k => k.id)); return shVan("sh_kaarten", h.id).filter(k => !k.gearchiveerd && !klaar.has(k.kolomId)).sort((a, b) => (a.deadline || "9999").localeCompare(b.deadline || "9999")); };
function sesVanSh(h, kaarten) { return { naam: h.naam, emoji: h.emoji || "", taken: kaarten.map(k => sesTaak(k.titel, h.naam, +k.minuten || 25, k.deadline && k.deadline <= vandaagISO() ? "moet" : "normaal", { soort: "shkaart", id: k.id })) }; }
/* Wat af is, wordt in de bron afgevinkt (aangeroepen vanuit het sessiescherm). */
async function sesKlaar(A, it) {
  if (!A || !A.lijst || !it || it.soort !== "taak" || (it.delen > 1 && it.deel !== it.delen)) return;
  const t = (A.lijst.taken || []).find(x => x.id === it.taakId), b = t && t.bron; if (!b) return;
  try {
    if (b.soort === "taak") { const x = vind("taken", b.id); if (x && !x.af) await vinkTaak(b.id); }
    else if (b.soort === "checklist") { const c = vind("checklists", b.id); if (c && c.items[b.i] && !c.items[b.i].af) { const k = JSON.parse(JSON.stringify(c)); k.items[b.i].af = true; await bewaar("checklists", k); } }
    else if (b.soort === "shkaart") await sesShKaartKlaar(b.id);
  } catch (e) { console.error(e); }
}
async function sesShKaartKlaar(id) {
  const k = vind("sh_kaarten", id); if (!k) return;
  const kol = shVan("sh_kolommen", k.shId).find(x => x.rol === "klaar"); if (!kol || k.kolomId === kol.id) return;
  const x = JSON.parse(JSON.stringify(k)); x.kolomId = kol.id; x.klaarOp = new Date().toISOString();
  await bewaar("sh_kaarten", x);
  if (typeof logGebeurtenis === "function") await logGebeurtenis("sidehustle", `Kaart klaar: ${x.titel}`, x.id);
}
/* De afvinkknop bij side-hustle-deadlines op Vandaag deed nog niets; nu wel. */
if (typeof SH_ACT === "object" && !SH_ACT["kaart-klaar"]) SH_ACT["kaart-klaar"] = async el => { await sesShKaartKlaar(el.dataset.id); teken(); toast("Kaart klaar"); };

/* Klaarzetten voor elke lijst (zelfde onderblad als Huishouden, zonder lijstkeuze). */
function sesKlaarzetten(lijst, opties) {
  opties = opties || {};
  if (!lijst.taken.length) { toast("Er staat niets open"); return; }
  const min = opties.min || inst("hhLaatsteMin", 30), energie = opties.energie !== undefined ? opties.energie : dcEnergie();
  const plan = hhMaakPlan(lijst, min, { energie });
  const a = ndAanpak();
  bladOpen(`Sessie: ${lijst.naam}`, `
    <div class="veld"><span class="labeltekst">Hoeveel tijd heb je?</span><div class="keuzerij hh-tijden">${HH_TIJDEN.map(m => `<button class="keuze" data-sesmin="${m}" aria-pressed="${m === min}">${m} min</button>`).join("")}</div></div>
    <div class="veld"><span class="labeltekst">Energie nu${dcEnergie() ? " (uit je check-in)" : " (mag leeg)"}</span><div class="keuzerij hh-energie">${[1, 2, 3, 4, 5].map(n => `<button class="keuze" data-sese="${n}" aria-pressed="${energie === n}">${DC_ENERGIE[n - 1]}</button>`).join("")}</div></div>
    <div class="hh-plan"><div class="hh-plankop"><b>Jouw plan</b><small>${plan.items.filter(x => x.soort === "taak").length} kaartjes · ${plan.werkMin} min werk${plan.pauzeMin ? ` · ${plan.pauzeMin} min pauze` : ""}</small></div>
      ${plan.notities.map(n => `<p class="hh-noot">${esc(n)}</p>`).join("")}
      <ol class="hh-planlijst">${plan.items.map(it => it.soort === "pauze" ? `<li class="pauze"><span>Pauze</span><b>${it.min}′</b></li>` : `<li><span>${esc(it.tekst)}${it.delen > 1 ? ` <small>${it.deel}/${it.delen}</small>` : ""}<small class="hh-r">${esc(it.ruimte)}</small></span><b>${it.min}′</b></li>`).join("")}</ol>
      ${plan.buiten.length ? `<p class="hh-uitleg">Past nu niet: ${plan.buiten.slice(0, 4).map(t => esc(t.tekst)).join(", ")}${plan.buiten.length > 4 ? ` en nog ${plan.buiten.length - 4}` : ""}.</p>` : ""}
      <p class="hh-uitleg">Wat je afmaakt, wordt meteen afgevinkt in ${esc(opties.bron === "checklist" ? "de checklist" : opties.bron === "sidehustle" ? "je SCRUM-bord" : "je takenlijst")}. Blokken van max. ${a.blokMax} min.</p></div>`,
    `<button class="knop breed primair" id="ses-start"${plan.items.length ? "" : " disabled"}>Start</button>`);
  $("#bladinhoud").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.sesmin) { zetInst("hhLaatsteMin", +b.dataset.sesmin); sesKlaarzetten(lijst, Object.assign({}, opties, { min: +b.dataset.sesmin, energie })); }
    else if (b.dataset.sese) sesKlaarzetten(lijst, Object.assign({}, opties, { min, energie: energie === +b.dataset.sese ? null : +b.dataset.sese }));
  });
  $("#ses-start").onclick = () => { bladSluit(); hhSessieStart(lijst, plan, { beschikbaar: min, energie, bron: opties.bron || "taken", terug: opties.terug || [V.view, V.param] }); };
}
/* Ingangen: Vandaag (kaart), checklist, project en side hustle. */
document.addEventListener("click", async e => {
  const el = e.target.closest && e.target.closest("[data-act^='ses-'],[data-act^='dc-'],[data-act^='vs-'],[data-act='nd-meer'],[data-act='vw-voortgang']");
  if (!el) return;
  const a = el.dataset.act;
  if (a === "ses-taken") { const { open } = fmVandaagTaken(); sesKlaarzetten(sesVanTaken(open, "Taken van vandaag"), { bron: "taken", terug: ["vandaag", null] }); }
  else if (a === "ses-checklist") { const c = vind("checklists", el.dataset.id); if (c) sesKlaarzetten(sesVanChecklist(c), { bron: "checklist", terug: ["checklist", c.id] }); }
  else if (a === "ses-project") { const p = vind("projecten", el.dataset.id); if (p) sesKlaarzetten(sesVanTaken(takenVanProject(p.id).filter(t => !t.af), p.naam), { bron: "taken", terug: ["project", p.id] }); }
  else if (a === "ses-sh") { const h = shH(el.dataset.id); if (h) sesKlaarzetten(sesVanSh(h, sesShKaarten(h)), { min: 25, bron: "sidehustle", terug: ["sh", h.id] }); }
  else if (a === "dc-wijzig") { V.dcWijzig = true; teken(); }
  else if (a === "dc-af-wijzig") { V.dcAfWijzig = true; teken(); }
  else if (a === "dc-opslaan") {
    const k = el.closest(".dc-kaart"), en = k.querySelector("[data-dce][aria-checked='true']"), st = k.querySelector("[data-dcs][aria-checked='true']"), int = k.querySelector("#dc-intentie");
    if (!en && !st) { toast("Kies je energie of stemming"); return; }
    const n = en ? +en.dataset.dce : null;
    await dcBewaar(Object.assign({ checkinTs: new Date().toISOString() }, n ? { energieNr: n, energie: dcEnergieLabel(n) } : {}, st ? { stemming: +st.dataset.dcs } : {}, int ? { intentie: int.value.trim() } : {}));
    V.dcWijzig = false;
    if (typeof logGebeurtenis === "function") await logGebeurtenis("dagboek", `Check-in: energie ${n ? DC_ENERGIE[n - 1].toLowerCase() : "–"}${int && int.value.trim() ? " · " + int.value.trim() : ""}`, null);
    teken(); toast("Ingecheckt");
  }
  else if (a === "dc-afsluiten") {
    const goed = ($("#dc-goed").value || "").trim(), morgen = ($("#dc-morgen").value || "").trim();
    const d = dcVandaag() || {};
    await dcBewaar({ afsluitTs: new Date().toISOString(), afsluiting: { goed, morgen }, dankbaar: d.dankbaar || goed });
    if (morgen && $("#dc-alstaak") && $("#dc-alstaak").checked) await maakTaakUitTekst(morgen, { datum: plusDagen(vandaagISO(), 1), tijd: null });
    V.dcAfWijzig = false;
    if (typeof logGebeurtenis === "function") await logGebeurtenis("dagboek", `Dag afgesloten${goed ? ": " + goed : ""}`, null);
    teken(); toast(morgen ? "Afgesloten. Morgen staat klaar." : "Dag afgesloten");
  }
  else if (a === "vs-doe") vsDoe(el.dataset.k, el.dataset.d);
  else if (a === "vs-niet") { const m = Object.assign({}, inst("vsNietNu", {}) || {}); m[el.dataset.k] = vandaagISO(); await zetInst("vsNietNu", m); teken(); }
  else if (a === "nd-meer") { const lijst = el.parentElement; lijst.querySelectorAll(".nd-verborgen").forEach(x => x.classList.remove("nd-verborgen")); el.remove(); }
  else if (a === "vw-voortgang") { vgOpen(el.dataset.tab || "overzicht"); if (el.dataset.bron) { V.vg.stapel = [{ soort: "bron", id: el.dataset.bron }]; vgTeken(); } }
});
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest("[data-dce],[data-dcs]"); if (!b) return;
  b.parentElement.querySelectorAll("button").forEach(x => x.setAttribute("aria-checked", String(x === b)));
});
RT_NA.push(() => {
  const s = $("#scherm"); if (!s) return;
  const knop = (act, id, tekst, uitleg) => `<button class="card vw-sessie vw-ingang" data-act="${act}" data-id="${esc(id)}"><span class="vs-ico" aria-hidden="true">${ico("ster")}</span><span class="vs-tekst"><b>${tekst}</b><small>${uitleg}</small></span>${ico("pijlr", "width:16px;height:16px;color:var(--faint)")}</button>`;
  if (s.querySelector(".vw-ingang")) return;
  if (V.view === "checklist") { const c = vind("checklists", V.param); if (c && !c.sjabloon) { const n = sesVanChecklist(c).taken.length; if (n) s.insertAdjacentHTML("afterbegin", knop("ses-checklist", c.id, "Doe deze lijst als sessie", `${n} open · één punt tegelijk, met timer`)); } }
  else if (V.view === "project") { const p = vind("projecten", V.param); const n = p ? takenVanProject(p.id).filter(t => !t.af).length : 0; if (n) s.insertAdjacentHTML("afterbegin", knop("ses-project", p.id, "Werk dit project af als sessie", `${n} open ${n === 1 ? "taak" : "taken"} · één kaartje tegelijk`)); }
  else if (V.view === "sh") { const h = shH(V.param); const n = h ? sesShKaarten(h).length : 0; if (n) s.insertAdjacentHTML("afterbegin", knop("ses-sh", h.id, "Werkblok als sessie", `${n} open ${n === 1 ? "kaart" : "kaarten"} · 25 minuten, één kaart tegelijk`)); }
});

/* ---------- 80.7 Hoeveel tegelijk op je scherm ----------
   Rustig: 5 regels per lijst, 1 voorstel, geen "Verder naar"-strook.
   Normaal: 10 regels, 3 voorstellen. Alles: niets ingekort. */
const ND_DICHTHEID = { rustig: { lijst: 5, voorstellen: 1, naam: "Rustig" }, normaal: { lijst: 10, voorstellen: 3, naam: "Normaal" }, alles: { lijst: Infinity, voorstellen: 5, naam: "Alles" } };
function ndDichtheidStandaard() { const r = typeof pfRichting === "function" ? pfRichting() : "geen"; return ["adhd", "audhd", "energie"].includes(r) ? "rustig" : "normaal"; }
const ndDichtheid = () => inst("ndDichtheid", null) || ndDichtheidStandaard();
const ndMax = soort => (ND_DICHTHEID[ndDichtheid()] || ND_DICHTHEID.normaal)[soort];
RT_NA.push(() => {
  const d = ndDichtheid();
  document.documentElement.dataset.dichtheid = d;
  const max = ndMax("lijst"); if (!isFinite(max)) return;
  $$("#scherm .card").forEach(card => {
    if (card.dataset.ndKort) return;
    const rijen = [...card.children].filter(x => x.classList.contains("taak") || x.classList.contains("gew"));
    if (rijen.length <= max + 1) return;
    card.dataset.ndKort = "1";
    rijen.slice(max).forEach(x => x.classList.add("nd-verborgen"));
    card.insertAdjacentHTML("beforeend", `<button class="nd-meer" data-act="nd-meer">Toon nog ${rijen.length - max}</button>`);
  });
});

/* ---------- 80.8 Nieuw: tussenstanden op de tegels ----------
   Elke tegel toont hoe het er nu voor staat, zodat Nieuw motiveert. */
function vwTussenstand(view) {
  const v = vandaagISO(), ws = weekStart(v), mv = (n, e, m) => `${n} ${n === 1 ? e : m}`;
  try {
    switch (view) {
      case "persoonlijk": { const { open, af } = fmVandaagTaken(); return open.length || af.length ? `${af.length} van ${open.length + af.length} af vandaag` : ""; }
      case "werk": { const n = S.taken.filter(t => t.werk && t.af && (t.afOp || "") >= ws).length; return n ? `${mv(n, "werktaak", "werktaken")} af deze week` : ""; }
      case "gezondheid": { const n = (S.vs_sportlog || []).filter(l => l.datum >= ws).length; const rk = typeof rookCijfers === "function" ? rookCijfers() : null; return [n ? `${n}× gesport` : "", rk ? `${rk.heleDagen} dagen rookvrij` : ""].filter(Boolean).join(" · "); }
      case "financieel": { if (typeof dagbudget !== "function") return ""; const b = dagbudget(v); return b.maand ? `${eur(b.over)} ${b.over < 0 ? "over budget" : "over vandaag"}` : ""; }
      case "wishlist": { const l = (S.wl_items || []).filter(x => (x.status || "actief") === "actief"); const g = l.reduce((a, x) => a + (+x.gespaard || 0), 0); return l.length ? `${mv(l.length, "wens", "wensen")}${g ? " · " + eur(g) + " gespaard" : ""}` : ""; }
      case "sidehustles": { const m = v.slice(0, 7), o = (S.sh_geld || []).filter(g => g.soort === "in" && (g.datum || "").startsWith(m)).reduce((a, g) => a + g.bedrag / 100, 0); const u = S.tijdlog.filter(l => l.shId && (l.datum || "") >= ws).reduce((a, l) => a + l.seconden / 3600, 0); return [o ? eur(o) + " deze maand" : "", u ? nwoGetal(u, 1) + " uur deze week" : ""].filter(Boolean).join(" · "); }
      case "hobbyskills": { const m = (S.hs_items || []).flatMap(x => x.sessies || []).filter(s => (s.datum || "") >= ws).reduce((a, s) => a + (+s.minuten || 0), 0); return m ? `${m} min geoefend deze week` : ""; }
      case "huishouden": { const c = hhWeekCijfers(); return c.sessies ? `${mv(c.taken, "klus", "klussen")} deze week` : ""; }
    }
  } catch (e) { return ""; }
  return "";
}
{
  const _s = vwStart;
  vwStart = function () {
    let h = _s.apply(this, arguments);
    // Huishouden ook vanaf Nieuw (na Persoonlijk).
    if (!h.includes('data-view="huishouden"')) {
      const tegel = catKnop({ view: "huishouden", ill: "huishouden", naam: "Huishouden", uitleg: "Eén klus tegelijk", kleur: MODULES.huishouden.kleur });
      const i = h.indexOf('data-view="persoonlijk"'), j = i < 0 ? -1 : h.indexOf("</button>", i);
      if (j >= 0) h = h.slice(0, j + 9) + tegel + h.slice(j + 9);
    }
    // Tussenstanden in de uitlegregel van elke tegel.
    return h.replace(/(<button class="knop3d breed[^"]*"[^>]*data-view="([a-z]+)"[^>]*>[\s\S]*?<span class="ds3d"[^>]*>)([\s\S]*?)(<\/span>)/g, (m, voor, view, uitleg, na) => {
      const t = vwTussenstand(view); return t ? voor + esc(t) + na : m;
    });
  };
}

/* ---------- 80.9 Voortgang is leidend ----------
   De andere overzichten (Nieuw, Anker, Huishouden, Terugblik) verwijzen naar
   Voortgang, waar alles samenkomt. */
RT_NA.push(() => {
  const s = $("#scherm"); if (!s || s.querySelector(".vw-naarvg")) return;
  const link = (tekst, tab, bron) => `<button class="card vw-naarvg" data-act="vw-voortgang" data-tab="${tab}"${bron ? ` data-bron="${bron}"` : ""}><span class="vs-ico" aria-hidden="true">${ico("doel")}</span><span class="vs-tekst"><b>${tekst}</b><small>Voortgang is je overzicht van alles</small></span>${ico("pijlr", "width:16px;height:16px;color:var(--faint)")}</button>`;
  if (V.view === "start") { const k = s.querySelector(".nwo-statkop"); if (k) k.insertAdjacentHTML("beforebegin", link("Alles in Voortgang", "overzicht")); }
  else if (V.view === "ankerervaring") s.insertAdjacentHTML("beforeend", link("Anker in Voortgang", "meters", "anker.momenten"));
  else if (V.view === "huishouden") { const c = s.querySelector(".hh-cijfers"); if (c) c.insertAdjacentHTML("afterend", link("Huishouden in Voortgang", "meters", "huishouden.taken")); }
  else if (V.view === "stats") s.insertAdjacentHTML("afterbegin", link("Terugblik, doelen en mijlpalen in Voortgang", "terugblik"));
});
/* Het dagritme telt mee in Voortgang (geen reeks: gewoon hoe vaak). */
if (typeof vgAutoBronnen === "function") {
  const _vg = vgAutoBronnen;
  vgAutoBronnen = function () {
    const uit = _vg();
    uit.push({ id: "dagritme.checkins", naam: "Ochtend-check-ins", eenheid: "aantal", agg: "som", gebied: "rust", richting: "omhoog", data: () => S.dagboek.filter(d => d.checkinTs).map(d => ({ d: d.datum, v: 1 })) });
    uit.push({ id: "dagritme.afsluitingen", naam: "Dagen afgesloten", eenheid: "aantal", agg: "som", gebied: "rust", richting: "omhoog", data: () => S.dagboek.filter(d => d.afsluitTs).map(d => ({ d: d.datum, v: 1 })) });
    uit.push({ id: "sessies.minuten", naam: "Minuten in sessies (taken, lijsten, side hustle)", eenheid: "min", agg: "som", gebied: "werk", richting: "omhoog", data: () => S.hh_sessies.filter(s => s.bron && s.bron !== "huishouden").map(s => ({ d: s.datum, v: Math.round((s.werkSec || 0) / 60) })) });
    return uit;
  };
  if (typeof VG_MP_TEKST === "object") {
    VG_MP_TEKST["dagritme.checkins"] = n => `${nwoGetal(n)} keer ingecheckt`;
    VG_MP_TEKST["dagritme.afsluitingen"] = n => `${nwoGetal(n)} ${n === 1 ? "dag" : "dagen"} bewust afgesloten`;
  }
}

/* ---------- 80.10 Mindful moment = Anker-moment ----------
   Bij de gewoonte "Mindful moment" staat een knop die Anker start; een
   Anker-moment vinkt de gewoonte af (zie mfNaSessie). */
RT_NA.push(() => {
  if (typeof mfMindfulGewoonte !== "function") return;
  const g = mfMindfulGewoonte(); if (!g) return;
  $$(`#scherm .gew [data-act="gew-vink"][data-id="${g.id}"]`).forEach(v => {
    const rij = v.closest(".gew"); if (!rij || rij.querySelector(".vw-anker")) return;
    rij.insertAdjacentHTML("beforeend", `<button class="vw-anker" data-act="mf-start" data-id="A1" data-min="1" data-bron="gewoonte" aria-label="Mindful moment met Anker">${ico("anker")}</button>`);
  });
});
