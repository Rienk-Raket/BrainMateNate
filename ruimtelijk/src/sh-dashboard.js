"use strict";
/* ==========================================================================
   57. Side Hustle — Dashboard
   Gezondheidsscore (shGezondheid) uit vijf delen: plan, checklist, validatie,
   ritme en geld. Blokken volgen h.dashboardLayout (aan/uit en volgorde via
   "Dashboard aanpassen"). Invoer voor geld, klanten, uren, experimenten en
   eigen KPI's gebeurt hier; alles gaat mee in back-up en mindmap.
   ========================================================================== */
const SH_KLANTFASEN = [["lead", "Lead", "#94a3b8"], ["gesprek", "In gesprek", "#2f6fed"], ["offerte", "Offerte", "#d97706"], ["klant", "Klant", "#16a34a"], ["terugkerend", "Terugkerend", "#7a4fd6"]];
const SH_GELDCAT = { in: ["Verkoop", "Dienst", "Abonnement", "Overig"], uit: ["Materiaal", "Software", "Marketing", "Verzending", "Inschrijving", "Verzekering", "Overig"] };
const shKlantFase = f => SH_KLANTFASEN.find(x => x[0] === f) || SH_KLANTFASEN[0];
const shMaandSom = (h, soort, ym) => shVan("sh_geld", h.id).filter(g => g.soort === soort && g.datum.slice(0, 7) === ym).reduce((a, g) => a + (g.bedrag || 0), 0);
const shYm = (n) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + (n || 0)); return dISO(d).slice(0, 7); };

/* ---------- Gezondheid ---------- */
function shPijlerScores(h) {
  const klanten = shVan("sh_klanten", h.id), exps = shVan("sh_experimenten", h.id);
  const basis = [1, 2, 3, 4, 5].map(i => (((h.pijlers || {})[i] || {}).kwaliteit || 0) / 4 * 7);
  const gesprekken = klanten.filter(k => k.fase !== "lead").length, betalend = klanten.filter(k => k.fase === "klant" || k.fase === "terugkerend").length;
  basis[0] += Math.min(3, gesprekken * .6);
  basis[1] += exps.some(x => x.uitkomst === "bevestigd") ? 3 : exps.length ? 1 : 0;
  basis[2] += Math.min(3, klanten.length * .4);
  basis[3] += shMaandOmzet(h.id, shYm(0)) + shMaandOmzet(h.id, shYm(-1)) > 0 ? 3 : 0;
  basis[4] += Math.min(3, betalend * .6 + (exps.length ? 1 : 0));
  return basis.map(x => Math.round(Math.min(10, x) * 10) / 10);
}
function shGezondheid(h) {
  const v = vandaagISO(), delen = [];
  const pijl = [1, 2, 3, 4, 5].reduce((a, i) => a + (((h.pijlers || {})[i] || {}).kwaliteit || 0), 0) / 20;
  delen.push({ id: "plan", naam: "Plan", score: pijl, uitleg: "Hoe concreet je 5 pijlers zijn" });
  const checks = shVan("sh_checks", h.id).filter(c => c.status !== "nvt");
  const hoog = checks.filter(c => c.prioriteit === "hoog"), laat = checks.filter(c => c.deadline && c.deadline < v && (c.status === "open" || c.status === "bezig")).length;
  const cl = (hoog.length ? hoog.filter(c => c.status === "klaar").length / hoog.length : 1) * .7 + (checks.length ? checks.filter(c => c.status === "klaar").length / checks.length : 0) * .3;
  delen.push({ id: "checklist", naam: "Checklist", score: Math.max(0, cl - laat * .1), uitleg: laat ? `${laat} punt${laat === 1 ? "" : "en"} over de deadline` : "Belangrijke punten afgevinkt" });
  const klanten = shVan("sh_klanten", h.id), exps = shVan("sh_experimenten", h.id);
  const val = Math.min(1, klanten.filter(k => k.fase !== "lead").length / 5) * .5 + (exps.some(x => x.uitkomst !== "open") ? .5 : exps.length ? .2 : 0);
  delen.push({ id: "validatie", naam: "Validatie", score: val, uitleg: "Klantgesprekken en afgeronde experimenten" });
  const uren = shMinuten(h.id, plusDagen(v, -13)) / 60, doel = Math.max(1, (h.urenPerWeek || 6) * 2);
  const ritme = Math.min(1, uren / doel) * .7 + (shActieveSprint(h) ? .2 : 0) + ((h.dailies || []).some(d => d.datum >= plusDagen(v, -6)) ? .1 : 0);
  delen.push({ id: "ritme", naam: "Ritme", score: Math.min(1, ritme), uitleg: `${uren.toFixed(1).replace(".", ",")} van ${doel} uur in 2 weken` });
  const uit = shVan("sh_geld", h.id).filter(g => g.soort === "uit").reduce((a, g) => a + g.bedrag, 0) / 100;
  const inn = shVan("sh_geld", h.id).filter(g => g.soort === "in").reduce((a, g) => a + g.bedrag, 0) / 100;
  const grens = (h.betaalbaarVerlies || {}).euro || 0;
  const verlies = Math.max(0, uit - inn);
  const geld = grens ? Math.max(0, 1 - verlies / grens) * .6 + (shMaandOmzet(h.id, shYm(0)) + shMaandOmzet(h.id, shYm(-1)) > 0 ? .4 : 0) : (inn > 0 ? .7 : .3);
  delen.push({ id: "geld", naam: "Geld", score: Math.min(1, geld), uitleg: grens ? `€ ${Math.round(verlies)} van € ${grens} betaalbaar verlies gebruikt` : "Stel je betaalbaar verlies in" });
  const score = Math.round(delen.reduce((a, d) => a + d.score, 0) / delen.length * 100);
  return { score, delen: delen.map(d => Object.assign(d, { pct: Math.round(d.score * 100) })) };
}

