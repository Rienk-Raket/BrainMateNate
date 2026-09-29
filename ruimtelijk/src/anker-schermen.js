"use strict";
// === SECTIE 71: ANKER – SCHERMEN ===
/* ==========================================================================
   Alle schermen van Anker. Elk scherm is een functie die HTML teruggeeft;
   de app zet die in beeld via teken() (zoals alle andere schermen).
   Schermnamen: anker (home, of de intro als die nog niet gezien is),
   ankerintro, ankerkies, ankerhelp, ankerervaring, ankerinst, ankerbronnen.
   Knoppen hebben data-act="mf-…"; die worden onderaan afgehandeld.
   ========================================================================== */
V.mfHelp = V.mfHelp || { drukte: null, energie: null, tijd: null };
V.mfVerras = V.mfVerras || null;

/* Titels in de kopbalk */
[["anker", "Anker", () => "Even landen"], ["ankerintro", "Anker", () => "Even landen"], ["ankerkies", "Kies zelf", () => "Alle oefeningen"],
 ["ankerhelp", "Help me kiezen", () => "Drie vragen, alles mag je overslaan"], ["ankerervaring", "Jouw ervaring", () => "Alleen op dit toestel"],
 ["ankerinst", "Anker-instellingen", () => "Wijzigingen worden direct bewaard"], ["ankerbronnen", "Bronnen", () => "In gewone taal"]]
  .forEach(([view, titel, onder]) => Object.defineProperty(KOPPEN, view, { get: () => [titel, onder], configurable: true, enumerable: true }));

const mfScherm = inhoud => `<div class="mf-scherm mf-l-${mfInst().lettergrootte}">${inhoud}</div>`;
function mfWeekMomenten() { return mfDezeWeek().length; }

/* ---------- 71.1 Introscherm (eerste keer, later via instellingen) ---------- */
function mfIntroHTML() {
  const s = mfInst();
  return mfScherm(`
    <h2 class="mf-titel">${esc(MF_TEKST.introTitel)}</h2>
    <p class="mf-vet">${esc(MF_TEKST.introRegel)}</p>
    <button class="mf-snelknop" data-act="mf-start" data-id="A1" data-min="1" data-bron="snelstart">${esc(MF_TEKST.snelknop)}</button>
    <div class="mf-rij"><button class="knop rand mf-klein" data-act="mf-ga" data-view="ankerkies">Kies zelf</button>
      <button class="knop rand mf-klein" data-act="mf-ga" data-view="ankerhelp">Help me kiezen</button></div>
    <h3 class="mf-kop3">${esc(MF_TEKST.profielVraag)}</h3>
    ${mfProfielLijst(s.profiel, true)}
    <div class="card card-pad mf-blok"><h3 class="mf-kop3">Zo werkt het</h3><p>${esc(MF_TEKST.zoWerktHet)}</p></div>
    <div class="card card-pad mf-blok"><h3 class="mf-kop3">Eerlijk over het bewijs</h3><p>${esc(MF_TEKST.bewijs)}</p>
      <button class="mf-link" data-act="mf-ga" data-view="ankerbronnen">Bronnen in gewone taal</button></div>
    <div class="card card-pad mf-blok"><h3 class="mf-kop3">Waarom gratis?</h3><p>${esc(MF_TEKST.gratis)}</p></div>
    <p class="mf-voet">${esc(MF_TEKST.voetregel)}</p>
    <button class="knop breed primair mf-verder" data-act="mf-intro-klaar">Verder</button>`);
}
/* Profielkeuze als lijst (geen diagnoselabels in de koppen). */
function mfProfielLijst(huidig, metOverslaan) {
  const rijen = MF_TEKST.profielen.map(([k, kop, uitleg]) => `<li><button class="mf-profiel${huidig === k ? " aan" : ""}" data-act="mf-profiel-kies" data-p="${k}" aria-pressed="${huidig === k}">
    <b>${esc(kop)}</b><span>${esc(uitleg)}</span></button></li>`);
  if (metOverslaan) rijen.push(`<li><button class="mf-profiel mf-overslaan${huidig == null ? " aan" : ""}" data-act="mf-profiel-kies" data-p="" aria-pressed="${huidig == null}"><b>Sla over</b></button></li>`);
  return `<ul class="mf-profielen" role="list">${rijen.join("")}</ul>`;
}

