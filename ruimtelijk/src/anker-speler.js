"use strict";
// === SECTIE 70: ANKER – SESSIESPELER ===
/* ==========================================================================
   De speler legt een scherm over de app heen (geen scrollen tijdens een
   sessie). Bovenaan rechts staat altijd een grote Stop-knop.
   Wat de speler doet, hangt af van het type oefening:
   - adem     : ademcirkel (of tekst als animatie uit staat) die het ritme volgt;
   - stappen  : één stapzin tegelijk, verdeeld over de tijd, met "Volgende";
   - teller   : tikken bij elke uitademing, 1 tot en met 10;
   - labels   : knoppen om het soort gedachte te tellen;
   - golf     : schuifjes voor hoe sterk de trek is (begin, midden, eind).
   Prikkels (geluid, ademtonen, stem, animatie, trilling) gaan alleen aan als
   de instellingen dat toestaan (zie mfMag in sectie 69).
   ========================================================================== */
const MFS = { actief: null, audio: null, wakeLock: null, timer: 0 };

/* ---------- 70.1 Geluid: zachte tonen met Web Audio (geen audiobestanden) ---------- */
function mfAudio() {
  try {
    if (!MFS.audio) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; MFS.audio = new C(); }
    if (MFS.audio.state === "suspended") MFS.audio.resume();
    return MFS.audio;
  } catch (e) { return null; }
}
/* Eén sinustoon die zacht opkomt en weer wegzakt (geen harde klik). */
function mfToon(freq, duur, volume) {
  const ctx = mfAudio(); if (!ctx) return;
  const t0 = ctx.currentTime, osc = ctx.createOscillator(), g = ctx.createGain();
  osc.type = "sine"; osc.frequency.value = freq;
  const top = volume || .05, op = Math.min(.35, duur / 3), af = Math.min(.6, duur / 2.5);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(top, t0 + op);
  g.gain.setValueAtTime(top, t0 + Math.max(op, duur - af));
  g.gain.linearRampToValueAtTime(0, t0 + duur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0); osc.stop(t0 + duur + .05);
}
/* Een zachte gong: een paar tonen die langzaam uitsterven. */
function mfGong() {
  if (!mfMag("geluid")) return;
  const ctx = mfAudio(); if (!ctx) return;
  const t0 = ctx.currentTime;
  [[196, .09], [392, .035], [588, .018]].forEach(([f, v]) => {
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = "sine"; osc.frequency.value = f;
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(v, t0 + .02); g.gain.exponentialRampToValueAtTime(.0001, t0 + 3.8);
    osc.connect(g).connect(ctx.destination); osc.start(t0); osc.stop(t0 + 4);
  });
}
/* ---------- 70.2 Stem, trilling en scherm aan houden ---------- */
function mfZeg(tekst) {
  if (!mfMag("stem") || !("speechSynthesis" in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(tekst);
    u.lang = "nl-NL"; u.rate = .92;
    const stem = speechSynthesis.getVoices().find(v => /^nl/i.test(v.lang));
    if (stem) u.voice = stem;
    speechSynthesis.speak(u);
  } catch (e) { /* geen stem beschikbaar: niets aan de hand */ }
}
/* iPhone kent navigator.vibrate niet; dan doen we gewoon niets (geen foutmelding). */
function mfTril(ms) { if (mfMag("trilling") && typeof navigator.vibrate === "function") { try { navigator.vibrate(ms); } catch (e) {} } }
async function mfSchermAan() {
  try { if ("wakeLock" in navigator && !MFS.wakeLock) { MFS.wakeLock = await navigator.wakeLock.request("screen"); MFS.wakeLock.addEventListener("release", () => { MFS.wakeLock = null; }); } }
  catch (e) { MFS.wakeLock = null; }
}
function mfSchermVrij() { try { if (MFS.wakeLock) MFS.wakeLock.release(); } catch (e) {} MFS.wakeLock = null; }
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && MFS.actief && !MFS.actief.gepauzeerd) mfSchermAan(); });

