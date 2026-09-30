// Tests voor de scorekern van de kennismaking (tussen /* NATE-SCORE-BEGIN */ en /* NATE-SCORE-EINDE */).
// Draait de code uit de gebouwde index.html met de echte kennis/vragenbank.json en kennis/scoreweging.json.
// Gebruik: python3 ruimtelijk/bouw.py && node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const lees = p => readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8");
const html = lees("../index.html");
const b = html.indexOf("/* NATE-SCORE-BEGIN */"), e = html.indexOf("/* NATE-SCORE-EINDE */");
assert.ok(b > 0 && e > b, "scorekern niet gevonden in index.html");
const ctx = vm.createContext({});
vm.runInContext(html.slice(b, e) + ";globalThis.S = { nsScore, nsDimensie, nsBehoefte, nsFit, nsFitRoute, nsClusters, nsTopClusters, nsDatakwaliteit, nsRoute, nsVolgende, nsKernKlaar, nsProfiel, nsContextBreedte, NS_VOORKEUR_IDS };", ctx);
const S = ctx.S;
const bank = JSON.parse(lees("../kennis/vragenbank.json"));
const cfg = JSON.parse(lees("../kennis/scoreweging.json"));
const plain = x => JSON.parse(JSON.stringify(x));

// Hulp: dezelfde antwoordwaarde op alle kernvragen.
const kern = waarde => Object.fromEntries(bank.questions.filter(q => q.question_id.endsWith(".Q1") && q.assessment_part === "A").map(q => [q.question_id, waarde]));

test("ontbrekend telt nooit als 0", () => {
  assert.equal(S.nsScore("not_applicable", cfg), null);
  assert.equal(S.nsScore("prefer_not", cfg), null);
  assert.equal(S.nsScore(undefined, cfg), null);
  assert.equal(S.nsScore("never", cfg), 0);
  // Een N.v.t. op het derde item mag het signaal niet omlaag trekken.
  const met = S.nsDimensie(bank, "A1.1", { "A1.1.Q1": "often", "A1.1.Q2": "often", "A1.1.Q3": "not_applicable" }, cfg);
  const zonder = S.nsDimensie(bank, "A1.1", { "A1.1.Q1": "often", "A1.1.Q2": "often" }, cfg);
  assert.equal(met.signaal, 75);
  assert.equal(met.signaal, zonder.signaal);
  // Als nul geteld zou het signaal lager uitvallen; dat mag dus niet gebeuren.
  const nul = S.nsDimensie(bank, "A1.1", { "A1.1.Q1": "often", "A1.1.Q2": "often", "A1.1.Q3": "never" }, cfg);
  assert.ok(nul.signaal < met.signaal);
});

test("interpretatieregel: 2 van 3 geldig plus impact", () => {
  const d = a => S.nsDimensie(bank, "A2.3", a, cfg).interpreteerbaar;
  assert.equal(d({ "A2.3.Q1": "often", "A2.3.Q2": "sometimes" }), true);
  assert.equal(d({ "A2.3.Q1": "often", "A2.3.Q3": "often" }), false, "zonder impact niet interpreteerbaar");
  assert.equal(d({ "A2.3.Q2": "often" }), false, "één item is te weinig");
  assert.equal(d({ "A2.3.Q1": "often", "A2.3.Q2": "prefer_not", "A2.3.Q3": "often" }), false, "liever niet is geen impact");
  assert.equal(S.nsDimensie(bank, "A2.3", { "A2.3.Q1": "often" }, cfg).behoefte, null);
});

test("dimensiesignaal gebruikt de itemrolgewichten", () => {
  // Q1 herkenning 4×1,00 + Q2 impact 0×1,25 + Q3 context 4×1,10 → 8,4 / 13,4 = 63
  const d = S.nsDimensie(bank, "A1.1", { "A1.1.Q1": "very_often", "A1.1.Q2": "never", "A1.1.Q3": "very_often" }, cfg);
  assert.equal(d.signaal, 63);
  // Een hulpbron (compensatie) telt niet mee in de belasting, maar staat apart.
  const h = S.nsDimensie(bank, "A1.2", { "A1.2.Q1": "often", "A1.2.Q2": "often", "A1.2.Q3": "very_often" }, cfg);
  assert.equal(h.signaal, 75);
  assert.equal(h.hulpbron, 100);
});

