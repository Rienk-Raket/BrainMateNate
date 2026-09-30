// Brain-Mate Nate — scorekern van de kennismaking (vragenbank 1.0 + scoreweging 1.1).
// Alles tussen de markeringen is puur: geen DOM, geen opslag. Elke functie krijgt de
// vragenbank (bank) en de scoreweging (cfg) mee, zodat tests/scoring.test.mjs precies
// deze code kan draaien met de echte bestanden uit kennis/.
/* NATE-SCORE-BEGIN */

// Welke rol uit de scoreweging bij welk item_purpose uit de vragenbank hoort.
// De vragenbank noemt het doel van een vraag, de scoreweging geeft per rol het gewicht.
const NS_ROL = {
  herkenning: "frequency", impact: "impact", context: "context_variation",
  herstel: "recovery_cost", compensatie: "current_resource",
  ervaring: "observed_effect", voorkeur: "preference", haalbaarheid: "feasibility",
  "barrière": "barrier"
};

// De vier voorkeurvragen en de koppeling A → B komen letterlijk uit 04_scorelogica-en-routing.
const NS_VOORKEUR_IDS = ["B1.1.Q2", "B2.1.Q2", "B3.4.Q2", "B4.1.Q2"];
const NS_ROUTE = {
  "A1.1": ["B2.4", "B1.4", "B4.3"], "A1.2": ["B1.1", "B2.2"], "A1.3": ["B1.2", "B1.4"],
  "A1.4": ["B1.3", "B3.1", "B4.1"], "A2.1": ["B2.1", "B4.3"], "A2.2": ["B3.1", "B1.4", "B2.4"],
  "A2.3": ["B3.4", "B4.4"], "A2.4": ["B3.4", "B4.2", "B4.4"], "A3.1": ["B4.2", "B4.3"],
  "A3.2": ["B3.2", "B4.3"], "A3.3": ["B1.4", "B2.1", "B3.4"], "A3.4": ["B2.2", "B4.3"],
  "A4.1": ["B1.1", "B1.4", "B4.1"], "A4.2": ["B2.2", "B2.3", "B4.1"],
  "A4.3": ["B3.2", "B3.3", "B3.4"], "A4.4": ["B2.1", "B4.2", "B4.3", "B4.4"]
};
const NS_MAX_ACTIEF = 6;   // 04, stap 4: maximaal zes A-subthema's in de verkorte route
const NS_MAX_ROUTE = 4;    // 04, stap 5: maximaal vier hoogste behoeften naar Deel B
const NS_MAX_VRAGEN = 44;  // 04, stap 6: streef naar 32–44 items

// Besluit 5: elk cluster krijgt een metafoor, zodat het profiel geen label of diagnose wordt.
const NS_METAFOOR = {
  P1: "De Jongleur", P2: "De Vonk", P3: "De Vuurtoren", P4: "De Vertaler",
  P5: "De Golf", P6: "De Tuinier", P7: "De Batterij"
};
// De levensgebieden uit 08 (contextbreedte).
const NS_GEBIEDEN = ["thuis", "werk", "studie", "relaties", "sociale situaties",
  "gezondheid/zelfzorg", "financiën/administratie", "vrije tijd"];

// Ruwe score 0–4. "Niet van toepassing", "Liever niet" en geen antwoord worden null:
// die tellen nooit als 0, want dat zou een lage belasting verzinnen die er niet is.
function nsScore(antwoord, cfg) {
  const s = cfg.raw_response_mapping[antwoord];
  return typeof s === "number" ? s : null;
}
function nsRol(q) { return NS_ROL[q.item_purpose]; }
function nsItems(bank, dimId) { return bank.questions.filter(q => q.subtheme_id === dimId); }
function nsHonderd(x) { return x === null ? null : Math.round(x / 4 * 100); }

