"use strict";
/* ==========================================================================
   58. Eigen categorieën voor uitgaven en vaste lasten
   Kies je "Overig" bij een uitgave (blad of widget) of een vaste last, dan
   verschijnt een veld "Nieuwe categorie". Wat je daar typt, wordt een
   blijvende categorie (net vóór Overig) en wordt meteen gekozen.
   Houd een eigen categorie ingedrukt om hem te verwijderen; alles wat in die
   categorie stond, gaat naar Overig. Standaardcategorieën blijven staan.
   Opslag: instellingen "eigenCats_uitgave" en "eigenCats_vl" als [sleutel, naam, kleur].
   ========================================================================== */
const EC_KLEUREN = ["#d97706", "#0891b2", "#9333ea", "#16a34a", "#dc2626", "#4f46b8", "#ca8a04", "#0d9488", "#db2777", "#65a30d"];
const EC = {
  uitgave: { lijst: CATEGORIEEN, inst: "eigenCats_uitgave", winkel: "uitgaven", veld: "categorie", naam: "uitgaven" },
  vl: { lijst: VLCATS, inst: "eigenCats_vl", winkel: "incassos", veld: "cat", naam: "vaste lasten" }
};
const ecEigen = soort => (inst(EC[soort].inst, []) || []).filter(c => Array.isArray(c) && c[0]);
const ecIsEigen = (soort, k) => ecEigen(soort).some(c => c[0] === k);
/** Zet de eigen categorieën in de lijst, net vóór Overig (idempotent). */
function ecSync() {
  Object.keys(EC).forEach(soort => {
    const L = EC[soort].lijst;
    for (let i = L.length - 1; i >= 0; i--) if (String(L[i][0]).startsWith("eigen_")) L.splice(i, 1);
    const o = L.findIndex(c => c[0] === "overig");
    L.splice(o < 0 ? L.length : o, 0, ...ecEigen(soort).map(c => c.slice(0, 3)));
  });
}
function ecMaak(soort, naam) {
  naam = String(naam || "").replace(/\s+/g, " ").trim().slice(0, 28);
  if (!naam) return null;
  const L = EC[soort].lijst, bestaand = L.find(c => String(c[1]).toLowerCase() === naam.toLowerCase());
  if (bestaand) return bestaand[0];
  naam = naam[0].toUpperCase() + naam.slice(1);
  const eigen = ecEigen(soort);
  const slug = naam.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 20) || "cat";
  const k = "eigen_" + slug + "_" + Math.random().toString(36).slice(2, 6);
  const kleur = EC_KLEUREN[eigen.length % EC_KLEUREN.length];
  zetInst(EC[soort].inst, eigen.concat([[k, naam, kleur]]));
  ecSync();
  tril(8);
  return k;
}
async function ecVerwijder(soort, k) {
  const E = EC[soort], c = E.lijst.find(x => x[0] === k); if (!c) return 0;
  await zetInst(E.inst, ecEigen(soort).filter(x => x[0] !== k));
  ecSync();
  let n = 0;
  for (const r of S[E.winkel].filter(x => x[E.veld] === k)) { r[E.veld] = "overig"; await bewaar(E.winkel, r); n++; }
  if (soort === "uitgave" && inst("ugLaatsteCat", null) === k) await zetInst("ugLaatsteCat", "overig");
  return n;
}
{
  const _pas = pasInstellingenToe;
  pasInstellingenToe = function () { _pas(); ecSync(); };
}
ecSync();

