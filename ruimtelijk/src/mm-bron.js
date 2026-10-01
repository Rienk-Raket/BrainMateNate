"use strict";
/* ==========================================================================
   53. Hobby's, skills en side hustles als mindmap
   Eén tik maakt van een hobby, skill of side hustle een mindmap:
   - de kern in het midden (gekoppeld aan het origineel);
   - hoofdtakken voor plan, checklist, doelen, voortgang, werk, geld …;
   - de checklist per fase of categorie als afvinkbare stappen.
   Afvinken loopt in twee richtingen: vink je een stap af in de mindmap, dan
   staat hij ook in de app op klaar, en andersom. "Bijwerken" voegt later
   nieuwe punten toe zonder je eigen indeling of nodes aan te raken.
   ========================================================================== */
const MMB = { bezig: false };
const MMB_TAK = { plan: "#22d3ee", checklist: "#34d399", doelen: "#a78bfa", voortgang: "#7c9bff", bronnen: "#f5b942", ideeen: "#f5b942",
  werk: "#7c9bff", experimenten: "#ff6b81", klanten: "#a78bfa", geld: "#34d399" };
const mmbSleutel = b => [b.w, b.hs || "", b.id, b.i == null ? "" : b.i].join(":");
const mmbKort = (t, n) => { t = String(t || "").replace(/\s+/g, " ").trim(); return t.length > n ? t.slice(0, n - 1) + "…" : t; };

/* ---------- Plan: een boom van beschreven nodes, los van de mindmap ---------- */
function mmbPlan() {
  const lijst = [];
  const node = (sleutel, ouder, tekst, o) => { const n = Object.assign({ sleutel, ouder, tekst, kleur: null, notitie: "", items: [] }, o || {}); lijst.push(n); return n; };
  return { lijst, node };
}

/* ---------- Hobby of skill ---------- */
function mmbPlanHobby(x) {
  const P = mmbPlan(), ws = weekStart(vandaagISO());
  const sessies = (x.sessies || []).slice().sort((a, b) => (a.datum + a.ts) < (b.datum + b.ts) ? 1 : -1);
  const tot = hsMinuten(sessies), c = typeof hsCat === "function" ? hsCat(x.cat) : null;
  const meta = [x.soort === "skill" ? "Skill · niveau " + HS_NIVEAU[x.niveau || 1] : "Hobby", HS_STATUS[x.status], c ? c.naam : ""].filter(Boolean).join(" · ");
  P.root = { tekst: `${x.emoji} ${x.naam}`, notitie: [meta, x.waarom ? "Waarom: " + x.waarom : ""].filter(Boolean).join("\n\n"), koppeling: { soort: "hobbyskill", id: x.id } };

  const cl = x.checklist || [];
  const tCl = P.node("tak:checklist", null, "✅ Checklist", { kleur: MMB_TAK.checklist, notitie: cl.length ? `${cl.filter(p => p.af).length} van ${cl.length} gedaan` : "Kies in HobbySkills een sjabloon voor je checklist." });
  if (typeof hsChecklistGroepen === "function") hsChecklistGroepen(x).forEach(([g, punten]) => {
    P.node("cl:" + g, tCl.sleutel, `${{ Starten: "🚀", Oefenen: "🔁", Verdiepen: "🔎", Delen: "🤝" }[g] || "📌"} ${g}`, {
      items: punten.map(p => ({ tekst: p.tekst, af: !!p.af, bron: { w: "hs_check", hs: x.id, id: p.id } }))
    });
  });

  const tDoel = P.node("tak:doelen", null, "🎯 Doelen", { kleur: MMB_TAK.doelen });
  const mp = x.mijlpalen || [];
  P.node("doel:mijlpalen", tDoel.sleutel, "🏁 Mijlpalen", { notitie: mp.length ? "" : "Nog geen mijlpalen. Voeg ze toe in HobbySkills of hier als stap.",
    items: mp.map(m => ({ tekst: m.tekst, af: !!m.af, bron: { w: "hs_mijlpaal", hs: x.id, id: m.id } })) });
  if (x.doelMin || (x.dagen || []).length) P.node("doel:ritme", tDoel.sleutel,
    `📅 ${x.doelMin ? hsDuur(x.doelMin) + " per week" : "Vaste dagen"}`, { notitie: (x.dagen || []).length ? "Geplande dagen: " + [1, 2, 3, 4, 5, 6, 0].filter(d => x.dagen.includes(d)).map(d => DAGKORT[d]).join(", ") : "" });
  if (x.soort === "skill") P.node("doel:niveau", tDoel.sleutel, `📶 ${HS_NIVEAU[x.niveau || 1]}${(x.niveau || 1) < 5 ? " → " + HS_NIVEAU[(x.niveau || 1) + 1] : ""}`,
    { notitie: "Wat moet je kunnen om het volgende niveau te halen?" });

  const tVg = P.node("tak:voortgang", null, "📈 Voortgang", { kleur: MMB_TAK.voortgang });
  P.node("vg:totaal", tVg.sleutel, `⏱️ ${hsDuur(tot)} in ${sessies.length} sessie${sessies.length === 1 ? "" : "s"}`, { notitie: "Deze week: " + hsDuur(hsMinuten(hsSessiesWeek(x, ws))) });
  const st = hsStreak(x);
  if (st) P.node("vg:streak", tVg.sleutel, `🔥 ${st} dag${st === 1 ? "" : "en"} op rij`);
  const notities = sessies.filter(s => s.notitie).slice(0, 8);
  if (notities.length) P.node("vg:notities", tVg.sleutel, "📝 Wat je leerde", { notitie: notities.map(s => `${datumLabel(s.datum)}: ${s.notitie}`).join("\n") });

  const br = x.bronnen || [];
  if (br.length) {
    const tBr = P.node("tak:bronnen", null, "📚 Bronnen", { kleur: MMB_TAK.bronnen });
    br.forEach(b => P.node("bron:" + b.id, tBr.sleutel, mmbKort(b.titel || b.url, 48), { notitie: b.url || "" }));
  }
  P.node("tak:ideeen", null, "💡 Ideeën", { kleur: MMB_TAK.ideeen, notitie: "Ruimte voor je eigen ideeën." });
  return P;
}

