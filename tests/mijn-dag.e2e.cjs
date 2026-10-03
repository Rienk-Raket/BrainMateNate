// Rooktest voor Mijn dag (sectie 87) en de navigatie (sectie 88) met Playwright.
// Gebruik:  NODE_PATH=<map met node_modules/playwright> node tests/mijn-dag.e2e.cjs
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
  // Kennismaking overslaan (Later) en testdata klaarzetten: twee taken met tijd, één afspraak met reistijd, één zonder.
  await p.click('[data-kn="later"]'); await wacht(300);
  await p.evaluate(async () => {
    const v = vandaagISO(), nu = new Date(), m = nu.getHours() * 60 + nu.getMinutes();
    const hhmm = x => { x = Math.max(0, Math.min(1439, x)); return String(Math.floor(x / 60)).padStart(2, "0") + ":" + String(x % 60).padStart(2, "0"); };
    await maakTaakUitTekst("Formulier invullen vandaag " + hhmm(m + 30) + " ~15m p2");
    await maakTaakUitTekst("Was ophangen vandaag " + hhmm(m + 90) + " ~10m");
    await maakTaakUitTekst("Zonder tijd vandaag p3");
    const a = { id: uid(), titel: "Tandarts", soort: "gesprek", datum: v, tijd: hhmm(m + 180), eindTijd: hhmm(m + 220), plek: "Stationsweg 12", personen: [], voorbereiding: "", notities: "", uitkomst: "", reistijd: 20, buffer: 10, gemaakt: new Date().toISOString() };
    await bewaar("afspraken", a);
    await bewaar("afspraken", Object.assign({}, a, { id: uid(), titel: "Bellen met Sam", tijd: hhmm(m + 300), eindTijd: hhmm(m + 330), plek: "", reistijd: 0 }));
    ga("vandaag");
  });
  await wacht(500);

  /* ---------- Mijn dag ---------- */
  check("titel Mijn dag", (await p.locator("#titel").textContent()).trim() === "Mijn dag");
  check("Dagring bovenaan", await p.evaluate(() => { const s = document.querySelector("#scherm"); const ring = s.querySelector(".fm-dagring"); return !!ring && [...s.children].indexOf(ring) <= 1; }));
  check("één Dagring", await p.locator(".fm-dagring").count() === 1);
  check("klokje op de vertrektijd (alleen bij reistijd)", await p.locator(".fm-dr-klok").count() === 1);
  check("buffer zichtbaar", await p.locator(".fm-dr-buffer").count() === 1);
  check("bolletjes voor taken", await p.locator(".fm-dr-punt").count() === 2);
  check("wijzer op nu", await p.locator("[data-fm-wijzer]").count() === 1);
  const vertrek = await p.evaluate(() => { const a = S.afspraken.find(x => x.titel === "Tandarts"); return mdVertrek(a); });
  check("vertrektijd = begin − reistijd − buffer", vertrek && vertrek.vertrek === vertrek.start - 30, JSON.stringify(vertrek));
  check("tijdlijn is de tekstversie van de ring", await p.evaluate(() => { const t = [...document.querySelectorAll(".md-tijdlijn .md-item:not(.tp)")]; return t.length === 5 && document.querySelectorAll(".md-tijdlijn .md-item.tp").length === 4 && t.some(x => x.classList.contains("vertrek")) && t.filter(x => x.classList.contains("afspraak")).length === 2; }));
  check("tijdlijn op tijd gesorteerd", await p.evaluate(() => { const t = [...document.querySelectorAll(".md-tijdlijn time")].map(x => x.textContent); return t.every((x, i) => !i || x >= t[i - 1]); }));
  check("hooguit één Nu-kaart", await p.locator(".md-nu").count() === 1);
  check("Nu-kaart: 1–2–rest", await p.evaluate(() => { const k = document.querySelector(".md-nu"); const n = mdNu(); return k.querySelector("h2").textContent.includes("Formulier invullen") && n.twee[0].titel === "Was ophangen" && n.twee.length === 2 && n.rest >= 1 && /en nog \d/.test(k.querySelector(".md-daarna").textContent); }));
  check("dagstart zichtbaar zolang niet gedaan", (await p.locator(".dc-open h2").textContent()).includes("Dagstart"));
  check("geen widgets zonder instelling", await p.evaluate(() => !document.querySelector("#scherm .sectie-kop, #scherm .kop") || !/Gewoontes|Achterstallig|Wat past er nu/.test(document.querySelector("#scherm").textContent)));
  await p.screenshot({ path: path.join(UIT, "md-01-mijn-dag-390.png"), fullPage: true });
  check("Mijn dag: tikvlakken ≥ 44 px", (await tikvlakken(p)).length === 0, JSON.stringify(await tikvlakken(p)));

  // Tik op een taak op de ring: pop-up met één primaire actie.
  await p.locator(".fm-dr-punt").first().click(); await wacht(400);
  check("pop-up open na tik op de ring", await p.evaluate(() => document.querySelector("#blad").classList.contains("open")));
  check("één primaire actie", await p.locator("#bladvoet .knop.primair").count() === 1 && (await p.locator("#md-pop-doe").textContent()).trim() === "Klaar");
  await p.screenshot({ path: path.join(UIT, "md-02-popup-390.png") });
  await p.click("#md-pop-doe"); await wacht(500);
  check("primaire actie vinkt de taak af", await p.evaluate(() => S.taken.find(t => t.titel === "Formulier invullen").af === true));
  check("Nu-kaart schuift door", (await p.locator(".md-nu h2").textContent()).includes("Was ophangen"));
  // Tik op het klokje: pop-up over vertrekken.
  await p.locator(".fm-dr-klok").click(); await wacht(400);
  check("klokje: pop-up Vertrekken", (await p.locator("#bladtitel").textContent()).startsWith("Vertrekken om"));
  await p.click("#md-pop-doe"); await wacht(500);
  check("primaire actie opent de afspraak", await p.evaluate(() => V.view === "afspraak"));
  await p.evaluate(() => terug()); await wacht(300);
  // Focus terug na sluiten van een dialoog.
  const focusTerug = await p.evaluate(async () => { const b = document.querySelector(".md-tijdlijn button"); b.focus(); b.click(); await new Promise(r => setTimeout(r, 300)); bladSluit(); await new Promise(r => setTimeout(r, 50)); return document.activeElement === b; });
  check("dialoog zet de focus terug na sluiten", focusTerug);

  // Dagstart doen: verdwijnt.
  await p.click('[data-dce="3"]'); await p.click('[data-act="dc-opslaan"]'); await wacht(500);
  check("dagstart weg na check-in", await p.locator(".dc-open").count() === 0);
  // Widgets aanzetten.
  await p.click('[data-md="widgets"]'); await wacht(300);
  await p.click('[data-md-widget="gewoontes"]'); await p.click('[data-md-widget="taken"]'); await wacht(300);
  await p.evaluate(() => bladSluit()); await wacht(300);
  check("widget verschijnt na aanzetten", (await p.locator("#scherm").textContent()).includes("Taken vandaag"));
  await p.reload(); await wacht(1500);
  check("widgetkeuze blijft na herladen", await p.evaluate(() => (inst("mdWidgets") || []).includes("taken")));

  /* ---------- Afspraakblad: reistijd en buffer ---------- */
  await p.evaluate(() => { const a = S.afspraken.find(x => x.titel === "Bellen met Sam"); openAfspraakBlad ? openAfspraakBlad(a.id) : ga("afspraak", a.id); }); await wacht(400);
  const heeftVeld = await p.locator("#a-reis").count();
  if (!heeftVeld) { await p.evaluate(() => { const b = document.querySelector('[data-act="afspraak-bewerk"], [data-abewerk], #a-bewerk'); if (b) b.click(); }); await wacht(400); }
  check("afspraakblad heeft reistijd en buffer", await p.locator("#a-reis").count() === 1 && await p.locator("#a-buffer").count() === 1);
  await p.fill("#a-reis", "15"); await p.click("#a-opslaan"); await wacht(500);
  check("reistijd opgeslagen", await p.evaluate(() => S.afspraken.find(x => x.titel === "Bellen met Sam").reistijd === 15));

  /* ---------- Navigatie (sectie 88) ---------- */
  await p.evaluate(() => ga("vandaag")); await wacht(300);
  check("onderbalk: Mijn dag · Planning · + · Mindmap · Ruimtes", await p.evaluate(() => [...document.querySelectorAll("#tabs button")].map(b => b.dataset.tab).join(",") === "vandaag,planning,start,mindmap,ruimtes"));
  check("onderbalk: tikvlakken ≥ 44 px", (await tikvlakken(p, "#tabs")).length === 0, JSON.stringify(await tikvlakken(p, "#tabs")));
  check("Meer in de kop", await p.evaluate(() => document.querySelector("#instelknop").getAttribute("aria-label") === "Meer"));
  await p.click("#instelknop"); await wacht(300);
  check("Meer toont Voortgang, Profiel, Instellingen, Gegevens, Help", await p.evaluate(() => { const t = document.querySelector("#scherm").textContent; return ["Voortgang", "Profiel", "Instellingen", "Gegevens", "Help"].every(x => t.includes(x)) && V.view === "meer"; }));
  check("Meer heeft een terugknop (geen tab meer)", await p.evaluate(() => !document.querySelector("#terug").classList.contains("verborgen")));
  await p.screenshot({ path: path.join(UIT, "nv-01-meer-390.png"), fullPage: true });
  // Terug brengt de scrollpositie terug.
  await p.evaluate(() => ga("vandaag")); await wacht(300);
  await p.evaluate(() => { document.querySelector("#scherm").scrollTop = 300; }); await wacht(100);
  const was = await p.evaluate(() => document.querySelector("#scherm").scrollTop);
  await p.evaluate(() => ga("logboek")); await wacht(300);
  await p.click("#terug"); await wacht(500);
  check("Terug: scrollpositie blijft behouden", was > 0 && await p.evaluate(() => Math.abs(document.querySelector("#scherm").scrollTop - 300) < 40), String(was) + " → " + await p.evaluate(() => document.querySelector("#scherm").scrollTop));
  // Tabs: Planning en Ruimtes.
  await p.click('#tabs [data-tab="planning"]'); await wacht(400);
  check("Planning: week plus planhulpen", await p.evaluate(() => V.view === "planning" && document.querySelectorAll(".nv-chip").length === 6 && (document.querySelector("#titel").textContent === "Planning")));
  await p.screenshot({ path: path.join(UIT, "nv-02-planning-390.png") });
  check("Planning: tikvlakken ≥ 44 px", (await tikvlakken(p)).length === 0, JSON.stringify(await tikvlakken(p)));
  await p.click('#tabs [data-tab="ruimtes"]'); await wacht(400);
  // Sinds V4: drie ruimtes "voor jou, nu" en vijf clusters (ingeklapt).
  check("Ruimtes: voor jou en clusters", await p.evaluate(() => V.view === "ruimtes" && document.querySelectorAll(".rv-nu-lijst .nv-kamer").length === 3 && document.querySelectorAll(".rv-kop").length === 5));
  await p.screenshot({ path: path.join(UIT, "nv-03-ruimtes-390.png"), fullPage: true });
  check("Ruimtes: tikvlakken ≥ 44 px", (await tikvlakken(p)).length === 0, JSON.stringify(await tikvlakken(p)));
  await p.click('[data-rv="thuis"]'); await wacht(300);
  await p.locator('.rv-cluster.open .nv-kamer[data-view="huishouden"]').click(); await wacht(400);
  check("kamer opent de module", await p.evaluate(() => V.view === "huishouden"));
  // Elk bestaand scherm bereikbaar: alle views uit de tekenkaart bestaan nog en tekenen zonder fout.
  const views = await p.evaluate(async () => {
    const lijst = ["vandaag", "planning", "start", "mindmap", "ruimtes", "meer", "komend", "afspraken", "instellingen", "zoeken", "meldingen", "inbox", "persoonlijk", "gezondheid", "roken", "financieel", "overzicht", "focus", "werk", "logboek", "projecten", "kalender", "checklists", "gewoontes", "dagboek", "filters", "personen", "stats", "backup", "help", "tijd", "profiel", "kennismaking", "sidehustles", "hobbyskills", "wishlist", "anker", "huishouden", "lijstjes", "keuze", "keuzetheorie", "ontwerp", "welkom"];
    const kapot = [];
    for (const v of lijst) { try { ga(v); if (V.view !== v && !(v === "welkom" && V.view === "vandaag")) kapot.push(v + "→" + V.view); } catch (e) { kapot.push(v + ": " + e.message); } }
    ga("vandaag"); return kapot;
  });
  check("alle schermen tekenen zonder fout", views.length === 0, views.join(", "));
  // Gedachte naar de mindmap.
  await p.click('#tabs [data-tab="start"]'); await wacht(400);
  // Sinds V3 staat het ene invoerveld bovenaan; Gedachte naar de mindmap is erin opgegaan (besluit 2 oktober).
  check("+ Vastleggen: één invoerveld bovenaan, geen apart gedachteveld", await p.evaluate(() => { const s = document.querySelector("#scherm"); return s.firstElementChild.classList.contains("vi") && !s.querySelector(".nv-gedachte"); }));
  await p.screenshot({ path: path.join(UIT, "nv-04-vastleggen-390.png") });
  await p.fill("#vi-veld", "idee: Misschien een moestuin"); await wacht(250); await p.press("#vi-veld", "Enter"); await wacht(500);
  check("gedachte landt in de tak Losse gedachten", await p.evaluate(() => { const mm = mmHuidige(); const tak = mm && mm.nodes.find(n => n.tekst === "Losse gedachten"); return !!tak && mm.nodes.some(n => n.parentId === tak.id && /^misschien een moestuin$/i.test(n.tekst)); }));
  check("veld leeg na versturen", await p.evaluate(() => document.querySelector("#vi-veld").value === ""));
  await p.click('#tabs [data-tab="mindmap"]'); await wacht(500);
  check("Mindmap-tab opent de mindmap", await p.evaluate(() => V.view === "mindmap"));

  /* ---------- Chat met Nate (sectie 89) ---------- */
  await p.evaluate(() => ga("vandaag")); await wacht(300);
  await p.click("#nate"); await wacht(400);
  check("chatveld in Nate's paneel", await p.locator("#nc-veld").count() === 1);
  await p.fill("#nc-veld", "waar staat mijn dagboel"); await p.press("#nc-veld", "Enter"); await wacht(300);
  check("chat: antwoord met knop naar Dagboek (tikfout)", await p.evaluate(() => !!document.querySelector('#nate-paneel .nc-nate [data-view="dagboek"]')));
  check("chat: focus terug in het veld", await p.evaluate(() => document.activeElement && document.activeElement.id === "nc-veld"));
  await p.fill("#nc-veld", "blablabla"); await p.press("#nc-veld", "Enter"); await wacht(300);
  check("chat: niet begrepen → drie knoppen", await p.evaluate(() => { const l = [...document.querySelectorAll("#nate-paneel .nc-nate")].pop(); return l.querySelectorAll("button").length === 3 && l.textContent.includes("snap ik nog niet"); }));
  await p.fill("#nc-veld", "onthoud: tandpasta kopen"); await p.press("#nc-veld", "Enter"); await wacht(300);
  check("chat: gedachte vraagt eerst bevestiging (niets stil opgeslagen)", await p.evaluate(() => !mmHuidige().nodes.some(n => n.tekst === "tandpasta kopen")));
  await p.click('#nate-paneel [data-nate="chat-gedachte"]'); await wacht(400);
  check("chat: na Ja staat de gedachte in Losse gedachten", await p.evaluate(() => { const mm = mmHuidige(), tak = mm.nodes.find(n => n.tekst === "Losse gedachten"); return mm.nodes.some(n => n.parentId === tak.id && n.tekst === "tandpasta kopen"); }));
  await p.screenshot({ path: path.join(UIT, "nc-01-chat-390.png") });
  check("chat: tikvlakken ≥ 44 px", (await tikvlakken(p, "#nate-paneel .nc")).length === 0, JSON.stringify(await tikvlakken(p, "#nate-paneel .nc")));
  await p.fill("#nc-veld", "dagboek"); await p.press("#nc-veld", "Enter"); await wacht(300);
  await p.locator('#nate-paneel .nc-nate [data-view="dagboek"]').last().click(); await wacht(400);
  check("chat: knop brengt je naar het scherm en sluit het paneel", await p.evaluate(() => V.view === "dagboek" && !document.querySelector("#nate-paneel").classList.contains("open")));

  await ctx.close();
  /* ---------- 360 × 740 donker, minder beweging ---------- */
  {
    const c3 = await nieuw({ viewport: { width: 360, height: 740 }, colorScheme: "dark", reducedMotion: "reduce" }), p3 = volg(await c3.newPage());
    await p3.goto(BASIS + "/"); await wacht(1500);
    await p3.click('[data-kn="later"]'); await wacht(300);
    await p3.evaluate(async () => { await maakTaakUitTekst("Iets doen vandaag 14:00 ~20m"); ga("vandaag"); }); await wacht(500);
    await p3.screenshot({ path: path.join(UIT, "md-03-mijn-dag-360-donker.png"), fullPage: true });
    check("360 donker: tikvlakken ≥ 44 px", (await tikvlakken(p3)).length === 0, JSON.stringify(await tikvlakken(p3)));
    check("360 donker: geen horizontale scroll", await p3.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
    await c3.close();
  }
  check("geen consolefouten", fouten.length === 0, fouten.slice(0, 3).join(" | "));
  check("nul externe verzoeken", extern.length === 0, extern.slice(0, 3).join(" | "));
  await browser.close(); server.close();
  console.log(`\n${ok} geslaagd, ${fout} mislukt`);
  process.exit(fout ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
