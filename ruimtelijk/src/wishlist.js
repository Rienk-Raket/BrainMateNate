"use strict";
/* ==========================================================================
   60. Wishlist — dingen die je wilt kopen, met een compleet beeld
   Per wens: naam, prijs, onderwerp, link, afbeelding, winkel, hoe belangrijk
   (essentieel → leuk om te hebben), hoe graag (1–5), hoe vaak je het gebruikt
   (→ kosten per keer), redenen, waarom, alternatieven, nodig vóór, gespaard
   bedrag en prijsgeschiedenis. Een koopcheck weegt dat samen tot een advies,
   met bedenktijd.
   Lijst: filteren op onderwerp, sorteren (nieuw, prijs, belang, koopcheck,
   deadline, kosten per keer) en groeperen per onderwerp. Twee vinkjes per
   regel: gekocht of niet gekocht → inklapbare tabellen eronder.
   Opslag: winkel wl_items; afbeeldingen in bijlagen (verkleind);
   onderwerpen in instelling "wlOnderwerpen".
   ========================================================================== */
WINKELS.wl_items = "id";
if (!S.wl_items) S.wl_items = [];
V.wlOpen = V.wlOpen || { gekocht: false, niet: false };
V.wlFilter = V.wlFilter || "alle";

const WL_ONDERWERPEN = [["tech", "Elektronica", "📱"], ["kleding", "Kleding", "👕"], ["huis", "Huis & wonen", "🛋️"], ["hobby", "Hobby", "🎨"],
  ["sport", "Sport & gezondheid", "🏃"], ["boeken", "Boeken & media", "📚"], ["reizen", "Reizen & uitjes", "✈️"], ["cadeau", "Cadeau", "🎁"], ["overig", "Overig", "📦"]];
const WL_BELANG = [["essentieel", "Essentieel", "Zonder dit gaat het niet", "#dc2626", 35], ["belangrijk", "Belangrijk", "Maakt echt verschil", "#d97706", 25],
  ["toevoeging", "Voegt iets toe", "Fijn, maar kan zonder", "#2f6fed", 14], ["leuk", "Leuk om te hebben", "Puur voor de lol", "#7a4fd6", 5]];
const WL_GEBRUIK = [["dagelijks", "Dagelijks", 365, 20], ["wekelijks", "Wekelijks", 52, 15], ["maandelijks", "Maandelijks", 12, 8], ["zelden", "Een paar keer per jaar", 4, 2]];
const WL_REDENEN = [["vervanging", "Vervanging: oud of kapot"], ["verbetering", "Verbetering"], ["nieuw", "Iets nieuws proberen"], ["werk", "Nodig voor werk of studie"],
  ["gezond", "Gezondheid of welzijn"], ["tijd", "Scheelt tijd"], ["geld", "Bespaart op termijn geld"], ["cadeau", "Cadeau voor iemand"], ["aanbieding", "Aanbieding"]];
const WL_SORT = [["nieuw", "Nieuwste eerst"], ["check", "Beste koopcheck"], ["belang", "Belangrijkste eerst"], ["prijs-op", "Prijs laag → hoog"], ["prijs-af", "Prijs hoog → laag"],
  ["deadline", "Eerst nodig"], ["perkeer", "Laagste kosten per keer"], ["onderwerp", "Onderwerp A–Z"]];
const WL_BEDENKTIJD = 7;

const wlOnderwerpen = () => { const eigen = inst("wlOnderwerpen", null); return Array.isArray(eigen) && eigen.length ? eigen : WL_ONDERWERPEN; };
const wlOnd = k => wlOnderwerpen().find(o => o[0] === k) || wlOnderwerpen().find(o => o[0] === "overig") || ["overig", "Overig", "📦"];
const wlBel = k => WL_BELANG.find(b => b[0] === k) || null;
const wlGeb = k => WL_GEBRUIK.find(g => g[0] === k) || null;
const wlAlle = status => S.wl_items.filter(x => (x.status || "actief") === status);
const wlSom = lijst => lijst.reduce((a, x) => a + (+x.prijs || 0), 0);
const wlPrijs = n => eur(+n || 0);
const wlPerKeer = x => { const g = wlGeb(x.gebruik); return g && x.prijs ? x.prijs / g[2] : null; };
const wlDagenOp = x => Math.max(0, dagVerschil(vandaagISO(), (x.gemaakt || new Date().toISOString()).slice(0, 10)));
const wlWinkel = x => x.winkel || (x.url ? (() => { try { return new URL(x.url).hostname.replace(/^www\./, ""); } catch (e) { return ""; } })() : "");
const wlMaandbudget = () => maandBudget(vandaagISO());
function wlOnderschrift() {
  const a = wlAlle("actief");
  return a.length ? `${a.length} wens${a.length === 1 ? "" : "en"} · ${wlPrijs(wlSom(a))}` : "Wat je graag wilt kopen";
}
Object.defineProperty(KOPPEN, "wishlist", { get: () => ["Wishlist", wlOnderschrift], configurable: true, enumerable: true });
Object.defineProperty(KOPPEN, "wens", { get: () => { const x = vind("wl_items", V.param); return [x ? x.naam : "Wens", () => x ? wlOnd(x.onderwerp)[2] + " " + wlOnd(x.onderwerp)[1] : ""]; }, configurable: true, enumerable: true });

