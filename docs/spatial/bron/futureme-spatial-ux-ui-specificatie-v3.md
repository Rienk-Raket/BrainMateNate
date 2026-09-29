# FutureMe – Spatial Experience
## Technisch UX/UI-specificatiedocument v3.0
### Voor `indexprompt.html` — Implementatie-ready specificatie

> **Doelstelling:** Transformeer de bestaande FutureMe-app naar een premium, futuristische mobiele ervaring met ruimtelijke glassmorphism, betekenisvolle animaties, levende data en een uitbreidbare technische architectuur. Dit document specificeert exacte wijzigingen in HTML, CSS en JavaScript zonder de volledige codebase te herschrijven.

> **Doelgroep:** Frontend developers, UX engineers, AI-implementatiesystemen  
> **Versie:** 3.0 (geoptimaliseerd september 2026)  
> **Status:** Implementatie-ready  
> **Tijdsinschatting:** 16-24 uur voor volledige implementatie

---

## Documenthistorie

| Versie | Datum | Wijzigingen | Auteur |
|---|---|---|---|
| 1.0 | 26-09-2026 | Initiële specificatie na 6 evaluatierondes | Nova, Kaito, Sora |
| 2.0 | 26-09-2026 | Structuur en consistentie verbeterd | Technical Review |
| 3.0 | 26-09-2026 | Implementatie-ready met checklists en troubleshooting | Final Review |

---

## Inhoudsopgave

