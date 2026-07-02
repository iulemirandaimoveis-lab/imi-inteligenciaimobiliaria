# UI_SYSTEM — Sistema de Interface

> Norma completa: `.claude/UI_DESIGN_STANDARDS.md` (OBRIGATÓRIA antes de qualquer UI).
> Política anti-regressão: `.claude/UI_REGRESSION_POLICY.md`. Este arquivo mapeia a implementação.

---

## Fundamentos

- **Grid 8pt**: todo espaçamento múltiplo de 4px (preferir 8px). Proibido `p-[13px]` sem justificativa.
- **Fontes** (`@fontsource`): Outfit Variable (UI), Cormorant Garamond Variable (display/luxo), DM Mono (dados), Geist.
- **Tema**: `next-themes` (claro/escuro) — 4 pontos de integração.
- **Toasts**: `sonner` (140 arquivos) — padrão único, não introduzir outro.
- **Ícones**: `lucide-react` + `@heroicons/react` (⚠️ duplicação conceitual; preferir lucide em código novo).
- **Animação**: framer-motion padrão; respeitar `prefers-reduced-motion` (hoje só 3 pontos usam — ver ACCESSIBILITY_REPORT).

## Inventário de Componentes

| Pasta | Conteúdo |
|---|---|
| `src/components/ui/` | Primitivos (botões, inputs, dialogs; radix-slot, cmdk) |
| `src/components/backoffice/` | Composições do admin |
| `src/components/imi/` | IMI Console (corretores) |
| `src/components/website/`, `home/`, `imoveis/`, `properties/` | Site público |
| `src/components/maps/` | Mapas (AerialSatelliteMap, viewers de lote) |
| `src/components/animate-ui/` | Animações reutilizáveis |
| `src/components/forms/` | Formulários RHF+zod |
| `src/components/pwa/` | Prompts de instalação/update |
| `src/components/widgets/`, `intelligence/`, `consultoria/`, `digital-twin/`, `brand/`, `providers/` | Nichos |

Catálogo detalhado por componente: manter em `.memory/REUSABLE_COMPONENTS.md`.

## Padrões Obrigatórios

1. Cards em grid: `h-full flex flex-col` + botões com `mt-auto`.
2. Touch targets ≥ 44px.
3. Estados obrigatórios em toda vista de dados: loading (skeleton), empty, error.
4. Imagens: `next/image` — há 45 `<img>` cruas no código legado (dívida; migrar ao tocar).
5. Antes de mudar layout existente: ler `UI_REGRESSION_POLICY.md` e comparar screenshots.

## Riscos Atuais de UI

- Componentes-página gigantes (AltoBellevuePlanView 160KB, tracking/page 104KB) misturam layout+estado+dados → alto risco de regressão visual ao editar. Ver REFACTOR_ROADMAP.
- Duas bibliotecas de ícones e dois motores de animação (framer/gsap) → deriva visual.
- RTL: locale `ar` existe; verificação de `dir="rtl"` e espelhamento pendente (RESPONSIVE_AUDIT).

---
**Última atualização**: 2026-07-02
