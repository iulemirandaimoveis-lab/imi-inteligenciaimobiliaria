-- ============================================================
-- IMI Backoffice, RH & Capital Humano — Full Migration
-- Run in sequence in Supabase SQL Editor
-- ============================================================

-- 001: ROLES AND PERMISSIONS
CREATE TYPE IF NOT EXISTS permission_scope AS ENUM ('none','own','own_supervised','team','department','full');
CREATE TYPE IF NOT EXISTS system_resource AS ENUM ('crm_leads','crm_pipeline','properties','valuations','due_diligence','contracts','commissions','financial_reports','content','analytics','team_management','system_config','templates','documents','training','recruitment');

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  resource system_resource NOT NULL,
  scope permission_scope NOT NULL DEFAULT 'none',
  can_create BOOLEAN DEFAULT false,
  can_read BOOLEAN DEFAULT false,
  can_update BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(role_id, resource)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_resource ON role_permissions(resource);

CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS roles_updated_at ON roles;
CREATE TRIGGER roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 002: TEAM MEMBERS
CREATE TYPE IF NOT EXISTS member_status AS ENUM ('candidate','training','active','inactive','suspended','terminated');
CREATE TYPE IF NOT EXISTS member_level AS ENUM ('trainee','consultor','senior','lider','coordenador','diretor');
CREATE TYPE IF NOT EXISTS contract_type AS ENUM ('associado_creci','pj','clt','estagiario','parceiro_externo');
CREATE TYPE IF NOT EXISTS department AS ENUM ('comercial','tecnologia','operacoes','marketing','rh','financeiro','diretoria');

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  document_cpf TEXT,
  photo_url TEXT,
  role_id UUID NOT NULL REFERENCES roles(id),
  department department NOT NULL,
  level member_level NOT NULL DEFAULT 'trainee',
  contract_type contract_type NOT NULL,
  status member_status NOT NULL DEFAULT 'candidate',
  creci TEXT,
  cnai TEXT,
  ibape_member BOOLEAN DEFAULT false,
  reports_to UUID REFERENCES team_members(id),
  team_leader_id UUID REFERENCES team_members(id),
  specializations TEXT[] DEFAULT '{}',
  hire_date DATE,
  termination_date DATE,
  training_start_date DATE,
  training_end_date DATE,
  commission_split_pct DECIMAL(5,2) DEFAULT 30.00,
  leader_override_pct DECIMAL(5,2) DEFAULT 0.00,
  nda_signed BOOLEAN DEFAULT false,
  nda_signed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(role_id);
CREATE INDEX IF NOT EXISTS idx_team_members_department ON team_members(department);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);
DROP TRIGGER IF EXISTS team_members_updated_at ON team_members;
CREATE TRIGGER team_members_updated_at BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 003: RECRUITMENT
CREATE TYPE IF NOT EXISTS recruitment_stage AS ENUM ('applied','screening','screening_approved','interview_scheduled','interview_done','technical_assessment','behavioral_assessment','immersion_day','offer_sent','offer_accepted','hired','rejected','withdrawn');
CREATE TYPE IF NOT EXISTS recruitment_channel AS ENUM ('instagram','linkedin','referral_internal','referral_external','university','tti_school','event','website','job_board','other');

CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  linkedin_url TEXT,
  stage recruitment_stage NOT NULL DEFAULT 'applied',
  target_department department NOT NULL,
  target_role_id UUID REFERENCES roles(id),
  channel recruitment_channel NOT NULL,
  referrer_id UUID REFERENCES team_members(id),
  has_creci BOOLEAN DEFAULT false,
  creci_number TEXT,
  years_experience INTEGER DEFAULT 0,
  current_company TEXT,
  motivation TEXT,
  salary_expectation TEXT,
  score_active_listening INTEGER CHECK (score_active_listening BETWEEN 1 AND 5),
  score_consultative_tone INTEGER CHECK (score_consultative_tone BETWEEN 1 AND 5),
  score_technical_knowledge INTEGER CHECK (score_technical_knowledge BETWEEN 1 AND 5),
  score_communication INTEGER CHECK (score_communication BETWEEN 1 AND 5),
  score_imi_alignment INTEGER CHECK (score_imi_alignment BETWEEN 1 AND 5),
  behavioral_profile TEXT,
  behavioral_notes TEXT,
  rejection_reason TEXT,
  team_member_id UUID REFERENCES team_members(id),
  recruiter_id UUID REFERENCES team_members(id),
  interviewer_id UUID REFERENCES team_members(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS candidate_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  from_stage recruitment_stage,
  to_stage recruitment_stage NOT NULL,
  changed_by UUID REFERENCES team_members(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

DROP TRIGGER IF EXISTS candidates_updated_at ON candidates;
CREATE TRIGGER candidates_updated_at BEFORE UPDATE ON candidates FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 004: TRAINING & ACADEMY
CREATE TABLE IF NOT EXISTS training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration_weeks INTEGER NOT NULL,
  is_mandatory BOOLEAN DEFAULT true,
  prerequisite_module_id UUID REFERENCES training_modules(id),
  target_departments department[] NOT NULL,
  min_level_required member_level DEFAULT 'trainee',
  content_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES training_modules(id),
  status TEXT CHECK (status IN ('not_started','in_progress','completed','failed')) DEFAULT 'not_started',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  score DECIMAL(5,2),
  evaluator_id UUID REFERENCES team_members(id),
  evaluator_notes TEXT,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_member_id, module_id)
);

CREATE TABLE IF NOT EXISTS certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  certification_type TEXT NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT now(),
  granted_by UUID REFERENCES team_members(id),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 005: COMMISSIONS
CREATE TYPE IF NOT EXISTS deal_type AS ENUM ('venda','locacao','avaliacao','consultoria','estruturacao','internacional');
CREATE TYPE IF NOT EXISTS deal_status AS ENUM ('prospecting','proposal','negotiation','closed_won','closed_lost','cancelled');
CREATE TYPE IF NOT EXISTS commission_status AS ENUM ('pending','receivable','paid','disputed','cancelled');

CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_type deal_type NOT NULL,
  status deal_status NOT NULL DEFAULT 'prospecting',
  deal_value DECIMAL(15,2) NOT NULL,
  commission_total DECIMAL(15,2),
  commission_pct DECIMAL(5,2),
  currency TEXT DEFAULT 'BRL' CHECK (currency IN ('BRL','USD','AED')),
  property_id UUID,
  lead_id UUID,
  primary_agent_id UUID NOT NULL REFERENCES team_members(id),
  secondary_agent_id UUID REFERENCES team_members(id),
  team_leader_id UUID REFERENCES team_members(id),
  custom_split_primary DECIMAL(5,2),
  custom_split_secondary DECIMAL(5,2),
  custom_split_imi DECIMAL(5,2),
  proposal_date DATE,
  closing_date DATE,
  expected_payment_date DATE,
  description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES team_members(id),
  commission_type TEXT NOT NULL CHECK (commission_type IN ('primary_agent','secondary_agent','leader_override','referral_bonus','performance_bonus')),
  gross_amount DECIMAL(15,2) NOT NULL,
  deductions DECIMAL(15,2) DEFAULT 0,
  net_amount DECIMAL(15,2) GENERATED ALWAYS AS (gross_amount - COALESCE(deductions, 0)) STORED,
  split_pct DECIMAL(5,2) NOT NULL,
  status commission_status NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  payment_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 006: ONBOARDING
