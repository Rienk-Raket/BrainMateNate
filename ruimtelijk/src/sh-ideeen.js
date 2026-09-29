"use strict";
/* ==========================================================================
   68. Side Hustle — Ideeënbank
   Vang ideeën snel op, beoordeel ze met een scorekaart (potentie, fit en
   moeite), vergelijk ze op een kansenkaart, valideer ze stap voor stap en
   zet het beste idee met één tik om in een side hustle (de wizard wordt
   vooraf ingevuld). Inspiratie komt uit je eigen hobby's, skills en
   wishlist.
   Opslag: winkel sh_ideeen.
   ========================================================================== */
const SHI_STATUS = {
  open:       ["Nieuw", "var(--accent)", "💡"],
  onderzoek:  ["Onderzoeken", "#d97706", "🔎"],
  geparkeerd: ["Geparkeerd", "var(--faint)", "🅿️"],
  afgewezen:  ["Afgewezen", "var(--red)", "✕"],
  gestart:    ["Gestart", "var(--green)", "🚀"]
};
const SHI_CRIT = [
  ["probleem", "Probleem", "Hoe groot en pijnlijk is het probleem?", "potentie"],
  ["vraag", "Betaalbereidheid", "Willen mensen hier echt voor betalen?", "potentie"],
  ["marge", "Verdienpotentie", "Hoeveel houd je per klant over?", "potentie"],
  ["schaal", "Schaalbaarheid", "Groeit het zonder dat je tijd evenredig meegroeit?", "potentie"],
  ["passie", "Passie", "Heb je hier over een jaar nog zin in?", "fit"],
  ["kunde", "Vaardigheden", "Kun je het nu al (grotendeels) zelf?", "fit"],
  ["kosten", "Startkosten", "Hoeveel geld moet je erin stoppen? (5 = veel)", "moeite"],
  ["tijd", "Tijd tot eerste euro", "Hoe lang duurt het tot je eerste verkoop? (5 = lang)", "moeite"],
  ["complex", "Complexiteit", "Regels, techniek, voorraad, partijen (5 = complex)", "moeite"]
];
const SHI_STAPPEN = ["Praat met 5 mogelijke klanten over hun probleem", "Zoek 3 concurrenten of alternatieven", "Schat je prijs en marge per verkoop",
  "Bedenk de kleinste test (MVP) die je deze maand kunt doen", "Bepaal je betaalbaar verlies in euro's en uren"];
V.shiFilter = V.shiFilter || "actief";
V.shiWeergave = V.shiWeergave || "lijst";

const shiAlle = () => S.sh_ideeen.slice();
const shiScoreDelen = x => {
  const s = x.scores || {}, gem = g => { const w = SHI_CRIT.filter(c => c[3] === g).map(c => s[c[0]]).filter(v => v); return w.length ? w.reduce((a, v) => a + v, 0) / w.length : null; };
  return { potentie: gem("potentie"), fit: gem("fit"), moeite: gem("moeite") };
};
function shiScore(x) {
  const d = shiScoreDelen(x);
  if (d.potentie == null && d.fit == null && d.moeite == null) return null;
  const p = d.potentie != null ? (d.potentie - 1) / 4 : .5, f = d.fit != null ? (d.fit - 1) / 4 : .5, m = d.moeite != null ? (5 - d.moeite) / 4 : .5;
  return Math.round((p * .5 + f * .25 + m * .25) * 100);
}
const shiScoreKleur = s => s == null ? "var(--line2)" : s >= 70 ? "var(--green)" : s >= 45 ? "var(--amber)" : "var(--red)";
const shiOordeel = s => s == null ? "Nog niet beoordeeld" : s >= 70 ? "Sterk idee" : s >= 45 ? "Het onderzoeken waard" : "Waarschijnlijk niet de moeite";
function shiOnderschrift() {
  const a = shiAlle(), open = a.filter(x => x.status === "open" || x.status === "onderzoek").length;
  return a.length ? `${open} open · ${a.filter(x => x.status === "gestart").length} gestart` : "Vang je ideeën op";
}
Object.defineProperty(KOPPEN, "shideeen", { get: () => ["Ideeënbank", shiOnderschrift], configurable: true, enumerable: true });
function shIdeeenBlad() { ga("shideeen"); }

