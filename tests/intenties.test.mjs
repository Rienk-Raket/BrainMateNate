// Tests voor Nate's lokale intentieherkenning (sectie 89, tussen /* NATE-CHAT-BEGIN */ en /* NATE-CHAT-EINDE */).
// Minstens 30 voorbeeldzinnen, waaronder tikfouten.
// Gebruik: python3 ruimtelijk/bouw.py && node --test tests/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const lees = p => readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8");
const html = lees("../index.html");
const b = html.indexOf("/* NATE-CHAT-BEGIN */"), e = html.indexOf("/* NATE-CHAT-EINDE */");
assert.ok(b > 0 && e > b, "chatkern niet gevonden in index.html");
const ctx = vm.createContext({});
vm.runInContext(html.slice(b, e) + ";globalThis.C = { ncSchoon, ncSoort, ncBegrijp, ncAfstand };", ctx);
const C = ctx.C;
const K = JSON.parse(lees("../kennis/intenties.json"));
const ids = r => r.keuzes.map(x => x && x.id);

// [zin, uitkomst, eerste bestemming (of null)]
const ZEKER = [
  ["Waar staat mijn dagboek?", "dagboek"],
  ["open de mindmap", "mindmap"],
  ["ik wil naar mijn instellingen", "instellingen"],
  ["Hoe kom ik bij de afspraken", "afspraken"],
  ["huishouden", "huishouden"],
  ["laat mijn profiel zien", "profiel"],
  ["waar vind ik de keuzemachine", "keuze"],
  ["back-up maken", "backup"],
  ["planning van deze week", "planning"],
  ["ik wil de uitsteltest doen", "uitsteltest"],
  ["gewoontes bijhouden", "gewoontes"],
  ["hoeveel geld heb ik uitgegeven", "financieel"],
  ["wat staat er vandaag op mijn dagring", "mijndag"],
  ["mijn wishlist", "wishlist"],
  ["Voortgang van mijn doelen", "voortgang"],
  ["waar zijn mijn berichten", "berichten"],
  ["checklist boodschappen", "checklists"],
  ["focustimer starten", "focus"],
  ["logboek", "logboek"],
  ["kalender", "kalender"]
];
const TIKFOUTEN = [
  ["waar staat mijn dagboel", "dagboek"],
  ["opne de mindamp", "mindmap"],
  ["instelingen", "instellingen"],
  ["huishoudne", "huishouden"],
  ["afsrpaken", "afspraken"],
  ["keuzemachien", "keuze"],
  ["gewoonts", "gewoontes"],
  ["kallender", "kalender"],
  ["financiël", "financieel"],
  ["wihslist", "wishlist"]
];

test("regel 1: opschonen haalt hoofdletters, accenten en leestekens weg", () => {
  assert.equal(C.ncSchoon("Wáár staat m'n DAGBOEK??"), "waar staat m n dagboek");
  assert.equal(C.ncSchoon("  Financiële   zaken!  "), "financiele zaken");
});

test("regel 2: soort vraag", () => {
  assert.equal(C.ncSoort(C.ncSchoon("waar staat mijn dagboek"), K), "waar");
  assert.equal(C.ncSoort(C.ncSchoon("onthoud: bel oma"), K), "gedachte");
  assert.equal(C.ncSoort(C.ncSchoon("ik ben overprikkeld"), K), "hulp");
  assert.equal(C.ncSoort(C.ncSchoon("maak een checklist"), K), "doen");
  assert.equal(C.ncSoort(C.ncSchoon("waarom is dit zo"), K), "vraag");
});

for (const [zin, doel] of ZEKER) test(`regel 3–4: "${zin}" → ${doel}`, () => {
  const r = C.ncBegrijp(zin, K);
  assert.equal(r.uitkomst, "zeker", JSON.stringify({ uitkomst: r.uitkomst, keuzes: ids(r) }));
  assert.equal(r.keuzes[0].id, doel);
});

for (const [zin, doel] of TIKFOUTEN) test(`tikfout: "${zin}" → ${doel}`, () => {
  const r = C.ncBegrijp(zin, K);
  // Met een tikfout mag Nate zeker zijn of twee keuzes geven, maar de goede zit er altijd bij.
  assert.ok(["zeker", "twijfel"].includes(r.uitkomst), r.uitkomst);
  assert.ok(ids(r).includes(doel), JSON.stringify(ids(r)));
});

test("regel 5: bij twijfel twee keuzes, nooit stilletjes één", () => {
  for (const zin of ["rust", "lijst", "tijd"]) {
    const r = C.ncBegrijp(zin, K);
    if (r.uitkomst === "twijfel") assert.equal(r.keuzes.filter(Boolean).length, 2, zin);
  }
  const r = C.ncBegrijp("ik twijfel over kopen", K);   // keuze (twijfel) of wishlist (kopen)
  assert.equal(r.uitkomst, "twijfel");
  assert.equal(r.keuzes.length, 2);
  assert.deepEqual(JSON.parse(JSON.stringify(ids(r).sort())), ["keuze", "wishlist"]);
});

test("regel 6: niet begrepen → eerlijk en drie knoppen", () => {
  for (const zin of ["blablabla", "qwerty zxcv", "de kat van de buren", "?"]) {
    const r = C.ncBegrijp(zin, K);
    assert.equal(r.uitkomst, "onbekend", zin + " → " + r.uitkomst + " " + ids(r));
    assert.deepEqual(JSON.parse(JSON.stringify(ids(r))), ["mindmap", "zoeken", "vastleggen"]);
  }
});

test("hulp zonder bestemming: landen of één klein ding", () => {
  const r = C.ncBegrijp("ik heb geen zin", K);
  assert.equal(r.uitkomst, "twijfel");
  assert.deepEqual(JSON.parse(JSON.stringify(ids(r))), ["anker", "mijndag"]);
  assert.equal(C.ncBegrijp("ik ben overprikkeld", K).keuzes[0].id, "anker");
});

test("gedachte naar de mindmap, met de tekst eruit (bevestiging volgt in de chat)", () => {
  const a = C.ncBegrijp("onthoud: tandpasta kopen", K);
  assert.equal(a.uitkomst, "gedachte");
  assert.equal(a.tekst, "tandpasta kopen");
  const b = C.ncBegrijp("idee moestuin op het balkon", K);
  assert.equal(b.uitkomst, "gedachte");
  assert.equal(b.tekst, "moestuin op het balkon");
  // Alleen "mindmap" zonder tekst: gewoon naar de mindmap.
  assert.equal(C.ncBegrijp("mindmap", K).keuzes[0].id, "mindmap");
});

test("nood gaat voor alles: verwijzing naar 113 en huisarts", () => {
  for (const zin of ["ik wil niet meer leven", "ik doe mezelf pijn", "ik ben verslaafd aan gokken"]) assert.equal(C.ncBegrijp(zin, K).uitkomst, "nood", zin);
  assert.ok(K.nood.antwoord.includes("113") && K.nood.antwoord.includes("huisarts"));
});

test("Nate's teksten in intenties.json: hooguit twee zinnen, één uitroepteken, geen 'moet'", () => {
  for (const t of [K.nood.antwoord, K.nietBegrepen.antwoord]) {
    assert.ok((t.match(/[.?!](\s|$)/g) || []).length <= 2, t);
    assert.ok((t.match(/!/g) || []).length <= 1, t);
    assert.doesNotMatch(t, /\bmoet\b/i);
  }
});

test("er zijn minstens 30 voorbeeldzinnen", () => {
  assert.ok(ZEKER.length + TIKFOUTEN.length + 4 + 3 + 3 >= 30);
});