/* ---------- Coach ---------- */
function shCoachTips(h) {
  const v = vandaagISO(), tips = [], g = shGezondheid(h);
  const zwak = SH_PIJLERS.filter(p => (((h.pijlers || {})[p.nr] || {}).kwaliteit || 0) < 2);
  if (zwak.length) tips.push({ em: "🧭", t: `Maak pijler ${zwak[0].nr} (${zwak[0].kort}) concreter`, s: "Getallen, namen en een test maken hem toetsbaar.", act: "mod-open", data: { sj: "sj.scope" }, knop: "Scope openen" });
  const laat = shVan("sh_checks", h.id).filter(c => c.deadline && c.deadline < v && (c.status === "open" || c.status === "bezig"));
  if (laat.length) tips.push({ em: "⏰", t: `${laat.length} checklistpunt${laat.length === 1 ? "" : "en"} over de deadline`, s: shCheckTitel(laat[0]), act: "tab", data: { tab: "checklist" }, knop: "Bekijken" });
  const gesprekken = shVan("sh_klanten", h.id).filter(k => k.fase !== "lead").length;
  if (["idee", "valideren"].includes(h.fase) && gesprekken < 5) tips.push({ em: "💬", t: `Voer nog ${5 - gesprekken} klantgesprek${5 - gesprekken === 1 ? "" : "ken"}`, s: "Vraag naar hun verleden, niet naar je idee.", act: "th-open", data: { les: "momtest", id: h.id }, knop: "Les lezen" });
  const openExp = shVan("sh_experimenten", h.id).filter(x => x.uitkomst === "open");
  const overExp = openExp.filter(x => x.eind && x.eind < v);
  if (overExp.length) tips.push({ em: "🧪", t: "Een experiment is afgelopen", s: `Wat was de uitkomst van “${overExp[0].hypothese}”?`, act: "db-exp", data: { id: overExp[0].id }, knop: "Uitkomst invullen" });
  else if (!openExp.length && h.fase !== "groeien") tips.push({ em: "🧪", t: "Geen experiment bezig", s: "Test je riskantste aanname met de kleinste test.", act: "db-exp-nieuw", data: {}, knop: "Experiment" });
  if (["bouwen", "lanceren", "groeien"].includes(h.fase) && !shActieveSprint(h)) tips.push({ em: "🏃", t: "Plan een sprint", s: "Een vast ritme met één doel houdt je in beweging.", act: "sc-sprint-plan", data: {}, knop: "Sprint plannen" });
  const crm = h.crmDagen || 14;
  const opvolgen = shVan("sh_klanten", h.id).filter(k => ["gesprek", "offerte"].includes(k.fase) && k.laatsteContact && dagVerschil(v, k.laatsteContact) >= crm);
  if (opvolgen.length && (h.meldingen || {}).crm !== false) tips.push({ em: "📞", t: `Neem contact op met ${opvolgen[0].naam}`, s: `Laatste contact ${dagVerschil(v, opvolgen[0].laatsteContact)} dagen geleden.`, act: "db-klant", data: { id: opvolgen[0].id }, knop: "Openen" });
  const gd = g.delen.find(d => d.id === "geld");
  if ((h.betaalbaarVerlies || {}).euro && gd.score < .3) tips.push({ em: "💶", t: "Je nadert je betaalbaar verlies", s: gd.uitleg + ". Tijd om bij te sturen of te stoppen?", act: "th-open", data: { les: "pivot", id: h.id }, knop: "Les lezen" });
  const uren = shMinuten(h.id, plusDagen(v, -6)) / 60;
  if (uren < (h.urenPerWeek || 6) / 3) tips.push({ em: "⏳", t: "Weinig uren deze week", s: `${uren.toFixed(1).replace(".", ",")} van de ${h.urenPerWeek || 6} geplande uren. Plan een vast blok.`, act: "db-uren", data: {}, knop: "Uren loggen" });
  const les = typeof shLesAanbevolen === "function" ? shLesAanbevolen(h)[0] : null;
  if (les && tips.length < 4) tips.push({ em: les.emoji, t: "Les voor je fase: " + les.titel, s: les.kort, act: "th-open", data: { les: les.id, id: h.id }, knop: "Lezen" });
  return tips;
}

