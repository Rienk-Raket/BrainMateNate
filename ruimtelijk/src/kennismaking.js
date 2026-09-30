"use strict";
// === SECTIE 85: KENNISMAKING MET NATE EN HET PROFIELRAPPORT ===
/* ==========================================================================
   De kennismaking gebruikt de BrainMate Nate-vragenbank (kennis/vragenbank.json)
   en scoreweging v1.1 (kennis/scoreweging.json) letterlijk. Het rekenwerk zit in
   nate-score.js (sectie NATE-SCORE); dit bestand doet alleen scherm en opslag.

   Volgorde: welkom → naam → 16 kernvragen → 4 voorkeurvragen → verdieping
   (adaptief, tot ongeveer 40 vragen) → contextmodule → dichtheid → samenvatting.
   Daarna mag de uitsteltest (Keuzemachine), maar hoeft niet.

   Opslag: één record in de instellingen (sleutel "nate_km"), na elk antwoord
   bewaard. Zo gaat de kennismaking na herladen verder waar je was.
   ========================================================================== */

/* ---------- 85.1 Teksten ----------
   Nate's stem: kort, geen "moet", geen oordeel. De vraagtekst zelf komt altijd
   letterlijk uit de vragenbank; Nate zegt er alleen een zinnetje omheen. */
