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

## FX-11 · "Usuários não abre no backoffice" + "não mostra minha foto no perfil"
- **Sintoma**: dono clica em Configurações → Usuários e é redirecionado; avatar aparece como inicial "I".
- **Causa-raiz** (dados, não código): existem DUAS contas do dono — `iule@imi.com` e `iule.miranda@iulemirandaimoveis.com.br` — e o admin máster não estava completo em nenhum dos dois sistemas ao mesmo tempo. Backoffice usa `public.profiles.role` (`iule@imi.com`=admin, profissional=broker); console `/users` usa o schema `imi` (`imi.users.is_super`+`user_roles`) onde `iule@imi.com` **não tinha sequer linha em `imi.users`**. A foto estava presa só numa conta (avatar_url nulo nas demais). O dono logou com a conta profissional (role broker) → guard `['ADMIN','SUPER_ADMIN','OWNER']` em `/backoffice/settings/usuarios` redirecionava.
- **Afetou**: acesso admin do dono ao backoffice e ao console; foto de perfil.
- **Solução**: migration idempotente `20260706_owner_master_admin.sql` — consolida `iule@imi.com` como admin máster dos DOIS sistemas (`profiles.role=admin` + `imi.users.is_super=true` + papel `SUPER_ADMIN`) e propaga a foto; foto copiada também para a conta profissional. Aplicada em produção via MCP.
- **Prevenção**: admin do dono precisa existir nos DOIS sistemas simultaneamente (backoffice `profiles` + console `imi.users`). Antes de diagnosticar "página não abre", verificar `profiles.role` E `imi.users`/`is_super` do usuário logado.
- **Confiança**: alta (verificado no banco pós-migration: backoffice admin+foto, console is_super+SUPER_ADMIN+foto).

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

## FX-08 · LP do Jazz Boulevard com WhatsApp placeholder (leads perdidos)
- **Sintoma**: 3 CTAs da LP de investimento abriam `wa.me/5581999999999` — número inexistente; todo lead da LP morria em silêncio.
- **Causa-raiz**: placeholder de desenvolvimento nunca substituído; nenhum teste/grep guardava o número real (`5581986141487`).
- **Afetou**: conversão da LP `/imoveis/jazz-boulevard-garanhuns/lp` desde o lançamento da página.
- **Solução**: número real nos 3 links (sessão 2026-07-03); teste E2E `jazz-boulevard.spec.ts` falha se `5581999999999` reaparecer em qualquer uma das duas páginas.
- **Prevenção**: contatos/URLs de cliente viram constante única + gate E2E (mesmo padrão do link do Maps do AB).
- **Confiança**: alta (grep confirmou que o número real é o usado em todo o resto do site).

## FX-09 · Estado dessincronizado entre instâncias do carrinho de lotes
- **Sintoma**: adicionar lote na vista "Satélite + Lotes" não atualizava o FAB de proposta da vista "Satélite" (e vice-versa) até remontar.
- **Causa-raiz**: `useLotCart` hidratava do localStorage só no mount; múltiplas instâncias no mesmo page tree nunca se falavam (o PR #342 compartilhou a CHAVE, não o ESTADO).
- **Afetou**: fluxo de proposta no explorador do Alto Bellevue.
- **Solução**: evento custom `imi:lot-cart-sync` + listener `storage` (cross-tab) com corte de eco por serialização (P19); 6 testes jest.
- **Prevenção**: P19 em KNOWN_PATTERNS.
- **Confiança**: alta (testes reproduzem o bug e o anti-loop).

---
**Template para nova entrada**: sintoma / causa-raiz / afetou / solução / prevenção / confiança.
**Atualizado**: 2026-07-03

## FX-10 · Catálogo público /imoveis 100% vazio ("Portfólio em Curadoria")
- **Sintoma**: produção mostrava só o estado vazio; banco tinha 7 empreendimentos publicados.
- **Causa-raiz**: PR #334 adicionou `cover_video_url` ao select, mas a coluna só existia na
  migration manual `jazz_boulevard_EXECUTAR_NO_SUPABASE.sql` — executada em produção **parcialmente**
  (todas as outras colunas existiam, essa não). PostgREST → 42703 → query inteira falha → `data=null`
  → ImoveisClient cai no empty state. Sem alerta: só `console.error` no server.
- **Afetou**: vitrine pública inteira (todas as línguas), desde o deploy do #334.
- **Solução** (2026-07-04): coluna aplicada via MCP (`add_cover_video_url_to_developments`) +
  migration versionada `20260704_add_cover_video_url.sql` + fallback `CORE_SELECT` em
  `imoveis/page.tsx` (se o select completo falhar, refaz com colunas históricas — catálogo nunca zera).
- **Prevenção**: coluna nova em select de página pública ⇒ confirmar coluna em produção ANTES do deploy
  (via MCP `information_schema.columns`); migrations "EXECUTAR_NO_SUPABASE" são armadilha — versionar
  sempre em `YYYYMMDD_*.sql` e aplicar de imediato.
- **Confiança**: alta (reproduzido via SQL: select falhava antes, retorna 7 linhas depois).
