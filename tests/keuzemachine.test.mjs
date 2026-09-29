// Tests voor de rekenkern van de Keuzemachine (sectie 82).
// Haalt het pure deel (tussen /* KM-KERN-BEGIN */ en /* KM-KERN-EINDE */) uit de
// gebouwde index.html en draait de fixtures uit docs/keuzemachine-spec.md.
// Gebruik: node tests/keuzemachine.test.mjs   (na python3 ruimtelijk/bouw.py)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import assert from "node:assert/strict";

const pad = fileURLToPath(new URL("../index.html", import.meta.url));
const html = readFileSync(pad, "utf8");
const b = html.indexOf("/* KM-KERN-BEGIN */"), e = html.indexOf("/* KM-KERN-EINDE */");
if (b < 0 || e < b) { console.error("✘ rekenkern niet gevonden in index.html"); process.exit(1); }
const ctx = vm.createContext({});
vm.runInContext(html.slice(b, e) + `;globalThis.KM = { kmScore, kmBudget, kmAdvies, kmVeiligheid, kmMaxima, kmLevel, kmReeks, kmVerdiendeBadges, kmXpVoorBesluit, KM_VRAGEN, KM_ROUTE_IDS, KM_GEVOELIG, KM_CHECKEN, KM_THEORIE_IDS, KM_DIAGNOSEWOORDEN, KM_DISCLAIMER, KM_LETTERS };`, ctx);
const K = ctx.KM;

let ok = 0, fout = 0;
function test(naam, fn) {
  try { fn(); ok++; console.log("✔ " + naam); }
  catch (err) { fout++; console.log("✘ " + naam + "\n    " + String(err.message).split("\n").join("\n    ")); }
}
const plain = x => JSON.parse(JSON.stringify(x));

/* ---------- Fixtures: antwoorden ---------- */
// Profiel waarin één route maximaal is: stellingen 3 voor die route, 0 voor de rest;
// bij situaties de optie met alleen die route, anders gedeeld, anders zonder route, anders a.
function profielVoor(route) {
  return K.KM_VRAGEN.map(v => {
    if (!v.o) return v.r === route ? 3 : 0;
    const i1 = v.o.findIndex(o => o[1] === route), i2 = v.o.findIndex(o => o[1].includes(route)), i0 = v.o.findIndex(o => !o[1]);
    const i = i1 >= 0 ? i1 : i2 >= 0 ? i2 : i0 >= 0 ? i0 : 0;
    return K.KM_LETTERS[i];
  });
}
// 1–18 stellingen (A1-3, B4-6, C7-9, D10-12, E13-14, F15-16, G17-18), 19–25 a–d.
const GEMENGD = [3, 3, 3, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, "a", "d", "a", "a", "a", "a", "a"];
const LAAG = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "a", "d", "c", "d", "a", "a", "a"];
const GELIJK = [3, 3, 3, 3, 3, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "a", "d", "a", "a", "b", "c", "c"];
const SIGNALEN = [0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 3, 0, 0, 2, 2, 0, 0, "d", "d", "c", "d", "b", "c", "d"];

