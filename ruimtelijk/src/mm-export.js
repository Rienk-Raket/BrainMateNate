"use strict";
/* ==========================================================================
   62. Mindmap exporteren — met behoud van structuur
   Een mindmap (of één tak) wordt een checklist, project, werkproject,
   side hustle-checklist of SCRUM-backlog/sprint. De boom blijft zichtbaar:
     middelpunt   → naam van de lijst / het project / het productdoel
     hoofdtak     → kopje, groep, label (epic)
     onderdeel    → subkopje, taak, checklistpunt of kaart
     stappen      → items, subtaken, subpunten of acceptatiecriteria
     diepere tak  → sub-subkopje of geneste subtaak
   Opnieuw exporteren werkt bij: nieuwe punten erbij, je vinkjes en eigen
   toevoegingen blijven. Afvinken loopt in beide richtingen gelijk.
   ========================================================================== */
const MX = { bezig: false, wacht: new Set(), timer: 0 };
const MX_DOELEN = {
  checklist:  { naam: "Checklist", ico: "lijst", kleur: "#0f8b6c", uitleg: "Kopjes per tak, stappen om af te vinken" },
  project:    { naam: "Project", ico: "map", kleur: "#2f6fed", uitleg: "Taken met geneste subtaken, per tak gegroepeerd" },
  werk:       { naam: "Werkproject", ico: "koffer", kleur: "#c0202f", uitleg: "Hetzelfde, als werktaken" },
  sidehustle: { naam: "Side hustle", ico: "raket", kleur: "#d97706", uitleg: "Checklistpunten, gegroepeerd per tak" },
  scrum:      { naam: "SCRUM", ico: "kringloop", kleur: "#7a4fd6", uitleg: "Kaarten op de backlog of in een sprint" }
};
const MX_WINKELS = new Set(["checklists", "taken", "sh_checks", "sh_kaarten"]);

/* ---------- De boom ---------- */
function mxBoom(nodes, startId) {
  const alle = Array.from(nodes), kids = new Map();
  alle.forEach(n => { if (n.parentId && !n.voorbeeld) { if (!kids.has(n.parentId)) kids.set(n.parentId, []); kids.get(n.parentId).push(n); } });
  const bouw = (n, d, pad) => {
    const tekst = mmZonderVink(n.tekst).replace(/\s+/g, " ").trim() || "Naamloos";
    const k = { id: n.id, tekst, af: /^✓/.test(n.tekst || ""), kleur: n.kleur || "", notitie: n.notitie || "", diepte: d, pad: pad.concat(tekst),
      deadline: n.deadline || n.eindDatum || null, start: n.startDatum || null, personen: n.personen || [],
      stappen: (n.checklist || []).filter(c => String(c.tekst || "").trim()).map(c => ({ id: c.id, tekst: String(c.tekst).trim(), af: !!c.af })) };
    k.kids = (kids.get(n.id) || []).map(c => bouw(c, d + 1, k.pad));
    return k;
  };
  const start = alle.find(n => n.id === startId);
  return start ? bouw(start, 0, []) : null;
}
const mxIsBlad = n => !n.stappen.length && !n.kids.length;
function mxTel(b) {
  let takken = 0, stappen = 0, bladen = 0, diep = 0;
  const loop = n => { diep = Math.max(diep, n.diepte - b.diepte); if (n !== b) { takken++; if (mxIsBlad(n)) bladen++; } stappen += n.stappen.length; n.kids.forEach(loop); };
  loop(b);
  return { takken, stappen, punten: stappen + bladen, diep, hoofd: b.kids.length };
}
/** Alle afvinkbare sleutels in een tak: stappen (s:) en losse eindnodes (n:). */
function mxSleutels(b) {
  const uit = new Map();
  const loop = n => { n.stappen.forEach(s => uit.set("s:" + s.id, s.af)); n.kids.forEach(k => { if (mxIsBlad(k)) uit.set("n:" + k.id, k.af); loop(k); }); };
  loop(b);
  return uit;
}

/** Eenheden: wat wordt één taak, punt of kaart. */
function mxEenheden(b, per) {
  const u = [], zonder = n => Object.assign({}, n, { kids: [] });
  if (b.stappen.length) u.push({ node: zonder(b), titel: b.tekst, groep: null, kleur: b.kleur, sleutel: "u:" + b.id + ":eigen" });
  b.kids.forEach(k1 => {
    if (per === "hoofdtak" || mxIsBlad(k1)) { u.push({ node: k1, titel: k1.tekst, groep: null, kleur: k1.kleur, sleutel: "u:" + k1.id }); return; }
    if (k1.stappen.length) u.push({ node: zonder(k1), titel: k1.tekst + " (algemeen)", groep: k1.tekst, kleur: k1.kleur, sleutel: "u:" + k1.id + ":eigen" });
    k1.kids.forEach(k2 => u.push({ node: k2, titel: k2.tekst, groep: k1.tekst, kleur: k1.kleur || k2.kleur, sleutel: "u:" + k2.id }));
  });
  return u;
}
/** Stappen en onderliggende takken van één eenheid, genest met een niveau. */
function mxSubs(n) {
  const uit = [];
  const loop = (x, nv) => {
    x.stappen.forEach(s => uit.push({ tekst: s.tekst, af: s.af, niveau: nv, k: "s:" + s.id }));
    x.kids.forEach(c => {
      if (mxIsBlad(c)) { uit.push({ tekst: c.tekst, af: c.af, niveau: nv, k: "n:" + c.id }); return; }
      const kop = { tekst: c.tekst, af: false, niveau: nv, k: "g:" + c.id, kop: true }, i = uit.push(kop);
      loop(c, nv + 1);
      const onder = uit.slice(i).filter(y => !y.kop);
      kop.af = onder.length > 0 && onder.every(y => y.af);
    });
  };
  loop(n, 0);
  return uit;
}
/** Platte versie (voor lijsten zonder niveaus): "Kop › stap". */
function mxPlat(subs) {
  const stapel = [], uit = [];
  subs.forEach(s => {
    stapel.length = s.niveau;
    if (s.kop) { stapel[s.niveau] = s.tekst; return; }
    const pre = stapel.filter(Boolean).join(" › ");
    uit.push({ tekst: pre ? pre + " › " + s.tekst : s.tekst, af: s.af, k: s.k });
  });
  return uit;
}
const mxSchat = n => n <= 1 ? 1 : n === 2 ? 2 : n <= 4 ? 3 : n <= 6 ? 5 : n <= 10 ? 8 : 13;