/* ---------- 70.3 Voorleesregel voor schermlezers ----------
   Een onzichtbare regel met aria-live. Alles wat we daarin zetten, lezen
   VoiceOver en TalkBack voor: "In", "Uit" en elke nieuwe stap. */
function mfMeld(tekst) {
  const r = document.getElementById("mf-aria"); if (!r) return;
  r.textContent = "";
  setTimeout(() => { r.textContent = tekst; }, 30);
}

/* ---------- 70.4 Starten ----------
   opties: { min, bron, checkin } — niets vraagt eerst iets, behalve:
   - de bodyscan de eerste keer (korte waarschuwing, jij kiest "Begin");
   - "Mild zijn voor jezelf" (kies neutraal of warm). */
function mfStart(id, opties) {
  opties = opties || {};
  const o = mfOef(id); if (!o) return;
  const min = opties.min && o.varianten.includes(+opties.min) ? +opties.min : (opties.min ? +opties.min : mfStandaardMin(o));
  mfAudio();   // audio moet binnen een tik worden aangezet (iPhone)
  if (typeof bladSluit === "function" && $("#blad") && $("#blad").classList.contains("open")) bladSluit();
  const s = mfInst();
  if (o.optIn && !s.bodyscanGezien && !opties.akkoord) return mfVoorscherm(o, min, opties, "optin");
  if (o.stappenWarm && !opties.stijl) return mfVoorscherm(o, min, opties, "mild");
  mfBegin(o, min, opties);
}
function mfOverlay(inhoud, label) {
  let el = document.getElementById("mf-speler");
  if (!el) {
    el = document.createElement("div");
    el.id = "mf-speler";
    el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true");
    document.body.appendChild(el);
    document.documentElement.classList.add("mf-sessie-open");
  }
  el.className = "mf-speler mf-l-" + mfInst().lettergrootte + (mfMag("animatie") ? "" : " mf-stil");
  el.setAttribute("aria-label", label);
  el.innerHTML = inhoud + `<div id="mf-aria" class="mf-sr" aria-live="polite" aria-atomic="true"></div>`;
  return el;
}
function mfSluitOverlay() {
  const el = document.getElementById("mf-speler");
  if (el) el.remove();
  document.documentElement.classList.remove("mf-sessie-open");
  MFS.actief = null;
  clearInterval(MFS.timer);
  mfSchermVrij();
  try { if ("speechSynthesis" in window) speechSynthesis.cancel(); } catch (e) {}
  if (typeof teken === "function") teken();
}
function mfVoorscherm(o, min, opties, soort) {
  const stop = `<button class="mf-stop" data-mf="sluit" aria-label="Sluiten">Sluiten</button>`;
  let midden;
  if (soort === "optin") midden = `<h2 class="mf-voortitel">${esc(o.naam)}</h2><p class="mf-voortekst">${esc(o.optIn)}</p>
      <div class="mf-knoppen"><button class="mf-knop hoofd" data-mf="optin-ja">Begin</button><button class="mf-knop" data-mf="sluit">Liever niet</button></div>`;
  else {
    const keuze = mfInst().mildKeuze || "neutraal";
    midden = `<h2 class="mf-voortitel">${esc(o.naam)}</h2><p class="mf-voortekst">${esc(o.uitleg)}</p>
      <ul class="mf-keuzelijst" role="list">
        <li><button class="mf-keuze${keuze === "neutraal" ? " aan" : ""}" data-mf="mild" data-stijl="neutraal"><b>Neutraal</b><span>${esc(o.stappen[0])}</span></button></li>
        <li><button class="mf-keuze${keuze === "warm" ? " aan" : ""}" data-mf="mild" data-stijl="warm"><b>Warm</b><span>${esc(o.stappenWarm[0])}</span></button></li></ul>`;
  }
  mfOverlay(`<div class="mf-kop"><span class="mf-kopnaam">${esc(o.naam)}</span>${stop}</div><div class="mf-voor">${midden}</div>`, o.naam);
  MFS.voor = { o, min, opties };
  setTimeout(() => { const b = document.querySelector("#mf-speler .mf-voor button"); if (b) b.focus(); }, 50);
}

