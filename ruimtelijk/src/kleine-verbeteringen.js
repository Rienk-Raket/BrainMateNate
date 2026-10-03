"use strict";
// === SECTIE 97: KLEINE VERBETERINGEN (conceptvoorstel, niveau 5) ===
/* ==========================================================================
   Snelle verbeteringen uit het conceptvoorstel. Elk punt staat apart.
   Al eerder gedaan: 1 (leesbare kopjes), 4 (intentie, V5), 11 (alarmsoorten,
   V6), 12 (live status, V4), 14 (minder beweging voorstellen, V2).
   Hier: 2 back-upbanner, 3 namen in Vastleggen, 5 "Verder naar" op tabs,
   7 Nate's rustplek, 8 toasts, 9 Meer korter, 10 profielrapport met knoppen,
   13 "weer opgepakt" in Voortgang, 15 één naamgeving.

   De kern (NATE-KLEIN-BEGIN/EINDE) is puur en wordt getest in tests/klein.test.mjs.
   ========================================================================== */

/* NATE-KLEIN-BEGIN */
/** Weer opgepakt na een pauze: dagen (ISO, uniek of niet) met activiteit → hoe vaak na ≥ 2 lege dagen, en de laatste keer. */
function kvHervat(dagen, vandaag, venster) {
  const dag = d => Math.round(Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) / 86400000);
  const v = dag(vandaag), lijst = [...new Set(dagen || [])].map(dag).filter(x => x <= v).sort((a, b) => a - b);
  let aantal = 0, laatste = null;
  for (let i = 1; i < lijst.length; i++) {
    const pauze = lijst[i] - lijst[i - 1] - 1;
    if (pauze >= 2) { if (v - lijst[i] <= (venster || 90)) aantal++; laatste = { na: pauze, dagenGeleden: v - lijst[i] }; }
  }
  return { aantal, laatste };
}
/* Eén naamgeving: dezelfde woorden als de tabs en Meer. */
const KV_NAMEN = { "Vandaag": "Mijn dag", "Back-up": "Gegevens", "Uitleg": "Help", "Toolbox": "Hulpmiddelen" };
/* Vragenbank-modules → schermen in de app (profielrapport, microstap). */
const KV_MODULE_VIEW = { calendar: "afspraken", planning: "planning", tasks: "persoonlijk", time: "tijd", focus: "focus", memory: "mindmap", energy: "anker",
  emotions: "anker", structure: "planning", household: "huishouden", routines: "gewoontes", context: "aanpak", experiments: "vg", finance: "financieel" };
/* NATE-KLEIN-EINDE */

/* ---------- 2. Back-upbanner niet meer op Mijn dag ----------
   Nate's berichten tonen al "Tijd voor een back-up" (na 14 dagen); die gaat nu naar Meer, waar exporteren bovenaan staat. */
{
  const _sig = meldingenSignalen;
  meldingenSignalen = function () {
    return _sig.apply(this, arguments).map(s => s.titel === "Tijd voor een back-up" ? Object.assign({}, s, { tekst: "Al even geen export gemaakt. Eén tik in Meer.", actieView: "meer" }) : s);
  };
}

/* ---------- 3. Namen bij de blokken in Vastleggen, ook ingeklapt ---------- */
{
  const _kaart = nwlKaartHTML;
  nwlKaartHTML = function (k) {
    const h = _kaart.apply(this, arguments), naam = KV_NAMEN[k.naam] || k.naam;
    return h.replace(/<\/button>\s*$/, `<span class="kv-strooknaam" aria-hidden="true">${esc(naam)}</span></button>`).replace(`>${esc(k.naam)}<`, `>${esc(naam)}<`);
  };
}

/* ---------- 5 en 15. "Verder naar": niet op de tabschermen; dezelfde woorden als de tabs ---------- */
{
  const _verwant = verwantHTML;
  verwantHTML = function () {
    if (TABS.includes(V.view) || V.view === "meer") return "";
    let h = _verwant.apply(this, arguments);
    for (const [oud, nieuw] of Object.entries(KV_NAMEN)) h = h.split(`</svg>${oud}</button>`).join(`</svg>${nieuw}</button>`);
    return h;
  };
}