/* ---------- Scherm ---------- */
function shiSorteer(l) {
  const s = inst("shiSort", "score");
  const f = {
    score: (a, b) => (shiScore(b) ?? -1) - (shiScore(a) ?? -1) || (b.gemaakt || "").localeCompare(a.gemaakt || ""),
    nieuw: (a, b) => (b.gemaakt || "").localeCompare(a.gemaakt || ""),
    moeite: (a, b) => (shiScoreDelen(a).moeite ?? 9) - (shiScoreDelen(b).moeite ?? 9),
    potentie: (a, b) => (shiScoreDelen(b).potentie ?? 0) - (shiScoreDelen(a).potentie ?? 0)
  }[s] || (() => 0);
  return l.sort(f);
}
function shiKaart(x) {
  const sc = shiScore(x), st = SHI_STATUS[x.status] || SHI_STATUS.open, stappen = x.stappen || [];
  const soorten = (x.soorten || []).map(id => SH_SOORTEN.find(s => s.id === id)).filter(Boolean);
  return `<button class="shi-kaart" data-act="shi-open" data-id="${x.id}" style="--st:${st[1]}">
    <span class="ring shi-ring" style="--p:${sc || 0};--rc:${shiScoreKleur(sc)}"><span>${sc == null ? "?" : sc}</span></span>
    <span class="shi-mid">
      <span class="shi-titel">${esc(x.emoji || "💡")} ${esc(x.titel)}</span>
      ${x.pitch ? `<span class="shi-pitch">${esc(x.pitch)}</span>` : ""}
      <span class="shi-chips"><span class="shi-status">${st[0]}</span>${soorten.slice(0, 2).map(s => `<span class="shi-chip">${s.icoon} ${esc(s.naam)}</span>`).join("")}
        ${stappen.length ? `<span class="shi-chip">☑ ${stappen.filter(s => s.af).length}/${stappen.length}</span>` : ""}</span>
      ${x.volgendeStap && x.status !== "gestart" && x.status !== "afgewezen" ? `<span class="shi-volgende">→ ${esc(x.volgendeStap)}</span>` : ""}
    </span>
  </button>`;
}
function shiKaartHTML(lijst) {
  const W = 300, H = 250, L = 28, R = 10, T = 12, B = 28, pw = W - L - R, ph = H - T - B;
  const pts = lijst.map(x => ({ x, d: shiScoreDelen(x) })).filter(p => p.d.potentie != null && p.d.moeite != null);
  const zonder = lijst.length - pts.length;
  const M = 14, px = m => L + M + (m - 1) / 4 * (pw - 2 * M), py = p => T + ph - M - (p - 1) / 4 * (ph - 2 * M);
  const kwadrant = (x, y, w, h, t, a) => `<rect class="shi-kw" x="${x}" y="${y}" width="${w}" height="${h}"/><text class="shi-kwt" x="${a === "end" ? x + w - 6 : x + 6}" y="${y + 13}" text-anchor="${a || "start"}">${t}</text>`;
  const halfW = pw / 2, halfH = ph / 2;
  // overlap vermijden: gelijke posities iets uit elkaar
  const gezien = new Map();
  const punten = pts.map((p, i) => {
    let cx = px(p.d.moeite), cy = py(p.d.potentie); const k = Math.round(cx) + ":" + Math.round(cy), n = gezien.get(k) || 0; gezien.set(k, n + 1);
    if (n) { const hoek = n * 2.1; cx += Math.cos(hoek) * 10; cy += Math.sin(hoek) * 10; }
    return `<g class="shi-punt" data-act="shi-open" data-id="${p.x.id}" tabindex="0" role="button" aria-label="${esc(p.x.titel)}"><title>${esc(p.x.titel)} · score ${shiScore(p.x)}</title>
      <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="16" class="raak"/><circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="9" style="fill:${shiScoreKleur(shiScore(p.x))}"/>
      <text x="${cx.toFixed(1)}" y="${(cy + 3.2).toFixed(1)}" text-anchor="middle">${i + 1}</text></g>`;
  }).join("");
  return `<div class="card card-pad shi-kaartvak">
    <svg class="shi-matrix" viewBox="0 0 ${W} ${H}" role="img" aria-label="Kansenkaart: potentie tegen moeite">
      ${kwadrant(L, T, halfW, halfH, "Snelle winst")}${kwadrant(L + halfW, T, halfW, halfH, "Grote kans", "end")}
      ${kwadrant(L, T + halfH, halfW, halfH, "Hobbyproject")}${kwadrant(L + halfW, T + halfH, halfW, halfH, "Tijdvreter", "end")}
      <text class="shi-as" x="${L + pw / 2}" y="${H - 8}" text-anchor="middle">Moeite →</text>
      <text class="shi-as" x="11" y="${T + ph / 2}" text-anchor="middle" transform="rotate(-90 11 ${T + ph / 2})">Potentie →</text>
      ${punten}</svg>
    ${pts.length ? `<ol class="shi-legenda">${pts.map((p, i) => `<li><button data-act="shi-open" data-id="${p.x.id}"><b>${i + 1}</b><span>${esc(p.x.titel)}</span><i style="color:${shiScoreKleur(shiScore(p.x))}">${shiScore(p.x)}</i></button></li>`).join("")}</ol>` : ""}
    ${zonder ? `<p class="klein" style="margin:8px 2px 0">${zonder} ${zonder === 1 ? "idee staat" : "ideeën staan"} er nog niet op: geef ze een score voor potentie en moeite.</p>` : ""}
  </div>`;
}
function vwShIdeeen() {
  const alle = shiAlle(), f = V.shiFilter;
  const tel = k => k === "actief" ? alle.filter(x => x.status === "open" || x.status === "onderzoek").length : k === "alles" ? alle.length : alle.filter(x => x.status === k).length;
  let lijst = alle.filter(x => f === "alles" || (f === "actief" ? (x.status === "open" || x.status === "onderzoek") : x.status === f));
  lijst = shiSorteer(lijst);
  const beste = alle.filter(x => x.status !== "afgewezen" && x.status !== "gestart" && shiScore(x) != null).sort((a, b) => shiScore(b) - shiScore(a))[0];
  let h = `<div class="werk-kop" style="--kk:#d97706">
    <svg class="ill" viewBox="0 0 100 80" aria-hidden="true"><use href="#ill-sidehustle"/></svg>
    <div class="ttl">Ideeënbank</div>
    <div class="sub">${alle.length ? `${alle.length} ${alle.length === 1 ? "idee" : "ideeën"}` : "Van losse gedachte naar side hustle"}</div>
    <div class="cijfers">
      <div class="cf"><b>${tel("actief")}</b><span>open</span></div>
      <div class="cf"><b>${beste ? shiScore(beste) : "–"}</b><span>beste score</span></div>
      <div class="cf"><b>${tel("gestart")}</b><span>gestart</span></div>
    </div></div>
  <div class="card shi-snel">
    <input class="invoer" id="shi-nieuw" type="text" placeholder="Nieuw idee in één zin…" enterkeyhint="done" autocomplete="off" aria-label="Nieuw idee">
    <div class="knoprij"><button class="knop primair" data-act="shi-snel">${ico("plus")} Opslaan</button>
      <button class="knop rand" data-act="shi-nieuw-uitgebreid">Met details…</button>
      <button class="knop rand" data-act="shi-inspiratie" aria-label="Inspiratie">✨</button></div>
  </div>`;
  if (beste && V.shiFilter === "actief") h += `<button class="card card-pad shi-tip" data-act="shi-open" data-id="${beste.id}">
      <span class="shi-tipkop">🏆 Je sterkste idee op dit moment</span><b>${esc(beste.emoji || "💡")} ${esc(beste.titel)}</b>
      <span class="klein">Score ${shiScore(beste)} · ${esc(shiOordeel(shiScore(beste)))}${beste.volgendeStap ? " · volgende stap: " + esc(beste.volgendeStap) : ""}</span></button>`;
  if (alle.length) {
    h += `<div class="chiprij scroll shi-filters">${[["actief", "Open"], ["alles", "Alles"], ["onderzoek", "Onderzoeken"], ["geparkeerd", "Geparkeerd"], ["afgewezen", "Afgewezen"], ["gestart", "Gestart"]].map(([k, n]) =>
      `<button class="keuze" data-act="shi-filter" data-f="${k}" aria-pressed="${f === k}">${n} <span class="klein">${tel(k)}</span></button>`).join("")}</div>
    <div class="shi-balk"><div class="segment"><button data-act="shi-weergave" data-w="lijst" aria-pressed="${V.shiWeergave === "lijst"}">Lijst</button><button data-act="shi-weergave" data-w="kaart" aria-pressed="${V.shiWeergave === "kaart"}">Kansenkaart</button></div>
      <label class="shi-sort">${ico("lijst", "width:15px;height:15px")}<select id="shi-sort" aria-label="Sorteren">${[["score", "Hoogste score"], ["nieuw", "Nieuwste"], ["potentie", "Meeste potentie"], ["moeite", "Minste moeite"]].map(([k, n]) => `<option value="${k}"${inst("shiSort", "score") === k ? " selected" : ""}>${n}</option>`).join("")}</select></label></div>`;
  }
  if (!lijst.length) h += `<div class="card">${alle.length ? leeg("🔎", "Geen ideeën met deze status") : leeg("💡", "Nog geen ideeën", "Schrijf elk idee op, hoe klein ook. Beoordelen doe je later. Tik op ✨ voor inspiratie.")}</div>`;
  else if (V.shiWeergave === "kaart") h += shiKaartHTML(lijst);
  else h += `<div class="shi-lijst">${lijst.map(shiKaart).join("")}</div>`;
  h += `<p class="klein" style="text-align:center;margin-top:12px">De score weegt potentie (50%), jouw fit (25%) en moeite (25%). Het idee met de hoogste score is niet altijd het beste: kijk ook naar wat je het leukst vindt.</p>`;
  return h;
}