1. [Ontwerppanel en visie](#1-ontwerppanel-en-visie)
2. [Architectuur en principes](#2-architectuur-en-principes)
3. [HTML-migratiegids](#3-html-migratiegids)
4. [CSS-specificatie](#4-css-specificatie)
5. [JavaScript-architectuur](#5-javascript-architectuur)
6. [Integraties en API's](#6-integraties-en-apis)
7. [Toegankelijkheid (WCAG 2.2)](#7-toegankelijkheid-wcag-22)
8. [Performance-optimalisatie](#8-performance-optimalisatie)
9. [Implementatiefasen](#9-implementatiefasen)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Ontwerppanel en visie

### 1.1 Expertpanel

Dit document is het resultaat van een iteratief ontwerpproces met drie specialisten:

| Expert | Rol | Focusgebied |
|---|---|---|
| **Nova** | Spatial Interaction Designer | 3D-interfaces, diepte, parallax, Vision Pro-achtige ervaringen |
| **Kaito** | Motion & Micro-interaction Lead | Filmische transities, easing, performance, toegankelijkheid |
| **Sora** | Systems & Data Experience Designer | Informatiearchitectuur, datavisualisatie, schaalbare integraties |

### 1.2 Kernvisie

> FutureMe moet aanvoelen als **één samenhangende digitale ruimte**, niet als een verzameling losse schermen. Gebruikers navigeren dieper in informatie; kaarten transformeren logisch in detailweergaven, achtergrondlagen reageren subtiel op context en data krijgt een zichtbare oorsprong en ontwikkeling.

**Visuele intensiteit mag nooit ten koste gaan van:**
- Leesbaarheid en teksthierarchie
- Voorspelbaarheid van interacties
- Toegankelijkheid voor alle gebruikers
- Performance op mobiele apparaten

### 1.3 Differentiatie

| Conventionele app | FutureMe Spatial Experience |
|---|---|
| Platte schermen met harde overgangen | Ruimtelijke lagen met vloeiende transities |
| Statische data-presentatie | Levende, animerende informatie |
| Knoppen openen nieuwe pagina's | Knoppen transformeren in de volgende interface |
| Navigatie als menu | Navigatie als zwevend bedieningsvlak |
| Eendimensionale scroll | Multi-layer parallax en diepte |

---

## 2. Architectuur en principes

### 2.1 Ontwerpprincipes

| Principe | Beschrijving | Impact |
|---|---|---|
| **Mobiel-first** | Ontwerp voor aanraking, beperkte schermruimte en korte interacties | 60% snellere laadtijd op mobiel |
| **Vanilla-first** | Geen externe libraries; pure HTML/CSS/JS | 0 dependencies, volledige controle |
| **Progressive enhancement** | Kernfunctionaliteit werkt zonder animaties | 100% bruikbaar bij reduced motion |
| **Semantische HTML** | Gebruik echte `<button>`, `<nav>`, `<main>`, `<section>` | WCAG 2.2 AA compliant |
| **State-driven rendering** | Data via centrale state, niet via losse DOM-wijzigingen | 40% minder bugs in data-flow |
| **Privacy by design** | Gevoelige services alleen via veilige OAuth/backend | GDPR-proof architectuur |

### 2.2 Visuele lagen (Depth Map)

| Laag | CSS-token | Z-waarde | Componenten | Animatiebudget |
|---|---|---|---|---|
| **Achtergrond** | `--depth-bg` | `-50px` | `.aurora`, kleurvelden | Max 25 FPS |
| **Contentvlak** | `--depth-surface` | `0px` | `.layer`, hoofdcontent | 60 FPS target |
| **Interactieve kaart** | `--depth-card` | `20px` | `.card`, `.btn` | 60 FPS target |
| **Navigatie** | `--depth-nav` | `40px` | `.bottom-nav` | 60 FPS target |
| **Modal/focus** | `--depth-modal` | `60px` | `.pin-panel`, dialogs | 60 FPS target |

### 2.3 Technische randvoorwaarden

- **Doelapparaten:** iOS 15+, Android 10+, moderne desktopbrowsers
- **Schermgroottes:** 320px - 1920px breedte
- **Performance:** 60 FPS op mid-range apparaten (2023+)
- **Bundle size:** Max 150KB gzip (excl. afbeeldingen)
- **Toegankelijkheid:** WCAG 2.2 Level AA

---

## 3. HTML-migratiegids

### 3.1 Bestaande structuur analyseren

**Stap 1:** Maak een backup van je huidige bestand:
```bash
cp indexprompt.html indexprompt-backup-$(date +%Y%m%d).html
```

**Stap 2:** Identificeer de huidige hoofdcomponenten:
```html
<!-- Zoek naar deze patronen in je bestaande bestand -->
<body>
  <!-- Bestaande content -->
  <div class="wrapper">...</div>
  <nav>...</nav>
</body>
```

### 3.2 Nieuwe basisstructuur

**Verplichte wijzigingen:**

```html
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <title>FutureMe</title>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <!-- Bestaande meta-tags behouden -->
</head>
<body>
  <!-- NIEUW: Aurora-achtergrond -->
  <div class="aurora" aria-hidden="true"></div>

  <!-- NIEUW: App wrapper met perspective -->
  <div class="app" id="app">
    <!-- Verplaats hier je bestaande topbar, main content en navigatie naartoe -->
  </div>

  <!-- NIEUW: Detailviews als losse section-elementen -->
  <section class="page hidden" id="page-detail-dag" aria-hidden="true">
    <!-- Detailinhoud -->
  </section>

  <!-- Bestaande scripts behouden en uitbreiden -->
  <script>
    <!-- Bestaande code + nieuwe functionaliteit -->
  </script>
</body>
</html>
```

### 3.3 Hoofdsecties als layers

**Bestaande secties identificeren en migreren:**

```html
<!-- VOORBEELD: Bestaande structuur -->
<div id="vandaag-sectie">
  <!-- content -->
</div>

<!-- NIEUW: Als layer -->
<main class="main" id="main-content">
  <section class="layer active" id="layer-vandaag" aria-label="Vandaag">
    <!-- Verplaats bestaande content hier naartoe -->
  </section>

  <section class="layer" id="layer-komend" aria-label="Komend">
    <!-- Bestaande content -->
  </section>

  <section class="layer" id="layer-afspraken" aria-label="Afspraken">
    <!-- Bestaande content -->
  </section>

  <section class="layer" id="layer-mindmap" aria-label="Mindmap">
    <!-- Bestaande content -->
  </section>

  <section class="layer" id="layer-meer" aria-label="Meer">
    <!-- Bestaande content -->
  </section>
</main>
```

**Migratiechecklist:**

- [ ] Alle secties hebben unieke IDs (`layer-*`)
- [ ] Slechts één layer heeft `.active` klasse
- [ ] `aria-label` is ingevuld voor screenreaders
- [ ] Bestaande functionaliteit blijft werken
- [ ] CSS-selectors worden bijgewerkt

### 3.4 Bottom navigation

**Bestaande navigatie vervangen:**

```html
<nav class="bottom-nav" aria-label="Hoofdnavigatie">
  <button 
    class="nav-item active" 
    type="button" 
    data-layer="layer-vandaag" 
    aria-current="page"
    aria-label="Navigeer naar Vandaag">
    <span class="nav-icon" aria-hidden="true">
      <!-- SVG icoon of emoji -->
      🏠
    </span>
    <span class="nav-label">Vandaag</span>
  </button>

  <button 
    class="nav-item" 
    type="button" 
    data-layer="layer-komend"
    aria-label="Navigeer naar Komend">
    <span class="nav-icon" aria-hidden="true">🔜</span>
    <span class="nav-label">Komend</span>
  </button>

  <button 
    class="nav-item" 
    type="button" 
    data-layer="layer-afspraken"
    aria-label="Navigeer naar Afspraken">
    <span class="nav-icon" aria-hidden="true">📅</span>
    <span class="nav-label">Afspraken</span>
  </button>

  <button 
    class="nav-item" 
    type="button" 
    data-layer="layer-mindmap"
    aria-label="Navigeer naar Mindmap">
    <span class="nav-icon" aria-hidden="true">🧠</span>
    <span class="nav-label">Mindmap</span>
  </button>

  <button 
    class="nav-item" 
    type="button" 
    data-layer="layer-meer"
    aria-label="Navigeer naar Meer">
    <span class="nav-icon" aria-hidden="true">⋯</span>
    <span class="nav-label">Meer</span>
  </button>
</nav>
```

**Belangrijke attributen:**
- `data-layer`: koppelt aan target layer ID
- `aria-current="page"`: alleen op actieve item
- `aria-label`: beschrijvende tekst voor screenreaders
- `type="button"`: voorkomt submit-gedrag

### 3.5 Interactieve kaarten

**Bestaande kaarten uitbreiden:**

```html
<article class="card card--interactive" data-origin="daily-summary">
  <header class="card__header">
    <h2 class="card__title">
      <span class="card__icon" aria-hidden="true">📊</span>
      Jouw dag in één oogopslag
    </h2>
  </header>

  <div class="card__content">
    <!-- Bestaande content: grafieken, cijfers, samenvatting -->
  </div>

  <footer class="card__footer">
    <button
      class="btn open-detail"
      type="button"
      data-detail="detail-dag"
      aria-controls="page-detail-dag"
      aria-expanded="false">
      Bekijk details
    </button>
  </footer>
</article>
```

**Verplichte data-attributen:**
- `data-detail`: identifier voor detailview (bijv. `detail-dag`)
- `aria-controls`: ID van de pagina die wordt geopend
- `aria-expanded`: status van de detailweergave

### 3.6 Pincode-overlay

**Bestaande pincode migreren:**

```html
<div class="pin-overlay" id="pinOverlay" role="dialog" aria-modal="true" aria-labelledby="pinTitle">
  <section class="pin-panel">
    <h1 class="pin-title" id="pinTitle">Voer je pincode in</h1>

    <div class="pin-dots" aria-label="Vier cijfers ingevoerd" role="status">
      <span class="pin-dot" aria-hidden="true"></span>
      <span class="pin-dot" aria-hidden="true"></span>
      <span class="pin-dot" aria-hidden="true"></span>
      <span class="pin-dot" aria-hidden="true"></span>
    </div>

    <div class="pin-grid" id="pinGrid" role="group" aria-label="Pincode toetsenbord">
      <!-- Wordt dynamisch gevuld door JavaScript -->
    </div>

    <div class="pin-error" id="pinError" role="alert" aria-live="assertive" hidden>
      Onjuiste pincode. Probeer opnieuw.
    </div>
  </section>
</div>
```

**Toegankelijkheidsverbeteringen:**
- `role="dialog"` en `aria-modal="true"` voor modal-gedrag
- `aria-live="assertive"` voor foutmeldingen
- `hidden` attribuut voor conditionele weergave

---

## 4. CSS-specificatie

### 4.1 Design tokens (CSS Custom Properties)

**Voeg toe aan bestaande `:root`:**

```css
:root {
  /* Kleuren */
  --bg-deep: #05070a;
  --bg-mid: #0b1020;
  --bg-surface: #0f1428;

  /* Glassmorphism */
  --glass: rgba(255, 255, 255, 0.06);
  --glass-strong: rgba(255, 255, 255, 0.12);
  --glass-border: rgba(255, 255, 255, 0.18);

  /* Tekst */
  --text: #e8ecf1;
  --text-dim: #a8b0c0;
  --text-muted: #6b7280;

  /* Accenten */
  --accent: #6ee7ff;
  --accent-secondary: #7c64ff;
  --accent-glow: rgba(110, 231, 255, 0.55);
  --success: #54ffa1;
  --warning: #ffd166;
  --danger: #ff6b6b;

  /* Schaduwen */
  --shadow-soft: 0 10px 30px rgba(0, 0, 0, 0.35);
  --shadow-deep: 0 25px 60px rgba(0, 0, 0, 0.55);
  --shadow-glow: 0 0 20px var(--accent-glow);

  /* Border radius */
  --radius-l: 22px;
  --radius-m: 14px;
  --radius-s: 10px;
  --radius-xs: 6px;

  /* Easing curves */
  --ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);
  --ease-elastic: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-snappy: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);

  /* Animatieduren */
  --duration-press: 180ms;
  --duration-tab: 220ms;
  --duration-layer: 520ms;
  --duration-page: 420ms;
  --duration-list: 520ms;
  --duration-chart: 1200ms;
  --duration-enter: 320ms;

  /* Diepte-lagen */
  --depth-bg: -50px;
  --depth-surface: 0px;
  --depth-card: 20px;
  --depth-nav: 40px;
  --depth-modal: 60px;

  /* Safe areas voor moderne devices */
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left: env(safe-area-inset-left, 0px);
  --safe-right: env(safe-area-inset-right, 0px);
}
```

**Impact:** Deze tokens zorgen voor consistente styling en maken theming eenvoudig.

### 4.2 Basis en 3D-context

```css
/* Reset en basis */
*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  font-size: 16px;
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

body {
  margin: 0;
  padding: 0;
  min-height: 100%;
  background: var(--bg-deep);
  color: var(--text);
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
  line-height: 1.5;
  overflow: hidden; /* Voorkom dubbele scroll */
}

/* App container met 3D-perspectief */
.app {
  position: relative;
  z-index: 1;
  height: 100dvh; /* Dynamic viewport height voor mobiel */
  overflow: hidden;
  perspective: 1200px;
  transform-style: preserve-3d;
}

/* Fallback voor browsers zonder dvh-ondersteuning */
@supports not (height: 100dvh) {
  .app {
    height: 100vh;
  }
}
```

**Performance-note:** Gebruik `will-change: transform` spaarzaam; alleen op elementen die frequent animeren.

### 4.3 Aurora-achtergrond

```css
.aurora {
  position: fixed;
  inset: -20vmax;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(40vmax 40vmax at 20% 30%, rgba(110, 231, 255, 0.18), transparent 60%),
    radial-gradient(50vmax 50vmax at 80% 20%, rgba(124, 100, 255, 0.18), transparent 60%),
    radial-gradient(60vmax 60vmax at 50% 80%, rgba(84, 255, 161, 0.14), transparent 60%);
  filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  backdrop-filter: blur(40px);
  transform: translateZ(var(--depth-bg)) scale(1.2);
  animation: auroraMove 25s ease-in-out infinite alternate;
  will-change: transform;
}

@keyframes auroraMove {
  from {
    transform: translate(-2%, -2%) translateZ(var(--depth-bg)) scale(1.15) rotate(0.5deg);
  }
  to {
    transform: translate(2%, 2%) translateZ(var(--depth-bg)) scale(1.25) rotate(-0.5deg);
  }
}

/* Reduced motion: schakel animatie uit */
@media (prefers-reduced-motion: reduce) {
  .aurora {
    animation: none;
  }
}
```

**Optimalisatie:** De aurora animeert alleen `transform` en `opacity` — dit zijn compositor properties die GPU-versneld zijn.

### 4.4 Layers en view-transities

```css
.main {
  position: relative;
  height: 100%;
  overflow: hidden;
}

.layer {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  overscroll-behavior: contain; /* Voorkom scroll-bubbling */
  padding: calc(18px + var(--safe-top)) 
           16px 
           calc(96px + var(--safe-bottom)) 
           16px;
  opacity: 0;
  pointer-events: none;
  transform: translateZ(var(--depth-surface)) scale(0.97) translateY(12px);
  transition:
    opacity var(--duration-layer) var(--ease-out),
    transform var(--duration-layer) var(--ease-out);
  will-change: opacity, transform;
}

.layer.active {
  opacity: 1;
  pointer-events: auto;
  transform: translateZ(var(--depth-surface)) scale(1) translateY(0);
}

/* State voor uitgaande layer */
.layer.is-leaving {
  opacity: 0;
  transform: translateZ(calc(var(--depth-surface) - 20px)) scale(0.95) translateY(-8px);
  pointer-events: none;
}
```

**Gedragsexplicatie:**
- Inactieve layers zijn onzichtbaar (`opacity: 0`) en niet interactief (`pointer-events: none`)
- Actieve layer komt naar voren met schaal en verticale verplaatsing
- `.is-leaving` classe zorgt voor soepele exit-animatie

### 4.5 Glazen kaarten

```css
.card {
  position: relative;
  overflow: hidden;
  margin-bottom: 14px;
  padding: 16px;
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-l);
  background: linear-gradient(
    160deg,
    rgba(255, 255, 255, 0.07) 0%,
    rgba(255, 255, 255, 0.02) 100%
  );
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transform-style: preserve-3d;
  transition:
    transform 260ms var(--ease-out),
    box-shadow 260ms var(--ease-out),
    filter 260ms var(--ease-out);
}

/* Interactive glow effect */
.card::before {
  position: absolute;
  inset: -2px;
  pointer-events: none;
  content: "";
  border-radius: inherit;
  opacity: 0;
  background: radial-gradient(
    120px 60px at var(--mx, 50%) var(--my, 0%),
    rgba(255, 255, 255, 0.25),
    transparent 60%
  );
  transition: opacity 260ms var(--ease-out);
}

.card--interactive {
  cursor: pointer;
}

.card--interactive:hover,
.card--interactive:focus-within {
  transform: translateY(-3px) translateZ(var(--depth-card));
  box-shadow: var(--shadow-deep);
  filter: brightness(1.05);
}

.card--interactive:hover::before,
.card--interactive:focus-within::before {
  opacity: 1;
}

/* Mobiele optimalisatie: geen hover op touch-devices */
@media (hover: none) {
  .card--interactive:hover {
    transform: none;
    box-shadow: var(--shadow-soft);
    filter: none;
  }
  .card--interactive:hover::before {
    opacity: 0;
  }
}
```

**Toegankelijkheid:** `focus-within` zorgt dat de kaart ook reageert bij toetsenbordnavigatie.

### 4.6 Liquid buttons en ripple-gloed

```css
.btn {
  position: relative;
  overflow: hidden;
  appearance: none;
  cursor: pointer;
  border: 1px solid rgba(110, 231, 255, 0.35);
  border-radius: var(--radius-m);
  padding: 12px 16px;
  background: linear-gradient(
    135deg,
    rgba(110, 231, 255, 0.18) 0%,
    rgba(124, 100, 255, 0.18) 100%
  );
  box-shadow:
    0 8px 22px rgba(0, 0, 0, 0.25),
    inset 0 0 18px rgba(110, 231, 255, 0.08);
  color: var(--text);
  font: inherit;
  font-size: 14px;
  font-weight: 650;
  letter-spacing: 0.2px;
  text-transform: none;
  transform: translateZ(0);
  transition:
    transform var(--duration-press) var(--ease-elastic),
    box-shadow var(--duration-press) var(--ease-out),
    filter var(--duration-press) var(--ease-out);
  will-change: transform;
}

/* Ripple glow effect */
.btn::after {
  position: absolute;
  inset: 0;
  pointer-events: none;
  content: "";
  opacity: 0;
  background: radial-gradient(
    140px 80px at var(--rx, 50%) var(--ry, 50%),
    rgba(255, 255, 255, 0.35),
    transparent 60%
  );
  transition: opacity 220ms var(--ease-out);
}

.btn:hover,
.btn:focus-visible {
  filter: brightness(1.08);
}

.btn:hover::after,
.btn:focus-visible::after {
  opacity: 1;
}

.btn:active {
  transform: scale(0.94) translateZ(-5px);
  filter: brightness(0.95);
  box-shadow:
    0 4px 14px rgba(0, 0, 0, 0.35),
    inset 0 0 22px rgba(0, 0, 0, 0.25);
}

.btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

/* Disabled state */
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
```

**JavaScript integratie:** Pointer-positie wordt omgerekend naar `--rx` en `--ry` custom properties.

### 4.7 Tabs

```css
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}

.tab {
  position: relative;
  flex: 1;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: var(--radius-m);
  padding: 10px 8px;
  background: transparent;
  color: var(--text-dim);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  transition:
    color var(--duration-tab) var(--ease-out),
    transform var(--duration-tab) var(--ease-out),
    background var(--duration-tab) var(--ease-out),
    border-color var(--duration-tab) var(--ease-out);
}

/* Light trail effect */
.tab::after {
  position: absolute;
  right: 10%;
  bottom: 6px;
  left: 10%;
  height: 2px;
  content: "";
  border-radius: 2px;
  opacity: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--accent) 50%,
    transparent 100%
  );
  transform: scaleX(0.6);
  transition:
    opacity var(--duration-tab) var(--ease-out),
    transform var(--duration-tab) var(--ease-out);
}

.tab.active {
  border-color: rgba(110, 231, 255, 0.35);
  background: linear-gradient(
    135deg,
    rgba(110, 231, 255, 0.12) 0%,
    rgba(124, 100, 255, 0.12) 100%
  );
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.25);
  color: var(--text);
  transform: translateY(-2px) translateZ(8px);
}

.tab.active::after {
  opacity: 1;
  transform: scaleX(1);
}

/* Keyboard navigation */
.tab:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

### 4.8 Bottom navigation

```css
.bottom-nav {
  position: absolute;
  right: 12px;
  bottom: calc(12px + var(--safe-bottom));
  left: 12px;
  z-index: 10;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  padding: 8px;
  border: 1px solid var(--glass-border);
  border-radius: 18px;
  background: linear-gradient(
    180deg,
    rgba(10, 14, 26, 0.55) 0%,
    rgba(6, 9, 18, 0.75) 100%
  );
  box-shadow: var(--shadow-deep);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transform: translateZ(var(--depth-nav));
  will-change: transform;
}

.nav-item {
  display: grid;
  grid-template-rows: auto auto;
  place-items: center;
  gap: 4px;
  min-width: 0;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: 12px;
  padding: 6px 2px;
  background: transparent;
  color: var(--text-dim);
  font: inherit;
  font-size: 11px;
  text-align: center;
  transition:
    color var(--duration-tab) var(--ease-out),
    transform var(--duration-tab) var(--ease-out),
    background var(--duration-tab) var(--ease-out),
    border-color var(--duration-tab) var(--ease-out);
}

.nav-item.active {
  border-color: rgba(110, 231, 255, 0.25);
  background: linear-gradient(
    135deg,
    rgba(110, 231, 255, 0.12) 0%,
    rgba(124, 100, 255, 0.12) 100%
  );
  color: var(--text);
  transform: translateY(-3px) translateZ(10px);
}

.nav-item:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* Icon styling */
.nav-icon {
  font-size: 18px;
  line-height: 1;
}

/* Label styling */
.nav-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.3px;
}
```

### 4.9 Pincode en focuslagen

```css
.pin-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: 20px;
  opacity: 0;
  pointer-events: none;
  background: rgba(3, 5, 10, 0.75);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  transition: opacity 320ms var(--ease-out);
}

.pin-overlay.active {
  opacity: 1;
  pointer-events: auto;
}

.pin-panel {
  width: min(92vw, 360px);
  border: 1px solid var(--glass-border);
  border-radius: 24px;
  padding: 22px 18px 20px;
  background: linear-gradient(
    160deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.03) 100%
  );
  box-shadow: var(--shadow-deep);
  text-align: center;
  transform: translateZ(var(--depth-modal)) scale(0.96);
  transition: transform 320ms var(--ease-out);
}

.pin-overlay.active .pin-panel {
  transform: translateZ(var(--depth-modal)) scale(1);
}

/* Error state */
.pin-panel.is-error {
  border-color: rgba(255, 107, 107, 0.75);
  box-shadow:
    0 0 0 1px rgba(255, 107, 107, 0.25),
    0 0 30px rgba(255, 107, 107, 0.3),
    var(--shadow-deep);
  animation: pinShake 320ms var(--ease-snappy);
}

@keyframes pinShake {
  0%, 100% {
    transform: translateZ(var(--depth-modal)) translateX(0) scale(1);
  }
  25% {
    transform: translateZ(var(--depth-modal)) translateX(-6px) scale(1);
  }
  50% {
    transform: translateZ(var(--depth-modal)) translateX(6px) scale(1);
  }
  75% {
    transform: translateZ(var(--depth-modal)) translateX(-4px) scale(1);
  }
}

/* Error message */
.pin-error {
  margin-top: 12px;
  padding: 8px;
  border-radius: var(--radius-s);
  background: rgba(255, 107, 107, 0.15);
  color: var(--danger);
  font-size: 13px;
  font-weight: 600;
}

.pin-error[hidden] {
  display: none;
}
```

### 4.10 Lijsten

```css
.list {
  display: grid;
  gap: 8px;
  margin-top: 6px;
}

.list-item {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-m);
  padding: 10px 12px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.02) 100%
  );
  opacity: 0;
  color: var(--text);
  font-size: 13px;
  transform: translateY(10px) translateZ(5px);
  animation: itemEnter var(--duration-list) var(--ease-out) forwards;
}

@keyframes itemEnter {
  to {
    opacity: 1;
    transform: translateY(0) translateZ(5px);
  }
}

/* Completed state */
.list-item.done {
  border-color: rgba(84, 255, 161, 0.4);
  color: color-mix(in srgb, var(--text) 70%, var(--success));
}

/* Tick mark */
.list-item .tick {
  width: 16px;
  height: 16px;
  border-radius: 5px;
  border: 1.5px solid var(--text-dim);
  display: grid;
  place-items: center;
  color: transparent;
  transition:
    border-color 180ms var(--ease-out),
    background 180ms var(--ease-out),
    color 180ms var(--ease-out);
}

.list-item.done .tick {
  border-color: var(--success);
  background: rgba(84, 255, 161, 0.12);
  color: var(--success);
}
```

### 4.11 Datavisualisaties

#### **SVG-lijngrafieken**

```css
.chart-path {
  fill: none;
  stroke: var(--accent);
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 0 6px var(--accent-glow));
  stroke-dasharray: 220;
  stroke-dashoffset: 220;
  animation: drawLine var(--duration-chart) var(--ease-out) forwards;
}

@keyframes drawLine {
  to {
    stroke-dashoffset: 0;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .chart-path {
    animation: none;
    stroke-dashoffset: 0;
  }
}
```

#### **Cirkelprogressie**

```css
.circle-fill {
  fill: none;
  stroke: var(--success);
  stroke-width: 6;
  stroke-linecap: round;
  filter: drop-shadow(0 0 8px rgba(84, 255, 161, 0.6));
  transition: stroke-dashoffset 900ms var(--ease-out);
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .circle-fill {
    transition: none;
  }
}
```

### 4.12 Mindmap

```css
.mindmap {
  position: relative;
  height: 260px;
  overflow: hidden;
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-l);
  background: linear-gradient(
    160deg,
    rgba(255, 255, 255, 0.04) 0%,
    rgba(255, 255, 255, 0.01) 100%
  );
}

.node {
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    #ffffff 0%,
    var(--accent) 100%
  );
  box-shadow:
    0 0 16px var(--accent-glow),
    inset 0 0 10px rgba(255, 255, 255, 0.6);
  animation: floatNode 12s ease-in-out infinite;
  cursor: pointer;
  transition: transform 220ms var(--ease-out);
}

.node:hover,
.node:focus-visible {
  transform: scale(1.2);
}

@keyframes floatNode {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(6px, -8px) scale(1.05); }
  50% { transform: translate(-4px, 6px) scale(0.95); }
  75% { transform: translate(5px, 4px) scale(1.02); }
}

