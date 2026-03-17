-- ============================================================
-- IMI PRODUCTION FIX — MIGRATION UNIFICADA v3
-- Data: 2026-03-17
-- Objetivo: Criar todas as 27 tabelas faltantes para o backoffice funcionar
-- NOTA: DROP + CREATE para garantir schema correto (tabelas NOVAS apenas)
-- EXECUTAR INTEIRO NO SQL EDITOR DO SUPABASE
-- ============================================================

-- ═══════════════════════════════════════════════════════════════
-- 0. EXTENSIONS
-- ═══════════════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ═══════════════════════════════════════════════════════════════
-- 0.5 LIMPAR objetos parcialmente criados (tabelas OU views)
-- Usa DO block para dropar cada objeto independente do tipo
-- ═══════════════════════════════════════════════════════════════
DO $$
DECLARE
  obj TEXT;
BEGIN
  FOR obj IN SELECT unnest(ARRAY[
    'v_proposals_with_score',
    'proposal_events', 'projeto_unidades', 'avaliacoes_kb_upload_queue',
    'valuation_requests', 'ai_tasks', 'daily_sales_stats', 'bank_accounts',
    'system_error_logs', 'widgets_config', 'consultorias', 'integration_configs',
    'media', 'page_views', 'tracking_sessions', 'market_reports', 'projetos',
    'ebooks', 'conteudos', 'avaliacoes', 'proposals', 'contratos',
    'financial_goals', 'financial_transactions', 'profiles', 'role_permissions',
    'brokers'
  ])
  LOOP
    -- Tenta dropar como view primeiro, depois como tabela
    EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', obj);
    EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', obj);
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- 1. BROKERS (Corretores)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.brokers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  creci TEXT,
  avatar_url TEXT,
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  role TEXT CHECK (role IN ('broker', 'broker_manager', 'admin')) DEFAULT 'broker',
  permissions TEXT[] DEFAULT ARRAY['dashboard'],
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);
CREATE INDEX idx_brokers_user_id ON brokers(user_id);
CREATE INDEX idx_brokers_email ON brokers(email);

-- ═══════════════════════════════════════════════════════════════
-- 2. ROLE_PERMISSIONS (RBAC)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  allowed BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, module, action)
);

INSERT INTO role_permissions (role, module, action, allowed) VALUES
  ('admin', 'dashboard', 'view', true),
  ('admin', 'leads', 'view', true), ('admin', 'leads', 'create', true), ('admin', 'leads', 'edit', true), ('admin', 'leads', 'delete', true),
  ('admin', 'imoveis', 'view', true), ('admin', 'imoveis', 'create', true), ('admin', 'imoveis', 'edit', true), ('admin', 'imoveis', 'delete', true),
  ('admin', 'campanhas', 'view', true), ('admin', 'campanhas', 'create', true), ('admin', 'campanhas', 'edit', true),
  ('admin', 'financeiro', 'view', true), ('admin', 'financeiro', 'create', true), ('admin', 'financeiro', 'edit', true),
  ('admin', 'construtoras', 'view', true), ('admin', 'construtoras', 'create', true), ('admin', 'construtoras', 'edit', true),
  ('admin', 'corretores', 'view', true), ('admin', 'corretores', 'create', true), ('admin', 'corretores', 'edit', true),
  ('admin', 'settings', 'view', true), ('admin', 'settings', 'edit', true),
  ('manager', 'dashboard', 'view', true), ('manager', 'leads', 'view', true), ('manager', 'leads', 'create', true), ('manager', 'leads', 'edit', true),
  ('manager', 'imoveis', 'view', true), ('manager', 'imoveis', 'create', true),
  ('agent', 'dashboard', 'view', true), ('agent', 'leads', 'view', true), ('agent', 'leads', 'create', true),
  ('agent', 'imoveis', 'view', true),
  ('viewer', 'dashboard', 'view', true), ('viewer', 'leads', 'view', true), ('viewer', 'imoveis', 'view', true)
