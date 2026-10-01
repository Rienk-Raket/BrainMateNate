"use strict";
// === SECTIE 75: VOORTGANG – DE OVERKOEPELENDE OMGEVING ===
/* ==========================================================================
   Voortgang opent als een eigen omgeving over de hele app heen: een eigen
   kop, een eigen tabbalk en eigen schermen. De rest van FutureMe blijft
   eronder staan; "Sluiten" brengt je precies terug waar je was.

   Tabbladen:
   - Overzicht  : kerncijfers, levensgebieden, deadlines, deze week, mijlpalen
   - Doelen     : alle doelen per gebied, met voortgang en tempo
   - Meters     : eigen meters (snel loggen) en alles wat de app al meet
   - Mijlpalen  : wat je bereikte, per maand, en wat bijna binnen is
   - Terugblik  : week- of maandreview met automatische samenvatting
   Detailschermen (doel, meter, bron) liggen als stapel op het tabblad.
   Formulieren gebruiken het gewone onderblad van de app.
   ========================================================================== */

V.vg = V.vg || { tab: "overzicht", stapel: [], p: "30", w: "", filter: "alle", status: "actief", tb: "week", tbDatum: null };
const VG_TABS = [["overzicht", "Overzicht", "grafiek"], ["doelen", "Doelen", "doel"], ["meters", "Meters", "weegschaal"], ["mijlpalen", "Mijlpalen", "vlag"], ["terugblik", "Terugblik", "boek"]];
const VG_P = [["7", "7 d"], ["30", "30 d"], ["90", "90 d"], ["365", "12 mnd"], ["alles", "Alles"]];
V.vgGrafieken = {};

/* ---------- 75.1 Openen en sluiten ---------- */
function vgOpen(tab) {
  if (tab) { V.vg.tab = tab; V.vg.stapel = []; }
  let el = document.getElementById("vg-omgeving");
  if (!el) {
    el = document.createElement("div");
    el.id = "vg-omgeving";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-label", "Voortgang");
    el.innerHTML = `<header class="vg-kop"></header><main class="vg-inhoud" id="vg-inhoud"></main>
      <nav class="vg-tabs" aria-label="Voortgang">${VG_TABS.map(([id, naam, i]) => `<button class="vg-tab" data-vg="tab" data-tab="${id}">${ico(i)}<span>${naam}</span></button>`).join("")}</nav>`;
    document.body.appendChild(el);
    document.documentElement.classList.add("vg-open");
    requestAnimationFrame(() => el.classList.add("zicht"));
  }
  vgControleerDoelen().then(n => { if (n.length) toast(n.length === 1 ? `Doel behaald: ${n[0].naam}` : `${n.length} doelen behaald`); vgTeken(); });
  vgTeken();
  setTimeout(() => { const b = el.querySelector(".vg-kop button"); if (b) b.focus(); }, 80);
}
function vgSluit() {
  const el = document.getElementById("vg-omgeving");
  if (!el) return;
  el.classList.remove("zicht");
  document.documentElement.classList.remove("vg-open");
  setTimeout(() => el.remove(), 260);
  if (typeof teken === "function") teken();
}
const vgIsOpen = () => !!document.getElementById("vg-omgeving");

/* ---------- 75.2 Tekenen ---------- */
function vgTeken() {
  const el = document.getElementById("vg-omgeving");
  if (!el) return;
  V.vgGrafieken = {};
  const boven = V.vg.stapel[V.vg.stapel.length - 1];
  let titel = (VG_TABS.find(t => t[0] === V.vg.tab) || VG_TABS[0])[1], sub = "Al je vooruitgang op één plek", inhoud = "", plus = null;
  try {
    if (boven && boven.soort === "doel") { const d = vind("vg_doelen", boven.id); if (!d) { V.vg.stapel.pop(); return vgTeken(); } titel = d.naam; sub = vgGebied(d.gebied).ico + " " + vgGebied(d.gebied).naam; inhoud = vgDoelDetail(d); }
    else if (boven && boven.soort === "bron") { const b = vgBron(boven.id); if (!b) { V.vg.stapel.pop(); return vgTeken(); } titel = b.naam; sub = (b.eigen ? "Eigen meter · " : "Uit de app · ") + vgGebied(b.gebied).naam; inhoud = vgBronDetail(b); }
    else {
      inhoud = { overzicht: vgOverzicht, doelen: vgDoelenTab, meters: vgMetersTab, mijlpalen: vgMijlpalenTab, terugblik: vgTerugblikTab }[V.vg.tab]();
      plus = { doelen: ["vg-doel-nieuw", "Nieuw doel"], meters: ["vg-meter-nieuw", "Nieuwe meter"], overzicht: ["vg-doel-nieuw", "Nieuw doel"] }[V.vg.tab] || null;
    }
  } catch (e) { console.error(e); inhoud = `<div class="vg-kaart">Er ging iets mis bij het tekenen: ${esc(e.message)}</div>`; }
  el.querySelector(".vg-kop").innerHTML = `
    <div class="vg-kopregel">
      ${boven ? `<button class="vg-kopknop" data-vg="terug" aria-label="Terug">${ico("pijll")}</button>` : `<button class="vg-kopknop" data-vg="sluit" aria-label="Voortgang sluiten">${ico("x")}</button>`}
      <div class="vg-koptekst"><h1>${esc(titel)}</h1><span>${esc(sub)}</span></div>
      ${plus ? `<button class="vg-kopknop" data-vg="${plus[0]}" aria-label="${plus[1]}">${ico("plus")}</button>` : `<span class="vg-kopknop leeg" aria-hidden="true"></span>`}
    </div>`;
  const main = el.querySelector(".vg-inhoud"), bewaarScroll = V.vg.laatsteSleutel === vgSleutel() ? main.scrollTop : 0;
  main.innerHTML = inhoud;
  main.scrollTop = bewaarScroll;
  V.vg.laatsteSleutel = vgSleutel();
  el.querySelectorAll(".vg-tab").forEach(b => { const aan = b.dataset.tab === V.vg.tab; b.classList.toggle("aan", aan); b.setAttribute("aria-current", aan ? "page" : "false"); });
}
const vgSleutel = () => V.vg.tab + "|" + V.vg.stapel.map(s => s.soort + s.id).join("/");
const vgMv = (n, een, meer) => `${nwoGetal(n)} ${n === 1 ? een : meer}`;

