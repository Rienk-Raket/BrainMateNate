"use strict";
/* ==========================================================================
   55. Side Hustle — Modellen (management- en rekenmodellen)
   Een catalogus van modellen die je invult. Elk ingevuld model is een bestand
   (sh_bestanden, soort "sjabloon") en staat dus ook in Bestanden, met
   voortgang, versies en afdrukken. Velden die al in je 5 pijlers staan,
   worden vooraf ingevuld (shVooraf). Rekenmodellen (uurtarief, break-even)
   rekenen live mee.
   Veldtypen: tekst (meerdere regels), regel, eur, getal, pct, tabel, matrix.
   ========================================================================== */
const SH_MODEL_GROEPEN = [["idee", "Idee & klant", "💡"], ["waarde", "Waarde & markt", "💎"], ["geld", "Geld", "💶"], ["plan", "Plannen & groei", "🗺️"]];
const SH_MODELLEN = [
  { id: "sj.scope", naam: "Scope-overzicht", emoji: "🧭", groep: "idee", map: "01", fasen: ["idee"], oms: "Je 5 pijlers op één plek, met een kwaliteitsmeter per antwoord.", les: "effectuation", scope: true, velden: [] },
  { id: "sj.middelen", naam: "Wat heb ik al? (effectuation)", emoji: "🧺", groep: "idee", map: "01", fasen: ["idee"], les: "effectuation",
    oms: "Je middelen, je grens en je eerste stap. Het startpunt volgens effectuation.",
    velden: [["wie", "Wie ben ik?", "Eigenschappen, passies, wat mensen je vragen", "tekst"], ["weet", "Wat weet en kan ik?", "Opleiding, werkervaring, hobby's", "tekst", 5],
      ["ken", "Wie ken ik?", "Netwerk, groepen, mogelijke partners", "tekst"], ["verlies", "Wat kan ik missen?", "Betaalbaar verlies in € en uren", "regel"],
      ["stap", "Mijn eerste stap deze week", "Klein, concreet, met wat je al hebt", "regel"]] },
  { id: "sj.lean", naam: "Lean Canvas", emoji: "🧩", groep: "idee", map: "01", fasen: ["idee", "valideren"], les: "leancanvas", canvas: true,
    oms: "Je hele plan op één pagina, zodat je ziet welke aanname het riskantst is.",
    velden: [["probleem", "Probleem", "Top 1–3 problemen, plus hoe ze nu opgelost worden", "tekst", 1], ["segment", "Klantsegmenten", "Voor wie? Wie zijn de early adopters?", "tekst", 1],
      ["uwp", "Unieke waardepropositie", "Eén zin: waarom ben jij anders en de moeite waard?", "tekst", 2], ["oplossing", "Oplossing", "De kleinste versie per probleem", "tekst", 2],
      ["kanalen", "Kanalen", "Hoe bereik je je klanten?", "tekst", 3], ["inkomsten", "Inkomsten", "Prijs, verdienmodel, levenslange waarde", "tekst", 4],
      ["kosten", "Kosten", "Startkosten en vaste kosten per maand", "tekst", 4], ["cijfers", "Kerncijfers", "Welke 1–3 getallen laten zien dat het werkt?", "tekst"],
      ["voordeel", "Oneerlijk voordeel", "Wat kan niemand makkelijk kopiëren? Mag leeg.", "tekst", 5]] },
  { id: "sj.persona", naam: "Persona", emoji: "🧑", groep: "idee", map: "03", fasen: ["idee", "valideren"], les: "probleem", meer: true,
    oms: "Eén concrete klant: wie, welke situatie, wat wil en wat frustreert hem.",
    velden: [["naam", "Naam en typering", "Bv. Sanne, 34, freelance fotograaf", "regel"], ["situatie", "Situatie", "Werk, gezin, wanneer speelt het probleem?", "tekst", 1],
      ["doelen", "Doelen en klussen", "Wat probeert ze gedaan te krijgen?", "tekst"], ["pijn", "Frustraties", "Wat gaat mis, kost te veel of irriteert?", "tekst", 1],
      ["nu", "Wat doet ze nu?", "Huidige oplossing en wat die kost", "tekst", 1], ["kanalen", "Waar vind je haar?", "Online groepen, plekken, media", "tekst", 3],
      ["citaat", "Typisch citaat", "Iets wat ze letterlijk zou zeggen", "regel"]] },
  { id: "sj.interview", naam: "Klantgesprek (The Mom Test)", emoji: "💬", groep: "idee", map: "03", fasen: ["valideren"], les: "momtest", meer: true,
    oms: "Voorbereiding en verslag van één gesprek, met de vragen die wél iets opleveren.",
    velden: [["wie", "Met wie en wanneer", "Naam, rol, datum", "regel"], ["doel", "Wat wil ik leren?", "De aanname die je wilt checken", "regel"],
      ["vragen", "Mijn vragen", "Wanneer had je dit probleem voor het laatst?\nWat heb je al geprobeerd?\nWat kostte dat je?\nWie moet ik nog meer spreken?", "tekst"],
      ["feiten", "Wat ik hoorde (feiten)", "Gedrag en voorbeelden uit het verleden, geen meningen", "tekst"], ["toezegging", "Toezegging", "Tijd, geld, introductie? Of niets.", "regel"],
      ["volgende", "Volgende stap", "Wat doe ik hiermee?", "regel"]] },
  { id: "sj.aannames", naam: "Aannamekaart", emoji: "🎲", groep: "idee", map: "03", fasen: ["idee", "valideren"], les: "aannames",
    oms: "Zet je aannames op belang en bewijs. Rechtsboven test je eerst.",
    velden: [["lijst", "Aannames", "Elke regel één aanname; kies belang en bewijs", "matrix"]] },
  { id: "sj.vpc", naam: "Value Proposition Canvas", emoji: "💎", groep: "waarde", map: "02", fasen: ["valideren", "bouwen"], les: "waardepropositie", canvas: true,
    oms: "Koppel je aanbod aan de taken, pijnen en winsten van je klant.",
    velden: [["taken", "Klanttaken", "Wat probeert je klant gedaan te krijgen?", "tekst", 1], ["pijnen", "Pijnen", "Wat irriteert, kost te veel of gaat mis?", "tekst", 1],
      ["winsten", "Winsten", "Wat maakt je klant blij?", "tekst"], ["producten", "Producten en diensten", "Wat bied je aan?", "tekst", 2],
      ["verzachters", "Pijnverzachters", "Welke pijn neem je weg?", "tekst", 2], ["winstmakers", "Winstmakers", "Welke winst lever je?", "tekst"],
      ["belofte", "Belofte in één zin", "Wij helpen [klant] die [taak] met [aanbod], zodat [winst].", "regel"]] },
  { id: "sj.bmc", naam: "Business Model Canvas", emoji: "🏛️", groep: "waarde", map: "02", fasen: ["bouwen", "groeien"], les: "leancanvas", canvas: true,
    oms: "De negen bouwstenen van je bedrijfsmodel, als je verder bent dan het idee.",
    velden: [["partners", "Partners", "Wie heb je nodig?", "tekst"], ["activiteiten", "Kernactiviteiten", "Wat moet je goed doen?", "tekst"],
      ["middelen", "Kernmiddelen", "Wat heb je nodig: kennis, spullen, tijd?", "tekst", 5], ["waarde", "Waardepropositie", "Welke waarde lever je?", "tekst", 2],
      ["relaties", "Klantrelaties", "Persoonlijk, zelfbediening, community?", "tekst"], ["kanalen", "Kanalen", "Hoe bereik en bedien je klanten?", "tekst", 3],
      ["segmenten", "Klantsegmenten", "Voor wie?", "tekst", 1], ["kosten", "Kostenstructuur", "Grootste kosten", "tekst", 4], ["inkomsten", "Inkomstenstromen", "Waarvoor betalen klanten, en hoe?", "tekst", 4]] },
  { id: "sj.swot", naam: "SWOT-analyse", emoji: "🔲", groep: "waarde", map: "02", fasen: ["idee", "bouwen", "groeien"], les: "probleem", canvas: true,
    oms: "Sterktes en zwaktes van jezelf, kansen en bedreigingen van buiten.",
    velden: [["sterk", "Sterktes", "Wat kun je goed, wat heb je al?", "tekst", 5], ["zwak", "Zwaktes", "Wat ontbreekt, waar ben je kwetsbaar?", "tekst"],
      ["kansen", "Kansen", "Trends, gaten in de markt", "tekst", 3], ["bedreigingen", "Bedreigingen", "Concurrenten, regels, risico's", "tekst"]] },
  { id: "sj.concurrent", naam: "Concurrentieanalyse", emoji: "🥊", groep: "waarde", map: "02", fasen: ["idee", "valideren"], les: "probleem",
    oms: "Vergelijk de alternatieven van je klant op prijs, sterke en zwakke punten.",
    velden: [["tabel", "Alternatieven", "Ook 'niets doen' of Excel telt mee", "tabel", ["Naam", "Prijs", "Sterk", "Zwak"]], ["verschil", "Waarin ben jij anders?", "", "tekst", 2]] },
  { id: "sj.uurtarief", naam: "Uurtarief berekenen", emoji: "⏱️", groep: "geld", map: "04", fasen: ["bouwen"], les: "prijs", reken: "uurtarief", check: "s.tarief",
    oms: "Van gewenst inkomen naar een gezond uurtarief, met niet-declarabele uren erbij.",
    velden: [["netto", "Gewenst inkomen per jaar uit je side hustle", "Wat wil je netto overhouden?", "eur"], ["kosten", "Zakelijke kosten per jaar", "Software, verzekeringen, materiaal, reizen", "eur"],
      ["belasting", "Belasting en premies", "Reservering als % van je winst", "pct"], ["uren", "Uren per week voor je side hustle", "", "getal"],
      ["weken", "Werkweken per jaar", "Na vakantie en vrije weken", "getal"], ["declarabel", "Declarabel deel", "Welk % van je uren kun je factureren? Vaak 50–70%.", "pct"]] },
  { id: "sj.breakeven", naam: "Break-even", emoji: "⚖️", groep: "geld", map: "04", fasen: ["bouwen", "lanceren"], les: "prijs", reken: "breakeven",
    oms: "Hoeveel moet je verkopen om quitte te spelen, en wanneer verdien je je start terug?",
    velden: [["vast", "Vaste kosten per maand", "Abonnementen, hosting, verzekering", "eur"], ["prijs", "Prijs per verkoop (excl. btw)", "", "eur"],
      ["variabel", "Variabele kosten per verkoop", "Materiaal, verzending, platformkosten", "eur"], ["start", "Startinvestering", "Eenmalige kosten", "eur"],
      ["verwacht", "Verwachte verkopen per maand", "", "getal"]] },
  { id: "sj.pitch", naam: "Elevator pitch", emoji: "🎤", groep: "plan", map: "05", fasen: ["valideren", "lanceren"], les: "waardepropositie", reken: "pitch",
    oms: "In dertig seconden uitleggen wat je doet, voor wie en waarom het anders is.",
    velden: [["voor", "Voor", "Je doelgroep", "regel", 1], ["die", "Die", "Het probleem of de behoefte", "regel", 1], ["is", "Is", "Je product of dienst", "regel", 2],
      ["dat", "Dat", "Het belangrijkste voordeel", "regel", 2], ["anders", "Anders dan", "Het huidige alternatief", "regel", 3], ["wij", "Wij", "Wat je echt onderscheidt", "regel", 5]] },
  { id: "sj.kanalen", naam: "Kanalen kiezen (Bullseye)", emoji: "🎯", groep: "plan", map: "05", fasen: ["lanceren", "groeien"], les: "kanalen",
    oms: "Van veel ideeën naar drie tests en één kanaal waar je vol op inzet.",
    velden: [["buiten", "Buitenste ring: ideeën", "Per kanaal één idee: SEO, social, e-mail, communities, beurzen, partners, pers …", "tekst", 3],
      ["midden", "Middelste ring: zes kanshebbers", "", "tekst"], ["binnen", "Binnenste ring: drie tests", "Wat test je, met welk budget en welke meting?", "tabel", ["Kanaal", "Test", "Budget", "Resultaat"]],
      ["gekozen", "Gekozen kanaal", "Waar zet je vol op in, en waarom?", "regel"]] },
  { id: "sj.okr", naam: "Doelen per kwartaal (OKR)", emoji: "⭐", groep: "plan", map: "05", fasen: ["groeien", "lanceren"], les: "northstar",
    oms: "Eén kerncijfer en maximaal drie doelen met meetbare resultaten.",
    velden: [["kwartaal", "Kwartaal", "Bv. Q1 2027", "regel"], ["noordster", "North Star-metriek", "Het ene cijfer dat klantwaarde laat zien", "regel"],
      ["doel1", "Doel 1", "", "regel"], ["kr1", "Resultaten bij doel 1", "Twee of drie meetbare resultaten", "tekst"],
      ["doel2", "Doel 2", "", "regel"], ["kr2", "Resultaten bij doel 2", "", "tekst"], ["terug", "Terugblik", "Wat haalde je, en wat leer je ervan?", "tekst"]] }
];
const shModel = id => SH_MODELLEN.find(m => m.id === id);
const shModelVeldGevuld = (v, w) => v[3] === "tabel" ? Array.isArray(w) && w.some(r => r.some(x => String(x || "").trim()))
  : v[3] === "matrix" ? Array.isArray(w) && w.some(r => String(r.tekst || "").trim()) : w != null && String(w).trim() !== "";