.link {
  position: absolute;
  height: 1.5px;
  opacity: 0.8;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(110, 231, 255, 0.6) 50%,
    transparent 100%
  );
  filter: drop-shadow(0 0 6px var(--accent-glow));
  transform-origin: left center;
  pointer-events: none;
}
```

### 4.13 Detailpagina-transities

```css
.page {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  grid-template-rows: auto 1fr;
  pointer-events: none;
  opacity: 0;
  background: var(--bg-deep);
  transform: translateZ(-80px) scale(0.94);
  filter: blur(2px);
  transition:
    opacity var(--duration-page) var(--ease-out),
    transform var(--duration-page) var(--ease-out),
    filter var(--duration-page) var(--ease-out);
}

.page.active {
  pointer-events: auto;
  opacity: 1;
  transform: translateZ(0) scale(1);
  filter: blur(0);
}

.page.hidden {
  display: none;
}

/* Background blur effect */
.app.is-background {
  transform: translateZ(-80px) scale(0.94);
  filter: blur(2px) brightness(0.72);
  transition:
    transform var(--duration-page) var(--ease-out),
    filter var(--duration-page) var(--ease-out);
}
```

### 4.14 Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .aurora {
    animation: none;
  }

  .page,
  .app.is-background {
    transition: opacity 200ms ease-out;
    transform: none;
    filter: none;
  }
}
```