/* ---------- Detail en bewerken ---------- */
function shiNieuw(o) {
  return Object.assign({ id: uid(), titel: "", pitch: "", emoji: "💡", soorten: [], probleem: "", oplossing: "", verdienmodel: "", bron: "", scores: {},
    status: "open", reden: "", volgendeStap: "", stappen: [], notitie: "", hustleId: null, gemaakt: new Date().toISOString(), bijgewerkt: new Date().toISOString() }, o || {});
}
function shiBlad(id, voor) {
  const bestaand = id ? vind("sh_ideeen", id) : null;
  const x = bestaand ? structuredClone(bestaand) : shiNieuw(voor);
  x.scores = x.scores || {}; x.stappen = x.stappen || []; x.soorten = x.soorten || [];
  const tab = { t: bestaand ? "overzicht" : "idee" };
  const lees = () => {
    const w = s => { const e = $(s); return e ? e.value : null; };
    [["#shi-titel", "titel"], ["#shi-pitch", "pitch"], ["#shi-probleem", "probleem"], ["#shi-oplossing", "oplossing"], ["#shi-verdien", "verdienmodel"], ["#shi-bron", "bron"],
      ["#shi-volgende", "volgendeStap"], ["#shi-notitie", "notitie"], ["#shi-reden", "reden"]].forEach(([sel, k]) => { const v = w(sel); if (v != null) x[k] = v.trim(); });
  };
  const teken2 = () => {
    const sc = shiScore(x), d = shiScoreDelen(x), st = SHI_STATUS[x.status] || SHI_STATUS.open;
    const tabs = `<div class="segment shi-tabs">${[["overzicht", "Overzicht"], ["idee", "Idee"], ["score", "Score"], ["valideren", "Valideren"]].map(([k, n]) => `<button data-shit="${k}" aria-pressed="${tab.t === k}">${n}</button>`).join("")}</div>`;
    let u = tabs;
    if (tab.t === "overzicht") {
      u += `<div class="shi-held">
        <span class="ring shi-ring groot" style="--p:${sc || 0};--rc:${shiScoreKleur(sc)}"><span>${sc == null ? "?" : sc}</span></span>
        <div><div class="shi-heldtitel">${esc(x.emoji)} ${esc(x.titel || "Naamloos idee")}</div><div class="klein">${esc(shiOordeel(sc))} · <span style="color:${st[1]};font-weight:700">${st[0]}</span></div></div></div>
        ${x.pitch ? `<p class="shi-pitchgroot">${esc(x.pitch)}</p>` : ""}
        <div class="shi-delen">${[["Potentie", d.potentie, false], ["Fit", d.fit, false], ["Moeite", d.moeite, true]].map(([n, v, omg]) => `<div><span>${n}</span>
          <span class="balk"><i style="width:${v == null ? 0 : (v - 1) / 4 * 100}%;background:${v == null ? "var(--line2)" : omg ? (v <= 2.5 ? "var(--green)" : v <= 3.5 ? "var(--amber)" : "var(--red)") : (v >= 3.5 ? "var(--green)" : v >= 2.5 ? "var(--amber)" : "var(--red)")}"></i></span>
          <b>${v == null ? "–" : (Math.round(v * 10) / 10).toString().replace(".", ",")}</b></div>`).join("")}</div>
        ${x.probleem ? `<div class="shi-veldtoon"><span>Probleem en klant</span><p>${esc(x.probleem)}</p></div>` : ""}
        ${x.oplossing ? `<div class="shi-veldtoon"><span>Oplossing</span><p>${esc(x.oplossing)}</p></div>` : ""}
        ${x.verdienmodel ? `<div class="shi-veldtoon"><span>Verdienmodel</span><p>${esc(x.verdienmodel)}</p></div>` : ""}
        ${x.status === "afgewezen" || x.status === "geparkeerd" ? `<div class="veld"><label for="shi-reden">Waarom ${x.status}?</label><input class="invoer" id="shi-reden" value="${esc(x.reden)}" placeholder="Handig om later op terug te kijken"></div>` : ""}
        <div class="veld"><label for="shi-volgende">Volgende stap</label><input class="invoer" id="shi-volgende" value="${esc(x.volgendeStap)}" placeholder="Bv. 3 vrienden vragen of ze dit zouden kopen"></div>
        <div class="veld"><span class="labeltekst">Status</span><div class="keuzerij">${Object.entries(SHI_STATUS).filter(([k]) => k !== "gestart" || x.status === "gestart").map(([k, v]) =>
          `<button class="keuze" data-shistatus="${k}" aria-pressed="${x.status === k}">${v[2]} ${v[0]}</button>`).join("")}</div></div>
        ${x.status === "gestart" && x.hustleId && shH(x.hustleId) ? `<button class="knop breed rand" data-shi-ga="${x.hustleId}">${ico("raket")} Naar ${esc(shH(x.hustleId).naam)}</button>`
          : `<button class="knop breed primair shi-start" id="shi-start">${ico("raket")} Start als side hustle</button>
             <p class="klein" style="margin:6px 2px 0">De wizard wordt ingevuld met je idee; je kunt alles nog aanpassen.</p>`}`;
    } else if (tab.t === "idee") {
      u += `<div class="veld"><label for="shi-titel">Idee</label><input class="invoer" id="shi-titel" value="${esc(x.titel)}" maxlength="60" placeholder="Bv. Bordspelfiguren op maat"></div>
        <div class="veld"><span class="labeltekst">Emoji</span><div class="keuzerij">${SH_EMOJI.map(e => `<button class="keuze sh-emojiknop" data-shiemoji="${e}" aria-pressed="${x.emoji === e}">${e}</button>`).join("")}</div></div>
        <div class="veld"><label for="shi-pitch">In één zin</label><input class="invoer" id="shi-pitch" value="${esc(x.pitch)}" placeholder="Ik help [wie] met [probleem] door [oplossing]"></div>
        <div class="veld"><span class="labeltekst">Soort</span><div class="keuzerij">${SH_SOORTEN.map(s => `<button class="keuze" data-shisoort="${s.id}" aria-pressed="${x.soorten.includes(s.id)}">${s.icoon} ${esc(s.naam)}</button>`).join("")}</div></div>
        <div class="veld"><label for="shi-probleem">Probleem en klant</label><textarea class="invoer" id="shi-probleem" style="min-height:64px" placeholder="${esc(SH_PIJLERS[0].vraag)}">${esc(x.probleem)}</textarea></div>
        <div class="veld"><label for="shi-oplossing">Oplossing</label><textarea class="invoer" id="shi-oplossing" style="min-height:64px" placeholder="${esc(SH_PIJLERS[1].vraag)}">${esc(x.oplossing)}</textarea></div>
        <div class="veld"><label for="shi-verdien">Verdienmodel</label><textarea class="invoer" id="shi-verdien" style="min-height:56px" placeholder="Prijs, eenmalig of abonnement, startkosten">${esc(x.verdienmodel)}</textarea></div>
        <div class="veld"><label for="shi-bron">Waar kwam het vandaan?</label><input class="invoer" id="shi-bron" value="${esc(x.bron)}" placeholder="Gesprek, artikel, link, eigen ergernis…"></div>
        <div class="veld"><label for="shi-notitie">Notities</label><textarea class="invoer" id="shi-notitie" style="min-height:56px">${esc(x.notitie)}</textarea></div>`;
    } else if (tab.t === "score") {
      const groep = (g, titel, uitleg) => `<div class="shi-scoregroep"><div class="shi-scorekop"><b>${titel}</b><span>${uitleg}</span></div>${SHI_CRIT.filter(c => c[3] === g).map(c => `<div class="shi-crit">
        <div class="shi-critkop"><b>${c[1]}</b><span>${c[2]}</span></div>
        <div class="shi-stippen" role="radiogroup" aria-label="${esc(c[1])}">${[1, 2, 3, 4, 5].map(n => `<button role="radio" data-shicrit="${c[0]}" data-n="${n}" aria-checked="${x.scores[c[0]] === n}" aria-label="${n} van 5">${n}</button>`).join("")}</div></div>`).join("")}</div>`;
      u += `<div class="shi-scoreuitkomst"><span class="ring shi-ring" style="--p:${sc || 0};--rc:${shiScoreKleur(sc)}"><span>${sc == null ? "?" : sc}</span></span><div><b>${esc(shiOordeel(sc))}</b><span class="klein">Tik een cijfer van 1 tot 5. Onbeantwoord telt als gemiddeld.</span></div></div>
        ${groep("potentie", "Potentie", "Hoe groot is de kans?")}${groep("fit", "Jouw fit", "Past het bij jou?")}${groep("moeite", "Moeite", "Hoe zwaar is het om te starten? (laag is beter)")}`;
    } else {
      const af = x.stappen.filter(s => s.af).length;
      u += `<p class="klein" style="margin:2px 2px 10px">Test je idee voordat je er echt tijd en geld in stopt. ${x.stappen.length ? `${af} van ${x.stappen.length} gedaan.` : ""}</p>
        ${x.stappen.length ? `<div class="card">${x.stappen.map((s, i) => `<div class="subtaak${s.af ? " af" : ""}" style="padding:9px 12px;border-bottom:1px solid var(--line)">
          <button class="mini-vink" data-shistap="${i}" aria-label="Afvinken">${ico("check")}</button><span style="flex:1;${s.af ? "text-decoration:line-through;color:var(--faint)" : ""}">${esc(s.t)}</span>
          <button class="icon-btn" style="min-width:34px;min-height:34px" data-shistapweg="${i}" aria-label="Weghalen">${ico("x", "width:15px;height:15px")}</button></div>`).join("")}</div>`
          : `<button class="knop breed rand" id="shi-stappenstd">${ico("lijst")} Standaardstappen toevoegen</button>`}
        <div class="shi-stapnieuw"><input class="invoer" id="shi-stapnieuw" placeholder="Eigen stap…" enterkeyhint="done"><button class="knop klein rand" id="shi-stapplus">Toevoegen</button></div>`;
    }
    if (bestaand) u += `<div class="knoprij" style="margin-top:14px"><button class="knop rand klein" id="shi-dupliceer">${ico("kopieer")} Dupliceren</button><button class="knop gevaar klein" id="shi-weg">${ico("prullenbak")} Verwijderen</button></div>`;
    $("#bladinhoud").innerHTML = u;
    const s2 = $("#shi-start"); if (s2) s2.onclick = () => shiStart(x);
  };
  bladOpen(bestaand ? "Idee" : "Nieuw idee", "", `<button class="knop breed primair" id="shi-ok">${bestaand ? "Opslaan" : "In de ideeënbank"}</button>`);
  teken2();
  const bewaarNu = async stil => {
    lees();
    if (!x.titel) { toast("Geef je idee een naam"); tab.t = "idee"; teken2(); $("#shi-titel").focus(); return false; }
    x.bijgewerkt = new Date().toISOString();
    await bewaar("sh_ideeen", x);
    if (!stil) { bladSluit(); teken(); toast(bestaand ? "Opgeslagen" : "In de ideeënbank gezet"); }
    return true;
  };
  $("#bladinhoud").addEventListener("click", async e => {
    const t = e.target;
    const tb = t.closest("[data-shit]"); if (tb) { lees(); tab.t = tb.dataset.shit; teken2(); return; }
    const em = t.closest("[data-shiemoji]"); if (em) { lees(); x.emoji = em.dataset.shiemoji; teken2(); return; }
    const so = t.closest("[data-shisoort]"); if (so) { lees(); const k = so.dataset.shisoort, i = x.soorten.indexOf(k); i >= 0 ? x.soorten.splice(i, 1) : x.soorten.push(k); teken2(); return; }
    const cr = t.closest("[data-shicrit]"); if (cr) { const k = cr.dataset.shicrit, n = +cr.dataset.n; x.scores[k] = x.scores[k] === n ? undefined : n; if (x.scores[k] === undefined) delete x.scores[k]; tril(4); teken2(); return; }
    const sa = t.closest("[data-shistatus]"); if (sa) {
      lees(); const nieuw = sa.dataset.shistatus;
      if (nieuw === "onderzoek" && !x.stappen.length) x.stappen = SHI_STAPPEN.map(t => ({ t, af: false }));
      x.status = nieuw; teken2(); if (nieuw === "afgewezen" || nieuw === "geparkeerd") { const r = $("#shi-reden"); if (r) r.focus(); } return;
    }
    const sv = t.closest("[data-shistap]"); if (sv) { const s = x.stappen[+sv.dataset.shistap]; s.af = !s.af; tril(6); teken2(); return; }
    const sw = t.closest("[data-shistapweg]"); if (sw) { x.stappen.splice(+sw.dataset.shistapweg, 1); teken2(); return; }
    if (t.closest("#shi-stappenstd")) { x.stappen = SHI_STAPPEN.map(t => ({ t, af: false })); teken2(); return; }
    if (t.closest("#shi-stapplus")) { const v = ($("#shi-stapnieuw").value || "").trim(); if (v) { x.stappen.push({ t: v, af: false }); teken2(); $("#shi-stapnieuw").focus(); } return; }
    const gh = t.closest("[data-shi-ga]"); if (gh) { bladSluit(); ga("sh", gh.dataset.shiGa); return; }
    if (t.closest("#shi-dupliceer")) { lees(); const k = shiNieuw(Object.assign(structuredClone(x), { id: uid(), titel: x.titel + " (kopie)", status: "open", hustleId: null, gemaakt: new Date().toISOString() })); await bewaar("sh_ideeen", k); bladSluit(); teken(); toast("Gedupliceerd"); return; }
    if (t.closest("#shi-weg")) { bevestigVerwijderen(async () => { await verwijder("sh_ideeen", x.id); teken(); toast("Idee verwijderd"); }); }
  });
  $("#bladinhoud").addEventListener("keydown", e => { if (e.key === "Enter" && e.target.id === "shi-stapnieuw") { e.preventDefault(); $("#shi-stapplus").click(); } });
  $("#shi-ok").onclick = () => bewaarNu(false);
}
async function shiStart(x) {
  if (!x.titel) { toast("Geef je idee eerst een naam"); return; }
  x.bijgewerkt = new Date().toISOString();
  await bewaar("sh_ideeen", x);
  bladSluit();
  const pijlers = {};
  if (x.probleem) pijlers[1] = { tekst: x.probleem };
  if (x.oplossing || x.pitch) pijlers[2] = { tekst: [x.pitch, x.oplossing].filter(Boolean).join("\n\n") };
  if (x.verdienmodel) pijlers[4] = { tekst: x.verdienmodel };
  const testen = (x.stappen || []).filter(s => s.af).map(s => "✓ " + s.t);
  if (testen.length || x.volgendeStap) pijlers[5] = { tekst: [testen.length ? "Al gedaan:\n" + testen.join("\n") : "", x.volgendeStap ? "Eerste test: " + x.volgendeStap : ""].filter(Boolean).join("\n\n") };
  setTimeout(() => shWizard({ naam: x.titel.slice(0, 40), emoji: SH_EMOJI.includes(x.emoji) ? x.emoji : "💡", soorten: (x.soorten || []).slice(), pijlers, aanname: x.volgendeStap || "", ideeId: x.id }), 320);
}
{
  const _mk = shMaakAan;
  shMaakAan = async function (velden, opties) {
    const h = await _mk(velden, opties);
    if (velden && velden.ideeId) {
      const x = vind("sh_ideeen", velden.ideeId);
      if (x) { x.status = "gestart"; x.hustleId = h.id; x.bijgewerkt = new Date().toISOString(); await bewaar("sh_ideeen", x); }
    }
    return h;
  };
}