/* ---------- 75.3 Bouwstenen ---------- */
function vgBalk(p, label) {
  const pct = Math.round((p || 0) * 100);
  return `<span class="vg-balk" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"${label ? ` aria-label="${esc(label)}"` : ""}><i style="width:${Math.max(p > 0 ? 2 : 0, pct)}%"></i></span>`;
}
function vgRing(p, maat) {
  maat = maat || 64;
  const r = 26, o = 2 * Math.PI * r, pct = Math.round((p || 0) * 100);
  return `<span class="vg-ring" style="width:${maat}px;height:${maat}px" role="img" aria-label="${pct} procent">
    <svg viewBox="0 0 64 64"><circle class="vg-ringspoor" cx="32" cy="32" r="${r}"/><circle class="vg-ringboog" cx="32" cy="32" r="${r}" stroke-dasharray="${(o * Math.min(1, p || 0)).toFixed(1)} ${o.toFixed(1)}"/></svg><b>${pct}%</b></span>`;
}
function vgTempoHTML(t) { return `<span class="vg-tempo t-${t.code}">${t.ico ? `<i aria-hidden="true">${t.ico}</i>` : ""}${esc(t.tekst)}</span>`; }
function vgPijl(nu, voor, richting) {
  if (nu == null || voor == null || nu === voor) return `<span class="vg-pijl gelijk" aria-label="gelijk">＝</span>`;
  const op = nu > voor, goed = richting === "omlaag" ? !op : richting === "neutraal" ? null : op;
  const pct = voor ? Math.round(Math.abs(nu - voor) / Math.abs(voor) * 100) : null;
  return `<span class="vg-pijl ${goed == null ? "" : goed ? "goed" : "minder"}">${op ? "↑" : "↓"}${pct != null && pct < 1000 ? " " + pct + "%" : ""}</span>`;
}
function vgDoelKaart(d) {
  const st = vgDoelStand(d), t = vgTempo(d, st), g = vgGebied(d.gebied);
  return `<button class="vg-doel" data-vg="doel" data-id="${d.id}">
    <span class="vg-doelkop"><span class="vg-gebiedico" aria-hidden="true">${g.ico}</span><b>${esc(d.naam)}</b><span class="vg-pct">${Math.round(st.p * 100)}%</span></span>
    ${vgBalk(st.p, d.naam)}
    <span class="vg-doelonder"><span>${esc(st.tekst)}${d.periode && d.periode !== "totaal" && d.soort === "bron" ? " · " + esc((VG_PERIODES.find(p => p[0] === d.periode) || ["", ""])[1].toLowerCase()) : ""}</span>${vgTempoHTML(t)}</span>
  </button>`;
}
function vgGrafiek(bron, p, w, sleutel) {
  const m = { naam: bron.naam, eenheid: bron.eenheid, agg: bron.agg, data: () => bron.data() };
  const per = { "7": "dag", "30": "dag", "90": "week", "365": "maand", alles: "maand" }[p] || "dag";
  const r = nwoReeks(m, { p, per, f: "" });
  w = w || (bron.agg === "gem" ? "lijn" : "staaf");
  V.vgGrafieken[sleutel] = { r, m, w };
  return `<div class="nwo-analyse vg-grafiek" data-vg-g="${sleutel}">${nwoTijdSVG(m, r, w)}<div class="nwo-tip" aria-live="polite">Tik op de grafiek voor de precieze waarde</div></div>`;
}
function vgKeuzeRij(soort, waarde, opties, klein) {
  return `<div class="vg-segment${klein ? " klein" : ""}" role="group">${opties.map(([k, n]) => `<button data-vg="${soort}" data-w="${esc(k)}" aria-pressed="${String(waarde) === String(k)}">${esc(n)}</button>`).join("")}</div>`;
}

/* ---------- 75.4 Overzicht ---------- */
function vgOverzicht() {
  const actief = vgActieveDoelen(), jaar = vandaagISO().slice(0, 4), bronnen = vgAutoBronnen();
  const gem = actief.length ? actief.reduce((a, d) => a + vgDoelStand(d).p, 0) / actief.length : null;
  const behaaldJaar = S.vg_doelen.filter(d => d.behaaldOp && d.behaaldOp.startsWith(jaar)).length;
  const alleMp = vgMijlpalen(), mpJaar = alleMp.filter(m => m.datum.startsWith(jaar)).length;
  const ws = weekStart(vandaagISO()), gemetenWeek = S.vg_metingen.filter(m => m.datum >= ws).length;
  let h = "";
  if (!S.vg_doelen.length && !S.vg_meters.length) h += `<section class="vg-kaart vg-welkom">
      <b>Zo werkt Voortgang</b>
      <p>Alles wat je in FutureMe bijhoudt, komt hier samen: taken, omzet, uren, sport, gewicht, rookvrij, gewoontes, Anker en meer. Zet er doelen op, voeg eigen meters toe en kijk per week of maand terug.</p>
      <div class="vg-knoppen"><button class="vg-knop hoofd" data-vg="vg-doel-nieuw">${ico("doel")} Eerste doel</button><button class="vg-knop" data-vg="vg-meter-nieuw">${ico("plus")} Eigen meter</button></div>
    </section>`;
  h += `<section class="vg-held">
    <div class="vg-heldring">${vgRing(gem || 0, 96)}<span>${gem == null ? "Nog geen actieve doelen" : `gemiddelde voortgang van ${vgMv(actief.length, "actief doel", "actieve doelen")}`}</span></div>
    <div class="vg-tegels">
      <button class="vg-tegel" data-vg="tab" data-tab="doelen"><b>${actief.length}</b><span>actieve doelen</span></button>
      <button class="vg-tegel" data-vg="tab" data-tab="doelen" data-status="behaald"><b>${behaaldJaar}</b><span>behaald in ${jaar}</span></button>
      <button class="vg-tegel" data-vg="tab" data-tab="mijlpalen"><b>${mpJaar}</b><span>mijlpalen in ${jaar}</span></button>
      <button class="vg-tegel" data-vg="tab" data-tab="meters"><b>${gemetenWeek}</b><span>eigen metingen deze week</span></button>
    </div></section>`;
  // Levensgebieden: voortgang op doelen, activiteit (30 dagen) en gevoel uit de laatste terugblik
  h += `<h2 class="vg-sectie">Levensgebieden</h2><section class="vg-kaart vg-gebieden">
    ${VG_GEBIEDEN.map(g => { const s = vgGebiedStand(g.id, bronnen);
      return `<button class="vg-gebied" data-vg="gebied" data-id="${g.id}">
        <span class="vg-gebiednaam"><span aria-hidden="true">${g.ico}</span>${esc(g.naam)}</span>
        <span class="vg-gebiedbalk">${s.p == null ? `<span class="vg-geen">geen doel</span>` : vgBalk(s.p, g.naam) + `<b>${Math.round(s.p * 100)}%</b>`}</span>
        <span class="vg-gebiedmeta">${vgMv(s.activiteit, "keer", "keer")} actief in 30 dagen ${vgPijl(s.activiteit, s.vorige, "omhoog")}${s.gevoel ? ` · gevoel ${s.gevoel}/10` : ""}</span>
      </button>`; }).join("")}
    <p class="vg-uitleg">Balk: gemiddelde voortgang van je doelen in dat gebied. Pijl: activiteit tegenover de 30 dagen ervoor.</p></section>`;
  const deadlines = actief.filter(d => d.deadline).sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 3);
  if (deadlines.length) h += `<h2 class="vg-sectie">Eerstvolgende deadlines</h2><div class="vg-lijst">${deadlines.map(vgDoelKaart).join("")}</div>`;
  const wk = vgSamenvatting(vgTerugblikPeriode("week"));
  const bewegers = wk.rijen.slice(0, 5);
  h += `<h2 class="vg-sectie">Deze week <small>tot nu toe, tegenover dezelfde dagen vorige week</small></h2>`;
  h += bewegers.length ? `<section class="vg-kaart vg-rijen">${bewegers.map(vgBewegerRij).join("")}</section>`
    : `<section class="vg-kaart vg-stil">Nog niets vastgelegd deze of vorige week.</section>`;
  const mp = alleMp.slice(0, 3);
  h += `<h2 class="vg-sectie">Laatste mijlpalen</h2>`;
  h += mp.length ? `<section class="vg-kaart vg-rijen">${mp.map(vgMijlpaalRij).join("")}<button class="vg-meer" data-vg="tab" data-tab="mijlpalen">Alle mijlpalen ${ico("pijlr")}</button></section>`
    : `<section class="vg-kaart vg-stil">Je eerste mijlpaal komt vanzelf: bij je eerste afgeronde taak, sportsessie of Anker-moment.</section>`;
  return h;
}
function vgBewegerRij(x) {
  return `<button class="vg-rij" data-vg="bron" data-id="${esc(x.b.id)}"><span class="vg-rijnaam"><span aria-hidden="true">${vgGebied(x.b.gebied).ico}</span>${esc(x.b.naam)}</span>
    <span class="vg-rijwaarde"><b>${esc(vgFmt(x.b, x.nu || 0))}</b><small>was ${esc(vgFmt(x.b, x.voor || 0))}</small></span>${vgPijl(x.nu || 0, x.voor || 0, x.b.richting)}</button>`;
}
function vgMijlpaalRij(m) {
  return `<div class="vg-rij vg-mp"><span class="vg-mpico" aria-hidden="true">${m.doel ? `<span class="vg-g">${ico("vlag")}</span>` : vgGebied(m.gebied).ico}</span><span class="vg-rijnaam">${esc(m.titel)}</span><small>${esc(datumLabel(m.datum))}</small></div>`;
}