/* ---------- "Overig" gekozen → veld voor een nieuwe categorie ---------- */
const EC_KNOP = { "data-cat": ["uitgave", "cat"], "data-vlcat": ["vl", "vlcat"], "data-ug-cat": ["uitgave", "ugCat"] };
function ecVeldBij(knop, attr) {
  const rij = knop.parentElement; if (!rij) return;
  let veld = rij.parentElement.querySelector(":scope > .ec-nieuw[data-voor='" + attr + "']");
  const aan = knop.dataset[EC_KNOP[attr][1]] === "overig";
  if (!aan) { if (veld) veld.remove(); return; }
  if (veld) return;
  veld = document.createElement("div");
  veld.className = "ec-nieuw"; veld.dataset.voor = attr;
  veld.innerHTML = `<input class="invoer" type="text" maxlength="28" enterkeyhint="done" autocomplete="off"
      placeholder="Nieuwe categorie, bv. Huisdier (of laat leeg)" aria-label="Nieuwe categorie">
    <span class="klein">Wordt een vaste categorie die je steeds kunt kiezen. Houd hem later ingedrukt om hem te verwijderen.</span>`;
  rij.insertAdjacentElement("afterend", veld);
  setTimeout(() => { const i = veld.querySelector("input"); if (i && !("ontouchstart" in window)) i.focus(); }, 60);
}
document.addEventListener("click", e => {
  if (ecLang.vuurde) return;
  const knop = e.target.closest && e.target.closest("[data-cat],[data-vlcat],[data-ug-cat]");
  if (!knop) return;
  const attr = Object.keys(EC_KNOP).find(a => knop.hasAttribute(a));
  // Na de eigen handler van de app (die het knopje selecteert), het veld tonen of weghalen.
  setTimeout(() => ecVeldBij(knop, attr), 0);
});
/** Vóór opslaan: getypte categorie aanmaken en als gekozen knopje in de rij zetten. */
function ecToepassen(bereik, attr) {
  const veld = bereik.querySelector(`.ec-nieuw[data-voor="${attr}"] input`);
  if (!veld || !veld.value.trim()) return null;
  const [soort, ds] = EC_KNOP[attr];
  const k = ecMaak(soort, veld.value); if (!k) return null;
  const c = EC[soort].lijst.find(x => x[0] === k);
  const rij = bereik.querySelector(`[${attr}]`).parentElement;
  let knop = rij.querySelector(`[${attr}="${k}"]`);
  if (!knop) {
    knop = document.createElement("button");
    knop.className = attr === "data-ug-cat" ? "ug-cat" : "keuze";
    knop.setAttribute(attr, k);
    if (attr === "data-ug-cat") knop.style.setProperty("--c", c[2]);
    knop.textContent = c[1];
    const o = rij.querySelector(`[${attr}="overig"]`); rij.insertBefore(knop, o);
  }
  rij.querySelectorAll(`[${attr}]`).forEach(x => x.setAttribute("aria-pressed", String(x === knop)));
  veld.value = "";
  toast(`Categorie “${c[1]}” toegevoegd`);
  return k;
}
document.addEventListener("click", e => {
  const ok = e.target.closest && e.target.closest("#u-ok,#i-ok");
  if (!ok) return;
  ecToepassen($("#bladinhoud"), ok.id === "u-ok" ? "data-cat" : "data-vlcat");
}, true);
{
  const _ugLog = ugLog;
  ugLog = function (w) { if (w) ecToepassen(w, "data-ug-cat"); return _ugLog(w); };
  const _ugMeer = ugMeer;
  ugMeer = function (w) {
    const v = w && w.querySelector(".ec-nieuw input"), getypt = v ? v.value.trim() : "";
    _ugMeer(w);
    if (getypt) setTimeout(() => { const o = $('#bladinhoud [data-cat="overig"]'); if (o) { o.click(); setTimeout(() => { const i = $('#bladinhoud .ec-nieuw input'); if (i) i.value = getypt; }, 20); } }, 30);
  };
}
document.addEventListener("keydown", e => {
  if (e.key !== "Enter" || !e.target.closest || !e.target.closest(".ec-nieuw")) return;
  e.preventDefault();
  const w = e.target.closest(".ug-widget");
  if (w) { const b = w.querySelector('[data-act="ug-log"]'); if (b) b.click(); return; }
  const ok = $("#u-ok") || $("#i-ok"); if (ok) ok.click();
});

