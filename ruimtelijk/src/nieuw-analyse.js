"use strict";
/* ==========================================================================
   67. Nieuw: één statistiek tegelijk, volledig te analyseren
   Het opengeklapte thema krijgt keuzemenu's als filters: meting, periode,
   indeling (dag/week/maand), weergave (staaf, lijn, cumulatief, verdeling,
   tabel) en waar zinvol een filter (side hustle, categorie, gewoonte, …).
   Tik of wijs een staaf of punt aan voor de precieze waarde.
   ========================================================================== */
const NWO_PERIODES = [["7", "7 dagen"], ["30", "30 dagen"], ["90", "90 dagen"], ["365", "12 maanden"], ["alles", "Alles"]];
const NWO_PER = [["dag", "Per dag"], ["week", "Per week"], ["maand", "Per maand"]];
const NWO_W_TIJD = [["staaf", "Staafdiagram"], ["lijn", "Lijndiagram"], ["cumulatief", "Cumulatief"], ["tabel", "Tabel"]];
const NWO_W_CAT = [["balk", "Staafdiagram"], ["verdeling", "Verdeling"], ["tabel", "Tabel"]];
const NWO_DAG = ["zo", "ma", "di", "wo", "do", "vr", "za"];
const nwoGetal = (x, d) => (+x || 0).toLocaleString("nl-NL", { maximumFractionDigits: d || 0, minimumFractionDigits: 0 });
const NWO_FMT = {
  eur: x => eur(x), uur: x => nwoGetal(x, 1) + " u", min: x => nwoGetal(x) + " min", aantal: x => nwoGetal(x),
  kg: x => nwoGetal(x, 1) + " kg", ml: x => x >= 1000 ? nwoGetal(x / 1000, 1) + " L" : nwoGetal(x) + " ml", kcal: x => nwoGetal(x) + " kcal",
  score: x => nwoGetal(x, 1) + " / 5", pct: x => nwoGetal(x) + "%"
};
const nwoKort = { eur: x => Math.abs(x) >= 1000 ? "€" + nwoGetal(x / 1000, 1) + "k" : "€" + nwoGetal(x), uur: x => nwoGetal(x, 1), min: x => nwoGetal(x), aantal: x => nwoGetal(x, 1),
  kg: x => nwoGetal(x, 1), ml: x => x >= 1000 ? nwoGetal(x / 1000, 1) + "L" : nwoGetal(x), kcal: x => nwoGetal(x), score: x => nwoGetal(x, 1), pct: x => nwoGetal(x) + "%" };

