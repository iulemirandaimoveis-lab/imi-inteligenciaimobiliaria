-- ============================================================================
-- 20260702_f09_proposals_rls_hardening.sql
-- F-09 / F-10 — Hardening de public.proposals / public.proposal_events
--
-- ⚠️ CORREÇÃO DE DIAGNÓSTICO (verificado no banco de produção via MCP em 2026-07-02):
--   Ao contrário do que as migrations versionadas sugeriam, em PRODUÇÃO a RLS de
--   `public.proposals` e `public.proposal_events` JÁ ESTAVA HABILITADA, e todas as
--   policies exigem `auth.uid() IS NOT NULL` — ou seja, o papel `anon` já era
--   BLOQUEADO. Portanto o IDOR anônimo originalmente hipotetizado (severidade ALTA)
--   NÃO era explorável em produção. Efeito colateral real: o fluxo público de
--   aceite/tracking (cliente deslogado = anon) falhava silenciosamente sob RLS.
--
--   A correção de aplicação (autorização por token + service_role em
--   src/app/api/proposals/{respond,track} e src/app/p/[token]/page.tsx) é a que
--   FECHA o modelo corretamente e faz o fluxo público voltar a funcionar.
--
--   A ÚNICA mudança de banco necessária/segura é adicionar as colunas de tracking
--   que faltavam em `proposal_events` (os inserts antigos e novos falhavam sem elas).
--   NÃO alteramos policies: as de produção (auth_*_proposals, bo_full_*) já protegem
--   contra anon e a plataforma opera como single-org (ver F-11 em docs/SECURITY_AUDIT).
--
--   Esta migration foi APLICADA em produção (projeto zocffccwjjyelwrgunhu) em
--   2026-07-02 como `proposal_events_add_tracking_columns`. É idempotente.
-- ============================================================================

ALTER TABLE public.proposal_events ADD COLUMN IF NOT EXISTS time_on_page_seconds INTEGER;
ALTER TABLE public.proposal_events ADD COLUMN IF NOT EXISTS device_type TEXT;

-- ============================================================================
-- VERIFICAÇÃO (já executada; mantida para referência):
--   -- Todas as tabelas public estão com RLS habilitada? (K-13)
--   SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
--   WHERE n.nspname='public' AND c.relkind='r' AND c.relrowsecurity=false;  -- = 0 ✓
--
--   -- proposals: RLS on + policies exigem auth.uid() (anon negado) ✓
--   SELECT policyname, roles, cmd, qual FROM pg_policies
--   WHERE schemaname='public' AND tablename='proposals';
-- ============================================================================
