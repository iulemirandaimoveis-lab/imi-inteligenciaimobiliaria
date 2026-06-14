# UI/UX Design Standards — IMI Platform

> Padrões obrigatórios para todo desenvolvimento frontend.
> Baseados nas práticas de Stripe, Linear, Vercel, Apple, Figma e Airbnb Design.

---

## 1. Sistema de Espaçamento (8pt Grid)

**Regra de ouro**: todo espaçamento deve ser múltiplo de 4px. Prefira múltiplos de 8px.

| Token       | px  | Tailwind     | Uso                          |
|-------------|-----|--------------|------------------------------|
| `space-1`   | 4   | `p-1`        | Gap interno mínimo           |
| `space-2`   | 8   | `p-2`        | Gap entre ícone e label      |
| `space-3`   | 12  | `p-3`        | Padding compact de card      |
| `space-4`   | 16  | `p-4`        | Espaço padrão interno        |
| `space-5`   | 20  | `p-5`        | Padding padrão de card       |
| `space-6`   | 24  | `p-6`        | Seções de destaque           |
| `space-8`   | 32  | `p-8`        | Padding hero / seções        |
| `space-12`  | 48  | `py-12`      | Gap entre seções de página   |
| `space-20`  | 80  | `py-20`      | Espaço entre blocos maiores  |

**NUNCA use valores arbitrários sem motivo explícito** (e.g., `p-[13px]` quebra o grid).

---

## 2. Layout e Grid

### Princípios
- Cards lado a lado em grid **sempre** devem ter altura igual → usar `h-full flex flex-col` nos cards
- Buttons e CTAs de um card devem ficar na base → usar `mt-auto` na div de botões
- Grids de 2 colunas no mobile: `grid grid-cols-2 gap-3` com `items-stretch` (default do grid CSS)

### Padrão de Card com altura igual em grid
```tsx
// Container grid
<div className="grid grid-cols-2 gap-3">
  <CardA />
  <CardB />
</div>

// Cada card DEVE ter
<div className="rounded-2xl overflow-hidden flex flex-col h-full">
  <header className="flex-shrink-0">...</header>
  <div className="flex flex-col flex-1 p-3">
    {/* conteúdo variável */}
    <div className="mt-auto space-y-2">
      {/* botões sempre na base */}
    </div>
  </div>
</div>
```

### Layout de página (sidebar + main)
```tsx
// Desktop: 12 colunas
<div className="grid grid-cols-1 lg:grid-cols-12 gap-14">
  <main className="lg:col-span-8">...</main>
  <aside className="hidden lg:block lg:col-span-4">...</aside>
</div>
```

---

## 3. Tipografia

### Famílias de fonte do projeto
| Variável CSS          | Font          | Uso                                    |
|-----------------------|---------------|----------------------------------------|
| `var(--fu, 'Outfit')` | Outfit        | Labels, botões, UI text, headings      |
| `var(--fm, 'JetBrains Mono')` | JetBrains Mono | Números, preços, CRECI, dados técnicos |

### Hierarquia de tamanhos
```
Display  → text-[32px]+ / text-3xl+    → Preços, heroes
H1       → text-[24px] / text-2xl      → Título de página
H2       → text-[20px] / text-xl       → Seções
H3       → text-[17px]                 → Card titles
Body     → text-[14px] / text-sm       → Corpo de texto
Small    → text-[13px]                 → Labels secundários
XSmall   → text-[11px]                 → Legendas, meta
Micro    → text-[10px]                 → Labels uppercase, CRECI
```

### Regras
- Labels uppercase + tracking-widest sempre em `text-[10px]` ou `text-[11px]`
- Nunca usar `font-size` abaixo de 10px (ilegível em mobile)
- Preços, scores e métricas → sempre `JetBrains Mono`
- Botões → sempre `Outfit`, `font-bold`, `uppercase`, `tracking-wider`

---

## 4. Paleta de Cores (Design Tokens)

```
Background principal: #F7F5F2
Background card:      #FFFFFF
Background subtle:    #F8F6F2
Background muted:     #F0EDE5

Text primário:        #0B1928
Text secundário:      #2D3748
Text muted:           #5A6577
Text placeholder:     #948F84
Text disabled:        #B8B3A8

Border padrão:        rgba(184,179,168,0.3)
Border hover:         rgba(184,179,168,0.5)

Accent gold:          #C8A44A
Accent gold muted:    rgba(200,164,74,0.08)
Accent gold border:   rgba(200,164,74,0.22)

Success:              #10B981
Success bg:           rgba(16,185,129,0.06)
Success border:       rgba(16,185,129,0.15)

CTA primary bg:       #0B1928
CTA primary text:     #FFFFFF
CTA secondary bg:     #FFFFFF
CTA secondary border: #0B1928
```

