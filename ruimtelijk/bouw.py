#!/usr/bin/env python3
"""Bouwt de hoofd-index.html: de basis-app (basis/index.html) plus de ruimtelijke
laag, HobbySkills en de koppelingen uit src/. Alles blijft één bestand zonder
externe bronnen. Gebruik: python3 ruimtelijk/bouw.py [pad-naar-basis-index.html]"""
import base64, json, pathlib, re, sys

HIER = pathlib.Path(__file__).resolve().parent
SRC = HIER / "src"
BRON = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else HIER.parent / "basis" / "index.html"
UIT = HIER.parent / "index.html"
html = BRON.read_text(encoding="utf-8")
lees = lambda naam: (SRC / naam).read_text(encoding="utf-8")


def vervang(oud, nieuw, n=1):
    global html
    k = html.count(oud)
    assert k == n, f"verwacht {n}x maar {k}x gevonden: {oud[:80]!r}"
    html = html.replace(oud, nieuw)


# 1. Opslag: nieuwe winkel (hs_items) vraagt een hogere databaseversie.
vervang('const DB_NAAM = "futureme", DB_VERSIE = 7;', 'const DB_NAAM = "futureme", DB_VERSIE = 14;')  # 8: hs_items, 9: wl_items, 10: Anker (mf_*), 11: Voortgang (vg_*), 12: Huishouden (hh_*), 13: Lijstjes (lj_*), 14: Keuzemachine (km_*)
# 1b. Stores met extra opties (oplopende sleutel, indexen) uit DB_OPTIES; bestaande stores blijven ongemoeid.
vervang('if (!d.objectStoreNames.contains(naam)) d.createObjectStore(naam, { keyPath: sleutel });',
        'if (!d.objectStoreNames.contains(naam)) {\n'
        '          const opt = (typeof DB_OPTIES === "object" && DB_OPTIES[naam]) || null;\n'
        '          const st = d.createObjectStore(naam, opt ? { keyPath: opt.keyPath, autoIncrement: !!opt.autoIncrement } : { keyPath: sleutel });\n'
        '          if (opt && opt.indexen) opt.indexen.forEach(([n, k]) => st.createIndex(n, k));\n'
        '        }')

# 2. Views van HobbySkills in de tekenkaart.
vervang('shles: (typeof vwShLes === "function" ? vwShLes : vwStart)',
        'shles: (typeof vwShLes === "function" ? vwShLes : vwStart),\n'
        '    hobbyskills: (typeof vwHobbySkills === "function" ? vwHobbySkills : vwStart),\n'
        '    hobbyskill: (typeof vwHobbySkill === "function" ? vwHobbySkill : vwStart),\n'
        '    wishlist: (typeof vwWishlist === "function" ? vwWishlist : vwStart),\n'
        '    wens: (typeof vwWens === "function" ? vwWens : vwStart),\n'
        '    shideeen: (typeof vwShIdeeen === "function" ? vwShIdeeen : vwStart),\n'
        '    anker: (typeof vwAnker === "function" ? vwAnker : vwStart),\n'
        '    ankerintro: (typeof vwAnkerIntro === "function" ? vwAnkerIntro : vwStart),\n'
        '    ankerkies: (typeof vwAnkerKies === "function" ? vwAnkerKies : vwStart),\n'
        '    ankerhelp: (typeof vwAnkerHelp === "function" ? vwAnkerHelp : vwStart),\n'
        '    ankerervaring: (typeof vwAnkerErvaring === "function" ? vwAnkerErvaring : vwStart),\n'
        '    ankerinst: (typeof vwAnkerInst === "function" ? vwAnkerInst : vwStart),\n'
        '    ankerbronnen: (typeof vwAnkerBronnen === "function" ? vwAnkerBronnen : vwStart),\n'
        '    profiel: (typeof vwProfiel === "function" ? vwProfiel : vwStart),\n'
        '    huishouden: (typeof vwHuishouden === "function" ? vwHuishouden : vwStart),\n'
        '    hhlijst: (typeof vwHhLijst === "function" ? vwHhLijst : vwStart),\n'
        '    hhwaarom: (typeof vwHhWaarom === "function" ? vwHhWaarom : vwStart),\n'
        '    lijstjes: (typeof vwLijstjes === "function" ? vwLijstjes : vwStart),\n'
        '    lijstje: (typeof vwLijstje === "function" ? vwLijstje : vwStart),\n'
        '    lijstitem: (typeof vwLijstItem === "function" ? vwLijstItem : vwStart),\n'
        '    ljjaar: (typeof vwLjJaar === "function" ? vwLjJaar : vwStart),\n'
        '    keuze: (typeof vwKeuze === "function" ? vwKeuze : vwStart),\n'
        '    keuzetest: (typeof vwKeuzeTest === "function" ? vwKeuzeTest : vwStart),\n'
        '    kennismaking: (typeof vwKennismaking === "function" ? vwKennismaking : vwStart),\n'
        '    planning: (typeof vwPlanning === "function" ? vwPlanning : vwStart),\n'
        '    ruimtes: (typeof vwRuimtes === "function" ? vwRuimtes : vwStart),\n'
        '    aanpak: (typeof vwAanpak === "function" ? vwAanpak : vwStart),\n'
        '    weekreview: (typeof vwWeekreview === "function" ? vwWeekreview : vwStart),\n'
        '    morgen: (typeof vwMorgen === "function" ? vwMorgen : vwStart),\n'
        '    keuzedilemma: (typeof vwKeuzeDilemma === "function" ? vwKeuzeDilemma : vwStart),\n'
        '    keuzetheorie: (typeof vwKeuzeTheorie === "function" ? vwKeuzeTheorie : vwStart),\n'
        '    ontwerp: (typeof vwOntwerp === "function" ? vwOntwerp : vwStart)')