/* ---------- 71.2 Anker-home ---------- */
function vwAnker() {
  const s = mfInst();
  if (!s.introGezien) return mfIntroHTML();
  const week = mfDezeWeek(), minuten = Math.round(week.reduce((a, x) => a + (x.duurSec || 0), 0) / 60);
  const fav = s.favorieten.map(mfOef).filter(Boolean).filter(o => !(s.profiel === "energie" && o.id === "Z2"));
  let h = `<button class="mf-snelknop" data-act="mf-start" data-id="A1" data-min="1" data-bron="anker">${esc(MF_TEKST.snelknop)}</button>
    <div class="mf-rij"><button class="knop rand" data-act="mf-ga" data-view="ankerkies">Kies zelf</button>
      <button class="knop rand" data-act="mf-ga" data-view="ankerhelp">Help me kiezen</button></div>
    <button class="mf-profielchip" data-act="mf-profiel" aria-label="Profiel wijzigen">Profiel: ${esc(s.profiel ? MF_PROFIELNAAM[s.profiel] : "niet gekozen")} · wijzig</button>
    <p class="mf-week">Deze week: ${week.length} ${week.length === 1 ? "moment" : "momenten"}${week.length ? `, ${minuten} ${minuten === 1 ? "minuut" : "minuten"}` : ""}</p>`;
  if (fav.length) h += `<h3 class="mf-kop3">Favorieten</h3><ul class="mf-oefenlijst" role="list">${fav.map(o => mfOefKaart(o)).join("")}</ul>`;
  h += mfProgrammaKaart();
  h += `<ul class="mf-menu" role="list">
    <li><button data-act="mf-ga" data-view="ankerervaring">${ico("grafiek")}<span>Jouw ervaring</span></button></li>
    <li><button data-act="mf-ga" data-view="ankerinst">${ico("instel")}<span>Instellingen</span></button></li>
    <li><button data-act="mf-ga" data-view="ankerbronnen">${ico("boek")}<span>Bronnen in gewone taal</span></button></li>
    <li><button data-act="mf-deel">${ico("deel")}<span>Deel Anker</span></button></li></ul>
    <p class="mf-voet">${esc(MF_TEKST.voetregel)}</p>`;
  return mfScherm(h);
}
function vwAnkerIntro() { return mfIntroHTML(); }

/* Een kaartje voor één oefening: tik = starten met de standaardduur. */
function mfOefKaart(o, opties) {
  opties = opties || {};
  const s = mfInst(), min = opties.min || mfStandaardMin(o), fav = s.favorieten.includes(o.id), label = mfRustigLabel(o);
  const bron = opties.bron || "anker", checkin = opties.checkin ? ` data-checkin="1"` : "";
  return `<li class="mf-oef">
    <button class="mf-oefhoofd" data-act="mf-start" data-id="${o.id}" data-min="${min}" data-bron="${bron}"${checkin} aria-label="Start ${esc(o.naam)}, ${min} ${min === 1 ? "minuut" : "minuten"}">
      <b>${esc(o.naam)}</b><span class="mf-oefwat">${esc(o.wat)}</span>
      <span class="mf-oefmeta">${opties.min ? `${min} min` : esc(mfDuurTekst(o))}${label ? ` · ${label}` : o.beweging ? " · bewegen" : ""}${MF_BEWIJS[o.id] ? ` · ${MF_BEWIJS_TEKST[MF_BEWIJS[o.id]]}` : ""}</span></button>
    <div class="mf-oefknoppen">
      ${!opties.min && o.varianten.length > 1 ? o.varianten.map(m => `<button class="mf-duur" data-act="mf-start" data-id="${o.id}" data-min="${m}" data-bron="${bron}" aria-label="Start ${esc(o.naam)}, ${m} minuten">${m}′</button>`).join("") : ""}
      <button class="mf-fav" data-act="mf-fav" data-id="${o.id}" aria-pressed="${fav}" aria-label="${fav ? "Uit favorieten halen" : "Bewaar als favoriet"}: ${esc(o.naam)}">${fav ? "★" : "☆"}</button>
    </div></li>`;
}