ON CONFLICT (role, module, action) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- 3. PROFILES
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  phone TEXT,
  role TEXT DEFAULT 'admin',
  bio TEXT,
  company TEXT,
  creci TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- 4. FINANCIAL_TRANSACTIONS
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('receita', 'despesa', 'comissao', 'transferencia')),
  category TEXT,
  description TEXT,
  amount DECIMAL(14,2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado', 'agendado')),
  due_date DATE,
  paid_date DATE,
  reference_type TEXT,
  reference_id UUID,
  development_id UUID,
  lead_id UUID,
  broker_id UUID,
  payment_method TEXT,
  receipt_url TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_fin_tx_type ON financial_transactions(type);
CREATE INDEX idx_fin_tx_status ON financial_transactions(status);
CREATE INDEX idx_fin_tx_due_date ON financial_transactions(due_date);
CREATE INDEX idx_fin_tx_dev ON financial_transactions(development_id);

-- ═══════════════════════════════════════════════════════════════
-- 5. FINANCIAL_GOALS
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.financial_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  target_amount DECIMAL(14,2) NOT NULL,
  current_amount DECIMAL(14,2) DEFAULT 0,
  period_start DATE,
  period_end DATE,
  category TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- 6. CONTRATOS
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.contratos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'compra_venda',
  template_id TEXT,
  status TEXT DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'enviado', 'assinado', 'cancelado', 'expirado')),
  development_id UUID,
  lead_id UUID,
  broker_id UUID,
  valor DECIMAL(14,2),
  conteudo TEXT,
  html_content TEXT,
  pdf_url TEXT,
  assinatura_url TEXT,
  signed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_contratos_status ON contratos(status);
CREATE INDEX idx_contratos_dev ON contratos(development_id);

-- ═══════════════════════════════════════════════════════════════
-- 7. PROPOSALS
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  title TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired')),
  development_id UUID,
  lead_id UUID,
  broker_id UUID,
  unit_id UUID,
  valor_proposta DECIMAL(14,2),
  valor_entrada DECIMAL(14,2),
  parcelas INT,
  valor_parcela DECIMAL(14,2),
  condicoes TEXT,
  validade DATE,
  interest_score INT DEFAULT 0,
  views_count INT DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  response TEXT,
  responded_at TIMESTAMPTZ,
  pdf_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_proposals_token ON proposals(token);
CREATE INDEX idx_proposals_lead ON proposals(lead_id);
CREATE INDEX idx_proposals_status ON proposals(status);

-- ═══════════════════════════════════════════════════════════════
-- 8. PROPOSAL_EVENTS
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.proposal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('created', 'sent', 'viewed', 'downloaded', 'accepted', 'rejected', 'expired', 'follow_up')),
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_proposal_events_proposal ON proposal_events(proposal_id);

-- ═══════════════════════════════════════════════════════════════
-- 9. AVALIACOES
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.avaliacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT DEFAULT 'mercado' CHECK (tipo IN ('mercado', 'judicial', 'bancaria', 'seguro', 'inventario')),
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluida', 'entregue', 'cancelada')),
  solicitante_nome TEXT,
  solicitante_email TEXT,
  solicitante_telefone TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  bairro TEXT,
  cep TEXT,
  tipo_imovel TEXT,
  area_total DECIMAL(10,2),
  area_construida DECIMAL(10,2),
  valor_estimado DECIMAL(14,2),
  valor_final DECIMAL(14,2),
  metodologia TEXT,
  laudo_url TEXT,
  fotos TEXT[] DEFAULT '{}',
  observacoes TEXT,
  data_vistoria TIMESTAMPTZ,
  data_entrega TIMESTAMPTZ,
  avaliador_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_avaliacoes_status ON avaliacoes(status);

-- ═══════════════════════════════════════════════════════════════
-- 10. CONTEUDOS
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.conteudos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  tipo TEXT DEFAULT 'post' CHECK (tipo IN ('post', 'video', 'reels', 'story', 'carrossel', 'artigo', 'ebook', 'newsletter', 'podcast')),
  plataforma TEXT DEFAULT 'instagram',
  canal TEXT,
  status TEXT DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'revisao', 'agendado', 'publicado', 'arquivado')),
  conteudo TEXT,
  html_content TEXT,
  imagem_url TEXT,
  imagens TEXT[] DEFAULT '{}',
  video_url TEXT,
  tags TEXT[] DEFAULT '{}',
  hashtags TEXT[] DEFAULT '{}',
  data_publicacao TIMESTAMPTZ,
  visualizacoes INT DEFAULT 0,
  engajamento DECIMAL(5,2) DEFAULT 0,
  likes INT DEFAULT 0,
  shares INT DEFAULT 0,
  comments INT DEFAULT 0,
  development_id UUID,
  ai_generated BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_conteudos_status ON conteudos(status);
CREATE INDEX idx_conteudos_tipo ON conteudos(tipo);