# 3b. Categorieën: terugvallen op "overig" op naam, niet op positie (ruimte voor eigen categorieën).
vervang("(CATEGORIEEN.find(c => c[0] === k) || CATEGORIEEN[6])", '(CATEGORIEEN.find(c => c[0] === k) || CATEGORIEEN.find(c => c[0] === "overig"))', 2)
vervang("(VLCATS.find(c => c[0] === k) || VLCATS[6])", '(VLCATS.find(c => c[0] === k) || VLCATS.find(c => c[0] === "overig"))', 2)

# 3c. Checklists: kopjes tellen niet mee als punt.
vervang('onder = c ? c.items.filter(i => i.af).length + " van " + c.items.length + " af" : "";',
        'onder = c ? c.items.filter(i => i.af && !clSectie(i)).length + " van " + c.items.filter(i => !clSectie(i)).length + " af" : "";')
vervang("if (c.items.length && c.items.every(x => x.af)) {", "if (c.items.some(x => !clSectie(x)) && c.items.every(x => x.af || clSectie(x))) {")

# 3. HobbySkills staat niet in de onderbalk; bereikbaar via Nieuw, Meer, Persoonlijk en het dagoverzicht.

# 4. Iconen: tabicoon en illustratie voor de startscherm-tegel.
ICOON = ('<symbol id="i-hobby" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">'
         '<path d="M11 3.5l1.9 5.3 5.3 1.9-5.3 1.9L11 17.9l-1.9-5.3-5.3-1.9 5.3-1.9z"/>'
         '<path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/></symbol>')
ILL = ('<symbol id="ill-hobby" viewBox="0 0 100 80"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">\n'
       '  <rect x="12" y="50" width="14" height="24" rx="4" fill="currentColor" fill-opacity=".35" stroke-opacity=".7"/>\n'
       '  <rect x="34" y="36" width="14" height="38" rx="4" fill="currentColor" fill-opacity=".5" stroke-opacity=".8"/>\n'
       '  <rect x="56" y="20" width="14" height="54" rx="4" fill="currentColor" fill-opacity=".7" stroke-opacity=".9"/>\n'
       '  <path d="M84 6l2.6 7.4 7.4 2.6-7.4 2.6L84 26l-2.6-7.4L74 16l7.4-2.6z" fill="currentColor" fill-opacity=".95" stroke="none"/>\n'
       '  <path d="M14 30c10-6 20-4 28-12" stroke-opacity=".5"/>\n'
       '</g></symbol>')
CADEAU = ('<symbol id="i-cadeau" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">'
          '<rect x="3.5" y="8.5" width="17" height="4.5" rx="1.2"/><path d="M5 13v6.5a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5V13M12 8.5V21"/>'
          '<path d="M12 8.5S10.8 3.5 8 3.5a2.5 2.5 0 0 0 0 5h4zM12 8.5s1.2-5 4-5a2.5 2.5 0 0 1 0 5h-4z"/></symbol>')
vervang('<symbol id="i-ster"', ICOON + '\n' + CADEAU + '\n<symbol id="i-ster"')
ILL_WL = ('<symbol id="ill-wishlist" viewBox="0 0 100 80"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">\n'
          '  <rect x="14" y="36" width="46" height="36" rx="5" fill="currentColor" fill-opacity=".18" stroke-opacity=".8"/>\n'
          '  <rect x="10" y="25" width="54" height="12" rx="4" fill="currentColor" fill-opacity=".4" stroke-opacity=".85"/>\n'
          '  <path d="M37 25v47" stroke-opacity=".7"/>\n'
          '  <path d="M37 25s-3-12-11-12a5.5 5.5 0 0 0 0 11zM37 25s3-12 11-12a5.5 5.5 0 0 1 0 11z" stroke-opacity=".9"/>\n'
          '  <path d="M80 34c-2.5-5-11-5-11 2 0 6 11 12 11 12s11-6 11-12c0-7-8.5-7-11-2z" fill="currentColor" fill-opacity=".92" stroke="none"/>\n'
          '  <path d="M86 6l1.6 4.4L92 12l-4.4 1.6L86 18l-1.6-4.4L80 12l4.4-1.6z" fill="currentColor" fill-opacity=".8" stroke="none"/>\n'
          '</g></symbol>')
ILL_ANKER = ('<symbol id="ill-anker" viewBox="0 0 100 80"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">\n'
             '  <circle cx="46" cy="14" r="6" stroke-opacity=".9"/>\n'
             '  <path d="M46 20v42M34 32h24" stroke-opacity=".9"/>\n'
             '  <path d="M22 46c2 12 12 18 24 18s22-6 24-18" stroke-opacity=".9"/>\n'
             '  <path d="M16 50l6-5 5 6M76 50l-6-5-5 6" stroke-opacity=".8"/>\n'
             '  <path d="M8 74c6-4 12-4 18 0s12 4 18 0 12-4 18 0 12 4 18 0 8-3 12-1" stroke-opacity=".45"/>\n'
             '  <circle cx="82" cy="18" r="9" fill="currentColor" fill-opacity=".2" stroke-opacity=".6"/>\n'
             '</g></symbol>')
ILL_VOORTGANG = ('<symbol id="ill-voortgang" viewBox="0 0 100 80"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">\n'
                 '  <path d="M10 70h80" stroke-opacity=".5"/>\n'
                 '  <path d="M14 60l16-14 14 8 18-20 16 6" stroke-opacity=".95"/>\n'
                 '  <circle cx="30" cy="46" r="3.5" fill="currentColor" stroke="none"/><circle cx="44" cy="54" r="3.5" fill="currentColor" stroke="none"/><circle cx="62" cy="34" r="3.5" fill="currentColor" stroke="none"/>\n'
                 '  <path d="M78 40V8" stroke-opacity=".9"/><path d="M78 9h14l-4 6 4 6H78" fill="currentColor" fill-opacity=".85" stroke-opacity=".9"/>\n'
                 '</g></symbol>')
