// Tests voor Alarmen plannen (sectie 108).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const html = readFileSync(fileURLToPath(new URL("../index.html", import.meta.url)), "utf8");
const i = html.indexOf("/* NATE-ALARM-BEGIN */"), j = html.indexOf("/* NATE-ALARM-EINDE */");
assert.ok(i > 0 && j > i);
const ctx = vm.createContext({});
vm.runInContext(html.slice(i, j) + ";globalThis.A = { alUitklappen, alPlan, alTeVersturen, alPayload, alOpruimen, alWeekdag, alPlus };", ctx);
const A = ctx.A, kaal = x => JSON.parse(JSON.stringify(x));

test("weekdag en datum rekenen lokaal", () => {
  assert.equal(A.alWeekdag("2026-10-12"), 0);   // maandag
  assert.equal(A.alWeekdag("2026-10-11"), 6);   // zondag
  assert.equal(A.alPlus("2026-10-31", 1), "2026-11-01");
  assert.equal(A.alPlus("2026-03-28", 1), "2026-03-29");   // over de zomertijd heen
});

test("eigen alarmen: vaste dagen herhalen, een datum één keer", () => {
  const eigen = [
    { id: "m", titel: "Medicijnen", tijd: "08:00", dagen: [0, 1, 2, 3, 4] },
    { id: "t", titel: "Tandarts bellen", tijd: "09:30", dagen: [], datum: "2026-10-14" },
    { id: "u", titel: "Uit", tijd: "07:00", dagen: [5, 6], aan: false }
  ];
  const l = A.alUitklappen(eigen, "2026-10-10", 7);   // za 10 t/m vr 16
  assert.deepEqual(kaal(l.filter(x => x.id === "m").map(x => x.datum)), ["2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16"]);
  assert.deepEqual(kaal(l.filter(x => x.id === "t").map(x => x.datum)), ["2026-10-14"]);
  assert.equal(l.filter(x => x.id === "u").length, 2);
  assert.ok(l.filter(x => x.id === "u").every(x => x.uit));
  assert.equal(l.find(x => x.id === "m").sleutel, "e:m:2026-10-12");
});

test("plan: volgorde, uitgezet, voorbij; versturen alleen nieuw of veranderd", () => {
  const items = [
    { sleutel: "b", datum: "2026-10-10", tijd: "14:00", titel: "B", soort: "eigen" },
    { sleutel: "a", datum: "2026-10-10", tijd: "09:00", titel: "A", soort: "eigen" },
    { sleutel: "c", datum: "2026-10-11", tijd: "08:00", titel: "C", soort: "vertrekken", wekker: true },
    { sleutel: "d", datum: "2026-10-10", tijd: "15:00", titel: "D", soort: "eigen", uit: true }
  ];
  const plan = A.alPlan(items, { b: false, c: false }, "2026-10-10 10:00");
  assert.deepEqual(kaal(plan.map(x => x.sleutel)), ["a", "b", "d", "c"]);
  assert.equal(plan[0].voorbij, true);
  assert.equal(plan.find(x => x.sleutel === "d").aan, false);
  const uitgezet = A.alPlan(items, { b: true }, "2026-10-10 10:00");
  assert.equal(uitgezet.find(x => x.sleutel === "b").aan, false);
  // b al doorgegeven op dezelfde tijd, c op een oude tijd: alleen c gaat.
  assert.deepEqual(kaal(A.alTeVersturen(plan, { b: "2026-10-10 14:00", c: "2026-10-11 07:30" }, false).map(x => x.sleutel)), ["c"]);
  assert.deepEqual(kaal(A.alTeVersturen(plan, { b: "2026-10-10 14:00", c: "2026-10-11 08:00" }, true).map(x => x.sleutel)), ["b", "c"]);
});

test("tekst voor de opdracht: zelfde formaat als V6; wekker alleen vandaag", () => {
  const p = A.alPayload([{ soort: "vertrekken", datum: "2026-10-10", tijd: "13:25", titel: "NU jas aan", wekker: true },
    { soort: "vertrekken", datum: "2026-10-11", tijd: "08:00", titel: "NU jas aan", wekker: true },
    { datum: "2026-10-10", tijd: "20:00", titel: "Eigen", wekker: false }], "2026-10-10", true);
  assert.equal(p.app, "BrainMateNate"); assert.equal(p.versie, 1);
  assert.deepEqual(kaal(p.alarmen.map(x => [x.moment, x.wekker, x.soort])), [["2026-10-10 13:25", "ja", "vertrekken"], ["2026-10-11 08:00", "nee", "vertrekken"], ["2026-10-10 20:00", "nee", "eigen"]]);
  assert.equal(A.alPayload([{ datum: "2026-10-10", tijd: "13:25", titel: "x", wekker: true }], "2026-10-10", false).alarmen[0].wekker, "nee");
});

test("opruimen: oude dagen weg", () => {
  assert.deepEqual(kaal(A.alOpruimen({ "e:x:2026-10-09": 1, "e:x:2026-10-10": 1, "a:y:vertrekken:2026-10-12": 1, rommel: 1 }, "2026-10-10")), { "e:x:2026-10-10": 1, "a:y:vertrekken:2026-10-12": 1, rommel: 1 });
});
