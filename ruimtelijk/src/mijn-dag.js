"use strict";
// === SECTIE 87: MIJN DAG — DAGRING, TIJDLIJN EN NU-KAART ===
/* ==========================================================================
   Stap 5, besluit 2. Mijn dag (view "vandaag") toont bovenaan de Dagring en
   de tijdlijn (de tekstversie van de ring), daaronder hooguit één Nu-kaart
   (1–2–rest) en de dagstart zolang die nog niet gedaan is. Alle andere blokken
   van het oude Vandaag zijn widgets die je zelf aanzet (instelling mdWidgets).

   Op de ring: bolletjes voor taken (open of klaar), bogen voor afspraken, een
   wijzer op nu, en nieuw: een klokje op de VERTREKTIJD van een afspraak met
   reistijd, met de buffer als streepjesboog ervoor. Een tik op iets geeft een
   pop-up met één primaire actie.

   De Dagring zelf staat in ruimte-data.js (fmDagringHTML); hier wikkelen we
   hem om. Reistijd en buffer komen uit het afspraakblad (bouw.py, stap 10).
   ========================================================================== */

const MD_TEKST = {
  kop: "Mijn dag",
  nu: "Nu", daarna: "Daarna", rest: n => `en nog ${n}`,
  leeg: { zacht: "Niets open. Rust is ook een plan.", normaal: "Niets open. Rust is ook een plan, en een goed plan!", vol: "Niets open. Rust is ook een plan, en een goed plan!" },
  dagstart: "Dagstart · vijf minuten",
  tijdlijn: "Tijdlijn",
  tijdlijnLeeg: "Nog niets met een tijd vandaag.",
  vertrek: "Vertrekken",
  widgets: "Widgets kiezen",
  widgetsUitleg: "Alleen wat je aanzet, staat op Mijn dag."
};
// De oude blokken van Vandaag, nu als widgets. Standaard staat er geen enkele aan.
const MD_WIDGETS = [
  ["achterstallig", "Achterstallig"], ["afspraken", "Afspraken van vandaag"], ["taken", "Taken van vandaag"],
  ["gewoontes", "Gewoontes"], ["past", "Wat past er nu?"], ["afgerond", "Vandaag afgerond"],
  ["sessie", "Aan de slag met je taken (sessie)"], ["voorstellen", "Voorstellen"], ["afsluiting", "Dag afsluiten"]
];
const mdWidgets = () => inst("mdWidgets", []) || [];
const mdBufferStd = () => +inst("mdBuffer", 10) || 10;   // minuten buffer vóór vertrek
const mdHHMM = min => pad(Math.floor(min / 60)) + ":" + pad(min % 60);

/* ---------- 87.1 Vertrektijd ----------
   Terugrekenen vanaf de begintijd: min reistijd, min buffer (categorie 1 uit het
   onderzoek: het brein handelt op de vertrektijd, niet op de afspraaktijd). */
function mdVertrek(a) {
  const s = fmMin(a.tijd), reis = +a.reistijd || 0;
  if (s == null || !reis) return null;
  const buffer = a.buffer != null && a.buffer !== "" ? Math.max(0, +a.buffer) : mdBufferStd();
  return { start: s, reistijd: reis, buffer, vertrek: Math.max(0, s - reis - buffer) };
}
function mdAfsprakenVandaag() {
  const v = vandaagISO();
  return S.afspraken.filter(a => a.datum === v && fmMin(a.tijd) != null && (typeof werkOk !== "function" || werkOk(a)));
}