function shModelVoortgang(b, h) {
  const m = shModel(b.sjabloonId); if (!m) return b.voortgang || 0;
  if (m.scope) return Math.round([1, 2, 3, 4, 5].filter(i => ((h.pijlers || {})[i] || {}).tekst).length / 5 * 100);
  const n = m.velden.length; if (!n) return 0;
  return Math.round(m.velden.filter(v => shModelVeldGevuld(v, (b.data || {})[v[0]])).length / n * 100);
}

/* Welk deel van een pijler past bij welk vak: "eerste" zin, of zinnen die op een patroon lijken. */
const SH_VOORAF_FILTER = {
  "sj.lean": { segment: "eerste", uwp: "eerste", kanalen: /kanaal|klanten|via|instagram|tiktok|google|linkedin|etsy|bol|facebook|reddit/i, inkomsten: /^(?!.*(kost|verlies)).*(prijs|€|abonnement|per stuk|per maand|verdien)/i, kosten: /kost/i, voordeel: /kan|ken|heb|ervaring|netwerk/i },
  "sj.bmc": { segmenten: "eerste", waarde: "eerste", kanalen: /kanaal|klanten|via|instagram|tiktok|google|linkedin|etsy|bol|facebook|reddit/i, inkomsten: /^(?!.*(kost|verlies)).*(prijs|€|abonnement|per stuk|per maand|verdien)/i, kosten: /kost/i, middelen: /kan|ken|heb|uur|netwerk/i },
  "sj.vpc": { taken: "eerste", producten: "eerste", verzachters: /omdat|sneller|goedkoper|beter|in plaats van/i, pijnen: /maar|geen|duur|lastig|verlie|kost|probleem|onoverzichtelijk/i },
  "sj.persona": { situatie: "eerste", pijn: /maar|geen|duur|lastig|verlie|probleem|onoverzichtelijk/i, nu: /nu |gebruik|kopen|excel|boekhouder/i, kanalen: /via|instagram|tiktok|linkedin|facebook|reddit|groep/i }
};
const SH_VOORAF_BRON = { weken: "voorstel", declarabel: "voorstel", kwartaal: "voorstel" };
const shZinnen = t => String(t || "").split(/(?<=[.!?])\s+|\n+/).map(x => x.trim()).filter(Boolean);
/** Vooraf invullen uit de pijlers en instellingen van de side hustle. */
function shVooraf(sjId, h) {
  const m = shModel(sjId), data = {}, vooraf = [];
  if (!m || !h) return { data, vooraf };
  const filters = SH_VOORAF_FILTER[sjId] || {};
  m.velden.forEach(([k, , , type, pijler]) => {
    if (typeof pijler !== "number" || type === "tabel" || type === "matrix") return;
    let t = ((h.pijlers || {})[pijler] || {}).tekst;
    if (!t) return;
    const f = filters[k];
    if (f === "eerste") t = shZinnen(t)[0] || t;
    else if (f instanceof RegExp) { const z = shZinnen(t).filter(x => f.test(x)); if (!z.length) return; t = z.join(" "); }
    if (type === "regel") t = shZinnen(t)[0].slice(0, 140);
    data[k] = t; vooraf.push(k);
  });
  if (sjId === "sj.middelen" && ((h.betaalbaarVerlies || {}).euro || (h.betaalbaarVerlies || {}).uren)) { data.verlies = `€ ${h.betaalbaarVerlies.euro || 0} en ${h.betaalbaarVerlies.uren || 0} uur`; vooraf.push("verlies"); }
  if (sjId === "sj.uurtarief") { Object.assign(data, { belasting: String(h.belastingPct || 30), uren: String(h.urenPerWeek || 6), weken: "44", declarabel: "60" }); vooraf.push("belasting", "uren", "weken", "declarabel"); }
  if (sjId === "sj.aannames" && h.aanname) { data.lijst = [{ tekst: h.aanname, belang: 3, bewijs: 1 }]; vooraf.push("lijst"); }
  if (sjId === "sj.okr") { const d = new Date(); data.kwartaal = `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`; }
  return { data, vooraf };
}

