"use strict";
// === SECTIE 78: HUISHOUDEN – SCHERMEN ===
/* ==========================================================================
   Schermen:
   - huishouden : startpagina met de grote startknop, "aan de beurt", snelle
                  extra's (dobbelsteen, reset), je lijsten, import en cijfers.
                  Na een sessie staat hier bovenaan de samenvatting.
   - hhlijst    : één schoonmaaklijst bewerken (taken, ruimtes, minuten,
                  zwaarte, prioriteit, ritme).
   Onderbladen: sessie klaarzetten (lijst, tijd, energie, voorbeeld van het
   plan), importeren uit Checklists, startlijsten toevoegen.
   ========================================================================== */

V.hh = V.hh || { samenvatting: null };
const HH_TIJDEN = FM_KENNIS.huishouden.tijden;
const HH_PRIO = { moet: ["Moet", "!"], normaal: ["Normaal", ""], bonus: ["Bonus", "+"] };

/* ---------- 78.1 Startpagina ---------- */
function vwHuishouden() {
  const cijfers = hhWeekCijfers(), beurt = hhAanDeBeurt().filter(x => x.te >= .8).slice(0, 3), sj = hhSjablonen();
  const nieuwSj = sj.filter(c => !S.hh_lijsten.some(l => l.bron && l.bron.soort === "checklist" && l.bron.id === c.id));
  let h = `<div class="werk-kop hh-kop" style="--kk:#0e7490">
    <svg class="ill" viewBox="0 0 100 80" aria-hidden="true"><use href="#ill-huishouden"/></svg>
    <div class="ttl">Huishouden</div><div class="sub">Eén klus tegelijk, in de tijd die je hebt</div></div>`;
  if (typeof ndTipKaart === "function") h += ndTipKaart("huishouden");
  if (V.hh.samenvatting) h += hhSamenvattingHTML(vind("hh_sessies", V.hh.samenvatting));
  h += `<button class="hh-start" data-act="hh-klaarzetten">
    <span class="hh-startico" aria-hidden="true">${ico("ster")}</span><span><b>Start een schoonmaaksessie</b><small>Kies een lijst en hoeveel tijd je hebt</small></span>${ico("pijlr")}</button>
    <div class="hh-snel">
      <button class="hh-snelknop" data-act="hh-reset"><span aria-hidden="true">${ico("bliksem")}</span><b>Reset in 5 min</b><small>Vijf dingen, snel resultaat</small></button>
      <button class="hh-snelknop" data-act="hh-dobbel"><span aria-hidden="true">${ico("dobbel")}</span><b>Gooi een klus</b><small>Eén klus van max. 5 min</small></button>
    </div>`;
  if (beurt.length) h += sectie("Aan de beurt") + `<div class="card hh-beurt">${beurt.map(({ l, dagen }) => `<button class="hh-rij" data-act="hh-klaarzetten" data-id="${l.id}">
    <span class="hh-emoji" aria-hidden="true">${l.emoji ? esc(l.emoji) : ico("bezem")}</span><span class="hh-rijt"><b>${esc(l.naam)}</b><small>${dagen == null ? "Nog nooit gedaan" : dagen === 0 ? "Vandaag gedaan" : `${dagen} ${dagen === 1 ? "dag" : "dagen"} geleden · elke ${l.ritme} ${l.ritme === 1 ? "dag" : "dagen"}`}</small></span>
    <span class="hh-mini">Start</span></button>`).join("")}</div>`;
  h += sectie("Mijn lijsten", S.hh_lijsten.length ? String(S.hh_lijsten.length) : "");
  if (!S.hh_lijsten.length) h += `<div class="card card-pad hh-leeg"><p>Nog geen schoonmaaklijsten. Begin met een startlijst, of importeer een checklist-sjablonen die met <b>Schoonmaken</b> begint.</p></div>`;
  else h += `<div class="card hh-lijsten">${S.hh_lijsten.slice().sort((a, b) => a.naam.localeCompare(b.naam)).map(l => { const aan = l.taken.filter(t => !t.uit);
    return `<button class="hh-rij" data-act="ga" data-view="hhlijst" data-param="${l.id}"><span class="hh-emoji" aria-hidden="true">${l.emoji ? esc(l.emoji) : ico("bezem")}</span>
      <span class="hh-rijt"><b>${esc(l.naam)}</b><small>${aan.length} ${aan.length === 1 ? "klus" : "klussen"} · ± ${aan.reduce((s, t) => s + (+t.min || 0), 0)} min${l.bron && l.bron.soort === "checklist" ? " · uit Checklists" : ""}</small></span>${ico("pijlr", "width:16px;height:16px;color:var(--faint)")}</button>`; }).join("")}</div>`;
  h += `<div class="hh-knoppen">
    <button class="knop rand" data-act="hh-import">${ico("sjabloon")} Importeer uit Checklists${nieuwSj.length ? ` <span class="hh-bol">${nieuwSj.length}</span>` : ""}</button>
    <button class="knop rand" data-act="hh-startlijsten">${ico("plus")} Startlijst</button>
    <button class="knop rand" data-act="hh-nieuwelijst">${ico("pen")} Eigen lijst</button></div>`;
  h += sectie("Deze week") + `<div class="hh-cijfers">
    <div class="hh-cijfer"><b>${cijfers.sessies}</b><span>sessies</span></div>
    <div class="hh-cijfer"><b>${cijfers.taken}</b><span>klussen</span></div>
    <div class="hh-cijfer"><b>${cijfers.min}</b><span>minuten</span></div></div>`;
  const geleerd = hhGeleerd();
  if (geleerd.length) h += sectie("Wat de app over jouw tijd leerde") + `<div class="card hh-geleerd">${geleerd.map(g => `<div class="hh-rij stil"><span class="hh-rijt"><b>${esc(g.tekst)}</b><small>geschat ${g.basis} min · duurt bij jou ± ${g.echt} min</small></span><span class="hh-factor ${g.f > 1 ? "langer" : "korter"}">${g.f > 1 ? "+" : "−"}${Math.round(Math.abs(g.f - 1) * 100)}%</span></div>`).join("")}
    <p class="hh-uitleg">De planner gebruikt dit vanzelf. Zo klopt je planning elke keer beter.</p></div>`;
  h += sectie("Extra's") + `<div class="card">
    <div class="veld" style="padding:12px 14px 4px"><label for="hh-luister">Alleen tijdens schoonmaken luister ik naar…</label>
      <input class="invoer" id="hh-luister" value="${esc(inst("hhLuister", ""))}" maxlength="80" placeholder="Bv. die ene podcast of dat luisterboek"></div>
    <p class="hh-uitleg" style="padding:0 14px 8px">Iets leuks dat je alléén tijdens het schoonmaken doet, maakt beginnen makkelijker (temptation bundling).</p>
    <ul class="schakels" style="padding:0 14px 6px">
      <li class="schakel"><span class="tekst"><b>Meewerker Tess</b><small>Een rustige aanwezigheid die af en toe laat weten dat ze meedoet (body doubling).</small></span>
        <button class="toggle" data-act="hh-inst" data-k="hhMeewerker" aria-pressed="${inst("hhMeewerker", true)}" aria-label="Meewerker Tess"></button></li>
      <li class="schakel"><span class="tekst"><b>Geluid en trillen</b><small>Zacht seintje als de tijd om is. Rust en Prikkelarm zetten dit uit.</small></span>
        <button class="toggle" data-act="hh-inst" data-k="hhGeluid" aria-pressed="${inst("hhGeluid", true)}" aria-label="Geluid en trillen"></button></li></ul></div>`;
  h += `<button class="card hh-waaromknop" data-act="ga" data-view="hhwaarom"><span aria-hidden="true">${ico("boek")}</span><span><b>Waarom werkt het zo?</b><small>Onderbouwing, aanpak per richting en bronnen</small></span>${ico("pijlr", "width:16px;height:16px;color:var(--faint)")}</button>`;
  return `<div class="hh">${h}</div>`;
}
function hhGeleerd() {
  const gezien = new Map();
  for (const s of S.hh_sessies) for (const r of s.resultaat || []) if (r.status === "gedaan" && r.soort !== "pauze" && r.tekst && !gezien.has(hhSleutel(r.tekst))) gezien.set(hhSleutel(r.tekst), r);
  return [...gezien.values()].map(r => { const k = hhKalibratie(r.tekst); const basis = Math.round(r.basisMin * (r.delen || 1)) || 1; return { tekst: r.tekst, f: k.factor, n: k.n, basis, echt: Math.max(1, Math.round(basis * k.factor)) }; })
    .filter(g => g.n >= 2 && Math.abs(g.f - 1) >= .15).sort((a, b) => Math.abs(b.f - 1) - Math.abs(a.f - 1)).slice(0, 4);
}

