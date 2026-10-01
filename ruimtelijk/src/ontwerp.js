"use strict";
/* ==========================================================================
   50c. Ontwerp — het ontwerpsysteem als levend scherm in de app
   De leesbare, ingebouwde versie van docs/spatial/futureme-spatial-specificatie-v4.md:
   principes, dieptekaart, kleurtokens met live contrastcontrole, bewegingstokens
   met demo's en de actuele status van de ruimtelijke laag.
   Bereikbaar via Meer → App → Ontwerp en via Instellingen → Weergave.
   ========================================================================== */
KOPPEN.ontwerp = ["Ontwerp", () => "Glas, diepte en beweging · v" + FM_RUIMTE.versie];

const OW_PRINCIPES = [
  ["Eén ruimte", "Schermen zijn lagen in dezelfde ruimte. Een kaart opent zich tot het scherm erachter en klapt terug naar dezelfde plek."],
  ["Beweging met oorsprong", "Elke animatie start waar je tikte en eindigt waar je kijkt. Geen beweging zonder aanwijsbare oorzaak."],
  ["Data die leeft", "Cijfers tellen op, ringen vullen zich, lijnen tekenen zich. Zo zie je waar een waarde vandaan komt."],
  ["Rust wint", "Leesbaarheid, voorspelbaarheid en toegankelijkheid gaan altijd voor effect. Rustig en Uit zijn volwaardige standen."],
  ["Lokaal en privé", "Geen externe bronnen, geen tracking. Alles blijft op dit toestel."]
];
const OW_LAGEN = [
  ["Focus", "Pincode, bladen en meldingen", "--fm-z-focus"],
  ["Navigatie", "Kop en zwevende onderbalk", "--fm-z-nav"],
  ["Kaarten", "Glazen panelen en knoppen", "--fm-z-inhoud"],
  ["Inhoud", "Het scherm dat je leest", "--fm-z-inhoud"],
  ["Achtergrond", "Aurora die meeleeft met dagdeel en voortgang", "--fm-z-achter"]
];
const OW_KLEUREN = [["--accent", "Accent"], ["--green", "Groen"], ["--purple", "Paars"], ["--amber", "Amber"], ["--red", "Rood"], ["--text", "Tekst"], ["--muted", "Bijschrift"], ["--card", "Kaart"], ["--bg", "Achtergrond"]];
const OW_BEWEGING = [
  ["Indrukken", "180 ms · veer", "druk"],
  ["Tab wisselen", "420 ms · diepte + parallax", "tab"],
  ["Kaart → scherm", "460 ms · oorsprong groeit", "oorsprong"],
  ["Getal", "700 ms · optellen", "tel"],
  ["Afronden", "620 ms · lichtexplosie", "burst"],
  ["Veer", "linear()-veercurve", "veer"]
];