# Huishouden: een blinkende vloer die gebezemd wordt (illustratie en klein icoon).
ILL_HUIS = ('<symbol id="ill-huishouden" viewBox="0 0 100 80"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">\n'
            '  <path d="M6 70h88" stroke-opacity=".75"/>\n'
            '  <path d="M14 76h20M44 76h14M70 76h18" stroke-opacity=".35"/>\n'
            '  <path d="M74 6L50 50" stroke-opacity=".95"/>\n'
            '  <path d="M44 46l14 8-4 7-22 9c-3 1-5-2-3-4z" fill="currentColor" fill-opacity=".5" stroke-opacity=".95"/>\n'
            '  <path d="M33 66l3-6M39 67l3-6M45 66l3-6" stroke-opacity=".7"/>\n'
            '  <path d="M14 58c3-4 7-5 12-5M10 64c4-3 8-4 13-3" stroke-opacity=".45"/>\n'
            '  <path d="M78 52l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="currentColor" fill-opacity=".95" stroke="none"/>\n'
            '  <path d="M90 40l1.3 3.2 3.2 1.3-3.2 1.3L90 49l-1.3-3.2-3.2-1.3 3.2-1.3z" fill="currentColor" fill-opacity=".8" stroke="none"/>\n'
            '  <path d="M20 42l1 2.6 2.6 1-2.6 1L20 49l-1-2.4-2.6-1 2.6-1z" fill="currentColor" fill-opacity=".7" stroke="none"/>\n'
            '</g></symbol>')
BEZEM = ('<symbol id="i-bezem" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">'
         '<path d="M19 3l-7.5 9.5"/><path d="M10 11.5l4 2.5-1.6 2.6-6 3.2c-1 .5-1.9-.6-1.2-1.4z"/><path d="M3 21.5h18"/><path d="M18.5 16l.6 1.5 1.5.6-1.5.6-.6 1.5-.6-1.5-1.5-.6 1.5-.6z" fill="currentColor" stroke="none"/></symbol>')
# Sectie 80: SVG-iconen in plaats van emoji in de bediening.
SYM = lambda naam, pad: f'<symbol id="i-{naam}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">{pad}</symbol>'
EXTRA_ICONEN = "\n".join([
    SYM("anker", '<circle cx="12" cy="5" r="2.2"/><path d="M12 7.2V21M8 11h8"/><path d="M4.5 13.5c.6 4.2 3.7 7.5 7.5 7.5s6.9-3.3 7.5-7.5"/><path d="M3 15l1.5-1.8L6.3 15M21 15l-1.5-1.8L17.7 15"/>'),
    SYM("huis", '<path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5.5h4V20"/>'),
    SYM("dobbel", '<rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="8.5" cy="8.5" r="1.1" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.1" fill="currentColor"/><circle cx="12" cy="12" r="1.1" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.1" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.1" fill="currentColor"/>'),
    SYM("puzzel", '<path d="M9 4h3.5a1.8 1.8 0 1 1 3.4 0H19v4a1.8 1.8 0 1 0 0 3.5V15h-3.5a1.8 1.8 0 1 1-3.5 0H9v-3.5a1.8 1.8 0 1 1 0-3.5z"/><path d="M5 9v10h10"/>'),
    SYM("batterij", '<rect x="3" y="7" width="16" height="10" rx="2.5"/><path d="M21 10.5v3"/><path d="M6 10v4M9 10v4"/>'),
    # Sectie 81: Lijstjes
    SYM("lijstjes", '<path d="M9 6h11M9 12h11M9 18h7"/><path d="M4.5 4.3l.7 1.4 1.5.2-1.1 1 .3 1.5-1.4-.7-1.4.7.3-1.5-1.1-1 1.5-.2z" fill="currentColor" stroke-width="1"/><circle cx="4.5" cy="12" r="1.2" fill="currentColor"/><circle cx="4.5" cy="18" r="1.2" fill="currentColor"/>'),
    SYM("film", '<rect x="3" y="9" width="18" height="11" rx="2"/><path d="M3 9l1.2-4.2 16.3 1.8L20 9"/><path d="M8.2 5.3 7 9M13.2 5.9 12 9M18 6.4 17 9"/>'),
    SYM("tv", '<rect x="3" y="6" width="18" height="12.5" rx="2.2"/><path d="M8.5 21.5h7M9 2.5l3 3.5 3-3.5"/>'),
    SYM("noot", '<path d="M9 17.5V5.5l11-2v12"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="15.5" r="2.5"/><path d="M9 9.5l11-2"/>'),
    SYM("game", '<path d="M7 7.5h10a4.5 4.5 0 0 1 4.4 5.4l-.8 3.9a2.2 2.2 0 0 1-3.8 1l-2.1-2.3H9.3l-2.1 2.3a2.2 2.2 0 0 1-3.8-1l-.8-3.9A4.5 4.5 0 0 1 7 7.5z"/><path d="M8 10.5v3M6.5 12h3"/><circle cx="15.5" cy="11" r=".9" fill="currentColor"/><circle cx="17.5" cy="13" r=".9" fill="currentColor"/>'),
    SYM("bestek", '<path d="M7 3v7a2 2 0 0 0 2 2M11 3v7a2 2 0 0 1-2 2v9M9 3v6"/><path d="M17 21V3c-2.2 1.2-3 3.6-3 7 0 1.7.9 3 3 3"/>'),
    SYM("pan", '<path d="M3 11h14v4a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5z"/><path d="M17 12.5h4"/><path d="M8 7.5c0-1.4 1.2-1.6 1.2-3M12 7.5c0-1.4 1.2-1.6 1.2-3"/>'),
    # Sectie 82: Keuzemachine
    SYM("keuze", '<path d="M12 3v18"/><rect x="3" y="7" width="7" height="7" rx="1.8"/><rect x="14" y="10" width="7" height="7" rx="1.8"/><path d="M5.5 10.5h2M16.5 13.5h2"/>'),
    SYM("munt", '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5.5"/><path d="M12 9.5v5"/>'),
    SYM("trofee", '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 5.5H4.5a3 3 0 0 0 3.6 4.3M16 5.5h3.5a3 3 0 0 1-3.6 4.3"/><path d="M12 13v4M8.5 20.5h7M9.5 20.5c0-2 1-3.5 2.5-3.5s2.5 1.5 2.5 3.5"/>')])
