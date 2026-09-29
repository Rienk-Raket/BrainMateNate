"use strict";
// === SECTIE 79: HUISHOUDEN – DE SESSIE (TESSERACT EN KAARTJES) ===
/* ==========================================================================
   Een schoonmaaksessie is een eigen, donkere ruimte: geen menu's, geen
   meldingen, alleen de klus van nu. In het midden draait een tesseract
   (een vierdimensionale kubus, geprojecteerd naar 2D) die langzaam pulseert.
   Eronder één zwart kaartje met een dikke, geborduurde witte rand:
   de klus, de tijd en zo nodig een tip.

   - Start zet de timer aan. Klaar (of naar rechts vegen) legt het kaartje
     op de stapel Gedaan; Sla over (of naar links vegen) legt het opzij.
   - Elk gedaan kaartje maakt de tesseract feller; bij het laatste ontploft
     hij en ga je terug naar Huishouden met een samenvatting.
   - Pauzes zijn eigen kaartjes. Bij een wissel van ruimte komt een minuut
     van tevoren een seintje (als je aanpak daarom vraagt).
   - Zonder animatie (Rust, of het toestel vraagt minder beweging) staat de
     tesseract stil en is er geen explosie; alles werkt ook met alleen
     knoppen, toetsen of een schermlezer.
   ========================================================================== */

const HHS = { a: null, raf: 0 };
const hhsRustig = () => inst("rust", false) || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
const hhsMagGeluid = () => inst("hhGeluid", true) && !inst("rust", false) && !(typeof mfInst === "function" && mfInst().prikkelarm);
const hhsTijd = s => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
const HHS_TESS = FM_KENNIS.huishouden.meewerker.zinnen;

/* ---------- 79.1 Starten ---------- */
function hhSessieStart(lijst, plan, opties) {
  if (!plan || !plan.items.length) { toast("Er staat niets in het plan"); return; }
  const items = plan.items.map(x => Object.assign({}, x));
  HHS.a = { lijst, plan, items, i: 0, opties: opties || {}, resultaat: [], afgehandeld: new Set(), gestart: new Date().toISOString(), t0: Date.now(),
    loopt: false, sec: 0, laatsteTik: 0, gedaan: 0, taken: items.filter(x => x.soort === "taak").length, seinGegeven: false, tijdOm: false,
    helder: 0, doelHelder: 0, klaar: false, stopVraag: 0, tessTel: 0 };
  document.getElementById("hh-sessie")?.remove();
  const el = document.createElement("div");
  el.id = "hh-sessie";
  el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "Schoonmaaksessie");
  el.innerHTML = `
    <div class="hhs-kop"><span class="hhs-lijst">${esc((lijst.emoji || "") + " " + (lijst.naam || "Schoonmaken"))}</span>
      <button class="hhs-stop" data-hhs="stop" aria-label="Sessie stoppen">Stop</button></div>
    <div class="hhs-tesswrap" aria-hidden="true"><canvas class="hhs-tess"></canvas><div class="hhs-flits"></div></div>
    <p class="hhs-tessregel" aria-hidden="true">${inst("hhMeewerker", true) ? "Tess werkt met je mee" : ""}</p>
    <div class="hhs-stapel"><div class="hhs-kaart" tabindex="-1"></div></div>
    <div class="hhs-onder"><span class="hhs-tegaan"></span><span class="hhs-gedaan" aria-hidden="true"><i></i><i></i><i></i><b>0</b></span></div>
    <div class="hhs-aria" id="hhs-aria" aria-live="assertive"></div>`;
  document.body.appendChild(el);
  document.documentElement.classList.add("hhs-open");
  hhsSchermAan();
  hhsCanvas();
  hhsToonKaart(true);
  cancelAnimationFrame(HHS.raf);
  let vorig = performance.now();
  const lus = nu => { const dt = Math.min(.05, (nu - vorig) / 1000); vorig = nu; hhsTik(dt); HHS.raf = requestAnimationFrame(lus); };
  HHS.raf = requestAnimationFrame(lus);
  requestAnimationFrame(() => el.classList.add("zicht"));
}
function hhsMeld(t) { const a = document.getElementById("hhs-aria"); if (a) { a.textContent = ""; setTimeout(() => { a.textContent = t; }, 30); } }
async function hhsSchermAan() { try { if (navigator.wakeLock) HHS.lock = await navigator.wakeLock.request("screen"); } catch (e) { HHS.lock = null; } }
function hhsSchermVrij() { try { HHS.lock && HHS.lock.release(); } catch (e) {} HHS.lock = null; }

