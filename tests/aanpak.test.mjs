// Tests voor Mijn aanpak (sectie 93) en Ruimtes in clusters (sectie 94).
// Gebruik: python3 ruimtelijk/bouw.py && node --test tests/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const html = readFileSync(fileURLToPath(new URL("../index.html", import.meta.url)), "utf8");
const knip = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b); assert.ok(i > 0 && j > i, a); return html.slice(i, j); };
const ctx = vm.createContext({});
vm.runInContext(knip("/* NATE-AANPAK-BEGIN */", "/* NATE-AANPAK-EINDE */") + knip("/* NATE-RUIMTES-BEGIN */", "/* NATE-RUIMTES-EINDE */")
  + ";globalThis.A = { apRichting, apVoorgesteld, AP_AANPASSINGEN, AP_BEWIJS, RV_CLUSTERS, RV_VAST, rvVoorJou };", ctx);
const A = ctx.A, kaal = x => JSON.parse(JSON.stringify(x));

test("van patronen naar richting", () => {
  const r = t => kaal(A.apRichting(t));
  assert.deepEqual(r([]), { richting: "geen", energie: false });
  assert.equal(r(["P1"]).richting, "adhd");
  assert.equal(r([{ id: "P2" }]).richting, "adhd");
  assert.equal(r(["P3"]).richting, "autisme");
  assert.equal(r(["P1", "P3"]).richting, "audhd");
  assert.deepEqual(r(["P7"]), { richting: "energie", energie: true });
  assert.deepEqual(r(["P3", "P7"]), { richting: "autisme", energie: true });
  assert.equal(r(["P4", "P5", "P6"]).richting, "geen");
});

test("voorstellen per patroon, niets zonder patroon", () => {
  assert.deepEqual(kaal(A.apVoorgesteld([])), []);
  assert.ok(A.apVoorgesteld(["P3"]).includes("vast"));
  assert.ok(A.apVoorgesteld(["P5"]).includes("zacht"));
  for (const p of ["P1", "P2", "P3", "P4", "P5", "P7"]) assert.ok(A.apVoorgesteld([p]).length >= 1, p);
});

test("elke aanpassing: waarom, bewijsniveau, Nate-stem", () => {
  for (const a of A.AP_AANPASSINGEN) {
    assert.ok(A.AP_BEWIJS[a.bewijs], a.id);
    for (const t of [a.waarom, a.uitleg]) {
      assert.ok((t.match(/[.?!](\s|$)/g) || []).length <= 2, t);
      assert.doesNotMatch(t, /\bmoet(en)?\b/i);
    }
  }
});

const ALLE = ["persoonlijk", "werk", "gezondheid", "financieel", "huishouden", "sidehustles", "hobbyskills", "anker", "gewoontes", "dagboek", "lijstjes", "wishlist", "keuze", "personen", "roken", "tijd"];

test("vijf clusters dekken alle zestien ruimtes precies één keer", () => {
  assert.equal(A.RV_CLUSTERS.length, 5);
  const r = A.RV_CLUSTERS.flatMap(c => c.ruimtes);
  assert.equal(r.length, 16); assert.deepEqual(kaal(r.slice().sort()), ALLE.slice().sort());
});

test("voor jou, nu: drie, en vaste indeling verschuift niets", () => {
  assert.equal(A.rvVoorJou(ALLE, {}).length, 3);
  assert.deepEqual(kaal(A.rvVoorJou(ALLE, { vast: true, energie: 1, patronen: ["P2"] })), kaal(A.RV_VAST));
});

test("lage energie brengt rust naar voren; patroon en open dingen tellen mee", () => {
  assert.ok(A.rvVoorJou(ALLE, { energie: 1, dagdeel: "ochtend" }).includes("anker"));
  assert.equal(A.rvVoorJou(ALLE, { open: { huishouden: 3 }, dagdeel: "middag", patronen: ["P6"] })[0], "huishouden");
  assert.ok(A.rvVoorJou(ALLE, { patronen: ["P2"] }).includes("sidehustles"));
});

test("gelijke stand: vaste volgorde (voorspelbaar)", () => {
  assert.deepEqual(kaal(A.rvVoorJou(ALLE, {})), ALLE.slice(0, 3));
});
