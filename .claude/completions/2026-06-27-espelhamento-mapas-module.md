# Módulo de Espelhamento de Mapas (Users Platform)

**Data:** 2026-06-27
**Branch:** `claude/espelhamento-mapas-feature`
**Épico:** 4/4 da sequência pós-Propostas.

## Escopo

Traz os **mapas de lotes JÁ EXISTENTES** para dentro do `/users`, **espelhando** (não recriando,
não fazendo scraping). Reutiliza o componente canônico `InteractiveLotMap`, que já tem
zoom/drag/filtros/hover/modal/tooltip e responsividade, e lê o **status ao vivo** de
`subdivision_lots` via `useLotMap` — portanto o espelho **atualiza sozinho** a cada mudança.

## Como o espelhamento funciona (decisão de CTO)

- **Geometria**: JSON estático existente (`/maps/<slug>-lots.json`), resolvido por
  `getDevelopmentBySlug(slug)` (registro único em `@/lib/lotmap/engine`).
- **Status**: lido AO VIVO de `subdivision_lots` pelo `useLotMap` (mesma fonte do site).
- Resultado: zero duplicação de dados, zero scraping, atualização automática.

## Status (paleta CRM reaproveitada)
Disponível · Reservado · Negociação · Vendido · Bloqueado — exatamente as cores do
`InteractiveLotMap` (`LOT_COLORS`).

## RBAC
- **Acesso**: `availability.read` (corretor tem). Sem novas permissões.

## Arquivos criados

- `src/app/users/map/page.tsx` — resolve a config de mapa por empreendimento do usuário (via `getDevelopmentBySlug`).
- `src/features/users/map/MapMirrorView.tsx` — chrome do console: seletor de empreendimento, legenda,
  e `InteractiveLotMap` (dynamic, ssr:false). Fallback elegante quando o mapa do empreendimento ainda não existe.

## Arquivos alterados

- `src/features/users/dashboard/DashboardChrome.tsx` — link de nav "Mapa" (gated por `availability.read`).

## Riscos / observações

- **Sem migração nova**; **sem recriação de mapa**; **sem scraping** (conforme o spec).
- Empreendimentos sem mapa no registro (`getDevelopmentBySlug` → null, ex.: Jazz Boulevard enquanto
  não publicado) exibem um estado vazio claro e passam a mostrar o mapa automaticamente quando publicado.
- Reuso direto do componente do site garante paridade visual/funcional e manutenção única.

## Validação

- `tsc --noEmit`: 0 erros · `next lint`: limpo · `next build`: rota `/users/map` compila.

---

## Update — Vista de Satélite (âncora confirmada pelo cliente)

Adicionada vista **satélite/aérea ultra realista** ao `/users/map`, com toggle
**Lotes ↔ Satélite**:
- `src/features/users/map/SatelliteMap.tsx` — MapLibre GL (já no projeto) + Esri
  World Imagery (tiles raster gratuitos, sem token) + camada de rótulos, controles
  (zoom/fullscreen/escala/atribuição) e marcador dourado na âncora.
- `src/features/users/map/anchors.ts` — âncora por slug. Alto Bellevue:
  **-8.875437, -36.510937** (Plus Code `4FFQ+RJ` → `69354FFQ+RJ`, Garanhuns/PE).
- O overlay georreferenciado dos LOTES sobre o satélite continua dependendo de
  ≥3 pontos de controle (`scripts/cad/geo/control-points.json` PENDING) — não
  inventado, conforme a regra do solver.
