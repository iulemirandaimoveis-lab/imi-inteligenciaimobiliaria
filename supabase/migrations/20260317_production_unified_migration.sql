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
-- Ensure columns exist if table was created by a previous migration
ALTER TABLE public.brokers ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.brokers ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.brokers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.brokers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.brokers ADD COLUMN IF NOT EXISTS creci TEXT;
ALTER TABLE public.brokers ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.brokers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.brokers ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'broker';
ALTER TABLE public.brokers ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT ARRAY['dashboard'];
ALTER TABLE public.brokers ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 3.00;
ALTER TABLE public.brokers ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE public.brokers ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.brokers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.brokers ADD COLUMN IF NOT EXISTS created_by UUID;
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
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS creci TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';

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
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente';
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS subcategory TEXT;
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS amount DECIMAL(14,2);
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'BRL';
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS paid_date DATE;
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS recurrence TEXT;
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS reference_type TEXT;
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS reference_id UUID;
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS development_id UUID;
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS lead_id UUID;
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS broker_id UUID;
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS receipt_url TEXT;
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
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
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS titulo TEXT;
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'compra_venda';
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS categoria TEXT;
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS modelo_id TEXT;
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS modelo_nome TEXT;
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS template_id TEXT;
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'rascunho';
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS idioma TEXT DEFAULT 'pt-BR';
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS contratante JSONB DEFAULT '{}';
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS contratado JSONB DEFAULT '{}';
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS partes JSONB DEFAULT '[]';
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS dados_contrato JSONB DEFAULT '{}';
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS clausulas JSONB DEFAULT '[]';
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS signatarios JSONB DEFAULT '[]';
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS conteudo TEXT;
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS conteudo_markdown TEXT;
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS html_content TEXT;
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS idioma_primario TEXT DEFAULT 'pt';
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS idiomas_adicionais TEXT[] DEFAULT '{}';
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS conteudo_adicional JSONB DEFAULT '{}';
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS docx_url TEXT;
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS drive_url TEXT;
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS gdrive_url TEXT;
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS assinatura_url TEXT;
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS assinatura_provider TEXT DEFAULT 'clicksign';
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS plataforma_assinatura TEXT;
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS development_id UUID;
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS lead_id UUID;
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS broker_id UUID;
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS valor DECIMAL(14,2);
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS notas TEXT;
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS criado_por TEXT;
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS criado_por_nome TEXT;
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS criado_em TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
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
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS token TEXT;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS development_id UUID;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS lead_id UUID;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS broker_id UUID;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS unit_id UUID;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS valor_proposta DECIMAL(14,2);
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS valor_entrada DECIMAL(14,2);
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS parcelas INT;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS valor_parcela DECIMAL(14,2);
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS financiamento_tipo TEXT;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS condicoes TEXT;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS validade DATE;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS interest_score INT DEFAULT 0;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS views_count INT DEFAULT 0;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMPTZ;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS response TEXT;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
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
ALTER TABLE public.proposal_events ADD COLUMN IF NOT EXISTS proposal_id UUID;
ALTER TABLE public.proposal_events ADD COLUMN IF NOT EXISTS event_type TEXT;
ALTER TABLE public.proposal_events ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE public.proposal_events ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE public.proposal_events ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE public.proposal_events ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
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
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS protocolo TEXT;
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'mercado';
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente';
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS solicitante_nome TEXT;
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS solicitante_email TEXT;
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS solicitante_telefone TEXT;
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS cliente_nome TEXT;
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS cliente_email TEXT;
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS cliente_telefone TEXT;
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS cliente_cpf_cnpj TEXT;
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS cliente_tipo TEXT DEFAULT 'PF';
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS solicitante_instituicao TEXT;
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS endereco TEXT;
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS complemento TEXT;
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS cidade TEXT DEFAULT 'Recife';
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'PE';
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS bairro TEXT;
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS tipo_imovel TEXT;
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS area_total DECIMAL(10,2);
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS area_construida DECIMAL(10,2);
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS area_terreno DECIMAL(10,2);
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS area_privativa DECIMAL(10,2);
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS quartos INT;
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS banheiros INT;
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS vagas INT;
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS andar TEXT;
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS ano_construcao TEXT;
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS padrao TEXT;
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS estado_conservacao TEXT;
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS caracteristicas JSONB;
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS finalidade TEXT;
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS metodologia TEXT;
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS grau_fundamentacao TEXT;
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS grau_precisao TEXT;
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS valor_estimado DECIMAL(14,2);
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS valor_final DECIMAL(14,2);
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS comparaveis JSONB;
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS laudo_url TEXT;
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS fotos TEXT[] DEFAULT '{}';
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS honorarios DECIMAL(10,2);
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS forma_pagamento TEXT;
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS prazo_entrega TEXT;
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS data_vistoria TIMESTAMPTZ;
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS data_entrega TIMESTAMPTZ;
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS observacoes TEXT;
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS avaliador_id UUID;
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS development_id UUID;
ALTER TABLE public.avaliacoes ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

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
ALTER TABLE public.conteudos ADD COLUMN IF NOT EXISTS titulo TEXT;
ALTER TABLE public.conteudos ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'post';
ALTER TABLE public.conteudos ADD COLUMN IF NOT EXISTS plataforma TEXT DEFAULT 'instagram';
ALTER TABLE public.conteudos ADD COLUMN IF NOT EXISTS canal TEXT;
ALTER TABLE public.conteudos ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'rascunho';
ALTER TABLE public.conteudos ADD COLUMN IF NOT EXISTS conteudo TEXT;
ALTER TABLE public.conteudos ADD COLUMN IF NOT EXISTS html_content TEXT;
ALTER TABLE public.conteudos ADD COLUMN IF NOT EXISTS imagem_url TEXT;
ALTER TABLE public.conteudos ADD COLUMN IF NOT EXISTS imagens TEXT[] DEFAULT '{}';
ALTER TABLE public.conteudos ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.conteudos ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.conteudos ADD COLUMN IF NOT EXISTS hashtags TEXT[] DEFAULT '{}';
ALTER TABLE public.conteudos ADD COLUMN IF NOT EXISTS data_publicacao TIMESTAMPTZ;
ALTER TABLE public.conteudos ADD COLUMN IF NOT EXISTS visualizacoes INT DEFAULT 0;
ALTER TABLE public.conteudos ADD COLUMN IF NOT EXISTS engajamento DECIMAL(5,2) DEFAULT 0;
ALTER TABLE public.conteudos ADD COLUMN IF NOT EXISTS likes INT DEFAULT 0;
ALTER TABLE public.conteudos ADD COLUMN IF NOT EXISTS shares INT DEFAULT 0;
ALTER TABLE public.conteudos ADD COLUMN IF NOT EXISTS comments_count INT DEFAULT 0;
ALTER TABLE public.conteudos ADD COLUMN IF NOT EXISTS development_id UUID;
ALTER TABLE public.conteudos ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false;
ALTER TABLE public.conteudos ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE public.conteudos ADD COLUMN IF NOT EXISTS created_by UUID;

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
ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS cover_image TEXT;
ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS content JSONB DEFAULT '{}';
ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS chapters JSONB DEFAULT '[]';
ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS pilar TEXT;
ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS target_audience TEXT;
ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS publication_status TEXT DEFAULT 'em_breve';
ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS release_date DATE;
ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS amazon_link TEXT;
ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS amazon_url TEXT;
ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS development_id UUID;
ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS downloads INT DEFAULT 0;
ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS leads_generated INT DEFAULT 0;
ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false;
ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE public.ebooks ADD COLUMN IF NOT EXISTS created_by UUID;

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
ALTER TABLE public.projeto_unidades ADD COLUMN IF NOT EXISTS projeto_id UUID;
ALTER TABLE public.projeto_unidades ADD COLUMN IF NOT EXISTS identificador TEXT;
ALTER TABLE public.projeto_unidades ADD COLUMN IF NOT EXISTS tipo TEXT;
ALTER TABLE public.projeto_unidades ADD COLUMN IF NOT EXISTS bloco TEXT;
ALTER TABLE public.projeto_unidades ADD COLUMN IF NOT EXISTS andar INT;
ALTER TABLE public.projeto_unidades ADD COLUMN IF NOT EXISTS area_privativa DECIMAL(10,2);
ALTER TABLE public.projeto_unidades ADD COLUMN IF NOT EXISTS area_total DECIMAL(10,2);
ALTER TABLE public.projeto_unidades ADD COLUMN IF NOT EXISTS quartos INT;
ALTER TABLE public.projeto_unidades ADD COLUMN IF NOT EXISTS suites INT;
ALTER TABLE public.projeto_unidades ADD COLUMN IF NOT EXISTS vagas INT;
ALTER TABLE public.projeto_unidades ADD COLUMN IF NOT EXISTS preco DECIMAL(14,2);
ALTER TABLE public.projeto_unidades ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'disponivel';
ALTER TABLE public.projeto_unidades ADD COLUMN IF NOT EXISTS lead_id UUID;
ALTER TABLE public.projeto_unidades ADD COLUMN IF NOT EXISTS observacoes TEXT;
ALTER TABLE public.projeto_unidades ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE public.projeto_unidades ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.projeto_unidades ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
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
ALTER TABLE public.tracking_sessions ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE public.tracking_sessions ADD COLUMN IF NOT EXISTS visitor_id TEXT;
ALTER TABLE public.tracking_sessions ADD COLUMN IF NOT EXISTS page_url TEXT;
ALTER TABLE public.tracking_sessions ADD COLUMN IF NOT EXISTS referrer TEXT;
ALTER TABLE public.tracking_sessions ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE public.tracking_sessions ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE public.tracking_sessions ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE public.tracking_sessions ADD COLUMN IF NOT EXISTS utm_content TEXT;
ALTER TABLE public.tracking_sessions ADD COLUMN IF NOT EXISTS device_type TEXT;
ALTER TABLE public.tracking_sessions ADD COLUMN IF NOT EXISTS browser TEXT;
ALTER TABLE public.tracking_sessions ADD COLUMN IF NOT EXISTS os TEXT;
ALTER TABLE public.tracking_sessions ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.tracking_sessions ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.tracking_sessions ADD COLUMN IF NOT EXISTS duration_seconds INT DEFAULT 0;
ALTER TABLE public.tracking_sessions ADD COLUMN IF NOT EXISTS pages_viewed INT DEFAULT 1;
ALTER TABLE public.tracking_sessions ADD COLUMN IF NOT EXISTS development_id UUID;
ALTER TABLE public.tracking_sessions ADD COLUMN IF NOT EXISTS lead_id UUID;
ALTER TABLE public.tracking_sessions ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE public.tracking_sessions ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE public.tracking_sessions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
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
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS page_url TEXT;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS page_title TEXT;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS development_id UUID;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS referrer TEXT;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS duration_seconds INT DEFAULT 0;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS scroll_depth INT DEFAULT 0;
ALTER TABLE public.page_views ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
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
ALTER TABLE public.consultorias ADD COLUMN IF NOT EXISTS protocolo TEXT;
ALTER TABLE public.consultorias ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'investimento';
ALTER TABLE public.consultorias ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativo';
ALTER TABLE public.consultorias ADD COLUMN IF NOT EXISTS cliente_nome TEXT;
ALTER TABLE public.consultorias ADD COLUMN IF NOT EXISTS cliente_email TEXT;
ALTER TABLE public.consultorias ADD COLUMN IF NOT EXISTS cliente_telefone TEXT;
ALTER TABLE public.consultorias ADD COLUMN IF NOT EXISTS cliente_tipo TEXT DEFAULT 'PF';
ALTER TABLE public.consultorias ADD COLUMN IF NOT EXISTS assunto TEXT;
ALTER TABLE public.consultorias ADD COLUMN IF NOT EXISTS descricao TEXT;
ALTER TABLE public.consultorias ADD COLUMN IF NOT EXISTS objetivo TEXT;
ALTER TABLE public.consultorias ADD COLUMN IF NOT EXISTS cidade TEXT;
ALTER TABLE public.consultorias ADD COLUMN IF NOT EXISTS estado TEXT;
ALTER TABLE public.consultorias ADD COLUMN IF NOT EXISTS honorarios DECIMAL(10,2);
ALTER TABLE public.consultorias ADD COLUMN IF NOT EXISTS honorarios_status TEXT DEFAULT 'pendente';
ALTER TABLE public.consultorias ADD COLUMN IF NOT EXISTS forma_pagamento TEXT;
ALTER TABLE public.consultorias ADD COLUMN IF NOT EXISTS valor DECIMAL(10,2);
ALTER TABLE public.consultorias ADD COLUMN IF NOT EXISTS data_agendada TIMESTAMPTZ;
ALTER TABLE public.consultorias ADD COLUMN IF NOT EXISTS data_inicio TEXT;
ALTER TABLE public.consultorias ADD COLUMN IF NOT EXISTS data_prev_conclusao TEXT;
ALTER TABLE public.consultorias ADD COLUMN IF NOT EXISTS duracao_minutos INT DEFAULT 60;
ALTER TABLE public.consultorias ADD COLUMN IF NOT EXISTS notas TEXT;
ALTER TABLE public.consultorias ADD COLUMN IF NOT EXISTS observacoes TEXT;
ALTER TABLE public.consultorias ADD COLUMN IF NOT EXISTS consultor_id UUID;
ALTER TABLE public.consultorias ADD COLUMN IF NOT EXISTS lead_id UUID;

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
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS all_day BOOLEAN DEFAULT false;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'meeting';
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'reuniao';
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled';
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#486581';
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS lead_id UUID;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS development_id UUID;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS broker_id UUID;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS related_type TEXT;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS related_id UUID;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS attendees JSONB DEFAULT '[]';
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS reminders JSONB DEFAULT '[]';
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS google_event_id TEXT;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
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
-- 31. IMI CONNECT — CHAT TABLES
-- ═══════════════════════════════════════════════════════