/* ---------- 71.3 Kies zelf: vier groepen ---------- */
function vwAnkerKies() {
  const s = mfInst();
  let h = "";
  MF_CATEGORIEEN.forEach(cat => {
    let lijst = MF_OEFENINGEN.filter(o => o.categorie === cat);
    const verborgen = s.profiel === "energie" ? lijst.filter(o => o.inspanning !== "geen") : [];
    lijst = lijst.filter(o => !verborgen.includes(o));
    h += `<h3 class="mf-kop3">${esc(cat)}</h3><ul class="mf-oefenlijst" role="list">${lijst.map(o => mfOefKaart(o)).join("")}</ul>`;
    if (verborgen.length) h += `<p class="mf-klein">${verborgen.map(o => esc(o.naam)).join(", ")} staat uit door je profiel. <button class="mf-link" data-act="mf-profiel">Profiel wijzigen</button></p>`;
  });
  return mfScherm(h);
}

/* ---------- 71.4 Help me kiezen (drie vragen, alles overslaanbaar) ---------- */
function vwAnkerHelp() {
  const a = V.mfHelp;
  const vraag = (k, titel, opties) => `<fieldset class="mf-vraag"><legend>${titel}</legend><ul class="mf-chips" role="list">
    ${opties.map(([w, n]) => `<li><button class="mf-chip" data-act="mf-help" data-k="${k}" data-w="${w}" aria-pressed="${String(a[k]) === String(w)}">${n}</button></li>`).join("")}
    <li><button class="mf-chip mf-sla" data-act="mf-help" data-k="${k}" data-w="" aria-pressed="${a[k] === null}">Sla over</button></li></ul></fieldset>`;
  let h = vraag("drukte", "Hoe druk is je hoofd?", [[1, "1 rustig"], [2, "2"], [3, "3"], [4, "4"], [5, "5 heel druk"]])
    + vraag("energie", "Hoeveel energie heb je?", [[1, "1 heel weinig"], [2, "2"], [3, "3"], [4, "4"], [5, "5 veel"]])
    + vraag("tijd", "Hoeveel tijd heb je?", [[1, "1 min"], [3, "3 min"], [5, "5 min"], [10, "10 min"]]);
  const voorstel = mfVoorstellen(a), top = voorstel.slice(0, 3);
  h += `<h3 class="mf-kop3">Dit past nu misschien</h3><p class="mf-klein">Anker stelt voor, jij beslist. Niets start vanzelf.</p>
    <ul class="mf-oefenlijst" role="list">${top.map(o => mfOefKaart(o, { min: mfMinVoor(o, a.tijd), checkin: true })).join("")}</ul>`;
  const verras = V.mfVerras && mfOef(V.mfVerras);
  if (verras && voorstel.includes(verras) && !top.includes(verras)) h += `<h3 class="mf-kop3">Verrassing</h3><ul class="mf-oefenlijst" role="list">${mfOefKaart(verras, { min: mfMinVoor(verras, a.tijd), checkin: true })}</ul>`;
  if (voorstel.length > top.length) h += `<button class="knop breed rand" data-act="mf-verras">Verras me</button>`;
  return mfScherm(h);
}
const mfCheckin = () => {
  const a = V.mfHelp;
  if (a.drukte == null && a.energie == null && a.tijd == null) return null;
  return { energie: a.energie, prikkels: a.drukte, doel: mfDoel(a) };
};

/* ---------- 71.5 Programma "7 dagen landen" ---------- */
function mfProgrammaKaart() {
  const p = mfProgramma(), dagen = mfProgrammaDagen();
  if (!p) return `<div class="card card-pad mf-prog"><h3 class="mf-kop3">7 dagen landen</h3>
    <p>Elke dag één korte oefening, 3 tot 5 minuten. Een dag missen is geen probleem: je gaat gewoon verder waar je was.</p>
    <button class="knop rand" data-act="mf-prog-start">Begin met dag 1</button></div>`;
  const nu = Math.min(p.huidigeDag || 0, 7);
  const lijst = `<ol class="mf-progdagen">${dagen.map((id, i) => `<li class="${i < nu ? "af" : i === nu ? "nu" : ""}"><span>${i < nu ? "✓" : i + 1}</span>${esc(mfOef(id).naam)}${i < nu ? '<span class="mf-sr"> (gedaan)</span>' : ""}</li>`).join("")}</ol>`;
  if (nu >= 7) return `<div class="card card-pad mf-prog"><h3 class="mf-kop3">7 dagen landen</h3><p>Je hebt alle zeven oefeningen gedaan.</p>${lijst}
    <button class="knop rand" data-act="mf-prog-opnieuw">Opnieuw beginnen</button></div>`;
  const o = mfOef(dagen[nu]), min = mfStandaardMin(o);
  return `<div class="card card-pad mf-prog"><h3 class="mf-kop3">7 dagen landen · dag ${nu + 1} van 7</h3>
    <button class="knop breed primair" data-act="mf-start" data-id="${o.id}" data-min="${min}" data-bron="programma">${esc(o.naam)} · ${min} min</button>${lijst}</div>`;
}

