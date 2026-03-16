# IMI — Comprehensive Design Specification
## World-Class Real Estate Proptech App
**Version:** Based on Brand & Design System v5.0 · Compiled March 2026

---

## TABLE OF CONTENTS
1. [Complete Token List from Brandkit](#1-complete-token-list-from-brandkit)
2. [Mobile App Shell Structure — Section 25](#2-mobile-app-shell-structure--section-25)
3. [Key Guidelines from Vercel Web Interface Guidelines](#3-key-guidelines-from-vercel-web-interface-guidelines)
4. [Best Practices for Proptech Mobile UX](#4-best-practices-for-proptech-mobile-ux)
5. [Component Inventory for Imoveis Module](#5-component-inventory-for-imoveis-module)

---

## 1. COMPLETE TOKEN LIST FROM BRANDKIT

### 1.1 CSS Variables — Root (:root)

#### Dark Theme Backgrounds (Default)
```css
--navy:        #0B1928;   /* Base background */
--navy-mid:    #0F2035;   /* Header, Sidebar */
--navy-card:   #142840;   /* Cards, Panels */
--navy-raised: #1A3250;   /* Inputs, Hover states */
--navy-float:  #1F3B5C;   /* Dropdowns, Tooltips */
```

#### Brand Gold
```css
--gold:        #C8A44A;   /* Accent Primary */
--gold-bright: #D4B86A;   /* Hover, Active */
--gold-deep:   #A8842A;   /* Deep variant */
--gold-pale:   rgba(200,164,74,0.10);   /* Backgrounds */
--gold-border: rgba(200,164,74,0.20);   /* Borders */
--gold-glow:   rgba(200,164,74,0.06);   /* Ambient glow */
```

#### Text — Dark Theme
```css
--white:       #FFFFFF;
--off-white:   #F2EFE9;
--text-1:      #EBE7E0;   /* Primary body text */
--text-2:      #9FAAB8;   /* Secondary text */
--text-3:      #5C6B7D;   /* Muted / labels */
--text-inv:    #0B1928;   /* Text on gold backgrounds */
```

#### Semantic Colors — Dark Theme
```css
--green:       #5DB887;   /* Success, positive delta */
--red:         #E06B6B;   /* Error, negative delta */
--blue:        #5B9BD5;   /* Info */
--amber:       #D4913A;   /* Warning */
```

#### Borders — Dark Theme
```css
--border-soft: rgba(255,255,255,0.06);
--border-gold: rgba(200,164,74,0.22);
--border-hover:rgba(200,164,74,0.40);
```

#### Shadows — Dark Theme
```css
--shadow-card: 0 4px 24px rgba(0,0,0,0.35);
--shadow-gold: 0 0 48px rgba(200,164,74,0.07);
--shadow-deep: 0 24px 64px rgba(0,0,0,0.55);
```

#### Light Theme Tokens
```css
--lt-bg:         #F6F3ED;
--lt-bg-mid:     #EDEAE3;
--lt-bg-card:    #FFFFFF;
--lt-bg-raised:  #F0ECE4;
--lt-bg-float:   #E8E4DC;
--lt-text-1:     #1A2433;
--lt-text-2:     #4A5568;
--lt-text-3:     #8A94A3;
--lt-border:     rgba(11,25,40,0.10);
--lt-border-gold:rgba(168,132,42,0.25);
--lt-shadow:     0 2px 16px rgba(11,25,40,0.08);
--lt-gold:       #A8842A;
--lt-gold-pale:  rgba(168,132,42,0.08);
--lt-green:      #2D8F5C;
--lt-red:        #C94040;
--lt-blue:       #3A7BC8;
--lt-amber:      #B87A2A;
```

#### Liquid Glass
```css
--glass-bg:        rgba(20,40,64,0.55);
--glass-border:    rgba(200,164,74,0.18);
--glass-blur:      16px;
--glass-shadow:    0 8px 32px rgba(0,0,0,0.3);
--glass-lt-bg:     rgba(255,255,255,0.65);
--glass-lt-border: rgba(11,25,40,0.10);
--glass-lt-blur:   20px;
--glass-lt-shadow: 0 4px 24px rgba(0,0,0,0.06);
```

#### Border Radius Scale
```css
--r-xs:   2px;
--r-sm:   4px;
--r-md:   8px;
--r-lg:   12px;
--r-xl:   16px;
--r-2xl:  20px;
--r-pill: 999px;
```

#### Typography Families
```css
--font-display: 'Playfair Display', Georgia, serif;
--font-ui:      'Montserrat', sans-serif;
--font-data:    'DM Mono', 'Courier New', monospace;
```
Google Fonts import weights:
- Playfair Display: 400, 500, 600, 700 (regular + italic)
- Montserrat: 200, 300, 400, 500, 600, 700
- DM Mono: 300, 400, 500

#### Motion Tokens
```css
--ease:        cubic-bezier(0.25, 0.46, 0.45, 0.94);   /* Standard ease */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);      /* Bouncy / spring */
--ease-expo:   cubic-bezier(0.16, 1, 0.3, 1);           /* Exponential out */
--t-fast:      150ms;    /* Micro-interactions, toggles */
--t-base:      300ms;    /* Standard transitions */
--t-slow:      500ms;    /* Page-level transitions */
--t-enter:     600ms;    /* Entry animations */
```

### 1.2 Named Backoffice Tokens (bo-* namespace)
For use in `src/app/(backoffice)/lib/theme.ts`:

```css
/* Backgrounds */
--bo-bg-base:    #0B1928;
--bo-bg-mid:     #0F2035;
--bo-bg-card:    #142840;
--bo-bg-raised:  #1A3250;

/* Light Backgrounds */
--bo-lt-bg:      #F6F3ED;
--bo-lt-card:    #FFFFFF;
--bo-lt-raised:  #F0ECE4;

/* Brand Gold */
--bo-gold:        #C8A44A;
--bo-gold-bright: #D4B86A;
--bo-gold-deep:   #A8842A;
--bo-lt-gold:     #A8842A;

/* Light Semantics */
--bo-lt-green:  #2D8F5C;
--bo-lt-red:    #C94040;
--bo-lt-blue:   #3A7BC8;
--bo-lt-amber:  #B87A2A;
--bo-lt-text-1: #1A2433;
--bo-lt-text-2: #4A5568;
--bo-lt-text-3: #8A94A3;

/* Typography */
--bo-font-display: 'Playfair Display', Georgia, serif;
--bo-font-ui:      'Montserrat', sans-serif;
--bo-font-data:    'DM Mono', 'Courier New', monospace;

/* Liquid Glass */
--bo-glass-bg:    rgba(20,40,64,0.55);
--bo-glass-blur:  16px;
--bo-glass-lt-bg: rgba(255,255,255,0.65);
```

### 1.3 Tailwind Config Extension
```js
// tailwind.config.js
module.exports = {
  theme: { extend: {
    colors: {
      navy: { base:'#0B1928', mid:'#0F2035', card:'#142840', raised:'#1A3250' },
      gold: { DEFAULT:'#C8A44A', bright:'#D4B86A', deep:'#A8842A' },
      lt:   { bg:'#F6F3ED', card:'#FFFFFF', raised:'#F0ECE4' },
    },
    fontFamily: {
      display: ['Playfair Display','serif'],
      ui:      ['Montserrat','sans'],
      data:    ['DM Mono','mono'],
    },
  }},
}
```

---

### 1.4 Typography Scale

| Role | Font | Size | Weight | Line-Height | Notes |
|------|------|------|--------|-------------|-------|
| Display / Hero | Playfair Display | 62px | 600 | 1.05 | H1 on hero sections |
| Display / Section | Playfair Display | 52px | 600 | 1.05 | Spec sections |
| Heading 1 | Playfair Display | 32px | 500 | 1.2 | Section titles |
| Heading 2 | Playfair Display | 30px | 500 | 1.2 | `.section-title` |
| Heading 3 | Playfair Display | 22px | 400 italic | 1.4 | Quotes, taglines |
| Card Title | Playfair Display | 18px | 500 | — | `.ui-card-title` |
| Body | Montserrat | 14px | 300 | 1.85 | Base html font-size |
| Body UI | Montserrat | 12–12.5px | 400 | 1.75 | Cards, tables |
| Input | Montserrat | 12.5px | 400 | — | Form controls |
| Label / Eyebrow | Montserrat | 8.5px | 500–600 | — | Letter-spacing 2.5–4px, ALL CAPS |
| Sidebar nav | Montserrat | 11px | 500 | — | Letter-spacing 0.3px |
| Micro label | Montserrat | 8px | 500 | — | Letter-spacing 3px, ALL CAPS |
| Data / Numbers | DM Mono | 36px | 400 | 1 | Financial values (stat cards) |
| Data large | DM Mono | 34px | 400 | 1 | `.stat-val` |
| Data medium | DM Mono | 24px | 400 | — | Metrics |
| Data small | DM Mono | 18–20px | 300–400 | — | Secondary data |
| Data body | DM Mono | 12px | 400 | — | Table cells |
| Badge | Montserrat | 9.5px | 600 | — | Letter-spacing 0.8px, ALL CAPS |
| Hint | Montserrat | 10px | 400 | — | Form hints |

**Rule:** DM Mono is EXCLUSIVE to numbers, metrics, indices, and financial values. Always use `font-variant-numeric: tabular-nums`.

---

### 1.5 Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--s-1` | 4px | Micro gap |
| `--s-2` | 8px | Tight gap |
| `--s-3` | 12px | Small gap |
| `--s-4` | 16px | Base unit |
| `--s-6` | 24px | Card padding |
| `--s-8` | 32px | Section inner |
| `--s-12` | 48px | Large gap |
| `--s-16` | 64px | Section padding |
| `--s-18` | 72px | Desktop section padding |
| `--s-24` | 96px | Hero-level spacing |

Desktop section padding: `72px` horizontal, `56–72px` vertical.
Mobile section padding: `40px` vertical, `24px` horizontal.
Mobile lateral padding: `14–16px`.

---

### 1.6 Grid System

```css
.grid-2  { grid-template-columns: 1fr 1fr; gap: 16px; }
.grid-3  { grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
.grid-4  { grid-template-columns: repeat(4,1fr); gap: 16px; }
.grid-5  { grid-template-columns: repeat(5,1fr); gap: 16px; }
.grid-auto { grid-template-columns: repeat(auto-fill, minmax(180px,1fr)); gap: 14px; }

/* Bento */
.bento-grid { grid-template-columns: repeat(4, 1fr); grid-auto-rows: minmax(120px, auto); gap: 12px; }
.bento-span-2 { grid-column: span 2; }
.bento-span-3 { grid-column: span 3; }
.bento-row-2  { grid-row: span 2; }
```

Breakpoint: `1024px` — sidebar hides, grids collapse to 2-column, sections repad.

---

### 1.7 Animation Inventory

| Name | Keyframe | Duration | Use |
|------|----------|----------|-----|
| `sectionFade` | `opacity:0 + translateY(12px)` → normal | `0.6s --ease` | Section entry |
| `skeletonPulse` | `background-position 200%→-200%` | `1.5s ease-in-out infinite` | Skeleton loaders |
| `shimmer` | `background-position -200%→200%` | `3.5s linear infinite` | Text shimmer |
| `pulse-border` | Box shadow 0→4px→0 | `loop` | Pulsing borders |
| `float` | `translateY(0→-6px→0)` | `loop` | Floating elements |
| `motionDemo` | Width 0→100%→0 with left shift | `2s infinite` | Motion demo bars |

**Principle:** Always respect `prefers-reduced-motion`. Use GPU-accelerated properties only (`transform`, `opacity`). Never use `transition: all`.

---

### 1.8 Accessibility Tokens
- `:focus-visible` → `outline: 2px solid var(--gold); outline-offset: 2px`
- Light theme focus: `outline-color: var(--lt-gold)`
- `-webkit-font-smoothing: antialiased`
- `-moz-osx-font-smoothing: grayscale`
- Contrast ratios verified: Gold on Navy 7.8:1 (AAA), White on Navy 16.5:1 (AAA), Navy on Gold 8.1:1 (AAA)

---

## 2. MOBILE APP SHELL STRUCTURE — SECTION 25

### 2.1 Phone Frame Dimensions & Structure

```html
<!-- Phone frame: 240px wide, 28px border-radius -->
<div class="phone-frame">
  <!-- Status bar area: 8px height, navy-mid bg -->
  <div style="height:8px; background:var(--navy-mid)"></div>

  <!-- Notch: 80px wide, 22px height, camera dot -->
  <div class="phone-notch">
    <div class="phone-notch-cam"></div>
  </div>

  <!-- Screen content: padding 16px 14px 20px -->
  <div class="phone-screen" style="background:var(--navy); padding:16px 14px 20px">

    <!-- TOP BAR: greeting + avatar -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px">
      <div>
        <div style="font-size:9px; color:var(--text-3); letter-spacing:1.5px; margin-bottom:2px">BOM DIA</div>
        <div style="font-family:var(--font-display); font-size:16px; font-weight:500; color:var(--white)">
          [User Name]
        </div>
      </div>
      <div class="avatar avatar-sm">[Initials]</div>
    </div>

    <!-- HERO METRIC CARD: index/KPI highlight -->
    <div style="
      background: linear-gradient(135deg, var(--navy-card), rgba(200,164,74,0.04));
      border: 1px solid var(--border-gold);
      border-radius: var(--r-md);
      padding: 14px;
      margin-bottom: 12px;
    ">
      <div style="font-size:7px; letter-spacing:2px; text-transform:uppercase; color:var(--gold); margin-bottom:8px">
        Índice IMI · Q1
      </div>
      <div style="display:flex; gap:16px">
        <div>
          <div style="font-family:var(--font-data); font-size:22px; color:var(--gold)">+11.3%</div>
          <div style="font-size:7px; color:var(--text-3); letter-spacing:1px">ANUAL</div>
        </div>
        <div style="width:1px; background:var(--border-gold)"></div>
        <div>
          <div style="font-family:var(--font-data); font-size:22px; color:var(--white)">7.4%</div>
          <div style="font-size:7px; color:var(--text-3); letter-spacing:1px">CAP RATE</div>
        </div>
      </div>
    </div>

    <!-- 2-COL STAT GRID -->
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px">
      <div style="
        background: var(--navy-card);
        border: 1px solid var(--border-gold);
        border-radius: var(--r-md);
        padding: 10px 12px;
      ">
        <div style="font-size:7px; letter-spacing:1.5px; text-transform:uppercase; color:var(--text-3); margin-bottom:6px">Imóveis</div>
        <div style="font-family:var(--font-data); font-size:18px; color:var(--white)">1.284</div>
      </div>
      <div style="...same...">
        <div ...>VGV</div>
        <div style="...color:var(--gold)">R$ 2.1B</div>
      </div>
    </div>

  </div><!-- /phone-screen -->
</div><!-- /phone-frame -->
```

### 2.2 Mobile Directives (Exact from Brandkit)

| Directive | Specification |
|-----------|---------------|
| Touch Target | ≥ 44 × 44px |
| Minimum Font | 12px (to prevent iOS auto-zoom on inputs: ≥ 16px) |
| Lateral Padding | 14–16px |
| Bottom Nav Max | 4 items maximum |

### 2.3 CSS Classes for Phone Frame
```css
.phone-frame {
  width: 240px;
  background: var(--navy-mid);
  border: 1.5px solid var(--border-gold);
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 0 8px rgba(0,0,0,0.2);
  position: relative;
}
.phone-notch {
  width: 80px; height: 22px;
  background: var(--navy);
  border-radius: 0 0 14px 14px;
  margin: 0 auto;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.phone-notch-cam {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--navy-raised);
  border: 1px solid var(--border-soft);
}
.phone-screen { padding: 0 0 20px; }
```

### 2.4 App Sidebar (Narrow Icon Rail — Desktop App)
```css
.mockup-app-sidebar {
  width: 56px;
  background: var(--navy-mid);
  border-right: 1px solid var(--border-gold);
  padding: 12px 0;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
}
.app-nav-icon {
  width: 36px; height: 36px;
  border-radius: var(--r-sm);
  display: flex; align-items: center; justify-content: center;
  color: var(--text-3);
  transition: all var(--t-fast);
}
.app-nav-icon:hover  { background: var(--gold-pale); color: var(--gold); }
.app-nav-icon.active { background: var(--gold-pale); color: var(--gold); border: 1px solid var(--border-gold); }
.app-nav-icon svg    { width: 16px; height: 16px; }
```

---

## 3. KEY GUIDELINES FROM VERCEL WEB INTERFACE GUIDELINES

Source: `vercel-labs/web-interface-guidelines`

### 3.1 Interactions & Accessibility
- All flows must be keyboard-operable and follow WAI-ARIA Authoring Patterns.
- Every focusable element requires visible focus indicators using `:focus-visible`.
- Hit targets: **minimum 24px, 44px on mobile** (aligns with IMI brandkit 44×44px rule).
- Input fields on mobile: **≥ 16px font** to prevent iOS auto-zoom.
- Never disable browser zoom or paste functionality.

### 3.2 State Management
- Persist application state in URLs for sharing and navigation (deep-link everything: filters, tabs, pagination, expanded panels).
- Implement **optimistic updates** with server reconciliation.
- Show loading indicators with **150–300ms delay** to prevent flicker on fast connections.
- Use ellipsis ("…") for menu options and loading states.

### 3.3 Destructive Actions
- Confirm all destructive actions OR provide undo options.
- Design forgiving interactions with generous hit targets.

### 3.4 Animation Rules
- Respect `prefers-reduced-motion` — IMI already implements this.
- Prioritize CSS over JavaScript for animations.
- Use GPU-accelerated properties: `transform` and `opacity` only.
- **Never use `transition: all`** — explicitly list properties.
- Animations must be interruptible by user input.

### 3.5 Layout Standards
- Verify designs at mobile, laptop, and ultra-wide (50% zoom).
- Account for notches using `env(safe-area-inset-*)` variables.
- Prefer `flex` / `grid` over JavaScript measurements.
- Optical alignment: ±1px adjustments are acceptable.

### 3.6 Content Guidelines
- Use stable skeletons that match final content dimensions exactly.
- Include **text labels alongside icons** — icons alone are insufficient.
- Use **tabular numbers** for comparisons (IMI enforces this with DM Mono).
- Format dates, times, and numbers by user locale.
- Non-breaking spaces for units: `10&nbsp;m²`, `R$&nbsp;2.1B`.

### 3.7 Form Best Practices
- Enter key submits single-input forms.
- Every control needs an associated `<label>`.
- Show validation feedback without blocking input.
- **Do not pre-disable submit buttons.**
- Set `autocomplete` attributes for autofill support.
- Disable `spellcheck` on technical fields (codes, IDs, CEP).

### 3.8 Performance Budget
- POST/PATCH/DELETE: under **500ms** network latency.
- Virtualize large lists (property inventories with 1000+ items).
- Preload critical fonts and above-the-fold images.
- Use Web Workers for expensive computations (valuation models).
- Minimize layout thrashing through batched reads/writes.

### 3.9 Design System Craft Details
- Layer shadows: ambient + direct light (minimum 2 layers).
- Combine semi-transparent borders with shadows for edge clarity.
- Child border-radius ≤ parent border-radius.
- Prefer APCA over WCAG 2 for more accurate perceptual contrast.
- Set `theme-color` meta tag to match background (`#0B1928` for backoffice).
- Use `color-scheme: dark` for dark mode UI elements.

### 3.10 Copywriting Standards
- Active voice: "Avaliar imóvel" not "O imóvel será avaliado".
- Title Case for headings and buttons.
- Use numerals: "8 imóveis" not "oito imóveis".
- Error messages must guide the exit: state what went wrong AND how to fix it.
- Separate numbers and units: "348 m²" not "348m²".

---

## 4. BEST PRACTICES FOR PROPTECH MOBILE UX

### 4.1 Image-First Property Cards
**Pattern (Zillow, Rightmove, Airbnb):**
- Full-bleed photo at top: minimum 56% of card height (aspect ratio 16:9 or 4:3).
- Price overlaid on image with a gradient scrim (bottom 40%): `linear-gradient(transparent, rgba(0,0,0,0.7))`.
- Favorite/save button: heart icon top-right, 44×44px touch target, with immediate optimistic toggle.
- Status badge (Ativo/Vendido/Reservado) top-left, pill shape.
- Property type chip (Apartamento/Casa/Sala) adjacent to status.
- Below image: price (large, DM Mono), then address line, then quick stats row (m², quartos, vagas).

**IMI-specific token application:**
```
Card: navy-card bg, border-gold border, r-lg radius
Price: font-data, gold color, tabular-nums
Badge: badge-green for "Ativo", badge-amber for "Reservado", badge-red for "Vendido"
Stats row: text-3 labels, text-1 values, font-data for numbers
```

### 4.2 Map Integration Patterns
**Best practices from Zillow/Idealista/OLX:**
- Map fills full screen with cards in a bottom sheet (collapsed to 30vh, expanded to 70vh).
- Cluster markers for zoomed-out views (number inside circle).
- Property price as map marker label (not just a dot) — shown in DM Mono.
- Active property highlights its marker (gold glow effect: `box-shadow: 0 0 0 4px rgba(200,164,74,0.4)`).
- Map/List toggle: sticky chip pair at top of screen.
- Never block the map with a full-screen modal — use side panel on tablet/desktop.

**Marker design for IMI:**
```
Default:  navy-card bg, border-gold border, gold text (price), r-pill
Active:   gold bg, navy text, shadow-gold glow
Cluster:  gold bg, navy text (count), r-pill
```

### 4.3 Filter Drawer Pattern
**Best practices (Idealista, OLX):**
- Triggered from a persistent filter bar at top of listing screen.
- Drawer slides up from bottom (80vh) with handle indicator.
- Sections: Tipo, Preço (range slider), Área (range slider), Quartos/Vagas (chip selectors), Características (checkboxes).
- Range sliders: show live values in DM Mono while dragging.
- Active filter count shown as badge on the filter button.
- "Aplicar" (primary gold button) and "Limpar" (ghost button) fixed at bottom of drawer.
- Chips for quick-select (e.g., Studio, 1Q, 2Q, 3Q+) use `.chip` / `.chip.active` pattern from brandkit.

**Accessibility:** Drawer traps focus when open. ESC key closes. `aria-modal="true"`.

### 4.4 Swipe Gestures (Mobile-First)
- **Horizontal swipe on property card photos:** cycle through gallery images (no arrows on mobile).
- **Swipe left on list item:** reveal quick actions (Favoritar, Comparar, Compartilhar) — red zone for archive.
- **Pull-to-refresh:** on property list and map.
- **Vertical swipe on bottom sheet:** expand/collapse between snap points.
- All gestures must have equivalent tap/button fallbacks for accessibility.

### 4.5 Skeleton Loading Strategy
**IMI pattern (from brandkit):**
```css
.skeleton {
  background: linear-gradient(90deg, var(--navy-card) 25%, var(--navy-raised) 50%, var(--navy-card) 75%);
  background-size: 200% 100%;
  animation: skeletonPulse 1.5s ease-in-out infinite;
}
```
- Skeleton shapes must match the exact dimensions of the content they replace.
- For property cards: 4:3 ratio block (image) + 3 text lines + 2 stat chips.
- Show skeleton for ≥150ms to prevent flash. Never show spinner + skeleton simultaneously.
- Stagger skeleton card entry animations: `animation-delay: calc(index * 80ms)`.

### 4.6 Progressive Disclosure
**For property detail pages (imoveis/[id]):**
- Above the fold: photo gallery (full-width), price, status badge, key stats (m², quartos, vagas, andar).
- First scroll: location map thumbnail, description excerpt, CTA button.
- Second scroll: full characteristics table, amenities chips, documents.
- Third scroll: analytics, timeline, comparable transactions.
- Use accordions for sections below the fold.
- "Ver mais" links with `--t-base` expand animation.

### 4.7 Search & Discovery UX
**Pattern from Zillow/Airbnb:**
- Search bar is always visible (sticky at top) — not a modal.
- Instant search (debounce 250ms) with address, neighborhood, or condominium.
- Recent searches persist in localStorage.
- Suggested neighborhoods as chips below search input.
- Search results show count: "247 imóveis encontrados" (DM Mono for number, text-2 for label).

### 4.8 Navigation Architecture for Mobile App
```
Bottom Nav (4 items max — IMI rule):
├── Home (Painel / Dashboard)
├── Imóveis (List/Map)
├── Leads / Pipeline
└── Perfil / Configurações

Top nav:
├── Back arrow (left)
├── Screen title (center, Playfair Display 16px 500)
└── Action icons (right): Search, Filter, Share

Detail page nav:
└── Tabs: Visão Geral | Analytics | Timeline | Unidades
```

### 4.9 Touch Interaction Principles
- Minimum touch target: 44×44px (IMI brandkit + Vercel guidelines).
- Swipeable lists: provide clear affordance (show 10px of next item at edge).
- Never place destructive actions as the primary/first action.
- Long-press reveals context menu as an alternative to swipe actions.
- Haptic feedback on significant actions (native API via Vibration API or React Native Haptics).

### 4.10 Performance on Mobile (Proptech-specific)
- Lazy-load property images below the fold.
- Use `<img loading="lazy">` with blur-hash placeholder while loading.
- Map tiles: load only visible viewport + 1 tile buffer.
- Preload the next N=5 property detail pages when user is on list.
- Price data: cache for 5 minutes, show stale with "Atualizado às HH:MM" indicator.
- Infinite scroll (not pagination) for property lists — virtualize with `react-virtual`.

---

## 5. COMPONENT INVENTORY FOR IMOVEIS MODULE

### 5.1 Module Structure (Existing Routes)
```
imoveis/
├── page.tsx              — List / Map view (main listing)
├── novo/page.tsx         — New property form
├── inventario/           — Inventory management
├── portfolio/            — Portfolio analysis
├── comparar/             — Property comparison
├── explorer/             — Market explorer
├── heatmap/              — Price heatmap
└── [id]/
    ├── page.tsx          — Property detail
    ├── editar/           — Edit form
    ├── analytics/        — Analytics dashboard
    ├── timeline/         — Activity timeline
    ├── unidades/         — Units (for buildings)
    └── heatmap/          — Property-level heatmap
```

### 5.2 Components Required — Listing Page (imoveis/page.tsx)

#### Layout Shell
- `<ImovelListShell>` — full-height container with sidebar + main content split
- `<ImovelSearchBar>` — sticky search input with address autocomplete
- `<ImovelFilterBar>` — horizontal chip row for active filters + "Filtros" button with badge count
- `<ImovelViewToggle>` — Lista / Mapa chip switcher

#### Property Card (Core Component)
```tsx
// ImovelCard — design spec
interface ImovelCardProps {
  id: string
  foto_principal: string         // 4:3 aspect ratio image
  preco: number                  // DM Mono, gold color
  status: 'ativo' | 'reservado' | 'vendido' | 'locacao'
  tipo: string                   // badge chip
  area_total: number             // m² — DM Mono
  quartos: number
  vagas: number
  endereco: string
  bairro: string
  cap_rate?: number              // % — DM Mono, green
  isFavorito: boolean
  onFavorite: () => void
}
```
Token application:
- Card container: `navy-card` bg, `border-gold` border, `r-lg` radius, `shadow-card`
- Hover: `border-hover` border, `shadow-gold`, `translateY(-2px)`
- Status badge: `badge-green` / `badge-amber` / `badge-red` / `badge-blue`
- Price: `font-data`, 18–22px, `gold` color, `tabular-nums`
- Stats row: `text-3` for labels (8px uppercase), `text-1` for values (DM Mono 12px)

#### Filter Drawer
- `<ImovelFilterDrawer>` — bottom sheet with full filter controls
  - Price range slider: `gold` fill, `navy-raised` track
  - Area range slider: same
  - Tipo chips: `.chip` / `.chip.active` pattern
  - Quartos chips: 1, 2, 3, 4+ pill chips
  - Características: toggle list items
  - Footer: `btn-primary` "Aplicar (247)" + `btn-ghost` "Limpar"

#### Map Components
- `<ImovelMapView>` — full-height map (Mapbox/Google Maps)
- `<ImovelMapMarker>` — price bubble marker
- `<ImovelMapCluster>` — count cluster marker
- `<ImovelBottomSheet>` — swipeable bottom sheet over map

#### Skeleton Loaders
- `<ImovelCardSkeleton>` — exact card dimensions with shimmer
- `<ImovelListSkeleton>` — 6-card grid of skeletons

### 5.3 Components Required — Property Detail ([id]/page.tsx)

#### Photo Gallery
- `<ImovelGallery>` — swipeable full-width gallery
  - Thumbnails row below on desktop
  - Swipe gesture on mobile
  - Fullscreen lightbox on tap
  - Photo count: "3 / 12" (DM Mono) top-right overlay

#### Header Block (above fold)
- Price: `font-data`, 34–40px, `gold`, `tabular-nums`
- Status badge: pill with semantic color
- Address: `text-2`, 13px
- Quick stats row: m² | quartos | vagas | andar (DM Mono values, text-3 labels, `border-soft` dividers)
- Action buttons: Favoritar (ghost), Comparar (ghost), Compartilhar (ghost), Contatar (primary gold)

#### Info Sections (Progressive Disclosure)
- `<ImovelDescricao>` — expandable text accordion
- `<ImovelCaracteristicas>` — grid of chip/icon pairs
- `<ImovelLocalizacao>` — embedded map thumbnail + address details
- `<ImovelDocumentos>` — file list with type badges
- `<ImovelAmenidades>` — icon + label chip grid

#### Analytics Tab ([id]/analytics/)
- Stat cards: `.stat-card` with `font-data` values, delta indicators (green/red)
- Price history chart: line chart with gold stroke, navy-card background
- Comparables table: `.data-table` with sortable columns

#### Timeline Tab ([id]/timeline/)
- Vertical timeline: gold dot + navy-raised line
- Event cards: `card-base`, timestamp in DM Mono text-3, description in text-2

#### Units Tab ([id]/unidades/)
- Data table: `.data-table` with status badges, price per m² column (DM Mono gold)
- Bento grid option for unit layout visualization

### 5.4 Components Required — New Property Form (imoveis/novo/)

#### Form Layout
- Multi-step wizard: steps shown as progress bar (`.progress-track` / `.progress-fill`)
- Step indicators: numbered chips (`.badge-gold` active, `.badge-ghost` pending)

#### Form Controls (all use dark theme input styles)
```css
/* Input */
background: var(--navy-raised);
border: 1px solid var(--border-gold);
padding: 11px 14px;
font-size: 12.5px;
focus: border-color gold, box-shadow 0 0 0 3px rgba(200,164,74,0.10)

/* Label */
font-size: 8.5px; letter-spacing: 2.5px; text-transform: uppercase; color: var(--text-3)
```

Specific fields:
- `<CepInput>` — auto-fill address on blur (existing in codebase)
- `<TipoSelect>` — styled select with gold chevron
- `<StatusToggleGroup>` — horizontal chip selector for ativo/reservado/vendido
- `<PriceInput>` — DM Mono font, currency prefix "R$", formatted with `.`
- `<AreaInput>` — number with "m²" suffix, DM Mono
- `<FotoUpload>` — drag-drop zone, photo grid preview with reorder
- `<MapPinPicker>` — click-on-map for coordinate selection
- `<CaracteristicasCheckboxGrid>` — icon + label grid of toggles

### 5.5 Reusable Utility Components (Cross-Module)

| Component | Class / Pattern | Purpose |
|-----------|----------------|---------|
| `<StatusBadge status>` | `.badge` variants | Ativo/Reservado/Vendido/Locação |
| `<TipoBadge tipo>` | `.badge-ghost` | Apartamento/Casa/Sala/Terreno |
| `<PriceDisplay value>` | DM Mono + gold | Formatted R$ values |
| `<DeltaIndicator>` | `.stat-delta.up/.dn` | % change with arrow |
| `<CapRateBadge>` | `.badge-green/.amber` | Cap rate % display |
| `<AreaDisplay>` | DM Mono + text-3 | "348 m²" formatted |
| `<RoomChips>` | `.chip` row | Quartos/Vagas count chips |
| `<GoldDivider>` | `.divider-gold` | Section separator |
| `<SectionEyebrow>` | `.section-eyebrow` | ALL CAPS gold label |
| `<DataTable>` | `.data-table` | Standard data table |
| `<StatCard>` | `.stat-card` | KPI display card |
| `<AlertBanner type>` | `.alert-*` | Success/Error/Info/Warning |
| `<SkeletonCard>` | `.skeleton` | Loading placeholder |
| `<GlassCard>` | `.glass-card` | Backdrop-blur overlay card |
| `<AvatarInitials>` | `.avatar-sm/md/lg` | User initials circle |
| `<Chip active>` | `.chip` / `.chip.active` | Filter/tag chips |
| `<TooltipWrap>` | `.tooltip-wrap/box` | Contextual help |
| `<ProgressBar>` | `.progress-track/fill` | % completion |

---

## 6. DESIGN PRINCIPLES SUMMARY (IMI-SPECIFIC)

### 6.1 Voice & Brand
- IMI speaks as an **asset management advisory desk**, not a real estate agency.
- Tagline: *"Where capital is allocated, not sold."*
- Data before adjectives — every claim must be backed by a metric.
- Tone: Preciso · Institucional · Direto · Confiável.

### 6.2 Hierarchy Rules
1. Monogram **IMI** (Playfair Display 700) → Gold divider line → Wordmark "INTELIGÊNCIA IMOBILIÁRIA" (Montserrat 400 uppercase).
2. Numbers use DM Mono exclusively (tabular-nums).
3. Display copy uses Playfair Display (editorial, serif gravitas).
4. UI uses Montserrat (functional, legible).

### 6.3 Color Usage Rules
- Gold is the single accent — it signals **action, data, and brand**.
- Use gold sparingly: borders, labels, key numbers, CTAs.
- Never use gold for body text (only headings and data).
- Semantic colors (green/red/blue/amber) are **status-only** — not decorative.
- Navy depth scale encodes **elevation** (deeper = lower in z-stack).

### 6.4 Favicon Context Routing
| Route | Favicon | Theme color |
|-------|---------|-------------|
| `/backoffice/*` | `favicon-bo.svg` — navy bg, gold bar, white text | `#0B1928` |
| `/*` (public) | `favicon-pub.svg` — off-white bg, muted gold bar, navy text | `#F2EFE9` |

### 6.5 Do & Don't (Brandkit Section 27)
**DO:**
- Use DM Mono for all numerical/financial data: `R$ 2.847.500`
- Use data-backed institutional copy: "Cap rate de 7.4% baseado em 847 transações Q1 2026"
- Use PTAM reference with standard and validity: "ABNT NBR 14653-2. Validade: 6 meses"

**DON'T:**
- Use Playfair Display for numbers (irregular serif rhythm)
- Use generic marketing language: "Excelente rentabilidade!" / "Oportunidade imperdível"
- Rotate, skew, or change logo proportions
- Use brand on medium-contrast backgrounds

---

*Document compiled from: IMI Brand & Design System v5.0 (March 2026) + Vercel Web Interface Guidelines + Proptech mobile UX research (Zillow, Airbnb, Rightmove, Idealista, OLX patterns).*