/* ---------- 79.2 Het kaartje ---------- */
function hhsToonKaart(eerste) {
  const A = HHS.a, it = A.items[A.i], k = document.querySelector("#hh-sessie .hhs-kaart");
  if (!it || !k) return;
  A.loopt = false; A.sec = 0; A.seinGegeven = false; A.tijdOm = false;
  const nr = A.items.slice(0, A.i + 1).filter(x => x.soort === "taak").length;
  const luister = eerste && inst("hhLuister", "") ? `<p class="hhs-luister">🎧 Zet nu aan: <b>${esc(inst("hhLuister", ""))}</b></p>` : "";
  k.className = "hhs-kaart" + (it.soort === "pauze" ? " pauze" : "");
  k.style.transform = ""; k.style.opacity = "";
  k.innerHTML = it.soort === "pauze"
    ? `<div class="hhs-kaartkop"><span>Pauze</span><span>${it.min} min</span></div>
       <h2 class="hhs-titel">☕ Even niks</h2>
       <p class="hhs-tip">${esc(it.tip || "Even zitten, water drinken.")}</p>
       <div class="hhs-klok" aria-hidden="true">${hhsTijd(it.min * 60)}</div><div class="hhs-balk"><i></i></div>
       <div class="hhs-knoppen"><button class="hhs-knop hoofd" data-hhs="start">Start pauze</button><button class="hhs-knop" data-hhs="klaar">Overslaan</button></div>`
    : `<div class="hhs-kaartkop"><span>Klus ${nr} van ${A.taken}</span><span class="hhs-ruimte">${esc(it.ruimte || "")}</span></div>
       ${luister}
       <h2 class="hhs-titel">${esc(it.tekst)}${it.delen > 1 ? ` <small>deel ${it.deel} van ${it.delen}</small>` : ""}</h2>
       <p class="hhs-duur"><b>${it.min}</b> min${it.geleerd ? ` <small>· aangepast op jouw tempo</small>` : ""}</p>
       ${it.tip ? `<p class="hhs-tip">${esc(it.tip)}</p>` : ""}
       <div class="hhs-sein" hidden></div>
       <div class="hhs-klok" aria-hidden="true" hidden>${hhsTijd(it.min * 60)}</div><div class="hhs-balk" hidden><i></i></div>
       <div class="hhs-knoppen"><button class="hhs-knop hoofd" data-hhs="start">Start</button><button class="hhs-knop" data-hhs="over">Sla over</button></div>
       <p class="hhs-veeg" aria-hidden="true">Klaar? Veeg naar rechts →</p>`;
  hhsTeller();
  hhsMeld(it.soort === "pauze" ? `Pauze, ${it.min} minuten.` : `Klus ${nr} van ${A.taken}: ${it.tekst}, ${it.min} minuten.${it.tip ? " Tip: " + it.tip : ""}`);
  setTimeout(() => { const b = k.querySelector('[data-hhs="start"]'); if (b) b.focus({ preventScroll: true }); }, 60);
}
function hhsTeller() {
  const A = HHS.a, el = document.querySelector("#hh-sessie .hhs-tegaan"), g = document.querySelector("#hh-sessie .hhs-gedaan b");
  const rest = A.items.slice(A.i).filter(x => x.soort === "taak").length;
  if (el) el.textContent = rest ? `Nog ${rest} ${rest === 1 ? "klus" : "klussen"}` : "Laatste stap";
  if (g) g.textContent = A.gedaan;
  const stapel = document.querySelector("#hh-sessie .hhs-gedaan");
  if (stapel) stapel.dataset.n = Math.min(3, A.gedaan);
}
function hhsStart() {
  const A = HHS.a, it = A.items[A.i], k = document.querySelector("#hh-sessie .hhs-kaart");
  if (!it || A.loopt) return;
  A.loopt = true; A.laatsteTik = Date.now();
  k.classList.add("loopt");
  k.querySelectorAll(".hhs-klok,.hhs-balk").forEach(x => x.hidden = false);
  const kn = k.querySelector(".hhs-knoppen");
  kn.innerHTML = it.soort === "pauze"
    ? `<button class="hhs-knop hoofd" data-hhs="klaar">Verder</button>`
    : `<button class="hhs-knop hoofd" data-hhs="klaar">Klaar ✓</button><button class="hhs-knop" data-hhs="over">Sla over</button>`;
  const l = k.querySelector(".hhs-luister"); if (l) l.remove();
  if (typeof tril === "function") tril(10);
  hhsMeld(it.soort === "pauze" ? "Pauze gestart." : "Timer loopt. Veeg of tik op Klaar als het af is.");
  setTimeout(() => { const b = kn.querySelector('[data-hhs="klaar"]'); if (b) b.focus({ preventScroll: true }); }, 40);
}
/* Elk frame: tijd bijhouden, klok bijwerken, seintjes, tesseract tekenen. */
function hhsTik(dt) {
  const A = HHS.a; if (!A) return;
  if (A.loopt) {
    const nu = Date.now(); A.sec += (nu - A.laatsteTik) / 1000; A.laatsteTik = nu;
    const it = A.items[A.i], tot = it.min * 60, rest = tot - A.sec;
    const k = document.querySelector("#hh-sessie .hhs-kaart");
    const klok = k && k.querySelector(".hhs-klok"), balk = k && k.querySelector(".hhs-balk i");
    if (klok) klok.textContent = rest >= 0 ? hhsTijd(rest) : "+" + hhsTijd(-rest);
    if (balk) balk.style.width = Math.min(100, A.sec / tot * 100) + "%";
    if (it.wissel && !A.seinGegeven && rest <= 60 && rest > 0) {
      A.seinGegeven = true;
      const s = k.querySelector(".hhs-sein"); if (s) { s.hidden = false; s.textContent = `Over een minuut: naar ${it.wissel}`; }
      hhsMeld(`Over een minuut ga je naar ${it.wissel}.`);
    }
    if (!A.tijdOm && rest <= 0) {
      A.tijdOm = true; k.classList.add("om");
      if (hhsMagGeluid()) hhsGeluid(); if (typeof tril === "function") tril(60);
      if (it.soort === "pauze") { hhsMeld("Pauze voorbij. Tik op Verder."); }
      else {
        hhsMeld("De tijd is om. Afronden, of nog twee minuten?");
        const kn = k.querySelector(".hhs-knoppen");
        if (kn && !kn.querySelector('[data-hhs="plus2"]')) kn.insertAdjacentHTML("beforeend", `<button class="hhs-knop" data-hhs="plus2">+2 min</button>`);
      }
    }
    // Meewerker: af en toe een rustig zinnetje (niet voorgelezen, alleen zichtbaar).
    if (inst("hhMeewerker", true) && it.soort === "taak") {
      A.tessTel += dt;
      if (A.tessTel > FM_KENNIS.huishouden.meewerker.elkeSec) { A.tessTel = 0; const r = document.querySelector("#hh-sessie .hhs-tessregel"); if (r) { r.textContent = HHS_TESS[Math.floor(Math.random() * HHS_TESS.length)]; r.classList.remove("puls"); void r.offsetWidth; r.classList.add("puls"); } }
    }
  }
  // Helderheid volgt het aantal gedane klussen, vloeiend.
  A.helder += (A.doelHelder - A.helder) * Math.min(1, dt * 2.2);
  hhsTeken(dt);
}
function hhsGeluid() {
  try {
    const ctx = HHS.audio || (HHS.audio = new (window.AudioContext || window.webkitAudioContext)());
    [660, 880].forEach((f, i) => { const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + i * .18;
      o.type = "sine"; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.08, t + .03); g.gain.exponentialRampToValueAtTime(.0001, t + .6);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + .65); });
  } catch (e) {}
}