---

## 5. Componentes — Regras por Tipo

### Botões
```tsx
// Primary (CTA principal)
className="flex items-center justify-center gap-1.5 w-full h-12 rounded-xl
           text-[11px] font-bold uppercase tracking-wider
           transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
style={{ background: '#0B1928', color: '#fff' }}

// Secondary (outline)
className="flex items-center justify-center gap-1.5 w-full h-12 rounded-xl
           text-[11px] font-bold uppercase tracking-wider
           transition-all duration-200 hover:bg-[#F8F6F2] active:scale-[0.98]"
style={{ background: '#FFFFFF', color: '#0B1928', border: '2px solid #0B1928' }}

// Compact (mobile/cards)
// → substituir h-12 por h-9, rounded-xl por rounded-lg, text-[11px] por text-[10px]
```

**Regras de botão:**
- Mínimo `h-9` (36px) em compact, `h-12` (48px) em default → área de toque adequada
- Sempre `gap-1.5` entre ícone e texto
- Ícones: `w-3.5 h-3.5` em compact, `w-4 h-4` em default
- `active:scale-[0.98]` em TODOS os botões interativos
- Nunca omitir `transition-all duration-200`

### Cards
```tsx
// Card padrão
className="rounded-2xl overflow-hidden"
style={{ background: '#FFFFFF', border: '1px solid rgba(184,179,168,0.3)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}

// Card com header destacado
<div className="px-5 py-3" style={{ background: '#F8F6F2', borderBottom: '1px solid rgba(184,179,168,0.2)' }}>
  <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#948F84' }}>Label</p>
</div>

// Card em grid → OBRIGATÓRIO h-full flex flex-col (ver seção 2)
```

### Labels / Eyebrows
```tsx
// Sempre esta combinação para labels de seção
<p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#948F84', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
  LABEL
</p>
```

### Badges de status
```tsx
// Badge verde (disponível, online, ativo)
<div className="flex items-center gap-1.5 px-3 py-2 rounded-lg"
     style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
  <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#10B981' }} />
  <span className="text-[10px] font-semibold" style={{ color: '#065F46' }}>Online</span>
</div>
```

---

## 6. Responsividade — Padrões Mobile-First

### Breakpoints (Tailwind padrão)
| Prefix | px    | Uso                             |
|--------|-------|---------------------------------|
| (none) | 0+    | Mobile base — sempre primeiro   |
| `sm:`  | 640+  | Tablets pequenos                |
| `md:`  | 768+  | Tablets                         |
| `lg:`  | 1024+ | Desktop — sidebar, grids        |
| `xl:`  | 1280+ | Desktop wide                    |

### Regras críticas
1. **Mobile-first obrigatório**: escrever a versão mobile sem prefix, desktop com `lg:`
2. Sidebar sempre `hidden lg:block` — NUNCA aparecer em mobile sem sticky bar separado
3. Grids de cards side-by-side no mobile: `grid-cols-2` com cards tendo `h-full`
4. Sticky bar mobile: sempre `lg:hidden` — não duplicar com desktop
5. `container-custom` para o wrapper de página (não usar `container` do Tailwind diretamente)

### Compact vs Default
- Quando um componente tem `compact` prop → mobile / sidebar compacto
- compact: padding `p-3`, botões `h-9 rounded-lg text-[10px]`, avatar `w-14 h-14`
- default: padding `p-5`, botões `h-12 rounded-xl text-[11px]`, avatar `w-[88px] h-[88px]`

---

## 7. Erros Mais Comuns de Layout (Não repita!)

### ❌ Cards sem h-full em grid
```tsx
// ERRADO — cards em grid ficam com alturas diferentes
<div className="grid grid-cols-2 gap-3">
  <CardA />  {/* sem h-full → altura pelo conteúdo */}
  <CardB />  {/* sem h-full → altura diferente */}
</div>
```
```tsx
// CORRETO
<div className="grid grid-cols-2 gap-3">
  <CardA />  {/* internamente: flex flex-col h-full */}
  <CardB />  {/* internamente: flex flex-col h-full */}
</div>
```

