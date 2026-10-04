"use strict";
// === SECTIE 102: GEDEELDE LIJST VAN WAT OPEN STAAT (V1, FASE 1) ===
/* ==========================================================================
   Conceptvoorstel V1, fase 1 (besluit Kas 3 oktober 2026).
   Eén alleen-lezen lijst bovenop de bestaande opslag. Modules blijven
   eigenaar van hun gegevens; deze lijst leest via kleine adapters:
   - taken (zoals altijd),
   - SCRUM-kaarten met een deadline (Side Hustle),
   - huishoudlijsten die aan de beurt zijn (ritme),
   - open checklist-items en HobbySkills-mijlpalen (zonder datum: alleen in
     de lijst, niet op Mijn dag).
   Mijn dag en de Nu-kaart lezen voortaan uit deze lijst. Wat er van buiten
   de takenlijst bij mag, kies je zelf (Mijn dag → Widgets kiezen).

   Er komt geen nieuwe opslag en geen nieuwe databaseversie bij.
   De kern (NATE-ITEMS-BEGIN/EINDE) is puur en wordt getest in tests/items.test.mjs.
   ========================================================================== */

/* NATE-ITEMS-BEGIN */
const IDX_BRONNEN = [
  { id: "shkaart", naam: "SCRUM-kaarten met een deadline", kort: "Side Hustle" },
  { id: "huishouden", naam: "Huishoudlijsten die aan de beurt zijn", kort: "Huishouden" }
];

/** SCRUM-kaarten → items. Alleen niet-gearchiveerd, niet in de klaar-kolom, met deadline. */
function idxVanSh(hustles, kaarten, kolommen) {
  const klaar = new Set((kolommen || []).filter(k => k.rol === "klaar").map(k => k.id));
  const metKlaar = new Set((kolommen || []).filter(k => k.rol === "klaar" && !k.gearchiveerd).map(k => k.shId));
  const naam = Object.fromEntries((hustles || []).map(h => [h.id, h]));
  return (kaarten || []).filter(k => !k.gearchiveerd && !klaar.has(k.kolomId) && k.deadline && naam[k.shId] && !naam[k.shId].gearchiveerd)
    .map(k => ({ id: "sh:" + k.id, titel: k.titel, datum: k.deadline, tijd: null, duur: +k.minuten || 25, prioriteit: 2,
      extern: { soort: "shkaart", bronId: k.id, ouder: k.shId, label: naam[k.shId].naam, kanKlaar: metKlaar.has(k.shId) } }));
}
/** Huishoudlijsten die aan de beurt zijn → items. Alleen lijsten met open klussen; nog nooit gedaan telt pas
    vanaf aangemaakt + ritme (anders staan alle nieuwe startlijsten meteen op Mijn dag). */
function idxVanHh(lijsten, vandaag) {
  const dag = d => Math.round(Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) / 864e5);
  return (lijsten || []).filter(l => l.ritme > 0 && (l.taken || []).some(t => !t.uit)).map(l => {
    const laatst = l.laatstGedaan ? l.laatstGedaan.slice(0, 10) : null, dagen = laatst ? dag(vandaag) - dag(laatst) : null;
    const sinds = !laatst && l.gemaakt ? dag(vandaag) - dag(l.gemaakt.slice(0, 10)) : null;
    return { l, dagen, te: dagen != null ? dagen / l.ritme : sinds != null ? sinds / l.ritme : 1 };
  }).filter(x => x.te >= 1).sort((a, b) => b.te - a.te).map(({ l, dagen }) => {
    const min = (l.taken || []).filter(t => !t.uit).reduce((a, t) => a + (+t.min || 0), 0);
    return { id: "hh:" + l.id, titel: `${l.naam} schoonmaken`, datum: vandaag, tijd: null, duur: Math.min(30, min || 15), prioriteit: 3,
      extern: { soort: "huishouden", bronId: l.id, label: dagen == null ? "Nog niet eerder gedaan" : `${dagen} dagen geleden, ritme ${l.ritme} dagen` } };
  });
}
/** Wat mag op Mijn dag: deadline vandaag of eerder; alleen de aangezette bronnen. */
function idxVoorVandaag(items, vandaag, aan) {
  return (items || []).filter(i => i.extern && (aan || []).includes(i.extern.soort) && i.datum && i.datum <= vandaag);
}
/**
 * Volgorde op Mijn dag: eerst taken met een tijd die nog komt, dan wat over de deadline is
 * (van buiten), dan taken zonder tijd, dan wat vandaag de deadline heeft (van buiten), dan de rest.
 * takenKomend/takenZonder/takenVoorbij komen uit mdLijst (al gesorteerd).
 */