/** Oude en nieuwe lijst samenvoegen: gekoppelde items volgen de mindmap, eigen items blijven op hun plek. */
function mxVoegSamen(oud, nieuw) {
  const sl = x => x && x.mx && x.mx.k;
  const eigen = []; let anker = null;
  (oud || []).forEach(x => { if (sl(x)) anker = sl(x); else eigen.push({ x, anker }); });
  const uit = nieuw.slice();
  eigen.forEach(({ x, anker }) => {
    if (anker == null) { uit.unshift(x); return; }
    const i = uit.findIndex(y => sl(y) === anker);
    if (i < 0) { uit.push(x); return; }
    let j = i + 1; while (j < uit.length && !sl(uit[j])) j++;
    uit.splice(j, 0, x);
  });
  return uit;
}

/* ---------- Plannen per doel (zuiver: ook gebruikt voor het voorbeeld) ---------- */
function mxPlanChecklist(b, o) {
  const b0 = b.diepte;
  const items = (x, basis) => {
    const r = [];
    const loop = (y, L) => {
      if (L > 0) r.push({ tekst: "#".repeat(Math.min(L, 3)) + " " + (L > 3 ? y.pad.slice(basis + 3).join(" › ") : y.tekst), af: false, k: "h:" + y.id, kleur: y.kleur, kop: L });
      y.stappen.forEach(s => r.push({ tekst: s.tekst, af: s.af, k: "s:" + s.id }));
      y.kids.filter(mxIsBlad).forEach(c => r.push({ tekst: c.tekst, af: c.af, k: "n:" + c.id }));
      y.kids.filter(c => !mxIsBlad(c)).forEach(c => loop(c, L + 1));
    };
    loop(x, 0);
    return r;
  };
  if (o.lijsten !== "per") return [{ sleutel: "l:" + b.id, naam: b.tekst, items: items(b, b0) }];
  const uit = [];
  const los = Object.assign({}, b, { kids: b.kids.filter(mxIsBlad) });
  if (los.stappen.length || los.kids.length) uit.push({ sleutel: "l:" + b.id, naam: b.tekst, items: items(los, b0) });
  b.kids.filter(k => !mxIsBlad(k)).forEach(k => uit.push({ sleutel: "l:" + k.id, naam: `${b.tekst} – ${k.tekst}`, items: items(k, k.diepte) }));
  return uit;
}
function mxPlanEenheden(b, o, plat) {
  return mxEenheden(b, o.per).map((u, i) => {
    const subs = mxSubs(u.node);
    return Object.assign(u, { volg: i, subs: plat ? mxPlat(subs) : subs, blad: mxIsBlad(u.node) && u.node.id !== b.id });
  });
}

