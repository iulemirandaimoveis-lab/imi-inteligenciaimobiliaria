# FAILURES — Registro de Falhas (causa-raiz + prevenção)

> Toda falha real entra aqui: sintoma → causa → sistemas afetados → solução → prevenção → confiança.

---

## FX-01 · Mapa não aparece no /users ("este empreendimento")
- **Sintoma**: console mostra fallback vazio apesar de dados corretos.
- **Causa-raiz** (dupla): (a) SW do PWA servindo HTML velho; (b) embed PostgREST retornando null sob RLS + policy morta em `imi.projects` (auto-referência).
- **Afetou**: console `/users/map`, confiança do cliente.
- **Solução**: NetworkFirst p/ `/users`, rewrite `/{locale}/users`, `getImiSession` com queries simples, migration `20260627_imi_projects_rls_member_fix.sql`.
- **Prevenção**: A2/A3 em KNOWN_PATTERNS; teste de RLS por papel (T-15).
- **Confiança**: alta (documentado em `docs/AUDITORIA_CTO_2026-06.md`).

## FX-02 · Botão de proposta escondido pela sticky bar (mobile)
- **Causa**: sticky sem reserva de espaço para o conteúdo mais longo.
- **Solução**: PR #342. **Prevenção**: L-11 + checklist RESPONSIVE_AUDIT item 3.

## FX-03 · Carrinho perdido ao alternar vistas do mapa
- **Causa**: estado dentro de cada vista, desmontado na troca.
- **Solução**: PR #342 (estado elevado). **Prevenção**: P9.

## FX-04 · Migrations com prefixos duplicados (12 conflitos)
- **Causa**: 3 convenções de nomenclatura simultâneas ao longo da história.
- **Estado**: baseline congelada (`20260317_production_unified_migration.sql`); mapa em `supabase/MIGRATIONS_MAP.md`.
- **Prevenção**: P12 (convenção única congelada).

## FX-05 · Vercel OOM em type-check no build
- **Causa**: grafo TS de ~1.200 arquivos + pacotes internos.
- **Solução**: type-check movido para CI; build ignora tipos (D-07).
- **Prevenção**: L-01; monitorar duração do job typecheck como proxy do crescimento do grafo.

## FX-06 · F-09 — hipótese de IDOR anônimo NÃO confirmada no banco (lição de verificação)
- **Hipótese inicial (ALTA)**: `public.proposals` teria policies mas sem `ENABLE ROW LEVEL SECURITY` (lido só das migrations) → anon mutaria proposta por UUID.
- **Verificação em produção (Supabase MCP, 2026-07-02)**: RLS estava **habilitada**; todas as policies exigem `auth.uid() IS NOT NULL` → **anon já bloqueado**. IDOR anônimo **não explorável**. `proposals` sequer tem `tenant_id`. K-13: 0 tabelas public com RLS off.
- **O que era real**: o fluxo público (anon) de aceite/tracking falhava silenciosamente sob RLS; e `proposal_events` faltavam colunas (inserts falhavam).
- **Solução aplicada**: autorização por token + service_role no app (correto e funcional) + migration mínima (só colunas). A migration que reescrevia policies foi **descartada** (referenciava `tenant_id` inexistente e removeria `bo_full_proposals`).
- **LIÇÃO (L-15)**: migrations versionadas ≠ estado real; verificar `pg_policies`/`relrowsecurity`/`columns` antes de mutar (A11 revisado).
- **Confiança**: alta (verificado diretamente no banco).

## FX-07 · Build quebrou ao usar isomorphic-dompurify em Server Component (T-07)
- **Sintoma**: `next build` falha em "Collecting page data" — `ENOENT: default-stylesheet.css` em `conteudo/[slug]/page.js`. tsc/lint/jest passavam (é erro de bundling, não de tipo).
- **Causa-raiz**: `isomorphic-dompurify` carrega **jsdom**; ao ser importado em um **Server Component** (`conteudo/[slug]` não tem 'use client'), o Next empacota o jsdom no bundle do servidor e o `readFileSync` do CSS interno do jsdom aponta para `.next/server/.../browser/default-stylesheet.css`, que não é traçado. Client Components (biblioteca) não quebram — usam o DOMPurify do browser.
- **Afeta**: build de produção (Vercel + CI job build).
- **Solução**: `experimental.serverComponentsExternalPackages: ['isomorphic-dompurify']` no next.config — mantém jsdom externo, require resolve de node_modules em runtime (CSS existe lá).
- **Prevenção (A13)**: pacotes baseados em jsdom/canvas/nativos usados em Server Components devem ir em `serverComponentsExternalPackages`. Ao adicionar dep server-side pesada, rodar `next build` (tsc/jest não pegam erro de bundling).
- **Confiança**: alta (erro e fix documentados do Next; CSS confirmado em node_modules).

---
**Template para nova entrada**: sintoma / causa-raiz / afetou / solução / prevenção / confiança.
**Atualizado**: 2026-07-02
