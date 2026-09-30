// Rooktest voor de kennismaking met Nate (sectie 85) met Playwright.
// Eigen webserver op de repo-map; geen andere afhankelijkheden.
// Gebruik:  NODE_PATH=<map met node_modules/playwright> node tests/kennismaking.e2e.cjs
// Opties (env): CHROMIUM=<pad naar chrome>, SCHERMEN=<map voor schermafbeeldingen> (standaard tests/uitvoer)
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
  const volg = p => {
    p.on("pageerror", e => fouten.push(e.message));
    p.on("console", m => { if (m.type() === "error" && !/favicon|404/.test(m.text())) fouten.push(m.text()); });
    p.on("request", r => { if (!r.url().startsWith(BASIS)) extern.push(r.url()); });
    return p;
  };
  const nieuw = o => browser.newContext(Object.assign({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, o || {}));
  // Alle tikvlakken op het scherm minstens 44 × 44 px (behalve verborgen).
  const tikvlakken = (p, bereik) => p.evaluate(b => [...document.querySelectorAll(`${b} button, ${b} label, ${b} input, ${b} summary`)]
    // Een radio of checkbox in een .kn-optie is geen eigen tikvlak: het hele label is dat.
    .filter(el => el.offsetParent && !(el.tagName === "INPUT" && el.closest(".kn-optie"))).map(el => [el.tagName + "." + el.className, el.offsetWidth, el.offsetHeight])
    .filter(([, w, h]) => w < 44 || h < 44), bereik || "#scherm");
  const focusZichtbaar = p => p.evaluate(() => { const el = document.activeElement; if (!el || el === document.body) return false; const s = getComputedStyle(el); return s.outlineStyle !== "none" || !!el.closest(".kn-optie"); });

  /* ---------- 1. Eerste start: kennismaking opent vanzelf ---------- */
  const ctx = await nieuw(), p = volg(await ctx.newPage());
  await p.goto(BASIS + "/"); await wacht(1500);
  check("eerste start opent de kennismaking", await p.evaluate(() => V.view === "kennismaking"));
  check("welkom heeft Beginnen en Later", await p.locator('[data-kn="begin"]').count() === 1 && await p.locator('[data-kn="later"]').count() === 1);
  await p.screenshot({ path: path.join(UIT, "kn-01-welkom-390.png") });
  check("welkom: tikvlakken ≥ 44 px", (await tikvlakken(p)).length === 0, JSON.stringify(await tikvlakken(p)));

  /* ---------- 2. Naam, dan de eerste kernvraag ---------- */
  await p.click('[data-kn="begin"]'); await wacht(250);
  check("naamscherm", await p.locator("#kn-naam").count() === 1);
  await p.fill("#kn-naam", "Kas");
  await p.click('[data-kn="volgende"]'); await wacht(250);
  const legend = await p.locator(".kn-vraag legend").textContent();
  const q1 = await p.evaluate(() => NATE_VRAGENBANK.questions[0].question_text);
  check("eerste kernvraag letterlijk uit de vragenbank", legend.trim() === q1, legend.trim());
  check("antwoorden als radiogroep in fieldset", await p.locator('fieldset.kn-vraag input[type=radio][name="kn-antwoord"]').count() === 7);
  check("voortgangstekst", /1 van ongeveer \d+/.test(await p.locator(".kn-teller").textContent()));
  check("Volgende uit zolang niets gekozen", await p.locator('[data-kn="volgende"]').isDisabled());
  check("focus op de vraag na tekenen", await p.evaluate(() => document.activeElement && document.activeElement.id === "kn-focus"));
  await p.screenshot({ path: path.join(UIT, "kn-02-kernvraag-390.png") });
  check("kernvraag: tikvlakken ≥ 44 px", (await tikvlakken(p)).length === 0, JSON.stringify(await tikvlakken(p)));

  /* ---------- 3. Antwoord kiezen gaat automatisch door; Vorige werkt ---------- */
  await p.click('.kn-optie:has(input[value="often"])'); await wacht(400);
  check("na een tik door naar vraag 2", /^2 van/.test((await p.locator(".kn-teller").textContent()).trim()));
  check("antwoord bewaard", await p.evaluate(() => inst("nate_km").antwoorden["A1.1.Q1"] === "often"));
  check("Nate reageert kort", (await p.locator(".kn-nate p").textContent()).length > 0);
  await p.click('[data-kn="vorige"]'); await wacht(250);
  check("Vorige toont vraag 1 met het antwoord aangevinkt", await p.locator('input[value="often"]').isChecked());
  await p.click('[data-kn="volgende"]'); await wacht(250);

  /* ---------- 4. Toetsenbord: pijltjes springen niet weg ---------- */
  await p.keyboard.press("Tab"); await p.keyboard.press("ArrowDown"); await wacht(300);
  check("toetsenbordkeuze blijft op dezelfde vraag", /^2 van/.test((await p.locator(".kn-teller").textContent()).trim()));
  check("focus zichtbaar op een antwoord", await focusZichtbaar(p));

  /* ---------- 5. Pauzeren en hervatten na herladen ---------- */
  await p.click('[data-kn="pauze"]'); await wacht(400);
  check("pauze: terug naar het startscherm", await p.evaluate(() => V.view !== "kennismaking"));
  await p.reload(); await wacht(1500);
  check("na herladen niet opnieuw de kennismaking", await p.evaluate(() => V.view !== "kennismaking"));
  await p.evaluate(() => ga("profiel")); await wacht(300);
  check("profiel toont 'Verder waar je was'", (await p.locator('[data-kn="start"]').textContent()).includes("Verder"));
  await p.click('[data-kn="start"]'); await wacht(300);
  check("hervat bij de eerste open vraag", /^2 van/.test((await p.locator(".kn-teller").textContent()).trim()) && await p.evaluate(() => V.view === "kennismaking"));

  /* ---------- 6. Snel de 16 kernvragen + 4 voorkeur + verdieping invullen ---------- */
  const alle = await p.evaluate(async () => {
    // Antwoorden zoals een gebruiker ze zou geven, maar via de opslag (sneller dan 40 tikken).
    const d = knData(); let n = 0;
    const patroon = ["often", "very_often", "sometimes", "often"];
    for (let i = 0; i < 60; i++) {
      const route = knRoute(knData()); const open = nsVolgende(route, knData().antwoorden); if (!open) break;
      // Elke derde Q3 blijft "niet van toepassing": zo testen we ook ontbrekende antwoorden.
      const w = open.endsWith(".Q3") && n % 3 === 0 ? "not_applicable" : patroon[n % patroon.length]; n++;
      const dd = knData(); dd.antwoorden[open] = w; await knZet({ antwoorden: dd.antwoorden });
    }
    const r = knRoute(knData());
    return { n, lengte: r.length, kern: nsKernKlaar(NATE_VRAGENBANK, knData().antwoorden) };
  });
  check("route tussen 32 en 44 vragen", alle.lengte >= 32 && alle.lengte <= 44, JSON.stringify(alle));
  check("kernvragen klaar", alle.kern);
  // Naar de laatste vraag van de route en dan Volgende, zoals een gebruiker dat doet.
  await p.evaluate(async () => { const r = knRoute(knData()); await knNaar("q:" + r[r.length - 1]); }); await wacht(300);
  await p.click('[data-kn="volgende"]'); await wacht(300);
  const stap = await p.evaluate(() => knHuidig(knData()));
  check("daarna de contextmodule", stap.startsWith("ctx:") || stap.startsWith("geb:"), stap);
  await p.screenshot({ path: path.join(UIT, "kn-03-context-390.png") });
  check("context: tikvlakken ≥ 44 px", (await tikvlakken(p)).length === 0, JSON.stringify(await tikvlakken(p)));
  // Levensgebieden (checkbox) en "Dit deel later".
  if (stap.startsWith("geb:")) { await p.click('.kn-optie:has(input[value="werk"])'); await p.click('.kn-optie:has(input[value="thuis"])'); await p.click('[data-kn="volgende"]'); await wacht(250); }
  await p.click('[data-kn="deel-later"]'); await wacht(300);
  check("Dit deel later springt naar dichtheid", await p.evaluate(() => knHuidig(knData()) === "dichtheid"));
  await p.click('.kn-optie:has(input[value="rustig"])');
  await p.click('[data-kn="volgende"]'); await wacht(300);
  check("dichtheid bewaard", await p.evaluate(() => inst("ndDichtheid") === "rustig"));
  check("samenvatting", await p.evaluate(() => knHuidig(knData()) === "samenvatting"));
  await p.screenshot({ path: path.join(UIT, "kn-04-samenvatting-390.png") });
  const clusters = await p.locator(".kn-clusters li").count();
  check("samenvatting: hooguit drie clusters met metafoor", clusters >= 1 && clusters <= 3, String(clusters));
  const tekst = await p.locator("#scherm").textContent();
  check("geen percentages of diagnosewoorden", !/%|ADHD|autisme|dyslexie/i.test(tekst));
  check("disclaimer zichtbaar", tekst.includes("Dit profiel is geen diagnose"));
  check("uitsteltest is over te slaan", await p.locator('[data-view="keuzetest"]').count() === 1);

  /* ---------- 7. Profielrapport en wijzigen ---------- */
  await p.click('[data-kn="naar-profiel"]'); await wacht(400);
  check("profielscherm", await p.evaluate(() => V.view === "profiel"));
  const rap = await p.locator(".kn-rapport").textContent(), scherm = await p.locator("#scherm").textContent();
  check("rapport: patronen, microstap, waarom, compleetheid, disclaimer", ["Jouw patronen", "Het kan helpen dit te testen", "Waarom zeg je dit?", "Hoe compleet is dit?", "Dit profiel is geen diagnose"].every(t => scherm.includes(t)));
  // Alleen het nieuwe rapport: het oude profielscherm (reserve voor ndAanpak) toont nog wel procenten.
  check("rapport: geen totaalscore of percentages", !/%|totaalscore/i.test(rap));
  await p.screenshot({ path: path.join(UIT, "kn-05-rapport-390.png"), fullPage: true });
  check("rapport: tikvlakken ≥ 44 px", (await tikvlakken(p, ".kn-rapport, .kn-wijzig")).length === 0, JSON.stringify(await tikvlakken(p, ".kn-rapport, .kn-wijzig")));
  await p.locator(".kn-wijzig summary").click(); await wacht(200);
  await p.locator('[data-kn="wijzig"]').first().click(); await wacht(300);
  check("wijzigen opent die vraag", await p.evaluate(() => V.view === "kennismaking" && knHuidig(knData()) === "q:A1.1.Q1"));
  await p.click('.kn-optie:has(input[value="never"])'); await wacht(400);
  check("na wijziging terug naar profiel", await p.evaluate(() => V.view === "profiel" && inst("nate_km").antwoorden["A1.1.Q1"] === "never"));
  check("de oude tien profielvragen staan er nog (reserve voor ndAanpak)", await p.evaluate(() => typeof ndAanpak === "function" && !!document.querySelector("#scherm .pf-sectie")));
  await ctx.close();

  /* ---------- 8. Later: neutrale start; dan Nate's bericht ---------- */
  {
    const c2 = await nieuw(), p2 = volg(await c2.newPage());
    await p2.goto(BASIS + "/"); await wacht(1500);
    await p2.click('[data-kn="later"]'); await wacht(400);
    check("Later: neutraal startscherm", await p2.evaluate(() => V.view === inst("startscherm", "welkom")));
    await p2.reload(); await wacht(1500);
    check("Later blijft onthouden na herladen", await p2.evaluate(() => V.view !== "kennismaking"));
    check("Nate zet een bericht klaar om kennis te maken", await p2.evaluate(() => nateBerichten().some(b => b.actieView === "kennismaking")));
    await c2.close();
  }

  /* ---------- 9. 360 × 740, donker, minder beweging ---------- */
  {
    const c3 = await nieuw({ viewport: { width: 360, height: 740 }, colorScheme: "dark", reducedMotion: "reduce" }), p3 = volg(await c3.newPage());
    await p3.goto(BASIS + "/"); await wacht(1500);
    await p3.screenshot({ path: path.join(UIT, "kn-06-welkom-360-donker.png") });
    await p3.click('[data-kn="begin"]'); await wacht(200); await p3.click('[data-kn="volgende"]'); await wacht(300);
    await p3.screenshot({ path: path.join(UIT, "kn-07-kernvraag-360-donker.png") });
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
