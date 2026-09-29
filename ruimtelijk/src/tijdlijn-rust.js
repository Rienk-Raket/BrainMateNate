"use strict";
/* ==========================================================================
   65. Tijdlijn zonder planmeldingen
   "Gesprek gepland: …", "Afspraak gemaakt: …" en "Vervolgactie uit afspraak: …"
   staan niet meer als losse gebeurtenis op de tijdlijn: de afspraak of taak
   zelf staat er al op, op de dag waarop hij gepland is. In het logboek
   blijven de meldingen gewoon staan.
   ========================================================================== */
const TL_PLANMELDING = /^(Gesprek gepland|Afspraak gemaakt|Toezegging gemaakt|Vervolgactie uit afspraak)\s*:/i;
{
  const _items = tijdlijnItems;
  tijdlijnItems = function (van, tot) {
    const uit = _items(van, tot);
    Object.keys(uit).forEach(d => {
      uit[d] = uit[d].filter(it => it.gepland || !TL_PLANMELDING.test(String(it.tekst || "")));
      if (!uit[d].length) delete uit[d];
    });
    return uit;
  };
}