/* ---------- 7. Nate's rustplek: rechts, links of verborgen ---------- */
function kvNateRust() {
  const w = inst("nateRust", "rechts");
  document.documentElement.dataset.nateRust = ["rechts", "links", "uit"].includes(w) ? w : "rechts";
}
{
  const _pas = pasInstellingenToe;
  pasInstellingenToe = function () { const r = _pas.apply(this, arguments); kvNateRust(); return r; };
  const _inst = vwInstellingen;
  vwInstellingen = function () {
    const w = inst("nateRust", "rechts");
    const blok = `<div class="veld"><span class="labeltekst">Nate in ruststand</span>
      <div class="segment" role="group" aria-label="Nate in ruststand">${[["rechts", "Rechts"], ["links", "Links"], ["uit", "Verborgen"]].map(([k, n]) => `<button data-kv-rust="${k}" aria-pressed="${w === k}">${n}</button>`).join("")}</div>
      <p class="klein">Verborgen: je opent Nate via het berichtenknopje bovenin.</p></div>`;
    return _inst.apply(this, arguments).replace('<ul class="schakels"><li class="schakel"><span class="tekst"><b>Klein idee voor vandaag', blok + '<ul class="schakels"><li class="schakel"><span class="tekst"><b>Klein idee voor vandaag');
  };
}
document.addEventListener("click", async e => {
  const b = e.target.closest && e.target.closest("[data-kv-rust]"); if (!b) return;
  e.preventDefault(); e.stopImmediatePropagation();
  await zetInst("nateRust", b.dataset.kvRust); kvNateRust(); teken();
}, true);
kvNateRust();

/* ---------- 8. Toasts: tik om weg te halen; met een knop langer zichtbaar ---------- */
{
  const _toast = toast;
  toast = function (tekst, actieLabel, actieFn, ms) { return _toast.call(this, tekst, actieLabel, actieFn, ms || (actieLabel ? 7000 : 2800)); };
  const el = document.getElementById("toast");
  if (el) el.addEventListener("click", e => { if (!e.target.closest("button")) el.classList.remove("zicht"); });
}

/* ---------- 9. Meer: Dagoverzicht valt weg (Mijn dag is je dag in één oogopslag) ---------- */
{
  const ook = NV_MEER[1][1], i = ook.findIndex(r => r[0] === "welkom");
  if (i >= 0) ook.splice(i, 1);
  const ov = ook.find(r => r[0] === "overzicht"); if (ov) ov[3] = "Week, maand en vooruitblik";
}

/* ---------- 10. Profielrapport: microstap met knoppen naar de module ---------- */
{
  const _ms = knMicrostapHTML;
  knMicrostapHTML = function (d, dim) {
    let h = _ms.apply(this, arguments);
    if (!dim) return h;
    const q1 = knVraag(dim.id + ".Q1");
    const knoppen = (q1.app_module_ids || []).slice(0, 3).filter(m => KV_MODULE_VIEW[m] && NATE_VRAGENBANK.modules[m])
      .map(m => KV_MODULE_VIEW[m] === "vg" ? `<button class="knop rand kv-module" data-act="vg-open">${esc(NATE_VRAGENBANK.modules[m])}</button>`
        : `<button class="knop rand kv-module" data-act="ga" data-view="${KV_MODULE_VIEW[m]}">${esc(NATE_VRAGENBANK.modules[m])}</button>`);
    if (knoppen.length) h = h.replace(/<p class="klein">Past bij: [^<]*<\/p>/, `<div class="kv-modules"><span class="klein">Probeer het in:</span>${knoppen.join("")}</div>`);
    return h;
  };
}

/* ---------- 13. Voortgang: "weer opgepakt" bovenaan (geen streak als hoofdgetal) ---------- */
function kvHervatHTML() {
  const dagen = S.gebeurtenissen.map(g => g.datum || (g.ts || "").slice(0, 10)).filter(Boolean);
  const h = kvHervat(dagen, vandaagISO(), 90);
  if (!h.laatste) return "";
  const wanneer = h.laatste.dagenGeleden === 0 ? "vandaag" : h.laatste.dagenGeleden === 1 ? "gisteren" : `${h.laatste.dagenGeleden} dagen geleden`;
  return `<section class="vg-kaart kv-hervat"><b>Weer opgepakt</b>
    <p>${h.aantal ? `${h.aantal} ${h.aantal === 1 ? "keer" : "keer"} in de laatste 90 dagen. ` : ""}Laatst ${wanneer}, na ${h.laatste.na} dagen pauze.</p>
    <p class="klein">Na een pauze weer beginnen telt zwaarder dan een reeks zonder gaten.</p></section>`;
}
{
  const _ov = vgOverzicht;
  vgOverzicht = function () { return kvHervatHTML() + _ov.apply(this, arguments); };
}

/* ---------- 15. Eén naamgeving in Vastleggen (Toolbox → Hulpmiddelen) ---------- */
{
  const _stapel = nwlStapelHTML;
  nwlStapelHTML = function () { return _stapel.apply(this, arguments).split(">Toolbox<").join(">Hulpmiddelen<"); };
  const _paneel = nwlPaneelHTML;
  nwlPaneelHTML = function () { return _paneel.apply(this, arguments).split("<b>Toolbox</b>").join("<b>Hulpmiddelen</b>").split("Statistieken · Toolbox").join("Statistieken · Hulpmiddelen"); };
}