/* ---------- 87.2 De ring omwikkelen: klokjes en buffers ---------- */
{
  const _ring = fmDagringHTML;
  fmDagringHTML = function () {
    let h = _ring.apply(this, arguments);
    const { cx, cy, r } = FM_RING;
    let extra = "", n = 0;
    for (const a of mdAfsprakenVandaag()) {
      const vt = mdVertrek(a); if (!vt) continue;
      const [x, y] = fmPunt(vt.vertrek, r);
      // Buffer als streepjesboog van vertrek tot begin; het klokje op het vertrekmoment.
      extra += `<path d="${fmBoog(vt.vertrek, vt.start, r)}" class="fm-dr-buffer"/>` +
        `<g class="fm-dr-klok" style="--i:${n++}" data-md="pop" data-soort="vertrek" data-id="${esc(a.id)}" tabindex="0" role="button" aria-label="Vertrekken om ${mdHHMM(vt.vertrek)} voor ${esc(a.titel)}">
          <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7"/>
          <line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x.toFixed(1)}" y2="${(y - 4).toFixed(1)}"/><line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + 3).toFixed(1)}" y2="${y.toFixed(1)}"/>
          <title>${mdHHMM(vt.vertrek)} vertrekken: ${esc(a.titel)}</title></g>`;
    }
    if (extra) {
      const anker = `<text x="${cx}" y="${cy - 2}" class="fm-dr-tijd"`;
      h = h.replace(anker, extra + anker);
      h = h.replace('<li><i class="licht"></i>Daglicht</li>', '<li><i class="klok"></i>Vertrek</li><li><i class="buffer"></i>Buffer</li><li><i class="licht"></i>Daglicht</li>');
    }
    return h;
  };
}

/* ---------- 87.3 Tijdlijn: de tekstversie van de ring ---------- */
function mdItems() {
  const v = vandaagISO(), { open, af } = fmVandaagTaken(), items = [];
  for (const a of mdAfsprakenVandaag()) {
    items.push({ min: fmMin(a.tijd), soort: "afspraak", label: a.titel, sub: a.plek || "", id: a.id });
    const vt = mdVertrek(a);
    if (vt) items.push({ min: vt.vertrek, soort: "vertrek", label: `${MD_TEKST.vertrek}: ${a.titel}`, sub: `${vt.reistijd} min reistijd + ${vt.buffer} min buffer`, id: a.id });
  }
  for (const t of open.concat(af)) if (t.datum === v && fmMin(t.tijd) != null) items.push({ min: fmMin(t.tijd), soort: "taak", label: t.titel, sub: t.af ? "klaar" : "open", af: !!t.af, id: t.id });
  const sporen = FM_SPOREN.flatMap(f => { try { return f() || []; } catch (e) { return []; } }).filter(x => x && x.min != null);
  for (const x of sporen) items.push({ min: x.min, soort: "spoor", label: x.label, sub: "", view: x.view, param: x.param, act: x.act, kleur: x.kleur });
  return items.sort((a, b) => a.min - b.min);
}
function mdTijdlijnHTML() {
  const items = mdItems(), nuMin = new Date().getHours() * 60 + new Date().getMinutes();
  if (!items.length) return `<p class="klein md-leeg">${MD_TEKST.tijdlijnLeeg}</p>`;
  return `<ol class="md-tijdlijn" aria-label="${MD_TEKST.tijdlijn}">${items.map((it, i) => `<li class="md-item ${it.soort}${it.af ? " af" : ""}${it.min < nuMin ? " voorbij" : ""}">
      <button type="button" data-md="pop" data-soort="${it.soort}" data-id="${esc(it.id || "")}" data-i="${i}">
        <time>${mdHHMM(it.min)}</time><i class="md-bol" aria-hidden="true"${it.kleur ? ` style="background:${it.kleur}"` : ""}></i>
        <span><b>${esc(it.label)}</b>${it.sub ? `<small>${esc(it.sub)}</small>` : ""}</span></button></li>`).join("")}</ol>`;
}

/* ---------- 87.4 Nu-kaart: 1–2–rest ----------
   Eén ding nu, twee daarna, en de rest als getal. Eerst taken met een tijd die
   nog komt, dan taken zonder tijd op prioriteit, dan wat al voorbij is. */