-- Chat Channels (deal rooms, team channels, DMs, groups)
CREATE TABLE IF NOT EXISTS public.chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'group',
  name TEXT,
  description TEXT,
  avatar_url TEXT,
  development_id UUID,
  lead_id UUID,
  proposal_id UUID,
  contrato_id UUID,
  is_archived BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  is_muted BOOLEAN DEFAULT false,
  auto_created BOOLEAN DEFAULT false,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  message_count INT DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.chat_channels ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'group';
ALTER TABLE public.chat_channels ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.chat_channels ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.chat_channels ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.chat_channels ADD COLUMN IF NOT EXISTS development_id UUID;
ALTER TABLE public.chat_channels ADD COLUMN IF NOT EXISTS lead_id UUID;
ALTER TABLE public.chat_channels ADD COLUMN IF NOT EXISTS proposal_id UUID;
ALTER TABLE public.chat_channels ADD COLUMN IF NOT EXISTS contrato_id UUID;
ALTER TABLE public.chat_channels ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
ALTER TABLE public.chat_channels ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
ALTER TABLE public.chat_channels ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT false;
ALTER TABLE public.chat_channels ADD COLUMN IF NOT EXISTS auto_created BOOLEAN DEFAULT false;
ALTER TABLE public.chat_channels ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ;
ALTER TABLE public.chat_channels ADD COLUMN IF NOT EXISTS last_message_preview TEXT;
ALTER TABLE public.chat_channels ADD COLUMN IF NOT EXISTS message_count INT DEFAULT 0;
ALTER TABLE public.chat_channels ADD COLUMN IF NOT EXISTS created_by UUID;
CREATE INDEX IF NOT EXISTS idx_channels_type ON chat_channels(type);
CREATE INDEX IF NOT EXISTS idx_channels_dev ON chat_channels(development_id);
CREATE INDEX IF NOT EXISTS idx_channels_lead ON chat_channels(lead_id);
CREATE INDEX IF NOT EXISTS idx_channels_last_msg ON chat_channels(last_message_at DESC);

