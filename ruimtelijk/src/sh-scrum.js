"use strict";
/* ==========================================================================
   56. Side Hustle — SCRUM
   Vier weergaven: Bord (kolommen met WIP-limiet), Backlog (productdoel,
   MoSCoW, Definition of Ready), Sprint (plannen, burndown, afronden met
   review en retro, velocity) en Ritme (daily, DoR/DoD, verbeterpunten).
   Kaarten en checklist zijn gekoppeld: een kaart naar Klaar vinkt het
   checklistpunt af en andersom (shKaartNaarRol, shMaakKaartVanCheck).
   ========================================================================== */
const SH_MOSCOW = { M: ["Must", "var(--red)"], S: ["Should", "var(--amber)"], C: ["Could", "var(--accent)"], W: ["Won't", "var(--faint)"] };
const SH_PUNTEN = [1, 2, 3, 5, 8, 13];
const shKolommen = h => shVan("sh_kolommen", h.id).filter(k => !k.gearchiveerd).sort((a, b) => a.volgorde - b.volgorde);
const shKolomRol = (h, rol) => shKolommen(h).find(k => k.rol === rol);
const shKaarten = h => shVan("sh_kaarten", h.id).filter(k => !k.gearchiveerd);
const shActieveSprint = h => S.sh_sprints.find(s => s.shId === h.id && s.status === "actief") || null;
const shSprints = h => S.sh_sprints.filter(s => s.shId === h.id).sort((a, b) => (a.nummer || 0) - (b.nummer || 0));
const shIsKlaar = (h, k) => { const kol = vind("sh_kolommen", k.kolomId); return !!kol && kol.rol === "klaar"; };
function shVelocity(h) {
  const r = shSprints(h).filter(s => s.status === "afgerond").slice(-3);
  return r.length ? Math.round(r.reduce((a, s) => a + (s.afPunten || 0), 0) / r.length) : null;
}
/** Definition of Ready: automatisch te controleren punten. */
function shKaartReady(h, k) {
  const dor = h.dor || SH_DOR, uit = [];
  dor.forEach(t => {
    let ok = null;
    if (/titel/i.test(t)) ok = String(k.titel || "").trim().length >= 4;
    else if (/omschrijving/i.test(t)) ok = !!String(k.omschrijving || "").trim() || !!(k.story && k.story.wil);
    else if (/punten|geschat/i.test(t)) ok = k.punten != null;
    else if (/acceptatie/i.test(t)) ok = (k.acceptatie || []).some(a => String(a.tekst || a).trim());
    else ok = !!(k.dorVink || {})[t];
    uit.push({ t, ok });
  });
  return { items: uit, ready: uit.every(x => x.ok) };
}
function shKaartLog(k, tekst) { (k.activiteit || (k.activiteit = [])).push({ ts: shNu(), tekst }); if (k.activiteit.length > 40) k.activiteit.shift(); }
/** Burndown: resterende punten van de actieve sprint vastleggen voor vandaag. */
function shBurndownNoteer(h) {
  const sp = shActieveSprint(h); if (!sp) return null;
  const kaarten = shKaarten(h).filter(k => k.sprintId === sp.id);
  const rest = kaarten.filter(k => !shIsKlaar(h, k)).reduce((a, k) => a + (k.punten || 0), 0);
  sp.bd = sp.bd || {}; sp.bd[vandaagISO()] = rest; sp.punten = kaarten.reduce((a, k) => a + (k.punten || 0), 0);
  return sp;
}

/* ---------- Kaart verplaatsen (ook vanuit de checklist) ---------- */
async function shKaartVerplaats(k, kolomId, stil) {
  const h = shH(k.shId), van = vind("sh_kolommen", k.kolomId), naar = vind("sh_kolommen", kolomId);
  if (!h || !naar || k.kolomId === kolomId) return;
  k.kolomId = kolomId;
  if (naar.rol === "klaar") k.klaarOp = shNu(); else k.klaarOp = null;
  shKaartLog(k, `Van ${van ? van.naam : "?"} naar ${naar.naam}`);
  const ops = [["sh_kaarten", k]];
  const sp = shBurndownNoteer(h); if (sp) ops.push(["sh_sprints", sp]);
  await shBewaarVeel(ops);
  // Gekoppeld checklistpunt meenemen (niet als de wijziging juist uit de checklist kwam)
  if (!stil && k.koppelingen && k.koppelingen.checkId) {
    const c = vind("sh_checks", k.koppelingen.checkId);
    if (c) {
      if (naar.rol === "klaar" && c.status !== "klaar") await shCheckZetStatus(c, "klaar");
      else if (naar.rol !== "klaar" && van && van.rol === "klaar" && c.status === "klaar") await shCheckZetStatus(c, "open");
    }
  }
  if (naar.rol === "klaar" && !stil) {
    const dod = h.dod || SH_DOD, af = (k.dodVink || {});
    if (dod.some(t => !af[t])) toast("Klaar · de Definition of Done is nog niet helemaal afgevinkt", "Bekijken", () => shKaartBlad(k.id), 6000);
    else toast("Klaar", "Ongedaan", async () => { await shKaartVerplaats(k, van.id); teken(); });
  }
}
async function shKaartNaarRol(kaartId, rol, stil) {
  const k = vind("sh_kaarten", kaartId); if (!k) return;
  const kol = shKolomRol(shH(k.shId), rol); if (!kol) return;
  await shKaartVerplaats(k, kol.id, stil);
}
async function shMaakKaartVanCheck(checkId) {
  const c = vind("sh_checks", checkId); if (!c) return;
  const h = shH(c.shId); if (!h) return;
  if (c.kaartId && vind("sh_kaarten", c.kaartId)) { toast("Er is al een kaart voor dit punt", "Openen", () => shKaartBlad(c.kaartId)); return; }
  const kol = shKolomRol(h, "backlog") || shKolommen(h)[0];
  const k = shNieuweKaart(h, kol.id, { titel: shCheckTitel(c), omschrijving: c.notitie || "", deadline: c.deadline || null,
    moscow: { hoog: "M", middel: "S", laag: "C" }[c.prioriteit] || "S", labels: [c.categorie], koppelingen: { checkId: c.id } });
  shKaartLog(k, "Gemaakt vanuit de checklist");
  c.kaartId = k.id;
  await shBewaarVeel([["sh_kaarten", k], ["sh_checks", c]]);
  teken();
  toast("Kaart op je backlog gezet", "Naar SCRUM", async () => { h.laatsteTab = "scrum"; V.shSc = "backlog"; await bewaar("sh_hustles", h); ga("sh", h.id); });
}
function shNieuweKaart(h, kolomId, o) {
  return Object.assign({
    id: uid(), shId: h.id, kolomId, sprintId: null, titel: "", omschrijving: "", story: { als: "", wil: "", zodat: "" }, acceptatie: [], punten: null,
    moscow: "S", labels: [], pijler: null, start: null, deadline: null, subtaken: [], omslag: {}, koppelingen: {}, blokkeertDoor: [],
    activiteit: [], gearchiveerd: false, volgorde: Date.now(), gemaakt: shNu(), dodVink: {}, dorVink: {}
  }, o || {});
}