/* ---------- Side hustle ---------- */
function mmbPlanSideHustle(h) {
  const P = mmbPlan(), v = vandaagISO();
  const soorten = (h.soorten || []).map(s => (SH_SOORTEN.find(q => q.id === s) || {}).naam).filter(Boolean);
  P.root = {
    tekst: `${h.emoji} ${h.naam}`,
    notitie: [`Fase: ${shFaseNaam(h.fase)}`, soorten.length ? "Soort: " + soorten.join(", ") : "", `Tijd: ${h.urenPerWeek || 0} uur per week`,
      h.aanname ? "Riskantste aanname: " + h.aanname : "", h.productdoel ? "Productdoel: " + h.productdoel : ""].filter(Boolean).join("\n"),
    koppeling: { soort: "sidehustle", id: h.id }
  };

  const tPlan = P.node("tak:plan", null, "🧭 Plan in 5 pijlers", { kleur: MMB_TAK.plan });
  SH_PIJLERS.forEach(p => {
    const w = (h.pijlers || {})[p.nr] || {};
    P.node("pijler:" + p.nr, tPlan.sleutel, `${p.nr}. ${p.titel}${w.tekst ? "" : " · nog invullen"}`, { notitie: w.tekst || p.vraag });
  });

  const checks = shVan("sh_checks", h.id).filter(c => !(c.sleutel || "").includes("@"));
  const tCl = P.node("tak:checklist", null, "✅ Checklist", { kleur: MMB_TAK.checklist,
    notitie: `${checks.filter(c => c.status === "klaar" || c.status === "nvt").length} van ${checks.length} gedaan` });
  const prio = c => (SH_PRIO[c.prioriteit] || [0, 0, 0])[2];
  Object.keys(SH_CATS).forEach(cat => {
    const r = checks.filter(c => c.categorie === cat).sort((a, b) => prio(b) - prio(a) || (a.volgorde || 0) - (b.volgorde || 0));
    if (!r.length) return;
    const open = r.filter(c => c.status === "open" || c.status === "bezig");
    const dl = open.map(c => c.deadline).filter(Boolean).sort()[0] || null;
    P.node("cl:" + cat, tCl.sleutel, SH_CATS[cat][0], {
      kleur: SH_CATS[cat][1], deadline: dl,
      notitie: open.filter(c => c.prioriteit === "hoog").length ? "Hoge prioriteit open: " + open.filter(c => c.prioriteit === "hoog").length : "",
      items: r.map(c => ({ tekst: (c.prioriteit === "hoog" ? "❗ " : "") + shCheckTitel(c) + (c.deadline && (c.status === "open" || c.status === "bezig") ? " · ⏰ " + mmKortDatum(c.deadline) : "") + (c.status === "nvt" ? " (n.v.t.)" : ""),
        af: c.status === "klaar" || c.status === "nvt", bron: { w: "sh_checks", id: c.id } }))
    });
  });

  const kolommen = shVan("sh_kolommen", h.id).filter(k => !k.gearchiveerd).sort((a, b) => (a.volgorde || 0) - (b.volgorde || 0));
  const kaarten = shVan("sh_kaarten", h.id).filter(k => !k.gearchiveerd);
  if (kaarten.length) {
    const tWerk = P.node("tak:werk", null, "🏃 Werkbord", { kleur: MMB_TAK.werk });
    kolommen.forEach(kol => {
      const r = kaarten.filter(k => k.kolomId === kol.id).sort((a, b) => (a.volgorde || 0) - (b.volgorde || 0));
      if (!r.length) return;
      const kn = P.node("kol:" + kol.id, tWerk.sleutel, `${kol.naam} (${r.length})`, { kleur: kol.kleur || null });
      r.slice(0, 12).forEach(k => P.node("kaart:" + k.id, kn.sleutel, mmbKort(k.titel, 60), {
        deadline: k.deadline || null, notitie: k.omschrijving || "",
        items: (k.subtaken || []).map((s, i) => ({ tekst: s.tekst || "Subtaak", af: !!s.af, bron: { w: "sh_kaart_sub", id: k.id, i } }))
      }));
      if (r.length > 12) P.node("kol:" + kol.id + ":meer", kn.sleutel, `+ ${r.length - 12} kaarten meer`);
    });
  }

  const exps = shVan("sh_experimenten", h.id);
  if (exps.length) {
    const tExp = P.node("tak:experimenten", null, "🧪 Experimenten", { kleur: MMB_TAK.experimenten });
    exps.forEach(x => P.node("exp:" + x.id, tExp.sleutel, `${x.uitkomst === "open" ? "🧪" : x.uitkomst === "bevestigd" ? "✅" : "❌"} ${mmbKort(x.hypothese, 60)}`, {
      startDatum: x.start || null, eindDatum: x.eind && x.eind !== x.start ? x.eind : null,
      notitie: [x.test ? "Test: " + x.test : "", x.meting ? "Meting: " + x.meting : "", x.criterium ? "Geslaagd als: " + x.criterium : "", "Uitkomst: " + x.uitkomst].filter(Boolean).join("\n")
    }));
  }

  const klanten = shVan("sh_klanten", h.id);
  if (klanten.length) {
    const tKl = P.node("tak:klanten", null, `👥 Klanten (${klanten.length})`, { kleur: MMB_TAK.klanten });
    [["lead", "Leads"], ["gesprek", "In gesprek"], ["offerte", "Offerte"], ["klant", "Klant"], ["terugkerend", "Terugkerend"]].forEach(([f, n]) => {
      const r = klanten.filter(k => k.fase === f);
      if (r.length) P.node("klant:" + f, tKl.sleutel, `${n} (${r.length})`, { notitie: r.map(k => `${k.naam}${k.bron ? " · " + k.bron : ""}${k.waarde ? " · " + shEur(k.waarde) : ""}`).join("\n") });
    });
  }

  const tGeld = P.node("tak:geld", null, "💶 Geld & tijd", { kleur: MMB_TAK.geld });
  P.node("geld:omzet", tGeld.sleutel, `Omzet deze maand: ${shEur(shMaandOmzet(h.id))}`);
  const bv = h.betaalbaarVerlies || {};
  if (bv.euro || bv.uren) P.node("geld:verlies", tGeld.sleutel, `Betaalbaar verlies: € ${bv.euro || 0} · ${bv.uren || 0} uur`, { notitie: "Zoveel kun je missen voordat je stopt." });
  P.node("geld:tijd", tGeld.sleutel, `Tijd: ${h.urenPerWeek || 0} uur per week`, { notitie: `Afgelopen 30 dagen gewerkt: ${Math.round(shMinuten(h.id, plusDagen(v, -30)) / 60 * 10) / 10} uur` });
  if (h.doelWinst) P.node("geld:doel", tGeld.sleutel, `Doel: ${shEur(h.doelWinst)} winst`);
  return P;
}

