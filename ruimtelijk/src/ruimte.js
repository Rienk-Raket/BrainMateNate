"use strict";
/* ==========================================================================
   50. Ruimtelijke laag v4 — diepte, glas en betekenisvolle beweging
   Specificatie: docs/spatial/futureme-spatial-specificatie-v4.md
   Legt zich over de bestaande app heen zonder het datamodel of de bestaande
   handlers te raken: ga(), terug(), teken(), toast(), pasInstellingenToe() en
   vwInstellingen() worden ingepakt; de rest luistert mee op documentniveau.
   Openbaar voor andere modules: RT_NA, rtAan(), rtVol(), rtStil(), rtBurst(),
   de klasse .rt-fout en het object FM_RUIMTE (status voor het Ontwerp-scherm).
   ========================================================================== */
const RT = { tap: null, stapel: [], pending: null, vorigeView: null, vorigeParam: null, taken: null, getallen: new Map(), spoor: null, titel: "", eerste: true, ori: false, io: null };
const RT_E = "cubic-bezier(.22,1,.36,1)";
/** Hooks die na elke tekening draaien (ook als de laag uit staat). */
const RT_NA = [];
const rtStil = () => !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
const rtAan = () => document.documentElement.dataset.ruimte === "1" && !rtStil();
/** Vol = alle beweging (veren, parallax, kantelen, deeltjes); anders "rustig". */
const rtVol = () => rtAan() && document.documentElement.dataset.beweging !== "rustig" && document.documentElement.dataset.budget !== "licht";
const rtDuur = ms => rtVol() ? ms : Math.round(ms * .55);
/** Status voor het Ontwerp-scherm en voor tests. */
const FM_RUIMTE = { versie: "4.0", fps: [], budgetMelding: false };

/* ---------- Instellingen + achtergrondlaag ---------- */
function rtAchtergrond() {
  let a = $("#rt-achtergrond");
  if (document.documentElement.dataset.ruimte !== "1") { if (a) a.remove(); return; }
  if (!a) {
    a = document.createElement("div"); a.id = "rt-achtergrond"; a.setAttribute("aria-hidden", "true");
    a.innerHTML = "<i></i><i></i><i></i><i></i>";
    document.body.prepend(a);
  }
}
/** Dagdeel kleurt de aurora: ochtend (6–12), middag (12–18), avond (18–23), nacht. */
function rtDagdeel() {
  const u = new Date().getHours();
  document.documentElement.dataset.dagdeel = u >= 6 && u < 12 ? "ochtend" : u >= 12 && u < 18 ? "middag" : u >= 18 && u < 23 ? "avond" : "nacht";
}
document.documentElement.dataset.ruimte = "1";
document.documentElement.dataset.beweging = "vol";
rtDagdeel();
rtAchtergrond();
setInterval(rtDagdeel, 5 * 60 * 1000);
document.addEventListener("visibilitychange", () => { document.documentElement.dataset.verborgen = document.hidden ? "1" : "0"; if (!document.hidden) rtDagdeel(); });
{
  const _pas = pasInstellingenToe;
  pasInstellingenToe = function () {
    _pas();
    const h = document.documentElement;
    h.dataset.ruimte = inst("ruimte", true) && !inst("rust", false) ? "1" : "0";
    h.dataset.beweging = inst("beweging", "vol") === "rustig" ? "rustig" : "vol";
    rtAchtergrond();
    rtSpoor(true);
  };
  const _vwI = vwInstellingen;
  vwInstellingen = function () {
    let h = _vwI();
    const kantel = typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function"
      ? `<button class="knop klein rand" data-act="rt-kantel" style="margin-top:4px">${ico("mindmap")} Parallax bij kantelen toestaan</button>` : "";
    const extra = schakelaar("ruimte", "Ruimtelijke interface", "Glas, diepte en vloeiende overgangen tussen schermen. Staat uit in de prikkelarme modus.", inst("ruimte", true))
      + `<div class="veld"><span class="labeltekst">Beweging</span>${segment("beweging", [["vol", "Vol"], ["rustig", "Rustig"]], inst("beweging", "vol"))}
         <small class="klein" style="display:block;margin-top:4px">Rustig: korte overgangen zonder veren, deeltjes, kantelen of parallax. Staat je toestel op "beweging verminderen", dan staat alle beweging uit.</small></div>`
      + schakelaar("dagring", "Dagring op Vandaag", "Je dag als klok: afspraken als bogen, taken met een tijd als punten, en een wijzer voor nu.", inst("dagring", true))
      + kantel
      + `<button class="knop klein rand" data-act="ga" data-view="ontwerp" style="margin-top:8px">${ico("ster")} Ontwerpsysteem bekijken</button>`;
    const i = h.indexOf('data-toggle="rust"'), j = i < 0 ? -1 : h.indexOf("</div>", i);
    return j < 0 ? h + `<div class="card card-pad">${extra}</div>` : h.slice(0, j + 6) + extra + h.slice(j + 6);
  };
}