/* ---------- 78.2 Samenvatting na een sessie ---------- */
function hhSamenvattingHTML(s) {
  if (!s) return "";
  const r = (s.resultaat || []).filter(x => x.soort !== "pauze"), gedaan = r.filter(x => x.status === "gedaan"), over = r.filter(x => x.status !== "gedaan");
  const echtMin = Math.round((s.werkSec || 0) / 60), gepland = s.werkMin || 0;
  const verschil = gepland ? Math.round((echtMin - gepland) / gepland * 100) : 0;
  const zin = s.afgebroken ? "Gestopt is ook gedaan. Wat af is, is af." : gedaan.length === r.length ? "Alles gedaan. Kijk even rond: dat heb jij gedaan." : "Mooi werk. Wat bleef staan, schuift door.";
  return `<section class="hh-samen" aria-live="polite">
    <div class="hh-samenkop"><span aria-hidden="true">${ico("ster")}</span><div><b>${s.afgebroken ? "Sessie gestopt" : "Sessie klaar"}</b><small>${esc(s.lijstNaam || "")} · ${esc(datumLabel(s.datum))}</small></div>
      <button class="hh-sluitx" data-act="hh-samen-weg" aria-label="Samenvatting sluiten">${ico("x")}</button></div>
    <p class="hh-zin">${esc(zin)}</p>
    <div class="hh-cijfers">
      <div class="hh-cijfer"><b>${gedaan.length}/${r.length}</b><span>klussen</span></div>
      <div class="hh-cijfer"><b>${echtMin}</b><span>min gewerkt</span></div>
      <div class="hh-cijfer"><b>${gepland ? (verschil > 0 ? "+" : "") + verschil + "%" : "–"}</b><span>t.o.v. gepland</span></div></div>
    <details class="hh-details"><summary>Per klus</summary><ul>${r.map(x => `<li><span>${x.status === "gedaan" ? "✓" : "·"} ${esc(x.tekst)}${x.delen > 1 ? ` (${x.deel}/${x.delen})` : ""}</span><small>${x.status === "gedaan" ? `${Math.max(1, Math.round((x.sec || 0) / 60))} van ${x.min} min` : x.status === "overgeslagen" ? "overgeslagen" : "niet aan toegekomen"}</small></li>`).join("")}</ul></details>
    ${over.length ? `<p class="hh-uitleg">${over.length} ${over.length === 1 ? "klus blijft" : "klussen blijven"} staan voor een volgende keer.</p>` : ""}
    ${gepland && Math.abs(verschil) >= 15 && !s.afgebroken ? `<p class="hh-uitleg">De app past de tijden hierop aan: de volgende planning klopt beter.</p>` : ""}
  </section>`;
}