/* ---------- 75.5 Doelen ---------- */
function vgDoelenTab() {
  const st = V.vg.status || "actief", f = V.vg.filter || "alle";
  const alle = S.vg_doelen.filter(d => (d.status || "actief") === st);
  const tel = id => alle.filter(d => d.gebied === id).length;
  let h = vgKeuzeRij("status", st, [["actief", `Actief (${S.vg_doelen.filter(d => (d.status || "actief") === "actief").length})`], ["behaald", `Behaald (${S.vg_doelen.filter(d => d.status === "behaald").length})`], ["archief", "Archief"]]);
  h += `<div class="vg-chips" role="group" aria-label="Levensgebied">${[["alle", "Alles", ""]].concat(VG_GEBIEDEN.filter(g => tel(g.id)).map(g => [g.id, g.naam, g.ico])).map(([k, n, e]) =>
    `<button class="vg-chip" data-vg="filter" data-w="${k}" aria-pressed="${f === k}">${e} ${esc(n)}</button>`).join("")}</div>`;
  const lijst = alle.filter(d => f === "alle" || d.gebied === f);
  if (!lijst.length) return h + `<section class="vg-kaart vg-stil">${st === "actief" ? `Nog geen doelen${f !== "alle" ? " in dit gebied" : ""}. <button class="vg-link" data-vg="vg-doel-nieuw">Zet een doel</button>` : st === "behaald" ? "Nog geen behaalde doelen. Dat komt." : "Het archief is leeg."}</section>`;
  // Gegroepeerd per gebied, in de vaste volgorde van de gebieden
  VG_GEBIEDEN.forEach(g => {
    const l = lijst.filter(d => d.gebied === g.id).sort((a, b) => (a.deadline || "9999").localeCompare(b.deadline || "9999") || a.naam.localeCompare(b.naam));
    if (l.length) h += `<h2 class="vg-sectie">${g.ico} ${esc(g.naam)}</h2><div class="vg-lijst">${l.map(vgDoelKaart).join("")}</div>`;
  });
  return h;
}
function vgDoelDetail(d) {
  const st = vgDoelStand(d), t = vgTempo(d, st);
  let h = `<section class="vg-kaart vg-doelheld">${vgRing(st.p, 110)}
    <div><b class="vg-groot">${esc(st.tekst)}</b>
      <p>${d.soort === "stappen" ? "Stappenplan" : `${esc(st.bron ? st.bron.naam : "Bron niet gevonden")}${d.periode && d.periode !== "totaal" ? " · " + esc((VG_PERIODES.find(p => p[0] === d.periode) || ["", ""])[1].toLowerCase()) : ""}`}</p>
      ${vgTempoHTML(t)}
      ${d.deadline ? `<p class="vg-klein">Deadline ${esc(langDatumLabel ? langDatumLabel(d.deadline) : d.deadline)}</p>` : ""}
      ${d.status === "behaald" && d.behaaldOp ? `<p class="vg-klein">Behaald op ${esc(datumLabel(d.behaaldOp.slice(0, 10)))}</p>` : ""}</div></section>`;
  if (d.waarom) h += `<section class="vg-kaart"><span class="vg-label">Waarom</span><p class="vg-waarom">${esc(d.waarom)}</p></section>`;
  if (d.soort === "stappen") {
    h += `<h2 class="vg-sectie">Stappen</h2><section class="vg-kaart vg-stappen">${(d.stappen || []).map(s => `<button class="vg-stap${s.af ? " af" : ""}" data-vg="stap" data-id="${d.id}" data-stap="${s.id}" aria-pressed="${!!s.af}">
      <span class="vg-vink" aria-hidden="true">${s.af ? "✓" : ""}</span><span>${esc(s.tekst)}${s.af && s.afOp ? `<small>${esc(datumLabel(s.afOp.slice(0, 10)))}</small>` : ""}</span></button>`).join("")}
      <button class="vg-link" data-vg="stap-plus" data-id="${d.id}">+ Stap toevoegen</button></section>`;
  } else if (st.bron) {
    // Nog te gaan en benodigd tempo
    const rest = st.doel - (st.nu == null ? st.start : st.nu);
    if (d.status !== "behaald" && rest && Math.sign(rest) === Math.sign(st.doel - st.start)) {
      let tempo = "";
      if (d.deadline && d.deadline > vandaagISO()) { const dagen = dagVerschil(d.deadline, vandaagISO()), weken = Math.max(1, dagen / 7);
        tempo = ` · dat is ${esc(vgFmt(st.bron, Math.abs(rest) / weken))} per week tot de deadline`; }
      h += `<section class="vg-kaart vg-nog"><b>Nog ${esc(vgFmt(st.bron, Math.abs(rest)))} te gaan</b><span>${tempo}</span></section>`;
    }
    h += `<h2 class="vg-sectie">Verloop</h2><section class="vg-kaart">${vgKeuzeRij("p", V.vg.p, VG_P, true)}${vgGrafiek(st.bron, V.vg.p, st.bron.agg === "gem" ? "lijn" : "cumulatief", "doel")}
      <button class="vg-link" data-vg="bron" data-id="${esc(st.bron.id)}">Meer over ${esc(st.bron.naam.toLowerCase())} ${ico("pijlr", "width:12px;height:12px")}</button></section>`;
  }
  h += `<div class="vg-knoppen onder">
    <button class="vg-knop" data-vg="doel-bewerk" data-id="${d.id}">${ico("pen")} Bewerken</button>
    ${d.status === "archief" ? `<button class="vg-knop" data-vg="doel-status" data-id="${d.id}" data-w="actief">Terugzetten</button>` : `<button class="vg-knop" data-vg="doel-status" data-id="${d.id}" data-w="archief">Archiveren</button>`}
    ${d.status === "behaald" ? `<button class="vg-knop" data-vg="doel-status" data-id="${d.id}" data-w="actief">Weer actief</button>` : ""}
    <button class="vg-knop gevaar" data-vg="doel-weg" data-id="${d.id}">${ico("prullenbak")} Verwijderen</button></div>`;
  return h;
}

