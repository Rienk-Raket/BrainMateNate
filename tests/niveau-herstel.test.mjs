// Tests voor dagniveau (sectie 95) en herstel na een gemiste afspraak (sectie 96).
// Gebruik: python3 ruimtelijk/bouw.py && node --test tests/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const html = readFileSync(fileURLToPath(new URL("../index.html", import.meta.url)), "utf8");
const knip = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b); assert.ok(i > 0 && j > i, a); return html.slice(i, j); };
const ctx = vm.createContext({});
vm.runInContext(knip("/* NATE-NIVEAU-BEGIN */", "/* NATE-NIVEAU-EINDE */") + knip("/* NATE-HERSTEL-BEGIN */", "/* NATE-HERSTEL-EINDE */")
  + ";globalThis.N = { DN_NIVEAUS, dnVoorstel, dnKlein, dnNu, HS_ZIN, HS_SCHAKELS, hsTeVragen, hsBericht };", ctx);
const N = ctx.N, kaal = x => JSON.parse(JSON.stringify(x));
const zinnen = t => (t.match(/[.?!](\s|$)/g) || []).length;

test("voorstel uit energie: laag → minimum, vol → extra, geen check-in → geen voorstel", () => {
  assert.deepEqual(kaal([1, 2, 3, 4, 5, null].map(N.dnVoorstel)), ["minimum", "minimum", "standaard", "standaard", "extra", null]);
});

test("minimum: één klein ding, de rest geparkeerd (niet weg)", () => {
  const lijst = [{ id: "a", duur: 45 }, { id: "b", duur: 10 }, { id: "c" }, { id: "d", duur: 10 }];
  const r = N.dnNu({ een: lijst[0], twee: lijst.slice(1, 3), rest: 1 }, lijst, "minimum");
  assert.equal(r.een.id, "b");
  assert.equal(r.twee.length, 0);
  assert.equal(r.geparkeerd, 3);
});

test("extra: meer zicht op daarna; standaard ongewijzigd", () => {
  const lijst = "abcdefg".split("").map(id => ({ id }));
  const nu = { een: lijst[0], twee: lijst.slice(1, 3), rest: 4 };
  const x = N.dnNu(nu, lijst, "extra");
  assert.equal(x.twee.length, 4); assert.equal(x.rest, 2);
  const s = N.dnNu(nu, lijst, "standaard");
  assert.equal(s.twee.length, 2); assert.equal(s.rest, 4); assert.equal(s.geparkeerd, 0);
});

test("lege lijst: geen fout", () => {
  assert.equal(N.dnNu({ een: null, twee: [], rest: 0 }, [], "minimum").een, null);
  assert.equal(N.dnKlein([]), null);
});

test("welke afspraken vragen om terugkijken", () => {
  const nu = new Date(2026, 9, 2, 15, 0), v = "2026-10-02", g = "2026-10-01";
  const lijst = [
    { id: "voorbij", datum: v, tijd: "13:00", eindTijd: "14:00" },
    { id: "bezig", datum: v, tijd: "14:30", eindTijd: "15:30" },
    { id: "zonderEind", datum: v, tijd: "13:30" },          // eind = 14:30
    { id: "zonderEindBezig", datum: v, tijd: "14:15" },     // eind = 15:15
    { id: "gisteren", datum: g, tijd: "20:00" },
    { id: "metUitkomst", datum: v, tijd: "09:00", uitkomst: "Goed gesprek" },
    { id: "alGevraagd", datum: v, tijd: "09:00", hsStatus: "geweest" },
    { id: "eerder", datum: "2026-09-29", tijd: "10:00" },
    { id: "zonderTijd", datum: v }
  ];
  assert.deepEqual(kaal(N.hsTeVragen(lijst, nu, v, g).map(a => a.id)), ["gisteren", "voorbij", "zonderEind"]);
});

test("bericht: erkennen, verantwoordelijkheid, nieuwe afspraak; met naam als die er is", () => {
  const b = N.hsBericht({ tijd: "14:00", personen: ["Sam"] }, "vrijdag 2 oktober");
  assert.ok(b.startsWith("Hoi Sam,"));
  assert.match(b, /spijt me/); assert.match(b, /lag aan mij/); assert.match(b, /nieuwe afspraak/);
  assert.ok(N.hsBericht({ tijd: "9:00" }, "x").startsWith("Hoi,"));
});

test("Nate's teksten: hooguit twee zinnen, geen 'moet', geen schuld", () => {
  for (const t of [N.HS_ZIN, ...N.HS_SCHAKELS.map(s => s.tip), ...N.DN_NIVEAUS.map(n => n.uitleg)]) {
    assert.ok(zinnen(t) <= 2, t);
    assert.doesNotMatch(t, /\bmoet(en)?\b|\bschuld\b|\bfout\b|\bslordig/i, t);
  }
});
