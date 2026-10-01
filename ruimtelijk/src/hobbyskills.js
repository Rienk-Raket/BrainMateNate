"use strict";
/* ==========================================================================
   51. HobbySkills — hobby's die je doet of wilt gaan doen, en skills die je
   wilt ontwikkelen. Per item: weekdoel, geplande dagen, niveau (skills),
   oefensessies met minuten en beoordeling, mijlpalen (ook als taak in te
   plannen), bronnen, streaks en een grafiek van de laatste 12 weken.
   Opslag: één winkel `hs_items`; sessies, mijlpalen en bronnen zitten in
   het item zelf. Alles gaat mee in de gewone back-up.
   ========================================================================== */
WINKELS.hs_items = "id";
if (!S.hs_items) S.hs_items = [];
V.hsSoort = "alles"; V.hsStatus = "lopend"; V.hsAlleSessies = false;

const HS_STATUS = { wil: "Wil ik", bezig: "Bezig", pauze: "Gepauzeerd", klaar: "Afgerond" };
const HS_NIVEAU = ["", "Beginner", "Basis", "Gevorderd", "Bekwaam", "Expert"];
const HS_EMOJI = ["🎸", "🎹", "🎤", "🎨", "📷", "✍️", "📚", "🗣️", "💻", "🧠", "🧩", "♟️", "🎮", "🏃", "🚴", "🏊", "🧘", "🏋️", "🍳", "🌱", "🧵", "🔧", "🎭", "🌍", "🎯", "🧗"];
const HS_KLEUREN = ["#2f6fed", "#7a4fd6", "#12875a", "#0ea5a4", "#d97706", "#d63c42", "#be185d", "#4f46b8", "#c2410c", "#475569"];

