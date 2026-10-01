// Tests voor Nate's tipkiezer (sectie 86, tussen /* NATE-TIPS-BEGIN */ en /* NATE-TIPS-EINDE */).
// Gebruik: python3 ruimtelijk/bouw.py && node --test tests/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const lees = p => readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8");
const html = lees("../index.html");
const knip = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b); assert.ok(i > 0 && j > i, a + " niet gevonden"); return html.slice(i, j); };
const ctx = vm.createContext({});
vm.runInContext(knip("/* NATE-SCORE-BEGIN */", "/* NATE-SCORE-EINDE */") + knip("/* NATE-TIPS-BEGIN */", "/* NATE-TIPS-EINDE */")
  + ";globalThis.T = { ntDagdeel, ntKandidaten, ntKies, ntWaarom, ntSterksteAntwoord, nsProfiel, nsRoute, nsVolgende };", ctx);
const T = ctx.T;
const bank = JSON.parse(lees("../kennis/vragenbank.json"));
const cfg = JSON.parse(lees("../kennis/scoreweging.json"));
const adhd = JSON.parse(lees("../kennis/adhd-theorie.json"));
const BEWIJS = { direct: "direct bij ADHD onderzocht", indirect: "onderzocht, maar niet specifiek bij ADHD", praktisch: "nog een experiment" };

// Profiel waarin één subthema hoog scoort en de rest laag.
function profielMet(hoog) {
  const a = {};
  for (const q of bank.questions) if (q.assessment_part === "A" && q.question_id.endsWith(".Q1")) a[q.question_id] = "never";
  a[hoog + ".Q1"] = "very_often"; a[hoog + ".Q2"] = "very_often"; a[hoog + ".Q3"] = "often";
  return { antwoorden: a, profiel: T.nsProfiel(bank, a, {}, {}, cfg, {}) };
}

test("dagdeel: ochtend, middag, avond", () => {
  assert.deepEqual([0, 11, 12, 17, 18, 23].map(T.ntDagdeel), ["ochtend", "ochtend", "middag", "middag", "avond", "avond"]);
});

test("kandidaten volgen de behoefte en de koppeling subthema → domein", () => {
  const { antwoorden, profiel } = profielMet("A4.1");
  const k = T.ntKandidaten(profiel, antwoorden, adhd.domeinen, [], cfg);
  assert.equal(k[0].domein.id, "afspraken");
  assert.equal(k[0].dim, "A4.1");
  // Elk domein hooguit één keer.
  assert.equal(new Set(k.map(x => x.domein.id)).size, k.length);
});

test("zonder verdieping telt de kernvraag, maar pas vanaf soms", () => {
  const a = {}; for (const q of bank.questions) if (q.question_id.endsWith(".Q1") && q.assessment_part === "A") a[q.question_id] = "rarely";
  a["A4.2.Q1"] = "sometimes";
  const p = T.nsProfiel(bank, a, {}, {}, cfg, {});
  const k = T.ntKandidaten(p, a, adhd.domeinen, [], cfg);
  assert.deepEqual(JSON.parse(JSON.stringify(k.map(x => x.domein.id))), ["huishouden"]);
});

test("'Niet meer tonen' op een domein wordt gerespecteerd", () => {
  const { antwoorden, profiel } = profielMet("A4.1");
  const k = T.ntKandidaten(profiel, antwoorden, adhd.domeinen, ["dom-afspraken"], cfg);
  assert.ok(!k.some(x => x.domein.id === "afspraken"));
  // Alles verborgen: geen tip, ook geen algemene.
  const alles = adhd.domeinen.map(d => "dom-" + d.id);
  assert.equal(T.ntKies([], adhd.domeinen, alles, 5, "ochtend"), null);
});

