"use strict";
/* ==========================================================================
   59. Financieel — Vaste lasten opnieuw vormgegeven
   - Verdeling per maand als tabel: per soort een rij met kleurstip, naam,
     aantal posten, balk (t.o.v. de grootste soort), bedrag en aandeel.
     Bovenaan één gestapelde balk met 2px tussenruimte; soorten onder 2,5%
     worden daarin samengevoegd tot "kleine posten". Tik op een rij = naar
     die soort in de lijst.
   - Tijdlijn "Deze 13 dagen": blokhoogtes evenredig met het bedrag en altijd
     binnen de kaart, dagtotaal erboven, €0-posten weggelaten, bakje valt niet
     meer over de datums, legenda klopt met de kleuren. Zelfde opbouw als
     vlAnimatie verwacht (#vl, .vl-blok[data-i], #vl-bakje, #vl-pot, #vl-bedrag).
   - Getallen in de tegels bovenaan krimpen tot ze passen.
   ========================================================================== */
const fvEuro = n => "€ " + Math.round(+n || 0).toLocaleString("nl-NL");
const fvKort = n => { n = +n || 0; return n >= 1000 ? "€" + (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(".", ",") + "k" : "€" + Math.round(n); };
const fvCat = i => VLCATS.some(c => c[0] === i.cat) ? i.cat : (i.cat ? "overig" : "abonnement");

function fvVerdeling(actief, maandTotaal) {
  const per = {};
  actief.forEach(i => { const k = fvCat(i); (per[k] || (per[k] = { k, som: 0, n: 0 })); per[k].som += perMaand(i); per[k].n++; });
  const rijen = Object.values(per).filter(r => r.som > 0).sort((a, b) => b.som - a.som);
  if (!rijen.length) return "";
  const max = rijen[0].som;
  const groot = rijen.filter(r => r.som / maandTotaal >= .025), klein = rijen.filter(r => r.som / maandTotaal < .025);
  const kleinSom = klein.reduce((a, r) => a + r.som, 0);
  const seg = groot.map(r => ({ w: r.som, kl: vlKleur(r.k), t: `${vlNaam(r.k)}: ${eur(r.som)} per maand (${Math.round(r.som / maandTotaal * 100)}%)` }));
  if (kleinSom > 0) seg.push({ w: kleinSom, kl: "var(--line2)", t: `${klein.length} kleine soorten samen: ${eur(kleinSom)} per maand` });
  return `<div class="fv-balk" role="img" aria-label="Verdeling vaste lasten per maand: ${rijen.map(r => `${esc(vlNaam(r.k))} ${Math.round(r.som / maandTotaal * 100)}%`).join(", ")}">
      ${seg.map(s => `<i style="flex:${s.w.toFixed(2)};background:${s.kl}" title="${esc(s.t)}"></i>`).join("")}</div>
    <div class="fv-tabel" role="table" aria-label="Vaste lasten per soort">
      <div class="fv-kop" role="row"><span role="columnheader">Soort</span><span role="columnheader" class="fv-rechts">Per maand</span></div>
      ${rijen.map(r => { const pct = r.som / maandTotaal * 100;
        return `<button class="fv-rij" role="row" data-act="fv-cat" data-k="${r.k}" aria-label="${esc(vlNaam(r.k))}: ${eur(r.som)} per maand, ${Math.round(pct)} procent, ${r.n} posten">
          <span class="fv-naam" role="cell"><i style="background:${vlKleur(r.k)}"></i><span><b>${esc(vlNaam(r.k))}</b><small>${r.n} post${r.n === 1 ? "" : "en"}</small></span></span>
          <span class="fv-bedrag" role="cell"><b>${fvEuro(r.som)}</b><small>${pct < 1 ? "<1" : Math.round(pct)}%</small></span>
          <span class="fv-spoor" aria-hidden="true"><i style="width:${Math.max(1.5, r.som / max * 100).toFixed(1)}%;background:${vlKleur(r.k)}"></i></span>
        </button>`; }).join("")}
    </div>`;
}

finVaste = function () {
  const v = vandaagISO();
  const actief = S.incassos.filter(i => i.actief);
  const maandTotaal = vasteLastenTotaal();
  const { dagen, vandaagIdx, totaal } = vlVenster();
  dagen.forEach(d => { d.posten = d.posten.filter(p => (+p.bedrag || 0) > 0); });
  const maxDag = Math.max(1, ...dagen.map(d => d.bedrag));
  const HMAX = 70;
  const blokH = b => Math.max(3, Math.round((+b || 0) / maxDag * HMAX));
  const centen = eur(maandTotaal).match(/,\d\d$/);

  let h = `<div class="card fv-kaart">
    <div class="fv-hoofd">
      <div><span class="fv-label">Vaste lasten per maand</span>
        <div class="fv-totaal">${eur(maandTotaal).replace(/,\d\d$/, "")}<small>${centen ? centen[0] : ""}</small></div></div>
      ${maandTotaal ? `<div class="fv-mini"><div><b>${fvEuro(maandTotaal * 12)}</b><span>per jaar</span></div><div><b>${fvEuro(maandTotaal / DAGEN_PER_MAAND)}</b><span>per dag</span></div><div><b>${actief.length}</b><span>post${actief.length === 1 ? "" : "en"}</span></div></div>` : ""}
    </div>
    ${maandTotaal ? fvVerdeling(actief, maandTotaal) : ""}
  </div>`;

  const csvRij = `<div class="knoprij" style="margin:10px 0 2px">${csvKnop("incasso", "Vaste lasten importeren (CSV)")}</div>`;
  if (!actief.length) {
    return h + `<div class="card">${leeg("🏠", "Nog geen vaste lasten",
      "Zet je huur, energie, verzekeringen en abonnementen erin. Je ziet dan precies wanneer ze van je rekening gaan.")}</div>
      <button class="knop breed primair" data-act="fin-incasso-nieuw">${ico("plus")} Vaste last toevoegen</button>` + csvRij;
  }

  const verlopen = dagen.slice(0, vandaagIdx).reduce((a, d) => a + d.bedrag, 0);
  h += `<div class="vl-kaart fv-tijd">
    <div class="fv-tijdkop">
      <b>Deze 13 dagen</b>
      <span class="klein">${totaal ? eur(totaal) + " in totaal" : "niets ingepland"}</span>
    </div>
    <div class="vl-lijn" id="vl" data-totaal="${totaal}" data-vandaag="${vandaagIdx}"
      data-dagen='${JSON.stringify(dagen.map(d => ({ b: Math.round(d.bedrag * 100) / 100 })))}'>
      <div class="vl-rail"></div>
      <div class="vl-dagen">
        ${dagen.map((d, i) => `<button class="vl-dag${i < vandaagIdx ? " verleden" : ""}${i === vandaagIdx ? " vandaag" : ""}"
            data-act="vl-dag" data-i="${i}" data-datum="${d.datum}"
            aria-label="${esc(datumLabel(d.datum, true))}${d.bedrag ? ": " + eur(d.bedrag) + " (" + d.posten.map(p => esc(p.naam)).join(", ") + ")" : ": niets"}">
          <span class="blokken">${d.posten.map(p =>
            `<span class="vl-blok" data-i="${i}" style="--k:${vlKleur(fvCat(p))};height:${blokH(p.bedrag)}px" title="${esc(p.naam)} ${eur(p.bedrag)}"></span>`).join("")}
            ${d.bedrag ? `<span class="fv-som">${fvKort(d.bedrag)}</span>` : ""}</span>
          <span class="tik"></span>
          <span class="gat"></span>
          <span class="nr">${parseISO(d.datum).getDate()}</span>
          <span class="dg">${i === vandaagIdx ? "nu" : DAGKORT[weekdagVan(d.datum)]}</span>
        </button>`).join("")}
      </div>
      <div class="vl-bakje" id="vl-bakje" style="left:0">
        <span class="vl-haak"></span>
        <span class="vl-touw"></span>
        <span class="vl-pot" id="vl-pot"><small>nog af te schrijven</small><span id="vl-bedrag">${eur(totaal - verlopen)}</span></span>
      </div>
    </div>
    <div class="vl-legenda fv-legenda">
      <span><i class="fv-sw"></i>komt nog · kleur = soort</span>
      <span><i class="fv-sw vaag"></i>al afgeschreven</span>
      <span>tik op een dag voor de posten</span>
    </div>
  </div>`;

  h += `<button class="knop breed primair" style="margin:12px 0 4px" data-act="fin-incasso-nieuw">${ico("plus")} Vaste last toevoegen</button>` + csvRij;

  const groepen = {};
  actief.forEach(i => { (groepen[fvCat(i)] || (groepen[fvCat(i)] = [])).push(i); });
  VLCATS.forEach(([k, naam]) => {
    const lijst = (groepen[k] || []).sort((a, b) => perMaand(b) - perMaand(a));
    if (!lijst.length) return;
    const som = lijst.reduce((s, i) => s + perMaand(i), 0);
    h += `<div class="sectie fv-sectie" id="vl-cat-${k}"><i style="background:${vlKleur(k)}"></i><h2>${esc(naam)}</h2><span class="telling">${eur(som)} p/m</span></div>`;
    h += `<div class="card">${lijst.map(i => {
      const d = volgendeIncasso(i);
      return `<button class="vl-rij" data-act="fin-incasso-open" data-id="${i.id}">
        <span class="kleurbol" style="background:${vlKleur(fvCat(i))};width:10px;height:10px"></span>
        <span class="nm"><b>${esc(i.naam)}</b>
          <span class="klein" style="display:block">${esc((FREQ[i.freq] || FREQ.maand)[0])}${d ? " · volgende " + esc(datumLabel(d)) : ""}</span></span>
        <span class="rechts fv-getal" style="text-align:right">
          <b style="font-weight:700">${eur(i.bedrag)}</b>
          ${i.freq !== "maand" ? `<span class="klein" style="display:block">${eur(perMaand(i))} p/m</span>` : ""}</span>
      </button>`;
    }).join("")}</div>`;
  });

  const gestopt = S.incassos.filter(i => !i.actief);
  if (gestopt.length) {
    h += sectie("Gestopt", gestopt.length);
    h += `<div class="card">${gestopt.map(i => `<button class="vl-rij" data-act="fin-incasso-open" data-id="${i.id}">
      <span class="kleurbol" style="background:var(--line2);width:10px;height:10px"></span>
      <span class="nm"><b style="color:var(--muted)">${esc(i.naam)}</b></span>
      <span class="rechts fv-getal">${eur(i.bedrag)}</span></button>`).join("")}</div>`;
  }

  const b = dagbudget(v);
  h += `<div class="card card-pad klein" style="margin-top:12px">
    <p><b>Wat zegt dit getal?</b> ${eur(maandTotaal)} per maand gaat automatisch van je rekening.
    ${b.maand ? `Naast je maandbudget van ${eur(b.maand)} ${inst("budgetIncasso", false)
      ? "— en die is al gereserveerd in je dagbudget."
      : `— zet <i>Incasso's reserveren</i> aan bij Dagbudget als je dat eraf wilt halen.`}` : ""}</p>
  </div>`;
  return h;
};

document.addEventListener("click", e => {
  const r = e.target.closest && e.target.closest('[data-act="fv-cat"]');
  if (!r) return;
  const doel = document.getElementById("vl-cat-" + r.dataset.k);
  if (!doel) return;
  tril(5);
  doel.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  const kaart = doel.nextElementSibling;
  if (kaart) { kaart.classList.remove("fv-flits"); void kaart.offsetWidth; kaart.classList.add("fv-flits"); }
});

/* ---------- Getallen in tegels passend maken ---------- */
function fvPasGetallen() {
  $$(".dp-stat > b, .stat .getal").forEach(el => {
    el.style.fontSize = "";
    if (el.scrollWidth <= el.clientWidth) return;
    const basis = parseFloat(getComputedStyle(el).fontSize), min = basis * .6;
    for (let px = basis - 1; px >= min; px--) { el.style.fontSize = px + "px"; if (el.scrollWidth <= el.clientWidth) break; }
  });
}
RT_NA.push(fvPasGetallen);
window.addEventListener("resize", () => requestAnimationFrame(fvPasGetallen));