# Lijstjes: een klapbord met een lijst, sterren en een filmstrookje (illustratie voor de tegel).
ILL_LJ = ('<symbol id="ill-lijstjes" viewBox="0 0 100 80"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">\n'
          '  <rect x="16" y="12" width="46" height="62" rx="6" fill="currentColor" fill-opacity=".18" stroke-opacity=".85"/>\n'
          '  <rect x="29" y="7" width="20" height="10" rx="3" fill="currentColor" fill-opacity=".55" stroke-opacity=".9"/>\n'
          '  <path d="M26 32h26M26 44h26M26 56h18" stroke-opacity=".75"/>\n'
          '  <rect x="62" y="30" width="30" height="40" rx="4" fill="currentColor" fill-opacity=".4" stroke-opacity=".85" transform="rotate(10 77 50)"/>\n'
          '  <path d="M68 33l-1 7M78 35l-1 7M88 37l-1 7" stroke-opacity=".7" transform="rotate(10 77 50)"/>\n'
          '  <path d="M80 4l2.4 5.2 5.6.6-4.2 3.8 1.2 5.5L80 16.3l-5 2.8 1.2-5.5-4.2-3.8 5.6-.6z" fill="currentColor" fill-opacity=".95" stroke="none"/>\n'
          '</g></symbol>')
# Keuzemachine: een machientje met twee blokjes (A en B) op een band en een lampje.
ILL_KM = ('<symbol id="ill-keuze" viewBox="0 0 100 80"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">\n'
          '  <rect x="34" y="14" width="40" height="42" rx="6" fill="currentColor" fill-opacity=".22" stroke-opacity=".9"/>\n'
          '  <circle cx="46" cy="26" r="3.5" fill="currentColor" stroke="none"/><circle cx="62" cy="26" r="3.5" fill="currentColor" fill-opacity=".5" stroke="none"/>\n'
          '  <path d="M44 42h20" stroke-opacity=".7"/>\n'
          '  <path d="M6 66h88" stroke-opacity=".85"/><path d="M10 72h80" stroke-opacity=".4" stroke-dasharray="6 6"/>\n'
          '  <rect x="10" y="50" width="14" height="14" rx="3" fill="currentColor" fill-opacity=".85" stroke="none"/>\n'
          '  <rect x="80" y="50" width="14" height="14" rx="7" fill="currentColor" fill-opacity=".55" stroke-opacity=".9"/>\n'
          '  <path d="M54 4v10" stroke-opacity=".7"/>\n'
          '</g></symbol>')
# Toolbox: een gereedschapskist met hengsel, met een moersleutel en een potlood erin.
ILL_TB = ('<symbol id="ill-toolbox" viewBox="0 0 100 80"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">\n'
          '  <rect x="14" y="36" width="72" height="36" rx="6" fill="currentColor" fill-opacity=".22" stroke-opacity=".9"/>\n'
          '  <path d="M14 48h72" stroke-opacity=".6"/><rect x="44" y="44" width="12" height="8" rx="2" fill="currentColor" fill-opacity=".8" stroke="none"/>\n'
          '  <path d="M36 36v-8a4 4 0 0 1 4-4h20a4 4 0 0 1 4 4v8" stroke-opacity=".9"/>\n'
          '  <path d="M24 34l8-22M29 10a6 6 0 1 0 6 6" stroke-opacity=".85"/>\n'
          '  <path d="M70 34l6-24 4 1-6 24" fill="currentColor" fill-opacity=".55" stroke-opacity=".85"/>\n'
          '  <path d="M86 8l1.6 4.4L92 14l-4.4 1.6L86 20l-1.6-4.4L80 14l4.4-1.6z" fill="currentColor" fill-opacity=".9" stroke="none"/>\n'
          '</g></symbol>')
vervang('<symbol id="ill-persoonlijk"', ILL + '\n' + ILL_WL + '\n' + ILL_ANKER + '\n' + ILL_VOORTGANG + '\n' + ILL_HUIS + '\n' + ILL_LJ + '\n' + ILL_KM + '\n' + ILL_TB + '\n' + BEZEM + '\n' + EXTRA_ICONEN + '\n<symbol id="ill-persoonlijk"')

# 5. Stijl: achteraan in het bestaande <style>-blok.
css = "\n\n" + lees("ruimte.css") + "\n\n" + lees("ruimte-data.css") + "\n\n" + lees("ontwerp.css") + "\n\n" + lees("hobbyskills.css") + "\n\n" + lees("sh-tabs.css") + "\n\n" + lees("eigen-categorieen.css") + "\n\n" + lees("fin-vast.css") + "\n\n" + lees("wishlist.css") + "\n\n" + lees("nieuw-rail.css") + "\n\n" + lees("mm-export.css") + "\n\n" + lees("retro.css").replace("__PIXELFONT__", base64.b64encode((HIER / "fonts" / "press-start-2p.woff2").read_bytes()).decode()) + "\n\n" + lees("incasso-bellen.css") + "\n\n" + lees("nieuw-overzicht.css") + "\n\n" + lees("sh-ideeen.css") + "\n\n" + lees("anker.css") + "\n\n" + lees("voortgang.css") + "\n\n" + lees("huishouden.css") + "\n\n" + lees("verweven.css") + "\n\n" + lees("lijstjes.css") + "\n\n" + lees("keuzemachine.css") + "\n\n" + lees("nieuw-lagen.css") + "\n\n" + lees("nate.css") + "\n\n" + lees("kennismaking.css") + "\n\n" + lees("mijn-dag.css") + "\n\n" + lees("navigatie.css") + "\n\n" + lees("nate-chat.css") + "\n\n" + lees("ik-loop-vast.css") + "\n\n" + lees("terugplannen.css") + "\n\n" + lees("een-invoer.css") + "\n\n" + lees("mijn-aanpak.css") + "\n\n" + lees("ruimtes-clusters.css") + "\n\n" + lees("leesbaar.css") + "\n\n" + lees("dagniveau-herstel.css") + "\n\n" + lees("kleine-verbeteringen.css") + "\n\n" + lees("duur-review.css") + "\n\n" + lees("frictie-werkwoord.css") + "\n\n" + lees("inclusief.css") + "\n"
vervang('</style>\n</head>', css + '</style>\n</head>')