const KN_TEKST = {
  welkom: {
    zacht: "Hoi, ik ben Nate. Geen test en geen oordeel, gewoon kennismaken. Hoe beter ik je ken, hoe beter ik je help.",
    normaal: "Hé, ik ben Nate. Geen test, geen oordeel, gewoon kennismaken. Hoe beter ik je ken, hoe slimmer ik je help. Deal?",
    vol: "Hé, ik ben Nate! Geen test, geen oordeel, gewoon kennismaken. Hoe beter ik je ken, hoe slimmer ik je help. Deal?"
  },
  welkomUitleg: "Ongeveer 10 tot 15 minuten. Je kunt altijd pauzeren, en alles blijft op dit toestel.",
  later: "Prima, dan begin ik neutraal. Kennismaken kan altijd nog via Meer, Profiel.",
  pauze: "Bewaard. Je gaat later verder waar je was.",
  naamVraag: "Hoe mag ik je noemen?",
  naamUitleg: "Mag leeg blijven.",
  eersteKern: "Eerst zestien korte vragen over de afgelopen zes maanden. Kies wat het meest klopt, niks is fout.",
  kern: naam => `Nu over ${naam}.`,
  eersteVoorkeur: "Nu vier vragen over wat jij prettige hulp vindt.",
  verdieping: naam => `Even inzoomen op ${naam}.`,
  oplossing: naam => `Wat werkt voor jou bij ${naam}?`,
  eersteContext: "Nog een paar vragen over je situatie. Die tellen niet mee in een score, ze helpen mij je antwoorden goed te lezen.",
  gebieden: naam => `Waar speelt ${naam}?`,
  reactie: {
    hoog: { zacht: "Dank je, goed om te weten.", normaal: "Helder, daar gaan we slim mee om.", vol: "Top dat je dat zegt, daar gaan we wat mee doen!" },
    midden: { zacht: "Soms, genoteerd.", normaal: "Soms, oké. Genoteerd.", vol: "Soms, helder!" },
    laag: { zacht: "Fijn, dat gaat dus vaak goed.", normaal: "Mooi, dat loopt vaak goed.", vol: "Mooi, dat loopt lekker!" },
    open: { zacht: "Prima, die laten we open.", normaal: "Prima, die laten we open.", vol: "Prima, die laten we open." }
  },
  dichtheid: "Hoeveel wil je tegelijk zien op een scherm?",
  samenvatting: { zacht: "Dank je wel. Dit is wat ik tot nu toe zie.", normaal: "Klaar, goed gedaan. Dit is wat ik tot nu toe zie.", vol: "Klaar, sterk gedaan! Dit is wat ik tot nu toe zie." },
  uitstel: "Wil je ook de uitsteltest doen? 25 vragen over keuzes en uitstel. Mag ook later.",
  gewijzigd: "Aangepast. Je profiel is bijgewerkt."
};
// Antwoordopties voor de contextmodule. De prompttekst staat letterlijk in de scoreweging;
// de keuzes zijn een ontwerpkeuze (zie PROGRESS.md). Waarden "groot", "sterk" en
// "sterk_wisselend" zetten een onzekerheidsvlag aan in de scorekern.
const KN_INVLOED = [["geen", "Geen"], ["beetje", "Een beetje"], ["duidelijk", "Duidelijk"], ["groot", "Groot"]];
const KN_CTX_OPTIES = {
  CTX01: [["kind", "Als kind"], ["tiener", "Als tiener"], ["volwassen", "Als volwassene"], ["weet_niet", "Weet ik niet"]],
  CTX03: [["vergelijkbaar", "Ja, vergelijkbaar"], ["wisselend", "Het wisselt wat"], ["sterk_wisselend", "Het wisselt sterk"]],
  CTX04: [["nee", "Nee"], ["beetje", "Een beetje"], ["sterk", "Ja, sterk"]],
  CTX05: KN_INVLOED, CTX06: KN_INVLOED, CTX07: KN_INVLOED, CTX08: KN_INVLOED, CTX09: KN_INVLOED, CTX10: KN_INVLOED,
  CTX11: [["geen", "Niet"], ["beetje", "Een beetje"], ["duidelijk", "Duidelijk"], ["veel", "Veel"]],
  CTX12: [["nee", "Nee"], ["beoordeling", "Ja, een eerdere beoordeling"], ["familie", "Ja, in de familie"], ["allebei", "Allebei"], ["weet_niet", "Weet ik niet"]]
};
const KN_LIEVER_NIET = ["prefer_not", "Liever niet beantwoorden"];
const KN_DICHTHEID = [["rustig", "Rustig", "Weinig tegelijk, één voorstel."], ["normaal", "Normaal", "Een gewone hoeveelheid."], ["alles", "Alles", "Alles tonen, niets ingekort."]];
// De onzekerheidsvlaggen in gewone taal, voor het rapport.
const KN_VLAG_TEKST = {
  dimension_has_fewer_than_two_valid_items: "Bij sommige onderwerpen heb je minder dan twee vragen beantwoord.",
  impact_missing: "Bij sommige onderwerpen weet ik nog niet hoeveel last je ervan hebt.",
  selected_item_coverage_below_60_percent: "Je hebt minder dan 60% van de gekozen vragen beantwoord.",
  only_one_life_area: "Je noemde maar één levensgebied.",
  strong_recent_change: "Er is de laatste tijd veel veranderd; dat kan je antwoorden kleuren.",
  sleep_or_fatigue_major_influence: "Slaap of vermoeidheid heeft grote invloed.",
  stress_or_burnout_major_influence: "Stress of overbelasting heeft grote invloed.",
  mood_or_anxiety_major_influence: "Somberheid, angst of piekeren heeft grote invloed.",
  trauma_or_unsafe_context_possible: "Ingrijpende ervaringen of een onveilige omgeving spelen mogelijk mee.",
  physical_health_or_medication_influence: "Lichamelijke klachten of medicatie hebben invloed.",
  substance_influence: "Middelen zoals alcohol of cannabis hebben invloed.",
  frequency_impact_mismatch: "Hoe vaak iets gebeurt en hoeveel last je ervan hebt, lopen bij jou sterk uiteen.",
  high_context_variation: "Het verschilt sterk per situatie.",
  high_compensation_cost: "Iets lukt goed, maar kost je veel energie."
};
const KN_BAND_TEKST = {
  weinig_gemelde_behoefte_of_voldoende_steun: "weinig gemelde behoefte of al genoeg steun",
  lichte_of_contextafhankelijke_behoefte: "lichte of wisselende behoefte",
  duidelijke_praktische_ondersteuningsbehoefte: "duidelijke behoefte aan praktische steun",
  hoge_of_brede_ondersteuningsbehoefte: "grote of brede behoefte aan steun"
};

/* ---------- 85.2 Opslag ---------- */
const KN_LEEG = { antwoorden: {}, markeringen: {}, context: {}, gebieden: {}, stap: null, gestart: null, klaar: false, later: false, pauze: false };
function knData() {
  const d = inst("nate_km", null) || {};
  return Object.assign({}, KN_LEEG, d, {
    antwoorden: Object.assign({}, d.antwoorden), markeringen: Object.assign({}, d.markeringen),
    context: Object.assign({}, d.context), gebieden: Object.assign({}, d.gebieden)
  });
}
async function knZet(veranderd) {
  const d = Object.assign(knData(), veranderd, { bijgewerkt: new Date().toISOString() });
  await zetInst("nate_km", d);
  return d;
}
// Eerste start: de kennismaking opent vanzelf, tot je begint, "Later" kiest of klaar bent.
function knMoetStarten() { const d = knData(); return !d.klaar && !d.later && !d.pauze; }

