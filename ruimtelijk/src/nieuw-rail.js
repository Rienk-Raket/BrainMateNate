"use strict";
/* ==========================================================================
   61. Nieuw (Vastleggen) als uitschuifbare rail
   De knoppen staan standaard zo ver links uit beeld dat alleen de
   illustratie zichtbaar is. Veeg naar rechts: de namen schuiven erbij.
   Veeg naar links: weer ingeklapt. In beide standen werkt een tik gewoon.
   Ook: de Wishlist-tegel, direct na Financieel.
   ========================================================================== */
const NW_STROOK = 92;           // zichtbare breedte (px) van een ingeklapte knop
V.nwOpen = V.nwOpen || false;
let nwGepiept = false;

{
  const _s = vwStart;
  vwStart = function () {
    let h = _s();
    const wl = catKnop({ view: "wishlist", ill: "wishlist", naam: "Wishlist", uitleg: "Wat je wilt kopen, met koopcheck", kleur: "#db2777",
      telling: typeof wlAlle === "function" ? (wlAlle("actief").length || "") : "" });
    const i = h.indexOf('data-view="financieel"'), j = i < 0 ? -1 : h.indexOf("</button>", i);
    if (j >= 0) h = h.slice(0, j + 9) + wl + h.slice(j + 9);
    const merk = '<div class="startgrid">', a = h.indexOf(merk);
    if (a < 0) return h;
    const b = h.indexOf("</div>", a);
    const knoppen = h.slice(a + merk.length, b).split(/(?=<button class="knop3d)/).map(s => s.trim()).filter(s => s.startsWith("<button"));
    const open = V.nwOpen;
    // Laatst gemeten knophoogte meteen meegeven, dan springt er niets bij het tekenen (zie nwoHoogte).
    const kh = V.nwKnopH ? `;--nw-kh:${V.nwKnopH}px` : "";
    const rail = `<div class="nw-rail${open ? " open" : ""}${V.nwKnopH && V.nwKnopH < 84 ? " nw-laag" : ""}" style="--nw-p:${open ? 1 : 0}${kh}">
      ${knoppen.map((k, n) => `<div class="nw-slot" style="--i:${n}">${k.replace('class="knop3d"', 'class="knop3d breed"')}</div>`).join("")}
    </div>`;
    return h.slice(0, a) + rail + h.slice(b + 6);
  };
}

function nwZet(open, rail) {
  const was = V.nwOpen;
  V.nwOpen = !!open;
  rail = rail || $(".nw-rail");
  if (!rail) return;
  rail.classList.toggle("open", V.nwOpen);
  rail.style.setProperty("--nw-p", V.nwOpen ? 1 : 0);
  if (was !== V.nwOpen) tril(6);
}

/* ---------- Vegen: de rail volgt de vinger, loslaten klikt naar open of dicht ---------- */
{
  let g = null, klikStop = 0;
  const bereik = rail => { const s = rail.querySelector(".nw-slot"); return s ? Math.max(1, s.offsetWidth - NW_STROOK) : 1; };
  document.addEventListener("pointerdown", e => {
    const rail = e.target.closest && e.target.closest(".nw-rail");
    if (!rail || (e.pointerType === "mouse" && e.button !== 0)) return;
    const nu = performance.now();
    g = { rail, id: e.pointerId, x: e.clientX, y: e.clientY, p0: V.nwOpen ? 1 : 0, p: V.nwOpen ? 1 : 0, richting: null, lx: e.clientX, lt: nu, vx: 0 };
  }, { passive: true });
  document.addEventListener("pointermove", e => {
    if (!g || e.pointerId !== g.id) return;
    const dx = e.clientX - g.x, dy = e.clientY - g.y;
    if (!g.richting) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { g = null; return; }
      if (Math.abs(dx) < 10) return;
      g.richting = "x";
      g.rail.classList.add("sleept");
      try { g.rail.setPointerCapture(e.pointerId); } catch (x) { /* niet erg */ }
    }
    const nu = performance.now();
    g.vx = (e.clientX - g.lx) / Math.max(1, nu - g.lt); g.lx = e.clientX; g.lt = nu;
    let p = g.p0 + dx / bereik(g.rail);
    if (p < 0) p *= .25; else if (p > 1) p = 1 + (p - 1) * .25;   // elastisch voorbij de randen
    g.p = p;
    g.rail.style.setProperty("--nw-p", p.toFixed(4));
  }, { passive: true });
  const los = () => {
    if (!g) return;
    const r = g; g = null;
    if (r.richting !== "x") return;
    klikStop = Date.now();
    r.rail.classList.remove("sleept");
    nwZet(Math.abs(r.vx) > .35 ? r.vx > 0 : r.p > .5, r.rail);
  };
  document.addEventListener("pointerup", los);
  document.addEventListener("pointercancel", los);
  // Na een veeg geen klik laten doorgaan, anders navigeer je per ongeluk.
  document.addEventListener("click", e => {
    if (Date.now() - klikStop < 350 && e.target.closest && e.target.closest(".nw-rail")) { e.stopPropagation(); e.preventDefault(); }
  }, true);
}

/* Eén keer per sessie even laten zien dat de rail uitschuift. */
RT_NA.push(() => {
  if (V.view !== "start" || V.nwOpen || nwGepiept) return;
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) { nwGepiept = true; return; }
  nwGepiept = true;
  setTimeout(() => {
    const r = $(".nw-rail");
    if (!r || V.nwOpen || r.classList.contains("sleept")) return;
    r.classList.add("piep"); r.style.setProperty("--nw-p", .16);
    setTimeout(() => { if (!V.nwOpen && !r.classList.contains("sleept")) r.style.setProperty("--nw-p", 0); setTimeout(() => r.classList.remove("piep"), 700); }, 520);
  }, 650);
});