/* ---------- 75.6 Meters ---------- */
function vgMetersTab() {
  const ws = weekStart(vandaagISO()), v = vandaagISO();
  let h = `<h2 class="vg-sectie eerste">Eigen meters</h2>`;
  if (!S.vg_meters.length) h += `<section class="vg-kaart vg-stil">Houd bij wat de app nog niet kent: bladzijden gelezen, stappen, slaap, energie, pushups. <button class="vg-link" data-vg="vg-meter-nieuw">Maak een meter</button></section>`;
  else h += `<div class="vg-lijst">${S.vg_meters.slice().sort((a, b) => a.naam.localeCompare(b.naam)).map(m => {
    const b = vgMeterBron(m), laatste = vgMetingenVan(m.id)[0], week = vgSomTussen(b, ws, v);
    const vandaagGedaan = m.type === "janee" && S.vg_metingen.some(x => x.meterId === m.id && x.datum === v);
    const snel = m.type === "teller" ? `<button class="vg-snel" data-vg="log-plus" data-id="${m.id}" aria-label="Plus één bij ${esc(m.naam)}">+1</button>`
      : m.type === "janee" ? `<button class="vg-snel${vandaagGedaan ? " aan" : ""}" data-vg="log-janee" data-id="${m.id}" aria-pressed="${vandaagGedaan}" aria-label="${esc(m.naam)} vandaag gedaan">${vandaagGedaan ? "✓" : "Gedaan"}</button>`
      : `<button class="vg-snel" data-vg="log" data-id="${m.id}" aria-label="Meting toevoegen bij ${esc(m.naam)}">${ico("plus")}</button>`;
    return `<div class="vg-meter"><button class="vg-meterhoofd" data-vg="bron" data-id="meter:${m.id}">
        <span class="vg-rijnaam"><span aria-hidden="true">${vgGebied(m.gebied).ico}</span>${esc(m.naam)}</span>
        <small>${laatste ? `laatst ${esc(vgFmt(b, laatste.waarde))} · ${esc(datumLabel(laatste.datum))}` : "nog geen meting"}${b.agg === "som" ? ` · deze week ${esc(vgFmt(b, week || 0))}` : week != null ? ` · gem. deze week ${esc(vgFmt(b, week))}` : ""}</small></button>${snel}</div>`;
  }).join("")}</div>`;
  h += `<h2 class="vg-sectie">Uit de app <small>deze week tot nu toe · tegenover dezelfde dagen vorige week</small></h2>`;
  // Alleen bronnen waar ooit iets in is vastgelegd; de rest is ruis.
  const bronnen = vgAutoBronnen().filter(b => b.data().length), vw = plusDagen(ws, -7), vwt = plusDagen(vw, dagVerschil(v, ws));
  VG_GEBIEDEN.forEach(g => {
    const l = bronnen.filter(b => b.gebied === g.id);
    if (!l.length) return;
    h += `<section class="vg-kaart vg-rijen"><span class="vg-label">${g.ico} ${esc(g.naam)}</span>${l.map(b => {
      const nu = vgSomTussen(b, ws, v), voor = vgSomTussen(b, vw, vwt);
      return `<button class="vg-rij" data-vg="bron" data-id="${esc(b.id)}"><span class="vg-rijnaam">${esc(b.naam)}</span><span class="vg-rijwaarde"><b>${esc(vgFmt(b, nu))}</b></span>${vgPijl(nu, voor, b.richting)}</button>`;
    }).join("")}</section>`;
  });
  return h;
}
function vgBronDetail(b) {
  const p = V.vg.p, van = p === "alles" ? "0000" : plusDagen(vandaagISO(), -(+p - 1));
  const lengte = p === "alles" ? null : +p;
  const nu = vgSomTussen(b, van, vandaagISO());
  const voor = lengte ? vgSomTussen(b, plusDagen(van, -lengte), plusDagen(van, -1)) : null;
  const w = V.vg.w && ["staaf", "lijn", "cumulatief"].includes(V.vg.w) ? V.vg.w : (b.agg === "gem" ? "lijn" : "staaf");
  let h = `<section class="vg-kaart">${vgKeuzeRij("p", p, VG_P, true)}
    <div class="vg-cijfers"><div><span>${b.agg === "gem" ? "Gemiddeld" : "Totaal"} in deze periode</span><b>${esc(vgFmt(b, nu))}</b></div>
      ${lengte ? `<div><span>Periode ervoor</span><b>${esc(vgFmt(b, voor))}</b> ${vgPijl(nu, voor, b.richting)}</div>` : ""}
      <div><span>${b.agg === "gem" ? "Laatste waarde" : "Alles bij elkaar"}</span><b>${esc(vgFmt(b, vgWaarde(b, b.agg === "gem" ? "laatste" : "totaal")))}</b></div></div>
    ${vgGrafiek(b, p, w, "bron")}
    ${vgKeuzeRij("w", w, [["staaf", "Staaf"], ["lijn", "Lijn"], ["cumulatief", "Opgeteld"]], true)}</section>`;
  const doelen = S.vg_doelen.filter(d => d.bron === b.id);
  h += `<h2 class="vg-sectie">Doelen op deze meting</h2>`;
  h += doelen.length ? `<div class="vg-lijst">${doelen.map(vgDoelKaart).join("")}</div>` : "";
  h += `<button class="vg-knop breed" data-vg="vg-doel-nieuw" data-bron="${esc(b.id)}">${ico("doel")} Doel zetten op ${esc(b.naam.toLowerCase())}</button>`;
  if (b.eigen) {
    const l = vgMetingenVan(b.meter.id);
    h += `<h2 class="vg-sectie">Metingen</h2><section class="vg-kaart vg-rijen">
      <button class="vg-knop breed" data-vg="log" data-id="${b.meter.id}">${ico("plus")} Meting toevoegen</button>
      ${l.slice(0, 60).map(x => `<div class="vg-rij"><span class="vg-rijnaam">${esc(datumLabel(x.datum))}${x.notitie ? `<small>${esc(x.notitie)}</small>` : ""}</span><span class="vg-rijwaarde"><b>${esc(vgFmt(b, x.waarde))}</b></span>
        <button class="vg-mini" data-vg="meting-weg" data-id="${x.id}" aria-label="Meting van ${esc(datumLabel(x.datum))} verwijderen">${ico("prullenbak")}</button></div>`).join("") || `<p class="vg-uitleg">Nog geen metingen.</p>`}
      ${l.length > 60 ? `<p class="vg-uitleg">En nog ${l.length - 60} oudere metingen.</p>` : ""}</section>
      <div class="vg-knoppen onder"><button class="vg-knop" data-vg="meter-bewerk" data-id="${b.meter.id}">${ico("pen")} Meter bewerken</button>
      <button class="vg-knop gevaar" data-vg="meter-weg" data-id="${b.meter.id}">${ico("prullenbak")} Verwijderen</button></div>`;
  }
  return h;
}

/* ---------- 75.7 Mijlpalen ---------- */
function vgMijlpalenTab() {
  const bijna = vgVolgendeMijlpalen().slice(0, 5), alle = vgMijlpalen();
  let h = "";
  if (bijna.length) h += `<h2 class="vg-sectie eerste">Bijna binnen</h2><section class="vg-kaart vg-bijna">${bijna.map(x => `<div class="vg-bijnarij">
      <span class="vg-rijnaam"><span aria-hidden="true">${vgGebied(x.gebied).ico}</span>${esc(x.titel)}</span><b>${Math.round(x.p * 100)}%</b>${vgBalk(x.p, x.titel)}</div>`).join("")}</section>`;
  if (!alle.length) return h + `<section class="vg-kaart vg-stil">Nog geen mijlpalen. Ze verschijnen vanzelf zodra je iets bereikt: je eerste taak, € 100 omzet, 7 dagen rookvrij, een behaald doel.</section>`;
  const perMaand = new Map();
  alle.forEach(m => { const k = m.datum.slice(0, 7); if (!perMaand.has(k)) perMaand.set(k, []); perMaand.get(k).push(m); });
  h += `<h2 class="vg-sectie${bijna.length ? "" : " eerste"}">Bereikt <small>${vgMv(alle.length, "mijlpaal", "mijlpalen")}</small></h2><ol class="vg-tijdlijn">`;
  for (const [k, l] of perMaand) {
    const [y, mm] = k.split("-").map(Number);
    h += `<li class="vg-maand"><span class="vg-maandnaam">${MAANDNAMEN[mm - 1]} ${y}</span><ul>${l.map(m => `<li class="vg-mpitem"><span class="vg-mpico" aria-hidden="true">${m.doel ? `<span class="vg-g">${ico("vlag")}</span>` : vgGebied(m.gebied).ico}</span><span><b>${esc(m.titel)}</b><small>${esc(datumLabel(m.datum))}</small></span></li>`).join("")}</ul></li>`;
  }
  return h + "</ol>";
}