/* ---------- 71.6 Jouw ervaring (geen streaks, geen vergelijking met anderen) ---------- */
function vwAnkerErvaring() {
  const v = vandaagISO(), week = mfDezeWeek(), minuten = Math.round(week.reduce((a, x) => a + (x.duurSec || 0), 0) / 60);
  const dagenMet = new Set(week.map(mfDatum)).size;
  const tel = new Map(); S.mf_sessies.forEach(x => tel.set(x.oefeningId, (tel.get(x.oefeningId) || 0) + 1));
  const top = [...tel].sort((a, b) => b[1] - a[1]).slice(0, 3);
  let h = `<ul class="mf-tegels" role="list">
    <li><b>${week.length}</b><span>${week.length === 1 ? "moment" : "momenten"} deze week</span></li>
    <li><b>${minuten}</b><span>${minuten === 1 ? "minuut" : "minuten"} deze week</span></li>
    <li><b>${dagenMet} van 7</b><span>dagen met een moment</span></li></ul>`;
  if (!S.mf_sessies.length) return mfScherm(h + `<p class="mf-klein">Nog geen momenten. Alles wat je doet, blijft op dit toestel.</p>`);
  h += `<h3 class="mf-kop3">Wat je het vaakst deed</h3><ol class="mf-top">${top.map(([id, n]) => `<li><span>${esc((mfOef(id) || { naam: id }).naam)}</span><b>${n}×</b></li>`).join("")}</ol>`;
  // Per oefening: beter, hetzelfde, onrustiger (alleen sessies waar je iets koos)
  const per = MF_OEFENINGEN.map(o => {
    const l = S.mf_sessies.filter(x => x.oefeningId === o.id && x.nameting);
    return { o, b: l.filter(x => x.nameting === "beter").length, h: l.filter(x => x.nameting === "hetzelfde").length, r: l.filter(x => x.nameting === "onrustiger").length, n: l.length };
  }).filter(x => x.n);
  if (per.length) h += `<h3 class="mf-kop3">Hoe het daarna was</h3>
    <ul class="mf-legenda" role="list" aria-hidden="true"><li><i class="b"></i>beter</li><li><i class="h"></i>hetzelfde</li><li><i class="r"></i>onrustiger</li></ul>
    <ul class="mf-verdeling" role="list">${per.map(x => `<li><span class="mf-vnaam">${esc(x.o.naam)}</span>
      <span class="mf-vbalk" aria-hidden="true">${x.b ? `<i class="b" style="flex:${x.b}"></i>` : ""}${x.h ? `<i class="h" style="flex:${x.h}"></i>` : ""}${x.r ? `<i class="r" style="flex:${x.r}"></i>` : ""}</span>
      <span class="mf-vtekst">Beter ${x.b}, hetzelfde ${x.h}, onrustiger ${x.r}</span></li>`).join("")}</ul>`;
  if (mfOnrustigInZevenDagen() >= 5) h += `<div class="card card-pad mf-blok"><p>Je voelde je de afgelopen week vaker onrustiger na een oefening. Praat erover met je huisarts of behandelaar. Dat mag altijd.</p></div>`;
  h += `<p class="mf-klein">Stoppen telt ook als moment. Er is geen reeks om vol te houden.</p>`;
  return mfScherm(h);
}

