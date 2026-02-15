-- =============================================
-- IMI ATLANTIS - BACKOFFICE DATABASE SCHEMA
-- Supabase SQL Migration Script
-- Version: 1.0.0
-- Date: 2026-02-15
-- =============================================

-- =============================================
-- 1. EXTENSIONS
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- =============================================
-- 2. ENUMS
-- =============================================

-- Lead Status
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'negotiating', 'won', 'lost');

-- Lead Origin
CREATE TYPE lead_origin AS ENUM ('website', 'instagram', 'facebook', 'google', 'whatsapp', 'referral', 'other');

-- Property Type
CREATE TYPE property_type AS ENUM ('apartment', 'house', 'condo', 'land', 'commercial', 'penthouse');

-- Property Status
CREATE TYPE property_status AS ENUM ('available', 'reserved', 'sold', 'unavailable');

-- Credit Status
CREATE TYPE credit_status AS ENUM ('pending', 'analysis', 'approved', 'rejected', 'completed');

-- Evaluation Status
CREATE TYPE evaluation_status AS ENUM ('pending', 'in_progress', 'completed', 'delivered');

-- Campaign Status
CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'paused', 'completed', 'cancelled');

-- Campaign Channel
CREATE TYPE campaign_channel AS ENUM ('instagram', 'facebook', 'google', 'email', 'whatsapp', 'site');

-- User Role
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'agent', 'viewer');

-- User Status
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'pending');

-- Notification Type
CREATE TYPE notification_type AS ENUM ('lead', 'property', 'credit', 'evaluation', 'campaign', 'system');

-- Notification Priority
CREATE TYPE notification_priority AS ENUM ('high', 'medium', 'low');

-- =============================================
-- 3. TABLES
-- =============================================

-- ----------------
-- 3.1 LEADS
-- ----------------
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Personal Info
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  cpf VARCHAR(14),
  
  -- Lead Info
  status lead_status DEFAULT 'new',
  origin lead_origin DEFAULT 'website',
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 20),
  
  -- Interest
  interest_type property_type,
  interest_location VARCHAR(255),
  budget_min DECIMAL(12, 2),
  budget_max DECIMAL(12, 2),
  bedrooms INTEGER,
  
  -- Personal Details
  occupation VARCHAR(255),
  income DECIMAL(12, 2),
  marital_status VARCHAR(50),
  children INTEGER DEFAULT 0,
  
  -- Requirements
  financing_needed BOOLEAN DEFAULT false,
  urgency VARCHAR(50),
  notes TEXT,
  
  -- Assignment
  assigned_to UUID REFERENCES auth.users(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_contact_at TIMESTAMP WITH TIME ZONE,
  
  -- Indexes
  CONSTRAINT leads_email_key UNIQUE (email)
);

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_origin ON leads(origin);
CREATE INDEX idx_leads_score ON leads(score DESC);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_email_trgm ON leads USING gin(email gin_trgm_ops);
CREATE INDEX idx_leads_name_trgm ON leads USING gin(name gin_trgm_ops);

-- ----------------
-- 3.2 DEVELOPERS
-- ----------------
CREATE TABLE developers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  description TEXT,
  website VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ----------------
-- 3.3 DEVELOPMENTS (Empreendimentos)
-- ----------------
CREATE TABLE developments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic Info
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  developer_id UUID REFERENCES developers(id) ON DELETE SET NULL,
  type property_type NOT NULL,
  status property_status DEFAULT 'available',
  
  -- Location
  address TEXT NOT NULL,
  neighborhood VARCHAR(255),
  city VARCHAR(255) NOT NULL,
  state VARCHAR(2) NOT NULL,
  zip_code VARCHAR(10),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Characteristics
  total_area DECIMAL(10, 2),
  private_area DECIMAL(10, 2),
  bedrooms INTEGER,
  suites INTEGER,
  bathrooms INTEGER,
  parking_spaces INTEGER,
  floor INTEGER,
  total_floors INTEGER,
  
  -- Pricing
  price_min DECIMAL(12, 2),
  price_max DECIMAL(12, 2),
  price_per_sqm DECIMAL(10, 2),
  
  -- Units
  total_units INTEGER,
  available_units INTEGER,
  
  -- Dates
  delivery_date DATE,
  
  -- Features (JSONB for flexibility)
  features JSONB DEFAULT '[]',
  amenities JSONB DEFAULT '[]',
  
  -- Media
  images JSONB DEFAULT '[]',
  videos JSONB DEFAULT '[]',
  virtual_tour_url TEXT,
  
  -- SEO
  meta_title VARCHAR(255),
  meta_description TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_developments_slug ON developments(slug);