function mmbPlanVoor(soort, id) {
  if (soort === "hobbyskill") { const x = vind("hs_items", id); return x ? { P: mmbPlanHobby(x), naam: x.naam, emoji: x.emoji } : null; }
  if (soort === "sidehustle") { const h = shH(id); return h ? { P: mmbPlanSideHustle(h), naam: h.naam, emoji: h.emoji } : null; }
  return null;
}

/* ---------- Indeling: klassieke mindmap, takken links en rechts, zonder overlap ---------- */
function mmbSchik(nodes, rootId) {
  const root = nodes.get(rootId); if (!root) return;
  const kids = id => [...nodes.values()].filter(n => n.parentId === id);
  const RIJ = 74, STAP = 250;
  const hoogte = new Map();
  const meet = n => { const k = kids(n.id); const hh = Math.max(RIJ, k.reduce((a, c) => a + meet(c), 0)); hoogte.set(n.id, hh); return hh; };
  const top = kids(rootId); top.forEach(meet);
  // Verdeel de takken over rechts en links zodat beide kanten even hoog worden (volgorde blijft).
  const totaal = top.reduce((a, t) => a + hoogte.get(t.id), 0);
  let som = 0; const rechts = [], links = [];
  top.forEach(t => { (som < totaal / 2 ? rechts : links).push(t); som += hoogte.get(t.id); });
  const plaats = (n, diepte, kant, y0) => {
    const hh = hoogte.get(n.id);
    n.x = kant * diepte * STAP; n.y = y0 + hh / 2;
    let y = y0;
    kids(n.id).forEach(c => { plaats(c, diepte + 1, kant, y); y += hoogte.get(c.id); });
  };
  [[rechts, 1], [links, -1]].forEach(([lijst, kant]) => {
    let y = -lijst.reduce((a, t) => a + hoogte.get(t.id), 0) / 2;
    lijst.forEach(t => { plaats(t, 1, kant, y); y += hoogte.get(t.id); });
  });
  root.x = 0; root.y = 0;
}

