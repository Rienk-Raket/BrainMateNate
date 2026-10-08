// Rooktest voor V13–V15 (voorspelbaarheid, lezen, nieuwe kennis) en de hulp bij Nate alarmen.
// Gebruik:  NODE_PATH=<map met node_modules/playwright> node tests/inclusief.e2e.cjs
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
  // Vaste klok 's avonds (18:10): dan staat de kaart Morgen in het kort op Mijn dag.
  const nieuw = async o => { const c = await browser.newContext(Object.assign({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, o || {})); await c.clock.setFixedTime(new Date(2026, 9, 2, 18, 10)); return c; };
  const tikvlakken = (p, b) => p.evaluate(b => [...document.querySelectorAll(`${b} button, ${b} [role=button], ${b} summary, ${b} a`)]
    .filter(el => el.offsetParent && !el.closest("svg") && !el.closest(".banner, .vw-verwant, .kp-verwant, .verwant")).map(el => [el.tagName + "." + el.className, el.offsetWidth, el.offsetHeight]).filter(([, w, h]) => w < 44 || h < 44), b || "#scherm");

  const ctx = await nieuw(), p = volg(await ctx.newPage());
  await p.addInitScript(() => {
    // Voorlezen opvangen in plaats van te spreken.
    window.__gezegd = [];
    const nep = { speak: u => { window.__gezegd.push(u.text); setTimeout(() => u.onend && u.onend(), 10); }, cancel: () => {}, getVoices: () => [{ lang: "nl-NL", name: "Xander" }] };
    Object.defineProperty(window, "speechSynthesis", { value: nep, configurable: true });
    window.SpeechSynthesisUtterance = function (t) { this.text = t; };
  });
  await p.goto(BASIS + "/"); await wacht(1500);
  await p.click('[data-kn="later"]'); await wacht(300);
  await p.evaluate(async () => { for (const t of S.taken.slice()) await verwijder("taken", t.id); for (const a of S.afspraken.slice()) await verwijder("afspraken", a.id); ga("aanpak"); });
  await wacht(400);

  // Mijn aanpak: de nieuwe schakelaars en de leesbare kennis
  check("V13–15: zes nieuwe schakelaars in Mijn aanpak", await p.evaluate(() => ["morgen", "prikkels", "voorlezen", "ruim", "groot", "kennis"].every(id => document.querySelector(`#scherm [data-ap="${id}"]`))));
  check("V15: nieuwe kennis is te lezen, met 'concept'", await p.evaluate(() => { const d = document.querySelector("#scherm .ka-lees"); return d && d.querySelectorAll(".ka-domein").length === 6 && /nagekeken/.test(d.textContent); }));
  check("V15: staat standaard uit (Nate gebruikt alleen de basis)", await p.evaluate(() => NATE_ADHD.domeinen.length === 8));
  await p.click('#scherm [data-ap="kennis"]'); await wacht(300);
  check("V15: aan → Nate kan uit 14 domeinen kiezen", await p.evaluate(() => NATE_ADHD.domeinen.length === 14 && NATE_ADHD.domeinen.some(d => d.id === "prikkels" && d.concept)));
  await p.click('#scherm [data-ap="kennis"]'); await wacht(300);
  check("V15: weer uit", await p.evaluate(() => NATE_ADHD.domeinen.length === 8));
  check("44px: Mijn aanpak", (await tikvlakken(p)).length === 0, JSON.stringify(await tikvlakken(p)));

  // V14: ruime en grotere tekst
  await p.click('#scherm [data-ap="ruim"]'); await wacht(300);
  check("V14: ruime tekst aan", await p.evaluate(() => document.documentElement.dataset.ruim === "1" && parseFloat(getComputedStyle(document.querySelector("#scherm p")).letterSpacing) > 0));
  await p.click('#scherm [data-ap="groot"]'); await wacht(300);
  check("V14: grotere tekst aan", await p.evaluate(() => document.documentElement.dataset.tekst === "groot"));
  await p.click('#scherm [data-ap="groot"]'); await wacht(300);
  check("V14: grotere tekst uit → terug naar normaal", await p.evaluate(() => document.documentElement.dataset.tekst === "normaal"));
  await p.click('#scherm [data-ap="ruim"]'); await wacht(300);
  check("V14: ruime tekst uit", await p.evaluate(() => document.documentElement.dataset.ruim === "0"));

  // V14: voorlezen
  await p.click('#scherm [data-ap="voorlezen"]'); await wacht(400);
  check("V14: luidspreker bij elke 'Waarom zeg je dit?'", await p.evaluate(() => document.querySelectorAll("#scherm .iv-waarom > p .lz-lees").length >= 6));
  await p.evaluate(() => { document.querySelector("#scherm .ap-rij .iv-waarom").open = true; }); await wacht(100);
  await p.click("#scherm .ap-rij .iv-waarom > p .lz-lees"); await wacht(100);
  check("V14: leest de uitleg voor, zonder knoplabels", await p.evaluate(() => window.__gezegd.length === 1 && /Een scherm dat steeds hetzelfde is/.test(window.__gezegd[0]) && !/Lees voor/.test(window.__gezegd[0])));
  await p.evaluate(() => { ga("vandaag"); nateOpen(); }); await wacht(400);
  await p.fill("#nc-veld", "hoi"); await p.press("#nc-veld", "Enter"); await wacht(400);
  check("V14: luidspreker ook in de chat", await p.evaluate(() => !!document.querySelector(".nc-nate .lz-lees")));
  await p.evaluate(() => nateSluit && nateSluit()); await wacht(200);

  // V13: Morgen in het kort
  await p.evaluate(async () => {
    const m = plusDagen(vandaagISO(), 1), a = (id, titel, datum, tijd, extra) => bewaar("afspraken", Object.assign({ id, titel, datum, tijd, eindTijd: "", plek: "", personen: [], soort: "gesprek", notities: "", uitkomst: "", gemaakt: new Date().toISOString() }, extra));
    await a("tand", "Tandarts", m, "09:00", { eindTijd: "09:45", plek: "Stationsweg 12" });
    await a("lunch", "Lunch met Sam", m, "12:30", { personen: ["Sam"] });
    ga("aanpak");
  });
  await wacht(300);
  await p.click('#scherm [data-ap="morgen"]'); await wacht(200);
  await p.click('#scherm [data-ap="prikkels"]'); await wacht(200);
  await p.evaluate(() => ga("vandaag")); await wacht(400);
  check("V13: 's avonds Morgen in het kort op Mijn dag", await p.evaluate(() => { const k = document.querySelector("#scherm .vb-morgenkaart"); return k && /Tandarts/.test(k.textContent) && /Stationsweg/.test(k.textContent) && !/veranderd/.test(k.textContent); }));
  check("V13: eerste blik is de foto", await p.evaluate(() => !!(inst("vbFotos", {})[plusDagen(vandaagISO(), 1)] || {})["afspraak:tand"]));
  await p.evaluate(async () => { const a = vind("afspraken", "tand"); a.tijd = "10:00"; a.eindTijd = "10:45"; await bewaar("afspraken", a);
    await bewaar("afspraken", { id: "bel", titel: "Gemeente bellen", datum: plusDagen(vandaagISO(), 1), tijd: "15:00", eindTijd: "", plek: "", personen: [], soort: "gesprek", notities: "", uitkomst: "" }); teken(); });
  await wacht(400);
  check("V13: kaart meldt wat veranderd is", await p.evaluate(() => /2 dingen zijn veranderd/.test(document.querySelector("#scherm .vb-morgenkaart").textContent)));
  await p.click('#scherm .vb-morgenkaart [data-view="morgen"]'); await wacht(500);
  check("V13: scherm Morgen, wijzigingen bovenaan", await p.evaluate(() => { const s = document.querySelector("#scherm"), v = s.querySelector(".vb-veranderd"); return v && s.firstElementChild === v.closest("#scherm > *") && /Nieuw/.test(v.textContent) && /Gemeente bellen/.test(v.textContent) && /Anders/.test(v.textContent) && /was 09:00/.test(v.textContent); }));
  check("V13: per item duur, plek, met wie en wat daarna", await p.evaluate(() => { const t = document.querySelector("#scherm .vb-lijst").textContent; return /10:00–10:45/.test(t) && /45 min/.test(t) && /met Sam/.test(t) && /Daarna: Lunch met Sam om 12:30/.test(t) && /Daarna niets meer gepland/.test(t); }));
  check("44px: Morgen", (await tikvlakken(p)).length === 0, JSON.stringify(await tikvlakken(p)));
  await p.click("#scherm [data-vb-gezien]"); await wacht(400);
  check("V13: Gezien → melding weg", await p.evaluate(() => !document.querySelector("#scherm .vb-veranderd")));
  check("chat: 'wat komt er morgen' gaat naar Morgen", await p.evaluate(() => JSON.stringify(ncBegrijp("wat komt er morgen", NATE_INTENTIES)).includes('"morgen"')));

  // V13: prikkels en rustblok
  await p.evaluate(async () => {
    const v = vandaagISO(), a = (id, tijd, wie) => bewaar("afspraken", { id, titel: "Bezoek " + id, datum: v, tijd, eindTijd: "", plek: "", personen: [wie], soort: "gesprek", notities: "", uitkomst: "" });
    await a("x1", "09:00", "Ana"); await a("x2", "13:00", "Bo"); await a("x3", "18:30", "Cas"); ga("vandaag");
  });
  await wacht(400);
  check("V13: teller momenten met mensen", await p.evaluate(() => /3 keer met mensen/.test(document.querySelector("#scherm .vb-prikkels").textContent)));
  check("V13: bij drie keer mensen een rustblok voorstellen", await p.evaluate(() => !!document.querySelector('#scherm .vb-prikkels [data-vb-rust]')));
  await p.click('#scherm [data-vbp="veel"]'); await wacht(300);
  check("V13: prikkels 'veel' gekozen", await p.evaluate(() => document.querySelector('#scherm [data-vbp="veel"]').getAttribute("aria-checked") === "true" && /Veel prikkels/.test(document.querySelector("#scherm .vb-prikkels").textContent)));
  check("44px: Mijn dag", (await tikvlakken(p)).length === 0, JSON.stringify(await tikvlakken(p)));
  await p.click('#scherm .vb-prikkels [data-vb-rust]'); await wacht(500);
  check("V13: rustblok ingepland in een vrij gat (19:00, na het bezoek van 18:30)", await p.evaluate(() => { const t = S.taken.find(x => x.rustblok); return t && t.tijd === "19:00" && t.duur === 20 && t.datum === vandaagISO(); }), await p.evaluate(() => JSON.stringify(S.taken.find(x => x.rustblok))));
  check("V13: daarna 'Je rustblok staat om …'", await p.evaluate(() => /Je rustblok staat om 19:00/.test(document.querySelector("#scherm .vb-prikkels").textContent)));

  // Nate alarmen: hulp bij problemen
  await p.evaluate(() => tpUitleg(null)); await wacht(400);
  check("Alarmen: 'Werkt het niet?' met de invoertest", await p.evaluate(() => [...document.querySelectorAll("#blad summary")].some(s => /Werkt het niet/.test(s.textContent)) && /Toon resultaat/.test(document.querySelector("#blad").textContent)));

  check("geen consolefouten", fouten.length === 0, fouten.slice(0, 3).join(" | "));
  check("nul externe verzoeken", extern.length === 0, extern.slice(0, 3).join(" | "));
  await browser.close(); server.close();
  console.log(`\n${ok} geslaagd, ${fout} mislukt`);
  process.exit(fout ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
