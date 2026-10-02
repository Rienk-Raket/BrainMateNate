"use strict";
// === SECTIE 91: TERUGPLANNEN EN ALARMEN VIA OPDRACHTEN (V6) ===
/* ==========================================================================
   Conceptvoorstel V6, besluit Kas 2 oktober 2026 (optie A).
   Bij een afspraak rekent de app terug: stoppen (afronden), voorbereiden
   (spullen), vertrekken. Die momenten staan in de tijdlijn en op het
   afspraakscherm.

   Alarmen: een webapp op iOS kan zonder server geen melding sturen als hij
   dicht is. Daarom zet de app de alarmen via de app Opdrachten: een lokale
   link (shortcuts://run-shortcut) geeft de momenten als tekst door aan een
   opdracht die Kas één keer instelt (docs/opdracht-nate-alarmen.md). Die
   opdracht maakt herinneringen en, voor vertrekken, een wekker. Er gaat niets
   over het netwerk. Het .ics-bestand krijgt dezelfde drie alarmen als reserve.

   De kern (NATE-TP-BEGIN/EINDE) is puur en wordt getest in tests/terugplannen.test.mjs.
   ========================================================================== */

/* NATE-TP-BEGIN */
const TP_STD = { voorbereiden: 10, afronden: 5, buffer: 10, naam: "Nate alarmen", wekker: true };
const TP_SOORTEN = {
  stoppen: { label: "Stoppen", zin: t => `NU afronden waar je mee bezig bent, straks ${t}` },
  voorbereiden: { label: "Voorbereiden", zin: t => `NU spullen pakken voor ${t}` },
  vertrekken: { label: "Vertrekken", zin: t => `NU jas aan en vertrekken naar ${t}` },
  beginnen: { label: "Beginnen", zin: t => `NU naar ${t}` }
};
const tpMin = s => { const m = /^(\d{1,2}):(\d{2})/.exec(s || ""); return m ? +m[1] * 60 + +m[2] : null; };
const tpHHMM = m => String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");

/**
 * Momenten vóór een afspraak, van vroeg naar laat. Met reistijd: stoppen,
 * voorbereiden, vertrekken (vertrek = begin − reistijd − buffer). Zonder
 * reistijd (bellen, online): stoppen en voorbereiden vóór het begin.
 * Momenten vóór middernacht vallen weg (geen alarm op de vorige dag).
 */
function tpMomenten(a, std) {
  const o = Object.assign({}, TP_STD, std || {});
  const start = tpMin(a && a.tijd);
  if (start == null) return [];
  const reis = Math.max(0, +a.reistijd || 0);
  const buffer = a.buffer != null && a.buffer !== "" ? Math.max(0, +a.buffer) : o.buffer;
  const voorb = a.voorbereiden != null && a.voorbereiden !== "" ? Math.max(0, +a.voorbereiden) : o.voorbereiden;
  const uit = [];
  const doel = reis ? start - reis - buffer : start;
  if (reis) uit.push({ soort: "vertrekken", min: doel });
  if (voorb) uit.push({ soort: "voorbereiden", min: doel - voorb });
  uit.push({ soort: "stoppen", min: doel - voorb - o.afronden });
  return uit.filter(m => m.min >= 0).sort((x, y) => x.min - y.min).map(m => Object.assign(m, { tijd: tpHHMM(m.min) }));
}

/** De tekst die naar de opdracht gaat: JSON met per alarm datum, tijd, titel en of er een wekker bij hoort.
    Een wekker in Klok kent alleen een kloktijd, geen datum: daarom alleen een wekker als de afspraak vandaag is (o.vandaag). */
function tpPayload(a, momenten, std) {
  const o = Object.assign({}, TP_STD, std || {});
  return {
    app: "BrainMateNate", versie: 1,
    alarmen: momenten.map(m => ({
      soort: m.soort,
      moment: `${a.datum} ${m.tijd}`,
      titel: TP_SOORTEN[m.soort].zin(a.titel),
      notitie: [a.titel, a.tijd ? `begint ${a.tijd}` : "", a.plek || ""].filter(Boolean).join(" · "),
      wekker: o.wekker && m.soort === "vertrekken" && (!o.vandaag || a.datum === o.vandaag) ? "ja" : "nee"
    }))
  };
}

function tpUrl(naam, payload) {
  return "shortcuts://run-shortcut?name=" + encodeURIComponent(naam || TP_STD.naam) + "&input=text&text=" + encodeURIComponent(JSON.stringify(payload));
}

