# 🎯 Guia de Implementação do Branding IMI

## 1. ESTRUTURA CSS OBRIGATÓRIA (Root Variables)

```css
:root {
  /* DARK THEME — Gold Accent */
  --bg: #060D16;
  --n: #0B1928;
  --n2: #0F2035;
  --n3: #142840;
  --n4: #1A3250;
  --n5: #1F3B5C;
  
  --gold: #C8A44A;
  --gold-b: #D4B86A;
  --gold-d: #A8842A;
  --g08: rgba(200,164,74,.08);
  --g15: rgba(200,164,74,.15);
  --g25: rgba(200,164,74,.25);
  
  --w: #FFF;
  --t1: #E8E4DC;
  --t2: #94A0B2;
  --t3: #556170;
  
  --grn: #4ADE80;
  --red: #F87171;
  --blu: #60A5FA;
  --amb: #FBBF24;
  --cyan: #22D3EE;
  
  --bdr: rgba(255,255,255,.06);
  --bdg: rgba(200,164,74,.18);
  --bdgh: rgba(200,164,74,.35);
  --shd: 0 4px 24px rgba(0,0,0,.35);
  --shdg: 0 0 40px rgba(200,164,74,.05);
  
  /* LIGHT THEME — Navy Accent */
  --L: #E8E4DB;
  --Lc: #FFFFFF;
  --Lr: #F0EDE5;
  --Lf: #D9D5CB;
  
  --Lt1: #0C1220;
  --Lt2: #2D3748;
  --Lt3: #5A6577;
  --La: #0B1928;
  --La2: #1E3A5F;
  --Lb: #B8B3A8;
  --Lb2: #948F84;
  
  --Lgrn: #047857;
  --Lred: #B91C1C;
  --Lblu: #1D4ED8;
  --Lamb: #92400E;
  
  /* TYPOGRAPHY */
  --fd: 'Playfair Display', Georgia, serif;
  --fu: 'Outfit', system-ui, sans-serif;
  --fm: 'JetBrains Mono', 'DM Mono', monospace;
  
  /* ANIMATION */
  --ease: cubic-bezier(.16,1,.3,1);
  --spring: cubic-bezier(.34,1.56,.64,1);
}
```

---

## 2. CHECKLIST DE PADRONIZAÇÃO

### 2.1 BOTÕES — REGRA OURO
❌ **NUNCA FAZER:**
- `background: var(--gold)` (fill inteiro)
- Bordas transparentes (rgba sem sólido)
- Font-weight < 600
- Transição > 0.35s

✅ **FAZER:**
```css
/* PRIMARY (Dark) */
.btn-pri {
  background: var(--n);
  color: var(--w);
  border: 1px solid rgba(255,255,255,.08);
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  padding: 10px 22px;
  font-size: 8px;
  border-radius: 6px;
  transition: all 0.25s var(--ease);
}
.btn-pri:hover {
  background: #0D1E32;
  border-color: var(--g20);
  transform: translateY(-1px);
}

/* PRIMARY (Light) — NUNCA usar gold */
.Lbtn-pri {
  background: var(--La);  /* Navy, não gold */
  color: var(--w);
  border: none;
  font-weight: 700;
  padding: 10px 22px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(11,25,40,.2);
}
.Lbtn-pri:hover {
  background: var(--La2);
  transform: translateY(-1px);
}

/* SECONDARY (Light) — 2px SOLID */
.Lbtn-sec {
  background: var(--Lc);  /* white */
  color: var(--La);       /* navy */
  border: 2px solid var(--Lb2);  /* SOLID 2px */
  font-weight: 700;
}
```

### 2.2 CORES — REGRA OURO
❌ **NUNCA:**
- Misturar gold dark + navy light no mesmo tema
- Usar rgba para borders em light theme (use 2px solid)
- Opacity < 0.08 para gold alpha