/* ---------- 79.3 Afronden van een kaartje ---------- */
function hhsVolgende(status) {
  const A = HHS.a; if (!A || A.klaar) return;
  const it = A.items[A.i];
  if (status === "over" && it.soort === "taak" && !it.alOvergeslagen && A.items.slice(A.i + 1).some(x => x.soort === "taak")) {
    // Eén keer overslaan = achteraan de rij. Niets gaat verloren, je kiest alleen de volgorde.
    it.alOvergeslagen = true;
    A.items.splice(A.i, 1); A.items.push(it);
    hhsWeg("links", () => hhsToonKaart());
    hhsMeld("Opzij gelegd. Hij komt aan het eind terug.");
    return;
  }
  A.resultaat.push({ soort: it.soort, tekst: it.tekst, ruimte: it.ruimte, taakId: it.taakId, min: it.min, basisMin: it.basisMin, deel: it.deel, delen: it.delen,
    status: status === "klaar" ? "gedaan" : "overgeslagen", sec: Math.round(A.sec) });
  A.afgehandeld.add(it);
  // Sessies uit andere lijsten (taken, checklist, side hustle): afvinken in de bron (sectie 80).
  if (status === "klaar" && typeof sesKlaar === "function") sesKlaar(A, it);
  if (it.soort === "taak" && status === "klaar") { A.gedaan++; A.doelHelder = A.gedaan / Math.max(1, A.taken); }
  const laatste = A.i >= A.items.length - 1;
  if (typeof tril === "function") tril(status === "klaar" ? 14 : 6);
  hhsWeg(status === "klaar" ? "rechts" : "links", () => {
    if (laatste) { hhsEinde(false); return; }
    A.i++;
    // Na de laatste taak nog alleen een pauze over? Dan ben je klaar.
    if (!A.items.slice(A.i).some(x => x.soort === "taak")) { hhsEinde(false); return; }
    hhsToonKaart();
  });
}
function hhsWeg(richting, klaar) {
  const k = document.querySelector("#hh-sessie .hhs-kaart");
  if (!k || hhsRustig()) { klaar(); return; }
  k.style.transition = "transform .38s cubic-bezier(.3,.6,.4,1), opacity .38s";
  k.style.transform = richting === "rechts" ? "translate(120%, 30px) rotate(14deg)" : "translate(-120%, 30px) rotate(-14deg)";
  k.style.opacity = "0";
  setTimeout(() => { k.style.transition = "none"; k.style.transform = "translateY(40px) scale(.94)"; k.style.opacity = "0"; klaar();
    requestAnimationFrame(() => { k.style.transition = "transform .42s cubic-bezier(.22,1,.36,1), opacity .3s"; k.style.transform = ""; k.style.opacity = ""; }); }, 360);
}