CREATE INDEX idx_developments_status ON developments(status);
CREATE INDEX idx_developments_type ON developments(type);
CREATE INDEX idx_developments_city ON developments(city);
CREATE INDEX idx_developments_developer_id ON developments(developer_id);
CREATE INDEX idx_developments_name_trgm ON developments USING gin(name gin_trgm_ops);

-- ----------------
-- 3.4 CREDIT APPLICATIONS
-- ----------------
CREATE TABLE credit_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  protocol VARCHAR(50) UNIQUE NOT NULL,
  
  -- Client
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  client_phone VARCHAR(20),
  client_cpf VARCHAR(14) NOT NULL,
  client_income DECIMAL(12, 2),
  client_occupation VARCHAR(255),
  
  -- Property
  property_address TEXT NOT NULL,
  property_type property_type,
  property_value DECIMAL(12, 2) NOT NULL,
  property_area DECIMAL(10, 2),
  
  -- Financing
  bank VARCHAR(255),
  financed_amount DECIMAL(12, 2) NOT NULL,
  down_payment DECIMAL(12, 2) NOT NULL,
  term_months INTEGER NOT NULL,
  interest_rate DECIMAL(5, 2),
  monthly_payment DECIMAL(12, 2),
  system VARCHAR(20), -- SAC, PRICE
  
  -- Metrics
  ltv DECIMAL(5, 2), -- Loan to Value
  dti DECIMAL(5, 2), -- Debt to Income
  
  -- Status
  status credit_status DEFAULT 'pending',
  
  -- Documents (JSONB array)
  documents JSONB DEFAULT '[]',
  
  -- Timeline (JSONB array)
  timeline JSONB DEFAULT '[]',
  
  -- Assignment
  assigned_to UUID REFERENCES auth.users(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_credit_protocol ON credit_applications(protocol);
CREATE INDEX idx_credit_status ON credit_applications(status);
CREATE INDEX idx_credit_client_cpf ON credit_applications(client_cpf);
CREATE INDEX idx_credit_assigned_to ON credit_applications(assigned_to);

-- ----------------
-- 3.5 EVALUATIONS (Avaliações Técnicas)
-- ----------------
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  protocol VARCHAR(50) UNIQUE NOT NULL,
  
  -- Property
  property_address TEXT NOT NULL,
  property_type property_type,
  property_area DECIMAL(10, 2),
  property_bedrooms INTEGER,
  property_bathrooms INTEGER,
  property_parking INTEGER,
  property_city VARCHAR(255),
  property_state VARCHAR(2),
  
  -- Client
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  client_phone VARCHAR(20),
  client_document VARCHAR(20),
  
  -- Evaluation
  purpose VARCHAR(255), -- Compra/Venda, Financiamento, etc
  method VARCHAR(255), -- NBR 14653 methods
  request_date DATE NOT NULL,
  deadline DATE,
  completion_date DATE,
  
  -- Results
  estimated_value DECIMAL(12, 2),
  report_url TEXT,
  
  -- Status
  status evaluation_status DEFAULT 'pending',
  
  -- Documents (JSONB array)
  documents JSONB DEFAULT '[]',
  
  -- Assignment
  assigned_to UUID REFERENCES auth.users(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_evaluations_protocol ON evaluations(protocol);
CREATE INDEX idx_evaluations_status ON evaluations(status);
CREATE INDEX idx_evaluations_assigned_to ON evaluations(assigned_to);

-- ----------------
-- 3.6 CAMPAIGNS
-- ----------------
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic
  name VARCHAR(255) NOT NULL,
  objective VARCHAR(255),
  channel campaign_channel NOT NULL,
  status campaign_status DEFAULT 'draft',
  
  -- Dates
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Budget
  budget DECIMAL(12, 2) NOT NULL,
  daily_budget DECIMAL(12, 2),
  spent DECIMAL(12, 2) DEFAULT 0,
  
  -- Goals
  expected_leads INTEGER,
  cost_per_lead DECIMAL(10, 2),
  
  -- Targeting
  target_audience TEXT,
  age_range VARCHAR(20),
  location JSONB DEFAULT '[]',
  interests JSONB DEFAULT '[]',
  
  -- Creatives
  ad_title VARCHAR(255),
  ad_description TEXT,
  call_to_action VARCHAR(100),
  landing_page_url TEXT,
  images JSONB DEFAULT '[]',
  
  -- Tracking
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  
  -- Metrics
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  leads INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  ctr DECIMAL(5, 2) DEFAULT 0,
  roi DECIMAL(10, 2) DEFAULT 0,
  
  -- Assignment
  created_by UUID REFERENCES auth.users(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_channel ON campaigns(channel);
CREATE INDEX idx_campaigns_start_date ON campaigns(start_date DESC);
CREATE INDEX idx_campaigns_created_by ON campaigns(created_by);

-- ----------------
-- 3.7 NOTIFICATIONS
-- ----------------
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Target
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Content
  type notification_type NOT NULL,
  priority notification_priority DEFAULT 'medium',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  
  -- Status
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

-- ----------------
-- 3.8 TEAM MEMBERS (Extended User Profiles)
-- ----------------
CREATE TABLE team_members (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Profile
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  avatar_url TEXT,
  
  -- Role & Status
  role user_role DEFAULT 'agent',
  status user_status DEFAULT 'pending',
  
  -- Stats
  total_leads INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  total_revenue DECIMAL(12, 2) DEFAULT 0,
  
  -- Timestamps
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Settings (JSONB)
  settings JSONB DEFAULT '{}'
);

CREATE INDEX idx_team_members_role ON team_members(role);
CREATE INDEX idx_team_members_status ON team_members(status);
CREATE INDEX idx_team_members_email ON team_members(email);

-- ----------------
-- 3.9 SETTINGS
-- ----------------
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Company
  company_name VARCHAR(255),
  company_email VARCHAR(255),
  company_phone VARCHAR(20),
  company_address TEXT,
  
  -- Notifications
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  weekly_report BOOLEAN DEFAULT true,
  lead_alerts BOOLEAN DEFAULT true,
  
  -- Appearance
  theme VARCHAR(20) DEFAULT 'light',
  language VARCHAR(10) DEFAULT 'pt-BR',
  
  -- Security
  two_factor_auth BOOLEAN DEFAULT false,
  session_timeout INTEGER DEFAULT 30,
  
  -- Integrations
  google_analytics VARCHAR(255),
  facebook_pixel VARCHAR(255),
  whatsapp_api TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_settings_user_id ON settings(user_id);

-- =============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE developments ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Leads Policies
CREATE POLICY "Users can view all leads" ON leads FOR SELECT USING (true);
CREATE POLICY "Users can insert leads" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update assigned leads" ON leads FOR UPDATE USING (assigned_to = auth.uid() OR EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND role IN ('admin', 'manager')));
CREATE POLICY "Admins can delete leads" ON leads FOR DELETE USING (EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND role = 'admin'));

-- Developers Policies
CREATE POLICY "Anyone can view developers" ON developers FOR SELECT USING (true);
CREATE POLICY "Admins can manage developers" ON developers FOR ALL USING (EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND role IN ('admin', 'manager')));

-- Developments Policies
CREATE POLICY "Anyone can view published developments" ON developments FOR SELECT USING (published_at IS NOT NULL OR EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid()));
CREATE POLICY "Admins can manage developments" ON developments FOR ALL USING (EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND role IN ('admin', 'manager')));