/* ---------- Koopcheck ---------- */
function wlKoopcheck(x) {
  const r = [], b = wlBel(x.belang), g = wlGeb(x.gebruik);
  let s = 0;
  if (b) { s += b[4]; r.push([b[4] >= 25, `${b[1]}: ${b[2].toLowerCase()}`]); } else r.push([null, "Geef aan hoe belangrijk het is"]);
  if (x.verlangen) { s += x.verlangen * 4; r.push([x.verlangen >= 4, `Je wilt het ${["", "een beetje", "redelijk", "graag", "heel graag", "enorm graag"][x.verlangen]}`]); }
  if (g) { s += g[3]; const pk = wlPerKeer(x); r.push([g[3] >= 15, `${g[1]} gebruikt${pk != null ? ` · ${eur(pk)} per keer in het eerste jaar` : ""}`]); }
  const dagen = wlDagenOp(x), bt = x.bedenktijd || WL_BEDENKTIJD;
  if (dagen >= bt) { s += 15; r.push([true, `Na ${dagen} dagen wil je het nog steeds`]); }
  else { s += Math.round(dagen / bt * 10); r.push([false, `Bedenktijd: nog ${bt - dagen} dag${bt - dagen === 1 ? "" : "en"} wachten`]); }
  if ((x.redenen || []).some(k => ["vervanging", "werk", "gezond", "geld", "tijd"].includes(k))) { s += 8; r.push([true, "Er is een praktische reden"]); }
  if ((x.redenen || []).includes("aanbieding") && (x.redenen || []).length === 1) { s -= 8; r.push([false, "Alleen een aanbieding is geen reden om te kopen"]); }
  const mb = wlMaandbudget();
  if (mb && x.prijs > mb * .5) { s -= 12; r.push([false, `Kost ${Math.round(x.prijs / mb * 100)}% van je maandbudget`]); }
  if (x.gespaard && x.prijs && x.gespaard >= x.prijs) { s += 10; r.push([true, "Je hebt het bedrag al gespaard"]); }
  if (x.nodigOp && x.nodigOp >= vandaagISO() && dagVerschil(x.nodigOp, vandaagISO()) <= 14) r.push([null, `Nodig vóór ${datumLabel(x.nodigOp)}`]);
  s = Math.max(0, Math.min(100, s));
  const oordeel = s >= 70 ? ["Goede aankoop", "var(--green)"] : s >= 45 ? ["Denk er nog even over na", "var(--amber)"] : ["Waarschijnlijk niet nodig", "var(--red)"];
  return { score: s, oordeel, redenen: r };
}

/* ---------- Afbeelding verkleinen en bewaren ---------- */
async function wlAfbeelding(bestand) {
  const url = URL.createObjectURL(bestand);
  try {
    const img = await new Promise((ok, fout) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fout; i.src = url; });
    const max = 900, f = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement("canvas"); c.width = Math.round(img.width * f); c.height = Math.round(img.height * f);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise(ok => c.toBlob(ok, "image/jpeg", .82));
    const bl = { id: uid(), naam: (bestand.name || "wens").replace(/\.\w+$/, "") + ".jpg", type: "image/jpeg", blob: blob || bestand, ts: new Date().toISOString() };
    await bewaar("bijlagen", bl);
    return bl.id;
  } finally { URL.revokeObjectURL(url); }
}
const wlAfbURL = x => { const bl = x.afbeelding && vind("bijlagen", x.afbeelding); return bl ? bijlageURL(bl) : null; };

