-- ============================================================
-- IMI SCHEMA SNAPSHOT — DOCUMENTATION ONLY
-- Generated: 2026-03-18
-- DO NOT EXECUTE — This is a reference file
-- Source of truth: 20260317_production_unified_migration.sql
--                  + 050-062 supplementary migrations
-- ============================================================
DO $$ BEGIN RAISE NOTICE 'Schema snapshot — do not execute'; END $$;

/*
============================================================
EXTENSIONS
============================================================
*/
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "pg_trgm";
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

/*
============================================================
TABLE 01: brokers
Source: 20260317_production_unified_migration.sql
============================================================
*/
-- CREATE TABLE IF NOT EXISTS public.brokers (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
--   name TEXT NOT NULL,
--   email TEXT UNIQUE NOT NULL,
--   phone TEXT,
--   creci TEXT,
--   avatar_url TEXT,
--   status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive')),
--   role TEXT DEFAULT 'broker' CHECK (role IN ('broker','broker_manager','admin')),
--   permissions TEXT[] DEFAULT ARRAY['dashboard'],
--   commission_rate DECIMAL(5,2) DEFAULT 3.00,
--   last_login_at TIMESTAMPTZ,
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW(),
--   created_by UUID REFERENCES auth.users(id)
-- );

/*
============================================================
TABLE 02: role_permissions
Source: 20260317_production_unified_migration.sql
============================================================
*/
-- CREATE TABLE IF NOT EXISTS public.role_permissions (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   role TEXT NOT NULL,
--   module TEXT NOT NULL,
--   action TEXT NOT NULL,
--   allowed BOOLEAN DEFAULT true,
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   UNIQUE(role, module, action)
-- );