/* ---------- Inspiratie ---------- */
function shiInspiratie() {
  const vragen = ["Welk probleem had je zelf deze week, waar je voor zou betalen als iemand het oploste?", "Waar vragen vrienden of collega's je altijd om hulp bij?",
    "Welke saaie klus zou je voor anderen kunnen doen?", "Wat koop je regelmatig dat beter, mooier of goedkoper kan?", "Welke kennis heb je die een beginner veel tijd zou besparen?",
    "Welk bedrijf in je omgeving mist iets online?", "Wat maak je graag dat anderen mooi vinden?"];
  const sp = [];
  (S.hs_items || []).slice(0, 6).forEach(x => {
    if (x.soort === "skill") sp.push({ t: `Bied ${x.naam.toLowerCase()} aan als dienst`, s: ["dienst"], em: x.emoji, w: `Je skill ${x.naam}` });
    else sp.push({ t: `Maak een product of cursus rond ${x.naam.toLowerCase()}`, s: ["digitaal", "maken"], em: x.emoji, w: `Je hobby ${x.naam}` });
  });
  (S.wl_items || []).filter(x => (x.status || "actief") === "actief").slice(0, 3).forEach(x => sp.push({ t: `Verhuur of maak zelf: ${x.naam}`, s: ["platform"], em: "🎁", w: "Op je wishlist" }));
  const soort = SH_SOORTEN[Math.floor(Math.random() * SH_SOORTEN.length)];
  bladOpen("Inspiratie", `
    ${sp.length ? `<div class="labeltekst">Uit je eigen app</div><div class="card">${sp.map((s, i) => `<button class="rijknop" data-shiinsp="${i}"><span style="font-size:20px">${esc(s.em || "💡")}</span><span class="nm">${esc(s.t)}<span class="klein" style="display:block">${esc(s.w)}</span></span>${ico("plus", "width:18px;height:18px;color:var(--accent)")}</button>`).join("")}</div>` : ""}
    <div class="labeltekst" style="margin-top:12px">Vragen om over na te denken</div>
    <div class="card">${vragen.map(v => `<div class="rijknop" style="cursor:default"><span class="nm" style="white-space:normal">${esc(v)}</span></div>`).join("")}</div>
    <div class="card card-pad" style="margin-top:12px"><b>${soort.icoon} Probeer eens: ${esc(soort.naam)}</b><p class="klein" style="margin:4px 0 8px">${esc(soort.oms)}. Welk idee past hierbij en bij wat jij kunt?</p>
      <button class="knop klein rand" data-shiinspsoort="${soort.id}">${ico("plus")} Idee in deze soort</button></div>`);
  $("#bladinhoud").addEventListener("click", e => {
    const b = e.target.closest("[data-shiinsp]");
    if (b) { const s = sp[+b.dataset.shiinsp]; bladSluit(); setTimeout(() => shiBlad(null, { titel: s.t.slice(0, 60), soorten: s.s, emoji: SH_EMOJI.includes(s.em) ? s.em : "💡", bron: s.w }), 300); return; }
    const k = e.target.closest("[data-shiinspsoort]");
    if (k) { bladSluit(); setTimeout(() => shiBlad(null, { soorten: [k.dataset.shiinspsoort] }), 300); }
  });
}