test("ondersteuningsbehoefte volgt 40/30/20/10", () => {
  assert.equal(S.nsBehoefte({ I: 100, F: 50, C: 25, R: 0 }, cfg), 60);
  assert.equal(S.nsBehoefte({ I: 100, F: 100, C: 100, R: 100 }, cfg), 100);
  // Herverdeling alleen over wat er is: I 40% en F 30% → 100·0,4/0,7 = 57.
  assert.equal(S.nsBehoefte({ I: 100, F: 0, C: null, R: null }, cfg), 57);
  // Minimumregel: zonder impact, of alleen impact, geen behoefte.
  assert.equal(S.nsBehoefte({ I: null, F: 100, C: 100, R: 100 }, cfg), null);
  assert.equal(S.nsBehoefte({ I: 100, F: null, C: null, R: null }, cfg), null);
  // Contextbreedte: 1→25, 2→50, 3→75, 4+→100, geen→ontbrekend.
  assert.deepEqual([0, 1, 2, 3, 4, 8].map(n => S.nsContextBreedte(n, cfg)), [null, 25, 50, 75, 100, 100]);
  // Met echte antwoorden en twee levensgebieden: I 75, F 100, C 50, R 50 (herstel).
  const d = S.nsDimensie(bank, "A2.3", { "A2.3.Q1": "very_often", "A2.3.Q2": "often", "A2.3.Q3": "sometimes" }, cfg, ["werk", "thuis"]);
  assert.equal(d.behoefte, Math.round(0.4 * 75 + 0.3 * 100 + 0.2 * 50 + 0.1 * 50));
  assert.equal(d.behoefte, 75);
  assert.equal(d.band, "hoge_of_brede_ondersteuningsbehoefte");
});

test("oplossingsfit volgt 45/25/30, barrière apart", () => {
  // B1.1: ervaring (E) + voorkeur (P). E 100, P 0 → 100·0,45/0,70 = 64.
  const f = S.nsFit(bank, "B1.1", { "B1.1.Q1": "very_often", "B1.1.Q2": "never", "B1.1.Q3": "very_often" }, cfg);
  assert.equal(f.fit, 64);
  assert.equal(f.barriere, 100);
  assert.equal(f.route, "eerst_vereenvoudigen");
  // B1.2: ervaring + haalbaarheid (H). E 0, H 100 → 100·0,30/0,75 = 40.
  const g = S.nsFit(bank, "B1.2", { "B1.2.Q1": "never", "B1.2.Q2": "very_often" }, cfg);
  assert.equal(g.fit, 40);
  assert.equal(g.barriere, null);
  assert.equal(g.route, "vrijwillig_alternatief");
  // Alleen de barrière: niet te duiden.
  assert.equal(S.nsFit(bank, "B1.1", { "B1.1.Q3": "often", "B1.1.Q2": "often" }, cfg).interpreteerbaar, false);
});

test("clusterweging combineert dimensiesignalen zonder dubbeltelling", () => {
  for (const cl of cfg.pattern_clusters) assert.ok(Math.abs(Object.values(cl.dimension_weights).reduce((a, b) => a + b, 0) - 1) < 1e-9);
  const dim = s => ({ interpreteerbaar: true, signaal: s });
  const alle = s => Object.fromEntries(Object.keys(cfg.pattern_clusters.flatMap(c => Object.keys(c.dimension_weights)).reduce((o, k) => (o[k] = 1, o), {})).map(k => [k, dim(s)]));
  assert.ok(S.nsClusters(alle(50), cfg).every(c => c.prominentie === 50));
  // P4 = A3.4 70% + A1.2 15% + A1.1 15%.
  const p4 = S.nsClusters({ "A3.4": dim(100), "A1.2": dim(0), "A1.1": dim(0) }, cfg).find(c => c.id === "P4");
  assert.equal(p4.prominentie, 70);
  assert.equal(p4.metafoor, "De Vertaler");
  // Minder dan de helft van het gewicht bekend → nog niet te duiden.
  const p1 = S.nsClusters({ "A1.1": dim(100) }, cfg).find(c => c.id === "P1");
  assert.equal(p1.prominentie, null);
  // Hooguit drie clusters in het rapport, geen winnaar-veld.
  const top = S.nsTopClusters(S.nsClusters(alle(80), cfg));
  assert.equal(top.length, 3);
});

