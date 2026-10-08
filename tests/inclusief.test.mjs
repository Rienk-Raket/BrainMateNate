// Tests voor V13 (voorspelbaarheid), V14 (lezen) en V15 (kennisaanvulling), secties 104–106.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const html = readFileSync(fileURLToPath(new URL("../index.html", import.meta.url)), "utf8");
const stuk = naam => { const i = html.indexOf(`/* NATE-${naam}-BEGIN */`), j = html.indexOf(`/* NATE-${naam}-EINDE */`); assert.ok(i > 0 && j > i, naam); return html.slice(i, j); };
const ctx = vm.createContext({});
vm.runInContext(stuk("VOORSPELBAAR") + stuk("LEZEN") + stuk("AANVULLING") +
  ";globalThis.K = { vbRegel, vbDag, vbFoto, vbVerschil, vbAantalVerschil, vbMensen, vbVrijBlok, vbRustNodig, vbHHMM, lzStem, kaDomeinen };", ctx);
const K = ctx.K, kaal = x => JSON.parse(JSON.stringify(x));
const it = (id, titel, tijd, extra) => Object.assign({ soort: "afspraak", id, titel, tijd, eind: "", duur: 0, personen: [] }, extra || {});

test("Morgen in het kort: volgorde, duur, plek en wat daarna", () => {
  const dag = K.vbDag([
    K.vbRegel(it("b", "Lunch", "12:30", { eind: "13:30", personen: ["Sam"] }), { plek: "Café" }),
    K.vbRegel(it("a", "Tandarts", "09:00", { eind: "09:45" }), { plek: "Stationsweg" }),
    K.vbRegel(it("c", "Was", "", { soort: "taak" }))
  ]);
  assert.deepEqual(kaal(dag.map(r => r.titel)), ["Tandarts", "Lunch", "Was"]);
  assert.equal(dag[0].duur, 45);
  assert.equal(dag[0].plek, "Stationsweg");
  assert.deepEqual(kaal(dag[0].daarna), { titel: "Lunch", tijd: "12:30" });
  assert.equal(dag[1].daarna, null);
  assert.equal(dag[2].daarna, undefined);   // zonder tijd: geen "daarna"
  assert.equal(K.vbMensen(dag), 1);
});

test("Wijzigingen: nieuw, anders en weg; zonder foto niets", () => {
  const voor = K.vbDag([K.vbRegel(it("a", "Tandarts", "09:00")), K.vbRegel(it("b", "Lunch", "12:30"))]);
  const foto = K.vbFoto(voor);
  assert.equal(K.vbAantalVerschil(K.vbVerschil(null, voor)), 0);
  assert.equal(K.vbAantalVerschil(K.vbVerschil(foto, voor)), 0);
  const na = K.vbDag([K.vbRegel(it("a", "Tandarts", "10:00")), K.vbRegel(it("c", "Bellen", "15:00"))]);
  const v = K.vbVerschil(foto, na);
  assert.deepEqual(kaal(v.nieuw.map(x => x.titel)), ["Bellen"]);
  assert.deepEqual(kaal(v.anders.map(x => [x.titel, x.was, x.tijd])), [["Tandarts", "09:00", "10:00"]]);
  assert.deepEqual(kaal(v.weg.map(x => x.titel)), ["Lunch"]);
  // Plek veranderd telt ook.
  const plek = K.vbDag([K.vbRegel(it("a", "Tandarts", "09:00"), { plek: "Elders" }), K.vbRegel(it("b", "Lunch", "12:30"))]);
  assert.equal(K.vbVerschil(foto, plek).anders.length, 1);
});

test("Rustblok: eerste vrije twintig minuten, of null als de dag vol is", () => {
  const dag = K.vbDag([K.vbRegel(it("a", "A", "10:00", { eind: "11:00" })), K.vbRegel(it("b", "B", "11:10", { eind: "12:00" })), K.vbRegel(it("c", "C", "12:30"))]);
  assert.equal(K.vbHHMM(K.vbVrijBlok(dag, 9 * 60 + 50, 20)), "12:00");   // 9:50–10:00 te kort, 11:00–11:10 te kort
  assert.equal(K.vbHHMM(K.vbVrijBlok(dag, 8 * 60, 20)), "08:00");
  assert.equal(K.vbHHMM(K.vbVrijBlok(dag, 12 * 60 + 15, 20)), "13:00");  // C zonder eind telt als 30 minuten
  assert.equal(K.vbVrijBlok(dag, 21 * 60 + 50, 20), null);
  assert.equal(K.vbRustNodig("veel", 0), true);
  assert.equal(K.vbRustNodig("gewoon", 3), true);
  assert.equal(K.vbRustNodig(null, 2), false);
});

test("Voorlezen: Nederlandse stem kiezen", () => {
  assert.equal(K.lzStem([{ lang: "en-US" }, { lang: "nl-BE" }, { lang: "nl-NL" }]).lang, "nl-NL");
  assert.equal(K.lzStem([{ lang: "en-US" }, { lang: "nl_BE" }]).lang, "nl_BE");
  assert.equal(K.lzStem([{ lang: "en-US" }]), null);
});

test("Nieuwe kennis: alleen als hij aanstaat, zonder dubbele domeinen", () => {
  const basis = [{ id: "a" }], extra = [{ id: "a" }, { id: "b" }];
  assert.deepEqual(kaal(K.kaDomeinen(basis, extra, false).map(d => d.id)), ["a"]);
  assert.deepEqual(kaal(K.kaDomeinen(basis, extra, true).map(d => d.id)), ["a", "b"]);
});

test("Aanvulling: vorm, bewijsniveaus en Nate's stem", () => {
  const a = JSON.parse(readFileSync(fileURLToPath(new URL("../kennis/aanvulling.json", import.meta.url)), "utf8"));
  assert.equal(a.meta.status, "concept");
  assert.equal(a.domeinen.length, 6);
  for (const d of a.domeinen) {
    assert.ok(d.waaromKort.includes("Concept"), d.id);
    for (const i of d.interventies) assert.ok(["direct", "indirect", "praktisch"].includes(i.bewijs), d.id);
    assert.ok(!d.interventies.some(i => i.bewijs === "direct"), "geen 'direct' zonder onderzoek bij deze groep: " + d.id);
    for (const zin of Object.values(d.nate)) {
      assert.ok((zin.match(/[.?!](\s|$)/g) || []).length <= 2, zin);
      assert.ok((zin.match(/!/g) || []).length <= 1, zin);
      assert.ok(!/\bmoet/i.test(zin), zin);
    }
  }
});
