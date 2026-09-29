"use strict";
/* ==========================================================================
   51b. HobbySkills — checklist met sjablonen per soort hobby of skill
   Elk item heeft een categorie (muziek, taal, sport …). Bij aanmaken kies je
   er een; de app raadt hem uit naam en icoon. Het sjabloon zet een checklist
   klaar in vier fasen (Starten, Oefenen, Verdiepen, Delen), aangevuld met
   punten die passen bij een hobby (plezier en ritme) of een skill (leren
   meten). Een sjabloon later nog eens toepassen voegt alleen ontbrekende
   punten toe. Eigen punten kunnen er altijd bij.
   ========================================================================== */
const HS_FASEN = ["Starten", "Oefenen", "Verdiepen", "Delen"];
const HS_CATS = [
  { id: "muziek", naam: "Muziek & instrument", emoji: "🎸", woorden: /gitaar|piano|drum|zing|zang|viool|bas|ukelele|muziek|instrument|dj|produc|🎸|🎹|🎤|🎻|🥁/i, punten: {
    Starten: ["Instrument kopen, huren of lenen", "Stemapparaat en metronoom-app installeren", "Leermethode of docent kiezen", "Vaste oefenplek inrichten"],
    Oefenen: ["Elke sessie 10 minuten techniek (toonladders of akkoorden)", "Met een metronoom spelen en het tempo langzaam opvoeren", "Elke week één nummer instuderen", "Jezelf opnemen en terugluisteren"],
    Verdiepen: ["Basis muziektheorie: noten en akkoorden lezen", "Een melodie op gehoor naspelen", "Improviseren over een simpele akkoordenreeks"],
    Delen: ["Samenspelen met iemand anders", "Een nummer voor vrienden of familie spelen", "Een open podium of jamsessie bezoeken"] } },
  { id: "taal", naam: "Taal", emoji: "🗣️", woorden: /spaans|frans|duits|engels|italiaans|japans|chinees|portugees|arabisch|turks|taal|🗣️/i, punten: {
    Starten: ["Doel en niveau kiezen (A1 tot C2)", "App, cursus of leerboek kiezen", "De 100 meest gebruikte woorden leren"],
    Oefenen: ["Elke dag 15 minuten woordjes herhalen met flashcards", "Hardop de uitspraak oefenen", "Series of podcasts in de taal met ondertiteling", "Elke week een kort stukje schrijven"],
    Verdiepen: ["Grammatica: tegenwoordige en verleden tijd", "Een kort boek of artikel lezen", "Een niveautoets doen"],
    Delen: ["Een taalmaatje of tandempartner zoeken", "Een gesprek van 10 minuten voeren", "Op reis alleen in de taal bestellen en vragen"] } },
  { id: "sport", naam: "Sport & beweging", emoji: "🏃", woorden: /hardlop|rennen|fiets|zwem|fitness|kracht|voetbal|tennis|padel|klimmen|boulder|yoga|sport|🏃|🚴|🏊|🏋️|🧗/i, punten: {
    Starten: ["Goede schoenen en uitrusting regelen", "Beginnersschema kiezen", "Nulmeting doen (tijd, afstand of gewicht)", "Warming-up en cooling-down leren"],
    Oefenen: ["Drie keer per week trainen volgens schema", "Rustdagen inplannen", "Elke training loggen"],
    Verdiepen: ["Techniek laten beoordelen door een trainer of op video", "Voeding en herstel afstemmen op je training", "Oefeningen om blessures te voorkomen"],
    Delen: ["Een club of groep zoeken", "Inschrijven voor een wedstrijd of evenement", "Samen met iemand trainen"] } },
  { id: "beeldend", naam: "Tekenen, schilderen & design", emoji: "🎨", woorden: /teken|schilder|aquarel|illustra|design|kalligraf|schets|🎨/i, punten: {
    Starten: ["Basismateriaal kopen (schetsboek, potloden of verf)", "Een map met voorbeelden en inspiratie aanleggen", "Beginnerscursus of boek kiezen"],
    Oefenen: ["Elke dag 10 minuten schetsen", "Vormen, licht en schaduw oefenen", "Naar het echte leven tekenen", "Een werk van een meester namaken als studie"],
    Verdiepen: ["Perspectief leren", "Kleurtheorie leren", "Een serie van vijf werken in je eigen stijl maken"],
    Delen: ["Portfolio of account voor je werk starten", "Feedback vragen in een community", "Meedoen aan een challenge (zoals Inktober)"] } },
  { id: "foto", naam: "Fotografie & video", emoji: "📷", woorden: /foto|video|film|camera|vlog|drone|bewerk|📷|🎥/i, punten: {
    Starten: ["Handmatige instellingen van je camera of telefoon leren", "Bewerkingsapp kiezen", "Mappen en back-up voor je bestanden opzetten"],
    Oefenen: ["Elke week een fotografie-opdracht met een thema", "Compositie: derdenregel en lijnen", "Sluitertijd, diafragma en ISO oefenen"],
    Verdiepen: ["Kleurcorrectie en bewerken", "Licht: gouden uur en kunstlicht", "Een serie of fotoverhaal maken"],
    Delen: ["Portfolio online zetten", "Feedback vragen op je beste werk", "Een foto afdrukken of exposeren"] } },
  { id: "schrijven", naam: "Schrijven", emoji: "✍️", woorden: /schrijf|verhaal|roman|poëzie|gedicht|blog|journal|✍️/i, punten: {
    Starten: ["Vaste schrijfplek en vast moment kiezen", "Genre of vorm kiezen", "Ideeënboekje beginnen"],
    Oefenen: ["Elke dag 300 woorden schrijven", "Schrijfopdrachten (prompts) gebruiken", "Een oude tekst herschrijven", "Veel lezen in je genre"],
    Verdiepen: ["Structuur en plot leren", "Dialogen oefenen", "Je eigen werk redigeren"],
    Delen: ["Proeflezers vragen", "Een schrijfgroep zoeken", "Iets publiceren (blog of wedstrijd)"] } },
  { id: "tech", naam: "Programmeren & tech", emoji: "💻", woorden: /program|code|coderen|python|javascript|excel|data|web|app bouwen|ai|💻/i, punten: {
    Starten: ["Taal of tool kiezen", "Ontwikkelomgeving installeren", "Cursus of tutorial kiezen"],
    Oefenen: ["Elke sessie één kleine opdracht afmaken", "Git leren gebruiken", "Code van anderen lezen"],
    Verdiepen: ["Een eigen project bouwen", "Testen en debuggen leren", "Officiële documentatie lezen"],
    Delen: ["Je code online zetten (GitHub)", "Bijdragen aan een open-sourceproject", "Een demo of portfolio maken"] } },
  { id: "koken", naam: "Koken & bakken", emoji: "🍳", woorden: /kook|koken|bak|brood|taart|recept|🍳|🍰/i, punten: {
    Starten: ["Basisuitrusting: een goed mes en een paar goede pannen", "Snijtechnieken leren", "Vijf basisrecepten kiezen"],
    Oefenen: ["Elke week een nieuw recept", "Mise en place: alles klaarzetten voor je begint", "Proeven en op smaak brengen"],
    Verdiepen: ["Eén keuken verdiepen (bv. Italiaans of Aziatisch)", "Deeg, brood of sauzen van de basis maken", "Koken zonder recept"],
    Delen: ["Een etentje geven", "Je eigen receptenboekje bijhouden", "Een kookworkshop volgen"] } },
  { id: "maken", naam: "Ambacht & maken", emoji: "🔧", woorden: /hout|timmer|brei|haak|naai|3d|print|klus|keramiek|pottenbak|ambacht|🔧|🧵/i, punten: {
    Starten: ["Veilige werkplek en basisgereedschap", "Een beginnersproject kiezen", "Materiaal inkopen"],
    Oefenen: ["Basistechnieken oefenen", "Kleine projecten echt afmaken", "Noteren wat misging en waarom"],
    Verdiepen: ["Iets naar eigen ontwerp maken", "Een nieuwe techniek leren", "Afwerking verbeteren"],
    Delen: ["Iets maken als cadeau", "Een maker-community zoeken", "Werk laten zien of verkopen"] } },
  { id: "tuin", naam: "Tuinieren & planten", emoji: "🌱", woorden: /tuin|plant|moestuin|groente|bloem|🌱/i, punten: {
    Starten: ["Plek kiezen en zon en schaduw bekijken", "Grondsoort bekijken en verbeteren", "Een zaai- en plantkalender maken"],
    Oefenen: ["Vast moment voor water geven en verzorgen", "Bijhouden wat groeit en wat niet", "Snoeien en oogsten leren"],
    Verdiepen: ["Composteren", "Wisselteelt in de moestuin", "Planten voor bijen en vlinders"],
    Delen: ["Stekjes of zaden ruilen", "Een volkstuin of tuinclub zoeken", "Je oogst delen"] } },
  { id: "spel", naam: "Denksport & spel", emoji: "♟️", woorden: /schaak|dammen|bridge|go\b|puzzel|poker|spel|♟️|🧩|🎮/i, punten: {
    Starten: ["Regels en basisprincipes leren", "Oefenplatform of app kiezen", "Je beginrating of niveau vastleggen"],
    Oefenen: ["Elke dag een paar puzzels", "Je eigen partijen analyseren", "Vaste patronen en openingen oefenen"],
    Verdiepen: ["Een strategieboek lezen", "Eindspellen oefenen", "Partijen van betere spelers naspelen"],
    Delen: ["Lid worden van een club", "Een toernooi spelen", "Iemand anders het spel leren"] } },
  { id: "mind", naam: "Mindfulness & ontspanning", emoji: "🧘", woorden: /medita|mindful|ademhal|ontspan|yoga|🧘/i, punten: {
    Starten: ["Vast moment en rustige plek kiezen", "App of les kiezen", "Beginnen met 5 minuten per dag"],
    Oefenen: ["Elke dag 10 minuten oefenen", "Ademhalingsoefeningen", "Kort bijhouden hoe je je voelt"],
    Verdiepen: ["Een workshop of retraite volgen", "Langere sessies proberen", "Lezen over de achtergrond"],
    Delen: ["Een groepsles volgen", "Samen met iemand oefenen"] } },
  { id: "algemeen", naam: "Algemeen", emoji: "✨", woorden: /.^/, punten: {
    Starten: ["Concreet doel formuleren", "Benodigdheden regelen", "Een goede leerbron kiezen", "Vaste tijd in je week kiezen"],
    Oefenen: ["Een vast weekritme volgen", "Elke sessie loggen", "Na elke week kort terugkijken"],
    Verdiepen: ["Het volgende niveau kiezen", "Feedback vragen van iemand met ervaring"],
    Delen: ["Een community zoeken", "Laten zien wat je gemaakt of geleerd hebt"] } }
];
/** Aanvulling per soort: een skill meet je, een hobby houd je leuk en vol. */
const HS_SOORT_PUNTEN = {
  skill: ["Starten|Nulmeting doen: waar sta je nu?", "Starten|Leerdoel concreet maken: wat kun je over 3 maanden?", "Verdiepen|Elke maand een voortgangstoets", "Verdiepen|Feedback vragen van iemand die beter is"],
  hobby: ["Starten|Vaste tijd in je agenda blokken", "Oefenen|Iets kiezen om naar uit te kijken", "Verdiepen|Na een maand: vind ik het nog leuk, en wat maakt het leuk?"]
};
const hsCat = id => HS_CATS.find(c => c.id === id) || HS_CATS[HS_CATS.length - 1];
function hsRaadCat(naam, emoji) {
  const t = (naam || "") + " " + (emoji || "");
  const c = HS_CATS.find(c => c.id !== "algemeen" && c.woorden.test(t));
  return c ? c.id : "algemeen";
}
/** De punten van een sjabloon, met een vaste sleutel zodat opnieuw toepassen niets dubbel maakt. */
function hsSjabloonPunten(catId, soort) {
  const c = hsCat(catId), uit = [];
  HS_FASEN.forEach(f => (c.punten[f] || []).forEach((t, i) => uit.push({ groep: f, tekst: t, sleutel: c.id + "." + f + "." + i })));
  (HS_SOORT_PUNTEN[soort] || []).forEach((r, i) => { const [f, t] = r.split("|"); uit.push({ groep: f, tekst: t, sleutel: soort + "." + i }); });
  return uit;
}
/** Voegt ontbrekende sjabloonpunten toe; geeft het aantal nieuwe terug. */
function hsPasSjabloonToe(x, catId) {
  x.cat = catId || x.cat || hsRaadCat(x.naam, x.emoji);
  const lijst = x.checklist || (x.checklist = []);
  const heb = new Set(lijst.map(p => p.sleutel).filter(Boolean));
  const nieuw = hsSjabloonPunten(x.cat, x.soort).filter(p => !heb.has(p.sleutel))
    .map((p, i) => ({ id: uid(), tekst: p.tekst, af: false, groep: p.groep, sleutel: p.sleutel, afOp: null, volgorde: Date.now() + i }));
  lijst.push(...nieuw);
  return nieuw.length;
}
const hsGroepVolgorde = g => { const i = HS_FASEN.indexOf(g); return i < 0 ? 99 : i; };
function hsChecklistGroepen(x) {
  const m = new Map();
  (x.checklist || []).forEach(p => { const g = p.groep || "Eigen"; if (!m.has(g)) m.set(g, []); m.get(g).push(p); });
  return [...m.entries()].sort((a, b) => hsGroepVolgorde(a[0]) - hsGroepVolgorde(b[0]));
}
function hsChecklistHTML(x) {
  const cl = x.checklist || [], af = cl.filter(p => p.af).length, c = hsCat(x.cat);
  let h = sectie("Checklist", cl.length ? `${af}/${cl.length}` : null,
    `<button class="actie" data-act="hs-sjabloon" data-id="${x.id}">${cl.length ? "Sjabloon" : "+ sjabloon"}</button>`);
  h += `<div class="card hs-checklist" style="--hk:${x.kleur}">`;
  if (!cl.length) {
    h += `<div class="klein" style="padding:12px 14px 2px">Nog geen checklist. Kies een sjabloon voor <b>${esc(c.emoji + " " + c.naam)}</b>, of voeg zelf punten toe.</div>
      <div style="padding:8px 12px 2px"><button class="knop klein primair" data-act="hs-sjabloon-toepassen" data-id="${x.id}" data-cat="${c.id}">${ico("lijst")} Sjabloon ${esc(c.naam)} gebruiken</button></div>`;
  } else {
    const pct = Math.round(af / cl.length * 100);
    h += `<div class="hs-clkop"><div class="hs-balk"><i style="width:${pct}%"></i></div><span class="klein">${esc(c.emoji + " " + c.naam)} · ${pct}%</span></div>`;
    const open = V.hsClOpen || (V.hsClOpen = {});
    hsChecklistGroepen(x).forEach(([g, punten]) => {
      const n = punten.filter(p => p.af).length, dicht = open[x.id + g] === false || (open[x.id + g] === undefined && n === punten.length);
      h += `<button class="hs-cgroep" data-act="hs-cl-groep" data-id="${x.id}" data-g="${esc(g)}" aria-expanded="${!dicht}">
          <span>${esc(g)}</span><span class="klein">${n}/${punten.length}</span>${ico("pijlr", `width:14px;height:14px;transform:rotate(${dicht ? 0 : 90}deg);transition:transform .2s`)}</button>`;
      if (!dicht) h += punten.map(p => `<div class="hs-mijlpaal${p.af ? " af" : ""}">
          <button class="hs-check" data-act="hs-cl-vink" data-id="${x.id}" data-p="${p.id}" aria-pressed="${!!p.af}" aria-label="Afvinken">${ico("check")}</button>
          <span class="tekst">${esc(p.tekst)}</span>
          ${p.af ? "" : `<button class="icon-btn" data-act="hs-cl-taak" data-id="${x.id}" data-p="${p.id}" aria-label="Als taak inplannen">${ico("komend")}</button>`}
          <button class="icon-btn" data-act="hs-cl-weg" data-id="${x.id}" data-p="${p.id}" aria-label="Verwijderen">${ico("x")}</button></div>`).join("");
    });
  }
  h += `<div class="hs-nieuwveld"><input class="invoer" id="hs-cl-nieuw" type="text" placeholder="Eigen punt toevoegen…" enterkeyhint="done" data-id="${x.id}"><button class="knop klein rand" data-act="hs-cl-toevoegen" data-id="${x.id}">Toevoegen</button></div></div>`;
  return h;
}
function hsSjabloonBlad(x) {
  const huidig = x.cat || hsRaadCat(x.naam, x.emoji);
  bladOpen("Checklist-sjabloon", `
    <p class="klein" style="margin-top:2px">Kies wat het best past bij <b>${esc(x.emoji + " " + x.naam)}</b>. Je krijgt punten in vier fasen, plus punten voor een ${x.soort === "skill" ? "skill (leren meten)" : "hobby (plezier en ritme)"}. Wat je al hebt, wordt niet dubbel toegevoegd.</p>
    <div class="hs-cats">${HS_CATS.map(c => `<button data-hs-cat="${c.id}" aria-pressed="${c.id === huidig}"><span class="em">${c.emoji}</span><span>${esc(c.naam)}</span></button>`).join("")}</div>
    <div class="mm-voorbeeld" id="hs-sj-voorbeeld" style="margin-top:12px"></div>`,
    `<button class="knop breed primair" id="hs-sj-ok">Toevoegen aan checklist</button>`);
  let keuze = huidig;
  const toon = () => {
    const heb = new Set((x.checklist || []).map(p => p.sleutel));
    const p = hsSjabloonPunten(keuze, x.soort), nieuw = p.filter(q => !heb.has(q.sleutel));
    $("#hs-sj-voorbeeld").innerHTML = `<b>${nieuw.length} nieuwe punten</b>` + HS_FASEN.map(f => {
      const r = nieuw.filter(q => q.groep === f); if (!r.length) return "";
      return `<div class="r"><span class="s">${f}</span><span>${r.map(q => esc(q.tekst)).join("<br>")}</span></div>`;
    }).join("");
    $("#hs-sj-ok").disabled = !nieuw.length;
    $("#hs-sj-ok").textContent = nieuw.length ? `${nieuw.length} punten toevoegen` : "Alles staat er al in";
  };
  $("#bladinhoud").addEventListener("click", e => {
    const b = e.target.closest("[data-hs-cat]"); if (!b) return;
    keuze = b.dataset.hsCat; $$("[data-hs-cat]").forEach(q => q.setAttribute("aria-pressed", String(q === b))); toon();
  });
  $("#hs-sj-ok").onclick = async () => {
    const n = hsPasSjabloonToe(x, keuze);
    bladSluit(); await hsBewaar(x); teken();
    toast(`${n} punten toegevoegd aan je checklist`);
  };
  toon();
}