-- ═══════════════════════════════════════════════════════════════
-- 11. EBOOKS
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.ebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  slug TEXT UNIQUE,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'published', 'archived')),
  cover_url TEXT,
  pdf_url TEXT,
  content JSONB DEFAULT '{}',
  chapters JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  target_audience TEXT,
  development_id UUID,
  downloads INT DEFAULT 0,
  leads_generated INT DEFAULT 0,
  ai_generated BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- 12. PROJETOS
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.projetos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT,
  descricao TEXT,
  cidade TEXT,
  estado TEXT,
  endereco TEXT,
  bairro TEXT,
  status TEXT DEFAULT 'estruturacao' CHECK (status IN ('estruturacao', 'pre_lancamento', 'lancamento', 'em_obras', 'pronto', 'entregue', 'arquivado')),
  fase TEXT,
  unidades INT DEFAULT 0,
  unidades_vendidas INT DEFAULT 0,
  area_total_m2 DECIMAL(12,2),
  vgv DECIMAL(14,2) DEFAULT 0,
  imagem_url TEXT,
  gallery_images TEXT[] DEFAULT '{}',
  brochure_url TEXT,
  video_url TEXT,
  plantas JSONB DEFAULT '[]',
  tabela_precos JSONB DEFAULT '[]',
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  data_lancamento DATE,
  data_entrega_prev DATE,
  construtora_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- 13. PROJETO_UNIDADES
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.projeto_unidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID NOT NULL,
  identificador TEXT NOT NULL,
  tipo TEXT,
  bloco TEXT,
  andar INT,
  area_privativa DECIMAL(10,2),
  area_total DECIMAL(10,2),
  quartos INT,
  suites INT,
  vagas INT,
  preco DECIMAL(14,2),
  status TEXT DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'reservado', 'vendido', 'bloqueado')),
  lead_id UUID,
  observacoes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_proj_unid_projeto ON projeto_unidades(projeto_id);
CREATE INDEX idx_proj_unid_status ON projeto_unidades(status);

-- ═══════════════════════════════════════════════════════════════
-- 14. MARKET_REPORTS
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.market_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT DEFAULT 'market_analysis',
  period TEXT,
  status TEXT DEFAULT 'draft',
  content TEXT,
  html_content TEXT,
  pdf_url TEXT,
  summary TEXT,
  metrics JSONB DEFAULT '{}',
  insights JSONB DEFAULT '[]',
  region TEXT,
  city TEXT DEFAULT 'Recife',
  ai_generated BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- 15. TRACKING_SESSIONS
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.tracking_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  visitor_id TEXT,
  page_url TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  device_type TEXT,
  browser TEXT,
  country TEXT,
  city TEXT,
  duration_seconds INT DEFAULT 0,
  pages_viewed INT DEFAULT 1,
  development_id UUID,
  lead_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_tracking_sessions_session ON tracking_sessions(session_id);
CREATE INDEX idx_tracking_sessions_dev ON tracking_sessions(development_id);

-- ═══════════════════════════════════════════════════════════════
-- 16. PAGE_VIEWS
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT,
  page_url TEXT NOT NULL,
  page_title TEXT,
  development_id UUID,
  referrer TEXT,
  utm_source TEXT,
  duration_seconds INT DEFAULT 0,
  scroll_depth INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_page_views_dev ON page_views(development_id);