-- Credit Applications Policies
CREATE POLICY "Users can view all credit applications" ON credit_applications FOR SELECT USING (true);
CREATE POLICY "Users can create credit applications" ON credit_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update assigned applications" ON credit_applications FOR UPDATE USING (assigned_to = auth.uid() OR EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND role IN ('admin', 'manager')));

-- Evaluations Policies
CREATE POLICY "Users can view all evaluations" ON evaluations FOR SELECT USING (true);
CREATE POLICY "Users can create evaluations" ON evaluations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update assigned evaluations" ON evaluations FOR UPDATE USING (assigned_to = auth.uid() OR EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND role IN ('admin', 'manager')));

-- Campaigns Policies
CREATE POLICY "Users can view all campaigns" ON campaigns FOR SELECT USING (true);
CREATE POLICY "Users can create campaigns" ON campaigns FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own campaigns" ON campaigns FOR UPDATE USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND role IN ('admin', 'manager')));

-- Notifications Policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (user_id = auth.uid());

-- Team Members Policies
CREATE POLICY "Users can view all team members" ON team_members FOR SELECT USING (true);
CREATE POLICY "Admins can manage team members" ON team_members FOR ALL USING (EXISTS (SELECT 1 FROM team_members WHERE id = auth.uid() AND role = 'admin'));

