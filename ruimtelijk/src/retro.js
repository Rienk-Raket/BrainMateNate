"use strict";
/* ==========================================================================
   63. Retro 8-bit letters (instelling, standaard aan) en een datum die opvalt
   ========================================================================== */
document.documentElement.dataset.retro = "1";
{
  const _pas = pasInstellingenToe;
  pasInstellingenToe = function () {
    _pas();
    document.documentElement.dataset.retro = inst("retro", true) ? "1" : "0";
    if (typeof titelPassend === "function") requestAnimationFrame(titelPassend);
  };
  const _vwI = vwInstellingen;
  vwInstellingen = function () {
    const h = _vwI();
    const extra = schakelaar("retro", "8-bit letters", "Retrolettertype voor de titel, de datum, de onderbalk en bijschriften.", inst("retro", true));
    const i = h.indexOf('data-toggle="ruimte"'), j = i < 0 ? -1 : h.indexOf("</div>", i);
    return j < 0 ? h + `<div class="card card-pad">${extra}</div>` : h.slice(0, j + 6) + extra + h.slice(j + 6);
  };
}
const RETRO_DAG = /^(maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)\b/i;
function retroDatum() {
  const o = $("#ondertitel"); if (!o) return;
  const t = o.textContent.trim(), m = RETRO_DAG.exec(t);
  o.classList.toggle("is-datum", !!m);
  if (m && !o.querySelector(".dag")) o.innerHTML = `<span class="dag">${esc(m[1])}</span>${esc(t.slice(m[1].length))}`;
}
RT_NA.push(retroDatum);
{
  const o = $("#ondertitel");
  if (o) new MutationObserver(() => { if (!o.querySelector(".dag") || !o.classList.contains("is-datum")) retroDatum(); }).observe(o, { childList: true, characterData: true, subtree: true });
}