test("datakwaliteit = 50/30/20 en zegt niets over diagnose", () => {
  const route = ["A1.1.Q1", "A1.1.Q2"];
  const leeg = S.nsDatakwaliteit(bank, route, {}, {}, cfg);
  assert.equal(leeg.score, 0);
  assert.equal(leeg.label, "Beperkte informatiebasis");
  // Alles beantwoord, context A1.1 met gebieden, alle 12 contextvragen: 100.
  const ant = { "A1.1.Q1": "often", "A1.1.Q2": "often" };
  const ctx = Object.fromEntries(cfg.context_prompts.map(p => [p.id, "x"]));
  // A1.1 vraagt I, C en F; zonder levensgebieden ontbreekt C → K = 2/3.
  const zonderC = S.nsDatakwaliteit(bank, route, ant, ctx, cfg);
  assert.equal(zonderC.score, Math.round(100 * (0.5 + 0.3 * 2 / 3 + 0.2)));
  const vol = S.nsDatakwaliteit(bank, route, ant, ctx, cfg, { "A1.1": ["werk"] });
  assert.equal(vol.score, 100);
  assert.equal(vol.label, "Voldoende voor apppersonalisatie");
  // "Niet van toepassing" telt als antwoord (besluit 4), niet als 0 in de scores.
  const nvt = S.nsDatakwaliteit(bank, route, { "A1.1.Q1": "not_applicable", "A1.1.Q2": "prefer_not" }, {}, cfg);
  assert.equal(nvt.A, 1);
});

test("adaptieve route: 16 kern + 4 voorkeur, verdieping 32–44", () => {
  const laag = S.nsRoute(bank, kern("never"), {}, cfg);
  assert.equal(laag.length, 20);
  assert.deepEqual(plain(laag.slice(16)), plain(S.NS_VOORKEUR_IDS));
  // Alles hoog: zes subthema's open, route binnen 32–44 vragen.
  const hoog = S.nsRoute(bank, kern("very_often"), {}, cfg);
  assert.ok(hoog.length >= 32 && hoog.length <= 44, "lengte " + hoog.length);
  assert.equal(hoog.filter(id => id.startsWith("A") && id.endsWith(".Q2")).length, 6);
  // Eigen markering opent een domein ook bij een lage kernscore.
  const vlag = S.nsRoute(bank, kern("never"), { "A3.4": true }, cfg);
  assert.ok(vlag.includes("A3.4.Q2") && vlag.includes("A3.4.Q3"));
  // Volgende vraag slaat beantwoorde vragen over, ook N.v.t.
  assert.equal(S.nsVolgende(["A1.1.Q1", "A1.2.Q1"], { "A1.1.Q1": "not_applicable" }), "A1.2.Q1");
  assert.equal(S.nsKernKlaar(bank, kern("prefer_not")), true);
  assert.equal(S.nsKernKlaar(bank, {}), false);
});

test("profiel: geen totaalscore, percentages of diagnose", () => {
  const ant = kern("often");
  const route = S.nsRoute(bank, ant, {}, cfg);
  for (const id of route) ant[id] = ant[id] || "often";
  const p = plain(S.nsProfiel(bank, ant, {}, {}, cfg));
  assert.ok(p.top.length <= 3);
  // Geen veld dat op een totaal of kans lijkt, en geen diagnosewoord in de getoonde clusters.
  const sleutels = JSON.stringify(Object.keys(p)).toLowerCase();
  for (const v of ["totaal", "total", "kans", "procent", "winnaar"]) assert.ok(!sleutels.includes(v), v);
  assert.doesNotMatch(JSON.stringify(p.top), /adhd|autis|dyslex|%/i);
  assert.equal(p.disclaimer, bank.disclaimer);
  assert.ok(p.disclaimer.startsWith("Dit profiel is geen diagnose."));
});