/* ---------- 75.8 Terugblik ---------- */
function vgTerugblikTab() {
  const soort = V.vg.tb || "week", per = vgTerugblikPeriode(soort, V.vg.tbDatum || vandaagISO());
  const sam = vgSamenvatting(per), tb = vind("vg_terugblik", per.id) || {};
  const isNu = per.tot >= vandaagISO();
  let h = vgKeuzeRij("tb", soort, [["week", "Week"], ["maand", "Maand"]]);
  h += `<div class="vg-periodenav"><button class="vg-kopknop" data-vg="tb-nav" data-w="-1" aria-label="Vorige periode">${ico("pijll")}</button>
    <b>${esc(per.naam)}</b><button class="vg-kopknop" data-vg="tb-nav" data-w="1" aria-label="Volgende periode"${isNu ? " disabled" : ""}>${ico("pijlr")}</button></div>`;
  h += `<section class="vg-kaart"><span class="vg-label">Automatisch samengevat</span>
    ${sam.behaald.length ? `<p class="vg-samen"><span class="vg-g">${ico("vlag")}</span> ${vgMv(sam.behaald.length, "doel", "doelen")} behaald: ${sam.behaald.map(d => esc(d.naam)).join(", ")}</p>` : ""}
    ${sam.mijlpalen.length ? `<p class="vg-samen"><span class="vg-g">${ico("ster")}</span> ${sam.mijlpalen.map(m => esc(m.titel)).join(" · ")}</p>` : ""}
    ${sam.rijen.length ? `<div class="vg-rijen">${sam.rijen.slice(0, 8).map(vgBewegerRij).join("")}</div>` : `<p class="vg-uitleg">Niets vastgelegd in deze periode of de periode ervoor.</p>`}
    <p class="vg-uitleg">${sam.lopend ? `Tot nu toe, vergeleken met dezelfde dagen van de ${soort === "week" ? "week" : "maand"} ervoor.` : `Vergeleken met de ${soort === "week" ? "week" : "maand"} ervoor.`}</p></section>`;
  h += `<h2 class="vg-sectie">Jouw terugblik</h2><section class="vg-kaart vg-form" id="vg-tbform" data-id="${per.id}">
    <label class="vg-veld"><span>Wat ging goed?</span><textarea id="vg-tb-goed" rows="2">${esc(tb.goed || "")}</textarea></label>
    <label class="vg-veld"><span>Wat kan beter?</span><textarea id="vg-tb-beter" rows="2">${esc(tb.beter || "")}</textarea></label>
    <label class="vg-veld"><span>Waar richt je je op ${soort === "week" ? "volgende week" : "volgende maand"}?</span><textarea id="vg-tb-focus" rows="2">${esc(tb.focus || "")}</textarea></label>
    <span class="vg-label">Hoe voelt elk gebied? (1–10, mag leeg)</span>
    ${VG_GEBIEDEN.map(g => { const w = tb.gevoel && tb.gevoel[g.id];
      return `<label class="vg-schuif"><span>${g.ico} ${esc(g.naam)}</span><input type="range" min="0" max="10" step="1" value="${w || 0}" data-gebied="${g.id}" aria-label="${esc(g.naam)}, 0 is leeg"><output>${w || "–"}</output></label>`; }).join("")}
    <button class="vg-knop hoofd breed" data-vg="tb-opslaan">${tb.ts ? "Bijwerken" : "Terugblik opslaan"}</button>
    ${tb.ts ? `<p class="vg-uitleg">Opgeslagen op ${esc(datumLabel(tb.ts.slice(0, 10)))}.</p>` : ""}</section>`;
  const eerder = S.vg_terugblik.filter(t => t.id !== per.id).sort((a, b) => b.id.localeCompare(a.id)).slice(0, 12);
  if (eerder.length) h += `<h2 class="vg-sectie">Eerdere terugblikken</h2><section class="vg-kaart vg-rijen">${eerder.map(t => `<button class="vg-rij" data-vg="tb-open" data-id="${esc(t.id)}">
    <span class="vg-rijnaam">${esc(t.naam || t.id)}${t.focus ? `<small>Focus: ${esc(t.focus)}</small>` : ""}</span>${ico("pijlr", "width:14px;height:14px;color:var(--faint)")}</button>`).join("")}</section>`;
  return h;
}

