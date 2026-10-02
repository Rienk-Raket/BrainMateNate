// Tests voor "Ik loop vast" (sectie 90, tussen /* NATE-VAST-BEGIN */ en /* NATE-VAST-EINDE */).
// Gebruik: python3 ruimtelijk/bouw.py && node --test tests/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const html = readFileSync(fileURLToPath(new URL("../index.html", import.meta.url)), "utf8");
const b = html.indexOf("/* NATE-VAST-BEGIN */"), e = html.indexOf("/* NATE-VAST-EINDE */");
assert.ok(b > 0 && e > b, "kern van Ik loop vast niet gevonden");
const ctx = vm.createContext({});
vm.runInContext(html.slice(b, e) + ";globalThis.V = { IV_OORZAKEN, IV_LOSLATEN, IV_BEWIJS, ivOorzaak, ivMetStap, ivEersteStap, ivMeting };", ctx);
const V = ctx.V;
const kaal = x => JSON.parse(JSON.stringify(x));

test("vijf oorzaken, elk met één primaire handeling en een waarom", () => {
  assert.deepEqual(kaal(V.IV_OORZAKEN.map(o => o.id)), ["onduidelijk", "groot", "saai", "spannend", "leeg"]);
  for (const o of V.IV_OORZAKEN) {
    assert.ok(o.knop && o.actie && o.waarom, o.id);
    assert.ok(["stap", "timer", "anker"].includes(o.actie), o.id);
  }
});

test("Nate's zinnen: hooguit twee zinnen, één uitroepteken, geen 'moet' of schuld", () => {
  const teksten = V.IV_OORZAKEN.flatMap(o => [o.zin, o.waarom, o.label, o.sub, o.knop]).concat(V.IV_LOSLATEN.toast);
  for (const t of teksten) {
    assert.ok((t.match(/[.?!](\s|$)/g) || []).length <= 2, t);
    assert.ok((t.match(/!/g) || []).length <= 1, t);
    assert.doesNotMatch(t, /\bmoet(en)?\b|\bschuld\b|\bfaal|\blui\b/i, t);
  }
});

test("bewijsniveau staat erbij en is eerlijk praktisch", () => {
  assert.match(V.IV_BEWIJS, /^Praktisch/);
  assert.match(V.IV_BEWIJS, /experiment/);
});

test("eerste stap komt bovenaan, zonder dubbel en zonder lege tekst", () => {
  const oud = [{ tekst: "Mail lezen", af: false, eerste: true }, { tekst: "Antwoord", af: true }];
  const n = V.ivMetStap(oud, "  Laptop openen ");
  assert.equal(n[0].tekst, "Laptop openen");
  assert.equal(n[0].eerste, true);
  assert.equal(n[1].eerste, undefined);
  assert.equal(n.length, 3);
  assert.equal(V.ivMetStap(oud, "mail lezen").length, 2);
  assert.equal(V.ivMetStap(oud, "   ").length, 2);
  assert.equal(oud[0].eerste, true, "origineel blijft ongewijzigd");
});

test("eerste open stap voor de Nu-kaart", () => {
  assert.equal(V.ivEersteStap({ subtaken: [{ tekst: "a", af: true }, { tekst: "b", af: false }] }), "b");
  assert.equal(V.ivEersteStap({ subtaken: [] }), null);
  assert.equal(V.ivEersteStap(null), null);
});

test("meting: vast gevolgd door afronden binnen 24 uur", () => {
  const nu = Date.parse("2026-10-03T12:00:00Z");
  const log = [{ ts: "2026-10-02T09:00:00Z", taakId: "a" }, { ts: "2026-10-02T09:00:00Z", taakId: "b" }, { ts: "2026-10-01T09:00:00Z", taakId: "c" }];
  const taken = [{ id: "a", afOp: "2026-10-02T10:00:00Z" }, { id: "b" }, { id: "c", afOp: "2026-10-02T10:00:00Z" }];
  assert.deepEqual(kaal(V.ivMeting(log, taken, nu)), { gebruikt: 3, gevolgd: 1 });
});

test("onbekende oorzaak geeft niets", () => {
  assert.equal(V.ivOorzaak("onzin"), null);
});
