-- ============================================================================
-- 20260702_f09_proposals_rls_hardening.sql
-- F-09 (IDOR) — Defesa em profundidade para public.proposals / public.proposal_events
--
-- CONTEXTO: as policies tenant_*_proposals foram criadas em 20260319 mas a tabela
-- NUNCA teve `ENABLE ROW LEVEL SECURITY` — policies ficam inertes e o papel `anon`
-- herda o GRANT padrão do Supabase, permitindo IDOR (aceitar/contrapor proposta
-- alheia por UUID). Ver docs/SECURITY_AUDIT.md F-09 e .memory/FAILURES.md FX-06.
--
-- ESTRATÉGIA:
--   * A escrita pública (aceite/contraproposta/tracking) é feita EXCLUSIVAMENTE
--     pelo backend com service_role, APÓS validar o TOKEN secreto no handler
--     (src/app/api/proposals/{respond,track}, src/app/p/[token]/page.tsx).
--     service_role bypassa RLS → não precisa (e não deve ter) policy para anon.
--   * Habilitamos RLS e mantemos apenas policies para `authenticated` escopadas
--     por tenant/owner (backoffice/console). `anon` fica SEM policy → negado.
--
-- IDEMPOTENTE. NÃO-DESTRUTIVO. Requer aprovação para aplicar (regra do CLAUDE.md).
-- Rollback: `ALTER TABLE public.proposals DISABLE ROW LEVEL SECURITY;`
--           `ALTER TABLE public.proposal_events DISABLE ROW LEVEL SECURITY;`
-- ============================================================================

-- 0. Colunas usadas pelo tracking mas ausentes do schema versionado (evita erro
--    de insert; drift histórico provavelmente aplicado via dashboard).
ALTER TABLE public.proposal_events ADD COLUMN IF NOT EXISTS time_on_page_seconds INTEGER;
ALTER TABLE public.proposal_events ADD COLUMN IF NOT EXISTS device_type TEXT;

-- ----------------------------------------------------------------------------
-- 1. public.proposals — HABILITAR RLS (a correção central do F-09)
-- ----------------------------------------------------------------------------
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
-- FORCE garante que até o owner da tabela respeite as policies (defesa extra).
ALTER TABLE public.proposals FORCE ROW LEVEL SECURITY;

-- Leitura por membros do tenant (backoffice). (Recria de forma idempotente.)
DROP POLICY IF EXISTS "proposals_tenant_read" ON public.proposals;
CREATE POLICY "proposals_tenant_read" ON public.proposals
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (SELECT tu.tenant_id FROM public.tenant_users tu WHERE tu.user_id = auth.uid())
    OR broker_id = auth.uid()
    OR created_by = auth.uid()
  );

-- Escrita/edição por membros do tenant (backoffice cria/gerencia).
DROP POLICY IF EXISTS "proposals_tenant_insert" ON public.proposals;
CREATE POLICY "proposals_tenant_insert" ON public.proposals
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT tu.tenant_id FROM public.tenant_users tu WHERE tu.user_id = auth.uid())
    OR broker_id = auth.uid()
    OR created_by = auth.uid()
  );

DROP POLICY IF EXISTS "proposals_tenant_update" ON public.proposals;
CREATE POLICY "proposals_tenant_update" ON public.proposals
  FOR UPDATE TO authenticated
  USING (
    tenant_id IN (SELECT tu.tenant_id FROM public.tenant_users tu WHERE tu.user_id = auth.uid())
    OR broker_id = auth.uid()
    OR created_by = auth.uid()
  );

DROP POLICY IF EXISTS "proposals_tenant_delete" ON public.proposals;
CREATE POLICY "proposals_tenant_delete" ON public.proposals
  FOR DELETE TO authenticated
  USING (
    tenant_id IN (SELECT tu.tenant_id FROM public.tenant_users tu WHERE tu.user_id = auth.uid())
    OR created_by = auth.uid()
  );

-- Limpa as policies antigas (nomes de 20260319) se ainda existirem, para não
-- deixar duas famílias sobrepostas.
DROP POLICY IF EXISTS "tenant_read_proposals"   ON public.proposals;
DROP POLICY IF EXISTS "tenant_write_proposals"  ON public.proposals;
DROP POLICY IF EXISTS "tenant_update_proposals" ON public.proposals;
DROP POLICY IF EXISTS "tenant_delete_proposals" ON public.proposals;
DROP POLICY IF EXISTS "bo_full_proposals"       ON public.proposals;

-- NENHUMA policy para `anon`: a rota pública usa service_role após validar token.

-- ----------------------------------------------------------------------------
-- 2. public.proposal_events — HABILITAR RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.proposal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_events FORCE ROW LEVEL SECURITY;

-- Leitura por quem enxerga a proposta-mãe (backoffice/console).
DROP POLICY IF EXISTS "proposal_events_tenant_read" ON public.proposal_events;
CREATE POLICY "proposal_events_tenant_read" ON public.proposal_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.proposals p
      WHERE p.id = proposal_events.proposal_id
        AND (
          p.tenant_id IN (SELECT tu.tenant_id FROM public.tenant_users tu WHERE tu.user_id = auth.uid())
          OR p.broker_id = auth.uid()
          OR p.created_by = auth.uid()
        )
    )
  );

-- Inserção de eventos: apenas service_role (rota pública com token). Sem policy
-- para anon/authenticated → negado por padrão (o backend usa service_role).

-- ============================================================================
-- NOTAS DE VALIDAÇÃO (rodar no banco após aplicar — ver docs/TESTING_STRATEGY.md):
--
--   -- RLS realmente habilitada?
--   SELECT relname, relrowsecurity, relforcerowsecurity
--   FROM pg_class WHERE relname IN ('proposals','proposal_events');
--   -- espera relrowsecurity = true nas duas.
--
--   -- anon NÃO consegue UPDATE (deve afetar 0 linhas / erro de policy):
--   SET ROLE anon;
--   UPDATE public.proposals SET status='accepted' WHERE id='<uuid>';  -- 0 rows
--   RESET ROLE;
--
--   -- cross-tenant: usuário do tenant A não lê proposta do tenant B (0 rows).
-- ============================================================================