/* ---------- kmScore ---------- */
test("maxima worden uit de vragenlijst berekend", () => {
  assert.deepEqual(plain(K.kmMaxima()), { A: 24, B: 26, C: 17, D: 20, E: 17, F: 15, G: 15 });
});
for (const r of K.KM_ROUTE_IDS) test(`routeprofiel ${r}: primair ${r} met score 100`, () => {
  const s = K.kmScore(profielVoor(r));
  assert.equal(s.primair, r); assert.equal(s.scores[r], 100); assert.equal(s.soort, "normaal");
});
test("gemengd profiel: drie hoogste scores binnen 10 punten", () => {
  const s = K.kmScore(GEMENGD);
  assert.deepEqual(plain(s.scores), { A: 75, B: 65, C: 65, D: 0, E: 0, F: 0, G: 0 });
  assert.equal(s.soort, "gemengd"); assert.equal(s.primair, "A"); assert.equal(s.secundair, "B");
});
test("laag profiel: alle scores onder 30", () => {
  const s = K.kmScore(LAAG);
  assert.ok(Object.values(s.scores).every(n => n < 30), JSON.stringify(s.scores));
  assert.equal(s.soort, "laag");
});
test("gelijke stand: de route met meer punten uit vraag 19–25 wint", () => {
  const s = K.kmScore(GELIJK);
  assert.equal(s.scores.A, 50); assert.equal(s.scores.B, 50);
  assert.ok(s.situatie.B > s.situatie.A);
  assert.equal(s.primair, "B"); assert.equal(s.secundair, "A"); assert.equal(s.soort, "normaal");
});
test("secundair alleen bij ≥ 50 en ≥ 70% van primair", () => {
  assert.equal(K.kmScore(profielVoor("C")).secundair, null);
  assert.equal(K.kmScore(GELIJK).secundair, "A");
});
test("signalen: breedte (vraag 10 en 12 ≥ 2) en kompas (15 en 16 ≥ 2)", () => {
  assert.deepEqual(plain(K.kmScore(SIGNALEN).signalen), { breedte: true, kompas: true });
  assert.deepEqual(plain(K.kmScore(LAAG).signalen), { breedte: false, kompas: false });
});
test("onvolledige test telt alleen de beantwoorde vragen", () => {
  const s = K.kmScore([3, 3, 3]);
  assert.equal(s.scores.A, Math.round(9 / 24 * 100));
});

/* ---------- kmBudget ---------- */
const TABEL = { klein: { ja: 2, deels: 5, nee: 15 }, middel: { ja: 15, deels: 60, nee: 1440 }, groot: { ja: 1440, deels: 4320, nee: 10080 } };
const LABEL = { 2: "2 minuten", 5: "5 minuten", 15: "15 minuten", 60: "1 uur", 1440: "1 dag", 4320: "3 dagen", 10080: "1 week" };
for (const [inzet, rij] of Object.entries(TABEL)) for (const [omk, min] of Object.entries(rij))
  test(`budget ${inzet} × omkeerbaar ${omk} = ${LABEL[min]}`, () => {
    const b = K.kmBudget({ inzet, omkeerbaar: omk }, Date.UTC(2026, 8, 27, 10));
    assert.equal(b.minuten, min); assert.equal(b.label, LABEL[min]); assert.equal(b.bron, "budget");
    assert.equal(b.denkmomenten, inzet === "groot" && omk === "nee");
  });
test("een eerdere deadline wint van het budget", () => {
  const nu = new Date(2026, 8, 27, 10, 0).getTime();
  const b = K.kmBudget({ inzet: "groot", omkeerbaar: "nee", deadline: "2026-09-28" }, nu);
  assert.equal(b.bron, "deadline"); assert.ok(b.minuten < 10080 && b.minuten > 1440, String(b.minuten));
  const later = K.kmBudget({ inzet: "klein", omkeerbaar: "ja", deadline: "2026-10-10" }, nu);
  assert.equal(later.bron, "budget"); assert.equal(later.minuten, 2);
});

