"use strict";
// === SECTIE 103: GEBEURTENISBUS (V1, FASE 2) ===
/* ==========================================================================
   Conceptvoorstel V1, fase 2 (besluit Kas 4 oktober 2026).
   Eén plek waar de app meldt wat er gebeurt, zodat modules kunnen
   reageren zonder elkaars functies te omwikkelen.

   Wie meldt (alleen hier, op één plek omwikkeld):
   - taak.voorKlaar  vlak vóór afvinken (bijv. timer stoppen)
   - taak.klaar      taak afgerond (ook een herhaaltaak die doorschuift)
   - taak.heropend   afvinken ongedaan
   - subtaak.vink    een stap aan- of uitgevinkt
   - checkin         dagstart opgeslagen; energie.laag bij energie 1–2
   - afspraak.geweest / afspraak.gemist   antwoord op "Hoe ging het?" (V8)
   - shkaart.klaar   SCRUM-kaart naar de klaar-kolom
   - log             elke regel in het logboek (soort, tekst, refId)

   Wie luistert: duurkalibratie (V9), Ik loop vast (V7), en wat erna komt.
   Een fout in één luisteraar breekt de rest niet.

   De kern (NATE-BUS-BEGIN/EINDE) is puur en wordt getest in tests/bus.test.mjs.
   ========================================================================== */

/* NATE-BUS-BEGIN */
function busMaak() {
  const luisteraars = {}, laatste = [];
  const lijst = naam => luisteraars[naam] || (luisteraars[naam] = []);
  const noteer = (naam, data) => { laatste.push({ naam, ts: Date.now(), data }); if (laatste.length > 50) laatste.shift(); };
  return {
    /** Luisteren; geeft een functie terug om te stoppen. */
    on(naam, fn) { lijst(naam).push(fn); return () => { const l = lijst(naam), i = l.indexOf(fn); if (i >= 0) l.splice(i, 1); }; },
    /** Melden en wachten tot alle luisteraars klaar zijn (op volgorde van aanmelden). */
    async emit(naam, data) {
      noteer(naam, data);
      for (const fn of lijst(naam).slice()) { try { await fn(data); } catch (e) { if (typeof console !== "undefined") console.error("bus:" + naam, e); } }
    },
    /** Melden zonder wachten (voor plekken die synchroon moeten blijven). */
    emitSync(naam, data) {
      noteer(naam, data);
      for (const fn of lijst(naam).slice()) { try { fn(data); } catch (e) { if (typeof console !== "undefined") console.error("bus:" + naam, e); } }
    },
    aantal(naam) { return lijst(naam).length; },
    laatste() { return laatste.slice(); }
  };
}
/* NATE-BUS-EINDE */

const bus = busMaak();

/* ---------- 103.1 Melders: hier, en alleen hier, omwikkeld ---------- */
{
  const _vink = vinkTaak;
  vinkTaak = async function (id) {
    const voor = vind("taken", id), wasAf = !!(voor && voor.af), datumVoor = voor && voor.datum;
    if (voor && !wasAf) await bus.emit("taak.voorKlaar", { id, taak: voor });
    const r = await _vink.apply(this, arguments);
    const t = vind("taken", id);
    if (t && !wasAf && t.af) await bus.emit("taak.klaar", { id, taak: t });
    else if (t && !wasAf && !t.af && t.herhaal && t.datum !== datumVoor) await bus.emit("taak.klaar", { id, taak: t, herhaal: true });
    else if (t && wasAf && !t.af) await bus.emit("taak.heropend", { id, taak: t });
    return r;
  };
}
{
  const _sub = subVink;
  subVink = function (lijst, i) {
    const af = _sub.apply(this, arguments);
    bus.emitSync("subtaak.vink", { lijst, i, af });
    return af;
  };
}
{
  const _dc = dcBewaar;
  dcBewaar = async function (velden) {
    const d = await _dc.apply(this, arguments);
    if (velden && velden.checkinTs) {
      await bus.emit("checkin", { dag: d });
      if (d && d.energieNr != null && d.energieNr <= 2) await bus.emit("energie.laag", { dag: d, energie: d.energieNr });
    }
    return d;
  };
}
if (typeof shKaartVerplaats === "function") {
  const _kv = shKaartVerplaats;
  shKaartVerplaats = async function (k, kolomId) {
    const r = await _kv.apply(this, arguments), naar = vind("sh_kolommen", kolomId);
    if (naar && naar.rol === "klaar" && k && k.kolomId === kolomId) await bus.emit("shkaart.klaar", { id: k.id, kaart: k });
    return r;
  };
}
{
  const _log = logGebeurtenis;
  logGebeurtenis = async function (soort, tekst, refId) {
    const r = await _log.apply(this, arguments);
    bus.emitSync("log", { soort, tekst, refId });
    return r;
  };
}