/* ---------- 78.3 Eén lijst bewerken ---------- */
function vwHhLijst() {
  const l = vind("hh_lijsten", V.param);
  if (!l) return `<div class="card card-pad">Deze lijst bestaat niet meer.</div>`;
  const ruimtes = [...new Set(l.taken.map(t => t.ruimte || "Overal"))];
  let h = `<div class="card card-pad hh-lijstkop">
    <div class="hh-twee"><div class="veld"><label for="hh-l-naam">Naam</label><input class="invoer" id="hh-l-naam" data-hhl="naam" value="${esc(l.naam)}" maxlength="40"></div>
      <div class="veld"><label for="hh-l-emoji">Icoon</label><input class="invoer" id="hh-l-emoji" data-hhl="emoji" value="${esc(l.emoji || "")}" maxlength="4"></div></div>
    <div class="veld"><label for="hh-l-ritme">Hoe vaak?</label><select class="invoer" id="hh-l-ritme" data-hhl="ritme">${[[0, "Geen vast ritme"], [1, "Elke dag"], [2, "Om de dag"], [3, "Elke 3 dagen"], [7, "Elke week"], [14, "Elke 2 weken"], [30, "Elke maand"]].map(([w, n]) => `<option value="${w}"${(+l.ritme || 0) === w ? " selected" : ""}>${n}</option>`).join("")}</select></div>
    ${l.bron && l.bron.soort === "checklist" ? `<p class="hh-uitleg">Geïmporteerd uit het sjabloon “${esc((vind("checklists", l.bron.id) || {}).naam || "verwijderd")}”. <button class="hh-link" data-act="hh-herimport" data-id="${l.id}">Opnieuw inlezen</button></p>` : ""}
    <button class="knop breed primair" data-act="hh-klaarzetten" data-id="${l.id}">${ico("ster")} Start sessie met deze lijst</button></div>`;
  ruimtes.forEach(r => {
    h += sectie(r) + `<div class="card hh-taken">${l.taken.filter(t => (t.ruimte || "Overal") === r).map(t => `<div class="hh-taak${t.uit ? " uit" : ""}">
      <button class="hh-mee" data-act="hh-taak" data-w="uit" data-id="${t.id}" aria-pressed="${!t.uit}" aria-label="${esc(t.tekst)} ${t.uit ? "doet niet mee" : "doet mee"}">${t.uit ? "" : "✓"}</button>
      <span class="hh-taakt"><b>${esc(t.tekst)}</b><small>${["licht", "gemiddeld", "zwaar"][t.zwaar ?? 1]}</small></span>
      <button class="hh-prio p-${t.prio || "normaal"}" data-act="hh-taak" data-w="prio" data-id="${t.id}" aria-label="Prioriteit: ${HH_PRIO[t.prio || "normaal"][0]}, tik om te wisselen">${HH_PRIO[t.prio || "normaal"][0]}</button>
      <span class="hh-min"><button data-act="hh-taak" data-w="min-" data-id="${t.id}" aria-label="Minuut minder">−</button><b>${t.min}′</b><button data-act="hh-taak" data-w="min+" data-id="${t.id}" aria-label="Minuut meer">+</button></span>
      <button class="hh-weg" data-act="hh-taak" data-w="weg" data-id="${t.id}" aria-label="${esc(t.tekst)} verwijderen">${ico("x")}</button></div>`).join("")}</div>`;
  });
  h += `<div class="card card-pad hh-nieuw"><div class="veld"><label for="hh-t-tekst">Klus toevoegen</label><input class="invoer" id="hh-t-tekst" placeholder="Bv. Plinten afnemen (10 min)" enterkeyhint="done"></div>
    <div class="hh-twee"><div class="veld"><label for="hh-t-ruimte">Ruimte</label><input class="invoer" id="hh-t-ruimte" list="hh-ruimtes" value="${esc(ruimtes[ruimtes.length - 1] || "Overal")}"><datalist id="hh-ruimtes">${[...new Set(ruimtes.concat(["Keuken", "Badkamer", "Woonkamer", "Slaapkamer", "Hal", "Overal"]))].map(r => `<option value="${esc(r)}">`).join("")}</datalist></div>
    <button class="knop primair" data-act="hh-taak-plus" data-id="${l.id}" style="align-self:end">${ico("plus")} Toevoegen</button></div></div>
    <button class="knop breed rand gevaar" data-act="hh-lijst-weg" data-id="${l.id}" style="margin-top:14px">${ico("prullenbak")} Lijst verwijderen</button>`;
  return `<div class="hh">${h}</div>`;
}

