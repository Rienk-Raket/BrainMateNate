// Tests voor het vuurblok in de side hustle (sectie 107): de rekenregels, zonder browser.
// Gebruik: python3 ruimtelijk/bouw.py && node --test tests/vuur.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const html = readFileSync(fileURLToPath(new URL("../index.html", import.meta.url)), "utf8");
const i = html.indexOf("/* SH-VUUR-BEGIN */"), j = html.indexOf("/* SH-VUUR-EINDE */");
assert.ok(i > 0 && j > i, "vuurcode niet in index.html: draai eerst bouw.py");
const ctx = vm.createContext({});
vm.runInContext(html.slice(i, j) + ";globalThis.F = { VUUR_B, VUUR_H, VUUR_PALET, vuurBron, vuurTekst, vuurLeeg, vuurZetBron, vuurStap, vuurPixels };", ctx);
const F = ctx.F;

test("het palet heeft 37 stappen van donker naar wit", () => {
  assert.equal(F.VUUR_PALET.length, 37);
  assert.deepEqual(Array.from(F.VUUR_PALET[36]), [255, 255, 255]);
});

test("de bron groeit met de score en gaat nooit helemaal uit", () => {
  assert.equal(F.vuurBron(0), 8);
  assert.equal(F.vuurBron(100), 36);
  assert.equal(F.vuurBron(50), 22);
  assert.equal(F.vuurBron(NaN), 8);
  assert.equal(F.vuurBron(-20), 8);
  assert.equal(F.vuurBron(250), 36);
  for (let s = 1; s <= 100; s++) assert.ok(F.vuurBron(s) >= F.vuurBron(s - 1), "niet dalend bij " + s);
});

test("teksten in Nate's stem: geen 'moet', geen uitroepteken", () => {
  for (const s of [0, 20, 40, 60, 70, 100]) {
    const t = F.vuurTekst(s).join(" ");
    assert.ok(!/\bmoet|moeten\b/i.test(t) && !t.includes("!"), t);
  }
  assert.notEqual(F.vuurTekst(10)[0], F.vuurTekst(90)[0]);
});

test("zonder afkoeling reist de hitte helemaal naar boven", () => {
  const r = F.vuurLeeg();
  F.vuurZetBron(r, 36);
  for (let k = 0; k < F.VUUR_H; k++) F.vuurStap(r, () => 0);
  assert.equal(r[0], 36);
  assert.equal(r[F.VUUR_B * 5 + 7], 36);
});

test("met maximale afkoeling zakt de hitte per rij en waait het opzij", () => {
  const r = F.vuurLeeg();
  F.vuurZetBron(r, 36);
  F.vuurStap(r, () => 0.99);
  const rij = F.VUUR_H - 2;
  assert.equal(r[rij * F.VUUR_B + 10], 34);
  assert.equal(r[rij * F.VUUR_B + 0], 34, "linkerrand wordt gevuld");
  assert.equal(r[rij * F.VUUR_B + F.VUUR_B - 1], 34, "de rechterrand krijgt hitte van de linkerkant (om de rand heen)");
  assert.equal(r.every(v => v <= 36), true);
});

test("een koud raster blijft koud en heeft geen waarden buiten het palet", () => {
  const r = F.vuurLeeg();
  for (let k = 0; k < 10; k++) F.vuurStap(r, Math.random);
  assert.equal(r.every(v => v === 0), true);
  F.vuurZetBron(r, 36);
  for (let k = 0; k < 200; k++) F.vuurStap(r, Math.random);
  assert.equal(r.every(v => v >= 0 && v <= 36), true);
});

test("koude pixels zijn doorzichtig, de hete zijn wit en dekkend", () => {
  const r = F.vuurLeeg();
  r[0] = 0; r[1] = 36;
  const data = new Uint8ClampedArray(r.length * 4);
  F.vuurPixels(r, data);
  assert.equal(data[3], 0);
  assert.deepEqual(Array.from(data.slice(4, 8)), [255, 255, 255, 255]);
});