function idxSamenvoegen(lijst, extern, vandaag, nuMin, minVan) {
  const komend = lijst.filter(t => minVan(t.tijd) != null && minVan(t.tijd) >= nuMin - 15);
  const zonder = lijst.filter(t => minVan(t.tijd) == null), voorbij = lijst.filter(t => !komend.includes(t) && !zonder.includes(t));
  const laat = extern.filter(i => i.datum < vandaag).sort((a, b) => (a.datum < b.datum ? -1 : 1));
  const nu = extern.filter(i => i.datum >= vandaag);
  return komend.concat(laat, zonder, nu, voorbij);
}
/** Zoeken in alles wat open staat (titel en herkomst), zonder accenten of hoofdletters. */
function idxZoek(items, q, max) {
  const n = s => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const w = n(q).trim(); if (!w) return [];
  return (items || []).filter(i => n(i.titel + " " + ((i.extern && i.extern.soort !== "huishouden" && i.extern.label) || "")).includes(w)).slice(0, max || 20);
}
/** Vraagt iemand in de chat wat er nu aan de beurt is? */
function idxIsWatNu(tekst) {
  const t = String(tekst || "").toLowerCase();
  // Een andere dag ("morgen", "vrijdag", "12-10") is geen vraag over nu.
  if (/\b(morgen|overmorgen|straks|maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag|weekend|volgende|\d{1,2}[-/.]\d{1,2})\b/.test(t)) return false;
  return /\bwat (nu|eerst)\b|\bwat (moet|kan|zal) ik\b.*\b(nu|eerst)\b|\bwat (moet|kan|zal) ik( vandaag)?( nog)? doen\s*\??\s*$|\bwat staat er\b.*\b(open|nu)\b|\bwaar (begin|start) ik\b/.test(t);
}
/** Het antwoord: hooguit twee zinnen. */
function idxNuZin(nu) {
  if (!nu || !nu.een) return "Er staat nu niets open. Rust is ook een plan.";
  const kaal = x => String(x.titel || "").trim().replace(/[.?!…\s]+$/, "").replace(/[.?!]+(\s)/g, "$1");
  const daarna = (nu.twee || []).map(kaal);
  return `Nu: ${kaal(nu.een)}.` + (daarna.length ? ` Daarna: ${daarna.join(" en ")}.` : "");
}
/* NATE-ITEMS-EINDE */

const idxAan = () => inst("idxBronnen", IDX_BRONNEN.map(b => b.id)) || [];

/** Alles wat open staat, uit alle modules (alleen lezen). Voor Mijn dag, en later zoeken en de chat. */
function idxAlles() {
  const v = vandaagISO(), uit = [];
  try { uit.push(...openTaken().map(t => Object.assign({ bron: "taak" }, t))); } catch (e) {}
  try { uit.push(...idxVanSh(S.sh_hustles, S.sh_kaarten, S.sh_kolommen)); } catch (e) {}
  try { uit.push(...idxVanHh(S.hh_lijsten, v)); } catch (e) {}
  try { for (const c of S.checklists || []) (c.items || []).forEach((it, i) => { if (!it.af && !(typeof clSectie === "function" && clSectie(it))) uit.push({ id: `cl:${c.id}:${i}`, titel: it.tekst, extern: { soort: "checklist", bronId: c.id, i, label: c.naam } }); }); } catch (e) {}
  try { for (const x of S.hs_items || []) (x.mijlpalen || []).forEach(m => { if (!m.af) uit.push({ id: `hs:${x.id}:${m.id}`, titel: m.tekst, extern: { soort: "mijlpaal", bronId: x.id, label: x.naam } }); }); } catch (e) {}
  return uit;
}