/* ---------- Plan → mindmap ---------- */
function mmbMaakNode(pn, ouderNode, i) {
  return mmNode({
    parentId: ouderNode.id, tekst: pn.tekst, kleur: pn.kleur || ouderNode.kleur || MM_KLEUREN[i % MM_KLEUREN.length],
    notitie: pn.notitie || "", deadline: pn.deadline || null, startDatum: pn.startDatum || null, eindDatum: pn.eindDatum || null,
    checklist: [], checklistOpen: false
  });
}
async function mmbMaakMindmap(soort, id) {
  const r = mmbPlanVoor(soort, id); if (!r) return null;
  const mm = mmRecord(`${r.emoji} ${r.naam}`, null);
  const nodes = new Map(mm.nodes.map(n => [n.id, n])), root = nodes.get(mm.rootId);
  root.tekst = r.P.root.tekst; root.notitie = r.P.root.notitie; root.koppeling = r.P.root.koppeling;
  mm.bron = { soort, id }; mm.bronItems = {}; mm.bronSecties = {};
  const perSleutel = new Map();
  r.P.lijst.forEach((pn, i) => {
    const ouder = pn.ouder ? perSleutel.get(pn.ouder) : root;
    const n = mmbMaakNode(pn, ouder, i);
    pn.items.forEach(it => { const c = { id: uid(), tekst: it.tekst, af: it.af }; n.checklist.push(c); mm.bronItems[c.id] = it.bron; });
    nodes.set(n.id, n); perSleutel.set(pn.sleutel, n); mm.bronSecties[pn.sleutel] = n.id;
  });
  mmbSchik(nodes, mm.rootId);
  mm.nodes = Array.from(nodes.values());
  await bewaar("mm_mindmaps", mm);
  return mm;
}
/** Nieuwe punten en nodes uit het origineel toevoegen; bestaande nodes en je eigen indeling blijven. */
async function mmbBijwerken(mm) {
  const r = mmbPlanVoor(mm.bron.soort, mm.bron.id); if (!r) return 0;
  const nodes = new Map(mm.nodes.map(n => [n.id, n]));
  const root = nodes.get(mm.rootId);
  mm.bronItems = mm.bronItems || {}; mm.bronSecties = mm.bronSecties || {};
  if (root) { root.notitie = r.P.root.notitie; root.koppeling = r.P.root.koppeling; }
  const heb = new Set(Object.values(mm.bronItems).map(mmbSleutel));
  let nieuw = 0;
  r.P.lijst.forEach((pn, i) => {
    let n = nodes.get(mm.bronSecties[pn.sleutel]);
    if (!n) {
      const ouder = (pn.ouder && nodes.get(mm.bronSecties[pn.ouder])) || root; if (!ouder) return;
      const kant = ouder === root ? 1 : Math.sign(ouder.x - root.x) || 1;
      const broers = [...nodes.values()].filter(q => q.parentId === ouder.id);
      n = mmbMaakNode(pn, ouder, i);
      n.x = ouder.x + kant * 250; n.y = broers.length ? Math.max(...broers.map(q => q.y)) + 74 : ouder.y;
      nodes.set(n.id, n); mm.bronSecties[pn.sleutel] = n.id; ouder.ingeklapt = false; nieuw++;
    } else if (pn.notitie && /^(tak|vg|geld|pijler|klant|exp|doel):/.test(pn.sleutel)) n.notitie = pn.notitie;
    pn.items.forEach(it => {
      if (heb.has(mmbSleutel(it.bron))) return;
      const c = { id: uid(), tekst: it.tekst, af: it.af }; n.checklist.push(c); mm.bronItems[c.id] = it.bron; nieuw++;
    });
  });
  mm.nodes = Array.from(nodes.values()); mm.updatedAt = Date.now();
  mmbSyncVanBron(mm);
  await bewaar("mm_mindmaps", mm);
  return nieuw;
}