/* ---------- 85.3 Stappen ----------
   De lijst groeit mee met je antwoorden (adaptieve route). Een stap is een tekst:
   "welkom", "naam", "q:A1.1.Q1", "ctx:CTX05", "geb:A1.3", "dichtheid" of "samenvatting". */
const knVraag = id => NATE_VRAGENBANK.questions.find(q => q.question_id === id);
const knRoute = d => nsRoute(NATE_VRAGENBANK, d.antwoorden, d.markeringen, NATE_SCOREWEGING, d.gebieden);
const knActief = d => nsActief(NATE_VRAGENBANK, d.antwoorden, d.markeringen, NATE_SCOREWEGING);
function knStappen(d) {
  const ctx = [];
  for (const p of NATE_SCOREWEGING.context_prompts) {
    // CTX02 (levensgebieden) vragen we per open onderwerp: dat vraagt de scoreweging ("per relevant patroon").
    if (p.id === "CTX02") knActief(d).forEach(dim => ctx.push("geb:" + dim));
    else ctx.push("ctx:" + p.id);
  }
  return ["welkom", "naam", ...knRoute(d).map(id => "q:" + id), ...ctx, "dichtheid", "samenvatting"];
}
// Bij welk deel hoort een stap? Nodig voor "Dit deel later" en voor Nate's zinnetje.
function knDeel(stap) {
  if (!stap.startsWith("q:")) return stap.startsWith("ctx:") || stap.startsWith("geb:") ? "context" : stap;
  const id = stap.slice(2);
  if (NS_VOORKEUR_IDS.includes(id)) return "voorkeur";
  if (id.startsWith("A") && id.endsWith(".Q1")) return "kern";
  return "verdieping";
}
function knHuidig(d) {
  const lijst = knStappen(d);
  if (V.knStap && lijst.includes(V.knStap)) return V.knStap;
  if (!d.stap) return "welkom";   // nog nooit begonnen
  if (lijst.includes(d.stap)) return d.stap;
  // Stap bestaat niet meer (route veranderd): de eerste open vraag.
  const open = nsVolgende(knRoute(d), d.antwoorden);
  return open ? "q:" + open : d.stap ? "samenvatting" : "welkom";
}
async function knNaar(stap) {
  V.knStap = stap; V.knFocus = true;
  await knZet({ stap, gestart: knData().gestart || new Date().toISOString(), pauze: false });
  teken(); $("#scherm").scrollTop = 0;
}
async function knVolgende(huidig) {
  const d = knData(), lijst = knStappen(d), i = lijst.indexOf(huidig);
  // Na een wijziging vanuit het profiel ga je daar direct naar terug.
  if (V.knTerugProfiel) { V.knTerugProfiel = false; V.knStap = null; toast(KN_TEKST.gewijzigd); return ga("profiel", null, true); }
  await knNaar(lijst[Math.min(i + 1, lijst.length - 1)]);
}
async function knVorige(huidig) {
  const lijst = knStappen(knData()), i = lijst.indexOf(huidig);
  if (i > 0) await knNaar(lijst[i - 1]);
}
// "Dit deel later": door naar de eerste stap van het volgende deel.
async function knDeelLater(huidig) {
  const lijst = knStappen(knData()), deel = knDeel(huidig);
  const volgende = lijst.slice(lijst.indexOf(huidig)).find(s => knDeel(s) !== deel);
  await knNaar(volgende || "samenvatting");
}

