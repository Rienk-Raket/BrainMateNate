// Rooktest voor V11 (impulsfrictie, patroonlogger, uitglijder) en V12 (werkwoordcheck) met Playwright.
// Gebruik:  NODE_PATH=<map met node_modules/playwright> node tests/frictie-werkwoord.e2e.cjs
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

  /* ---------- V11 Wishlist afkoelen ---------- */
  const wid = await p.evaluate(async () => {
    const x = { id: uid(), naam: "Koptelefoon", prijs: 120, status: "actief", gemaakt: new Date(Date.now() - 2 * 3600e3).toISOString(), volgorde: Date.now(), prijzen: [] };
    await bewaar("wl_items", x); ga("wishlist"); return x.id;
  });
  await wacht(400);
  await p.evaluate(id => wlZet(id, "gekocht"), wid); await wacht(400);
  check("V11: afkoelen vóór gekocht", (await p.locator("#blad.open .pl-zin").textContent()).includes("afkoelen") && await p.evaluate(id => vind("wl_items", id).status === "actief", wid));
  await p.screenshot({ path: path.join(UIT, "v11-01-afkoelen.png") });
  await p.click("#pl-wacht"); await wacht(300);
  check("V11: wachten laat hem op de lijst", await p.evaluate(id => vind("wl_items", id).status === "actief", wid));
  await p.evaluate(id => wlZet(id, "gekocht"), wid); await wacht(300);
  await p.click("#pl-toch"); await wacht(700);
  check("V11: toch kopen kan altijd", await p.evaluate(id => vind("wl_items", id).status === "gekocht", wid));
  const wid2 = await p.evaluate(async () => { const x = { id: uid(), naam: "Sokken", prijs: 12, status: "actief", gemaakt: new Date().toISOString(), volgorde: Date.now(), prijzen: [] }; await bewaar("wl_items", x); await wlZet(x.id, "gekocht"); return x.id; });
  await wacht(500);
  check("V11: onder € 50 geen afkoeltijd", await p.evaluate(id => vind("wl_items", id).status === "gekocht" && !document.querySelector("#blad.open .pl-zin"), wid2));

  /* ---------- V11 Rookvrij: patroon en uitglijder ---------- */
  await p.evaluate(async () => { await zetInst("rookStop", plusDagen(vandaagISO(), -10) + "T09:00:00"); await zetInst("rookPrijs", 9); await zetInst("rookPakjes", 20); ga("roken"); });
  await wacht(400);
  check("V11: patroonkaart bij Rookvrij, vóór Opnieuw beginnen", await p.evaluate(() => { const k = document.querySelector(".pl-kaart"), o = document.querySelector('[data-act="rook-opnieuw"]'); return !!k && (!o || (k.compareDocumentPosition(o) & Node.DOCUMENT_POSITION_FOLLOWING)); }));
  const teller = await p.evaluate(() => inst("rookStop"));
  for (const [trig, opb] of [["Koffie", "rust"], ["Koffie", "rust"], ["Stress", "spanning"]]) {
    await p.click('[data-pl-open="roken"][data-pl-soort="trek"]'); await wacht(300);
    await p.click(`#blad [data-pl="${trig}"]`); await p.click(`#blad [data-pl="${opb}"]`);
    await p.click("#pl-op"); await wacht(350);
  }
  check("V11: na drie momenten het patroon", (await p.locator(".pl-kaart").textContent()).includes("koffie") && (await p.locator(".pl-anders").textContent()).includes("Anker"));
  await p.click('[data-pl-open="roken"][data-pl-soort="uitglijder"]'); await wacht(300);
  check("V11: uitglijder zonder schuld", await p.evaluate(() => /teller loopt door/.test(document.querySelector("#blad .pl-zin").textContent) && !/moet|helaas|jammer/i.test(document.querySelector("#blad .pl-zin").textContent)));
  await p.fill("#pl-gedrag", "ik ben verslaafd aan gokken"); await p.dispatchEvent("#pl-gedrag", "change"); await wacht(200);
  check("V11: verwijzing bij controleverlies (huisarts, 113)", (await p.locator("#pl-hulp").textContent()).includes("113"));
  await p.screenshot({ path: path.join(UIT, "v11-02-uitglijder.png") });
  await p.click("#pl-op"); await wacht(400);
  check("V11: teller loopt door na een uitglijder", await p.evaluate(t => inst("rookStop") === t && /1 uitglijder/.test(document.querySelector(".pl-kaart").textContent), teller));
  check("V11: tikvlakken ≥ 44 px", (await tikvlakken(p, ".pl-kaart")).length === 0, JSON.stringify(await tikvlakken(p, ".pl-kaart")));
  await p.evaluate(() => ga("gewoontes")); await wacht(400);
  check("V11: patroonlogger ook bij Gewoontes", await p.locator('.pl-kaart [data-pl-open="gewoontes"]').count() === 1);

  /* ---------- V12 Werkwoordcheck ---------- */
  await p.evaluate(() => { V.nwPad = []; ga("start"); }); await wacht(500);
  await p.fill("#vi-veld", "belasting vrijdag"); await wacht(200);
  await p.click('[data-vi-soort="taak"]').catch(() => {}); await wacht(150);
  await p.click('[data-vi="op"]'); await wacht(600);
  check("V12: na opslaan vraagt Nate de eerste handeling", (await p.locator("#scherm .ww-vraag").textContent()).includes("eerste handeling"));
  check("V12: suggesties passen bij de taak", await p.locator('#scherm [data-ww-vb="Inlogpagina openen"]').count() === 1);
  await p.screenshot({ path: path.join(UIT, "v12-01-vraag.png") });
  await p.click('#scherm [data-ww-vb="Inlogpagina openen"]'); await p.click('#scherm [data-ww="op"]'); await wacht(400);
  check("V12: eerste handeling bovenaan de subtaken", await p.evaluate(() => { const t = S.taken.find(x => /^belasting$/i.test(x.titel)); return t && t.subtaken[0].tekst === "Inlogpagina openen" && t.wwGevraagd; }));
  await p.fill("#vi-veld", "kapper bellen morgen"); await wacht(200);
  await p.click('[data-vi-soort="taak"]').catch(() => {}); await wacht(150);
  await p.click('[data-vi="op"]'); await wacht(500);
  check("V12: concrete taak: geen vraag", await p.locator("#scherm .ww-vraag").count() === 0);
  await p.fill("#vi-veld", "administratie regelen"); await wacht(200); await p.click('[data-vi="op"]'); await wacht(500);
  await p.click('#scherm [data-ww="over"]'); await wacht(300);
  check("V12: overslaan mag, en daarna niet opnieuw", await p.evaluate(() => { const t = S.taken.find(x => /administratie/i.test(x.titel)); return t.wwGevraagd && !(t.subtaken || []).length; }));
  // Nu-kaart en taakblad
  const vid = await p.evaluate(async () => { for (const t of S.taken.filter(x => !x.af)) { t.af = true; t.afOp = new Date().toISOString(); await bewaar("taken", t); } const t = await maakTaakUitTekst("Tandarts vandaag"); ga("vandaag"); return t.id; });
  await wacht(400);
  check("V12: 'Nog vaag?' op de Nu-kaart", await p.locator(`.md-nu [data-iv-route="${vid}"]`).count() === 1);
  await p.evaluate(id => openTaakBlad(id), vid); await wacht(350);
  check("V12: knop in het taakblad", await p.locator("#ww-knop").count() === 1);
  await p.click("#ww-knop"); await wacht(400);
  check("V12: opent de route Onduidelijk (V7)", await p.evaluate(() => document.querySelector("#bladtitel").textContent === "Onduidelijk" && !!document.querySelector("#iv-stap")));
  check("V12: tikvlakken ≥ 44 px", (await tikvlakken(p, "#blad")).length === 0, JSON.stringify(await tikvlakken(p, "#blad")));

  check("geen consolefouten", fouten.length === 0, fouten.slice(0, 3).join(" | "));
  check("nul externe verzoeken", extern.length === 0, extern.slice(0, 3).join(" | "));
  await browser.close(); server.close();
  console.log(`\n${ok} geslaagd, ${fout} mislukt`);
  process.exit(fout ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