CREATE TABLE IF NOT EXISTS onboarding_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase TEXT NOT NULL CHECK (phase IN ('pre_day0','week1','week2_3','week4','day30_review')),
  item_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  responsible_role TEXT NOT NULL,
  target_departments department[] NOT NULL DEFAULT '{comercial,tecnologia,operacoes,marketing,rh,financeiro}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  template_item_id UUID NOT NULL REFERENCES onboarding_templates(id),
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES team_members(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_member_id, template_item_id)
);

CREATE TABLE IF NOT EXISTS onboarding_buddies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  new_member_id UUID NOT NULL REFERENCES team_members(id),
  buddy_id UUID NOT NULL REFERENCES team_members(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  feedback_30d TEXT,
  feedback_buddy TEXT,
  CHECK (new_member_id != buddy_id)
);

CREATE TABLE IF NOT EXISTS performance_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period IN ('30d','60d','90d','180d')),
  goal TEXT NOT NULL,
  evidence TEXT,
  status TEXT CHECK (status IN ('not_started','in_progress','achieved','missed')) DEFAULT 'not_started',
  target_date DATE,
  completed_at TIMESTAMPTZ,
  evaluator_id UUID REFERENCES team_members(id),
  evaluator_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 007: KPIs
CREATE TABLE IF NOT EXISTS kpi_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('higher_is_better','lower_is_better')),
  target_departments department[] NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily','weekly','monthly','quarterly')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kpi_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_id UUID NOT NULL REFERENCES kpi_definitions(id),
  team_member_id UUID REFERENCES team_members(id),
  department department,
  target_value DECIMAL(15,2) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (team_member_id IS NOT NULL OR department IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS kpi_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_id UUID NOT NULL REFERENCES kpi_definitions(id),
  team_member_id UUID REFERENCES team_members(id),
  department department,
  actual_value DECIMAL(15,2) NOT NULL,
  period_date DATE NOT NULL,
  notes TEXT,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (team_member_id IS NOT NULL OR department IS NOT NULL)
);

-- 008: AUDIT LOG
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  team_member_id UUID REFERENCES team_members(id),
  ip_address INET,
  user_agent TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB,
  severity TEXT CHECK (severity IN ('info','warning','critical')) DEFAULT 'info',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);

-- 009: RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Auth-based policies (all tables require authentication)
CREATE POLICY "auth_access_team_members" ON team_members FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_access_candidates" ON candidates FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_access_candidate_history" ON candidate_stage_history FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_access_training_modules" ON training_modules FOR SELECT USING (true);
CREATE POLICY "auth_manage_training_modules" ON training_modules FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_access_training_progress" ON training_progress FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_access_certifications" ON certifications FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_access_deals" ON deals FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_access_commissions" ON commissions FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_access_onboarding_templates" ON onboarding_templates FOR SELECT USING (true);
CREATE POLICY "auth_access_onboarding_progress" ON onboarding_progress FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_access_milestones" ON performance_milestones FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_access_kpi_defs" ON kpi_definitions FOR SELECT USING (true);
CREATE POLICY "auth_access_kpi_targets" ON kpi_targets FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_access_kpi_records" ON kpi_records FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_read_audit" ON audit_log FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "system_insert_audit" ON audit_log FOR INSERT WITH CHECK (true);

-- 010: SEED DATA (Roles)
INSERT INTO roles (name, display_name, description, is_system) VALUES
('admin', 'Administrador', 'Acesso total ao sistema', true),
('diretor_geral', 'Diretor Geral', 'Direção estratégica e operacional', true),
('diretor_comercial', 'Diretor Comercial', 'Gestão comercial completa', true),
('lider_equipe', 'Líder de Equipe', 'Gestão da própria equipe comercial', true),
('corretor', 'Corretor', 'Operação comercial individual', true),
('corretor_trainee', 'Corretor Trainee', 'Em formação, operação supervisionada', true),
('avaliador', 'Perito Avaliador', 'Avaliações NBR 14653 e laudos', true),
('consultor_patrimonial', 'Consultor Patrimonial', 'Estruturação e investimento', true),
('backoffice', 'Backoffice', 'Documentação, DD e compliance', true),
('financeiro', 'Financeiro', 'Faturamento, comissões, relatórios', true),
('juridico', 'Jurídico', 'Contratos, pareceres, estruturação', true),
('marketing', 'Marketing', 'Conteúdo, campanhas, analytics', true),
('dev', 'Desenvolvedor', 'Acesso técnico ao sistema', true),
('rh', 'RH / People', 'Recrutamento, onboarding, capacitação', true),
('designer', 'Designer', 'UI/UX, visual, motion', true)
ON CONFLICT (name) DO NOTHING;