✅ **FAZER:**
```css
/* Dark Theme — Gold accent */
.card-dark {
  background: var(--n2);
  border: 1px solid var(--bdg);
  color: var(--t1);
}

/* Light Theme — Navy accent com bordas 2px solid */
.card-light {
  background: var(--L);
  border: 2px solid var(--Lb);  /* SEMPRE 2px solid */
  color: var(--Lt1);
}

/* Semantic colors — universais */
.success { color: var(--grn); }      /* dark */
.success-light { color: var(--Lgrn); } /* light */
```

### 2.3 TIPOGRAFIA — REGRA OURO
❌ **NUNCA:**
- Usar display para números/dados
- Monospace sem `font-variant-numeric: tabular-nums`
- Line-height < 1.5

✅ **FAZER:**
```css
/* Display — Apenas títulos/headings */
.h1 {
  font-family: var(--fd);
  font-size: 36px;
  font-weight: 600;
  line-height: 1.05;
  letter-spacing: -0.3px;
}

/* UI — Corpo do texto */
.body {
  font-family: var(--fu);
  font-size: 12px;
  font-weight: 400;
  line-height: 1.55;
}

/* Dados — SEMPRE monospace com tabular-nums */
.data {
  font-family: var(--fm);
  font-size: 20px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.5px;
}

/* Labels — uppercase com letter-spacing */
.label {
  font-family: var(--fu);
  font-size: 7.5px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
}
```

### 2.4 ESPAÇAMENTO — REGRA OURO
✅ **PADRÃO:**
```css
/* Gaps entre itens */
.flex-items { gap: 6px; }

/* Gaps entre grupos */
.flex-groups { gap: 12px; }

/* Gaps entre seções */
.flex-sections { gap: 24px; }

/* Padding padrão */
.card { padding: 22px; }
.input { padding: 9px 13px; }
.button { padding: 10px 22px; }
```

### 2.5 BORDAS & RADIUS — REGRA OURO
❌ **NUNCA:**
- Light theme: `border: 1px` (deve ser 2px solid)
- Dark theme: rgba sem `--bd*` variables
- Misturar border-radius (6px + 10px no mesmo componente)

✅ **FAZER:**
```css
/* Dark — Alpha variables */
.card-dark {
  border: 1px solid var(--bdg);
  border-radius: 6px;
}

/* Light — 2px SOLID */
.card-light {
  border: 2px solid var(--Lb);
  border-radius: 6px;
}

/* Pills/Badges */
.badge {
  border-radius: 99px;
  padding: 2px 7px;
}

/* Inputs */
.input {
  border-radius: 8px;
}
```

### 2.6 SHADOWS & GLOW — REGRA OURO
✅ **FAZER:**
```css
/* Default shadow */
.card {
  box-shadow: var(--shd);  /* 0 4px 24px rgba(0,0,0,.35) */
}

/* Gold glow (hover/active) */
.button:hover {
  box-shadow: var(--shdg);  /* 0 0 40px rgba(200,164,74,.05) */
}

/* Inset glass effect */
.glass {
  box-shadow: 0 8px 32px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.04);
}
```

### 2.7 ANIMAÇÕES — REGRA OURO
✅ **PADRÃO:**
```css
/* Transições padrão */
.interactive {
  transition: all 0.25s var(--ease);  /* Normal */
}

.glass-card {
  transition: all 0.35s var(--ease);  /* Slow para glass */
}

/* Easing functions */
--ease: cubic-bezier(.16,1,.3,1);    /* Smooth */
--spring: cubic-bezier(.34,1.56,.64,1); /* Bounce */

/* Hover states */
.button:hover {
  transform: translateY(-1px);
}
```

---

## 3. ANATOMIA DE COMPONENTES

### BOTÃO PRIMARY (Dark)
```html
<button class="btn btn-pri btn-md">
  Ação Principal
</button>
```
```css
.btn { display: inline-flex; align-items: center; gap: 6px; ... }
.btn-pri { background: var(--n); color: var(--w); border: 1px solid rgba(255,255,255,.08); }
.btn-md { padding: 10px 22px; font-size: 8px; border-radius: 6px; }
```