/* ---------- Uitvoeren ---------- */
const mxMet = (mmId, k, extra) => Object.assign({ mm: mmId, k }, extra || {});
async function mxNaarChecklist(mm, b, o) {
  const lijsten = mxPlanChecklist(b, o), ids = [];
  for (const l of lijsten) {
    const oud = !o.kopie && S.checklists.find(c => c.mx && c.mx.mm === mm.id && c.mx.l === l.sleutel);
    const nieuw = l.items.map(it => Object.assign({ tekst: it.tekst, af: it.af, mx: mxMet(mm.id, it.k) }, it.kleur ? { kleur: it.kleur } : {}));
    const c = oud || { id: uid(), naam: l.naam, sjabloon: false, items: [], gemaakt: new Date().toISOString() };
    c.items = mxVoegSamen(oud ? oud.items : [], nieuw);
    c.mx = { mm: mm.id, l: l.sleutel, node: l.sleutel.slice(2) };
    await bewaar("checklists", c);
    ids.push(c.id);
  }
  return { ids, open: () => ids.length === 1 ? ga("checklist", ids[0]) : ga("checklists"), tekst: ids.length === 1 ? "Checklist klaar" : `${ids.length} checklists klaar` };
}
async function mxNaarProject(mm, b, o, werk) {
  const p = await maakProject(b.tekst);
  const plan = mxPlanEenheden(b, o, false), ids = [];
  const bestaand = o.kopie ? [] : S.taken.filter(t => t.mx && t.mx.mm === mm.id && t.projectId === p.id);
  for (const u of plan) {
    const oud = bestaand.find(t => t.mx.u === u.sleutel);
    const t = oud || { id: uid(), titel: "", notitie: [u.node.notitie, "Uit mindmap: " + mm.naam + (u.groep ? " › " + u.groep : "")].filter(Boolean).join("\n\n"),
      datum: null, tijd: null, herhaal: null, prioriteit: 4, projectId: p.id, labels: [], personen: [], subtaken: [], bijlagen: [], hangtAf: [],
      duur: null, energie: null, af: false, gemaakt: new Date().toISOString(), volgorde: Date.now() + u.volg };
    t.titel = u.titel; t.projectId = p.id;
    if (werk) t.werk = true;
    t.datum = t.datum || u.node.deadline || u.node.start || null;
    if (u.groep && !(t.labels || []).includes(u.groep)) t.labels = (t.labels || []).concat(u.groep);
    t.personen = [...new Set([...(t.personen || []), ...(u.node.personen || [])])];
    t.mxGroep = u.groep; t.mxKleur = u.kleur; t.mxVolg = u.volg;
    t.subtaken = normaliseerSubtaken(mxVoegSamen(oud ? oud.subtaken : [], u.subs.map(s => ({ tekst: s.tekst, af: s.af, niveau: s.niveau, mx: mxMet(mm.id, s.k) }))));
    t.mx = { mm: mm.id, u: u.sleutel, k: u.blad ? "n:" + u.node.id : null };
    if (!oud && u.blad && u.node.af) { t.af = true; t.afOp = new Date().toISOString(); }
    await bewaar("taken", t);
    ids.push(t.id);
  }
  return { ids, projectId: p.id, open: () => ga("project", p.id), tekst: `${plan.length} ${werk ? "werktaken" : "taken"} in ${p.naam}` };
}
async function mxNieuweHustle(b, o) {
  const h = await shMaakAan({ naam: b.tekst, emoji: "🧠", soorten: [], verliesEuro: "0", verliesUren: "0" });
  if (o.kaal) {
    const ops = [];
    shVan("sh_checks", h.id).forEach(c => ops.push(["sh_checks", null, c.id]));
    shVan("sh_kaarten", h.id).forEach(k => ops.push(["sh_kaarten", null, k.id]));
    shVan("sh_experimenten", h.id).forEach(x => ops.push(["sh_experimenten", null, x.id]));
    if (ops.length) await shBewaarVeel(ops);
  }
  return h;
}
async function mxNaarSideHustle(mm, b, o) {
  const h = o.hustle ? shH(o.hustle) : await mxNieuweHustle(b, o);
  if (!h) throw new Error("Side hustle niet gevonden");
  const plan = mxPlanEenheden(b, o, true), ops = [];
  const bestaand = o.kopie ? [] : shVan("sh_checks", h.id).filter(c => c.mx && c.mx.mm === mm.id);
  plan.forEach(u => {
    const oud = bestaand.find(c => c.mx.u === u.sleutel);
    const c = oud || shCheckRecord(h, { volgorde: 2000 + u.volg, notitie: u.node.notitie || "" });
    c.titel = u.titel;
    c.subpunten = mxVoegSamen(oud ? oud.subpunten : [], u.subs.map(s => ({ t: s.tekst, af: s.af, mx: mxMet(mm.id, s.k) })));
    c.mxGroep = u.groep || b.tekst; c.mxKleur = u.kleur || ""; c.mxVolg = u.volg;
    c.deadline = c.deadline || u.node.deadline || null;
    c.mx = { mm: mm.id, u: u.sleutel, k: u.blad ? "n:" + u.node.id : null };
    if (!oud && u.blad && u.node.af) { c.status = "klaar"; c.afOp = shNu(); }
    ops.push(["sh_checks", c]);
  });
  h.checkGroep = "mindmap"; h.laatsteTab = "checklist";
  ops.push(["sh_hustles", h]);
  await shBewaarVeel(ops);
  return { ids: ops.map(x => x[1].id), hustleId: h.id, open: () => ga("sh", h.id), tekst: `${plan.length} punten in ${h.emoji} ${h.naam}` };
}
async function mxNaarScrum(mm, b, o) {
  const h = o.hustle ? shH(o.hustle) : await mxNieuweHustle(b, o);
  if (!h) throw new Error("Side hustle niet gevonden");
  const ops = [];
  let sp = null;
  if (o.waar === "nieuw" && !shActieveSprint(h)) {
    const st = vandaagISO(), wk = h.sprintWeken || 1;
    sp = { id: uid(), shId: h.id, nummer: shSprints(h).length + 1, doel: b.tekst, start: st, eind: plusDagen(st, wk * 7 - 1), status: "actief", punten: 0, afPunten: 0, bd: {}, retro: null, review: "", gemaakt: shNu() };
    ops.push(["sh_sprints", sp]);
  } else if (o.waar !== "backlog") sp = shActieveSprint(h);
  const kol = (sp ? shKolomRol(h, "sprint") : shKolomRol(h, "backlog")) || shKolommen(h)[0];
  const klaarKol = shKolomRol(h, "klaar");
  const plan = mxPlanEenheden(b, o, true);
  const bestaand = o.kopie ? [] : shVan("sh_kaarten", h.id).filter(k => k.mx && k.mx.mm === mm.id && !k.gearchiveerd);
  plan.forEach(u => {
    const oud = bestaand.find(k => k.mx.u === u.sleutel);
    const k = oud || shNieuweKaart(h, kol.id, { volgorde: Date.now() + u.volg, omschrijving: u.node.notitie || "", moscow: "S" });
    k.titel = u.titel;
    const lijst = u.subs.map(s => ({ tekst: s.tekst, af: s.af, mx: mxMet(mm.id, s.k) }));
    if (o.stappen === "acceptatie") k.acceptatie = mxVoegSamen(oud ? (oud.acceptatie || []) : [], lijst);
    else k.subtaken = mxVoegSamen(oud ? (oud.subtaken || []) : [], lijst);
    if (u.groep && !(k.labels || []).includes(u.groep)) k.labels = (k.labels || []).concat(u.groep);
    k.mxGroep = u.groep; k.mxKleur = u.kleur || ""; k.mxVolg = u.volg;
    if (o.punten && k.punten == null) k.punten = mxSchat(Math.max(1, lijst.length));
    k.deadline = k.deadline || u.node.deadline || null;
    k.mx = { mm: mm.id, u: u.sleutel, k: u.blad ? "n:" + u.node.id : null };
    const isKlaar = shIsKlaar(h, k);
    if (sp && !k.sprintId && !isKlaar) { k.sprintId = sp.id; if (!oud || ["idee", "backlog"].includes((vind("sh_kolommen", k.kolomId) || {}).rol)) k.kolomId = kol.id; }
    if (!oud && u.blad && u.node.af && klaarKol) { k.kolomId = klaarKol.id; k.klaarOp = shNu(); }
    shKaartLog(k, oud ? "Bijgewerkt vanuit mindmap " + mm.naam : "Gemaakt vanuit mindmap " + mm.naam);
    ops.push(["sh_kaarten", k]);
  });
  if (o.productdoel && !String(h.productdoel || "").trim()) h.productdoel = b.tekst;
  h.laatsteTab = "scrum";
  ops.push(["sh_hustles", h]);
  await shBewaarVeel(ops);
  const s2 = shBurndownNoteer(h); if (s2) await bewaar("sh_sprints", s2);
  if (sp && ops[0][1] === sp) await logGebeurtenis("sidehustle", `${h.naam}: sprint ${sp.nummer} gestart — ${sp.doel}`, h.id, { shId: h.id });
  return { ids: plan.map(u => u.sleutel), hustleId: h.id, open: () => { V.shSc = sp ? "sprint" : "backlog"; ga("sh", h.id); },
    tekst: `${plan.length} kaarten ${sp ? "in sprint " + sp.nummer : "op de backlog"} van ${h.naam}` };
}
async function mxExporteer(E, doel, o) {
  E.spoel();
  const mm = E.mm, startId = o.tak || E.rootId;
  await mxSync(mm.id);
  const b = mxBoom(E.nodes.values(), startId);
  if (!b) throw new Error("Tak niet gevonden");
  MX.bezig = true;
  let r;
  try {
    r = doel === "checklist" ? await mxNaarChecklist(mm, b, o)
      : doel === "project" ? await mxNaarProject(mm, b, o, false)
      : doel === "werk" ? await mxNaarProject(mm, b, o, true)
      : doel === "sidehustle" ? await mxNaarSideHustle(mm, b, o)
      : await mxNaarScrum(mm, b, o);
    mm.mxAf = mm.mxAf || {};
    mxSleutels(b).forEach((af, k) => { mm.mxAf[k] = af; });
    mm.mxExports = (mm.mxExports || []).filter(x => !(x.doel === doel && x.tak === b.id));
    mm.mxExports.push({ doel, tak: b.id, takNaam: b.tekst, ts: new Date().toISOString(), hustle: r.hustleId || null, projectId: r.projectId || null, ids: r.ids });
    await bewaar("mm_mindmaps", mm);
  } finally { MX.bezig = false; }
  await logGebeurtenis("mindmap", `Mindmap “${b.tekst}” geëxporteerd naar ${MX_DOELEN[doel].naam.toLowerCase()}`, mm.id);
  return r;
}

