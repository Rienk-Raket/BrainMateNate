// Rooktest voor Alarmen plannen (sectie 108).
// Gebruik:  NODE_PATH=<map met node_modules/playwright> node tests/alarmen.e2e.cjs
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
  // Vaste klok (10:42), zodat tijden niet tegen middernacht aanlopen.
  const nieuw = async o => { const c = await browser.newContext(Object.assign({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, o || {})); await c.clock.setFixedTime(new Date(2026, 9, 2, 10, 42)); return c; };
  const tikvlakken = (p, b) => p.evaluate(b => [...document.querySelectorAll(`${b} button, ${b} [role=button], ${b} summary, ${b} a`)]
    .filter(el => el.offsetParent && !el.closest("svg") && !el.closest(".banner, .vw-verwant, .kp-verwant, .verwant")).map(el => [el.tagName + "." + el.className, el.offsetWidth, el.offsetHeight]).filter(([, w, h]) => w < 44 || h < 44), b || "#scherm");

  const ctx = await nieuw(), p = volg(await ctx.newPage());
  await p.goto(BASIS + "/"); await wacht(1500);
  await p.click('[data-kn="later"]'); await wacht(300);
  // Links naar Opdrachten opvangen in plaats van te openen.
  await p.evaluate(async () => {
    window.__urls = []; tpOpen = u => window.__urls.push(u);
    for (const a of S.afspraken.slice()) await verwijder("afspraken", a.id);
    const v = vandaagISO();
    await bewaar("afspraken", { id: "tand", titel: "Tandarts", datum: v, tijd: "14:00", eindTijd: "", plek: "Stationsweg 12", reistijd: 20, personen: [], soort: "gesprek", notities: "", uitkomst: "" });
    await bewaar("afspraken", { id: "kap", titel: "Kapper", datum: plusDagen(v, 2), tijd: "11:00", eindTijd: "", plek: "", reistijd: 0, personen: [], soort: "gesprek", notities: "", uitkomst: "" });
    ga("planning");
  });
  await wacht(400);
  check("Ingang: chip Alarmen in Planning", await p.evaluate(() => !!document.querySelector('#scherm .nv-chip[data-view="alarmen"]')));
  await p.click('#scherm .nv-chip[data-view="alarmen"]'); await wacht(400);
  check("Scherm Alarmen per dag: vandaag de keten van de tandarts", await p.evaluate(() => V.view === "alarmen" && /Vandaag/.test(document.querySelector("#scherm").textContent) && /NU jas aan en vertrekken naar Tandarts/.test(document.querySelector("#scherm").textContent)));
  check("Ook de afspraak over twee dagen", await p.evaluate(() => /Kapper/.test(document.querySelector("#scherm").textContent)));
  check("Zonder opdracht: eerst instellen", await p.evaluate(() => !!document.querySelector('#scherm .al-kop [data-tp="uitleg"]')));
  check("44px: Alarmen", (await tikvlakken(p)).length === 0, JSON.stringify(await tikvlakken(p)));

  // Eigen alarm met sjabloon Werkdagen
  await p.click("#scherm [data-al-eigen]"); await wacht(400);
  await p.fill("#al-titel", "NU medicijnen innemen"); await p.fill("#al-tijd", "08:00");
  await p.click('#blad [data-al-sjabloon="werkdagen"]'); await wacht(100);
  check("Sjabloon zet ma–vr aan en verbergt de datum", await p.evaluate(() => [...document.querySelectorAll("#blad [data-al-dag]")].map(b => b.getAttribute("aria-pressed")).join() === "true,true,true,true,true,false,false" && document.querySelector("#al-datumveld").hidden));
  check("44px: Eigen alarm", (await tikvlakken(p, "#blad")).length === 0, JSON.stringify(await tikvlakken(p, "#blad")));
  await p.click("#al-bewaar"); await wacht(500);
  check("Eigen alarm op de werkdagen van deze week", await p.evaluate(() => { const l = alPlanNu().filter(x => x.bron === "eigen"); return l.length >= 4 && l.every(x => alWeekdag(x.datum) < 5 && x.tijd === "08:00"); }));
  check("Rij toont 'Eigen · werkdagen'", await p.evaluate(() => /Eigen · werkdagen/.test(document.querySelector("#scherm").textContent)));

  // Opdracht instellen, dan alles in één keer doorgeven
  await p.evaluate(async () => { await zetInst("tpIngesteld", true); teken(); }); await wacht(300);
  const aantal = await p.evaluate(() => alTeVersturen(alPlanNu(), inst("alVerstuurd", {}), false).length);
  check("Knop telt wat nieuw is", await p.evaluate(n => new RegExp(`Naar Opdrachten \\(${n}\\)`).test(document.querySelector("#scherm [data-al-stuur]").textContent), aantal));
  await p.click('#scherm [data-al-stuur="nieuw"]'); await wacht(600);
  const u = await p.evaluate(() => window.__urls[0]);
  const payload = u ? JSON.parse(decodeURIComponent(u.split("&text=")[1])) : null;
  check("Eén link naar 'Nate alarmen' met alle alarmen", !!u && /^shortcuts:\/\/run-shortcut\?name=Nate%20alarmen&input=text&text=/.test(u) && payload.alarmen.length === aantal, u && u.slice(0, 80));
  check("Wekker alleen voor vertrekken vandaag", payload && payload.alarmen.filter(a => a.wekker === "ja").length === 1 && payload.alarmen.find(a => a.wekker === "ja").soort === "vertrekken");
  check("Daarna: alles staat al op je iPhone", await p.evaluate(() => /Alles staat al op je iPhone/.test(document.querySelector("#scherm").textContent) && document.querySelector('#scherm [data-al-stuur="nieuw"]').disabled));
  // Een tijd verandert: alleen dat gaat opnieuw
  await p.evaluate(async () => { const a = vind("afspraken", "kap"); a.tijd = "12:00"; await bewaar("afspraken", a); teken(); }); await wacht(300);
  check("Veranderde afspraak: alleen die alarmen opnieuw", await p.evaluate(() => { const l = alTeVersturen(alPlanNu(), inst("alVerstuurd", {}), false); return l.length > 0 && l.every(x => x.id === "kap"); }));
  // Uitzetten
  const k = await p.evaluate(() => document.querySelector("#scherm [data-al-schakel]").dataset.alSchakel);
  await p.click("#scherm [data-al-schakel]"); await wacht(300);
  check("Aan/uit per alarm", await p.evaluate(k => document.querySelector(`#scherm [data-al-schakel="${CSS.escape(k)}"]`).getAttribute("aria-pressed") === "false" && inst("alUit", {})[k] === true, k));
  // Knop op het afspraakscherm telt mee als doorgegeven
  await p.evaluate(() => ga("afspraak", "kap")); await wacht(400);
  check("Afspraakscherm: link naar alle alarmen", await p.evaluate(() => !!document.querySelector('#scherm .tp-kaart [data-view="alarmen"]')));
  await p.click('#scherm [data-tp="zet"]'); await wacht(400);
  check("Losse afspraak doorgegeven: telt ook in Alarmen", await p.evaluate(() => alTeVersturen(alPlanNu(), inst("alVerstuurd", {}), false).every(x => x.id !== "kap")));
  // Wijzigen en verwijderen
  await p.evaluate(() => ga("alarmen")); await wacht(300);
  await p.click('#scherm [data-al-open="eigen"]'); await wacht(400);
  check("Eigen alarm openen om te wijzigen", await p.evaluate(() => document.querySelector("#al-titel").value === "NU medicijnen innemen"));
  await p.click("#al-weg"); await wacht(400);
  check("Verwijderen", await p.evaluate(() => alEigen().length === 0));
  check("chat: 'alarmen' gaat naar Alarmen", await p.evaluate(() => JSON.stringify(ncBegrijp("alarmen", NATE_INTENTIES)).includes('"alarmen"')));

  check("geen consolefouten", fouten.length === 0, fouten.slice(0, 3).join(" | "));
  check("nul externe verzoeken", extern.length === 0, extern.slice(0, 3).join(" | "));
  await browser.close(); server.close();
  console.log(`\n${ok} geslaagd, ${fout} mislukt`);
  process.exit(fout ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
