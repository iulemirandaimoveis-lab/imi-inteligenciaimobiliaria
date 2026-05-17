-- ============================================================================
-- Mano Imóveis — Estrutura Completa de Parceria
-- Corrige dados cadastrais + cria tabelas para:
--   • Contratos com imobiliárias parceiras
--   • Repasses de comissão
--   • Notas fiscais de serviços de corretagem
-- ============================================================================

-- ── 0. Corrigir financial_transactions: adicionar metadata e partner_agency_id ─
-- O campo metadata é inserido em /api/financeiro/comissao/route.ts mas a coluna
-- não existia na migration original, causando erro em runtime.

ALTER TABLE public.financial_transactions
  ADD COLUMN IF NOT EXISTS metadata          JSONB    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS partner_agency_id UUID     REFERENCES public.partner_agencies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ft_partner_agency ON public.financial_transactions(partner_agency_id);

-- ── 1. Adicionar colunas extras a partner_agencies ───────────────────────────

ALTER TABLE public.partner_agencies
  ADD COLUMN IF NOT EXISTS legal_name    TEXT,
  ADD COLUMN IF NOT EXISTS phone         TEXT,
  ADD COLUMN IF NOT EXISTS email         TEXT,
  ADD COLUMN IF NOT EXISTS website       TEXT,
  ADD COLUMN IF NOT EXISTS creci         TEXT,
  ADD COLUMN IF NOT EXISTS instagram     TEXT,
  ADD COLUMN IF NOT EXISTS contact_name  TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- ── 2. Corrigir dados da Mano Imóveis ────────────────────────────────────────
-- Contrato físico: SEVERINO JOSÉ ALVES PAES IMÓVEIS EIRELLE
-- CNPJ 09.856.046/0001-43 · Av. Dantas Barreto, 02, Centro, Garanhuns/PE

UPDATE public.partner_agencies
SET
  legal_name    = 'Severino José Alves Paes Imóveis Eirelle',
  cnpj          = '09.856.046/0001-43',
  address       = 'Av. Dantas Barreto, 02, Centro',
  city          = 'Garanhuns',
  state         = 'PE',
  phone         = '(87) 99828-0223',
  email         = 'vendas@manoimoveis.com.br',
  agency_type   = 'parceira',
  notes         = 'Imobiliária parceira principal. Gestores: Mateus (Médio/Alto Padrão) e Arcanjo (Loteamento). Foro: Garanhuns/PE.',
  updated_at    = now()
WHERE name = 'Mano Imóveis';

-- Corrigir locais de plantão para Garanhuns/PE
UPDATE public.duty_locations
SET city = 'Garanhuns', state = 'PE', updated_at = now()
WHERE name IN ('Mano Imóveis', 'Miguel Marques', 'Alto Bellevue');

-- ── 3. Tabela: partner_agency_contracts ──────────────────────────────────────
-- Armazena o contrato formal de prestação de serviços de corretagem
-- entre a IMI (contratado) e a imobiliária parceira (contratante)