/* ---------- Tabblad ---------- */
function vwShScrum(h) {
  const w = V.shSc || "bord";
  const sp = shActieveSprint(h);
  let u = `<div class="segment vier sh-sc-seg" role="tablist">${[["bord", "Bord"], ["backlog", "Backlog"], ["sprint", "Sprint"], ["ritme", "Ritme"]].map(([k, n]) =>
    `<button data-sh="sc-weergave" data-w="${k}" aria-pressed="${w === k}">${n}</button>`).join("")}</div>`;
  if (sp) {
    const vg = shSprintVoortgang(h), dagen = Math.max(0, dagVerschil(sp.eind, vandaagISO()));
    u += `<button class="card card-pad sh-sc-sprintbalk" data-sh="sc-weergave" data-w="sprint">
      <div class="sh-vg-rij"><b>Sprint ${sp.nummer}${sp.doel ? " · " + esc(mmbKortTekst(sp.doel, 44)) : ""}</b><span>${dagen === 0 ? "laatste dag" : dagen + " dag" + (dagen === 1 ? "" : "en") + " te gaan"}</span></div>
      <div class="balk" style="height:8px"><i style="width:${vg ? vg.pct : 0}%;background:var(--sh)"></i></div>
      <span class="klein">${vg ? `${vg.af} van ${vg.tot} punten klaar` : ""}</span></button>`;
  }
  u += { bord: shScBord, backlog: shScBacklog, sprint: shScSprint, ritme: shScRitme }[w](h, sp);
  return u;
}
const mmbKortTekst = (t, n) => { t = String(t || "").replace(/\s+/g, " ").trim(); return t.length > n ? t.slice(0, n - 1) + "…" : t; };
function shKaartKlein(h, k, o) {
  o = o || {};
  const m = SH_MOSCOW[k.moscow] || SH_MOSCOW.S, sub = k.subtaken || [], v = vandaagISO();
  const laat = k.deadline && k.deadline < v && !shIsKlaar(h, k);
  const kols = shKolommen(h), i = kols.findIndex(x => x.id === k.kolomId);
  return `<div class="sh-sc-kaart${shIsKlaar(h, k) ? " klaar" : ""}" style="--mk:${m[1]}">
    <button class="sh-sc-kaart-hoofd" data-sh="sc-kaart" data-id="${k.id}">
      <span class="sh-sc-titel">${esc(k.titel || "Zonder titel")}</span>
      <span class="sh-sc-meta">
        <span class="sh-sc-moscow">${m[0]}</span>
        ${k.punten != null ? `<span class="sh-sc-pt">${k.punten} pt</span>` : `<span class="sh-sc-pt leeg">? pt</span>`}
        ${sub.length ? `<span>☑ ${sub.filter(s => s.af).length}/${sub.length}</span>` : ""}
        ${k.deadline ? `<span class="${laat ? "laat" : ""}">⏰ ${esc(datumLabel(k.deadline))}</span>` : ""}
        ${k.koppelingen && k.koppelingen.checkId ? `<span title="Gekoppeld aan checklist">✅</span>` : ""}
        ${k.koppelingen && k.koppelingen.experimentId ? `<span title="Gekoppeld aan experiment">🧪</span>` : ""}
        ${o.ready ? (shKaartReady(h, k).ready ? `<span class="sh-sc-ready">ready</span>` : `<span class="sh-sc-ready nee">niet ready</span>`) : ""}
      </span></button>
    ${o.pijlen ? `<span class="sh-sc-pijlen">
      <button data-sh="sc-schuif" data-id="${k.id}" data-d="-1" aria-label="Naar vorige kolom"${i <= 0 ? " disabled" : ""}>${ico("pijll", "width:15px;height:15px")}</button>
      <button data-sh="sc-schuif" data-id="${k.id}" data-d="1" aria-label="Naar volgende kolom"${i >= kols.length - 1 ? " disabled" : ""}>${ico("pijlr", "width:15px;height:15px")}</button></span>` : ""}
  </div>`;
}
function shScBord(h, sp) {
  const f = V.shScBord || (sp ? "sprint" : "alles");
  let kols = shKolommen(h), kaarten = shKaarten(h);
  if (f === "sprint" && sp) { kaarten = kaarten.filter(k => k.sprintId === sp.id); kols = kols.filter(k => !["idee", "backlog"].includes(k.rol)); }
  let u = `<div class="sh-sub">${sp ? `<button data-sh="sc-bordf" data-f="sprint" aria-pressed="${f === "sprint"}">Deze sprint</button>` : ""}<button data-sh="sc-bordf" data-f="alles" aria-pressed="${f === "alles" || !sp}">Alles</button>
    <span class="sh-subscheid"></span><button data-sh="sc-kaart-nieuw">${ico("plus", "width:14px;height:14px")} Kaart</button></div>`;
  u += `<div class="sh-sc-bord" role="list">${kols.map(kol => {
    const r = kaarten.filter(k => k.kolomId === kol.id).sort((a, b) => (a.volgorde || 0) - (b.volgorde || 0));
    const over = kol.wip > 0 && r.length > kol.wip;
    const toon = kol.rol === "klaar" ? r.slice(-12) : r;
    return `<section class="sh-sc-kolom" role="listitem" style="--kk:${kol.kleur || "var(--line2)"}">
      <div class="sh-sc-kolkop"><b>${esc(kol.naam)}</b><span class="${over ? "over" : ""}">${r.length}${kol.wip ? "/" + kol.wip : ""}</span></div>
      ${over ? `<div class="sh-sc-wip">Te veel tegelijk. Maak eerst iets af.</div>` : ""}
      <div class="sh-sc-lijst">${toon.map(k => shKaartKlein(h, k, { pijlen: true })).join("") || `<div class="klein sh-sc-leeg">Leeg</div>`}</div>
      ${kol.rol === "klaar" && r.length > 12 ? `<div class="klein" style="padding:4px 8px">+ ${r.length - 12} eerder</div>` : ""}
      <input class="invoer sh-sc-snel" data-sc-snel="${kol.id}" placeholder="+ Kaart" enterkeyhint="done" aria-label="Nieuwe kaart in ${esc(kol.naam)}">
    </section>`;
  }).join("")}</div>`;
  return u;
}
function shScBacklog(h, sp) {
  const kaarten = shKaarten(h), bl = shKolommen(h).filter(k => k.rol === "idee" || k.rol === "backlog").map(k => k.id);
  const r = kaarten.filter(k => bl.includes(k.kolomId) && !k.sprintId).sort((a, b) => "MSCW".indexOf(a.moscow) - "MSCW".indexOf(b.moscow) || (a.volgorde || 0) - (b.volgorde || 0));
  let u = `<div class="card card-pad sh-sc-doel"><span class="labeltekst">Productdoel</span>
      <textarea class="invoer" id="sc-productdoel" placeholder="Waar werk je de komende maanden naartoe? Bv. 20 betalende klanten voor de zomer." style="min-height:64px">${esc(h.productdoel || "")}</textarea></div>
    <div class="vastleg-box sh-snel"><input id="sc-backlog-snel" type="text" enterkeyhint="done" autocomplete="off" placeholder="Nieuwe kaart op de backlog, bv. Etsy-shop openen" aria-label="Nieuwe kaart">
      <button class="verstuur" data-sh="sc-backlog-snel" aria-label="Toevoegen">${ico("plus")}</button></div>`;
  const pt = r.reduce((a, k) => a + (k.punten || 0), 0), klaar = r.filter(k => shKaartReady(h, k).ready).length;
  u += `<p class="klein">${r.length} kaarten · ${pt} punten geschat · ${klaar} ready${shVelocity(h) != null ? ` · velocity ${shVelocity(h)} punten per sprint` : ""}</p>`;
  if (!r.length) return u + `<div class="card">${leeg("🗂️", "De backlog is leeg", "Zet hier alles wat je zou kunnen doen. Ook vanuit je checklist: tik op een punt en kies ‘Maak kaart’.")}</div>`;
  Object.entries(SH_MOSCOW).forEach(([m, [naam, kl]]) => {
    const g = r.filter(k => (k.moscow || "S") === m); if (!g.length) return;
    u += `<div class="sh-clkop" style="margin-top:14px"><span class="kleurbol" style="background:${kl}"></span><b>${naam}</b><span class="klein">${g.length} · ${g.reduce((a, k) => a + (k.punten || 0), 0)} pt</span></div>
      <div class="sh-sc-bl">${g.map(k => `<div class="sh-sc-blrij">${shKaartKlein(h, k, { ready: true })}
        ${sp ? `<button class="knop klein rand" data-sh="sc-insprint" data-id="${k.id}" aria-label="In sprint ${sp.nummer}">→ Sprint</button>` : ""}</div>`).join("")}</div>`;
  });
  const mcount = r.filter(k => k.moscow === "M").length;
  if (r.length >= 5 && mcount / r.length > .7) u += `<p class="klein" style="margin-top:12px">💡 Bijna alles is Must. Als alles belangrijk is, heb je nog niet gekozen.</p>`;
  return u;
}
function shBurndownSVG(h, sp) {
  const dagen = Math.max(1, dagVerschil(sp.eind, sp.start)), tot = sp.punten || 0, W = 300, H = 130, p = 24;
  const x = d => p + d / dagen * (W - p - 8), y = v => H - p - (tot ? v / tot : 0) * (H - p - 12);
  const bd = sp.bd || {}, pts = []; let laatst = tot;
  for (let d = 0; d <= Math.min(dagen, Math.max(0, dagVerschil(vandaagISO(), sp.start))); d++) {
    const iso = plusDagen(sp.start, d); if (bd[iso] != null) laatst = bd[iso];
    pts.push(`${x(d).toFixed(1)},${y(laatst).toFixed(1)}`);
  }
  return `<svg class="sh-sc-burndown" viewBox="0 0 ${W} ${H}" role="img" aria-label="Burndown: ${laatst} van ${tot} punten over">
    <line x1="${p}" y1="${H - p}" x2="${W - 8}" y2="${H - p}" style="stroke:var(--line2)"/><line x1="${p}" y1="8" x2="${p}" y2="${H - p}" style="stroke:var(--line2)"/>
    <line x1="${x(0)}" y1="${y(tot)}" x2="${x(dagen)}" y2="${y(0)}" style="stroke:var(--faint);stroke-dasharray:4 4"/>
    ${pts.length > 1 ? `<polyline points="${pts.join(" ")}" style="fill:none;stroke:var(--sh);stroke-width:2.5;stroke-linejoin:round;stroke-linecap:round"/>` : ""}
    <text x="${p - 4}" y="${y(tot) + 4}" text-anchor="end" style="fill:var(--muted);font-size:9px">${tot}</text>
    <text x="${x(0)}" y="${H - 8}" text-anchor="start" style="fill:var(--muted);font-size:9px">${esc(mmKortDatum(sp.start))}</text>
    <text x="${x(dagen)}" y="${H - 8}" text-anchor="end" style="fill:var(--muted);font-size:9px">${esc(mmKortDatum(sp.eind))}</text></svg>`;
}
function shVelocitySVG(h) {
  const r = shSprints(h).filter(s => s.status === "afgerond").slice(-8);
  if (!r.length) return "";
  const max = Math.max(1, ...r.map(s => Math.max(s.punten || 0, s.afPunten || 0))), W = 300, H = 110, bw = Math.min(28, (W - 30) / r.length - 8);
  return `<svg class="sh-sc-burndown" viewBox="0 0 ${W} ${H}" role="img" aria-label="Velocity per sprint">
    ${r.map((s, i) => { const xx = 20 + i * ((W - 30) / r.length), hp = (s.punten || 0) / max * (H - 30), ha = (s.afPunten || 0) / max * (H - 30);
      return `<rect x="${xx}" y="${H - 18 - hp}" width="${bw}" height="${hp}" rx="3" style="fill:var(--line)"><title>Gepland ${s.punten || 0}</title></rect>
        <rect x="${xx}" y="${H - 18 - ha}" width="${bw}" height="${ha}" rx="3" style="fill:var(--sh)"><title>Klaar ${s.afPunten || 0}</title></rect>
        <text x="${xx + bw / 2}" y="${H - 5}" text-anchor="middle" style="fill:var(--muted);font-size:9px">S${s.nummer}</text>`; }).join("")}</svg>`;
}
function shScSprint(h, sp) {
  let u = "";
  if (sp) {
    shBurndownNoteer(h);
    const kaarten = shKaarten(h).filter(k => k.sprintId === sp.id), vg = shSprintVoortgang(h);
    u += `<div class="card card-pad"><div class="sh-vg-rij"><b>Sprint ${sp.nummer}</b><span>${esc(mmKortDatum(sp.start))} – ${esc(mmKortDatum(sp.eind))}</span></div>
        ${sp.doel ? `<p style="margin:6px 0 2px"><b>Doel:</b> ${esc(sp.doel)}</p>` : ""}
        ${shBurndownSVG(h, sp)}
        <div class="klein">${vg.af} van ${vg.tot} punten klaar · de stippellijn is het ideale tempo</div></div>`;
    u += sectie("In deze sprint", kaarten.length) + `<div class="sh-sc-bl">${kaarten.map(k => shKaartKlein(h, k, { pijlen: true })).join("") || `<div class="card">${leeg("🗂️", "Nog geen kaarten", "Zet kaarten vanuit de backlog in deze sprint.")}</div>`}</div>
      <div class="knoprij" style="margin-top:12px"><button class="knop rand" data-sh="sc-weergave" data-w="backlog">${ico("plus")} Kaarten toevoegen</button>
      <button class="knop primair" data-sh="sc-sprint-af">${ico("check")} Sprint afronden</button></div>`;
  } else {
    const v = shVelocity(h);
    u += `<div class="card">${leeg("🏃", "Geen sprint bezig", `Een sprint duurt ${h.sprintWeken || 1} ${(h.sprintWeken || 1) === 1 ? "week" : "weken"} met één doel.${v != null ? " Je haalde gemiddeld " + v + " punten per sprint." : ""}`)}
      <div style="padding:0 14px 16px"><button class="knop breed primair" data-sh="sc-sprint-plan">${ico("plus")} Sprint plannen</button></div></div>`;
  }
  const oud = shSprints(h).filter(s => s.status === "afgerond").reverse();
  if (oud.length) {
    u += sectie("Velocity", shVelocity(h) != null ? "gem. " + shVelocity(h) + " pt" : null) + `<div class="card card-pad">${shVelocitySVG(h)}<div class="klein">Grijs = gepland, kleur = klaar. Plan niet meer dan je gemiddeld haalt.</div></div>`;
    u += sectie("Eerdere sprints", oud.length) + `<div class="card">${oud.map(s => `<button class="rijknop" data-sh="sc-sprint-oud" data-id="${s.id}">
      <span class="sh-th-em">🏁</span><span class="nm"><b>Sprint ${s.nummer}${s.doel ? " · " + esc(mmbKortTekst(s.doel, 40)) : ""}</b><span class="klein" style="display:block">${esc(mmKortDatum(s.start))} – ${esc(mmKortDatum(s.eind))} · ${s.afPunten || 0}/${s.punten || 0} pt${s.doelGehaald ? " · doel gehaald" : ""}</span></span>
      ${ico("pijlr", "width:16px;height:16px;color:var(--line2)")}</button>`).join("")}</div>`;
  }
  return u;
}
function shScRitme(h, sp) {
  const v = vandaagISO(), dl = (h.dailies || []).slice().sort((a, b) => a.datum < b.datum ? 1 : -1);
  const vandaag = dl.find(d => d.datum === v);
  let u = sectie("Daily", vandaag ? "gedaan" : null) + `<div class="card card-pad">
      ${vandaag ? `<p style="margin:0 0 4px"><b>Vandaag</b></p><div class="sh-sc-daily">${shDailyHTML(vandaag)}</div><button class="knop klein rand" data-sh="sc-daily" style="margin-top:8px">${ico("pen")} Aanpassen</button>`
        : `<p class="klein" style="margin:0 0 10px">Twee minuten op je werkdagen: wat deed ik, wat ga ik doen, wat houdt me tegen?</p><button class="knop breed primair" data-sh="sc-daily">${ico("pen")} Daily invullen</button>`}</div>`;
  const eerder = dl.filter(d => d.datum !== v).slice(0, 5);
  if (eerder.length) u += `<details class="sh-klaarsectie"><summary>Eerdere dailies (${eerder.length})</summary><div class="card card-pad">${eerder.map(d => `<div class="sh-sc-daily"><b>${esc(datumLabel(d.datum))}</b>${shDailyHTML(d)}</div>`).join("")}</div></details>`;
  const lijstEdit = (k, titel, uitleg) => sectie(titel) + `<div class="card"><div class="klein" style="padding:10px 14px 0">${uitleg}</div>${(h[k] || []).map((t, i) => `<div class="hs-mijlpaal"><span class="tekst" style="padding-left:10px">${esc(t)}</span>
      <button class="icon-btn" data-sh="sc-lijst-weg" data-k="${k}" data-i="${i}" aria-label="Verwijderen">${ico("x")}</button></div>`).join("")}
      <div class="hs-nieuwveld"><input class="invoer" data-sc-lijst="${k}" placeholder="Punt toevoegen…" enterkeyhint="done"><button class="knop klein rand" data-sh="sc-lijst-plus" data-k="${k}">Toevoegen</button></div></div>`;
  u += lijstEdit("dor", "Definition of Ready", "Een kaart gaat pas een sprint in als dit klopt. Titel, omschrijving, punten en acceptatie controleert de app zelf.");
  u += lijstEdit("dod", "Definition of Done", "Een kaart is pas af als dit allemaal klopt. Je vinkt het per kaart af.");
  const laatste = shSprints(h).filter(s => s.status === "afgerond").slice(-1)[0];
  if (laatste && laatste.retro && laatste.retro.probeer) u += sectie("Uit je laatste retro") + `<div class="card card-pad sh-les-punten"><b>Probeer deze sprint:</b><p style="margin:6px 0 0">${esc(laatste.retro.probeer)}</p></div>`;
  u += `<p class="klein" style="margin-top:14px">Sprintlengte, startdag en werkdagen stel je in via ${ico("instel", "width:13px;height:13px;vertical-align:-2px")} Instellingen van deze side hustle.</p>`;
  return u;
}
function shDailyHTML(d) {
  return [["gedaan", "Gedaan"], ["plan", "Plan"], ["blokkade", "Blokkade"]].filter(([k]) => d[k]).map(([k, n]) => `<p><span class="klein">${n}</span> ${esc(d[k])}</p>`).join("") || `<p class="klein">Leeg</p>`;
}

