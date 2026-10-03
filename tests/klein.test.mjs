// Tests voor de kleine verbeteringen (sectie 97, tussen /* NATE-KLEIN-BEGIN */ en /* NATE-KLEIN-EINDE */).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const html = readFileSync(fileURLToPath(new URL("../index.html", import.meta.url)), "utf8");
const i = html.indexOf("/* NATE-KLEIN-BEGIN */"), j = html.indexOf("/* NATE-KLEIN-EINDE */");
assert.ok(i > 0 && j > i);
const ctx = vm.createContext({});
vm.runInContext(html.slice(i, j) + ";globalThis.K = { kvHervat, KV_NAMEN, KV_MODULE_VIEW };", ctx);
const K = ctx.K, kaal = x => JSON.parse(JSON.stringify(x));

test("weer opgepakt: telt pauzes van minstens twee dagen", () => {
  const r = K.kvHervat(["2026-09-20", "2026-09-21", "2026-09-26", "2026-09-27", "2026-10-02"], "2026-10-02", 90);
  assert.deepEqual(kaal(r), { aantal: 2, laatste: { na: 4, dagenGeleden: 0 } });
});
test("weer opgepakt: één dag pauze telt niet, dubbele dagen en toekomst niet", () => {
  assert.deepEqual(kaal(K.kvHervat(["2026-10-01", "2026-09-29", "2026-09-29", "2026-10-09"], "2026-10-02")), { aantal: 0, laatste: null });
});
test("weer opgepakt: alleen binnen het venster meetellen", () => {
  const r = K.kvHervat(["2026-01-01", "2026-01-10", "2026-09-01"], "2026-10-02", 90);
  assert.equal(r.aantal, 1); assert.equal(r.laatste.na, 233);   // januari valt buiten de 90 dagen, september niet
});
test("naamgeving en modulekoppeling", () => {
  assert.equal(K.KV_NAMEN["Vandaag"], "Mijn dag");
  for (const v of Object.values(K.KV_MODULE_VIEW)) assert.ok(typeof v === "string" && v.length);
});
