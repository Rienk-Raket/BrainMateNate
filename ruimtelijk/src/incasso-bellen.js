"use strict";
/* ==========================================================================
   64. Incasso's op komst als zeepbelletjes
   Tik op de knop: de bedragen ploppen één voor één als belletjes uit de knop
   en zweven eromheen. Tik op een belletje: het schuift open met de rest van
   de informatie. Nog een tik op de knop: alles zweeft terug naar binnen.
   ========================================================================== */
V.ibOpen = V.ibOpen || false;
V.ibActief = V.ibActief || null;
const IB = { d: 34, gap: 9, bezig: false };
/** Alleen het bedrag, compact: 845 · 13,99 · 1.200 */
const ibKortBedrag = n => { const [h, c] = (Math.round(n * 100) / 100).toFixed(2).split("."); const hh = h.replace(/\B(?=(\d{3})+(?!\d))/g, "."); return c === "00" ? hh : hh + "," + c; };

function ibLijst() {
  const v = vandaagISO();
  return incassosIn(v, plusDagen(v, 6)).sort((a, b) => a.datum < b.datum ? -1 : a.datum > b.datum ? 1 : b.incasso.bedrag - a.incasso.bedrag);
}
incassoMini = function () {
  const lijst = ibLijst();
  if (!lijst.length) return "";
  const v = vandaagISO(), totaal = lijst.reduce((s, x) => s + x.incasso.bedrag, 0);
  let kop;
  if (lijst.length === 1) {
    const dagen = dagVerschil(lijst[0].datum, v);
    kop = `${lijst[0].incasso.naam} wordt ${dagen <= 0 ? "vandaag" : dagen === 1 ? "morgen" : `over ${dagen} dagen`} afgeschreven`;
  } else kop = `${lijst.length} incasso's op komst — samen ${eur(totaal)}`;
  return `<div class="ib${V.ibOpen ? " open" : ""}" data-ib>
    <div class="ib-veld" aria-live="polite"></div>
    <button class="ib-knop" data-act="ib-wissel" aria-expanded="${V.ibOpen}">
      ${ico("kringloop", "width:19px;height:19px;color:var(--accent);flex:0 0 auto")}
      <span class="ib-titel">${esc(kop)}</span>
      <span class="ib-hint">${V.ibOpen ? "sluiten" : "tik"}</span>
    </button>
  </div>`;
};