/* ---------- Kaart-detail ---------- */
function shKaartBlad(id, kolomId) {
  const h = shH(V.param) || (id && shH((vind("sh_kaarten", id) || {}).shId)); if (!h) return;
  const bestaand = id ? vind("sh_kaarten", id) : null;
  const kols = shKolommen(h);
  const k = bestaand ? JSON.parse(JSON.stringify(bestaand)) : shNieuweKaart(h, kolomId || (shKolomRol(h, "backlog") || kols[0]).id);
  k.story = k.story || { als: "", wil: "", zodat: "" }; k.acceptatie = (k.acceptatie || []).map(a => typeof a === "string" ? { tekst: a, af: false } : a);
  k.subtaken = k.subtaken || []; k.dodVink = k.dodVink || {};
  const sp = shActieveSprint(h), dod = h.dod || SH_DOD;
  const lijst = (naam, items, ph) => `<div class="sh-sc-items" data-lijst="${naam}">${items.map((a, i) => `<div class="sh-sc-item">
      <input type="checkbox" data-it="${naam}" data-i="${i}"${a.af ? " checked" : ""} aria-label="Afvinken"><input class="invoer" data-itt="${naam}" data-i="${i}" value="${esc(a.tekst)}">
      <button class="icon-btn" data-itweg="${naam}" data-i="${i}" aria-label="Verwijderen">${ico("x")}</button></div>`).join("")}
      <button class="knop klein rand" data-itplus="${naam}">+ ${ph}</button></div>`;
  const teken2 = () => {
    const kop = k.koppelingen || {}, c = kop.checkId && vind("sh_checks", kop.checkId), ex = kop.experimentId && vind("sh_experimenten", kop.experimentId);
    $("#bladinhoud").innerHTML = `
      <div class="veld"><label for="sck-titel">Titel</label><input class="invoer" id="sck-titel" value="${esc(k.titel)}" placeholder="Bv. Etsy-shop openen met 5 ontwerpen"></div>
      <div class="veld"><span class="labeltekst">Kolom</span><div class="keuzerij">${kols.map(x => `<button class="keuze" data-sck-kol="${x.id}" aria-pressed="${x.id === k.kolomId}">${esc(x.naam)}</button>`).join("")}</div></div>
      <div class="rij2"><div class="veld"><span class="labeltekst">Prioriteit</span><div class="segment vier">${Object.entries(SH_MOSCOW).map(([m, [n]]) => `<button data-sck-m="${m}" aria-pressed="${k.moscow === m}">${n}</button>`).join("")}</div></div>
        <div class="veld"><label for="sck-dl">Deadline</label><input class="invoer" id="sck-dl" type="date" value="${k.deadline || ""}"></div></div>
      <div class="veld"><span class="labeltekst">Punten (moeite)</span><div class="keuzerij">${SH_PUNTEN.map(n => `<button class="keuze dag" data-sck-pt="${n}" aria-pressed="${k.punten === n}">${n}</button>`).join("")}<button class="keuze" data-sck-pt="" aria-pressed="${k.punten == null}">?</button></div></div>
      ${sp ? `<div class="schakel"><span class="tekst">In sprint ${sp.nummer}<small>${esc(sp.doel || "")}</small></span><button class="toggle" id="sck-sprint" aria-pressed="${k.sprintId === sp.id}" aria-label="In de actieve sprint"></button></div>` : ""}
      <div class="veld"><span class="labeltekst">User story</span>
        <div class="sh-sc-story"><span>Als</span><input class="invoer" id="sck-als" value="${esc(k.story.als)}" placeholder="klant / ik"></div>
        <div class="sh-sc-story"><span>wil ik</span><input class="invoer" id="sck-wil" value="${esc(k.story.wil)}" placeholder="wat"></div>
        <div class="sh-sc-story"><span>zodat</span><input class="invoer" id="sck-zodat" value="${esc(k.story.zodat)}" placeholder="waarom"></div></div>
      <div class="veld"><label for="sck-oms">Omschrijving</label><textarea class="invoer" id="sck-oms" style="min-height:70px">${esc(k.omschrijving || "")}</textarea></div>
      <div class="veld"><span class="labeltekst">Acceptatiecriteria</span>${lijst("acceptatie", k.acceptatie, "Criterium")}</div>
      <div class="veld"><span class="labeltekst">Subtaken</span>${lijst("subtaken", k.subtaken, "Subtaak")}</div>
      <div class="veld"><span class="labeltekst">Definition of Done</span>${dod.map(t => `<label class="sh-sc-item"><input type="checkbox" data-sck-dod="${esc(t)}"${k.dodVink[t] ? " checked" : ""}><span>${esc(t)}</span></label>`).join("")}</div>
      ${c || ex ? `<div class="veld"><span class="labeltekst">Gekoppeld</span>${c ? `<div class="klein">✅ Checklist: ${esc(shCheckTitel(c))} (${SH_STATUS[c.status]})</div>` : ""}${ex ? `<div class="klein">🧪 Experiment: ${esc(ex.hypothese)}</div>` : ""}</div>` : ""}
      ${bestaand && (k.activiteit || []).length ? `<details class="sh-klaarsectie"><summary>Activiteit (${k.activiteit.length})</summary><div class="klein" style="padding:4px 2px">${k.activiteit.slice().reverse().map(a => `<div>${esc(datumLabel(a.ts.slice(0, 10)))} ${esc(a.ts.slice(11, 16))} · ${esc(a.tekst)}</div>`).join("")}</div></details>` : ""}
      ${bestaand ? `<div class="knoprij" style="margin-top:12px"><button class="knop klein rand" id="sck-archief">${ico("download")} Archiveren</button><button class="knop klein gevaar" id="sck-weg">${ico("prullenbak")} Verwijderen</button></div>` : ""}`;
  };
  bladOpen(bestaand ? "Kaart" : "Nieuwe kaart", "", `<button class="knop breed primair" id="sck-ok">${bestaand ? "Opslaan" : "Toevoegen"}</button>`);
  teken2();
  const lees = () => {
    const w = s => { const e = $(s); return e ? e.value : ""; };
    k.titel = w("#sck-titel").trim(); k.omschrijving = w("#sck-oms"); k.deadline = w("#sck-dl") || null;
    k.story = { als: w("#sck-als"), wil: w("#sck-wil"), zodat: w("#sck-zodat") };
    ["acceptatie", "subtaken"].forEach(n => $$(`[data-itt="${n}"]`).forEach(e => { k[n][+e.dataset.i].tekst = e.value; }));
  };
  const inh = $("#bladinhoud");
  inh.addEventListener("click", e => {
    const t = e.target;
    const kol = t.closest("[data-sck-kol]"), m = t.closest("[data-sck-m]"), pt = t.closest("[data-sck-pt]"), plus = t.closest("[data-itplus]"), weg = t.closest("[data-itweg]");
    if (kol) { lees(); k.kolomId = kol.dataset.sckKol; teken2(); }
    else if (m) { lees(); k.moscow = m.dataset.sckM; teken2(); }
    else if (pt) { lees(); k.punten = pt.dataset.sckPt === "" ? null : +pt.dataset.sckPt; teken2(); }
    else if (plus) { lees(); k[plus.dataset.itplus].push({ tekst: "", af: false }); teken2(); const l = $$(`[data-itt="${plus.dataset.itplus}"]`).pop(); if (l) l.focus(); }
    else if (weg) { lees(); k[weg.dataset.itweg].splice(+weg.dataset.i, 1); teken2(); }
    else if (t.closest("#sck-sprint")) { const g = $("#sck-sprint"); g.setAttribute("aria-pressed", String(g.getAttribute("aria-pressed") !== "true")); }
    else if (t.closest("#sck-archief")) { bladSluit(); SH_ACT["sc-archiveer"]({ dataset: { id: k.id } }); }
    else if (t.closest("#sck-weg")) { bevestigVerwijderen(async () => { await shBewaarVeel([["sh_kaarten", null, k.id]]); const c = k.koppelingen && k.koppelingen.checkId && vind("sh_checks", k.koppelingen.checkId); if (c) { c.kaartId = null; await shBewaarVeel([["sh_checks", c]]); } teken(); toast("Kaart verwijderd"); }); }
  });
  inh.addEventListener("change", e => {
    const t = e.target;
    if (t.dataset.it) { lees(); k[t.dataset.it][+t.dataset.i].af = t.checked; }
    if (t.dataset.sckDod != null) k.dodVink[t.dataset.sckDod] = t.checked;
  });
  $("#sck-ok").onclick = async () => {
    lees();
    if (!k.titel) { toast("Geef de kaart een titel"); $("#sck-titel").focus(); return; }
    k.acceptatie = k.acceptatie.filter(a => a.tekst.trim()); k.subtaken = k.subtaken.filter(a => a.tekst.trim());
    const g = $("#sck-sprint");
    if (g && sp) k.sprintId = g.getAttribute("aria-pressed") === "true" ? sp.id : (k.sprintId === sp.id ? null : k.sprintId);
    const nieuweKolom = k.kolomId, oudeKolom = bestaand ? bestaand.kolomId : null;
    if (bestaand) { k.kolomId = oudeKolom; shKaartLog(k, "Bewerkt"); } else shKaartLog(k, "Aangemaakt");
    bladSluit();
    await bewaar("sh_kaarten", k);
    if (bestaand && nieuweKolom !== oudeKolom) await shKaartVerplaats(vind("sh_kaarten", k.id), nieuweKolom);
    const s2 = shBurndownNoteer(h); if (s2) await bewaar("sh_sprints", s2);
    teken(); if (!bestaand) toast("Kaart toegevoegd");
  };
  if (!bestaand) setTimeout(() => { const t = $("#sck-titel"); if (t) t.focus(); }, 280);
}