/* ---------- Acties ---------- */
async function shiSnel() {
  const i = $("#shi-nieuw"); const t = (i && i.value || "").trim();
  if (!t) { toast("Schrijf je idee op"); if (i) { i.classList.add("rt-fout"); i.focus(); setTimeout(() => i.classList.remove("rt-fout"), 600); } return; }
  const x = shiNieuw({ titel: t.slice(0, 60), pitch: t.length > 60 ? t : "" });
  await bewaar("sh_ideeen", x);
  tril(8); teken();
  toast("In de ideeënbank", "Beoordelen", () => shiBlad(x.id), 6000);
  const n = $("#shi-nieuw"); if (n) n.focus();
}
document.addEventListener("click", async e => {
  const el = e.target.closest && e.target.closest("[data-act^='shi-']");
  if (!el) return;
  switch (el.dataset.act) {
    case "shi-snel": await shiSnel(); break;
    case "shi-nieuw-uitgebreid": { const i = $("#shi-nieuw"); shiBlad(null, i && i.value.trim() ? { titel: i.value.trim().slice(0, 60) } : null); break; }
    case "shi-inspiratie": shiInspiratie(); break;
    case "shi-open": shiBlad(el.dataset.id); break;
    case "shi-filter": V.shiFilter = el.dataset.f; teken(); break;
    case "shi-weergave": V.shiWeergave = el.dataset.w; teken(); break;
  }
});
RT_NA.push(() => {
  if (V.view !== "shideeen") return;
  const i = $("#shi-nieuw"), s = $("#shi-sort");
  if (i) i.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); shiSnel(); } };
  if (s) s.onchange = async () => { await zetInst("shiSort", s.value); teken(); };
});
if (typeof VERWANT === "object") VERWANT.shideeen = [["sidehustles", "Side hustles"], ["mindmap", "Mindmap"]];