/* ---------- Openen of aanmaken ---------- */
const shModelBestanden = (h, sjId) => shVan("sh_bestanden", h.id).filter(b => b.soort === "sjabloon" && b.sjabloonId === sjId && !b.verwijderdOp)
  .sort((a, b) => (b.bijgewerkt || "") < (a.bijgewerkt || "") ? -1 : 1);
async function shModelMaak(h, sjId) {
  const m = shModel(sjId); if (!m) return null;
  const v = shVooraf(sjId, h), n = shModelBestanden(h, sjId).length;
  const mapId = V.shSjMap !== undefined && V.shSjMap !== null && V.shMapVan === h.id ? V.shSjMap : shStandaardMap(h, m.map);
  V.shSjMap = undefined;
  const b = shNieuwBestand(h, { soort: "sjabloon", sjabloonId: sjId, titel: m.naam + (n ? " " + (n + 1) : ""), data: v.data, vooraf: v.vooraf, mapId });
  b.voortgang = shModelVoortgang(b, h);
  await bewaar("sh_bestanden", b);
  await logGebeurtenis("sidehustle", `${h.naam}: model ${m.naam} gestart`, h.id, { shId: h.id });
  return b;
}
async function shModelOpen(h, sjId, nieuw) {
  const bestaand = shModelBestanden(h, sjId)[0];
  const b = !nieuw && bestaand ? bestaand : await shModelMaak(h, sjId);
  if (b) { bladSluit(); ga("shdoc", b.id); }
}