/* ---------- 75.9 Formulieren (onderblad van de app) ---------- */
function vgBronOpties(gekozen) {
  const bronnen = vgAutoBronnen();
  let h = "";
  VG_GEBIEDEN.forEach(g => {
    const l = bronnen.filter(b => b.gebied === g.id), m = S.vg_meters.filter(x => x.gebied === g.id);
    if (!l.length && !m.length) return;
    h += `<optgroup label="${esc(g.naam)}">${l.map(b => `<option value="${esc(b.id)}"${b.id === gekozen ? " selected" : ""}>${esc(b.naam)}</option>`).join("")}
      ${m.map(x => `<option value="meter:${x.id}"${"meter:" + x.id === gekozen ? " selected" : ""}>${esc(x.naam)} (eigen meter)</option>`).join("")}</optgroup>`;
  });
  return h;
}
/* Snelle startpunten, afgeleid van wat je al bijhoudt. */
function vgSuggesties() {
  const j = vandaagISO().slice(0, 4), uit = [];
  const b = id => vgBron(id);
  if (b("taken.af")) { const doel = Math.max(100, Math.ceil((vgWaarde(b("taken.af"), "totaal") + 1) / 100) * 100); uit.push({ naam: `${doel} taken afgerond`, gebied: "thuis", bron: "taken.af", periode: "totaal", doel }); }
  if (S.sh_hustles && S.sh_hustles.length) uit.push({ naam: `€ 1.000 omzet in ${j}`, gebied: "ondernemen", bron: "sh.omzet", periode: "jaar", doel: 1000, deadline: j + "-12-31" });
  uit.push({ naam: "3 keer sporten per week", gebied: "gezondheid", bron: "gezondheid.sport", periode: "week", doel: 3 });
  if (b("rook.dagen")) uit.push({ naam: "Een jaar rookvrij", gebied: "gezondheid", bron: "rook.dagen", periode: "totaal", doel: 365 });
  if ((S.vs_gewicht || []).length) { const nu = vgWaarde(b("gezondheid.gewicht"), "laatste"); if (nu) uit.push({ naam: "Gewicht naar …", gebied: "gezondheid", bron: "gezondheid.gewicht", periode: "laatste", start: nu, doel: Math.round(nu - 5) }); }
  uit.push({ naam: "10 Anker-momenten deze maand", gebied: "rust", bron: "anker.momenten", periode: "maand", doel: 10 });
  if ((S.hs_items || []).length) uit.push({ naam: "10 uur oefenen deze maand", gebied: "groei", bron: "hobby.minuten", periode: "maand", doel: 600 });
  return uit;
}
function vgDoelBlad(concept) {
  const d = concept;
  const bron = d.soort === "bron" && d.bron ? vgBron(d.bron) : null;
  const nu = bron ? vgWaarde(bron, d.periode || "totaal") : null;
  const sugg = !d.id ? vgSuggesties() : [];
  const inhoud = `
    ${sugg.length && !d.naam ? `<div class="veld"><span class="labeltekst">Snel beginnen</span><div class="keuzerij">${sugg.map((s, i) => `<button class="keuze" data-vgsug="${i}">${esc(s.naam)}</button>`).join("")}</div></div>` : ""}
    <div class="veld"><label for="vg-d-naam">Doel</label><input class="invoer" id="vg-d-naam" value="${esc(d.naam || "")}" maxlength="80" placeholder="Bv. 10 km hardlopen, € 5.000 sparen"></div>
    <div class="veld"><span class="labeltekst">Levensgebied</span><div class="keuzerij">${VG_GEBIEDEN.map(g => `<button class="keuze" data-vggebied="${g.id}" aria-pressed="${d.gebied === g.id}">${g.ico} ${esc(g.naam)}</button>`).join("")}</div></div>
    <div class="veld"><span class="labeltekst">Hoe meet je het?</span><div class="keuzerij">
      <button class="keuze" data-vgsoort="bron" aria-pressed="${d.soort === "bron"}">Met een meting</button>
      <button class="keuze" data-vgsoort="stappen" aria-pressed="${d.soort === "stappen"}">Met stappen</button></div></div>
    ${d.soort === "stappen" ? `<div class="veld"><label for="vg-d-stappen">Stappen (één per regel)</label><textarea class="invoer" id="vg-d-stappen" rows="5" placeholder="Cursus kiezen&#10;Inschrijven&#10;Eerste les">${esc((d.stappen || []).map(s => s.tekst).join("\n"))}</textarea></div>` : `
    <div class="veld"><label for="vg-d-bron">Meting</label><select class="invoer" id="vg-d-bron"><option value="">Kies wat je wilt meten…</option>${vgBronOpties(d.bron)}</select>
      <small class="vg-hint">Staat het er niet bij? Maak eerst een eigen meter in het tabblad Meters.</small></div>
    <div class="veld"><label for="vg-d-periode">Over welke periode?</label><select class="invoer" id="vg-d-periode">${VG_PERIODES.map(([k, n]) => `<option value="${k}"${(d.periode || "totaal") === k ? " selected" : ""}>${n}</option>`).join("")}</select>
      ${bron ? `<small class="vg-hint">Nu: <b>${esc(vgFmt(bron, nu))}</b></small>` : ""}</div>
    <div class="vg-twee"><div class="veld"><label for="vg-d-start">Start</label><input class="invoer" id="vg-d-start" type="number" inputmode="decimal" step="any" value="${d.start ?? ""}" placeholder="0"></div>
      <div class="veld"><label for="vg-d-doel">Doel</label><input class="invoer" id="vg-d-doel" type="number" inputmode="decimal" step="any" value="${d.doel ?? ""}" placeholder="100"></div></div>
    <small class="vg-hint">Lager dan de start mag ook, bv. gewicht van 90 naar 80.</small>`}
    <div class="veld"><label for="vg-d-deadline">Deadline (mag leeg)</label><input class="invoer" id="vg-d-deadline" type="date" value="${esc(d.deadline || "")}"></div>
    <div class="veld"><label for="vg-d-waarom">Waarom wil je dit? (mag leeg)</label><textarea class="invoer" id="vg-d-waarom" rows="2">${esc(d.waarom || "")}</textarea></div>`;
  bladOpen(d.id ? "Doel bewerken" : "Nieuw doel", inhoud, `<button class="knop breed primair" id="vg-d-ok">${d.id ? "Opslaan" : "Doel zetten"}</button>`);
  const lees = () => {
    const w = id => { const el = document.getElementById(id); return el ? el.value : undefined; };
    d.naam = (w("vg-d-naam") || "").trim();
    if (d.soort === "stappen") { const oud = d.stappen || []; d.stappen = (w("vg-d-stappen") || "").split("\n").map(s => s.trim()).filter(Boolean).map(tekst => oud.find(s => s.tekst === tekst) || { id: uid(), tekst, af: false }); }
    else { d.bron = w("vg-d-bron") || ""; d.periode = w("vg-d-periode") || "totaal"; const s = w("vg-d-start"), z = w("vg-d-doel"); d.start = s === "" ? null : +s; d.doel = z === "" ? null : +z; }
    d.deadline = w("vg-d-deadline") || ""; d.waarom = (w("vg-d-waarom") || "").trim();
  };
  const bi = $("#bladinhoud");
  bi.addEventListener("click", e => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.vggebied) { lees(); d.gebied = t.dataset.vggebied; vgDoelBlad(d); }
    else if (t.dataset.vgsoort) { lees(); d.soort = t.dataset.vgsoort; vgDoelBlad(d); }
    else if (t.dataset.vgsug) { const s = sugg[+t.dataset.vgsug]; Object.assign(d, { soort: "bron", start: null }, s); if (d.start == null) d.start = s.periode === "laatste" ? vgWaarde(vgBron(s.bron), "laatste") : 0; vgDoelBlad(d); }
  });
  bi.addEventListener("change", e => {
    if (e.target.id === "vg-d-bron" || e.target.id === "vg-d-periode") {
      lees();
      const b2 = vgBron(d.bron);
      if (b2) {
        if (e.target.id === "vg-d-bron" && b2.agg === "gem") d.periode = "laatste";
        const huidig = vgWaarde(b2, d.periode);
        // Start: bij een stand (gewicht, schaal) de huidige waarde, bij optellen nul (of wat er al is bij "alles").
        if (d.periode === "laatste" || b2.agg === "gem") d.start = huidig == null ? null : Math.round(huidig * 10) / 10;
        else if (d.start == null || e.target.id === "vg-d-periode") d.start = 0;
        if (!d.gebied) d.gebied = b2.gebied;
        if (!d.naam) d.naam = b2.naam;
      }
      vgDoelBlad(d);
    }
  });
  $("#vg-d-ok").onclick = async () => {
    lees();
    if (!d.naam) { toast("Geef je doel een naam"); return; }
    if (!d.gebied) { toast("Kies een levensgebied"); return; }
    if (d.soort === "stappen" && !(d.stappen || []).length) { toast("Voeg minstens één stap toe"); return; }
    if (d.soort === "bron" && (!d.bron || d.doel == null || isNaN(d.doel))) { toast("Kies een meting en een doelwaarde"); return; }
    const nieuw = !d.id;
    if (nieuw) { d.id = uid(); d.gemaakt = new Date().toISOString(); d.status = "actief"; }
    d.bijgewerkt = new Date().toISOString();
    await bewaar("vg_doelen", Object.assign({}, d));
    bladSluit();
    if (nieuw && typeof logGebeurtenis === "function") await logGebeurtenis("voortgang", `Nieuw doel: ${d.naam}`, d.id);
    const behaald = await vgControleerDoelen();
    toast(behaald.some(x => x.id === d.id) ? "Doel meteen behaald 🎉" : nieuw ? "Doel gezet" : "Opgeslagen");
    if (nieuw) V.vg.stapel.push({ soort: "doel", id: d.id });
    vgTeken();
  };
}
function vgMeterBlad(concept) {
  const m = concept;
  const inhoud = `
    <div class="veld"><label for="vg-m-naam">Naam</label><input class="invoer" id="vg-m-naam" value="${esc(m.naam || "")}" maxlength="60" placeholder="Bv. Bladzijden gelezen, Slaap, Stappen"></div>
    <div class="veld"><span class="labeltekst">Soort meter</span><div class="keuzerij vg-soorten">${Object.entries(VG_METERTYPES).map(([k, t]) => `<button class="keuze" data-vgtype="${k}" aria-pressed="${m.type === k}"><b>${esc(t.naam)}</b><small>${esc(t.uitleg)}</small></button>`).join("")}</div></div>
    ${["getal", "stand"].includes(m.type) ? `<div class="veld"><label for="vg-m-eenheid">Eenheid (mag leeg)</label><input class="invoer" id="vg-m-eenheid" value="${esc(m.eenheid || "")}" maxlength="12" placeholder="Bv. km, blz, €"></div>` : ""}
    <div class="veld"><span class="labeltekst">Levensgebied</span><div class="keuzerij">${VG_GEBIEDEN.map(g => `<button class="keuze" data-vggebied="${g.id}" aria-pressed="${m.gebied === g.id}">${g.ico} ${esc(g.naam)}</button>`).join("")}</div></div>
    <div class="veld"><span class="labeltekst">Wat is vooruitgang?</span><div class="keuzerij">
      <button class="keuze" data-vgrichting="omhoog" aria-pressed="${(m.richting || "omhoog") === "omhoog"}">↑ Meer is beter</button>
      <button class="keuze" data-vgrichting="omlaag" aria-pressed="${m.richting === "omlaag"}">↓ Minder is beter</button>
      <button class="keuze" data-vgrichting="neutraal" aria-pressed="${m.richting === "neutraal"}">Gewoon bijhouden</button></div></div>`;
  bladOpen(m.id ? "Meter bewerken" : "Nieuwe meter", inhoud, `<button class="knop breed primair" id="vg-m-ok">${m.id ? "Opslaan" : "Meter maken"}</button>`);
  const lees = () => { const n = $("#vg-m-naam"), e = $("#vg-m-eenheid"); m.naam = n ? n.value.trim() : m.naam; if (e) m.eenheid = e.value.trim(); };
  $("#bladinhoud").addEventListener("click", e => {
    const t = e.target.closest("button"); if (!t) return;
    lees();
    if (t.dataset.vgtype) m.type = t.dataset.vgtype;
    else if (t.dataset.vggebied) m.gebied = t.dataset.vggebied;
    else if (t.dataset.vgrichting) m.richting = t.dataset.vgrichting;
    else return;
    vgMeterBlad(m);
  });
  $("#vg-m-ok").onclick = async () => {
    lees();
    if (!m.naam) { toast("Geef de meter een naam"); return; }
    if (!m.type) { toast("Kies een soort meter"); return; }
    if (!m.gebied) { toast("Kies een levensgebied"); return; }
    const nieuw = !m.id;
    if (nieuw) { m.id = uid(); m.gemaakt = new Date().toISOString(); }
    await bewaar("vg_meters", Object.assign({ richting: "omhoog" }, m));
    bladSluit(); toast(nieuw ? "Meter gemaakt" : "Opgeslagen"); vgTeken();
  };
}
function vgLogBlad(meterId) {
  const m = vind("vg_meters", meterId); if (!m) return;
  const schaal = m.type === "schaal", eenheid = m.type === "duur" ? "minuten" : m.eenheid || "";
  const inhoud = `
    ${schaal ? `<div class="veld"><span class="labeltekst">Hoe was het? (1–10)</span><div class="keuzerij vg-tien">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => `<button class="keuze" data-vgwaarde="${n}" aria-pressed="false">${n}</button>`).join("")}</div></div>`
      : `<div class="veld"><label for="vg-l-waarde">Waarde${eenheid ? " (" + esc(eenheid) + ")" : ""}</label><input class="invoer" id="vg-l-waarde" type="number" inputmode="decimal" step="any" placeholder="0"></div>`}
    <div class="veld"><label for="vg-l-datum">Datum</label><input class="invoer" id="vg-l-datum" type="date" value="${vandaagISO()}" max="${vandaagISO()}"></div>
    <div class="veld"><label for="vg-l-notitie">Notitie (mag leeg)</label><input class="invoer" id="vg-l-notitie" maxlength="120"></div>`;
  bladOpen(m.naam, inhoud, `<button class="knop breed primair" id="vg-l-ok">Opslaan</button>`);
  let gekozen = null;
  $("#bladinhoud").addEventListener("click", e => { const t = e.target.closest("[data-vgwaarde]"); if (!t) return; gekozen = +t.dataset.vgwaarde; $$("#bladinhoud [data-vgwaarde]").forEach(b => b.setAttribute("aria-pressed", String(b === t))); });
  setTimeout(() => { const v = $("#vg-l-waarde"); if (v) v.focus(); }, 250);
  $("#vg-l-ok").onclick = async () => {
    const w = schaal ? gekozen : parseFloat(($("#vg-l-waarde").value || "").replace(",", "."));
    if (w == null || isNaN(w)) { toast(schaal ? "Kies een cijfer" : "Vul een waarde in"); return; }
    await vgMetingOpslaan(m, w, $("#vg-l-datum").value || vandaagISO(), $("#vg-l-notitie").value.trim());
    bladSluit();
  };
}
async function vgMetingOpslaan(m, waarde, datum, notitie) {
  await bewaar("vg_metingen", { id: uid(), meterId: m.id, datum: datum || vandaagISO(), waarde, notitie: notitie || "", ts: new Date().toISOString() });
  const behaald = await vgControleerDoelen();
  toast(behaald.length ? `Doel behaald: ${behaald[0].naam} 🎉` : `${m.naam}: ${vgFmt(vgMeterBron(m), waarde)} opgeslagen`);
  vgTeken();
}