// Alle geldige (niet-ontbrekende) antwoorden van één subthema.
function nsGeldig(bank, dimId, antwoorden, cfg) {
  return nsItems(bank, dimId)
    .map(q => ({ q, rol: nsRol(q), x: nsScore(antwoorden[q.question_id], cfg) }))
    .filter(r => r.x !== null);
}
// Score 0–100 van het eerste geldige item met deze rol (elk subthema heeft er hooguit één).
function nsComponent(geldig, rol) {
  const r = geldig.find(g => g.rol === rol);
  return r ? nsHonderd(r.x) : null;
}

// Interpretatieregel uit 08: minstens 2 van de 3 items geldig én het impactitem geldig.
function nsInterpreteerbaar(geldig) {
  return geldig.length >= 2 && geldig.some(g => g.rol === "impact");
}

// Dimensiesignaal S_d = 100 × Σ(x·w) / Σ(4·w), met de itemrolgewichten uit de scoreweging.
// Hulpbronnen hebben gewicht 0: werkende compensatie verlaagt de belasting niet.
function nsSignaal(geldig, cfg) {
  let teller = 0, noemer = 0;
  for (const g of geldig) {
    const w = cfg.item_role_weights[g.rol] || 0;
    teller += g.x * w; noemer += 4 * w;
  }
  return noemer ? Math.round(100 * teller / noemer) : null;
}

// Contextbreedte: 1 gebied = 25, 2 = 50, 3 = 75, 4 of meer = 100, geen = ontbrekend.
function nsContextBreedte(aantal, cfg) {
  const t = cfg.context_breadth;
  if (!aantal) return t.zero_or_skipped;
  return [t.one_area, t.two_areas, t.three_areas][aantal - 1] ?? t.four_or_more_areas;
}

// Gewogen gemiddelde over de beschikbare delen, met herverdeling van de gewichten.
// Voorbeeld: ontbreekt R (10%), dan tellen I, F en C samen voor 100%.
function nsHerverdeeld(delen, gewichten) {
  let som = 0, w = 0;
  for (const k in gewichten) if (delen[k] !== null && delen[k] !== undefined) { som += delen[k] * gewichten[k]; w += gewichten[k]; }
  return w ? Math.round(som / w) : null;
}

// Ondersteuningsbehoefte B_d = 0,40·I + 0,30·F + 0,20·C + 0,10·R (08).
// Alleen met impact én minstens één ander deel; anders blijft de behoefte ongeïnterpreteerd.
function nsBehoefte(delen, cfg) {
  const c = cfg.support_need.components;
  const heeft = k => delen[k] !== null && delen[k] !== undefined;
  if (!heeft("I") || !(heeft("F") || heeft("C") || heeft("R"))) return null;
  return nsHerverdeeld(delen, { I: c.impact, F: c.frequency, C: c.context_breadth, R: c.recovery_or_compensation_cost });
}

// Band 0–24 / 25–49 / 50–74 / 75–100: alleen voor appprioritering, geen klinische grens.
function nsBand(score, cfg) {
  if (score === null) return null;
  return cfg.support_need.bands.find(b => score >= b.min && score <= b.max).label;
}

// Eén A-subthema volledig: signaal, behoefte, hulpbron en of het te interpreteren is.
// gebieden: de gekozen levensgebieden voor dit patroon (CTX02), of leeg.
function nsDimensie(bank, dimId, antwoorden, cfg, gebieden) {
  const geldig = nsGeldig(bank, dimId, antwoorden, cfg);
  const ok = nsInterpreteerbaar(geldig);
  const delen = {
    I: nsComponent(geldig, "impact"),
    F: nsComponent(geldig, "frequency"),
    C: nsContextBreedte((gebieden || []).length, cfg),
    R: nsComponent(geldig, "recovery_cost") ?? nsComponent(geldig, "compensation_cost")
  };
  const behoefte = ok ? nsBehoefte(delen, cfg) : null;
  return {
    id: dimId, interpreteerbaar: ok, geldig: geldig.length,
    signaal: ok ? nsSignaal(geldig, cfg) : null,
    behoefte, band: nsBand(behoefte, cfg), delen,
    // Hulpbron apart en positief: wat al helpt, los van de belasting.
    hulpbron: nsComponent(geldig, "current_resource")
  };
}