function mdNu() {
  const { open } = fmVandaagTaken(), nuMin = new Date().getHours() * 60 + new Date().getMinutes();
  const metTijd = open.filter(t => fmMin(t.tijd) != null).sort((a, b) => fmMin(a.tijd) - fmMin(b.tijd));
  const komend = metTijd.filter(t => fmMin(t.tijd) >= nuMin - 15), voorbij = metTijd.filter(t => !komend.includes(t));
  const zonder = open.filter(t => fmMin(t.tijd) == null).sort(sorteerTaken);
  const lijst = komend.concat(zonder, voorbij);
  return { een: lijst[0] || null, twee: lijst.slice(1, 3), rest: Math.max(0, lijst.length - 3) };
}
function mdNuHTML() {
  const { een, twee, rest } = mdNu();
  if (!een) return `<div class="card card-pad md-nu md-nu-leeg"><span class="labeltekst">${MD_TEKST.nu}</span><p>${esc(nateZeg(MD_TEKST.leeg))}</p></div>`;
  return `<div class="card card-pad md-nu"><span class="labeltekst">${MD_TEKST.nu}</span>
    <h2>${een.tijd ? `<time>${esc(een.tijd)}</time> ` : ""}${esc(een.titel)}</h2>
    ${een.duur ? `<p class="klein">± ${een.duur} min</p>` : ""}
    <div class="md-nu-acties"><button class="knop primair" data-act="vink" data-id="${esc(een.id)}">${ico("check")} Klaar</button>
      <button class="knop rand" data-act="open-taak" data-id="${esc(een.id)}">Openen</button></div>
    ${twee.length ? `<p class="md-daarna"><span class="labeltekst">${MD_TEKST.daarna}</span> ${twee.map(t => esc(t.titel)).join(" · ")}${rest ? ` <span class="md-rest">${MD_TEKST.rest(rest)}</span>` : ""}</p>` : ""}
  </div>`;
}

