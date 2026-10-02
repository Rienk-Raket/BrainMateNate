// Tests voor één invoer (sectie 92, tussen /* NATE-VI-BEGIN */ en /* NATE-VI-EINDE */), samen met de echte parser en intentieherkenning.
// Gebruik: python3 ruimtelijk/bouw.py && node --test tests/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const lees = p => readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8");
const html = lees("../index.html");
const knip = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b); assert.ok(i > 0 && j > i, a); return html.slice(i, j); };
const ctx = vm.createContext({});
vm.runInContext(knip("/* NATE-VI-BEGIN */", "/* NATE-VI-EINDE */") + knip("/* NATE-CHAT-BEGIN */", "/* NATE-CHAT-EINDE */")
  + ";globalThis.I = { viSoort, viReistijd, ncBegrijp };", ctx);
const I = ctx.I, K = JSON.parse(lees("../kennis/intenties.json"));
const kaal = x => JSON.parse(JSON.stringify(x));
// Een kleine nabootsing van parseNL: alleen wat viSoort leest (titel, datum, tijd).
const p = (titel, datum, tijd) => ({ titel, datum: datum || null, tijd: tijd || null, personen: [] });
const soort = (tekst, pp) => I.viSoort(tekst, pp, I.ncBegrijp(tekst, K));

test("reistijd uit de tekst", () => {
  assert.deepEqual(kaal(I.viReistijd("tandarts morgen 14:00 reistijd 25")), { tekst: "tandarts morgen 14:00", reistijd: 25 });
  assert.deepEqual(kaal(I.viReistijd("kapper 30 min reizen vrijdag")), { tekst: "kapper vrijdag", reistijd: 30 });
  assert.equal(I.viReistijd("boodschappen").reistijd, 0);
  assert.deepEqual(kaal(I.viReistijd("tandarts morgen 14:00 reistijd: 25")), { tekst: "tandarts morgen 14:00", reistijd: 25 });
  assert.equal(I.viReistijd("bruiloft reistijd 1,5 uur").reistijd, 90);
});

test("afspraakwoord met tijd: zeker een afspraak", () => {
  const s = soort("tandarts morgen 14:00", p("Tandarts", "2026-10-03", "14:00"));
  assert.equal(s.soort, "afspraak"); assert.equal(s.zeker, true);
});

test("afspraakwoord zonder tijd: twijfel, Kas kiest", () => {
  const s = soort("kapper bellen", p("Kapper bellen"));
  assert.equal(s.zeker, false);
  assert.deepEqual(kaal(s.keuzes), ["afspraak", "taak"]);
});

test("gewone taak met of zonder datum", () => {
  assert.equal(soort("formulier invullen vrijdag", p("Formulier invullen", "2026-10-09")).soort, "taak");
  // "was" lijkt op Huishouden, maar twee woorden met een werkwoord is gewoon een taak.
  const was = soort("was ophangen", p("Was ophangen"));
  assert.equal(was.soort, "taak"); assert.equal(was.zeker, true);
  assert.equal(soort("mijn wishlist", p("mijn wishlist")).keuzes[0], "zoek");
});

test("gedachtewoord gaat naar de mindmap", () => {
  const s = soort("idee moestuin op het balkon", p("idee moestuin op het balkon"));
  assert.equal(s.soort, "gedachte"); assert.equal(s.zeker, true);
});

test("vraag naar een plek in de app", () => {
  assert.equal(soort("waar staat mijn dagboek?", p("waar staat mijn dagboek?")).soort, "zoek");
  const kort = soort("huishouden", p("huishouden"));
  assert.equal(kort.zeker, false); assert.deepEqual(kaal(kort.keuzes), ["zoek", "taak"]);
});

test("nood gaat voor alles", () => {
  assert.equal(soort("ik wil niet meer leven", p("ik wil niet meer leven")).soort, "nood");
});

test("niets herkend: nooit stilletjes gokken", () => {
  const s = soort("???", p(""));
  assert.equal(s.zeker, false);
});
