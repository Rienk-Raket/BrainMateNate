// End-to-end tests voor de Keuzemachine met Playwright.
// Start een eigen webserver op de repo-map, zodat niets anders nodig is.
// Gebruik:  NODE_PATH=<map met node_modules/playwright> node tests/keuzemachine.e2e.cjs
// Opties (env): CHROMIUM=<pad naar chrome>, SCHERMEN=<map voor schermafbeeldingen> (standaard tests/uitvoer)
"use strict";
const http = require("http"), fs = require("fs"), path = require("path"), { execSync } = require("child_process");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, ".."), UIT = process.env.SCHERMEN || path.join(ROOT, "tests", "uitvoer");
fs.mkdirSync(UIT, { recursive: true });
const V13 = (() => { try { return execSync("git show d99ca35:index.html", { cwd: ROOT, maxBuffer: 64e6 }); } catch (e) { return null; } })();
const server = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split("?")[0]);
  if (u === "/__v13.html" && V13) { r.writeHead(200, { "content-type": "text/html; charset=utf-8" }); return r.end(V13); }
  const f = path.join(ROOT, u === "/" ? "index.html" : u);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { "content-type": f.endsWith(".html") ? "text/html; charset=utf-8" : "application/octet-stream" }); fs.createReadStream(f).pipe(r);
});

let ok = 0, fout = 0;
const check = (naam, v, extra) => { if (v) ok++; else fout++; console.log((v ? "✔ " : "✘ ") + naam + (extra ? "  " + extra : "")); };
const wacht = ms => new Promise(r => setTimeout(r, ms));
const SLEUTEL = "sk-ant-TEST-geheim-7c1f93";
const ROUTE_B = [0, 0, 0, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "a", "c", "a", "b", "d", "a", "b"];