/* ---------- Synchroon afvinken ---------- */
function mxEngine(mmId) {
  if (MM.hoofd && MM.hoofd.mmId === mmId) return MM.hoofd;
  const p = (MM.pips || []).find(p => p.mmId === mmId && p.engine);
  return p ? p.engine : null;
}
function mxMindmapKant(mmId) {
  const E = mxEngine(mmId), mm = mmVind(mmId); if (!mm) return null;
  const nodes = E ? Array.from(E.nodes.values()) : mm.nodes, stap = new Map(), node = new Map();
  nodes.forEach(n => { node.set(n.id, n); (n.checklist || []).forEach(c => stap.set(c.id, c)); });
  return {
    E, mm,
    get(k) {
      const id = k.slice(2);
      if (k[0] === "s") { const c = stap.get(id); return c ? !!c.af : null; }
      if (k[0] === "n") { const n = node.get(id); return n ? /^✓/.test(n.tekst || "") : null; }
      return null;
    },
    set(k, v) {
      const id = k.slice(2);
      if (k[0] === "s") { const c = stap.get(id); if (c) c.af = v; }
      else if (k[0] === "n") { const n = node.get(id); if (n) n.tekst = (v ? "✓ " : "") + mmZonderVink(n.tekst).trim(); }
    }
  };
}
function mxDoelItems(mmId) {
  const uit = [];
  const voeg = (lijst, w, obj) => (lijst || []).forEach(it => { const k = it && it.mx && it.mx.k; if (k && /^[sn]:/.test(k)) uit.push({ k, w, obj, get: () => !!it.af, set: v => { it.af = v; } }); });
  S.checklists.forEach(c => { if (c.mx && c.mx.mm === mmId) voeg(c.items, "checklists", c); });
  S.taken.forEach(t => {
    if (!t.mx || t.mx.mm !== mmId) return;
    if (t.mx.k) uit.push({ k: t.mx.k, w: "taken", obj: t, get: () => !!t.af, set: v => { t.af = v; t.afOp = v ? new Date().toISOString() : null; } });
    voeg(t.subtaken, "taken", t);
  });
  S.sh_checks.forEach(c => {
    if (!c.mx || c.mx.mm !== mmId) return;
    if (c.mx.k) uit.push({ k: c.mx.k, w: "sh_checks", obj: c, get: () => c.status === "klaar" || c.status === "nvt", set: v => { c.status = v ? "klaar" : "open"; c.afOp = v ? shNu() : null; } });
    voeg(c.subpunten, "sh_checks", c);
  });
  S.sh_kaarten.forEach(k => {
    if (!k.mx || k.mx.mm !== mmId || k.gearchiveerd) return;
    const h = shH(k.shId); if (!h) return;
    if (k.mx.k) uit.push({ k: k.mx.k, w: "sh_kaarten", obj: k, get: () => shIsKlaar(h, k), set: v => {
      const doel = shKolomRol(h, v ? "klaar" : (k.sprintId ? "sprint" : "backlog"));
      if (doel) { k.kolomId = doel.id; k.klaarOp = v ? shNu() : null; shKaartLog(k, v ? "Klaar via de mindmap" : "Weer open via de mindmap"); }
    } });
    voeg(k.subtaken, "sh_kaarten", k); voeg(k.acceptatie, "sh_kaarten", k);
  });
  return uit;
}
/** Drierichtingsvergelijking per sleutel: wat veranderde sinds de vorige keer wint (bij twijfel de mindmap). */
async function mxSync(mmId) {
  const mm = mmVind(mmId);
  if (!mm || !mm.mxAf) return 0;
  const kant = mxMindmapKant(mmId), doelen = mxDoelItems(mmId);
  if (!kant || !doelen.length) return 0;
  const perK = new Map();
  doelen.forEach(d => { if (!perK.has(d.k)) perK.set(d.k, []); perK.get(d.k).push(d); });
  let mmNodes = false, mmMeta = false, n = 0;
  const vuil = new Map();
  perK.forEach((lijst, k) => {
    const mv = kant.get(k); if (mv === null) return;
    const vorig = k in mm.mxAf ? mm.mxAf[k] : mv;
    let w = mv;
    if (mv === vorig) { const t = lijst.find(d => d.get() !== vorig); if (t) w = t.get(); }
    if (mv !== w) { kant.set(k, w); mmNodes = true; n++; }
    lijst.forEach(d => { if (d.get() !== w) { d.set(w); vuil.set(d.w + ":" + d.obj.id, [d.w, d.obj]); n++; } });
    if (mm.mxAf[k] !== w) { mm.mxAf[k] = w; mmMeta = true; }
  });
  if (!vuil.size && !mmNodes && !mmMeta) return 0;
  MX.bezig = true;
  try {
    for (const [w, obj] of vuil.values()) await bewaar(w, obj);
    const hustles = new Set([...vuil.values()].filter(([w]) => w === "sh_kaarten").map(([, k]) => k.shId));
    for (const id of hustles) { const s2 = shBurndownNoteer(shH(id)); if (s2) await bewaar("sh_sprints", s2); }
    if (mmNodes && kant.E) { kant.E.render(); kant.E.opslaan(true); }
    else await bewaar("mm_mindmaps", mm);
  } catch (e) { console.error("mindmap-export-sync", e); }
  finally { MX.bezig = false; }
  return n;
}
function mxPlan(mmId) {
  if (!mmId) return;
  MX.wacht.add(mmId);
  clearTimeout(MX.timer);
  MX.timer = setTimeout(async () => { const ids = [...MX.wacht]; MX.wacht.clear(); for (const id of ids) await mxSync(id); }, 40);
}
{
  const _b = bewaar;
  bewaar = async function (w, obj) {
    const stil = MX.bezig;
    const r = await _b(w, obj);
    if (!stil && obj) {
      if (w === "mm_mindmaps" && obj.mxAf) mxPlan(obj.id);
      else if (MX_WINKELS.has(w) && obj.mx && obj.mx.mm) mxPlan(obj.mx.mm);
    }
    return r;
  };
  const _v = shBewaarVeel;
  shBewaarVeel = async function (ops) {
    const stil = MX.bezig;
    const r = await _v(ops);
    if (!stil) ops.forEach(([w, obj]) => { if (obj && MX_WINKELS.has(w) && obj.mx && obj.mx.mm) mxPlan(obj.mx.mm); });
    return r;
  };
}

