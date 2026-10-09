// Rooktest voor de samenvoegingen (sectie 107): Inbox, Planning-zoom, Terugkijken, Vastlopen.
// Gebruik:  NODE_PATH=<map met node_modules/playwright> node tests/samen.e2e.cjs
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
  const pers = async sel => p.evaluate(s => { const b = document.querySelector(s); return b && b.getAttribute("aria-pressed") === "true"; }, sel);

  // 1. Eén Inbox
  await p.evaluate(async () => { await meldingMaak && meldingMaak({ titel: "Testbericht", tekst: "Hallo", soort: "info" }).catch(() => {}); ga("meldingen"); });
  await wacht(400);
  check("Inbox: 'meldingen' wordt Inbox › Van Nate", await p.evaluate(() => V.view === "inbox") && await pers('#scherm [data-sm="inbox"][data-k="nate"]'));
  check("Inbox: berichten staan erin", await p.evaluate(() => /Berichten/.test(document.querySelector("#scherm").textContent)));
  check("44px: Inbox (Van Nate)", (await tikvlakken(p)).length === 0, JSON.stringify(await tikvlakken(p)));
  await p.click('#scherm [data-sm="inbox"][data-k="indelen"]'); await wacht(300);
  check("Inbox: Nog indelen toont de takenlijst", await pers('#scherm [data-sm="inbox"][data-k="indelen"]') && await p.evaluate(() => /Inbox/.test(document.querySelector("#scherm .sectie").textContent)));
  await p.evaluate(() => ga("meer")); await wacht(400);
  check("Meer: één Inbox-regel, Terugkijken erbij, oude regels weg", await p.evaluate(() => { const t = document.querySelector("#scherm").textContent; return !/Nate’s berichten/.test(t) && /Terugkijken/.test(t) && !/>Logboek</.test(document.querySelector("#scherm").innerHTML); }));

  // 2. Planning: Morgen · Week · Maand
  await p.evaluate(async () => { await bewaar("afspraken", { id: "t1", titel: "Tandarts", datum: plusDagen(vandaagISO(), 1), tijd: "09:00", eindTijd: "09:45", plek: "Stationsweg", personen: [], soort: "gesprek", notities: "", uitkomst: "" }); ga("planning"); });
  await wacht(400);
  check("Planning: drie zoomstanden, Week staat aan", await p.evaluate(() => document.querySelectorAll('#scherm [data-sm="planning"]').length === 3) && await pers('#scherm [data-sm="planning"][data-k="week"]'));
  check("Planning: chips Kalender en Overzicht weg", await p.evaluate(() => !document.querySelector('#scherm .nv-chip[data-view="kalender"], #scherm .nv-chip[data-view="overzicht"]')));
  await p.click('#scherm [data-sm="planning"][data-k="morgen"]'); await wacht(400);
  check("Planning › Morgen: Morgen in het kort", await p.evaluate(() => /Tandarts/.test(document.querySelector("#scherm .vb-lijst").textContent) && /Stationsweg/.test(document.querySelector("#scherm").textContent)));
  check("44px: Planning › Morgen", (await tikvlakken(p)).length === 0, JSON.stringify(await tikvlakken(p)));
  await p.click('#scherm [data-sm="planning"][data-k="maand"]'); await wacht(400);
  check("Planning › Maand: geen dode knoppen naar Kalender of Komend", await p.evaluate(() => !document.querySelector('#scherm [data-view="kalender"], #scherm [data-view="komend"]') && document.querySelectorAll("#scherm .ov-staaf").length === 14));
  check("44px: Planning › Maand", (await tikvlakken(p)).length === 0, JSON.stringify(await tikvlakken(p)));
  check("Planning › Maand: kalender en komende 14 dagen", await p.evaluate(() => document.querySelectorAll("#scherm .kal-dag").length >= 28 && /Komende 14 dagen/.test(document.querySelector("#scherm").textContent)));
  await p.click('#scherm [data-act="kal-maand"][data-n="1"]'); await wacht(300);
  check("Planning › Maand: bladeren werkt en blijft in Maand", await p.evaluate(() => V.view === "planning" && V.plZoom === "maand" && /november/i.test(document.querySelector("#scherm").textContent)), await p.evaluate(() => JSON.stringify([V.view, V.plZoom, V.kalDatum])));
  await p.evaluate(() => ga("vandaag")); await wacht(200);
  await p.evaluate(() => ga("kalender")); await wacht(300);
  check("Doorsturen: kalender → Planning › Maand", await p.evaluate(() => V.view === "planning" && V.plZoom === "maand"));
  await p.evaluate(() => { ga("vandaag"); ga("morgen"); }); await wacht(300);
  check("Morgen vanaf Mijn dag: eigen scherm met Terug", await p.evaluate(() => V.view === "morgen" && V.stapel.length > 0));
  await p.evaluate(() => { V.plZoom = "maand"; ga("vandaag"); ga("planning"); }); await wacht(300);
  check("Planning-tab opent altijd op Week", await p.evaluate(() => V.plZoom === "week"));
  await p.evaluate(() => ga("komend")); await wacht(300);
  check("Doorsturen: komend → Planning › Week", await p.evaluate(() => V.view === "planning" && V.plZoom === "week" && !!document.querySelector("#scherm .dagkop")));

  // 3. Terugkijken
  await p.evaluate(async () => { await logGebeurtenis("notitie", "Testregel in het logboek"); ga("vandaag"); ga("dagboek"); });
  await wacht(400);
  check("Terugkijken › Dag: tijden in lokale tijd", await p.evaluate(() => { const g = S.gebeurtenissen.find(x => x.tekst === "Testregel in het logboek"), d = new Date(g.ts);
    return document.querySelector("#scherm .sm-log").textContent.includes(pad(d.getHours()) + ":" + pad(d.getMinutes()) + " Testregel"); }));
  check("Terugkijken › Dag: stemming, wat je deed, heel logboek", await p.evaluate(() => V.view === "terugkijken" && !!document.querySelector('#scherm [data-act="stemming"]') && /Testregel in het logboek/.test(document.querySelector("#scherm .sm-log").textContent) && !!document.querySelector('#scherm [data-view="logboek"]')));
  check("Terugkijken › Dag: 'wat je deed' staat vóór de eerdere notities", await p.evaluate(() => { const h = document.querySelector("#scherm").innerHTML; return h.indexOf("sm-log") < (h.indexOf("Eerder") < 0 ? 1e9 : h.indexOf("Eerder")); }));
  check("44px: Terugkijken › Dag", (await tikvlakken(p)).length === 0, JSON.stringify(await tikvlakken(p)));
  await p.click('#scherm [data-view="logboek"]'); await wacht(300);
  check("Heel logboek blijft een detailscherm met Terug", await p.evaluate(() => V.view === "logboek" && V.stapel.length > 0));
  await p.evaluate(() => { V.tkModus = "week"; terug(); }); await wacht(300);
  check("Terug brengt je naar Terugkijken in de stand waarin je wegging (Dag)", await p.evaluate(() => V.view === "terugkijken" && V.tkModus === "dag"));
  await p.click('#scherm [data-sm="terugkijken"][data-k="week"]'); await wacht(400);
  check("Terugkijken › Week: weekreview en cijfers", await p.evaluate(() => /Je week in cijfers/.test(document.querySelector("#scherm").textContent) && !!document.querySelector("#scherm .stats")));
  await p.click('#scherm [data-act="ov-schuif"][data-n="-7"]'); await wacht(300);
  check("Terugkijken › Week: vorige week bladeren blijft in Terugkijken", await p.evaluate(() => V.view === "terugkijken" && V.tkModus === "week"));
  await p.evaluate(() => { ga("vandaag"); ga("weekreview"); }); await wacht(300);
  check("Doorsturen: weekreview → Terugkijken › Week", await p.evaluate(() => V.view === "terugkijken" && V.tkModus === "week"));

  // 4. Vastlopen
  await p.evaluate(async () => { const t = await maakTaakUitTekst("Belasting vandaag"); window.__t = t.id; ga("vandaag"); ivOpen(t.id); });
  await wacht(500);
  check("Vastlopen: zes keuzes, met 'Kan niet kiezen'", await p.evaluate(() => document.querySelectorAll("#blad [data-iv-oorzaak]").length === 6 && !!document.querySelector('#blad [data-iv-oorzaak="kiezen"]')));
  check("44px: Ik loop vast", (await tikvlakken(p, "#blad")).length === 0, JSON.stringify(await tikvlakken(p, "#blad")));
  await p.click('#blad [data-iv-oorzaak="onduidelijk"]'); await wacht(400);
  check("Vastlopen: Onduidelijk bij een vage taak geeft passende suggesties", await p.evaluate(() => [...document.querySelectorAll("#blad [data-iv-vb]")].some(b => /Inlogpagina openen/.test(b.textContent))));
  await p.click('#blad [data-iv-vb="Inlogpagina openen"]'); await p.click("#iv-doe"); await wacht(500);
  check("Vastlopen: eerste handeling telt ook voor de werkwoordcheck", await p.evaluate(() => { const t = vind("taken", window.__t); return t.wwGevraagd === true && t.subtaken[0].tekst === "Inlogpagina openen"; }));
  await p.evaluate(() => ivOpen(window.__t)); await wacht(400);
  await p.click('#blad [data-iv-oorzaak="kiezen"]'); await wacht(400);
  await p.click("#iv-doe"); await wacht(500);
  check("Vastlopen: Kan niet kiezen → Keuzemachine (eerst de uitsteltest)", await p.evaluate(() => V.view === "keuze" && V.smKiesTaak === window.__t));
  // Met een profiel: dilemma met de taak als A; besluit B wordt de eerste stap, de taak blijft open.
  await p.evaluate(async () => { const l = { id: uid(), klaar: true, afgerond: new Date().toISOString(), antwoorden: {}, scores: {}, primair: "perfectionist", secundair: null, soort: "laag", signalen: [] }; await kmBewaarProfiel(l); await smKiezenVoor(vind("taken", window.__t)); });
  await wacht(400);
  check("Kiezen voor een taak: dilemma met de taak als optie A", await p.evaluate(() => { const d = vind("km_dilemmas", V.param); return V.view === "keuzedilemma" && d && d.a.titel === "Belasting" && d.bron.module === "taak"; }), await p.evaluate(() => JSON.stringify([V.view, (vind("km_dilemmas", V.param) || {}).a])));
  await p.evaluate(async () => { const d = vind("km_dilemmas", V.param); d.b.titel = "Eerst de toeslag regelen"; await kmBesluit(d, "B", 3); });
  await wacht(400);
  check("Besluit: gekozen optie is de eerste stap, taak blijft open", await p.evaluate(() => { const t = vind("taken", window.__t); return !t.af && t.subtaken[0].tekst === "Eerst de toeslag regelen"; }));

  check("geen consolefouten", fouten.length === 0, fouten.slice(0, 3).join(" | "));
  check("nul externe verzoeken", extern.length === 0, extern.slice(0, 3).join(" | "));
  await browser.close(); server.close();
  console.log(`\n${ok} geslaagd, ${fout} mislukt`);
  process.exit(fout ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
