// Tests voor de gebeurtenisbus (sectie 103, V1 fase 2).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const html = readFileSync(fileURLToPath(new URL("../index.html", import.meta.url)), "utf8");
const i = html.indexOf("/* NATE-BUS-BEGIN */"), j = html.indexOf("/* NATE-BUS-EINDE */");
assert.ok(i > 0 && j > i);
const ctx = vm.createContext({ console: { error() {} } });
vm.runInContext(html.slice(i, j) + ";globalThis.B = { busMaak };", ctx);
const { busMaak } = ctx.B;

test("luisteraars op volgorde, async wordt afgewacht", async () => {
  const b = busMaak(), uit = [];
  b.on("x", async d => { await new Promise(r => setTimeout(r, 5)); uit.push("a" + d.n); });
  b.on("x", d => uit.push("b" + d.n));
  await b.emit("x", { n: 1 });
  assert.deepEqual(uit, ["a1", "b1"]);
});

test("een fout in één luisteraar breekt de rest niet", async () => {
  const b = busMaak(), uit = [];
  b.on("x", () => { throw new Error("stuk"); });
  b.on("x", () => uit.push("ok"));
  await b.emit("x", {}); b.emitSync("x", {});
  assert.deepEqual(uit, ["ok", "ok"]);
});

test("stoppen met luisteren, en tellen", () => {
  const b = busMaak(), uit = [];
  const stop = b.on("x", () => uit.push(1));
  assert.equal(b.aantal("x"), 1);
  b.emitSync("x"); stop(); b.emitSync("x");
  assert.equal(uit.length, 1); assert.equal(b.aantal("x"), 0);
});

test("laatste gebeurtenissen (hooguit 50) voor tests en uitleg", () => {
  const b = busMaak();
  for (let n = 0; n < 60; n++) b.emitSync("y", { n });
  const l = b.laatste();
  assert.equal(l.length, 50); assert.equal(l[49].data.n, 59);
});