### ❌ Botões flutuantes no meio do card
```tsx
// ERRADO — botões não ancorados à base do card
<div className="flex flex-col h-full p-3">
  <header>...</header>
  <section>...</section>
  <div className="space-y-2">  {/* flutua no meio */}
    <Button />
  </div>
</div>
```
```tsx
// CORRETO — mt-auto empurra para a base
<div className="flex flex-col h-full p-3">
  <header>...</header>
  <section>...</section>
  <div className="space-y-2 mt-auto">  {/* ancorado à base */}
    <Button />
  </div>
</div>
```

### ❌ Ícones sem tamanho fixo
```tsx
// ERRADO — ícone sem w/h definidos pode quebrar layout
<MessageCircle />

// CORRETO
<MessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
```

### ❌ Texto sem truncate em espaço limitado
```tsx
// ERRADO — texto longo quebra o layout
<span>{broker.email}</span>

// CORRETO
<span className="truncate">{broker.email}</span>
```

### ❌ flex sem flex-shrink-0 em ícones dentro de flex
```tsx
// ERRADO — ícone pode encolher e ficar distorcido
<div className="flex items-center gap-2">
  <MapPin className="w-4 h-4" />
  <span className="truncate">Endereço muito longo aqui</span>
</div>

// CORRETO
<div className="flex items-center gap-2">
  <MapPin className="w-4 h-4 flex-shrink-0" />
  <span className="truncate">Endereço muito longo aqui</span>
</div>
```

---

## 8. Animações e Transições

### Padrões de transição
```tsx
// Hover em elementos interativos
className="transition-all duration-200"

// Clique em botões (feedback tátil)
className="active:scale-[0.98]"

// Hover em links/cards
className="transition-opacity hover:opacity-70"

// Accordions / collapsibles (Framer Motion)
initial={{ opacity: 0, height: 0 }}
animate={{ opacity: 1, height: 'auto' }}
exit={{ opacity: 0, height: 0 }}
transition={{ duration: 0.25, ease: 'easeInOut' }}
```

**Regras:**
- Nenhuma animação acima de `300ms` em UI interativo (sinal de lentidão)
- `ease-in-out` para accordions, `ease-out` para modals
- `active:scale-[0.98]` é obrigatório em todos os botões e CTAs
- Nunca usar `transition-all` em elementos com `height: auto` sem Framer Motion

---

## 9. Sombras (Box Shadow)

```
Shadow muito sutil:  0 1px 6px rgba(0,0,0,0.04)   → fact chips, pills
Shadow card:         0 2px 12px rgba(0,0,0,0.04)  → RealtorCard, cards secundários
Shadow card médio:   0 2px 16px rgba(0,0,0,0.06)  → DevelopmentCTA, cards primários
Shadow overlay:      0 4px 32px rgba(0,0,0,0.12)  → modals, dropdowns
```

Nunca usar sombras coloridas exceto para anéis de avatar gold: `0 0 0 3px rgba(200,164,74,0.2)`.

---

## 10. Acessibilidade Mínima

- Todo botão/link com ação não-textual deve ter `aria-label`
- Ícones decorativos: `aria-hidden="true"`
- Grupos de dados: `role="group" aria-label="descrição"`
- Links externos: sempre `target="_blank" rel="noopener noreferrer"`
- Imagens: sempre `alt` descritivo, nunca vazio para imagens de conteúdo
- Área de toque mínima: 36px (h-9) — nunca abaixo disso em mobile

---

## Checklist antes de commitar qualquer componente visual

- [ ] Cards em grid têm `h-full flex flex-col`?
- [ ] Botões têm `mt-auto` quando estão na base de um card flex?
- [ ] Ícones dentro de flex têm `flex-shrink-0`?
- [ ] Textos variáveis em espaço limitado têm `truncate`?
- [ ] Todos os botões têm `active:scale-[0.98]` e `transition-all duration-200`?
- [ ] Versão mobile foi pensada primeiro?
- [ ] Espaçamentos são múltiplos de 4px?
- [ ] Labels uppercase usam `text-[10px] font-bold tracking-widest uppercase`?
- [ ] Links externos têm `rel="noopener noreferrer"`?
- [ ] Área de toque mínima de 36px em todos os botões mobile?

---

**Last Updated**: 2026-06-14
**Baseado em**: Stripe Design, Linear App, Vercel Dashboard, Apple HIG, Figma UI Kit, Airbnb DLS
