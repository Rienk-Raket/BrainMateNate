"use strict";
/* ==========================================================================
   107. Side Hustle — Vuur (voortgangsvisual)
   Het Doom-vuur (MIT, filipedeschamps/doom-fire-algorithm) als dashboardblok:
   hoe hoger je Gezondheidsscore (shGezondheid), hoe sterker de vuurbron brandt.
   - Draait lokaal op een klein canvas, geen netwerk, geen bibliotheek.
   - Pauzeert buiten beeld (IntersectionObserver) en als de app op de achtergrond staat.
   - "Minder beweging" of prefers-reduced-motion: één stilstaand beeld, geen animatie.
   - Eigen pauzeknop (44 × 44 px), de keuze wordt onthouden (instelling "vuur").
   - Nooit helemaal uit: bij een lage score blijft er een vonkje. Geen schuld.
   ========================================================================== */
/* SH-VUUR-BEGIN */
const VUUR_B = 56, VUUR_H = 32;
/* Het klassieke palet: 37 stappen van donker via rood en oranje naar wit. */
const VUUR_PALET = [[7, 7, 7], [31, 7, 7], [47, 15, 7], [71, 15, 7], [87, 23, 7], [103, 31, 7], [119, 31, 7], [143, 39, 7], [159, 47, 7], [175, 63, 7],
  [191, 71, 7], [199, 71, 7], [223, 79, 7], [223, 87, 7], [223, 87, 7], [215, 95, 7], [215, 95, 7], [215, 103, 15], [207, 111, 15], [207, 119, 15],
  [207, 127, 15], [207, 135, 23], [199, 135, 23], [199, 143, 23], [199, 151, 31], [191, 159, 31], [191, 159, 31], [191, 167, 39], [191, 167, 39],
  [191, 175, 47], [183, 175, 47], [183, 183, 47], [183, 183, 55], [207, 207, 111], [223, 223, 159], [239, 239, 199], [255, 255, 255]];

/** Sterkte van de vuurbron (8–36) bij een score van 0–100. Minimaal 8: er blijft altijd een zichtbaar vonkje. */
function vuurBron(score) {
  const s = Math.max(0, Math.min(100, Number(score) || 0));
  return Math.round(8 + s / 100 * 28);
}
/** Korte tekst bij het vuur, in Nate's stem: kort, met een knipoog, geen "moet". */
function vuurTekst(score) {
  if (score >= 70) return ["Het vuur brandt lekker", "Dit warmt op. Nate steekt zijn poten uit."];
  if (score >= 40) return ["Het vuurtje groeit", "Elke stap is hout op het vuur."];
  return ["Een vonkje is genoeg", "Klein beginnen mag. Nate blaast mee."];
}
/** Leeg raster: alles koud (0). */
const vuurLeeg = () => new Uint8Array(VUUR_B * VUUR_H);
/** Zet de onderste rij op de gekozen sterkte: dat is de bron van het vuur. */
function vuurZetBron(raster, sterkte) { raster.fill(sterkte, (VUUR_H - 1) * VUUR_B); }
/** Eén stap van het vuur. Elke pixel pakt de hitte van de pixel eronder, iets koeler (0–2)
    en iets opzij gewaaid (links over de rand komt rechts weer binnen). rnd geeft een getal van 0 tot 1 (los te vervangen voor tests). */
function vuurStap(raster, rnd) {
  for (let y = 0; y < VUUR_H - 1; y++) for (let x = 0; x < VUUR_B; x++) {
    const afkoeling = Math.floor(rnd() * 3);
    const onder = raster[(y + 1) * VUUR_B + x];
    const naarX = (x - afkoeling + VUUR_B) % VUUR_B; // om de rand heen, anders blijft de rechterkant leeg
    raster[y * VUUR_B + naarX] = Math.max(0, onder - afkoeling);
  }
}
/** Zet het raster om in pixels. Koude pixels zijn doorzichtig zodat de kaart erdoor blijft. */
function vuurPixels(raster, data) {
  for (let i = 0; i < raster.length; i++) {
    const v = raster[i], k = VUUR_PALET[v], p = i * 4;
    data[p] = k[0]; data[p + 1] = k[1]; data[p + 2] = k[2];
    data[p + 3] = v < 4 ? 0 : Math.min(255, (v - 3) * 14);
  }
}
/* SH-VUUR-EINDE */

const VUUR = { raster: null, canvas: null, beeld: null, io: null, raf: 0, laatste: 0, nu: 8, doel: 8, zichtbaar: false, pauze: false, rustig: false };