/* ---------- Lijst ---------- */
function wlDuim(x, mini) {
  const u = wlAfbURL(x), o = wlOnd(x.onderwerp);
  return u ? `<img class="wl-duim${mini ? " mini" : ""}" src="${u}" alt="">` : `<span class="wl-duim zonder${mini ? " mini" : ""}" aria-hidden="true">${o[2]}</span>`;
}
function wlRijActief(x) {
  const b = wlBel(x.belang), kc = wlKoopcheck(x), pk = wlPerKeer(x), vorige = (x.prijzen || []).slice(-2, -1)[0];
  const daling = vorige && vorige.prijs > x.prijs ? Math.round((1 - x.prijs / vorige.prijs) * 100) : 0;
  const meta = [];
  if (wlWinkel(x)) meta.push(esc(wlWinkel(x)));
  if (pk != null) meta.push(`${eur(pk)} per keer`);
  if (x.nodigOp) meta.push(`nodig vóór ${esc(datumLabel(x.nodigOp))}`);
  const spaar = x.gespaard && x.prijs ? Math.min(100, Math.round(x.gespaard / x.prijs * 100)) : 0;
  return `<div class="card wl-kaart" data-wl-rij="${x.id}">
    <button class="wl-kaarthoofd" data-act="ga" data-view="wens" data-param="${x.id}">
      ${wlDuim(x)}
      <span class="wl-info">
        <span class="wl-naam">${esc(x.naam)}</span>
        <span class="wl-chips"><span class="wl-chip">${wlOnd(x.onderwerp)[2]} ${esc(wlOnd(x.onderwerp)[1])}</span>
          ${b ? `<span class="wl-chip belang" style="--bk:${b[3]}">${b[1]}</span>` : ""}
          <span class="wl-chip check" style="--bk:${kc.oordeel[1]}" title="Koopcheck: ${kc.oordeel[0]}">Check ${kc.score}</span></span>
        ${meta.length ? `<span class="wl-meta">${meta.join(" · ")}</span>` : ""}
        ${x.motivatie ? `<span class="wl-mot">${esc(x.motivatie)}</span>` : ""}
        ${spaar ? `<span class="wl-spaar" title="${spaar}% gespaard"><i style="width:${spaar}%"></i></span>` : ""}
      </span>
    </button>
    <span class="wl-rechts">
      <span class="wl-prijs">${wlPrijs(x.prijs)}${daling ? `<small class="wl-daling">↓ ${daling}%</small>` : ""}</span>
      <span class="wl-knoppen">
        <button class="wl-vink ja" data-act="wl-zet" data-id="${x.id}" data-s="gekocht" aria-label="Gekocht: ${esc(x.naam)}" title="Gekocht">${ico("check")}</button>
        <button class="wl-vink nee" data-act="wl-zet" data-id="${x.id}" data-s="niet" aria-label="Niet gekocht: ${esc(x.naam)}" title="Niet gekocht">${ico("x")}</button>
      </span>
    </span>
  </div>`;
}
function wlRijKlaar(x) {
  return `<div class="wl-rij klaar ${x.status}" data-wl-rij="${x.id}">
    <button class="wl-info wl-klaarinfo" data-act="ga" data-view="wens" data-param="${x.id}">
      ${wlDuim(x, true)}<span><span class="wl-naam">${esc(x.naam)}</span>
      <span class="wl-mot">${x.besloten ? esc(datumLabel(x.besloten.slice(0, 10), true)) : ""} · ${wlOnd(x.onderwerp)[2]} ${esc(wlOnd(x.onderwerp)[1])}</span></span>
    </button>
    <span class="wl-prijs">${wlPrijs(x.prijs)}</span>
    <button class="wl-terug" data-act="wl-zet" data-id="${x.id}" data-s="actief" aria-label="Terug naar de wishlist: ${esc(x.naam)}" title="Terug naar de wishlist">${ico("herhaal")}</button>
  </div>`;
}
function wlSectie(status, titel, uitleg) {
  const r = wlAlle(status).sort((a, b) => (b.besloten || "").localeCompare(a.besloten || ""));
  if (!r.length) return "";
  const open = V.wlOpen[status];
  return `<div class="card wl-klaar ${status}">
    <button class="wl-klaarkop" data-act="wl-klap" data-s="${status}" aria-expanded="${open}">
      <span class="wl-klaaricoon">${ico(status === "gekocht" ? "check" : "x")}</span>
      <span class="wl-klaartitel"><b>${titel}</b><small>${r.length} ${r.length === 1 ? "item" : "items"} · ${uitleg}</small></span>
      <span class="wl-klaarsom">${wlPrijs(wlSom(r))}</span>
      ${ico("pijlr", `width:16px;height:16px;color:var(--faint);transform:rotate(${open ? 90 : 0}deg);transition:transform .25s`)}
    </button>
    ${open ? `<div class="wl-tabel">${r.map(wlRijKlaar).join("")}</div>` : ""}
  </div>`;
}
function wlSorteer(lijst) {
  const s = inst("wlSort", "nieuw"), bel = x => { const b = wlBel(x.belang); return b ? b[4] : 0; };
  const f = {
    nieuw: (a, b) => (b.volgorde || 0) - (a.volgorde || 0), check: (a, b) => wlKoopcheck(b).score - wlKoopcheck(a).score,
    belang: (a, b) => bel(b) - bel(a) || (b.verlangen || 0) - (a.verlangen || 0), "prijs-op": (a, b) => (a.prijs || 0) - (b.prijs || 0), "prijs-af": (a, b) => (b.prijs || 0) - (a.prijs || 0),
    deadline: (a, b) => (a.nodigOp || "9999").localeCompare(b.nodigOp || "9999"), perkeer: (a, b) => (wlPerKeer(a) ?? 1e9) - (wlPerKeer(b) ?? 1e9),
    onderwerp: (a, b) => wlOnd(a.onderwerp)[1].localeCompare(wlOnd(b.onderwerp)[1], "nl") || (b.volgorde || 0) - (a.volgorde || 0)
  }[s] || ((a, b) => (b.volgorde || 0) - (a.volgorde || 0));
  return lijst.slice().sort(f);
}
function vwWishlist() {
  const alleActief = wlAlle("actief"), gekocht = wlAlle("gekocht"), niet = wlAlle("niet");
  const actief = wlSorteer(alleActief.filter(x => V.wlFilter === "alle" || (x.onderwerp || "overig") === V.wlFilter));
  const ess = alleActief.filter(x => x.belang === "essentieel" || x.belang === "belangrijk");
  let h = `<div class="card wl-held">
    <div><span class="wl-label">Op je wishlist</span><div class="wl-totaal">${wlPrijs(wlSom(alleActief))}</div>
      <span class="klein">${alleActief.length} wens${alleActief.length === 1 ? "" : "en"}${ess.length ? ` · ${wlPrijs(wlSom(ess))} essentieel of belangrijk` : ""}</span></div>
    <div class="wl-mini">
      <div><b>${wlPrijs(wlSom(gekocht))}</b><span>gekocht</span></div>
      <div><b>${wlPrijs(wlSom(niet))}</b><span>bespaard</span></div>
    </div></div>
  <div class="card wl-nieuw">
    <div class="wl-nieuwrij">
      <input class="invoer" id="wl-naam" type="text" placeholder="Wat wil je kopen?" enterkeyhint="next" autocomplete="off" aria-label="Naam">
      <label class="wl-prijsvak"><span>€</span><input class="invoer" id="wl-prijs" type="text" inputmode="decimal" placeholder="0,00" enterkeyhint="next" aria-label="Prijs"></label>
    </div>
    <input class="invoer" id="wl-mot" type="text" placeholder="Waarom wil je het? (optioneel)" enterkeyhint="done" autocomplete="off" aria-label="Motivatie">
    <div class="knoprij"><button class="knop primair" data-act="wl-toevoegen">${ico("plus")} Op de wishlist</button>
      <button class="knop rand" data-act="wl-nieuw-uitgebreid">Met details…</button></div>
  </div>`;
  if (alleActief.length) {
    const per = {}; alleActief.forEach(x => { const k = x.onderwerp || "overig"; per[k] = (per[k] || 0) + 1; });
    h += `<div class="wl-balk">
      <div class="chiprij scroll wl-filters">${[["alle", "Alles", "✨"]].concat(wlOnderwerpen().filter(o => per[o[0]])).map(([k, n, e]) =>
        `<button class="keuze" data-act="wl-filter" data-f="${k}" aria-pressed="${V.wlFilter === k}">${e} ${esc(n)} <span class="klein">${k === "alle" ? alleActief.length : per[k]}</span></button>`).join("")}</div>
      <div class="wl-sorteer"><label class="wl-sortlabel">${ico("lijst", "width:15px;height:15px")}<select id="wl-sort" aria-label="Sorteren">${WL_SORT.map(([k, n]) => `<option value="${k}"${inst("wlSort", "nieuw") === k ? " selected" : ""}>${n}</option>`).join("")}</select></label>
        <button class="keuze" data-act="wl-groep" aria-pressed="${!!inst("wlGroep", false)}">Per onderwerp</button></div></div>`;
  }
  if (!actief.length) h += `<div class="card">${alleActief.length ? leeg("🔎", "Niets in dit onderwerp") : leeg("🎁", "Je wishlist is leeg", "Zet hierboven iets op je lijst. Vink het later af als gekocht of niet gekocht.")}</div>`;
  else if (inst("wlGroep", false)) {
    const groepen = new Map(); actief.forEach(x => { const k = x.onderwerp || "overig"; (groepen.get(k) || groepen.set(k, []).get(k)).push(x); });
    [...groepen.entries()].sort((a, b) => (a[0] === "overig") - (b[0] === "overig") || wlOnd(a[0])[1].localeCompare(wlOnd(b[0])[1], "nl")).forEach(([k, r]) => {
      h += `<div class="sectie wl-groepkop"><h2>${wlOnd(k)[2]} ${esc(wlOnd(k)[1])}</h2><span class="telling">${r.length} · ${wlPrijs(wlSom(r))}</span></div><div class="wl-lijst">${r.map(wlRijActief).join("")}</div>`;
    });
  } else h += `<div class="wl-lijst">${actief.map(wlRijActief).join("")}</div>`;
  h += wlSectie("gekocht", "Gekocht", "uitgegeven") + wlSectie("niet", "Niet gekocht", "bewust laten liggen");
  if (alleActief.length > 2) h += `<p class="klein" style="text-align:center;margin-top:12px">De koopcheck weegt belang, hoe graag, gebruik, bedenktijd van ${WL_BEDENKTIJD} dagen en je budget. Tik op een wens voor het hele plaatje.</p>`;
  return h;
}