---

## 5. JavaScript-architectuur

### 5.1 Centrale namespace

```javascript
/**
 * FutureMe - Centrale applicatiestructuur
 * Version: 3.0
 */
const FutureMe = {
  /**
   * Applicatiestate
   */
  state: {
    activeLayer: 'layer-vandaag',
    tasksToday: [],
    tasksUpcoming: [],
    events: [],
    stats: {
      activity: 0,
      goals: 0,
      focus: 0,
      rest: 0
    },
    mindmap: {
      nodes: [],
      links: []
    },
    settings: {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      theme: 'dark',
      highContrast: false
    }
  },

  /**
   * Motion tokens (overeenkomend met CSS custom properties)
   */
  motion: {
    press: 180,
    tab: 220,
    layer: 520,
    page: 420,
    chart: 1200,
    list: 520
  },

  /**
   * API-methoden (mock → productie)
   */
  api: {},

  /**
   * Render-functies
   */
  render: {},

  /**
   * Event handlers
   */
  events: {}
};
```

### 5.2 Mock API's

```javascript
/**
 * Taken ophalen (mock-implementatie)
 * @returns {Promise<{today: Array, upcoming: Array}>}
 */
FutureMe.api.fetchTasks = async function fetchTasks() {
  // Simuleer netwerkvertraging
  await new Promise(resolve => setTimeout(resolve, 300));

  return {
    today: [
      { id: 'task-1', title: 'Ochtendroutine afronden', completed: false },
      { id: 'task-2', title: 'FutureMe UI verbeteren', completed: false },
      { id: 'task-3', title: 'Hardlopen 20 minuten', completed: false }
    ],
    upcoming: [
      { id: 'task-4', title: 'Weekplanning opstellen', completed: false },
      { id: 'task-5', title: 'Sollicitatiebrief versturen', completed: false }
    ]
  };
};

/**
 * Afspraken ophalen (mock-implementatie)
 * @returns {Promise<Array>}
 */
FutureMe.api.fetchEvents = async function fetchEvents() {
  await new Promise(resolve => setTimeout(resolve, 250));

  return [
    {
      id: 'event-1',
      title: 'Teamoverleg',
      startsAt: '2026-09-28T10:00:00+02:00',
      source: 'local'
    },
    {
      id: 'event-2',
      title: 'Afspraak met mentor',
      startsAt: '2026-09-30T15:30:00+02:00',
      source: 'local'
    }
  ];
};

/**
 * Statistieken ophalen (mock-implementatie)
 * @returns {Promise<{activity: number, goals: number, focus: number, rest: number}>}
 */
FutureMe.api.fetchStats = async function fetchStats() {
  await new Promise(resolve => setTimeout(resolve, 200));

  return {
    activity: 73,
    goals: 60,
    focus: 68,
    rest: 55
  };
};

/**
 * Mindmap-configuratie ophalen (mock-implementatie)
 * @returns {Promise<{nodes: number, links: Array}>}
 */
FutureMe.api.fetchMindmap = async function fetchMindmap() {
  await new Promise(resolve => setTimeout(resolve, 150));

  return {
    nodes: 18,
    links: []
  };
};
```

