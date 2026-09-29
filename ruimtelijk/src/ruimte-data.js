"use strict";
/* ==========================================================================
   50b. Ruimtelijke laag v4 — levende data
   - Energie: het groene aurora-veld groeit mee met wat je vandaag afrondt.
   - Badge: aantal open taken van vandaag op het app-icoon (als het toestel dat kan).
   - Dagring (Vandaag): je dag als klok met afspraken als bogen, taken als punten
     en een wijzer voor nu. Tik op een punt of boog opent het item.
   - Ritmekaart (Terugblik): 12 weken activiteit als heatmap; tik op een dag
     opent die dag. Met een tabel voor schermlezers.
   Alles leest uit S (IndexedDB-cache) en schrijft niets weg.
   ========================================================================== */
const FM_DATA = { badge: null };

/** Taken van vandaag: open (datum ≤ vandaag) en vandaag afgerond. */
function fmVandaagTaken() {
  const v = vandaagISO();
  const open = S.taken.filter(t => !t.af && t.datum && t.datum <= v && (typeof werkOk !== "function" || werkOk(t)));
  const af = S.taken.filter(t => t.af && (t.afOp || "").slice(0, 10) === v && (typeof werkOk !== "function" || werkOk(t)));
  return { open, af };
}

/* ---------- Energie + badge (na elke tekening) ---------- */
RT_NA.push(() => {
  const { open, af } = fmVandaagTaken();
  const tot = open.length + af.length;
  document.documentElement.style.setProperty("--fm-energie", tot ? (af.length / tot).toFixed(2) : "0");
  const n = open.length;
  if (FM_DATA.badge !== n && "setAppBadge" in navigator) {
    FM_DATA.badge = n;
    try { (n ? navigator.setAppBadge(n) : navigator.clearAppBadge()).catch(() => {}); } catch (e) {}
  }
});

/* ---------- Dagring ---------- */
const FM_RING = { cx: 110, cy: 110, r: 86 };
/* Sporen: andere modules (Anker, Huishouden, Side Hustle …) laten hier een merkje
   achter op het moment dat er iets gebeurde. Een aanbieder geeft een lijst
   { min, kleur, label, view, param, act }; zie sectie 80 (verweven.js). */
