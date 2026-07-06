-- ============================================================================
-- Conciliação Bancária de Comissões — IMI × Mano Imóveis
-- Cria a estrutura para conectar as contas BTG (PF e PJ) da IMI, importar/
-- sincronizar extratos e conciliar os repasses de comissão (commission_repasses)
-- com os depósitos efetivamente recebidos.
--
-- Não guarda nenhum segredo (client_id/secret/tokens ficam em env vars ou na
-- tabela bank_oauth_tokens, que não tem NENHUMA policy — só supabaseAdmin
-- acessa, mesmo padrão de partner_api_keys/D-15).
-- ============================================================================

-- ── 1. bank_accounts — contas bancárias da IMI (recebedoras) ────────────────

CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  label               TEXT NOT NULL,                 -- ex: "BTG PF — Jule Miranda"
  holder_type         TEXT NOT NULL CHECK (holder_type IN ('pf', 'pj')),
  holder_name         TEXT,
  holder_document     TEXT,                          -- CPF ou CNPJ do titular

  bank_code           TEXT DEFAULT '208',             -- 208 = BTG Pactual
  bank_name            TEXT DEFAULT 'BTG Pactual',
  agencia             TEXT,
  conta               TEXT,

  -- Conector: 'manual' (import de extrato) ou 'btg_empresas_api' (OAuth2)
  provider            TEXT NOT NULL DEFAULT 'manual'
    CHECK (provider IN ('manual', 'btg_empresas_api')),
  env_prefix          TEXT,                          -- ex: 'BTG_PJ' — aponta pras env vars, nunca guarda segredo aqui
  connection_status   TEXT NOT NULL DEFAULT 'not_connected'
    CHECK (connection_status IN ('not_connected', 'connected', 'error')),
  last_sync_at        TIMESTAMPTZ,
  last_sync_error     TEXT,

  active              BOOLEAN NOT NULL DEFAULT true,
  notes               TEXT,

  created_by          UUID REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_holder_type ON public.bank_accounts(holder_type);

-- ── 2. bank_transactions — lançamentos do extrato (sincronizados ou importados) ─

