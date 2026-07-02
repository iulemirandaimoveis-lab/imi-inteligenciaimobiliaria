# COMPONENT_RELATIONS — Relações e Acoplamentos

> Mapa de dependências ocultas e pontos de acoplamento que mordem. Atualizar quando um acoplamento novo for descoberto (geralmente via bug).

---

## Acoplamentos Críticos (mudou um lado ⇒ verificar o outro)

| Se mudar… | Verificar também | Por quê |
|---|---|---|
| `supabase/migrations/*` (schema) | `src/types/supabase.ts` (regenerar), `src/lib/imi-auth/rbac.ts` | tipos e RBAC espelham o banco |
| Seed de papéis/permissões (`20260626_imi_auth_ecosystem.sql`) | `rbac.ts` (mesmo PR) | fonte dupla intencional (D-04) |
| `src/middleware.ts` (rotas/locale) | `worker/` + config PWA, `vercel.json` | SW cacheia rotas; matcher exclui estáticos |
| Vistas de mapa (Plan/Geo/Satellite) | carrinho de proposta compartilhado | estado vive acima do alternador (lição PR #342) |
| JSON de lotes (`lotsData`, validadores) | `npm run validate:lots`, disponibilidade no banco | merge estático+dinâmico no viewer |
| `JazzBoulevardViewer` | usado no site público **e** no `/users/map` | fonte única — não duplicar |
| CSP (`next.config.js`) | mapas (tiles arcgis/carto/mapbox), Sentry, YouTube/Kuula | domínio novo de tile = CSP nova |
| `.env.local.example` | Vercel env vars + `docs/SETUP_*` | 154 linhas de env; drift comum |
| `src/lib/rate-limit.ts` limites | rotas `ai/*` (custo Anthropic) | limite frouxo = custo |
| Locale list (`middleware.ts`) | `src/dictionaries/*.json`, `[lang]` params, sitemap | 5 pontos que enumeram locales |

## Componentes Compartilhados de Alto Fan-in (mexer com cuidado)

- `src/components/ui/*` — primitivos usados em todos os mundos (site, backoffice, console).
- `src/lib/supabase/*` — TODOS os acessos a dados.
- `src/lib/imi-auth/server.ts` (`getImiSession`) — gate de todo o console `/users`.
- `sonner` toasts — 140 arquivos assumem o Toaster montado nos layouts raiz.
- `src/components/maps/AerialSatelliteMap.tsx` — genérico, sem tema, usado por múltiplos empreendimentos.

## Fronteiras Saudáveis (preservar)

- `packages/@imi/*` não importam de `src/` (motor CAD independente).
- `src/lib/imi-*` (console) separado de `src/lib/*` legado do backoffice.
- Digital twin isolado com feature flag + testes de isolamento (`__tests__/digital-twin/isolation.test.ts`, `production-intact.test.ts`) — padrão exemplar a replicar.

## Fragilidades Conhecidas

- Alterar layout de página monolítica (D-01) sem screenshot = risco alto de regressão silenciosa.
- Policies RLS falham retornando vazio, não erro → sintomas aparecem longe da causa (ver D-03).
- `next-pwa` intercepta navegações: bug "impossível" no cliente = suspeitar do SW primeiro (K-01).

---
**Última atualização**: 2026-07-02
