-- =============================================
-- IMI ATLANTIS - BACKOFFICE DATABASE SCHEMA (CORRIGIDO V2)
-- Versão Evolutiva: Cria tabelas novas E atualiza tabelas antigas
-- =============================================

-- Habilita extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. Cria Types apenas se não existirem
DO $$ BEGIN CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'negotiating', 'won', 'lost'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE lead_origin AS ENUM ('website', 'instagram', 'facebook', 'google', 'whatsapp', 'referral', 'other'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE property_type AS ENUM ('apartment', 'house', 'condo', 'land', 'commercial', 'penthouse'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE property_status AS ENUM ('available', 'reserved', 'sold', 'unavailable'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'paused', 'completed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE campaign_channel AS ENUM ('instagram', 'facebook', 'google', 'email', 'whatsapp', 'site'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE notification_type AS ENUM ('lead', 'property', 'credit', 'evaluation', 'campaign', 'system'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('admin', 'manager', 'agent', 'viewer'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE user_status AS ENUM ('active', 'inactive', 'pending'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE notification_priority AS ENUM ('high', 'medium', 'low'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE evaluation_status AS ENUM ('pending', 'in_progress', 'completed', 'delivered'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Atualiza Tabelas Existentes (Adiciona colunas que faltam)

-- DEVELOPERS
CREATE TABLE IF NOT EXISTS developers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  logo_url TEXT,
  description TEXT,
  website VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Garante colunas em developers existente
DO $$ BEGIN
    ALTER TABLE developers ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;
EXCEPTION WHEN duplicate_column THEN null; END $$;

-- DEVELOPMENTS (Aqui estava o erro: garantindo todas as colunas)
CREATE TABLE IF NOT EXISTS developments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  developer_id UUID REFERENCES developers(id) ON DELETE SET NULL,
  type property_type NOT NULL,
  status property_status DEFAULT 'available',
  address TEXT NOT NULL,
  neighborhood VARCHAR(255),
  city VARCHAR(255) NOT NULL,
  state VARCHAR(2) NOT NULL,
  zip_code VARCHAR(10),
  -- Colunas numéricas que podem faltar
  total_area DECIMAL(10, 2),
  private_area DECIMAL(10, 2),
  bedrooms INTEGER,
  suites INTEGER,
  bathrooms INTEGER,
  parking_spaces INTEGER,
  floor INTEGER,
  total_floors INTEGER,
  price_min DECIMAL(12, 2),
  price_max DECIMAL(12, 2),
  price_per_sqm DECIMAL(10, 2),
  total_units INTEGER,
  available_units INTEGER,
  delivery_date DATE,
  features JSONB DEFAULT '[]',
  amenities JSONB DEFAULT '[]',
  images JSONB DEFAULT '[]',
  videos JSONB DEFAULT '[]',
  virtual_tour_url TEXT,
  meta_title VARCHAR(255),
  meta_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Mágica: Adiciona colunas se faltarem na tabela existente
DO $$ BEGIN
    -- Remove obrigatoriedade de coluna legada 'developer' se existir (causa do erro 23502)
    BEGIN
        ALTER TABLE developments ALTER COLUMN developer DROP NOT NULL;
    EXCEPTION
        WHEN undefined_column THEN null;
    END;

    -- Adiciona colunas novas
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS total_area DECIMAL(10, 2);
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS private_area DECIMAL(10, 2);
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS suites INTEGER;
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS parking_spaces INTEGER;
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS price_min DECIMAL(12, 2);
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS price_max DECIMAL(12, 2);
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS price_per_sqm DECIMAL(10, 2);
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS total_units INTEGER;
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS available_units INTEGER;
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS delivery_date DATE;
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]';
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]';
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';
    ALTER TABLE developments ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;
EXCEPTION WHEN duplicate_column THEN null; END $$;

-- LEADS
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  cpf VARCHAR(14),
  status lead_status DEFAULT 'new',
  origin lead_origin DEFAULT 'website',
  score INTEGER DEFAULT 0,
  interest_type property_type,
  interest_location VARCHAR(255),
  budget_min DECIMAL(12, 2),
  budget_max DECIMAL(12, 2),
  bedrooms INTEGER,
  occupation VARCHAR(255),
  income DECIMAL(12, 2),
  marital_status VARCHAR(50),
  children INTEGER DEFAULT 0,
  financing_needed BOOLEAN DEFAULT false,
  urgency VARCHAR(50),
  notes TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_contact_at TIMESTAMP WITH TIME ZONE
);
-- Atualiza leads existente
DO $$ BEGIN
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS origin lead_origin DEFAULT 'website';
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS budget_min DECIMAL(12, 2);
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS budget_max DECIMAL(12, 2);
EXCEPTION WHEN duplicate_column THEN null; END $$;