// Oplossingsfit B = 0,45·E + 0,25·P + 0,30·H; barrière blijft apart (08).
// Elk B-subthema heeft voorkeur óf haalbaarheid, dus de gewichten worden herverdeeld.
function nsFit(bank, dimId, antwoorden, cfg) {
  const geldig = nsGeldig(bank, dimId, antwoorden, cfg);
  const c = cfg.solution_fit.components;
  const E = nsComponent(geldig, "observed_effect"), P = nsComponent(geldig, "preference"),
    H = nsComponent(geldig, "feasibility"), barriere = nsComponent(geldig, "barrier");
  // 04: te interpreteren bij 2 geldige items en minstens effect of haalbaarheid.
  const ok = geldig.length >= 2 && (E !== null || H !== null);
  const fit = ok ? nsHerverdeeld({ E, P, H }, { E: c.observed_effect, P: c.preference, H: c.feasibility }) : null;
  return { id: dimId, interpreteerbaar: ok, fit, barriere, route: ok ? nsFitRoute(fit, barriere) : null };
}
// Tabel "Fit × Barrière" uit 08. Hoog = 50 of meer (de grens van de band "duidelijk").
function nsFitRoute(fit, barriere) {
  const hoogFit = fit >= 50, hoogBar = barriere !== null && barriere >= 50;
  if (hoogFit && !hoogBar) return "direct_testen";
  if (hoogFit) return "eerst_vereenvoudigen";
  if (!hoogBar) return "vrijwillig_alternatief";
  return "andere_strategie";
}

// Clusterprominentie: gewogen combinatie van al berekende dimensiesignalen, zodat een
// item nooit dubbel telt. Alleen dimensies die te interpreteren zijn doen mee; is minder
// dan de helft van het clustergewicht bekend, dan is het cluster nog niet te duiden.
function nsClusters(dims, cfg) {
  return cfg.pattern_clusters.map(cl => {
    let som = 0, w = 0;
    for (const [d, g] of Object.entries(cl.dimension_weights)) {
      const dim = dims[d];
      if (dim && dim.interpreteerbaar && dim.signaal !== null) { som += dim.signaal * g; w += g; }
    }
    const score = w >= 0.5 ? Math.round(som / w) : null;
    return { id: cl.cluster_id, naam: cl.name, metafoor: NS_METAFOOR[cl.cluster_id], prominentie: score, band: nsBand(score, cfg) };
  });
}
// Rapportregel 1 en 2 uit 08: hooguit drie clusters, meerdere tegelijk, geen winnaar.
// Onder de 25 is er "weinig gemelde behoefte" en dan noemen we het cluster niet.
function nsTopClusters(clusters) {
  return clusters.filter(c => c.prominentie !== null && c.prominentie >= 25)
    .sort((a, b) => b.prominentie - a.prominentie).slice(0, 3);
}

// ---------- Adaptieve route (04) ----------

function nsKernIds(bank) {
  return bank.questions.filter(q => q.assessment_part === "A" && q.question_id.endsWith(".Q1")).map(q => q.question_id);
}
function nsADims(bank) { return [...new Set(bank.questions.filter(q => q.assessment_part === "A").map(q => q.subtheme_id))]; }

// Een A-subthema gaat open bij kernscore ≥ 2 of als de gebruiker zelf zegt "dit speelt".
// Rangorde: eigen markering eerst, dan kernscore, dan impact. Hooguit zes.
function nsActief(bank, antwoorden, markeringen, cfg) {
  const m = markeringen || {};
  return nsADims(bank)
    .map(d => ({ d, kern: nsScore(antwoorden[d + ".Q1"], cfg), imp: nsScore(antwoorden[d + ".Q2"], cfg), vlag: !!m[d] }))
    .filter(x => x.vlag || (x.kern !== null && x.kern >= 2))
    .sort((a, b) => (b.vlag - a.vlag) || ((b.kern ?? -1) - (a.kern ?? -1)) || ((b.imp ?? -1) - (a.imp ?? -1)))
    .slice(0, NS_MAX_ACTIEF).map(x => x.d);
}