/* ---------- 71.7 Instellingen ---------- */
function mfSchakel(sleutel, titel, uitleg, aan, uit) {
  return `<li class="schakel${uit ? " mf-uitgezet" : ""}"><span class="tekst"><b>${esc(titel)}</b>${uitleg ? `<small>${esc(uitleg)}</small>` : ""}</span>
    <button class="toggle" data-act="mf-inst" data-k="${sleutel}" aria-pressed="${!!aan}" aria-label="${esc(titel)}"></button></li>`;
}
function vwAnkerInst() {
  const s = mfInst(), arm = s.prikkelarm || inst("rust", false);
  const seg = (k, waarde, opties) => `<div class="segment mf-seg" role="group">${opties.map(([w, n]) => `<button data-act="mf-zet" data-k="${k}" data-w="${w}" aria-pressed="${String(waarde) === String(w)}">${n}</button>`).join("")}</div>`;
  const mindful = mfMindfulGewoonte();
  let h = `<h3 class="mf-kop3">Profiel</h3>${mfProfielLijst(s.profiel, true)}
    <h3 class="mf-kop3">Prikkels</h3>
    <ul class="card mf-schakels" role="list">
      ${mfSchakel("prikkelarm", "Prikkelarm", "Zet geluid, ademtonen, stem, animatie en trilling in één keer uit.", s.prikkelarm)}
      ${mfSchakel("geluid", "Gong", "Zachte gong aan het begin en eind.", s.geluid, arm)}
      ${mfSchakel("ademtonen", "Ademtonen", "Hoge toon bij inademen, lage toon bij uitademen.", s.ademtonen, arm)}
      ${mfSchakel("stem", "Voorleesstem", "Een stem leest elke stap voor.", s.stem, arm)}
      ${mfSchakel("animatie", "Animatie", "Ademcirkel die groeit en krimpt.", s.animatie, arm || mfSysteemRustig())}
      ${mfSchakel("trilling", "Trilling", "Korte trilling bij elke stap. Werkt niet op iPhone.", s.trilling, arm)}
      ${mfSchakel("geenVasthouden", "Adem niet vasthouden", "Laat de pauzes in vierkant ademen en 4-7-8 weg. Fijn bij duizeligheid.", s.geenVasthouden)}
    </ul>
    ${inst("rust", false) ? `<p class="mf-klein">De prikkelarme modus van de app staat aan. Daardoor staan deze prikkels in Anker ook uit.</p>` : ""}
    ${mfSysteemRustig() ? `<p class="mf-klein">Je toestel vraagt om minder beweging. Daarom staat de animatie uit.</p>` : ""}
    <h3 class="mf-kop3">Ademtempo bij "Lange uitademing"</h3>
    <div class="mf-veld"><span>Inademen</span>${seg("ademIn", s.ademIn, [[3, "3 s"], [4, "4 s"], [5, "5 s"], [6, "6 s"]])}</div>
    <div class="mf-veld"><span>Uitademen</span>${seg("ademUit", s.ademUit, [[3, "3 s"], [4, "4 s"], [5, "5 s"], [6, "6 s"]])}</div>
    ${s.ademUit <= s.ademIn ? `<p class="mf-klein">Tip: maak uitademen langer dan inademen.</p>` : ""}
    <h3 class="mf-kop3">Lettergrootte</h3>
    ${seg("lettergrootte", s.lettergrootte, [["normaal", "Normaal"], ["groot", "Groot"], ["extra", "Extra groot"]])}
    <h3 class="mf-kop3">Koppelingen met de rest van de app</h3>
    <p class="mf-klein">Staan standaard uit. Pas als je ze aanzet, zie je ze op die plek.</p>
    <ul class="card mf-schakels" role="list">
      ${mfSchakel("kop.logboek", "Logboek", "Elk moment als regel in je logboek.", s.koppelingen.logboek)}
      <li class="schakel"><span class="tekst"><b>Mindful moment</b><small>${typeof mfMindfulGewoonte === "function" && mfMindfulGewoonte() ? "Een Anker-moment is je Mindful moment: elk moment van 1 minuut of langer vinkt de gewoonte af." : "Maak de gewoonte “Mindful moment”; daarna vinkt elk Anker-moment hem af."}</small></span>
        ${typeof mfMindfulGewoonte === "function" && mfMindfulGewoonte() ? "" : `<button class="knop klein rand" data-act="mf-gewoonte-maak">Maak</button>`}</li>
      ${mfSchakel("kop.roken", "Rookvrij", "Knop “Even pauze” bij Rookvrij.", s.koppelingen.roken)}
      ${mfSchakel("kop.financieel", "Financieel", "Knop “Even pauze” bij Financieel.", s.koppelingen.financieel)}
      ${mfSchakel("kop.werk", "Werk", "Knop “Focus-start” bij Werk.", s.koppelingen.werk)}
    </ul>
    <h3 class="mf-kop3">Herinneringen</h3>
    <p class="mf-klein">Wordt een terugkerende afspraak in je agenda van de app.</p>
    ${s.herinneringen.length ? `<ul class="card mf-herinneringen" role="list">${s.herinneringen.map(r => `<li><span>${esc(r.tijd)} · ${esc(mfDagenTekst(r.dagen))}</span>
      <button class="icon-btn" data-act="mf-herinnering-weg" data-id="${r.id}" aria-label="Herinnering ${esc(r.tijd)} verwijderen">${ico("prullenbak")}</button></li>`).join("")}</ul>` : ""}
    <div class="card card-pad mf-nieuweherinnering">
      <label class="mf-veld"><span>Tijd</span><input class="invoer" type="time" id="mf-her-tijd" value="08:30"></label>
      <fieldset class="mf-vraag"><legend>Dagen</legend><ul class="mf-chips" role="list">${["ma", "di", "wo", "do", "vr", "za", "zo"].map((d, i) => `<li><button class="mf-chip" data-act="mf-her-dag" data-d="${(i + 1) % 7}" aria-pressed="${i < 5}">${d}</button></li>`).join("")}</ul></fieldset>
      <button class="knop rand" data-act="mf-herinnering-plus">Herinnering toevoegen</button></div>
    <h3 class="mf-kop3">Meer</h3>
    <ul class="mf-menu" role="list">
      <li><button data-act="mf-ga" data-view="ankerintro">${ico("vraag")}<span>Intro opnieuw bekijken</span></button></li>
      <li><button data-act="mf-ga" data-view="ankerbronnen">${ico("boek")}<span>Bronnen in gewone taal</span></button></li></ul>
    <div class="card card-pad mf-blok"><h3 class="mf-kop3">Waarom gratis?</h3><p>${esc(MF_TEKST.gratis)} Alles wat je in Anker doet, blijft op dit toestel.</p></div>
    <div class="card card-pad mf-blok mf-veilig"><h3 class="mf-kop3">Als het niet goed gaat</h3>
      <p>Anker is geen behandeling. Houden klachten aan? Praat met je huisarts of behandelaar.</p>
      <p>’s Avonds, ’s nachts en in het weekend: bel de huisartsenpost.</p>
      <p>Denk je aan zelfmoord? Bel 113 Zelfmoordpreventie: <a href="tel:08000113">0800-0113</a> (gratis, dag en nacht).</p>
      <p>Bij direct gevaar: bel <a href="tel:112">112</a>.</p></div>`;
  return mfScherm(h);
}
function mfDagenTekst(d) {
  if (!d || !d.length || d.length === 7) return "elke dag";
  const n = ["zo", "ma", "di", "wo", "do", "vr", "za"];
  if ([1, 2, 3, 4, 5].every(x => d.includes(x)) && d.length === 5) return "werkdagen";
  return d.slice().sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map(x => n[x]).join(", ");
}