/* ---------- 78.4 Sessie klaarzetten ---------- */
function hhKlaarzetten(lijstId, gekozenMin, energie) {
  // Energie uit je ochtend-check-in (sectie 80), tenzij je hem hier aanpast.
  if (energie === undefined && typeof dcEnergie === "function") energie = dcEnergie();
  if (!S.hh_lijsten.length) { toast("Voeg eerst een lijst toe"); hhStartlijstenBlad(); return; }
  const lijst = vind("hh_lijsten", lijstId) || hhAanDeBeurt()[0]?.l || S.hh_lijsten[0];
  const a = ndAanpak(), min = gekozenMin || inst("hhLaatsteMin", 30);
  const plan = hhMaakPlan(lijst, min, { energie });
  const inhoud = `
    <div class="veld"><label for="hh-k-lijst">Lijst</label><select class="invoer" id="hh-k-lijst">${S.hh_lijsten.map(l => `<option value="${l.id}"${l.id === lijst.id ? " selected" : ""}>${esc((l.emoji || "") + " " + l.naam)}</option>`).join("")}</select></div>
    <div class="veld"><span class="labeltekst">Hoeveel tijd heb je?</span><div class="keuzerij hh-tijden">${HH_TIJDEN.map(m => `<button class="keuze" data-hhmin="${m}" aria-pressed="${m === min}">${m} min</button>`).join("")}</div></div>
    <div class="veld"><span class="labeltekst">Energie nu${typeof dcEnergie === "function" && dcEnergie() ? " (uit je check-in)" : " (mag leeg)"}</span><div class="keuzerij hh-energie">${[1, 2, 3, 4, 5].map(n => `<button class="keuze" data-hhe="${n}" aria-pressed="${energie === n}" aria-label="Energie ${n} van 5">${typeof DC_ENERGIE === "object" ? DC_ENERGIE[n - 1] : n}</button>`).join("")}</div></div>
    <div class="hh-plan">
      <div class="hh-plankop"><b>Jouw plan</b><small>${plan.items.filter(x => x.soort === "taak").length} kaartjes · ${plan.werkMin} min werk${plan.pauzeMin ? ` · ${plan.pauzeMin} min pauze` : ""} · buffer +${Math.round((plan.buffer - 1) * 100)}%</small></div>
      ${plan.notities.map(n => `<p class="hh-noot">${esc(n)}</p>`).join("")}
      <ol class="hh-planlijst">${plan.items.map(it => it.soort === "pauze" ? `<li class="pauze"><span>Pauze</span><b>${it.min}′</b></li>`
        : `<li><span>${esc(it.tekst)}${it.delen > 1 ? ` <small>${it.deel}/${it.delen}</small>` : ""}<small class="hh-r">${esc(it.ruimte)}</small></span><b>${it.min}′</b></li>`).join("")}</ol>
      ${plan.buiten.length ? `<p class="hh-uitleg">Past nu niet: ${plan.buiten.slice(0, 4).map(t => esc(t.tekst)).join(", ")}${plan.buiten.length > 4 ? ` en nog ${plan.buiten.length - 4}` : ""}. Dat schuift door.</p>` : ""}
      <p class="hh-uitleg">Ingedeeld voor: ${esc((PF_RICHTINGEN[a.richting] || PF_RICHTINGEN.geen).kort.toLowerCase())} · blokken van max. ${a.blokMax} min · pauze na ${a.pauzeElke} min.</p>
    </div>`;
  bladOpen("Schoonmaaksessie", inhoud, `<button class="knop breed primair" id="hh-k-start"${plan.items.length ? "" : " disabled"}>${ico("ster")} Start</button>`);
  const bi = $("#bladinhoud");
  bi.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.hhmin) { zetInst("hhLaatsteMin", +b.dataset.hhmin); hhKlaarzetten($("#hh-k-lijst").value, +b.dataset.hhmin, energie); }
    else if (b.dataset.hhe) hhKlaarzetten($("#hh-k-lijst").value, min, energie === +b.dataset.hhe ? null : +b.dataset.hhe);
  });
  bi.addEventListener("change", e => { if (e.target.id === "hh-k-lijst") hhKlaarzetten(e.target.value, min, energie); });
  $("#hh-k-start").onclick = () => { bladSluit(); hhSessieStart(lijst, plan, { beschikbaar: min, energie }); };
}
/* Snelle varianten: reset in 5 minuten en de dobbelsteen. */
async function hhReset() {
  let l = S.hh_lijsten.find(x => x.bron && x.bron.soort === "start" && x.bron.id === "reset");
  if (!l) { l = hhVanStart(HH_STARTLIJSTEN[0]); await bewaar("hh_lijsten", l); }
  hhKlaarzetten(l.id, 5);
}
function hhDobbel() {
  const alle = S.hh_lijsten.flatMap(l => l.taken.filter(t => !t.uit && (+t.min || 5) <= 5).map(t => ({ l, t })));
  if (!alle.length) { toast("Geen klussen van 5 minuten of minder. Voeg er een toe, of neem een startlijst."); return; }
  const { l, t } = alle[Math.floor(Math.random() * alle.length)];
  if (typeof tril === "function") tril(12);
  const plan = hhMaakPlan({ taken: [t] }, Math.max(5, Math.ceil(t.min * ndAanpak().buffer)), {});
  bladOpen("De dobbelsteen zegt…", `<div class="hh-dobbel"><span class="hh-dobbelsteen" aria-hidden="true">${ico("dobbel")}</span><b>${esc(t.tekst)}</b><small>${esc(t.ruimte || "Overal")} · ${plan.totaal} min · uit ${esc(l.naam)}</small>
    <p class="hh-uitleg">Keuzestress weg: de dobbelsteen kiest, jij hoeft alleen te beginnen.</p></div>`,
    `<div class="knoprij"><button class="knop rand" id="hh-d-nog">Nog een keer</button><button class="knop primair" id="hh-d-start">${ico("ster")} Start</button></div>`);
  $("#hh-d-nog").onclick = hhDobbel;
  $("#hh-d-start").onclick = () => { bladSluit(); hhSessieStart(l, plan, { beschikbaar: plan.totaal, dobbel: true }); };
}