/* ---------- 79.4 Einde: explosie, opslaan, samenvatting ---------- */
async function hhsEinde(afgebroken) {
  const A = HHS.a; if (!A || A.klaar) return;
  A.klaar = true; A.loopt = false;
  // Wat nog open stond, telt als "niet aan toegekomen".
  A.items.filter(it => it.soort === "taak" && !A.afgehandeld.has(it)).forEach(it => {
    A.resultaat.push({ soort: "taak", tekst: it.tekst, ruimte: it.ruimte, taakId: it.taakId, min: it.min, basisMin: it.basisMin, deel: it.deel, delen: it.delen, status: "niet", sec: afgebroken && it === A.items[A.i] ? Math.round(A.sec) : 0 });
  });
  const werkSec = A.resultaat.filter(r => r.soort === "taak").reduce((s, r) => s + (r.sec || 0), 0);
  const s = { id: uid(), lijstId: A.lijst.id || null, lijstNaam: A.lijst.naam || "Klus", datum: vandaagISO(), ts: new Date().toISOString(), gestart: A.gestart,
    beschikbaar: A.opties.beschikbaar || null, energie: A.opties.energie || null, richting: A.plan.richting, werkMin: A.plan.werkMin, pauzeMin: A.plan.pauzeMin,
    resultaat: A.resultaat, werkSec, duurSec: Math.round((Date.now() - A.t0) / 1000), afgebroken: !!afgebroken, bron: A.opties.bron || "huishouden" };
  const isHuishouden = s.bron === "huishouden";
  const bewaarAlles = async () => {
    await bewaar("hh_sessies", s);
    const gedaan = s.resultaat.filter(r => r.status === "gedaan" && r.soort === "taak").length;
    if (gedaan && A.lijst.id && vind("hh_lijsten", A.lijst.id)) await bewaar("hh_lijsten", Object.assign({}, vind("hh_lijsten", A.lijst.id), { laatstGedaan: s.ts }));
    if (typeof logGebeurtenis === "function") await logGebeurtenis(isHuishouden ? "huishouden" : "sessie", `${isHuishouden ? "Schoonmaken" : "Sessie"}: ${gedaan} ${isHuishouden ? (gedaan === 1 ? "klus" : "klussen") : "af"}, ${Math.round(werkSec / 60)} min (${s.lijstNaam})${afgebroken ? " — gestopt" : ""}`, s.id);
    if (typeof vgControleerDoelen === "function") await vgControleerDoelen();
  };
  const sluit = () => {
    cancelAnimationFrame(HHS.raf); hhsSchermVrij();
    const el = document.getElementById("hh-sessie"); if (el) el.remove();
    document.documentElement.classList.remove("hhs-open");
    HHS.a = null;
    const terug = A.opties.terug;
    if (!isHuishouden && terug) {
      // Terug naar waar je vandaan kwam, met de samenvatting in een onderblad.
      if (V.view === terug[0] && (V.param || null) === (terug[1] || null)) teken(); else ga(terug[0], terug[1]);
      setTimeout(() => bladOpen("Sessie", hhSamenvattingHTML(s), `<button class="knop breed primair" onclick="bladSluit()">Klaar</button>`), 60);
      return;
    }
    V.hh.samenvatting = s.id;
    if (V.view === "huishouden") { teken(); $("#scherm").scrollTop = 0; } else ga("huishouden");
  };
  const opslaan = bewaarAlles().catch(e => console.error(e));
  if (afgebroken || hhsRustig()) { await opslaan; const el = document.getElementById("hh-sessie"); if (el) el.classList.add("weg"); setTimeout(sluit, afgebroken ? 250 : 400); return; }
  // De explosie: deeltjes vanaf de ribben, een witte flits, dan terug.
  HHS.explosie = { t: 0, deeltjes: hhsDeeltjes() };
  const k = document.querySelector("#hh-sessie .hhs-kaart"); if (k) k.classList.add("verdwijn");
  hhsMeld("Alles gedaan!");
  if (typeof tril === "function") tril(80);
  await opslaan;
  setTimeout(sluit, 1700);
}