/* ---------- Synchroon afvinken ---------- */
function mmbBronAf(b) {
  if (b.w === "sh_checks") { const c = vind("sh_checks", b.id); return c ? (c.status === "klaar" || c.status === "nvt") : null; }
  if (b.w === "hs_check" || b.w === "hs_mijlpaal") {
    const x = vind("hs_items", b.hs); if (!x) return null;
    const p = (b.w === "hs_check" ? x.checklist : x.mijlpalen || []).find(q => q.id === b.id);
    return p ? !!p.af : null;
  }
  if (b.w === "sh_kaart_sub") { const k = vind("sh_kaarten", b.id); const s = k && (k.subtaken || [])[b.i]; return s ? !!s.af : null; }
  return null;
}
/** Origineel → mindmap: vinkjes bijwerken voordat de mindmap getekend wordt. */
function mmbSyncVanBron(mm) {
  if (!mm || !mm.bronItems) return false;
  let veranderd = false;
  mm.nodes.forEach(n => (n.checklist || []).forEach(c => {
    const b = mm.bronItems[c.id]; if (!b) return;
    const af = mmbBronAf(b);
    if (af !== null && af !== !!c.af) { c.af = af; veranderd = true; }
  }));
  return veranderd;
}
/** Mindmap → origineel: na elke opslag van de mindmap. */
async function mmbSyncNaarBron(mm) {
  if (MMB.bezig || !mm || !mm.bronItems) return;
  MMB.bezig = true;
  try {
    const hs = new Set(), kaarten = new Set();
    let aantal = 0;
    for (const n of mm.nodes) for (const c of n.checklist || []) {
      const b = mm.bronItems[c.id]; if (!b) continue;
      const af = mmbBronAf(b);
      if (af === null || af === !!c.af) continue;
      aantal++;
      if (b.w === "sh_checks") await shCheckZetStatus(vind("sh_checks", b.id), c.af ? "klaar" : "open");
      else if (b.w === "hs_check" || b.w === "hs_mijlpaal") {
        const x = vind("hs_items", b.hs), p = (b.w === "hs_check" ? x.checklist : x.mijlpalen).find(q => q.id === b.id);
        p.af = !!c.af; p.afOp = c.af ? new Date().toISOString() : null; hs.add(x);
        if (c.af && b.w === "hs_mijlpaal") await logGebeurtenis("hobbyskill", `${x.emoji} Mijlpaal gehaald: ${p.tekst}`, x.id);
      } else if (b.w === "sh_kaart_sub") { const k = vind("sh_kaarten", b.id); k.subtaken[b.i].af = !!c.af; kaarten.add(k); }
    }
    for (const x of hs) await hsBewaar(x);
    for (const k of kaarten) await bewaar("sh_kaarten", k);
    if (aantal) MMB.laatsteSync = Date.now();
  } catch (e) { console.error("mindmap-sync", e); }
  finally { MMB.bezig = false; }
}
{
  const _bewaar = bewaar;
  bewaar = async function (winkel, obj) {
    const r = await _bewaar(winkel, obj);
    if (winkel === "mm_mindmaps" && obj && obj.bronItems && !MMB.bezig) mmbSyncNaarBron(obj);
    return r;
  };
  const _vwMm = vwMindmap;
  vwMindmap = function () {
    const mm = typeof mmHuidige === "function" ? mmHuidige() : null;
    if (mm && mm.bronItems && mmbSyncVanBron(mm)) idbZet("mm_mindmaps", mm).catch(opslagFout);
    return _vwMm();
  };
}