/* ---------- Plaatsen: om de knop heen, afwisselend eronder en erboven ---------- */
function ibPlaatsen(el, n) {
  const W = el.clientWidth, { d, gap } = IB;
  const perRij = Math.max(3, Math.floor((W + gap) / (d + gap)));
  const onder = [], boven = [];
  for (let i = 0; i < n; i++) (i % 2 === 0 ? onder : boven).push(i);
  const rijen = l => Math.ceil(l.length / perRij);
  const rb = rijen(boven), ro = rijen(onder);
  const knopH = el.querySelector(".ib-knop").offsetHeight;
  const top = rb ? rb * (d + gap) + 4 : 0;
  const pos = [];
  const zaad = i => { const x = Math.sin((i + 1) * 12.9898) * 43758.5453; return x - Math.floor(x); };
  const leg = (lijst, kant) => lijst.forEach((idx, k) => {
    const rij = Math.floor(k / perRij), inRij = Math.min(perRij, lijst.length - rij * perRij), j = k % perRij;
    const vak = W / inRij, verschuif = rij % 2 ? vak * .18 : 0;
    let x = vak * (j + .5) - d / 2 + verschuif + (zaad(idx) - .5) * 12;
    x = Math.max(0, Math.min(W - d, x));
    const y = kant === "boven" ? top - (rij + 1) * (d + gap) + (zaad(idx + 7) - .5) * 8 + 2
      : top + knopH + gap + rij * (d + gap) + (zaad(idx + 3) - .5) * 8;
    pos[idx] = { x, y };
  });
  leg(onder, "onder"); leg(boven, "boven");
  return { pos, boven: top, onder: ro ? ro * (d + gap) + 6 : 0, knopMidden: { x: W / 2, y: top + knopH / 2 } };
}
const ibKortDag = iso => { const d = parseISO(iso); return ["zo", "ma", "di", "wo", "do", "vr", "za"][d.getDay()] + " " + d.getDate(); };
function ibBelHTML(x, i) {
  const i0 = x.incasso, dagen = dagVerschil(x.datum, vandaagISO());
  const bedrag = eur(i0.bedrag);
  return `<button class="ib-bel${dagen <= 2 ? " snel" : ""}" data-ib-bel="${i}" data-id="${i0.id}" aria-label="${esc(i0.naam)}, ${esc(bedrag)}, ${esc(datumLabel(x.datum))}">
    <span class="ib-binnen"><span class="ib-bedrag${ibKortBedrag(i0.bedrag).length > 5 ? " lang" : ""}">${esc(ibKortBedrag(i0.bedrag))}</span></span>
  </button>`;
}
function ibInfoHTML(x) {
  const i0 = x.incasso, v = vandaagISO(), dagen = dagVerschil(x.datum, v), f = FREQ[i0.freq] || FREQ.maand;
  const perJaar = i0.freq === "week" ? i0.bedrag * 52 : i0.bedrag * (12 / (f[1] || 1));
  const cat = (typeof VLCATS !== "undefined" && VLCATS.find(c => c[0] === i0.cat)) || null;
  return `<span class="ib-info">
    <span class="ib-naam">${esc(i0.naam)}</span>
    <span class="ib-groot">${eur(i0.bedrag)}</span>
    <span class="ib-regel">${ico("komend", "width:14px;height:14px")} ${esc(langDatumLabel(x.datum).replace(/ \d{4}$/, ""))} · ${dagen <= 0 ? "vandaag" : dagen === 1 ? "morgen" : "over " + dagen + " dagen"}</span>
    <span class="ib-regel">${ico("kringloop", "width:14px;height:14px")} ${esc(f[0])}${cat ? " · " + esc(cat[1]) : ""}</span>
    <span class="ib-regel">${ico("euro", "width:14px;height:14px")} ${eur(perJaar)} per jaar</span>
    ${i0.notitie ? `<span class="ib-regel klein">${esc(i0.notitie)}</span>` : ""}
    <span class="ib-acties"><span class="knop klein rand" data-act="fin-incasso-open" data-id="${i0.id}" role="button" tabindex="0">${ico("pen")} Bewerken</span>
      <span class="knop klein rand" data-ib-dicht role="button" tabindex="0">Sluiten</span></span>
  </span>`;
}
/** Belletjes tekenen; met pop = ze komen één voor één uit de knop. */
function ibTeken(el, pop) {
  const lijst = ibLijst(), veld = el.querySelector(".ib-veld");
  if (!lijst.length || !veld) return;
  const n = lijst.length + 1, p = ibPlaatsen(el, n), stil = rtStil();
  el.style.setProperty("--boven", p.boven + "px");
  el.style.setProperty("--onder", p.onder + "px");
  veld.innerHTML = lijst.map(ibBelHTML).join("") +
    `<button class="ib-bel alle" data-act="fin" data-m="incasso" aria-label="Alle incasso's"><span class="ib-binnen"><span class="ib-bedrag">Alle</span></span></button>`;
  [...veld.children].forEach((b, i) => {
    const { x, y } = p.pos[i];
    b.style.left = x + "px"; b.style.top = y + "px";
    b.style.setProperty("--fx", (p.knopMidden.x - x - IB.d / 2) + "px");
    b.style.setProperty("--fy", (p.knopMidden.y - y - IB.d / 2) + "px");
    b.style.setProperty("--zweef", (3.6 + (i * 37 % 23) / 10) + "s");
    b.style.setProperty("--fase", (-(i * 53 % 40) / 10) + "s");
    b.style.setProperty("--zx", ((i % 3) - 1) * 1.6 + "px");
    b.style.setProperty("--zy", -(2 + i % 3) + "px");
    if (pop && !stil) { b.classList.add("pop"); b.style.animationDelay = (i * 95) + "ms"; setTimeout(() => { b.classList.remove("pop"); b.style.animationDelay = ""; if (i % 3 === 0) tril(3); }, 520 + i * 95); }
  });
  if (V.ibActief) { const b = veld.querySelector(`[data-id="${CSS.escape(V.ibActief)}"]`); if (b) ibOpenBel(el, b, true); else V.ibActief = null; }
}
function ibOpenBel(el, b, direct) {
  const veld = el.querySelector(".ib-veld"), W = el.clientWidth;
  ibSluitBel(el, true);
  const lijst = ibLijst(), x = lijst[+b.dataset.ibBel]; if (!x) return;
  V.ibActief = x.incasso.id;
  const breed = Math.min(W, 300), oud = { l: parseFloat(b.style.left), t: parseFloat(b.style.top) };
  b.dataset.l = oud.l; b.dataset.t = oud.t;
  b.insertAdjacentHTML("beforeend", ibInfoHTML(x));
  const info = b.querySelector(".ib-info");
  info.style.width = breed + "px";
  const hoog = info.scrollHeight;
  const l = Math.max(0, Math.min(W - breed, oud.l + IB.d / 2 - breed / 2));
  const t = Math.max(0, oud.t + IB.d / 2 - 30);
  if (direct) b.classList.add("zonder-overgang");
  b.classList.add("open"); veld.classList.add("focus");
  b.style.left = l + "px"; b.style.top = t + "px"; b.style.width = breed + "px"; b.style.height = hoog + "px";
  b.setAttribute("aria-expanded", "true");
  if (direct) requestAnimationFrame(() => b.classList.remove("zonder-overgang"));
  else tril(6);
}
function ibSluitBel(el, stil) {
  const b = el.querySelector(".ib-bel.open"); if (!b) { V.ibActief = stil ? V.ibActief : null; return; }
  b.classList.remove("open"); el.querySelector(".ib-veld").classList.remove("focus");
  b.style.left = b.dataset.l + "px"; b.style.top = b.dataset.t + "px"; b.style.width = ""; b.style.height = "";
  b.setAttribute("aria-expanded", "false");
  const info = b.querySelector(".ib-info"); if (info) setTimeout(() => info.remove(), 260);
  if (!stil) V.ibActief = null;
}
async function ibWissel(el) {
  if (IB.bezig) return;
  const knop = el.querySelector(".ib-knop");
  if (!V.ibOpen) {
    V.ibOpen = true; el.classList.add("open"); knop.setAttribute("aria-expanded", "true");
    const hint = el.querySelector(".ib-hint"); if (hint) hint.textContent = "sluiten";
    ibTeken(el, true); tril(8);
    return;
  }
  IB.bezig = true;
  V.ibOpen = false; V.ibActief = null;
  ibSluitBel(el);
  const bellen = [...el.querySelectorAll(".ib-bel")];
  if (!rtStil()) {
    bellen.reverse().forEach((b, i) => { b.style.animationDelay = (i * 35) + "ms"; b.classList.add("terug"); });
    await new Promise(r => setTimeout(r, 360 + bellen.length * 35));
  }
  el.classList.remove("open"); knop.setAttribute("aria-expanded", "false");
  el.style.setProperty("--boven", "0px"); el.style.setProperty("--onder", "0px");
  const veld = el.querySelector(".ib-veld"); if (veld) veld.innerHTML = "";
  const hint = el.querySelector(".ib-hint"); if (hint) hint.textContent = "tik";
  IB.bezig = false;
}
document.addEventListener("click", e => {
  const el = e.target.closest && e.target.closest("[data-ib]");
  if (!el) return;
  if (e.target.closest('[data-act="ib-wissel"]')) { e.preventDefault(); ibWissel(el); return; }
  if (e.target.closest("[data-ib-dicht]")) { ibSluitBel(el); return; }
  if (e.target.closest('[data-act="fin-incasso-open"],[data-act="fin"]')) return;
  const b = e.target.closest(".ib-bel[data-ib-bel]");
  if (!b) return;
  if (b.classList.contains("open")) ibSluitBel(el); else ibOpenBel(el, b);
});
RT_NA.push(() => {
  const el = document.querySelector("[data-ib]");
  if (el && V.ibOpen) ibTeken(el, false);
});
window.addEventListener("resize", () => { const el = document.querySelector("[data-ib]"); if (el && V.ibOpen) ibTeken(el, false); });