/* ---------- Adaptief bewegingsbudget ----------
   Tijdens elke schermovergang tellen we frames. Zakt het toestel drie keer
   onder 40 fps, dan schakelt de laag voor deze sessie naar "licht": geen
   glasvervaging op kaarten, aurora stil, geen kantelen. Eén melding. */
function rtMeetFps(duur) {
  if (!rtAan() || document.hidden || document.documentElement.dataset.budget === "licht") return;
  let n = 0; const t0 = performance.now();
  const stap = nu => {
    n++;
    if (nu - t0 < duur) { requestAnimationFrame(stap); return; }
    const fps = Math.round(n * 1000 / (nu - t0));
    FM_RUIMTE.fps.push(fps); if (FM_RUIMTE.fps.length > 8) FM_RUIMTE.fps.shift();
    const traag = FM_RUIMTE.fps.slice(-5).filter(f => f < 40).length;
    if (traag >= 3) {
      document.documentElement.dataset.budget = "licht";
      if (!FM_RUIMTE.budgetMelding) { FM_RUIMTE.budgetMelding = true; toast("Beweging vereenvoudigd zodat alles soepel blijft"); }
    }
  };
  requestAnimationFrame(stap);
}

/* ---------- Aanraking: oorsprong onthouden + lichtgloed ---------- */
function rtOorsprongVan(t) {
  if (!t || !t.closest) return null;
  let el = t.closest(".rijknop,.taak,.stat,.knop3d,.dp-stat,.wk-tegel,.ug-widget,.sh-kaart,.mm-mmkaart,.vs-sportkaart,.dagpaneel,.menu-kaart,.hs-kaart,.tl2-kaart,.fm-dagring");
  if (!el) { const c = t.closest(".card"); if (c && c.getBoundingClientRect().height < 300) el = c; }
  if (!el) el = t.closest("button,[data-act]");
  return el;
}
function rtGloed(el, x, y) {
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return;
  if (getComputedStyle(el).position === "static") el.style.position = "relative";
  const d = Math.ceil(Math.max(r.width, r.height) * 2.2);
  const w = document.createElement("i");
  w.className = "rt-gloed"; w.setAttribute("aria-hidden", "true");
  w.innerHTML = `<b style="width:${d}px;height:${d}px;left:${Math.round(x - r.left - d / 2)}px;top:${Math.round(y - r.top - d / 2)}px"></b>`;
  el.appendChild(w);
  setTimeout(() => w.remove(), 680);
}
document.addEventListener("pointerdown", e => {
  const el = rtOorsprongVan(e.target);
  RT.tap = el ? { el, rect: el.getBoundingClientRect(), x: e.clientX, y: e.clientY, t: Date.now() } : null;
  if (!rtAan() || !e.target.closest) return;
  const k = e.target.closest(".knop,.icon-btn,.rijknop,.chip,.keuze,.segment button,.knop3d,.vink,.mini-vink,nav#tabs button,.stat,.sub-knop,.cijfers button,.toggle,.menu-kaart,.dp-stat,.wk-tegel,.ug-cat,.ug-knop,.hs-kaart,.hs-check,.sh-check");
  if (k && !k.disabled && !k.closest(".mm-canvaswrap")) rtGloed(k, e.clientX, e.clientY);
}, { capture: true, passive: true });