CREATE INDEX idx_page_views_created ON page_views(created_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- 17. MEDIA
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  file_name TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  bucket TEXT DEFAULT 'media',
  folder TEXT,
  alt_text TEXT,
  tags TEXT[] DEFAULT '{}',
  development_id UUID,
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- 18. INTEGRATION_CONFIGS
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.integration_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  credentials JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'idle',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- 19. CONSULTORIAS
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.consultorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT DEFAULT 'investimento',
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'agendada', 'realizada', 'cancelada')),
  cliente_nome TEXT NOT NULL,
  cliente_email TEXT,
  cliente_telefone TEXT,
  assunto TEXT,
  descricao TEXT,
  data_agendada TIMESTAMPTZ,
  duracao_minutos INT DEFAULT 60,
  valor DECIMAL(10,2),
  notas TEXT,
  consultor_id UUID,
  lead_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- 20. WIDGETS_CONFIG
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.widgets_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_type TEXT NOT NULL,
  name TEXT,
  config JSONB DEFAULT '{}',
  theme TEXT DEFAULT 'dark',
  is_active BOOLEAN DEFAULT true,
  embed_code TEXT,
  allowed_domains TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- 21. SYSTEM_ERROR_LOGS
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.system_error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type TEXT,
  message TEXT,
  stack TEXT,
  url TEXT,
  user_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- 22. TABELAS MENORES
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bank_name TEXT,
  agency TEXT,
  account_number TEXT,
  pix_key TEXT,
  balance DECIMAL(14,2) DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.daily_sales_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  leads_count INT DEFAULT 0,
  proposals_count INT DEFAULT 0,
  contracts_count INT DEFAULT 0,
  revenue DECIMAL(14,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.ai_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  input JSONB DEFAULT '{}',
  output JSONB DEFAULT '{}',
  error TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE public.valuation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  property_type TEXT,
  address TEXT,
  city TEXT,
  area DECIMAL(10,2),
  purpose TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.avaliacoes_kb_upload_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT,
  file_url TEXT,
  status TEXT DEFAULT 'pending',
  topic_id UUID,
  processed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- 23. COLUNAS FALTANTES em developments
-- ═══════════════════════════════════════════════════════════════
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'developments') THEN
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS created_by UUID;
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS developer_id UUID;
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'apartamento';
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS status_comercial TEXT DEFAULT 'rascunho';
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS status_commercial TEXT DEFAULT 'draft';
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS condition TEXT;
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Brasil';
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS cep TEXT;
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS street TEXT;
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS street_number TEXT;
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS complement TEXT;
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS property_type TEXT;
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'apartment';
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS bedrooms INT DEFAULT 0;
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS bathrooms INT DEFAULT 0;
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS parking_spaces INT DEFAULT 0;
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS area_from DECIMAL(10,2);
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS area_to DECIMAL(10,2);
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS units_count INT DEFAULT 1;
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS available_units INT;
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS floor_count INT;
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS price_from DECIMAL(14,2);
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS price_to DECIMAL(14,2);
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS price_per_sqm DECIMAL(10,2);
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS image TEXT;
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS gallery_images TEXT[] DEFAULT '{}';
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS floor_plans TEXT[] DEFAULT '{}';
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS brochure_url TEXT;
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS video_short_url TEXT;
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS views_count INT DEFAULT 0;
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS leads_count INT DEFAULT 0;
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS inventory_score INT DEFAULT 0;
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS updated_by UUID;
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS delivery_date TEXT;
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS total_area DECIMAL(10,2);
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS private_area DECIMAL(10,2);
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS broker_id UUID;
  END IF;
END $$;

DO $$ BEGIN
  ALTER TABLE developments ALTER COLUMN developer DROP NOT NULL;
EXCEPTION WHEN undefined_column THEN NULL;
WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE developments ALTER COLUMN address DROP NOT NULL;
EXCEPTION WHEN undefined_column THEN NULL;
WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE developments ALTER COLUMN region DROP NOT NULL;
EXCEPTION WHEN undefined_column THEN NULL;
WHEN others THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- 24. COLUNAS FALTANTES em leads
-- ═══════════════════════════════════════════════════════════════
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads') THEN
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS origin TEXT DEFAULT 'website';
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS score INT DEFAULT 50;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_score INT DEFAULT 0;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_priority TEXT DEFAULT 'medium';
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS interest_type TEXT;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS interest_location TEXT;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS budget_min DECIMAL(14,2);
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS budget_max DECIMAL(14,2);
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS capital DECIMAL(14,2);
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'BR';
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'BRL';
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'pt';
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to UUID;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS user_id UUID;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_source TEXT;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- 25. COLUNAS FALTANTES em developers
-- ═══════════════════════════════════════════════════════════════
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'developers') THEN
    ALTER TABLE developers ADD COLUMN IF NOT EXISTS slug TEXT;
    ALTER TABLE developers ADD COLUMN IF NOT EXISTS legal_name TEXT;
    ALTER TABLE developers ADD COLUMN IF NOT EXISTS cnpj TEXT;
    ALTER TABLE developers ADD COLUMN IF NOT EXISTS address TEXT;
    ALTER TABLE developers ADD COLUMN IF NOT EXISTS city TEXT;
    ALTER TABLE developers ADD COLUMN IF NOT EXISTS state TEXT;
    ALTER TABLE developers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    ALTER TABLE developers ADD COLUMN IF NOT EXISTS instagram TEXT;
    ALTER TABLE developers ADD COLUMN IF NOT EXISTS linkedin TEXT;
    ALTER TABLE developers ADD COLUMN IF NOT EXISTS notes TEXT;
    ALTER TABLE developers ADD COLUMN IF NOT EXISTS numero TEXT;
    ALTER TABLE developers ADD COLUMN IF NOT EXISTS complemento TEXT;
    ALTER TABLE developers ADD COLUMN IF NOT EXISTS bairro TEXT;
    ALTER TABLE developers ADD COLUMN IF NOT EXISTS cep TEXT;
    ALTER TABLE developers ADD COLUMN IF NOT EXISTS pais TEXT DEFAULT 'Brasil';
    ALTER TABLE developers ADD COLUMN IF NOT EXISTS inscricao_estadual TEXT;
    ALTER TABLE developers ADD COLUMN IF NOT EXISTS inscricao_municipal TEXT;
    ALTER TABLE developers ADD COLUMN IF NOT EXISTS responsavel_nome TEXT;
    ALTER TABLE developers ADD COLUMN IF NOT EXISTS responsavel_cargo TEXT;
    ALTER TABLE developers ADD COLUMN IF NOT EXISTS responsavel_email TEXT;
    ALTER TABLE developers ADD COLUMN IF NOT EXISTS responsavel_telefone TEXT;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- 26. RLS