/* ---------- kmAdvies ---------- */
const NU = new Date(2026, 8, 27, 12, 0).getTime();
const dil = (checks, context) => ({ a: { titel: "Laptop nu kopen", notitie: "" }, b: { titel: "Wachten tot Black Friday", notitie: "" }, context: Object.assign({ inzet: "klein", omkeerbaar: "ja", zichtbaar: false }, context || {}), checks });
const prof = (primair, secundair) => ({ primair, secundair: secundair || null, soort: "normaal" });
test("privé-keuze weegt ±3 (sterkste signaal)", () => {
  assert.equal(K.kmAdvies(dil({ trek: 0, prive: "A", terug: "gelijk" }), prof("C"), { nu: NU }).stand, 3);
  const u = K.kmAdvies(dil({ trek: -2, prive: "B", terug: "gelijk" }), prof("C"), { nu: NU });
  assert.equal(u.stand, -1); assert.equal(u.advies, "B");   // trek sterk A (+2) − privé B (3)
});
test("trek telt ×1 met de A-kant positief", () => {
  assert.equal(K.kmAdvies(dil({ trek: -1, prive: "?", terug: "gelijk" }), prof("C"), { nu: NU }).stand, 1);
  assert.equal(K.kmAdvies(dil({ trek: 2, prive: "?", terug: "gelijk" }), prof("C"), { nu: NU }).stand, -2);
});
test("terugdraaien: één kant makkelijker = ±1", () => {
  assert.equal(K.kmAdvies(dil({ trek: 0, prive: "?", terug: "B" }), prof("C"), { nu: NU }).stand, -1);
});
test("route A primair + zichtbaar: privé-keuze ×1,5", () => {
  const met = K.kmAdvies(dil({ trek: -2, prive: "B", terug: "A" }, { zichtbaar: true }), prof("A"), { nu: NU });
  assert.equal(met.stand, -1.5); assert.equal(met.advies, "B");
  const zonder = K.kmAdvies(dil({ trek: -2, prive: "B", terug: "A" }, { zichtbaar: false }), prof("A"), { nu: NU });
  assert.equal(zonder.stand, 0); assert.equal(zonder.advies, "A");   // 0 → de makkelijk terug te draaien kant
});
test("route B primair en beide opties voldoen: trek ×2", () => {
  const met = K.kmAdvies(dil({ trek: -2, prive: "B", terug: "gelijk", beideGoed: true }), prof("B"), { nu: NU });
  assert.equal(met.stand, 1); assert.equal(met.advies, "A");
  const zonder = K.kmAdvies(dil({ trek: -2, prive: "B", terug: "gelijk", beideGoed: false }), prof("B"), { nu: NU });
  assert.equal(zonder.stand, -1); assert.equal(zonder.advies, "B");
});
test("stand 0: de makkelijker terug te draaien optie wint", () => {
  const u = K.kmAdvies(dil({ trek: 2, prive: "A", terug: "B" }), prof("C"), { nu: NU });   // −2 + 3 − 1 = 0
  assert.equal(u.stand, 0); assert.equal(u.advies, "B"); assert.equal(u.munt, false);
});
test("stand 0 en terugdraaien gelijk: 'gelijk' met de munt-test", () => {
  const u = K.kmAdvies(dil({ trek: 0, prive: "?", terug: "gelijk" }), prof("C"), { nu: NU });
  assert.equal(u.advies, "gelijk"); assert.equal(u.munt, true);
  assert.match(u.reden, /Beide opties zijn goed genoeg/); assert.match(u.reden, /eerste reactie als de munt valt/);
});
test("reden uit de twee zwaarste signalen, maximaal drie zinnen", () => {
  const u = K.kmAdvies(dil({ trek: 1, prive: "B", terug: "B" }), prof("C"), { nu: NU });
  assert.equal(u.reden, "Als niemand het ooit zou weten, kies je B. Je onderbuik trekt naar B. Dat maakt B voor jou de rustigste keuze.");
  const v = K.kmAdvies(dil({ trek: 0, prive: "B", terug: "B" }), prof("C"), { nu: NU });
  assert.equal(v.reden, "Als niemand het ooit zou weten, kies je B. En B kun je later nog terugdraaien. Dat maakt B voor jou de rustigste keuze.");
  assert.ok(u.reden.split(/(?<=\.)\s/).length <= 3);
});
test("munt-reactie telt niet mee in de stand (niet in de tabel), maar staat in de reden", () => {
  const u = K.kmAdvies(dil({ trek: 0, prive: "?", terug: "gelijk", munt: { viel: "A", reactie: "teleurgesteld" } }), prof("F"), { nu: NU });
  assert.equal(u.stand, 0); assert.equal(u.advies, "gelijk");
  assert.match(u.reden, /Je was teleurgesteld toen A viel\. Dat zegt dat je eigenlijk B wilt\./);
});
test("munt tegen het advies in met één steunend signaal: geen crash, reactie in de reden", () => {
  const u = K.kmAdvies(dil({ trek: 0, prive: "A", terug: "gelijk", munt: { viel: "A", reactie: "teleurgesteld" } }), prof("C"), { nu: NU });
  assert.equal(u.advies, "A"); assert.match(u.reden, /munt-reactie wees naar B/);
  const v = K.kmAdvies(dil({ trek: 0, prive: "B", terug: "B", munt: { viel: "B", reactie: "opgelucht" } }), prof("C"), { nu: NU });
  assert.equal(v.advies, "B"); assert.match(v.reden, /opgelucht toen B viel/); assert.ok(v.reden.split(/(?<=\.)\s/).length <= 3);
});
test("munt-reactie staat altijd in de reden, ook als ze tegen het advies in gaat", () => {
  const mee = K.kmAdvies(dil({ trek: -2, prive: "A", terug: "A", munt: { viel: "B", reactie: "teleurgesteld" } }), prof("C"), { nu: NU });
  assert.equal(mee.advies, "A"); assert.match(mee.reden, /teleurgesteld toen B viel/);
  const tegen = K.kmAdvies(dil({ trek: -2, prive: "A", terug: "gelijk", munt: { viel: "A", reactie: "teleurgesteld" } }), prof("C"), { nu: NU });
  assert.equal(tegen.advies, "A"); assert.match(tegen.reden, /munt-reactie wees naar B, maar je andere signalen wegen zwaarder/);
  assert.ok(tegen.reden.split(/(?<=\.)\s/).length <= 3);
});
test("uitkomstkaart: kern, valkuil, precies 3 handvatten en 2 tips met theorie-link", () => {
  const u = K.kmAdvies(dil({ trek: 0, prive: "A", terug: "gelijk" }), prof("B", "A"), { nu: NU });
  assert.equal(u.kern, "Een kleine, omkeerbare keuze. Je budget is 2 minuten.");
  assert.match(u.valkuil, /^Je zoekt verder terwijl je al iets goeds hebt\./);
  assert.equal(u.handvatten.length, 3); assert.equal(u.handvatten[2], "Doe de privé-versie-test en noteer je antwoord.");
  assert.equal(u.tips.length, 2); u.tips.forEach(t => assert.ok(K.KM_THEORIE_IDS.includes(t.theorie), t.theorie));
});
test("valkuil wordt aangevuld als het dilemma de route versterkt (A + zichtbaar)", () => {
  const u = K.kmAdvies(dil({ trek: 0, prive: "A", terug: "gelijk" }, { zichtbaar: true }), prof("A"), { nu: NU });
  assert.match(u.valkuil, /anderen kunnen meekijken\. En deze keuze zien anderen/);
});
test("zonder secundaire route: een algemene derde stap", () => {
  const u = K.kmAdvies(dil({ trek: 0, prive: "A", terug: "gelijk" }), prof("D"), { nu: NU });
  assert.equal(u.handvatten.length, 3); assert.match(u.handvatten[2], /Zet een timer op 2 minuten/);
});
test("deterministisch: zelfde invoer geeft dezelfde uitkomst", () => {
  const d = dil({ trek: -1, prive: "B", terug: "A" }, { inzet: "middel", omkeerbaar: "deels", deadline: "2026-09-30" });
  assert.deepEqual(plain(K.kmAdvies(d, prof("E", "C"), { nu: NU })), plain(K.kmAdvies(d, prof("E", "C"), { nu: NU })));
});
test("geen diagnose-taal in uitkomstkaarten (alle routes × contexten)", () => {
  for (const r of K.KM_ROUTE_IDS) for (const z of [true, false]) for (const omk of ["ja", "deels", "nee"]) {
    const u = K.kmAdvies(dil({ trek: 1, prive: "A", terug: "B" }, { zichtbaar: z, omkeerbaar: omk, inzet: "groot" }), prof(r, r === "A" ? "B" : "A"), { nu: NU });
    const tekst = [u.kern, u.valkuil, u.reden, u.extra, ...u.handvatten, ...u.tips.map(t => t.tekst)].join(" ");
    assert.ok(!K.KM_DIAGNOSEWOORDEN.test(tekst), `${r}: ${tekst}`);
  }
});