/* ---------- 87.5 Widgets: de oude blokken, alleen als je ze aanzet ---------- */
function mdWidgetHTML(id) {
  const v = vandaagISO(), zichtbaar = openTaken();
  switch (id) {
    case "achterstallig": { const laat = zichtbaar.filter(t => t.datum && t.datum < v).sort(sorteerTaken); return laat.length ? sectie("Achterstallig", laat.length, `<button class="actie" data-act="alles-vandaag">Alles naar vandaag</button>`) + takenLijst(laat) : ""; }
    case "afspraken": { const a = mdAfsprakenVandaag().sort((x, y) => (x.tijd || "") < (y.tijd || "") ? -1 : 1); return a.length ? sectie("Afspraken", a.length, `<button class="actie" data-act="nieuwe-afspraak">Nieuw</button>`) + `<div class="card">${a.map(afspraakRij).join("")}</div>` : ""; }
    case "taken": { const nu = zichtbaar.filter(t => t.datum === v).sort(sorteerTaken); return sectie("Taken vandaag", nu.length, `<button class="actie" data-act="ga" data-view="kalender">Kalender</button>`) + (nu.length ? takenLijst(nu, { sleep: true }) : `<div class="card">${leeg("", "Niets gepland vandaag", "Leg iets vast via + Vastleggen.")}</div>`); }
    case "gewoontes": { const gew = gewoontesVoor(v); if (!gew.length) return ""; const afG = gew.filter(g => gewoonteAf(g.id, v)).length; return sectie("Gewoontes", `${afG}/${gew.length}`, `<button class="actie" data-act="ga" data-view="gewoontes">Alles</button>`) + `<div class="card">${gew.map(g => gewoonteRij(g, v, true)).join("")}</div>`; }
    case "past": {
      let h = sectie("Wat past er nu?", null, "") + `<div class="chiprij scroll" style="margin-bottom:6px">${[5, 15, 30, 60, 120].map(m => `<button class="keuze" data-act="planmin" data-min="${m}" aria-pressed="${V.planMin === m}">${ico("bliksem")} ${m} min</button>`).join("")}</div>`;
      if (V.planMin) { const past = zichtbaar.filter(t => !geblokkeerd(t) && t.duur && t.duur <= V.planMin).sort(sorteerTaken).slice(0, 8); h += past.length ? takenLijst(past) : `<div class="card"><div class="leeg"><p>Geen taken van ${V.planMin} minuten of korter.</p></div></div>`; }
      return h;
    }
    case "afgerond": { const af = S.taken.filter(t => t.af && (t.afOp || "").slice(0, 10) === v && werkOk(t)); return af.length ? sectie("Vandaag afgerond", af.length, `<button class="actie" data-act="ga" data-view="logboek">Logboek</button>`) + takenLijst(af.slice(0, 8), { notitie: false }) : ""; }
    case "sessie": { const open = fmVandaagTaken().open; if (!open.length) return ""; const min = open.reduce((a, t) => a + (+t.duur || 10), 0); return `<button class="card vw-sessie" data-act="ses-taken"><span class="vs-ico" aria-hidden="true">${ico("ster")}</span><span class="vs-tekst"><b>Aan de slag met je taken</b><small>${open.length} ${open.length === 1 ? "taak" : "taken"} · ± ${min} min · één kaartje tegelijk</small></span>${ico("pijlr", "width:16px;height:16px;color:var(--faint)")}</button>`; }
    case "voorstellen": return typeof vsHTML === "function" ? vsHTML("vandaag") : "";
    case "afsluiting": return typeof dcAfsluitingHTML === "function" ? dcAfsluitingHTML() : "";
  }
  return "";
}
function mdWidgetsKiezen() {
  const aan = mdWidgets();
  bladOpen(MD_TEKST.widgets, `<p class="klein">${MD_TEKST.widgetsUitleg}</p><ul class="schakels md-schakels">${MD_WIDGETS.map(([id, naam]) => `<li class="schakel"><span class="tekst"><b>${naam}</b></span><button class="toggle" data-md-widget="${id}" aria-pressed="${aan.includes(id)}" aria-label="${naam}"></button></li>`).join("")}</ul>`);
  $("#bladinhoud").addEventListener("click", async e => {
    const b = e.target.closest("[data-md-widget]"); if (!b) return;
    const id = b.dataset.mdWidget, lijst = mdWidgets();
    const nieuw = lijst.includes(id) ? lijst.filter(x => x !== id) : lijst.concat(id);
    b.setAttribute("aria-pressed", String(nieuw.includes(id)));
    await zetInst("mdWidgets", nieuw); teken();
  });
}

/* ---------- 87.6 Het scherm ---------- */
function mdHTML() {
  const d = dcVandaag();
  let h = backupBanner() + fmDagringHTML();
  h += `${sectie(MD_TEKST.tijdlijn)}<div class="card card-pad md-tijdlijnkaart">${mdTijdlijnHTML()}</div>`;
  // Klasse vw-hart: verweven.js voegt anders zijn eigen blok (check-in, sessie …) toe.
  h += `<div class="vw-hart md-hart">${mdNuHTML()}`;
  if (!(d && d.checkinTs) || V.dcWijzig) h += dcCheckinHTML(false).replace("Ochtend-check-in", MD_TEKST.dagstart);
  h += `</div>`;
  for (const id of mdWidgets()) h += mdWidgetHTML(id);
  h += `<button class="md-widgetknop" data-md="widgets">${ico("instel")} ${MD_TEKST.widgets}</button>`;
  return h;
}
vwVandaag = mdHTML;
Object.defineProperty(KOPPEN, "vandaag", { get: () => [MD_TEKST.kop, () => langDatumLabel(vandaagISO())], configurable: true, enumerable: true });