/* ---------- 70.5 De sessie zelf ---------- */
function mfBegin(o, min, opties) {
  const s = mfInst();
  const stappen = o.stappenWarm && opties.stijl === "warm" ? o.stappenWarm : o.stappen;
  const A = MFS.actief = {
    o, min, opties, stappen, totaal: min * 60,
    verstreken: 0, laatste: performance.now(), gepauzeerd: false,
    stap: 0, stapStart: 0, fase: -1, tel: 1, labels: {}, golf: {}, keuzes: {},
    ritme: o.ritme === "instellingen"
      ? [{ fase: "in", sec: s.ademIn, stap: 0, woord: "In" }, { fase: "uit", sec: s.ademUit, stap: 1, woord: "Uit" }]
      : o.ritme ? (s.geenVasthouden ? o.ritme.filter(f => f.fase !== "vast") : o.ritme) : null,
    gestart: new Date().toISOString()
  };
  const typeHTML = {
    adem: () => `<div class="mf-adem" aria-hidden="true"><div class="mf-cirkel"><span class="mf-cirkelwoord"></span></div><div class="mf-ademtekst"><b class="mf-ademwoord"></b><span class="mf-ademtel"></span></div></div>`,
    teller: () => `<div class="mf-teller"><div class="mf-telgetal" aria-hidden="true">1</div>
      <button class="mf-knop hoofd groot" data-mf="tel">Tik bij je uitademing</button><button class="mf-knop" data-mf="afgedwaald">Ik dwaalde af</button></div>`,
    labels: () => `<ul class="mf-labels" role="list">${o.labels.map(l => `<li><button class="mf-label" data-mf="label" data-l="${l}"><b>${l}</b><span class="mf-labeltel" aria-hidden="true">0</span></button></li>`).join("")}</ul>`,
    golf: () => `<div class="mf-golfvak"></div>`,
    stappen: () => `<div class="mf-stapvak"></div>`
  }[o.type] || (() => "");
  mfOverlay(`
    <div class="mf-kop"><span class="mf-kopnaam">${esc(o.naam)} · ${min} min</span>
      <button class="mf-stop" data-mf="stop" aria-label="Stop de oefening">Stop</button></div>
    <div class="mf-voortgang" role="progressbar" aria-label="Voortgang" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div>
    <div class="mf-midden">
      <p class="mf-stap" id="mf-stap"></p>
      ${typeHTML()}
      ${o.tip ? `<p class="mf-hint mf-ademtip">${esc(o.tip)}</p>` : ""}
    </div>
    <div class="mf-onder">
      <button class="mf-knop" data-mf="pauze" aria-pressed="false">Pauze</button>
      ${o.type === "stappen" || o.type === "golf" ? `<button class="mf-knop" data-mf="volgende">${o.overslaan ? "Sla over" : "Volgende"}</button>` : ""}
      <span class="mf-tijd" aria-hidden="true"></span>
    </div>`, `Oefening: ${o.naam}, ${min} minuten`);
  mfGong();
  mfSchermAan();
  mfTril(40);
  mfToonStap(0, true);
  if (o.type === "adem") mfAdemFase(0);
  clearInterval(MFS.timer);
  MFS.timer = setInterval(mfTik, 200);
  setTimeout(() => { const b = document.querySelector("#mf-speler .mf-stop"); if (b) b.focus(); }, 60);
}
/* De klok: telt alleen door als je niet gepauzeerd bent. */
function mfTik() {
  const A = MFS.actief; if (!A) return;
  const nu = performance.now();
  if (!A.gepauzeerd) A.verstreken += (nu - A.laatste) / 1000;
  A.laatste = nu;
  const pct = Math.min(100, A.verstreken / A.totaal * 100);
  const balk = document.querySelector("#mf-speler .mf-voortgang");
  if (balk) { balk.firstElementChild.style.width = pct + "%"; balk.setAttribute("aria-valuenow", Math.round(pct)); }
  const rest = Math.max(0, Math.ceil(A.totaal - A.verstreken)), t = document.querySelector("#mf-speler .mf-tijd");
  if (t) t.textContent = `${Math.floor(rest / 60)}:${String(rest % 60).padStart(2, "0")}`;
  if (A.gepauzeerd) return;
  if (A.o.type === "adem") mfAdemTik();
  else if (A.o.type === "stappen" || A.o.type === "golf") {
    const stapDuur = A.totaal / A.stappen.length;
    if (A.stap < A.stappen.length - 1 && A.verstreken - A.stapStart >= stapDuur) mfToonStap(A.stap + 1);
  } else if (A.o.type === "labels") {
    // De drie zinnen komen om de beurt terug, elke 20 seconden.
    const i = Math.floor(A.verstreken / 20) % A.stappen.length;
    if (i !== A.stap) mfToonStap(i);
  }
  if (A.verstreken >= A.totaal) mfKlaar(false);
}
function mfToonStap(i, eerste) {
  const A = MFS.actief; if (!A) return;
  A.stap = i; A.stapStart = A.verstreken;
  const tekst = A.stappen[i] || "";
  const p = document.getElementById("mf-stap");
  if (p && A.o.type !== "adem") p.textContent = tekst;
  if (A.o.type === "adem" && p && eerste) p.textContent = A.o.waarom;
  if (A.o.type !== "adem") { mfMeld(tekst); mfZeg(tekst); if (!eerste) mfTril(25); }
  // Extra's per stap: keuzes (gevoel benoemen), schuifjes (trek), warm-hint (mild zijn)
  const vak = document.querySelector("#mf-speler .mf-stapvak, #mf-speler .mf-golfvak");
  if (vak) {
    let h = "";
    const k = A.o.keuzes && A.o.keuzes[i];
    if (k) h += `<ul class="mf-keuzes" role="list" aria-label="Kies wat past">${k.map(w => `<li><button class="mf-kies" data-mf="kies" data-w="${esc(w)}" aria-pressed="${A.keuzes[i] === w}">${esc(w)}</button></li>`).join("")}</ul>`;
    const meet = A.o.meetStappen && A.o.meetStappen[i];
    if (meet) {
      const w = A.golf[meet] != null ? A.golf[meet] : 5;
      h += `<div class="mf-schuif"><input type="range" min="0" max="10" step="1" value="${w}" data-mf-golf="${meet}" aria-label="Hoe sterk is de trek? 0 tot 10" aria-valuetext="${w} van 10">
        <div class="mf-schuifwaarden" aria-hidden="true"><span>0</span><b class="mf-schuifnu">${w}</b><span>10</span></div></div>`;
      if (A.golf[meet] == null) A.golf[meet] = w;
    }
    if (A.o.stappenWarm && A.opties.stijl === "warm" && i === A.stappen.length - 1) h += `<p class="mf-hint">${esc(A.o.warmHint)}</p>`;
    vak.innerHTML = h;
    const vol = document.querySelector('#mf-speler [data-mf="volgende"]');
    if (vol) vol.textContent = i >= A.stappen.length - 1 ? "Klaar" : (A.o.overslaan ? "Sla over" : "Volgende");
  }
}
/* ---------- Ademritme ---------- */
function mfAdemTik() {
  const A = MFS.actief, r = A.ritme, cyclus = r.reduce((a, f) => a + f.sec, 0);
  let t = A.verstreken % cyclus, i = 0;
  while (i < r.length - 1 && t >= r[i].sec) { t -= r[i].sec; i++; }
  if (i !== A.fase) mfAdemFase(i);
  const tel = document.querySelector("#mf-speler .mf-ademtel");
  if (tel) tel.textContent = `${Math.max(1, Math.ceil(r[i].sec - t))}`;
}
function mfAdemFase(i) {
  const A = MFS.actief, f = A.ritme[i];
  A.fase = i;
  const cirkel = document.querySelector("#mf-speler .mf-cirkel");
  if (cirkel) {
    // Groeien bij inademen, krimpen bij uitademen. De overgang duurt precies zo lang als de fase.
    cirkel.style.transitionDuration = mfMag("animatie") ? f.sec + "s" : "0s";
    // Bij "vast" blijft de cirkel staan waar hij was (na in: groot, na uit: klein).
    if (f.fase !== "vast") cirkel.style.transform = `scale(${f.fase === "uit" ? .55 : f.fase === "bij" ? 1.08 : 1})`;
    cirkel.classList.toggle("vast", f.fase === "vast");
  }
  const woord = document.querySelector("#mf-speler .mf-ademwoord"), cw = document.querySelector("#mf-speler .mf-cirkelwoord");
  if (woord) woord.textContent = f.woord;
  if (cw) cw.textContent = f.woord;
  const p = document.getElementById("mf-stap");
  if (p && A.verstreken > 1) p.textContent = A.stappen[f.stap] || "";
  mfMeld(f.woord);
  mfZeg(f.woord);
  // Vasthouden is stil: geen toon.
  if (mfMag("ademtonen") && f.fase !== "vast") mfToon(f.fase === "uit" ? 330 : f.fase === "bij" ? 587 : 523, f.sec, .045);
  mfTril(f.fase === "uit" ? 15 : f.fase === "vast" ? 8 : 30);
}