/* ---------- kmVeiligheid ---------- */
test(`alle ${K.KM_GEVOELIG.length} gevoelige woorden blokkeren (ook in een notitie)`, () => {
  for (const w0 of K.KM_GEVOELIG) {
    const w = w0.replace(/^=/, "");
    assert.equal(K.kmVeiligheid(`Ik twijfel over ${w} of niet`).status, "geblokkeerd", w);
    const d = { a: { titel: "Optie een", notitie: `Het gaat eigenlijk over ${w.toUpperCase()}` }, b: { titel: "Optie twee" }, context: {}, checks: { prive: "A" } };
    const u = K.kmAdvies(d, prof("A"), { nu: NU });
    assert.equal(u.veiligheid, "geblokkeerd", w); assert.equal(u.advies, null); assert.equal(u.handvatten.length, 0); assert.equal(u.reden, "");
  }
});
test("geld, recht en gezondheid: advies blijft, met de extra zin", () => {
  for (const w of ["hypotheek", "contract", "huisarts", "Belasting"]) {
    const u = K.kmAdvies({ a: { titel: `${w} afsluiten` }, b: { titel: "Wachten" }, context: {}, checks: { prive: "A" } }, prof("C"), { nu: NU });
    assert.equal(u.veiligheid, "disclaimer", w); assert.equal(u.advies, "A"); assert.equal(u.extra, K.KM_DISCLAIMER);
  }
});
test("gewone keuzes blokkeren niet (ook niet 'overslaan' of 'opslaan')", () => {
  for (const t of ["Een geweldige laptop of een goede tablet", "Geweldig feestje of rustig thuis", "Pizza of pasta", "Blauwe of groene trui", "Les overslaan of gaan", "Foto's opslaan in de cloud", "Nieuwe laptop nu kopen"])
    assert.equal(K.kmVeiligheid(t).status, "geen", t);
});

