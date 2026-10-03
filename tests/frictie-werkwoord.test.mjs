// Tests voor impulsfrictie (sectie 100) en de werkwoordcheck (sectie 101).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const html = readFileSync(fileURLToPath(new URL("../index.html", import.meta.url)), "utf8");
const knip = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b); assert.ok(i > 0 && j > i, a); return html.slice(i, j); };
const ctx = vm.createContext({});
vm.runInContext(knip("/* NATE-FRICTIE-BEGIN */", "/* NATE-FRICTIE-EINDE */") + knip("/* NATE-WERKWOORD-BEGIN */", "/* NATE-WERKWOORD-EINDE */")
  + ";globalThis.F = { PL_OPBRENGST, plAfkoelen, plPatronen, plUitglijders, wwVaag, wwSuggesties, wwVragen };", ctx);
const F = ctx.F, kaal = x => JSON.parse(JSON.stringify(x));
const zinnen = t => (t.match(/[.?!](\s|$)/g) || []).length;

test("afkoelen: alleen boven de drempel en binnen de tijd", () => {
  const nu = Date.parse("2026-10-03T12:00:00Z");
  assert.equal(F.plAfkoelen({ prijs: 80, gemaakt: "2026-10-03T02:00:00Z" }, 24, nu), 14);
  assert.equal(F.plAfkoelen({ prijs: 80, gemaakt: "2026-10-01T02:00:00Z" }, 24, nu), 0);
  assert.equal(F.plAfkoelen({ prijs: 20, gemaakt: "2026-10-03T11:00:00Z" }, 24, nu), 0);
  assert.equal(F.plAfkoelen({ prijs: 80 }, 24, nu), 0);
});

test("patronen pas na drie momenten; vaakste trigger en opbrengst eerst", () => {
  const log = [{ waar: "roken", trigger: ["Koffie", "Stress"], opbrengst: ["rust"] }, { waar: "roken", trigger: ["Koffie"], opbrengst: ["rust", "beloning"] }];
  assert.equal(F.plPatronen(log, "roken").triggers.length, 0);
  log.push({ waar: "roken", trigger: ["Stress", "Koffie"], opbrengst: ["spanning"], soort: "uitglijder" }, { waar: "gewoontes", trigger: ["Moe"] });
  const p = F.plPatronen(log, "roken");
  assert.equal(p.n, 3);
  assert.deepEqual(kaal(p.triggers[0]), { naam: "Koffie", aantal: 3 });
  assert.equal(p.opbrengst[0].naam, "rust");
  assert.equal(F.plUitglijders(log, "roken"), 1);
});

test("vervangingsgedrag: kort en zonder 'moet'", () => {
  for (const o of F.PL_OPBRENGST) { assert.ok(zinnen(o.anders) <= 2); assert.doesNotMatch(o.anders, /\bmoet/); }
});

test("vaag of concreet", () => {
  for (const t of ["Belasting", "tandarts", "Administratie regelen", "verjaardag Sam", "iets met de auto", "Toeslagen"]) assert.equal(F.wwVaag(t), true, t);
  for (const t of ["Kapper bellen", "Was ophangen", "Mail Sam", "Formulier invullen vrijdag", "Bel de huisarts", "Boodschappen doen"].slice(0, 5)) assert.equal(F.wwVaag(t), false, t);
  assert.equal(F.wwVaag("Boodschappen doen"), true);   // "doen" is vaag: wat is de eerste handeling?
  assert.equal(F.wwVaag(""), false);
});

test("suggesties passen bij de titel", () => {
  assert.ok(F.wwSuggesties("Belasting").includes("Inlogpagina openen"));
  assert.ok(F.wwSuggesties("tandarts").includes("Telefoonnummer opzoeken"));
  assert.equal(F.wwSuggesties("Iets anders vaags").length, 3);
});

test("één keer vragen: niet bij af, gevraagd of met een open stap", () => {
  assert.equal(F.wwVragen({ titel: "Belasting" }), true);
  assert.equal(F.wwVragen({ titel: "Belasting", wwGevraagd: true }), false);
  assert.equal(F.wwVragen({ titel: "Belasting", af: true }), false);
  assert.equal(F.wwVragen({ titel: "Belasting", subtaken: [{ tekst: "Inloggen", af: false }] }), false);
  assert.equal(F.wwVragen({ titel: "Kapper bellen" }), false);
});