/* ---------- Hulpjes ---------- */
const hsAlle = () => S.hs_items.slice();
const hsSessiesWeek = (x, start) => (x.sessies || []).filter(s => s.datum >= start && s.datum <= plusDagen(start, 6));
const hsMinuten = lijst => lijst.reduce((a, s) => a + (+s.minuten || 0), 0);
const hsGedaanOp = (x, iso) => (x.sessies || []).some(s => s.datum === iso);
function hsDuur(min) {
  min = Math.round(+min || 0);
  if (min < 60) return min + " min";
  const u = min / 60;
  return (Number.isInteger(u) ? u : u.toFixed(1).replace(".", ",")) + " u";
}
function hsGetal(min) {
  min = Math.round(+min || 0);
  if (min < 60) return String(min);
  const u = min / 60;
  return Number.isInteger(u) ? String(u) : u.toFixed(1).replace(".", ",");
}
function hsStreakVan(dagen) {
  let d = vandaagISO(), n = 0;
  if (!dagen.has(d)) d = plusDagen(d, -1);
  while (dagen.has(d) && n < 3660) { n++; d = plusDagen(d, -1); }
  return n;
}
const hsStreak = x => hsStreakVan(new Set((x.sessies || []).map(s => s.datum)));
function hsStreakAlle() {
  const dagen = new Set();
  hsAlle().forEach(x => (x.sessies || []).forEach(s => dagen.add(s.datum)));
  return hsStreakVan(dagen);
}
function hsLaatste(x) {
  const s = (x.sessies || []).slice().sort((a, b) => (a.datum + a.ts) < (b.datum + b.ts) ? 1 : -1);
  return s[0] || null;
}
const HS_STATUS_VOLGORDE = { bezig: 0, wil: 1, pauze: 2, klaar: 3 };
function hsSorteer(a, b) {
  const s = HS_STATUS_VOLGORDE[a.status] - HS_STATUS_VOLGORDE[b.status];
  if (s) return s;
  const la = hsLaatste(a), lb = hsLaatste(b);
  return ((lb && lb.datum) || "") > ((la && la.datum) || "") ? 1 : -1;
}
function hsNieuw(soort) {
  const nu = new Date().toISOString();
  return {
    id: uid(), soort: soort === "skill" ? "skill" : "hobby", naam: "", emoji: soort === "skill" ? "🧠" : "🎨",
    kleur: HS_KLEUREN[S.hs_items.length % HS_KLEUREN.length], status: "bezig", niveau: 1, doelMin: 60, dagen: [],
    waarom: "", cat: null, checklist: [], mijlpalen: [], sessies: [], bronnen: [], gemaakt: nu, bijgewerkt: nu, volgorde: Date.now()
  };
}
function hsNiveauDots(x) {
  const n = x.niveau || 1;
  return `<span class="hs-niveau" aria-label="Niveau ${HS_NIVEAU[n]}">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= n ? "aan" : ""}"></i>`).join("")}</span>`;
}
function hsTelling() { const n = S.hs_items.filter(x => x.status === "bezig").length; return n || ""; }
function hsKort() {
  const alle = hsAlle();
  if (!alle.length) return "begin met een hobby of skill";
  const min = alle.reduce((a, x) => a + hsMinuten(hsSessiesWeek(x, weekStart(vandaagISO()))), 0);
  return `${alle.filter(x => x.status === "bezig").length} bezig · ${hsDuur(min)} deze week`;
}
function hsOnderschrift() {
  const alle = hsAlle();
  if (!alle.length) return "Wat je doet en wat je wilt leren";
  const min = alle.reduce((a, x) => a + hsMinuten(hsSessiesWeek(x, weekStart(vandaagISO()))), 0);
  return `${alle.filter(x => x.status !== "klaar").length} lopend · ${hsDuur(min)} deze week`;
}
async function hsBewaar(x) { x.bijgewerkt = new Date().toISOString(); return bewaar("hs_items", x); }

/* ---------- Koppen ---------- */
Object.defineProperty(KOPPEN, "hobbyskills", { get: () => ["HobbySkills", hsOnderschrift], configurable: true, enumerable: true });
Object.defineProperty(KOPPEN, "hobbyskill", {
  get: () => {
    const x = vind("hs_items", V.param);
    return [x ? x.naam : "Hobby of skill", () => x ? `${x.soort === "skill" ? "Skill · " + HS_NIVEAU[x.niveau || 1] : "Hobby"} · ${HS_STATUS[x.status] || ""}` : ""];
  },
  configurable: true, enumerable: true
});

/* ---------- Overzicht (tabblad) ---------- */
function hsLeeg() {
  return `<div class="card">${leeg("🎨", "Nog geen hobby's of skills", "Houd bij wat je doet of wilt gaan doen: oefensessies, mijlpalen, een weekdoel en je streak.")}
      <div class="knoprij" style="padding:0 14px 14px">
        <button class="knop primair" data-act="hs-nieuw" data-soort="hobby">🎸 Nieuwe hobby</button>
        <button class="knop primair" data-act="hs-nieuw" data-soort="skill">🧠 Nieuwe skill</button>
      </div></div>
    <button class="knop breed rand" data-act="hs-voorbeelden">${ico("ster")} Voorbeelden toevoegen om te proberen</button>
    <div class="klein" style="margin-top:14px">
      <p><b>Hobby</b> — iets wat je doet omdat je het leuk vindt. Doel: er tijd voor maken.</p>
      <p><b>Skill</b> — iets wat je wilt leren of beter wilt kunnen. Doel: niveau opbouwen, met mijlpalen.</p>
      <p>Elke sessie die je logt telt mee voor je weekdoel en je streak. Mijlpalen kun je met één tik als taak inplannen.</p>
    </div>`;
}
function hsKaart(x, ws) {
  const min = hsMinuten(hsSessiesWeek(x, ws)), doel = x.doelMin || 0;
  const pct = doel ? Math.min(100, Math.round(min / doel * 100)) : (min ? 100 : 0);
  const laatste = hsLaatste(x);
  return `<div class="card hs-kaart${x.status === "klaar" ? " klaar" : ""}" style="--hk:${x.kleur}" data-act="ga" data-view="hobbyskill" data-param="${x.id}" role="button" tabindex="0">
    <span class="hs-emoji">${x.emoji}</span>
    <div class="mid"><b>${esc(x.naam)}</b>
      <div class="hs-badges"><span class="hs-badge ${x.soort}">${x.soort}</span>${x.soort === "skill" ? hsNiveauDots(x) : ""}${x.status !== "bezig" ? `<span class="hs-badge ${x.status}">${HS_STATUS[x.status]}</span>` : ""}</div>
      <div class="hs-balk${doel && min > doel ? " over" : ""}"><i style="width:${pct}%"></i></div>
      <div class="sub">${doel ? `${hsDuur(min)} van ${hsDuur(doel)} deze week` : (min ? hsDuur(min) + " deze week" : "Nog geen sessie deze week")}${laatste ? " · laatst " + esc(datumLabel(laatste.datum)) : ""}${(x.checklist || []).length ? ` · ☑ ${x.checklist.filter(p => p.af).length}/${x.checklist.length}` : ""}</div>
    </div>
    <button class="hs-plus" data-act="hs-sessie" data-id="${x.id}" aria-label="Sessie loggen voor ${esc(x.naam)}">${ico("plus")}</button>
  </div>`;
}
function vwHobbySkills() {
  const v = vandaagISO(), ws = weekStart(v), wd = weekdagVan(v);
  const alle = hsAlle().sort(hsSorteer);
  if (!alle.length) return hsLeeg();
  const lopend = alle.filter(x => x.status !== "klaar");
  const weekMin = alle.reduce((a, x) => a + hsMinuten(hsSessiesWeek(x, ws)), 0);
  const doel = lopend.filter(x => x.status === "bezig").reduce((a, x) => a + (x.doelMin || 0), 0);
  const pct = doel ? Math.min(100, Math.round(weekMin / doel * 100)) : (weekMin ? 100 : 0);
  const sessiesWeek = alle.reduce((a, x) => a + hsSessiesWeek(x, ws).length, 0);
  const streak = hsStreakAlle();
  const vandaagLijst = lopend.filter(x => x.status === "bezig" && ((x.dagen || []).includes(wd) || hsGedaanOp(x, v)));
  let h = `<div class="card hs-hero">
      <div class="ring" style="--p:${pct};--rc:var(--accent)"><span>${pct}%</span></div>
      <div class="tekst"><b>${hsDuur(weekMin)} deze week</b>
        <div class="klein">${doel ? "van " + hsDuur(doel) + " gepland" : "Stel per hobby of skill een weekdoel in"} · ${sessiesWeek} sessie${sessiesWeek === 1 ? "" : "s"}</div>
        <span class="hs-streak${streak ? "" : " leeg"}">${streak ? "🔥 " + streak + " dag" + (streak === 1 ? "" : "en") + " op rij" : "Nog geen streak — log vandaag een sessie"}</span></div>
    </div>`;
  if (vandaagLijst.length) {
    h += sectie("Vandaag", vandaagLijst.length) + `<div class="hs-vandaag">` + vandaagLijst.map(x => {
      const af = hsGedaanOp(x, v);
      return `<button class="keuze${af ? " af" : ""}" data-act="hs-sessie" data-id="${x.id}" aria-label="${af ? "Nog een sessie" : "Sessie loggen"}: ${esc(x.naam)}"><span class="em">${x.emoji}</span>${esc(x.naam)}${af ? " ✓" : " +"}</button>`;
    }).join("") + `</div>`;
  }
  h += `<div class="knoprij" style="margin:12px 0 4px">
      <button class="knop primair" data-act="hs-sessie">${ico("plus")} Sessie loggen</button>
      <button class="knop rand" data-act="hs-nieuw">${ico("ster")} Nieuw</button></div>`;
  h += `<div class="hs-filters"><div class="segment">${[["alles", "Alles"], ["hobby", "Hobby's"], ["skill", "Skills"]].map(([w, l]) =>
    `<button data-act="hs-filter" data-veld="hsSoort" data-w="${w}" aria-pressed="${V.hsSoort === w}">${l}</button>`).join("")}</div></div>
    <div class="chiprij scroll hs-statusrij" style="margin-top:8px">${[["lopend", "Lopend"], ["wil", "Wil ik"], ["pauze", "Gepauzeerd"], ["klaar", "Afgerond"], ["alles", "Alles"]].map(([w, l]) =>
    `<button class="keuze" data-act="hs-filter" data-veld="hsStatus" data-w="${w}" aria-pressed="${V.hsStatus === w}">${l}</button>`).join("")}</div>`;
  const lijst = alle.filter(x => (V.hsSoort === "alles" || x.soort === V.hsSoort) &&
    (V.hsStatus === "alles" || (V.hsStatus === "lopend" ? x.status !== "klaar" : x.status === V.hsStatus)));
  h += lijst.length ? `<div class="hs-lijst">${lijst.map(x => hsKaart(x, ws)).join("")}</div>` : `<div class="card">${leeg("🔎", "Niets in deze selectie")}</div>`;
  h += `<div class="klein" style="margin-top:14px"><p>Tik op een kaart voor mijlpalen, sessies en je grafiek. De <b>+</b> logt meteen een sessie.</p></div>`;
  return h;
}

/* ---------- Detail ---------- */
function hsGrafiek(x) {
  const ws = weekStart(vandaagISO());
  const weken = Array.from({ length: 12 }, (_, i) => plusDagen(ws, -7 * (11 - i)));
  const waarden = weken.map(w => hsMinuten(hsSessiesWeek(x, w)));
  const doel = x.doelMin || 0;
  const max = Math.max(doel, 30, ...waarden);
  const H = 70, top = 6;
  let h = `<svg class="hs-grafiek" viewBox="0 0 240 90" role="img" aria-label="Minuten per week, laatste 12 weken">`;
  waarden.forEach((w, i) => {
    const hh = w ? Math.max(3, Math.round(w / max * H)) : 2;
    h += `<rect class="${w ? (i === 11 ? "nu" : "") : "leeg"}" x="${i * 20 + 2}" y="${top + H - hh}" width="16" height="${hh}" rx="3"><title>Week ${weekNummer(weken[i])}: ${hsDuur(w)}</title></rect>`;
  });
  if (doel) { const y = top + H - Math.round(doel / max * H); h += `<line class="doel" x1="0" x2="240" y1="${y}" y2="${y}" stroke-dasharray="3 3"/>`; }
  h += `<text x="2" y="87">wk ${weekNummer(weken[0])}</text><text x="238" y="87" text-anchor="end">deze week</text></svg>`;
  return h;
}
function vwHobbySkill() {
  const x = vind("hs_items", V.param);
  if (!x) return leeg("🤷", "Deze hobby of skill bestaat niet meer");
  const v = vandaagISO(), ws = weekStart(v), wd = weekdagVan(v);
  const sessies = (x.sessies || []).slice().sort((a, b) => (a.datum + a.ts) < (b.datum + b.ts) ? 1 : -1);
  const tot = hsMinuten(sessies), n = sessies.length, streak = hsStreak(x);
  const min = hsMinuten(hsSessiesWeek(x, ws)), doel = x.doelMin || 0;
  const pct = doel ? Math.min(100, Math.round(min / doel * 100)) : (min ? 100 : 0);
  const mp = x.mijlpalen || [], mpAf = mp.filter(m => m.af).length;
  let h = `<div class="hs-kop" style="--hk:${x.kleur}"><span class="em" aria-hidden="true">${x.emoji}</span>
    <div class="rij"><span class="groot">${x.emoji}</span>
      <div style="flex:1;min-width:0"><div class="ttl">${esc(x.naam)}</div><div class="sub">${x.soort === "skill" ? "Skill · " + HS_NIVEAU[x.niveau || 1] : "Hobby"} · ${HS_STATUS[x.status]}</div></div>
      <button class="icon-btn" style="color:#fff" data-act="hs-bewerk" data-id="${x.id}" aria-label="Bewerken">${ico("pen")}</button></div>
    ${x.waarom ? `<p class="waarom" data-act="hs-waarom" data-id="${x.id}">${esc(x.waarom)}</p>`
      : `<button class="wk-link" style="color:#fff;opacity:.9;margin:8px 0 0;text-align:left;padding:0;position:relative" data-act="hs-waarom" data-id="${x.id}">+ Waarom wil je dit?</button>`}
    <div class="cijfers">
      <div class="cf"><b class="hs-getal">${hsGetal(tot)}</b><span>${tot >= 60 ? "uur totaal" : "min totaal"}</span></div>
      <div class="cf"><b class="hs-getal">${n}</b><span>sessie${n === 1 ? "" : "s"}</span></div>
      <div class="cf"><b class="hs-getal">${streak}</b><span>dag${streak === 1 ? "" : "en"} op rij</span></div>
    </div></div>`;
  h += `<div class="knoprij" style="margin:12px 0 4px">
      <button class="knop primair" data-act="hs-sessie" data-id="${x.id}">${ico("plus")} Sessie loggen</button>
      <button class="knop rand" data-act="hs-plan" data-id="${x.id}">${ico("komend")} Plan oefenmoment</button>
      <button class="knop rand" data-act="mm-van" data-soort="hobbyskill" data-id="${x.id}">${ico("mindmap")} Als mindmap</button></div>`;
  h += `<div class="card card-pad hs-status" style="--hk:${x.kleur}">
      <div class="hs-week"><div class="ring" style="--p:${pct};--rc:${x.kleur}"><span>${pct}%</span></div>
        <div class="tekst"><b>${hsDuur(min)} deze week</b><div class="klein">${doel ? "doel " + hsDuur(doel) + " per week" : "geen weekdoel — stel er een in via bewerken"}</div>
          <div class="hs-balk${doel && min > doel ? " over" : ""}"><i style="width:${pct}%"></i></div></div></div>
      <div class="veld" style="margin-bottom:4px"><span class="labeltekst">Status</span>
        <div class="segment vier">${Object.entries(HS_STATUS).map(([w, l]) => `<button data-act="hs-status" data-id="${x.id}" data-s="${w}" aria-pressed="${x.status === w}">${l}</button>`).join("")}</div></div>
      ${x.soort === "skill" ? `<div class="veld" style="margin-bottom:4px"><span class="labeltekst">Niveau</span>
        <div class="hs-niveaus">${[1, 2, 3, 4, 5].map(i => `<button data-act="hs-niveau" data-id="${x.id}" data-n="${i}" class="${i <= (x.niveau || 1) ? "aan" : ""}" aria-pressed="${i === (x.niveau || 1)}"><i></i>${HS_NIVEAU[i]}</button>`).join("")}</div></div>` : ""}
      <div class="veld" style="margin-bottom:0"><span class="labeltekst">Geplande dagen</span>
        <div class="hs-dagen">${[1, 2, 3, 4, 5, 6, 0].map(d => `<button data-act="hs-dag" data-id="${x.id}" data-d="${d}" class="${d === wd ? "vandaag" : ""}" aria-pressed="${(x.dagen || []).includes(d)}">${DAGKORT[d]}</button>`).join("")}</div></div>
    </div>`;
  h += sectie("Laatste 12 weken", hsDuur(hsMinuten(sessies.filter(s => s.datum >= plusDagen(ws, -77)))));
  h += `<div class="card card-pad" style="--hk:${x.kleur}">${hsGrafiek(x)}</div>`;
  if (typeof hsChecklistHTML === "function") h += hsChecklistHTML(x);
  h += sectie("Mijlpalen", mp.length ? `${mpAf}/${mp.length}` : null);
  h += `<div class="card" style="--hk:${x.kleur}">` + (mp.length ? mp.map(m => `<div class="hs-mijlpaal${m.af ? " af" : ""}">
      <button class="hs-check" data-act="hs-mijlpaal-vink" data-id="${x.id}" data-m="${m.id}" aria-pressed="${!!m.af}" aria-label="Afvinken">${ico("check")}</button>
      <span class="tekst">${esc(m.tekst)}${m.af && m.afOp ? `<small>gehaald ${esc(datumLabel(m.afOp.slice(0, 10)))}</small>` : ""}</span>
      ${m.af ? "" : `<button class="icon-btn" data-act="hs-mijlpaal-taak" data-id="${x.id}" data-m="${m.id}" aria-label="Als taak inplannen">${ico("komend")}</button>`}
      <button class="icon-btn" data-act="hs-mijlpaal-weg" data-id="${x.id}" data-m="${m.id}" aria-label="Verwijderen">${ico("x")}</button>
    </div>`).join("") : `<div class="klein" style="padding:12px 14px 4px">Wat wil je bereiken? Bv. “eerste liedje foutloos spelen” of “een gesprek van 5 minuten voeren”.</div>`) +
    `<div class="hs-nieuwveld"><input class="invoer" id="hs-mp-nieuw" type="text" placeholder="Nieuwe mijlpaal…" enterkeyhint="done" data-id="${x.id}"><button class="knop klein rand" data-act="hs-mijlpaal-toevoegen" data-id="${x.id}">Toevoegen</button></div></div>`;
  const toon = V.hsAlleSessies ? sessies : sessies.slice(0, 8);
  h += sectie("Sessies", n || null, n > 8 ? `<button class="actie" data-act="hs-sessies-alle">${V.hsAlleSessies ? "Minder" : "Alles"}</button>` : "");
  h += `<div class="card">` + (toon.length ? toon.map(s => `<div class="hs-sessie">
      <div class="dt"><b>${esc(datumLabel(s.datum))}</b>${s.datum.slice(0, 4) !== v.slice(0, 4) ? s.datum.slice(0, 4) : ""}</div>
      <div class="inh"><b>${hsDuur(s.minuten)}</b>${s.score ? `<span class="hs-sterren">${"★".repeat(s.score)}${"☆".repeat(5 - s.score)}</span>` : ""}${s.notitie ? `<div class="not">${esc(s.notitie)}</div>` : ""}</div>
      <button class="icon-btn" data-act="hs-sessie-weg" data-id="${x.id}" data-s="${s.id}" aria-label="Sessie verwijderen">${ico("x")}</button>
    </div>`).join("") : leeg("⏱️", "Nog geen sessies", "Log je eerste sessie — ook 10 minuten telt.")) + `</div>`;
  const br = x.bronnen || [];
  h += sectie("Bronnen en links", br.length || null, `<button class="actie" data-act="hs-bron-nieuw" data-id="${x.id}">+ toevoegen</button>`);
  if (br.length) h += `<div class="card">` + br.map(b => `<div class="hs-bron">${ico("ketting", "width:16px;height:16px;color:var(--faint)")}
      ${b.url ? `<a href="${esc(b.url)}" target="_blank" rel="noopener noreferrer">${esc(b.titel || b.url)}</a>` : `<span class="t">${esc(b.titel)}</span>`}
      <button class="icon-btn" data-act="hs-bron-weg" data-id="${x.id}" data-b="${b.id}" aria-label="Verwijderen">${ico("x")}</button></div>`).join("") + `</div>`;
  h += `<div class="knoprij" style="margin:18px 0 6px">
      ${x.status === "klaar" ? `<button class="knop rand" data-act="hs-status" data-id="${x.id}" data-s="bezig">${ico("herhaal")} Weer oppakken</button>`
        : `<button class="knop rand" data-act="hs-status" data-id="${x.id}" data-s="klaar">${ico("check")} Afronden</button>`}
      <button class="knop gevaar" data-act="hs-verwijder" data-id="${x.id}">${ico("prullenbak")} Verwijderen</button></div>`;
  return h;
}

/* ---------- Bladen ---------- */
function hsItemBlad(id, soort) {
  const bestaand = id ? vind("hs_items", id) : null;
  const f = bestaand ? JSON.parse(JSON.stringify(bestaand)) : hsNieuw(soort);
  const seg = (veld, opties, huidig) => `<div class="segment${opties.length > 3 ? " vier" : ""}">${opties.map(([w, l]) =>
    `<button data-hs-veld="${veld}" data-w="${w}" aria-pressed="${huidig === w}">${l}</button>`).join("")}</div>`;
  const inhoud = `
    <div class="veld"><label for="hs-naam">Naam</label>
      <input class="invoer" id="hs-naam" type="text" value="${esc(f.naam)}" placeholder="${f.soort === "skill" ? "Bv. Spaans, gitaar, Excel…" : "Bv. Fotografie, hardlopen, koken…"}" enterkeyhint="done"></div>
    <div class="veld"><span class="labeltekst">Soort</span>${seg("soort", [["hobby", "Hobby — doe ik (graag)"], ["skill", "Skill — wil ik leren"]], f.soort)}</div>
    <div class="veld"><span class="labeltekst">Soort hobby of skill</span>
      <div class="hs-cats klein-cats">${HS_CATS.map(c => `<button data-hs-catkeuze="${c.id}" aria-pressed="${c.id === (f.cat || hsRaadCat(f.naam, f.emoji))}"><span class="em">${c.emoji}</span><span>${esc(c.naam)}</span></button>`).join("")}</div>
      ${bestaand ? "" : `<div class="schakel" style="min-height:0;padding:10px 0 0"><span class="tekst klein">Checklist uit sjabloon klaarzetten</span>
        <button class="toggle" id="hs-metsjabloon" aria-pressed="true" aria-label="Checklist uit sjabloon klaarzetten"></button></div>`}</div>
    <div class="veld"><span class="labeltekst">Icoon</span><div class="hs-emojis">${HS_EMOJI.map(e => `<button data-hs-emoji="${e}" aria-pressed="${e === f.emoji}" aria-label="${e}">${e}</button>`).join("")}</div></div>
    <div class="veld"><span class="labeltekst">Kleur</span><div class="hs-kleuren">${HS_KLEUREN.map(k => `<button data-hs-kleur="${k}" style="background:${k}" aria-pressed="${k === f.kleur}" aria-label="Kleur"></button>`).join("")}</div></div>
    <div class="veld"><span class="labeltekst">Status</span>${seg("status", Object.entries(HS_STATUS), f.status)}</div>
    <div class="veld" id="hs-niveauveld" ${f.soort !== "skill" ? 'style="display:none"' : ""}><span class="labeltekst">Huidig niveau</span>
      <div class="hs-niveaus" style="--hk:${f.kleur}">${[1, 2, 3, 4, 5].map(n => `<button data-hs-niveau="${n}" class="${n <= (f.niveau || 1) ? "aan" : ""}" aria-pressed="${n === (f.niveau || 1)}"><i></i>${HS_NIVEAU[n]}</button>`).join("")}</div></div>
    <div class="veld"><label for="hs-doel">Doel per week (minuten)</label>
      <input class="invoer" id="hs-doel" type="number" inputmode="numeric" min="0" step="5" value="${f.doelMin || ""}" placeholder="Bv. 90"></div>
    <div class="veld"><span class="labeltekst">Geplande dagen</span>
      <div class="hs-dagen" style="--hk:${f.kleur}">${[1, 2, 3, 4, 5, 6, 0].map(d => `<button data-hs-dag="${d}" aria-pressed="${(f.dagen || []).includes(d)}">${DAGKORT[d]}</button>`).join("")}</div>
      <div class="klein" style="margin-top:6px">Op deze dagen staat het item onder “Vandaag” en op je dagoverzicht.</div></div>
    <div class="veld"><label for="hs-waarom">Waarom wil je dit?</label>
      <textarea class="invoer" id="hs-waarom" placeholder="Wat brengt het je? Waar wil je naartoe?" style="min-height:80px">${esc(f.waarom || "")}</textarea></div>`;
  bladOpen(bestaand ? "Bewerken" : (f.soort === "skill" ? "Nieuwe skill" : "Nieuwe hobby"), inhoud,
    `<button class="knop breed primair" id="hs-ok">${bestaand ? "Opslaan" : "Toevoegen"}</button>`);
  const inh = $("#bladinhoud");
  inh.addEventListener("click", e => {
    if (e.target.closest("#hs-metsjabloon")) { const tg = $("#hs-metsjabloon"); tg.setAttribute("aria-pressed", String(tg.getAttribute("aria-pressed") !== "true")); return; }
    const ck = e.target.closest("[data-hs-catkeuze]");
    if (ck) { f.cat = ck.dataset.hsCatkeuze; f._catGekozen = true; inh.querySelectorAll("[data-hs-catkeuze]").forEach(b => b.setAttribute("aria-pressed", String(b === ck))); return; }
    const t = e.target.closest("[data-hs-veld],[data-hs-emoji],[data-hs-kleur],[data-hs-niveau],[data-hs-dag]");
    if (!t) return;
    const zet = (sel, attr, w) => inh.querySelectorAll(sel).forEach(b => b.setAttribute("aria-pressed", String(b.dataset[attr] === w)));
    if (t.dataset.hsVeld) {
      f[t.dataset.hsVeld] = t.dataset.w;
      zet(`[data-hs-veld="${t.dataset.hsVeld}"]`, "w", t.dataset.w);
      if (t.dataset.hsVeld === "soort") $("#hs-niveauveld").style.display = t.dataset.w === "skill" ? "" : "none";
    } else if (t.dataset.hsEmoji) { f.emoji = t.dataset.hsEmoji; f._emojiGekozen = true; zet("[data-hs-emoji]", "hsEmoji", f.emoji); }
    else if (t.dataset.hsKleur) { f.kleur = t.dataset.hsKleur; zet("[data-hs-kleur]", "hsKleur", f.kleur); inh.querySelectorAll(".hs-niveaus,.hs-dagen").forEach(n => n.style.setProperty("--hk", f.kleur)); }
    else if (t.dataset.hsNiveau) {
      f.niveau = +t.dataset.hsNiveau;
      inh.querySelectorAll("[data-hs-niveau]").forEach(b => { b.classList.toggle("aan", +b.dataset.hsNiveau <= f.niveau); b.setAttribute("aria-pressed", String(+b.dataset.hsNiveau === f.niveau)); });
    } else if (t.dataset.hsDag) {
      const d = +t.dataset.hsDag, i = (f.dagen || (f.dagen = [])).indexOf(d);
      if (i >= 0) f.dagen.splice(i, 1); else f.dagen.push(d);
      t.setAttribute("aria-pressed", String(i < 0));
    }
  });
  $("#hs-naam").onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); $("#hs-ok").click(); } };
  const raad = () => {
    if (f._catGekozen || bestaand) return;
    const c = hsRaadCat($("#hs-naam").value, f.emoji);
    inh.querySelectorAll("[data-hs-catkeuze]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.hsCatkeuze === c)));
  };
  $("#hs-naam").addEventListener("input", raad);
  inh.addEventListener("click", e => { if (e.target.closest("[data-hs-emoji]")) raad(); });
  $("#hs-ok").onclick = async () => {
    const naam = $("#hs-naam").value.trim();
    if (!naam) { toast("Vul een naam in"); const n = $("#hs-naam"); n.classList.add("rt-fout"); n.focus(); setTimeout(() => n.classList.remove("rt-fout"), 600); return; }
    f.naam = naam;
    f.doelMin = Math.max(0, parseInt($("#hs-doel").value, 10) || 0);
    f.waarom = $("#hs-waarom").value.trim();
    const gekozen = inh.querySelector('[data-hs-catkeuze][aria-pressed="true"]');
    const oudeCat = bestaand ? bestaand.cat : null;
    f.cat = gekozen ? gekozen.dataset.hsCatkeuze : hsRaadCat(f.naam, f.emoji);
    if (!bestaand && !f._emojiGekozen) f.emoji = hsCat(f.cat).emoji;
    delete f._catGekozen; delete f._emojiGekozen;
    const metSjabloon = !bestaand && $("#hs-metsjabloon") && $("#hs-metsjabloon").getAttribute("aria-pressed") === "true";
    if (metSjabloon) hsPasSjabloonToe(f, f.cat);
    bladSluit();
    await hsBewaar(f);
    if (!bestaand) {
      await logGebeurtenis("hobbyskill", `${f.emoji} Nieuw: ${f.naam} (${f.soort})`, f.id);
      tril(10); ga("hobbyskill", f.id); toast("Toegevoegd — log je eerste sessie");
    } else {
      teken();
      if (f.cat !== oudeCat) toast("Opgeslagen", "Sjabloon toevoegen", () => { const y = vind("hs_items", f.id); if (y) hsSjabloonBlad(y); });
      else toast("Opgeslagen");
    }
  };
  setTimeout(() => { const n = $("#hs-naam"); if (n && !bestaand) n.focus(); }, 300);
}
function hsSessieBlad(id) {
  const kandidaten = hsAlle().filter(x => x.status !== "klaar").sort(hsSorteer);
  if (!kandidaten.length && !id) { hsItemBlad(null, "hobby"); return; }
  let x = id ? vind("hs_items", id) : (kandidaten.length === 1 ? kandidaten[0] : null);
  const f = { minuten: 30, score: 0 };
  const inhoud = `
    ${x ? `<div class="banner blauw" style="margin-top:6px"><span style="font-size:20px;line-height:1">${x.emoji}</span><span><b>${esc(x.naam)}</b>${x.doelMin ? `Deze week ${hsDuur(hsMinuten(hsSessiesWeek(x, weekStart(vandaagISO()))))} van ${hsDuur(x.doelMin)}` : "Elke sessie telt mee voor je streak"}</span></div>`
      : `<div class="veld"><label for="hs-sel">Waarvoor?</label><select class="invoer" id="hs-sel">${kandidaten.map(k => `<option value="${k.id}">${k.emoji} ${esc(k.naam)}</option>`).join("")}</select></div>`}
    <div class="veld"><span class="labeltekst">Hoe lang?</span>
      <div class="hs-minuten">${[15, 30, 45, 60, 90].map(m => `<button data-hs-min="${m}" aria-pressed="${m === f.minuten}">${m}</button>`).join("")}</div>
      <input class="invoer" id="hs-min" type="number" inputmode="numeric" min="1" step="5" value="${f.minuten}" aria-label="Minuten"></div>
    <div class="veld"><span class="labeltekst">Hoe ging het?</span><div class="hs-beoordeling">${[1, 2, 3, 4, 5].map(n => `<button data-hs-ster="${n}" aria-label="${n} van 5">★</button>`).join("")}</div></div>
    <div class="veld"><label for="hs-datum">Wanneer</label><input class="invoer" id="hs-datum" type="date" value="${vandaagISO()}" max="${vandaagISO()}"></div>
    <div class="veld"><label for="hs-not">Notitie</label><textarea class="invoer" id="hs-not" placeholder="Wat heb je gedaan of geleerd?" style="min-height:70px"></textarea></div>`;
  bladOpen("Sessie loggen", inhoud, `<button class="knop breed primair" id="hs-sessie-ok">Loggen</button>`);
  const inh = $("#bladinhoud");
  inh.addEventListener("click", e => {
    const m = e.target.closest("[data-hs-min]"), st = e.target.closest("[data-hs-ster]");
    if (m) { $("#hs-min").value = m.dataset.hsMin; inh.querySelectorAll("[data-hs-min]").forEach(b => b.setAttribute("aria-pressed", String(b === m))); }
    if (st) { f.score = f.score === +st.dataset.hsSter ? 0 : +st.dataset.hsSter; inh.querySelectorAll("[data-hs-ster]").forEach(b => b.classList.toggle("aan", +b.dataset.hsSter <= f.score)); }
  });
  $("#hs-min").oninput = () => inh.querySelectorAll("[data-hs-min]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.hsMin === $("#hs-min").value)));
  $("#hs-sessie-ok").onclick = async () => {
    if (!x) x = vind("hs_items", $("#hs-sel").value);
    if (!x) return;
    const minuten = parseInt($("#hs-min").value, 10);
    if (!(minuten > 0)) { toast("Vul een aantal minuten in"); $("#hs-min").focus(); return; }
    const datum = $("#hs-datum").value || vandaagISO();
    const s = { id: uid(), datum, minuten, score: f.score, notitie: $("#hs-not").value.trim(), ts: new Date().toISOString() };
    (x.sessies || (x.sessies = [])).push(s);
    if (x.status === "wil" || x.status === "pauze") x.status = "bezig";
    bladSluit();
    await hsBewaar(x);
    await logGebeurtenis("hobbyskill", `${x.emoji} ${x.naam}: ${hsDuur(minuten)}${s.score ? " · " + "★".repeat(s.score) : ""}`, x.id, { minuten });
    tril(12);
    if (typeof rtBurst === "function" && typeof rtAan === "function" && rtAan()) setTimeout(() => rtBurst(innerWidth / 2, innerHeight * .55, x.kleur), 120);
    teken();
    const streak = hsStreak(x);
    toast(`${hsDuur(minuten)} gelogd voor ${x.naam}${streak > 1 ? " · 🔥 " + streak + " dagen op rij" : ""}`);
  };
}

/* ---------- Voorbeelden ---------- */
async function hsVoorbeelden() {
  const v = vandaagISO(), nu = new Date().toISOString();
  const maak = (o, patroon) => {
    const x = Object.assign(hsNieuw(o.soort), o, { id: uid(), voorbeeld: true, gemaakt: nu, bijgewerkt: nu });
    x.sessies = [];
    for (let i = 27; i >= 0; i--) {
      const d = plusDagen(v, -i), wd = weekdagVan(d);
      if (patroon.dagen.includes(wd) && (i % patroon.sla) !== 0) x.sessies.push({ id: uid(), datum: d, minuten: patroon.min[(i * 7) % patroon.min.length], score: 3 + ((i * 3) % 3), notitie: "", ts: nu });
    }
    return x;
  };
  const items = [
    maak({ soort: "hobby", naam: "Gitaar spelen", emoji: "🎸", kleur: "#d97706", status: "bezig", doelMin: 90, dagen: [1, 3, 6], waarom: "Ontspanning na werk en ooit een liedje voor vrienden spelen.",
      mijlpalen: [{ id: uid(), tekst: "Vier basisakkoorden vloeiend wisselen", af: true, afOp: plusDagen(v, -9) + "T18:00:00.000Z" }, { id: uid(), tekst: "Eerste liedje van begin tot eind", af: false }, { id: uid(), tekst: "Barré-akkoord F schoon laten klinken", af: false }],
      bronnen: [{ id: uid(), titel: "JustinGuitar beginnerscursus", url: "https://www.justinguitar.com/" }] }, { dagen: [1, 3, 6], sla: 5, min: [30, 45, 20] }),
    maak({ soort: "skill", naam: "Spaans", emoji: "🗣️", kleur: "#2f6fed", status: "bezig", niveau: 2, doelMin: 60, dagen: [1, 2, 3, 4, 5], waarom: "Volgend jaar drie weken door Andalusië en met de locals kunnen praten.",
      mijlpalen: [{ id: uid(), tekst: "Jezelf voorstellen zonder na te denken", af: true, afOp: plusDagen(v, -20) + "T18:00:00.000Z" }, { id: uid(), tekst: "Een menukaart begrijpen en bestellen", af: false }, { id: uid(), tekst: "Gesprek van 5 minuten voeren", af: false }],
      bronnen: [{ id: uid(), titel: "Woordenlijst week 1–4", url: "" }] }, { dagen: [1, 2, 3, 4, 5], sla: 4, min: [15, 20, 10, 25] }),
    maak({ soort: "skill", naam: "Foto's bewerken", emoji: "📷", kleur: "#7a4fd6", status: "wil", niveau: 1, doelMin: 45, dagen: [0], waarom: "De vakantiefoto's eindelijk mooi maken in plaats van ze te laten liggen.",
      mijlpalen: [{ id: uid(), tekst: "Eén foto van begin tot eind bewerken", af: false }], bronnen: [] }, { dagen: [], sla: 1, min: [30] })
  ];
  [["muziek", 5], ["taal", 4], ["foto", 0]].forEach(([cat, af], i) => {
    hsPasSjabloonToe(items[i], cat);
    items[i].checklist.slice(0, af).forEach(p => { p.af = true; p.afOp = nu; });
  });
  for (const x of items) await bewaar("hs_items", x);
  await logGebeurtenis("hobbyskill", "🎨 Voorbeelden toegevoegd bij HobbySkills");
  teken(); toast("Drie voorbeelden toegevoegd — pas ze aan of verwijder ze");
}

/* ---------- Zoeken en widget (gebruikt door de koppelingen) ---------- */
function hsZoek(q) {
  q = (q || "").toLowerCase().trim();
  if (!q) return [];
  return hsAlle().filter(x => (x.naam + " " + (x.waarom || "") + " " + (x.mijlpalen || []).map(m => m.tekst).join(" ") + " " + (x.checklist || []).map(m => m.tekst).join(" ") + " " + (x.sessies || []).map(s => s.notitie).join(" ")).toLowerCase().includes(q));
}
function hsWidget() {
  const alle = hsAlle();
  if (!alle.length) return "";
  const v = vandaagISO(), ws = weekStart(v), wd = weekdagVan(v);
  const bezig = alle.filter(x => x.status === "bezig").sort(hsSorteer);
  const weekMin = alle.reduce((a, x) => a + hsMinuten(hsSessiesWeek(x, ws)), 0);
  const doel = bezig.reduce((a, x) => a + (x.doelMin || 0), 0);
  const pct = doel ? Math.min(100, Math.round(weekMin / doel * 100)) : 0;
  const vandaag = bezig.filter(x => (x.dagen || []).includes(wd) || hsGedaanOp(x, v));
  const toon = (vandaag.length ? vandaag : bezig).slice(0, 4);
  return `<div class="card hs-widget">
    <div class="kop">${ico("hobby", "width:20px;height:20px;color:var(--accent)")}<b>HobbySkills</b>
      <button class="naar" data-act="ga" data-view="hobbyskills">${hsDuur(weekMin)} deze week ${ico("pijlr", "width:13px;height:13px")}</button></div>
    ${doel ? `<div class="hs-balk" style="--hk:var(--accent)" title="${pct}% van je weekdoelen"><i style="width:${pct}%"></i></div>` : ""}
    ${toon.length ? `<div class="hs-vandaag">${toon.map(x => { const af = hsGedaanOp(x, v); return `<button class="keuze${af ? " af" : ""}" data-act="hs-sessie" data-id="${x.id}"><span class="em">${x.emoji}</span>${esc(x.naam)}${af ? " ✓" : " +"}</button>`; }).join("")}</div>` : ""}
  </div>`;
}

/* ---------- Acties ---------- */
document.addEventListener("click", async e => {
  const el = e.target.closest && e.target.closest("[data-act]");
  if (!el) return;
  const act = el.dataset.act, id = el.dataset.id;
  if (act === "log-open" && el.dataset.soort === "hobbyskill") { if (vind("hs_items", id)) ga("hobbyskill", id); return; }
  if (!act.startsWith("hs-")) return;
  const x = id ? vind("hs_items", id) : null;
  switch (act) {
    case "hs-nieuw": hsItemBlad(null, el.dataset.soort || (V.hsSoort === "skill" ? "skill" : "hobby")); break;
    case "hs-bewerk": if (x) hsItemBlad(x.id); break;
    case "hs-sessie": hsSessieBlad(x ? x.id : null); break;
    case "hs-voorbeelden": await hsVoorbeelden(); break;
    case "hs-filter": V[el.dataset.veld] = el.dataset.w; teken(); break;
    case "hs-sessies-alle": V.hsAlleSessies = !V.hsAlleSessies; teken(); break;
    case "hs-status":
      if (!x) break;
      x.status = el.dataset.s;
      await hsBewaar(x);
      if (x.status === "klaar") { await logGebeurtenis("hobbyskill", `${x.emoji} Afgerond: ${x.naam}`, x.id); tril(12); }
      teken(); toast(HS_STATUS[x.status]);
      break;
    case "hs-niveau":
      if (!x) break;
      x.niveau = +el.dataset.n; await hsBewaar(x);
      await logGebeurtenis("hobbyskill", `${x.emoji} ${x.naam}: niveau ${HS_NIVEAU[x.niveau]}`, x.id);
      teken(); toast("Niveau: " + HS_NIVEAU[x.niveau]);
      break;
    case "hs-dag": {
      if (!x) break;
      const d = +el.dataset.d, i = (x.dagen || (x.dagen = [])).indexOf(d);
      if (i >= 0) x.dagen.splice(i, 1); else x.dagen.push(d);
      await hsBewaar(x); teken();
      break;
    }
    case "hs-plan":
      if (!x) break;
      openTaakBlad(null, { titel: "Oefenen: " + x.naam, datum: vandaagISO(), duur: Math.min(60, Math.max(15, Math.round((x.doelMin || 30) / Math.max(1, (x.dagen || []).length || 2)))), labels: ["hobbyskills"], notitie: `${x.emoji} ${x.soort === "skill" ? "Skill" : "Hobby"} uit HobbySkills` });
      break;
    case "hs-waarom":
      if (!x) break;
      bladVraag("Waarom wil je dit?", x.waarom || "", "Wat brengt het je? Waar wil je naartoe?", async w => { x.waarom = w; await hsBewaar(x); teken(); }, true);
      break;
    case "hs-mijlpaal-toevoegen": {
      const veld = $("#hs-mp-nieuw"); if (!veld) break;
      await hsMijlpaalToevoegen(veld.dataset.id, veld.value);
      break;
    }
    case "hs-mijlpaal-vink": {
      if (!x) break;
      const m = (x.mijlpalen || []).find(m => m.id === el.dataset.m); if (!m) break;
      m.af = !m.af; m.afOp = m.af ? new Date().toISOString() : null;
      await hsBewaar(x);
      if (m.af) { tril(12); await logGebeurtenis("hobbyskill", `${x.emoji} Mijlpaal gehaald: ${m.tekst}`, x.id); }
      teken();
      break;
    }
    case "hs-mijlpaal-taak": {
      if (!x) break;
      const m = (x.mijlpalen || []).find(m => m.id === el.dataset.m); if (!m) break;
      openTaakBlad(null, { titel: m.tekst, labels: ["hobbyskills"], notitie: `${x.emoji} Mijlpaal van ${x.naam}` });
      break;
    }
    case "hs-mijlpaal-weg":
      if (!x) break;
      x.mijlpalen = (x.mijlpalen || []).filter(m => m.id !== el.dataset.m);
      await hsBewaar(x); teken();
      break;
    case "hs-sessie-weg": {
      if (!x) break;
      const s = (x.sessies || []).find(s => s.id === el.dataset.s); if (!s) break;
      x.sessies = x.sessies.filter(q => q.id !== s.id);
      await hsBewaar(x); teken();
      toast("Sessie verwijderd", "Ongedaan maken", async () => { x.sessies.push(s); await hsBewaar(x); teken(); });
      break;
    }
    case "hs-bron-nieuw":
      if (!x) break;
      bladVraag("Bron of link", "", "Titel, of plak een link (https://…)", async w => {
        if (!w) return;
        const url = /^https?:\/\/\S+$/i.test(w) ? w : (w.match(/https?:\/\/\S+/) || [""])[0];
        const titel = url ? w.replace(url, "").trim() || url.replace(/^https?:\/\//, "").split("/")[0] : w;
        (x.bronnen || (x.bronnen = [])).push({ id: uid(), titel, url });
        await hsBewaar(x); teken();
      });
      break;
    case "hs-bron-weg":
      if (!x) break;
      x.bronnen = (x.bronnen || []).filter(b => b.id !== el.dataset.b);
      await hsBewaar(x); teken();
      break;
    case "hs-verwijder":
      if (!x) break;
      bevestigVerwijderen(async () => {
        await verwijder("hs_items", x.id);
        await logGebeurtenis("hobbyskill", `${x.emoji} Verwijderd: ${x.naam}`);
        ga("hobbyskills"); toast(x.naam + " verwijderd");
      });
      break;
  }
});
async function hsMijlpaalToevoegen(id, tekst) {
  const x = vind("hs_items", id); tekst = (tekst || "").trim();
  if (!x || !tekst) return;
  (x.mijlpalen || (x.mijlpalen = [])).push({ id: uid(), tekst, af: false });
  await hsBewaar(x); teken();
  const n = $("#hs-mp-nieuw"); if (n) n.focus();
}
RT_NA.push(() => {
  const veld = $("#hs-mp-nieuw");
  if (veld) veld.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); hsMijlpaalToevoegen(veld.dataset.id, veld.value); } };
});