/* ---------- Het exportblad ---------- */
function mxVoorbeeldHTML(doel, b, o) {
  const regels = [], max = 34;
  const r = (nv, tekst, soort, extra) => regels.push(`<div class="mx-r ${soort || ""}" style="--nv:${nv}">${esc(tekst)}${extra ? `<span class="mx-rx">${esc(extra)}</span>` : ""}</div>`);
  let som = "";
  if (doel === "checklist") {
    const l = mxPlanChecklist(b, o);
    const items = l.reduce((a, x) => a + x.items.filter(i => !i.kop).length, 0), kop = l.reduce((a, x) => a + x.items.filter(i => i.kop).length, 0);
    som = `${l.length} ${l.length === 1 ? "checklist" : "checklists"} · ${kop} kopjes · ${items} punten`;
    l.forEach(x => { r(0, x.naam, "titel"); let lv = 0; x.items.forEach(i => { if (i.kop) { lv = Math.min(i.kop, 3); r(lv, i.tekst.replace(/^#+\s*/, ""), "kop k" + lv); } else r(lv + 1, i.tekst, "item"); }); });
  } else {
    const plat = doel === "sidehustle" || doel === "scrum", plan = mxPlanEenheden(b, o, plat);
    const subs = plan.reduce((a, u) => a + u.subs.filter(s => !s.kop).length, 0);
    const woord = { project: "taken", werk: "werktaken", sidehustle: "punten", scrum: "kaarten" }[doel];
    const subWoord = doel === "sidehustle" ? "subpunten" : doel === "scrum" ? (o.stappen === "acceptatie" ? "acceptatiecriteria" : "subtaken") : "subtaken";
    som = `${plan.length} ${woord} · ${subs} ${subWoord}`;
    if (doel === "scrum") {
      const pt = o.punten ? plan.reduce((a, u) => a + mxSchat(Math.max(1, u.subs.length)), 0) : 0;
      if (pt) som += ` · ± ${pt} punten`;
      r(0, o.waar === "backlog" ? "Productbacklog" : o.waar === "nieuw" ? `Sprint · doel: ${b.tekst}` : "Lopende sprint", "titel");
    } else r(0, doel === "sidehustle" ? (o.hustle ? (shH(o.hustle) || {}).naam || b.tekst : b.tekst) : b.tekst, "titel");
    let groep;
    plan.forEach(u => {
      const g = u.groep || (doel === "sidehustle" ? b.tekst : null);
      if (g !== groep) { groep = g; if (g) r(1, g, "kop k1"); }
      r(g ? 2 : 1, u.titel, "eenheid", u.subs.length ? `${u.subs.filter(s => !s.kop).length}${doel === "scrum" && o.punten ? " · " + mxSchat(Math.max(1, u.subs.length)) + " pt" : ""}` : (u.blad ? "" : ""));
      u.subs.forEach(s => r((g ? 3 : 2) + (s.niveau || 0), s.tekst, s.kop ? "subkop" : "item"));
    });
  }
  const extra = regels.length - max;
  return `<div class="mx-som">${som}</div><div class="mx-voorbeeld">${regels.slice(0, max).join("")}${extra > 0 ? `<div class="mx-r meer">… en nog ${extra} regels</div>` : ""}</div>`;
}
function mxExportBlad(E) {
  if (!E) return;
  E.spoel();
  const mm = E.mm;
  const sel = E.sel && E.sel !== E.rootId && E.nodes.get(E.sel) && !E.nodes.get(E.sel).voorbeeld ? E.sel : null;
  const hustles = shActief();
  const st = V.mxKeuze = Object.assign({ doel: "checklist", tak: sel ? "tak" : "alles", kopie: false,
    checklist: { lijsten: "een" }, project: { per: "onderdeel" }, werk: { per: "onderdeel" },
    sidehustle: { hustle: "", per: "onderdeel", kaal: true }, scrum: { hustle: "", per: "onderdeel", waar: "backlog", stappen: "subtaken", punten: true, kaal: true, productdoel: true } }, V.mxKeuze || {});
  st.tak = sel ? st.tak : "alles"; st.kopie = false;
  ["sidehustle", "scrum"].forEach(d => { if (st[d].hustle && !shH(st[d].hustle)) st[d].hustle = ""; if (!st[d].hustle && hustles.length && !st[d]._gekozen) st[d].hustle = ""; });
  const seg = (sleutel, waarde, opties) => `<div class="segment mx-seg">${opties.map(([k, n, uit]) =>
    `<button data-mxo="${sleutel}" data-w="${k}" aria-pressed="${String(waarde) === String(k)}"${uit ? " disabled" : ""}>${esc(n)}</button>`).join("")}</div>`;
  const schakel = (sleutel, aan, tekst, sub) => `<div class="schakel"><span class="tekst">${esc(tekst)}${sub ? `<small>${esc(sub)}</small>` : ""}</span><button class="toggle" data-mxt="${sleutel}" aria-pressed="${!!aan}" aria-label="${esc(tekst)}"></button></div>`;
  const teken2 = () => {
    const b = mxBoom(E.nodes.values(), st.tak === "tak" && sel ? sel : E.rootId);
    if (!b) return;
    const t = mxTel(b), d = st.doel, o = st[d];
    const vb1 = b.kids.find(k => !mxIsBlad(k)), vb2 = vb1 && vb1.kids[0];
    const eerder = (mm.mxExports || []).find(x => x.doel === d && x.tak === b.id);
    let opties = "";
    if (d === "checklist") opties = `<div class="veld"><span class="labeltekst">Lijsten</span>${seg("lijsten", o.lijsten, [["een", "Eén lijst met kopjes"], ["per", "Een lijst per hoofdtak"]])}</div>`;
    else {
      if (d === "sidehustle" || d === "scrum") {
        opties += `<div class="veld"><label class="labeltekst" for="mx-hustle">Side hustle</label><select class="invoer" id="mx-hustle">
          <option value="">＋ Nieuwe side hustle “${esc(b.tekst)}”</option>${hustles.map(h => `<option value="${h.id}"${o.hustle === h.id ? " selected" : ""}>${esc(h.emoji + " " + h.naam)}</option>`).join("")}</select></div>`;
      }
      const eenheid = { project: "Taak", werk: "Werktaak", sidehustle: "Punt", scrum: "Kaart" }[d];
      opties += `<div class="veld"><span class="labeltekst">${eenheid} per</span>${seg("per", o.per, [["onderdeel", "Onderdeel" + (vb2 ? ` (${mmbKort(vb2.tekst, 18)})` : "")], ["hoofdtak", "Hoofdtak" + (vb1 ? ` (${mmbKort(vb1.tekst, 16)})` : "")]])}</div>`;
      if (d === "scrum") {
        const h = o.hustle && shH(o.hustle), lopend = h && shActieveSprint(h);
        if (o.waar === "lopend" && !lopend) o.waar = "backlog";
        if (o.waar === "nieuw" && lopend) o.waar = "lopend";
        opties += `<div class="veld"><span class="labeltekst">Waar komen de kaarten</span>${seg("waar", o.waar, [["backlog", "Productbacklog"], ["nieuw", "Nieuwe sprint", !!lopend], ["lopend", lopend ? `Sprint ${lopend.nummer}` : "Lopende sprint", !lopend]])}
          <div class="klein" style="margin-top:6px">${o.waar === "nieuw" ? `Start vandaag een sprint van ${(h && h.sprintWeken) || 1} week met als sprintdoel “${esc(b.tekst)}”.` : o.waar === "lopend" ? "De kaarten gaan direct in de lopende sprint." : "Kaarten komen op de backlog; plan ze later in een sprint."}
          Hoofdtakken worden labels (epics).</div></div>
          <div class="veld"><span class="labeltekst">Stappen worden</span>${seg("stappen", o.stappen, [["subtaken", "Subtaken"], ["acceptatie", "Acceptatiecriteria"]])}</div>
          ${schakel("punten", o.punten, "Storypoints schatten", "Op basis van het aantal stappen (1–13), later aan te passen")}
          ${!h ? schakel("productdoel", o.productdoel, "Productdoel instellen", `“${b.tekst}”`) : ""}`;
      }
      if ((d === "sidehustle" || d === "scrum") && !o.hustle) opties += schakel("kaal", o.kaal, "Alleen de mindmap", "Zonder de standaardchecklist en voorbeeldkaart van een nieuwe side hustle");
    }
    $("#bladinhoud").innerHTML = `
      ${sel ? `<div class="veld"><span class="labeltekst">Wat</span>${seg("tak", st.tak, [["alles", "Hele mindmap"], ["tak", "Tak: " + mmbKort(mmZonderVink(E.nodes.get(sel).tekst), 22)]])}</div>` : ""}
      <div class="mx-bron"><b>${esc(b.tekst)}</b><span>${t.hoofd} hoofdtakken · ${t.takken} takken · ${t.stappen} stappen · ${t.diep} niveaus diep</span></div>
      <div class="mx-doelen" role="radiogroup" aria-label="Exporteren naar">${Object.entries(MX_DOELEN).map(([k, x]) =>
        `<button class="mx-doel" role="radio" data-mxdoel="${k}" aria-checked="${d === k}" style="--dk:${x.kleur}">${ico(x.ico)}<b>${x.naam}</b><span>${x.uitleg}</span></button>`).join("")}</div>
      ${opties}
      ${eerder ? `<div class="mx-eerder">${ico("herhaal", "width:16px;height:16px")}<span>Al eerder geëxporteerd (${esc(datumLabel(eerder.ts.slice(0, 10)))}). ${st.kopie ? "Er komt een <b>nieuwe kopie</b>." : "Wordt <b>bijgewerkt</b>: nieuwe punten erbij, vinkjes en je eigen toevoegingen blijven."}</span></div>
        ${schakel("kopie", st.kopie, "Toch een nieuwe kopie maken")}` : ""}
      <div class="labeltekst" style="margin-top:14px">Zo wordt het</div>
      ${mxVoorbeeldHTML(d, b, o)}
      <p class="klein mx-sync">${ico("kringloop", "width:14px;height:14px;vertical-align:-2px")} Afvinken loopt gelijk: vink je een stap af in de mindmap, dan ook in ${MX_DOELEN[d].naam.toLowerCase() === "scrum" ? "de kaart" : "de export"}, en andersom.</p>`;
    $("#mx-ok").innerHTML = `${ico(MX_DOELEN[d].ico)} ${eerder && !st.kopie ? "Bijwerken" : "Exporteren"} naar ${MX_DOELEN[d].naam}`;
    const hs = $("#mx-hustle");
    if (hs) hs.onchange = () => { st[d].hustle = hs.value; st[d]._gekozen = true; teken2(); };
  };
  bladOpen("Mindmap exporteren", "", `<button class="knop breed primair" id="mx-ok">Exporteren</button>`);
  teken2();
  $("#bladinhoud").addEventListener("click", e => {
    const dl = e.target.closest("[data-mxdoel]");
    if (dl) { st.doel = dl.dataset.mxdoel; tril(6); teken2(); return; }
    const op = e.target.closest("[data-mxo]");
    if (op && !op.disabled) { const s = op.dataset.mxo; if (s === "tak") st.tak = op.dataset.w; else st[st.doel][s] = op.dataset.w; teken2(); return; }
    const tg = e.target.closest("[data-mxt]");
    if (tg) { const s = tg.dataset.mxt; if (s === "kopie") st.kopie = !st.kopie; else st[st.doel][s] = !st[st.doel][s]; teken2(); }
  });
  $("#mx-ok").onclick = async () => {
    const knop = $("#mx-ok"); if (knop.disabled) return;
    knop.disabled = true;
    const o = Object.assign({}, st[st.doel], { tak: st.tak === "tak" && sel ? sel : null, kopie: st.kopie });
    try {
      const r = await mxExporteer(E, st.doel, o);
      bladSluit(); tril(12);
      if (typeof rtBurst === "function" && typeof rtAan === "function" && rtAan()) { const kb = knop.getBoundingClientRect(); rtBurst(kb.left + kb.width / 2, kb.top, MX_DOELEN[st.doel].kleur); }
      toast(r.tekst, "Openen", r.open, 7000);
      E.render();
    } catch (err) { console.error(err); toast("Exporteren lukte niet: " + err.message); knop.disabled = false; }
  };
}

/* ---------- Ingang in de mindmap ---------- */
{
  const _vw = vwMindmap;
  vwMindmap = function () {
    const h = _vw();
    const merk = '<button class="mm-tb" data-mmtb="json"';
    return h.includes(merk) ? h.replace(merk, `<button class="mm-tb accent" data-mmtb="mx-export" title="Exporteren naar checklist, project, side hustle of SCRUM">📤 Exporteren</button>${merk}`) : h;
  };
}
document.addEventListener("click", e => {
  const el = e.target.closest && e.target.closest('[data-mmtb="mx-export"]');
  if (!el) return;
  e.stopPropagation();
  mxExportBlad(MM.hoofd);
}, true);

/* ---------- Checklists: kopjes op drie niveaus, inklapbaar, met voortgang ---------- */
const clKopNiveau = it => { const m = /^\s*(#{1,3})(?!#)\s*/.exec(it.tekst || ""); return m ? m[1].length : /^\s*--\s*/.test(it.tekst || "") ? 1 : 0; };
const clKopTekst = it => String(it.tekst || "").replace(/^\s*(#{1,3}|--)\s*/, "");
V.clDicht = V.clDicht || new Set();
function clTelling(c) { const echte = c.items.filter(i => !clSectie(i)); return { af: echte.filter(i => i.af).length, tot: echte.length }; }
checklistRij = function (c) {
  const { af, tot } = clTelling(c), pct = tot ? Math.round(af / tot * 100) : 0;
  return `<button class="rijknop" data-act="ga" data-view="checklist" data-param="${c.id}">
    <span class="ring" style="--p:${pct};width:34px;height:34px;font-size:9px"><span style="width:26px;height:26px">${af}/${tot}</span></span>
    <span class="nm">${esc(c.naam)}${c.sjabloon ? ` <span class="chip" style="margin-left:4px">sjabloon</span>` : ""}${c.mx ? ` <span class="chip mx-chip">mindmap</span>` : ""}</span>
    ${ico("pijlr", "width:16px;height:16px;color:var(--line2)")}</button>`;
};
{
  const _vc = vwChecklist;
  vwChecklist = function () {
    const c = vind("checklists", V.param);
    if (!c || !c.items.some(i => clKopNiveau(i) > 0)) return _vc();
    const { af, tot } = clTelling(c), pct = tot ? Math.round(af / tot * 100) : 0;
    const sleutel = (it, i) => c.id + ":" + (it.mx ? it.mx.k : i);
    // blokken per kopje: telling en of het ingeklapt is
    const blok = c.items.map((it, i) => {
      const L = clKopNiveau(it); if (!L) return null;
      let j = i + 1, a = 0, t = 0;
      while (j < c.items.length && !(clKopNiveau(c.items[j]) && clKopNiveau(c.items[j]) <= L)) { if (!clKopNiveau(c.items[j])) { t++; if (c.items[j].af) a++; } j++; }
      return { L, eind: j, af: a, tot: t };
    });
    let h = `<div class="card card-pad">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:7px">
        <b>${af} van ${tot} af</b><span class="klein">${pct}%</span></div>
      <div class="balk"><i style="width:${pct}%"></i></div>
      ${c.mx ? `<button class="mx-terug" data-act="mx-naar-mm" data-mm="${c.mx.mm}" data-node="${esc(c.mx.node || "")}">${ico("mindmap", "width:15px;height:15px")} Uit mindmap${mmVind(c.mx.mm) ? " “" + esc(mmVind(c.mx.mm).naam) + "”" : ""} · afvinken loopt gelijk</button>` : ""}
      <div class="knoprij" style="margin-top:10px"><button class="knop klein rand" data-act="cl-klap-alles" data-id="${c.id}" data-dicht="1">Alles inklappen</button><button class="knop klein rand" data-act="cl-klap-alles" data-id="${c.id}" data-dicht="0">Alles uitklappen</button></div></div>`;
    h += `<div class="card cl-structuur">`;
    let i = 0, huidig = 0;
    while (i < c.items.length) {
      const it = c.items[i], b = blok[i];
      if (b) {
        const k = sleutel(it, i), dicht = V.clDicht.has(k), klaar = b.tot && b.af === b.tot;
        h += `<div class="cl-kop n${b.L}${klaar ? " klaar" : ""}" style="--kk:${it.kleur || "var(--accent)"}">
          <button class="cl-kopknop" data-act="cl-klap" data-k="${esc(k)}" aria-expanded="${!dicht}">
            ${ico("pijlr", `width:14px;height:14px;transform:rotate(${dicht ? 0 : 90}deg);transition:transform .2s`)}
            <span class="cl-koptekst">${esc(clKopTekst(it))}</span>
            <span class="cl-koptel">${klaar ? "✓ " : ""}${b.af}/${b.tot}</span></button>
          <span class="cl-kopbalk"><i style="width:${b.tot ? Math.round(b.af / b.tot * 100) : 0}%"></i></span>
          <button class="icon-btn cl-kopweg" data-act="cl-weg" data-id="${c.id}" data-i="${i}" aria-label="Kopje verwijderen">${ico("x", "width:14px;height:14px")}</button></div>`;
        huidig = b.L;
        if (dicht) { i = b.eind; huidig = b.L - 1; continue; }
        i++; continue;
      }
      const a = clAantal(it.tekst);
      h += `<div class="subtaak cl-item${it.af ? " af" : ""}" style="--in:${Math.max(0, huidig - 1)}">
        <button class="mini-vink" data-act="cl-vink" data-id="${c.id}" data-i="${i}">${ico("check")}</button>
        <span style="flex:1;display:flex;align-items:center;gap:8px;${it.af ? "text-decoration:line-through;color:var(--faint)" : ""}" data-act="cl-bewerk" data-id="${c.id}" data-i="${i}">
          ${a ? `<span class="telbol">${a.aantal}×</span>${esc(a.rest)}` : esc(it.tekst)}</span>
        <button class="icon-btn" style="min-width:34px;min-height:34px" data-act="cl-weg" data-id="${c.id}" data-i="${i}">${ico("x", "width:16px;height:16px")}</button></div>`;
      i++;
    }
    h += `<div class="subtaak" style="padding:8px 13px"><span class="mini-vink" style="opacity:.35"></span>
      <input type="text" id="cl-nieuw" placeholder="Item toevoegen… (2x melk, # Kopje, ## Subkopje)" enterkeyhint="done" data-id="${c.id}"></div></div>`;
    // de knoppen onderaan van de gewone weergave hergebruiken
    const basis = _vc(), j = basis.indexOf('<div class="knoprij" style="margin-top:12px">');
    return h + (j >= 0 ? basis.slice(j) : "");
  };
}
document.addEventListener("click", e => {
  const el = e.target.closest && e.target.closest('[data-act="cl-klap"],[data-act="cl-klap-alles"],[data-act="mx-naar-mm"]');
  if (!el) return;
  if (el.dataset.act === "cl-klap") { const k = el.dataset.k; V.clDicht.has(k) ? V.clDicht.delete(k) : V.clDicht.add(k); teken(); }
  else if (el.dataset.act === "cl-klap-alles") {
    const c = vind("checklists", el.dataset.id); if (!c) return;
    c.items.forEach((it, i) => { if (clKopNiveau(it)) { const k = c.id + ":" + (it.mx ? it.mx.k : i); el.dataset.dicht === "1" ? V.clDicht.add(k) : V.clDicht.delete(k); } });
    teken();
  } else if (mmVind(el.dataset.mm)) mmNaarNode(el.dataset.mm, el.dataset.node || mmVind(el.dataset.mm).rootId);
  else toast("Die mindmap bestaat niet meer");
});

/* ---------- Project: taken gegroepeerd per hoofdtak, in mindmapvolgorde ---------- */
{
  const _vp = vwProject;
  vwProject = function () {
    const p = vind("projecten", V.param);
    if (!p) return _vp();
    const alle = takenVanProject(p.id);
    if (!alle.some(t => t.mxGroep !== undefined && t.mx)) return _vp();
    const open = alle.filter(taakZichtbaar), af = alle.filter(t => t.af).sort((a, b) => (a.afOp || "") < (b.afOp || "") ? 1 : -1);
    const pct = alle.length ? Math.round(af.length / alle.length * 100) : 0, mmId = (alle.find(t => t.mx) || {}).mx.mm;
    let h = `<div class="card card-pad" style="display:flex;align-items:center;gap:13px">
      <div class="ring" style="--p:${pct}"><span>${pct}%</span></div>
      <div style="flex:1"><b>${esc(p.naam)}</b><div class="klein">${open.length} open · ${af.length} afgerond</div></div>
      ${mmVind(mmId) ? `<button class="icon-btn" data-act="mx-naar-mm" data-mm="${mmId}" data-node="" aria-label="Mindmap openen">${ico("mindmap")}</button>` : ""}
      <button class="icon-btn" data-act="bewerk-project" data-id="${p.id}">${ico("pen")}</button></div>`;
    const groepen = new Map();
    open.slice().sort((a, b) => (a.mxVolg ?? 1e9) - (b.mxVolg ?? 1e9) || sorteerTaken(a, b)).forEach(t => {
      const g = t.mxGroep || "";
      if (!groepen.has(g)) groepen.set(g, { kleur: t.mxKleur, lijst: [] });
      groepen.get(g).lijst.push(t);
    });
    if (!open.length) h += sectie("Open", 0) + `<div class="card">${leeg("✅", "Alles af in dit project")}</div>`;
    groepen.forEach((g, naam) => {
      const tot = alle.filter(t => (t.mxGroep || "") === naam), klaar = tot.filter(t => t.af).length;
      h += `<div class="mx-groepkop" style="--kk:${g.kleur || "var(--accent)"}">${sectie(naam || (groepen.size === 1 ? "Open" : "Overig"), `${klaar}/${tot.length}`)}</div>` + takenLijst(g.lijst);
    });
    if (af.length) { h += sectie("Afgerond", af.length); h += takenLijst(af.slice(0, 30), { notitie: false }); }
    return h;
  };
}

/* ---------- Side hustle: checklist groeperen zoals de mindmap ---------- */
{
  const _g = shCheckGroepen;
  shCheckGroepen = function (h, lijst) {
    if ((h.checkGroep || "categorie") !== "mindmap") return _g(h, lijst);
    const g = new Map();
    lijst.slice().sort((a, b) => (a.mxGroep ? 0 : 1) - (b.mxGroep ? 0 : 1) || (a.mxVolg ?? 1e9) - (b.mxVolg ?? 1e9) || a.volgorde - b.volgorde).forEach(c => {
      const k = c.mxGroep || "Overige punten";
      if (!g.has(k)) g.set(k, { sleutel: "mx:" + k, naam: k, kleur: c.mxKleur || "var(--sh)", items: [] });
      g.get(k).items.push(c);
    });
    return [...g.values()];
  };
  const _vc = vwShChecklist;
  vwShChecklist = function (h) {
    const u = _vc(h);
    if (!shVan("sh_checks", h.id).some(c => c.mxGroep)) return u;
    const merk = `<button data-sh="check-groep" data-g="deadline"`, i = u.indexOf(merk);
    if (i < 0) return u;
    const j = u.indexOf("</button>", i) + 9;
    return u.slice(0, j) + `<button data-sh="check-groep" data-g="mindmap" aria-pressed="${h.checkGroep === "mindmap"}">Mindmap</button>` + u.slice(j);
  };
  // SCRUM-kaart: de hoofdtak als epic-label
  const _kk = shKaartKlein;
  shKaartKlein = function (h, k, o) {
    const u = _kk(h, k, o);
    if (!k.mxGroep) return u;
    return u.replace('<span class="sh-sc-meta">', `<span class="sh-sc-meta"><span class="mx-epic" style="--kk:${k.mxKleur || "var(--sh)"}">${esc(k.mxGroep)}</span>`);
  };
}
