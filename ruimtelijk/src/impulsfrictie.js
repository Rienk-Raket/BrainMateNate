"use strict";
// === SECTIE 100: IMPULSFRICTIE, PATROONLOGGER EN UITGLIJDER (V11) ===
/* ==========================================================================
   Conceptvoorstel V11 (categorie 7: gewoontes afleren).
   - Wishlist: binnen de afkoeltijd (uit Mijn aanpak, bij aankopen boven € 50)
     vraagt "Gekocht" eerst even: wachten, niet kopen, of toch kopen.
   - Patroonlogger bij Rookvrij en Gewoontes: trigger, gedrag, opbrengst. Na
     een paar keer laat Nate zien welk moment het vaakst terugkomt en wat
     hetzelfde kan opleveren (functioneel vervangingsgedrag).
   - Uitglijder bij Rookvrij, naast "Opnieuw beginnen": de teller loopt door.
     Eén gemiste keer maakt een gewoonte niet kapot.
   - Klinkt een notitie naar controleverlies, gokken of gevaar, dan verwijst
     Nate naar de huisarts en bij acuut gevaar naar 113 (zoals de chat).

   De kern (NATE-FRICTIE-BEGIN/EINDE) is puur en wordt getest in tests/frictie-werkwoord.test.mjs.
   ========================================================================== */

/* NATE-FRICTIE-BEGIN */
const PL_TRIGGERS = ["Stress", "Verveling", "Na het eten", "Koffie", "Moe", "Alleen", "Met anderen", "Telefoon of scherm", "Onderweg"];
const PL_OPBRENGST = [
  { id: "rust", naam: "Rust", anders: "Eén minuut landen in Anker." },
  { id: "afleiding", naam: "Afleiding", anders: "Even naar buiten of één nummer muziek." },
  { id: "beloning", naam: "Beloning", anders: "Een kleine beloning die je vooraf kiest." },
  { id: "gezelschap", naam: "Gezelschap", anders: "Iemand een berichtje sturen." },
  { id: "energie", naam: "Energie", anders: "Een glas water en even bewegen." },
  { id: "spanning", naam: "Minder spanning", anders: "Lang uitademen, drie keer." }
];

/** Nog aan het afkoelen? Alleen boven de drempel, en tot gemaakt + uren. Geeft resterende uren of 0. */
function plAfkoelen(item, uren, nu, drempel) {
  if (!item || !(+item.prijs > (drempel == null ? 50 : drempel)) || !item.gemaakt || !(uren > 0)) return 0;
  const rest = (Date.parse(item.gemaakt) + uren * 3600e3 - nu) / 3600e3;
  return rest > 0 ? Math.ceil(rest) : 0;
}
/** Patronen: welke triggers en opbrengsten komen het vaakst terug (minstens 3 momenten nodig). */
function plPatronen(log, waar) {
  const l = (log || []).filter(r => r.waar === waar);
  if (l.length < 3) return { n: l.length, triggers: [], opbrengst: [] };
  const tel = sleutel => Object.entries(l.reduce((a, r) => { for (const x of [].concat(r[sleutel] || [])) a[x] = (a[x] || 0) + 1; return a; }, {}))
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, 3).map(([naam, aantal]) => ({ naam, aantal }));
  return { n: l.length, triggers: tel("trigger"), opbrengst: tel("opbrengst") };
}
/* Signalen van controleverlies of schade (naast de noodwoorden van de chat). */
const PL_NOOD = ["gokken", "gok", "gokte", "casino", "kon niet stoppen", "niet meer stoppen", "controle kwijt", "geen controle", "verslaafd", "verslaving", "schulden", "mezelf pijn"];
function plNood(tekst) { const t = " " + String(tekst || "").toLowerCase() + " "; return PL_NOOD.some(w => t.includes(w)); }
/** Uitglijders tellen, zonder de teller te raken. */
function plUitglijders(log, waar) { return (log || []).filter(r => r.waar === waar && r.soort === "uitglijder").length; }
/* NATE-FRICTIE-EINDE */

const plLog = () => inst("plLog", []) || [];