const FM_SPOREN = [];
/** Minuten sinds middernacht → hoek (0 = boven, met de klok mee, 24 uur rond). */
const fmHoek = min => (min / 1440) * Math.PI * 2 - Math.PI / 2;
const fmPunt = (min, r) => [FM_RING.cx + Math.cos(fmHoek(min)) * r, FM_RING.cy + Math.sin(fmHoek(min)) * r];
const fmMin = hhmm => { const m = /^(\d{1,2}):(\d{2})/.exec(hhmm || ""); return m ? (+m[1]) * 60 + (+m[2]) : null; };
function fmBoog(van, tot, r) {
  const [x1, y1] = fmPunt(van, r), [x2, y2] = fmPunt(tot, r);
  const groot = (tot - van) > 720 ? 1 : 0;
  return `M${x1.toFixed(1)} ${y1.toFixed(1)}A${r} ${r} 0 ${groot} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}
function fmDagringHTML() {
  const v = vandaagISO();
  const { open, af } = fmVandaagTaken();
  const afspr = S.afspraken.filter(a => a.datum === v && fmMin(a.tijd) != null)
    .map(a => { const s = fmMin(a.tijd); let e = fmMin(a.eindTijd); if (e == null || e <= s) e = Math.min(1439, s + 60); return { a, s, e }; })
    .sort((x, y) => x.s - y.s);
  const taken = open.concat(af).filter(t => t.datum === v && fmMin(t.tijd) != null).map(t => ({ t, m: fmMin(t.tijd) })).sort((x, y) => x.m - y.m);
  const nu = new Date(), nuMin = nu.getHours() * 60 + nu.getMinutes();
  const tot = open.length + af.length, pct = tot ? Math.round(af.length / tot * 100) : 0;
  const sporen = FM_SPOREN.flatMap(f => { try { return f() || []; } catch (e) { return []; } }).filter(x => x && x.min != null).sort((a, b) => a.min - b.min);
  const { cx, cy, r } = FM_RING;
  // Uurstreepjes; elke 6 uur een label.
  let streep = "";
  for (let u = 0; u < 24; u++) {
    const [x1, y1] = fmPunt(u * 60, r + 12), [x2, y2] = fmPunt(u * 60, r + (u % 6 ? 16 : 20));
    streep += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="fm-dr-streep${u % 6 ? "" : " sterk"}"/>`;
  }
  const labels = [0, 6, 12, 18].map(u => { const [x, y] = fmPunt(u * 60, r - 16); return `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" class="fm-dr-label">${u}</text>`; }).join("");
  // Daglicht (07:00–19:00) als zachte band binnenin.
  const licht = `<path d="${fmBoog(7 * 60, 19 * 60, r - 30)}" class="fm-dr-licht"/>`;
  const bogen = afspr.map(({ a, s, e }, i) =>
    `<path d="${fmBoog(s, e, r)}" class="fm-dr-boog" style="--i:${i}" data-act="ga" data-view="afspraak" data-param="${esc(a.id)}" tabindex="0" role="button" aria-label="${esc(a.titel)} om ${esc(a.tijd)}"><title>${esc(a.tijd)} ${esc(a.titel)}</title></path>`).join("");
  const punten = taken.map(({ t, m }, i) => {
    const [x, y] = fmPunt(m, r);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6.5" class="fm-dr-punt${t.af ? " af" : ""}" style="--i:${i}" data-fm-taak="${esc(t.id)}" tabindex="0" role="button" aria-label="${esc(t.titel)} om ${esc(t.tijd)}"><title>${esc(t.tijd)} ${esc(t.titel)}${t.af ? " (af)" : ""}</title></circle>`;
  }).join("");
  const spoorHTML = sporen.map((x, i) => {
    const [sx, sy] = fmPunt(x.min, r - 22), hoek = (x.min / 1440) * 360;
    const doel = x.act ? `data-act="${esc(x.act)}"` : `data-act="ga" data-view="${esc(x.view || "logboek")}"${x.param ? ` data-param="${esc(x.param)}"` : ""}`;
    return `<rect x="${(sx - 4.5).toFixed(1)}" y="${(sy - 4.5).toFixed(1)}" width="9" height="9" rx="2" transform="rotate(${(45 + hoek).toFixed(0)} ${sx.toFixed(1)} ${sy.toFixed(1)})" class="fm-dr-spoor" style="--i:${i};fill:${x.kleur}" ${doel} tabindex="0" role="button" aria-label="${esc(x.label)}"><title>${esc(x.tijd || "")} ${esc(x.label)}</title></rect>`;
  }).join("");
  const [hx, hy] = fmPunt(nuMin, r + 6), [wx, wy] = fmPunt(nuMin, r - 38);
  const omtrek = 2 * Math.PI * (r - 44);
  const lijst = afspr.map(({ a }) => `<li>${esc(a.tijd)} afspraak: ${esc(a.titel)}</li>`).join("") + taken.map(({ t }) => `<li>${esc(t.tijd)} taak: ${esc(t.titel)}${t.af ? " (af)" : ""}</li>`).join("") + sporen.map(x => `<li>${esc(x.tijd || "")} ${esc(x.label)}</li>`).join("");
  const leeg = !afspr.length && !taken.length && !sporen.length;
  return `<section class="card card-pad fm-dagring" aria-labelledby="fm-dr-kop">
    <div class="fm-dr-kop"><h2 id="fm-dr-kop">Dagring</h2><span class="klein">${afspr.length} ${afspr.length === 1 ? "afspraak" : "afspraken"} · ${taken.length} met een tijd${sporen.length ? ` · ${sporen.length} ${sporen.length === 1 ? "spoor" : "sporen"}` : ""}</span></div>
    <div class="fm-dr-wrap">
      <svg viewBox="0 0 220 220" class="fm-dr" role="group" aria-label="Je dag als klok: ${pct}% van de taken af, ${afspr.length} afspraken, het is nu ${pad(nu.getHours())}:${pad(nu.getMinutes())}">
        <circle cx="${cx}" cy="${cy}" r="${r}" class="fm-dr-baan"/>
        ${licht}${streep}${labels}
        <circle cx="${cx}" cy="${cy}" r="${r - 44}" class="fm-dr-voortgang-baan"/>
        <circle cx="${cx}" cy="${cy}" r="${r - 44}" class="fm-dr-voortgang" style="stroke-dasharray:${omtrek.toFixed(1)};stroke-dashoffset:${(omtrek * (1 - pct / 100)).toFixed(1)}" transform="rotate(-90 ${cx} ${cy})"/>
        ${bogen}${punten}${spoorHTML}
        <line x1="${wx.toFixed(1)}" y1="${wy.toFixed(1)}" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}" class="fm-dr-wijzer" data-fm-wijzer/>
        <circle cx="${hx.toFixed(1)}" cy="${hy.toFixed(1)}" r="4" class="fm-dr-nu" data-fm-nu/>
        <text x="${cx}" y="${cy - 2}" class="fm-dr-tijd" data-fm-klok>${pad(nu.getHours())}:${pad(nu.getMinutes())}</text>
        <text x="${cx}" y="${cy + 16}" class="fm-dr-sub">${open.length} open · ${pct}%</text>
      </svg>
      <ul class="fm-dr-legenda" aria-hidden="true">
        <li><i class="boog"></i>Afspraak</li><li><i class="punt"></i>Taak</li><li><i class="punt af"></i>Afgerond</li>${sporen.length ? `<li><i class="spoor"></i>Spoor</li>` : ""}<li><i class="licht"></i>Daglicht</li>
      </ul>
    </div>
    ${leeg ? `<p class="klein fm-dr-leeg">Nog niets met een tijd vandaag. Zet een tijd bij een taak of afspraak en hij verschijnt op de ring.</p>` : ""}
    <ul class="fm-sr">${lijst}</ul>
  </section>`;
}
RT_NA.push(() => {
  if (V.view !== "vandaag" || !inst("dagring", true)) return;
  const s = $("#scherm"); if (!s || s.querySelector(".fm-dagring")) return;
  // Direct onder de dagkaart (het eerste paneel), anders bovenaan.
  const eerste = s.querySelector(":scope > .dagpaneel, :scope > .card");
  if (eerste) eerste.insertAdjacentHTML("afterend", fmDagringHTML());
  else s.insertAdjacentHTML("afterbegin", fmDagringHTML());
});
/* De wijzer loopt mee zolang Vandaag open staat. */
setInterval(() => {
  const w = $("[data-fm-wijzer]"); if (!w || document.hidden) return;
  const nu = new Date(), m = nu.getHours() * 60 + nu.getMinutes();
  const [x, y] = fmPunt(m, FM_RING.r + 6), [bx, by] = fmPunt(m, FM_RING.r - 38);
  w.setAttribute("x1", bx.toFixed(1)); w.setAttribute("y1", by.toFixed(1));
  w.setAttribute("x2", x.toFixed(1)); w.setAttribute("y2", y.toFixed(1));
  const p = $("[data-fm-nu]"); if (p) { p.setAttribute("cx", x.toFixed(1)); p.setAttribute("cy", y.toFixed(1)); }
  const k = $("[data-fm-klok]"); if (k) k.textContent = pad(nu.getHours()) + ":" + pad(nu.getMinutes());
}, 30 * 1000);
/* Taken op de ring: tik (of Enter) opent het taakblad, net als in de lijst. */
document.addEventListener("click", e => {
  const p = e.target.closest && e.target.closest("[data-fm-taak]");
  if (p && typeof openTaakBlad === "function") openTaakBlad(p.dataset.fmTaak);
});
document.addEventListener("keydown", e => {
  const k = e.target.closest && e.target.closest(".fm-dr-boog,[data-fm-taak]");
  if (k && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); k.dispatchEvent(new MouseEvent("click", { bubbles: true })); }
});