/* Glanslicht en kantelen richting de aanwijzer (alleen muis/pen). */
{
  let tick = false, laatst = null;
  document.addEventListener("pointermove", e => {
    if (e.pointerType === "touch" || !rtAan()) return;
    laatst = e;
    if (tick) return; tick = true;
    requestAnimationFrame(() => {
      tick = false;
      const t = laatst.target.closest && laatst.target.closest(".card,.menu-kaart,.stat,.hs-kaart,.knop3d");
      if (!t) return;
      const r = t.getBoundingClientRect();
      const x = (laatst.clientX - r.left) / r.width, y = (laatst.clientY - r.top) / r.height;
      t.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
      t.style.setProperty("--my", (y * 100).toFixed(1) + "%");
      if (rtVol() && r.height < 260) {
        t.style.setProperty("--fm-kx", ((.5 - y) * 6).toFixed(2) + "deg");
        t.style.setProperty("--fm-ky", ((x - .5) * 8).toFixed(2) + "deg");
      }
    });
  }, { passive: true });
}

/* ---------- Navigatie inpakken ---------- */
{
  const _ga = ga, _terug = terug, _teken = teken;
  ga = function (view, param, terugStap) {
    if (rtAan()) {
      const zelfde = V.view === view, tab = TABS.includes(view);
      if (terugStap) RT.pending = { soort: "terug", rect: RT.terugRect || null };
      else if (tab) { RT.pending = { soort: "tab", van: V.tab, naar: view }; RT.stapel = []; }
      else if (!zelfde) {
        const vers = RT.tap && Date.now() - RT.tap.t < 1200 ? RT.tap.rect : null;
        RT.stapel.push({ naar: view, rect: vers });
        if (RT.stapel.length > 24) RT.stapel.shift();
        RT.pending = { soort: "vooruit", rect: vers };
      }
      else RT.pending = param !== V.param ? { soort: "zacht" } : null;
    }
    return _ga(view, param, terugStap);
  };
  terug = function () {
    if (rtAan()) {
      const laatste = RT.stapel.pop();
      const rect = laatste && laatste.naar === V.view ? laatste.rect : null;
      RT.pending = { soort: "terug", rect };
      RT.terugRect = rect;
    }
    const uit = _terug();
    RT.terugRect = null;
    return uit;
  };
  teken = function () {
    const p = RT.pending; RT.pending = null;
    const vanView = RT.vorigeView, vanParam = RT.vorigeParam;
    const aan = rtAan();
    let oud = null;
    if (p && aan && !document.hidden) oud = rtSnapshot(vanView);
    try { _teken(); }
    catch (e) { if (oud) oud.remove(); throw e; }
    RT_NA.forEach(f => { try { f(); } catch (e) { console.error(e); } });
    if (oud || (p && aan)) rtOvergang(p, oud);
    rtNaTekenen(aan && (!!p || RT.eerste), vanView, vanParam);
    RT.eerste = false;
  };
}
function rtSnapshot(vanView) {
  if (vanView === "mindmap") return null;
  const s = $("#scherm"), app = $("#app");
  if (!s || !app) return null;
  try {
    const k = s.cloneNode(true);
    k.id = "rt-oud"; k.setAttribute("aria-hidden", "true"); k.inert = true;
    k.querySelectorAll("[id]").forEach(n => n.removeAttribute("id"));
    k.querySelectorAll("canvas,video,iframe").forEach(n => n.remove());
    const r = s.getBoundingClientRect(), ar = app.getBoundingClientRect();
    k.style.cssText = `top:${r.top - ar.top}px;left:${r.left - ar.left}px;width:${r.width}px;height:${r.height}px`;
    s.after(k);
    k.scrollTop = s.scrollTop;
    return k;
  } catch (e) { return null; }
}
function rtOvergang(p, oud) {
  const s = $("#scherm");
  if (!s) { if (oud) oud.remove(); return; }
  const sr = s.getBoundingClientRect();
  let weg = false;
  const klaar = () => { if (oud && !weg) { weg = true; oud.remove(); } };
  const rect = p && p.rect && p.rect.width > 8 && p.rect.height > 8 ? p.rect : null;
  const inset = r => {
    const t = Math.max(0, r.top - sr.top), l = Math.max(0, r.left - sr.left);
    const b = Math.max(0, sr.bottom - r.bottom), rr = Math.max(0, sr.right - r.right);
    return `inset(${t}px ${rr}px ${b}px ${l}px round 18px)`;
  };
  const vol = "inset(0px 0px 0px 0px round 0px)";
  const soort = p ? p.soort : "zacht";
  try {
    if (!rtVol()) {
      // Rustig: alleen een korte kruisvervaging, geen schaal, vervaging of oorsprong.
      if (oud) oud.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" }).onfinish = klaar;
      s.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: RT_E });
    } else if (soort === "vooruit") {
      if (oud) oud.animate([{ opacity: 1, transform: "scale(1)", filter: "blur(0px)" }, { opacity: 0, transform: "scale(.94)", filter: "blur(8px)" }], { duration: 380, easing: RT_E, fill: "forwards" }).onfinish = klaar;
      if (rect) { s.animate([{ clipPath: inset(rect), opacity: .35 }, { clipPath: vol, opacity: 1 }], { duration: 460, easing: RT_E }); rtOorsprongGeest(rect, sr); }
      else s.animate([{ opacity: 0, transform: "scale(.96)", filter: "blur(6px)" }, { opacity: 1, transform: "none", filter: "blur(0px)" }], { duration: 420, easing: RT_E });
    } else if (soort === "terug") {
      if (oud) {
        const kf = rect ? [{ clipPath: vol, opacity: 1 }, { clipPath: inset(rect), opacity: 0 }]
          : [{ opacity: 1, transform: "scale(1)", filter: "blur(0px)" }, { opacity: 0, transform: "scale(1.04)", filter: "blur(6px)" }];
        oud.animate(kf, { duration: 400, easing: RT_E, fill: "forwards" }).onfinish = klaar;
      }
      s.animate([{ opacity: 0, transform: "scale(.94)", filter: "blur(8px)" }, { opacity: 1, transform: "none", filter: "blur(0px)" }], { duration: 440, easing: RT_E });
    } else if (soort === "tab") {
      const dir = Math.sign(TABS.indexOf(p.naar) - TABS.indexOf(p.van)) || 1;
      if (oud) oud.animate([{ opacity: 1, transform: "none", filter: "blur(0px)" }, { opacity: 0, transform: `translateX(${-18 * dir}px) scale(.95)`, filter: "blur(6px)" }], { duration: 340, easing: RT_E, fill: "forwards" }).onfinish = klaar;
      s.animate([{ opacity: 0, transform: `translateX(${22 * dir}px) scale(.96)`, filter: "blur(6px)" }, { opacity: 1, transform: "none", filter: "blur(0px)" }], { duration: 420, easing: RT_E });
    } else {
      if (oud) oud.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, fill: "forwards" }).onfinish = klaar;
      s.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 300, easing: RT_E });
    }
  } catch (e) { klaar(); }
  if (oud) setTimeout(klaar, 800);
  rtMeetFps(420);
  rtTitel();
}
function rtOorsprongGeest(rect, sr) {
  const g = document.createElement("div");
  g.id = "rt-oorsprong"; g.setAttribute("aria-hidden", "true");
  g.style.cssText = `left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px`;
  document.body.appendChild(g);
  const a = g.animate([
    { transform: "none", opacity: .9, borderRadius: "16px" },
    { transform: `translate(${sr.left - rect.left}px,${sr.top - rect.top}px) scale(${sr.width / rect.width},${sr.height / rect.height})`, opacity: 0, borderRadius: "4px" }
  ], { duration: 460, easing: RT_E, fill: "forwards" });
  a.onfinish = () => g.remove();
  setTimeout(() => g.remove(), 700);
}
function rtTitel() {
  const t = $("#titel"), o = $("#ondertitel");
  if (!t) return;
  const nu = t.textContent + "|" + (o ? o.textContent : "");
  if (nu !== RT.titel && RT.titel) {
    t.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: rtDuur(360), easing: RT_E });
    if (o) o.animate([{ opacity: 0, transform: "translateY(4px)" }, { opacity: 1, transform: "none" }], { duration: rtDuur(360), easing: RT_E, delay: 40 });
  }
  RT.titel = nu;
}

