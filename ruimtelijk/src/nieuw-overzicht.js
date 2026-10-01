"use strict";
/* ==========================================================================
   66. Nieuw: overzicht achter de schuifknoppen
   Staan de knoppen ingeklapt, dan zie je rechts ervan:
   - bovenin een ringdiagram van je side hustles (omzet of uren), met het
     totaal in het midden en een legenda met waarden eronder;
   - daaronder statistieken per thema, inklapbaar.
   Schuif je de knoppen uit, dan schuiven ze over het overzicht heen.
   ========================================================================== */
V.nwoMaat = V.nwoMaat || null;
V.nwoSeg = null;
const NWO_MAX = 5;   // meer side hustles vallen samen onder "Overig"

/* ---------- Gegevens voor het diagram ---------- */
function nwoHustles() {
  // vaste volgorde op aanmaak: de kleur volgt de side hustle, niet zijn rang
  return S.sh_hustles.filter(h => !h.gearchiveerd).sort((a, b) => String(a.gemaakt || "").localeCompare(String(b.gemaakt || "")) || (a.volgorde || 0) - (b.volgorde || 0));
}
function nwoWaarden(maat) {
  const v = vandaagISO(), van = plusDagen(v, -29);
  const hs = nwoHustles();
  const waarde = h => maat === "omzet"
    ? shVan("sh_geld", h.id).filter(g => g.soort === "in").reduce((a, g) => a + (g.bedrag || 0), 0) / 100
    : S.tijdlog.filter(l => l.shId === h.id && l.datum >= van).reduce((a, l) => a + (l.seconden || 0), 0) / 3600;
  const rijen = hs.map((h, i) => ({ id: h.id, naam: h.naam, emoji: h.emoji || "🚀", slot: i, waarde: waarde(h), score: typeof shScore === "function" ? shScore(h) : null }));
  if (rijen.length > NWO_MAX) {
    const rest = rijen.slice(NWO_MAX - 1);
    return rijen.slice(0, NWO_MAX - 1).concat([{ id: null, naam: `Overig (${rest.length})`, emoji: "", slot: "overig", waarde: rest.reduce((a, r) => a + r.waarde, 0), score: null }]);
  }
  return rijen;
}
const nwoFmt = (maat, n) => maat === "omzet" ? eur(n) : (Math.round(n * 10) / 10).toString().replace(".", ",") + " u";

