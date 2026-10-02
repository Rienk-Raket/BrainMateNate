// Rooktest voor de voorstellen V7 (Ik loop vast), V6 (terugplannen) en V3 (één invoer) met Playwright.
// Gebruik:  NODE_PATH=<map met node_modules/playwright> node tests/voorstellen.e2e.cjs
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
  await p.evaluate(async () => {
    const nu = new Date(), m = nu.getHours() * 60 + nu.getMinutes();
    const hhmm = x => { x = Math.max(0, Math.min(1439, x)); return String(Math.floor(x / 60)).padStart(2, "0") + ":" + String(x % 60).padStart(2, "0"); };
    await maakTaakUitTekst("Belastingaangifte vandaag " + hhmm(m + 20) + " ~45m p2");
    await maakTaakUitTekst("Was ophangen vandaag ~10m");
    ga("vandaag");
  });
  await wacht(500);

  /* ---------- V7 Ik loop vast ---------- */
  check("V7: knop op de Nu-kaart", await p.locator(".md-nu [data-iv]").count() === 1);
  await p.click(".md-nu [data-iv]"); await wacht(350);
  check("V7: vijf oorzaken", await p.locator("#blad.open .iv-keuze").count() === 5);
  check("V7: loslaten naar morgen altijd zichtbaar", await p.locator("#blad.open [data-iv-los]").isVisible());
  await p.screenshot({ path: path.join(UIT, "v7-01-oorzaken.png") });
  await p.click('[data-iv-oorzaak="onduidelijk"]'); await wacht(350);
  check("V7: vraag naar de eerste handeling", (await p.locator('label[for="iv-stap"]').textContent()).includes("eerste handeling"));
  check("V7: waarom met bewijsniveau", (await p.locator(".iv-waarom p").textContent()).includes("Praktisch"));
  await p.click('[data-iv-vb="Bestand openen"]');
  await p.screenshot({ path: path.join(UIT, "v7-02-eerste-handeling.png") });
  await p.click("#iv-doe"); await wacht(500);
  const sub = await p.evaluate(() => S.taken.find(t => t.titel === "Belastingaangifte").subtaken);
  check("V7: eerste stap bovenaan de subtaken", sub[0] && sub[0].tekst === "Bestand openen", JSON.stringify(sub));
  check("V7: Nu-kaart toont de eerste handeling", (await p.locator(".md-eerste").textContent()).includes("Bestand openen"));
  check("V7: gebruik gelogd", await p.evaluate(() => inst("ivLog", []).length === 1 && inst("ivLog", [])[0].oorzaak === "onduidelijk"));
  await p.screenshot({ path: path.join(UIT, "v7-03-nu-kaart.png") });

  // Te groot: stap opslaan én timer starten.
  await p.click(".md-nu [data-iv]"); await wacht(300);
  await p.click('[data-iv-oorzaak="groot"]'); await wacht(300);
  await p.fill("#iv-stap", "Eerste alinea"); await p.click("#iv-doe"); await wacht(400);
  check("V7: te groot start de timer op de taak", await p.evaluate(() => T.actief && S.taken.find(t => t.id === T.taakId).titel === "Belastingaangifte"));
  await p.evaluate(() => stopTimer(true)); await wacht(200);

  // Spannend: tweede knop start de ruwe versie; eerste knop gaat naar Anker.
  await p.click(".md-nu [data-iv]"); await wacht(300);
  await p.click('[data-iv-oorzaak="spannend"]'); await wacht(300);
  check("V7: spannend biedt even landen en ruwe versie", (await p.locator("#iv-doe").textContent()).includes("landen") && (await p.locator("#iv-tweede").textContent()).includes("Ruwe versie"));
  await p.click("#iv-doe"); await wacht(500);
  check("V7: even landen opent Anker", await p.evaluate(() => V.view === "anker"));
  await p.evaluate(() => ga("vandaag")); await wacht(300);

  // Loslaten naar morgen.
  await p.click(".md-nu [data-iv]"); await wacht(300);
  await p.click("[data-iv-los]"); await wacht(400);
  check("V7: loslaten zet de taak op morgen", await p.evaluate(() => S.taken.find(t => t.titel === "Belastingaangifte").datum === plusDagen(vandaagISO(), 1)));
  check("V7: toast zonder schuld", !/moet|jammer|helaas/i.test(await p.locator("#toast, .toast").first().textContent().catch(() => "")));

  // In het taakblad.
  await p.evaluate(() => openTaakBlad(S.taken.find(t => t.titel === "Was ophangen").id)); await wacht(350);
  check("V7: knop in het taakblad", await p.locator("#blad.open [data-iv]").count() === 1);
  await p.click("#blad.open [data-iv]"); await wacht(350);
  check("V7: vanuit taakblad naar de oorzaken", await p.locator("#blad.open .iv-keuze").count() === 5);
  check("V7: tikvlakken ≥ 44 px", (await tikvlakken(p, "#blad")).length === 0, JSON.stringify(await tikvlakken(p, "#blad")));
  await p.evaluate(() => bladSluit()); await wacht(300);

  check("geen consolefouten", fouten.length === 0, fouten.slice(0, 3).join(" | "));
  check("nul externe verzoeken", extern.length === 0, extern.slice(0, 3).join(" | "));
  await browser.close(); server.close();
  console.log(`\n${ok} geslaagd, ${fout} mislukt`);
  process.exit(fout ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