/*
============================================================
TABLE 03: profiles
Source: 20260317_production_unified_migration.sql
============================================================
*/
-- CREATE TABLE IF NOT EXISTS public.profiles (
--   id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
--   name TEXT,
--   email TEXT,
--   avatar_url TEXT,
--   phone TEXT,
--   role TEXT DEFAULT 'admin',
--   bio TEXT,
--   company TEXT,
--   creci TEXT,
--   preferences JSONB DEFAULT '{}',
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

/*
============================================================
TABLE 04: financial_transactions
Source: 20260317_production_unified_migration.sql
============================================================
*/
-- CREATE TABLE IF NOT EXISTS public.financial_transactions (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   type TEXT NOT NULL CHECK (type IN ('receita','despesa','comissao','transferencia')),
--   category TEXT,
--   subcategory TEXT,
--   description TEXT,
--   amount DECIMAL(14,2) NOT NULL,
--   currency TEXT DEFAULT 'BRL',
--   status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente','pago','atrasado','cancelado','agendado')),
--   due_date DATE,
--   paid_date DATE,
--   recurrence TEXT CHECK (recurrence IN ('once','monthly','quarterly','yearly')),
--   reference_type TEXT,
--   reference_id UUID,
--   development_id UUID REFERENCES developments(id) ON DELETE SET NULL,
--   lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
--   broker_id UUID,
--   payment_method TEXT,
--   receipt_url TEXT,
--   notes TEXT,
--   tags TEXT[] DEFAULT '{}',
--   created_by UUID REFERENCES auth.users(id),
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

/*
============================================================
TABLE 05: financial_goals
Source: 20260317_production_unified_migration.sql
============================================================
*/
-- CREATE TABLE IF NOT EXISTS public.financial_goals (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   title TEXT NOT NULL,
--   target_amount DECIMAL(14,2) NOT NULL,
--   current_amount DECIMAL(14,2) DEFAULT 0,
--   period_start DATE,
--   period_end DATE,
--   category TEXT,
--   status TEXT DEFAULT 'active',
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

/*
============================================================
TABLE 06: bank_accounts
Source: 20260317_production_unified_migration.sql
============================================================
*/
-- CREATE TABLE IF NOT EXISTS public.bank_accounts (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   name TEXT NOT NULL,
--   bank_name TEXT,
--   bank_code TEXT,
--   agency TEXT,
--   account_number TEXT,
--   account_type TEXT DEFAULT 'corrente',
--   pix_key TEXT,
--   pix_key_type TEXT,
--   balance DECIMAL(14,2) DEFAULT 0,
--   is_default BOOLEAN DEFAULT false,
--   is_active BOOLEAN DEFAULT true,
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

/*
============================================================
TABLE 07: contratos
Source: 20260317_production_unified_migration.sql
============================================================
*/
-- CREATE TABLE IF NOT EXISTS public.contratos (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   titulo TEXT,
--   tipo TEXT DEFAULT 'compra_venda',
--   numero TEXT,
--   categoria TEXT,
--   modelo_id TEXT,
--   modelo_nome TEXT,
--   template_id TEXT,
--   status TEXT DEFAULT 'rascunho',
--   idioma TEXT DEFAULT 'pt-BR',
--   contratante JSONB DEFAULT '{}',
--   contratado JSONB DEFAULT '{}',
--   partes JSONB DEFAULT '[]',
--   dados_contrato JSONB DEFAULT '{}',
--   clausulas JSONB DEFAULT '[]',
--   signatarios JSONB DEFAULT '[]',
--   conteudo TEXT,
--   conteudo_markdown TEXT,
--   html_content TEXT,
--   idioma_primario TEXT DEFAULT 'pt',
--   idiomas_adicionais TEXT[] DEFAULT '{}',
--   conteudo_adicional JSONB DEFAULT '{}',
--   pdf_url TEXT,
--   docx_url TEXT,
--   drive_url TEXT,
--   gdrive_url TEXT,
--   assinatura_url TEXT,
--   assinatura_provider TEXT DEFAULT 'clicksign',
--   plataforma_assinatura TEXT,
--   development_id UUID REFERENCES developments(id) ON DELETE SET NULL,
--   lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
--   broker_id UUID,
--   valor DECIMAL(14,2),
--   signed_at TIMESTAMPTZ,
--   expires_at TIMESTAMPTZ,
--   notas TEXT,
--   tags TEXT[] DEFAULT '{}',
--   criado_por TEXT,
--   criado_por_nome TEXT,
--   created_by UUID REFERENCES auth.users(id),
--   criado_em TIMESTAMPTZ DEFAULT NOW(),
--   atualizado_em TIMESTAMPTZ DEFAULT NOW(),
--   metadata JSONB DEFAULT '{}',
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

/*
============================================================
TABLE 08: proposals
Source: 20260317_production_unified_migration.sql
============================================================
*/
-- CREATE TABLE IF NOT EXISTS public.proposals (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
--   title TEXT NOT NULL,
--   status TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','viewed','accepted','rejected','expired','negotiating')),
--   development_id UUID REFERENCES developments(id) ON DELETE SET NULL,
--   lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
--   broker_id UUID,
--   unit_id UUID,
--   valor_proposta DECIMAL(14,2),
--   valor_entrada DECIMAL(14,2),
--   parcelas INT,
--   valor_parcela DECIMAL(14,2),
--   financiamento_tipo TEXT,
--   condicoes TEXT,
--   validade DATE,
--   interest_score INT DEFAULT 0,
--   views_count INT DEFAULT 0,
--   last_viewed_at TIMESTAMPTZ,
--   sent_at TIMESTAMPTZ,
--   response TEXT,
--   responded_at TIMESTAMPTZ,
--   pdf_url TEXT,
--   metadata JSONB DEFAULT '{}',
--   created_by UUID REFERENCES auth.users(id),
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

/*
============================================================
TABLE 09: proposal_events
Source: 20260317_production_unified_migration.sql
============================================================
*/
-- CREATE TABLE IF NOT EXISTS public.proposal_events (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
--   event_type TEXT NOT NULL CHECK (event_type IN ('created','sent','viewed','downloaded','accepted','rejected','expired','follow_up','proposal_sent','negotiation')),
--   metadata JSONB DEFAULT '{}',
--   ip_address TEXT,
--   user_agent TEXT,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

/*
============================================================
TABLE 10: avaliacoes
Source: 20260317_production_unified_migration.sql
============================================================
*/
-- CREATE TABLE IF NOT EXISTS public.avaliacoes (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   protocolo TEXT,
--   tipo TEXT DEFAULT 'mercado',
--   status TEXT DEFAULT 'pendente',
--   solicitante_nome TEXT,
--   solicitante_email TEXT,
--   solicitante_telefone TEXT,
--   cliente_nome TEXT,
--   cliente_email TEXT,
--   cliente_telefone TEXT,
--   cliente_cpf_cnpj TEXT,
--   cliente_tipo TEXT DEFAULT 'PF',
--   solicitante_instituicao TEXT,
--   endereco TEXT,
--   complemento TEXT,
--   cidade TEXT DEFAULT 'Recife',
--   estado TEXT DEFAULT 'PE',
--   bairro TEXT,
--   cep TEXT,
--   tipo_imovel TEXT,
--   area_total DECIMAL(10,2),
--   area_construida DECIMAL(10,2),
--   area_terreno DECIMAL(10,2),
--   area_privativa DECIMAL(10,2),
--   quartos INT,
--   banheiros INT,
--   vagas INT,
--   andar TEXT,
--   ano_construcao TEXT,
--   padrao TEXT,
--   estado_conservacao TEXT,
--   caracteristicas JSONB,
--   finalidade TEXT,
--   metodologia TEXT,
--   grau_fundamentacao TEXT,
--   grau_precisao TEXT,
--   valor_estimado DECIMAL(14,2),
--   valor_final DECIMAL(14,2),
--   comparaveis JSONB,
--   laudo_url TEXT,
--   fotos TEXT[] DEFAULT '{}',
--   honorarios DECIMAL(10,2),
--   forma_pagamento TEXT,
--   prazo_entrega TEXT,
--   data_vistoria TIMESTAMPTZ,
--   data_entrega TIMESTAMPTZ,
--   observacoes TEXT,
--   avaliador_id UUID REFERENCES auth.users(id),
--   development_id UUID REFERENCES developments(id) ON DELETE SET NULL,
--   metadata JSONB DEFAULT '{}',
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

/*
============================================================
TABLE 11: conteudos
Source: 20260317_production_unified_migration.sql
============================================================
*/
-- CREATE TABLE IF NOT EXISTS public.conteudos (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   titulo TEXT NOT NULL,
--   tipo TEXT DEFAULT 'post' CHECK (tipo IN ('post','video','reels','story','carrossel','artigo','ebook','newsletter','podcast')),
--   plataforma TEXT DEFAULT 'instagram',
--   canal TEXT,
--   status TEXT DEFAULT 'rascunho' CHECK (status IN ('rascunho','revisao','agendado','publicado','arquivado')),
--   conteudo TEXT,
--   html_content TEXT,
--   imagem_url TEXT,
--   imagens TEXT[] DEFAULT '{}',
--   video_url TEXT,
--   tags TEXT[] DEFAULT '{}',
--   hashtags TEXT[] DEFAULT '{}',
--   data_publicacao TIMESTAMPTZ,
--   visualizacoes INT DEFAULT 0,
--   engajamento DECIMAL(5,2) DEFAULT 0,
--   likes INT DEFAULT 0,
--   shares INT DEFAULT 0,
--   comments_count INT DEFAULT 0,
--   development_id UUID REFERENCES developments(id) ON DELETE SET NULL,
--   ai_generated BOOLEAN DEFAULT false,
--   metadata JSONB DEFAULT '{}',
--   created_by UUID REFERENCES auth.users(id),
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

/*
============================================================
TABLE 12: ebooks
Source: 20260317_production_unified_migration.sql
============================================================
*/
-- CREATE TABLE IF NOT EXISTS public.ebooks (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   title TEXT NOT NULL,
--   subtitle TEXT,
--   slug TEXT UNIQUE,
--   description TEXT,
--   status TEXT DEFAULT 'draft' CHECK (status IN ('draft','generating','review','published','archived')),
--   cover_url TEXT,
--   cover_image TEXT,
--   pdf_url TEXT,
--   content JSONB DEFAULT '{}',
--   chapters JSONB DEFAULT '[]',
--   pilar TEXT,
--   tags TEXT[] DEFAULT '{}',
--   target_audience TEXT,
--   publication_status TEXT DEFAULT 'em_breve',
--   featured BOOLEAN DEFAULT false,
--   sort_order INT DEFAULT 0,
--   release_date DATE,
--   amazon_link TEXT,
--   amazon_url TEXT,
--   development_id UUID REFERENCES developments(id) ON DELETE SET NULL,
--   downloads INT DEFAULT 0,
--   leads_generated INT DEFAULT 0,
--   is_published BOOLEAN DEFAULT false,
--   ai_generated BOOLEAN DEFAULT false,
--   metadata JSONB DEFAULT '{}',
--   created_by UUID REFERENCES auth.users(id),
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

/*
============================================================
TABLE 13: projetos
Source: 20260317_production_unified_migration.sql
============================================================
*/
-- CREATE TABLE IF NOT EXISTS public.projetos (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   nome TEXT NOT NULL,
--   tipo TEXT,
--   descricao TEXT,
--   cidade TEXT,
--   estado TEXT,
--   endereco TEXT,
--   bairro TEXT,
--   status TEXT DEFAULT 'estruturacao',
--   fase TEXT,
--   unidades INT DEFAULT 0,
--   unidades_vendidas INT DEFAULT 0,
--   area_total_m2 DECIMAL(12,2),
--   vgv DECIMAL(14,2) DEFAULT 0,
--   imagem_url TEXT,
--   gallery_images TEXT[] DEFAULT '{}',
--   brochure_url TEXT,
--   video_url TEXT,
--   plantas JSONB DEFAULT '[]',
--   tabela_precos JSONB DEFAULT '[]',
--   latitude DECIMAL(10,7),
--   longitude DECIMAL(10,7),
--   data_lancamento DATE,
--   data_entrega_prev DATE,
--   construtora_id UUID REFERENCES developers(id) ON DELETE SET NULL,
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

/*
============================================================
TABLE 14: projeto_unidades
Source: 20260317_production_unified_migration.sql
============================================================
*/
-- CREATE TABLE IF NOT EXISTS public.projeto_unidades (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   projeto_id UUID NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
--   identificador TEXT NOT NULL,
--   tipo TEXT,
--   bloco TEXT,
--   andar INT,
--   area_privativa DECIMAL(10,2),
--   area_total DECIMAL(10,2),
--   quartos INT,
--   suites INT,
--   vagas INT,
--   preco DECIMAL(14,2),
--   status TEXT DEFAULT 'disponivel' CHECK (status IN ('disponivel','reservado','vendido','bloqueado')),
--   lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
--   observacoes TEXT,
--   metadata JSONB DEFAULT '{}',
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

/*
============================================================
TABLE 15: market_reports
Source: 20260317_production_unified_migration.sql
============================================================
*/
-- CREATE TABLE IF NOT EXISTS public.market_reports (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   title TEXT NOT NULL,
--   type TEXT DEFAULT 'market_analysis',
--   period TEXT,
--   status TEXT DEFAULT 'draft',
--   content TEXT,
--   html_content TEXT,
--   pdf_url TEXT,
--   summary TEXT,
--   metrics JSONB DEFAULT '{}',
--   insights JSONB DEFAULT '[]',
--   region TEXT,
--   city TEXT DEFAULT 'Recife',
--   is_published BOOLEAN DEFAULT false,
--   ai_generated BOOLEAN DEFAULT false,
--   created_by UUID REFERENCES auth.users(id),
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

/*
============================================================
TABLE 16: market_indicators
Source: 20260317_production_unified_migration.sql
============================================================
*/
-- CREATE TABLE IF NOT EXISTS public.market_indicators (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   name TEXT NOT NULL,
--   metric_name TEXT,
--   slug TEXT UNIQUE,
--   description TEXT,
--   value DECIMAL(14,4),
--   previous_value DECIMAL(14,4),
--   unit TEXT DEFAULT '%',
--   trend TEXT DEFAULT 'stable',
--   category TEXT DEFAULT 'mercado',
--   region TEXT DEFAULT 'Recife',
--   source TEXT,
--   period TEXT,
--   sort_order INT DEFAULT 0,
--   is_published BOOLEAN DEFAULT true,
--   metadata JSONB DEFAULT '{}',
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

/*
============================================================
TABLE 17: market_indices
Source: 20260317_production_unified_migration.sql
============================================================
*/
-- CREATE TABLE IF NOT EXISTS public.market_indices (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   name TEXT NOT NULL,
--   slug TEXT UNIQUE,
--   description TEXT,
--   current_value DECIMAL(14,4),
--   base_value DECIMAL(14,4) DEFAULT 100,
--   base_date DATE,
--   methodology TEXT,
--   data_points JSONB DEFAULT '[]',
--   is_published BOOLEAN DEFAULT false,
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

/*
============================================================
TABLE 18: tracking_sessions
Source: 20260317_production_unified_migration.sql
============================================================
*/
-- CREATE TABLE IF NOT EXISTS public.tracking_sessions (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   session_id TEXT NOT NULL,
--   visitor_id TEXT,
--   page_url TEXT,
--   referrer TEXT,
--   utm_source TEXT,
--   utm_medium TEXT,
--   utm_campaign TEXT,
--   utm_content TEXT,
--   device_type TEXT,
--   browser TEXT,
--   os TEXT,
--   country TEXT,
--   city TEXT,
--   duration_seconds INT DEFAULT 0,
--   pages_viewed INT DEFAULT 1,
--   development_id UUID REFERENCES developments(id) ON DELETE SET NULL,
--   lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
--   ip_address TEXT,
--   user_agent TEXT,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

/*
============================================================
TABLE 19: page_views
Source: 20260317_production_unified_migration.sql
============================================================
*/
-- CREATE TABLE IF NOT EXISTS public.page_views (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   session_id TEXT,
--   page_url TEXT NOT NULL,
--   page_title TEXT,
--   development_id UUID REFERENCES developments(id) ON DELETE SET NULL,
--   referrer TEXT,
--   utm_source TEXT,
--   duration_seconds INT DEFAULT 0,
--   scroll_depth INT DEFAULT 0,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

/*
============================================================
TABLE 20: media
Source: 20260317_production_unified_migration.sql
============================================================
*/
-- CREATE TABLE IF NOT EXISTS public.media (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   name TEXT NOT NULL,
--   file_name TEXT,
--   file_url TEXT NOT NULL,
--   file_type TEXT,
--   file_size BIGINT,
--   bucket TEXT DEFAULT 'media',
--   folder TEXT,
--   alt_text TEXT,
--   tags TEXT[] DEFAULT '{}',
--   development_id UUID REFERENCES developments(id) ON DELETE SET NULL,
--   uploaded_by UUID REFERENCES auth.users(id),
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

/*
============================================================
TABLE 21: integration_configs
Source: 20260317_production_unified_migration.sql
============================================================
*/
-- CREATE TABLE IF NOT EXISTS public.integration_configs (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   integration_id TEXT NOT NULL UNIQUE,
--   provider TEXT NOT NULL,
--   config JSONB DEFAULT '{}',
--   credentials JSONB DEFAULT '{}',
--   is_active BOOLEAN DEFAULT false,
--   last_sync_at TIMESTAMPTZ,
--   sync_status TEXT DEFAULT 'idle',
--   error_message TEXT,
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

/*
============================================================
TABLE 22: consultorias
Source: 20260317_production_unified_migration.sql
============================================================
*/
-- CREATE TABLE IF NOT EXISTS public.consultorias (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   protocolo TEXT,
--   tipo TEXT DEFAULT 'investimento',
--   status TEXT DEFAULT 'ativo',
--   cliente_nome TEXT NOT NULL,
--   cliente_email TEXT,
--   cliente_telefone TEXT,
--   cliente_tipo TEXT DEFAULT 'PF',
--   assunto TEXT,
--   descricao TEXT,
--   objetivo TEXT,
--   cidade TEXT,
--   estado TEXT,
--   honorarios DECIMAL(10,2),
--   honorarios_status TEXT DEFAULT 'pendente',
--   forma_pagamento TEXT,
--   valor DECIMAL(10,2),
--   data_agendada TIMESTAMPTZ,
--   data_inicio TEXT,
--   data_prev_conclusao TEXT,
--   duracao_minutos INT DEFAULT 60,
--   notas TEXT,
--   observacoes TEXT,
--   consultor_id UUID REFERENCES auth.users(id),
--   lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

/*
============================================================
TABLE 23: calendar_events
Source: 20260317_production_unified_migration.sql
============================================================
*/
-- CREATE TABLE IF NOT EXISTS public.calendar_events (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   title TEXT NOT NULL,
--   description TEXT,
--   start_time TIMESTAMPTZ NOT NULL,
--   end_time TIMESTAMPTZ,
--   all_day BOOLEAN DEFAULT false,
--   type TEXT DEFAULT 'meeting',
--   event_type TEXT DEFAULT 'reuniao',
--   status TEXT DEFAULT 'scheduled',
--   location TEXT,
--   color TEXT DEFAULT '#486581',
--   lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
--   development_id UUID REFERENCES developments(id) ON DELETE SET NULL,
--   broker_id UUID,
--   related_type TEXT,
--   related_id UUID,
--   attendees JSONB DEFAULT '[]',
--   reminders JSONB DEFAULT '[]',
--   google_event_id TEXT,
--   user_id UUID REFERENCES auth.users(id),
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

/*
============================================================
TABLE 24: pix_charges
Source: 20260317_production_unified_migration.sql
============================================================
*/
-- CREATE TABLE IF NOT EXISTS public.pix_charges (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   external_id TEXT,
--   provider TEXT DEFAULT 'asaas',
--   status TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','expired','cancelled','refunded')),
--   amount DECIMAL(14,2) NOT NULL,
--   payer_name TEXT,
--   payer_document TEXT,
--   payer_email TEXT,
--   description TEXT,
--   qr_code TEXT,
--   qr_code_image TEXT,
--   copy_paste TEXT,
--   paid_at TIMESTAMPTZ,
--   expires_at TIMESTAMPTZ,
--   financial_transaction_id UUID,
--   lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
--   metadata JSONB DEFAULT '{}',
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

/*
============================================================
TABLE 25: credit_applications
Source: 20260317_production_unified_migration.sql
============================================================
*/
-- CREATE TABLE IF NOT EXISTS public.credit_applications (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   protocol TEXT,
--   client_name TEXT NOT NULL,
--   client_email TEXT,
--   client_phone TEXT,
--   client_cpf TEXT,
--   client_income DECIMAL(14,2),
--   client_occupation TEXT,
--   property_type TEXT,
--   property_value DECIMAL(14,2),
--   property_address TEXT,
--   financed_amount DECIMAL(14,2),
--   down_payment DECIMAL(14,2),
--   bank TEXT,
--   interest_rate DECIMAL(6,4),
--   term_months INT,
--   monthly_payment DECIMAL(14,2),
--   system TEXT,
--   ltv DECIMAL(6,4),
--   dti DECIMAL(6,4),
--   property_area DECIMAL(10,2),
--   status TEXT DEFAULT 'pending',
--   documents JSONB DEFAULT '{}',
--   timeline JSONB DEFAULT '[]',
--   notes TEXT,
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

/*
============================================================
TABLE 26: widgets_config
Source: 20260317_production_unified_migration.sql
============================================================
*/
-- CREATE TABLE IF NOT EXISTS public.widgets_config (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   widget_type TEXT NOT NULL,
--   name TEXT,
--   config JSONB DEFAULT '{}',
--   theme TEXT DEFAULT 'dark',
--   is_active BOOLEAN DEFAULT true,
--   embed_code TEXT,
--   allowed_domains TEXT[] DEFAULT '{}',
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

/*
============================================================
TABLE 27: system_error_logs
Source: 20260317_production_unified_migration.sql
============================================================
*/
-- CREATE TABLE IF NOT EXISTS public.system_error_logs (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   error_type TEXT,
--   message TEXT,
--   stack TEXT,
--   url TEXT,
--   user_id UUID,
--   metadata JSONB DEFAULT '{}',
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

/*
============================================================
TABLE 28: daily_sales_stats
Source: 20260317_production_unified_migration.sql
============================================================
*/
-- CREATE TABLE IF NOT EXISTS public.daily_sales_stats (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   date DATE NOT NULL UNIQUE,
--   leads_count INT DEFAULT 0,
--   proposals_count INT DEFAULT 0,
--   visits_count INT DEFAULT 0,
--   revenue DECIMAL(14,2) DEFAULT 0,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

/*
============================================================
TABLE 29: ai_tasks
Source: 20260317_production_unified_migration.sql
============================================================
*/
-- CREATE TABLE IF NOT EXISTS public.ai_tasks (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   task_type TEXT NOT NULL,
--   status TEXT DEFAULT 'pending',
--   input JSONB DEFAULT '{}',
--   output JSONB DEFAULT '{}',
--   error TEXT,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

/*
============================================================
TABLE 30: valuation_requests
Source: 20260317_production_unified_migration.sql
============================================================
*/
-- CREATE TABLE IF NOT EXISTS public.valuation_requests (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   status TEXT DEFAULT 'pending',
--   request_data JSONB DEFAULT '{}',
--   result_data JSONB DEFAULT '{}',
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

/*
============================================================
TABLE 31: avaliacoes_kb_upload_queue
Source: 20260317_production_unified_migration.sql
============================================================
*/
-- CREATE TABLE IF NOT EXISTS public.avaliacoes_kb_upload_queue (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   filename TEXT NOT NULL,
--   status TEXT DEFAULT 'pending',
--   result JSONB DEFAULT '{}',
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

/*
============================================================
TABLE 32: chat_channels
Source: 20260317_production_unified_migration.sql
============================================================
*/
-- CREATE TABLE IF NOT EXISTS public.chat_channels (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   name TEXT NOT NULL,
--   type TEXT DEFAULT 'group',
--   description TEXT,
--   avatar_url TEXT,
--   is_archived BOOLEAN DEFAULT false,
--   created_by UUID REFERENCES auth.users(id),
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

/*
============================================================
TABLE 33: chat_members
Source: 20260317_production_unified_migration.sql
============================================================
*/
-- CREATE TABLE IF NOT EXISTS public.chat_members (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
--   user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
--   role TEXT DEFAULT 'member',
--   joined_at TIMESTAMPTZ DEFAULT NOW(),
--   UNIQUE(channel_id, user_id)
-- );

/*
============================================================
TABLE 34: chat_messages
Source: 20260317_production_unified_migration.sql
============================================================
*/
-- CREATE TABLE IF NOT EXISTS public.chat_messages (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
--   sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
--   content TEXT,
--   message_type TEXT DEFAULT 'text',
--   attachments JSONB DEFAULT '[]',
--   reply_to UUID REFERENCES chat_messages(id),
--   is_edited BOOLEAN DEFAULT false,
--   is_deleted BOOLEAN DEFAULT false,
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

/*
============================================================
TABLE 35: chat_read_receipts
Source: 20260317_production_unified_migration.sql
============================================================
*/
-- CREATE TABLE IF NOT EXISTS public.chat_read_receipts (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
--   user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
--   last_read_at TIMESTAMPTZ DEFAULT NOW(),
--   UNIQUE(channel_id, user_id)
-- );

/*
============================================================
TABLES FROM 001_backoffice_schema.sql (legacy, covered by unified)
============================================================
*/
-- developers, developments, leads, credit_applications,
-- notifications, team_members, settings, campaigns, evaluations
-- (All superseded by unified migration)

/*
============================================================
TABLES FROM 004_multi_tenant_core.sql
============================================================
*/
-- CREATE TABLE IF NOT EXISTS tenants (...)
-- CREATE TABLE IF NOT EXISTS niche_playbooks (...)
-- CREATE TABLE IF NOT EXISTS tenant_users (...)
-- CREATE TABLE IF NOT EXISTS ai_requests (...)

/*
============================================================
SUPPLEMENTARY TABLES (050_create_all_missing_tables.sql)
============================================================
*/
-- CREATE TABLE IF NOT EXISTS public.lead_qualifications (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
--   user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
--   score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
--   reasoning TEXT,
--   profile JSONB DEFAULT '{}',
--   follow_ups JSONB DEFAULT '[]',
--   created_at TIMESTAMPTZ DEFAULT now()
-- );

-- CREATE TABLE IF NOT EXISTS public.inbox_messages (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
--   lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
--   channel TEXT NOT NULL CHECK (channel IN ('email','whatsapp','instagram','linkedin','facebook','sms')),
--   direction TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
--   subject TEXT,
--   body TEXT,
--   sender_name TEXT,
--   sender_email TEXT,
--   sender_phone TEXT,
--   external_id TEXT,
--   thread_id TEXT,
--   is_read BOOLEAN DEFAULT FALSE,
--   is_starred BOOLEAN DEFAULT FALSE,
--   ai_reply TEXT,
--   metadata JSONB DEFAULT '{}',
--   created_at TIMESTAMPTZ DEFAULT now(),
--   updated_at TIMESTAMPTZ DEFAULT now()
-- );

-- CREATE TABLE IF NOT EXISTS public.lead_follow_ups (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
--   user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
--   type TEXT NOT NULL CHECK (type IN ('call','email','whatsapp','meeting','task','note')),
--   title TEXT NOT NULL,
--   description TEXT,
--   due_date TIMESTAMPTZ,
--   completed_at TIMESTAMPTZ,
--   status TEXT DEFAULT 'pending' CHECK (status IN ('pending','done','cancelled')),
--   priority TEXT DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
--   created_at TIMESTAMPTZ DEFAULT now(),
--   updated_at TIMESTAMPTZ DEFAULT now()
-- );

-- CREATE TABLE IF NOT EXISTS public.banking_connections (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
--   bank_name TEXT NOT NULL,
--   provider TEXT NOT NULL CHECK (provider IN ('abacate_pay','asaas','iugu','pix_manual','open_banking')),
--   access_token TEXT,
--   refresh_token TEXT,
--   account_number TEXT,
--   agency TEXT,
--   pix_key TEXT,
--   status TEXT DEFAULT 'active' CHECK (status IN ('active','expired','disconnected')),
--   metadata JSONB DEFAULT '{}',
--   created_at TIMESTAMPTZ DEFAULT now(),
--   updated_at TIMESTAMPTZ DEFAULT now()
-- );

-- CREATE TABLE IF NOT EXISTS public.report_exports (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
--   report_type TEXT NOT NULL,
--   format TEXT NOT NULL CHECK (format IN ('pdf','excel','csv','json')),
--   file_url TEXT,
--   parameters JSONB DEFAULT '{}',
--   status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','done','error')),
--   error_msg TEXT,
--   created_at TIMESTAMPTZ DEFAULT now(),
--   expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days')
-- );

/*
============================================================
SUPPLEMENTARY TABLES (051_fix_tracking_tables.sql)
============================================================
*/
-- CREATE TABLE IF NOT EXISTS public.qr_links (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   short_code TEXT UNIQUE NOT NULL,
--   target_url TEXT NOT NULL,
--   title TEXT,
--   development_id UUID REFERENCES developments(id),
--   created_by UUID REFERENCES auth.users(id),
--   scan_count INT DEFAULT 0,
--   is_active BOOLEAN DEFAULT true,
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- CREATE TABLE IF NOT EXISTS public.qr_scans (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   qr_link_id UUID REFERENCES qr_links(id) ON DELETE CASCADE,
--   ip_address TEXT,
--   user_agent TEXT,
--   city TEXT,
--   country TEXT,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

/*
============================================================
SUPPLEMENTARY TABLES (026_avaliacoes_kb.sql)
============================================================
*/
-- CREATE TABLE IF NOT EXISTS avaliacoes_kb_pages (...)
-- CREATE TABLE IF NOT EXISTS avaliacoes_kb_topics (...)

/*
============================================================
SUPPLEMENTARY TABLES (027_push_subscriptions.sql)
============================================================
*/
-- CREATE TABLE IF NOT EXISTS push_subscriptions (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
--   endpoint TEXT NOT NULL UNIQUE,
--   keys JSONB NOT NULL,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

/*
============================================================
SUPPLEMENTARY TABLES (060_invest_engine.sql)
============================================================
*/
-- CREATE TABLE IF NOT EXISTS invest_leads (...)
-- CREATE TABLE IF NOT EXISTS invest_simulations (...)
-- CREATE TABLE IF NOT EXISTS invest_lead_events (...)
-- CREATE TABLE IF NOT EXISTS invest_alerts (...)
-- CREATE TABLE IF NOT EXISTS invest_indices_cache (...)
-- CREATE TABLE IF NOT EXISTS invest_reports (...)

/*
============================================================
SUPPLEMENTARY TABLES (061_metas_okr_kpi.sql)
============================================================
*/
-- CREATE TABLE IF NOT EXISTS okr_objectives (...)
-- CREATE TABLE IF NOT EXISTS okr_key_results (...)
-- CREATE TABLE IF NOT EXISTS okr_checkins (...)
-- CREATE TABLE IF NOT EXISTS kpi_definitions (...)
-- CREATE TABLE IF NOT EXISTS kpi_readings (...)

/*
============================================================
TOTAL TABLES IN PRODUCTION SCHEMA: ~55+
============================================================

Unified migration (30+):
  brokers, role_permissions, profiles, financial_transactions,
  financial_goals, bank_accounts, contratos, proposals,
  proposal_events, avaliacoes, conteudos, ebooks, projetos,
  projeto_unidades, market_reports, market_indicators,
  market_indices, tracking_sessions, page_views, media,
  integration_configs, consultorias, calendar_events,
  pix_charges, credit_applications, widgets_config,
  system_error_logs, daily_sales_stats, ai_tasks,
  valuation_requests, avaliacoes_kb_upload_queue,
  chat_channels, chat_members, chat_messages, chat_read_receipts

Legacy schema (from 001_backoffice_schema):
  developers, developments, leads, notifications,
  team_members, settings, campaigns, evaluations

Multi-tenant (004):
  tenants, niche_playbooks, tenant_users, ai_requests

Supplementary (050-062):
  lead_qualifications, inbox_messages, lead_follow_ups,
  banking_connections, report_exports, qr_links, qr_scans,
  avaliacoes_kb_pages, avaliacoes_kb_topics, push_subscriptions,
  invest_leads, invest_simulations, invest_lead_events,
  invest_alerts, invest_indices_cache, invest_reports,
  okr_objectives, okr_key_results, okr_checkins,
  kpi_definitions, kpi_readings
*/