### BOTÃO PRIMARY (Light)
```html
<button class="Lbtn-pri">Ação Principal</button>
```
```css
.Lbtn-pri { background: var(--La); color: var(--w); border: none; box-shadow: 0 2px 8px rgba(11,25,40,.2); }
```

### CARD (Dark)
```html
<div class="card-dark">Conteúdo</div>
```
```css
.card-dark {
  background: var(--n2);
  border: 1px solid var(--bdg);
  border-radius: 6px;
  padding: 22px;
}
```

### CARD (Light)
```html
<div class="card-light">Conteúdo</div>
```
```css
.card-light {
  background: var(--L);
  border: 2px solid var(--Lb);  /* 2px SOLID */
  border-radius: 6px;
  padding: 22px;
}
```

### INPUT (Dark)
```html
<input class="inp" placeholder="Digitar...">
```
```css
.inp {
  background: rgba(20,36,64,.4);
  border: 1px solid var(--bdg);
  color: var(--t1);
  padding: 9px 13px;
  border-radius: 8px;
  font-size: 10.5px;
}
.inp:focus {
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgba(200,164,74,.08);
}
```

### INPUT (Light)
```html
<input class="Linp" placeholder="Digitar...">
```
```css
.Linp {
  background: var(--Lr);
  border: 2px solid var(--Lb);  /* 2px SOLID */
  color: var(--Lt1);
  padding: 10px 14px;
  border-radius: 6px;
  font-weight: 500;
}
.Linp:focus {
  border-color: var(--La);
  box-shadow: 0 0 0 4px rgba(11,25,40,.08);
}
```

### BADGE
```html
<span class="badge b-gold">Status</span>
```
```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  border-radius: 99px;
  font-size: 7px;
  font-weight: 600;
  letter-spacing: .5px;
  text-transform: uppercase;
}
.b-gold { background: var(--g10); color: var(--gold); border: 1px solid var(--g20); }
.b-grn { background: rgba(74,222,128,.06); color: var(--grn); border: 1px solid rgba(74,222,128,.12); }
```

---

## 4. PADRÕES COMUNS

### Flexbox Padrão
```css
.flex-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.flex-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
```

### Grid Padrão
```css
.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.grid-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
```

### Responsive
```css
@media (max-width: 768px) {
  .grid-4 { grid-template-columns: repeat(2, 1fr); }
  .grid-2 { grid-template-columns: 1fr; }
  .hidden-mobile { display: none; }
}
```

---

## 5. VERIFICAÇÃO FINAL (PRÉ-MERGE)

Antes de submeter código, verificar:

### Buttons
- [ ] Todos os botões primários usam `var(--n)` como background
- [ ] Nenhum botão tem `background: var(--gold)`
- [ ] Light theme buttons usam `var(--La)` (navy), não ouro
- [ ] Todos têm `font-weight: 600+` e `letter-spacing: 1px`
- [ ] Transições são `0.25s` (ou `0.35s` para glass)
- [ ] Hover tem `transform: translateY(-1px)`

### Colors
- [ ] Dark theme: Navy base + Gold accents
- [ ] Light theme: Beige base + Navy accents
- [ ] Nenhuma mistura de temas no mesmo componente
- [ ] Semantic colors aplicados (success/error/info/warning)

### Borders (Light Theme)
- [ ] TODOS os borders são `2px solid var(--Lb)` ou `var(--Lb2)`
- [ ] Zero `rgba` borders em light theme
- [ ] Raio consistente (6px ou 8px)

### Typography
- [ ] Display: Playfair Display para títulos
- [ ] UI: Outfit para corpo
- [ ] Data: JetBrains Mono com `font-variant-numeric: tabular-nums`
- [ ] Line-height >= 1.5
- [ ] Labels uppercase com letter-spacing

### Spacing
- [ ] Gaps: 6px (items), 12px (groups), 24px (sections)
- [ ] Padding: 9-13px (inputs), 10-22px (buttons), 18-22px (cards)
- [ ] Sem margin excessivo