/* ---------- Productpagina ---------- */
function vwWens() {
  const x = vind("wl_items", V.param);
  if (!x) return leeg("🤷", "Deze wens bestaat niet meer");
  const kc = wlKoopcheck(x), b = wlBel(x.belang), g = wlGeb(x.gebruik), pk = wlPerKeer(x), o = wlOnd(x.onderwerp);
  const afb = wlAfbURL(x), status = x.status || "actief";
  const spaar = x.prijs ? Math.min(100, Math.round((x.gespaard || 0) / x.prijs * 100)) : 0;
  const pr = x.prijzen || [];
  let h = `<div class="wl-hero${afb ? " met" : ""}">${afb ? `<img src="${afb}" alt="${esc(x.naam)}">` : `<span class="wl-heroemoji">${o[2]}</span>`}</div>
    <div class="wl-kopblok"><div style="flex:1;min-width:0"><div class="wl-titel">${esc(x.naam)}</div>
      <div class="wl-chips"><span class="wl-chip">${o[2]} ${esc(o[1])}</span>${b ? `<span class="wl-chip belang" style="--bk:${b[3]}">${b[1]}</span>` : ""}
      ${status !== "actief" ? `<span class="wl-chip">${status === "gekocht" ? "✓ Gekocht" : "✕ Niet gekocht"}</span>` : ""}</div></div>
      <div class="wl-grootprijs">${wlPrijs(x.prijs)}</div></div>`;
  if (x.url) h += `<a class="knop breed rand wl-link" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${ico("ketting")} Bekijk bij ${esc(wlWinkel(x) || "de winkel")}</a>`;
  h += `<div class="card card-pad wl-check" style="--kc:${kc.oordeel[1]}">
      <div class="wl-checkkop"><div class="ring" style="--p:${kc.score};--rc:${kc.oordeel[1]}"><span>${kc.score}</span></div>
        <div><span class="wl-label">Koopcheck</span><b>${kc.oordeel[0]}</b></div></div>
      <ul class="wl-redenen">${kc.redenen.map(([ok, t]) => `<li class="${ok === true ? "ja" : ok === false ? "nee" : ""}">${ok === true ? "✓" : ok === false ? "!" : "•"} ${esc(t)}</li>`).join("")}</ul></div>`;
  h += `<div class="wl-feiten">
      <div><span>Hoe belangrijk</span><b>${b ? b[1] : "—"}</b></div>
      <div><span>Hoe graag</span><b class="wl-sterren">${x.verlangen ? "★".repeat(x.verlangen) + "☆".repeat(5 - x.verlangen) : "—"}</b></div>
      <div><span>Gebruik</span><b>${g ? g[1] : "—"}</b></div>
      <div><span>Kosten per keer</span><b>${pk != null ? eur(pk) : "—"}</b></div>
      <div><span>Op de lijst sinds</span><b>${esc(datumLabel((x.gemaakt || "").slice(0, 10) || vandaagISO()))} · ${wlDagenOp(x)} d</b></div>
      <div><span>Nodig vóór</span><b>${x.nodigOp ? esc(datumLabel(x.nodigOp)) : "—"}</b></div>
    </div>`;
  if (x.prijs) h += `<div class="card card-pad wl-sparen"><div class="wl-spaarkop"><b>Gespaard</b><span>${wlPrijs(x.gespaard || 0)} van ${wlPrijs(x.prijs)}</span></div>
      <div class="balk" style="height:9px;margin:8px 0 10px"><i style="width:${spaar}%;background:var(--green)"></i></div>
      <button class="knop klein rand" data-act="wl-sparen" data-id="${x.id}">${ico("plus")} Bedrag opzij zetten</button></div>`;
  if ((x.redenen || []).length || x.motivatie) h += sectie("Waarom kopen") + `<div class="card card-pad">${(x.redenen || []).length ? `<div class="chiprij">${x.redenen.map(k => `<span class="chip">${esc((WL_REDENEN.find(r => r[0] === k) || [k, k])[1])}</span>`).join("")}</div>` : ""}
      ${x.motivatie ? `<p style="margin:${(x.redenen || []).length ? "10px" : 0} 0 0;white-space:pre-wrap">${esc(x.motivatie)}</p>` : ""}</div>`;
  if (x.alternatieven) h += sectie("Alternatieven") + `<div class="card card-pad"><p style="margin:0;white-space:pre-wrap">${esc(x.alternatieven)}</p></div>`;
  if (x.notitie) h += sectie("Notities") + `<div class="card card-pad"><p style="margin:0;white-space:pre-wrap">${esc(x.notitie)}</p></div>`;
  if (pr.length > 1) h += sectie("Prijsverloop", pr.length) + `<div class="card">${pr.slice().reverse().map((p, i, a) => { const v = a[i + 1];
    return `<div class="wl-prijsrij"><span>${esc(datumLabel(p.datum, true))}</span><b>${wlPrijs(p.prijs)}</b>${v ? `<small class="${p.prijs < v.prijs ? "omlaag" : "omhoog"}">${p.prijs < v.prijs ? "↓" : "↑"} ${Math.abs(Math.round((p.prijs / v.prijs - 1) * 100))}%</small>` : "<small></small>"}</div>`; }).join("")}</div>`;
  h += `<div class="knoprij" style="margin:16px 0 4px">
      ${status === "actief" ? `<button class="knop primair" data-act="wl-zet" data-id="${x.id}" data-s="gekocht">${ico("check")} Gekocht</button><button class="knop rand" data-act="wl-zet" data-id="${x.id}" data-s="niet">${ico("x")} Niet gekocht</button>`
        : `<button class="knop rand" data-act="wl-zet" data-id="${x.id}" data-s="actief">${ico("herhaal")} Terug naar de wishlist</button>`}</div>
    <div class="knoprij"><button class="knop rand" data-act="wl-bewerk" data-id="${x.id}">${ico("pen")} Bewerken</button>
      <button class="knop gevaar" data-act="wl-weg" data-id="${x.id}">${ico("prullenbak")} Verwijderen</button></div>`;
  return h;
}

