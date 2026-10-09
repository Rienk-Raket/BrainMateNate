// Rooktest voor het vuurblok (sectie 107) met Playwright, op iPhone-formaat (390 × 844).
// Gebruik:  NODE_PATH=<map met node_modules/playwright> node tests/vuur.e2e.cjs
"use strict";
const http = require("http"), fs = require("fs"), path = require("path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const server = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split("?")[0]);
  const f = path.join(ROOT, u === "/" ? "index.html" : u);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { "content-type": f.endsWith(".html") ? "text/html; charset=utf-8" : "application/octet-stream" }); fs.createReadStream(f).pipe(r);
});
let ok = 0, fout = 0;
const check = (naam, v, extra) => { if (v) ok++; else fout++; console.log((v ? "✔ " : "✘ ") + naam + (extra ? "  " + extra : "")); };
const wacht = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const BASIS = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ["--no-sandbox"] });
  const fouten = [], extern = [];

  /* Opent de app, slaat de kennismaking over, maakt een side hustle en toont het dashboard. */
  const open = async opties => {
    const c = await browser.newContext(Object.assign({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, opties || {}));
    const p = await c.newPage();
    p.on("pageerror", e => fouten.push(e.message));
    p.on("console", m => { if (m.type() === "error" && !/favicon|404/.test(m.text())) fouten.push(m.text()); });
    p.on("request", r => { if (!r.url().startsWith(BASIS) && !r.url().startsWith("data:") && !r.url().startsWith("blob:")) extern.push(r.url()); });
    await p.goto(BASIS + "/"); await wacht(1500);
    if (await p.locator('[data-kn="later"]').count()) await p.click('[data-kn="later"]');
    await wacht(300);
    await p.evaluate(async () => { const h = await shMaakAan({ naam: "Vuurtest", pijlers: {} }); window.__shId = h.id || (S.sh_hustles[0] || {}).id; ga("sh", window.__shId); });
    await wacht(800);
    // Telt hoe vaak het vuur een stap zet.
    await p.evaluate(() => { window.__tikken = 0; const orig = window.vuurTik; window.vuurTik = function () { window.__tikken++; return orig(); }; });
    return p;
  };
  const tikken = async (p, ms) => { const a = await p.evaluate(() => window.__tikken); await wacht(ms); return (await p.evaluate(() => window.__tikken)) - a; };
  const hash = p => p.evaluate(() => { const c = document.querySelector(".sh-vuur canvas"), d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; let s = 0; for (let i = 0; i < d.length; i += 7) s = (s * 31 + d[i]) | 0; return s; });

  // 1. Gewone weergave (licht): het vuur is er, beweegt en heeft een uitleg voor schermlezers.
  let p = await open();
  check("blok staat op het dashboard", await p.locator(".sh-vuur canvas").count() === 1);
  check("canvas heeft een tekstalternatief met de score", await p.evaluate(() => /gezondheidsscore: \d+ van 100/.test(document.querySelector(".sh-vuur canvas").getAttribute("aria-label"))));
  check("het vuur beweegt als het in beeld is", await tikken(p, 800) > 5);
  const h1 = await hash(p); await wacht(300); const h2 = await hash(p);
  check("het beeld verandert", h1 !== h2);
  check("pauzeknop is minstens 44 × 44 px", await p.evaluate(() => { const b = document.querySelector(".sh-vuur-knop"); return b.offsetWidth >= 44 && b.offsetHeight >= 44; }));

  // 2. Buiten beeld: geen stappen meer.
  await p.evaluate(() => { const s = document.querySelector("#scherm"); if (s) s.scrollTop = 99999; window.scrollTo(0, 99999); });
  await wacht(500);
  check("buiten beeld wordt het vuur onzichtbaar gemeld", await p.evaluate(() => VUUR.zichtbaar === false));
  check("buiten beeld rekent het vuur niet", await tikken(p, 600) <= 1);
  await p.evaluate(() => { document.querySelector(".sh-vuur").scrollIntoView(); });
  await wacht(500);
  check("terug in beeld gaat het vuur verder", await tikken(p, 600) > 5);

  // 3. Pauzeknop: stopt, onthoudt de keuze, hervat.
  await p.click(".sh-vuur-knop"); await wacht(200);
  check("pauzeknop meldt aria-pressed", await p.getAttribute(".sh-vuur-knop", "aria-pressed") === "true");
  check("na pauzeren geen stappen", await tikken(p, 500) === 0);
  check("keuze wordt opgeslagen", await p.evaluate(() => inst("vuur", "aan") === "uit"));
  await p.click(".sh-vuur-knop"); await wacht(200);
  check("hervatten laat het vuur weer lopen", await tikken(p, 600) > 5);

  // 4. Tabblad naar de achtergrond: loop stopt.
  await p.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => true }); document.dispatchEvent(new Event("visibilitychange")); });
  await wacht(200);
  check("op de achtergrond geen stappen", await tikken(p, 500) <= 1);
  await p.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => false }); document.dispatchEvent(new Event("visibilitychange")); });
  await wacht(200);
  check("weer voorop: het vuur loopt weer", await tikken(p, 500) > 5);

  // 5. Weg van het dashboard: de loop ruimt zichzelf op.
  await p.evaluate(() => ga("vandaag")); await wacht(600);
  check("na weggaan geen stappen en geen canvas meer", await p.evaluate(() => !document.querySelector(".sh-vuur")) && await tikken(p, 400) <= 1);
  await p.context().close();

  // 6. Minder beweging: één stilstaand beeld, geen knop.
  p = await open({ reducedMotion: "reduce" });
  check("minder beweging: geen animatie", await tikken(p, 600) === 0);
  check("minder beweging: wel een beeld", await p.evaluate(() => { const c = document.querySelector(".sh-vuur canvas"), d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; return d.some((v, i) => i % 4 === 3 && v > 0); }));
  check("minder beweging: pauzeknop verborgen", await p.evaluate(() => document.querySelector(".sh-vuur-knop").hidden));
  await p.context().close();

  // 7. Donker thema: geen fouten, blok zichtbaar.
  p = await open({ colorScheme: "dark" });
  check("donker thema: vuur beweegt", await tikken(p, 800) > 5);
  await p.locator(".sh-vuur").screenshot({ path: path.join(ROOT, "tests", "uitvoer", "vuur-donker.png") }).catch(() => {});
  await p.context().close();

  check("geen consolefouten", fouten.length === 0, fouten.slice(0, 3).join(" | "));
  check("nul externe verzoeken", extern.length === 0, extern.slice(0, 3).join(" | "));
  await browser.close(); server.close();
  console.log(`\n${ok} geslaagd, ${fout} mislukt`);
  process.exit(fout ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
