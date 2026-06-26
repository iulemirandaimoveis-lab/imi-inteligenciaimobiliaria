-- ============================================================================
-- IMI AUTH ECOSYSTEM — PROPOSALS ENGINE (digitalização da "Proposta de Compra")
-- Date: 2026-06-26 (complements the IMI auth ecosystem)
-- ----------------------------------------------------------------------------
-- Digitaliza o formulário físico "MI GESTÃO / Mano Imóveis — Proposta de
-- Compra" num fluxo digital auditável, dentro do schema ISOLADO `imi`
-- (zero colisão com public.proposals / public.lot_proposals do backoffice).
--
-- Entidades:
--   imi.proposal_templates — engine de templates (NÃO hardcodar modelo).
--   imi.proposals          — proposta (workflow + form_data por template).
--   imi.proposal_events    — histórico/auditoria imutável da proposta.
--
-- Fluxo (papel → digital):
--   Corretor cria → associa cliente/produto/unidade → upload → submete →
--   Responsável do Produto aprova/rejeita → histórico → PDF → auditoria.
--
-- RBAC (reusa imi.has_permission):
--   proposals.read    → ver propostas
--   proposals.manage  → criar/editar (corretor cria as suas)
--   proposals.approve → aprovar/rejeitar (responsável do produto / gestor)
--
-- Idempotente. Rodar APÓS 20260626_imi_auth_ecosystem.sql.
-- ============================================================================

-- ============================================================================
-- 1. ENUM — status da proposta
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'imi_proposal_status') THEN
    CREATE TYPE imi.imi_proposal_status AS ENUM (
      'draft',         -- rascunho (corretor ainda preenchendo)
      'submitted',     -- enviada ao responsável do produto
      'under_review',  -- em análise
      'approved',      -- aprovada
      'rejected',      -- rejeitada
      'cancelled',     -- cancelada pelo corretor/gestor
      'expired'        -- reserva expirou (regra das 24h)
    );
  END IF;
END$$;

-- ============================================================================
-- 2. TABELAS
-- ============================================================================

-- 2.1 proposal_templates — engine de templates ------------------------------
-- O `schema` (JSONB) descreve grupos/campos do formulário, permitindo vários
-- modelos no futuro sem alteração de código.
CREATE TABLE IF NOT EXISTS imi.proposal_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT UNIQUE NOT NULL,         -- ex: 'mano-imoveis-compra'
  name        TEXT NOT NULL,                -- ex: 'Proposta de Compra — Mano Imóveis'
  version     INT NOT NULL DEFAULT 1,
  description TEXT,
  schema      JSONB NOT NULL DEFAULT '{}',  -- grupos + campos
  active      BOOLEAN NOT NULL DEFAULT true,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 proposals -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS imi.proposals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES imi.projects(id) ON DELETE CASCADE,
  template_id   UUID REFERENCES imi.proposal_templates(id) ON DELETE SET NULL,
  broker_id     UUID NOT NULL REFERENCES imi.users(id) ON DELETE CASCADE,  -- corretor criador
  status        imi.imi_proposal_status NOT NULL DEFAULT 'draft',

  -- Identificação rápida (denormalizada p/ listagem; verdade completa em form_data)
  client_name   TEXT NOT NULL,
  client_cpf    TEXT,
  client_email  TEXT,
  client_phone  TEXT,

  -- Imóvel / unidade
  loteamento    TEXT,
  unit_label    TEXT,                         -- ex: "Lote 12 / Quadra B"

  -- Condições comerciais
  total_amount  NUMERIC(14,2),                -- Valor R$
  down_payment  NUMERIC(14,2),                -- Sinal R$
  installments  TEXT,                         -- Parcelas (texto livre do formulário)

  -- Payload completo, dirigido pelo template
  form_data     JSONB NOT NULL DEFAULT '{}',

  -- Anexo (proposta escaneada / PDF) — usa o bucket de storage existente
  attachment_url  TEXT,
  attachment_path TEXT,

  -- PDF gerado (documento final)
  pdf_url       TEXT,

  -- Decisão do responsável do produto
  reviewed_by   UUID REFERENCES imi.users(id) ON DELETE SET NULL,
  reviewed_at   TIMESTAMPTZ,
  decision_note TEXT,

  -- Regra das 24h da "proposta de reserva" (Obs. do formulário)
  submitted_at  TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ,

  -- Dados fictícios (Master pode limpar): mock=true
  mock          BOOLEAN NOT NULL DEFAULT false,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_imi_proposals_project ON imi.proposals(project_id);
CREATE INDEX IF NOT EXISTS idx_imi_proposals_broker  ON imi.proposals(broker_id);
CREATE INDEX IF NOT EXISTS idx_imi_proposals_status  ON imi.proposals(status);
CREATE INDEX IF NOT EXISTS idx_imi_proposals_mock    ON imi.proposals(mock);
CREATE INDEX IF NOT EXISTS idx_imi_proposals_created ON imi.proposals(created_at DESC);