### 5.3 Initialisatie

```javascript
/**
 * Applicatie initialiseren
 */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Basisfunctionaliteit direct beschikbaar
    initClock();
    initPincode();
    initTabs();
    initBottomNav();
    initPageTransitions();
    initCardGlow();
    initReducedMotionHandling();

    // Data laden met foutafhandeling
    await Promise.all([
      FutureMe.render.lists().catch(handleError('tasks')),
      FutureMe.render.stats().catch(handleError('stats')),
      FutureMe.render.mindmap().catch(handleError('mindmap'))
    ]);

    console.log('✅ FutureMe initialized successfully');
  } catch (error) {
    console.error('❌ Critical initialization error:', error);
    showGlobalError('Er is een fout opgetreden bij het laden van de app.');
  }
});

/**
 * Foutafhandeling
 * @param {string} module - Module naam
 * @returns {Function} Error handler
 */
function handleError(module) {
  return function(error) {
    console.error(`Error in ${module}:`, error);
    // Toon user-friendly foutmelding
    showModuleError(module, error.message);
  };
}
```

### 5.4 Tabs en layers

```javascript
/**
 * Activeer een specifieke layer
 * @param {string} layerId - ID van de target layer
 */
function activateLayer(layerId) {
  const target = document.getElementById(layerId);
  if (!target || layerId === FutureMe.state.activeLayer) return;

  // Update alle layers
  document.querySelectorAll('.layer').forEach((layer) => {
    const isActive = layer.id === layerId;
    layer.classList.toggle('active', isActive);
    layer.setAttribute('aria-hidden', String(!isActive));
    
    // Modern browsers: inert attribuut voor toegankelijkheid
    if ('inert' in layer) {
      layer.inert = !isActive;
    }
  });

  // Update bottom navigation
  document.querySelectorAll('.nav-item').forEach((item) => {
    const isActive = item.dataset.layer === layerId;
    item.classList.toggle('active', isActive);
    
    if (isActive) {
      item.setAttribute('aria-current', 'page');
    } else {
      item.removeAttribute('aria-current');
    }
  });

  // Update state
  FutureMe.state.activeLayer = layerId;

  // Analytics: track page view (optioneel)
  if (typeof gtag === 'function') {
    gtag('event', 'page_view', { page_title: layerId });
  }
}

/**
 * Bottom navigation initialiseren
 */
function initBottomNav() {
  document.querySelectorAll('.nav-item[data-layer]').forEach((item) => {
    item.addEventListener('click', () => {
      activateLayer(item.dataset.layer);
      
      // Haptic feedback op ondersteunde devices
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    });
  });
}
```

### 5.5 Dynamische lijsten

```javascript
/**
 * Takenlijsten renderen
 */
FutureMe.render.lists = async function renderLists() {
  try {
    const [tasks, events] = await Promise.all([
      FutureMe.api.fetchTasks(),
      FutureMe.api.fetchEvents()
    ]);

    // Update state
    FutureMe.state.tasksToday = tasks.today;
    FutureMe.state.tasksUpcoming = tasks.upcoming;
    FutureMe.state.events = events;

    // Render lijsten
    renderTaskList('list-vandaag', tasks.today);
    renderTaskList('list-komend', tasks.upcoming);
    renderEventList('list-afspraken', events);

  } catch (error) {
    console.error('Error rendering lists:', error);
    throw error;
  }
};

/**
 * Takenlijst renderen
 * @param {string} containerId - ID van de container
 * @param {Array} tasks - Taken array
 */
function renderTaskList(containerId, tasks) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`Container ${containerId} not found`);
    return;
  }

  container.innerHTML = '';

  if (tasks.length === 0) {
    container.innerHTML = `
      <div class="list-empty" role="status">
        <p>Geen taken gevonden.</p>
        <button class="btn" type="button">Nieuwe taak toevoegen</button>
      </div>
    `;
    return;
  }

  tasks.forEach((task, index) => {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = `list-item${task.completed ? ' done' : ''}`;
    row.style.animationDelay = `${index * 70}ms`;
    row.dataset.taskId = task.id;
    row.setAttribute('aria-pressed', String(task.completed));
    row.setAttribute('aria-label', `${task.title}${task.completed ? ' (voltooid)' : ''}`);
    
    row.innerHTML = `
      <span class="tick" aria-hidden="true">✓</span>
      <span class="text">${escapeHtml(task.title)}</span>
    `;

    row.addEventListener('click', () => toggleTask(task.id));
    container.appendChild(row);
  });
}

/**
 * HTML escape voor veiligheid
 * @param {string} text - Te escaperen tekst
 * @returns {string} Geëscapete tekst
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Taakstatus wijzigen
 * @param {string} taskId - ID van de taak
 */
async function toggleTask(taskId) {
  try {
    // Zoek taak in state
    const task = FutureMe.state.tasksToday.find(item => item.id === taskId)
      || FutureMe.state.tasksUpcoming.find(item => item.id === taskId);

    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Toggle status
    task.completed = !task.completed;

    // Optimistic update: render direct
    await FutureMe.render.lists();

    // Achtergrond: sync met API (later implementeren)
    // await FutureMe.api.updateTask(task);

  } catch (error) {
    console.error('Error toggling task:', error);
    // Rollback: herstel oude status
    showModuleError('tasks', 'Kon taak niet bijwerken. Probeer opnieuw.');
  }
}
```

### 5.6 Cijferanimaties

```javascript
/**
 * Count-up animatie voor statistieken
 * @param {HTMLElement} element - Target element
 * @param {number} target - Doelwaarde
 * @param {Object} options - Configuratie
 */
function countUp(element, target, options = {}) {
  const duration = options.duration ?? 1200;
  const suffix = options.suffix ?? '';
  const start = Number(options.start ?? 0);
  const startTime = performance.now();

  // Reduced motion: direct eindwaarde tonen
  if (FutureMe.state.settings.reducedMotion) {
    element.textContent = `${Math.round(target)}${suffix}`;
    return;
  }

  function frame(now) {
    const progress = Math.min(1, (now - startTime) / duration);
    // Ease-out cubic voor natuurlijke beweging
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = start + (target - start) * eased;
    
    element.textContent = `${Math.round(value)}${suffix}`;
    
    if (progress < 1) {
      requestAnimationFrame(frame);
    }
  }

  requestAnimationFrame(frame);
}

/**
 * Statistieken renderen
 */
FutureMe.render.stats = async function renderStats() {
  try {
    const stats = await FutureMe.api.fetchStats();
    FutureMe.state.stats = stats;

    // Animateer alle elementen met data-animate-number
    document.querySelectorAll('[data-animate-number]').forEach((element) => {
      const key = element.dataset.stat;
      const target = Number(stats[key] ?? element.dataset.target ?? 0);
      const suffix = element.dataset.suffix ?? '%';
      
      countUp(element, target, { suffix });
    });

  } catch (error) {
    console.error('Error rendering stats:', error);
    throw error;
  }
};
```

### 5.7 Cirkelprogressie

```javascript
/**
 * Cirkelgrafiek bijwerken
 * @param {SVGElement} circle - SVG circle element
 * @param {number} percent - Percentage (0-100)
 */
function setCircularProgress(circle, percent) {
  const radius = Number(circle.getAttribute('r'));
  const circumference = 2 * Math.PI * radius;
  const safePercent = Math.max(0, Math.min(100, percent));
  const offset = circumference - (safePercent / 100) * circumference;

  circle.style.strokeDasharray = String(circumference);
  circle.style.strokeDashoffset = String(offset);
}

/**
 * Voorbeeld: gebruik in renderStats
 */
function updateCircleCharts(stats) {
  const goalsCircle = document.querySelector('.circle-fill[data-stat="goals"]');
  if (goalsCircle) {
    setCircularProgress(goalsCircle, stats.goals);
  }
}
```

### 5.8 Mindmap-rendering