function nwoDiagram() {
  const hs = nwoHustles();
  if (!hs.length) return `<div class="nwo-kaart nwo-leeg"><span class="nwo-leegicoon">🚀</span><b>Nog geen side hustle</b><span>Start er een via de knop Side Hustle; hier zie je dan omzet en uren.</span></div>`;
  const heeftOmzet = nwoWaarden("omzet").some(r => r.waarde > 0), heeftUren = nwoWaarden("uren").some(r => r.waarde > 0);
  const maat = V.nwoMaat || (heeftOmzet || !heeftUren ? "omzet" : "uren");
  const rijen = nwoWaarden(maat), tot = rijen.reduce((a, r) => a + r.waarde, 0);
  const R = 46, C = 2 * Math.PI * R, gat = rijen.filter(r => r.waarde > 0).length > 1 ? 2.2 : 0;
  let pos = 0;
  const bogen = tot > 0 ? rijen.filter(r => r.waarde > 0).map(r => {
    const len = r.waarde / tot * C, zicht = Math.max(.6, len - gat);
    const b = `<circle class="nwo-boog${V.nwoSeg != null && V.nwoSeg !== r.slot ? " dim" : ""}" data-nwo-seg="${r.slot}" cx="60" cy="60" r="${R}" style="--kl:var(--nwo-${r.slot})"
      stroke-dasharray="${zicht.toFixed(2)} ${(C - zicht).toFixed(2)}" stroke-dashoffset="${(-pos).toFixed(2)}"><title>${esc(r.naam)}: ${esc(nwoFmt(maat, r.waarde))}</title></circle>`;
    pos += len;
    return b;
  }).join("") : "";
  const sel = V.nwoSeg != null ? rijen.find(r => r.slot === V.nwoSeg) : null;
  const midden = sel
    ? `<b>${esc(nwoFmt(maat, sel.waarde))}</b><span>${esc(mmbKort(sel.naam, 16))}</span>`
    : `<svg class="nwo-zak" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9.5h10c2.2 2 3.5 4.4 3.5 6.8 0 2.9-2.3 4.7-8.5 4.7s-8.5-1.8-8.5-4.7c0-2.4 1.3-4.8 3.5-6.8z" fill="currentColor" opacity=".16"/><path d="M7 9.5h10c2.2 2 3.5 4.4 3.5 6.8 0 2.9-2.3 4.7-8.5 4.7s-8.5-1.8-8.5-4.7c0-2.4 1.3-4.8 3.5-6.8zM9 9.5 7.6 5.2c1.4.6 2.9.6 4.4-.4 1.5 1 3 1 4.4.4L15 9.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M14.4 13.3a2.3 2.3 0 1 0 0 3.6M9.8 14.5h3.3M9.8 15.8h3.3" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
       <b>${esc(nwoFmt(maat, tot))}</b><span>${maat === "omzet" ? "totale omzet" : "uren · 30 dagen"}</span>`;
  const gem = hs.map(h => typeof shScore === "function" ? shScore(h) : null).filter(x => x != null);
  return `<div class="nwo-kaart nwo-viz" role="group" aria-label="Side hustles in een diagram">
    <div class="nwo-kop"><b>Side hustles</b><span>${hs.length} actief${gem.length ? ` · gem. score ${Math.round(gem.reduce((a, x) => a + x, 0) / gem.length)}` : ""}</span></div>
    <div class="nwo-maten" role="tablist">${[["omzet", "Omzet"], ["uren", "Uren"]].map(([k, n]) =>
      `<button role="tab" data-act="nwo-maat" data-m="${k}" aria-selected="${maat === k}">${n}</button>`).join("")}</div>
    <div class="nwo-ring">
      <svg viewBox="0 0 120 120" aria-hidden="true"><circle class="nwo-spoor" cx="60" cy="60" r="${R}"/>${bogen}</svg>
      <div class="nwo-midden">${midden}</div>
    </div>
    ${tot > 0 ? "" : `<p class="nwo-geen">${maat === "omzet" ? "Nog geen omzet geboekt." : "Geen uren in de laatste 30 dagen."}</p>`}
    <div class="nwo-legenda">${rijen.map(r => `<button class="nwo-lr${V.nwoSeg === r.slot ? " aan" : ""}" ${r.id ? `data-act="nwo-hustle" data-id="${r.id}"` : `data-act="ga" data-view="sidehustles"`} data-nwo-seg="${r.slot}">
      <i style="background:var(--nwo-${r.slot})"></i><span class="nm">${esc(r.naam)}</span><b>${esc(nwoFmt(maat, r.waarde))}</b></button>`).join("")}</div>
  </div>`;
}