/* ---------- Na het tekenen: data vormt zich ---------- */
function rtNaTekenen(vol, vanView, vanParam) {
  const s = $("#scherm");
  if (!s) return;
  rtSpoor();
  if (rtAan() && V.view !== "mindmap") {
    if (vol) { rtStagger(s); if (rtVol()) rtGetallen(s, true); rtVullen(s); rtGrafieken(s); rtOnthul(s); }
    else { rtNieuweItems(s, vanView, vanParam); if (rtVol()) rtGetallen(s, false); }
  }
  RT.vorigeView = V.view; RT.vorigeParam = V.param;
  RT.taken = new Set(Array.from(s.querySelectorAll("[data-taak]")).map(n => n.dataset.taak));
  rtScrollDiepte();
}
function rtStagger(s) {
  const stap = rtVol() ? 32 : 0;
  Array.from(s.children).slice(0, 14).forEach((k, i) => { k.classList.add("rt-in"); k.style.animationDelay = (i * stap) + "ms"; });
  if (!rtVol()) return;
  let j = 0;
  s.querySelectorAll(".card > .taak, .card > .rijknop, .stats > .stat, .startgrid > .knop3d, .menu-grid > .menu-kaart, .hs-lijst > .hs-kaart").forEach(n => {
    if (j++ > 20) return;
    n.classList.add("rt-in"); n.style.animationDelay = (40 + j * 24) + "ms";
  });
}
/* Onthullen bij scrollen: blokken onder de vouw wachten tot ze in beeld komen. */
function rtOnthul(s) {
  if (RT.io) RT.io.disconnect();
  if (!rtVol() || !("IntersectionObserver" in window)) return;
  const onder = s.getBoundingClientRect().bottom;
  const kand = Array.from(s.children).slice(0, 60).filter(k => k.id !== "rt-oud" && k.getBoundingClientRect().top > onder + 8);
  if (!kand.length) return;
  RT.io = new IntersectionObserver(items => {
    items.forEach(it => {
      if (!it.isIntersecting) return;
      const el = it.target;
      RT.io.unobserve(el);
      el.classList.add("rt-onthul");
      requestAnimationFrame(() => el.classList.remove("rt-wacht"));
      setTimeout(() => el.classList.remove("rt-onthul"), 700);
    });
  }, { root: s, rootMargin: "0px 0px -6% 0px", threshold: .01 });
  kand.forEach(k => { k.classList.remove("rt-in"); k.classList.add("rt-wacht"); RT.io.observe(k); });
}
function rtNieuweItems(s, vanView, vanParam) {
  if (vanView !== V.view || vanParam !== V.param || !RT.taken) return;
  const nieuw = Array.from(s.querySelectorAll("[data-taak]")).filter(n => !RT.taken.has(n.dataset.taak));
  if (nieuw.length && nieuw.length <= 6) nieuw.forEach(n => n.classList.add("rt-nieuw"));
}
/* Getallen tellen op (bij openen vanaf 0, bij hertekenen vanaf de vorige waarde). */
function rtParseGetal(s) {
  let t = s.replace(/\s/g, "");
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) t = t.replace(/\./g, "").replace(",", ".");
  else t = t.replace(",", ".");
  return parseFloat(t);
}
function rtFormaat(vb) {
  const duizend = /^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(vb);
  const m = vb.match(/[,.](\d+)$/);
  const dec = m && !(duizend && !vb.includes(",")) ? m[1].length : 0;
  return { dec, duizend, sep: vb.includes(",") ? "," : "." };
}
function rtSchrijf(v, f) {
  let s = Math.abs(v).toFixed(f.dec), [h, d] = s.split(".");
  if (f.duizend) h = h.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (v < 0 ? "-" : "") + h + (d ? f.sep + d : "");
}
function rtTel(el, van, naar, pre, suf, f, orig) {
  const t0 = performance.now(), duur = 700;
  if (el._rtStop) el._rtStop();
  let stop = false; el._rtStop = () => { stop = true; };
  const stap = nu => {
    if (stop || !el.isConnected) return;
    const p = Math.min(1, (nu - t0) / duur), e = 1 - Math.pow(1 - p, 3);
    el.textContent = p >= 1 ? orig : pre + rtSchrijf(van + (naar - van) * e, f) + suf;
    if (p < 1) requestAnimationFrame(stap);
  };
  requestAnimationFrame(stap);
}
function rtGetallen(s, vol) {
  const els = Array.from(s.querySelectorAll(".stat .getal, .knop3d .bal3d, .dp-stat > b, .ring > span, .hs-getal, .werk-kop .cf b, .wk-leg b, [data-fm-tel]")).slice(0, 22);
  els.forEach((el, i) => {
    if (el.children.length) return;
    const tekst = el.textContent.trim();
    if (!tekst || /[:\/]/.test(tekst)) return;
    const m = tekst.match(/^([^\d\-]*)(-?\d[\d.]*(?:,\d+)?)([^\d]*)$/);
    if (!m) return;
    const doel = rtParseGetal(m[2]);
    if (!isFinite(doel) || Math.abs(doel) > 1e6) return;
    const sleutel = V.view + "|" + (V.param || "") + "|" + i + "|" + m[1] + "|" + m[3];
    const vorig = RT.getallen.get(sleutel);
    RT.getallen.set(sleutel, doel);
    const van = vol ? 0 : (vorig === undefined ? doel : vorig);
    if (van === doel) return;
    if (!vol) el.animate([{ opacity: .3, transform: "translateY(-6px)" }, { opacity: 1, transform: "none" }], { duration: 320, easing: RT_E });
    rtTel(el, van, doel, m[1], m[3], rtFormaat(m[2]), tekst);
  });
}
/* Ringen en balken vullen zich vanaf nul. */
function rtVullen(s) {
  s.querySelectorAll(".ring").forEach(r => {
    const p = r.style.getPropertyValue("--p"); if (!p) return;
    r.style.transition = "none"; r.style.setProperty("--p", "0"); void r.offsetWidth; r.style.transition = "";
    requestAnimationFrame(() => r.style.setProperty("--p", p));
  });
  s.querySelectorAll(".balk > i, .ug-balk > i, .hs-balk > i").forEach(b => {
    const w = b.style.width; if (!w) return;
    b.style.transition = "none"; b.style.width = "0%"; void b.offsetWidth; b.style.transition = "";
    requestAnimationFrame(() => { b.style.width = w; });
  });
}
/* Grafieken tekenen zichzelf: lijnen van links naar rechts, staafjes vanaf de basis. */
function rtGrafieken(s) {
  let n = 0;
  const duur = rtDuur(900);
  Array.from(s.querySelectorAll("svg")).forEach(v => {
    if (v.querySelector("use") || v.closest(".mm-canvaswrap,.mm-viewport,.ill3d,.fm-rk")) return;
    const vr = v.getBoundingClientRect();
    if (vr.width < 60) return;
    v.querySelectorAll("polyline, path").forEach(p => {
      if (n++ > 60 || p.getAttribute("stroke-dasharray") || /stroke-dasharray/.test(p.getAttribute("style") || "")) return;
      const cs = getComputedStyle(p);
      if (cs.stroke === "none" || typeof p.getTotalLength !== "function") return;
      if (cs.fill !== "none" && cs.fill !== "rgba(0, 0, 0, 0)") return;
      let L = 0; try { L = p.getTotalLength(); } catch (e) { return; }
      if (!L || L > 6000) return;
      p.animate([{ strokeDasharray: `${L} ${L}`, strokeDashoffset: L }, { strokeDasharray: `${L} ${L}`, strokeDashoffset: 0 }], { duration: duur, easing: RT_E, delay: 120 });
    });
    v.querySelectorAll("rect").forEach((r, i) => {
      if (n++ > 120) return;
      const h = r.getBoundingClientRect().height;
      if (!h || h > vr.height * .92) return;
      r.style.transformBox = "fill-box"; r.style.transformOrigin = "50% 100%";
      r.animate([{ transform: "scaleY(.02)", opacity: .3 }, { transform: "scaleY(1)", opacity: 1 }], { duration: rtDuur(650), easing: RT_E, delay: 60 + Math.min(i, 30) * (rtVol() ? 28 : 8) });
    });
  });
}