/* ---------- Sprint plannen en afronden ---------- */
function shSprintPlanBlad(h) {
  const v = vandaagISO(), sd = h.sprintStartdag == null ? 1 : h.sprintStartdag;
  let start = v; for (let i = 0; i < 7 && weekdagVan(start) !== sd; i++) start = plusDagen(start, 1);
  if (dagVerschil(start, v) > 3) start = v;
  const weken = h.sprintWeken || 1, vel = shVelocity(h);
  const bl = shKolommen(h).filter(k => ["idee", "backlog", "sprint"].includes(k.rol)).map(k => k.id);
  const kand = shKaarten(h).filter(k => bl.includes(k.kolomId) && !k.sprintId).sort((a, b) => "MSCW".indexOf(a.moscow) - "MSCW".indexOf(b.moscow));
  const gekozen = new Set(kand.filter(k => vind("sh_kolommen", k.kolomId).rol === "sprint").map(k => k.id));
  bladOpen(`Sprint ${shSprints(h).length + 1} plannen`, `
    <div class="veld"><label for="scp-doel">Sprintdoel</label><input class="invoer" id="scp-doel" placeholder="Wat wil je aan het eind van deze sprint bereikt hebben?"></div>
    <div class="rij2"><div class="veld"><label for="scp-start">Start</label><input class="invoer" type="date" id="scp-start" value="${start}"></div>
      <div class="veld"><label for="scp-weken">Weken</label><select class="invoer" id="scp-weken">${[1, 2, 3, 4].map(n => `<option${n === weken ? " selected" : ""}>${n}</option>`).join("")}</select></div></div>
    <div class="veld"><span class="labeltekst">Kaarten uit de backlog</span><div class="klein" id="scp-som" style="margin-bottom:6px"></div>
      ${kand.length ? `<div class="card">${kand.map(k => { const r = shKaartReady(h, k).ready; return `<label class="sh-sc-item sh-sc-kies"><input type="checkbox" data-scp="${k.id}"${gekozen.has(k.id) ? " checked" : ""}>
        <span class="sh-sc-moscow" style="--mk:${SH_MOSCOW[k.moscow || "S"][1]}">${SH_MOSCOW[k.moscow || "S"][0]}</span><span style="flex:1">${esc(k.titel)}${r ? "" : ` <span class="sh-sc-ready nee">niet ready</span>`}</span><b>${k.punten != null ? k.punten : "?"}</b></label>`; }).join("")}</div>`
        : `<p class="klein">Je backlog is leeg. Je kunt de sprint toch starten en kaarten later toevoegen.</p>`}</div>`,
    `<button class="knop breed primair" id="scp-ok">Sprint starten</button>`);
  const som = () => {
    const pt = [...gekozen].reduce((a, id) => a + ((vind("sh_kaarten", id) || {}).punten || 0), 0);
    $("#scp-som").innerHTML = `${gekozen.size} kaarten · <b>${pt} punten</b>${vel != null ? ` · je velocity is ${vel}${pt > vel * 1.2 ? " — <span style='color:var(--red)'>dit is meer dan je gemiddeld haalt</span>" : ""}` : ""}`;
  };
  $("#bladinhoud").addEventListener("change", e => { const c = e.target.closest("[data-scp]"); if (!c) return; c.checked ? gekozen.add(c.dataset.scp) : gekozen.delete(c.dataset.scp); som(); });
  som();
  $("#scp-ok").onclick = async () => {
    const st = $("#scp-start").value || v, wk = +$("#scp-weken").value || 1;
    const sp = { id: uid(), shId: h.id, nummer: shSprints(h).length + 1, doel: $("#scp-doel").value.trim(), start: st, eind: plusDagen(st, wk * 7 - 1), status: "actief", punten: 0, afPunten: 0, bd: {}, retro: null, review: "", gemaakt: shNu() };
    const kol = shKolomRol(h, "sprint"), ops = [["sh_sprints", sp]];
    [...gekozen].forEach(id => { const k = vind("sh_kaarten", id); if (!k) return; k.sprintId = sp.id; if (kol && ["idee", "backlog"].includes(vind("sh_kolommen", k.kolomId).rol)) k.kolomId = kol.id; shKaartLog(k, `In sprint ${sp.nummer}`); ops.push(["sh_kaarten", k]); });
    await shBewaarVeel(ops);
    const s2 = shBurndownNoteer(h); await bewaar("sh_sprints", s2);
    await logGebeurtenis("sidehustle", `${h.naam}: sprint ${sp.nummer} gestart${sp.doel ? " — " + sp.doel : ""}`, h.id, { shId: h.id });
    bladSluit(); V.shSc = "sprint"; V.shScBord = "sprint"; teken(); toast(`Sprint ${sp.nummer} gestart`);
  };
}
function shSprintAfBlad(h) {
  const sp = shActieveSprint(h); if (!sp) return;
  const kaarten = shKaarten(h).filter(k => k.sprintId === sp.id), klaar = kaarten.filter(k => shIsKlaar(h, k)), open = kaarten.filter(k => !shIsKlaar(h, k));
  bladOpen(`Sprint ${sp.nummer} afronden`, `
    <div class="card card-pad"><b>${klaar.length} van ${kaarten.length} kaarten klaar</b> · ${klaar.reduce((a, k) => a + (k.punten || 0), 0)} van ${kaarten.reduce((a, k) => a + (k.punten || 0), 0)} punten
      ${sp.doel ? `<div class="schakel" style="padding-top:10px"><span class="tekst">Doel gehaald?<small>${esc(sp.doel)}</small></span><button class="toggle" id="sca-doel" aria-pressed="${open.length === 0}" aria-label="Doel gehaald"></button></div>` : ""}</div>
    <div class="veld"><label for="sca-review">Review: wat heb je opgeleverd, en wat vonden klanten ervan?</label><textarea class="invoer" id="sca-review" style="min-height:70px" placeholder="${esc(klaar.map(k => k.titel).slice(0, 4).join(", "))}"></textarea></div>
    <div class="labeltekst" style="margin-top:14px">Retrospective</div>
    <div class="veld"><label for="sca-goed">Wat ging goed?</label><textarea class="invoer" id="sca-goed" style="min-height:56px"></textarea></div>
    <div class="veld"><label for="sca-beter">Wat kan beter?</label><textarea class="invoer" id="sca-beter" style="min-height:56px"></textarea></div>
    <div class="veld"><label for="sca-probeer">Wat probeer je volgende sprint?</label><input class="invoer" id="sca-probeer" placeholder="Eén concrete verbetering"></div>
    ${open.length ? `<div class="veld"><span class="labeltekst">${open.length} kaarten niet af</span><div class="segment"><button data-sca-open="backlog" aria-pressed="true">Terug naar backlog</button><button data-sca-open="mee" aria-pressed="false">Mee naar volgende sprint</button></div></div>` : ""}
    <div class="schakel"><span class="tekst">Afgeronde kaarten archiveren<small>Ze blijven zichtbaar in de sprintgeschiedenis.</small></span><button class="toggle" id="sca-arch" aria-pressed="true" aria-label="Afgeronde kaarten archiveren"></button></div>`,
    `<button class="knop breed primair" id="sca-ok">Sprint afronden</button>`);
  let openKeuze = "backlog";
  $("#bladinhoud").addEventListener("click", e => {
    const tg = e.target.closest(".toggle"); if (tg) tg.setAttribute("aria-pressed", String(tg.getAttribute("aria-pressed") !== "true"));
    const o = e.target.closest("[data-sca-open]"); if (o) { openKeuze = o.dataset.scaOpen; $$("[data-sca-open]").forEach(x => x.setAttribute("aria-pressed", String(x === o))); }
  });
  $("#sca-ok").onclick = async () => {
    const aan = id => { const e = $(id); return !!e && e.getAttribute("aria-pressed") === "true"; };
    sp.status = "afgerond"; sp.afgerondOp = shNu();
    sp.punten = kaarten.reduce((a, k) => a + (k.punten || 0), 0); sp.afPunten = klaar.reduce((a, k) => a + (k.punten || 0), 0);
    sp.doelGehaald = aan("#sca-doel"); sp.review = $("#sca-review").value.trim();
    sp.retro = { goed: $("#sca-goed").value.trim(), beter: $("#sca-beter").value.trim(), probeer: $("#sca-probeer").value.trim() };
    sp.kaarten = kaarten.map(k => ({ id: k.id, titel: k.titel, punten: k.punten, klaar: shIsKlaar(h, k) }));
    sp.bd = sp.bd || {}; sp.bd[vandaagISO()] = sp.punten - sp.afPunten;
    const ops = [["sh_sprints", sp]], bl = shKolomRol(h, "backlog");
    const arch = aan("#sca-arch");
    klaar.forEach(k => { if (arch) k.gearchiveerd = true; ops.push(["sh_kaarten", k]); });
    open.forEach(k => { if (openKeuze === "backlog") { k.sprintId = null; if (bl) k.kolomId = bl.id; } else k.sprintId = null; shKaartLog(k, `Sprint ${sp.nummer} afgerond, niet af`); ops.push(["sh_kaarten", k]); });
    await shBewaarVeel(ops);
    await logGebeurtenis("sidehustle", `${h.naam}: sprint ${sp.nummer} afgerond · ${sp.afPunten}/${sp.punten} punten`, h.id, { shId: h.id });
    bladSluit(); V.shScBord = "alles"; teken(); tril(12);
    if (typeof rtBurst === "function" && typeof rtAan === "function" && rtAan()) rtBurst(innerWidth / 2, innerHeight * .5, h.kleur);
    toast(`Sprint ${sp.nummer} afgerond · ${sp.afPunten} punten`);
  };
}
function shSprintOudBlad(id) {
  const sp = vind("sh_sprints", id); if (!sp) return;
  const r = sp.retro || {};
  bladOpen(`Sprint ${sp.nummer}`, `
    <p class="klein">${esc(datumLabel(sp.start, true))} – ${esc(datumLabel(sp.eind, true))} · ${sp.afPunten || 0} van ${sp.punten || 0} punten${sp.doelGehaald ? " · doel gehaald" : ""}</p>
    ${sp.doel ? `<p><b>Doel:</b> ${esc(sp.doel)}</p>` : ""}
    ${(sp.kaarten || []).length ? `<div class="card">${sp.kaarten.map(k => `<div class="hs-mijlpaal${k.klaar ? " af" : ""}"><span class="tekst" style="padding-left:10px">${k.klaar ? "✓ " : ""}${esc(k.titel)}</span><span class="klein">${k.punten != null ? k.punten + " pt" : ""}</span></div>`).join("")}</div>` : ""}
    ${sp.review ? `<div class="veld"><span class="labeltekst">Review</span><p>${esc(sp.review)}</p></div>` : ""}
    ${r.goed || r.beter || r.probeer ? `<div class="veld"><span class="labeltekst">Retro</span>${r.goed ? `<p><b>Goed:</b> ${esc(r.goed)}</p>` : ""}${r.beter ? `<p><b>Beter:</b> ${esc(r.beter)}</p>` : ""}${r.probeer ? `<p><b>Probeer:</b> ${esc(r.probeer)}</p>` : ""}</div>` : ""}`);
}
function shDailyBlad(h) {
  const v = vandaagISO(), d = (h.dailies || []).find(x => x.datum === v) || { datum: v, gedaan: "", plan: "", blokkade: "" };
  const sp = shActieveSprint(h), bezig = sp ? shKaarten(h).filter(k => k.sprintId === sp.id && !shIsKlaar(h, k)).map(k => k.titel) : [];
  bladOpen("Daily · " + datumLabel(v), `
    <div class="veld"><label for="scd-gedaan">Wat deed ik sinds de vorige keer?</label><textarea class="invoer" id="scd-gedaan" style="min-height:60px">${esc(d.gedaan)}</textarea></div>
    <div class="veld"><label for="scd-plan">Wat ga ik nu doen?</label><textarea class="invoer" id="scd-plan" style="min-height:60px" placeholder="${esc(bezig.slice(0, 2).join(", "))}">${esc(d.plan)}</textarea></div>
    <div class="veld"><label for="scd-blok">Wat houdt me tegen?</label><input class="invoer" id="scd-blok" value="${esc(d.blokkade)}" placeholder="Niets? Laat leeg."></div>`,
    `<button class="knop breed primair" id="scd-ok">Opslaan</button>`);
  $("#scd-ok").onclick = async () => {
    d.gedaan = $("#scd-gedaan").value.trim(); d.plan = $("#scd-plan").value.trim(); d.blokkade = $("#scd-blok").value.trim();
    h.dailies = (h.dailies || []).filter(x => x.datum !== v).concat([d]).slice(-60);
    await bewaar("sh_hustles", h); bladSluit(); teken(); toast("Daily bewaard");
  };
}