/* ---------- Statistieken per thema ---------- */
function nwoThemas() {
  const v = vandaagISO(), ws = weekStart(v), ym = v.slice(0, 7), van30 = plusDagen(v, -29);
  const T = [];
  const thema = (id, ico, naam, samenvatting, view, rijen) => { if (rijen.length) T.push({ id, ico, naam, samenvatting, view, rijen }); };
  const r = (label, waarde, sub) => ({ label, waarde, sub });
  const n = x => Math.round(x || 0).toLocaleString("nl-NL"), mv = (x, een, meer) => `${n(x)} ${Math.round(x) === 1 ? een : meer}`;

  // Side hustles
  const hs = S.sh_hustles, act = hs.filter(h => !h.gearchiveerd);
  const checks = S.sh_checks.filter(c => act.some(h => h.id === c.shId) && c.status !== "nvt");
  const kaarten = S.sh_kaarten.filter(k => act.some(h => h.id === k.shId) && !k.gearchiveerd);
  const geldIn = S.sh_geld.filter(g => g.soort === "in" && act.some(h => h.id === g.shId)).reduce((a, g) => a + g.bedrag, 0) / 100;
  const geldUit = S.sh_geld.filter(g => g.soort === "uit" && act.some(h => h.id === g.shId)).reduce((a, g) => a + g.bedrag, 0) / 100;
  const shUren = S.tijdlog.filter(l => l.shId && l.datum >= van30).reduce((a, l) => a + l.seconden, 0) / 3600;
  thema("sh", "🚀", "Side hustles", `${act.length} actief`, "sidehustles", [
    r("Side hustles", n(act.length), hs.length - act.length ? `${hs.length - act.length} gearchiveerd` : ""),
    r("Checklistpunten klaar", `${n(checks.filter(c => c.status === "klaar").length)} / ${n(checks.length)}`),
    r("Kaarten op het bord", n(kaarten.length), `${S.sh_sprints.filter(s => s.status === "actief").length} lopende sprint(s) · ${S.sh_sprints.filter(s => s.status === "afgerond").length} afgerond`),
    r("Uren (30 dagen)", (Math.round(shUren * 10) / 10).toString().replace(".", ",")),
    r("Omzet totaal", eur(geldIn)), r("Kosten totaal", eur(geldUit)), r("Resultaat", eur(geldIn - geldUit)),
    r("Ideeën in de ideeënbank", n(S.sh_ideeen.filter(x => x.status === "open" || x.status === "onderzoek").length), `${S.sh_ideeen.filter(x => x.status === "gestart").length} gestart · ${S.sh_ideeen.length} in totaal`),
    r("Klanten en leads", n(S.sh_klanten.filter(k => act.some(h => h.id === k.shId)).length)), r("Experimenten", n(S.sh_experimenten.filter(x => act.some(h => h.id === x.shId)).length))
  ].filter(x => act.length || x.label === "Side hustles" || x.label === "Ideeën in de ideeënbank"));

  // Taken en projecten
  const open = typeof openTaken === "function" ? openTaken() : S.taken.filter(t => !t.af);
  const afWeek = S.taken.filter(t => t.af && (t.afOp || "") >= ws).length;
  thema("taken", "✅", "Taken en projecten", `${n(open.length)} open`, "inbox", [
    r("Open taken", n(open.length), `${open.filter(t => t.datum && t.datum < v).length} te laat`),
    r("Afgerond deze week", n(afWeek)), r("Afgerond in totaal", n(S.taken.filter(t => t.af).length)),
    r("Projecten", n(S.projecten.length)), r("Werktaken open", n(open.filter(t => t.werk).length))
  ]);

  // Afspraken
  const kom = S.afspraken.filter(a => a.datum && a.datum >= v && a.datum <= plusDagen(v, 6));
  thema("afspraken", "📅", "Afspraken", `${n(kom.length)} deze week`, "afspraken", [
    r("Komende 7 dagen", n(kom.length)), r("Toezeggingen open", n(S.afspraken.filter(a => a.soort === "toezegging" && !a.uitkomst).length)),
    r("Afspraken in totaal", n(S.afspraken.length))
  ]);

  // Checklists en wishlist
  const lijsten = S.checklists.filter(c => !c.sjabloon), punten = lijsten.flatMap(c => c.items.filter(i => !(typeof clSectie === "function" && clSectie(i))));
  thema("lijsten", "☑️", "Checklists", mv(lijsten.length, "lijst", "lijsten"), "checklists", [
    r("Checklists", n(lijsten.length), `${S.checklists.length - lijsten.length} sjablonen`),
    r("Punten afgevinkt", `${n(punten.filter(i => i.af).length)} / ${n(punten.length)}`),
    r("Uit een mindmap", n(lijsten.filter(c => c.mx).length))
  ]);
  if (S.wl_items) {
    const wa = S.wl_items.filter(x => (x.status || "actief") === "actief"), wg = S.wl_items.filter(x => x.status === "gekocht"), wn = S.wl_items.filter(x => x.status === "niet");
    const som = l => l.reduce((a, x) => a + (+x.prijs || 0), 0);
    thema("wishlist", "🎁", "Wishlist", mv(wa.length, "wens", "wensen"), "wishlist", [
      r("Op de wishlist", n(wa.length), eur(som(wa))), r("Gekocht", n(wg.length), eur(som(wg))), r("Niet gekocht", n(wn.length), `${eur(som(wn))} bespaard`)
    ]);
  }

  // Gezondheid en roken
  const rk = typeof rookCijfers === "function" ? rookCijfers() : null;
  const gew = S.vs_gewicht.slice().sort((a, b) => a.datum < b.datum ? -1 : 1), laatste = gew[gew.length - 1], eerste = gew[0];
  const sport30 = S.vs_sportlog.filter(l => l.datum >= van30).length;
  const gez = [];
  if (rk) gez.push(r("Dagen gestopt met roken", n(rk.heleDagen)), r("Sigaretten niet gerookt", n(rk.sigaretten)), r("Bespaard", eur(rk.bespaard)));
  gez.push(r("Sportsessies (30 dagen)", n(sport30)));
  if (laatste) gez.push(r("Gewicht", String(laatste.kg).replace(".", ",") + " kg", eerste && eerste !== laatste ? `${laatste.kg - eerste.kg > 0 ? "+" : ""}${String(Math.round((laatste.kg - eerste.kg) * 10) / 10).replace(".", ",")} kg sinds ${datumLabel(eerste.datum, true)}` : ""));
  gez.push(r("Eetmomenten vandaag", n(S.vs_logs.filter(l => l.datum === v && l.moment !== "water").length)));
  thema("gezondheid", "💚", "Gezondheid", rk ? mv(rk.heleDagen, "dag", "dagen") + " rookvrij" : mv(sport30, "sportsessie", "sportsessies"), "gezondheid", gez);

  // Gewoontes en dagboek
  const logWeek = S.gewoontelog.filter(l => l.datum >= ws).length;
  thema("gewoontes", "🔁", "Gewoontes en dagboek", mv(S.gewoontes.length, "gewoonte", "gewoontes"), "persoonlijk", [
    r("Gewoontes", n(S.gewoontes.length)), r("Volbracht deze week", n(logWeek)), r("Volbracht in totaal", n(S.gewoontelog.length)),
    r("Dagboekdagen", n(S.dagboek.length))
  ]);

  // Geld
  const uitMaand = S.uitgaven.filter(u => (u.datum || "").slice(0, 7) === ym).reduce((a, u) => a + (+u.bedrag || 0), 0);
  const ink = S.incassos.filter(i => i.actief);
  const perMaand = ink.reduce((a, i) => { const f = FREQ[i.freq] || FREQ.maand; return a + (i.freq === "week" ? i.bedrag * 52 / 12 : i.bedrag / (f[1] || 1)); }, 0);
  thema("geld", "💶", "Financieel", `${eur(uitMaand)} deze maand`, "financieel", [
    r("Uitgegeven deze maand", eur(uitMaand), `${n(S.uitgaven.filter(u => (u.datum || "").slice(0, 7) === ym).length)} uitgaven`),
    r("Actieve incasso's", n(ink.length), `± ${eur(perMaand)} per maand`), r("Potjes", n(S.potjes.length))
  ]);

  // Hobby's en skills
  if (S.hs_items) {
    const hsAct = S.hs_items;
    const min = hsAct.reduce((a, x) => a + (x.sessies || []).filter(s => s.datum >= ws).reduce((b, s) => b + (+s.minuten || 0), 0), 0);
    thema("hobby", "🎨", "Hobby's en skills", `${n(hsAct.length)} in totaal`, "hobbyskills", [
      r("Hobby's", n(hsAct.filter(x => x.soort !== "skill").length)), r("Skills", n(hsAct.filter(x => x.soort === "skill").length)),
      r("Geoefend deze week", `${n(min)} min`)
    ]);
  }

  // Werk, mindmaps en logboek
  thema("werk", "💼", "Werk", mv(S.werkdocs.filter(d => d.status !== "archief").length, "document", "documenten"), "werk", [
    r("Werkdocumenten", n(S.werkdocs.filter(d => d.status !== "archief").length)), r("Werkafspraken", n(S.afspraken.filter(a => a.werk).length))
  ]);
  thema("mindmap", "🧠", "Mindmaps en logboek", mv(S.mm_mindmaps.length, "mindmap", "mindmaps"), "mindmap", [
    r("Mindmaps", n(S.mm_mindmaps.length), `${n(S.mm_mindmaps.reduce((a, m) => a + (m.nodes || []).length, 0))} nodes`),
    r("Logregels", n(S.gebeurtenissen.length)), r("Notities", n(S.gebeurtenissen.filter(g => g.soort === "notitie").length))
  ]);
  return T;
}
function nwoStatistieken() {
  const open = inst("nwoOpen1", null);
  return `<div class="nwo-stats"><div class="nwo-statkop">Statistieken</div>${nwoThemas().map(t => {
    const o = open === t.id;
    return `<div class="nwo-thema${o ? " open" : ""}" data-thema-id="${t.id}">
      <button class="nwo-themakop" data-act="nwo-klap" data-id="${t.id}" aria-expanded="${o}">
        <span class="nwo-ico" aria-hidden="true">${t.ico}</span><span class="nwo-tn"><b>${esc(t.naam)}</b><small>${esc(t.samenvatting)}</small></span>
        ${ico("pijlr", `width:14px;height:14px;flex:0 0 auto;color:var(--faint);transform:rotate(${o ? 90 : 0}deg);transition:transform .2s`)}</button>
      ${o ? `${typeof nwoAnalyse === "function" ? nwoAnalyse(t.id) : ""}<div class="nwo-rijen"><div class="nwo-rijenkop">Kerncijfers</div>${t.rijen.map(x => `<div class="nwo-rij"><span>${esc(x.label)}${x.sub ? `<small>${esc(x.sub)}</small>` : ""}</span><b>${esc(x.waarde)}</b></div>`).join("")}
        <button class="nwo-naar" data-act="ga" data-view="${t.view}">Naar ${esc(t.naam.toLowerCase())} ${ico("pijlr", "width:12px;height:12px")}</button></div>` : ""}
    </div>`;
  }).join("")}</div>`;
}