/* ---------- 79.5 De tesseract ----------
   16 hoekpunten (±1 in vier dimensies), 32 ribben (punten die in precies
   één coördinaat verschillen). Rotatie in de vlakken XW, YW en ZW geeft het
   bekende "binnenstebuiten"-effect; daarna perspectief 4D → 3D → 2D. */
const HHS_V = Array.from({ length: 16 }, (_, i) => [i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1, i & 8 ? 1 : -1]);
const HHS_E = [];
for (let i = 0; i < 16; i++) for (let b = 0; b < 4; b++) { const j = i ^ (1 << b); if (i < j) HHS_E.push([i, j]); }
function hhsCanvas() {
  const c = document.querySelector("#hh-sessie .hhs-tess"); if (!c) return;
  const r = c.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
  c.width = Math.round(r.width * d); c.height = Math.round(r.height * d);
  HHS.ctx = c.getContext("2d"); HHS.d = d; HHS.hoek = HHS.hoek || [0.3, 0.6, 0.2, 0.1]; HHS.tijd = HHS.tijd || 0;
}
window.addEventListener("resize", () => { if (HHS.a) hhsCanvas(); });
function hhsProjecteer(p, h) {
  let [x, y, z, w] = p;
  const [a, b, c, e] = h;
  let t;
  t = x * Math.cos(a) - w * Math.sin(a); w = x * Math.sin(a) + w * Math.cos(a); x = t;       // XW
  t = y * Math.cos(b) - w * Math.sin(b); w = y * Math.sin(b) + w * Math.cos(b); y = t;       // YW
  t = z * Math.cos(c) - w * Math.sin(c); w = z * Math.sin(c) + w * Math.cos(c); z = t;       // ZW
  t = x * Math.cos(e) - z * Math.sin(e); z = x * Math.sin(e) + z * Math.cos(e); x = t;       // XZ (kanteling)
  const f4 = 2.6 / (2.6 - w * .9); x *= f4; y *= f4; z *= f4;
  const f3 = 4.2 / (4.2 - z * .8);
  return [x * f3, y * f3, w];
}
function hhsTeken(dt) {
  const ctx = HHS.ctx, A = HHS.a; if (!ctx || !A) return;
  const W = ctx.canvas.width, H = ctx.canvas.height, cx = W / 2, cy = H / 2, schaal = Math.min(W, H) * .17;
  const rustig = hhsRustig(), i = Math.max(0, Math.min(1, A.helder));
  if (!rustig) {
    HHS.tijd += dt;
    const v = .22 + i * .55;
    HHS.hoek[0] += dt * v * .9; HHS.hoek[1] += dt * v * .55; HHS.hoek[2] += dt * v * .35; HHS.hoek[3] += dt * .12;
  } else if (HHS.getekend && !HHS.explosie && Math.abs(A.helder - A.doelHelder) < .002) return;   // stilstaand: alleen tekenen als er iets verandert
  HHS.getekend = true;
  const puls = rustig ? 0 : Math.sin(HHS.tijd * (1.6 + i * 1.4)) * (.5 + .5 * i);
  ctx.clearRect(0, 0, W, H);
  // Gloed achter de figuur
  // De gloed blijft binnen het canvas, anders zie je een vierkante rand.
  const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(Math.min(W, H) / 2, schaal * (1.6 + i * 1.4 + puls * .15)));
  gr.addColorStop(0, `hsla(${190 - i * 150}, 95%, ${60 + i * 25}%, ${.10 + i * .45 + puls * .05})`);
  gr.addColorStop(1, "hsla(200, 90%, 50%, 0)");
  ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  const ex = HHS.explosie;
  if (ex) { hhsExplosie(ctx, dt, cx, cy, schaal); return; }
  const P = HHS_V.map(p => hhsProjecteer(p, HHS.hoek));
  ctx.lineCap = "round";
  const kleur = `hsl(${190 - i * 150}, ${80 + i * 15}%, ${70 + i * 22}%)`;
  // Twee lagen: een brede gloed en een scherpe kern
  for (const laag of [0, 1]) {
    ctx.shadowColor = kleur;
    ctx.shadowBlur = laag ? (4 + i * 10) * HHS.d : (10 + i * 34 + puls * 6) * HHS.d;
    ctx.strokeStyle = laag ? `rgba(255,255,255,${.55 + i * .45})` : kleur;
    ctx.globalAlpha = laag ? 1 : .35 + i * .5;
    ctx.lineWidth = (laag ? 1.1 + i * 1.2 : 3 + i * 5) * HHS.d;
    ctx.beginPath();
    for (const [a, b] of HHS_E) {
      const p = P[a], q = P[b];
      ctx.moveTo(cx + p[0] * schaal, cy + p[1] * schaal); ctx.lineTo(cx + q[0] * schaal, cy + q[1] * schaal);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1; ctx.shadowBlur = (6 + i * 16) * HHS.d; ctx.fillStyle = "#fff";
  for (const p of P) { ctx.beginPath(); ctx.arc(cx + p[0] * schaal, cy + p[1] * schaal, (1.4 + i * 1.6 + (p[2] + 1) * .5) * HHS.d, 0, Math.PI * 2); ctx.fill(); }
  ctx.shadowBlur = 0;
}
function hhsDeeltjes() {
  const P = HHS_V.map(p => hhsProjecteer(p, HHS.hoek)), uit = [];
  for (const [a, b] of HHS_E) for (let k = 0; k < 6; k++) {
    const t = Math.random(), x = P[a][0] + (P[b][0] - P[a][0]) * t, y = P[a][1] + (P[b][1] - P[a][1]) * t, len = Math.hypot(x, y) || 1;
    const snel = 1.5 + Math.random() * 4.5;
    uit.push({ x, y, vx: x / len * snel + (Math.random() - .5) * 1.5, vy: y / len * snel + (Math.random() - .5) * 1.5, r: .6 + Math.random() * 1.8, h: 30 + Math.random() * 30 });
  }
  return uit;
}
function hhsExplosie(ctx, dt, cx, cy, schaal) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  const ex = HHS.explosie; ex.t += dt;
  const t = ex.t, fade = Math.max(0, 1 - t / 1.5);
  const f = document.querySelector("#hh-sessie .hhs-flits");
  if (f && !f.classList.contains("aan")) f.classList.add("aan");
  // Schokgolf
  const rand = Math.min(W, H) / 2, straal = Math.min(rand, schaal * (.3 + t * 5));
  ctx.globalAlpha = fade * Math.max(0, 1 - straal / rand); ctx.strokeStyle = "#fff"; ctx.lineWidth = (6 * fade + 1) * HHS.d; ctx.shadowColor = "#ffe9a8"; ctx.shadowBlur = 30 * HHS.d;
  ctx.beginPath(); ctx.arc(cx, cy, straal, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = fade;
  for (const p of ex.deeltjes) {
    p.x += p.vx * dt * 1.6; p.y += p.vy * dt * 1.6; p.vx *= .985; p.vy *= .985;
    const afstand = Math.hypot(p.x * schaal, p.y * schaal) / (Math.min(W, H) / 2);
    ctx.fillStyle = `hsla(${p.h}, 100%, ${75 + 25 * fade}%, ${fade * Math.max(0, 1 - afstand * afstand)})`;
    ctx.beginPath(); ctx.arc(cx + p.x * schaal, cy + p.y * schaal, p.r * HHS.d * (1 + fade), 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1; ctx.shadowBlur = 0;
}

/* ---------- 79.6 Vegen, tikken, toetsen ---------- */
{
  let g = null;
  document.addEventListener("pointerdown", e => {
    const k = e.target.closest && e.target.closest("#hh-sessie .hhs-kaart");
    if (!k || e.target.closest("button") || !HHS.a || HHS.a.klaar) return;
    g = { k, x: e.clientX, y: e.clientY, dx: 0, id: e.pointerId, bezig: false };
  }, { passive: true });
  document.addEventListener("pointermove", e => {
    if (!g || e.pointerId !== g.id) return;
    const dx = e.clientX - g.x, dy = e.clientY - g.y;
    if (!g.bezig) { if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { g = null; return; } if (Math.abs(dx) < 10) return; g.bezig = true; try { g.k.setPointerCapture(e.pointerId); } catch (x) {} }
    g.dx = dx;
    g.k.style.transition = "none";
    g.k.style.transform = `translateX(${dx}px) rotate(${dx / 22}deg)`;
    g.k.classList.toggle("naar-gedaan", dx > 70); g.k.classList.toggle("naar-later", dx < -70);
  }, { passive: true });
  const los = () => {
    if (!g) return; const r = g; g = null;
    r.k.classList.remove("naar-gedaan", "naar-later");
    if (!r.bezig) return;
    if (r.dx > 100) hhsVolgende("klaar");
    else if (r.dx < -100) hhsVolgende(HHS.a.items[HHS.a.i].soort === "pauze" ? "klaar" : "over");
    else { r.k.style.transition = "transform .3s cubic-bezier(.22,1,.36,1)"; r.k.style.transform = ""; }
  };
  document.addEventListener("pointerup", los); document.addEventListener("pointercancel", los);
}
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest("#hh-sessie [data-hhs]");
  if (!b || !HHS.a || HHS.a.klaar) return;
  const A = HHS.a;
  switch (b.dataset.hhs) {
    case "start": hhsStart(); break;
    case "klaar": hhsVolgende("klaar"); break;
    case "over": hhsVolgende("over"); break;
    case "plus2": { const it = A.items[A.i]; it.min += 2; A.tijdOm = false; const k = document.querySelector("#hh-sessie .hhs-kaart"); k.classList.remove("om"); b.remove(); hhsMeld("Twee minuten erbij."); break; }
    case "stop":
      if (Date.now() - A.stopVraag < 3500) { hhsEinde(true); break; }
      A.stopVraag = Date.now(); b.textContent = "Echt stoppen?"; b.classList.add("vraag");
      setTimeout(() => { if (b.isConnected) { b.textContent = "Stop"; b.classList.remove("vraag"); } }, 3500);
      hhsMeld("Tik nog een keer op Stop om te stoppen. Wat af is, blijft bewaard."); break;
  }
});
document.addEventListener("keydown", e => {
  if (!HHS.a || HHS.a.klaar || !document.getElementById("hh-sessie")) return;
  if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
  const A = HHS.a;
  if (e.key === "ArrowRight") { e.preventDefault(); A.loopt || A.items[A.i].soort === "pauze" ? hhsVolgende("klaar") : hhsStart(); }
  else if (e.key === "ArrowLeft") { e.preventDefault(); hhsVolgende("over"); }
  else if (e.key === "Escape") { e.preventDefault(); document.querySelector('#hh-sessie [data-hhs="stop"]').click(); }
});
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && HHS.a && !HHS.a.klaar) hhsSchermAan(); });
