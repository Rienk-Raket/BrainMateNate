// Rooktest voor V2 (Mijn aanpak), V4 (Ruimtes in clusters) en export/import in Meer met Playwright.
// Gebruik:  NODE_PATH=<map met node_modules/playwright> node tests/structuur.e2e.cjs
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

  /* ---------- V2 zonder profiel ---------- */
  check("V2: zonder kennismaking richting 'geen'", await p.evaluate(() => pfRichting() === "geen"));
  // Het oude profiel telt niet meer: ook een oude 'adhd'-uitslag verandert niets.
  await p.evaluate(async () => { await zetInst("profiel", { nd: { antwoorden: [4,4,4,4,4,4,4,4,4,4], richting: "adhd", handmatig: null, energie: true } }); });
  check("V2: oud profiel (10 vragen) vervalt", await p.evaluate(() => pfRichting() === "geen" && !ndAanpak().extraEnergie));

  // Profiel uit de kennismaking: veel behoefte bij prikkels/voorspelbaarheid (P3) en energiekosten (P7).
  const top = await p.evaluate(async () => {
    const a = {};
    for (const q of NATE_VRAGENBANK.questions) if (q.assessment_part === "A" && q.question_id.endsWith(".Q1")) a[q.question_id] = "never";
    for (const d of ["A2.1", "A3.1", "A3.2", "A4.4", "A3.3"]) { a[d + ".Q1"] = "very_often"; a[d + ".Q2"] = "very_often"; a[d + ".Q3"] = "often"; }
    await knZet({ antwoorden: a, markeringen: {}, klaar: true, gestart: new Date().toISOString() });
    apCache = null;
    return aanpak().top.map(c => c.id);
  });
  check("V2: patronen uit de kennismaking", top.includes("P3") && top.includes("P7"), JSON.stringify(top));
  check("V2: richting voor de modules (autisme + energie)", await p.evaluate(() => pfRichting() === "autisme" && ndAanpak().extraEnergie === true));
  check("V2: dichtheid volgt de nieuwe richting", await p.evaluate(() => ndDichtheidStandaard() === "normaal"));

  await p.evaluate(() => ga("profiel")); await wacht(400);
  check("V2: Profiel opent met Mijn aanpak", await p.locator(".ap-ingang").count() === 1);
  check("V2: oude tien vragen uit het profiel", await p.locator('[data-pf="aanpak"], [data-act="pf-vragen"]').count() === 0);
  await p.click(".ap-ingang"); await wacht(400);
  check("V2: Mijn aanpak toont de metaforen", (await p.locator("#scherm .ap-patronen").textContent()).includes("Vuurtoren"));
  check("V2: Nate stelt Vaste indeling voor (P3)", await p.evaluate(() => { const r = document.querySelector('[data-ap="vast"]'); return !!r.querySelector(".ap-voorstel") && r.getAttribute("aria-pressed") === "false"; }));
  check("V2: elke aanpassing heeft een waarom met bewijs", await p.evaluate(() => [...document.querySelectorAll(".ap-rij")].every(r => /Direct|Indirect|Praktisch/.test(r.querySelector(".iv-waarom p").textContent))));
  check("V2: disclaimer zichtbaar", (await p.locator("#scherm .kn-disclaimer").textContent()).includes("diagnose"));
  await p.screenshot({ path: path.join(UIT, "v2-01-mijn-aanpak.png"), fullPage: true });
  await p.click('[data-ap="vast"]'); await wacht(300);
  check("V2: Vaste indeling aan na één tik", await p.evaluate(() => inst("vasteIndeling") === true && document.querySelector('[data-ap="vast"]').getAttribute("aria-pressed") === "true"));
  await p.click('[data-ap="vast-knop"]'); await wacht(200);
  await p.evaluate(async () => { await maakTaakUitTekst("Iets kleins vandaag"); ga("vandaag"); }); await wacht(300);
  check("V2: Ik loop vast uit = niet op de Nu-kaart", await p.locator(".md-nu [data-iv]").count() === 0);
  await p.evaluate(async () => { await zetInst("ivNu", true); }); 
  

  /* ---------- V4 Ruimtes ---------- */
  await p.evaluate(() => ga("ruimtes")); await wacht(400);
  check("V4: vaste indeling → vaste drie", await p.evaluate(() => [...document.querySelectorAll(".rv-nu-lijst [data-view]")].map(b => b.dataset.view).join() === "persoonlijk,huishouden,anker"));
  check("V4: vijf clusters, alle zestien ruimtes", await p.evaluate(() => document.querySelectorAll(".rv-kop").length === 5 && RV_CLUSTERS.flatMap(c => c.ruimtes).sort().join() === NV_RUIMTES.map(r => r.view).sort().join()));
  await p.evaluate(async () => { await zetInst("vasteIndeling", false); teken(); }); await wacht(300);
  check("V4: voor jou, nu = drie ruimtes", await p.locator(".rv-nu-lijst [data-view]").count() === 3);
  check("V4: live status (taken vandaag)", (await p.locator('.rv-nu-lijst, .nv-kamers').first().textContent()).length > 0);
  check("V4: alles ingeklapt bij binnenkomst", await p.locator(".rv-cluster.open").count() === 0);
  await p.click('[data-rv="thuis"]'); await wacht(250);
  check("V4: cluster open met zijn ruimtes", await p.evaluate(() => document.querySelectorAll(".rv-cluster.open [data-view]").length === 3));
  await p.click('[data-rv="lichaam"]'); await wacht(250);
  check("V4: één cluster tegelijk open", await p.evaluate(() => document.querySelectorAll(".rv-cluster.open").length === 1 && document.querySelector(".rv-cluster.open [data-rv]").dataset.rv === "lichaam"));
  await p.screenshot({ path: path.join(UIT, "v4-01-ruimtes.png"), fullPage: true });
  check("V4: tikvlakken ≥ 44 px", (await tikvlakken(p)).length === 0, JSON.stringify(await tikvlakken(p)));
  await p.click('.rv-cluster.open [data-view="anker"]'); await wacht(400);
  check("V4: ruimte opent", await p.evaluate(() => V.view === "anker"));

  /* ---------- Meer: export en import ---------- */
  await p.evaluate(() => ga("meer")); await wacht(400);
  check("Meer: gegevensblok bovenaan", await p.evaluate(() => document.querySelector("#scherm").firstElementChild.classList.contains("rv-gegevens")));
  check("Meer: vijf regels + alle schermen ingeklapt", await p.evaluate(() => document.querySelectorAll("#scherm > .card .nv-rij").length === 5 && !document.querySelector(".rv-alle").open));
  await p.screenshot({ path: path.join(UIT, "meer-01.png"), fullPage: true });
  const [dl] = await Promise.all([p.waitForEvent("download", { timeout: 8000 }).catch(() => null), p.click('.rv-gegevens [data-act="backup-json"]')]);
  let exp = null;
  if (dl) exp = JSON.parse(fs.readFileSync(await dl.path(), "utf8"));
  check("Meer: export levert één bestand", !!dl, dl ? dl.suggestedFilename() : "geen download");
  check("Meer: export bevat alle 55 opslagplekken", exp && Object.keys(exp.data).length === 55, exp ? Object.keys(exp.data).length : "");
  check("Meer: export bevat profiel en taken", exp && exp.data.instellingen.some(r => r.sleutel === "nate_km") && exp.data.taken.length >= 1);
  await p.click('[data-rvg="import"]'); await wacht(350);
  check("Meer: import vraagt samenvoegen of vervangen", await p.locator('#blad.open [data-act="backup-import"]').count() === 2);
  await p.evaluate(() => bladSluit()); await wacht(300);
  // Import in een lege app: alles terug.
  if (exp) {
    const tmp = path.join(UIT, "export-test.json"); fs.writeFileSync(tmp, JSON.stringify(exp));
    const c2 = await nieuw(), p2 = volg(await c2.newPage());
    await p2.goto(BASIS + "/"); await wacht(1500); await p2.click('[data-kn="later"]').catch(() => {}); await wacht(300);
    await p2.evaluate(() => ga("meer")); await wacht(300);
    await p2.click('[data-rvg="import"]'); await wacht(350);
    const [kiezer] = await Promise.all([p2.waitForEvent("filechooser"), p2.click('#blad [data-act="backup-import"][data-modus="samenvoegen"]')]);
    await kiezer.setFiles(tmp); await wacht(1500);
    const st = await p2.evaluate(() => ({ taken: S.taken.map(t => t.titel), klaar: (inst("nate_km") || {}).klaar, r: pfRichting(), toast: (document.querySelector("#toast") || {}).textContent }));
    check("Meer: import zet taken en profiel terug", st.taken.includes("Iets kleins") && st.klaar && st.r === "autisme", JSON.stringify(st));
    await c2.close();
  }

  check("geen consolefouten", fouten.length === 0, fouten.slice(0, 3).join(" | "));
  check("nul externe verzoeken", extern.length === 0, extern.slice(0, 3).join(" | "));
  await browser.close(); server.close();
  console.log(`\n${ok} geslaagd, ${fout} mislukt`);
  process.exit(fout ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