/* ---------- 71.8 Bronnen in gewone taal ---------- */
function vwAnkerBronnen() {
  return mfScherm(`<p>${esc(MF_TEKST.bewijs)}</p>
    <ol class="mf-bronnen">${MF_BRONNEN.map(([wie, wat, wel, niet]) => `<li><b>${esc(wie)}</b><span class="mf-klein">${esc(wat)}</span>
      <p><span class="mf-wel">Wat het laat zien:</span> ${esc(wel)}</p><p><span class="mf-niet">Wat niet:</span> ${esc(niet)}</p></li>`).join("")}</ol>
    <h3 class="mf-bronkop">Ademoefeningen</h3>
    <p>${esc(MF_TEKST_ADEM)}</p>
    <ol class="mf-bronnen mf-bronnen-adem">${MF_BRONNEN_ADEM.map(([wie, wat, wel, niet]) => `<li><b>${esc(wie)}</b><span class="mf-klein">${esc(wat)}</span>
      <p><span class="mf-wel">Wat het laat zien:</span> ${esc(wel)}</p><p><span class="mf-niet">Wat niet:</span> ${esc(niet)}</p></li>`).join("")}</ol>
    <p class="mf-vet">${esc(MF_BRON_SLOT)}</p>
    <p class="mf-voet">${esc(MF_TEKST.voetregel)}</p>`);
}

