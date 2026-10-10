"use strict";
// === SECTIE 108: ALARMEN PLANNEN (Nate alarmen, optie 1; besluit Kas 10 oktober 2026) ===
/* ==========================================================================
   Eén scherm "Alarmen", zoals in een wekker-app: per dag (vandaag + 6 dagen)
   alle alarmen die Nate voor je klaarzet.
   - Uit afspraken: stoppen, voorbereiden en vertrekken (terugplannen, V6).
   - Eigen alarmen: titel, tijd, één datum of vaste dagen (sjabloon, bv. elke werkdag).
   - Per alarm aan/uit. Eén knop zet alles wat nieuw of veranderd is in één keer
     door naar de opdracht "Nate alarmen" (dezelfde opdracht en hetzelfde formaat).
   - Wat al doorgegeven is, gaat niet nog eens (anders dubbele herinneringen);
     "Opnieuw alles" kan wel.
   Beperking van iOS: een wekker in Klok kent geen datum, dus alleen voor vandaag.
   Andere dagen worden een herinnering met melding.

   De kern (NATE-ALARM-BEGIN/EINDE) is puur en wordt getest in tests/alarmen.test.mjs.
   ========================================================================== */

/* NATE-ALARM-BEGIN */
const AL_DAGEN = ["ma", "di", "wo", "do", "vr", "za", "zo"];
const AL_SJABLONEN = [["werkdagen", "Werkdagen", [0, 1, 2, 3, 4]], ["weekend", "Weekend", [5, 6]], ["elke", "Elke dag", [0, 1, 2, 3, 4, 5, 6]]];
const alPlus = (iso, n) => { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
/** Maandag = 0 … zondag = 6. */
const alWeekdag = iso => (new Date(iso + "T12:00:00").getDay() + 6) % 7;

/** Eigen alarmen uitklappen over n dagen vanaf `van`: vaste dagen herhalen, een datum één keer. */
function alUitklappen(eigen, van, n) {
  const uit = [];
  for (let i = 0; i < n; i++) {
    const d = alPlus(van, i), wd = alWeekdag(d);
    for (const e of eigen || []) {
      const herhaal = (e.dagen || []).length > 0;
      if (herhaal ? !e.dagen.includes(wd) : e.datum !== d) continue;
      uit.push({ sleutel: `e:${e.id}:${d}`, bron: "eigen", id: e.id, soort: "eigen", datum: d, tijd: e.tijd, titel: e.titel || "Alarm",
        notitie: e.notitie || "", wekker: !!e.wekker, herhaal, uit: e.aan === false });
    }
  }
  return uit;
}
/** Plan: aan of uit, voorbij of niet, op volgorde van moment. */
function alPlan(items, uitgezet, nu) {
  return (items || []).map(x => Object.assign({}, x, { aan: !x.uit && !(uitgezet || {})[x.sleutel], voorbij: `${x.datum} ${x.tijd}` <= nu }))
    .sort((a, b) => (`${a.datum} ${a.tijd}` < `${b.datum} ${b.tijd}` ? -1 : `${a.datum} ${a.tijd}` > `${b.datum} ${b.tijd}` ? 1 : 0));
}
/** Wat gaat er naar Opdrachten: aan, nog niet voorbij, en nieuw of veranderd (tenzij alles opnieuw). */
function alTeVersturen(plan, verstuurd, alles) {
  return (plan || []).filter(x => x.aan && !x.voorbij && (alles || (verstuurd || {})[x.sleutel] !== `${x.datum} ${x.tijd}`));
}
/** Dezelfde tekst als bij één afspraak (V6), zodat de opdracht niet verandert. Wekker alleen vandaag. */
function alPayload(lijst, vandaag, wekkerAan) {
  return { app: "BrainMateNate", versie: 1, alarmen: (lijst || []).map(x => ({ soort: x.soort || "eigen", moment: `${x.datum} ${x.tijd}`, titel: x.titel,
    notitie: x.notitie || "", wekker: wekkerAan && x.wekker && x.datum === vandaag ? "ja" : "nee" })) };
}
/** Oude sleutels opruimen (dagen vóór vandaag). */
function alOpruimen(map, vandaag) {
  const uit = {};
  for (const [k, v] of Object.entries(map || {})) { const d = (k.match(/\d{4}-\d{2}-\d{2}/) || [""])[0]; if (!d || d >= vandaag) uit[k] = v; }
  return uit;
}
/* NATE-ALARM-EINDE */

const AL_DAGEN_VOORUIT = 7;
const alEigen = () => inst("alEigen", []) || [];
const alNu = () => { const d = new Date(); return `${vandaagISO()} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };

/* ---------- 108.1 Alle alarmen van de komende dagen ---------- */
function alItems() {
  const v = vandaagISO(), tot = alPlus(v, AL_DAGEN_VOORUIT - 1), uit = [];
  for (const a of S.afspraken) {
    if (!a.datum || a.datum < v || a.datum > tot || !a.tijd || a.uitkomst) continue;
    if (typeof werkOk === "function" && !werkOk(a)) continue;
    for (const m of tpVoor(a)) uit.push({ sleutel: `a:${a.id}:${m.soort}:${a.datum}`, bron: "afspraak", id: a.id, soort: m.soort, datum: a.datum, tijd: m.tijd,
      titel: TP_SOORTEN[m.soort].zin(a.titel), notitie: [a.titel, `begint ${a.tijd}`, a.plek || ""].filter(Boolean).join(" · "), wekker: m.soort === "vertrekken", sub: a.titel });
  }
  return uit.concat(alUitklappen(alEigen(), v, AL_DAGEN_VOORUIT));
}
const alPlanNu = () => alPlan(alItems(), inst("alUit", {}), alNu());
function alVersturen(alles) {
  const plan = alPlanNu(), lijst = alTeVersturen(plan, inst("alVerstuurd", {}), alles);
  if (!lijst.length) { toast("Alles is al doorgegeven"); return; }
  if (!inst("tpIngesteld", false)) return tpUitleg(null);
  const o = tpInst();
  // Synchroon tot tpOpen: iOS opent een andere app alleen direct na een tik.
  tpOpen(tpUrl(o.naam, alPayload(lijst, vandaagISO(), o.wekker !== false)));
  const vst = alOpruimen(inst("alVerstuurd", {}), vandaagISO());
  for (const x of lijst) vst[x.sleutel] = `${x.datum} ${x.tijd}`;
  zetInst("alVerstuurd", vst); zetInst("alLaatst", new Date().toISOString());
  setTimeout(() => { teken(); toast(`${lijst.length} ${lijst.length === 1 ? "alarm" : "alarmen"} doorgegeven`); }, 300);
}
// Eén afspraak via de knop op het afspraakscherm: ook die tellen als doorgegeven.
{
  const _zet = tpZet;
  tpZet = function (id) {
    const voor = inst("tpIngesteld", false), r = _zet.apply(this, arguments), a = vind("afspraken", id);
    if (voor && a && a.datum && a.tijd) {
      const vst = alOpruimen(inst("alVerstuurd", {}), vandaagISO()), nu = alNu();
      for (const m of tpVoor(a)) if (`${a.datum} ${m.tijd}` > nu) vst[`a:${a.id}:${m.soort}:${a.datum}`] = `${a.datum} ${m.tijd}`;
      zetInst("alVerstuurd", vst);
    }
    return r;
  };
}

/* ---------- 108.2 Het scherm ---------- */
function alDagLabel(d) { const v = vandaagISO(); return d === v ? "Vandaag" : d === alPlus(v, 1) ? "Morgen" : (typeof langDatumLabel === "function" ? langDatumLabel(d) : d); }
function alRijHTML(x, verstuurd) {
  const door = verstuurd[x.sleutel] === `${x.datum} ${x.tijd}`;
  const wat = x.bron === "afspraak" ? `${TP_SOORTEN[x.soort].label} · ${x.sub}` : x.herhaal ? `Eigen · ${alDagenTekst(alEigen().find(e => e.id === x.id))}` : "Eigen";
  return `<li class="al-rij${x.aan ? "" : " al-uit"}">
    <button type="button" class="al-open" data-al-open="${esc(x.bron)}" data-id="${esc(x.id)}"><time>${esc(x.tijd)}</time>
      <span class="al-tekst"><b>${esc(x.titel)}</b><small>${esc(wat)}${x.wekker && x.datum === vandaagISO() ? " · wekker" : ""}${door ? " · doorgegeven" : ""}</small></span></button>
    <button type="button" class="al-schakel" data-al-schakel="${esc(x.sleutel)}" aria-pressed="${x.aan}" aria-label="${esc(x.titel)} om ${esc(x.tijd)} ${x.aan ? "aan" : "uit"}"><span class="toggle" aria-hidden="true" aria-pressed="${x.aan}"></span></button></li>`;
}
function alDagenTekst(e) {
  if (!e || !(e.dagen || []).length) return e && e.datum ? datumLabel(e.datum) : "";
  const s = AL_SJABLONEN.find(([, , d]) => d.length === e.dagen.length && d.every(x => e.dagen.includes(x)));
  return s ? s[1].toLowerCase() : e.dagen.slice().sort().map(i => AL_DAGEN[i]).join(", ");
}
function vwAlarmen() {
  const plan = alPlanNu().filter(x => !x.voorbij), vst = inst("alVerstuurd", {}), nieuw = alTeVersturen(plan, vst, false), ingesteld = inst("tpIngesteld", false);
  const laatst = inst("alLaatst", null);
  let h = `<div class="card card-pad al-kop">
    <p class="al-stand">${!plan.length ? "Nog geen alarmen voor de komende dagen." : nieuw.length ? `${nieuw.length} ${nieuw.length === 1 ? "alarm is" : "alarmen zijn"} nieuw of veranderd.` : "Alles staat al op je iPhone."}</p>
    ${!ingesteld ? `<button class="knop breed primair" data-tp="uitleg">${ico("klok")} Opdracht instellen</button>`
      : `<button class="knop breed primair" data-al-stuur="nieuw"${nieuw.length ? "" : " disabled"}>${ico("klok")} Naar Opdrachten${nieuw.length ? ` (${nieuw.length})` : ""}</button>`}
    ${laatst ? `<p class="klein">Laatst doorgegeven: ${esc(datumLabel(laatst.slice(0, 10)))} om ${(d => pad(d.getHours()) + ":" + pad(d.getMinutes()))(new Date(laatst))}.</p>` : ""}
    <p class="klein">Een wekker in Klok kan alleen voor vandaag. Op andere dagen krijg je een herinnering met melding.</p>
  </div>`;
  const perDag = {};
  for (const x of plan) (perDag[x.datum] = perDag[x.datum] || []).push(x);
  for (let i = 0; i < AL_DAGEN_VOORUIT; i++) {
    const d = alPlus(vandaagISO(), i), l = perDag[d] || [];
    if (!l.length) continue;
    h += sectie(alDagLabel(d), l.filter(x => x.aan).length) + `<ul class="card al-lijst">${l.map(x => alRijHTML(x, vst)).join("")}</ul>`;
  }
  h += `<button class="knop breed rand al-nieuw" data-al-eigen="">${ico("plus")} Eigen alarm</button>`;
  if (ingesteld && plan.some(x => x.aan)) h += `<button class="iv-los" data-al-stuur="alles">Opnieuw alles doorgeven</button><p class="klein al-let">Opnieuw alles geeft dubbele herinneringen voor wat er al staat. Gebruik het als je herinneringen hebt gewist.</p>`;
  h += `<details class="iv-waarom"><summary>Waarom zeg je dit?</summary><p>Een alarm op het moment van stoppen, voorbereiden en vertrekken helpt beter dan een lijst die je zelf nakijkt, en meer dan één herinnering helpt meer dan één. Indirect: onderzocht in brede groepen, niet specifiek bij ADHD.</p></details>`;
  h += `<button class="iv-los" data-tp="uitleg">Opdracht of wekker wijzigen, of werkt het niet?</button>`;
  return h;
}
Object.defineProperty(KOPPEN, "alarmen", { get: () => ["Alarmen", () => "De komende 7 dagen"], configurable: true, enumerable: true });

/* ---------- 108.3 Eigen alarm maken of wijzigen ---------- */
function alEigenBlad(id) {
  const e = alEigen().find(x => x.id === id) || { id: null, titel: "", tijd: "", dagen: [], datum: vandaagISO(), wekker: false };
  bladOpen(e.id ? "Alarm wijzigen" : "Eigen alarm", `
    <div class="veld"><label for="al-titel">Wat ga je dan doen?</label><input class="invoer" id="al-titel" maxlength="80" autocomplete="off" value="${esc(e.titel)}" placeholder="NU medicijnen innemen"></div>
    <div class="veld"><label for="al-tijd">Hoe laat?</label><input class="invoer" id="al-tijd" type="time" value="${esc(e.tijd)}"></div>
    <fieldset class="al-dagen"><legend>Herhalen</legend>
      <div class="chiprij">${AL_SJABLONEN.map(([k, l]) => `<button type="button" class="keuze" data-al-sjabloon="${k}">${l}</button>`).join("")}</div>
      <div class="al-dagknoppen">${AL_DAGEN.map((d, i) => `<button type="button" class="keuze" data-al-dag="${i}" aria-pressed="${(e.dagen || []).includes(i)}">${d}</button>`).join("")}</div>
      <div class="veld" id="al-datumveld"${(e.dagen || []).length ? " hidden" : ""}><label for="al-datum">Of één keer, op</label><input class="invoer" id="al-datum" type="date" value="${esc(e.datum || vandaagISO())}" min="${vandaagISO()}"></div>
    </fieldset>
    <button type="button" class="tp-schakel" id="al-wekker" aria-pressed="${!!e.wekker}"><span class="tekst"><b>Ook een wekker</b><small class="klein">Alleen op de dag zelf; gaat af als je telefoon op stil staat.</small></span><span class="toggle" aria-hidden="true" aria-pressed="${!!e.wekker}"></span></button>`,
    `<button class="knop breed primair" id="al-bewaar">Bewaren</button>${e.id ? `<button class="knop breed rand" id="al-weg">Verwijderen</button>` : ""}`);
  const dagen = () => [...document.querySelectorAll('#bladinhoud [data-al-dag][aria-pressed="true"]')].map(b => +b.dataset.alDag);
  const toonDatum = () => { $("#al-datumveld").hidden = dagen().length > 0; };
  $("#bladinhoud").addEventListener("click", ev => {
    const s = ev.target.closest("[data-al-sjabloon]"), d = ev.target.closest("[data-al-dag]");
    if (s) { const set = AL_SJABLONEN.find(x => x[0] === s.dataset.alSjabloon)[2]; document.querySelectorAll("#bladinhoud [data-al-dag]").forEach(b => b.setAttribute("aria-pressed", String(set.includes(+b.dataset.alDag)))); toonDatum(); }
    if (d) { d.setAttribute("aria-pressed", String(d.getAttribute("aria-pressed") !== "true")); toonDatum(); }
  });
  $("#al-wekker").onclick = ev => { const b = ev.currentTarget, aan = String(b.getAttribute("aria-pressed") !== "true"); b.setAttribute("aria-pressed", aan); b.querySelector(".toggle").setAttribute("aria-pressed", aan); };
  $("#al-bewaar").onclick = async () => {
    const titel = $("#al-titel").value.trim(), tijd = $("#al-tijd").value;
    if (!titel || !/^\d{2}:\d{2}$/.test(tijd)) { toast("Vul een titel en een tijd in"); return; }
    const nieuw = { id: e.id || uid(), titel, tijd, dagen: dagen(), datum: dagen().length ? null : ($("#al-datum").value || vandaagISO()), wekker: $("#al-wekker").getAttribute("aria-pressed") === "true", aan: true };
    await zetInst("alEigen", alEigen().filter(x => x.id !== nieuw.id).concat(nieuw));
    bladSluit(); tril(6); teken(); toast(e.id ? "Alarm gewijzigd" : "Alarm toegevoegd");
  };
  if (e.id) $("#al-weg").onclick = async () => { await zetInst("alEigen", alEigen().filter(x => x.id !== e.id)); bladSluit(); teken(); toast("Alarm verwijderd. Een herinnering die al op je iPhone staat, veeg je daar weg."); };
}

/* ---------- 108.4 Handelingen ---------- */
document.addEventListener("click", async ev => {
  const b = ev.target.closest && ev.target.closest("[data-al-schakel], [data-al-stuur], [data-al-eigen], [data-al-open]"); if (!b) return;
  ev.preventDefault(); ev.stopImmediatePropagation();
  if (b.dataset.alStuur) return alVersturen(b.dataset.alStuur === "alles");
  if (b.dataset.alSchakel) {
    const uit = alOpruimen(inst("alUit", {}), vandaagISO()), k = b.dataset.alSchakel;
    if (uit[k]) delete uit[k]; else uit[k] = true;
    await zetInst("alUit", uit); tril(4); teken();
    const terug = document.querySelector(`#scherm [data-al-schakel="${CSS.escape(k)}"]`); if (terug) terug.focus({ preventScroll: true });
    return;
  }
  if (b.dataset.alEigen !== undefined) return alEigenBlad(b.dataset.alEigen || null);
  if (b.dataset.alOpen === "afspraak") return ga("afspraak", b.dataset.id);
  if (b.dataset.alOpen === "eigen") return alEigenBlad(b.dataset.id);
}, true);

/* ---------- 108.5 Ingangen ---------- */
NV_PLANNING.unshift(["alarmen", "Alarmen", "klok"]);
{
  const ook = NV_MEER[1][1];
  if (!ook.some(r => r[0] === "alarmen")) ook.splice(1, 0, ["alarmen", "Alarmen", "klok", "Alle alarmen van de komende dagen"]);
  // Op het afspraakscherm: naar het overzicht van alle alarmen.
  const _kaart = tpKaartHTML;
  tpKaartHTML = function (a) {
    const h = _kaart.apply(this, arguments);
    return h ? h.replace('<details class="iv-waarom">', `<button class="iv-los" data-act="ga" data-view="alarmen">Alle alarmen van de komende dagen</button><details class="iv-waarom">`) : h;
  };
}
