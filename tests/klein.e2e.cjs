// Rooktest voor de kleine verbeteringen (sectie 97) met Playwright.
// Gebruik:  NODE_PATH=<map met node_modules/playwright> node tests/klein.e2e.cjs
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
  await p.evaluate(async () => { for (let i = 0; i < 6; i++) await maakTaakUitTekst("Taak " + i + " vandaag"); ga("vandaag"); });
  await wacht(400);

  check("2: geen back-upbanner op Mijn dag", await p.locator("#scherm .banner").count() === 0);
  check("2: back-up als bericht van Nate, naar Meer", await p.evaluate(() => meldingenSignalen().some(s => s.titel === "Tijd voor een back-up" && s.actieView === "meer")));
  check("2: ook als je vooral in het dagboek schrijft", await p.evaluate(async () => { for (const t of S.taken.slice()) await verwijder("taken", t.id); for (let i = 0; i < 5; i++) await bewaar("dagboek", { id: uid(), datum: plusDagen(vandaagISO(), -i), tekst: "x" }); const ok = meldingenSignalen().filter(s => s.titel === "Tijd voor een back-up").length === 1; for (let i = 0; i < 6; i++) await maakTaakUitTekst("Taak " + i + " vandaag"); return ok; }));
  check("5: geen 'Verder naar' op tabschermen", await p.locator("#scherm .verwant").count() === 0);
  await p.evaluate(() => ga("instellingen")); await wacht(400);
  check("15: 'Verder naar' gebruikt de namen van Meer", await p.evaluate(() => { const v = document.querySelector("#scherm .verwant"); return !!v && /Gegevens/.test(v.textContent) && !/Back-up|Uitleg/.test(v.textContent); }));

  await p.evaluate(() => { V.nwPad = []; ga("start"); }); await wacht(600);
  check("3: namen bij ingeklapte blokken in Vastleggen", await p.evaluate(() => { const n = [...document.querySelectorAll(".kv-strooknaam")]; return n.length >= 4 && n.every(x => x.textContent.trim() && getComputedStyle(x).opacity > 0.5); }));
  check("15: Toolbox heet Hulpmiddelen, ook voor schermlezers", await p.evaluate(() => { const s = document.querySelector("#scherm"); return !s.textContent.includes("Toolbox") && s.textContent.includes("Hulpmiddelen") && ![...s.querySelectorAll("[aria-label]")].some(x => /Toolbox/.test(x.getAttribute("aria-label"))); }));
  // Alleen de vaste knoop "Vandaag" (Mijn dag) wordt hernoemd; Vandaag in Gezondheid en Financieel blijft.
  check("15: Vandaag in Gezondheid en Financieel blijft Vandaag", await p.evaluate(() => { const vind = (l, f) => { for (const k of l) { if (f(k)) return k; const r = k.kids && vind(k.kids, f); if (r) return r; } return null; }; const b = nwlBoom();
    return vind(b, k => k.view === "vandaag" && !k.kids).naam === "Mijn dag" && vind(b, k => k.view === "gezondheid" && k.modus && k.modus[1] === "vandaag").naam === "Vandaag" && vind(b, k => k.id === "vandaag").naam === "Vandaag"; }));
  await p.screenshot({ path: path.join(UIT, "klein-01-vastleggen.png") });

  await p.evaluate(() => ga("instellingen")); await wacht(400);
  check("7: keuze voor Nate's rustplek in Instellingen", await p.locator("[data-kv-rust]").count() === 3);
  check("7: tikvlakken ≥ 44 px", await p.evaluate(() => [...document.querySelectorAll("[data-kv-rust]")].every(b => b.offsetHeight >= 44)));
  await p.click('[data-kv-rust="links"]'); await wacht(300);
  check("7: Nate links", await p.evaluate(() => document.documentElement.dataset.nateRust === "links" && document.querySelector("#nate").getBoundingClientRect().left < 50));
  await p.click('[data-kv-rust="uit"]'); await wacht(300);
  check("7: Nate verborgen, paneel nog via berichtenknop", await p.evaluate(() => getComputedStyle(document.querySelector("#nate")).display === "none" && !!document.querySelector("#inboxknop")));
  await p.click("#inboxknop"); await wacht(300);
  check("7: berichtenknop opent Nate", await p.evaluate(() => document.querySelector("#nate-paneel").classList.contains("open")));
  await p.evaluate(() => { nateSluit(); }); await p.click('[data-kv-rust="rechts"]'); await wacht(300);

  await p.evaluate(() => toast("Opgeslagen", "Bewerken", () => {})); await wacht(100);
  check("8: toast met knop blijft langer staan", await p.evaluate(async () => { await new Promise(r => setTimeout(r, 5600)); return document.querySelector("#toast").classList.contains("zicht"); }));
  await p.click("#toast span"); await wacht(300);
  check("8: tik op toast haalt hem weg", await p.evaluate(() => !document.querySelector("#toast").classList.contains("zicht")));

  await p.evaluate(() => ga("meer")); await wacht(300);
  check("9: Dagoverzicht weg uit Meer", await p.evaluate(() => !document.querySelector('#scherm [data-view="welkom"]')));

  // 13: weer opgepakt na een pauze
  await p.evaluate(async () => {
    const d = n => plusDagen(vandaagISO(), -n);
    for (const n of [12, 11, 6, 5, 0]) await bewaar("gebeurtenissen", { id: uid(), soort: "notitie", tekst: "x", datum: d(n), ts: d(n) + "T10:00:00.000Z" });
    vgOpen("overzicht");
  });
  await wacht(500);
  check("13: Voortgang begint met 'weer opgepakt'", await p.evaluate(() => { const k = document.querySelector(".kv-hervat"); return !!k && /2 keer/.test(k.textContent) && /vandaag, na 4 dagen pauze/.test(k.textContent); }));
  await p.screenshot({ path: path.join(UIT, "klein-02-voortgang.png") });
  await p.evaluate(() => vgSluit && vgSluit()); await wacht(300);

  // 10: microstap met knoppen
  await p.evaluate(async () => {
    const a = {};
    for (const q of NATE_VRAGENBANK.questions) if (q.assessment_part === "A" && q.question_id.endsWith(".Q1")) a[q.question_id] = "never";
    for (const d of ["A4.1", "A4.2"]) { a[d + ".Q1"] = "very_often"; a[d + ".Q2"] = "very_often"; }
    await knZet({ antwoorden: a, klaar: true }); ga("profiel");
  });
  await wacht(500);
  check("10: microstap met knoppen naar de module", await p.evaluate(() => document.querySelectorAll(".kv-module").length >= 1 && !/Past bij:/.test(document.querySelector("#scherm").textContent)));
  check("tikvlakken ≥ 44 px (profiel)", (await tikvlakken(p, ".kv-modules")).length === 0, JSON.stringify(await tikvlakken(p, ".kv-modules")));
  const doel = await p.evaluate(() => document.querySelector(".kv-module").dataset.view);
  await p.click(".kv-module"); await wacht(400);
  check("10: knop opent de module", await p.evaluate(d => V.view === d, doel), doel);

  check("geen consolefouten", fouten.length === 0, fouten.slice(0, 3).join(" | "));
  check("nul externe verzoeken", extern.length === 0, extern.slice(0, 3).join(" | "));
  await browser.close(); server.close();
  console.log(`\n${ok} geslaagd, ${fout} mislukt`);
  process.exit(fout ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