CREATE TABLE IF NOT EXISTS public.bank_transactions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id       UUID NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,

  external_id           TEXT,                        -- id da transação na API do banco (null em import manual)
  source                TEXT NOT NULL DEFAULT 'manual_csv'
    CHECK (source IN ('btg_api', 'manual_csv')),

  amount                DECIMAL(14,2) NOT NULL,
  transaction_type      TEXT NOT NULL CHECK (transaction_type IN ('credito', 'debito')),
  description           TEXT,
  counterparty_name     TEXT,
  counterparty_document TEXT,                        -- CPF/CNPJ de quem pagou/recebeu
  transaction_date      DATE NOT NULL,

  raw_payload           JSONB DEFAULT '{}',
  reconciled            BOOLEAN NOT NULL DEFAULT false,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bt_account      ON public.bank_transactions(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_bt_date         ON public.bank_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_bt_reconciled   ON public.bank_transactions(reconciled) WHERE reconciled = false;
-- Não-parcial (mesmo com external_id NULL nas importações manuais, NULL <> NULL
-- em índice único então múltiplas linhas manuais convivem normalmente) — precisa
-- ser assim para servir de arbiter do `ON CONFLICT (bank_account_id, external_id)`
-- usado no upsert de sincronização (supabase-js não suporta índice parcial ali).
CREATE UNIQUE INDEX IF NOT EXISTS uq_bt_account_external
  ON public.bank_transactions(bank_account_id, external_id);

-- ── 3. commission_reconciliations — vínculo repasse ↔ transação bancária ────

CREATE TABLE IF NOT EXISTS public.commission_reconciliations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repasse_id            UUID NOT NULL REFERENCES public.commission_repasses(id) ON DELETE CASCADE,
  bank_transaction_id   UUID REFERENCES public.bank_transactions(id) ON DELETE SET NULL,

  score_match           NUMERIC(5,2) DEFAULT 0,
  metodo_match          TEXT,
  status                TEXT NOT NULL DEFAULT 'sugerido'
    CHECK (status IN ('sugerido', 'confirmado', 'rejeitado')),

  confirmed_by          UUID REFERENCES auth.users(id),
  confirmed_at          TIMESTAMPTZ,
  notes                 TEXT,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cre_repasse ON public.commission_reconciliations(repasse_id);
CREATE INDEX IF NOT EXISTS idx_cre_tx      ON public.commission_reconciliations(bank_transaction_id);
CREATE INDEX IF NOT EXISTS idx_cre_status  ON public.commission_reconciliations(status);
-- Um par (repasse, transação) só existe uma vez — permite upsert idempotente de sugestão/confirmação/rejeição
CREATE UNIQUE INDEX IF NOT EXISTS uq_cre_repasse_tx
  ON public.commission_reconciliations(repasse_id, bank_transaction_id);
-- Um repasse só pode ter uma conciliação CONFIRMADA por vez
CREATE UNIQUE INDEX IF NOT EXISTS uq_cre_repasse_confirmado
  ON public.commission_reconciliations(repasse_id) WHERE status = 'confirmado';

-- ── 4. bank_oauth_tokens — tokens OAuth2 (Authorization Code) do conector BTG ─
-- Sem NENHUMA policy: só supabaseAdmin (service role) acessa. Mesmo padrão de
-- partner_api_keys (D-15) — nunca exposto por nenhuma rota ao cliente.

CREATE TABLE IF NOT EXISTS public.bank_oauth_tokens (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id       UUID NOT NULL UNIQUE REFERENCES public.bank_accounts(id) ON DELETE CASCADE,

  access_token          TEXT NOT NULL,
  refresh_token         TEXT,
  expires_at            TIMESTAMPTZ NOT NULL,
  scope                 TEXT,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 5. RLS ───────────────────────────────────────────────────────────────────

ALTER TABLE public.bank_accounts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_transactions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_oauth_tokens         ENABLE ROW LEVEL SECURITY;
-- bank_oauth_tokens fica SEM policies de propósito (acesso só via service role).

CREATE POLICY "ba_read_admin" ON public.bank_accounts
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','broker_manager'))
  );
CREATE POLICY "ba_write_admin" ON public.bank_accounts
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

CREATE POLICY "bt_read_admin" ON public.bank_transactions
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','broker_manager'))
  );
CREATE POLICY "bt_write_admin" ON public.bank_transactions
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','broker_manager'))
  );

CREATE POLICY "cre_read_admin" ON public.commission_reconciliations
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','broker_manager'))
  );
CREATE POLICY "cre_write_admin" ON public.commission_reconciliations
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','broker_manager'))
  );

-- ── 6. Seed: contas BTG da IMI (PF atual + PJ pronta para quando o CNPJ abrir) ─

INSERT INTO public.bank_accounts (label, holder_type, holder_name, holder_document, bank_code, bank_name, agencia, conta, provider, env_prefix, connection_status, notes)
SELECT 'BTG PF — Jule Miranda', 'pf', 'Jule Miranda da S. Bezerra', '048.986.523-90', '208', 'BTG Pactual', '819', '870658-4', 'manual', NULL, 'not_connected',
  'Conta atual (pessoa física). BTG não oferece API pública de extrato para conta PF — conciliação por importação manual de extrato (CSV/OFX) até migrar para Open Finance.'
WHERE NOT EXISTS (SELECT 1 FROM public.bank_accounts WHERE label = 'BTG PF — Jule Miranda');

INSERT INTO public.bank_accounts (label, holder_type, holder_name, holder_document, bank_code, bank_name, agencia, conta, provider, env_prefix, connection_status, notes)
SELECT 'BTG PJ — IMI', 'pj', NULL, NULL, '208', 'BTG Pactual', NULL, NULL, 'btg_empresas_api', 'BTG_PJ', 'not_connected',
  'Conta pronta para quando o CNPJ da IMI for aberto no BTG Empresas. Conector via OAuth2 (client_credentials/authorization_code) — configurar BTG_PJ_CLIENT_ID/BTG_PJ_CLIENT_SECRET e concluir a conexão em Backoffice → Financeiro → Comissões → Contas Bancárias.'
WHERE NOT EXISTS (SELECT 1 FROM public.bank_accounts WHERE label = 'BTG PJ — IMI');