/* ---------- Tabblad ---------- */
function vwShModellen(h) {
  const ingevuld = shVan("sh_bestanden", h.id).filter(b => b.soort === "sjabloon" && !b.verwijderdOp)
    .sort((a, b) => (b.bijgewerkt || "") < (a.bijgewerkt || "") ? -1 : 1);
  let u = `<div class="card card-pad sh-mod-intro"><b>Modellen helpen je denken.</b>
    <div class="klein">Vul ze in wanneer ze passen bij je fase. Wat al in je pijlers staat, wordt vooraf ingevuld. Elk model wordt een bestand in ${esc(h.naam)}.</div></div>`;
  if (ingevuld.length) u += sectie("Ingevuld", ingevuld.length) + `<div class="card">${ingevuld.map(b => {
    const m = shModel(b.sjabloonId) || { emoji: "🧩", naam: b.titel };
    const pct = shModelVoortgang(b, h);
    return `<button class="rijknop" data-sh="bs-open" data-id="${b.id}"><span class="sh-th-em">${m.emoji}</span>
      <span class="nm"><b>${esc(b.titel)}</b><span class="klein" style="display:block">${SH_BSTATUS[b.status] || ""} · ${esc(datumLabel((b.bijgewerkt || b.gemaakt).slice(0, 10)))}</span></span>
      <span class="rechts">${shVoortgangRing(pct)}<span class="klein">${pct}%</span></span></button>`;
  }).join("")}</div>`;
  SH_MODEL_GROEPEN.forEach(([g, naam, em]) => {
    const r = SH_MODELLEN.filter(m => m.groep === g);
    u += sectie(em + " " + naam) + `<div class="sh-mod-raster">${r.map(m => {
      const heb = shModelBestanden(h, m.id), pct = heb[0] ? shModelVoortgang(heb[0], h) : null, nu = m.fasen.includes(h.fase);
      return `<div class="sh-mod-kaart${nu ? " nu" : ""}">
        <button class="sh-mod-hoofd" data-sh="mod-open" data-sj="${m.id}"><span class="em">${m.emoji}</span><b>${esc(m.naam)}</b>
          <span class="klein">${esc(m.oms)}</span>
          <span class="sh-mod-voet">${pct != null ? `${shVoortgangRing(pct)} ${pct}% ingevuld` : nu ? "Past bij je fase" : m.fasen.map(shFaseNaam).join(" · ")}</span></button>
        ${m.meer && heb.length ? `<button class="sh-mod-plus" data-sh="mod-nieuw" data-sj="${m.id}" aria-label="Nog een ${esc(m.naam)}">${ico("plus")}</button>` : ""}
      </div>`;
    }).join("")}</div>`;
  });
  return u;
}

