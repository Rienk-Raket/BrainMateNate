// Rooktest voor V5 (dagniveau) en V8 (herstel na een gemiste afspraak) met Playwright.
// Gebruik:  NODE_PATH=<map met node_modules/playwright> node tests/niveau-herstel.e2e.cjs
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
    await maakTaakUitTekst("Belastingaangifte vandaag ~45m p2");
    await maakTaakUitTekst("Plant water geven vandaag ~5m");
    await maakTaakUitTekst("Mail Sam vandaag ~15m");
    await maakTaakUitTekst("Opruimen vandaag ~30m");
    ga("vandaag");
  });
  await wacht(400);

  /* ---------- V5 Dagniveau ---------- */
  check("V5: dagniveau bovenaan Mijn dag", await p.evaluate(() => document.querySelector("#scherm").firstElementChild.classList.contains("dn-blok")));
  check("V5: zonder check-in standaard, geen voorstel", await p.evaluate(() => document.querySelector('[data-dn="standaard"]').getAttribute("aria-checked") === "true" && !document.querySelector(".dn-voorstel")));
  // Check-in met weinig energie en een intentie.
  await p.evaluate(async () => { await dcBewaar({ checkinTs: new Date().toISOString(), energieNr: 2, energie: "laag", intentie: "Aangifte afronden" }); teken(); });
  await wacht(300);
  check("V5: intentie als kopregel", (await p.locator(".dn-intentie").textContent()).includes("Aangifte afronden"));
  check("V5: Nate stelt minimum voor bij weinig energie, kiest niet zelf", await p.evaluate(() => !!document.querySelector('[data-dn="minimum"] .dn-voorstel') && document.querySelector('[data-dn="standaard"]').getAttribute("aria-checked") === "true"));
  await p.screenshot({ path: path.join(UIT, "v5-01-voorstel.png") });
  await p.click('[data-dn="minimum"]'); await wacht(350);
  check("V5: minimum gekozen en bewaard voor vandaag", await p.evaluate(() => inst("dnNiveau").niveau === "minimum" && inst("dnNiveau").datum === vandaagISO()));
  check("V5: Nu-kaart toont het kleinste ding", await p.evaluate(() => { const een = mdNu().een, min = Math.min(...fmVandaagTaken().open.map(t => +t.duur || 15)); return (+een.duur || 15) === min && document.querySelector(".md-nu h2").textContent.includes(een.titel); }));
  check("V5: de rest wacht, er gaat niets weg", await p.evaluate(() => { const open = fmVandaagTaken().open.length; return new RegExp((open - 1) + " dingen wachten").test(document.querySelector(".dn-geparkeerd").textContent) && S.taken.filter(t => !t.af).length >= 4; }));
  check("V5: Even landen bij minimum", await p.locator('.dn-landen[data-view="anker"]').count() === 1);
  await p.screenshot({ path: path.join(UIT, "v5-02-minimum.png") });
  await p.click('[data-dn="extra"]'); await wacht(300);
  check("V5: extra toont meer daarna", await p.evaluate(() => mdNu().twee.length >= 3 && !document.querySelector(".dn-geparkeerd")));
  check("V5: tikvlakken ≥ 44 px", (await tikvlakken(p, ".dn-blok")).length === 0, JSON.stringify(await tikvlakken(p, ".dn-blok")));
  await p.click('[data-dn="standaard"]'); await wacht(300);

  /* ---------- V8 Herstel ---------- */
  const aid = await p.evaluate(async () => {
    const a = { id: uid(), titel: "Tandarts", soort: "gesprek", datum: vandaagISO(), tijd: "09:00", eindTijd: "09:30", plek: "Stationsweg 12", personen: ["Dr. Jansen"], voorbereiding: "", notities: "", uitkomst: "", reistijd: 20, gemaakt: new Date().toISOString() };
    const b = Object.assign({}, a, { id: uid(), titel: "Kapper", tijd: "16:00", eindTijd: "16:30", personen: [] });   // nog niet voorbij
    await bewaar("afspraken", a); await bewaar("afspraken", b); teken(); return a.id;
  });
  await wacht(300);
  check("V8: vraag na een voorbije afspraak", (await p.locator(".hs-kaart").textContent()).includes("Tandarts"));
  check("V8: geen vraag voor een afspraak die nog komt", !(await p.locator(".hs-kaart").textContent()).includes("Kapper"));
  check("V8: vraag staat na het dagniveau", await p.evaluate(() => { const s = document.querySelector("#scherm"); return s.children[0].classList.contains("dn-blok") && s.children[1].classList.contains("hs-kaart"); }));
  await p.screenshot({ path: path.join(UIT, "v8-01-vraag.png") });
  await p.click('[data-hs="gemist"]'); await wacht(400);
  check("V8: herstelzin zonder schuld", await p.evaluate(() => { const t = document.querySelector(".hs-zin").textContent; return /rechtzetten/.test(t) && !/moet|schuld|fout/i.test(t); }));
  check("V8: bericht met naam en verantwoordelijkheid", await p.evaluate(() => { const t = document.querySelector("#hs-bericht").value; return t.startsWith("Hoi Dr. Jansen,") && /lag aan mij/.test(t); }));
  check("V8: status gemist bewaard en gelogd", await p.evaluate(id => vind("afspraken", id).hsStatus === "gemist" && S.gebeurtenissen.some(g => /Gemist en opgepakt: Tandarts/.test(g.tekst)), aid));
  await p.click('[data-hs-schakel="reistijd"]'); await wacht(200);
  check("V8: één schakel → één voorstel", (await p.locator(".hs-tip").textContent()).includes("buffer") && await p.locator('[data-hs-actie="buffer"]').count() === 1);
  await p.screenshot({ path: path.join(UIT, "v8-02-herstel.png"), fullPage: true });
  await p.click('[data-hs-actie="buffer"]'); await wacht(300);
  check("V8: buffer vijf minuten ruimer", await p.evaluate(() => mdBufferStd() === 15));
  check("V8: tikvlakken ≥ 44 px", (await tikvlakken(p, "#blad")).length === 0, JSON.stringify(await tikvlakken(p, "#blad")));
  await p.click("#hs-plan"); await wacht(400);
  check("V8: opnieuw plannen met ingevuld afspraakblad", await p.evaluate(() => document.querySelector("#blad.open") && /Tandarts/.test((document.querySelector("#bladinhoud input") || {}).value || document.querySelector("#bladinhoud").innerHTML)));
  await p.evaluate(() => bladSluit()); await wacht(300);
  check("V8: vraag verdwenen na antwoord", await p.locator(".hs-kaart").count() === 0);
  // Geweest-pad
  await p.evaluate(async () => { const a = S.afspraken.find(x => x.titel === "Kapper"); a.tijd = "08:00"; a.eindTijd = "08:30"; await bewaar("afspraken", a); teken(); }); await wacht(300);
  await p.click('[data-hs="geweest"]'); await wacht(300);
  check("V8: geweest → geen herstel, gewoon genoteerd", await p.evaluate(() => S.afspraken.find(x => x.titel === "Kapper").hsStatus === "geweest" && !document.querySelector("#blad.open")));

  check("geen consolefouten", fouten.length === 0, fouten.slice(0, 3).join(" | "));
  check("nul externe verzoeken", extern.length === 0, extern.slice(0, 3).join(" | "));
  await browser.close(); server.close();
  console.log(`\n${ok} geslaagd, ${fout} mislukt`);
  process.exit(fout ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