/* ---------- 75.10 Tikken in de omgeving ---------- */
document.addEventListener("click", async e => {
  const open = e.target.closest && e.target.closest('[data-act="vg-open"]');
  if (open) { e.preventDefault(); vgOpen(open.dataset.tab || null); return; }
  const el = e.target.closest && e.target.closest("#vg-omgeving [data-vg]");
  if (!el) return;
  const a = el.dataset.vg, id = el.dataset.id;
  switch (a) {
    case "sluit": vgSluit(); break;
    case "terug": V.vg.stapel.pop(); vgTeken(); break;
    case "tab": V.vg.tab = el.dataset.tab; V.vg.stapel = []; if (el.dataset.status) V.vg.status = el.dataset.status; else if (V.vg.tab === "doelen" && el.closest(".vg-tabs")) { /* status blijft */ } vgTeken(); $("#vg-inhoud").scrollTop = 0; break;
    case "gebied": V.vg.tab = "doelen"; V.vg.stapel = []; V.vg.status = "actief"; V.vg.filter = S.vg_doelen.some(d => d.gebied === id && (d.status || "actief") === "actief") ? id : "alle"; vgTeken(); break;
    case "status": V.vg.status = el.dataset.w; V.vg.filter = "alle"; vgTeken(); break;
    case "filter": V.vg.filter = el.dataset.w; vgTeken(); break;
    case "doel": V.vg.stapel.push({ soort: "doel", id }); V.vg.p = "90"; vgTeken(); $("#vg-inhoud").scrollTop = 0; break;
    case "bron": V.vg.stapel.push({ soort: "bron", id }); V.vg.w = ""; vgTeken(); $("#vg-inhoud").scrollTop = 0; break;
    case "p": V.vg.p = el.dataset.w; vgTeken(); break;
    case "w": V.vg.w = el.dataset.w; vgTeken(); break;
    case "vg-doel-nieuw": {
      const b = el.dataset.bron ? vgBron(el.dataset.bron) : null;
      const top = V.vg.stapel[V.vg.stapel.length - 1];
      vgDoelBlad(b ? { soort: "bron", bron: b.id, gebied: b.gebied, naam: "", periode: b.agg === "gem" ? "laatste" : "totaal", start: b.agg === "gem" ? vgWaarde(b, "laatste") : 0 }
        : { soort: "bron", gebied: V.vg.filter && V.vg.filter !== "alle" && V.vg.tab === "doelen" && !top ? V.vg.filter : null, periode: "totaal" });
      break;
    }
    case "doel-bewerk": { const d = vind("vg_doelen", id); if (d) vgDoelBlad(JSON.parse(JSON.stringify(d))); break; }
    case "doel-status": {
      const d = vind("vg_doelen", id); if (!d) break;
      const x = Object.assign({}, d, { status: el.dataset.w });
      if (el.dataset.w === "actief") delete x.behaaldOp;
      await bewaar("vg_doelen", x);
      toast(el.dataset.w === "archief" ? "Gearchiveerd" : "Weer actief");
      if (el.dataset.w === "actief") await vgControleerDoelen();
      vgTeken(); break;
    }
    case "doel-weg": {
      const d = vind("vg_doelen", id); if (!d) break;
      bevestig("Doel verwijderen?", `“${esc(d.naam)}” verdwijnt. De metingen zelf blijven bestaan.`, "Verwijderen", async () => { await verwijder("vg_doelen", id); V.vg.stapel.pop(); vgTeken(); toast("Doel verwijderd"); });
      break;
    }
    case "stap": {
      const d = vind("vg_doelen", id); if (!d) break;
      const x = JSON.parse(JSON.stringify(d)), s = x.stappen.find(s => s.id === el.dataset.stap);
      s.af = !s.af; s.afOp = s.af ? new Date().toISOString() : null;
      await bewaar("vg_doelen", x);
      if (s.af && typeof tril === "function") tril(10);
      const behaald = await vgControleerDoelen();
      if (behaald.length) toast(`Doel behaald: ${behaald[0].naam} 🎉`);
      vgTeken(); break;
    }
    case "stap-plus": {
      bladVraag("Stap toevoegen", "", "Bv. Offerte opvragen", async tekst => {
        if (!tekst) return; const d = vind("vg_doelen", id); if (!d) return;
        const x = JSON.parse(JSON.stringify(d)); x.stappen = (x.stappen || []).concat({ id: uid(), tekst, af: false });
        await bewaar("vg_doelen", x); vgTeken();
      });
      break;
    }
    case "vg-meter-nieuw": vgMeterBlad({ type: null, gebied: null, richting: "omhoog" }); break;
    case "meter-bewerk": { const m = vind("vg_meters", id); if (m) vgMeterBlad(Object.assign({}, m)); break; }
    case "meter-weg": {
      const m = vind("vg_meters", id); if (!m) break;
      const n = S.vg_metingen.filter(x => x.meterId === id).length;
      bevestig("Meter verwijderen?", `“${esc(m.naam)}” en ${vgMv(n, "meting", "metingen")} verdwijnen. Doelen op deze meter blijven staan maar tellen niet meer mee.`, "Verwijderen", async () => {
        for (const x of S.vg_metingen.filter(x => x.meterId === id)) await verwijder("vg_metingen", x.id);
        await verwijder("vg_meters", id); V.vg.stapel.pop(); vgTeken(); toast("Meter verwijderd");
      });
      break;
    }
    case "log": vgLogBlad(id); break;
    case "log-plus": { const m = vind("vg_meters", id); if (m) { if (typeof tril === "function") tril(8); await vgMetingOpslaan(m, 1, vandaagISO(), ""); } break; }
    case "log-janee": {
      const m = vind("vg_meters", id); if (!m) break;
      const al = S.vg_metingen.find(x => x.meterId === id && x.datum === vandaagISO());
      if (al) { await verwijder("vg_metingen", al.id); toast("Weer op niet gedaan"); vgTeken(); }
      else await vgMetingOpslaan(m, 1, vandaagISO(), "");
      break;
    }
    case "meting-weg": await verwijder("vg_metingen", id); toast("Meting verwijderd"); vgTeken(); break;
    case "tb": V.vg.tb = el.dataset.w; V.vg.tbDatum = null; vgTeken(); break;
    case "tb-nav": {
      const per = vgTerugblikPeriode(V.vg.tb, V.vg.tbDatum || vandaagISO());
      const stap = +el.dataset.w;
      V.vg.tbDatum = V.vg.tb === "maand" ? (stap < 0 ? per.vorigeVan : nwoVolgMaand(per.van)) : plusDagen(per.van, stap * 7);
      if (V.vg.tbDatum > vandaagISO()) V.vg.tbDatum = null;
      vgTeken(); break;
    }
    case "tb-open": { const t = vind("vg_terugblik", id); if (t) { V.vg.tb = t.soort; V.vg.tbDatum = t.id.replace(/^(week|maand)-/, "").padEnd(10, "-01").slice(0, 10); vgTeken(); $("#vg-inhoud").scrollTop = 0; } break; }
    case "tb-opslaan": {
      const f = $("#vg-tbform"), per = vgTerugblikPeriode(V.vg.tb, V.vg.tbDatum || vandaagISO());
      const gevoel = {};
      f.querySelectorAll("input[type=range]").forEach(r => { if (+r.value > 0) gevoel[r.dataset.gebied] = +r.value; });
      const tb = { id: per.id, soort: per.soort, naam: per.naam, van: per.van, tot: per.tot, goed: $("#vg-tb-goed").value.trim(), beter: $("#vg-tb-beter").value.trim(), focus: $("#vg-tb-focus").value.trim(), gevoel, ts: new Date().toISOString() };
      await bewaar("vg_terugblik", tb);
      if (typeof logGebeurtenis === "function") await logGebeurtenis("voortgang", `Terugblik: ${per.naam}`, per.id);
      toast("Terugblik opgeslagen"); vgTeken(); break;
    }
  }
});
document.addEventListener("input", e => {
  const r = e.target.closest && e.target.closest("#vg-omgeving .vg-schuif input");
  if (r) r.nextElementSibling.textContent = +r.value ? r.value : "–";
});
document.addEventListener("keydown", e => {
  if (e.key !== "Escape" || !vgIsOpen() || $("#blad").classList.contains("open")) return;
  if (V.vg.stapel.length) { V.vg.stapel.pop(); vgTeken(); } else vgSluit();
});
/* Tips in de grafieken (zelfde gedrag als in het Nieuw-overzicht). */
function vgTip(el) {
  const w = el.closest("[data-vg-g]"); if (!w) return;
  V.nwoReeksNu = V.vgGrafieken[w.dataset.vgG];
  nwoToonTip(el);
}
document.addEventListener("click", e => { const el = e.target.closest && e.target.closest("#vg-omgeving .nwo-raak"); if (el) vgTip(el); });
document.addEventListener("pointerover", e => { if (e.pointerType !== "mouse") return; const el = e.target.closest && e.target.closest("#vg-omgeving .nwo-raak"); if (el) vgTip(el); });