/* ---------- 102.1 Mijn dag leest uit de gedeelde lijst ---------- */
/** Wat er vandaag van buiten de takenlijst op Mijn dag hoort (zelfde regels als de Nu-kaart). */
function idxExternVandaag() {
  const v = vandaagISO();
  // Alleen-werk-filter: huishouden en side hustle horen daar niet bij.
  if (typeof werkStand === "function" && werkStand() === "alleen") return [];
  // Hooguit één huishoudlijst tegelijk op Mijn dag (de meest achterstallige).
  try { return idxVoorVandaag(idxVanSh(S.sh_hustles, S.sh_kaarten, S.sh_kolommen).concat(idxVanHh(S.hh_lijsten, v).slice(0, 1)), v, idxAan()); } catch (e) { return []; }
}
{
  const _lijst = mdLijst;
  mdLijst = function () {
    const lijst = _lijst.apply(this, arguments), extern = idxExternVandaag(), nuMin = new Date().getHours() * 60 + new Date().getMinutes();
    return extern.length ? idxSamenvoegen(lijst, extern, vandaagISO(), nuMin, fmMin) : lijst;
  };
}
/** Knoppen op de Nu-kaart voor iets van buiten de takenlijst. */
function idxNuHTML(i) {
  const e = i.extern, laat = i.datum && i.datum < vandaagISO();
  const sub = e.soort === "shkaart" ? `${esc(e.label)} · deadline ${laat ? esc(datumLabel(i.datum).toLowerCase()) : "vandaag"}` : `Huishouden · ${esc(e.label)}`;
  const knop = e.soort === "shkaart" ? (e.kanKlaar ? `<button class="knop primair" data-idx="klaar" data-id="${esc(i.id)}">${ico("check")} Klaar</button>` : "")
    : `<button class="knop primair" data-idx="start" data-id="${esc(i.id)}">${ico("ster")} Start</button>`;
  return `<p class="klein idx-bron">${sub}</p><div class="md-nu-acties">${knop}<button class="knop rand" data-idx="open" data-id="${esc(i.id)}">Openen</button></div>`;
}
document.addEventListener("click", async e => {
  const b = e.target.closest && e.target.closest("[data-idx]"); if (!b) return;
  e.preventDefault(); e.stopImmediatePropagation();
  const [soort, bron] = [b.dataset.id.slice(0, b.dataset.id.indexOf(":")), b.dataset.id.slice(b.dataset.id.indexOf(":") + 1)];
  if (soort === "sh") {
    const k = vind("sh_kaarten", bron); if (!k) return;
    if (b.dataset.idx === "klaar") {
      // Via het bord zelf: Definition of Done, burndown, gekoppelde check, activiteit en "Ongedaan".
      await shKaartNaarRol(bron, "klaar");
      const n = vind("sh_kaarten", bron), kol = n && vind("sh_kolommen", n.kolomId);
      if (kol && kol.rol === "klaar") tril(10); else toast("Deze side hustle heeft geen klaar-kolom", "Openen", () => ga("sh", k.shId));
      teken();
    }
    else ga("sh", k.shId);
  } else if (soort === "hh") {
    if (b.dataset.idx === "start") hhKlaarzetten(bron); else ga("hhlijst", bron);
  } else if (soort === "hs") ga("hobbyskill", bron.split(":")[0]);
  else if (soort === "cl") ga("checklist", bron.split(":")[0]);
}, true);

/* ---------- 102.2 Zelf kiezen wat er van buiten bij mag (Widgets kiezen) ---------- */
{
  const _kies = mdWidgetsKiezen;
  mdWidgetsKiezen = function () {
    _kies.apply(this, arguments);
    const aan = idxAan();
    $("#bladinhoud").insertAdjacentHTML("beforeend", `<h3 class="labeltekst idx-kop">Ook op Mijn dag</h3><p class="klein">Dingen uit andere modules die vandaag aan de beurt zijn.</p>
      <ul class="schakels md-schakels">${IDX_BRONNEN.map(b => `<li class="schakel"><span class="tekst"><b>${esc(b.naam)}</b></span><button class="toggle" data-idx-bron="${b.id}" aria-pressed="${aan.includes(b.id)}" aria-label="${esc(b.naam)}"></button></li>`).join("")}</ul>`);
    $("#bladinhoud").addEventListener("click", async e => {
      const t = e.target.closest("[data-idx-bron]"); if (!t) return;
      e.stopPropagation();
      const id = t.dataset.idxBron, l = idxAan(), nieuw = l.includes(id) ? l.filter(x => x !== id) : l.concat(id);
      t.setAttribute("aria-pressed", String(nieuw.includes(id)));
      await zetInst("idxBronnen", nieuw); teken();
    });
  };
}

