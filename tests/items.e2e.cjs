// Rooktest voor V1 fase 1: de gedeelde lijst op Mijn dag met Playwright.
// Gebruik:  NODE_PATH=<map met node_modules/playwright> node tests/items.e2e.cjs
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
  // Starttaken weg, zodat de volgorde voorspelbaar is.
  await p.evaluate(async () => {
    for (const t of S.taken.slice()) await verwijder("taken", t.id);
    const v = vandaagISO();
    await maakTaakUitTekst("Formulier invullen vandaag ~15m");
    const h = { id: uid(), naam: "Webshop", emoji: "", gemaakt: new Date().toISOString() };
    await bewaar("sh_hustles", h);
    const todo = { id: uid(), shId: h.id, naam: "Te doen", rol: "todo", volgorde: 1 }, klaar = { id: uid(), shId: h.id, naam: "Klaar", rol: "klaar", volgorde: 3 };
    await bewaar("sh_kolommen", todo); await bewaar("sh_kolommen", klaar);
    await bewaar("sh_kaarten", { id: "kaart1", shId: h.id, kolomId: todo.id, titel: "Productfoto's maken", deadline: plusDagen(v, -1), minuten: 30 });
    await bewaar("sh_kaarten", { id: "kaart2", shId: h.id, kolomId: todo.id, titel: "Later", deadline: plusDagen(v, 5) });
    await bewaar("hh_lijsten", { id: "bad", naam: "Badkamer", emoji: "🛁", ritme: 7, laatstGedaan: plusDagen(v, -10) + "T10:00:00.000Z", taken: [{ id: uid(), tekst: "Wastafel", ruimte: "Badkamer", min: 10, prio: "normaal", uit: false }], gemaakt: new Date().toISOString() });
    ga("vandaag");
  });
  await wacht(500);

  check("V1 fase 3: Dagring telt ook wat van buiten komt", await p.evaluate(() => /3 open/.test(document.querySelector(".fm-dr-sub").textContent)), await p.evaluate(() => document.querySelector(".fm-dr-sub").textContent));
  check("V1: SCRUM-kaart over de deadline staat bovenaan", (await p.locator(".md-nu h2").textContent()).includes("Productfoto's maken"));
  check("V1: met herkomst en deadline", (await p.locator(".md-nu .idx-bron").textContent()).includes("Webshop"));
  check("V1: daarna ook taak en huishouden", await p.evaluate(() => { const t = document.querySelector(".md-daarna").textContent; return /Formulier invullen/.test(t) && /Badkamer schoonmaken/.test(t); }));
  check("V1: kaart met deadline later niet", !(await p.locator(".md-nu").textContent()).includes("Later"));
  await p.screenshot({ path: path.join(UIT, "v1-01-nu-kaart.png") });
  await p.click('.md-nu [data-idx="klaar"]'); await wacht(400);
  check("V1: Klaar zet de kaart in de klaar-kolom", await p.evaluate(() => { const k = vind("sh_kaarten", "kaart1"); return S.sh_kolommen.find(x => x.id === k.kolomId).rol === "klaar"; }));
  // Via het bord: "Klaar" met Ongedaan, of de herinnering aan de Definition of Done.
  check("V1: via het bord (Ongedaan of Definition of Done)", /Ongedaan|Definition of Done/.test(await p.locator("#toast").textContent()));
  check("V1: daarna de taak op de Nu-kaart", (await p.locator(".md-nu h2").textContent()).includes("Formulier invullen"));
  await p.click('.md-nu [data-act="vink"]'); await wacht(400);
  await p.evaluate(() => { const v = document.querySelector(".dk-vraag [data-dk=weetniet]"); if (v) v.click(); }); await wacht(300);
  check("V1: huishoudlijst aan de beurt op de Nu-kaart", (await p.locator(".md-nu h2").textContent()).includes("Badkamer schoonmaken") && await p.locator('.md-nu [data-idx="start"]').count() === 1);
  await p.click('.md-nu [data-idx="start"]'); await wacht(400);
  check("V1: Start opent een huishoudsessie", await p.evaluate(() => document.querySelector("#blad.open") && /Badkamer|sessie/i.test(document.querySelector("#blad").textContent)));
  await p.evaluate(() => bladSluit()); await wacht(300);
  check("V1: tikvlakken ≥ 44 px", (await tikvlakken(p, ".md-nu")).length === 0, JSON.stringify(await tikvlakken(p, ".md-nu")));
  // Zelf kiezen
  await p.click('[data-md="widgets"]'); await wacht(350);
  check("V1: keuze 'Ook op Mijn dag' bij Widgets kiezen", await p.locator("#blad [data-idx-bron]").count() === 2);
  await p.click('#blad [data-idx-bron="huishouden"]'); await wacht(300);
  await p.evaluate(() => bladSluit()); await wacht(300);
  check("V1: uitgezet = niet op Mijn dag", await p.evaluate(() => !inst("idxBronnen").includes("huishouden") && !/Badkamer schoonmaken/.test(document.querySelector(".md-nu").textContent)));
  // Minimumdag neemt ze mee
  await p.evaluate(async () => { await zetInst("idxBronnen", ["shkaart", "huishouden"]); await zetInst("dnNiveau", { datum: vandaagISO(), niveau: "minimum" }); teken(); }); await wacht(300);
  check("V1: dagniveau Minimum werkt met de gedeelde lijst", await p.evaluate(() => mdNu().een && mdNu().een.id === "hh:bad"));
  // Alleen-werk-filter: geen huishouden of side hustle.
  await p.evaluate(async () => { await zetInst("dnNiveau", null); await zetInst("werkFilter", "alleen"); teken(); }); await wacht(300);
  check("V1: alleen werk = geen huishouden of side hustle", await p.evaluate(() => !mdLijst().some(x => x.extern)));
  await p.evaluate(async () => { await zetInst("werkFilter", "alles"); teken(); }); await wacht(200);
  // Geen dubbele huishoudsuggestie bij de voorstellen.
  check("V1: geen dubbel huishoudvoorstel", await p.evaluate(() => typeof vsVoorstellen !== "function" || !vsVoorstellen().some(x => x.k === "huishouden")));
  // Hustle zonder klaar-kolom: alleen Openen.
  await p.evaluate(async () => {
    for (const t of S.taken.filter(x => !x.af)) { t.af = true; t.afOp = new Date().toISOString(); await bewaar("taken", t); }
    await zetInst("idxBronnen", ["shkaart"]);
    const h = { id: uid(), naam: "Blog", gemaakt: new Date().toISOString() }; await bewaar("sh_hustles", h);
    const todo = { id: uid(), shId: h.id, naam: "Te doen", rol: "todo", volgorde: 1 }; await bewaar("sh_kolommen", todo);
    await bewaar("sh_kaarten", { id: "kaart3", shId: h.id, kolomId: todo.id, titel: "Post schrijven", deadline: plusDagen(vandaagISO(), -2) });
    teken();
  }); await wacht(400);
  check("V1: kaart zonder klaar-kolom: alleen Openen", await p.evaluate(() => /Post schrijven/.test(document.querySelector(".md-nu h2").textContent) && !document.querySelector('.md-nu [data-idx="klaar"]') && !!document.querySelector('.md-nu [data-idx="open"]')));
  // Zoeken
  await p.evaluate(() => { V.zoek = "webshop"; ga("zoeken"); }); await wacht(400);
  check("V1 fase 3: zoeken vindt SCRUM-kaarten (ook zonder deadline)", await p.evaluate(() => { const t = document.querySelector("#scherm").textContent; return /Uit andere modules/.test(t) && /Later/.test(t); }));
  await p.click('#scherm [data-idx="open"]'); await wacht(400);
  check("V1 fase 3: resultaat opent de module", await p.evaluate(() => V.view === "sh"));
  // Chat
  await p.evaluate(async () => { await zetInst("dnNiveau", null); ga("vandaag"); nateOpen(); }); await wacht(400);
  await p.fill("#nc-veld", "wat moet ik nu doen?"); await p.press("#nc-veld", "Enter"); await wacht(300);
  check("V1 fase 3: chat antwoordt met wat er nu aan de beurt is", await p.evaluate(() => { const l = [...document.querySelectorAll(".nc-nate")].pop(); return /^Nate: Nu: /.test(l.textContent.trim()) || /Nu: /.test(l.textContent); }));
  await p.evaluate(() => nateSluit && nateSluit()); await wacht(200);
  check("V1: alle open dingen uit alle modules (alleen lezen)", await p.evaluate(() => { const a = idxAlles(); return a.some(x => x.id === "sh:kaart2") && a.some(x => x.id === "hh:bad"); }));

  check("geen consolefouten", fouten.length === 0, fouten.slice(0, 3).join(" | "));
  check("nul externe verzoeken", extern.length === 0, extern.slice(0, 3).join(" | "));
  await browser.close(); server.close();
  console.log(`\n${ok} geslaagd, ${fout} mislukt`);
  process.exit(fout ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