/* ---------- 78.5 Import en startlijsten ---------- */
function hhImportBlad() {
  const sj = hhSjablonen();
  const inhoud = sj.length ? `<p class="hh-uitleg" style="margin-top:0">Alleen checklist-sjablonen waarvan de naam met <b>Schoonmaken</b> begint. Kopjes (# Keuken) worden ruimtes; “(10 min)” wordt de duur; ! betekent moet.</p>
    <div class="hh-importlijst">${sj.map(c => { const al = S.hh_lijsten.find(l => l.bron && l.bron.soort === "checklist" && l.bron.id === c.id); const n = (c.items || []).filter(i => !(typeof clSectie === "function" && clSectie(i))).length;
      return `<button class="hh-rij" data-hhimp="${c.id}"><span class="hh-emoji" aria-hidden="true">${ico("bezem")}</span><span class="hh-rijt"><b>${esc(c.naam)}</b><small>${n} ${n === 1 ? "klus" : "klussen"}${al ? " · staat er al, opnieuw inlezen" : ""}</small></span><span class="hh-mini">${al ? "Bijwerken" : "Importeer"}</span></button>`; }).join("")}</div>`
    : `<p>Er is nog geen checklist-sjabloon dat met <b>Schoonmaken</b> begint.</p><p class="hh-uitleg">Maak er een in Checklists, bijvoorbeeld “Schoonmaken – Keuken”, met kopjes per ruimte. Of maak hier een voorbeeld aan dat je daarna kunt aanpassen.</p>`;
  bladOpen("Importeer uit Checklists", inhoud, sj.length ? "" : `<button class="knop breed primair" id="hh-i-voorbeeld">${ico("sjabloon")} Voorbeeld “Schoonmaken – Keuken” aanmaken</button>`);
  $("#bladinhoud").addEventListener("click", async e => { const b = e.target.closest("[data-hhimp]"); if (!b) return; const l = await hhImporteer(b.dataset.hhimp); if (l) { bladSluit(); ga("hhlijst", l.id); } });
  const vb = $("#hh-i-voorbeeld");
  if (vb) vb.onclick = async () => {
    const s = HH_STARTLIJSTEN[1];
    const c = { id: uid(), naam: "Schoonmaken – Keuken", sjabloon: true, gemaakt: new Date().toISOString(), items: [{ tekst: "# Keuken", af: false }].concat(s.taken.map(([, t, m, p]) => ({ tekst: `${p === "moet" ? "! " : ""}${t} (${m} min)${p === "bonus" ? " (bonus)" : ""}`, af: false }))) };
    await bewaar("checklists", c); toast("Sjabloon staat in Checklists"); hhImportBlad();
  };
}
function hhStartlijstenBlad() {
  bladOpen("Startlijsten", `<p class="hh-uitleg" style="margin-top:0">Een begin dat je daarna helemaal kunt aanpassen.</p>
    <div class="hh-importlijst">${HH_STARTLIJSTEN.map((s, i) => { const al = S.hh_lijsten.some(l => l.bron && l.bron.soort === "start" && l.bron.id === s.sleutel);
      return `<button class="hh-rij" data-hhstart="${i}"${al ? ' aria-disabled="true"' : ""}><span class="hh-emoji" aria-hidden="true">${s.emoji}</span><span class="hh-rijt"><b>${esc(s.naam)}</b><small>${s.taken.length} klussen · ± ${s.taken.reduce((a, t) => a + t[2], 0)} min${al ? " · heb je al" : ""}</small></span><span class="hh-mini">${al ? "✓" : "Toevoegen"}</span></button>`; }).join("")}</div>`);
  $("#bladinhoud").addEventListener("click", async e => {
    const b = e.target.closest("[data-hhstart]"); if (!b || b.getAttribute("aria-disabled") === "true") return;
    const l = hhVanStart(HH_STARTLIJSTEN[+b.dataset.hhstart]); await bewaar("hh_lijsten", l); bladSluit(); toast(`“${l.naam}” toegevoegd`); teken();
  });
}