/* ---------- Bewerken en uitgebreid toevoegen ---------- */
function wlBlad(id, voor) {
  const bestaand = id ? vind("wl_items", id) : null;
  const x = bestaand ? JSON.parse(JSON.stringify(bestaand)) : Object.assign({ id: uid(), naam: "", prijs: 0, motivatie: "", onderwerp: V.wlFilter !== "alle" ? V.wlFilter : "overig", status: "actief", redenen: [], gemaakt: new Date().toISOString(), volgorde: Date.now() }, voor || {});
  x.redenen = x.redenen || [];
  let nieuweAfb = null;
  const keuze = (attr, lijst, huidig, lab) => `<div class="keuzerij">${lijst.map(r => `<button class="keuze" ${attr}="${r[0]}" aria-pressed="${huidig === r[0]}">${lab(r)}</button>`).join("")}</div>`;
  const teken2 = () => {
    const bi = $("#bladinhoud"), st = bi ? bi.scrollTop : 0;
    requestAnimationFrame(() => { const b2 = $("#bladinhoud"); if (b2) b2.scrollTop = st; });
    const afb = nieuweAfb ? URL.createObjectURL(nieuweAfb) : wlAfbURL(x);
    $("#bladinhoud").innerHTML = `
      <div class="wl-afbveld">${afb ? `<img src="${afb}" alt="">` : `<span>${wlOnd(x.onderwerp)[2]}</span>`}
        <div class="knoprij"><button class="knop klein rand" id="wlb-foto">${ico("camera")} ${afb ? "Andere afbeelding" : "Afbeelding kiezen"}</button>${afb ? `<button class="knop klein rand" id="wlb-fotoweg">${ico("x")} Weghalen</button>` : ""}</div></div>
      <div class="veld"><label for="wlb-naam">Product</label><input class="invoer" id="wlb-naam" value="${esc(x.naam)}" placeholder="Bv. Sony WH-1000XM5"></div>
      <div class="rij2"><div class="veld"><label for="wlb-prijs">Prijs (€)</label><input class="invoer" id="wlb-prijs" inputmode="decimal" value="${x.prijs ? String(x.prijs).replace(".", ",") : ""}" placeholder="0,00"></div>
        <div class="veld"><label for="wlb-nodig">Nodig vóór</label><input class="invoer" id="wlb-nodig" type="date" value="${x.nodigOp || ""}"></div></div>
      <div class="veld"><label for="wlb-url">Link naar het product</label><input class="invoer" id="wlb-url" type="url" inputmode="url" value="${esc(x.url || "")}" placeholder="https://…"></div>
      <div class="veld"><label for="wlb-winkel">Winkel</label><input class="invoer" id="wlb-winkel" value="${esc(x.winkel || "")}" placeholder="${esc(wlWinkel(x) || "Bv. Coolblue")}"></div>
      <div class="veld"><span class="labeltekst">Onderwerp</span>${keuze("data-wlb-ond", wlOnderwerpen(), x.onderwerp, o => `${o[2]} ${esc(o[1])}`)}
        <div class="wl-nieuwond"><input class="invoer" id="wlb-nieuwond" placeholder="Nieuw onderwerp, bv. Keuken" maxlength="24"><button class="knop klein rand" id="wlb-ondplus">Toevoegen</button></div></div>
      <div class="veld"><span class="labeltekst">Hoe belangrijk is het?</span><div class="wl-belangkeuze">${WL_BELANG.map(b => `<button data-wlb-bel="${b[0]}" aria-pressed="${x.belang === b[0]}" style="--bk:${b[3]}"><b>${b[1]}</b><span>${b[2]}</span></button>`).join("")}</div></div>
      <div class="veld"><span class="labeltekst">Hoe graag wil je het?</span><div class="hs-beoordeling">${[1, 2, 3, 4, 5].map(n => `<button data-wlb-ster="${n}" class="${n <= (x.verlangen || 0) ? "aan" : ""}" aria-label="${n} van 5">★</button>`).join("")}</div></div>
      <div class="veld"><span class="labeltekst">Hoe vaak ga je het gebruiken?</span>${keuze("data-wlb-geb", WL_GEBRUIK, x.gebruik, g => esc(g[1]))}</div>
      <div class="veld"><span class="labeltekst">Waarom kopen?</span><div class="keuzerij">${WL_REDENEN.map(r => `<button class="keuze" data-wlb-red="${r[0]}" aria-pressed="${x.redenen.includes(r[0])}">${esc(r[1])}</button>`).join("")}</div></div>
      <div class="veld"><label for="wlb-mot">In je eigen woorden</label><textarea class="invoer" id="wlb-mot" style="min-height:70px" placeholder="Wat lost het op? Wat verandert er als je het hebt?">${esc(x.motivatie || "")}</textarea></div>
      <div class="veld"><label for="wlb-alt">Alternatieven</label><textarea class="invoer" id="wlb-alt" style="min-height:56px" placeholder="Tweedehands, lenen, goedkoper model, wat je al hebt…">${esc(x.alternatieven || "")}</textarea></div>
      <div class="rij2"><div class="veld"><label for="wlb-gesp">Al gespaard (€)</label><input class="invoer" id="wlb-gesp" inputmode="decimal" value="${x.gespaard ? String(x.gespaard).replace(".", ",") : ""}"></div>
        <div class="veld"><label for="wlb-bt">Bedenktijd (dagen)</label><input class="invoer" id="wlb-bt" type="number" min="0" max="90" value="${x.bedenktijd != null ? x.bedenktijd : WL_BEDENKTIJD}"></div></div>
      <div class="veld"><label for="wlb-not">Notities</label><textarea class="invoer" id="wlb-not" style="min-height:56px" placeholder="Maat, kleur, reviews…">${esc(x.notitie || "")}</textarea></div>`;
  };
  bladOpen(bestaand ? "Wens bewerken" : "Nieuwe wens", "", `<button class="knop breed primair" id="wlb-ok">${bestaand ? "Opslaan" : "Op de wishlist"}</button>`);
  teken2();
  const lees = () => {
    const w = s => ($(s) || {}).value || "";
    x.naam = w("#wlb-naam").trim(); x.prijs = Math.round(csvGetal(w("#wlb-prijs")) * 100) / 100 || 0; x.nodigOp = w("#wlb-nodig") || null;
    let u = w("#wlb-url").trim(); if (u && !/^https?:\/\//i.test(u)) u = "https://" + u; x.url = u;
    x.winkel = w("#wlb-winkel").trim(); x.motivatie = w("#wlb-mot").trim(); x.alternatieven = w("#wlb-alt").trim(); x.notitie = w("#wlb-not").trim();
    x.gespaard = Math.round(csvGetal(w("#wlb-gesp")) * 100) / 100 || 0; const bt = parseInt(w("#wlb-bt"), 10); x.bedenktijd = isFinite(bt) ? Math.max(0, bt) : WL_BEDENKTIJD;
  };
  $("#bladinhoud").addEventListener("click", async e => {
    const t = e.target;
    const o = t.closest("[data-wlb-ond]"), bl = t.closest("[data-wlb-bel]"), st = t.closest("[data-wlb-ster]"), gb = t.closest("[data-wlb-geb]"), rd = t.closest("[data-wlb-red]");
    if (o) { lees(); x.onderwerp = o.dataset.wlbOnd; teken2(); }
    else if (bl) { lees(); x.belang = x.belang === bl.dataset.wlbBel ? null : bl.dataset.wlbBel; teken2(); }
    else if (st) { lees(); x.verlangen = x.verlangen === +st.dataset.wlbSter ? 0 : +st.dataset.wlbSter; teken2(); }
    else if (gb) { lees(); x.gebruik = x.gebruik === gb.dataset.wlbGeb ? null : gb.dataset.wlbGeb; teken2(); }
    else if (rd) { lees(); const k = rd.dataset.wlbRed, i = x.redenen.indexOf(k); if (i >= 0) x.redenen.splice(i, 1); else x.redenen.push(k); teken2(); }
    else if (t.closest("#wlb-ondplus")) {
      lees(); const naam = ($("#wlb-nieuwond").value || "").trim(); if (!naam) return;
      const lijst = wlOnderwerpen().slice(), bestaat = lijst.find(q => q[1].toLowerCase() === naam.toLowerCase());
      if (bestaat) x.onderwerp = bestaat[0];
      else { const k = "o_" + uid().slice(-6), ov = lijst.findIndex(q => q[0] === "overig"); lijst.splice(ov < 0 ? lijst.length : ov, 0, [k, naam[0].toUpperCase() + naam.slice(1), "🏷️"]); await zetInst("wlOnderwerpen", lijst); x.onderwerp = k; }
      teken2();
    } else if (t.closest("#wlb-foto")) {
      lees();
      const k = document.createElement("input"); k.type = "file"; k.accept = "image/*"; k.className = "verborgen"; document.body.appendChild(k);
      k.onchange = () => { if (k.files && k.files[0]) { nieuweAfb = k.files[0]; teken2(); requestAnimationFrame(() => requestAnimationFrame(() => { const v = $(".wl-afbveld"); if (v) v.scrollIntoView({ block: "nearest", behavior: "smooth" }); })); } k.remove(); };
      k.click();
    } else if (t.closest("#wlb-fotoweg")) { lees(); nieuweAfb = null; x.afbeelding = null; teken2(); }
  });
  $("#wlb-ok").onclick = async () => {
    lees();
    if (!x.naam) { toast("Vul in wat je wilt kopen"); $("#wlb-naam").focus(); return; }
    if (nieuweAfb) { try { x.afbeelding = await wlAfbeelding(nieuweAfb); } catch (e) { toast("Deze afbeelding kon niet gelezen worden"); } }
    const oudPrijs = bestaand ? bestaand.prijs : null;
    x.prijzen = x.prijzen || [];
    if (!x.prijzen.length || oudPrijs !== x.prijs) x.prijzen.push({ datum: vandaagISO(), prijs: x.prijs });
    await bewaar("wl_items", x);
    bladSluit();
    if (!bestaand) { tril(8); ga("wens", x.id); toast("Op je wishlist gezet"); }
    else { teken(); toast(oudPrijs != null && oudPrijs > x.prijs ? `Opgeslagen · prijs ${Math.round((1 - x.prijs / oudPrijs) * 100)}% lager` : "Opgeslagen"); }
  };
}

/* ---------- Acties ---------- */
async function wlToevoegen() {
  const n = $("#wl-naam"), p = $("#wl-prijs"), m = $("#wl-mot");
  const naam = n.value.trim();
  if (!naam) { toast("Vul in wat je wilt kopen"); n.classList.add("rt-fout"); n.focus(); setTimeout(() => n.classList.remove("rt-fout"), 600); return; }
  const prijs = Math.round(csvGetal(p.value) * 100) / 100 || 0;
  const x = { id: uid(), naam, prijs, motivatie: m.value.trim(), onderwerp: V.wlFilter !== "alle" ? V.wlFilter : "overig", redenen: [], status: "actief", besloten: null,
    gemaakt: new Date().toISOString(), volgorde: Date.now(), prijzen: [{ datum: vandaagISO(), prijs }] };
  await bewaar("wl_items", x);
  tril(8); teken();
  const rij = document.querySelector(`[data-wl-rij="${x.id}"]`); if (rij) rij.classList.add("wl-in");
  toast("Op je wishlist", "Details toevoegen", () => wlBlad(x.id), 5000);
  const n2 = $("#wl-naam"); if (n2) n2.focus();
}
async function wlZet(id, status) {
  const x = vind("wl_items", id); if (!x) return;
  const oud = { status: x.status || "actief", besloten: x.besloten };
  const rij = V.view === "wishlist" && document.querySelector(`[data-wl-rij="${id}"]`);
  const stil = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (status === "gekocht" && typeof rtBurst === "function" && typeof rtAan === "function" && rtAan()) {
    const k = document.querySelector(`[data-wl-rij="${id}"] .wl-vink.ja`) || document.querySelector(`[data-act="wl-zet"][data-id="${id}"][data-s="gekocht"]`);
    if (k) { const r = k.getBoundingClientRect(); rtBurst(r.left + r.width / 2, r.top + r.height / 2); }
  }
  if (rij && !stil) {
    rij.style.height = rij.offsetHeight + "px"; void rij.offsetHeight;
    rij.classList.add("wl-weg", status === "actief" ? "terug" : status);
    await new Promise(r => setTimeout(r, 360));
  }
  x.status = status; x.besloten = status === "actief" ? null : new Date().toISOString();
  await bewaar("wl_items", x);
  tril(status === "gekocht" ? 12 : 8);
  teken();
  const terug = async () => { x.status = oud.status; x.besloten = oud.besloten; await bewaar("wl_items", x); teken(); };
  if (status === "gekocht") toast(`${x.naam} gekocht`, x.prijs ? "Als uitgave loggen" : "Ongedaan maken", x.prijs ? () => {
    uitgaveBlad(null);
    setTimeout(() => { const b = $("#u-bedrag"), o = $("#u-oms"); if (b) b.value = x.prijs; if (o) o.value = x.naam; }, 30);
  } : terug, 7000);
  else if (status === "niet") toast(`${x.naam} niet gekocht · ${wlPrijs(x.prijs)} bespaard`, "Ongedaan maken", terug, 6000);
  else toast(`${x.naam} staat weer op je wishlist`);
}
document.addEventListener("click", async e => {
  const el = e.target.closest && e.target.closest("[data-act]");
  if (!el || !el.dataset.act.startsWith("wl-")) return;
  const id = el.dataset.id;
  switch (el.dataset.act) {
    case "wl-toevoegen": await wlToevoegen(); break;
    case "wl-nieuw-uitgebreid": {
      const n = $("#wl-naam"), p = $("#wl-prijs"), m = $("#wl-mot");
      wlBlad(null, { naam: n ? n.value.trim() : "", prijs: p ? Math.round(csvGetal(p.value) * 100) / 100 || 0 : 0, motivatie: m ? m.value.trim() : "" });
      break;
    }
    case "wl-zet": await wlZet(id, el.dataset.s); break;
    case "wl-bewerk": wlBlad(id); break;
    case "wl-weg": { const x = vind("wl_items", id); if (x) bevestigVerwijderen(async () => { await verwijder("wl_items", x.id); if (x.afbeelding) await verwijder("bijlagen", x.afbeelding); ga("wishlist"); toast("Verwijderd"); }); break; }
    case "wl-klap": V.wlOpen[el.dataset.s] = !V.wlOpen[el.dataset.s]; teken(); break;
    case "wl-filter": V.wlFilter = el.dataset.f; teken(); break;
    case "wl-groep": await zetInst("wlGroep", !inst("wlGroep", false)); teken(); break;
    case "wl-sparen": {
      const x = vind("wl_items", id); if (!x) break;
      bladVraag("Bedrag opzij zetten (€)", "", "Bv. 25", async w => {
        const n = Math.round(csvGetal(w) * 100) / 100; if (!(n > 0)) return;
        x.gespaard = Math.round(((x.gespaard || 0) + n) * 100) / 100; await bewaar("wl_items", x); teken();
        toast(x.gespaard >= x.prijs ? `Het hele bedrag is gespaard 🎉` : `Nog ${wlPrijs(x.prijs - x.gespaard)} te gaan`);
      });
      setTimeout(() => { const v = $("#vraagveld"); if (v) v.setAttribute("inputmode", "decimal"); }, 50);
      break;
    }
  }
});
RT_NA.push(() => {
  if (V.view !== "wishlist") return;
  const n = $("#wl-naam"), p = $("#wl-prijs"), m = $("#wl-mot"), s = $("#wl-sort");
  if (n) n.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); p.focus(); } };
  if (p) p.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); m.focus(); } };
  if (m) m.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); wlToevoegen(); } };
  if (s) s.onchange = async () => { await zetInst("wlSort", s.value); teken(); };
});