# 6. Scripts: vlak vóór het blok dat start() aanroept.
marker = "/* Alles is geladen — de app kan starten. */"
assert html.count(marker) == 1, "startmarker niet gevonden"
i = html.index(marker)
j = html.rfind("<script>", 0, i)
# 6a. Kennisbank: kennis/huishouden.json wordt FM_KENNIS in de app (dezelfde bron als de webpagina).
KENNIS_PAD = HIER.parent / "kennis" / "huishouden.json"
kennis = json.loads(KENNIS_PAD.read_text(encoding="utf-8"))
for sleutel in ("meta", "richtingen", "aanpak", "vragen", "tips", "huishouden", "onderbouwing", "bronnen"):
    assert sleutel in kennis, f"kennisbank mist '{sleutel}'"
kennis_js = "const FM_KENNIS = " + json.dumps(kennis, ensure_ascii=False).replace("</", "<\\/") + ";"
# 6b. ADHD-kennisbasis voor Nate (kennis/adhd-theorie.json) en een ingebouwde reservekopie van Nate's uiterlijk.
ADHD_PAD = HIER.parent / "kennis" / "adhd-theorie.json"
adhd = json.loads(ADHD_PAD.read_text(encoding="utf-8"))
for sleutel in ("meta", "bewijsniveaus", "domeinen", "bronnen"):
    assert sleutel in adhd, f"ADHD-kennisbasis mist '{sleutel}'"
for d in adhd["domeinen"]:
    for veld in ("id", "naam", "theorie", "interventies", "minimaleInterventie", "appAdvies"):
        assert veld in d, f"domein {d.get('id')} mist '{veld}'"
    for i in d["interventies"]:
        assert i["bewijs"] in adhd["bewijsniveaus"], f"onbekend bewijsniveau bij {d['id']}: {i['bewijs']}"
    # Stap 4: elk domein wijst naar bestaande subthema's uit de vragenbank (voor de tip van de dag).
    assert isinstance(d.get("subthemas"), list) and d["subthemas"], f"domein {d['id']} mist 'subthemas'"
NATE_SVG = HIER.parent / "assets" / "nate" / "nate.svg"
kennis_js += "\nconst NATE_ADHD = " + json.dumps(adhd, ensure_ascii=False).replace("</", "<\\/") + ";"
# 6b2. Aanvulling op de kennisbasis (V15, concept): zelfde vorm, eigen bestand.
AANVULLING = json.loads((HIER.parent / "kennis" / "aanvulling.json").read_text(encoding="utf-8"))
assert AANVULLING["meta"].get("status") == "concept" or AANVULLING["meta"].get("status") == "nagekeken", "aanvulling: status concept of nagekeken"
for d in AANVULLING["domeinen"]:
    for veld in ("id", "naam", "theorie", "interventies", "minimaleInterventie", "appAdvies", "subthemas", "waaromKort", "nate", "opschalen"):
        assert veld in d, f"aanvulling: domein {d.get('id')} mist '{veld}'"
    assert d["id"] not in {x["id"] for x in adhd["domeinen"]}, f"aanvulling: domein {d['id']} bestaat al"
    for i in d["interventies"]:
        assert i["bewijs"] in adhd["bewijsniveaus"], f"aanvulling: onbekend bewijsniveau bij {d['id']}"
    for stand, zin in d["nate"].items():
        assert len(re.findall(r"[.?!](\s|$)", zin)) <= 2 and zin.count("!") <= 1 and not re.search(r"\bmoet", zin, re.I), f"aanvulling: Nate-zin {d['id']}/{stand} past niet bij Nate's stem"
kennis_js += "\nconst NATE_AANVULLING = " + json.dumps(AANVULLING, ensure_ascii=False).replace("</", "<\\/") + ";"
kennis_js += "\nconst NATE_SVG_DATA = " + json.dumps("data:image/svg+xml;base64," + base64.b64encode(NATE_SVG.read_bytes()).decode()) + ";"
# 6c. Kennismaking: kennis/vragenbank.json en kennis/scoreweging.json komen letterlijk in de app.
#     We controleren de vorm, zodat een kapotte kopie de bouw stopt in plaats van de app.
VRAGEN = json.loads((HIER.parent / "kennis" / "vragenbank.json").read_text(encoding="utf-8"))
WEGING = json.loads((HIER.parent / "kennis" / "scoreweging.json").read_text(encoding="utf-8"))
assert VRAGEN.get("schema_version"), "vragenbank mist schema_version"
assert len(VRAGEN["questions"]) == 96, "vragenbank moet 96 vragen hebben"
assert len(VRAGEN["cases"]) == 32, "vragenbank moet 32 casussen hebben"
LABELS = ["Nooit", "Zelden", "Soms", "Vaak", "Zeer vaak", "Niet van toepassing", "Liever niet beantwoorden"]
for q in VRAGEN["questions"]:
    assert [o["label"] for o in q["response_options"]] == LABELS, f"{q['question_id']}: antwoordopties wijken af"
    assert q["response_options"][5]["score"] is None and q["response_options"][6]["score"] is None, f"{q['question_id']}: ontbrekend mag nooit 0 zijn"
