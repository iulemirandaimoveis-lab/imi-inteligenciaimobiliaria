# B11 — REDESIGN VISUAL COMPLETO
## Guia de Aplicação

---

## O QUE ESTE BLOCO FAZ

B11 é uma revisão visual completa do backoffice. Não adiciona features — corrige o design system inteiro:

### Problemas corrigidos
1. **Fundo cinza genérico** → Dark `#0D0F14` (semi-dark theme)
2. **Cores aleatórias nos cards** (roxo, azul, verde, laranja) → Sistema unificado gold + neutros escuros
3. **Badges grotescos** (vermelho/azul) → Status palette IMI: `#E8A87C` quente, `#C49D5B` morno, `#7B9EC4` frio
4. **Bottom nav 5 itens quebrado** → 4 itens + drawer corrigido no dark theme
5. **Marrom estranho no botão** → Gradient gold: `linear-gradient(135deg, #C49D5B, #8B5E1F)`
6. **Badge "LANÇAMENTO" azul royal** → Status unificado com paleta IMI
7. **Encoding errado** (Avaliacoes sem acento) → Texto corrigido em todas as páginas
8. **Cards sem identidade** → Glassmorphism: `rgba(26,30,42,0.70)` + borda 1px gold + blur 16px
9. **Sidebar/header desconectados no mobile** → Drawer com fundo dark, tipografia correta
10. **Input fields claros em fundo escuro** → Inputs dark com focus gold

---

## ARQUIVOS INCLUÍDOS

```
src/app/(backoffice)/layout.tsx                              ← dark bg #0D0F14
src/app/(backoffice)/components/DesktopSidebar.tsx           ← nav items redesenhados
src/app/(backoffice)/components/DesktopHeader.tsx            ← header dark + notifs
src/app/(backoffice)/components/MobileBottomNav.tsx          ← bottom nav corrigido
src/app/(backoffice)/backoffice/dashboard/DashboardClient.tsx ← KPI glassmorphism
src/app/(backoffice)/backoffice/leads/page.tsx               ← status badges unificados
src/app/(backoffice)/backoffice/imoveis/page.tsx             ← status + grid dark
src/app/(backoffice)/backoffice/avaliacoes/page.tsx          ← status colors corretos
src/app/(backoffice)/backoffice/relatorios/page.tsx          ← encoding + botões gold
src/app/globals-b11-additions.css                           ← additions to globals.css
```

---

## COMO APLICAR

### Passo 1 — Aplicar arquivos
Copie todos os arquivos mantendo a estrutura de pastas.
**Estes arquivos SUBSTITUEM os anteriores dos blocos B5-B9.**

### Passo 2 — Adicionar CSS ao globals.css
Abra `src/app/globals.css` e no FINAL do arquivo adicione:

```css
/* ── B11 BACKOFFICE DARK ADDITIONS ── */
@import './globals-b11-additions.css';
```

OU copie o conteúdo de `globals-b11-additions.css` direto ao final do arquivo.

### Passo 3 — Verificar layout.tsx
O layout do backoffice agora usa:
```tsx
<div className="backoffice-root min-h-screen" style={{ background: '#0D0F14' }}>
```
A classe `backoffice-root` ativa todos os tokens do CSS de dark theme.

### Passo 4 — Build e teste
```bash
npm run build
vercel --prod
```

---

## PALETA DE STATUS — REFERÊNCIA

| Status         | Cor texto  | Fundo              |
|----------------|------------|--------------------|
| Quente (hot)   | `#E8A87C`  | `rgba(232,168,124,0.12)` |
| Morno (warm)   | `#C49D5B`  | `rgba(196,157,91,0.12)`  |
| Frio (cold)    | `#7B9EC4`  | `rgba(123,158,196,0.12)` |
| Concluída      | `#6BB87B`  | `rgba(107,184,123,0.12)` |
| Em Andamento   | `#C49D5B`  | `rgba(196,157,91,0.12)`  |
| Aguard. Docs   | `#A89EC4`  | `rgba(168,158,196,0.12)` |
| Cancelada      | `#E57373`  | `rgba(229,115,115,0.12)` |
| Lançamento     | `#E8A87C`  | `rgba(232,168,124,0.12)` |

---

## GLASS CARD PADRÃO

Use este padrão em qualquer novo card KPI:

```tsx
<div style={{
  background: 'rgba(26,30,42,0.70)',
  border: '1px solid rgba(196,157,91,0.18)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.32), 0 1px 0 rgba(255,255,255,0.04) inset',
  borderRadius: 16,
}}>
```

---

## BOTÃO PRIMÁRIO PADRÃO

```tsx
<button style={{
  background: 'linear-gradient(135deg, #C49D5B, #8B5E1F)',
  boxShadow: '0 2px 12px rgba(196,157,91,0.30)',
  color: 'white',
}}>
```

---

## PRÓXIMOS PASSOS — B12

Após B11 aplicado e validado visualmente, B12 pode focar em:
- **A) Supabase real data** — substituir mock data por queries reais no Dashboard e Leads
- **B) Laudo PDF** — gerador NBR 14653 com assinatura e logo
- **C) Mobile polish** — otimizações específicas para telas <390px (iPhone SE)