/* ---------- Ingangen: Meer, Financieel en "Verder naar" ---------- */
if (typeof VERWANT === "object") {
  VERWANT.wishlist = [["financieel", "Financieel"], ["overzicht", "Overzicht"]];
  VERWANT.wens = [["wishlist", "Hele wishlist"], ["financieel", "Financieel"]];
  (VERWANT.financieel || (VERWANT.financieel = [])).unshift(["wishlist", "Wishlist"]);
  VERWANT_ICO.wishlist = "cadeau";
}
{
  const _meer = vwMeer;
  vwMeer = function () {
    const h = _meer();
    const kaart = `<button class="menu-kaart" data-act="ga" data-view="wishlist">${ico("cadeau")}<span class="nm">Wishlist</span><span class="ds">${esc(wlOnderschrift())}</span></button>`;
    const merk = `data-view="financieel"`, i = h.indexOf(merk);
    if (i < 0) return h;
    const eind = h.indexOf("</button>", i) + 9;
    return h.slice(0, eind) + kaart + h.slice(eind);
  };
  const _fin = vwFinancieel;
  vwFinancieel = function () {
    const a = wlAlle("actief");
    return _fin() + `<button class="startstrip" style="margin-top:14px" data-act="ga" data-view="wishlist">
      ${ico("cadeau", "width:20px;height:20px;color:var(--muted)")}
      <span class="nm">Wishlist${a.length ? `: ${a.length} wens${a.length === 1 ? "" : "en"} · ${wlPrijs(wlSom(a))}` : " — zet iets op je lijst"}</span>
      ${ico("pijlr", "width:16px;height:16px;color:var(--line2)")}</button>`;
  };
}