assert sum(1 for q in VRAGEN["questions"] if q["assessment_part"] == "A" and q["question_id"].endswith(".Q1")) == 16, "16 kernvragen verwacht"
assert WEGING.get("schema_version", "").startswith("1.1"), "scoreweging moet versie 1.1 zijn"
assert WEGING["global_neurodivergence_score"] is False and WEGING["diagnosis_probabilities_enabled"] is False, "verboden uitkomst aan"
assert WEGING["raw_response_mapping"]["not_applicable"] is None and WEGING["raw_response_mapping"]["prefer_not"] is None, "ontbrekend mag nooit 0 zijn"
for cl in WEGING["pattern_clusters"]:
    assert abs(sum(cl["dimension_weights"].values()) - 1) < 1e-9, f"clustergewichten {cl['cluster_id']} tellen niet op tot 1"
assert len(WEGING["pattern_clusters"]) == 7 and len(WEGING["context_prompts"]) == 12, "7 clusters en 12 contextvragen verwacht"
SUBTHEMAS = {q["subtheme_id"] for q in VRAGEN["questions"] if q["assessment_part"] == "A"}
for d in adhd["domeinen"] + AANVULLING["domeinen"]:
    for sid in d["subthemas"]:
        assert sid in SUBTHEMAS, f"domein {d['id']}: onbekend subthema {sid}"
# 6d. Chat met Nate (stap 6): kennis/intenties.json. Elke bestemming wijst naar een scherm of actie.
INTENTIES = json.loads((HIER.parent / "kennis" / "intenties.json").read_text(encoding="utf-8"))
for sleutel in ("versie", "stopwoorden", "soorten", "gedachteWoorden", "nood", "bestemmingen", "nietBegrepen"):
    assert sleutel in INTENTIES, f"intenties mist '{sleutel}'"
_ids = {b["id"] for b in INTENTIES["bestemmingen"]}
for b in INTENTIES["bestemmingen"]:
    assert ("view" in b) != ("act" in b), f"bestemming {b['id']}: precies één van view/act"
    assert b["trefwoorden"], f"bestemming {b['id']} zonder trefwoorden"
assert len(INTENTIES["nietBegrepen"]["knoppen"]) == 3 and set(INTENTIES["nietBegrepen"]["knoppen"]) <= _ids, "niet begrepen: drie bestaande knoppen"
assert "113" in INTENTIES["nood"]["antwoord"], "nood-antwoord noemt 113"
kennis_js += "\nconst NATE_INTENTIES = " + json.dumps(INTENTIES, ensure_ascii=False).replace("</", "<\\/") + ";"
kennis_js += "\nconst NATE_VRAGENBANK = " + json.dumps(VRAGEN, ensure_ascii=False).replace("</", "<\\/") + ";"
kennis_js += "\nconst NATE_SCOREWEGING = " + json.dumps(WEGING, ensure_ascii=False).replace("</", "<\\/") + ";"
blokken = f"<script>\n\"use strict\";\n// Kennisbanken (gegenereerd uit kennis/huishouden.json en kennis/adhd-theorie.json, niet met de hand aanpassen)\n{kennis_js}\n</script>\n" + "".join(f"<script>\n{lees(naam)}\n</script>\n" for naam in ("sh-theorie.js", "sh-modellen.js", "sh-scrum.js", "sh-dashboard.js", "ruimte.js", "ruimte-data.js", "hobbyskills.js", "hs-sjablonen.js", "mm-bron.js", "koppelingen.js", "eigen-categorieen.js", "fin-vast.js", "wishlist.js", "sh-ideeen.js", "anker-data.js", "anker-speler.js", "anker-schermen.js", "anker-koppelingen.js", "voortgang-data.js", "voortgang.js", "profiel.js", "huishouden-data.js", "huishouden.js", "huishouden-sessie.js", "verweven.js", "lijstjes.js", "keuzemachine.js", "nieuw-rail.js", "nieuw-overzicht.js", "nieuw-analyse.js", "nieuw-lagen.js", "mm-export.js", "ontwerp.js", "retro.js", "incasso-bellen.js", "tijdlijn-rust.js", "nate.js", "nate-score.js", "kennismaking.js", "nate-tips.js", "mijn-dag.js", "navigatie.js", "nate-chat.js", "bus.js", "ik-loop-vast.js", "terugplannen.js", "een-invoer.js", "mijn-aanpak.js", "ruimtes-clusters.js", "dagniveau.js", "herstel.js", "kleine-verbeteringen.js", "duur.js", "weekreview.js", "impulsfrictie.js", "werkwoord.js", "items.js", "voorspelbaar.js", "lezen.js", "kennis-aanvulling.js"))
html = html[:j] + blokken + html[j:]

# 8. Merk: Brain-Mate Nate.
#    De bronbestanden (basis/ en src/) blijven gelijk aan FutureMe, zodat verschillen later
#    makkelijk te vergelijken zijn. Hier krijgt de gebouwde app zijn eigen naam en, belangrijk,
#    een eigen database. GitHub Pages zet al je repo's op hetzelfde domein (rienk-raket.github.io);
#    met dezelfde databasenaam zouden FutureMe en Brain-Mate Nate elkaars gegevens delen.
APP_NAAM, APP_KORT = "Brain-Mate Nate", "Nate"
vervang('const DB_NAAM = "futureme", DB_VERSIE', 'const DB_NAAM = "brainmatenate", DB_VERSIE')
# 8b. Eerste start: de kennismaking met Nate opent vanzelf, tot je begint, "Later" kiest of klaar bent.
vervang('  V.view = V.tab = inst("startscherm", "welkom");',
        '  V.view = V.tab = inst("startscherm", "welkom");\n'
        '  if (typeof knMoetStarten === "function" && knMoetStarten()) V.view = "kennismaking";')