/* ---------- 78.5b Waarom zo? (uit de kennisbank) ----------
   Alles op dit scherm komt uit FM_KENNIS (kennis/huishouden.json): dezelfde
   bron als de deelbare webpagina. Past iemand de kennisbank aan, dan past
   ook de app zich bij de volgende build aan. */
function vwHhWaarom() {
  const K = FM_KENNIS, r = typeof pfRichting === "function" ? pfRichting() : "geen", f = V.hhWaaromFilter || "alle";
  const bron = nr => K.bronnen.find(b => b.nr === nr);
  const bronLink = nr => { const b = bron(nr); if (!b) return ""; const kort = esc(b.tekst.split(").")[0] + ")"); return b.url ? `<a href="${esc(b.url)}" target="_blank" rel="noopener">${kort}</a>` : kort; };
  const sterktes = [...new Set(K.onderbouwing.map(o => o.sterkte))];
  const lijst = K.onderbouwing.filter(o => f === "alle" || o.sterkte === f);
  const kol = ["blokMax", "pauzeElke", "pauzeMin", "buffer", "volgorde", "maxSessie"];
  const waarde = (k, v) => k === "buffer" ? "+" + Math.round((v - 1) * 100) + "%" : k === "volgorde" ? K.volgordeNamen[v] : v == null ? "—" : v + " min";
  return `<div class="hh hh-waarom">
    <div class="card card-pad"><p class="hh-lead">${esc(K.doel.oplossing)}</p>
      <p class="hh-uitleg">Kennisbank versie ${esc(K.meta.versie)} · ${esc(datumLabel(K.meta.datum))}${K.meta.webpagina ? ` · <a href="${esc(K.meta.webpagina)}" target="_blank" rel="noopener">Open de deelbare webpagina</a>` : ""}</p></div>
    ${sectie("Uitgangspunten")}<div class="card hh-principes">${K.principes.map(([t, u]) => `<div class="hh-rij stil"><span class="hh-rijt"><b>${esc(t)}</b><small>${esc(u)}</small></span></div>`).join("")}</div>
    ${sectie("Aanpak per richting")}<div class="card hh-tabelwrap"><table class="hh-tabel"><thead><tr><th>Richting</th><th>Blok</th><th>Pauze na</th><th>Pauze</th><th>Buffer</th><th>Volgorde</th><th>Max.</th></tr></thead><tbody>
      ${Object.entries(K.aanpak).map(([k, a]) => `<tr${k === r ? ' class="jij"' : ""}><th>${typeof ND_ICO === "object" ? `<span class="vg-g">${ico(ND_ICO[k])}</span>` : K.richtingen[k].ico} ${esc(K.richtingen[k].kort)}${k === r ? " <small>(jij)</small>" : ""}</th>${kol.map(c => `<td>${esc(String(waarde(c, a[c])))}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
    ${sectie("Onderbouwing")}<div class="hh-filters" role="group" aria-label="Filter op sterkte van het bewijs">${[["alle", "Alles"]].concat(sterktes.map(s => [s, K.sterktes[s]])).map(([k, n]) => `<button class="hh-filter" data-act="hh-waarom-filter" data-w="${k}" aria-pressed="${f === k}">${esc(n)}</button>`).join("")}</div>
    <div class="hh-bewijs">${lijst.map(o => `<article class="card hh-bewijskaart"><div class="hh-bewijskop"><b>${esc(o.id)}</b><span class="hh-sterkte s-${o.sterkte}">${esc(K.sterktes[o.sterkte])}</span></div>
      <p>${esc(o.bevinding)}</p><p class="hh-keuze"><b>In de app:</b> ${esc(o.keuze)}</p><p class="hh-uitleg">${esc(o.kanttekening)} · ${bronLink(o.bron)}${o.bron2 ? " · " + bronLink(o.bron2) : ""}</p></article>`).join("")}</div>
    ${sectie("Bronnen")}<ol class="card card-pad hh-bronnen">${K.bronnen.map(b => `<li>${b.url ? `<a href="${esc(b.url)}" target="_blank" rel="noopener">${esc(b.tekst)}</a>` : esc(b.tekst)}</li>`).join("")}</ol>
  </div>`;
}
Object.defineProperty(KOPPEN, "hhwaarom", { get: () => ["Waarom zo?", () => "Onderbouwing uit de kennisbank"], configurable: true, enumerable: true });

/* ---------- 78.6 Tikken ---------- */
async function hhTaakWijzig(l, id, w) {
  const x = JSON.parse(JSON.stringify(l)), t = x.taken.find(t => t.id === id); if (!t) return;
  if (w === "uit") t.uit = !t.uit;
  else if (w === "prio") t.prio = { moet: "normaal", normaal: "bonus", bonus: "moet" }[t.prio || "normaal"];
  else if (w === "min-") t.min = Math.max(1, (+t.min || 1) - 1);
  else if (w === "min+") t.min = Math.min(120, (+t.min || 0) + 1);
  else if (w === "weg") x.taken = x.taken.filter(y => y.id !== id);
  x.bijgewerkt = new Date().toISOString();
  await bewaar("hh_lijsten", x); teken();
}
document.addEventListener("click", async e => {
  const el = e.target.closest && e.target.closest("[data-act^='hh-']");
  if (!el || el.closest("#hh-sessie")) return;
  const a = el.dataset.act, id = el.dataset.id;
  switch (a) {
    case "hh-klaarzetten": hhKlaarzetten(id || null); break;
    case "hh-reset": hhReset(); break;
    case "hh-dobbel": hhDobbel(); break;
    case "hh-import": hhImportBlad(); break;
    case "hh-startlijsten": hhStartlijstenBlad(); break;
    case "hh-nieuwelijst": bladVraag("Nieuwe schoonmaaklijst", "", "Bv. Zaterdagochtend", async naam => { if (!naam) return; const l = { id: uid(), naam, emoji: "🧽", ritme: 7, bron: { soort: "eigen" }, taken: [], gemaakt: new Date().toISOString() }; await bewaar("hh_lijsten", l); ga("hhlijst", l.id); }); break;
    case "hh-samen-weg": V.hh.samenvatting = null; teken(); break;
    case "hh-waarom-filter": V.hhWaaromFilter = el.dataset.w; teken(); break;
    case "hh-inst": await zetInst(el.dataset.k, !inst(el.dataset.k, true)); teken(); break;
    case "hh-taak": { const l = vind("hh_lijsten", V.param); if (l) await hhTaakWijzig(l, id, el.dataset.w); break; }
    case "hh-taak-plus": {
      const l = vind("hh_lijsten", id), tekst0 = ($("#hh-t-tekst").value || "").trim(); if (!l || !tekst0) { toast("Typ eerst een klus"); break; }
      const tekst = tekst0.replace(/\s*\(?\d+\s*(min|m|minuten)\)?\s*$/i, "").trim() || tekst0;
      const x = JSON.parse(JSON.stringify(l)); x.taken.push({ id: uid(), ruimte: ($("#hh-t-ruimte").value || "Overal").trim(), tekst, min: hhSchat(tekst0), zwaar: hhZwaarte(tekst), prio: "normaal", uit: false });
      await bewaar("hh_lijsten", x); teken(); setTimeout(() => { const v = $("#hh-t-tekst"); if (v) v.focus(); }, 60); break;
    }
    case "hh-lijst-weg": { const l = vind("hh_lijsten", id); if (!l) break;
      bevestig("Lijst verwijderen?", `“${esc(l.naam)}” verdwijnt uit Huishouden. Een checklist-sjabloon blijft gewoon in Checklists staan.`, "Verwijderen", async () => { await verwijder("hh_lijsten", id); terug(); toast("Lijst verwijderd"); }); break; }
    case "hh-herimport": { const l = vind("hh_lijsten", id); if (l && l.bron) await hhImporteer(l.bron.id); teken(); break; }
    case "hh-naar-huishouden": { const l = await hhImporteer(id); if (l) ga("hhlijst", l.id); break; }
  }
});
document.addEventListener("change", async e => {
  const t = e.target;
  if (t && t.id === "hh-luister") { await zetInst("hhLuister", t.value.trim()); toast("Opgeslagen"); return; }
  if (!t || !t.dataset || !t.dataset.hhl || V.view !== "hhlijst") return;
  const l = vind("hh_lijsten", V.param); if (!l) return;
  const x = Object.assign({}, l, { [t.dataset.hhl]: t.dataset.hhl === "ritme" ? +t.value : t.value.trim() || l[t.dataset.hhl] });
  await bewaar("hh_lijsten", x); teken();
});
document.addEventListener("keydown", e => { if (e.key === "Enter" && e.target && e.target.id === "hh-t-tekst") { const b = document.querySelector('[data-act="hh-taak-plus"]'); if (b) b.click(); } });

/* ---------- 78.7 Ingangen ---------- */
Object.defineProperty(KOPPEN, "huishouden", { get: () => ["Huishouden", () => { const c = hhWeekCijfers(); return c.sessies ? `Deze week ${c.taken} klussen in ${c.min} min` : "Eén klus tegelijk"; }], configurable: true, enumerable: true });
Object.defineProperty(KOPPEN, "hhlijst", { get: () => { const l = vind("hh_lijsten", V.param); return [l ? l.naam : "Schoonmaaklijst", () => l ? `${l.taken.filter(t => !t.uit).length} klussen` : ""]; }, configurable: true, enumerable: true });
/* Tegel in Persoonlijk, direct voor Notitie en Focussessie. */
{
  const _p = vwPersoonlijk;
  vwPersoonlijk = function () {
    const h = _p.apply(this, arguments);
    const c = hhWeekCijfers(), beurt = hhAanDeBeurt().filter(x => x.te >= 1).length;
    const tegel = catKnop({ view: "huishouden", ill: "huishouden", naam: "Huishouden", uitleg: c.sessies ? `Deze week ${c.taken} klussen` : "Eén klus tegelijk", kleur: "#0e7490", telling: beurt || "" });
    const i = h.indexOf('<button class="startstrip"'), j = i < 0 ? -1 : h.lastIndexOf("</div>", i);
    return j < 0 ? h + tegel : h.slice(0, j) + tegel + h.slice(j);
  };
  const _m = vwMeer;
  vwMeer = function () {
    const h = _m.apply(this, arguments);
    const kaart = `<button class="menu-kaart" data-act="ga" data-view="huishouden">${ico("bezem")}<span class="nm">Huishouden</span><span class="ds">Schoonmaken in behapbare stukjes</span></button>`;
    const i = h.indexOf('data-view="gezondheid"'), j = i < 0 ? -1 : h.indexOf("</button>", i);
    return j < 0 ? h : h.slice(0, j + 9) + kaart + h.slice(j + 9);
  };
}
/* In een checklist-sjabloon dat met "Schoonmaken" begint: knop naar Huishouden. */
RT_NA.push(() => {
  if (V.view !== "checklist") return;
  const c = vind("checklists", V.param);
  if (!hhIsSchoonmaakSjabloon(c) || document.querySelector(".hh-clknop")) return;
  const plek = $("#scherm"); if (!plek) return;
  const al = S.hh_lijsten.some(l => l.bron && l.bron.soort === "checklist" && l.bron.id === c.id);
  plek.insertAdjacentHTML("afterbegin", `<button class="card hh-clknop" data-act="hh-naar-huishouden" data-id="${c.id}"><span aria-hidden="true">${ico("bezem")}</span><span><b>${al ? "Bijwerken in Huishouden" : "Gebruik in Huishouden"}</b><small>Omzetten naar een schoonmaaklijst met tijden en ruimtes</small></span>${ico("pijlr", "width:16px;height:16px")}</button>`);
});
if (typeof TL_SOORTEN === "object") TL_SOORTEN.huishouden = ["Huishouden", "#0e7490"];
if (typeof LOGFILTERS !== "undefined" && Array.isArray(LOGFILTERS)) LOGFILTERS.push(["huishouden", "Huishouden"]);