/* ---------- Acties ---------- */
async function shSnelKaart(h, kolomId, titel) {
  titel = (titel || "").trim(); if (!titel) return;
  const sp = shActieveSprint(h), kol = vind("sh_kolommen", kolomId);
  const k = shNieuweKaart(h, kolomId, { titel, sprintId: sp && kol && !["idee", "backlog"].includes(kol.rol) ? sp.id : null });
  shKaartLog(k, "Aangemaakt");
  await bewaar("sh_kaarten", k);
  const s2 = shBurndownNoteer(h); if (s2) await bewaar("sh_sprints", s2);
  teken();
}
Object.assign(SH_ACT, {
  "sc-weergave": el => { V.shSc = el.dataset.w; teken(); },
  "sc-bordf": el => { V.shScBord = el.dataset.f; teken(); },
  "sc-kaart": el => shKaartBlad(el.dataset.id),
  "sc-kaart-nieuw": () => shKaartBlad(null),
  "sc-schuif": async el => {
    const k = vind("sh_kaarten", el.dataset.id); if (!k) return;
    const kols = shKolommen(shH(k.shId)), i = kols.findIndex(x => x.id === k.kolomId), naar = kols[i + (+el.dataset.d)];
    if (!naar) return;
    if (naar.wip > 0 && shKaarten(shH(k.shId)).filter(x => x.kolomId === naar.id).length >= naar.wip) toast(`${naar.naam} zit vol (WIP ${naar.wip}). Maak eerst iets af.`);
    await shKaartVerplaats(k, naar.id); tril(6); teken();
  },
  "sc-insprint": async el => {
    const k = vind("sh_kaarten", el.dataset.id), h = k && shH(k.shId), sp = h && shActieveSprint(h); if (!sp) return;
    k.sprintId = sp.id; const kol = shKolomRol(h, "sprint"); if (kol) k.kolomId = kol.id; shKaartLog(k, `In sprint ${sp.nummer}`);
    await bewaar("sh_kaarten", k); const s2 = shBurndownNoteer(h); await bewaar("sh_sprints", s2); teken(); toast(`In sprint ${sp.nummer}`);
  },
  "sc-archiveer": async el => { const k = vind("sh_kaarten", el.dataset.id); if (!k) return; k.gearchiveerd = true; await bewaar("sh_kaarten", k); teken(); toast("Kaart gearchiveerd", "Ongedaan", async () => { k.gearchiveerd = false; await bewaar("sh_kaarten", k); teken(); }); },
  "sc-backlog-snel": async () => { const h = shH(V.param), i = $("#sc-backlog-snel"); if (!h || !i) return; const kol = shKolomRol(h, "backlog") || shKolommen(h)[0]; await shSnelKaart(h, kol.id, i.value); const n = $("#sc-backlog-snel"); if (n) n.focus(); },
  "sc-sprint-plan": () => { const h = shH(V.param); if (h) shSprintPlanBlad(h); },
  "sc-sprint-af": () => { const h = shH(V.param); if (h) shSprintAfBlad(h); },
  "sc-sprint-oud": el => shSprintOudBlad(el.dataset.id),
  "sc-daily": () => { const h = shH(V.param); if (h) shDailyBlad(h); },
  "sc-lijst-plus": async el => {
    const h = shH(V.param), i = $(`[data-sc-lijst="${el.dataset.k}"]`); if (!h || !i || !i.value.trim()) return;
    h[el.dataset.k] = (h[el.dataset.k] || (el.dataset.k === "dor" ? SH_DOR : SH_DOD).slice()).concat([i.value.trim()]); await bewaar("sh_hustles", h); teken();
  },
  "sc-lijst-weg": async el => { const h = shH(V.param); if (!h) return; h[el.dataset.k] = (h[el.dataset.k] || []).filter((_, i) => i !== +el.dataset.i); await bewaar("sh_hustles", h); teken(); }
});
SH_NA.push(() => {
  if (V.view !== "sh") return;
  const h = shH(V.param); if (!h) return;
  $$("[data-sc-snel]").forEach(i => i.onkeydown = async e => { if (e.key !== "Enter") return; e.preventDefault(); const kol = i.dataset.scSnel; await shSnelKaart(h, kol, i.value); const n = $(`[data-sc-snel="${kol}"]`); if (n) n.focus(); });
  const b = $("#sc-backlog-snel"); if (b) b.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); SH_ACT["sc-backlog-snel"](); } };
  $$("[data-sc-lijst]").forEach(i => i.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); SH_ACT["sc-lijst-plus"]({ dataset: { k: i.dataset.scLijst } }); } });
  const pd = $("#sc-productdoel"); if (pd) pd.oninput = () => { clearTimeout(pd._t); pd._t = setTimeout(async () => { h.productdoel = pd.value.trim(); await bewaar("sh_hustles", h); }, 700); };
});