### Shadows & Glow
- [ ] Cards usam `var(--shd)`
- [ ] Hover/active usam `var(--shdg)`
- [ ] Glass cards têm inset + shadow

---

## 6. EXEMPLO COMPLETO (BOTÃO + CARD)

```html
<div style="display: flex; gap: 24px; padding: 22px;">
  <!-- Card Dark -->
  <div style="background: var(--n2); border: 1px solid var(--bdg); border-radius: 6px; padding: 22px; flex: 1;">
    <div style="font-family: var(--fd); font-size: 18px; font-weight: 600; color: var(--w); margin-bottom: 12px;">
      Título
    </div>
    <div style="font-size: 12px; color: var(--t2); line-height: 1.55; margin-bottom: 16px;">
      Descrição do conteúdo com body text padrão.
    </div>
    <button style="display: inline-flex; align-items: center; gap: 6px; background: var(--n); color: var(--w); border: 1px solid rgba(255,255,255,.08); font-family: var(--fu); font-weight: 600; letter-spacing: 1px; text-transform: uppercase; padding: 10px 22px; font-size: 8px; border-radius: 6px; cursor: pointer; transition: all 0.25s var(--ease);">
      Ação Principal
    </button>
  </div>

  <!-- Card Light -->
  <div style="background: var(--L); border: 2px solid var(--Lb); border-radius: 6px; padding: 22px; flex: 1;">
    <div style="font-family: var(--fd); font-size: 18px; font-weight: 600; color: var(--Lt1); margin-bottom: 12px;">
      Título
    </div>
    <div style="font-size: 12px; color: var(--Lt2); line-height: 1.55; margin-bottom: 16px;">
      Descrição do conteúdo com body text padrão.
    </div>
    <button style="display: inline-flex; align-items: center; gap: 6px; background: var(--La); color: var(--w); border: none; font-family: var(--fu); font-weight: 700; letter-spacing: 1px; text-transform: uppercase; padding: 10px 22px; font-size: 8px; border-radius: 6px; cursor: pointer; transition: all 0.25s var(--ease); box-shadow: 0 2px 8px rgba(11,25,40,.2);">
      Ação Principal
    </button>
  </div>
</div>
```

---

## 7. TEMPLATE MÍNIMO (Para Começar)

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IMI App</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,400&family=Outfit:wght@300;400;600;700&family=JetBrains+Mono:wght@500;600&display=swap');
    
    :root {
      /* CORES — Copiar do JSON */
      --bg: #060D16;
      --n: #0B1928;
      --n2: #0F2035;
      --gold: #C8A44A;
      --gold-b: #D4B86A;
      --gold-d: #A8842A;
      --g08: rgba(200,164,74,.08);
      --g15: rgba(200,164,74,.15);
      --g25: rgba(200,164,74,.25);
      --w: #FFF;
      --t1: #E8E4DC;
      --t2: #94A0B2;
      --t3: #556170;
      --grn: #4ADE80;
      --red: #F87171;
      --bdr: rgba(255,255,255,.06);
      --bdg: rgba(200,164,74,.18);
      --shd: 0 4px 24px rgba(0,0,0,.35);
      --L: #E8E4DB;
      --Lc: #FFFFFF;
      --Lt1: #0C1220;
      --Lt2: #2D3748;
      --La: #0B1928;
      --Lb: #B8B3A8;
      --Lb2: #948F84;
      --fd: 'Playfair Display', Georgia, serif;
      --fu: 'Outfit', system-ui, sans-serif;
      --fm: 'JetBrains Mono', monospace;
      --ease: cubic-bezier(.16,1,.3,1);
    }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: var(--bg); color: var(--t1); font-family: var(--fu); line-height: 1.55; }
  </style>
</head>
<body>
  <!-- Seu conteúdo aqui -->
</body>
</html>
```

---

**Última atualização:** Abril 2026
**Versão:** 1.0 Final