vervang('<meta name="apple-mobile-web-app-title" content="FutureMe">', f'<meta name="apple-mobile-web-app-title" content="{APP_KORT}">')
vervang('<meta name="application-name" content="FutureMe">', f'<meta name="application-name" content="{APP_NAAM}">')
vervang('<title>FutureMe</title>', f'<title>{APP_NAAM}</title>')
vervang('name: "FutureMe", short_name: "FutureMe",', f'name: "{APP_NAAM}", short_name: "{APP_KORT}",')
vervang('KOPPEN[V.view] || ["FutureMe",', f'KOPPEN[V.view] || ["{APP_NAAM}",')
# Back-ups krijgen de nieuwe appnaam; een FutureMe-back-up blijft gewoon te importeren
# (de import kijkt alleen of er gegevens in het bestand staan, niet naar de appnaam).
vervang('{ app: "FutureMe", versie: 2,', '{ app: "BrainMateNate", versie: 2,')
# Overige zichtbare teksten met de oude naam.
for oud, nieuw in (("FutureMe · alles op dit toestel", f"{APP_NAAM} · alles op dit toestel"),
                   ("FutureMe · ${tot} taken", f"{APP_NAAM} · ${{tot}} taken"),
                   ("`FutureMe — logboek`", f"`{APP_NAAM} — logboek`"),
                   ("PRODID:-//FutureMe//NL", "PRODID:-//BrainMateNate//NL"),
                   ('"FutureMe op mijn beginscherm zetten', '"Nate op mijn beginscherm zetten'),
                   ('"FutureMe ingericht.', f'"{APP_NAAM} ingericht.'),
                   # De inbox is nu van Nate: welkomstbericht en afzender aangepast.
                   ('titel: "Welkom in je inbox",', 'titel: "Hoi, ik ben Nate",'),
                   ('tekst: "Hier komen belangrijke berichten en herinneringen samen — ingedeeld op soort en onderwerp. Vanaf de 1e van de maand komt hier automatisch een maandoverzicht, en op de 17e een financieel overzicht.",\n    onderwerp: "FutureMe"',
                    'tekst: "Hier bewaar ik berichten en herinneringen voor je. Vanaf de 1e van de maand zet ik hier een maandoverzicht klaar, en op de 17e een financieel overzicht.",\n    onderwerp: "Nate"'),
                   ('onderwerp: "FutureMe", kleur: "", titel: "Tijd voor een back-up"', 'onderwerp: "Back-up", kleur: "", titel: "Tijd voor een back-up"')):
    html = html.replace(oud, nieuw)

# 9. Geen API-koppelingen (besluit Kas, 30 september 2026).
#    FutureMe heeft in de Keuzemachine een optionele AI-laag die dilemma's naar de
#    Claude-API kan sturen. Brain-Mate Nate werkt volledig lokaal: de functie die
#    verstuurt wordt vervangen door een lege versie, de schakelaar en het
#    sleutelveld in Instellingen verdwijnen, en de bouw stopt als er toch een
#    API-adres in de app staat.
# 10. Reistijd en buffer bij een afspraak (stap 5, Mijn dag): daaruit rekent de app de
#     vertrektijd, die als klokje op de Dagring staat. Alleen het afspraakblad en de
#     velden die bij een herhaling meegaan; de rest van de app blijft gelijk.
vervang('''    <div class="veld"><label for="a-voor">Wat is er afgesproken / voorbereiding</label>''',
        '''    <div class="veld md-twee"><div><label for="a-reis">Reistijd (min)</label>
      <input class="invoer" id="a-reis" type="number" inputmode="numeric" min="0" max="600" value="${a.reistijd || ""}" placeholder="0"></div>
      <div><label for="a-buffer">Buffer vóór vertrek (min)</label>
      <input class="invoer" id="a-buffer" type="number" inputmode="numeric" min="0" max="120" value="${a.buffer != null ? a.buffer : ""}" placeholder="10"></div></div>
    <p class="klein">Met een reistijd zet Nate een klokje op je vertrektijd.</p>
    <div class="veld"><label for="a-voor">Wat is er afgesproken / voorbereiding</label>''')
vervang('''    a.plek = $("#a-plek").value.trim();
    a.personen = $("#a-personen")''',
        '''    a.plek = $("#a-plek").value.trim();
    a.reistijd = Math.max(0, +$("#a-reis").value || 0);
    a.buffer = $("#a-buffer").value === "" ? null : Math.max(0, +$("#a-buffer").value || 0);
    a.personen = $("#a-personen")''')
vervang('''  afspraken: ["titel", "soort", "tijd", "eindTijd", "plek", "personen", "werk", "voorbereiding"]''',
        '''  afspraken: ["titel", "soort", "tijd", "eindTijd", "plek", "personen", "werk", "voorbereiding", "reistijd", "buffer"]''')

# 11. Voorbereidingstijd bij een afspraak (V6, terugplannen): stoppen, voorbereiden, vertrekken.
vervang('''    <p class="klein">Met een reistijd zet Nate een klokje op je vertrektijd.</p>''',
        '''    <div class="veld"><label for="a-voorb">Voorbereiden (min)</label>
      <input class="invoer" id="a-voorb" type="number" inputmode="numeric" min="0" max="120" value="${a.voorbereiden != null ? a.voorbereiden : ""}" placeholder="10"></div>
    <p class="klein">Met een reistijd zet Nate een klokje op je vertrektijd. Nate rekent terug: stoppen, voorbereiden, vertrekken.</p>''')
vervang('''    a.buffer = $("#a-buffer").value === "" ? null : Math.max(0, +$("#a-buffer").value || 0);''',
        '''    a.buffer = $("#a-buffer").value === "" ? null : Math.max(0, +$("#a-buffer").value || 0);
    a.voorbereiden = $("#a-voorb").value === "" ? null : Math.max(0, +$("#a-voorb").value || 0);''')
vervang('''"voorbereiding", "reistijd", "buffer"]''', '''"voorbereiding", "reistijd", "buffer", "voorbereiden"]''')