const vuurRustig = () => !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
/** Teken het raster op het canvas. */
function vuurTeken() {
  const c = VUUR.canvas; if (!c) return;
  if (!VUUR.beeld) VUUR.beeld = c.getContext("2d").createImageData(VUUR_B, VUUR_H);
  vuurPixels(VUUR.raster, VUUR.beeld.data);
  c.getContext("2d").putImageData(VUUR.beeld, 0, 0);
}
/** Eén stap van de animatie: de bron groeit of krimpt rustig naar het doel. */
function vuurTik() {
  if (VUUR.nu < VUUR.doel) VUUR.nu++; else if (VUUR.nu > VUUR.doel) VUUR.nu--;
  vuurZetBron(VUUR.raster, VUUR.nu);
  vuurStap(VUUR.raster, Math.random);
  vuurTeken();
}
/** Plan een nieuw beeld in, maar alleen als het vuur in beeld is, de app voorop staat en er niet gepauzeerd is. */
function vuurLoop(t) {
  VUUR.raf = 0;
  if (!VUUR.canvas || !VUUR.canvas.isConnected) { vuurOpruimen(); return; }
  if (!VUUR.zichtbaar || document.hidden || VUUR.pauze || VUUR.rustig) return;
  if (t - VUUR.laatste >= 40) { VUUR.laatste = t; vuurTik(); }
  VUUR.raf = requestAnimationFrame(vuurLoop);
}
function vuurStart() {
  if (VUUR.raf || !VUUR.canvas || !VUUR.zichtbaar || document.hidden || VUUR.pauze || VUUR.rustig) return;
  VUUR.raf = requestAnimationFrame(vuurLoop);
}
function vuurOpruimen() {
  cancelAnimationFrame(VUUR.raf); VUUR.raf = 0;
  if (VUUR.io) { VUUR.io.disconnect(); VUUR.io = null; }
  VUUR.canvas = null; VUUR.beeld = null;
}
/** Stilstaand beeld: even "voorverwarmen" zodat het vuur er meteen goed uitziet, daarna één keer tekenen. */
function vuurStilBeeld() {
  VUUR.nu = VUUR.doel;
  for (let i = 0; i < VUUR_H * 2; i++) { vuurZetBron(VUUR.raster, VUUR.nu); vuurStap(VUUR.raster, Math.random); }
  vuurTeken();
}
/** Tekst en knop bijwerken als je pauzeert of hervat. */
function vuurKnopBijwerken(knop) {
  if (!knop) return;
  knop.setAttribute("aria-pressed", String(VUUR.pauze));
  knop.setAttribute("aria-label", VUUR.pauze ? "Laat het vuur weer bewegen" : "Pauzeer het vuur");
  knop.textContent = VUUR.pauze ? "▶" : "⏸";
}

/* ---------- Dashboardblok ---------- */
function shBlokVuur(h) {
  const g = shGezondheid(h), [kop, sub] = vuurTekst(g.score);
  return `<div class="sh-vuur" data-vuur="${g.score}">
    <canvas width="${VUUR_B}" height="${VUUR_H}" role="img" aria-label="Vuur dat meegroeit met je gezondheidsscore: ${g.score} van 100. ${esc(kop)}."></canvas>
    <div class="sh-vuur-rij"><div><b>${esc(kop)}</b><span class="klein">${esc(sub)}</span></div>
      <button class="sh-vuur-knop" type="button" aria-pressed="false" aria-label="Pauzeer het vuur">⏸</button></div></div>`;
}
/* Het blok staat bij nieuwe side hustles direct onder de heldenkaart; bestaande dashboards krijgen het onderaan en kun je verplaatsen via "Dashboard aanpassen". */
SH_BLOKKEN.vuur = [shBlokVuur, null];
if (!SH_DASH_BLOKKEN.some(b => b[0] === "vuur")) SH_DASH_BLOKKEN.splice(1, 0, ["vuur", "Vuur (voortgang)"]);

/* Na elke keer tekenen: koppel het vuur aan het nieuwe canvas. */
SH_NA.push(() => {
  vuurOpruimen();
  const blok = document.querySelector(".sh-vuur"); if (!blok) return;
  const canvas = blok.querySelector("canvas"), knop = blok.querySelector(".sh-vuur-knop");
  if (!VUUR.raster) VUUR.raster = vuurLeeg();
  VUUR.canvas = canvas;
  VUUR.doel = vuurBron(+blok.dataset.vuur);
  VUUR.pauze = inst("vuur", "aan") === "uit";
  VUUR.rustig = vuurRustig();
  if (VUUR.rustig) { knop.hidden = true; vuurStilBeeld(); return; }
  vuurKnopBijwerken(knop);
  VUUR.nu = Math.min(VUUR.nu, VUUR.doel + 8);
  if (VUUR.pauze) vuurStilBeeld();
  knop.addEventListener("click", () => {
    VUUR.pauze = !VUUR.pauze; zetInst("vuur", VUUR.pauze ? "uit" : "aan"); vuurKnopBijwerken(knop);
    if (VUUR.pauze) { cancelAnimationFrame(VUUR.raf); VUUR.raf = 0; } else vuurStart();
  });
  /* Alleen bewegen als het blok echt in beeld is. Zonder IntersectionObserver: gewoon aan. */
  if ("IntersectionObserver" in window) {
    VUUR.io = new IntersectionObserver(items => {
      VUUR.zichtbaar = items.some(i => i.isIntersecting);
      if (VUUR.zichtbaar) vuurStart();
    }, { threshold: 0.01 });
    VUUR.io.observe(blok);
  } else { VUUR.zichtbaar = true; vuurStart(); }
});
/* App naar de achtergrond: loop stopt vanzelf. Terug: weer starten. */
document.addEventListener("visibilitychange", () => { if (!document.hidden) vuurStart(); });