/* ---------- 102.3 Geen dubbele huishoudsuggestie ----------
   Staat Huishouden aan in "Ook op Mijn dag", dan staat de lijst al op de Nu-kaart; het voorstel valt dan weg. */
if (typeof vsVoorstellen === "function") {
  const _vs = vsVoorstellen;
  vsVoorstellen = function () { const uit = _vs.apply(this, arguments); return idxAan().includes("huishouden") ? uit.filter(x => x.k !== "huishouden") : uit; };
}

/* ---------- 102.4 Dagring telt mee (V1 fase 3) ---------- */
{
  const _ring = fmDagringHTML;
  fmDagringHTML = function () {
    const h = _ring.apply(this, arguments), n = idxExternVandaag().length;
    if (!n) return h;
    // Apart van "open · %": dat zijn de taken van de ring zelf; dit staat in andere modules.
    return h.replace(/(aria-label="Je dag als klok: [^"]*)"/, `$1, en ${n} open in andere modules"`)
      .replace(/<text x="([\d.]+)" y="([\d.]+)" class="fm-dr-sub">[^<]*<\/text>/, (m, x, y) => `${m}<text x="${x}" y="${+y + 14}" class="fm-dr-sub fm-dr-elders">+${n} elders</text>`);
  };
}

/* ---------- 102.5 Zoeken vindt ook wat in andere modules open staat (V1 fase 3) ---------- */
function idxZoekItems() {
  // Voor zoeken ook SCRUM-kaarten zonder deadline en alle huishoudlijsten (niet alleen wat aan de beurt is).
  const uit = idxAlles().filter(i => i.extern);
  try {
    const klaar = new Set((S.sh_kolommen || []).filter(k => k.rol === "klaar").map(k => k.id)), h = Object.fromEntries((S.sh_hustles || []).map(x => [x.id, x]));
    for (const k of S.sh_kaarten || []) if (!k.gearchiveerd && !k.deadline && !klaar.has(k.kolomId) && h[k.shId] && !h[k.shId].gearchiveerd)
      uit.push({ id: "sh:" + k.id, titel: k.titel, extern: { soort: "shkaart", bronId: k.id, ouder: k.shId, label: h[k.shId].naam } });
    for (const l of S.hh_lijsten || []) if (!uit.some(i => i.id === "hh:" + l.id)) uit.push({ id: "hh:" + l.id, titel: l.naam, extern: { soort: "huishouden", bronId: l.id, label: "Huishouden" } });
  } catch (e) {}
  return uit;
}
const IDX_SOORTNAAM = { shkaart: "SCRUM-kaart", huishouden: "Huishouden", checklist: "Checklist", mijlpaal: "Mijlpaal" };
{
  const _zoek = vwZoeken;
  vwZoeken = function () {
    let h = _zoek.apply(this, arguments);
    if (!V.zoek || !V.zoek.trim() || (typeof werkStand === "function" && werkStand() === "alleen")) return h;
    // Checklists en mijlpalen staan al in de gewone resultaten; hier de rest.
    const r = idxZoek(idxZoekItems().filter(i => !["checklist", "mijlpaal"].includes(i.extern.soort)), V.zoek, 20);
    if (r.length) h += sectie("Uit andere modules", r.length) + `<div class="card">${r.map(i => `<button class="rijknop" data-idx="open" data-id="${esc(i.id)}">
      <span class="nm"><b>${esc(i.titel)}</b><span class="klein" style="display:block">${esc(IDX_SOORTNAAM[i.extern.soort] || "")}${i.extern.label ? " · " + esc(i.extern.label) : ""}</span></span>${ico("pijlr", "width:16px;height:16px;color:var(--faint)")}</button>`).join("")}</div>`;
    return h;
  };
}

/* ---------- 102.6 De chat weet wat er nu aan de beurt is (V1 fase 3) ---------- */
if (typeof ncAntwoord === "function") {
  const _antw = ncAntwoord;
  ncAntwoord = function (r) {
    // Niet bij nood, een gedachte om vast te houden of een vraag om hulp (die hebben een eigen antwoord).
    if (r && !["nood", "gedachte"].includes(r.uitkomst) && r.soort !== "hulp" && idxIsWatNu(V.ncLaatste))
      return { tekst: idxNuZin(mdNu()), knoppen: `<button type="button" class="primair" data-nate="ga" data-view="vandaag">Naar Mijn dag</button>` };
    return _antw.apply(this, arguments);
  };
}
