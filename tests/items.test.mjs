// Tests voor de gedeelde lijst van wat open staat (sectie 102, V1 fase 1).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const html = readFileSync(fileURLToPath(new URL("../index.html", import.meta.url)), "utf8");
const i = html.indexOf("/* NATE-ITEMS-BEGIN */"), j = html.indexOf("/* NATE-ITEMS-EINDE */");
assert.ok(i > 0 && j > i);
const ctx = vm.createContext({});
vm.runInContext(html.slice(i, j) + ";globalThis.I = { idxVanSh, idxVanHh, idxVoorVandaag, idxSamenvoegen };", ctx);
const I = ctx.I, kaal = x => JSON.parse(JSON.stringify(x));
const min = s => { const m = /^(\d{1,2}):(\d{2})/.exec(s || ""); return m ? +m[1] * 60 + +m[2] : null; };
const v = "2026-10-02";

test("SCRUM-kaarten: alleen open, met deadline, van een actieve hustle", () => {
  const h = [{ id: "h1", naam: "Webshop" }, { id: "h2", naam: "Oud", gearchiveerd: true }];
  const kol = [{ id: "k1", shId: "h1", rol: "todo" }, { id: "k2", shId: "h1", rol: "klaar" }];
  const kaarten = [
    { id: "a", shId: "h1", kolomId: "k1", titel: "Logo", deadline: "2026-10-02", minuten: 40 },
    { id: "b", shId: "h1", kolomId: "k2", titel: "Klaar", deadline: "2026-10-01" },
    { id: "c", shId: "h1", kolomId: "k1", titel: "Zonder deadline" },
    { id: "d", shId: "h1", kolomId: "k1", titel: "Gearchiveerd", deadline: "2026-10-01", gearchiveerd: true },
    { id: "e", shId: "h2", kolomId: "k1", titel: "Oude hustle", deadline: "2026-10-01" }
  ];
  const r = I.idxVanSh(h, kaarten, kol);
  assert.deepEqual(kaal(r.map(x => x.id)), ["sh:a"]);
  assert.deepEqual(kaal(r[0].extern), { soort: "shkaart", bronId: "a", ouder: "h1", label: "Webshop" });
  assert.equal(r[0].duur, 40);
});

test("huishouden: alleen lijsten die aan de beurt zijn, meest achterstallig eerst", () => {
  const lijsten = [
    { id: "bad", naam: "Badkamer", ritme: 7, laatstGedaan: "2026-09-20T10:00:00Z", taken: [{ min: 10 }, { min: 15 }, { min: 5, uit: true }] },
    { id: "keuken", naam: "Keuken", ritme: 7, laatstGedaan: "2026-09-30T10:00:00Z", taken: [{ min: 10 }] },
    { id: "nieuw", naam: "Zolder", ritme: 30, laatstGedaan: null, taken: [] },
    { id: "geen", naam: "Los", ritme: 0 }
  ];
  const r = I.idxVanHh(lijsten, v);
  assert.deepEqual(kaal(r.map(x => x.id)), ["hh:bad", "hh:nieuw"]);
  assert.equal(r[0].duur, 25);
  assert.equal(r[0].titel, "Badkamer schoonmaken");
  assert.match(r[0].extern.label, /12 dagen geleden/);
});

test("op Mijn dag: alleen aangezette bronnen, deadline vandaag of eerder", () => {
  const items = [{ id: "sh:a", datum: v, extern: { soort: "shkaart" } }, { id: "sh:b", datum: "2026-10-05", extern: { soort: "shkaart" } }, { id: "hh:x", datum: v, extern: { soort: "huishouden" } }, { id: "t", datum: v }];
  assert.deepEqual(kaal(I.idxVoorVandaag(items, v, ["shkaart", "huishouden"]).map(x => x.id)), ["sh:a", "hh:x"]);
  assert.deepEqual(kaal(I.idxVoorVandaag(items, v, ["huishouden"]).map(x => x.id)), ["hh:x"]);
  assert.equal(I.idxVoorVandaag(items, v, []).length, 0);
});

test("volgorde: tijd die komt, over de deadline, taken zonder tijd, deadline vandaag, voorbij", () => {
  const lijst = [{ id: "om11", tijd: "11:00" }, { id: "zonder" }, { id: "om8", tijd: "08:00" }];
  const extern = [{ id: "vandaag", datum: v }, { id: "laat", datum: "2026-09-30" }];
  const r = I.idxSamenvoegen(lijst, extern, v, 10 * 60 + 42, min);
  assert.deepEqual(kaal(r.map(x => x.id)), ["om11", "laat", "zonder", "vandaag", "om8"]);
});