/* ---------- In de rail zetten ---------- */
{
  const _s = vwStart;
  vwStart = function () {
    const h = _s(), merk = /<div class="nw-rail[^"]*"[^>]*>/, m = merk.exec(h);
    if (!m) return h;
    const paneel = `<div class="nw-paneel" aria-hidden="${!!V.nwOpen}">${nwoDiagram()}${nwoStatistieken()}</div>`;
    return h.slice(0, m.index + m[0].length) + paneel + h.slice(m.index + m[0].length);
  };
}
/* De knoppen zijn samen precies even hoog als het ingeklapte overzicht ernaast
   (ringdiagram + alle statistieken dicht). Staat er een statistiek open, dan
   telt die uitklap niet mee: de knoppen blijven dan gewoon staan. */
const NW_KNOP_MIN = 56, NW_KNOP_MAX = 120, NW_GAT = 13;
function nwoHoogte() {
  const rail = $(".nw-rail"), p = rail && rail.querySelector(".nw-paneel");
  if (!p) return;
  let dicht = p.offsetHeight;
  p.querySelectorAll(".nwo-thema").forEach(t => { const kop = t.querySelector(".nwo-themakop"); if (kop) dicht -= t.offsetHeight - kop.offsetHeight; });
  const n = rail.querySelectorAll(".nw-slot").length;
  if (n) {
    const kh = Math.max(NW_KNOP_MIN, Math.min(NW_KNOP_MAX, +((dicht - NW_GAT * (n - 1)) / n).toFixed(2)));
    V.nwKnopH = kh;
    rail.style.setProperty("--nw-kh", kh + "px");
    rail.classList.toggle("nw-laag", kh < 84);
  }
  rail.style.minHeight = p.offsetHeight + 8 + "px";
}
RT_NA.push(() => { if (V.view === "start") requestAnimationFrame(nwoHoogte); });
function nwoHerteken() {
  const p = $(".nw-paneel"); if (!p) return;
  p.innerHTML = nwoDiagram() + nwoStatistieken();
  nwoHoogte();
}
document.addEventListener("click", async e => {
  const el = e.target.closest && e.target.closest(".nw-paneel [data-act^='nwo-'], .nw-paneel .nwo-boog");
  if (!el) return;
  if (el.classList.contains("nwo-boog")) { const s = el.dataset.nwoSeg; const k = isNaN(+s) ? s : +s; V.nwoSeg = V.nwoSeg === k ? null : k; nwoHerteken(); return; }
  const act = el.dataset.act;
  if (act === "nwo-maat") { V.nwoMaat = el.dataset.m; V.nwoSeg = null; nwoHerteken(); }
  else if (act === "nwo-klap") {
    // Eén statistiek tegelijk open
    const id = el.dataset.id, nu = inst("nwoOpen1", null) === id ? null : id;
    await zetInst("nwoOpen1", nu); nwoHerteken();
    if (nu) requestAnimationFrame(() => { const t = document.querySelector(`.nwo-thema[data-thema-id="${nu}"]`), sch = $("#scherm");
      if (t && sch) { const r = t.getBoundingClientRect(), top = sch.getBoundingClientRect().top; if (r.top < top + 70) sch.scrollBy({ top: r.top - top - 80, behavior: "smooth" }); } });
  } else if (act === "nwo-hustle") ga("sh", el.dataset.id);
});
/* Uitgeklapt: het overzicht is niet bereikbaar voor tikken of voorlezen. */
{
  const _zet = nwZet;
  nwZet = function (open, rail) { _zet(open, rail); const p = $(".nw-paneel"); if (p) p.setAttribute("aria-hidden", String(!!open)); };
}
