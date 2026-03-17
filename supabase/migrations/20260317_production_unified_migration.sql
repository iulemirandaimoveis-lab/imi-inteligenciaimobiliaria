-- ============================================================
-- IMI MASTER MIGRATION — VERSÃO DEFINITIVA
-- Data: 2026-03-17
-- 30 tabelas + colunas faltantes + storage + RLS + seeds
-- Executar INTEIRO no SQL Editor do Supabase
-- ============================================================

-- ═══════════════════════════════════════════════════════
-- 0. EXTENSIONS
-- ═══════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════════
-- 1. BROKERS (15 refs)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.brokers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  creci TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive')),
  role TEXT DEFAULT 'broker' CHECK (role IN ('broker','broker_manager','admin')),
  permissions TEXT[] DEFAULT ARRAY['dashboard'],
  commission_rate DECIMAL(5,2) DEFAULT 3.00,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS idx_brokers_user_id ON brokers(user_id);
CREATE INDEX IF NOT EXISTS idx_brokers_email ON brokers(email);

-- ═══════════════════════════════════════════════════════
-- 2. ROLE_PERMISSIONS (8 refs)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  allowed BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, module, action)
);

-- ═══════════════════════════════════════════════════════
-- 3. PROFILES (7 refs)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- ═══════════════════════════════════════════════════════
-- 4. FINANCIAL_TRANSACTIONS (20 refs)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('receita','despesa','comissao','transferencia')),
  category TEXT,
  subcategory TEXT,
  description TEXT,
  amount DECIMAL(14,2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente','pago','atrasado','cancelado','agendado')),
  due_date DATE,
  paid_date DATE,
  recurrence TEXT CHECK (recurrence IN ('once','monthly','quarterly','yearly')),
  reference_type TEXT,
  reference_id UUID,
  development_id UUID REFERENCES developments(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  broker_id UUID,
  payment_method TEXT,
  receipt_url TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fin_tx_type ON financial_transactions(type);
CREATE INDEX IF NOT EXISTS idx_fin_tx_status ON financial_transactions(status);
CREATE INDEX IF NOT EXISTS idx_fin_tx_due ON financial_transactions(due_date);

-- ═══════════════════════════════════════════════════════
-- 5. FINANCIAL_GOALS (3 refs)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.financial_goals (
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

-- ═══════════════════════════════════════════════════════
-- 6. BANK_ACCOUNTS (1 ref)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bank_name TEXT,
  bank_code TEXT,
  agency TEXT,
  account_number TEXT,
  account_type TEXT DEFAULT 'corrente',
  pix_key TEXT,
  pix_key_type TEXT,
  balance DECIMAL(14,2) DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- 7. CONTRATOS (13 refs)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.contratos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT,
  tipo TEXT DEFAULT 'compra_venda',
  numero TEXT,
  categoria TEXT,
  modelo_id TEXT,
  modelo_nome TEXT,
  template_id TEXT,
  status TEXT DEFAULT 'rascunho',
  idioma TEXT DEFAULT 'pt-BR',
  -- Partes
  contratante JSONB DEFAULT '{}',
  contratado JSONB DEFAULT '{}',
  partes JSONB DEFAULT '[]',
  dados_contrato JSONB DEFAULT '{}',
  clausulas JSONB DEFAULT '[]',
  signatarios JSONB DEFAULT '[]',
  -- Conteúdo
  conteudo TEXT,
  conteudo_markdown TEXT,
  html_content TEXT,
  -- Idiomas
  idioma_primario TEXT DEFAULT 'pt',
  idiomas_adicionais TEXT[] DEFAULT '{}',
  conteudo_adicional JSONB DEFAULT '{}',
  -- Documentos
  pdf_url TEXT,
  docx_url TEXT,
  drive_url TEXT,
  gdrive_url TEXT,
  assinatura_url TEXT,
  assinatura_provider TEXT DEFAULT 'clicksign',
  plataforma_assinatura TEXT,
  -- Referências
  development_id UUID REFERENCES developments(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  broker_id UUID,
  valor DECIMAL(14,2),
  -- Datas
  signed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  -- Auditoria
  notas TEXT,
  tags TEXT[] DEFAULT '{}',
  criado_por TEXT,
  criado_por_nome TEXT,
  created_by UUID REFERENCES auth.users(id),
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contratos_status ON contratos(status);

-- ═══════════════════════════════════════════════════════
-- 8. PROPOSALS (11 refs)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  title TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','viewed','accepted','rejected','expired','negotiating')),
  development_id UUID REFERENCES developments(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  broker_id UUID,
  unit_id UUID,
  valor_proposta DECIMAL(14,2),
  valor_entrada DECIMAL(14,2),
  parcelas INT,
  valor_parcela DECIMAL(14,2),
  financiamento_tipo TEXT,
  condicoes TEXT,
  validade DATE,
  interest_score INT DEFAULT 0,
  views_count INT DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  response TEXT,
  responded_at TIMESTAMPTZ,
  pdf_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_proposals_token ON proposals(token);
CREATE INDEX IF NOT EXISTS idx_proposals_lead ON proposals(lead_id);

-- ═══════════════════════════════════════════════════════
-- 9. PROPOSAL_EVENTS (7 refs)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.proposal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('created','sent','viewed','downloaded','accepted','rejected','expired','follow_up','proposal_sent','negotiation')),
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_prop_ev_proposal ON proposal_events(proposal_id);

-- ═══════════════════════════════════════════════════════
-- 10. AVALIACOES (10 refs)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.avaliacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo TEXT,
  tipo TEXT DEFAULT 'mercado',
  status TEXT DEFAULT 'pendente',
  -- Cliente
  solicitante_nome TEXT,
  solicitante_email TEXT,
  solicitante_telefone TEXT,
  cliente_nome TEXT,
  cliente_email TEXT,
  cliente_telefone TEXT,
  cliente_cpf_cnpj TEXT,
  cliente_tipo TEXT DEFAULT 'PF',
  solicitante_instituicao TEXT,
  -- Localização
  endereco TEXT,
  complemento TEXT,
  cidade TEXT DEFAULT 'Recife',
  estado TEXT DEFAULT 'PE',
  bairro TEXT,
  cep TEXT,
  -- Imóvel
  tipo_imovel TEXT,
  area_total DECIMAL(10,2),
  area_construida DECIMAL(10,2),
  area_terreno DECIMAL(10,2),
  area_privativa DECIMAL(10,2),
  quartos INT,
  banheiros INT,
  vagas INT,
  andar TEXT,
  ano_construcao TEXT,
  padrao TEXT,
  estado_conservacao TEXT,
  caracteristicas JSONB,
  -- Avaliação
  finalidade TEXT,
  metodologia TEXT,
  grau_fundamentacao TEXT,
  grau_precisao TEXT,
  valor_estimado DECIMAL(14,2),
  valor_final DECIMAL(14,2),
  comparaveis JSONB,
  laudo_url TEXT,
  fotos TEXT[] DEFAULT '{}',
  -- Financeiro
  honorarios DECIMAL(10,2),
  forma_pagamento TEXT,
  -- Prazos
  prazo_entrega TEXT,
  data_vistoria TIMESTAMPTZ,
  data_entrega TIMESTAMPTZ,
  observacoes TEXT,
  avaliador_id UUID REFERENCES auth.users(id),
  development_id UUID REFERENCES developments(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- 11. CONTEUDOS (7 refs)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.conteudos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  tipo TEXT DEFAULT 'post' CHECK (tipo IN ('post','video','reels','story','carrossel','artigo','ebook','newsletter','podcast')),
  plataforma TEXT DEFAULT 'instagram',
  canal TEXT,
  status TEXT DEFAULT 'rascunho' CHECK (status IN ('rascunho','revisao','agendado','publicado','arquivado')),
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
  comments_count INT DEFAULT 0,
  development_id UUID REFERENCES developments(id) ON DELETE SET NULL,
  ai_generated BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- 12. EBOOKS (8 refs)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.ebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  slug TEXT UNIQUE,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','generating','review','published','archived')),
  cover_url TEXT,
  cover_image TEXT,
  pdf_url TEXT,
  content JSONB DEFAULT '{}',
  chapters JSONB DEFAULT '[]',
  pilar TEXT,
  tags TEXT[] DEFAULT '{}',
  target_audience TEXT,
  publication_status TEXT DEFAULT 'em_breve',
  featured BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  release_date DATE,
  amazon_link TEXT,
  amazon_url TEXT,
  development_id UUID REFERENCES developments(id) ON DELETE SET NULL,
  downloads INT DEFAULT 0,
  leads_generated INT DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  ai_generated BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- 13. PROJETOS (5 refs)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.projetos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT,
  descricao TEXT,
  cidade TEXT,
  estado TEXT,
  endereco TEXT,
  bairro TEXT,
  status TEXT DEFAULT 'estruturacao' CHECK (status IN ('estruturacao','pre_lancamento','lancamento','em_obras','pronto','entregue','arquivado')),
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
  construtora_id UUID REFERENCES developers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- 14. PROJETO_UNIDADES (6 refs)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.projeto_unidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id UUID NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
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
  status TEXT DEFAULT 'disponivel' CHECK (status IN ('disponivel','reservado','vendido','bloqueado')),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  observacoes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_proj_unid_proj ON projeto_unidades(projeto_id);

-- ═══════════════════════════════════════════════════════
-- 15. MARKET_REPORTS (10 refs)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.market_reports (
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
  is_published BOOLEAN DEFAULT false,
  ai_generated BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- 16. MARKET_INDICATORS (5 refs)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.market_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  metric_name TEXT,
  slug TEXT UNIQUE,
  description TEXT,
  value DECIMAL(14,4),
  previous_value DECIMAL(14,4),
  unit TEXT DEFAULT '%',
  trend TEXT DEFAULT 'stable',
  category TEXT DEFAULT 'mercado',
  region TEXT DEFAULT 'Recife',
  source TEXT,
  period TEXT,
  sort_order INT DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- 17. MARKET_INDICES (5 refs)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.market_indices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  current_value DECIMAL(14,4),
  base_value DECIMAL(14,4) DEFAULT 100,
  base_date DATE,
  methodology TEXT,
  data_points JSONB DEFAULT '[]',
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- 18. TRACKING_SESSIONS (9 refs)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.tracking_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  visitor_id TEXT,
  page_url TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  country TEXT,
  city TEXT,
  duration_seconds INT DEFAULT 0,
  pages_viewed INT DEFAULT 1,
  development_id UUID REFERENCES developments(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ts_session ON tracking_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_ts_created ON tracking_sessions(created_at DESC);

-- ═══════════════════════════════════════════════════════
-- 19. PAGE_VIEWS (7 refs)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT,
  page_url TEXT NOT NULL,
  page_title TEXT,
  development_id UUID REFERENCES developments(id) ON DELETE SET NULL,
  referrer TEXT,
  utm_source TEXT,
  duration_seconds INT DEFAULT 0,
  scroll_depth INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pv_dev ON page_views(development_id);
CREATE INDEX IF NOT EXISTS idx_pv_created ON page_views(created_at DESC);

-- ═══════════════════════════════════════════════════════
-- 20. MEDIA (8 refs)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.media (
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
  development_id UUID REFERENCES developments(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- 21. INTEGRATION_CONFIGS (6 refs)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.integration_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id TEXT NOT NULL UNIQUE,
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

-- ═══════════════════════════════════════════════════════
-- 22. CONSULTORIAS (5 refs)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.consultorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo TEXT,
  tipo TEXT DEFAULT 'investimento',
  status TEXT DEFAULT 'ativo',
  -- Cliente
  cliente_nome TEXT NOT NULL,
  cliente_email TEXT,
  cliente_telefone TEXT,
  cliente_tipo TEXT DEFAULT 'PF',
  -- Escopo
  assunto TEXT,
  descricao TEXT,
  objetivo TEXT,
  cidade TEXT,
  estado TEXT,
  -- Financeiro
  honorarios DECIMAL(10,2),
  honorarios_status TEXT DEFAULT 'pendente',
  forma_pagamento TEXT,
  valor DECIMAL(10,2),
  -- Prazos
  data_agendada TIMESTAMPTZ,
  data_inicio TEXT,
  data_prev_conclusao TEXT,
  duracao_minutos INT DEFAULT 60,
  -- Meta
  notas TEXT,
  observacoes TEXT,
  consultor_id UUID REFERENCES auth.users(id),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- 23. CALENDAR_EVENTS (5 refs)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT false,
  type TEXT DEFAULT 'meeting',
  event_type TEXT DEFAULT 'reuniao',
  status TEXT DEFAULT 'scheduled',
  location TEXT,
  color TEXT DEFAULT '#486581',
  -- Relations
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  development_id UUID REFERENCES developments(id) ON DELETE SET NULL,
  broker_id UUID,
  related_type TEXT,
  related_id UUID,
  -- Meta
  attendees JSONB DEFAULT '[]',
  reminders JSONB DEFAULT '[]',
  google_event_id TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cal_user ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_cal_start ON calendar_events(start_time);

-- ═══════════════════════════════════════════════════════
-- 24. PIX_CHARGES (4 refs)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.pix_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT,
  provider TEXT DEFAULT 'asaas',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','expired','cancelled','refunded')),
  amount DECIMAL(14,2) NOT NULL,
  payer_name TEXT,
  payer_document TEXT,
  payer_email TEXT,
  description TEXT,
  qr_code TEXT,
  qr_code_image TEXT,
  copy_paste TEXT,
  paid_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  financial_transaction_id UUID,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- 25. CREDIT_APPLICATIONS (3 refs)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.credit_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol TEXT,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  client_cpf TEXT,
  client_income DECIMAL(14,2),
  client_occupation TEXT,
  property_type TEXT,
  property_value DECIMAL(14,2),
  property_address TEXT,
  financed_amount DECIMAL(14,2),
  down_payment DECIMAL(14,2),
  bank TEXT,
  interest_rate DECIMAL(6,4),
  term_months INT,
  monthly_payment DECIMAL(14,2),
  system TEXT,
  ltv DECIMAL(6,4),
  dti DECIMAL(6,4),
  property_area DECIMAL(10,2),
  status TEXT DEFAULT 'pending',
  documents JSONB DEFAULT '{}',
  timeline JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- 26. WIDGETS_CONFIG (3 refs)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.widgets_config (
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

-- ═══════════════════════════════════════════════════════
-- 27. TABELAS MENORES
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.system_error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type TEXT, message TEXT, stack TEXT, url TEXT,
  user_id UUID, metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.daily_sales_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  leads_count INT DEFAULT 0, proposals_count INT DEFAULT 0,
  contracts_count INT DEFAULT 0, revenue DECIMAL(14,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type TEXT NOT NULL, status TEXT DEFAULT 'pending',
  input JSONB DEFAULT '{}', output JSONB DEFAULT '{}', error TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(), completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.valuation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, email TEXT, phone TEXT, property_type TEXT,
  address TEXT, city TEXT, area DECIMAL(10,2), purpose TEXT,
  status TEXT DEFAULT 'pending', notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.avaliacoes_kb_upload_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT, file_url TEXT, status TEXT DEFAULT 'pending',
  topic_id UUID, processed_at TIMESTAMPTZ, error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- 28. COLUNAS FALTANTES — developments
-- ═══════════════════════════════════════════════════════
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
ALTER TABLE developments ADD COLUMN IF NOT EXISTS total_area DECIMAL(10,2);
ALTER TABLE developments ADD COLUMN IF NOT EXISTS private_area DECIMAL(10,2);
ALTER TABLE developments ADD COLUMN IF NOT EXISTS broker_id UUID;

DO $$ BEGIN ALTER TABLE developments ALTER COLUMN developer DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE developments ALTER COLUMN address DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE developments ALTER COLUMN region DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; END $$;

-- ═══════════════════════════════════════════════════════
-- 29. COLUNAS FALTANTES — leads
-- ═══════════════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════════════
-- 30. COLUNAS FALTANTES — developers
-- ═══════════════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════════════
-- 31. RLS UNIVERSAL
-- ═══════════════════════════════════════════════════════
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'brokers','role_permissions','profiles','financial_transactions',
    'financial_goals','bank_accounts','contratos','proposals','proposal_events',
    'avaliacoes','conteudos','ebooks','projetos','projeto_unidades',
    'market_reports','market_indicators','market_indices',
    'tracking_sessions','page_views','media','integration_configs',
    'consultorias','calendar_events','pix_charges','credit_applications',
    'widgets_config','system_error_logs','daily_sales_stats','ai_tasks',
    'valuation_requests','avaliacoes_kb_upload_queue'
  ])
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "bo_full_%s" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "bo_full_%s" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;

-- Public access policies
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['projetos','ebooks','market_reports','conteudos','avaliacoes','market_indicators','market_indices'])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "pub_read_%s" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "pub_read_%s" ON public.%I FOR SELECT TO anon USING (true)', t, t);
  END LOOP;
  FOR t IN SELECT unnest(ARRAY['consultorias','valuation_requests','page_views','tracking_sessions','credit_applications'])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "pub_insert_%s" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "pub_insert_%s" ON public.%I FOR INSERT TO anon WITH CHECK (true)', t, t);
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════
-- 32. STORAGE BUCKETS
-- ═══════════════════════════════════════════════════════
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('media','media',true,52428800,ARRAY['image/jpeg','image/png','image/webp','image/gif','application/pdf','video/mp4'])
ON CONFLICT (id) DO UPDATE SET public=true, file_size_limit=52428800;

INSERT INTO storage.buckets (id,name,public) VALUES ('developments','developments',true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id,name,public) VALUES ('avatars','avatars',true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id,name,public) VALUES ('content','content',true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id,name,public) VALUES ('developers','developers',true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id,name,public) VALUES ('contratos','contratos',false) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "media_public_read" ON storage.objects;
CREATE POLICY "media_public_read" ON storage.objects FOR SELECT USING (bucket_id IN ('media','developments','avatars','content','developers','contratos'));
DROP POLICY IF EXISTS "media_auth_write" ON storage.objects;
CREATE POLICY "media_auth_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('media','developments','avatars','content','developers','contratos'));
DROP POLICY IF EXISTS "media_auth_update" ON storage.objects;
CREATE POLICY "media_auth_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id IN ('media','developments','avatars','content','developers','contratos'));
DROP POLICY IF EXISTS "media_auth_delete" ON storage.objects;
CREATE POLICY "media_auth_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id IN ('media','developments','avatars','content','developers','contratos'));

-- ═══════════════════════════════════════════════════════
-- 33. VIEW
-- ═══════════════════════════════════════════════════════
CREATE OR REPLACE VIEW v_proposals_with_score AS
SELECT p.*, l.name as lead_name, l.email as lead_email, l.phone as lead_phone,
  d.name as development_name, d.image as development_image
FROM proposals p
LEFT JOIN leads l ON p.lead_id = l.id
LEFT JOIN developments d ON p.development_id = d.id;

-- ═══════════════════════════════════════════════════════
-- 34. SEED PERMISSIONS
-- ═══════════════════════════════════════════════════════
INSERT INTO role_permissions (role,module,action,allowed) VALUES
  ('admin','dashboard','view',true),('admin','leads','view',true),('admin','leads','create',true),('admin','leads','edit',true),('admin','leads','delete',true),
  ('admin','imoveis','view',true),('admin','imoveis','create',true),('admin','imoveis','edit',true),('admin','imoveis','delete',true),
  ('admin','campanhas','view',true),('admin','campanhas','create',true),('admin','campanhas','edit',true),('admin','campanhas','delete',true),
  ('admin','financeiro','view',true),('admin','financeiro','create',true),('admin','financeiro','edit',true),('admin','financeiro','delete',true),
  ('admin','construtoras','view',true),('admin','construtoras','create',true),('admin','construtoras','edit',true),('admin','construtoras','delete',true),
  ('admin','corretores','view',true),('admin','corretores','create',true),('admin','corretores','edit',true),('admin','corretores','delete',true),
  ('admin','propostas','view',true),('admin','propostas','create',true),('admin','propostas','edit',true),
  ('admin','contratos','view',true),('admin','contratos','create',true),('admin','contratos','edit',true),
  ('admin','avaliacoes','view',true),('admin','avaliacoes','create',true),('admin','avaliacoes','edit',true),
  ('admin','conteudo','view',true),('admin','conteudo','create',true),('admin','conteudo','edit',true),
  ('admin','relatorios','view',true),('admin','relatorios','create',true),
  ('admin','settings','view',true),('admin','settings','edit',true),
  ('manager','dashboard','view',true),('manager','leads','view',true),('manager','leads','create',true),('manager','leads','edit',true),
  ('manager','imoveis','view',true),('manager','imoveis','create',true),('manager','imoveis','edit',true),
  ('manager','propostas','view',true),('manager','propostas','create',true),
  ('agent','dashboard','view',true),('agent','leads','view',true),('agent','leads','create',true),
  ('agent','imoveis','view',true),('agent','propostas','view',true),
  ('viewer','dashboard','view',true),('viewer','leads','view',true),('viewer','imoveis','view',true)
ON CONFLICT (role,module,action) DO NOTHING;

-- ═══════════════════════════════════════════════════════
-- 35. GRANTS
-- ═══════════════════════════════════════════════════════
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

DO $$ BEGIN GRANT INSERT ON public.leads TO anon; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN GRANT INSERT ON public.consultorias TO anon; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN GRANT INSERT ON public.valuation_requests TO anon; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN GRANT INSERT ON public.page_views TO anon; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN GRANT INSERT ON public.tracking_sessions TO anon; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN GRANT INSERT ON public.credit_applications TO anon; EXCEPTION WHEN others THEN NULL; END $$;

-- ═══════════════════════════════════════════════════════
-- FIM — IMI Master Migration Definitiva
-- ═══════════════════════════════════════════════════════