/* ---------- 85.4 Voortgang en Nate's zinnetje ---------- */
function knVoortgang(d, stap) {
  const vragen = knStappen(d).filter(s => s.startsWith("q:") || s.startsWith("ctx:") || s.startsWith("geb:"));
  const n = vragen.indexOf(stap) + 1;
  // Voor de kernvragen klaar zijn, weten we de lengte nog niet: dan "ongeveer".
  const totaal = nsKernKlaar(NATE_VRAGENBANK, d.antwoorden) ? vragen.length : Math.max(vragen.length, 40 + NATE_SCOREWEGING.context_prompts.length);
  return n ? { n, totaal, tekst: `${n} van ongeveer ${totaal}` } : null;
}
function knReactieVan(antwoord) {
  const s = nsScore(antwoord, NATE_SCOREWEGING);
  return s === null ? KN_TEKST.reactie.open : s >= 3 ? KN_TEKST.reactie.hoog : s === 2 ? KN_TEKST.reactie.midden : KN_TEKST.reactie.laag;
}
function knInleiding(stap, q) {
  const deel = knDeel(stap), naam = q ? q.subtheme_name.toLowerCase() : "";
  if (stap === "q:A1.1.Q1") return KN_TEKST.eersteKern;
  if (stap === "q:" + NS_VOORKEUR_IDS[0]) return KN_TEKST.eersteVoorkeur;
  if (stap === "ctx:CTX01") return KN_TEKST.eersteContext;
  if (deel === "kern") return KN_TEKST.kern(naam);
  if (deel === "verdieping") return q.assessment_part === "A" ? KN_TEKST.verdieping(naam) : KN_TEKST.oplossing(naam);
  return "";
}
// Nate's ballon: zijn reactie op het vorige antwoord plus één zin over deze vraag.
function knNate(zin) {
  const reactie = V.knReactie ? nateZeg(V.knReactie) : "";
  V.knReactie = null;
  const tekst = [reactie, zin].filter(Boolean).join(" ");
  return tekst ? `<div class="kn-nate">${nateBeeldHTML("kn-nate-beeld")}<p>${esc(tekst)}</p></div>` : "";
}

