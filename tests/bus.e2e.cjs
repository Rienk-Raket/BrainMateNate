// Rooktest voor V1 fase 2: de gebeurtenisbus met Playwright.
// Gebruik:  NODE_PATH=<map met node_modules/playwright> node tests/bus.e2e.cjs
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
  const namen = () => p.evaluate(() => bus.laatste().map(e => e.naam));

  const tid = await p.evaluate(async () => { const t = await maakTaakUitTekst("Rekening betalen vandaag ~10m"); await vinkTaak(t.id); return t.id; });
  let n = await namen();
  check("bus: taak.voorKlaar en taak.klaar bij afvinken", n.includes("taak.voorKlaar") && n.includes("taak.klaar"), n.join(","));
  check("bus: logboekregel als gebeurtenis", await p.evaluate(() => bus.laatste().some(e => e.naam === "log" && e.data.soort === "taak")));
  await p.evaluate(id => vinkTaak(id), tid);
  check("bus: taak.heropend bij ongedaan", (await namen()).includes("taak.heropend"));
  await p.evaluate(async () => { await dcBewaar({ checkinTs: new Date().toISOString(), energieNr: 2, energie: "laag" }); });
  n = await namen();
  check("bus: checkin en energie.laag", n.includes("checkin") && n.includes("energie.laag"));
  check("bus: subtaak.vink zet het tijdstip (Ik loop vast luistert)", await p.evaluate(() => { const l = [{ tekst: "a", af: false }]; subVink(l, 0); return !!l[0].afOp && bus.laatste().some(e => e.naam === "subtaak.vink"); }));
  // Luisteraars in plaats van omwikkelen: duurkalibratie luistert naar de taak-gebeurtenissen.
  check("bus: duurkalibratie luistert", await p.evaluate(() => bus.aantal("taak.voorKlaar") >= 1 && bus.aantal("taak.klaar") >= 1 && bus.aantal("taak.heropend") >= 1 && bus.aantal("afspraak.geweest") >= 1));
  // Een kapotte luisteraar breekt afvinken niet.
  const afgevinkt = await p.evaluate(async () => { const stop = bus.on("taak.klaar", () => { throw new Error("test"); }); const t = await maakTaakUitTekst("Nog iets vandaag"); await vinkTaak(t.id); stop(); return vind("taken", t.id).af; });
  check("bus: fout in een luisteraar breekt afvinken niet", afgevinkt);
  // SCRUM-kaart naar klaar
  await p.evaluate(async () => {
    const h = { id: uid(), naam: "Webshop", gemaakt: new Date().toISOString() }; await bewaar("sh_hustles", h);
    const todo = { id: uid(), shId: h.id, naam: "Te doen", rol: "todo", volgorde: 1 }, klaar = { id: uid(), shId: h.id, naam: "Klaar", rol: "klaar", volgorde: 2 };
    await bewaar("sh_kolommen", todo); await bewaar("sh_kolommen", klaar);
    await bewaar("sh_kaarten", { id: "k1", shId: h.id, kolomId: todo.id, titel: "Logo" });
    await shKaartNaarRol("k1", "klaar");
  });
  check("bus: shkaart.klaar", (await namen()).includes("shkaart.klaar"));
  const tel = naam => p.evaluate(n => bus.laatste().filter(e => e.naam === n).length, naam);
  const voorKaart = await tel("shkaart.klaar");
  await p.evaluate(() => shKaartNaarRol("k1", "klaar"));
  check("bus: geen shkaart.klaar als de kaart al klaar was", (await tel("shkaart.klaar")) === voorKaart);
  await p.evaluate(async () => { const k = vind("sh_kaarten", "k1"); const todo = S.sh_kolommen.find(x => x.shId === k.shId && x.rol === "todo"); k.kolomId = todo.id; await bewaar("sh_kaarten", k); await sesShKaartKlaar("k1"); });
  check("bus: ook via sessie (sesShKaartKlaar)", (await tel("shkaart.klaar")) === voorKaart + 1);
  // Ongedaan via de toast meldt taak.heropend.
  const voorHer = await tel("taak.heropend");
  await p.evaluate(async () => { const t = await maakTaakUitTekst("Plant water geven vandaag"); await vinkTaak(t.id); });
  await wacht(200); await p.click("#toast button"); await wacht(400);
  check("bus: Ongedaan in de melding geeft taak.heropend", (await tel("taak.heropend")) === voorHer + 1);
  // Wijzig check-in: niet opnieuw 'eerste'.
  await p.evaluate(async () => { await dcBewaar({ checkinTs: new Date().toISOString(), stemming: 3 }); });
  check("bus: tweede check-in is niet de eerste, geen energie.laag zonder nieuwe keuze", await p.evaluate(() => { const l = bus.laatste(), c = l.filter(e => e.naam === "checkin"); return c[c.length - 1].data.eerste === false && l[l.length - 1].naam !== "energie.laag"; }));
  // Geblokkeerde taak: geen voorKlaar.
  const voorVk = await tel("taak.voorKlaar");
  await p.evaluate(async () => { const a = await maakTaakUitTekst("Eerst dit vandaag"); const b = await maakTaakUitTekst("Dan dat vandaag"); b.hangtAf = [a.id]; await bewaar("taken", b); await vinkTaak(b.id); });
  check("bus: geen taak.voorKlaar bij een taak die nog wacht", (await tel("taak.voorKlaar")) === voorVk);
  // Fouten van de test-luisteraar tellen niet als consolefout van de app.
  const echt = fouten.filter(f => !/test/.test(f));
  check("geen consolefouten", echt.length === 0, echt.slice(0, 3).join(" | "));
  check("nul externe verzoeken", extern.length === 0, extern.slice(0, 3).join(" | "));
  await browser.close(); server.close();
  console.log(`\n${ok} geslaagd, ${fout} mislukt`);
  process.exit(fout ? 1 : 0);

})().catch(e => { console.error(e); process.exit(1); });