/* ---------- Invullen (bestand openen) ---------- */
const shGetal = w => { const n = csvGetal(String(w == null ? "" : w)); return isFinite(n) ? n : 0; };
function shModelReken(m, d) {
  if (m.reken === "uurtarief") {
    const netto = shGetal(d.netto), kosten = shGetal(d.kosten), bel = Math.min(90, shGetal(d.belasting)) / 100;
    const uren = shGetal(d.uren) * shGetal(d.weken) * (shGetal(d.declarabel) / 100);
    if (!netto || !uren) return `<p class="klein">Vul je gewenste inkomen, uren, weken en declarabel deel in.</p>`;
    const winst = netto / (1 - bel), omzet = winst + kosten, tarief = omzet / uren;
    return `<div class="sh-mod-uitkomst"><span class="klein">Minimaal uurtarief (excl. btw)</span><b>${eur(tarief)}</b></div>
      <div class="sh-mod-som"><span>Winst vóór belasting</span><b>${eur(winst)}</b><span>Benodigde omzet per jaar</span><b>${eur(omzet)}</b>
        <span>Declarabele uren per jaar</span><b>${Math.round(uren)}</b><span>Per maand factureren</span><b>${eur(omzet / 12)}</b></div>
      ${tarief < 50 ? `<p class="klein">Onder € 50 per uur is voor een zzp'er zelden gezond. Check je aannames of je verdienmodel.</p>` : ""}`;
  }
  if (m.reken === "breakeven") {
    const vast = shGetal(d.vast), prijs = shGetal(d.prijs), varb = shGetal(d.variabel), start = shGetal(d.start), verw = shGetal(d.verwacht);
    const marge = prijs - varb;
    if (!prijs) return `<p class="klein">Vul minstens je prijs en kosten in.</p>`;
    if (marge <= 0) return `<div class="banner rood">${ico("let")}<span><b>Je verliest op elke verkoop</b>De variabele kosten zijn hoger dan je prijs.</span></div>`;
    const be = Math.ceil(vast / marge), winst = verw ? verw * marge - vast : null;
    const maanden = winst && winst > 0 && start ? Math.ceil(start / winst) : null;
    // grafiekje: winst per maand bij 0 … 2× break-even verkopen
    const max = Math.max(be * 2, verw || 0, 4), W = 280, H = 110, x = n => 20 + n / max * (W - 30), y = v => H / 2 - v / Math.max(vast, max * marge - vast, 1) * (H / 2 - 10);
    return `<div class="sh-mod-uitkomst"><span class="klein">Break-even per maand</span><b>${be} verkopen</b></div>
      <div class="sh-mod-som"><span>Marge per verkoop</span><b>${eur(marge)}</b>${winst != null ? `<span>Resultaat bij ${verw} per maand</span><b style="color:${winst >= 0 ? "var(--green)" : "var(--red)"}">${eur(winst)}</b>` : ""}
        ${maanden ? `<span>Startinvestering terugverdiend in</span><b>${maanden} maand${maanden === 1 ? "" : "en"}</b>` : ""}</div>
      <svg class="sh-mod-grafiek" viewBox="0 0 ${W} ${H}" role="img" aria-label="Resultaat per maand tegen aantal verkopen">
        <line x1="20" x2="${W - 10}" y1="${y(0)}" y2="${y(0)}" style="stroke:var(--line2)"/>
        <polyline points="${x(0)},${y(-vast)} ${x(max)},${y(max * marge - vast)}" style="fill:none;stroke:var(--sh);stroke-width:2.5;stroke-linecap:round"/>
        <circle cx="${x(be)}" cy="${y(0)}" r="4.5" style="fill:var(--green)"/><text x="${x(be)}" y="${y(0) - 9}" text-anchor="middle" style="fill:var(--muted);font-size:10px">${be}</text>
        ${verw ? `<circle cx="${x(verw)}" cy="${y(verw * marge - vast)}" r="4" style="fill:var(--sh)"/>` : ""}
      </svg>`;
  }
  if (m.reken === "pitch") {
    const s = k => String(d[k] || "").trim();
    if (!s("voor") && !s("is")) return `<p class="klein">Vul de regels in; je pitch verschijnt hier.</p>`;
    return `<div class="card card-pad sh-mod-pitch">“Voor <b>${esc(s("voor") || "…")}</b> die <b>${esc(s("die") || "…")}</b>, is <b>${esc(s("is") || "…")}</b> een oplossing die <b>${esc(s("dat") || "…")}</b>. Anders dan <b>${esc(s("anders") || "…")}</b>, <b>${esc(s("wij") || "…")}</b>.”</div>`;
  }
  return "";
}
function shModelVeld(m, b, v) {
  const [k, label, hint, type, extra] = v, w = (b.data || {})[k];
  const uit = (b.vooraf || []).includes(k) ? `<span class="sh-mod-vooraf">${typeof extra === "number" ? "uit pijler " + extra : SH_VOORAF_BRON[k] === "voorstel" ? "voorstel" : "uit je instellingen"}</span>` : "";
  const kop = `<label class="labeltekst" for="shm-${k}">${esc(label)}${uit}</label>`;
  if (type === "tabel") {
    const cols = extra, rijen = Array.isArray(w) && w.length ? w : [cols.map(() => "")];
    return `<div class="veld">${kop}${hint ? `<div class="klein" style="margin:-2px 0 6px">${esc(hint)}</div>` : ""}
      <div class="sh-mod-tabel" style="--kol:${cols.length}" data-shm-tabel="${k}">${cols.map(c => `<span class="kop">${esc(c)}</span>`).join("")}
      ${rijen.map((r, ri) => cols.map((c, ci) => `<input class="invoer" data-shm-cel="${k}" data-r="${ri}" data-c="${ci}" value="${esc(r[ci] || "")}" aria-label="${esc(c)} rij ${ri + 1}">`).join("")).join("")}</div>
      <button class="knop klein rand" data-sh="mod-rij" data-k="${k}" style="margin-top:6px">+ Rij</button></div>`;
  }
  if (type === "matrix") {
    const rijen = Array.isArray(w) ? w : [];
    const niv = ["", "laag", "middel", "hoog"];
    return `<div class="veld">${kop}<div class="klein" style="margin:-2px 0 6px">${esc(hint)}</div>
      ${rijen.map((r, ri) => `<div class="sh-mod-aanname">
        <input class="invoer" data-shm-mx="${k}" data-r="${ri}" value="${esc(r.tekst || "")}" placeholder="Wij geloven dat …">
        <div class="sh-mod-schaal"><span class="klein">Belang</span>${[1, 2, 3].map(n => `<button data-sh="mod-mx" data-k="${k}" data-r="${ri}" data-as="belang" data-n="${n}" aria-pressed="${(r.belang || 2) === n}">${niv[n]}</button>`).join("")}</div>
        <div class="sh-mod-schaal"><span class="klein">Bewijs</span>${[1, 2, 3].map(n => `<button data-sh="mod-mx" data-k="${k}" data-r="${ri}" data-as="bewijs" data-n="${n}" aria-pressed="${(r.bewijs || 1) === n}">${niv[n]}</button>`).join("")}</div>
      </div>`).join("")}
      <button class="knop klein rand" data-sh="mod-rij" data-k="${k}">+ Aanname</button>
      ${shModelMatrix(rijen)}</div>`;
  }
  const inv = type === "tekst"
    ? `<textarea class="invoer" id="shm-${k}" data-shm="${k}" placeholder="${esc(hint)}" style="min-height:${hint && hint.includes("\n") ? 110 : 78}px">${esc(w || "")}</textarea>`
    : `<input class="invoer" id="shm-${k}" data-shm="${k}" ${type === "regel" ? "" : 'inputmode="decimal"'} placeholder="${esc(type === "eur" ? "€ 0" : type === "pct" ? "%" : hint)}" value="${esc(w || "")}">`;
  return `<div class="veld">${kop}${inv}${type !== "tekst" && type !== "regel" && hint ? `<div class="klein" style="margin-top:4px">${esc(hint)}</div>` : ""}</div>`;
}
function shModelMatrix(rijen) {
  const r = rijen.filter(x => String(x.tekst || "").trim());
  if (!r.length) return "";
  const eerst = r.filter(x => (x.belang || 2) === 3 && (x.bewijs || 1) === 1);
  const W = 260, H = 160, px = n => 30 + (n - 1) / 2 * (W - 60), py = n => H - 25 - (n - 1) / 2 * (H - 50);
  return `<svg class="sh-mod-grafiek" viewBox="0 0 ${W} ${H}" role="img" aria-label="Aannames op belang en bewijs">
      <rect x="${W / 2}" y="5" width="${W / 2 - 5}" height="${H / 2 - 10}" rx="8" style="fill:var(--red-soft)"/>
      <text x="${W - 12}" y="18" text-anchor="end" style="fill:var(--red);font-size:10px;font-weight:700">eerst testen</text>
      <text x="${W / 2}" y="${H - 5}" text-anchor="middle" style="fill:var(--muted);font-size:10px">minder bewijs →</text>
      <text x="10" y="${H / 2}" transform="rotate(-90 10 ${H / 2})" text-anchor="middle" style="fill:var(--muted);font-size:10px">belangrijker →</text>
      ${r.map((x, i) => `<circle cx="${px(4 - (x.bewijs || 1)) + (i % 3 - 1) * 9}" cy="${py(x.belang || 2) + (i % 2) * 8}" r="7" style="fill:var(--sh);fill-opacity:.75"><title>${esc(x.tekst)}</title></circle>`).join("")}
    </svg>${eerst.length ? `<div class="banner rood" style="margin-top:8px">${ico("bliksem")}<span><b>Test eerst</b>${eerst.map(x => esc(x.tekst)).join("<br>")}</span></div>` : ""}`;
}
function vwShSjabloon(b, h) {
  const m = shModel(b.sjabloonId);
  if (!m) return `<div class="card">${leeg("🧩", "Onbekend model", b.sjabloonId || "")}</div>`;
  const pct = shModelVoortgang(b, h), weergave = V.shModWeergave === b.id && m.canvas ? "canvas" : "invullen";
  let u = `<div class="sh-mod-kop"><span class="em">${m.emoji}</span><div style="flex:1;min-width:0"><b>${esc(m.naam)}</b><div class="klein">${esc(m.oms)}</div></div>${shVoortgangRing(pct)}</div>
    <div class="knoprij" style="margin:8px 0">
      ${m.les ? `<button class="knop klein rand" data-sh="th-open" data-les="${m.les}" data-id="${h.id}">${ico("boek")} Les</button>` : ""}
      ${m.canvas ? `<span class="segment" style="flex:1"><button data-sh="mod-weergave" data-id="${b.id}" data-w="invullen" aria-pressed="${weergave === "invullen"}">Invullen</button><button data-sh="mod-weergave" data-id="${b.id}" data-w="canvas" aria-pressed="${weergave === "canvas"}">Overzicht</button></span>` : ""}
      <button class="knop klein rand" data-sh="bs-print" data-id="${b.id}">${ico("download")} PDF</button></div>`;
  if (m.check) {
    const c = shVan("sh_checks", h.id).find(x => x.sleutel === m.check && (x.status === "open" || x.status === "bezig"));
    if (c && pct === 100) u += `<div class="banner blauw">${ico("check")}<span><b>Klaar met rekenen?</b>“${esc(shCheckTitel(c))}” staat nog open op je checklist.</span><button class="knop klein primair" data-sh="mod-check" data-c="${c.id}">Afvinken</button></div>`;
  }
  if (m.scope) {
    u += SH_PIJLERS.map(p => {
      const w = (h.pijlers || {})[p.nr] || {};
      return `<div class="veld"><label class="labeltekst" for="shm-p${p.nr}">${p.nr}. ${esc(p.titel)}</label>
        <div class="klein" style="margin:-2px 0 6px">${esc(p.vraag)}</div>
        <textarea class="invoer" id="shm-p${p.nr}" data-shm-pijler="${p.nr}" style="min-height:90px" placeholder="${esc(p.voorbeeld)}">${esc(w.tekst || "")}</textarea>
        <div class="sh-mod-kwal" data-kwal="${p.nr}">${shKwalRing(shKwaliteit(p.nr, w.tekst), false)}</div></div>`;
    }).join("");
  } else if (weergave === "canvas") {
    u += `<div class="sh-mod-canvas ${m.id.replace(".", "-")}">${m.velden.map(([k, label]) => `<button class="sh-mod-vak" data-sh="mod-weergave" data-id="${b.id}" data-w="invullen" data-k="${k}">
        <b>${esc(label)}</b><span>${shMd(String((b.data || {})[k] || "")) || '<span class="klein">Nog leeg</span>'}</span></button>`).join("")}</div>`;
  } else u += m.velden.map(v => shModelVeld(m, b, v)).join("");
  if (m.reken) u += `<div class="sh-mod-reken" id="shm-reken">${shModelReken(m, b.data || {})}</div>`;
  u += `<div class="sh-bewaard klein" id="shm-bewaard" aria-live="polite">${(b.versies || []).length ? `${b.versies.length} eerdere versie${b.versies.length === 1 ? "" : "s"} bewaard` : ""}</div>
    <div class="knoprij" style="margin-top:10px">
      <button class="knop rand klein" data-sh="mod-versie" data-id="${b.id}">${ico("kopieer")} Versie bewaren</button>
      ${(b.versies || []).length ? `<button class="knop rand klein" data-sh="mod-versies" data-id="${b.id}">${ico("herhaal")} Eerdere versies</button>` : ""}
      ${m.meer ? `<button class="knop rand klein" data-sh="mod-nieuw" data-sj="${m.id}">${ico("plus")} Nog een</button>` : ""}</div>`;
  return u;
}
async function shModelBewaar(b, h, stil) {
  const m = shModel(b.sjabloonId);
  b.voortgang = shModelVoortgang(b, h);
  if (b.status === "concept" && b.voortgang > 0) b.status = "actief";
  b.bijgewerkt = shNu();
  await bewaar("sh_bestanden", b);
  const s = $("#shm-bewaard"); if (s && !stil) s.textContent = "Bewaard · " + b.voortgang + "% ingevuld";
  const ring = $(".sh-mod-kop .sh-miniring"); if (ring) ring.style.setProperty("--p", b.voortgang);
  const r = $("#shm-reken"); if (r && m && m.reken) r.innerHTML = shModelReken(m, b.data || {});
}
SH_NA.push(() => {
  if (V.view !== "shdoc") return;
  const b = vind("sh_bestanden", V.param); if (!b || b.soort !== "sjabloon") return;
  const h = shH(b.shId); if (!h) return;
  const plan = (fn, direct) => { const s = $("#shm-bewaard"); if (s) s.textContent = "Bewaren…"; clearTimeout(b._t); b._t = setTimeout(fn, direct ? 0 : 600); };
  $$("[data-shm]").forEach(el => el.oninput = () => {
    b.data = b.data || {}; b.data[el.dataset.shm] = el.value;
    b.vooraf = (b.vooraf || []).filter(k => k !== el.dataset.shm);
    const m = shModel(b.sjabloonId);
    if (m && m.reken) { const r = $("#shm-reken"); if (r) r.innerHTML = shModelReken(m, b.data); }
    plan(() => shModelBewaar(b, h));
  });
  $$("[data-shm-cel]").forEach(el => el.oninput = () => {
    const k = el.dataset.shmCel, t = (b.data[k] = Array.isArray(b.data[k]) ? b.data[k] : []);
    const cols = (shModel(b.sjabloonId).velden.find(v => v[0] === k) || [])[4] || [];
    while (t.length <= +el.dataset.r) t.push(cols.map(() => ""));
    t[+el.dataset.r][+el.dataset.c] = el.value;
    plan(() => shModelBewaar(b, h));
  });
  $$("[data-shm-mx]").forEach(el => el.oninput = () => {
    const k = el.dataset.shmMx, t = (b.data[k] = Array.isArray(b.data[k]) ? b.data[k] : []);
    t[+el.dataset.r].tekst = el.value;
    plan(() => shModelBewaar(b, h));
  });
  $$("[data-shm-pijler]").forEach(el => el.oninput = () => {
    const nr = +el.dataset.shmPijler, p = h.pijlers[nr] || (h.pijlers[nr] = {});
    p.tekst = el.value; p.kwaliteit = shKwaliteit(nr, el.value); p.overgeslagen = !el.value.trim(); p.bijgewerkt = shNu();
    const kw = $(`[data-kwal="${nr}"]`); if (kw) kw.innerHTML = shKwalRing(p.kwaliteit, false);
    plan(async () => { h.bijgewerkt = shNu(); await bewaar("sh_hustles", h); await shModelBewaar(b, h); });
  });
});