/* ---------- 85.5 Schermen ---------- */
function vwKennismaking() {
  const d = knData(), stap = knHuidig(d);
  if (stap === "welkom") return knWelkomHTML();
  if (stap === "naam") return knNaamHTML(stap);
  if (stap === "dichtheid") return knDichtheidHTML(stap);
  if (stap === "samenvatting") return knSamenvattingHTML(d);
  if (stap.startsWith("geb:")) return knGebiedenHTML(d, stap);
  return knVraagHTML(d, stap);
}
function knWelkomHTML() {
  return `<div class="kn kn-welkom">${nateBeeldHTML("kn-nate-groot")}
    <h2>${esc(nateZeg(KN_TEKST.welkom))}</h2><p class="klein">${esc(KN_TEKST.welkomUitleg)}</p>
    <div class="kn-knoppen"><button class="knop primair breed" data-kn="begin">Beginnen</button>
      <button class="knop rand breed" data-kn="later">Later</button></div></div>`;
}
function knNaamHTML(stap) {
  return `<div class="kn">${knNate("")}
    <label class="kn-label" for="kn-naam">${esc(KN_TEKST.naamVraag)}</label>
    <input id="kn-naam" class="invoer" type="text" autocomplete="given-name" value="${esc(typeof pfNaam === "function" ? pfNaam() : "")}">
    <p class="klein">${esc(KN_TEKST.naamUitleg)}</p>${knNavHTML(stap, true, false)}</div>`;
}
// Radiogroep in een fieldset met legend: VoiceOver leest de vraag bij elke keuze voor.
function knRadiosHTML(legend, naam, opties, gekozen) {
  return `<fieldset class="kn-vraag" id="kn-focus" tabindex="-1"><legend>${esc(legend)}</legend>
    ${opties.map(([w, t]) => `<label class="kn-optie"><input type="radio" name="${naam}" value="${esc(w)}"${gekozen === w ? " checked" : ""}><span>${esc(t)}</span></label>`).join("")}</fieldset>`;
}
function knVraagHTML(d, stap) {
  const v = knVoortgang(d, stap);
  let legend, opties, gekozen, q = null;
  if (stap.startsWith("ctx:")) {
    const id = stap.slice(4), p = NATE_SCOREWEGING.context_prompts.find(x => x.id === id);
    legend = p.text; opties = KN_CTX_OPTIES[id].concat([KN_LIEVER_NIET]); gekozen = d.context[id];
  } else {
    q = knVraag(stap.slice(2));
    legend = q.question_text; opties = q.response_options.map(o => [o.value, o.label]); gekozen = d.antwoorden[q.question_id];
  }
  const deel = knDeel(stap);
  return `<div class="kn">${knVoortgangHTML(v)}${knNate(knInleiding(stap, q))}
    ${knRadiosHTML(legend, "kn-antwoord", opties, gekozen)}
    ${knNavHTML(stap, gekozen != null, deel === "verdieping" || deel === "context")}</div>`;
}
function knGebiedenHTML(d, stap) {
  const dim = stap.slice(4), naam = knVraag(dim + ".Q1").subtheme_name, gekozen = d.gebieden[dim] || [];
  const p = NATE_SCOREWEGING.context_prompts.find(x => x.id === "CTX02");
  return `<div class="kn">${knVoortgangHTML(knVoortgang(d, stap))}${knNate(KN_TEKST.gebieden(naam.toLowerCase()))}
    <fieldset class="kn-vraag" id="kn-focus" tabindex="-1"><legend>${esc(p.text)} <span class="kn-over">Over: ${esc(naam)}</span></legend>
    ${NS_GEBIEDEN.map(g => `<label class="kn-optie"><input type="checkbox" name="kn-gebied" value="${esc(g)}"${gekozen.includes(g) ? " checked" : ""}><span>${esc(g[0].toUpperCase() + g.slice(1))}</span></label>`).join("")}</fieldset>
    ${knNavHTML(stap, true, true)}</div>`;
}
function knDichtheidHTML(stap) {
  const nu = inst("ndDichtheid", null);
  return `<div class="kn">${knNate("")}
    <fieldset class="kn-vraag" id="kn-focus" tabindex="-1"><legend>${esc(KN_TEKST.dichtheid)}</legend>
    ${KN_DICHTHEID.map(([w, t, u]) => `<label class="kn-optie"><input type="radio" name="kn-dichtheid" value="${w}"${nu === w ? " checked" : ""}><span>${t}<small>${u}</small></span></label>`).join("")}</fieldset>
    ${knNavHTML(stap, true, false)}</div>`;
}
function knVoortgangHTML(v) {
  if (!v) return "";
  return `<p class="kn-teller" role="progressbar" aria-valuemin="1" aria-valuemax="${v.totaal}" aria-valuenow="${v.n}" aria-valuetext="${v.tekst}">${v.tekst}</p>`;
}
// Vaste plekken: Vorige links, Pauzeren midden, Volgende rechts; "Dit deel later" eronder.
function knNavHTML(stap, magVerder, deelLater) {
  return `<div class="kn-nav">
    <button class="knop rand" data-kn="vorige"${stap === "naam" ? "" : ""}>${ico("pijll")} Vorige</button>
    <button class="knop rand" data-kn="pauze">${ico("pauze")} Pauzeren</button>
    <button class="knop primair" data-kn="volgende"${magVerder ? "" : " disabled"}>Volgende ${ico("pijlr")}</button></div>
    ${deelLater ? `<button class="kn-link" data-kn="deel-later">Dit deel later</button>` : ""}`;
}
function knSamenvattingHTML(d) {
  const p = knProfiel(d);
  let h = `<div class="kn">${knNate(nateZeg(KN_TEKST.samenvatting))}`;
  h += p.kernKlaar ? knClustersHTML(p) : `<p>Voor een profiel heb ik de zestien kernvragen nodig. <button class="kn-link" data-kn="naar-kern">Verder met de kernvragen</button></p>`;
  h += `<p class="klein">${esc(p.kwaliteit.label)}. ${esc(p.disclaimer)}</p>
    <div class="kn-knoppen"><button class="knop primair breed" data-kn="naar-profiel">Bekijk je profiel</button>
    <button class="knop rand breed" data-act="ga" data-view="keuzetest">Uitsteltest doen</button></div>
    <p class="klein">${esc(KN_TEKST.uitstel)}</p></div>`;
  return h;
}

/* ---------- 85.6 Het profielrapport (rapportregels uit 08) ---------- */
const knProfiel = d => nsProfiel(NATE_VRAGENBANK, d.antwoorden, d.markeringen, d.context, NATE_SCOREWEGING, d.gebieden);
const knDimNaam = id => knVraag(id + ".Q1").subtheme_name;
const knLabel = (id, w) => ((knVraag(id).response_options.find(o => o.value === w) || {}).label || "");