/* ---------- Onderbalk: lichtspoor onder de actieve tab ---------- */
function rtSpoor(reset) {
  const nav = $("#tabs"); if (!nav) return;
  let sp = nav.querySelector(".rt-spoor");
  if (!rtAan()) { if (sp) sp.remove(); RT.spoor = null; return; }
  if (!sp) { sp = document.createElement("i"); sp.className = "rt-spoor"; sp.setAttribute("aria-hidden", "true"); nav.appendChild(sp); }
  if (reset) RT.spoor = null;
  const act = nav.querySelector('button[aria-current="true"]:not(.tab-plus)');
  if (!act) { sp.style.opacity = "0"; RT.spoor = null; return; }
  const nr = nav.getBoundingClientRect(), ar = act.getBoundingClientRect();
  const w = Math.round(ar.width * .42), l = Math.round(ar.left - nr.left - nav.clientLeft + (ar.width - w) / 2);
  if (RT.spoor && Math.abs(RT.spoor.l - l) < 1 && sp.style.opacity === "1") return;
  sp.style.opacity = "1";
  if (RT.spoor) {
    const v = RT.spoor, min = Math.min(v.l, l), max = Math.max(v.l + v.w, l + w);
    sp.animate([
      { transform: `translateX(${v.l}px)`, width: v.w + "px" },
      { transform: `translateX(${min}px)`, width: (max - min) + "px", offset: .45 },
      { transform: `translateX(${l}px)`, width: w + "px" }
    ], { duration: rtDuur(480), easing: RT_E });
  }
  sp.style.transform = `translateX(${l}px)`; sp.style.width = w + "px";
  RT.spoor = { l, w };
}