test("hooguit één keuze per dagdeel, en die gaat rond", () => {
  const { antwoorden, profiel } = profielMet("A1.1");
  // A1.1 hoort bij twee domeinen (plannen en gewoontes-afleren): de twee wisselen per dagdeel.
  const k = T.ntKandidaten(profiel, antwoorden, adhd.domeinen, [], cfg);
  assert.equal(k.length, 2);
  const o = T.ntKies(k, adhd.domeinen, [], 10, "ochtend"), m = T.ntKies(k, adhd.domeinen, [], 10, "middag"), a = T.ntKies(k, adhd.domeinen, [], 10, "avond");
  assert.notEqual(o.domein.id, m.domein.id);
  assert.equal(o.domein.id, a.domein.id);
  assert.equal(o.algemeen, false);
});

test("zonder profiel: algemene tip op toerbeurt, met eerlijke omdat-zin", () => {
  const k = T.ntKies([], adhd.domeinen, [], 3, "middag");
  assert.equal(k.algemeen, true);
  assert.equal(k.domein.id, adhd.domeinen[(3 * 3 + 1) % adhd.domeinen.length].id);
  const w = T.ntWaarom(k, bank, {}, BEWIJS, cfg);
  assert.ok(w.startsWith("Omdat we nog niet hebben kennisgemaakt"));
});

test("omdat-zin verwijst naar het antwoord en noemt het bewijsniveau", () => {
  const { antwoorden, profiel } = profielMet("A2.3");
  const k = T.ntKies(T.ntKandidaten(profiel, antwoorden, adhd.domeinen, [], cfg), adhd.domeinen, [], 0, "ochtend");
  assert.equal(k.domein.id, "emoties");
  const w = T.ntWaarom(k, bank, antwoorden, BEWIJS, cfg);
  assert.ok(w.includes('bij emotieregulatie en frustratietolerantie "zeer vaak" antwoordde'), w);
  assert.ok(w.includes("Hoe sterk is dit?"), w);
  assert.ok(/direct bij ADHD|niet specifiek bij ADHD|nog een experiment/.test(w));
});

test("elk domein wijst naar bestaande subthema's; sensorisch en lezen hebben er geen", () => {
  const ids = new Set(bank.questions.filter(q => q.assessment_part === "A").map(q => q.subtheme_id));
  for (const d of adhd.domeinen) for (const s of d.subthemas) assert.ok(ids.has(s), d.id + ": " + s);
  const gedekt = new Set(adhd.domeinen.flatMap(d => d.subthemas));
  assert.ok(!gedekt.has("A2.1") && !gedekt.has("A3.4"));
});

test("omdat-zin citeert nooit een laag antwoord (review: 'nooit' bij een geopend domein)", () => {
  const a = {}; for (const q of bank.questions) if (q.question_id.endsWith(".Q1") && q.assessment_part === "A") a[q.question_id] = "never";
  a["A4.1.Q2"] = "very_often"; a["A4.1.Q3"] = "often";
  const p = T.nsProfiel(bank, a, { "A4.1": true }, {}, cfg, {});
  const k = T.ntKies(T.ntKandidaten(p, a, adhd.domeinen, [], cfg), adhd.domeinen, [], 0, "ochtend");
  const w = T.ntWaarom(k, bank, a, BEWIJS, cfg);
  assert.doesNotMatch(w, /"nooit"|"zelden"|"niet van toepassing"|"liever niet/);
  assert.ok(w.includes('"zeer vaak" antwoordde'), w);
  // Alleen gemarkeerd, zonder hoog antwoord: eerlijk "aangaf dat het speelt".
  assert.equal(T.ntSterksteAntwoord(bank, "A3.4", { "A3.4.Q1": "never", "A3.4.Q2": "rarely" }, cfg), null);
});

test("tip gaat over de dagen rond, ook bij drie kandidaten", () => {
  const k = adhd.domeinen.slice(0, 3).map(d => ({ domein: d, dim: "A1.1", score: 50 }));
  const ochtenden = [0, 1, 2, 3, 4].map(dag => T.ntKies(k, adhd.domeinen, [], dag, "ochtend").domein.id);
  assert.ok(new Set(ochtenden).size > 1, ochtenden.join(","));
});