/* ---------- Acties ---------- */
document.addEventListener("click", async e => {
  const el = e.target.closest && e.target.closest("[data-act]");
  if (!el || !el.dataset.act.startsWith("hs-")) return;
  const act = el.dataset.act, x = el.dataset.id ? vind("hs_items", el.dataset.id) : null;
  if (!x) return;
  const punt = el.dataset.p ? (x.checklist || []).find(p => p.id === el.dataset.p) : null;
  switch (act) {
    case "hs-sjabloon": hsSjabloonBlad(x); break;
    case "hs-sjabloon-toepassen": { const n = hsPasSjabloonToe(x, el.dataset.cat); await hsBewaar(x); teken(); toast(`${n} punten toegevoegd`); break; }
    case "hs-cl-groep": { const k = x.id + el.dataset.g, o = V.hsClOpen || (V.hsClOpen = {}); o[k] = el.getAttribute("aria-expanded") !== "true"; teken(); break; }
    case "hs-cl-vink":
      if (!punt) break;
      punt.af = !punt.af; punt.afOp = punt.af ? new Date().toISOString() : null;
      await hsBewaar(x); if (punt.af) tril(10); teken();
      break;
    case "hs-cl-taak":
      if (punt) openTaakBlad(null, { titel: punt.tekst, labels: ["hobbyskills"], notitie: `${x.emoji} ${x.naam} · checklist (${punt.groep || "Eigen"})` });
      break;
    case "hs-cl-weg":
      if (!punt) break;
      x.checklist = x.checklist.filter(p => p !== punt); await hsBewaar(x); teken();
      toast("Punt verwijderd", "Ongedaan maken", async () => { x.checklist.push(punt); await hsBewaar(x); teken(); });
      break;
    case "hs-cl-toevoegen": { const v = $("#hs-cl-nieuw"); if (v) await hsClToevoegen(x.id, v.value); break; }
  }
});
async function hsClToevoegen(id, tekst) {
  const x = vind("hs_items", id); tekst = (tekst || "").trim();
  if (!x || !tekst) return;
  (x.checklist || (x.checklist = [])).push({ id: uid(), tekst, af: false, groep: "Eigen", sleutel: null, afOp: null, volgorde: Date.now() });
  await hsBewaar(x); teken();
  const n = $("#hs-cl-nieuw"); if (n) n.focus();
}
RT_NA.push(() => {
  const v = $("#hs-cl-nieuw");
  if (v) v.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); hsClToevoegen(v.dataset.id, v.value); } };
});