-- Settings Policies
CREATE POLICY "Users can view own settings" ON settings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own settings" ON settings FOR ALL USING (user_id = auth.uid());

-- =============================================
-- 5. TRIGGERS
-- =============================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_developers_updated_at BEFORE UPDATE ON developers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_developments_updated_at BEFORE UPDATE ON developments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_credit_updated_at BEFORE UPDATE ON credit_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON evaluations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 6. FUNCTIONS
-- =============================================

-- Function to calculate lead score
CREATE OR REPLACE FUNCTION calculate_lead_score(lead_id UUID)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  lead_record RECORD;
BEGIN
  SELECT * INTO lead_record FROM leads WHERE id = lead_id;
  
  -- Email (2 points)
  IF lead_record.email IS NOT NULL AND lead_record.email LIKE '%@%' THEN
    score := score + 2;
  END IF;
  
  -- Phone (2 points)
  IF lead_record.phone IS NOT NULL AND LENGTH(lead_record.phone) >= 10 THEN
    score := score + 2;
  END IF;
  
  -- Origin (3 points for referral, 2 for others)
  IF lead_record.origin = 'referral' THEN
    score := score + 3;
  ELSIF lead_record.origin IS NOT NULL THEN
    score := score + 2;
  END IF;
  
  -- Interest type (2 points)
  IF lead_record.interest_type IS NOT NULL THEN
    score := score + 2;
  END IF;
  
  -- Location (2 points)
  IF lead_record.interest_location IS NOT NULL THEN
    score := score + 2;
  END IF;
  
  -- Budget (3 points)
  IF lead_record.budget_min IS NOT NULL AND lead_record.budget_max IS NOT NULL THEN
    score := score + 3;
  END IF;
  
  -- Income (3 points)
  IF lead_record.income IS NOT NULL AND lead_record.income > 0 THEN
    score := score + 3;
  END IF;
  
  -- Urgency (2 points for immediate)
  IF lead_record.urgency = 'immediate' THEN
    score := score + 2;
  ELSIF lead_record.urgency IS NOT NULL THEN
    score := score + 1;
  END IF;
  
  RETURN LEAST(score, 20); -- Max 20 points
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 7. SAMPLE DATA (Optional - for testing)
-- =============================================

-- Insert sample admin user (you'll need to create this user in Supabase Auth first)
-- Then run this to create the team member profile:
-- INSERT INTO team_members (id, name, email, role, status)
-- VALUES ('YOUR-USER-UUID-HERE', 'Laila Miranda', 'laila@iulemirandaimoveis.com.br', 'admin', 'active');

-- =============================================
-- END OF MIGRATION
-- =============================================
