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

---
**Template para nova entrada**: sintoma / causa-raiz / afetou / solução / prevenção / confiança.
**Atualizado**: 2026-07-02