-- SEED: Training Modules (IMI Academy)
INSERT INTO training_modules (code, name, description, duration_weeks, is_mandatory, target_departments, min_level_required, sort_order) VALUES
('M1', 'Fundamentos IMI', 'Visão, posicionamento, tom, personas, compliance', 1, true, '{comercial,tecnologia,operacoes,marketing,rh,financeiro}', 'trainee', 1),
('M2', 'Técnico Imobiliário', 'NBR 14653, due diligence, documentação', 2, true, '{comercial,operacoes}', 'trainee', 2),
('M3', 'Comercial Consultivo', 'Pipeline, qualificação, dossiê, objeções', 2, true, '{comercial}', 'trainee', 3),
('M4', 'Plataforma & Tech', 'CRM, motor de avaliação, Supabase, LGPD', 1, true, '{comercial,tecnologia,operacoes,marketing,rh,financeiro}', 'trainee', 4),
('M5_EUA', 'Internacional — EUA', 'LLC, FIRPTA, mercados FL/TX/NY', 2, false, '{comercial}', 'consultor', 10),
('M5_DUBAI', 'Internacional — Dubai', 'Freehold, DLD, Golden Visa', 2, false, '{comercial}', 'consultor', 11),
('M5_AGRO', 'Agro & Rural', 'Fazendas, CAR, mineração, carbono', 2, false, '{comercial}', 'consultor', 12),
('M5_AVAL', 'Avaliação Avançada', 'Regressão, inferência, grau III', 3, false, '{comercial}', 'senior', 13),
('M5_PATRI', 'Estruturação Patrimonial', 'Holding, trust, offshore', 3, false, '{comercial}', 'senior', 14),
('M5_LIDER', 'Liderança de Equipe', 'Gestão pipeline, mentoria', 2, false, '{comercial}', 'senior', 15)
ON CONFLICT (code) DO NOTHING;

-- SEED: KPI Definitions
INSERT INTO kpi_definitions (code, name, unit, direction, target_departments, frequency) VALUES
('lead_response_time', 'Tempo de Resposta ao Lead', 'hours', 'lower_is_better', '{comercial}', 'daily'),
('qualification_rate', 'Taxa de Qualificação', 'percent', 'higher_is_better', '{comercial}', 'weekly'),
('conversion_rate', 'Taxa de Conversão', 'percent', 'higher_is_better', '{comercial}', 'monthly'),
('ticket_medio', 'Ticket Médio', 'currency', 'higher_is_better', '{comercial}', 'monthly'),
('nps_cliente', 'NPS do Cliente', 'score', 'higher_is_better', '{comercial}', 'monthly'),
('deploy_frequency', 'Frequência de Deploy', 'count', 'higher_is_better', '{tecnologia}', 'weekly'),
('uptime', 'Uptime', 'percent', 'higher_is_better', '{tecnologia}', 'monthly'),
('organic_traffic', 'Tráfego Orgânico', 'count', 'higher_is_better', '{marketing}', 'monthly'),
('leads_generated', 'Leads Gerados', 'count', 'higher_is_better', '{marketing}', 'monthly'),
('time_to_hire', 'Tempo de Contratação', 'count', 'lower_is_better', '{rh}', 'monthly')
ON CONFLICT (code) DO NOTHING;