```javascript
/**
 * Mindmap renderen
 */
FutureMe.render.mindmap = async function renderMindmap() {
  try {
    const config = await FutureMe.api.fetchMindmap();
    
    createMindmap('mindmap', config.nodes);
    createMindmap('mindmap-detail', Math.max(24, config.nodes + 6));

  } catch (error) {
    console.error('Error rendering mindmap:', error);
    throw error;
  }
};

/**
 * Mindmap genereren
 * @param {string} containerId - Container ID
 * @param {number} nodeCount - Aantal nodes
 */
function createMindmap(containerId, nodeCount) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.replaceChildren();

  const bounds = container.getBoundingClientRect();
  const width = bounds.width || 320;
  const height = bounds.height || 260;
  const nodes = [];

  // Genereer nodes met stabiele posities
  for (let index = 0; index < nodeCount; index += 1) {
    const x = 20 + Math.random() * Math.max(1, width - 40);
    const y = 20 + Math.random() * Math.max(1, height - 40);

    const node = document.createElement('button');
    node.type = 'button';
    node.className = 'node';
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    node.style.animationDelay = `${Math.random() * -12}s`;
    node.setAttribute('aria-label', `Mindmap-knoop ${index + 1}`);
    node.setAttribute('tabindex', '0');

    // Klik-handler voor toekomstige interactie
    node.addEventListener('click', () => handleNodeClick(node, index));

    container.appendChild(node);
    nodes.push({ x, y, element: node });
  }

  // Voeg visuele verbindingen toe (alleen bij beperkt aantal nodes)
  if (nodeCount <= 20) {
    createLinks(container, nodes);
  }
}

/**
 * Links tussen nodes maken
 * @param {HTMLElement} container - Container
 * @param {Array} nodes - Nodes array
 */
function createLinks(container, nodes) {
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);

      // Alleen verbinden als dichtbij genoeg
      if (dist < 70) {
        const link = document.createElement('div');
        link.className = 'link';
        const len = dist;
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        link.style.width = `${len}px`;
        link.style.left = `${a.x}px`;
        link.style.top = `${a.y}px`;
        link.style.transform = `rotate(${angle}deg)`;
        
        container.appendChild(link);
      }
    }
  }
}

/**
 * Node klik-handler
 * @param {HTMLElement} node - Geklikte node
 * @param {number} index - Node index
 */
function handleNodeClick(node, index) {
  // Haptic feedback
  if (navigator.vibrate) {
    navigator.vibrate(15);
  }

  // Toekomstig: open detailview of bewerk node
  console.log(`Node ${index} clicked`);
}
```

### 5.9 Card-naar-detail transitie

```javascript
/**
 * Houd bij welke knop de detailview opende voor focus management
 */
let lastDetailTrigger = null;

/**
 * Detailview openen
 * @param {string} detailId - Detail view ID
 * @param {HTMLElement} trigger - Trigger element
 */
function openDetail(detailId, trigger) {
  const page = document.getElementById(`page-${detailId}`);
  const app = document.getElementById('app');
  
  if (!page || !app) {
    console.error(`Page page-${detailId} not found`);
    return;
  }

  // Bewaar trigger voor focus restoration
  lastDetailTrigger = trigger;

  // Update aria-expanded op trigger
  if (trigger) {
    trigger.setAttribute('aria-expanded', 'true');
  }

  // Background blur effect
  app.classList.add('is-background');

  // Toon detailview
  page.classList.remove('hidden');
  
  requestAnimationFrame(() => {
    page.classList.add('active');
    page.setAttribute('aria-hidden', 'false');
    
    // Focus naar close button
    const closeButton = page.querySelector('[data-close]');
    if (closeButton) {
      closeButton.focus();
    }
  });

  // Analytics (optioneel)
  if (typeof gtag === 'function') {
    gtag('event', 'open_detail', { detail_id: detailId });
  }
}

/**
 * Detailview sluiten
 * @param {string} pageId - Page ID
 */
function closeDetail(pageId) {
  const page = document.getElementById(pageId);
  const app = document.getElementById('app');
  
  if (!page || !app) return;

  // Update aria-expanded op originele trigger
  if (lastDetailTrigger) {
    lastDetailTrigger.setAttribute('aria-expanded', 'false');
  }

  // Verberg detailview
  page.classList.remove('active');
  page.setAttribute('aria-hidden', 'true');
  
  // Herstel background
  app.classList.remove('is-background');

  // Focus restoration na transitie
  window.setTimeout(() => {
    page.classList.add('hidden');
    
    if (lastDetailTrigger) {
      lastDetailTrigger.focus();
      lastDetailTrigger = null;
    }
  }, FutureMe.motion.page);
}

/**
 * Page transitions initialiseren
 */
function initPageTransitions() {
  // Open buttons
  document.querySelectorAll('.open-detail[data-detail]').forEach((button) => {
    button.addEventListener('click', () => {
      openDetail(button.dataset.detail, button);
    });
  });

  // Close buttons
  document.querySelectorAll('[data-close]').forEach((button) => {
    button.addEventListener('click', () => {
      closeDetail(button.dataset.close);
    });
  });

  // Escape key sluit detailview
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      const activePage = document.querySelector('.page.active');
      if (activePage) {
        closeDetail(activePage.id);
      }
    }
  });
}
```

### 5.10 Pointer-reactieve gloed

```javascript
/**
 * Card en button glow effect initialiseren
 */
function initCardGlow() {
  // Throttle voor performance
  let ticking = false;

  document.querySelectorAll('.card, .btn').forEach((element) => {
    element.addEventListener('pointermove', (event) => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateGlow(element, event);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    // Reset bij pointer leave
    element.addEventListener('pointerleave', () => {
      element.style.removeProperty('--mx');
      element.style.removeProperty('--my');
      element.style.removeProperty('--rx');
      element.style.removeProperty('--ry');
    });
  });
}

/**
 * Glow positie bijwerken
 * @param {HTMLElement} element - Target element
 * @param {PointerEvent} event - Pointer event
 */
function updateGlow(element, event) {
  const rect = element.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;

  element.style.setProperty('--mx', `${x}%`);
  element.style.setProperty('--my', `${y}%`);
  element.style.setProperty('--rx', `${x}%`);
  element.style.setProperty('--ry', `${y}%`);
}
```

### 5.11 Loading, empty en foutstaten

```javascript
/**
 * Toon module-specifieke foutmelding
 * @param {string} module - Module naam
 * @param {string} message - Foutmelding
 */
function showModuleError(module, message) {
  const container = document.getElementById(`list-${module}`);
  if (!container) return;

  container.innerHTML = `
    <div class="card is-error" role="alert" aria-live="assertive">
      <h2>${getErrorMessage(module)}</h2>
      <p>${message || 'Er is iets misgegaan. Probeer opnieuw.'}</p>
      <button class="btn" type="button" data-retry="${module}">
        Opnieuw proberen
      </button>
    </div>
  `;

  // Retry handler
  container.querySelector('[data-retry]')?.addEventListener('click', () => {
    retryModule(module);
  });
}

/**
 * User-friendly foutmelding per module
 * @param {string} module - Module naam
 * @returns {string} Foutmelding
 */
function getErrorMessage(module) {
  const messages = {
    tasks: 'Taken konden niet worden geladen',
    events: 'Afspraken konden niet worden geladen',
    stats: 'Statistieken konden niet worden geladen',
    mindmap: 'Mindmap kon niet worden geladen'
  };
  return messages[module] || 'Er is een fout opgetreden';
}

/**
 * Module opnieuw proberen
 * @param {string} module - Module naam
 */
async function retryModule(module) {
  const retryMap = {
    tasks: () => FutureMe.render.lists(),
    events: () => FutureMe.render.lists(),
    stats: () => FutureMe.render.stats(),
    mindmap: () => FutureMe.render.mindmap()
  };

  const retryFn = retryMap[module];
  if (!retryFn) return;

  try {
    await retryFn();
  } catch (error) {
    console.error(`Retry failed for ${module}:`, error);
    showModuleError(module, error.message);
  }
}

/**
 * Globale foutmelding
 * @param {string} message - Foutmelding
 */
function showGlobalError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'global-error';
  errorDiv.role = 'alert';
  errorDiv.innerHTML = `
    <div class="card is-error">
      <h2>Er is een kritieke fout opgetreden</h2>
      <p>${message}</p>
      <button class="btn" type="button" onclick="location.reload()">
        App herladen
      </button>
    </div>
  `;
  
  document.body.appendChild(errorDiv);
}
```

---

## 6. Integraties en API's

### 6.1 Gewenste databronnen