/* ---------- Metingen per thema ---------- */
const tijd = (id, naam, eenheid, agg, data, extra) => Object.assign({ id, naam, soort: "tijd", eenheid, agg, data }, extra || {});
const cat = (id, naam, eenheid, rijen, extra) => Object.assign({ id, naam, soort: "cat", eenheid, rijen }, extra || {});
const nwoIn = (d, van, tot) => d && d >= van && d <= tot;
const nwoGroep = (lijst, sleutel, waarde) => { const m = new Map(); lijst.forEach(x => { const k = sleutel(x); if (k == null) return; m.set(k, (m.get(k) || 0) + waarde(x)); }); return [...m].map(([label, v]) => ({ label, v })); };
function nwoMetingen(thema) {
  const hustles = () => [["", "Alle side hustles"]].concat(S.sh_hustles.filter(h => !h.gearchiveerd).map(h => [h.id, (h.emoji ? h.emoji + " " : "") + h.naam]));
  const shNaam = id => { const h = shH(id); return h ? h.naam : "Onbekend"; };
  switch (thema) {
    case "sh": return [
      tijd("omzet", "Omzet", "eur", "som", f => S.sh_geld.filter(g => g.soort === "in" && (!f || g.shId === f)).map(g => ({ d: g.datum, v: g.bedrag / 100 })), { filters: hustles }),
      tijd("kosten", "Kosten", "eur", "som", f => S.sh_geld.filter(g => g.soort === "uit" && (!f || g.shId === f)).map(g => ({ d: g.datum, v: g.bedrag / 100 })), { filters: hustles }),
      tijd("resultaat", "Resultaat (omzet − kosten)", "eur", "som", f => S.sh_geld.filter(g => !f || g.shId === f).map(g => ({ d: g.datum, v: (g.soort === "in" ? 1 : -1) * g.bedrag / 100 })), { filters: hustles, polair: true }),
      tijd("uren", "Uren gewerkt", "uur", "som", f => S.tijdlog.filter(l => l.shId && (!f || l.shId === f)).map(l => ({ d: l.datum, v: l.seconden / 3600 })), { filters: hustles }),
      cat("omzetper", "Omzet per side hustle", "eur", (van, tot) => nwoGroep(S.sh_geld.filter(g => g.soort === "in" && nwoIn(g.datum, van, tot)), g => shNaam(g.shId), g => g.bedrag / 100)),
      cat("urenper", "Uren per side hustle", "uur", (van, tot) => nwoGroep(S.tijdlog.filter(l => l.shId && nwoIn(l.datum, van, tot)), l => shNaam(l.shId), l => l.seconden / 3600)),
      tijd("ideeen", "Ideeën toegevoegd", "aantal", "som", () => S.sh_ideeen.filter(x => x.gemaakt).map(x => ({ d: x.gemaakt.slice(0, 10), v: 1 }))),
      cat("ideestatus", "Ideeën per status", "aantal", () => nwoGroep(S.sh_ideeen, x => (SHI_STATUS[x.status] || SHI_STATUS.open)[0], () => 1), { periodeloos: true }),
      cat("checkper", "Checklist klaar per side hustle", "pct", () => S.sh_hustles.filter(h => !h.gearchiveerd).map(h => { const c = shVan("sh_checks", h.id).filter(x => x.status !== "nvt"); return { label: h.naam, v: c.length ? c.filter(x => x.status === "klaar").length / c.length * 100 : 0 }; }), { periodeloos: true, geenDeel: true })
    ];
    case "taken": {
      const projecten = () => [["", "Alle projecten"], ["__geen", "Zonder project"]].concat(S.projecten.map(p => [p.id, p.naam]));
      const inProj = (t, f) => !f || (f === "__geen" ? !t.projectId : t.projectId === f);
      const pNaam = id => { const p = id && vind("projecten", id); return p ? p.naam : "Zonder project"; };
      return [
        tijd("af", "Taken afgerond", "aantal", "som", f => S.taken.filter(t => t.af && t.afOp && inProj(t, f)).map(t => ({ d: t.afOp.slice(0, 10), v: 1 })), { filters: projecten }),
        tijd("nieuw", "Taken aangemaakt", "aantal", "som", f => S.taken.filter(t => t.gemaakt && inProj(t, f)).map(t => ({ d: t.gemaakt.slice(0, 10), v: 1 })), { filters: projecten }),
        cat("openproj", "Open taken per project", "aantal", () => nwoGroep(openTaken(), t => pNaam(t.projectId), () => 1), { periodeloos: true }),
        cat("openprio", "Open taken per prioriteit", "aantal", () => nwoGroep(openTaken(), t => PRIO_NAAM[t.prioriteit || 4] || "P4 ooit", () => 1), { periodeloos: true }),
        cat("afproj", "Afgerond per project", "aantal", (van, tot) => nwoGroep(S.taken.filter(t => t.af && t.afOp && nwoIn(t.afOp.slice(0, 10), van, tot)), t => pNaam(t.projectId), () => 1))
      ];
    }
    case "afspraken": return [
      tijd("aantal", "Afspraken", "aantal", "som", f => S.afspraken.filter(a => a.datum && (!f || (f === "werk" ? a.werk : !a.werk))).map(a => ({ d: a.datum, v: 1 })), { filters: () => [["", "Alle afspraken"], ["werk", "Werk"], ["prive", "Privé"]] }),
      cat("soort", "Per soort", "aantal", (van, tot) => nwoGroep(S.afspraken.filter(a => nwoIn(a.datum, van, tot)), a => (AFSPRAAK_SOORTEN[a.soort] || AFSPRAAK_SOORTEN.gesprek).naam, () => 1)),
      cat("persoon", "Per persoon", "aantal", (van, tot) => nwoGroep(S.afspraken.filter(a => nwoIn(a.datum, van, tot)).flatMap(a => (a.personen || []).map(p => ({ p }))), x => x.p, () => 1))
    ];
    case "lijsten": {
      const echt = c => c.items.filter(i => !(typeof clSectie === "function" && clSectie(i)));
      return [
        cat("voortgang", "Voortgang per checklist", "pct", () => S.checklists.filter(c => !c.sjabloon).map(c => { const e = echt(c); return { label: c.naam, v: e.length ? e.filter(i => i.af).length / e.length * 100 : 0 }; }), { periodeloos: true, geenDeel: true }),
        cat("af", "Punten afgevinkt per checklist", "aantal", () => S.checklists.filter(c => !c.sjabloon).map(c => ({ label: c.naam, v: echt(c).filter(i => i.af).length })), { periodeloos: true }),
        cat("open", "Open punten per checklist", "aantal", () => S.checklists.filter(c => !c.sjabloon).map(c => ({ label: c.naam, v: echt(c).filter(i => !i.af).length })), { periodeloos: true })
      ];
    }
    case "wishlist": return [
      tijd("nieuw", "Wensen toegevoegd", "aantal", "som", () => (S.wl_items || []).filter(x => x.gemaakt).map(x => ({ d: x.gemaakt.slice(0, 10), v: 1 }))),
      tijd("gekocht", "Uitgegeven aan wensen", "eur", "som", () => (S.wl_items || []).filter(x => x.status === "gekocht" && x.besloten).map(x => ({ d: x.besloten.slice(0, 10), v: +x.prijs || 0 }))),
      cat("onderwerp", "Wishlist per onderwerp", "eur", () => nwoGroep((S.wl_items || []).filter(x => (x.status || "actief") === "actief"), x => typeof wlOnd === "function" ? wlOnd(x.onderwerp)[1] : "Overig", x => +x.prijs || 0), { periodeloos: true }),
      cat("status", "Per status", "eur", () => nwoGroep(S.wl_items || [], x => ({ actief: "Op de lijst", gekocht: "Gekocht", niet: "Niet gekocht" })[x.status || "actief"], x => +x.prijs || 0), { periodeloos: true })
    ];
    case "gezondheid": {
      const uit = [
        tijd("gewicht", "Gewicht", "kg", "gem", () => S.vs_gewicht.map(g => ({ d: g.datum, v: +g.kg })), { voorkeur: "lijn" }),
        tijd("sport", "Sportsessies", "aantal", "som", () => S.vs_sportlog.map(l => ({ d: l.datum, v: 1 }))),
        tijd("water", "Water gedronken", "ml", "som", () => S.vs_logs.filter(l => l.moment === "water").map(l => ({ d: l.datum, v: +l.ml || 0 }))),
        tijd("kcal", "Calorieën", "kcal", "som", () => S.vs_logs.filter(l => l.moment !== "water").map(l => ({ d: l.datum, v: +l.kcal || 0 })))
      ];
      const rk = typeof rookCijfers === "function" ? rookCijfers() : null;
      if (rk) {
        // per dag het deel van de dag dat je rookvrij was (eerste en huidige dag naar rato)
        const dagen = () => { const out = [], nu = Date.now(); for (let d = rk.stop.slice(0, 10); d <= vandaagISO(); d = plusDagen(d, 1)) {
          const b = Math.max(new Date(d + "T00:00:00").getTime(), rk.start), e = Math.min(new Date(plusDagen(d, 1) + "T00:00:00").getTime(), nu); if (e > b) out.push({ d, f: (e - b) / 86400000 }); } return out; };
        uit.unshift(tijd("bespaard", "Bespaard sinds stoppen", "eur", "som", () => dagen().map(x => ({ d: x.d, v: rk.perDag * x.f })), { voorkeur: "cumulatief", telwoord: ["dag", "dagen"] }),
          tijd("niet", "Sigaretten niet gerookt", "aantal", "som", () => dagen().map(x => ({ d: x.d, v: rk.sigDag * x.f })), { voorkeur: "cumulatief", telwoord: ["dag", "dagen"] }));
      }
      return uit;
    }
    case "gewoontes": {
      const gew = () => [["", "Alle gewoontes"]].concat(S.gewoontes.map(g => [g.id, g.naam]));
      return [
        tijd("volbracht", "Gewoontes volbracht", "aantal", "som", f => S.gewoontelog.filter(l => !f || l.gewoonteId === f).map(l => ({ d: l.datum, v: 1 })), { filters: gew }),
        cat("per", "Per gewoonte", "aantal", (van, tot) => nwoGroep(S.gewoontelog.filter(l => nwoIn(l.datum, van, tot)), l => (vind("gewoontes", l.gewoonteId) || {}).naam || null, () => 1)),
        tijd("stemming", "Stemming (dagboek)", "score", "gem", () => S.dagboek.filter(d => d.stemming).map(d => ({ d: d.datum, v: +d.stemming })), { voorkeur: "lijn" })
      ];
    }
    case "geld": {
      const cats = () => [["", "Alle categorieën"]].concat(CATEGORIEEN.map(c => [c[0], c[1]]));
      return [
        tijd("uitgaven", "Uitgaven", "eur", "som", f => S.uitgaven.filter(u => !f || u.categorie === f).map(u => ({ d: u.datum, v: +u.bedrag || 0 })), { filters: cats }),
        cat("percat", "Uitgaven per categorie", "eur", (van, tot) => nwoGroep(S.uitgaven.filter(u => nwoIn(u.datum, van, tot)), u => catNaam(u.categorie), u => +u.bedrag || 0)),
        cat("incasso", "Incasso's per maand, per soort", "eur", () => nwoGroep(S.incassos.filter(i => i.actief), i => (VLCATS.find(c => c[0] === i.cat) || [0, "Overig"])[1], i => { const f = FREQ[i.freq] || FREQ.maand; return i.freq === "week" ? i.bedrag * 52 / 12 : i.bedrag / (f[1] || 1); }), { periodeloos: true })
      ];
    }
    case "hobby": {
      const items = () => [["", "Alles"]].concat((S.hs_items || []).map(x => [x.id, (x.emoji ? x.emoji + " " : "") + x.naam]));
      const sessies = f => (S.hs_items || []).filter(x => !f || x.id === f).flatMap(x => (x.sessies || []).map(s => ({ x, s })));
      return [
        tijd("minuten", "Minuten geoefend", "min", "som", f => sessies(f).map(({ s }) => ({ d: s.datum, v: +s.minuten || 0 })), { filters: items }),
        tijd("sessies", "Sessies", "aantal", "som", f => sessies(f).map(({ s }) => ({ d: s.datum, v: 1 })), { filters: items }),
        cat("per", "Minuten per hobby of skill", "min", (van, tot) => nwoGroep(sessies("").filter(({ s }) => nwoIn(s.datum, van, tot)), ({ x }) => x.naam, ({ s }) => +s.minuten || 0))
      ];
    }
    case "werk": return [
      tijd("af", "Werktaken afgerond", "aantal", "som", () => S.taken.filter(t => t.werk && t.af && t.afOp).map(t => ({ d: t.afOp.slice(0, 10), v: 1 }))),
      tijd("afspraken", "Werkafspraken", "aantal", "som", () => S.afspraken.filter(a => a.werk && a.datum).map(a => ({ d: a.datum, v: 1 }))),
      cat("docs", "Documenten per soort", "aantal", () => nwoGroep(S.werkdocs.filter(d => d.status !== "archief"), d => (DOCSOORTEN[d.soort] || { naam: "Overig" }).naam, () => 1), { periodeloos: true })
    ];
    case "mindmap": {
      const soorten = () => [["", "Alle logregels"]].concat([...new Set(S.gebeurtenissen.map(g => g.soort))].map(s => [s, (typeof TL_SOORTEN === "object" && TL_SOORTEN[s] ? TL_SOORTEN[s][0] : s)]));
      return [
        tijd("log", "Logregels", "aantal", "som", f => S.gebeurtenissen.filter(g => !f || g.soort === f).map(g => ({ d: g.datum || (g.ts || "").slice(0, 10), v: 1 })), { filters: soorten }),
        cat("soort", "Logregels per soort", "aantal", (van, tot) => nwoGroep(S.gebeurtenissen.filter(g => nwoIn(g.datum || (g.ts || "").slice(0, 10), van, tot)), g => typeof TL_SOORTEN === "object" && TL_SOORTEN[g.soort] ? TL_SOORTEN[g.soort][0] : g.soort, () => 1)),
        cat("nodes", "Nodes per mindmap", "aantal", () => S.mm_mindmaps.map(m => ({ label: m.naam, v: (m.nodes || []).length })), { periodeloos: true })
      ];
    }
  }
  return [];
}