/* ---------- 75.11 Ingangen in de app ----------
   Een tegel op Nieuw (direct na Snel typen), een kaart in Meer en een
   logboeksoort. De tegel opent de omgeving, niet een gewone view. */
{
  const _start = vwStart;
  vwStart = function () {
    const h = _start();
    const n = vgActieveDoelen().length;
    const tegel = catKnop({ view: "voortgang", ill: "voortgang", naam: "Voortgang", uitleg: n ? `${vgMv(n, "actief doel", "actieve doelen")}` : "Al je vooruitgang op één plek", kleur: "#4f46e5" })
      .replace('data-act="ga" data-view="voortgang"', 'data-act="vg-open"');
    const i = h.indexOf('<div class="startgrid">');
    if (i < 0) return h;
    const j = h.indexOf("</button>", i);   // na de eerste tegel (Snel typen)
    return j < 0 ? h : h.slice(0, j + 9) + tegel + h.slice(j + 9);
  };
  const _meer = vwMeer;
  vwMeer = function () {
    const h = _meer();
    const kaart = `<button class="menu-kaart" data-act="vg-open">${ico("doel")}<span class="nm">Voortgang</span><span class="ds">Doelen, meters, mijlpalen</span></button>`;
    const i = h.indexOf('data-view="gezondheid"'), j = i < 0 ? -1 : h.indexOf("</button>", i);
    return j < 0 ? h : h.slice(0, j + 9) + kaart + h.slice(j + 9);
  };
}
if (typeof TL_SOORTEN === "object") TL_SOORTEN.voortgang = ["Voortgang", "#4f46e5"];
if (typeof LOGFILTERS !== "undefined" && Array.isArray(LOGFILTERS)) LOGFILTERS.push(["voortgang", "Voortgang"]);