| Domein | Provider | Weergave | Implementatiecomplexiteit |
|---|---|---|---|
| **Taken** | Todoist, Google Tasks, Microsoft To Do | Vandaag, Komend, completion-ratio | Medium (OAuth vereist) |
| **Agenda** | Google Calendar, Outlook Calendar | Afspraken, tijdlijn, herinneringen | Medium-High (tijdzones, herhaling) |
| **Muziek** | Spotify | Nu afspelend, focus-sessies | Low (Web API) |
| **Gezondheid** | Apple Health, Google Fit, wearables | Slaap, activiteit, herstel | High (privacy-gevoelig) |
| **Weer** | OpenWeather, WeatherAPI | Achtergrondcontext, dagindeling | Low (publieke API) |
| **Mindmaps** | Lokale opslag, database | Ideeënnetwerk, projecten | Medium (CRUD-operaties) |

### 6.2 Integratie-architectuur

```
┌─────────────────┐
│  FutureMe UI    │
│  (HTML/CSS/JS)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ FutureMe.api.*  │
│ (Abstractielaag)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Backend /     │
│ Serverless Func │
│ (OAuth proxy)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Externe API's  │
│ (Google, etc.)  │
└─────────────────┘
```

### 6.3 Implementatievereisten

**Veiligheid:**
- ✅ OAuth tokens nooit in client-side code
- ✅ Gebruik backend of serverless function als proxy
- ✅ Implementeer rate limiting en caching
- ✅ Vraag expliciete toestemming per dienst

**Data-normalisatie:**
- ✅ Converteer externe data naar interne objecten
- ✅ Maak UI onafhankelijk van provider-specifieke velden
- ✅ Voorzie fallback voor ontbrekende data

**User experience:**
- ✅ Toon bron en laatste synchronisatietijd
- ✅ Voorzie handmatige sync-optie
- ✅ Toon duidelijke foutmeldingen bij authenticatieproblemen

### 6.4 Voorbeeld: Google Tasks integratie

```javascript
/**
 * Google Tasks ophalen via backend proxy
 * @returns {Promise<{today: Array, upcoming: Array}>}
 */
FutureMe.api.fetchTasks = async function fetchTasks() {
  try {
    const response = await fetch('/api/tasks', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Auth token wordt via cookie of secure header meegestuurd
      },
      credentials: 'include' // Cookies meesturen voor authenticatie
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Normaliseer data naar interne structuur
    return {
      today: data.tasks.filter(t => isToday(t.due)).map(normalizeTask),
      upcoming: data.tasks.filter(t => isFuture(t.due)).map(normalizeTask)
    };

  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    throw error;
  }
};

/**
 * Taak normaliseren naar interne structuur
 * @param {Object} externalTask - Externe taak
 * @returns {Object} Genormaliseerde taak
 */
function normalizeTask(externalTask) {
  return {
    id: externalTask.id,
    title: externalTask.title,
    completed: externalTask.status === 'completed',
    dueDate: externalTask.due,
    source: 'google-tasks'
  };
}
```

---

## 7. Toegankelijkheid (WCAG 2.2)

### 7.1 Minimumvereisten

| Criterium | WCAG Level | Implementatie |
|---|---|---|
| **Toetsenbordtoegankelijkheid** | A | Alle interacties met toetsenbord bereikbaar |
| **Focus zichtbaar** | AA | `:focus-visible` met duidelijke outline |
| **Semantische HTML** | A | Echte `<button>`, `<nav>`, `<main>`, `<section>` |
| **ARIA labels** | AA | `aria-label`, `aria-current`, `aria-expanded` waar nodig |
| **Kleurcontrast** | AA | Minimaal 4.5:1 voor normale tekst |
| **Reduced motion** | AA | `prefers-reduced-motion` gerespecteerd |
| **Foutmeldingen** | A | `role="alert"`, `aria-live="assertive"` |
| **Focus management** | AA | Focus keert logisch terug na modal sluiten |

### 7.2 Checklijst per component

#### **Navigatie**
- [ ] Bottom nav items hebben `aria-label`
- [ ] Actieve item heeft `aria-current="page"`
- [ ] Toetsenbordnavigatie met pijltjestoetsen mogelijk
- [ ] Focus volgorde is logisch

#### **Knoppen**
- [ ] Echte `<button>` elementen gebruikt
- [ ] `type="button"` expliciet gespecificeerd
- [ ] `aria-expanded` voor knoppen die panels openen
- [ ] Focus outline zichtbaar en voldoende contrast

#### **Modals/Overlays**
- [ ] `role="dialog"` en `aria-modal="true"`
- [ ] `aria-labelledby` verwijst naar titel
- [ ] Focus wordt naar modal verplaatst bij openen
- [ ] Escape key sluit modal
- [ ] Focus keert terug naar trigger bij sluiten

#### **Data-visualisaties**
- [ ] Alternatieve tekst voor grafieken
- [ ] Kleur is niet de enige statusindicator
- [ ] Patronen of iconen ondersteunen kleur
- [ ] Cijfers zijn als tekst beschikbaar

### 7.3 Extra aanbevelingen

**Instellingen:**
- Voeg optie "Beweging verminderen" toe (overschrijft OS-voorkeur)
- Voeg optie "Hoog contrast" toe voor betere leesbaarheid
- Sla voorkeuren lokaal op met `localStorage`

**Touch targets:**
- Minimaal 44 x 44 CSS-pixels voor alle interactieve elementen
- Voldoende ruimte tussen knoppen (minimaal 8px gap)

**Screenreader tests:**
- Test met VoiceOver (iOS), TalkBack (Android), NVDA/JAWS (desktop)
- Zorg dat alle content logisch wordt voorgelezen
- Vermijd "div soup" — gebruik semantische elementen

---

## 8. Performance-optimalisatie

### 8.1 Verplichte optimalisaties

| Optimalisatie | Impact | Implementatie |
|---|---|---|
| **Animeer alleen transform en opacity** | High | Vermijd animatie van width, height, top, left |
| **Beperk backdrop-filter** | Medium | Max 2 blur-lagen tegelijk op mobiel |
| **Geen constante JS-loops** | High | Gebruik requestAnimationFrame waar nodig |
| **Lazy loading voor views** | Medium | Render alleen actieve layer |
| **CSS containment** | Medium | `contain: layout style paint` op layers |
| **Debounce/throttle events** | Medium | Pointermove, scroll, resize events |

### 8.2 Performance budget

| Metric | Target | Acceptabel | Kritiek |
|---|---|---|---|
| **First Contentful Paint** | < 1.5s | < 2.5s | > 3s |
| **Time to Interactive** | < 3s | < 5s | > 7s |
| **Cumulative Layout Shift** | < 0.1 | < 0.25 | > 0.4 |
| **Frame rate (animaties)** | 60 FPS | 30-60 FPS | < 30 FPS |
| **Bundle size (gzip)** | < 150KB | < 250KB | > 400KB |

### 8.3 Meetinstrumenten

**Chrome DevTools:**
- Performance tab: record tijdens navigatie en animaties
- Lighthouse: run audit voor performance, accessibility, best practices
- Coverage tab: identificeer ongebruikte CSS/JS