// Regel 1 en 2: hooguit drie clusters, met metafoor, een mengprofiel mag, geen winnaar.
function knClustersHTML(p) {
  if (!p.top.length) {
    const iets = Object.values(p.dims).some(x => x.interpreteerbaar);
    return `<p>${iets ? "In je antwoorden zie ik weinig gemelde behoefte. Mooi, en je kunt altijd een onderwerp openzetten." : "Ik heb nog te weinig informatie voor patronen. Na de verdiepingsvragen zie ik meer."}</p>`;
  }
  return `<ul class="kn-clusters">${p.top.map(c => `<li class="card card-pad"><b>${esc(c.metafoor)}</b><span>${esc(c.naam)}</span>
      <small>Kan passen bij ${esc(KN_BAND_TEKST[c.band])}.</small></li>`).join("")}</ul>
    ${p.top.length > 1 ? `<p class="klein">Meerdere patronen tegelijk is heel gewoon. Er is geen winnaar.</p>` : ""}`;
}
function knRapportHTML() {
  const d = knData(), p = knProfiel(d);
  if (!p.kernKlaar) return `${sectie("Kennismaken met Nate")}<div class="card card-pad kn-rapport">
      ${knNate(d.gestart ? "We waren al begonnen. Zullen we verder gaan?" : "Ik ken je nog niet zo goed. Zullen we kennismaken?")}
      <button class="knop primair breed" data-kn="start">${d.gestart ? "Verder waar je was" : "Kennismaken"}</button>
      <p class="klein">${esc(p.disclaimer)}</p></div>`;
  const moeilijk = Object.values(p.dims).filter(x => x.behoefte !== null && x.behoefte >= 25).sort((a, b) => b.behoefte - a.behoefte).slice(0, 3);
  const beter = Object.values(p.dims).filter(x => { const s = nsScore(d.antwoorden[x.id + ".Q1"], NATE_SCOREWEGING); return s !== null && s <= 1; }).slice(0, 3);
  const helpt = Object.values(p.dims).filter(x => x.hulpbron !== null && x.hulpbron >= 50);
  const staOpen = NS_VOORKEUR_IDS.filter(id => (nsScore(d.antwoorden[id], NATE_SCOREWEGING) ?? 0) >= 3).map(id => knVraag(id).subtheme_name);
  let h = `${sectie("Jouw patronen")}<div class="card card-pad kn-rapport">${knClustersHTML(p)}`;
  if (helpt.length || staOpen.length) h += `<h3>Wat al helpt</h3><ul>${helpt.map(x => `<li>Je hebt al een manier voor ${esc(knDimNaam(x.id).toLowerCase())}.</li>`).join("")}${staOpen.length ? `<li>Je staat open voor: ${esc(staOpen.join(", ").toLowerCase())}.</li>` : ""}</ul>`;
  if (beter.length) h += `<h3>Waar het vaak goed gaat</h3><ul>${beter.map(x => `<li>${esc(knDimNaam(x.id))}</li>`).join("")}</ul>`;
  if (moeilijk.length) h += `<h3>Waar het moeilijker gaat</h3><ul>${moeilijk.map(x => `<li>${esc(knDimNaam(x.id))}: mogelijk ${esc(KN_BAND_TEKST[x.band])}.</li>`).join("")}</ul>`;
  h += knMicrostapHTML(d, moeilijk[0]) + knOnzekerHTML(p) + knDekkingHTML(d, p);
  h += `<p class="kn-disclaimer">${esc(p.disclaimer)}</p></div>` + knWijzigHTML(d);
  return h;
}
// Regel 6: één microstap en hooguit drie modules, met "Waarom zeg je dit?".
function knMicrostapHTML(d, dim) {
  if (!dim) return "";
  const casus = NATE_VRAGENBANK.cases.find(c => c.subtheme_id === dim.id), q1 = knVraag(dim.id + ".Q1");
  const modules = (q1.app_module_ids || []).slice(0, 3).map(m => NATE_VRAGENBANK.modules[m]).filter(Boolean);
  const antwoord = knLabel(dim.id + ".Q1", d.antwoorden[dim.id + ".Q1"]).toLowerCase();
  return `<h3>Het kan helpen dit te testen</h3><p>${esc(casus ? casus.recommended_first_microstep : "")}</p>
    ${modules.length ? `<p class="klein">Past bij: ${esc(modules.join(", "))}.</p>` : ""}
    <details><summary>Waarom zeg je dit?</summary><p>Omdat je bij ${esc(q1.subtheme_name.toLowerCase())} ${antwoord ? `"${esc(antwoord)}" antwoordde` : "aangaf dat het speelt"} en het je in het dagelijks leven raakt. Bewijs: ${esc(q1.evidence_level)}; de microstap zelf is een persoonlijk experiment.</p></details>`;
}
// Regel 5: context en onzekerheid, plus de veiligheidsroute.
function knOnzekerHTML(p) {
  if (!p.onzeker.length) return "";
  const zwaar = p.onzeker.some(f => ["trauma_or_unsafe_context_possible", "substance_influence", "mood_or_anxiety_major_influence"].includes(f));
  return `<h3>Om rekening mee te houden</h3><ul>${p.onzeker.map(f => `<li>${esc(KN_VLAG_TEKST[f] || f)}</li>`).join("")}</ul>
    ${zwaar ? `<p class="kn-hulp">Speelt dit zwaar mee? Je huisarts denkt graag mee. Bij acuut gevaar: bel 113 (of 112).</p>` : ""}`;
}
// Regel 7: datakwaliteit (alleen als tekst, nooit als diagnosezekerheid) en open domeinen.
function knDekkingHTML(d, p) {
  const route = knRoute(d), klaar = route.filter(id => d.antwoorden[id] != null).length;
  const open = p.beperkt.filter(id => !d.markeringen[id]);
  return `<h3>Hoe compleet is dit?</h3><p>${esc(p.kwaliteit.label)} (${klaar} van ${route.length} vragen beantwoord). Dit zegt alleen hoeveel ik weet, niets over een diagnose.</p>
    ${open.length ? `<details><summary>Nog niet ingevuld (${open.length})</summary><ul class="kn-open">${open.map(id => `<li><span>${esc(knDimNaam(id))}</span><button class="knop rand kn-knopje" data-kn="open-domein" data-id="${id}">Speelt wel</button></li>`).join("")}</ul></details>` : ""}`;
}
// Antwoorden later wijzigen (Meer → Profiel).
function knWijzigHTML(d) {
  const ids = Object.keys(d.antwoorden).filter(id => d.antwoorden[id] != null && knVraag(id));
  if (!ids.length) return "";
  return `<details class="card card-pad kn-wijzig"><summary>Antwoorden bekijken of wijzigen (${ids.length})</summary><ul>
    ${ids.map(id => `<li><span>${esc(knVraag(id).question_text)}<small>${esc(knLabel(id, d.antwoorden[id]))}</small></span>
      <button class="knop rand kn-knopje" data-kn="wijzig" data-id="${id}">Wijzig</button></li>`).join("")}</ul></details>`;
}