/** Relatieve luminantie en contrast (WCAG 2.2). */
function owRgb(kleur) {
  const c = document.createElement("canvas").getContext("2d");
  c.fillStyle = "#000"; c.fillStyle = kleur;
  const h = c.fillStyle;
  if (/^#/.test(h)) return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const m = h.match(/[\d.]+/g); return m ? m.slice(0, 3).map(Number) : [0, 0, 0];
}
function owLum([r, g, b]) {
  const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
  return .2126 * f(r) + .7152 * f(g) + .0722 * f(b);
}
function owContrast(a, b) {
  const [x, y] = [owLum(owRgb(a)), owLum(owRgb(b))].sort((p, q) => q - p);
  return (x + .05) / (y + .05);
}
function owVar(naam) { return getComputedStyle(document.documentElement).getPropertyValue(naam).trim(); }

function vwOntwerp() {
  const h = document.documentElement.dataset;
  const status = !rtAan() ? (rtStil() ? "Uit (toestel: beweging verminderen)" : "Uit") : h.budget === "licht" ? "Licht (automatisch, voor soepelheid)" : h.beweging === "rustig" ? "Rustig" : "Vol";
  const fps = FM_RUIMTE.fps.length ? Math.round(FM_RUIMTE.fps.reduce((s, f) => s + f, 0) / FM_RUIMTE.fps.length) + " fps" : "nog niet gemeten";
  const energie = Math.round(parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--fm-energie") || 0) * 100);
  const bg = owVar("--card") || "#fff";
  const kleuren = OW_KLEUREN.map(([v, n]) => {
    const k = owVar(v);
    const c = owContrast(k, bg), ok = c >= 4.5 ? "AA" : c >= 3 ? "AA groot" : "decoratief";
    return `<div class="ow-kleur"><i style="background:var(${v})"></i><span><b>${n}</b><code>${v}</code></span><em class="${c >= 4.5 ? "ok" : c >= 3 ? "half" : ""}" title="Contrast op een kaart">${c.toFixed(1)}:1 · ${ok}</em></div>`;
  }).join("");
  return `
    <section class="card card-pad ow-intro">
      <div class="ow-badge">Spatial Experience v${FM_RUIMTE.versie}</div>
      <h2>Eén samenhangende ruimte</h2>
      <p>FutureMe voelt als één digitale ruimte in plaats van losse schermen. Hieronder zie je de bouwstenen, live uit de app zelf. De volledige specificatie staat in <code>docs/spatial/</code>.</p>
    </section>

    ${sectie("Principes")}
    <div class="ow-principes">${OW_PRINCIPES.map(([t, u], i) => `<article class="card card-pad ow-principe"><span class="ow-nr">${i + 1}</span><h3>${t}</h3><p>${u}</p></article>`).join("")}</div>

    ${sectie("Dieptekaart", null, `<button class="actie" data-act="ow-diepte">Uitklappen</button>`)}
    <div class="card card-pad ow-diepte-kaart">
      <div class="ow-stapel" id="ow-stapel" aria-label="Vijf lagen van voor naar achter">
        ${OW_LAGEN.map(([n, u, z], i) => `<div class="ow-laag" style="--i:${i}"><b>${n}</b><span>${u}</span><code>${z}</code></div>`).join("")}
      </div>
    </div>

    ${sectie("Kleur en contrast")}
    <div class="card card-pad"><div class="ow-kleuren">${kleuren}</div>
      <p class="klein" style="margin:10px 0 0">Contrast gemeten op de kaartkleur van het huidige thema. Tekst moet minstens 4,5:1 halen (WCAG 2.2 AA); kleur is nooit het enige signaal.</p></div>

    ${sectie("Beweging")}
    <div class="card card-pad ow-beweging">
      ${OW_BEWEGING.map(([n, u, d]) => `<div class="ow-mot"><span><b>${n}</b><small>${u}</small></span><button class="knop klein${d === "oorsprong" ? " primair" : ""}" data-act="ow-demo" data-demo="${d}">${d === "tel" ? `<span data-ow-tel>0</span>` : d === "veer" ? `<i class="ow-bal" aria-hidden="true"></i>Speel` : "Speel"}</button></div>`).join("")}
    </div>

    ${sectie("Status")}
    <div class="card card-pad ow-status">
      <div><span>Beweging</span><b>${esc(status)}</b></div>
      <div><span>Dagdeel (aurora)</span><b>${esc(h.dagdeel || "–")}</b></div>
      <div><span>Energie vandaag</span><b>${energie}%</b></div>
      <div><span>Gemeten tijdens overgangen</span><b>${fps}</b></div>
      <div><span>Thema</span><b>${esc(inst("thema", "systeem"))}</b></div>
      <div><span>Hoger contrast</span><b>${inst("contrast", false) ? "aan" : "uit"}</b></div>
      <button class="knop klein rand" data-act="ga" data-view="instellingen" style="margin-top:8px">${ico("instel")} Beweging en weergave instellen</button>
    </div>`;
}

/* ---------- Demo's ---------- */
document.addEventListener("click", e => {
  const d = e.target.closest && e.target.closest('[data-act="ow-demo"],[data-act="ow-diepte"]');
  if (!d) return;
  if (d.dataset.act === "ow-diepte") {
    const s = $("#ow-stapel"); if (!s) return;
    const open = s.classList.toggle("open");
    d.textContent = open ? "Inklappen" : "Uitklappen";
    return;
  }
  const soort = d.dataset.demo, r = d.getBoundingClientRect();
  if (!rtAan()) { toast("Beweging staat uit — zet de ruimtelijke interface aan om te kijken"); return; }
  if (soort === "burst") rtBurst(r.left + r.width / 2, r.top + r.height / 2, owVar("--accent"));
  else if (soort === "oorsprong") { const s = $("#scherm"); if (s) rtOorsprongGeest(r, s.getBoundingClientRect()); }
  else if (soort === "tel") { const t = d.querySelector("[data-ow-tel]"); if (t) rtTel(t, 0, 1234.5, "€ ", "", { dec: 2, duizend: true, sep: "," }, "€ 1.234,50"); }
  else if (soort === "tab") { const s = $("#scherm"); if (s) s.animate([{ opacity: 0, transform: "translateX(22px) scale(.96)", filter: "blur(6px)" }, { opacity: 1, transform: "none", filter: "blur(0px)" }], { duration: rtDuur(420), easing: RT_E }); }
  else if (soort === "veer") { const b = d.querySelector(".ow-bal"); if (b) { b.classList.remove("gaan"); void b.offsetWidth; b.classList.add("gaan"); } }
  else d.animate([{ transform: "scale(1)" }, { transform: "scale(.9)" }, { transform: "scale(1)" }], { duration: 420, easing: getComputedStyle(document.documentElement).getPropertyValue("--fm-veer").trim() || RT_E });
});