/* ---------- 100.1 Wishlist: eerst afkoelen ---------- */
{
  const _zet = wlZet;
  wlZet = async function (id, status) {
    const x = vind("wl_items", id), uren = (typeof ndAanpak === "function" ? ndAanpak().afkoelUur : 24) || 24;
    const rest = status === "gekocht" && x && (x.status || "actief") === "actief" ? plAfkoelen(x, uren, Date.now()) : 0;
    if (!rest || V.plToch === id) { V.plToch = null; return _zet.apply(this, arguments); }
    bladOpen("Even afkoelen", `<p class="pl-zin">Nog ongeveer ${rest} ${rest === 1 ? "uur" : "uur"} afkoelen voor <b>${esc(x.naam)}</b>. Wil je het dan nog steeds, dan is het een goede koop.</p>
      <details class="iv-waarom"><summary>Waarom zeg je dit?</summary><p>Een korte wachttijd tussen zin en kopen maakt een impulsaankoop kleiner, zonder het te verbieden. Praktisch: laag risico, kijk of het bij jou werkt.</p></details>`,
      `<button class="knop breed primair" id="pl-wacht">Ik wacht nog even</button><button class="knop breed rand" id="pl-niet">Toch niet kopen</button><button class="knop breed rand" id="pl-toch">Ik koop het nu</button>`);
    $("#pl-wacht").onclick = () => { bladSluit(); toast(`Staat nog op je lijst.`); };
    $("#pl-niet").onclick = () => { bladSluit(); _zet.call(this, id, "niet"); };
    $("#pl-toch").onclick = () => { bladSluit(); V.plToch = id; wlZet(id, "gekocht"); };
  };
}

/* ---------- 100.2 Patroonlogger ---------- */
function plBlad(waar, soort, naam) {
  const st = { trigger: [], opbrengst: [] };
  bladOpen(soort === "uitglijder" ? "Uitglijder" : "Moment vastleggen", `
    ${soort === "uitglijder" ? `<p class="pl-zin">Eén keer is één keer. De teller loopt door, en dit moment helpt je het patroon te zien.</p>` : `<p class="klein">Wat gebeurde er rond ${esc(naam)}? Kort is genoeg.</p>`}
    <h3 class="hs-stap"><span>1</span> Wat ging eraan vooraf?</h3>
    <div class="pl-chips" data-pl-groep="trigger">${PL_TRIGGERS.map(t => `<button type="button" class="keuze" data-pl="${esc(t)}" aria-pressed="false">${esc(t)}</button>`).join("")}</div>
    <h3 class="hs-stap"><span>2</span> Wat deed je?</h3>
    <label class="sr-only" for="pl-gedrag">Wat deed je?</label><input class="invoer" id="pl-gedrag" maxlength="120" autocomplete="off" placeholder="${soort === "uitglijder" ? "Bijvoorbeeld: één sigaret bij de koffie" : "Bijvoorbeeld: trek, maar niet gedaan"}">
    <h3 class="hs-stap"><span>3</span> Wat leverde het op?</h3>
    <div class="pl-chips" data-pl-groep="opbrengst">${PL_OPBRENGST.map(o => `<button type="button" class="keuze" data-pl="${o.id}" aria-pressed="false">${esc(o.naam)}</button>`).join("")}</div>
    <div id="pl-hulp" aria-live="polite"></div>`,
    `<button class="knop breed primair" id="pl-op">Bewaren</button>`);
  $("#bladinhoud").addEventListener("click", e => {
    const b = e.target.closest("[data-pl]"); if (!b) return;
    const g = b.closest("[data-pl-groep]").dataset.plGroep, w = b.dataset.pl, aan = b.getAttribute("aria-pressed") !== "true";
    b.setAttribute("aria-pressed", String(aan));
    st[g] = aan ? st[g].concat(w) : st[g].filter(x => x !== w);
  });
  // Klinkt het naar gevaar of controleverlies? Dan eerst de verwijzing, tijdens het typen.
  const nood = () => { const v = $("#pl-gedrag").value, r = typeof ncBegrijp === "function" ? ncBegrijp(v, NATE_INTENTIES) : null; return plNood(v) || (r && r.uitkomst === "nood"); };
  const toonHulp = () => { $("#pl-hulp").innerHTML = nood() ? `<p class="kn-hulp">${esc(NATE_INTENTIES.nood.antwoord)}</p><div class="pl-knoppen"><a class="knop primair" href="tel:08000113">Bel 113</a><a class="knop rand" href="tel:112">Bel 112</a></div>` : ""; };
  $("#pl-gedrag").addEventListener("input", toonHulp);
  let hulpGezien = false;
  $("#pl-op").onclick = async () => {
    // Eerste keer met zo'n signaal: blad blijft open, zodat je de verwijzing echt ziet.
    if (nood() && !hulpGezien) { toonHulp(); hulpGezien = true; $("#pl-hulp").scrollIntoView({ block: "center" }); $("#pl-op").textContent = "Toch bewaren"; return; }
    await zetInst("plLog", plLog().concat({ id: uid(), ts: new Date().toISOString(), waar, soort, trigger: st.trigger, opbrengst: st.opbrengst, gedrag: $("#pl-gedrag").value.trim() }).slice(-500));
    if (soort === "uitglijder") await logGebeurtenis("notitie", `Uitglijder bij ${naam}; de teller loopt door`).catch(() => {});
    bladSluit(); teken(); toast(soort === "uitglijder" ? "Genoteerd. De teller loopt gewoon door." : "Moment bewaard.");
  };
}
function plSamenvattingHTML(waar) {
  const p = plPatronen(plLog(), waar), uit = plUitglijders(plLog(), waar);
  let h = "";
  if (p.n < 3) h += `<p class="klein">${p.n ? `${p.n} van de 3 momenten vastgelegd. Daarna zie je je patroon.` : "Leg een paar momenten vast, dan zie je wanneer het vaak gebeurt."}</p>`;
  else {
    const top = PL_OPBRENGST.find(o => p.opbrengst[0] && o.id === p.opbrengst[0].naam);
    h += `<p>${p.triggers.length ? `Vaakst: <b>${esc(p.triggers.map(t => t.naam.toLowerCase()).join(", "))}</b>.` : ""} ${top ? `Het levert vooral <b>${esc(top.naam.toLowerCase())}</b> op.` : ""}</p>`;
    if (top) h += `<p class="pl-anders">Dat kan ook anders: ${esc(top.anders)}</p>`;
    h += `<details class="iv-waarom"><summary>Waarom zeg je dit?</summary><p>Iets afleren lukt beter als je weet wat het je oplevert en daar iets anders voor in de plaats zet. Praktisch: een experiment, kijk wat bij jou past.</p></details>`;
  }
  if (uit) h += `<p class="klein">${uit} ${uit === 1 ? "uitglijder" : "uitglijders"} genoteerd. De teller liep door.</p>`;
  return h;
}