/* ---------- Bladen: de app wijkt naar achteren, de oorsprong licht op ---------- */
{
  const blad = $("#blad");
  if (blad) new MutationObserver(() => {
    const open = blad.classList.contains("open");
    document.documentElement.dataset.blad = open ? "1" : "0";
    const oud = $(".rt-bron"); if (oud) oud.classList.remove("rt-bron");
    if (open && rtAan() && RT.tap && Date.now() - RT.tap.t < 900 && RT.tap.el && RT.tap.el.closest("#scherm")) RT.tap.el.classList.add("rt-bron");
  }).observe(blad, { attributes: true, attributeFilter: ["class"] });
}

/* ---------- Pincode: foute code trilt rood, ontgrendelen opent de app uit de diepte ---------- */
{
  const slotEl = $("#slot"), tekst = $("#slot-tekst");
  if (slotEl && tekst) {
    new MutationObserver(() => {
      slotEl.classList.remove("rt-fout");
      if (rtAan() && /onjuist|verschillen/i.test(tekst.textContent)) { void slotEl.offsetWidth; slotEl.classList.add("rt-fout"); }
    }).observe(tekst, { childList: true, characterData: true, subtree: true });
    new MutationObserver(recs => {
      const was = recs.some(r => (r.oldValue || "").includes("zicht"));
      if (was && !slotEl.classList.contains("zicht") && rtAan()) {
        slotEl.classList.remove("rt-fout");
        const app = $("#app");
        if (app) app.animate([{ opacity: 0, transform: "scale(.94)", filter: "blur(10px)" }, { opacity: 1, transform: "none", filter: "blur(0px)" }], { duration: rtDuur(520), easing: RT_E });
      }
    }).observe(slotEl, { attributes: true, attributeFilter: ["class"], attributeOldValue: true });
  }
}

