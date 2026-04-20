# ✅ CHECKLIST EXECUTIVO — IMI Branding Standard

## 🔴 BLOQUEADORES CRÍTICOS (NUNCA PASSAR)

### Botões
- [ ] ❌ Nenhum botão com `background: var(--gold)` ou `background: #C8A44A`
- [ ] ❌ Nenhum botão light theme com cor gold (deve ser `var(--La)`)
- [ ] ✅ Todos botões primários: `var(--n)` bg + `var(--w)` text
- [ ] ✅ Todos botões light: `var(--La)` bg + `var(--w)` text
- [ ] ✅ `font-weight: 600+` (nunca 400 ou 500)
- [ ] ✅ `letter-spacing: 1px`
- [ ] ✅ `text-transform: uppercase`

### Light Theme — Borders
- [ ] ❌ ZERO `rgba` borders (usar 2px solid)
- [ ] ❌ ZERO `border: 1px` em light theme (mínimo 2px)
- [ ] ✅ Todos borders: `2px solid var(--Lb)` ou `var(--Lb2)`
- [ ] ✅ Sem exceções ou casos especiais

### Cores — Temas Mixados
- [ ] ❌ Nenhum componente misturando dark + light CSS
- [ ] ❌ Nenhum `var(--gold)` em light theme backgrounds
- [ ] ✅ Dark theme: Navy + Gold consistency
- [ ] ✅ Light theme: Beige + Navy consistency

---

## 🟠 PROBLEMAS COMUNS (DEVE REVISAR)

### Tipografia
- [ ] ✅ Display (Playfair) APENAS para títulos/headings
- [ ] ✅ Body (Outfit) para texto corrido
- [ ] ✅ Mono (JetBrains) para dados com `font-variant-numeric: tabular-nums`
- [ ] ✅ Monospace para números/valores monetários
- [ ] ✅ Line-height >= 1.5 (nunca < 1.4)

### Espaçamento
- [ ] ✅ Gaps: 6px (items), 12px (grupos), 24px (seções)
- [ ] ✅ Padding botões: 7-13px vertical
- [ ] ✅ Padding inputs: 9-14px
- [ ] ✅ Padding cards: 18-24px
- [ ] ❌ Nunca usar margin excessivo (preferir gap/padding)

### Borders & Radius
- [ ] ✅ Cards: `border-radius: 6px` ou `8px`
- [ ] ✅ Buttons: `border-radius: 5-7px`
- [ ] ✅ Inputs: `border-radius: 6-8px`
- [ ] ✅ Badges/Pills: `border-radius: 99px`
- [ ] ❌ Nunca misturar 3px + 10px + 12px no mesmo layout

### Shadows & Glow
- [ ] ✅ Cards: `box-shadow: var(--shd)` ou similar
- [ ] ✅ Hover/Active: `box-shadow: var(--shdg)`
- [ ] ✅ Glass: `box-shadow: 0 8px 32px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.04)`
- [ ] ❌ Nunca usar shadows grandes (>32px) sem motivo

### Transições
- [ ] ✅ Buttons: `transition: all 0.25s var(--ease)`
- [ ] ✅ Glass cards: `transition: all 0.35s var(--ease)`
- [ ] ✅ Hover state: `transform: translateY(-1px)`
- [ ] ❌ Transição nunca > 0.5s (parece lento)

---

## 🟢 VALIDAÇÕES BÁSICAS (QUICK CHECK)