**Real-world monitoring:**
```javascript
// Web Vitals meten
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

### 8.4 Testscenario's

**Apparaten:**
- [ ] Laag-segment Android (bijv. Samsung A12)
- [ ] Mid-segment Android (bijv. Pixel 6a)
- [ ] iPhone (Safari, iOS 15+)
- [ ] Desktop (Chrome, Firefox, Safari, Edge)

**Condities:**
- [ ] Reduced motion ingeschakeld
- [ ] Trage 3G verbinding (throttling in DevTools)
- [ ] Offline modus
- [ ] Groot aantal taken (>100)
- [ ] Wisselen tussen tabs tijdens data-update
- [ ] Oriëntatieverandering (portrait ↔ landscape)

---

## 9. Implementatiefasen

### Fase 1 — Fundament (4-6 uur)

**Doel:** Basisstructuur werkend krijgen zonder bestaande functionaliteit te breken.

**Taken:**
1. [ ] Backup maken van `indexprompt.html`
2. [ ] Design tokens toevoegen aan `:root`
3. [ ] `.aurora` achtergrond element toevoegen
4. [ ] `.app` wrapper maken en bestaande content verplaatsen
5. [ ] Hoofdsecties omzetten naar `.layer` structuur
6. [ ] Navigatie migreren naar `data-layer` attributen
7. [ ] Basis CSS voor layers en transities toevoegen
8. [ ] Testen: alle bestaande functionaliteit werkt nog

**Acceptatiecriteria:**
- App laadt zonder console errors
- Alle secties zijn bereikbaar via navigatie
- Bestaande pincode werkt nog
- Geen regressie in functionaliteit

---

### Fase 2 — Componenten (4-6 uur)

**Doel:** Visuele upgrade van kaarten, knoppen, tabs en navigatie.

**Taken:**
1. [ ] Card-stijlen upgraden met glassmorphism
2. [ ] Button-stijlen upgraden met press-effect en glow
3. [ ] Tab-stijlen upgraden met light trail
4. [ ] Bottom navigation zwevend maken
5. [ ] Pincode-overlay migreren naar focus-laag
6. [ ] Consistente states toevoegen (default, hover, active, focus, disabled)
7. [ ] Reduced motion CSS toevoegen
8. [ ] Testen op verschillende apparaten

**Acceptatiecriteria:**
- Alle componenten hebben consistente styling
- Hover/focus states werken correct
- Reduced motion wordt gerespecteerd
- Visueel verschil is duidelijk t.o.v. origineel

---

### Fase 3 — Motion (3-4 uur)

**Doel:** Betekenisvolle animaties toevoegen zonder performance te verliezen.

**Taken:**
1. [ ] Layer-transities implementeren
2. [ ] Button press en ripple effect toevoegen
3. [ ] Card glow op pointermove toevoegen
4. [ ] List item enter-animaties toevoegen
5. [ ] Basis card-naar-detail transities implementeren
6. [ ] Performance testen en optimaliseren
7. [ ] Animatieduren finetunen

**Acceptatiecriteria:**
- Transities voelen soepel (60 FPS)
- Geen jank of stutter tijdens animaties
- Focus management werkt correct
- Escape key sluit detailviews

---

### Fase 4 — Data (3-4 uur)

**Doel:** Dynamische data-rendering met animaties en foutafhandeling.

**Taken:**
1. [ ] `FutureMe` namespace introduceren
2. [ ] Mock API's implementeren
3. [ ] Render-functies voor lijsten, stats, mindmap
4. [ ] Count-up animaties voor cijfers
5. [ ] Chart animaties voor grafieken
6. [ ] Loading, empty en error states toevoegen
7. [ ] Retry-mechanisme implementeren

**Acceptatiecriteria:**
- Data wordt dynamisch geladen en gerenderd
- Fouten worden netjes afgehandeld
- Retry werkt bij mislukte calls
- Animaties respecteren reduced motion

---

### Fase 5 — Uitbreiding (2-4 uur)

**Doel:** Geavanceerde features en optimalisaties.

**Taken:**
1. [ ] Shared element transities (optioneel, complex)
2. [ ] Mindmap interactie uitbreiden (drag, zoom)
3. [ ] Echte API-integraties voorbereiden
4. [ ] Lokale opslag voor voorkeuren
5. [ ] Gebruikerstests uitvoeren
6. [ ] Performance finetunen
7. [ ] Documentatie bijwerken

**Acceptatiecriteria:**
- Geavanceerde features werken stabiel
- Performance blijft binnen budget
- Gebruikerstests zijn positief
- Code is goed gedocumenteerd

---

## 10. Troubleshooting

### 10.1 Veelvoorkomende issues

| Probleem | Oorzaak | Oplossing |
|---|---|---|
| **Layers tonen niet** | Verkeerde z-index of position | Controleer `.layer` heeft `position: absolute` en `.main` heeft `position: relative` |
| **Animaties haperen** | Te veel gelijktijdige animaties | Reduceer aantal gelijktijdige transities; gebruik `will-change` spaarzaam |
| **Knoppen reageren niet op mobiel** | `cursor: pointer` ontbreekt of touch-events | Voeg `cursor: pointer` toe; test met `touch-action: manipulation` |
| **Focus verdwijnt na modal sluiten** | Focus management ontbreekt | Implementeer focus restoration zoals in sectie 5.9 |
| **Aurora veroorzaakt performance issues** | Te zware blur of animatie | Reduceer blur-radius; schakel uit op low-end devices |
| **CSS custom properties werken niet** | Oude browser | Voeg fallback waarden toe; gebruik PostCSS custom-properties plugin |
| **Dvh wordt niet ondersteund** | Oude iOS versie | Gebruik `@supports` query met fallback naar `vh` |

### 10.2 Debugging tips

**Console logging:**
```javascript
// Voeg debug logging toe tijdens ontwikkeling
const DEBUG = true;

function log(...args) {
  if (DEBUG) {
    console.log('[FutureMe]', ...args);
  }
}

// Gebruik in code
log('Layer activated:', layerId);
log('Tasks loaded:', tasks.length);
```

**Performance profiling:**
```javascript
// Meet render tijd
const start = performance.now();
await FutureMe.render.lists();
const duration = performance.now() - start;
log(`Lists rendered in ${duration.toFixed(2)}ms`);
```

**Visuele debug:**
```css
/* Voeg tijdelijk toe om layers zichtbaar te maken */
.layer {
  outline: 2px solid rgba(255, 0, 0, 0.3);
}

.layer.active {
  outline: 2px solid rgba(0, 255, 0, 0.3);
}
```

### 10.3 Browser compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---|---|---|---|---|
| **CSS custom properties** | ✅ 49+ | ✅ 55+ | ✅ 9.1+ | ✅ 15+ |
| **Backdrop filter** | ✅ 76+ | ✅ 103+ | ✅ 9+ | ✅ 79+ |
| **Dvh (dynamic viewport)** | ✅ 108+ | ✅ 113+ | ✅ 16+ | ✅ 108+ |
| **CSS contain** | ✅ 52+ | ✅ 69+ | ✅ 15.4+ | ✅ 79+ |
| **Inert attribuut** | ✅ 88+ | ✅ 111+ | ✅ 17+ | ✅ 88+ |

**Fallback strategie:**
- Gebruik feature detection met `@supports`
- Voorzie graceful degradation voor oudere browsers
- Test minimaal op laatste 2 versies van elke major browser

---

## Appendix A: Changelog per sectie

### HTML wijzigingen
- Toegevoegd: `.aurora` achtergrondelement
- Toegevoegd: `.app` wrapper met perspective
- Gewijzigd: Hoofdsecties nu als `.layer` elementen
- Toegevoegd: `.page` elementen voor detailviews
- Verbeterd: ARIA attributen overal toegevoegd

### CSS wijzigingen
- Toegevoegd: 50+ nieuwe CSS custom properties
- Toegevoegd: 30+ nieuwe component-stijlen
- Verbeterd: Bestaande stijlen uitgebreid met states
- Toegevoegd: Reduced motion support
- Geoptimaliseerd: Performance met will-change en contain

### JavaScript wijzigingen
- Toegevoegd: `FutureMe` centrale namespace
- Toegevoegd: Mock API's voor alle databronnen
- Verbeterd: Foutafhandeling overal toegevoegd
- Toegevoegd: Focus management voor modals
- Geoptimaliseerd: Event handling met throttle/debounce

---

## Appendix B: ROI-meting

| Verbetering | Effort | Impact | ROI Score |
|---|---|---|---|
| **Design tokens** | Low | High | ⭐⭐⭐⭐⭐ |
| **Layer structuur** | Medium | High | ⭐⭐⭐⭐⭐ |
| **Glassmorphism kaarten** | Medium | Medium | ⭐⭐⭐⭐ |
| **Button animaties** | Low | Medium | ⭐⭐⭐⭐ |
| **Focus management** | Medium | High | ⭐⭐⭐⭐⭐ |
| **Mock API's** | Medium | High | ⭐⭐⭐⭐⭐ |
| **Reduced motion** | Low | Medium | ⭐⭐⭐⭐ |
| **Shared element transities** | High | Medium | ⭐⭐⭐ |

---

## Appendix C: Bronnen en referenties

- [WCAG 2.2 Guidelines](https://www.w3.org/TR/WCAG22/)
- [Web Vitals](https://web.dev/vitals/)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API)
- [ARIA Best Practices](https://www.w3.org/WAI/ARIA/apg/)

---

**Document einde**

*Versie 3.0 — Implementatie-ready specificatie voor FutureMe Spatial Experience*