# 14. Eén naamgeving (kleine verbetering 15): zichtbare teksten met de oude appnaam.
for oud, nieuw in (("meedoen met de rest van FutureMe — of haal juist dingen uit FutureMe binnen.", "meedoen met de rest van de app, of haal juist dingen uit de app binnen."),
                   ("FutureMe is een persoonlijk project.", "Brain-Mate Nate is een persoonlijk project."),
                   ("<p>FutureMe voelt als één digitale ruimte", "<p>Brain-Mate Nate voelt als één digitale ruimte"),
                   ("Open FutureMe en kies Anker.", "Open Nate en kies Anker."),
                   ("Anker is een onderdeel van FutureMe:", "Anker is een onderdeel van Brain-Mate Nate:"),
                   ("in de opslag van FutureMe (IndexedDB)", "in de opslag van de app (IndexedDB)"),
                   ("Alles wat je in FutureMe bijhoudt", "Alles wat je in de app bijhoudt")):
    assert oud in html, f"tekst niet gevonden: {oud}"
    html = html.replace(oud, nieuw)

# 15. Gebeurtenisbus (V1 fase 2): "Ongedaan" na afvinken meldt taak.heropend.
vervang('    t.af = false; t.afOp = null; await bewaar("taken", t);',
        '    t.af = false; t.afOp = null; await bewaar("taken", t);\n    if (typeof bus === "object") await bus.emit("taak.heropend", { id: t.id, taak: t });')
vervang('      t.datum = oud; await bewaar("taken", t);',
        '      t.datum = oud; await bewaar("taken", t);\n      if (typeof bus === "object") await bus.emit("taak.heropend", { id: t.id, taak: t, herhaal: true });')
vervang('''      for (const y of voor) await bewaar("taken", y);
      if (g) await verwijder("gebeurtenissen", g.id);''', '''      for (const y of voor) await bewaar("taken", y);
      if (g) await verwijder("gebeurtenissen", g.id);
      if (typeof bus === "object") await bus.emit("taak.heropend", { id: t.id, taak: t });''')

# 13. Een nieuwe keer uit een reeks begint zonder antwoord op "Hoe ging het?" (V8) en zonder alarmstatus (V6).
vervang('    k.notities = ""; k.uitkomst = "";', '    k.notities = ""; k.uitkomst = ""; delete k.hsStatus; delete k.hsOorzaak; delete k.tpGezet;')
# 12. Export en import van alle gegevens (vraag Kas, 3 oktober): bestandsnaam met de appnaam,
#     samenvoegen vergelijkt op de echte sleutel (instellingen-stores hebben "sleutel", geen "id").
vervang('const naam = `futureme-backup-${vandaagISO()}${metBijlagen ? "-compleet" : ""}.json`;',
        'const naam = `brainmatenate-gegevens-${vandaagISO()}${metBijlagen ? "-compleet" : ""}.json`;')
vervang('if (!data || !data.data) { toast("Dit is geen FutureMe-back-up"); return; }',
        'if (!data || !data.data) { toast("Dit is geen exportbestand van Brain-Mate Nate"); return; }')
vervang('      if (modus !== "vervangen" && S[w].some(x => x.id === rij.id)) continue;',
        '      const sl = WINKELS[w] || "id";\n'
        '      if (modus !== "vervangen" && S[w].some(x => x[sl] === rij[sl])) continue;\n'
        '      // Samenvoegen: dezelfde open taak (titel en datum) niet nog eens, bv. de starttaken van een nieuwe installatie.\n'
        '      if (modus !== "vervangen" && w === "taken" && !rij.af && S.taken.some(x => !x.af && x.titel === rij.titel && (x.datum || null) === (rij.datum || null))) continue;')
# Samenvoegen houdt bestaande instellingen (een afgeronde kennismaking blijft staan); vervangen zet alles terug. Daarna instellingen toepassen.
vervang('      if (w === "instellingen") { S.instellingen[rij.sleutel] = rij.waarde; await idbZet(w, rij); aantal++; continue; }',
        '      if (w === "instellingen") { const nu = S.instellingen[rij.sleutel]; if (modus !== "vervangen" && nu !== undefined && !(rij.sleutel === "nate_km" && !(nu || {}).klaar)) continue; S.instellingen[rij.sleutel] = rij.waarde; await idbZet(w, rij); aantal++; continue; }')
vervang('''  teken();
  toast(`${aantal} onderdelen teruggezet`, null, null, 5000);''', '''  if (typeof pasInstellingenToe === "function") pasInstellingenToe();
  teken();
  toast(`${aantal} onderdelen teruggezet`, null, null, 5000);''')

begin = html.index("async function kmAiVerrijk(d, p, lokaal) {")
eind = html.index("function kmAiAanBlad() {", begin)
html = html[:begin] + ("async function kmAiVerrijk() { return null; }   // Brain-Mate Nate: geen API-koppelingen\n") + html[eind:]
vervang('const kmAiKlaar = () => kmAiInst().aan && !!inst("km_sleutel", null);',
        'const kmAiKlaar = () => false;   // Brain-Mate Nate: geen API-koppelingen')
vervang('/* Instellingen → Keuzemachine (akkoord B). */\nif (typeof vwInstellingen === "function") {',
        '/* Instellingen → Keuzemachine: uitgeschakeld in Brain-Mate Nate (geen API-koppelingen). */\nif (false) {')
for verboden in ("api.anthropic.com", "x-api-key", "anthropic-dangerous-direct-browser-access"):
    assert verboden not in html, f"API-koppeling gevonden in de app: {verboden}"

UIT.write_text(html, encoding="utf-8")
print(f"Gebouwd: {UIT} ({len(html.encode('utf-8')) // 1024} KB)")

# 7. Kennisbank-webpagina: kennis/pagina.html (inhoud) krijgt een volledige HTML-omhulling als
#    kennis/index.html, zodat hij los te openen is naast huishouden.json (bijv. via GitHub Pages).
PAGINA = HIER.parent / "kennis" / "pagina.html"
if PAGINA.exists():
    (HIER.parent / "kennis" / "index.html").write_text(
        '<!doctype html>\n<html lang="nl">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        '<!-- Gegenereerd door ruimtelijk/bouw.py uit kennis/pagina.html; niet met de hand aanpassen. -->\n'
        '</head>\n<body>\n' + PAGINA.read_text(encoding="utf-8") + '\n</body>\n</html>\n', encoding="utf-8")
    print("Kennispagina: kennis/index.html")