/* ---------- Ritmekaart (Terugblik) ---------- */
function fmRitme() {
  const v = vandaagISO();
  const tel = new Map();
  const plus = d => { if (d) tel.set(d, (tel.get(d) || 0) + 1); };
  S.gebeurtenissen.forEach(g => plus(g.datum || (g.ts || "").slice(0, 10)));
  S.taken.forEach(t => { if (t.af && t.afOp) plus(t.afOp.slice(0, 10)); });
  // 12 volle weken, maandag als eerste rij; de laatste kolom bevat vandaag.
  const nu = new Date(v + "T12:00:00"), dow = (nu.getDay() + 6) % 7;
  const start = plusDagen(v, -(11 * 7 + dow));
  const dagen = [];
  for (let i = 0; i < 84; i++) { const d = plusDagen(start, i); dagen.push({ d, n: d > v ? null : (tel.get(d) || 0) }); }
  const max = Math.max(1, ...dagen.map(x => x.n || 0));
  let reeks = 0, beste = 0;
  dagen.forEach(x => { if (x.n) { reeks++; beste = Math.max(beste, reeks); } else if (x.n === 0) reeks = 0; });
  let huidig = 0;
  for (let i = dagen.length - 1; i >= 0; i--) { if (dagen[i].n === null) continue; if (dagen[i].n) huidig++; else break; }
  const perWd = [0, 0, 0, 0, 0, 0, 0];
  dagen.forEach((x, i) => { if (x.n) perWd[i % 7] += x.n; });
  const wdNamen = ["maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag", "zondag"];
  const topWd = perWd.some(Boolean) ? wdNamen[perWd.indexOf(Math.max(...perWd))] : null;
  return { dagen, max, beste, huidig, topWd, totaal: dagen.reduce((s, x) => s + (x.n || 0), 0) };
}
function fmRitmeHTML() {
  const R = fmRitme();
  const cel = 15, gat = 3, b = 12 * (cel + gat), h = 7 * (cel + gat);
  const niveau = n => n === null ? -1 : n === 0 ? 0 : Math.min(4, Math.ceil(n / R.max * 4));
  let rects = "";
  R.dagen.forEach((x, i) => {
    const kol = Math.floor(i / 7), rij = i % 7, nv = niveau(x.n);
    if (nv < 0) return;
    rects += `<rect x="${kol * (cel + gat)}" y="${rij * (cel + gat) + 14}" width="${cel}" height="${cel}" rx="4" class="fm-rk-cel n${nv}" style="--k:${kol};--r:${rij}" data-rk-dag="${x.d}"><title>${esc(datumLabel(x.d, true))}: ${x.n} ${x.n === 1 ? "activiteit" : "activiteiten"}</title></rect>`;
  });
  // Maandlabels boven de eerste kolom van elke maand.
  let maand = "", mLabels = "";
  for (let kol = 0; kol < 12; kol++) {
    const d = R.dagen[kol * 7].d, m = d.slice(5, 7);
    if (m !== maand) { maand = m; mLabels += `<text x="${kol * (cel + gat)}" y="9" class="fm-rk-maand">${["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"][+m - 1]}</text>`; }
  }
  const tabel = [];
  for (let w = 0; w < 12; w++) tabel.push(`<tr><th scope="row">Week van ${esc(R.dagen[w * 7].d)}</th>${R.dagen.slice(w * 7, w * 7 + 7).map(x => `<td>${x.n === null ? "–" : x.n}</td>`).join("")}</tr>`);
  return `<section class="card card-pad fm-ritme" aria-labelledby="fm-rk-kop">
    <div class="fm-dr-kop"><h2 id="fm-rk-kop">Ritmekaart</h2><span class="klein">12 weken</span></div>
    <div class="fm-rk-stats">
      <div><b data-fm-tel>${R.huidig}</b><span>dagen op rij actief</span></div>
      <div><b data-fm-tel>${R.beste}</b><span>langste reeks</span></div>
      <div><b data-fm-tel>${R.totaal}</b><span>activiteiten</span></div>
    </div>
    <div class="fm-rk-scroll"><svg class="fm-rk" viewBox="-22 0 ${b + 22} ${h + 14}" role="img" aria-label="Activiteit per dag over 12 weken. Langste reeks ${R.beste} dagen${R.topWd ? ", meest actief op " + R.topWd : ""}.">
      ${mLabels}
      <text x="-4" y="${14 + 11}" class="fm-rk-wd">ma</text><text x="-4" y="${14 + 2 * (cel + gat) + 11}" class="fm-rk-wd">wo</text><text x="-4" y="${14 + 4 * (cel + gat) + 11}" class="fm-rk-wd">vr</text><text x="-4" y="${14 + 6 * (cel + gat) + 11}" class="fm-rk-wd">zo</text>
      ${rects}
    </svg></div>
    <div class="fm-rk-legenda" aria-hidden="true"><span>minder</span><i class="fm-rk-cel n0"></i><i class="fm-rk-cel n1"></i><i class="fm-rk-cel n2"></i><i class="fm-rk-cel n3"></i><i class="fm-rk-cel n4"></i><span>meer</span></div>
    ${R.topWd ? `<p class="klein" style="margin:8px 0 0">Je bent het vaakst actief op <b>${R.topWd}</b>. Tik op een dag om hem te openen.</p>` : `<p class="klein" style="margin:8px 0 0">Zodra je taken afrondt of iets logt, kleurt de kaart in.</p>`}
    <table class="fm-sr"><caption>Activiteiten per dag, maandag tot en met zondag</caption><thead><tr><th scope="col">Week</th><th scope="col">ma</th><th scope="col">di</th><th scope="col">wo</th><th scope="col">do</th><th scope="col">vr</th><th scope="col">za</th><th scope="col">zo</th></tr></thead><tbody>${tabel.join("")}</tbody></table>
  </section>`;
}
RT_NA.push(() => {
  if (V.view !== "stats") return;
  const s = $("#scherm"); if (!s || s.querySelector(".fm-ritme")) return;
  // Direct onder de kerncijfers, vóór de grafieken per dag.
  const na = s.querySelector(":scope > .stats") || s.querySelector(":scope > .segment");
  if (na) na.insertAdjacentHTML("afterend", fmRitmeHTML());
  else s.insertAdjacentHTML("afterbegin", fmRitmeHTML());
});
document.addEventListener("click", e => {
  const c = e.target.closest && e.target.closest("[data-rk-dag]");
  if (c) ga("dag", c.dataset.rkDag);
});