/* ---------- Koppeling van de kern naar het origineel ---------- */
{
  const _item = mmKoppelItem, _label = mmKoppelLabel, _open = mmOpenKoppeling;
  mmKoppelItem = k => k && k.soort === "hobbyskill" ? vind("hs_items", k.id) || null : k && k.soort === "sidehustle" ? shH(k.id) || null : _item(k);
  mmKoppelLabel = k => {
    if (!k || (k.soort !== "hobbyskill" && k.soort !== "sidehustle")) return _label(k);
    const it = mmKoppelItem(k); if (!it) return null;
    return k.soort === "sidehustle" ? "↩ Side hustle" : (it.soort === "skill" ? "↩ Skill" : "↩ Hobby");
  };
  mmOpenKoppeling = k => {
    if (!k || (k.soort !== "hobbyskill" && k.soort !== "sidehustle")) return _open(k);
    if (!mmKoppelItem(k)) { toast("Dat item bestaat niet meer"); return; }
    bladSluit();
    ga(k.soort === "sidehustle" ? "sh" : "hobbyskill", k.id);
  };
}

/* ---------- Starten: nieuw, openen of bijwerken ---------- */
const mmbBestaande = (soort, id) => S.mm_mindmaps.filter(m => m.bron && m.bron.soort === soort && m.bron.id === id).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
async function mmbStart(soort, id) {
  const r = mmbPlanVoor(soort, id);
  if (!r) { toast("Dat item bestaat niet meer"); return; }
  const oud = mmbBestaande(soort, id)[0];
  if (!oud) {
    const mm = await mmbMaakMindmap(soort, id);
    bladSluit(); ga("mindmap", mm.id);
    toast("Mindmap gemaakt · afvinken loopt gelijk met het origineel");
    return;
  }
  bladOpen("Mindmap van " + r.naam, `
    <p class="klein" style="margin-top:2px">Er is al een mindmap van <b>${esc(r.emoji + " " + r.naam)}</b> (${esc(oud.naam)}, ${oud.nodes.length} nodes). Vinkjes lopen al gelijk met het origineel.</p>
    <div class="card">
      <button class="rijknop" id="mmb-open">${ico("mindmap", "width:20px;height:20px;color:var(--accent)")}<span class="nm">Openen<span class="klein" style="display:block">Zoals hij nu is</span></span></button>
      <button class="rijknop" id="mmb-bij">${ico("herhaal", "width:20px;height:20px;color:var(--accent)")}<span class="nm">Bijwerken en openen<span class="klein" style="display:block">Nieuwe punten en onderdelen toevoegen; jouw nodes en indeling blijven</span></span></button>
      <button class="rijknop" id="mmb-nieuw">${ico("plus", "width:20px;height:20px;color:var(--accent)")}<span class="nm">Nieuwe mindmap<span class="klein" style="display:block">Opnieuw beginnen vanuit het origineel</span></span></button>
    </div>`);
  $("#mmb-open").onclick = () => { bladSluit(); ga("mindmap", oud.id); };
  $("#mmb-bij").onclick = async () => { const n = await mmbBijwerken(oud); bladSluit(); ga("mindmap", oud.id); toast(n ? `${n} nieuwe punten toegevoegd` : "Alles was al bijgewerkt"); };
  $("#mmb-nieuw").onclick = async () => { const mm = await mmbMaakMindmap(soort, id); bladSluit(); ga("mindmap", mm.id); toast("Nieuwe mindmap gemaakt"); };
}
document.addEventListener("click", e => {
  const el = e.target.closest && e.target.closest('[data-act="mm-van"]');
  if (!el) return;
  e.stopPropagation();
  mmbStart(el.dataset.soort, el.dataset.id);
}, true);