/* ---------- 71.9 Tikken op de Anker-schermen ---------- */
async function mfProfielBlad() {
  bladOpen("Profiel", `<p class="mf-klein" style="margin-top:0">${esc(MF_TEKST.profielVraag)}</p>${mfProfielLijst(mfInst().profiel, true)}`);
}
document.addEventListener("click", async e => {
  const el = e.target.closest && e.target.closest("[data-act^='mf-']");
  if (!el || el.closest("#mf-speler")) return;
  const act = el.dataset.act;
  switch (act) {
    case "mf-start": {
      const checkin = el.dataset.checkin ? mfCheckin() : null;
      if (!mfInst().introGezien) await mfInstZet({ introGezien: true });
      mfStart(el.dataset.id, { min: +el.dataset.min || null, bron: el.dataset.bron || "anker", checkin });
      break;
    }
    case "mf-ga":
      if (V.view === "anker" && !mfInst().introGezien && el.dataset.view !== "ankerbronnen") await mfInstZet({ introGezien: true });
      ga(el.dataset.view);
      break;
    case "mf-intro-klaar": await mfInstZet({ introGezien: true }); if (V.view === "anker") teken(); else ga("anker"); break;
    case "mf-profiel": mfProfielBlad(); break;
    case "mf-profiel-kies": {
      const p = el.dataset.p || null;
      await mfInstZet({ profiel: p });
      el.closest("ul").querySelectorAll("button").forEach(b => { const aan = (b.dataset.p || null) === p; b.setAttribute("aria-pressed", String(aan)); b.classList.toggle("aan", aan); });
      if ($("#blad").classList.contains("open") && el.closest("#blad")) { bladSluit(); teken(); }
      else if (V.view !== "anker" || mfInst().introGezien) teken();
      toast(p ? "Profiel: " + MF_PROFIELNAAM[p] : "Geen profiel gekozen");
      break;
    }
    case "mf-fav": {
      const s = mfInst(), id = el.dataset.id, f = s.favorieten.includes(id) ? s.favorieten.filter(x => x !== id) : s.favorieten.concat(id);
      await mfInstZet({ favorieten: f }); teken(); break;
    }
    case "mf-help": {
      const k = el.dataset.k, w = el.dataset.w;
      V.mfHelp[k] = w === "" ? null : +w; V.mfVerras = null; teken(); break;
    }
    case "mf-verras": {
      const l = mfVoorstellen(V.mfHelp).slice(3);
      if (l.length) { V.mfVerras = l[Math.floor(Math.random() * l.length)].id; teken(); }
      break;
    }
    case "mf-prog-start": case "mf-prog-opnieuw": await mfProgrammaStart(); teken(); toast("7 dagen landen: dag 1 staat klaar"); break;
    case "mf-deel": mfDeel(null); break;
    case "mf-inst": {
      const k = el.dataset.k, s = mfInst();
      if (k.startsWith("kop.")) { const kk = k.slice(4); await mfInstZet({ koppelingen: Object.assign({}, s.koppelingen, { [kk]: !s.koppelingen[kk] }) }); }
      else await mfInstZet({ [k]: !s[k] });
      teken(); break;
    }
    case "mf-zet": {
      const k = el.dataset.k, w = el.dataset.w;
      await mfInstZet({ [k]: /^\d+$/.test(w) ? +w : w }); teken(); break;
    }
    case "mf-her-dag": el.setAttribute("aria-pressed", String(el.getAttribute("aria-pressed") !== "true")); break;
    case "mf-herinnering-plus": {
      const tijd = ($("#mf-her-tijd") || {}).value || "08:30";
      const dagen = [...document.querySelectorAll('[data-act="mf-her-dag"][aria-pressed="true"]')].map(b => +b.dataset.d);
      await mfHerinneringMaak(tijd, dagen); teken(); break;
    }
    case "mf-herinnering-weg": await mfHerinneringWeg(el.dataset.id); teken(); break;
    case "mf-gewoonte-maak": await mfMindfulMaak(); teken(); break;
  }
});