-- Chat Members
CREATE TABLE IF NOT EXISTS public.chat_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member',
  is_muted BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  unread_count INT DEFAULT 0,
  notify_mode TEXT DEFAULT 'all',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(channel_id, user_id)
);
ALTER TABLE public.chat_members ADD COLUMN IF NOT EXISTS channel_id UUID;
ALTER TABLE public.chat_members ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.chat_members ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';
ALTER TABLE public.chat_members ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT false;
ALTER TABLE public.chat_members ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
ALTER TABLE public.chat_members ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.chat_members ADD COLUMN IF NOT EXISTS unread_count INT DEFAULT 0;
ALTER TABLE public.chat_members ADD COLUMN IF NOT EXISTS notify_mode TEXT DEFAULT 'all';
ALTER TABLE public.chat_members ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_members_user ON chat_members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_channel ON chat_members(channel_id);

-- Chat Messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  content TEXT,
  content_type TEXT DEFAULT 'text',
  attachments JSONB DEFAULT '[]',
  entity_type TEXT,
  entity_id UUID,
  reply_to UUID,
  thread_count INT DEFAULT 0,
  mentions UUID[] DEFAULT '{}',
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  reactions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS channel_id UUID;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS sender_id UUID;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'text';
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS entity_id UUID;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS reply_to UUID;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS thread_count INT DEFAULT 0;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS mentions UUID[] DEFAULT '{}';
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_messages_channel ON chat_messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_reply ON chat_messages(reply_to);

-- Chat Read Receipts
CREATE TABLE IF NOT EXISTS public.chat_read_receipts (
  channel_id UUID NOT NULL,
  user_id UUID NOT NULL,
  last_read_message_id UUID,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (channel_id, user_id)
);

-- Trigger: update last_message on new message
CREATE OR REPLACE FUNCTION update_channel_last_message() RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_channels SET
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.content, 100),
    message_count = message_count + 1,
    updated_at = NOW()
  WHERE id = NEW.channel_id;
  UPDATE chat_members SET
    unread_count = unread_count + 1
  WHERE channel_id = NEW.channel_id
    AND user_id != NEW.sender_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_new_message ON chat_messages;
CREATE TRIGGER trg_new_message AFTER INSERT ON chat_messages
FOR EACH ROW EXECUTE FUNCTION update_channel_last_message();

-- ═══════════════════════════════════════════════════════
-- 32. RLS UNIVERSAL
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
    'valuation_requests','avaliacoes_kb_upload_queue',
    'chat_channels','chat_members','chat_messages','chat_read_receipts'
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