/* ---------- 100.3 Rookvrij en Gewoontes ---------- */
{
  const _rook = vwRoken;
  vwRoken = function () {
    const h = _rook.apply(this, arguments);
    if (!inst("rookStop", null)) return h;
    const blok = `<section class="card card-pad pl-kaart" aria-label="Patroon"><span class="labeltekst">Je patroon</span>${plSamenvattingHTML("roken")}
      <div class="pl-knoppen"><button class="knop rand" data-pl-open="roken" data-pl-soort="trek">Moment vastleggen</button><button class="knop rand" data-pl-open="roken" data-pl-soort="uitglijder">Uitglijder</button></div></section>`;
    // Vóór "Opnieuw beginnen", zodat de uitglijder eerst in beeld komt.
    const i = h.indexOf('<button class="knop gevaar" data-act="rook-opnieuw"');
    if (i < 0) return h + blok;
    const j = h.lastIndexOf("<div", i);
    return h.slice(0, j) + blok + h.slice(j);
  };
  const _gew = vwGewoontes;
  vwGewoontes = function () {
    return _gew.apply(this, arguments) + `<section class="card card-pad pl-kaart" aria-label="Patroon"><span class="labeltekst">Iets afleren?</span>${plSamenvattingHTML("gewoontes")}
      <div class="pl-knoppen"><button class="knop rand" data-pl-open="gewoontes" data-pl-soort="trek">Moment vastleggen</button></div></section>`;
  };
}
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest("[data-pl-open]"); if (!b) return;
  e.preventDefault(); e.stopImmediatePropagation();
  plBlad(b.dataset.plOpen, b.dataset.plSoort, b.dataset.plOpen === "roken" ? "roken" : "een gewoonte");
}, true);