/* ---------- Blokken ---------- */
const shDashData = d => Object.entries(d || {}).map(([k, w]) => `data-${k}="${esc(w)}"`).join(" ");
function shBlokHeld(h) {
  const g = shGezondheid(h), tip = (h.meldingen || {}).coach !== false ? shCoachTips(h)[0] : null;
  const hist = (h.scoreHist || []).slice(-30);
  const spark = hist.length > 1 ? (() => { const W = 90, Hh = 26, pts = hist.map((x, i) => `${(i / (hist.length - 1) * W).toFixed(1)},${(Hh - 2 - x.score / 100 * (Hh - 4)).toFixed(1)}`).join(" ");
    return `<svg class="sh-spark" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Score laatste ${hist.length} dagen"><polyline points="${pts}" style="fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;opacity:.9"/></svg>`; })() : "";
  return `<div class="sh-db-held">
    <div class="sh-db-heldrij">${shRing(g.score, 72)}<div style="flex:1;min-width:0"><div class="klein">Gezondheid</div><b>${g.score >= 70 ? "Gaat goed" : g.score >= 40 ? "Op weg" : "Aandacht nodig"}</b><div class="klein">Fase ${shFaseNaam(h.fase)}</div></div>${spark}</div>
    <div class="sh-db-delen">${g.delen.map(d => `<div title="${esc(d.uitleg)}"><span>${d.naam}</span><div class="balk"><i style="width:${d.pct}%"></i></div></div>`).join("")}</div>
    ${tip ? `<button class="sh-db-volgende" data-sh="${tip.act}" ${shDashData(tip.data)}><span>${tip.em}</span><span><b>Volgende stap</b>${esc(tip.t)}</span>${ico("pijlr", "width:16px;height:16px")}</button>` : ""}
    <div class="sh-db-snel">
      <button data-sh="db-geld" data-soort="in">${ico("plus", "width:14px;height:14px")} Inkomst</button><button data-sh="db-geld" data-soort="uit">${ico("plus", "width:14px;height:14px")} Uitgave</button>
      <button data-sh="db-klant">${ico("persoon", "width:14px;height:14px")} Klant</button><button data-sh="db-uren">${ico("tijd", "width:14px;height:14px")} Uren</button></div></div>`;
}
function shBlokTegels(h) {
  const t = SH_TABS.filter(x => x[0] !== "dashboard");
  return `<div class="sh-db-tegels">${t.map(([k, n, i]) => `<button data-sh="tab" data-tab="${k}">${ico(i, "width:20px;height:20px")}<b>${n}</b><span class="klein">${shTabTeller(h, k) || "&nbsp;"}</span></button>`).join("")}</div>`;
}
function shBlokKpi(h) {
  const ym = shYm(0), vm = shYm(-1), v = vandaagISO();
  const inn = shMaandSom(h, "in", ym), uit = shMaandSom(h, "uit", ym), innV = shMaandSom(h, "in", vm);
  const uren = shMinuten(h.id, weekStart(v)) / 60, betalend = shVan("sh_klanten", h.id).filter(k => k.fase === "klant" || k.fase === "terugkerend").length;
  const delta = innV ? Math.round((inn - innV) / innV * 100) : null;
  const tegel = (w, l, sub) => `<div class="stat"><div class="getal">${w}</div><div class="lab">${l}</div>${sub ? `<div class="klein">${sub}</div>` : ""}</div>`;
  return `<div class="stats">${tegel(shEur(inn), "omzet deze maand", delta != null ? (delta >= 0 ? "▲ " : "▼ ") + Math.abs(delta) + "% t.o.v. vorige maand" : "")}
    ${tegel(shEur(inn - uit), "resultaat deze maand", `reserveer ${shEur(Math.max(0, inn - uit) * (h.belastingPct || 30) / 100)} belasting`)}
    ${tegel(uren.toFixed(1).replace(".", ",") + "u", "uren deze week", `doel ${h.urenPerWeek || 6} uur`)}${tegel(betalend, "betalende klanten", "")}</div>`;
}
function shBlokCoach(h) {
  if ((h.meldingen || {}).coach === false) return `<div class="card card-pad klein">De coach staat uit in de instellingen van deze side hustle.</div>`;
  const tips = shCoachTips(h);
  if (!tips.length) return `<div class="card">${leeg("🌟", "Niets dringends", "Je bent goed bezig. Kijk bij Theorie voor verdieping.")}</div>`;
  return `<div class="card">${tips.slice(0, 4).map(t => `<div class="sh-db-tip"><span class="em">${t.em}</span><div style="flex:1;min-width:0"><b>${esc(t.t)}</b><div class="klein">${esc(t.s)}</div></div>
    <button class="knop klein rand" data-sh="${t.act}" ${shDashData(t.data)}>${esc(t.knop)}</button></div>`).join("")}</div>`;
}
function shBlokGeld(h) {
  const r = shVan("sh_geld", h.id).slice().sort((a, b) => a.datum < b.datum ? 1 : -1).slice(0, 6);
  const alleIn = shVan("sh_geld", h.id).filter(g => g.soort === "in").reduce((a, g) => a + g.bedrag, 0), alleUit = shVan("sh_geld", h.id).filter(g => g.soort === "uit").reduce((a, g) => a + g.bedrag, 0);
  return `<div class="card"><div class="sh-db-geldkop"><div><span class="klein">Totaal in</span><b style="color:var(--green)">${shEur(alleIn)}</b></div><div><span class="klein">Totaal uit</span><b style="color:var(--red)">${shEur(alleUit)}</b></div><div><span class="klein">Saldo</span><b>${shEur(alleIn - alleUit)}</b></div></div>
    ${r.map(g => `<button class="rijknop" data-sh="db-geld" data-id="${g.id}"><span class="sh-db-geldpijl ${g.soort}">${g.soort === "in" ? "↓" : "↑"}</span>
      <span class="nm">${esc(g.omschrijving || g.categorie)}<span class="klein" style="display:block">${esc(datumLabel(g.datum))} · ${esc(g.categorie || "")}</span></span>
      <span class="rechts" style="color:${g.soort === "in" ? "var(--green)" : "var(--text)"}">${g.soort === "in" ? "+" : "−"}${shEur(g.bedrag)}</span></button>`).join("") || `<div class="klein" style="padding:12px 14px">Nog niets geboekt.</div>`}
    <div class="knoprij" style="padding:10px 14px 14px"><button class="knop klein rand" data-sh="db-geld" data-soort="in">+ Inkomst</button><button class="knop klein rand" data-sh="db-geld" data-soort="uit">+ Uitgave</button>
      ${shVan("sh_geld", h.id).length > 6 ? `<button class="knop klein rand" data-sh="db-geld-alles">Alles</button>` : ""}</div></div>`;
}
function shBlokOmzetKosten(h) {
  const m = Array.from({ length: 6 }, (_, i) => shYm(i - 5)), inn = m.map(x => shMaandSom(h, "in", x)), uit = m.map(x => shMaandSom(h, "uit", x));
  const max = Math.max(1, ...inn, ...uit), W = 300, H = 120, bw = 16;
  return `<div class="card card-pad"><svg class="sh-sc-burndown" viewBox="0 0 ${W} ${H}" role="img" aria-label="Omzet en kosten laatste 6 maanden">
    ${m.map((x, i) => { const xx = 18 + i * ((W - 24) / 6), hi = inn[i] / max * (H - 30), hu = uit[i] / max * (H - 30);
      return `<rect x="${xx}" y="${H - 18 - hi}" width="${bw}" height="${hi}" rx="3" style="fill:var(--green)"><title>${MAANDNAMEN[+x.slice(5) - 1]}: omzet ${shEur(inn[i])}</title></rect>
        <rect x="${xx + bw + 2}" y="${H - 18 - hu}" width="${bw}" height="${hu}" rx="3" style="fill:var(--red);opacity:.75"><title>kosten ${shEur(uit[i])}</title></rect>
        <text x="${xx + bw}" y="${H - 5}" text-anchor="middle" style="fill:var(--muted);font-size:9px">${MAANDNAMEN[+x.slice(5) - 1].slice(0, 3)}</text>`; }).join("")}</svg>
    <div class="klein"><span style="color:var(--green)">■</span> omzet · <span style="color:var(--red)">■</span> kosten</div></div>`;
}
function shBlokTrechter(h) {
  const kl = shVan("sh_klanten", h.id), max = Math.max(1, ...SH_KLANTFASEN.map(f => kl.filter(k => k.fase === f[0]).length));
  return `<div class="card card-pad">${SH_KLANTFASEN.map(([f, n, c]) => { const r = kl.filter(k => k.fase === f);
    return `<button class="sh-db-trechter" data-sh="db-klanten" data-f="${f}"><span>${n}</span><span class="balk"><i style="width:${Math.max(4, r.length / max * 100)}%;background:${c}"></i></span><b>${r.length}</b></button>`; }).join("")}
    <div class="knoprij" style="margin-top:10px"><button class="knop klein rand" data-sh="db-klant">+ Klant of lead</button><button class="knop klein rand" data-sh="db-klanten">Alle klanten</button></div></div>`;
}
function shBlokRadar(h) {
  const ps = shPijlerScores(h), R = 70, cx = 110, cy = 92;
  const pt = (i, r) => { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
  const ring = f => SH_PIJLERS.map((_, i) => pt(i, R * f).map(x => x.toFixed(1)).join(",")).join(" ");
  return `<div class="card card-pad"><svg class="sh-db-radar" viewBox="0 0 220 190" role="img" aria-label="Pijlers: ${SH_PIJLERS.map((p, i) => p.kort + " " + ps[i]).join(", ")}">
    ${[.33, .66, 1].map(f => `<polygon points="${ring(f)}" style="fill:none;stroke:var(--line2)"/>`).join("")}
    <polygon points="${ps.map((s, i) => pt(i, R * s / 10).map(x => x.toFixed(1)).join(",")).join(" ")}" style="fill:var(--sh);fill-opacity:.25;stroke:var(--sh);stroke-width:2"/>
    ${SH_PIJLERS.map((p, i) => { const [x, y] = pt(i, R + 14); return `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle" style="fill:var(--muted);font-size:10px">${esc(p.kort)} ${ps[i]}</text>`; }).join("")}
  </svg><div class="klein">Kwaliteit van je pijler plus bewijs: gesprekken, experimenten, klanten en omzet.</div></div>`;
}
function shBlokSprint(h) {
  const sp = shActieveSprint(h);
  if (!sp) return `<div class="card card-pad"><b>Geen sprint bezig</b><div class="klein" style="margin:4px 0 10px">Een sprint geeft je week richting.</div><button class="knop klein primair" data-sh="sc-sprint-plan">Sprint plannen</button></div>`;
  const vg = shSprintVoortgang(h);
  return `<button class="card card-pad sh-db-knopkaart" data-sh="tab" data-tab="scrum"><div class="sh-vg-rij"><b>Sprint ${sp.nummer}</b><span>${vg.af}/${vg.tot} pt</span></div>
    ${sp.doel ? `<div class="klein">${esc(sp.doel)}</div>` : ""}${typeof shBurndownSVG === "function" ? shBurndownSVG(h, sp) : ""}</button>`;
}
function shBlokStrip(h) {
  const v = vandaagISO(), dagen = Array.from({ length: 14 }, (_, i) => plusDagen(v, i)), sp = shActieveSprint(h), ev = {};
  const zet = (d, e) => { (ev[d] || (ev[d] = [])).push(e); };
  if (sp) { zet(sp.eind, "🏁 Sprint " + sp.nummer + " eindigt"); }
  dagen.forEach(d => { if (weekdagVan(d) === (h.reviewDag || 0)) zet(d, "🔎 Wekelijkse review"); });
  shVan("sh_checks", h.id).filter(c => c.deadline && (c.status === "open" || c.status === "bezig")).forEach(c => zet(c.deadline, "✅ " + shCheckTitel(c)));
  shKaarten(h).filter(k => k.deadline && !shIsKlaar(h, k)).forEach(k => zet(k.deadline, "🗂️ " + k.titel));
  shVan("sh_experimenten", h.id).filter(x => x.uitkomst === "open" && x.eind).forEach(x => zet(x.eind, "🧪 " + x.hypothese));
  return `<div class="sh-db-strip">${dagen.map(d => `<div class="sh-db-dag${d === v ? " nu" : ""}${(ev[d] || []).length ? " vol" : ""}" title="${esc((ev[d] || []).join("\n"))}">
    <span class="klein">${DAGKORT[weekdagVan(d)]}</span><b>${parseISO(d).getDate()}</b>${(ev[d] || []).slice(0, 3).map(e => `<i>${e.split(" ")[0]}</i>`).join("")}</div>`).join("")}</div>
    ${Object.keys(ev).filter(d => d >= v && d <= dagen[13]).sort().slice(0, 5).map(d => `<div class="klein sh-db-striprij"><b>${esc(datumLabel(d))}</b> ${ev[d].map(esc).join(" · ")}</div>`).join("")}`;
}
function shBlokHeatmap(h) {
  const v = vandaagISO(), start = plusDagen(weekStart(v), -77), per = {};
  S.tijdlog.filter(t => t.shId === h.id && t.datum >= start).forEach(t => { per[t.datum] = (per[t.datum] || 0) + (t.seconden || 0) / 3600; });
  const cellen = [];
  for (let w = 0; w < 12; w++) for (let d = 0; d < 7; d++) {
    const iso = plusDagen(start, w * 7 + d), u = per[iso] || 0, niv = u <= 0 ? 0 : u < 1 ? 1 : u < 2 ? 2 : u < 3 ? 3 : 4;
    cellen.push(`<i class="n${niv}${iso > v ? " toekomst" : ""}" style="grid-column:${w + 1};grid-row:${d + 1}" title="${esc(datumLabel(iso))}: ${u.toFixed(1).replace(".", ",")} uur"></i>`);
  }
  const tot = Object.values(per).reduce((a, x) => a + x, 0);
  return `<div class="card card-pad"><div class="sh-db-heat">${cellen.join("")}</div>
    <div class="sh-vg-rij" style="margin-top:8px"><span class="klein">${tot.toFixed(1).replace(".", ",")} uur in 12 weken</span><button class="knop klein rand" data-sh="db-uren">${ico("tijd")} Uren loggen</button></div></div>`;
}
function shBlokExperimenten(h) {
  const v = vandaagISO(), r = shVan("sh_experimenten", h.id).slice().sort((a, b) => (a.uitkomst === "open" ? 0 : 1) - (b.uitkomst === "open" ? 0 : 1) || (b.start || "").localeCompare(a.start || ""));
  return `<div class="card">${r.slice(0, 5).map(x => { const rest = x.eind ? dagVerschil(x.eind, v) : null;
    return `<button class="rijknop" data-sh="db-exp" data-id="${x.id}"><span class="sh-th-em">${x.uitkomst === "open" ? "🧪" : x.uitkomst === "bevestigd" ? "✅" : "❌"}</span>
      <span class="nm">${esc(x.hypothese)}<span class="klein" style="display:block">${x.uitkomst === "open" ? (rest == null ? "loopt" : rest < 0 ? "afgelopen, uitkomst invullen" : rest + " dagen te gaan") : (x.uitkomst === "bevestigd" ? "Bevestigd" : "Weerlegd") + (x.besluit ? " · " + x.besluit : "")}</span></span></button>`; }).join("") || `<div class="klein" style="padding:12px 14px">Nog geen experimenten.</div>`}
    <div style="padding:10px 14px 14px"><button class="knop klein rand" data-sh="db-exp-nieuw">+ Experiment</button></div></div>`;
}
function shBlokChecklist(h) {
  const l = shVan("sh_checks", h.id).filter(c => c.status !== "nvt"), k = l.filter(c => c.status === "klaar").length, pct = l.length ? Math.round(k / l.length * 100) : 0;
  const open = l.filter(c => c.status === "open" || c.status === "bezig").sort((a, b) => ((SH_PRIO[b.prioriteit] || [])[2] || 0) - ((SH_PRIO[a.prioriteit] || [])[2] || 0) || (a.deadline || "9").localeCompare(b.deadline || "9")).slice(0, 3);
  return `<button class="card card-pad sh-db-knopkaart" data-sh="tab" data-tab="checklist"><div class="sh-vg-rij"><b>${k} van ${l.length} klaar</b><span>${pct}%</span></div>
    <div class="balk" style="height:8px;margin:6px 0 8px"><i style="width:${pct}%"></i></div>
    ${open.map(c => `<div class="klein">${c.prioriteit === "hoog" ? "❗" : "•"} ${esc(shCheckTitel(c))}${c.deadline ? " · ⏰ " + esc(datumLabel(c.deadline)) : ""}</div>`).join("")}</button>`;
}
function shBlokRecent(h) {
  const r = shVan("sh_bestanden", h.id).filter(b => !b.verwijderdOp).sort((a, b) => (b.bijgewerkt || "") < (a.bijgewerkt || "") ? -1 : 1).slice(0, 4);
  return r.length ? `<div class="card sh-bslijst">${r.map(b => shBestandRij(b)).join("")}</div>` : `<div class="card">${leeg("📂", "Nog geen bestanden")}</div>`;
}
function shBlokEigenKpi(h) {
  const r = shVan("sh_kpis", h.id);
  return `<div class="card">${r.map(k => { const m = (k.metingen || []).slice().sort((a, b) => a.datum < b.datum ? -1 : 1), laatst = m[m.length - 1];
    const W = 70, Hh = 22, max = Math.max(1, k.doel || 0, ...m.map(x => x.waarde)), pts = m.slice(-10).map((x, i, a) => `${(a.length > 1 ? i / (a.length - 1) * W : W / 2).toFixed(1)},${(Hh - 2 - x.waarde / max * (Hh - 4)).toFixed(1)}`).join(" ");
    return `<button class="rijknop" data-sh="db-kpi" data-id="${k.id}"><span class="nm">${esc(k.naam)}<span class="klein" style="display:block">${laatst ? esc(datumLabel(laatst.datum)) : "nog geen meting"}${k.doel ? " · doel " + k.doel + (k.eenheid ? " " + esc(k.eenheid) : "") : ""}</span></span>
      ${m.length > 1 ? `<svg class="sh-spark" viewBox="0 0 ${W} ${Hh}" aria-hidden="true"><polyline points="${pts}" style="fill:none;stroke:var(--sh);stroke-width:2;stroke-linecap:round"/></svg>` : ""}
      <span class="rechts"><b style="color:var(--text)">${laatst ? String(laatst.waarde).replace(".", ",") : "–"}</b>${k.eenheid ? " " + esc(k.eenheid) : ""}</span></button>`; }).join("") || `<div class="klein" style="padding:12px 14px">Houd je eigen kerncijfers bij, zoals volgers, bezoekers of conversie.</div>`}
    <div style="padding:10px 14px 14px"><button class="knop klein rand" data-sh="db-kpi">+ Kerncijfer</button></div></div>`;
}
const SH_BLOKKEN = {
  held: [shBlokHeld, null], tegels: [shBlokTegels, null], kpi: [shBlokKpi, "Kerncijfers"], coach: [shBlokCoach, "Coach"], geldstroom: [shBlokGeld, "Geldstroom"],
  omzetkosten: [shBlokOmzetKosten, "Omzet en kosten"], trechter: [shBlokTrechter, "Klantentrechter"], radar: [shBlokRadar, "Pijlers"], sprint: [shBlokSprint, "Sprint"],
  strip: [shBlokStrip, "Komende 14 dagen"], heatmap: [shBlokHeatmap, "Uren"], experimenten: [shBlokExperimenten, "Experimenten"], checklist: [shBlokChecklist, "Checklist"],
  recent: [shBlokRecent, "Recente bestanden"], eigenkpi: [shBlokEigenKpi, "Eigen kerncijfers"]
};
function shDashLayout(h) {
  const bekend = new Set((h.dashboardLayout || []).map(b => b.id));
  return (h.dashboardLayout || []).concat(SH_DASH_BLOKKEN.filter(b => !bekend.has(b[0])).map(b => ({ id: b[0], zichtbaar: true }))).filter(b => SH_BLOKKEN[b.id]);
}
function vwShDashboard(h) {
  let u = "";
  shDashLayout(h).filter(b => b.zichtbaar).forEach(b => {
    const [fn, titel] = SH_BLOKKEN[b.id];
    try { u += (titel ? sectie(titel) : "") + fn(h); } catch (e) { console.error("dashboardblok", b.id, e); }
  });
  u += `<button class="knop breed rand" style="margin-top:18px" data-sh="db-layout">${ico("instel")} Dashboard aanpassen</button>`;
  return u;
}
SH_NA.push(() => {
  if (V.view !== "sh") return;
  const h = shH(V.param); if (!h) return;
  const v = vandaagISO(), hist = h.scoreHist || (h.scoreHist = []);
  if (!hist.length || hist[hist.length - 1].datum !== v) {
    hist.push({ datum: v, score: shGezondheid(h).score }); if (hist.length > 120) hist.shift();
    bewaar("sh_hustles", h);
  }
});

/* ---------- Invoerbladen ---------- */
function shGeldBlad(h, id, soort) {
  const g = id ? JSON.parse(JSON.stringify(vind("sh_geld", id))) : { id: uid(), shId: h.id, datum: vandaagISO(), soort: soort || "uit", bedrag: 0, btw: 21, categorie: "", omschrijving: "" };
  const teken2 = () => {
    $("#bladinhoud").innerHTML = `<div class="segment" style="margin-top:6px"><button data-shg-soort="in" aria-pressed="${g.soort === "in"}">Inkomst</button><button data-shg-soort="uit" aria-pressed="${g.soort === "uit"}">Uitgave</button></div>
      <div class="rij2"><div class="veld"><label for="shg-bedrag">Bedrag (€, incl. btw)</label><input class="invoer" id="shg-bedrag" inputmode="decimal" value="${g.bedrag ? String(g.bedrag / 100).replace(".", ",") : ""}" placeholder="0,00"></div>
        <div class="veld"><label for="shg-datum">Datum</label><input class="invoer" id="shg-datum" type="date" value="${g.datum}"></div></div>
      <div class="veld"><label for="shg-oms">Omschrijving</label><input class="invoer" id="shg-oms" value="${esc(g.omschrijving || "")}" placeholder="${g.soort === "in" ? "Bv. 2 figuren voor Mark" : "Bv. hars en verf"}"></div>
      <div class="veld"><span class="labeltekst">Categorie</span><div class="keuzerij">${SH_GELDCAT[g.soort].map(c => `<button class="keuze" data-shg-cat="${c}" aria-pressed="${g.categorie === c}">${c}</button>`).join("")}</div></div>
      <div class="veld"><span class="labeltekst">Btw</span><div class="segment">${[0, 9, 21].map(b => `<button data-shg-btw="${b}" aria-pressed="${(g.btw || 0) === b}">${b}%</button>`).join("")}</div></div>
      ${id ? `<button class="knop klein gevaar" id="shg-weg" style="margin-top:8px">${ico("prullenbak")} Verwijderen</button>` : ""}`;
  };
  bladOpen(id ? "Boeking" : (g.soort === "in" ? "Inkomst" : "Uitgave"), "", `<button class="knop breed primair" id="shg-ok">Opslaan</button>`);
  teken2();
  const lees = () => { g.bedrag = Math.round(csvGetal($("#shg-bedrag").value) * 100) || 0; g.datum = $("#shg-datum").value || vandaagISO(); g.omschrijving = $("#shg-oms").value.trim(); };
  $("#bladinhoud").addEventListener("click", async e => {
    const s = e.target.closest("[data-shg-soort]"), c = e.target.closest("[data-shg-cat]"), b = e.target.closest("[data-shg-btw]");
    if (s) { lees(); g.soort = s.dataset.shgSoort; g.categorie = ""; teken2(); }
    if (c) { lees(); g.categorie = c.dataset.shgCat; teken2(); }
    if (b) { lees(); g.btw = +b.dataset.shgBtw; teken2(); }
    if (e.target.closest("#shg-weg")) { bladSluit(); await shBewaarVeel([["sh_geld", null, g.id]]); teken(); toast("Boeking verwijderd"); }
  });
  $("#shg-ok").onclick = async () => {
    lees();
    if (!(g.bedrag > 0)) { toast("Vul een bedrag in"); $("#shg-bedrag").focus(); return; }
    g.categorie = g.categorie || "Overig";
    await bewaar("sh_geld", g);
    if (h.inFinancieel && typeof shFinancieelKoppel === "function") await shFinancieelKoppel(h);
    await logGebeurtenis("sidehustle", `${h.naam}: ${g.soort === "in" ? "inkomst" : "uitgave"} ${shEur(g.bedrag)}${g.omschrijving ? " · " + g.omschrijving : ""}`, h.id, { shId: h.id });
    bladSluit(); teken(); toast(g.soort === "in" ? "Inkomst geboekt" : "Uitgave geboekt");
  };
  if (!id) setTimeout(() => { const b = $("#shg-bedrag"); if (b) b.focus(); }, 280);
}
/** Uitgaven spiegelen naar Financieel als dat aan staat in de instellingen van de side hustle. */
async function shFinancieelKoppel(h) {
  if (!h.inFinancieel) return;
  for (const g of shVan("sh_geld", h.id).filter(x => x.soort === "uit")) {
    const u = g.uitgaveId && vind("uitgaven", g.uitgaveId);
    const rec = Object.assign(u || { id: uid(), potjeId: null, ts: new Date().toISOString() }, { datum: g.datum, bedrag: g.bedrag / 100, omschrijving: `${h.emoji} ${h.naam}: ${g.omschrijving || g.categorie}`, categorie: "overig", shGeldId: g.id });
    await bewaar("uitgaven", rec);
    if (g.uitgaveId !== rec.id) { g.uitgaveId = rec.id; await bewaar("sh_geld", g); }
  }
}
function shGeldAllesBlad(h) {
  const r = shVan("sh_geld", h.id).slice().sort((a, b) => a.datum < b.datum ? 1 : -1);
  bladOpen("Alle boekingen", `<div class="card">${r.map(g => `<button class="rijknop" data-sh="db-geld" data-id="${g.id}"><span class="sh-db-geldpijl ${g.soort}">${g.soort === "in" ? "↓" : "↑"}</span>
    <span class="nm">${esc(g.omschrijving || g.categorie)}<span class="klein" style="display:block">${esc(datumLabel(g.datum, true))} · ${esc(g.categorie || "")} · btw ${g.btw || 0}%</span></span>
    <span class="rechts">${g.soort === "in" ? "+" : "−"}${shEur(g.bedrag)}</span></button>`).join("")}</div>`);
}
function shKlantBlad(h, id) {
  const k = id ? JSON.parse(JSON.stringify(vind("sh_klanten", id))) : { id: uid(), shId: h.id, naam: "", bron: "", fase: "lead", waarde: 0, laatsteContact: vandaagISO(), notities: "", gemaakt: shNu() };
  bladOpen(id ? k.naam : "Nieuwe klant of lead", `
    <div class="veld"><label for="shk-naam">Naam</label><input class="invoer" id="shk-naam" value="${esc(k.naam)}" placeholder="Persoon of bedrijf"></div>
    <div class="veld"><span class="labeltekst">Fase</span><div class="keuzerij">${SH_KLANTFASEN.map(([f, n]) => `<button class="keuze" data-shk-fase="${f}" aria-pressed="${k.fase === f}">${n}</button>`).join("")}</div></div>
    <div class="rij2"><div class="veld"><label for="shk-bron">Via</label><input class="invoer" id="shk-bron" value="${esc(k.bron || "")}" placeholder="Instagram, netwerk…"></div>
      <div class="veld"><label for="shk-waarde">Waarde (€)</label><input class="invoer" id="shk-waarde" inputmode="decimal" value="${k.waarde ? String(k.waarde / 100).replace(".", ",") : ""}"></div></div>
    <div class="veld"><label for="shk-contact">Laatste contact</label><div style="display:flex;gap:8px"><input class="invoer" id="shk-contact" type="date" value="${k.laatsteContact || ""}"><button class="knop klein rand" id="shk-vandaag">Vandaag</button></div></div>
    <div class="veld"><label for="shk-not">Notities</label><textarea class="invoer" id="shk-not" style="min-height:70px">${esc(k.notities || "")}</textarea></div>
    ${id ? `<button class="knop klein gevaar" id="shk-weg">${ico("prullenbak")} Verwijderen</button>` : ""}`,
    `<button class="knop breed primair" id="shk-ok">Opslaan</button>`);
  $("#bladinhoud").addEventListener("click", async e => {
    const f = e.target.closest("[data-shk-fase]"); if (f) { k.fase = f.dataset.shkFase; $$("[data-shk-fase]").forEach(x => x.setAttribute("aria-pressed", String(x === f))); }
    if (e.target.closest("#shk-vandaag")) $("#shk-contact").value = vandaagISO();
    if (e.target.closest("#shk-weg")) { bladSluit(); await shBewaarVeel([["sh_klanten", null, k.id]]); teken(); toast("Verwijderd"); }
  });
  $("#shk-ok").onclick = async () => {
    k.naam = $("#shk-naam").value.trim(); if (!k.naam) { toast("Vul een naam in"); $("#shk-naam").focus(); return; }
    const oud = id ? vind("sh_klanten", id).fase : null;
    k.bron = $("#shk-bron").value.trim(); k.waarde = Math.round(csvGetal($("#shk-waarde").value) * 100) || 0; k.laatsteContact = $("#shk-contact").value || null; k.notities = $("#shk-not").value;
    await bewaar("sh_klanten", k);
    if (oud !== k.fase) await logGebeurtenis("sidehustle", `${h.naam}: ${k.naam} → ${shKlantFase(k.fase)[1]}`, h.id, { shId: h.id });
    bladSluit(); teken(); toast("Opgeslagen");
  };
}
function shKlantenBlad(h, fase) {
  const r = shVan("sh_klanten", h.id).filter(k => !fase || k.fase === fase).sort((a, b) => (b.laatsteContact || "").localeCompare(a.laatsteContact || ""));
  bladOpen(fase ? shKlantFase(fase)[1] : "Klanten", `<div class="card">${r.map(k => `<button class="rijknop" data-sh="db-klant" data-id="${k.id}"><span class="kleurbol" style="background:${shKlantFase(k.fase)[2]}"></span>
    <span class="nm">${esc(k.naam)}<span class="klein" style="display:block">${shKlantFase(k.fase)[1]}${k.bron ? " · " + esc(k.bron) : ""}${k.laatsteContact ? " · contact " + esc(datumLabel(k.laatsteContact)) : ""}</span></span>
    <span class="rechts">${k.waarde ? shEur(k.waarde) : ""}</span></button>`).join("") || `<div class="klein" style="padding:12px 14px">Nog niemand in deze fase.</div>`}</div>
    <button class="knop breed rand" style="margin-top:10px" data-sh="db-klant">+ Klant of lead</button>`);
}
function shUrenBlad(h) {
  bladOpen("Uren loggen", `
    <div class="veld"><span class="labeltekst">Hoe lang?</span><div class="hs-minuten">${[30, 60, 90, 120, 180].map(m => `<button data-shu-min="${m}" aria-pressed="${m === 60}">${m >= 60 ? (m / 60).toString().replace(".", ",") + "u" : m + "m"}</button>`).join("")}</div>
      <input class="invoer" id="shu-min" type="number" inputmode="numeric" value="60" aria-label="Minuten"></div>
    <div class="veld"><label for="shu-datum">Datum</label><input class="invoer" id="shu-datum" type="date" value="${vandaagISO()}" max="${vandaagISO()}"></div>
    <div class="veld"><label for="shu-not">Waaraan?</label><input class="invoer" id="shu-not" placeholder="Bv. productfoto's maken"></div>`,
    `<button class="knop breed primair" id="shu-ok">Loggen</button>`);
  $("#bladinhoud").addEventListener("click", e => { const m = e.target.closest("[data-shu-min]"); if (!m) return; $("#shu-min").value = m.dataset.shuMin; $$("[data-shu-min]").forEach(x => x.setAttribute("aria-pressed", String(x === m))); });
  $("#shu-ok").onclick = async () => {
    const min = parseInt($("#shu-min").value, 10); if (!(min > 0)) { toast("Vul een aantal minuten in"); return; }
    await bewaar("tijdlog", { id: uid(), taakId: null, seconden: min * 60, datum: $("#shu-datum").value || vandaagISO(), ts: new Date().toISOString(), shId: h.id, notitie: $("#shu-not").value.trim() });
    bladSluit(); teken(); toast(`${(min / 60).toFixed(1).replace(".", ",")} uur gelogd`);
  };
}
function shExperimentBlad(h, id, voor) {
  const x = id ? JSON.parse(JSON.stringify(vind("sh_experimenten", id))) : Object.assign({ id: uid(), shId: h.id, hypothese: "", test: "", meting: "", criterium: "", pijler: 5, start: vandaagISO(), eind: plusDagen(vandaagISO(), 14), uitkomst: "open", besluit: null, notitie: "", gemaakt: shNu() }, voor || {});
  bladOpen(id ? "Experiment" : "Nieuw experiment", `
    <div class="veld"><label for="she-hyp">Hypothese: wat geloof je?</label><textarea class="invoer" id="she-hyp" style="min-height:60px" placeholder="Wij geloven dat [klant] [gedrag] doet.">${esc(x.hypothese)}</textarea></div>
    <div class="veld"><label for="she-test">Test: wat ga je doen?</label><textarea class="invoer" id="she-test" style="min-height:56px" placeholder="Bv. landingspagina met voorinschrijving">${esc(x.test)}</textarea></div>
    <div class="rij2"><div class="veld"><label for="she-met">Meting</label><input class="invoer" id="she-met" value="${esc(x.meting)}" placeholder="Wat tel je?"></div>
      <div class="veld"><label for="she-crit">Geslaagd als</label><input class="invoer" id="she-crit" value="${esc(x.criterium)}" placeholder="Bv. 20 of meer"></div></div>
    <div class="rij2"><div class="veld"><label for="she-start">Start</label><input class="invoer" type="date" id="she-start" value="${x.start || ""}"></div>
      <div class="veld"><label for="she-eind">Eind</label><input class="invoer" type="date" id="she-eind" value="${x.eind || ""}"></div></div>
    <div class="veld"><span class="labeltekst">Uitkomst</span><div class="segment">${[["open", "Loopt"], ["bevestigd", "Bevestigd"], ["weerlegd", "Weerlegd"]].map(([w, n]) => `<button data-she-uit="${w}" aria-pressed="${x.uitkomst === w}">${n}</button>`).join("")}</div></div>
    <div class="veld" id="she-besluitveld" ${x.uitkomst === "open" ? 'style="display:none"' : ""}><span class="labeltekst">Besluit</span><div class="segment">${["doorgaan", "bijsturen", "stoppen"].map(w => `<button data-she-bes="${w}" aria-pressed="${x.besluit === w}">${w[0].toUpperCase() + w.slice(1)}</button>`).join("")}</div></div>
    <div class="veld"><label for="she-not">Wat leerde je?</label><textarea class="invoer" id="she-not" style="min-height:56px">${esc(x.notitie || "")}</textarea></div>
    ${id ? `<div class="knoprij"><button class="knop klein rand" id="she-kaart">${ico("plus")} Kaart op de backlog</button><button class="knop klein gevaar" id="she-weg">${ico("prullenbak")} Verwijderen</button></div>` : ""}`,
    `<button class="knop breed primair" id="she-ok">Opslaan</button>`);
  $("#bladinhoud").addEventListener("click", async e => {
    const u = e.target.closest("[data-she-uit]"), b = e.target.closest("[data-she-bes]");
    if (u) { x.uitkomst = u.dataset.sheUit; $$("[data-she-uit]").forEach(q => q.setAttribute("aria-pressed", String(q === u))); $("#she-besluitveld").style.display = x.uitkomst === "open" ? "none" : ""; }
    if (b) { x.besluit = b.dataset.sheBes; $$("[data-she-bes]").forEach(q => q.setAttribute("aria-pressed", String(q === b))); }
    if (e.target.closest("#she-weg")) { bladSluit(); await shBewaarVeel([["sh_experimenten", null, x.id]]); teken(); toast("Experiment verwijderd"); }
    if (e.target.closest("#she-kaart")) {
      const kol = shKolomRol(h, "backlog") || shKolommen(h)[0];
      const k = shNieuweKaart(h, kol.id, { titel: "Test: " + mmbKortTekst(x.hypothese, 80), omschrijving: x.test, labels: ["experiment"], pijler: x.pijler || 5, moscow: "M", koppelingen: { experimentId: x.id } });
      await bewaar("sh_kaarten", k); bladSluit(); teken(); toast("Kaart op je backlog gezet");
    }
  });
  $("#she-ok").onclick = async () => {
    x.hypothese = $("#she-hyp").value.trim(); if (!x.hypothese) { toast("Vul je hypothese in"); $("#she-hyp").focus(); return; }
    x.test = $("#she-test").value.trim(); x.meting = $("#she-met").value.trim(); x.criterium = $("#she-crit").value.trim();
    x.start = $("#she-start").value || null; x.eind = $("#she-eind").value || null; x.notitie = $("#she-not").value.trim();
    const oud = id ? vind("sh_experimenten", id).uitkomst : null;
    await bewaar("sh_experimenten", x);
    if (oud !== x.uitkomst && x.uitkomst !== "open") await logGebeurtenis("sidehustle", `${h.naam}: experiment ${x.uitkomst}${x.besluit ? " → " + x.besluit : ""}: ${x.hypothese}`, h.id, { shId: h.id });
    else if (!id) await logGebeurtenis("sidehustle", `${h.naam}: experiment gestart: ${x.hypothese}`, h.id, { shId: h.id });
    bladSluit(); teken(); toast("Experiment opgeslagen");
  };
}
function shKpiBlad(h, id) {
  const k = id ? JSON.parse(JSON.stringify(vind("sh_kpis", id))) : { id: uid(), shId: h.id, naam: "", eenheid: "", doel: null, metingen: [], gemaakt: shNu() };
  const m = (k.metingen || []).slice().sort((a, b) => a.datum < b.datum ? 1 : -1);
  bladOpen(id ? k.naam : "Nieuw kerncijfer", `
    <div class="veld"><label for="shp-naam">Naam</label><input class="invoer" id="shp-naam" value="${esc(k.naam)}" placeholder="Bv. Instagram-volgers"></div>
    <div class="rij2"><div class="veld"><label for="shp-een">Eenheid</label><input class="invoer" id="shp-een" value="${esc(k.eenheid || "")}" placeholder="volgers, %, €"></div>
      <div class="veld"><label for="shp-doel">Doel</label><input class="invoer" id="shp-doel" inputmode="decimal" value="${k.doel != null ? String(k.doel).replace(".", ",") : ""}"></div></div>
    <div class="veld"><label for="shp-w">Nieuwe meting (vandaag)</label><input class="invoer" id="shp-w" inputmode="decimal" placeholder="Waarde"></div>
    ${m.length ? `<div class="card">${m.slice(0, 12).map(x => `<div class="hs-mijlpaal"><span class="tekst" style="padding-left:10px">${esc(datumLabel(x.datum, true))}</span><b>${String(x.waarde).replace(".", ",")}</b></div>`).join("")}</div>` : ""}
    ${id ? `<button class="knop klein gevaar" id="shp-weg" style="margin-top:10px">${ico("prullenbak")} Verwijderen</button>` : ""}`,
    `<button class="knop breed primair" id="shp-ok">Opslaan</button>`);
  $("#bladinhoud").addEventListener("click", async e => { if (e.target.closest("#shp-weg")) { bladSluit(); await shBewaarVeel([["sh_kpis", null, k.id]]); teken(); } });
  $("#shp-ok").onclick = async () => {
    k.naam = $("#shp-naam").value.trim(); if (!k.naam) { toast("Geef het kerncijfer een naam"); return; }
    k.eenheid = $("#shp-een").value.trim(); const d = $("#shp-doel").value.trim(); k.doel = d ? csvGetal(d) : null;
    const w = $("#shp-w").value.trim();
    if (w) { const v = vandaagISO(); k.metingen = (k.metingen || []).filter(x => x.datum !== v).concat([{ datum: v, waarde: csvGetal(w) }]); }
    await bewaar("sh_kpis", k); bladSluit(); teken(); toast("Opgeslagen");
  };
}
function shLayoutBlad(h) {
  const l = shDashLayout(h).map(b => Object.assign({}, b)), naam = id => (SH_DASH_BLOKKEN.find(b => b[0] === id) || [id, id])[1];
  const teken2 = () => { $("#bladinhoud").innerHTML = `<p class="klein">Zet blokken aan of uit en verander de volgorde.</p><div class="card">${l.map((b, i) => `<div class="sh-db-layoutrij">
      <button class="toggle" data-shl-aan="${i}" aria-pressed="${b.zichtbaar}" aria-label="${esc(naam(b.id))} tonen"></button><span class="nm">${esc(naam(b.id))}</span>
      <button class="icon-btn" data-shl-op="${i}" aria-label="Omhoog"${i === 0 ? " disabled" : ""}>${ico("pijll", "transform:rotate(90deg)")}</button>
      <button class="icon-btn" data-shl-neer="${i}" aria-label="Omlaag"${i === l.length - 1 ? " disabled" : ""}>${ico("pijlr", "transform:rotate(90deg)")}</button></div>`).join("")}</div>
      <button class="knop klein rand" id="shl-reset" style="margin-top:10px">Standaardindeling</button>`; };
  bladOpen("Dashboard aanpassen", "", `<button class="knop breed primair" id="shl-ok">Opslaan</button>`);
  teken2();
  $("#bladinhoud").addEventListener("click", e => {
    const a = e.target.closest("[data-shl-aan]"), o = e.target.closest("[data-shl-op]"), n = e.target.closest("[data-shl-neer]");
    if (a) l[+a.dataset.shlAan].zichtbaar = !l[+a.dataset.shlAan].zichtbaar;
    else if (o) { const i = +o.dataset.shlOp; [l[i - 1], l[i]] = [l[i], l[i - 1]]; }
    else if (n) { const i = +n.dataset.shlNeer; [l[i + 1], l[i]] = [l[i], l[i + 1]]; }
    else if (e.target.closest("#shl-reset")) { l.length = 0; SH_DASH_BLOKKEN.forEach(b => l.push({ id: b[0], zichtbaar: true })); }
    else return;
    teken2();
  });
  $("#shl-ok").onclick = async () => { h.dashboardLayout = l; await bewaar("sh_hustles", h); bladSluit(); teken(); toast("Dashboard aangepast"); };
}

/* ---------- Acties ---------- */
const shHier = () => shH(V.param) || shH(V.shLesH);
Object.assign(SH_ACT, {
  "db-geld": el => { const h = shHier(); if (h) shGeldBlad(h, el.dataset.id || null, el.dataset.soort); },
  "db-geld-alles": () => { const h = shHier(); if (h) shGeldAllesBlad(h); },
  "db-klant": el => { const h = shHier(); if (h) shKlantBlad(h, el.dataset.id || null); },
  "db-klanten": el => { const h = shHier(); if (h) shKlantenBlad(h, el.dataset.f || null); },
  "db-uren": () => { const h = shHier(); if (h) shUrenBlad(h); },
  "db-exp": el => { const h = shHier(); if (h) shExperimentBlad(h, el.dataset.id); },
  "db-exp-nieuw": () => { const h = shHier(); if (h) shExperimentBlad(h, null); },
  "db-kpi": el => { const h = shHier(); if (h) shKpiBlad(h, el.dataset.id || null); },
  "db-layout": () => { const h = shHier(); if (h) shLayoutBlad(h); }
});