/* ---------- 85.7 Bediening ---------- */
async function knBewaarAntwoord(stap, waarde) {
  const d = knData();
  if (stap.startsWith("ctx:")) d.context[stap.slice(4)] = waarde;
  else { d.antwoorden[stap.slice(2)] = waarde; V.knReactie = knReactieVan(waarde); }
  await knZet({ antwoorden: d.antwoorden, context: d.context });
}
async function knBewaarVeld(stap) {
  if (stap === "naam") { const v = $("#kn-naam"); if (v && typeof pfZet === "function") await pfZet({ naam: v.value.trim() }); }
  if (stap === "dichtheid") { const v = $('input[name="kn-dichtheid"]:checked'); if (v) await zetInst("ndDichtheid", v.value); }
  if (stap.startsWith("geb:")) {
    const d = knData(), dim = stap.slice(4);
    d.gebieden[dim] = $$('input[name="kn-gebied"]:checked').map(x => x.value);
    // CTX02 telt als beantwoord zodra er ergens een gebied gekozen is (voor de datakwaliteit).
    if (d.gebieden[dim].length) d.context.CTX02 = "gekozen";
    await knZet({ gebieden: d.gebieden, context: d.context });
  }
}
document.addEventListener("click", async e => {
  const el = e.target.closest && e.target.closest("[data-kn]");
  if (!el) return;
  const stap = V.view === "kennismaking" ? knHuidig(knData()) : null;
  switch (el.dataset.kn) {
    case "begin": await knNaar("naam"); break;
    case "later": await knZet({ later: true }); toast(KN_TEKST.later); ga(inst("startscherm", "welkom")); break;
    case "pauze": await knBewaarVeld(stap); await knZet({ pauze: true }); V.knStap = null; toast(KN_TEKST.pauze); ga(inst("startscherm", "welkom")); break;
    case "vorige": await knBewaarVeld(stap); await knVorige(stap); break;
    case "volgende": await knBewaarVeld(stap); await knVolgende(stap); break;
    case "deel-later": await knDeelLater(stap); break;
    case "start": V.knStap = null; await knZet({ pauze: false }); ga("kennismaking"); break;
    case "naar-kern": await knNaar("q:" + nsVolgende(nsKernIds(NATE_VRAGENBANK), knData().antwoorden)); break;
    case "naar-profiel": await knZet({ klaar: nsKernKlaar(NATE_VRAGENBANK, knData().antwoorden) }); V.knStap = null; ga("profiel"); break;
    case "wijzig": V.knStap = "q:" + el.dataset.id; V.knTerugProfiel = true; ga("kennismaking"); break;
    case "open-domein": {
      const d = knData(); d.markeringen[el.dataset.id] = true;
      await knZet({ markeringen: d.markeringen });
      V.knStap = "q:" + el.dataset.id + ".Q2"; ga("kennismaking"); break;
    }
  }
});
// Een antwoord kiezen bewaart meteen. Met vinger of muis gaat Nate ook door naar de
// volgende vraag; met het toetsenbord niet, anders spring je weg bij elke pijltjestoets.
document.addEventListener("change", async e => {
  const el = e.target;
  if (V.view !== "kennismaking" || !el || el.name !== "kn-antwoord") return;
  const stap = knHuidig(knData());
  await knBewaarAntwoord(stap, el.value);
  const knop = $('[data-kn="volgende"]'); if (knop) knop.disabled = false;
  if (V.knPointer) { V.knPointer = false; setTimeout(() => knVolgende(stap), 180); }
});
document.addEventListener("pointerup", e => { if (V.view === "kennismaking" && e.target.closest && e.target.closest(".kn-optie") && e.target.closest(".kn-optie").querySelector('input[name="kn-antwoord"]')) V.knPointer = true; }, true);
// Na elke nieuwe vraag: focus op de vraag, zodat een schermlezer hem meteen voorleest.
RT_NA.push(() => {
  if (V.view !== "kennismaking" || !V.knFocus) return;
  V.knFocus = false;
  const f = $("#kn-focus") || $("#kn-naam");
  if (f) f.focus({ preventScroll: true });
});