/* ---------- Afdrukken / PDF ---------- */
function shPrint(ids) {
  const delen = ids.map(id => vind("sh_bestanden", id)).filter(Boolean).map(b => {
    const h = shH(b.shId), m = b.soort === "sjabloon" ? shModel(b.sjabloonId) : null;
    let inh = "";
    if (m && m.scope) inh = SH_PIJLERS.map(p => `<h3>${p.nr}. ${esc(p.titel)}</h3>${shMd(((h.pijlers || {})[p.nr] || {}).tekst || "—")}`).join("");
    else if (m) inh = m.velden.map(([k, label, , type, extra]) => {
      const w = (b.data || {})[k];
      if (type === "tabel") return `<h3>${esc(label)}</h3><table><tr>${extra.map(c => `<th>${esc(c)}</th>`).join("")}</tr>${(w || []).map(r => `<tr>${extra.map((c, i) => `<td>${esc(r[i] || "")}</td>`).join("")}</tr>`).join("")}</table>`;
      if (type === "matrix") return `<h3>${esc(label)}</h3><ul>${(w || []).map(r => `<li>${esc(r.tekst)} — belang ${r.belang || 2}, bewijs ${r.bewijs || 1}</li>`).join("")}</ul>`;
      return `<h3>${esc(label)}</h3>${shMd(String(w || "—"))}`;
    }).join("") + (m.reken ? `<div>${shModelReken(m, b.data || {})}</div>` : "");
    else inh = shMd((b.data || {}).md || "");
    return `<section><h1>${esc(b.titel)}</h1><p class="meta">${h ? esc(h.emoji + " " + h.naam) + " · " : ""}${esc(datumLabel((b.bijgewerkt || b.gemaakt).slice(0, 10), true))}</p>${inh}</section>`;
  });
  if (!delen.length) return;
  let doos = $("#sh-print"); if (doos) doos.remove();
  doos = document.createElement("div"); doos.id = "sh-print"; doos.innerHTML = delen.join("");
  document.body.appendChild(doos);
  document.documentElement.classList.add("sh-printen");
  const klaar = () => { document.documentElement.classList.remove("sh-printen"); const d = $("#sh-print"); if (d) d.remove(); window.removeEventListener("afterprint", klaar); };
  window.addEventListener("afterprint", klaar);
  setTimeout(() => { try { window.print(); } catch (e) { toast("Afdrukken lukt niet op dit toestel"); } setTimeout(klaar, 1500); }, 60);
}