/* ---------- Ingedrukt houden → verwijderen ---------- */
const ecLang = { t: null, x: 0, y: 0, vuurde: false };
function ecMenu(knop, attr) {
  const [soort, ds] = EC_KNOP[attr], k = knop.dataset[ds];
  const c = EC[soort].lijst.find(x => x[0] === k); if (!c) return;
  ecMenuDicht();
  const m = document.createElement("div");
  m.className = "ec-menu"; m.setAttribute("role", "dialog"); m.setAttribute("aria-label", "Categorie " + c[1]);
  if (!ecIsEigen(soort, k)) {
    m.innerHTML = `<b>${esc(c[1])}</b><span class="klein">Standaardcategorieën kun je niet verwijderen. Eigen categorieën wel.</span>
      <div class="knoprij"><button class="knop klein rand" data-ec="dicht">Oké</button></div>`;
  } else {
    const n = S[EC[soort].winkel].filter(r => r[EC[soort].veld] === k).length;
    m.innerHTML = `<b>Categorie “${esc(c[1])}” verwijderen?</b>
      <span class="klein">${n ? `${n} ${soort === "uitgave" ? (n === 1 ? "uitgave gaat" : "uitgaven gaan") : (n === 1 ? "vaste last gaat" : "vaste lasten gaan")} naar Overig.` : "Er staat nog niets in deze categorie."}</span>
      <div class="knoprij"><button class="knop klein rand" data-ec="dicht">Annuleren</button><button class="knop klein gevaar" data-ec="weg">${ico("prullenbak")} Verwijderen</button></div>`;
  }
  document.body.appendChild(m);
  const r = knop.getBoundingClientRect(), mw = Math.min(300, innerWidth - 24);
  m.style.width = mw + "px";
  m.style.left = Math.max(12, Math.min(innerWidth - mw - 12, r.left + r.width / 2 - mw / 2)) + "px";
  const onder = r.bottom + 8, hoogte = m.offsetHeight;
  m.style.top = (onder + hoogte > innerHeight - 20 ? Math.max(12, r.top - hoogte - 8) : onder) + "px";
  knop.classList.add("ec-gekozen");
  m.addEventListener("click", async e => {
    const b = e.target.closest("[data-ec]"); if (!b) return;
    if (b.dataset.ec === "weg") {
      const n = await ecVerwijder(soort, k);
      const rij = knop.parentElement, wasGekozen = knop.getAttribute("aria-pressed") === "true";
      document.querySelectorAll(`[${attr}="${k}"]`).forEach(x => x.remove());
      if (wasGekozen && rij) { const o = rij.querySelector(`[${attr}="overig"]`); if (o) o.click(); }
      ecMenuDicht();
      if (!$("#blad").classList.contains("open")) teken();
      toast(`“${c[1]}” verwijderd${n ? " · " + n + " naar Overig" : ""}`);
    } else ecMenuDicht();
  });
}
function ecMenuDicht() { const m = $(".ec-menu"); if (m) m.remove(); $$(".ec-gekozen").forEach(x => x.classList.remove("ec-gekozen")); }
document.addEventListener("pointerdown", e => {
  if (!e.target.closest) return;
  if (!e.target.closest(".ec-menu")) ecMenuDicht();
  const knop = e.target.closest("[data-cat],[data-vlcat],[data-ug-cat]"); if (!knop) return;
  const attr = Object.keys(EC_KNOP).find(a => knop.hasAttribute(a));
  ecLang.x = e.clientX; ecLang.y = e.clientY; ecLang.vuurde = false;
  clearTimeout(ecLang.t);
  ecLang.t = setTimeout(() => { ecLang.vuurde = true; tril(15); ecMenu(knop, attr); }, 550);
}, true);
["pointerup", "pointercancel", "pointerleave"].forEach(ev => document.addEventListener(ev, () => clearTimeout(ecLang.t), true));
document.addEventListener("pointermove", e => { if (Math.hypot(e.clientX - ecLang.x, e.clientY - ecLang.y) > 10) clearTimeout(ecLang.t); }, true);
document.addEventListener("click", e => {
  if (!ecLang.vuurde) return;
  // De klik die op het lang indrukken volgt, mag de categorie niet ook nog kiezen.
  if (e.target.closest && e.target.closest("[data-cat],[data-vlcat],[data-ug-cat]")) { e.preventDefault(); e.stopImmediatePropagation(); }
  ecLang.vuurde = false;
}, true);
document.addEventListener("contextmenu", e => { if (e.target.closest && e.target.closest("[data-cat],[data-vlcat],[data-ug-cat]")) e.preventDefault(); });
{
  const _sluit = bladSluit;
  bladSluit = function () { ecMenuDicht(); return _sluit.apply(this, arguments); };
}