/* ---------- 70.6 Klaar of gestopt ----------
   Ook stoppen telt als geldige sessie: we slaan hem op met afgebroken: true. */
async function mfKlaar(afgebroken) {
  const A = MFS.actief; if (!A || A.klaar) return;
  A.klaar = true;
  clearInterval(MFS.timer);
  mfSchermVrij();
  try { if ("speechSynthesis" in window) speechSynthesis.cancel(); } catch (e) {}
  if (!afgebroken) { mfGong(); mfTril(60); }
  const sessie = {
    datum: new Date().toISOString(), oefeningId: A.o.id, variantMin: A.min,
    duurSec: Math.round(Math.min(A.verstreken, A.totaal)), afgebroken: !!afgebroken,
    checkin: A.opties.checkin || null, nameting: null, notitie: "", bron: A.opties.bron || "anker"
  };
  // Extra uitkomsten per type (alleen op dit toestel)
  if (A.o.type === "labels") sessie.labels = A.labels;
  if (A.o.type === "golf") sessie.golf = A.golf;
  if (A.o.keuzes) sessie.keuzes = A.keuzes;
  if (A.o.stappenWarm) sessie.stijl = A.opties.stijl || "neutraal";
  try { await mfSessieOpslaan(sessie); } catch (e) { opslagFout(e); }
  if (A.opties.bron === "programma") await mfProgrammaVerder(A.o.id);
  A.sessie = sessie;
  if (typeof mfNaSessie === "function") mfNaSessie(sessie, "opgeslagen");
  if (afgebroken) mfGestoptScherm(A); else mfAfronding(A);
}
function mfGestoptScherm(A) {
  const z4 = mfOef("Z4");
  mfOverlay(`<div class="mf-kop"><span class="mf-kopnaam">${esc(A.o.naam)}</span><button class="mf-stop" data-mf="sluit" aria-label="Sluiten">Sluiten</button></div>
    <div class="mf-voor"><h2 class="mf-voortitel">Gestopt. Dat telt ook.</h2>
      <p class="mf-voortekst">Je moment is opgeslagen. Wil je iets korts met je handen proberen?</p>
      <div class="mf-knoppen">${A.o.id !== "Z4" ? `<button class="mf-knop hoofd" data-mf="start" data-id="Z4" data-min="1">${esc(z4.naam)} · 1 min</button>` : ""}
        <button class="mf-knop" data-mf="sluit">Klaar</button></div></div>`, "Oefening gestopt");
  mfMeld("Gestopt. Je moment is opgeslagen.");
  if (typeof mfNaSessie === "function") mfNaSessie(A.sessie, "klaar");
  setTimeout(() => { const b = document.querySelector("#mf-speler .mf-voor button"); if (b) b.focus(); }, 60);
}
/* Afronding: "Hoe is het nu?" (overslaan mag). */
function mfAfronding(A) {
  let extra = "";
  if (A.o.type === "labels") {
    const tot = Object.values(A.labels).reduce((a, n) => a + n, 0);
    extra = `<div class="mf-uitkomst"><b>Jouw gedachten</b><ul role="list">${A.o.labels.map(l => `<li><span>${l}</span><b>${A.labels[l] || 0}</b></li>`).join("")}</ul>
      <p class="mf-klein">${tot ? `${tot} keer een gedachte opgemerkt. Opmerken is precies de oefening.` : "Geen gedachten getikt. Ook goed."}</p></div>`;
  }
  if (A.o.type === "golf") extra = mfGolfHTML(A.golf);
  if (A.o.keuzes && Object.keys(A.keuzes).length) extra = `<div class="mf-uitkomst"><b>Wat je koos</b><p>${Object.values(A.keuzes).map(esc).join(" · ")}</p></div>`;
  mfOverlay(`<div class="mf-kop"><span class="mf-kopnaam">${esc(A.o.naam)}</span><button class="mf-stop" data-mf="sluit" aria-label="Sluiten">Sluiten</button></div>
    <div class="mf-voor mf-af">
      <h2 class="mf-voortitel">Klaar. Hoe is het nu?</h2>
      ${extra}
      <ul class="mf-keuzelijst drie" role="list">
        ${[["beter", "Beter"], ["hetzelfde", "Hetzelfde"], ["onrustiger", "Onrustiger"]].map(([k, n]) => `<li><button class="mf-keuze" data-mf="na" data-w="${k}" aria-pressed="false"><b>${n}</b></button></li>`).join("")}</ul>
      <label class="mf-notitielabel" for="mf-notitie">Notitie (mag leeg blijven)</label>
      <textarea id="mf-notitie" class="mf-notitie" rows="2"></textarea>
      <div class="mf-knoppen"><button class="mf-knop hoofd" data-mf="na-opslaan">Opslaan</button><button class="mf-knop" data-mf="na-over">Overslaan</button></div>
      <button class="mf-deel" data-mf="deel" data-id="${A.o.id}">Deel deze oefening</button>
    </div>`, "Oefening klaar");
  mfMeld("Klaar. Hoe is het nu? Kies beter, hetzelfde of onrustiger. Of sla over.");
  setTimeout(() => { const b = document.querySelector('#mf-speler [data-mf="na"]'); if (b) b.focus(); }, 60);
}
/* Golfgrafiek met tekstalternatief (voor schermlezers en zonder kijken). */
function mfGolfHTML(g) {
  const pts = [["begin", "Begin"], ["midden", "Midden"], ["eind", "Eind"]].filter(([k]) => g[k] != null);
  if (!pts.length) return "";
  const W = 240, H = 90, x = i => 16 + i * ((W - 32) / Math.max(1, pts.length - 1)), y = v => H - 14 - v / 10 * (H - 28);
  const lijn = pts.map(([k], i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(g[k]).toFixed(1)}`).join(" ");
  const tekst = pts.map(([k, n]) => `${n} ${g[k]}`).join(", ");
  return `<div class="mf-uitkomst"><b>Hoe sterk was de trek?</b>
    <svg class="mf-golf" viewBox="0 0 ${W} ${H}" role="img" aria-label="Trek van 0 tot 10: ${tekst}">
      <line x1="16" x2="${W - 16}" y1="${H - 14}" y2="${H - 14}" class="mf-golfas"/>
      <path d="${lijn}" class="mf-golflijn"/>${pts.map(([k, n], i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(g[k]).toFixed(1)}" r="5" class="mf-golfpunt"/><text x="${x(i).toFixed(1)}" y="${(y(g[k]) - 9).toFixed(1)}" text-anchor="middle">${g[k]}</text>`).join("")}</svg>
    <p class="mf-klein">${esc(tekst)} (van 0 tot 10).</p></div>`;
}
async function mfNaOpslaan(overslaan) {
  const A = MFS.actief; if (!A || !A.sessie) { mfSluitOverlay(); return; }
  const gekozen = document.querySelector('#mf-speler [data-mf="na"][aria-pressed="true"]');
  if (!overslaan) {
    A.sessie.nameting = gekozen ? gekozen.dataset.w : null;
    A.sessie.notitie = ((document.getElementById("mf-notitie") || {}).value || "").trim();
    try { await mfSessieOpslaan(A.sessie); } catch (e) { opslagFout(e); }
  }
  if (typeof mfNaSessie === "function") mfNaSessie(A.sessie, "klaar");
  // Past de oefening nu niet? Bied een alternatief aan (niets start vanzelf).
  const kaarten = [];
  if (A.sessie.nameting === "onrustiger" && mfTweeKeerOnrustiger(A.o.id)) {
    const alt = mfOef(A.o.alsHetNietLukt);
    kaarten.push(`<div class="mf-kaartje"><p>Deze oefening lijkt nu niet te passen. Wil je er een proberen met aandacht naar buiten?</p>
      <button class="mf-knop hoofd" data-mf="start" data-id="${alt.id}" data-min="${alt.varianten[0]}">${esc(alt.naam)} · ${alt.varianten[0]} min</button></div>`);
  }
  if (A.sessie.nameting === "onrustiger" && mfOnrustigInZevenDagen() >= 5) kaarten.push(`<div class="mf-kaartje zacht"><p>Je voelde je de afgelopen week vaker onrustiger na een oefening. Praat erover met je huisarts of behandelaar. Dat mag altijd.</p></div>`);
  if (!kaarten.length) { mfSluitOverlay(); toast(overslaan ? "Moment opgeslagen" : "Opgeslagen"); return; }
  mfOverlay(`<div class="mf-kop"><span class="mf-kopnaam">${esc(A.o.naam)}</span><button class="mf-stop" data-mf="sluit" aria-label="Sluiten">Sluiten</button></div>
    <div class="mf-voor">${kaarten.join("")}<div class="mf-knoppen"><button class="mf-knop" data-mf="sluit">Klaar</button></div></div>`, "Advies");
  mfMeld(kaarten.length > 1 ? "Er zijn twee tips." : "Er is een tip.");
}

/* ---------- 70.7 Delen: alleen een vaste tekst, nooit persoonlijke gegevens ---------- */
async function mfDeel(oefId) {
  const o = oefId ? mfOef(oefId) : null;
  let tekst = "Anker is een onderdeel van FutureMe: korte adem- en aandachtsoefeningen voor een vol hoofd. Gratis, zonder reclame, niets verlaat je telefoon.";
  if (o) tekst += `\n\n${o.naam} (${mfDuurTekst(o)}):\n` + (o.type === "adem" && o.ritme === "instellingen" ? ["Adem 4 tellen in.", "Adem 6 tellen uit.", "Herhaal rustig."] : o.stappen).map((s, i) => `${i + 1}. ${s}`).join("\n");
  try {
    if (navigator.share) { await navigator.share({ title: "Anker", text: tekst }); return; }
  } catch (e) { if (e && e.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(tekst); toast("Tekst gekopieerd"); }
  catch (e) { toast("Delen lukt hier niet"); }
}

/* ---------- 70.8 Tikken in de speler ---------- */
document.addEventListener("click", e => {
  const el = e.target.closest && e.target.closest("#mf-speler [data-mf]");
  if (!el) return;
  const A = MFS.actief, wat = el.dataset.mf;
  switch (wat) {
    case "stop": if (A) mfKlaar(true); else mfSluitOverlay(); break;
    case "sluit": if (A && A.sessie && typeof mfNaSessie === "function") mfNaSessie(A.sessie, "klaar"); mfSluitOverlay(); break;
    case "pauze": {
      if (!A) break;
      A.gepauzeerd = !A.gepauzeerd;
      el.setAttribute("aria-pressed", String(A.gepauzeerd));
      el.textContent = A.gepauzeerd ? "Verder" : "Pauze";
      document.getElementById("mf-speler").classList.toggle("mf-pauze", A.gepauzeerd);
      mfMeld(A.gepauzeerd ? "Gepauzeerd" : "Verder");
      if (A.gepauzeerd) { mfSchermVrij(); try { speechSynthesis.cancel(); } catch (x) {} } else { mfSchermAan(); if (A.o.type === "adem") mfAdemFase(A.fase < 0 ? 0 : A.fase); }
      break;
    }
    case "volgende": if (A) { if (A.stap >= A.stappen.length - 1) mfKlaar(false); else mfToonStap(A.stap + 1); } break;
    case "tel": {
      if (!A) break;
      A.tel = A.tel >= 10 ? 1 : A.tel + 1;
      document.querySelector("#mf-speler .mf-telgetal").textContent = A.tel;
      mfMeld(String(A.tel)); mfTril(15);
      break;
    }
    case "afgedwaald": {
      if (!A) break;
      A.tel = 1;
      document.querySelector("#mf-speler .mf-telgetal").textContent = "1";
      document.getElementById("mf-stap").textContent = "Opgemerkt. Terug naar 1.";
      mfMeld("Opgemerkt. Terug naar 1.");
      break;
    }
    case "label": {
      if (!A) break;
      const l = el.dataset.l; A.labels[l] = (A.labels[l] || 0) + 1;
      el.querySelector(".mf-labeltel").textContent = A.labels[l];
      mfMeld(`${l}: ${A.labels[l]}`); mfTril(15);
      break;
    }
    case "kies": {
      if (!A) break;
      A.keuzes[A.stap] = el.dataset.w;
      el.closest("ul").querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b === el)));
      mfMeld("Gekozen: " + el.dataset.w);
      break;
    }
    case "optin-ja": { const v = MFS.voor; mfInstZet({ bodyscanGezien: true }); mfBegin(v.o, v.min, Object.assign({}, v.opties, { akkoord: true })); break; }
    case "mild": { const v = MFS.voor; mfInstZet({ mildKeuze: el.dataset.stijl }); mfBegin(v.o, v.min, Object.assign({}, v.opties, { stijl: el.dataset.stijl })); break; }
    case "na": el.closest("ul").querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(b === el))); break;
    case "na-opslaan": mfNaOpslaan(false); break;
    case "na-over": mfNaOpslaan(true); break;
    case "deel": mfDeel(el.dataset.id); break;
    case "start": { const id = el.dataset.id, min = +el.dataset.min; mfSluitOverlay(); setTimeout(() => mfStart(id, { min, bron: "anker" }), 60); break; }
  }
});
document.addEventListener("input", e => {
  const r = e.target.closest && e.target.closest("#mf-speler [data-mf-golf]");
  if (!r || !MFS.actief) return;
  MFS.actief.golf[r.dataset.mfGolf] = +r.value;
  r.setAttribute("aria-valuetext", r.value + " van 10");
  const nu = document.querySelector("#mf-speler .mf-schuifnu"); if (nu) nu.textContent = r.value;
});
/* Escape = stoppen (toetsenbord). */
document.addEventListener("keydown", e => {
  if (e.key !== "Escape" || !document.getElementById("mf-speler")) return;
  e.preventDefault();
  const A = MFS.actief;
  if (A && !A.klaar) mfKlaar(true);
  else { if (A && A.sessie && typeof mfNaSessie === "function") mfNaSessie(A.sessie, "klaar"); mfSluitOverlay(); }
});