/* ---------- Acties ---------- */
Object.assign(SH_ACT, {
  "mod-open": async el => { const h = shH(V.param); if (h) await shModelOpen(h, el.dataset.sj); },
  "mod-nieuw": async el => { const b0 = V.view === "shdoc" ? vind("sh_bestanden", V.param) : null; const h = shH(b0 ? b0.shId : V.param); if (h) await shModelOpen(h, el.dataset.sj, true); },
  "mod-weergave": el => {
    V.shModWeergave = el.dataset.w === "canvas" ? el.dataset.id : null; teken();
    if (el.dataset.k) setTimeout(() => { const f = $("#shm-" + el.dataset.k); if (f) { f.scrollIntoView({ block: "center" }); f.focus(); } }, 80);
  },
  "mod-rij": async el => {
    const b = vind("sh_bestanden", V.param), h = b && shH(b.shId); if (!b) return;
    const v = shModel(b.sjabloonId).velden.find(x => x[0] === el.dataset.k);
    const t = (b.data[v[0]] = Array.isArray(b.data[v[0]]) ? b.data[v[0]] : []);
    if (v[3] === "matrix") t.push({ tekst: "", belang: 2, bewijs: 1 });
    else { if (!t.length) t.push(v[4].map(() => "")); t.push(v[4].map(() => "")); }
    await shModelBewaar(b, h, true); teken();
  },
  "mod-mx": async el => {
    const b = vind("sh_bestanden", V.param), h = b && shH(b.shId); if (!b) return;
    b.data[el.dataset.k][+el.dataset.r][el.dataset.as] = +el.dataset.n;
    await shModelBewaar(b, h, true); teken();
  },
  "mod-versie": async el => {
    const b = vind("sh_bestanden", el.dataset.id); if (!b) return;
    (b.versies || (b.versies = [])).push({ ts: shNu(), data: JSON.parse(JSON.stringify(b.data || {})), voortgang: b.voortgang });
    if (b.versies.length > 20) b.versies.shift();
    await bewaar("sh_bestanden", b); teken(); toast("Versie bewaard");
  },
  "mod-versies": el => {
    const b = vind("sh_bestanden", el.dataset.id); if (!b) return;
    bladOpen("Eerdere versies", `<div class="card">${(b.versies || []).map((v, i) => ({ v, i })).reverse().map(({ v, i }) => `<button class="rijknop" data-sh="mod-terug" data-id="${b.id}" data-i="${i}">
      ${ico("herhaal", "width:19px;height:19px;color:var(--muted)")}<span class="nm">${esc(datumLabel(v.ts.slice(0, 10), true))} ${esc(v.ts.slice(11, 16))}<span class="klein" style="display:block">${v.voortgang || 0}% ingevuld · tik om terug te zetten</span></span></button>`).join("")}</div>`);
  },
  "mod-terug": async el => {
    const b = vind("sh_bestanden", el.dataset.id), v = b && b.versies[+el.dataset.i]; if (!v) return;
    b.versies.push({ ts: shNu(), data: JSON.parse(JSON.stringify(b.data || {})), voortgang: b.voortgang });
    b.data = JSON.parse(JSON.stringify(v.data)); b.vooraf = [];
    bladSluit(); await shModelBewaar(b, shH(b.shId), true); teken(); toast("Versie teruggezet · de huidige is als versie bewaard");
  },
  "mod-check": async el => { const c = vind("sh_checks", el.dataset.c); if (!c) return; await shCheckZetStatus(c, "klaar"); tril(10); teken(); toast("Afgevinkt op je checklist"); }
});