CREATE TABLE IF NOT EXISTS public.partner_agency_contracts (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id                    UUID NOT NULL REFERENCES public.partner_agencies(id) ON DELETE CASCADE,

  -- Dados do contratado (IMI / pessoa física hoje, CNPJ futuro)
  contratado_nome              TEXT NOT NULL DEFAULT 'Jule Miranda da S. Bezerra',
  contratado_cpf               TEXT,
  contratado_cnpj              TEXT,               -- preenchido quando CNPJ da IMI for aberto
  contratado_creci             TEXT,
  contratado_estado_civil      TEXT,
  contratado_telefone          TEXT,
  contratado_email             TEXT,
  contratado_endereco          TEXT,
  contratado_banco             TEXT,
  contratado_agencia           TEXT,
  contratado_conta             TEXT,
  contratado_op                TEXT,

  -- Termos contratuais
  status                       TEXT NOT NULL DEFAULT 'ativo'
    CHECK (status IN ('ativo', 'suspenso', 'encerrado')),
  is_pj                        BOOLEAN NOT NULL DEFAULT false, -- false = PF atual
  data_assinatura              DATE,
  vigencia_inicio              DATE,
  vigencia_fim                 DATE,               -- NULL = prazo indeterminado
  prazo_indeterminado          BOOLEAN NOT NULL DEFAULT true,
  foro_cidade                  TEXT DEFAULT 'Garanhuns',
  foro_estado                  TEXT DEFAULT 'PE',

  -- Regras de comissão conforme contrato
  repasse_dias_uteis           INTEGER NOT NULL DEFAULT 3,
  prazo_pagamento_min_dias     INTEGER NOT NULL DEFAULT 12,
  prazo_pagamento_max_dias     INTEGER NOT NULL DEFAULT 30,
  observacoes                  TEXT,

  -- Documento digitalizado
  document_url                 TEXT,

  -- Metadados
  created_by                   UUID REFERENCES auth.users(id),
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pac_agency ON public.partner_agency_contracts(agency_id);
CREATE INDEX IF NOT EXISTS idx_pac_status  ON public.partner_agency_contracts(status);

-- ── 4. Tabela: commission_repasses ───────────────────────────────────────────
-- Rastreia cada repasse de comissão: construtora → imobiliária → IMI

CREATE TABLE IF NOT EXISTS public.commission_repasses (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id                  UUID REFERENCES public.partner_agency_contracts(id),
  agency_id                    UUID NOT NULL REFERENCES public.partner_agencies(id),

  -- Negócio
  empreendimento_id            UUID,               -- FK para products/properties (opcional)
  empreendimento_nome          TEXT NOT NULL,
  cliente_nome                 TEXT,
  numero_proposta              TEXT,

  -- Valores
  valor_venda                  DECIMAL(14,2) NOT NULL,
  percentual_comissao          DECIMAL(5,2) NOT NULL,
  valor_comissao_bruta         DECIMAL(14,2) NOT NULL,
  valor_repasse_liquido        DECIMAL(14,2),

  -- Status do fluxo (conforme Cláusula 5ª do contrato)
  status                       TEXT NOT NULL DEFAULT 'aguardando_nf'
    CHECK (status IN (
      'aguardando_nf',           -- aguardando emissão da NF
      'nf_emitida',              -- NF emitida, aguardando pagamento da construtora
      'pago_pela_construtora',   -- construtora pagou a imobiliária
      'repasse_disponivel',      -- imobiliária liberou o repasse (3 dias úteis)
      'repassado',               -- IMI recebeu o repasse
      'cancelado'
    )),

  -- Datas do fluxo
  data_venda                   DATE,
  data_nf_emissao              DATE,
  data_pagamento_construtora   DATE,
  data_repasse_prevista        DATE,     -- calculada: +3 dias úteis após pagamento
  data_repasse_realizada       DATE,

  -- Pagamento
  metodo_pagamento             TEXT DEFAULT 'transferencia',
  comprovante_url              TEXT,

  -- Referências
  nota_fiscal_id               UUID,     -- preenchido ao emitir NF
  financial_transaction_id     UUID,     -- referência em financial_transactions

  notes                        TEXT,
  created_by                   UUID REFERENCES auth.users(id),
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cr_agency   ON public.commission_repasses(agency_id);
CREATE INDEX IF NOT EXISTS idx_cr_contract ON public.commission_repasses(contract_id);
CREATE INDEX IF NOT EXISTS idx_cr_status   ON public.commission_repasses(status);
CREATE INDEX IF NOT EXISTS idx_cr_data_venda ON public.commission_repasses(data_venda DESC);

-- ── 5. Tabela: notas_fiscais ──────────────────────────────────────────────────
-- Gestão de NFS-e (Notas Fiscais de Serviços Eletrônicas) emitidas pela IMI

CREATE TABLE IF NOT EXISTS public.notas_fiscais (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Numeração
  numero                       TEXT,               -- número da NF emitida
  serie                        TEXT DEFAULT '1',
  nfse_numero                  TEXT,               -- número NFS-e da prefeitura
  codigo_verificacao           TEXT,

  -- Tipo
  tipo                         TEXT NOT NULL DEFAULT 'servico'
    CHECK (tipo IN ('servico', 'produto', 'misto')),

  -- Prestador (IMI)
  prestador_nome               TEXT NOT NULL DEFAULT 'Jule Miranda da S. Bezerra',
  prestador_cpf                TEXT DEFAULT '048.986.523-90',
  prestador_cnpj               TEXT,               -- preenchido quando CNPJ for aberto
  prestador_creci              TEXT DEFAULT '17933',
  prestador_endereco           TEXT,
  prestador_municipio          TEXT DEFAULT 'Garanhuns',
  prestador_uf                 TEXT DEFAULT 'PE',
  prestador_cep                TEXT,

  -- Tomador (imobiliária / construtora)
  tomador_nome                 TEXT NOT NULL,
  tomador_cpf_cnpj             TEXT,
  tomador_ie                   TEXT,
  tomador_endereco             TEXT,
  tomador_municipio            TEXT,
  tomador_uf                   TEXT,
  tomador_cep                  TEXT,
  tomador_email                TEXT,

  -- Serviço
  descricao_servico            TEXT NOT NULL DEFAULT 'Serviços de corretagem imobiliária — intermediação de compra e venda/locação de imóveis, conforme contrato',
  codigo_servico_lc116         TEXT DEFAULT '10.05',  -- LC 116: intermediação imobiliária
  aliquota_iss                 DECIMAL(5,2) DEFAULT 2.00,
  valor_servicos               DECIMAL(14,2) NOT NULL,
  deducoes                     DECIMAL(14,2) DEFAULT 0,
  base_calculo                 DECIMAL(14,2),
  valor_iss                    DECIMAL(14,2),
  valor_liquido                DECIMAL(14,2),
  iss_retido                   BOOLEAN DEFAULT false,

  -- Status
  status                       TEXT NOT NULL DEFAULT 'rascunho'
    CHECK (status IN ('rascunho', 'emitida', 'cancelada', 'substituida')),
  data_emissao                 DATE,
  data_competencia             DATE,
  motivo_cancelamento          TEXT,
  nf_substituta_id             UUID REFERENCES public.notas_fiscais(id),

  -- Referências
  repasse_id                   UUID REFERENCES public.commission_repasses(id),
  agency_id                    UUID REFERENCES public.partner_agencies(id),
  document_url                 TEXT,               -- PDF da NF
  observacoes                  TEXT,

  created_by                   UUID REFERENCES auth.users(id),
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nf_agency     ON public.notas_fiscais(agency_id);
CREATE INDEX IF NOT EXISTS idx_nf_repasse    ON public.notas_fiscais(repasse_id);
CREATE INDEX IF NOT EXISTS idx_nf_status     ON public.notas_fiscais(status);
CREATE INDEX IF NOT EXISTS idx_nf_emissao    ON public.notas_fiscais(data_emissao DESC);

-- Atualizar FK entre repasse e NF (agora que a tabela existe)
ALTER TABLE public.commission_repasses
  ADD CONSTRAINT fk_cr_nota_fiscal
  FOREIGN KEY (nota_fiscal_id) REFERENCES public.notas_fiscais(id);

-- ── 6. RLS ──────────────────────────────────────────────────────────────────

ALTER TABLE public.partner_agency_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_repasses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas_fiscais            ENABLE ROW LEVEL SECURITY;

-- Contratos de parceria: leitura para todos autenticados, escrita para admin
CREATE POLICY "pac_read_auth" ON public.partner_agency_contracts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "pac_write_admin" ON public.partner_agency_contracts
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

-- Repasses: leitura para todos autenticados, escrita para admin/manager
CREATE POLICY "cr_read_auth" ON public.commission_repasses
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "cr_write_admin" ON public.commission_repasses
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','broker_manager'))
  );

-- Notas fiscais: leitura para todos autenticados, escrita para admin/manager
CREATE POLICY "nf_read_auth" ON public.notas_fiscais
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "nf_write_admin" ON public.notas_fiscais
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','broker_manager'))
  );

-- ── 7. Seed: Contrato IMI × Mano Imóveis (pessoa física — Jule Miranda) ──────

INSERT INTO public.partner_agency_contracts (
  agency_id,
  contratado_nome,
  contratado_cpf,
  contratado_creci,
  contratado_estado_civil,
  contratado_telefone,
  contratado_email,
  contratado_banco,
  contratado_agencia,
  contratado_conta,
  contratado_op,
  status,
  is_pj,
  prazo_indeterminado,
  foro_cidade,
  foro_estado,
  repasse_dias_uteis,
  prazo_pagamento_min_dias,
  prazo_pagamento_max_dias,
  observacoes
)
SELECT
  pa.id,
  'Jule Miranda da S. Bezerra',
  '048.986.523-90',
  '17933',
  'Solteira',
  '(87) 98614-1487',
  'jule.miranda.imoveis@email.com',
  'BTG',
  '819',
  '870658-4',
  '020',
  'ativo',
  false,
  true,
  'Garanhuns',
  'PE',
  3,
  12,
  30,
  'Contrato atual na pessoa física de Jule Miranda (CRECI 17933). '
  'Será aditado para pessoa jurídica assim que o CNPJ da IMI for aberto. '
  'Conforme Cláusula 5ª: repasse em 3 dias úteis após pagamento da construtora. '
  'NF deve ser emitida previamente; prazo de pagamento entre 12 e 30 dias após emissão da NF.'
FROM public.partner_agencies pa
WHERE pa.name = 'Mano Imóveis'
ON CONFLICT DO NOTHING;