/* ---------- 85.8 Aansluiten op de rest van de app ---------- */
Object.defineProperty(KOPPEN, "kennismaking", { get: () => ["Kennismaken", () => "Met Nate"], configurable: true, enumerable: true });
// Tijdens de kennismaking zit Nate al in beeld (de ballon); zijn rustfiguur zou anders
// over de knop Volgende heen staan.
RT_NA.push(() => document.body.classList.toggle("kn-actief", V.view === "kennismaking"));
// Het rapport staat bovenaan het profiel (Meer → Profiel); de oude tien vragen blijven
// eronder als reserve voor ndAanpak(), tot het nieuwe profiel die rol overneemt.
if (typeof vwProfiel === "function") {
  const _pf = vwProfiel;
  vwProfiel = function () { return knRapportHTML() + _pf.apply(this, arguments); };
}
// Gepauzeerd of later gekozen? Dan zet Nate een bericht klaar om verder te gaan.
if (typeof meldingenSignalen === "function") {
  const _sig = meldingenSignalen;
  meldingenSignalen = function () {
    const uit = _sig.apply(this, arguments), d = knData();
    if (!nsKernKlaar(NATE_VRAGENBANK, d.antwoorden) && (d.pauze || d.later))
      uit.push({ titel: d.gestart ? "Verder met kennismaken?" : "Zullen we kennismaken?", tekst: "Hoe beter ik je ken, hoe slimmer ik je help.", actieView: "kennismaking",
        waarom: "Omdat je de kennismaking nog niet hebt afgemaakt. Zonder de kernvragen geef ik algemene tips in plaats van tips die bij jou passen." });
    return uit;
  };
}
