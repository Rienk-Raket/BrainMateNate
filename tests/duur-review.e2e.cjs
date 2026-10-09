// Rooktest voor V9 (duurkalibratie, gemeten reistijd) en V10 (weekreview, experimenten) met Playwright.
// Gebruik:  NODE_PATH=<map met node_modules/playwright> node tests/duur-review.e2e.cjs
"use strict";
const http = require("http"), fs = require("fs"), path = require("path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, ".."), UIT = process.env.SCHERMEN || path.join(ROOT, "tests", "uitvoer");
fs.mkdirSync(UIT, { recursive: true });
const server = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split("?")[0]);
  const f = path.join(ROOT, u === "/" ? "index.html" : u);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { "content-type": f.endsWith(".html") ? "text/html; charset=utf-8" : f.endsWith(".svg") ? "image/svg+xml" : "application/octet-stream" }); fs.createReadStream(f).pipe(r);
});
let ok = 0, fout = 0;
const check = (naam, v, extra) => { if (v) ok++; else fout++; console.log((v ? "✔ " : "✘ ") + naam + (extra ? "  " + extra : "")); };
const wacht = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const BASIS = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ["--no-sandbox"] });
  const fouten = [], extern = [];
  const volg = p => { p.on("pageerror", e => fouten.push(e.message)); p.on("console", m => { if (m.type() === "error" && !/favicon|404/.test(m.text())) fouten.push(m.text()); }); p.on("request", r => { if (!r.url().startsWith(BASIS)) extern.push(r.url()); }); return p; };
  // Vaste klok (10:42), zodat tijden niet tegen middernacht aanlopen als de test 's avonds draait.
  const nieuw = async o => { const c = await browser.newContext(Object.assign({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, o || {})); await c.clock.setFixedTime(new Date(2026, 9, 2, 10, 42)); return c; };
  const tikvlakken = (p, b) => p.evaluate(b => [...document.querySelectorAll(`${b} button, ${b} [role=button], ${b} summary, ${b} a`)]
    .filter(el => el.offsetParent && !el.closest("svg") && !el.closest(".banner, .vw-verwant, .kp-verwant, .verwant")).map(el => [el.tagName + "." + el.className, el.offsetWidth, el.offsetHeight]).filter(([, w, h]) => w < 44 || h < 44), b || "#scherm");

  const ctx = await nieuw(), p = volg(await ctx.newPage());
  await p.goto(BASIS + "/"); await wacht(1500);
  await p.click('[data-kn="later"]'); await wacht(300);

  /* ---------- V9 Duur ---------- */
  const tid = await p.evaluate(async () => { const t = await maakTaakUitTekst("Badkamer schoonmaken vandaag ~20m"); ga("vandaag"); return t.id; });
  await wacht(300);
  await p.evaluate(async id => { await vinkTaak(id); }, tid); await wacht(400);
  check("V9: vraag na afronden met schatting", (await p.locator(".dk-vraag").textContent()).includes("Badkamer schoonmaken"));
  await p.screenshot({ path: path.join(UIT, "v9-01-vraag.png") });
  await p.click('.dk-vraag [data-dk="langer"]'); await wacht(300);
  check("V9: antwoord bewaard (20 × 1,5 = 30)", await p.evaluate(id => inst("dkLog").some(r => r.taakId === id && r.werkelijk === 30 && r.bron === "schatting"), tid));
  check("V9: vraag weg na antwoord", await p.locator(".dk-vraag").count() === 0);
  // Timer: zelf meten, niets vragen.
  const t2 = await p.evaluate(async () => { const t = await maakTaakUitTekst("Badkamer schoonmaken boven vandaag ~20m"); await bewaar("tijdlog", { id: uid(), taakId: t.id, seconden: 40 * 60, datum: vandaagISO(), ts: new Date().toISOString() }); await vinkTaak(t.id); return t.id; });
  await wacht(300);
  check("V9: met timer zelf gemeten (40 min), geen vraag", await p.evaluate(id => inst("dkLog").some(r => r.taakId === id && r.werkelijk === 40 && r.bron === "timer") && !document.querySelector(".dk-vraag"), t2));
  // Lopende timer bij afronden: eerst stoppen en meten.
  const t3 = await p.evaluate(async () => { const t = await maakTaakUitTekst("Opruimen zolder vandaag ~30m"); startTimer(t.id); T.start = Date.now() - 45 * 60000; await vinkTaak(t.id); return t.id; });
  await wacht(300);
  check("V9: lopende timer wordt gestopt en gemeten (45 min)", await p.evaluate(id => !T.actief && inst("dkLog").some(r => r.taakId === id && r.werkelijk === 45 && r.bron === "timer"), t3));
  await p.evaluate(async id => { await vinkTaak(id); }, t3); await wacht(200);
  check("V9: weer openzetten haalt de meting weg", await p.evaluate(id => !inst("dkLog").some(r => r.taakId === id), t3));
  // Nieuwe vergelijkbare taak: voorstel in het taakblad.
  await p.evaluate(async () => { const t = await maakTaakUitTekst("badkamer schoonmaken morgen ~15m"); openTaakBlad(t.id); }); await wacht(400);
  check("V9: voorstel in het taakblad", (await p.locator("#dk-hint").textContent()).includes("± 35 min"));
  await p.click("[data-dk-neem]"); await wacht(200);
  check("V9: overnemen zet de duur", (await p.inputValue("#f-duur")) === "35");
  await p.screenshot({ path: path.join(UIT, "v9-02-voorstel.png") });
  await p.evaluate(() => bladSluit()); await wacht(300);
  // Reistijd na "Geweest".
  await p.evaluate(async () => {
    for (const w of [31, 33]) await zetInst("dkReis", (inst("dkReis", []) || []).concat({ plek: "Stationsweg 12", gepland: 25, werkelijk: w, ts: new Date().toISOString() }));
    const a = { id: uid(), titel: "Tandarts", soort: "gesprek", datum: vandaagISO(), tijd: "08:00", eindTijd: "08:30", plek: "Stationsweg 12", personen: [], voorbereiding: "", notities: "", uitkomst: "", reistijd: 25, gemaakt: new Date().toISOString() };
    await bewaar("afspraken", a); ga("vandaag");
  });
  await wacht(400);
  await p.click('[data-hs="geweest"]'); await wacht(400);
  check("V9: na Geweest de vraag naar de reistijd", await p.locator('#blad.open [data-dk-reis]').count() === 4);
  await p.click('#blad [data-dk-reis="35"]'); await wacht(300);
  check("V9: gemeten reistijd bewaard", await p.evaluate(() => inst("dkReis").length === 3 && inst("dkReis")[2].werkelijk === 35));
  await p.evaluate(() => openAfspraakBlad(null, { plek: "Stationsweg 12", reistijd: 25, titel: "Tandarts" })); await wacht(400);
  check("V9: afspraakblad stelt gemeten reistijd voor", (await p.locator("#dk-reis-hint").textContent()).includes("33 min"));
  await p.click("[data-dk-reisneem]"); await wacht(200);
  check("V9: overnemen zet de reistijd", (await p.inputValue("#a-reis")) === "33");
  await p.evaluate(() => bladSluit()); await wacht(300);

  /* ---------- V10 Weekreview ---------- */
  await p.evaluate(async () => { const id = S.taken.find(t => /^badkamer schoonmaken$/i.test(t.titel) && !t.af).id; await zetInst("ivLog", [{ ts: new Date().toISOString(), taakId: id, oorzaak: "groot" }]); ga("weekreview"); });
  await wacht(400);
  check("V10: drie feiten", await p.evaluate(() => document.querySelectorAll(".wr-feiten li").length === 3));
  check("V10: feiten zonder oordeel", await p.evaluate(() => !/moet|slecht|helaas|faal/i.test(document.querySelector(".wr-feiten").textContent) && /afgerond/.test(document.querySelector(".wr-feiten").textContent)));
  check("V10: klaar pas na een schakel", await p.locator('[data-wr="klaar"]').isDisabled());
  await p.click('[data-wr-schakel="starten"]'); await wacht(300);
  check("V10: aanpassing voorgevuld met een tip", (await p.inputValue("#wr-tekst")).includes("Ik loop vast"));
  await p.selectOption("#wr-maat", "vaststap");
  await p.fill("#wr-belasting", "6"); await p.dispatchEvent("#wr-belasting", "input"); await wacht(100);
  await p.screenshot({ path: path.join(UIT, "v10-01-review.png"), fullPage: true });
  check("V10: tikvlakken ≥ 44 px", (await tikvlakken(p)).length === 0, JSON.stringify(await tikvlakken(p)));
  await p.click('[data-wr="klaar"]'); await wacht(400);
  check("V10: review bewaard met belasting", await p.evaluate(() => { const r = inst("wrReviews"); return r.length === 1 && r[0].schakel === "starten" && r[0].belasting === 6; }));
  check("V10: experiment gestart (twee weken, één maat)", await p.evaluate(() => { const e = inst("wrExperimenten"); return e.length === 1 && e[0].status === "bezig" && e[0].maat === "vaststap"; }));
  check("V10: experiment staat bovenaan met dag 1 van 14", (await p.locator(".wr-exp").textContent()).includes("Dag 1 van 14"));
  check("V10: deze week al teruggekeken", (await p.locator("#scherm").textContent()).includes("al teruggekeken"));
  // Twee weken later: behouden, aanpassen of laten vallen.
  await p.evaluate(async () => { const e = inst("wrExperimenten"); e[0].start = plusDagen(vandaagISO(), -15); await zetInst("wrExperimenten", e); teken(); });
  await wacht(300);
  check("V10: na twee weken drie keuzes", await p.locator("[data-wr-exp]").count() === 3);
  await p.screenshot({ path: path.join(UIT, "v10-02-experiment.png") });
  await p.click('[data-wr-exp="aanpassen"]'); await wacht(300);
  check("V10: aanpassen toont het formulier, ook als de week al gedaan is", await p.locator('[data-wr="herstart"]').count() === 1 && (await p.inputValue("#wr-tekst")).includes("Ik loop vast"));
  await p.fill("#wr-tekst", "Bij twijfel meteen 'Ik loop vast'"); await p.dispatchEvent("#wr-tekst", "input");
  await p.click('[data-wr="herstart"]'); await wacht(300);
  check("V10: aangepast experiment loopt", await p.evaluate(() => { const e = inst("wrExperimenten"); return e.length === 2 && e[0].status === "aanpassen" && e[1].status === "bezig" && /twijfel/.test(e[1].aanpassing); }));
  await p.evaluate(async () => { const e = inst("wrExperimenten"); e[1].start = plusDagen(vandaagISO(), -15); await zetInst("wrExperimenten", e); teken(); }); await wacht(300);
  await p.click('[data-wr-exp="behouden"]'); await wacht(300);
  check("V10: behouden en in de geschiedenis", await p.evaluate(() => inst("wrExperimenten")[1].status === "behouden" && /behouden/.test(document.querySelector("#scherm").textContent)));
  await p.evaluate(() => ga("meer")); await wacht(300);
  check("V10: Weekreview via Meer → Terugkijken", await p.locator('#scherm [data-view="terugkijken"]').count() === 1);

  // Kaart op Mijn dag: zaterdag, nog niet gedaan.
  const c2 = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await c2.clock.setFixedTime(new Date(2026, 9, 3, 10, 0));
  const p2 = volg(await c2.newPage()); await p2.goto(BASIS + "/"); await wacht(1500); await p2.click('[data-kn="later"]'); await wacht(300);
  await p2.evaluate(() => ga("vandaag")); await wacht(400);
  check("V10: kaart op zaterdag", await p2.locator(".wr-kaart").count() === 1);
  await p2.click('[data-wr-kaart="weg"]'); await wacht(300);
  check("V10: 'Niet deze week' haalt hem weg", await p2.locator(".wr-kaart").count() === 0);
  await c2.close();

  check("geen consolefouten", fouten.length === 0, fouten.slice(0, 3).join(" | "));
  check("nul externe verzoeken", extern.length === 0, extern.slice(0, 3).join(" | "));
  await browser.close(); server.close();
  console.log(`\n${ok} geslaagd, ${fout} mislukt`);
  process.exit(fout ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