-- 2.3 proposal_events — histórico/auditoria imutável ------------------------
CREATE TABLE IF NOT EXISTS imi.proposal_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES imi.proposals(id) ON DELETE CASCADE,
  actor_id    UUID REFERENCES imi.users(id) ON DELETE SET NULL,
  type        TEXT NOT NULL,                 -- ex: 'created','submitted','approved','rejected','note','attachment'
  from_status imi.imi_proposal_status,
  to_status   imi.imi_proposal_status,
  note        TEXT,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_imi_prop_events_proposal ON imi.proposal_events(proposal_id, created_at);

-- updated_at triggers
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['proposal_templates','proposals'] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%1$s_updated_at ON imi.%1$s;
       CREATE TRIGGER trg_%1$s_updated_at BEFORE UPDATE ON imi.%1$s
       FOR EACH ROW EXECUTE FUNCTION imi.set_updated_at();', t);
  END LOOP;
END$$;

-- ============================================================================
-- 3. HELPER — pode o usuário atual ver esta proposta?
-- (criador, ou com proposals.read, ou membro do projeto da proposta)
-- ============================================================================
CREATE OR REPLACE FUNCTION imi.can_view_proposal(p_proposal_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = imi, public
AS $$
DECLARE
  uid UUID;
  prj UUID;
  brk UUID;
BEGIN
  SELECT id INTO uid FROM imi.users WHERE auth_user_id = auth.uid() LIMIT 1;
  IF uid IS NULL THEN RETURN false; END IF;

  SELECT project_id, broker_id INTO prj, brk FROM imi.proposals WHERE id = p_proposal_id;
  IF prj IS NULL THEN RETURN false; END IF;

  IF brk = uid THEN RETURN true; END IF;
  IF imi.has_permission('proposals.read', prj) THEN RETURN true; END IF;

  RETURN EXISTS (
    SELECT 1 FROM imi.project_users pu
    WHERE pu.project_id = prj AND pu.user_id = uid
  ) AND imi.has_permission('proposals.read');
END;
$$;
GRANT EXECUTE ON FUNCTION imi.can_view_proposal(UUID) TO authenticated;

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE imi.proposal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE imi.proposals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE imi.proposal_events    ENABLE ROW LEVEL SECURITY;

-- Templates: catálogo — qualquer autenticado lê; gestão por projects.manage/super.
DROP POLICY IF EXISTS "proposal_templates_read" ON imi.proposal_templates;
CREATE POLICY "proposal_templates_read" ON imi.proposal_templates FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "proposal_templates_write" ON imi.proposal_templates;
CREATE POLICY "proposal_templates_write" ON imi.proposal_templates FOR ALL TO authenticated
  USING (imi.is_super_admin() OR imi.has_permission('projects.manage'))
  WITH CHECK (imi.is_super_admin() OR imi.has_permission('projects.manage'));

-- Proposals:
--   read   → criador, ou proposals.read, ou membro do projeto com proposals.read
--   insert → proposals.manage E é o próprio corretor (broker_id = current_user)
--   update → criador com proposals.manage  OU  quem tem proposals.approve
--   delete → super admin (limpeza de mock / reset de ambiente)
DROP POLICY IF EXISTS "proposals_read" ON imi.proposals;
CREATE POLICY "proposals_read" ON imi.proposals FOR SELECT TO authenticated
  USING (
    broker_id = imi.current_user_id()
    OR imi.has_permission('proposals.read', project_id)
    OR (
      imi.has_permission('proposals.read')
      AND EXISTS (
        SELECT 1 FROM imi.project_users pu
        WHERE pu.project_id = proposals.project_id AND pu.user_id = imi.current_user_id()
      )
    )
  );

DROP POLICY IF EXISTS "proposals_insert" ON imi.proposals;
CREATE POLICY "proposals_insert" ON imi.proposals FOR INSERT TO authenticated
  WITH CHECK (
    imi.has_permission('proposals.manage')
    AND broker_id = imi.current_user_id()
  );

DROP POLICY IF EXISTS "proposals_update" ON imi.proposals;
CREATE POLICY "proposals_update" ON imi.proposals FOR UPDATE TO authenticated
  USING (
    (broker_id = imi.current_user_id() AND imi.has_permission('proposals.manage'))
    OR imi.has_permission('proposals.approve', project_id)
    OR imi.has_permission('proposals.approve')
  )
  WITH CHECK (
    (broker_id = imi.current_user_id() AND imi.has_permission('proposals.manage'))
    OR imi.has_permission('proposals.approve', project_id)
    OR imi.has_permission('proposals.approve')
  );

DROP POLICY IF EXISTS "proposals_delete" ON imi.proposals;
CREATE POLICY "proposals_delete" ON imi.proposals FOR DELETE TO authenticated
  USING (imi.is_super_admin());

-- Eventos: leitura por quem pode ver a proposta; insert por quem pode ver
-- (registro best-effort da própria ação); imutável (sem update/delete p/ não-super).
DROP POLICY IF EXISTS "proposal_events_read" ON imi.proposal_events;
CREATE POLICY "proposal_events_read" ON imi.proposal_events FOR SELECT TO authenticated
  USING (imi.can_view_proposal(proposal_id));
DROP POLICY IF EXISTS "proposal_events_insert" ON imi.proposal_events;
CREATE POLICY "proposal_events_insert" ON imi.proposal_events FOR INSERT TO authenticated
  WITH CHECK (imi.can_view_proposal(proposal_id));
DROP POLICY IF EXISTS "proposal_events_delete" ON imi.proposal_events;
CREATE POLICY "proposal_events_delete" ON imi.proposal_events FOR DELETE TO authenticated
  USING (imi.is_super_admin());

-- ============================================================================
-- 5. SEED — template "Mano Imóveis — Proposta de Compra" (do formulário físico)
-- ============================================================================
-- O schema espelha exatamente o papel fotografado (MI GESTÃO). Grupos e campos
-- são consumidos pela UI (engine) sem hardcode do modelo.
INSERT INTO imi.proposal_templates (key, name, version, description, schema)
VALUES (
  'mano-imoveis-compra',
  'Proposta de Compra — Mano Imóveis',
  1,
  'Digitalização do formulário físico MI GESTÃO (Proposta de Compra). Reserva válida por 24h.',
  $json$
  {
    "reserveHours": 24,
    "groups": [
      {
        "key": "comprador",
        "title": "Comprador",
        "fields": [
          { "key": "nome", "label": "Nome", "type": "text", "required": true },
          { "key": "rg", "label": "RG", "type": "text" },
          { "key": "cpf", "label": "CPF", "type": "text" },
          { "key": "data_nasc", "label": "Data de Nasc.", "type": "date" },
          { "key": "est_civil", "label": "Est. Civil", "type": "text" },
          { "key": "profissao", "label": "Profissão", "type": "text" }
        ]
      },
      {
        "key": "conjuge",
        "title": "Cônjuge",
        "fields": [
          { "key": "nome", "label": "Nome Cônjuge", "type": "text" },
          { "key": "rg", "label": "RG", "type": "text" },
          { "key": "cpf", "label": "CPF", "type": "text" },
          { "key": "data_nasc", "label": "Data de Nasc.", "type": "date" }
        ]
      },
      {
        "key": "contato",
        "title": "Contato & Endereço",
        "fields": [
          { "key": "email", "label": "E-mail", "type": "email" },
          { "key": "fone", "label": "Fone", "type": "tel" },
          { "key": "end_comercial", "label": "End. Comercial", "type": "text" },
          { "key": "end_residencial", "label": "End. Residencial", "type": "text" },
          { "key": "cep", "label": "CEP", "type": "text" },
          { "key": "bairro", "label": "Bairro", "type": "text" },
          { "key": "cidade", "label": "Cidade", "type": "text" }
        ]
      },
      {
        "key": "imovel",
        "title": "Imóvel",
        "fields": [
          { "key": "loteamento", "label": "Loteamento", "type": "text" },
          { "key": "lotes", "label": "Lote(s)", "type": "text" },
          { "key": "quadras", "label": "Quadra(s)", "type": "text" },
          { "key": "metragem", "label": "m²", "type": "text" }
        ]
      },
      {
        "key": "condicoes",
        "title": "Condições de Pagamento",
        "fields": [
          { "key": "valor", "label": "Valor R$", "type": "currency" },
          { "key": "sinal", "label": "Sinal R$", "type": "currency" },
          { "key": "entrada_sinal", "label": "Entrada / Sinal", "type": "text" },
          { "key": "reajuste", "label": "Reajuste", "type": "text" },
          { "key": "parcelas", "label": "Parcelas", "type": "text" },
          { "key": "vencimento_primeira", "label": "Vencimento 1ª Parcela", "type": "date" }
        ]
      },
      {
        "key": "referencias",
        "title": "Referências Pessoais",
        "repeat": 3,
        "fields": [
          { "key": "nome", "label": "Nome", "type": "text" },
          { "key": "endereco", "label": "Endereço", "type": "text" },
          { "key": "fone", "label": "Fone", "type": "tel" }
        ]
      },
      {
        "key": "intervenientes",
        "title": "Intervenientes",
        "fields": [
          { "key": "comprador", "label": "Comprador", "type": "text" },
          { "key": "corretor", "label": "Corretor", "type": "text" },
          { "key": "corretor_creci", "label": "Corretor / CRECI", "type": "text" },
          { "key": "imobiliaria", "label": "Imobiliária", "type": "text" },
          { "key": "imobiliaria_creci", "label": "Imobiliária / CRECI", "type": "text" }
        ]
      }
    ],
    "observacao": "Esta proposta de reserva tem validade de 24 horas, a contar da data de assinatura. Se neste prazo não houver efetivação do pagamento do sinal, ficará este cliente descompromissado pelo mesmo, liberando o(s) lote(s) acima citado(s) para nova reserva."
  }
  $json$::jsonb
)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  schema = EXCLUDED.schema,
  updated_at = NOW();

-- Garantir o schema `imi` exposto ao Data API (idempotente; as novas tabelas
-- herdam a exposição do schema).
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- DONE.
-- ============================================================================