/* ---------- Toast: fouten trillen ---------- */
{
  const _toast = toast;
  toast = function (tekst, actieLabel, actieFn, ms) {
    _toast(tekst, actieLabel, actieFn, ms);
    const el = $("#toast"); if (!el) return;
    el.classList.remove("rt-fout");
    if (rtAan() && /mislukt|ongeldig|klopt niet|niet gelukt|vul eerst|vul een|kan niet|te lang|geen toegang|fout|niets herkend/i.test(tekst || "")) {
      void el.offsetWidth; el.classList.add("rt-fout"); tril(20);
    }
  };
}

/* ---------- Afronden: lichtexplosie vanuit het vinkje ---------- */
function rtBurst(x, y, kleur) {
  if (!rtVol()) return;
  const d = document.createElement("div");
  d.className = "rt-burst"; d.setAttribute("aria-hidden", "true");
  d.style.left = x + "px"; d.style.top = y + "px";
  if (kleur) d.style.color = kleur;
  let h = '<i class="ring"></i>';
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + Math.random() * .5, len = 22 + Math.random() * 24;
    h += `<i class="deel" style="--dx:${(Math.cos(a) * len).toFixed(1)}px;--dy:${(Math.sin(a) * len).toFixed(1)}px;--dl:${Math.round(Math.random() * 70)}ms"></i>`;
  }
  d.innerHTML = h;
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 850);
}
document.addEventListener("click", e => {
  if (!rtAan() || !e.target.closest) return;
  const k = e.target.closest('[data-act="vink"], .mini-vink, .sh-check, .hs-check, [data-act="cl-vink"], [data-act="gewoonte-vink"]');
  if (!k) return;
  const rij = k.closest(".taak,.subtaak");
  const al = (rij && rij.classList.contains("af")) || k.classList.contains("gedaan") || k.classList.contains("af") || k.getAttribute("aria-pressed") === "true";
  if (al) return;
  const r = k.getBoundingClientRect();
  rtBurst(r.left + r.width / 2, r.top + r.height / 2);
}, true);