/* ---------- XP, levels, reeks, badges ---------- */
test("levels: grenzen 0, 100, 300, 700, 1500", () => {
  assert.equal(K.kmLevel(0).naam, "Twijfelaar"); assert.equal(K.kmLevel(99).naam, "Twijfelaar"); assert.equal(K.kmLevel(100).naam, "Knopendoorhakker");
  assert.equal(K.kmLevel(300).naam, "Keuzekenner"); assert.equal(K.kmLevel(700).naam, "Beslismeester"); assert.equal(K.kmLevel(1500).naam, "Kompasmeester");
  assert.equal(K.kmLevel(200).pct, 50);
});
test("reeks van 5 testdilemma's op 5 dagen achter elkaar: XP, level en badges kloppen", () => {
  const dag = n => new Date(2026, 8, 23 + n, 10).toISOString();
  const ds = [0, 1, 2, 3, 4].map(n => ({ besluit: { keuze: n % 2 ? "B" : "A", op: dag(n), binnenBudget: true }, nazorg: { verwacht: 6, score: 1 },
    checks: n === 0 ? { munt: { viel: "A", reactie: "opgelucht" } } : {} }));
  const xp = ds.reduce((a, d) => a + K.kmXpVoorBesluit(d.besluit.binnenBudget) + 5, 0);
  assert.equal(xp, 125); assert.equal(K.kmLevel(xp).naam, "Knopendoorhakker");
  assert.equal(K.kmReeks(ds, new Date(2026, 8, 27, 20).getTime()), 5);
  assert.equal(K.kmReeks(ds, new Date(2026, 8, 28, 9).getTime()), 5);   // vandaag nog niets: reeks blijft staan
  assert.equal(K.kmReeks(ds, new Date(2026, 8, 30, 9).getTime()), 0);
  assert.deepEqual(plain(K.kmVerdiendeBadges(ds, [])).sort(), ["budget5", "eerste", "goedgenoeg", "munt", "spijt"]);
  assert.ok(K.kmVerdiendeBadges([], K.KM_THEORIE_IDS).includes("theorie"));
});

console.log(`\n${ok} geslaagd, ${fout} mislukt`);
process.exit(fout ? 1 : 0);