-- CREDIT APPLICATIONS (Nova)
CREATE TABLE IF NOT EXISTS credit_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  protocol VARCHAR(50) UNIQUE NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  client_phone VARCHAR(20),
  client_cpf VARCHAR(14) NOT NULL,
  client_income DECIMAL(12, 2),
  client_occupation VARCHAR(255),
  property_address TEXT NOT NULL,
  property_type property_type,
  property_value DECIMAL(12, 2) NOT NULL,
  property_area DECIMAL(10, 2),
  bank VARCHAR(255),
  financed_amount DECIMAL(12, 2) NOT NULL,
  down_payment DECIMAL(12, 2) NOT NULL,
  term_months INTEGER NOT NULL,
  interest_rate DECIMAL(5, 2),
  monthly_payment DECIMAL(12, 2),
  system VARCHAR(20),
  ltv DECIMAL(5, 2),
  dti DECIMAL(5, 2),
  status VARCHAR(50) DEFAULT 'pending', 
  documents JSONB DEFAULT '[]',
  timeline JSONB DEFAULT '[]',
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Demais tabelas novas (Notifications, Settings, etc)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  priority notification_priority DEFAULT 'medium',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  avatar_url TEXT,
  role user_role DEFAULT 'agent',
  status user_status DEFAULT 'pending',
  total_leads INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  total_revenue DECIMAL(12, 2) DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  settings JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  company_name VARCHAR(255),
  company_email VARCHAR(255),
  company_phone VARCHAR(20),
  company_address TEXT,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  weekly_report BOOLEAN DEFAULT true,
  lead_alerts BOOLEAN DEFAULT true,
  theme VARCHAR(20) DEFAULT 'light',
  language VARCHAR(10) DEFAULT 'pt-BR',
  two_factor_auth BOOLEAN DEFAULT false,
  session_timeout INTEGER DEFAULT 30,
  google_analytics VARCHAR(255),
  facebook_pixel VARCHAR(255),
  whatsapp_api TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  objective VARCHAR(255),
  channel campaign_channel NOT NULL,
  status campaign_status DEFAULT 'draft',
  start_date DATE NOT NULL,
  end_date DATE,
  budget DECIMAL(12, 2) NOT NULL,
  daily_budget DECIMAL(12, 2),
  spent DECIMAL(12, 2) DEFAULT 0,
  expected_leads INTEGER,
  cost_per_lead DECIMAL(10, 2),
  target_audience TEXT,
  age_range VARCHAR(20),
  location JSONB DEFAULT '[]',
  interests JSONB DEFAULT '[]',
  ad_title VARCHAR(255),
  ad_description TEXT,
  call_to_action VARCHAR(100),
  landing_page_url TEXT,
  images JSONB DEFAULT '[]',
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  leads INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  ctr DECIMAL(5, 2) DEFAULT 0,
  roi DECIMAL(10, 2) DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  protocol VARCHAR(50) UNIQUE NOT NULL,
  property_address TEXT NOT NULL,
  property_type property_type,
  property_area DECIMAL(10, 2),
  property_bedrooms INTEGER,
  property_bathrooms INTEGER,
  property_parking INTEGER,
  property_city VARCHAR(255),
  property_state VARCHAR(2),
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  client_phone VARCHAR(20),
  client_document VARCHAR(20),
  purpose VARCHAR(255),
  method VARCHAR(255),
  request_date DATE NOT NULL,
  deadline DATE,
  completion_date DATE,
  estimated_value DECIMAL(12, 2),
  report_url TEXT,
  status evaluation_status DEFAULT 'pending',
  documents JSONB DEFAULT '[]',
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS e Policies (Sempre tenta criar, ignora se já existir)
DO $$ BEGIN
    ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can view all team members" ON team_members FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can view own settings" ON settings FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Garante que outras tabelas tenham RLS
ALTER TABLE developments ENABLE ROW LEVEL SECURITY;
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_applications ENABLE ROW LEVEL SECURITY;

-- Cria policies padrão se não existirem
DO $$ BEGIN CREATE POLICY "Public read developments" ON developments FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE POLICY "Public read developers" ON developers FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN null; END $$;