// De volledige vraagvolgorde bij de huidige antwoorden. De route groeit mee met de
// antwoorden, dus de app vraagt steeds de eerste vraag uit deze lijst die nog open is.
function nsRoute(bank, antwoorden, markeringen, cfg, gebieden) {
  const ids = [...nsKernIds(bank), ...NS_VOORKEUR_IDS];
  const actief = nsActief(bank, antwoorden, markeringen, cfg);
  for (const d of actief) ids.push(d + ".Q2", d + ".Q3");
  // Hoogste behoeften eerst naar Deel B; zonder behoefte telt het signaal, dan de kernscore.
  const g = gebieden || {};
  const rang = actief.map(d => {
    const dim = nsDimensie(bank, d, antwoorden, cfg, g[d]);
    return { d, s: dim.behoefte ?? dim.signaal ?? (nsScore(antwoorden[d + ".Q1"], cfg) ?? 0) * 25 };
  }).sort((a, b) => b.s - a.s).slice(0, NS_MAX_ROUTE);
  for (const { d } of rang) for (const b of NS_ROUTE[d]) for (const n of [1, 2, 3]) {
    const id = b + ".Q" + n;
    if (!ids.includes(id) && ids.length < NS_MAX_VRAGEN) ids.push(id);
  }
  return ids;
}
// Een antwoord is gegeven als er iets staat, ook "Niet van toepassing" of "Liever niet".
function nsBeantwoord(antwoorden, id) { return antwoorden[id] !== undefined && antwoorden[id] !== null; }
function nsVolgende(route, antwoorden) { return route.find(id => !nsBeantwoord(antwoorden, id)) || null; }
// De 16 kernvragen zijn verplicht voor een profiel (besluit 4).
function nsKernKlaar(bank, antwoorden) { return nsKernIds(bank).every(id => nsBeantwoord(antwoorden, id)); }

// ---------- Datakwaliteit en onzekerheid (08) ----------

// D = 0,50·A + 0,30·K + 0,20·X. Dit zegt alleen hoe compleet de informatie is,
// nooit hoe zeker een diagnose is.
function nsDatakwaliteit(bank, route, antwoorden, context, cfg, gebieden) {
  const q = cfg.data_quality;
  const A = route.length ? route.filter(id => nsBeantwoord(antwoorden, id)).length / route.length : 0;
  // K: welk deel van de benodigde scoreonderdelen er is, per subthema in de route.
  let nodig = 0, er = 0;
  for (const d of new Set(route.map(id => id.split(".").slice(0, 2).join(".")))) {
    if (d.startsWith("A")) {
      const dim = nsDimensie(bank, d, antwoorden, cfg, (gebieden || {})[d]);
      const rollen = nsItems(bank, d).map(nsRol);
      const delen = ["I", "C"];
      if (rollen.includes("frequency")) delen.push("F");
      if (rollen.includes("recovery_cost")) delen.push("R");
      nodig += delen.length; er += delen.filter(k => dim.delen[k] !== null).length;
    } else {
      const f = nsFit(bank, d, antwoorden, cfg);
      nodig += 2; er += (f.fit !== null ? 1 : 0) + (f.barriere !== null ? 1 : 0);
    }
  }
  const K = nodig ? er / nodig : 0;
  const ctx = cfg.context_prompts;
  const X = ctx.filter(p => context && context[p.id] !== undefined && context[p.id] !== null && context[p.id] !== "").length / ctx.length;
  const score = Math.round(100 * (q.answer_coverage * A + q.component_coverage * K + q.context_coverage * X));
  const label = score >= 75 ? "Voldoende voor apppersonalisatie" : score >= 50 ? "Voorlopige informatiebasis" : "Beperkte informatiebasis";
  return { score, label, A, K, X };
}

