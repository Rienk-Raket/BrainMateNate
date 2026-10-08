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
  check("V7: waarom met bewijsniveau", (await p.locator("#blad .iv-waarom p").textContent()).includes("Praktisch"));
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
  check("V7: loslaten heft oud uitstel op", await p.evaluate(() => !S.taken.find(t => t.titel === "Belastingaangifte").uitgesteldTot));
  check("V7: toast zonder schuld", !/moet|jammer|helaas/i.test(await p.locator("#toast, .toast").first().textContent().catch(() => "")));

  // In het taakblad.
  await p.evaluate(() => openTaakBlad(S.taken.find(t => t.titel === "Was ophangen").id)); await wacht(350);
  check("V7: knop in het taakblad", await p.locator("#blad.open [data-iv]").count() === 1);
  await p.click("#blad.open [data-iv]"); await wacht(350);
  check("V7: vanuit taakblad naar de oorzaken", await p.locator("#blad.open .iv-keuze").count() === 5);
  check("V7: tikvlakken ≥ 44 px", (await tikvlakken(p, "#blad")).length === 0, JSON.stringify(await tikvlakken(p, "#blad")));
  await p.evaluate(() => bladSluit()); await wacht(300);

  /* ---------- V6 Terugplannen en Opdrachten-brug ---------- */
  const aid = await p.evaluate(async () => {
    const a = { id: uid(), titel: "Tandarts", soort: "gesprek", datum: vandaagISO(), tijd: "14:00", eindTijd: "14:45", plek: "Stationsweg 12", personen: [], voorbereiding: "", notities: "", uitkomst: "", reistijd: 25, buffer: 10, gemaakt: new Date().toISOString() };
    await bewaar("afspraken", a); window.__urls = []; tpOpen = u => window.__urls.push(u); ga("vandaag"); return a.id;
  });
  await wacht(400);
  check("V6: tijdlijn toont stoppen en voorbereiden", await p.evaluate(() => { const t = [...document.querySelectorAll(".md-tijdlijn .md-item")].map(x => x.textContent.replace(/\s+/g, " ")); return t.some(x => x.includes("13:10") && x.includes("Stoppen")) && t.some(x => x.includes("13:15") && x.includes("Voorbereiden")) && t.some(x => x.includes("13:25") && x.includes("Vertrekken")); }));
  await p.evaluate(id => ga("afspraak", id), aid); await wacht(400);
  check("V6: keten op het afspraakscherm (3 momenten + begin)", await p.locator(".tp-keten li").count() === 4);
  await p.screenshot({ path: path.join(UIT, "v6-01-afspraak.png") });
  await p.click('[data-tp="zet"]'); await wacht(350);
  check("V6: eerste keer: uitleg, stappenplan en 'Werkt het niet?'", await p.locator("#blad.open .tp-recept").count() === 2);
  check("V6: wekker staat standaard aan", (await p.getAttribute("#tp-wekker", "aria-pressed")) === "true");
  await p.click("#tp-recept summary, .tp-recept summary").catch(() => {});
  await p.screenshot({ path: path.join(UIT, "v6-02-uitleg.png") });
  check("V6: tikvlakken in de uitleg ≥ 44 px", (await tikvlakken(p, "#blad")).length === 0, JSON.stringify(await tikvlakken(p, "#blad")));
  await p.click("#tp-klaar"); await wacht(500);
  const urls = await p.evaluate(() => window.__urls);
  check("V6: één lokale link naar Opdrachten", urls.length === 1 && urls[0].startsWith("shortcuts://run-shortcut?name=Nate%20alarmen&input=text&text="), urls[0]);
  const pl = JSON.parse(decodeURIComponent(urls[0].split("&text=")[1]));
  check("V6: drie alarmen, wekker bij vertrekken (afspraak vandaag)", pl.alarmen.length === 3 && pl.alarmen[2].wekker === "ja" && pl.alarmen[2].moment.endsWith("13:25"), JSON.stringify(pl.alarmen.map(x => x.moment)));
  check("V6: tijdstip van doorgeven in lokale tijd", (await p.locator(".tp-gezet").textContent()).includes("10:42"));
  await p.click('[data-tp="zet"]'); await wacht(300);
  check("V6: tweede keer meteen doorgeven, zonder uitleg", (await p.evaluate(() => window.__urls.length)) === 2 && !(await p.locator("#blad.open .tp-recept").count()));
  const ics = await p.evaluate(id => afspraakNaarIcs(vind("afspraken", id)).join("\n"), aid);
  check("V6: .ics-reserve met vier alarmen (15 min + drie momenten)", (ics.match(/BEGIN:VALARM/g) || []).length === 4, ics.match(/TRIGGER:[^\n]+/g).join(","));
  await p.evaluate(id => openAfspraakBlad(id), aid); await wacht(350);
  check("V6: voorbereidingsveld in het afspraakblad", await p.locator("#a-voorb").count() === 1);
  await p.fill("#a-voorb", "20"); await p.click("#bladvoet .primair"); await wacht(400);
  check("V6: voorbereiden 20 min verschuift stoppen naar 13:00", await p.evaluate(id => tpVoor(vind("afspraken", id))[0].tijd === "13:00", aid));
  await p.evaluate(() => bladSluit()); await wacht(200);

  /* ---------- V3 Eén invoer ---------- */
  await p.evaluate(() => { V.nwPad = []; ga("start"); }); await wacht(500);
  check("V3: één veld bovenaan Vastleggen", await p.evaluate(() => { const v = document.querySelector("#vi-veld"); const s = document.querySelector("#scherm"); return !!v && s.querySelector(".vi") === s.querySelector(":scope > *, .vi"); }));
  await p.fill("#vi-veld", "tandarts morgen 14:00 reistijd 25"); await wacht(250);
  check("V3: Nate ziet een afspraak, met datum, tijd en reistijd", (await p.locator(".vi-nate").textContent()).includes("afspraak") && (await p.locator(".vi-wat").textContent()).includes("25 min reistijd"));
  await p.screenshot({ path: path.join(UIT, "v3-01-afspraak.png") });
  await p.click('[data-vi="op"]'); await wacht(500);
  const af = await p.evaluate(() => S.afspraken.find(a => a.titel.toLowerCase().startsWith("tandarts") && a.datum === plusDagen(vandaagISO(), 1)));
  check("V3: afspraak opgeslagen met reistijd", af && af.tijd === "14:00" && af.reistijd === 25, JSON.stringify(af));
  check("V3: veld weer leeg", (await p.inputValue("#vi-veld")) === "");
  await p.fill("#vi-veld", "overleg elke maandag 09:00");
  await p.click('[data-vi="op"]'); await wacht(500);
  check("V3: afspraak met herhaling", await p.evaluate(() => { const a = S.afspraken.find(x => /^overleg/i.test(x.titel)); return !!(a && a.herhaal && a.herhaal.soort === "week"); }));
  await p.fill("#vi-veld", "kapper bellen"); await wacht(250);
  check("V3: twijfel → opslaan pas na kiezen", await p.locator('[data-vi="op"]').isDisabled());
  await p.click('[data-vi-soort="taak"]'); await wacht(200);
  check("V3: één tik corrigeert het type", !(await p.locator('[data-vi="op"]').isDisabled()) && (await p.locator('[data-vi="op"]').textContent()).includes("Taak"));
  await p.click('[data-vi="op"]'); await wacht(400);
  check("V3: taak opgeslagen", await p.evaluate(() => S.taken.some(t => t.titel.toLowerCase() === "kapper bellen")));
  await p.fill("#vi-veld", "idee moestuin op het balkon"); await wacht(250);
  await p.click('[data-vi="op"]'); await wacht(500);
  check("V3: gedachte naar de mindmap", await p.evaluate(() => { const mm = mmHuidige(); return !!mm && mm.nodes.some(n => /moestuin/.test(n.tekst || n.titel || "")); }));
  await p.fill("#vi-veld", "waar staat mijn dagboek?"); await wacht(250);
  await p.click('[data-vi="op"]'); await wacht(400);
  check("V3: vraag brengt je naar de plek", await p.evaluate(() => V.view === "dagboek"));
  // Chat biedt Vastleggen aan bij een datum.
  await p.evaluate(() => { ga("vandaag"); nateOpen(); }); await wacht(400);
  await p.fill("#nc-veld", "vrijdag 10:00 offerte nakijken"); await p.press("#nc-veld", "Enter"); await wacht(300);
  check("V3: chat biedt Vastleggen aan", await p.locator('[data-nate="vastleg"]').count() === 1);
  await p.click('[data-nate="vastleg"]'); await wacht(600);
  check("V3: Vastleggen opent met de tekst erin", (await p.inputValue("#vi-veld")) === "vrijdag 10:00 offerte nakijken");
  check("V3: tikvlakken ≥ 44 px", (await tikvlakken(p, ".vi")).length === 0, JSON.stringify(await tikvlakken(p, ".vi")));

  check("geen consolefouten", fouten.length === 0, fouten.slice(0, 3).join(" | "));
  check("nul externe verzoeken", extern.length === 0, extern.slice(0, 3).join(" | "));
  await browser.close(); server.close();
  console.log(`\n${ok} geslaagd, ${fout} mislukt`);
  process.exit(fout ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