-- ═══════════════════════════════════════════════════════════════
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'brokers', 'role_permissions', 'profiles', 'financial_transactions',
    'financial_goals', 'contratos', 'proposals', 'proposal_events',
    'avaliacoes', 'conteudos', 'ebooks', 'projetos', 'projeto_unidades',
    'market_reports', 'tracking_sessions', 'page_views', 'media',
    'integration_configs', 'consultorias', 'widgets_config',
    'system_error_logs', 'bank_accounts', 'daily_sales_stats',
    'ai_tasks', 'valuation_requests', 'avaliacoes_kb_upload_queue'
  ])
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "bo_full_%s" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "bo_full_%s" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t, t);
    IF t IN ('projetos', 'ebooks', 'market_reports', 'conteudos', 'avaliacoes') THEN
      EXECUTE format('DROP POLICY IF EXISTS "pub_read_%s" ON public.%I', t, t);
      EXECUTE format('CREATE POLICY "pub_read_%s" ON public.%I FOR SELECT TO anon USING (true)', t, t);
    END IF;
    IF t IN ('consultorias', 'valuation_requests', 'page_views', 'tracking_sessions') THEN
      EXECUTE format('DROP POLICY IF EXISTS "pub_insert_%s" ON public.%I', t, t);
      EXECUTE format('CREATE POLICY "pub_insert_%s" ON public.%I FOR INSERT TO anon WITH CHECK (true)', t, t);
    END IF;
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- 27. STORAGE BUCKETS
-- ═══════════════════════════════════════════════════════════════
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('media', 'media', true, 52428800, ARRAY['image/jpeg','image/png','image/webp','image/gif','application/pdf','video/mp4'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 52428800;

INSERT INTO storage.buckets (id, name, public) VALUES ('developments', 'developments', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('content', 'content', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('developers', 'developers', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "media_public_read" ON storage.objects;
CREATE POLICY "media_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'media');

DROP POLICY IF EXISTS "media_auth_upload" ON storage.objects;
CREATE POLICY "media_auth_upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('media', 'developments', 'avatars', 'content', 'developers'));

DROP POLICY IF EXISTS "media_auth_update" ON storage.objects;
CREATE POLICY "media_auth_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id IN ('media', 'developments', 'avatars', 'content', 'developers'));

DROP POLICY IF EXISTS "media_auth_delete" ON storage.objects;
CREATE POLICY "media_auth_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id IN ('media', 'developments', 'avatars', 'content', 'developers'));

DROP POLICY IF EXISTS "public_buckets_read" ON storage.objects;
CREATE POLICY "public_buckets_read" ON storage.objects FOR SELECT USING (bucket_id IN ('developments', 'avatars', 'content', 'developers'));

-- ═══════════════════════════════════════════════════════════════
-- 28. VIEW para proposals
-- ═══════════════════════════════════════════════════════════════
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'developments')
  THEN
    CREATE OR REPLACE VIEW v_proposals_with_score AS
    SELECT
      p.*,
      l.name as lead_name,
      l.email as lead_email,
      l.phone as lead_phone,
      d.name as development_name
    FROM proposals p
    LEFT JOIN leads l ON p.lead_id = l.id
    LEFT JOIN developments d ON p.development_id = d.id;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- 29. GRANTS
-- ═══════════════════════════════════════════════════════════════
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

DO $$ BEGIN GRANT INSERT ON public.leads TO anon; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN GRANT INSERT ON public.consultorias TO anon; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN GRANT INSERT ON public.valuation_requests TO anon; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN GRANT INSERT ON public.page_views TO anon; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN GRANT INSERT ON public.tracking_sessions TO anon; EXCEPTION WHEN others THEN NULL; END $$;

-- ═══════════════════════════════════════════════════════════════
-- 30. FIM — Migration v3 completa
-- ═══════════════════════════════════════════════════════════════
