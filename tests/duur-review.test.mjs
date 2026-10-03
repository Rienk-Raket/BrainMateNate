// Tests voor duurkalibratie (sectie 98) en weekreview (sectie 99).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const html = readFileSync(fileURLToPath(new URL("../index.html", import.meta.url)), "utf8");
const knip = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b); assert.ok(i > 0 && j > i, a); return html.slice(i, j); };
const ctx = vm.createContext({});
vm.runInContext(knip("/* NATE-DUUR-BEGIN */", "/* NATE-DUUR-EINDE */") + knip("/* NATE-REVIEW-BEGIN */", "/* NATE-REVIEW-EINDE */")
  + ";globalThis.D = { DK_KEUZES, dkLijkt, dkVoorstel, dkFactor, dkTeVragen, dkReisVoorstel, WR_SCHAKELS, WR_MATEN, wrWeek, wrFeiten, wrZinnen, wrMaat, wrExperimentStand, wrKaartNodig, wrDoelWeek, dkLokaal };", ctx);
const D = ctx.D, kaal = x => JSON.parse(JSON.stringify(x));
const zinnen = t => (t.match(/[.?!](\s|$)/g) || []).length;

test("vergelijkbare taken: gedeelde woorden, zonder stopwoorden", () => {
  assert.ok(D.dkLijkt("Badkamer schoonmaken", "badkamer schoonmaken boven") >= 0.5);
  assert.ok(D.dkLijkt("Mail aan Sam", "Mail Sam") >= 0.5);
  assert.ok(D.dkLijkt("Belastingaangifte", "Badkamer schoonmaken") < 0.5);
});

test("voorstel: mediaan van de echte duur, niet van de schatting", () => {
  const log = [{ taakId: "a", titel: "Badkamer schoonmaken", geschat: 20, werkelijk: 30 }, { taakId: "b", titel: "badkamer schoonmaken", geschat: 20, werkelijk: 40 }, { taakId: "c", titel: "Badkamer schoonmaken", geschat: 15, werkelijk: 35 }, { taakId: "d", titel: "Was", geschat: 10, werkelijk: 10 }];
  assert.deepEqual(kaal(D.dkVoorstel("Badkamer schoonmaken", log)), { min: 35, n: 3 });
  assert.deepEqual(kaal(D.dkVoorstel("Badkamer schoonmaken", log, "c")), { min: 35, n: 2 });
  assert.equal(D.dkVoorstel("Iets nieuws", log), null);
  assert.equal(D.dkFactor(log), 1.8);
});

test("vraag na afronden: alleen vandaag, met schatting, nog niet gevraagd; nieuwste eerst", () => {
  const v = "2026-10-03";
  const taken = [{ id: "a", af: true, duur: 20, afOp: v + "T09:00:00Z" }, { id: "b", af: true, duur: 15, afOp: v + "T11:00:00Z" }, { id: "c", af: true, afOp: v + "T12:00:00Z" },
    { id: "d", af: true, duur: 10, afOp: "2026-10-02T12:00:00Z" }, { id: "e", af: false, duur: 10 }];
  assert.equal(D.dkTeVragen(taken, [], v).id, "b");
  assert.equal(D.dkTeVragen(taken, [{ taakId: "b" }], v).id, "a");
  assert.equal(D.dkTeVragen(taken, [{ taakId: "a" }, { taakId: "b" }], v), null);
});

test("reistijd: eerst dezelfde plek, anders de verhouding", () => {
  const reis = [{ plek: "Stationsweg 12", gepland: 25, werkelijk: 31 }, { plek: "stationsweg 12", gepland: 25, werkelijk: 33 }, { plek: "Markt 1", gepland: 10, werkelijk: 15 }];
  assert.deepEqual(kaal(D.dkReisVoorstel("Stationsweg 12", 25, reis)), { min: 32, n: 2, bron: "plek" });
  assert.equal(D.dkReisVoorstel("Nieuwe plek", 20, reis).bron, "verhouding");
  assert.equal(D.dkReisVoorstel("Nieuwe plek", 20, reis.slice(0, 2)), null);
});

test("week begint op maandag", () => {
  assert.equal(D.wrWeek("2026-10-03"), "2026-09-28");   // zaterdag
  assert.equal(D.wrWeek("2026-09-28"), "2026-09-28");   // maandag
  assert.equal(D.wrWeek("2026-10-04"), "2026-09-28");   // zondag
});

const data = {
  gebeurtenissen: [{ soort: "taak", tekst: "Afgerond: a", datum: "2026-09-29" }, { soort: "taak", tekst: "Afgerond: b", datum: "2026-10-01" }, { soort: "taak", tekst: "Afgerond: c", datum: "2026-09-20" }, { soort: "notitie", tekst: "x", datum: "2026-09-30" }],
  afspraken: [{ datum: "2026-09-30", hsStatus: "geweest" }, { datum: "2026-10-01", hsStatus: "gemist" }, { datum: "2026-10-02", hsStatus: "geweest" }, { datum: "2026-10-02" }],
  ivLog: [{ ts: "2026-09-30T10:00:00Z", taakId: "t1" }], taken: [{ id: "t1", afOp: "2026-09-30T15:00:00Z" }],
  dkLog: [{ ts: "2026-09-29T10:00:00Z", geschat: 10, werkelijk: 20 }, { ts: "2026-09-30T10:00:00Z", geschat: 20, werkelijk: 30 }],
  reviews: [{ datum: "2026-09-27", belasting: 6 }, { datum: "2026-10-03", belasting: 4 }]
};