(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const BASIS = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ["--no-sandbox"] });
  const nieuwCtx = (o) => browser.newContext(Object.assign({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, o || {}));
  const fouten = [];
  const volg = p => { p.on("pageerror", e => fouten.push(e.message)); p.on("console", m => { if (m.type() === "error" && !/favicon|404/.test(m.text())) fouten.push(m.text()); }); return p; };
  const telWinkels = p => p.evaluate(() => { const uit = {}; for (const w of Object.keys(WINKELS)) uit[w] = w === "instellingen" ? Object.keys(S.instellingen).length : (S[w] || []).length; return { versie: db.version, winkels: [...db.objectStoreNames], uit }; });

  /* ---------- 1. Upgrade v9 → 14 zonder verlies ---------- */
  {
    const ctx = await nieuwCtx(), p = volg(await ctx.newPage());
    await p.goto(BASIS + "/tests/fixtures/index-v9.html"); await wacht(1300);
    await p.evaluate(async () => {
      const nu = new Date().toISOString(), v = vandaagISO();
      for (let i = 0; i < 12; i++) await bewaar("taken", { id: "t" + i, titel: "Oude taak " + i, af: i % 3 === 0, datum: v, gemaakt: nu, volgorde: i, labels: [], personen: [], subtaken: [], bijlagen: [], hangtAf: [] });
      for (let i = 0; i < 4; i++) await bewaar("afspraken", { id: "a" + i, titel: "Afspraak " + i, datum: v, tijd: "10:00", gemaakt: nu });
      for (let i = 0; i < 3; i++) await bewaar("hs_items", { id: "h" + i, naam: "Hobby " + i, soort: "hobby", status: "lopend", sessies: [], gemaakt: nu });
      await bewaar("wl_items", { id: "w1", naam: "Koptelefoon", prijs: 99, status: "actief", gemaakt: nu });
      await zetInst("thema", "donker");
    });
    const voor = await telWinkels(p);
    await p.goto(BASIS + "/index.html"); await wacht(1500);
    const na = await telWinkels(p);
    const gelijk = Object.entries(voor.uit).every(([w, n]) => na.uit[w] === n);
    console.log("  v9 voor:", JSON.stringify(voor.uit));
    console.log("  v14 na: ", JSON.stringify(Object.fromEntries(Object.keys(voor.uit).map(w => [w, na.uit[w]]))), "+ km_profielen", na.uit.km_profielen, "km_dilemmas", na.uit.km_dilemmas);
    check(`upgrade v${voor.versie} → v${na.versie}: alle ${Object.keys(voor.uit).length} bestaande winkels gelijk, km-winkels bestaan`, voor.versie === 9 && na.versie === 14 && gelijk && na.winkels.includes("km_profielen") && na.winkels.includes("km_dilemmas"));
    await ctx.close();
  }
  /* ---------- 1b. Upgrade v13 (huidige telefoon) → 14 ---------- */
  if (V13) {
    const ctx = await nieuwCtx(), p = volg(await ctx.newPage());
    await p.goto(BASIS + "/__v13.html"); await wacht(1300);
    await p.evaluate(async () => { const nu = new Date().toISOString(); await bewaar("taken", { id: "x", titel: "Blijft", af: false, gemaakt: nu, volgorde: 1, labels: [], personen: [], subtaken: [], bijlagen: [], hangtAf: [] });
      await bewaar("lj_lijsten", { id: "L", naam: "Films", soort: "film" }); await bewaar("lj_items", { id: "i1", lijstId: "L", titel: "Dune", status: "klaar", score: 9 }); });
    const voor = await telWinkels(p);
    await p.goto(BASIS + "/index.html"); await wacht(1500);
    const na = await telWinkels(p);
    check(`upgrade v${voor.versie} → v${na.versie}: niets kwijt (Lijstjes en taken intact)`, voor.versie === 13 && na.versie === 14 && Object.entries(voor.uit).every(([w, n]) => na.uit[w] === n));
    await ctx.close();
  }

  /* ---------- 2. Flows ---------- */
  const ctx = await nieuwCtx(), p = volg(await ctx.newPage());
  await p.goto(BASIS + "/index.html"); await wacht(1300);
  await p.evaluate(() => { V.briefingGezien = true; ga("keuze"); }); await wacht(300);
  check("zonder profiel: Keuzemachine opent de intro van de uitsteltest", await p.evaluate(() => V.view === "keuze" && !!document.querySelector('#scherm [data-act="km-test-start"]')));
  await p.click('[data-act="km-test-start"]'); await wacht(300);
  for (let i = 0; i < 7; i++) { await p.click(`.km-antwoord[data-w="${ROUTE_B[i]}"]`); await wacht(260); }
  await p.reload(); await wacht(1400);
  await p.evaluate(() => { V.briefingGezien = true; ga("keuzetest"); }); await wacht(300);
  check("test hervat na herladen bij de eerste open vraag (8 van 25)", await p.evaluate(() => /^8 van 25/.test(document.querySelector(".km-teller").textContent) && kmLopend().antwoorden.filter(x => x != null).length === 7));
  await p.click('[data-act="km-vorige"]'); await wacht(200);
  check("vorige-knop gaat terug naar vraag 7", await p.evaluate(() => /^7 van 25/.test(document.querySelector(".km-teller").textContent)));
  await p.click('[data-act="km-volgende"]'); await wacht(200);
  for (let i = 7; i < 25; i++) { await p.click(`.km-antwoord[data-w="${ROUTE_B[i]}"]`); await wacht(220); }
  await wacht(300);
  check("profielkaart: De Speurder, staafjes A–G, disclaimer", await p.evaluate(() => V.param === "profiel" && /De Speurder/.test(document.querySelector(".km-profiel h2").textContent) && document.querySelectorAll(".km-staaf").length === 7 && /geen diagnose/.test(document.querySelector(".km-profiel").textContent)));
  await p.evaluate(() => ga("keuze")); await wacht(300);
  check("met profiel: overzicht met profielkaartje, knop en XP-balk", await p.evaluate(() => !!document.querySelector(".km-profmini") && !!document.querySelector('[data-act="km-nieuw"]') && !!document.querySelector(".km-xp")));
  // Dilemma
  await p.click('[data-act="km-nieuw"]'); await wacht(300);
  await p.fill("#km-A-titel", "Nieuwe laptop nu kopen"); await p.fill("#km-B-titel", "Wachten tot Black Friday");
  await p.click('[data-veld="inzet"][data-w="middel"]'); await wacht(150);
  await p.click('[data-veld="omkeerbaar"][data-w="deels"]'); await wacht(150);
  check("invoer: titels bewaard bij het wisselen van segmenten", await p.evaluate(() => { const d = vind("km_dilemmas", V.param); return d.a.titel === "Nieuwe laptop nu kopen" && d.context.inzet === "middel"; }));
  await p.click('[data-act="km-verder"]'); await wacht(300);
  check("checks schuiven één voor één in beeld", await p.evaluate(() => document.querySelectorAll(".km-check").length === 1));
  await p.click('[data-veld="trek"][data-w="-1"]'); await wacht(200);
  await p.click('[data-veld="prive"][data-w="A"]'); await wacht(200);
  await p.click('[data-veld="terug"][data-w="gelijk"]'); await wacht(200);
  check("Speurder krijgt de extra vraag 'goed genoeg'", await p.evaluate(() => document.querySelectorAll(".km-check").length === 4));
  await p.click('[data-veld="beideGoed"][data-w="true"]'); await wacht(200);
  const t0 = Date.now();
  await p.click('[data-act="km-machine"]');
  await p.waitForSelector("#km-band"); await wacht(2200);
  const halverwege = await p.evaluate(() => ({ fase: document.querySelector(".km-machine").getAttribute("data-fase"), live: document.querySelector("#km-live").textContent }));
  check("band halverwege: station 2 of 3 actief met aria-live-tekst", ["3", "4"].includes(halverwege.fase) && /valkuil|voorkeur/i.test(halverwege.live), JSON.stringify(halverwege));
  await p.waitForSelector("#km-uitkomst", { timeout: 9000 });
  const duur = (Date.now() - t0) / 1000;
  check(`band speelt in ongeveer 4,4 s (${duur.toFixed(1)} s)`, duur > 4.0 && duur < 5.6);
  const u = await p.evaluate(() => vind("km_dilemmas", V.param).uitkomst);
  check("uitkomstkaart: kern, valkuil, 3 handvatten, 2 tips, advies A", u.handvatten.length === 3 && u.tips.length === 2 && u.advies === "A" && /middelgrote, deels omkeerbare keuze\. Je budget is 1 uur\./.test(u.kern), u.reden);
  check("onder het advies: 'Jij beslist. Dit is een zetje, geen opdracht.'", await p.evaluate(() => /Jij beslist\. Dit is een zetje, geen opdracht\./.test(document.querySelector(".km-advies").textContent)));
  await p.click('.km-tips [data-act="km-lees"]'); await wacht(300);
  check("'Waarom?' opent het juiste theoriehoofdstuk", await p.evaluate(() => V.view === "keuzetheorie" && V.param === "route-b"));
  await p.evaluate(() => terug()); await wacht(300);
  // Tweede keer: versnelde band van ~2 s, en overslaan
  let t1 = Date.now(); await p.click('[data-act="km-opnieuw"]'); await p.waitForSelector("#km-band"); await p.waitForSelector("#km-uitkomst", { timeout: 6000 });
  const snel = (Date.now() - t1) / 1000;
  check(`tweede keer: versnelde band (${snel.toFixed(1)} s)`, snel < 3);
  t1 = Date.now(); await p.click('[data-act="km-opnieuw"]'); await p.waitForSelector("#km-band"); await p.click(".km-overslaan"); await p.waitForSelector("#km-uitkomst", { timeout: 3000 });
  check(`overslaan springt direct naar de uitkomst (${((Date.now() - t1) / 1000).toFixed(1)} s)`, (Date.now() - t1) < 1500);
  // Munt-test
  await p.click('[data-act="km-munt"]'); await wacht(300); await p.click("#km-munt"); await wacht(1400);
  const viel = await p.evaluate(() => document.querySelector("#km-muntuit").textContent.slice(0, 1));
  await p.click('[data-reactie="teleurgesteld"]'); await wacht(400);
  const na = await p.evaluate(() => { const d = vind("km_dilemmas", V.param); return { munt: d.checks.munt, reden: d.uitkomst.reden }; });
  check("munt-test: reactie bewaard en in de reden verwerkt", na.munt && na.munt.viel === viel && na.munt.reactie === "teleurgesteld" && /teleurgesteld toen|munt-reactie/.test(na.reden), na.reden);
  // Besluit
  const kant = await p.evaluate(() => vind("km_dilemmas", V.param).uitkomst.advies === "B" ? "B" : "A");
  await p.click(`[data-act="km-kies"][data-k="${kant}"]`); await wacht(300);
  await p.click('[data-verwacht="6"]'); await wacht(500);
  const bes = await p.evaluate(() => { const d = vind("km_dilemmas", V.param); return { status: d.status, besluit: d.besluit, nazorg: d.nazorg, xp: inst("km_xp", 0), badges: inst("km_badges", []).map(b => b.id), log: S.gebeurtenissen.some(g => g.soort === "keuze" && /Besloten/.test(g.tekst)) }; });
  check("besluit: status, verwachte twijfel, XP 20 (binnen budget), badge, logboek", bes.status === "besloten" && bes.nazorg.verwacht === 6 && bes.xp === 20 && bes.besluit.binnenBudget && bes.badges.includes("eerste") && bes.log, JSON.stringify({ xp: bes.xp, badges: bes.badges }));
  // Nazorg na 2 dagen in de Inbox
  await p.evaluate(async () => { const d = vind("km_dilemmas", V.param); d.besluit.op = new Date(Date.now() - 3 * 864e5).toISOString(); await bewaar("km_dilemmas", d); await kmNazorgCheck(); await kmNazorgCheck(); });
  const meld = await p.evaluate(() => S.meldingen.filter(m => m.onderwerp === "Keuzemachine").map(m => ({ view: m.actieView, ok: !!vind("km_dilemmas", m.actieParam) })));
  check("nazorgvraag verschijnt na 2 dagen in de Inbox (één keer, opent het dilemma)", meld.length === 1 && meld[0].view === "keuzedilemma" && meld[0].ok);
  await p.evaluate(() => ga("meldingen")); await wacht(300);
  check("de melding staat in de Inbox", await p.evaluate(() => /Hoe voelt je keuze nu\?/.test(document.querySelector("#scherm").textContent)));
  await p.evaluate(() => { const m = S.meldingen.find(x => x.onderwerp === "Keuzemachine"); ga("keuzedilemma", m.actieParam); }); await wacht(300);
  await p.evaluate(() => teken()); await wacht(200);
  await p.click('[data-act="km-nazorg"][data-w="1"]'); await wacht(300);
  check("nazorg: score bewaard, +5 XP", await p.evaluate(() => { const d = vind("km_dilemmas", V.param); return d.nazorg.score === 1 && inst("km_xp", 0) === 25; }));
  // Nog niet: deadline → gewone taak
  await p.evaluate(async () => { const d = kmNieuwDilemma({ a: { titel: "Verhuizen", notitie: "" }, b: { titel: "Blijven", notitie: "" }, invoerKlaar: true, checks: { trek: 0, prive: "?", terug: "gelijk" }, context: { inzet: "groot", omkeerbaar: "nee", deadline: null, zichtbaar: false } });
    await bewaar("km_dilemmas", d); ga("keuzedilemma", d.id); await kmMachine(d); }); await p.click(".km-overslaan"); await wacht(400);
  const morgen = await p.evaluate(() => plusDagen(vandaagISO(), 1));
  await p.click('[data-act="km-parkeer"]'); await wacht(300); await p.fill("#km-pdatum", morgen); await p.click("#km-pok"); await wacht(500);
  const taak = await p.evaluate(() => { const d = vind("km_dilemmas", V.param); return { d: d.status, t: vind("taken", d.besluit.taakId) }; });
  check("'Nog niet' maakt een gewone taak met datum (Komend)", taak.d === "geparkeerd" && taak.t && taak.t.datum === morgen && /Kiezen: Verhuizen of Blijven/.test(taak.t.titel));
  await p.evaluate(() => ga("komend")); await wacht(300);
  check("de taak staat in Komend", await p.evaluate(() => document.querySelector("#scherm").textContent.includes("Kiezen: Verhuizen of Blijven")));
  // Lege concepten verdwijnen, titels met # of @ blijven gewone tekst
  await p.evaluate(() => ga("keuze")); await wacht(200); await p.click('[data-act="km-nieuw"]'); await wacht(200); await p.evaluate(() => ga("keuze")); await wacht(300);
  check("leeg dilemma (niets ingevuld) verdwijnt weer", await p.evaluate(() => !S.km_dilemmas.some(d => d.status === "concept" && !d.a.titel && !d.b.titel)));
  await p.evaluate(async () => { const d = kmNieuwDilemma({ a: { titel: "Feest #werk @Sam", notitie: "" }, b: { titel: "Elke week sporten", notitie: "" }, invoerKlaar: true, checks: { trek: 0, prive: "A", terug: "gelijk" } }); await bewaar("km_dilemmas", d); ga("keuzedilemma", d.id); await kmMachine(d); });
  await p.click(".km-overslaan"); await wacht(300); await p.click('[data-act="km-parkeer"]'); await wacht(300); await p.click("#km-pok"); await wacht(400);
  check("deadline-taak houdt de titels letterlijk (geen project, label of herhaling)", await p.evaluate(() => { const d = vind("km_dilemmas", V.param), t = vind("taken", d.besluit.taakId); return t.titel === "Kiezen: Feest #werk @Sam of Elke week sporten" && !t.projectId && !t.herhaal && !t.labels.length; }));
  // Veiligheid
  await p.evaluate(async () => { const d = kmNieuwDilemma({ a: { titel: "Stoppen met mijn medicatie", notitie: "" }, b: { titel: "Doorgaan", notitie: "" }, invoerKlaar: true, checks: { trek: 0, prive: "A", terug: "gelijk" } });
    await bewaar("km_dilemmas", d); V.briefingGezien = true; ga("keuzedilemma", d.id); await kmMachine(d); }); await wacht(400);
  check("gevoelig onderwerp: geen lopende band", await p.evaluate(() => !document.querySelector("#km-band")));
  check("gevoelig onderwerp: alleen de hulpkaart (113, huisarts, 112), geen advies", await p.evaluate(() => !!document.querySelector(".km-hulp") && !document.querySelector(".km-advies") && /0800-0113/.test(document.querySelector(".km-hulp").textContent) && /112/.test(document.querySelector(".km-hulp").textContent)));
  const geld = await p.evaluate(() => kmAdvies({ a: { titel: "Hypotheek oversluiten" }, b: { titel: "Laten staan" }, context: {}, checks: { prive: "A" } }, kmProfiel(), { nu: Date.now() }));
  check("geld/recht/gezondheid: advies blijft met de extra zin", geld.advies === "A" && geld.extra === "Laat dit ook checken door iemand met verstand van zaken.");
  // Theorie
  await p.evaluate(() => ga("keuzetheorie")); await wacht(300);
  check(`theorie: ${await p.evaluate(() => KM_THEORIE.length)} hoofdstukken, 'Voor jou' bij de eigen route`, await p.evaluate(() => document.querySelectorAll(".km-hfd").length === KM_THEORIE.length && !!document.querySelector('.km-hfd[data-id="route-b"] .km-voorjou')));
  await p.click('.km-hfd[data-id="waarom"]'); await wacht(300); await p.click('[data-act="km-gelezen"]'); await wacht(300);
  check("hoofdstuk gelezen: vinkje en +5 XP", await p.evaluate(() => inst("km_gelezen", []).includes("waarom") && inst("km_xp", 0) === 30));
  // XP, levels en badges na een reeks van 5 dilemma's
  await p.evaluate(async () => {
    for (let i = 0; i < 4; i++) { const d = kmNieuwDilemma({ a: { titel: "Pizza " + i, notitie: "" }, b: { titel: "Pasta " + i, notitie: "" }, invoerKlaar: true, checks: { trek: -2, prive: "A", terug: "gelijk" } });
      await bewaar("km_dilemmas", d); await kmMachine(d); V.kmBand = null; await kmBesluit(vind("km_dilemmas", d.id), "A", 5);
      const x = vind("km_dilemmas", d.id); x.nazorg.score = 1; await bewaar("km_dilemmas", x); }
    await kmBadgesBijwerken();
  });
  const g = await p.evaluate(() => ({ xp: inst("km_xp", 0), level: kmLevel(inst("km_xp", 0)).naam, badges: inst("km_badges", []).map(b => b.id).sort(), n: kmBesloten().length }));
  check(`na 5 besluiten: ${g.xp} XP, level ${g.level}, badges ${g.badges.join(", ")}`, g.n === 5 && g.xp === 110 && g.level === "Knopendoorhakker" && ["eerste", "budget5", "goedgenoeg"].every(b => g.badges.includes(b)));
  // Koppelingen
  await p.evaluate(() => ga("meer")); await wacht(300);
  check("Meer: Keuzemachine en Keuzetheorie in 'Doen en groeien'", await p.evaluate(() => { const k = document.querySelector('#scherm .menu-kaart[data-view="keuze"]'), t = document.querySelector('#scherm .menu-kaart[data-view="keuzetheorie"]'); if (!k || !t) return false;
    let s = k.parentElement.previousElementSibling; while (s && !s.classList.contains("sectie")) s = s.previousElementSibling; return s && /Doen en groeien/.test(s.textContent) && k.parentElement === t.parentElement; }));
  await p.evaluate(() => { ga("start"); V.nwPad = ["toolbox", "beslissen"]; teken(); }); await wacht(600);
  check("kaart op Nieuw (Toolbox › Beslissen)", await p.evaluate(() => !!document.querySelector('#scherm [data-view="keuze"].knop3d')));
  check("Voortgang-bron 'besluiten'", await p.evaluate(() => vgAutoBronnen().some(b => b.id === "keuze.besluiten")));
  await p.evaluate(async () => { await bewaar("wl_items", { id: "w9", naam: "Racefiets", prijs: 900, status: "actief", gemaakt: new Date().toISOString(), redenen: [] }); ga("wens", "w9"); }); await wacht(400);
  await p.click('[data-act="km-van-wens"]'); await wacht(400);
  check("Wishlist → Keuzemachine met ingevulde A/B (groot, deels omkeerbaar)", await p.evaluate(() => { const d = vind("km_dilemmas", V.param); return V.view === "keuzedilemma" && d.a.titel === "Racefiets kopen" && d.context.inzet === "groot" && d.bron.module === "wishlist"; }));

  /* ---------- 3. AI-laag (nep-API) ---------- */
  let verzoeken = [], antwoord = "ok";
  await p.route("https://api.anthropic.com/**", async route => {
    const req = route.request(); verzoeken.push({ headers: req.headers(), body: req.postDataJSON() });
    if (antwoord === "refusal") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ stop_reason: "refusal", content: [] }) });
    const data = { valkuil: "Je blijft laptops vergelijken terwijl de eerste al goed genoeg is.", handvatten: ["Kies drie eisen voor je laptop.", "De eerste die voldoet, wint.", "Kijk niet meer naar Black Friday-lijstjes."], tips: ["Stop na drie reviews.", "Vraag iemand wat hij zou nemen."], reden: "Als niemand het zou weten, koop je hem nu. Dat maakt A rustig.", advies: "A" };
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ stop_reason: "end_turn", content: [{ type: "thinking", thinking: "" }, { type: "text", text: JSON.stringify(data) }] }) });
  });
  await p.evaluate(async k => { await zetInst("km_ai", { aan: true, model: "claude-opus-5-5" }); await zetInst("km_sleutel", k); }, SLEUTEL);
  const aiRun = async titelA => { await p.evaluate(async a => { const d = kmNieuwDilemma({ a: { titel: a, notitie: "" }, b: { titel: "Wachten", notitie: "" }, invoerKlaar: true, checks: { trek: -1, prive: "A", terug: "gelijk" } });
    await bewaar("km_dilemmas", d); V.briefingGezien = true; ga("keuzedilemma", d.id); await kmMachine(d); }, titelA); await p.waitForSelector("#km-uitkomst, .km-hulp", { timeout: 12000 }); return p.evaluate(() => vind("km_dilemmas", V.param).uitkomst); };
  let ua = await aiRun("Laptop nu kopen");
  const r0 = verzoeken[0] || { headers: {}, body: {} };
  check("AI aan: teksten verrijkt, thinking-blok overgeslagen, advies blijft lokaal", ua.bron === "ai" && ua.handvatten[0] === "Kies drie eisen voor je laptop." && ua.advies === "A");
  check("AI-aanroep: juiste headers, effort low, max_tokens ≥ 16000, alleen toegestane velden", r0.headers["anthropic-version"] === "2023-06-01" && r0.headers["anthropic-dangerous-direct-browser-access"] === "true" && r0.headers["x-api-key"] === SLEUTEL
    && r0.body.output_config.effort === "low" && r0.body.max_tokens >= 16000 && !("thinking" in r0.body) && /<dilemma>/.test(r0.body.messages[0].content) && !/taken|Oude taak|Racefiets|"lokaal"/.test(r0.body.messages[0].content)
    && Object.keys(JSON.parse(r0.body.messages[0].content.replace(/^<dilemma>\n|\n<\/dilemma>$/g, ""))).sort().join() === "checks,context,optieA,optieB,routes");
  antwoord = "refusal"; ua = await aiRun("Fiets nu kopen");
  check("stop_reason refusal → lokale uitkomst met label 'offline advies'", ua.bron === "lokaal" && ua.aiMislukt === true && await p.evaluate(() => /offline advies/.test(document.querySelector(".km-advies").textContent)));
  const n0 = verzoeken.length; ua = await aiRun("Zelfbeschadiging of niet");
  check("geblokkeerd dilemma wordt nooit naar de AI gestuurd", verzoeken.length === n0 && ua.veiligheid === "geblokkeerd");

  /* ---------- 4. Back-up-roundtrip en sleutel ---------- */
  const exp = await p.evaluate(async () => { let tekst = null; const _d = deelOfDownload; deelOfDownload = async (n, t) => { tekst = t; }; await exportJSON(false); deelOfDownload = _d; return tekst; });
  check("back-up-JSON bevat de testsleutel niet (letterlijk gezocht)", exp && !exp.includes(SLEUTEL) && !exp.includes("km_sleutel"));
  check("na de export staat de sleutel nog op dit toestel", await p.evaluate(k => inst("km_sleutel") === k, SLEUTEL));
  const telKm = pg => pg.evaluate(() => ({ p: S.km_profielen.map(x => x.id + (x.primair || "")).sort().join(","), d: S.km_dilemmas.map(x => x.id + x.status).sort().join(","), xp: inst("km_xp", 0) }));
  const bron = await telKm(p);
  const ctx2 = await nieuwCtx(), p2 = volg(await ctx2.newPage());
  await p2.goto(BASIS + "/index.html"); await wacht(1300);
  await p2.evaluate(async t => { await importJSON(new File([t], "backup.json", { type: "application/json" }), "vervangen"); }, exp); await wacht(300);
  const doel = await telKm(p2);
  check("back-up in een schone browser terugzetten: zelfde profielen, dilemma's en XP", bron.p === doel.p && bron.d === doel.d && bron.xp === doel.xp && bron.d.length > 0);
  check("na herstel staat er geen sleutel in de schone browser", await p2.evaluate(() => !inst("km_sleutel", null)));
  const metSleutel = JSON.stringify(Object.assign(JSON.parse(exp), {}), null, 0).replace('"data":{', `"data":{"__x":[],`);
  const vals = JSON.parse(exp); vals.data.instellingen.push({ sleutel: "km_sleutel", waarde: "sk-ant-VREEMD" });
  await p2.evaluate(async t => { await zetInst("km_sleutel", "sk-ant-EIGEN"); await importJSON(new File([t], "b.json"), "samenvoegen"); }, JSON.stringify(vals));
  check("import negeert een sleutel uit het bestand en houdt de eigen sleutel", await p2.evaluate(() => inst("km_sleutel") === "sk-ant-EIGEN"));
  await p2.evaluate(() => { document.querySelector("#scherm"); }); void metSleutel;
  await ctx2.close();
  const v9exp = await (async () => { const c = await nieuwCtx(), q = volg(await c.newPage()); await q.goto(BASIS + "/tests/fixtures/index-v9.html"); await wacht(1200);
    const t = await q.evaluate(async () => { await bewaar("taken", { id: "v9t", titel: "Uit versie 9", af: false, gemaakt: new Date().toISOString(), volgorde: 1, labels: [], personen: [], subtaken: [], bijlagen: [], hangtAf: [] }); let x = null; const _d = deelOfDownload; deelOfDownload = async (n, tk) => { x = tk; }; await exportJSON(false); deelOfDownload = _d; return x; });
    await c.close(); return t; })();
  const ctx3 = await nieuwCtx(), p3 = volg(await ctx3.newPage()); await p3.goto(BASIS + "/index.html"); await wacht(1300);
  await p3.evaluate(async t => { await importJSON(new File([t], "v9.json"), "vervangen"); }, v9exp); await wacht(200);
  check("back-up uit versie 9 terugzetten in versie 14: taak terug, Keuzemachine leeg", await p3.evaluate(() => !!vind("taken", "v9t") && S.km_dilemmas.length === 0 && S.km_profielen.length === 0));
  await ctx3.close();

  /* ---------- 5. Reduced motion ---------- */
  {
    const c = await nieuwCtx({ reducedMotion: "reduce" }), q = volg(await c.newPage());
    await q.goto(BASIS + "/index.html"); await wacht(1300);
    await q.evaluate(async a => { const l = { id: "p1", versie: 1, gemaakt: new Date().toISOString(), klaar: false, antwoorden: a }; await bewaar("km_profielen", l); await kmTestAfronden(l); }, ROUTE_B);
    const t2 = Date.now();
    await q.evaluate(async () => { const d = kmNieuwDilemma({ a: { titel: "Thee", notitie: "" }, b: { titel: "Koffie", notitie: "" }, invoerKlaar: true, checks: { trek: 0, prive: "A", terug: "gelijk" } }); await bewaar("km_dilemmas", d); V.briefingGezien = true; ga("keuzedilemma", d.id); await kmMachine(d); });
    const stil = await q.evaluate(() => document.querySelector(".km-machine").classList.contains("stil"));
    await q.waitForSelector("#km-uitkomst", { timeout: 4000 });
    check(`reduced motion: geen band, stations in 0,8 s (${((Date.now() - t2) / 1000).toFixed(1)} s)`, stil && Date.now() - t2 < 2000);
    await c.close();
  }

  /* ---------- 6. Tikvlakken, contrast, console, schermafbeeldingen ---------- */
  const tik = await p.evaluate(async () => {
    const klein = [];
    for (const [v, param] of [["keuze", null], ["keuzetheorie", null], ["keuzetheorie", "route-b"], ["keuzedilemma", S.km_dilemmas.find(d => d.status === "open" && d.uitkomst && d.uitkomst.veiligheid !== "geblokkeerd").id]]) {
      ga(v, param); await new Promise(r => setTimeout(r, 250));
      document.querySelectorAll("#scherm button").forEach(b => { if (!b.closest(".km-intro,.km-profiel,.km-profmini,.km-uitkomst,.km-acties,.km-hfd,.km-lees,.km-xp,.km-rij,.km-besluit,.km-nieuwknop,.km-check,.km-kant,.km-context") && !/^km-/.test(b.dataset.act || "")) return;
        const r = b.getBoundingClientRect(); if (r.width && (r.height < 43.5 || r.width < 43.5)) klein.push((b.dataset.act || b.className) + " " + Math.round(r.width) + "×" + Math.round(r.height)); });
    }
    return klein;
  });
  check("alle tikvlakken in de module ≥ 44 × 44 px", !tik.length, tik.slice(0, 6).join(" | "));
  const contrast = async donker => { const c = await nieuwCtx({ colorScheme: donker ? "dark" : "light" }), q = await c.newPage(); await q.goto(BASIS + "/index.html"); await wacht(900);
    const r = await q.evaluate(() => { const lum = c => { const m = c.match(/\d+(\.\d+)?/g).map(Number); const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(m[0]) + .7152 * f(m[1]) + .0722 * f(m[2]); };
      const kl = v => { const e = document.createElement("div"); e.style.color = `var(${v})`; document.body.appendChild(e); const k = getComputedStyle(e).color; e.remove(); return k; };
      const cr = (a, b) => { const x = lum(kl(a)), y = lum(kl(b)); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
      return { tekstKaart: cr("--text", "--card"), mutedKaart: cr("--muted", "--card"), opA: cr("--accent-text", "--accent"), opB: cr("--accent-text", "--purple"), opGroen: cr("--accent-text", "--green"), tekstRood: cr("--text", "--red-soft"), mutedKaart2: cr("--muted", "--card2") }; });
    await c.close(); return r; };
  for (const donker of [false, true]) { const r = await contrast(donker); check(`contrast ≥ 4,5:1 (${donker ? "donker" : "licht"}): ${Object.entries(r).map(([k, v]) => k + " " + v.toFixed(1)).join(", ")}`, Object.values(r).every(v => v >= 4.5)); }

  // Schermafbeeldingen: 6 schermen × 2 formaten × licht/donker
  const maten = [[390, 844], [360, 740]];
  for (const [bw, bh] of maten) for (const donker of [false, true]) {
    const c = await browser.newContext({ viewport: { width: bw, height: bh }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: donker ? "dark" : "light" }), q = volg(await c.newPage());
    const pre = `${bw}x${bh}-${donker ? "donker" : "licht"}`;
    await q.goto(BASIS + "/index.html"); await wacht(1300);
    await q.evaluate(async a => { V.briefingGezien = true; const l = { id: "pp", versie: 1, gemaakt: new Date().toISOString(), klaar: false, antwoorden: a.map((x, i) => i < 6 ? x : null) }; await bewaar("km_profielen", l); V.kmTestBezig = true; ga("keuzetest"); }, ROUTE_B); await wacht(400);
    await q.screenshot({ path: path.join(UIT, `${pre}-1-testvraag.png`) });
    await q.evaluate(async a => { const l = kmLopend(); l.antwoorden = a.slice(); await bewaar("km_profielen", l); await kmTestAfronden(l); }, ROUTE_B); await wacht(400);
    await q.screenshot({ path: path.join(UIT, `${pre}-2-profielkaart.png`) });
    await q.evaluate(async () => { const d = kmNieuwDilemma({ a: { titel: "Nieuwe laptop nu kopen", notitie: "De oude is traag" }, b: { titel: "Wachten tot Black Friday", notitie: "" }, context: { inzet: "middel", omkeerbaar: "deels", deadline: null, zichtbaar: false } }); await bewaar("km_dilemmas", d); ga("keuzedilemma", d.id); }); await wacht(400);
    await q.screenshot({ path: path.join(UIT, `${pre}-3-invoer-ab.png`) });
    await q.evaluate(async () => { const d = vind("km_dilemmas", V.param); d.invoerKlaar = true; d.checks = { trek: -1, prive: "A", terug: "B", beideGoed: true }; await bewaar("km_dilemmas", d); await kmMachine(d); }); await wacht(2300);
    await q.screenshot({ path: path.join(UIT, `${pre}-4-band-halverwege.png`) });
    await q.waitForSelector("#km-uitkomst", { timeout: 9000 }); await wacht(300);
    await q.evaluate(() => { document.querySelector("#scherm").scrollTop = 0; }); await wacht(150);
    await q.screenshot({ path: path.join(UIT, `${pre}-5-uitkomstkaart.png`), fullPage: true });
    await q.evaluate(() => ga("keuzetheorie", "route-b")); await wacht(400);
    await q.screenshot({ path: path.join(UIT, `${pre}-6-theoriehoofdstuk.png`), fullPage: true });
    await c.close();
  }
  check(`schermafbeeldingen gemaakt in ${path.relative(ROOT, UIT) || UIT}`, fs.readdirSync(UIT).filter(f => f.endsWith(".png")).length >= 24);
  check("geen console-fouten in de vier nieuwe views en de flows", !fouten.length, fouten.slice(0, 3).join(" | "));
  await browser.close(); server.close();
  console.log(`\n${ok} geslaagd, ${fout} mislukt`);
  process.exit(fout ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