/** Extra VALARM-blokken voor het .ics-bestand (reserve), relatief aan het begin. */
function tpIcsAlarmen(a, momenten) {
  const start = tpMin(a.tijd); if (start == null) return [];
  return momenten.flatMap(m => ["BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + TP_SOORTEN[m.soort].zin(a.titel).replace(/[,;\\]/g, s => "\\" + s), "TRIGGER:-PT" + (start - m.min) + "M", "END:VALARM"]);
}
/* NATE-TP-EINDE */

const tpInst = () => Object.assign({}, TP_STD, { buffer: typeof mdBufferStd === "function" ? mdBufferStd() : TP_STD.buffer }, inst("tpAlarmen", {}) || {});
const tpVoor = a => tpMomenten(a, tpInst());

/* ---------- Tijdlijn van Mijn dag: stoppen en voorbereiden erbij ---------- */
{
  const _items = mdItems;
  mdItems = function () {
    const items = _items.apply(this, arguments);
    for (const a of mdAfsprakenVandaag()) for (const m of tpVoor(a)) {
      if (m.soort === "vertrekken") continue;   // staat er al (sectie 87)
      items.push({ min: m.min, soort: "tp", label: `${TP_SOORTEN[m.soort].label}: ${a.titel}`, sub: m.soort === "stoppen" ? "rond af waar je mee bezig bent" : "spullen klaarleggen", view: "afspraak", param: a.id });
    }
    return items.sort((x, y) => x.min - y.min);
  };
}

/* ---------- Afspraakscherm: de keten en de alarmknop ---------- */
function tpKaartHTML(a) {
  const ms = tpVoor(a);
  if (!a.datum || !ms.length) return "";
  const ingesteld = inst("tpIngesteld", false);
  return `<div class="card card-pad tp-kaart">
    <span class="labeltekst">Terugplannen</span>
    <ol class="tp-keten">${ms.map(m => `<li class="tp-${m.soort}"><time>${m.tijd}</time><span><b>${TP_SOORTEN[m.soort].label}</b><small>${esc(TP_SOORTEN[m.soort].zin(a.titel))}</small></span></li>`).join("")}
      <li class="tp-begin"><time>${esc(a.tijd)}</time><span><b>${esc(a.titel)}</b>${a.plek ? `<small>${esc(a.plek)}</small>` : ""}</span></li></ol>
    <button class="knop breed primair" data-tp="zet" data-id="${esc(a.id)}">${ico("klok")} ${ingesteld ? "Alarmen op mijn iPhone zetten" : "Alarmen instellen"}</button>
    ${ingesteld ? `<button class="iv-los" data-tp="uitleg">Opdracht of wekker wijzigen</button>` : ""}
    ${a.tpGezet ? (d => `<p class="klein tp-gezet">Doorgegeven aan Opdrachten op ${esc(datumLabel(dISO(d)))} om ${pad(d.getHours())}:${pad(d.getMinutes())}.</p>`)(new Date(a.tpGezet)) : ""}
    <details class="iv-waarom"><summary>Waarom zeg je dit?</summary><p>Herinneringen met een alarm helpen beter dan een lijst die je zelf nakijkt, en meer dan één herinnering helpt meer dan één. Dat is onderzocht in brede groepen, niet specifiek bij ADHD; de precieze tijden zijn een experiment.</p></details>
  </div>`;
}
{
  const _vw = vwAfspraak;
  vwAfspraak = function () {
    const h = _vw.apply(this, arguments), a = vind("afspraken", V.param);
    if (!a) return h;
    const i = h.indexOf("</div></div>");
    return i < 0 ? h + tpKaartHTML(a) : h.slice(0, i + 12) + tpKaartHTML(a) + h.slice(i + 12);
  };
}

/* ---------- .ics als reserve: dezelfde alarmen ---------- */
{
  const _ics = afspraakNaarIcs;
  afspraakNaarIcs = function (a) {
    const L = _ics.apply(this, arguments);
    if (!L || !a || !a.datum || !a.tijd || !(+a.reistijd > 0)) return L;   // alleen waar terugplannen echt iets toevoegt
    const extra = tpIcsAlarmen(a, tpVoor(a)), i = L.lastIndexOf("END:VEVENT");
    return i < 0 ? L : L.slice(0, i).concat(extra, L.slice(i));
  };
}

/* ---------- De brug naar Opdrachten ---------- */
// Synchroon tot tpOpen: iOS opent een andere app alleen direct na een tik (geen await ervoor).
function tpZet(id) {
  const a = vind("afspraken", id); if (!a) return;
  if (!inst("tpIngesteld", false)) return tpUitleg(id);
  const nu = new Date(), ms = tpVoor(a).filter(m => new Date(`${a.datum}T${m.tijd}`) > nu);
  if (!ms.length) { toast("Alle momenten zijn al voorbij"); return; }
  tpOpen(tpUrl(tpInst().naam, tpPayload(a, ms, Object.assign(tpInst(), { vandaag: vandaagISO() }))));
  a.tpGezet = nu.toISOString();
  bewaar("afspraken", a).then(() => teken());
}
function tpOpen(url) {
  const l = document.createElement("a"); l.href = url; l.rel = "noopener"; document.body.appendChild(l); l.click(); l.remove();
}

function tpUitleg(id) {
  const o = tpInst();
  bladOpen("Alarmen via Opdrachten", `<p>Een app op je beginscherm kan geen wekker zetten als hij dicht is. De app Opdrachten kan dat wel, op je eigen iPhone.</p>
    <ol class="tp-stappen"><li>Maak één keer de opdracht <b>${esc(o.naam)}</b>. Het stappenplan staat hieronder.</li><li>Tik daarna bij een afspraak op <b>Alarmen op mijn iPhone zetten</b>.</li><li>Opdrachten maakt de herinneringen${o.wekker ? " en, op de dag zelf, een wekker voor vertrekken" : ""}.</li></ol>
    <details class="tp-recept"><summary>Stappenplan voor de opdracht</summary>${tpRecept(o.naam)}</details>
    <button type="button" class="tp-schakel" id="tp-wekker" aria-pressed="${o.wekker}"><span class="tekst"><b>Wekker voor vertrekken</b><small class="klein">Gaat ook af als je telefoon op stil staat.</small></span><span class="toggle" aria-hidden="true" aria-pressed="${o.wekker}"></span></button>
    <div class="veld"><label for="tp-naam">Naam van de opdracht</label><input class="invoer" id="tp-naam" value="${esc(o.naam)}" autocomplete="off"></div>
    <button class="knop breed rand" id="tp-test">Test: herinnering over 2 minuten</button>
    <p class="klein">Er gaat niets via internet. De app geeft de tijden als tekst door aan Opdrachten.</p>`,
    `<button class="knop breed primair" id="tp-klaar">Opdracht staat klaar</button>`);
  const leesInst = () => ({ naam: $("#tp-naam").value.trim() || TP_STD.naam, wekker: $("#tp-wekker").getAttribute("aria-pressed") === "true" });
  $("#tp-wekker").onclick = e => { const b = e.currentTarget, aan = String(b.getAttribute("aria-pressed") !== "true"); b.setAttribute("aria-pressed", aan); b.querySelector(".toggle").setAttribute("aria-pressed", aan); };
  $("#tp-test").onclick = () => {
    const o = leesInst(), d = new Date(Date.now() + 2 * 60000), hhmm = pad(d.getHours()) + ":" + pad(d.getMinutes());
    zetInst("tpAlarmen", o);
    tpOpen(tpUrl(o.naam, { app: "BrainMateNate", versie: 1, alarmen: [{ soort: "test", moment: `${dISO(d)} ${hhmm}`, titel: "Test van Nate: het werkt", notitie: "Deze mag je verwijderen.", wekker: "nee" }] }));
  };
  $("#tp-klaar").onclick = () => {
    // Instellingen eerst in het geheugen (inst leest S.inst), dan meteen de link; opslaan loopt erachteraan.
    const o = leesInst(); zetInst("tpAlarmen", o); zetInst("tpIngesteld", true);
    bladSluit(); if (id) tpZet(id); else teken();
  };
}

const tpRecept = naam => `<ol class="tp-recept-lijst">
  <li>Open <b>Opdrachten</b>, tik op <b>+</b> en noem de opdracht <b>${esc(naam)}</b> (precies zo).</li>
  <li>Tik op <b>ⓘ</b> (details) en zet <b>Ontvang invoer van</b> aan, met als soort <b>Tekst</b> (Receive Text input).</li>
  <li><b>Haal woordenboek op uit</b> <i>Invoer van opdracht</i> (Get Dictionary from Input).</li>
  <li><b>Haal waarde op voor</b> sleutel <i>alarmen</i> in <i>Woordenboek</i> (Get Dictionary Value).</li>
  <li><b>Herhaal met elk</b> item in <i>Woordenboekwaarde</i> (Repeat with Each). Zet daarbinnen, in deze volgorde:
    <ol><li><b>Haal waarde op voor</b> <i>moment</i> in <i>Herhaalitem</i>, daarna <b>Haal datums op uit</b> die waarde (Get Dates from Input). Hernoem het resultaat naar <i>Wanneer</i>.</li>
    <li><b>Haal waarde op voor</b> <i>titel</i> in <i>Herhaalitem</i>. Hernoem naar <i>Titel</i>.</li>
    <li><b>Haal waarde op voor</b> <i>notitie</i> in <i>Herhaalitem</i>. Hernoem naar <i>Notitie</i>.</li>
    <li><b>Voeg nieuwe herinnering toe</b> (Add New Reminder): titel <i>Titel</i>, waarschuw op <i>Wanneer</i>, notities <i>Notitie</i>.</li>
    <li><b>Haal waarde op voor</b> <i>wekker</i> in <i>Herhaalitem</i>, daarna <b>Als</b> die waarde <i>is</i> <b>ja</b> (If): <b>Maak wekker aan</b> om <i>Wanneer</i> met label <i>Titel</i> (Create Alarm). Zie je die actie niet, sla hem over.</li></ol></li>
  <li>Bij de eerste vraag om toestemming voor Herinneringen en Klok: <b>Sta altijd toe</b>.</li>
</ol><p class="klein">Een wekker kent alleen een kloktijd, geen datum. Daarom vraagt Nate alleen een wekker voor afspraken van vandaag; tik op de dag zelf nog eens op de knop. Herinneringen werken voor elke dag. De namen van de acties kunnen per iOS-versie iets anders heten; zoek dan op het Engelse woord.</p>`;

document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest("[data-tp]"); if (!b) return;
  e.preventDefault(); e.stopImmediatePropagation();
  if (b.dataset.tp === "zet") tpZet(b.dataset.id);
  else if (b.dataset.tp === "uitleg") tpUitleg(null);
}, true);