### CSS Variables
- [ ] ✅ `:root` contém TODAS cores (dark + light)
- [ ] ✅ `:root` contém TODAS fontes (--fd, --fu, --fm)
- [ ] ✅ `:root` contém easing (--ease, --spring)
- [ ] ✅ Sem hard-coded colors (#FFF, #000, #C8A44A)

### Componentes
- [ ] ✅ Buttons: sm/md/lg sizes definidos
- [ ] ✅ Badges: todos os tipos (gold, grn, red, blu, amb, cyan)
- [ ] ✅ Inputs: dark + light variants
- [ ] ✅ Cards: glass morphism ou solid

### Layout
- [ ] ✅ Sidebar: 252px width com --n2 bg
- [ ] ✅ Topbar: 46px height com rgba bg
- [ ] ✅ Main content: margin-left 252px
- [ ] ✅ Responsive: mobile breakpoint em 768px

### Fonts (Google Fonts)
```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Outfit:wght@200;300;400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600&display=swap" rel="stylesheet">
```
- [ ] ✅ Playfair Display: 400, 500, 600, 700, italic
- [ ] ✅ Outfit: 200, 300, 400, 500, 600, 700, 800
- [ ] ✅ JetBrains Mono: 300, 400, 500, 600

---

## 📋 ANTES DE SUBMETER — FINAL VERIFICATION

### 1. Buscar & Substituir (Ctrl+F)

Procurar por:
```
background: #
border: 1px solid rgba
font-weight: 400
font-weight: 500
font-size: 7px
color: #
rgba(255,255,255,.02
border-radius: 3px
border-radius: 4px
border-radius: 12px
border-radius: 14px
transition: all 0.1s
transition: all 0.2s
transition: all 0.5s
box-shadow: 0
```

Resultado esperado:
- Hard-coded colors: ZERO ou necessidade comprovada
- `rgba(255,255,255,.02`: ZERO (usar --bdr)
- font-weight 400/500: ZERO em labels/buttons
- Font-size 7px: ZERO em body (mínimo 10px)
- border-radius 3-4px: Usar 5-6px mínimo
- border-radius 12-14px: Usar 16px máximo
- transitions < 0.25s: Revisar necessidade

### 2. Inspecionar Tema Light

Abrir DevTools → Procurar `.L*` classes:
- [ ] ✅ `.Lbtn-pri`: `background: var(--La)` (navy)
- [ ] ✅ `.Lbtn-sec`: `border: 2px solid` (não rgba)
- [ ] ✅ `.Linp`: `border: 2px solid var(--Lb)`
- [ ] ✅ `.card-light`: `border: 2px solid var(--Lb)`

### 3. Validar Responsividade

```css
/* Em 768px e abaixo */
@media (max-width: 768px) {
  .sidebar { width: 0; }  /* ou hidden */
  .main { margin-left: 0; }
  .grid-4 { grid-template-columns: repeat(2, 1fr); }
}
```

- [ ] ✅ Layout não quebra em mobile
- [ ] ✅ Botões clicáveis (mínimo 44px height)
- [ ] ✅ Padding em devices pequenos

### 4. Performance Visual

- [ ] ✅ Sem flicker/jumps ao carregar
- [ ] ✅ Imagens otimizadas (SVG preferível)
- [ ] ✅ Scrollbar styled (--gd color)
- [ ] ✅ Sem overflow issues

### 5. Testes Finais

```javascript
// No console, verificar:
console.log(getComputedStyle(document.querySelector('.btn-pri')).backgroundColor)
// Deve retornar: rgb(11, 25, 40) — var(--n)

console.log(getComputedStyle(document.querySelector('.Lbtn-pri')).backgroundColor)
// Deve retornar: rgb(11, 25, 40) — var(--La)

console.log(getComputedStyle(document.querySelector('.Lbtn-sec')).borderWidth)
// Deve retornar: 2px
```

---

## 🎯 SUMÁRIO RÁPIDO — REGRAS DE OURO

| Aspecto | Dark Theme | Light Theme |
|---------|-----------|------------|
| **Background** | `var(--n2)` ou `var(--n3)` | `var(--L)` |
| **Text Primary** | `var(--w)` | `var(--Lt1)` |
| **Text Secondary** | `var(--t2)` | `var(--Lt2)` |
| **Border** | `1px solid var(--bdg)` | **2px solid var(--Lb)** ⭐ |
| **Button Primary BG** | `var(--n)` | `var(--La)` ⭐ |
| **Button Secondary BG** | `transparent` | `var(--Lc)` |
| **Accent Color** | `var(--gold)` | `var(--La)` |
| **Accent NUNCA em** | — | background fill |
| **Border Radius** | 6-8px | 6px |
| **Shadow** | var(--shd) | 0 2px 8px rgba(...) |
| **Font Display** | Playfair | Playfair |
| **Font Body** | Outfit | Outfit |
| **Font Data** | JetBrains Mono | JetBrains Mono |

---

## 📊 MÉTRICAS DE COMPLIANCE

```
✅ Compliance Checklist:
  Botões (Sem gold fill): [====] 100%
  Borders (Light 2px solid): [====] 100%
  Tipografia (Correto): [====] 100%
  Espaçamento (Consistente): [====] 100%
  Colors (Sem hard-code): [====] 100%
  
Total Branding Alignment: 100%
```

---

## 🚨 ESCALAÇÃO

Se houver conflito/discrepância:

1. **Dúvida sobre cores?** → Consultar `themes.dark.colors` e `themes.light.colors` no JSON
2. **Dúvida sobre buttons?** → Consultar `components.buttons.variants` no JSON
3. **Dúvida sobre spacing?** → Consultar `spacing` no JSON
4. **Caso não documentado?** → Seguir padrão mais próximo + avisar para update

---

**Versão:** 1.0 Final
**Última atualização:** Abril 2026
**Próxima revisão:** Semestral ou a pedido
