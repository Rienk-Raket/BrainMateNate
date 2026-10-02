// Tests voor terugplannen en de Opdrachten-brug (sectie 91, tussen /* NATE-TP-BEGIN */ en /* NATE-TP-EINDE */).
// Gebruik: python3 ruimtelijk/bouw.py && node --test tests/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const html = readFileSync(fileURLToPath(new URL("../index.html", import.meta.url)), "utf8");
const b = html.indexOf("/* NATE-TP-BEGIN */"), e = html.indexOf("/* NATE-TP-EINDE */");
assert.ok(b > 0 && e > b, "kern van terugplannen niet gevonden");
const ctx = vm.createContext({});
vm.runInContext(html.slice(b, e) + ";globalThis.P = { TP_STD, TP_SOORTEN, tpMomenten, tpPayload, tpUrl, tpIcsAlarmen };", ctx);
const P = ctx.P;
const kaal = x => JSON.parse(JSON.stringify(x));
const tand = { titel: "Tandarts", datum: "2026-10-02", tijd: "14:00", reistijd: 25, buffer: 10, plek: "Stationsweg 12" };

test("met reistijd: stoppen, voorbereiden, vertrekken (terug vanaf het begin)", () => {
  // vertrek = 14:00 − 25 − 10 = 13:25; voorbereiden 10 min eerder; stoppen 5 min daarvoor.
  assert.deepEqual(kaal(P.tpMomenten(tand).map(m => [m.soort, m.tijd])), [["stoppen", "13:10"], ["voorbereiden", "13:15"], ["vertrekken", "13:25"]]);
});

test("zonder reistijd (bellen): stoppen en voorbereiden vóór het begin", () => {
  assert.deepEqual(kaal(P.tpMomenten({ tijd: "10:00" }).map(m => [m.soort, m.tijd])), [["stoppen", "09:45"], ["voorbereiden", "09:50"]]);
});

test("eigen voorbereidingstijd, buffer 0 en voorbereiden 0", () => {
  assert.equal(P.tpMomenten(Object.assign({}, tand, { voorbereiden: 20 }))[0].tijd, "13:00");
  assert.equal(P.tpMomenten(Object.assign({}, tand, { buffer: 0 })).at(-1).tijd, "13:35");
  assert.deepEqual(kaal(P.tpMomenten(Object.assign({}, tand, { voorbereiden: 0 })).map(m => m.soort)), ["stoppen", "vertrekken"]);
});

test("geen tijd geen momenten; niets vóór middernacht", () => {
  assert.equal(P.tpMomenten({ titel: "x" }).length, 0);
  assert.deepEqual(kaal(P.tpMomenten({ tijd: "00:35", reistijd: 15 }).map(m => m.soort)), ["voorbereiden", "vertrekken"]);
});

test("payload voor Opdrachten: datum en tijd, titel in actievorm, wekker alleen bij vertrekken", () => {
  const p = P.tpPayload(tand, P.tpMomenten(tand));
  assert.equal(p.versie, 1);
  assert.equal(p.alarmen.length, 3);
  assert.equal(p.alarmen[2].moment, "2026-10-02 13:25");
  assert.match(p.alarmen[2].titel, /^NU jas aan/);
  assert.deepEqual(kaal(p.alarmen.map(x => x.wekker)), ["nee", "nee", "ja"]);
  // Klok kent geen datum: alleen een wekker als de afspraak vandaag is.
  assert.equal(P.tpPayload(tand, P.tpMomenten(tand), { vandaag: "2026-10-02" }).alarmen[2].wekker, "ja");
  assert.equal(P.tpPayload(tand, P.tpMomenten(tand), { vandaag: "2026-10-01" }).alarmen[2].wekker, "nee");
  assert.equal(P.tpPayload(tand, P.tpMomenten(tand), { wekker: false }).alarmen[2].wekker, "nee");
  assert.ok(p.alarmen[0].notitie.includes("begint 14:00"));
});

test("lokale link naar Opdrachten, geen netwerkadres", () => {
  const u = P.tpUrl("Nate alarmen", { a: "b & c" });
  assert.ok(u.startsWith("shortcuts://run-shortcut?name=Nate%20alarmen&input=text&text="));
  assert.equal(JSON.parse(decodeURIComponent(u.split("&text=")[1])).a, "b & c");
  assert.doesNotMatch(u, /https?:/);
});

test(".ics-reserve: één alarm per moment, relatief aan het begin", () => {
  const L = P.tpIcsAlarmen(tand, P.tpMomenten(tand));
  assert.deepEqual(kaal(L.filter(x => x.startsWith("TRIGGER"))), ["TRIGGER:-PT50M", "TRIGGER:-PT45M", "TRIGGER:-PT35M"]);
  assert.equal(L.filter(x => x === "BEGIN:VALARM").length, 3);
});

test("teksten in actievorm, zonder 'moet'", () => {
  for (const s of Object.values(P.TP_SOORTEN)) { const t = s.zin("X"); assert.match(t, /^NU /); assert.doesNotMatch(t, /\bmoet/); }
});