/* ---------- Ingangen: import-blad van de mindmap, side hustle-werkruimte en snelmenu ---------- */
{
  const _imp = mmImportBlad;
  mmImportBlad = function (voor) {
    _imp(voor);
    const bronnen = [
      ...hsAlle().filter(x => x.status !== "klaar").sort(hsSorteer).map(x => ({ soort: "hobbyskill", id: x.id, label: `${x.emoji} ${x.naam}`, sub: x.soort === "skill" ? "skill" : "hobby" })),
      ...shActief().map(h => ({ soort: "sidehustle", id: h.id, label: `${h.emoji} ${h.naam}`, sub: "side hustle" }))
    ];
    if (!bronnen.length) return;
    const inh = $("#bladinhoud"); if (!inh) return;
    inh.insertAdjacentHTML("afterbegin", `<div class="mmb-bronnen">
      <span class="labeltekst">Hobby, skill of side hustle</span>
      <div class="chiprij scroll">${bronnen.map(b => `<button class="keuze" data-act="mm-van" data-soort="${b.soort}" data-id="${b.id}">${esc(b.label)} <span class="klein">${b.sub}</span></button>`).join("")}</div>
      <div class="klein" style="margin-top:6px">Wordt een eigen mindmap met plan, checklist en voortgang. Afvinken loopt gelijk met het origineel.</div>
      <div class="hr" style="margin:14px 0 4px"></div></div>`);
  };
  const _vwSh = vwSh;
  vwSh = function () {
    const h = shH(V.param), uit = _vwSh();
    if (!h) return uit;
    const merk = `<button class="icon-btn" data-sh="instellingen"`;
    return uit.replace(merk, `<button class="icon-btn" data-act="mm-van" data-soort="sidehustle" data-id="${h.id}" aria-label="Als mindmap bekijken">${ico("mindmap")}</button>${merk}`);
  };
  const _km = shKaartMenu;
  shKaartMenu = function (id) {
    _km(id);
    const kaart = $("#bladinhoud .card"); if (!kaart) return;
    const rij = `<button class="rijknop" data-act="mm-van" data-soort="sidehustle" data-id="${id}">${ico("mindmap", "width:19px;height:19px;color:var(--muted)")}<span class="nm">Als mindmap</span></button>`;
    const exp = kaart.querySelector('[data-sh="exporteer"]');
    if (exp) exp.insertAdjacentHTML("beforebegin", rij); else kaart.insertAdjacentHTML("beforeend", rij);
  };
}