/* ---------- 87.7 Pop-up met één primaire actie ---------- */
function mdPop(soort, id, i) {
  const items = mdItems();
  let titel = "", sub = "", knop = "", doe = null;
  if (soort === "taak") {
    const t = vind("taken", id); if (!t) return;
    titel = t.titel; sub = [t.tijd, t.duur ? `± ${t.duur} min` : "", t.af ? "klaar" : ""].filter(Boolean).join(" · ");
    if (t.af) { knop = "Openen"; doe = () => openTaakBlad(t.id); }
    else { knop = "Klaar"; doe = async () => { await vinkTaak(t.id); teken(); }; }
  } else if (soort === "afspraak" || soort === "vertrek") {
    const a = vind("afspraken", id); if (!a) return;
    const vt = mdVertrek(a);
    titel = soort === "vertrek" ? `${MD_TEKST.vertrek} om ${mdHHMM(vt.vertrek)}` : a.titel;
    sub = soort === "vertrek" ? `${a.titel} begint om ${a.tijd}. ${vt.reistijd} min reistijd + ${vt.buffer} min buffer.` : [a.tijd, a.plek, vt ? `vertrek ${mdHHMM(vt.vertrek)}` : ""].filter(Boolean).join(" · ");
    knop = "Afspraak openen"; doe = () => ga("afspraak", a.id);
  } else {
    const it = items[i]; if (!it) return;
    titel = it.label; sub = mdHHMM(it.min); knop = "Openen";
    doe = () => { if (it.act) { const b = document.createElement("button"); b.dataset.act = it.act; document.body.appendChild(b); b.click(); b.remove(); } else ga(it.view || "logboek", it.param || null); };
  }
  bladOpen(titel, `<p class="md-popsub">${esc(sub)}</p>`, `<button class="knop breed primair" id="md-pop-doe">${esc(knop)}</button>`);
  $("#md-pop-doe").onclick = async () => { bladSluit(); await doe(); };
}
// Tik op de ring of de tijdlijn: eerst wij (capture), zodat de oude handlers
// (taakblad, ga naar afspraak) niet ook nog afgaan.
document.addEventListener("click", e => {
  if (V.view !== "vandaag") return;
  const el = e.target.closest && e.target.closest("[data-md]");
  if (el) {
    e.preventDefault(); e.stopImmediatePropagation();
    if (el.dataset.md === "widgets") return mdWidgetsKiezen();
    return mdPop(el.dataset.soort, el.dataset.id, +el.dataset.i);
  }
  const ring = e.target.closest && e.target.closest(".fm-dagring [data-fm-taak], .fm-dagring .fm-dr-boog, .fm-dagring .fm-dr-spoor");
  if (!ring) return;
  e.preventDefault(); e.stopImmediatePropagation();
  if (ring.dataset.fmTaak) return mdPop("taak", ring.dataset.fmTaak);
  if (ring.classList.contains("fm-dr-boog")) return mdPop("afspraak", ring.dataset.param);
  const items = mdItems(), i = items.findIndex(x => x.soort === "spoor" && x.label === (ring.getAttribute("aria-label") || ""));
  if (i >= 0) mdPop("spoor", "", i);
}, true);
document.addEventListener("keydown", e => {
  if ((e.key !== "Enter" && e.key !== " ") || !e.target.closest) return;
  const el = e.target.closest(".fm-dr-klok[data-md]"); if (!el) return;
  e.preventDefault(); mdPop("vertrek", el.dataset.id);
});

/* ---------- 87.8 Een dialoog zet de focus terug na sluiten ----------
   Het onderblad (bladOpen/bladSluit) deed dat nog niet; dit geldt nu overal. */
{
  let opener = null;
  const _open = bladOpen, _sluit = bladSluit;
  bladOpen = function () { if (!$("#blad").classList.contains("open")) opener = document.activeElement; return _open.apply(this, arguments); };
  bladSluit = function () {
    const r = _sluit.apply(this, arguments);
    if (opener && document.contains(opener) && opener !== document.body) { try { opener.focus({ preventScroll: true }); } catch (e) {} }
    opener = null;
    return r;
  };
}