/* ---------- Tijd in emmers ---------- */
const nwoVolgMaand = d => { const [y, m] = d.split("-").map(Number); return m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`; };
const nwoSleutel = (d, per) => per === "dag" ? d : per === "week" ? weekStart(d) : d.slice(0, 7);
function nwoEmmers(van, tot, per) {
  const uit = [];
  let d = per === "maand" ? van.slice(0, 7) + "-01" : per === "week" ? weekStart(van) : van;
  while (d <= tot && uit.length < 800) { uit.push(nwoSleutel(d, per)); d = per === "dag" ? plusDagen(d, 1) : per === "week" ? plusDagen(d, 7) : nwoVolgMaand(d); }
  return uit;
}
function nwoLabel(k, per, lang) {
  if (per === "maand") { const [y, m] = k.split("-").map(Number); return (lang ? MAANDNAMEN[m - 1] : MAANDKORT[m - 1]) + (lang || y !== +vandaagISO().slice(0, 4) ? " " + (lang ? y : "'" + String(y).slice(2)) : ""); }
  const d = parseISO(k);
  if (per === "week") return lang ? `Wk ${weekNummer(k)} · ${d.getDate()} ${MAANDKORT[d.getMonth()]}` : "wk " + weekNummer(k);
  return lang ? datumLabel(k, true) : `${NWO_DAG[d.getDay()]} ${d.getDate()}`;
}
function nwoReeks(m, st) {
  const v = vandaagISO(), punten = m.data(st.f || "").filter(p => p.d && p.d <= v);
  let van = st.p === "alles" ? punten.reduce((a, p) => p.d < a ? p.d : a, v) : plusDagen(v, -(+st.p - 1));
  let per = st.per, auto = false;
  if (per === "dag" && dagVerschil(v, van) > 120) { per = "week"; auto = true; }
  if (per === "week" && dagVerschil(v, van) > 900) { per = "maand"; auto = true; }
  const sleutels = nwoEmmers(van, v, per), idx = new Map(sleutels.map((k, i) => [k, i]));
  const som = sleutels.map(() => 0), tel = sleutels.map(() => 0);
  punten.forEach(p => { if (p.d < van) return; const i = idx.get(nwoSleutel(p.d, per)); if (i == null) return; som[i] += p.v; tel[i]++; });
  const waarden = sleutels.map((_, i) => m.agg === "gem" ? (tel[i] ? som[i] / tel[i] : null) : som[i]);
  const inPeriode = punten.filter(p => p.d >= van);
  const totaal = m.agg === "gem" ? (inPeriode.length ? inPeriode.reduce((a, p) => a + p.v, 0) / inPeriode.length : null) : inPeriode.reduce((a, p) => a + p.v, 0);
  let vorig = null;
  if (st.p !== "alles") {
    const lengte = +st.p, pv = plusDagen(van, -lengte), pt = plusDagen(van, -1), l = punten.filter(p => p.d >= pv && p.d <= pt);
    if (l.length) vorig = m.agg === "gem" ? l.reduce((a, p) => a + p.v, 0) / l.length : l.reduce((a, p) => a + p.v, 0);
  }
  return { sleutels, waarden, per, auto, totaal, vorig, van, n: inPeriode.length };
}

/* ---------- Tekenen ---------- */
function nwoSchaal(min, max) {
  if (min === max) { max = max + (max === 0 ? 1 : Math.abs(max) * .5); }
  const ruw = (max - min) / 3, mag = Math.pow(10, Math.floor(Math.log10(ruw))), stap = [1, 2, 2.5, 5, 10].map(x => x * mag).find(x => x >= ruw) || ruw;
  return { lo: Math.floor(min / stap) * stap, hi: Math.ceil(max / stap) * stap, stap };
}
function nwoTijdSVG(m, r, w) {
  const W = 300, H = 158, L = 36, R = 6, T = 10, B = 20, pw = W - L - R, ph = H - T - B;
  let vals = r.waarden.slice();
  if (w === "cumulatief") { let s = 0; vals = vals.map(x => (s += x || 0)); }
  const echte = vals.filter(x => x != null);
  if (!echte.length) return `<div class="nwo-leegdiagram">Geen gegevens in deze periode</div>`;
  let mn = Math.min(0, ...echte), mx = Math.max(0, ...echte);
  if (m.agg === "gem" && w !== "staaf") { mn = Math.min(...echte); mx = Math.max(...echte); const marge = (mx - mn) * .15 || 1; mn -= marge; mx += marge; }
  const s = nwoSchaal(mn, mx), y = v => T + ph - (v - s.lo) / (s.hi - s.lo) * ph, n = vals.length, bw = pw / n;
  const x = i => L + bw * (i + .5);
  let g = "";
  for (let t = s.lo; t <= s.hi + s.stap / 2; t += s.stap) g += `<line class="nwo-grid${Math.abs(t) < s.stap / 1000 ? " nul" : ""}" x1="${L}" x2="${W - R}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}"/><text class="nwo-as" x="${L - 5}" y="${(y(t) + 3).toFixed(1)}" text-anchor="end">${esc(nwoKort[m.eenheid](t))}</text>`;
  let merken = "";
  if (w === "staaf") {
    const breed = Math.max(1, bw - 2), nul = y(Math.max(s.lo, Math.min(0, s.hi)));
    vals.forEach((v, i) => {
      if (!v) return;
      const top = Math.min(y(v), nul), h = Math.max(1, Math.abs(y(v) - nul)), r2 = Math.min(3, breed / 2, h);
      merken += `<rect class="nwo-staaf${v < 0 ? " neg" : ""}" data-nwo-i="${i}" x="${(L + bw * i + (bw - breed) / 2).toFixed(1)}" y="${top.toFixed(1)}" width="${breed.toFixed(1)}" height="${h.toFixed(1)}" rx="${r2.toFixed(1)}"/>`;
    });
  } else {
    let pad = "", vlak = "", open = false, startX = 0;
    const basis = y(Math.max(s.lo, 0));
    vals.forEach((v, i) => {
      if (v == null) { if (open) { vlak += `L${x(i - 1).toFixed(1)} ${basis.toFixed(1)}L${startX.toFixed(1)} ${basis.toFixed(1)}Z`; open = false; } return; }
      pad += `${open ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`;
      vlak += `${open ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`;
      if (!open) startX = x(i);
      open = true;
    });
    if (open) { const lastI = vals.length - 1 - [...vals].reverse().findIndex(v => v != null); vlak += `L${x(lastI).toFixed(1)} ${basis.toFixed(1)}L${startX.toFixed(1)} ${basis.toFixed(1)}Z`; }
    merken = `<path class="nwo-vlak" d="${vlak}"/><path class="nwo-lijn" d="${pad}"/>`;
    const eenzaam = vals.map((v, i) => v != null && vals[i - 1] == null && vals[i + 1] == null ? i : -1).filter(i => i >= 0);
    eenzaam.forEach(i => { merken += `<circle class="nwo-punt" cx="${x(i).toFixed(1)}" cy="${y(vals[i]).toFixed(1)}" r="3"/>`; });
    const li = vals.length - 1 - [...vals].reverse().findIndex(v => v != null);
    if (li >= 0 && li < vals.length) merken += `<circle class="nwo-punt eind" cx="${x(li).toFixed(1)}" cy="${y(vals[li]).toFixed(1)}" r="3.5"/>`;
    merken += `<circle class="nwo-punt tip" cx="0" cy="0" r="4.5" style="display:none"/>`;
  }
  const xl = [0, Math.floor((n - 1) / 2), n - 1].filter((v, i, a) => a.indexOf(v) === i).map(i => `<text class="nwo-as" x="${x(i).toFixed(1)}" y="${H - 5}" text-anchor="${i === 0 && n > 1 ? "start" : i === n - 1 && n > 1 ? "end" : "middle"}">${esc(nwoLabel(r.sleutels[i], r.per))}</text>`).join("");
  const raak = vals.map((v, i) => `<rect class="nwo-raak" data-nwo-i="${i}" data-x="${x(i).toFixed(1)}" data-y="${v == null ? "" : y(v).toFixed(1)}" x="${(L + bw * i).toFixed(1)}" y="${T}" width="${bw.toFixed(2)}" height="${ph}"/>`).join("");
  return `<svg class="nwo-grafiek" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(m.naam)}">${g}${merken}${xl}${raak}</svg>`;
}
function nwoCatHTML(m, rijen, w) {
  rijen = rijen.filter(r => r.v > 0 || m.eenheid === "pct").sort((a, b) => b.v - a.v);
  if (!rijen.length) return `<div class="nwo-leegdiagram">Geen gegevens${m.periodeloos ? "" : " in deze periode"}</div>`;
  const fmt = NWO_FMT[m.eenheid], tot = rijen.reduce((a, r) => a + r.v, 0);
  if (w === "tabel") return `<table class="nwo-tabel"><thead><tr><th>${esc(m.naam.replace(/^Per /, ""))}</th><th>Waarde</th>${m.geenDeel ? "" : "<th>Deel</th>"}</tr></thead><tbody>
    ${rijen.map(r => `<tr><td>${esc(r.label)}</td><td>${esc(fmt(r.v))}</td>${m.geenDeel ? "" : `<td>${nwoGetal(tot ? r.v / tot * 100 : 0)}%</td>`}</tr>`).join("")}</tbody>
    ${m.geenDeel ? "" : `<tfoot><tr><td>Totaal</td><td>${esc(fmt(tot))}</td><td>100%</td></tr></tfoot>`}</table>`;
  if (w === "verdeling" && !m.geenDeel) {
    const top = rijen.slice(0, 4), rest = rijen.slice(4), delen = top.map((r, i) => Object.assign({ slot: i }, r));
    if (rest.length) delen.push({ label: `Overig (${rest.length})`, v: rest.reduce((a, r) => a + r.v, 0), slot: "overig" });
    return `<div class="nwo-stapel" role="img" aria-label="Verdeling">${delen.map(d => `<i style="flex:${d.v} 0 0;background:var(--nwo-${d.slot})" title="${esc(d.label)}: ${esc(fmt(d.v))}"></i>`).join("")}</div>
      <div class="nwo-legenda nwo-verdeling">${delen.map(d => `<div class="nwo-lr"><i style="background:var(--nwo-${d.slot})"></i><span class="nm">${esc(d.label)}</span><b>${esc(fmt(d.v))} <small>${nwoGetal(d.v / tot * 100)}%</small></b></div>`).join("")}</div>`;
  }
  const max = Math.max(...rijen.map(r => r.v), m.eenheid === "pct" ? 100 : 0), toon = rijen.slice(0, 8), rest = rijen.slice(8);
  if (rest.length) toon.push({ label: `Overig (${rest.length})`, v: rest.reduce((a, r) => a + r.v, 0), overig: true });
  return `<div class="nwo-balken">${toon.map(r => `<div class="nwo-balk"><div class="nwo-balkkop"><span>${esc(r.label)}</span><b>${esc(fmt(r.v))}</b></div>
    <span class="nwo-balkspoor"><i style="width:${Math.max(1.5, Math.min(100, r.v / (r.overig ? Math.max(max, r.v) : max) * 100)).toFixed(1)}%"></i></span></div>`).join("")}</div>`;
}

/* ---------- Het analyseblok ---------- */
function nwoStand(thema, ms) {
  const alle = inst("nwoAnalyse", {}) || {}, st = Object.assign({ m: ms[0].id, p: "30", per: "dag", w: "", f: "" }, alle[thema] || {});
  const m = ms.find(x => x.id === st.m) || ms[0];
  st.m = m.id;
  const wOpties = m.soort === "tijd" ? NWO_W_TIJD : NWO_W_CAT.filter(x => !(m.geenDeel && x[0] === "verdeling"));
  if (!wOpties.some(x => x[0] === st.w)) st.w = m.voorkeur && wOpties.some(x => x[0] === m.voorkeur) ? m.voorkeur : wOpties[0][0];
  const fOpties = m.filters ? m.filters() : null;
  if (!fOpties || !fOpties.some(x => x[0] === st.f)) st.f = "";
  if (!NWO_PERIODES.some(x => x[0] === st.p)) st.p = "30";
  return { st, m, wOpties, fOpties };
}
function nwoKiezer(sleutel, label, waarde, opties, breed) {
  return `<label class="nwo-kies${breed ? " breed" : ""}"><span>${esc(label)}</span><select data-nwo-f="${sleutel}">${opties.map(([k, n]) => `<option value="${esc(k)}"${String(k) === String(waarde) ? " selected" : ""}>${esc(n)}</option>`).join("")}</select></label>`;
}
function nwoAnalyse(thema) {
  const ms = nwoMetingen(thema);
  if (!ms.length) return "";
  const { st, m, wOpties, fOpties } = nwoStand(thema, ms), fmt = NWO_FMT[m.eenheid];
  let filters = nwoKiezer("m", "Meting", m.id, ms.map(x => [x.id, x.naam]), true);
  if (!m.periodeloos) filters += nwoKiezer("p", "Periode", st.p, NWO_PERIODES);
  if (m.soort === "tijd") filters += nwoKiezer("per", "Indeling", st.per, NWO_PER);
  filters += nwoKiezer("w", "Weergave", st.w, wOpties);
  if (fOpties) filters += nwoKiezer("f", "Filter", st.f, fOpties, true);
  let inhoud = "", kop = "";
  if (m.soort === "tijd") {
    const r = nwoReeks(m, st);
    const echte = r.waarden.filter(x => x != null);
    const hoogste = echte.length ? Math.max(...echte) : null, gem = m.agg === "som" && r.sleutels.length ? r.totaal / r.sleutels.length : null;
    const delta = r.vorig != null && r.totaal != null && r.vorig !== 0 ? (r.totaal - r.vorig) / Math.abs(r.vorig) * 100 : null;
    const perNaam = { dag: "dag", week: "week", maand: "maand" }[r.per];
    kop = `<div class="nwo-tegels">
      <div><span>${m.agg === "gem" ? "Gemiddeld" : "Totaal"}</span><b>${r.totaal == null ? "—" : esc(fmt(r.totaal))}</b>${delta != null ? `<small class="${delta >= 0 === !m.omgekeerd ? "op" : "af"}">${delta >= 0 ? "▲" : "▼"} ${nwoGetal(Math.abs(delta))}% t.o.v. ervoor</small>` : `<small>${nwoGetal(r.n)} ${(m.telwoord || ["registratie", "registraties"])[r.n === 1 ? 0 : 1]}</small>`}</div>
      <div><span>${m.agg === "gem" ? "Hoogste" : "Gem. per " + perNaam}</span><b>${esc(m.agg === "gem" ? (hoogste == null ? "—" : fmt(hoogste)) : fmt(gem || 0))}</b><small>${m.agg === "gem" ? "per " + perNaam : "hoogste: " + (hoogste == null ? "—" : esc(fmt(hoogste)))}</small></div></div>`;
    if (st.w === "tabel") {
      const rijen = r.sleutels.map((k, i) => ({ k, v: r.waarden[i] })).reverse();
      let cum = r.waarden.reduce((a, v) => a + (v || 0), 0);
      inhoud = `<table class="nwo-tabel"><thead><tr><th>${r.per === "dag" ? "Dag" : r.per === "week" ? "Week" : "Maand"}</th><th>${esc(m.agg === "gem" ? "Gemiddeld" : "Waarde")}</th>${m.agg === "som" ? "<th>Opgeteld</th>" : ""}</tr></thead><tbody>
        ${rijen.map(x => { const rij = `<tr class="${x.v ? "" : "nul"}"><td>${esc(nwoLabel(x.k, r.per, true))}</td><td>${x.v == null ? "—" : esc(fmt(x.v))}</td>${m.agg === "som" ? `<td>${esc(fmt(cum))}</td>` : ""}</tr>`; cum -= x.v || 0; return rij; }).join("")}</tbody></table>`;
    } else {
      inhoud = `<div class="nwo-tip" aria-live="polite">${r.auto ? `Automatisch per ${perNaam}: te veel ${st.per === "dag" ? "dagen" : "weken"} voor één diagram` : "Tik op het diagram voor een waarde"}</div>${nwoTijdSVG(m, r, st.w)}`;
    }
    V.nwoReeksNu = { thema, r, m, w: st.w };
  } else {
    const v = vandaagISO(), van = st.p === "alles" ? "0000-00-00" : plusDagen(v, -(+st.p - 1));
    const rijen = m.rijen(van, v).filter(x => x.label != null);
    const tot = rijen.reduce((a, x) => a + x.v, 0), top = rijen.slice().sort((a, b) => b.v - a.v)[0];
    kop = `<div class="nwo-tegels">
      <div><span>${m.geenDeel ? "Gemiddeld" : "Totaal"}</span><b>${esc(fmt(m.geenDeel ? (rijen.length ? tot / rijen.length : 0) : tot))}</b><small>${rijen.length} ${rijen.length === 1 ? "onderdeel" : "onderdelen"}</small></div>
      <div><span>Grootste</span><b class="lang">${top ? esc(top.label) : "—"}</b><small>${top ? esc(fmt(top.v)) + (m.geenDeel || !tot ? "" : ` · ${nwoGetal(top.v / tot * 100)}%`) : ""}</small></div></div>`;
    inhoud = nwoCatHTML(m, rijen, st.w);
  }
  return `<div class="nwo-analyse" data-thema="${thema}">
    <div class="nwo-filters">${filters}</div>
    ${kop}${inhoud}</div>`;
}

/* ---------- Interactie ---------- */
document.addEventListener("change", async e => {
  const s = e.target.closest && e.target.closest(".nw-paneel select[data-nwo-f]");
  if (!s) return;
  const blok = s.closest(".nwo-analyse"), thema = blok && blok.dataset.thema; if (!thema) return;
  const alle = Object.assign({}, inst("nwoAnalyse", {}) || {}), st = Object.assign({}, alle[thema] || {});
  st[s.dataset.nwoF] = s.value;
  if (s.dataset.nwoF === "m") { st.w = ""; st.f = ""; }
  if (s.dataset.nwoF === "p") st.per = { "7": "dag", "30": "dag", "90": "week", "365": "maand", alles: "maand" }[s.value] || st.per;
  alle[thema] = st;
  await zetInst("nwoAnalyse", alle);
  nwoHerteken();
});
function nwoToonTip(el) {
  const blok = el.closest(".nwo-analyse"), info = V.nwoReeksNu; if (!blok || !info) return;
  const i = +el.dataset.nwoI, r = info.r, m = info.m;
  let v = r.waarden[i];
  if (info.w === "cumulatief") v = r.waarden.slice(0, i + 1).reduce((a, x) => a + (x || 0), 0);
  const tip = blok.querySelector(".nwo-tip");
  if (tip) tip.innerHTML = `<b>${esc(nwoLabel(r.sleutels[i], r.per, true))}</b> · ${v == null ? "geen gegevens" : esc(NWO_FMT[m.eenheid](v))}${info.w === "cumulatief" ? " opgeteld" : ""}`;
  const heeft = !!blok.querySelector(`.nwo-staaf[data-nwo-i="${i}"]`);
  blok.querySelectorAll(".nwo-staaf").forEach(s => s.classList.toggle("dim", heeft && s.dataset.nwoI !== String(i)));
  const p = blok.querySelector(".nwo-punt.tip");
  if (p) { if (el.dataset.y) { p.setAttribute("cx", el.dataset.x); p.setAttribute("cy", el.dataset.y); p.style.display = ""; } else p.style.display = "none"; }
}
document.addEventListener("click", e => { const el = e.target.closest && e.target.closest(".nw-paneel .nwo-raak"); if (el) nwoToonTip(el); });
document.addEventListener("pointerover", e => { if (e.pointerType !== "mouse") return; const el = e.target.closest && e.target.closest(".nw-paneel .nwo-raak"); if (el) nwoToonTip(el); });