test("feiten van de week, neutraal geformuleerd", () => {
  const f = D.wrFeiten(data, "2026-09-28", "2026-10-04");
  assert.deepEqual(kaal(f), { taken: 2, gehaald: 2, gemist: 1, vast: 1, factor: 2, schattingen: 2 });
  const z = D.wrZinnen(f);
  assert.equal(z.length, 3);
  assert.equal(z[1], "2 van de 3 afspraken gehaald.");
  for (const t of z) { assert.ok(zinnen(t) <= 2); assert.doesNotMatch(t, /\bmoet|slecht|faal/i); }
});

test("maten en experimentstand", () => {
  assert.equal(D.wrMaat("optijd", data, "2026-09-28", "2026-10-04"), 67);
  assert.equal(D.wrMaat("vaststap", data, "2026-09-28", "2026-10-04"), 100);
  assert.equal(D.wrMaat("belasting", data, "2026-09-28", "2026-10-04"), 4);
  assert.equal(D.wrMaat("optijd", data, "2026-01-01", "2026-01-07"), null);
  const s = D.wrExperimentStand({ start: "2026-09-29", maat: "taken" }, data, "2026-10-03");
  assert.deepEqual(kaal({ dag: s.dag, klaar: s.klaar, eind: s.eind, tijdens: s.tijdens }), { dag: 5, klaar: false, eind: "2026-10-12", tijdens: 2 });
  assert.equal(D.wrExperimentStand({ start: "2026-09-10", maat: "taken" }, data, "2026-10-03").klaar, true);
});

test("kaart op Mijn dag: vrijdagmiddag en weekend, niet als al gedaan of weggeklikt", () => {
  assert.equal(D.wrKaartNodig(new Date(2026, 9, 2, 16), [], null), true);       // vrijdag 16:00
  assert.equal(D.wrKaartNodig(new Date(2026, 9, 2, 10), [], null), false);      // vrijdag 10:00
  assert.equal(D.wrKaartNodig(new Date(2026, 9, 3, 10), [], null), true);       // zaterdag
  assert.equal(D.wrKaartNodig(new Date(2026, 9, 1, 20), [], null), false);      // donderdag
  assert.equal(D.wrKaartNodig(new Date(2026, 9, 3, 10), [{ week: "2026-09-28" }], null), false);
  assert.equal(D.wrKaartNodig(new Date(2026, 9, 3, 10), [], "2026-09-28"), false);
});

test("maandag t/m donderdag: de vorige week, als die nog open staat", () => {
  assert.deepEqual(kaal(D.wrDoelWeek("2026-10-05", [])), { week: "2026-09-28", van: "2026-09-28", tot: "2026-10-04" });   // maandag
  assert.deepEqual(kaal(D.wrDoelWeek("2026-10-05", [{ week: "2026-09-28" }])), { week: "2026-10-05", van: "2026-10-05", tot: "2026-10-05" });
  assert.equal(D.wrDoelWeek("2026-10-09", []).week, "2026-10-05");   // vrijdag: deze week
});

test("belasting: de review van de startdag telt als 'ervoor', die van dag 14 als 'tijdens'", () => {
  const d = { reviews: [{ datum: "2026-09-20", belasting: 8 }, { datum: "2026-09-27", belasting: 7 }, { datum: "2026-10-11", belasting: 3 }] };
  const s = D.wrExperimentStand({ start: "2026-09-27", maat: "belasting" }, d, "2026-10-12");
  assert.equal(s.voor, 7.5); assert.equal(s.tijdens, 3); assert.equal(s.klaar, true);
});

test("aantallen: even lange periodes, dus geen schijnbare instorting op dag 2", () => {
  const gebeurtenissen = [];
  for (let i = 1; i <= 14; i++) gebeurtenissen.push({ soort: "taak", tekst: "Afgerond: x", datum: `2026-09-${String(14 + i).padStart(2, "0")}` });
  gebeurtenissen.push({ soort: "taak", tekst: "Afgerond: y", datum: "2026-09-29" });
  const s = D.wrExperimentStand({ start: "2026-09-29", maat: "taken" }, { gebeurtenissen }, "2026-09-30");
  assert.equal(s.dag, 2); assert.equal(s.voor, 2); assert.equal(s.tijdens, 1);
});

test("lokale datum van een UTC-tijdstempel", () => {
  const ts = new Date(2026, 9, 3, 0, 30).toISOString();   // 00:30 lokaal
  assert.equal(D.dkLokaal(ts), "2026-10-03");
});

test("teksten: hooguit twee zinnen, geen 'moet'", () => {
  for (const s of D.WR_SCHAKELS) { assert.ok(zinnen(s.tip) <= 2, s.tip); assert.doesNotMatch(s.tip, /\bmoet/); }
  assert.equal(D.WR_SCHAKELS.length, 9);
});