// Contextprompts met invloed: bij "groot" komt er een waarschuwing, nooit een aftrek.
const NS_CONTEXT_VLAG = {
  CTX05: "sleep_or_fatigue_major_influence", CTX06: "stress_or_burnout_major_influence",
  CTX07: "mood_or_anxiety_major_influence", CTX08: "trauma_or_unsafe_context_possible",
  CTX09: "physical_health_or_medication_influence", CTX10: "substance_influence"
};

// De onzekerheidsvlaggen uit de scoreweging, per profiel.
function nsOnzekerheid(bank, dims, route, antwoorden, context, cfg, gebieden) {
  const v = new Set();
  // Alleen subthema's met een verdiepingsvraag in de route: een dicht gebleven domein
  // is geen onzekerheid, dat toont het rapport apart als "beperkt ingevuld".
  const open = Object.values(dims).filter(d => route.includes(d.id + ".Q2"));
  for (const d of open) {
    if (d.geldig < 2) v.add("dimension_has_fewer_than_two_valid_items");
    if (d.geldig >= 1 && d.delen.I === null) v.add("impact_missing");
    // 04: kern- en impactitem verschillen meer dan twee schaalpunten (= meer dan 50 op 0–100).
    if (d.delen.F !== null && d.delen.I !== null && Math.abs(d.delen.F - d.delen.I) > 50) v.add("frequency_impact_mismatch");
  }
  const beantwoord = route.filter(id => nsBeantwoord(antwoorden, id)).length;
  if (route.length && beantwoord / route.length < 0.6) v.add("selected_item_coverage_below_60_percent");
  const alle = new Set(Object.values(gebieden || {}).flat());
  if (alle.size === 1) v.add("only_one_life_area");
  const c = context || {};
  if (c.CTX04 === "sterk") v.add("strong_recent_change");
  for (const [id, vlag] of Object.entries(NS_CONTEXT_VLAG)) if (c[id] === "groot") v.add(vlag);
  if (c.CTX03 === "sterk_wisselend") v.add("high_context_variation");
  // Hoge compensatiekosten: werkende hulpbron én hoge belasting in hetzelfde subthema.
  for (const d of open) if (d.hulpbron !== null && d.hulpbron >= 75 && d.signaal !== null && d.signaal >= 75) v.add("high_compensation_cost");
  return cfg.uncertainty_flags.filter(f => v.has(f));
}

// Alles in één keer: het profiel dat het rapport toont. Nooit een totaalscore.
function nsProfiel(bank, antwoorden, markeringen, context, cfg, gebieden) {
  const g = gebieden || {};
  const route = nsRoute(bank, antwoorden, markeringen, cfg, g);
  const dims = {};
  for (const d of nsADims(bank)) dims[d] = nsDimensie(bank, d, antwoorden, cfg, g[d]);
  const clusters = nsClusters(dims, cfg);
  const fits = {};
  for (const id of route) if (id.startsWith("B")) { const b = id.slice(0, 4); fits[b] = fits[b] || nsFit(bank, b, antwoorden, cfg); }
  return {
    kernKlaar: nsKernKlaar(bank, antwoorden),
    dims, clusters, top: nsTopClusters(clusters), fits,
    // Domeinen die niet (genoeg) zijn ingevuld, zodat het rapport dat eerlijk kan tonen.
    beperkt: Object.values(dims).filter(d => !d.interpreteerbaar).map(d => d.id),
    kwaliteit: nsDatakwaliteit(bank, route, antwoorden, context, cfg, g),
    onzeker: nsOnzekerheid(bank, dims, route, antwoorden, context, cfg, g),
    disclaimer: bank.disclaimer
  };
}
/* NATE-SCORE-EINDE */