/* ---------- Scrollen: kaarten wijken onder de koptekst, achtergrond beweegt mee ---------- */
function rtZetDiepte(k, p) {
  if (k._rtd === p) return;
  k._rtd = p;
  if (p <= 0) { k.style.transform = ""; k.style.opacity = ""; return; }
  k.style.transform = `scale(${(1 - p * .06).toFixed(3)}) translateY(${(p * 10).toFixed(1)}px)`;
  k.style.opacity = (1 - p * .45).toFixed(2);
}
function rtScrollDiepte() {
  const s = $("#scherm"); if (!s) return;
  const st = s.scrollTop;
  document.documentElement.style.setProperty("--rt-scroll", rtVol() ? (-st * .05).toFixed(1) + "px" : "0px");
  if (!rtAan() || V.view === "mindmap") return;
  const top = s.getBoundingClientRect().top;
  let mis = 0;
  for (const k of s.querySelectorAll(":scope > .card, :scope > .stats > .stat, :scope > .startgrid > .knop3d, :scope > .dagpaneel, :scope > .hs-lijst > .hs-kaart")) {
    const r = k.getBoundingClientRect();
    if (r.top > top + 60) { if (k._rtd) rtZetDiepte(k, 0); if (++mis > 3) break; continue; }
    // Pas wijken als de kaart bijna uit beeld is (onderkant), zodat hoge kaarten leesbaar blijven.
    rtZetDiepte(k, Math.max(0, Math.min(1, (top + 140 - r.bottom) / 140)));
  }
}
{
  let tick = false;
  const s = $("#scherm");
  if (s) s.addEventListener("scroll", () => {
    if (tick) return; tick = true;
    requestAnimationFrame(() => { tick = false; rtScrollDiepte(); });
  }, { passive: true });
}

/* ---------- Parallax: kantelen (Android/desktop automatisch, iOS na toestemming) ---------- */
function rtParallax(gx, gy) {
  const h = document.documentElement.style;
  h.setProperty("--rt-px", (gx * 14).toFixed(1) + "px");
  h.setProperty("--rt-py", (gy * 14).toFixed(1) + "px");
}
window.addEventListener("deviceorientation", e => {
  if (e.gamma == null || !rtVol()) return;
  RT.ori = true;
  rtParallax(Math.max(-1, Math.min(1, e.gamma / 30)), Math.max(-1, Math.min(1, ((e.beta || 0) - 40) / 30)));
}, { passive: true });
{
  let tick = false;
  window.addEventListener("pointermove", e => {
    if (RT.ori || e.pointerType !== "mouse" || tick || !rtVol()) return;
    tick = true;
    requestAnimationFrame(() => { tick = false; rtParallax((e.clientX / innerWidth - .5) * .9, (e.clientY / innerHeight - .5) * .9); });
  }, { passive: true });
}
document.addEventListener("click", e => {
  const k = e.target.closest && e.target.closest('[data-act="rt-kantel"]');
  if (!k) return;
  DeviceOrientationEvent.requestPermission()
    .then(r => toast(r === "granted" ? "Kantelen staat aan" : "Geen toestemming gegeven"))
    .catch(() => toast("Niet beschikbaar op dit toestel"));
});

/* ---------- Losse bindingen ---------- */
window.addEventListener("resize", () => { RT.spoor = null; rtSpoor(); });
{ const t = $("#terug"); if (t) t.onclick = () => terug(); }
