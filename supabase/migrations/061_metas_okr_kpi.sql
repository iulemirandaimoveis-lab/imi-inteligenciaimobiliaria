-- ============================================================
-- MIGRATION 061: MÓDULO DE METAS — OKR + KPI
-- Framework de metas para tracking de objetivos e KPIs
-- ============================================================

-- Tabela de OKRs (Objectives)
CREATE TABLE IF NOT EXISTS okr_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES profiles(id),
  department TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('company', 'department', 'individual')),
  parent_objective_id UUID REFERENCES okr_objectives(id),
  quarter TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  final_score DECIMAL(3,2)
);

CREATE INDEX IF NOT EXISTS idx_okr_obj_quarter ON okr_objectives(quarter);
CREATE INDEX IF NOT EXISTS idx_okr_obj_status ON okr_objectives(status);
CREATE INDEX IF NOT EXISTS idx_okr_obj_owner ON okr_objectives(owner_id);
CREATE INDEX IF NOT EXISTS idx_okr_obj_dept ON okr_objectives(department);

-- Tabela de Key Results
CREATE TABLE IF NOT EXISTS okr_key_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  objective_id UUID REFERENCES okr_objectives(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('number', 'percentage', 'currency', 'boolean')),
  start_value DECIMAL(15,2) DEFAULT 0,
  target_value DECIMAL(15,2) NOT NULL,
  current_value DECIMAL(15,2) DEFAULT 0,
  unit TEXT,
  direction TEXT DEFAULT 'increase' CHECK (direction IN ('increase', 'decrease', 'maintain')),
  confidence TEXT DEFAULT 'on_track' CHECK (confidence IN ('on_track', 'at_risk', 'off_track')),
  owner_id UUID REFERENCES profiles(id),
  due_date DATE
);

CREATE INDEX IF NOT EXISTS idx_okr_kr_obj ON okr_key_results(objective_id);

-- Tabela de check-ins semanais
CREATE TABLE IF NOT EXISTS okr_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  key_result_id UUID REFERENCES okr_key_results(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  value DECIMAL(15,2) NOT NULL,
  confidence TEXT NOT NULL,
  note TEXT,
  blockers TEXT
);

CREATE INDEX IF NOT EXISTS idx_okr_checkin_kr ON okr_checkins(key_result_id);
CREATE INDEX IF NOT EXISTS idx_okr_checkin_date ON okr_checkins(created_at DESC);

-- Tabela de definições de KPIs permanentes
CREATE TABLE IF NOT EXISTS kpi_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  department TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  unit TEXT,
  frequency TEXT DEFAULT 'daily',
  target_value DECIMAL(15,2),
  warning_threshold DECIMAL(15,2),
  critical_threshold DECIMAL(15,2)
);

-- Tabela de leituras de KPIs
CREATE TABLE IF NOT EXISTS kpi_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_id TEXT REFERENCES kpi_definitions(id),
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  value DECIMAL(15,2) NOT NULL,
  source TEXT
);

CREATE INDEX IF NOT EXISTS idx_kpi_readings_kpi ON kpi_readings(kpi_id);
CREATE INDEX IF NOT EXISTS idx_kpi_readings_date ON kpi_readings(recorded_at DESC);

-- RLS
ALTER TABLE okr_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE okr_key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE okr_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_readings ENABLE ROW LEVEL SECURITY;

-- Policies — backoffice users can manage all
CREATE POLICY "Auth manages okr_objectives" ON okr_objectives FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'broker'))
);
CREATE POLICY "Auth manages okr_key_results" ON okr_key_results FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'broker'))
);
CREATE POLICY "Auth manages okr_checkins" ON okr_checkins FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'broker'))
);
CREATE POLICY "Auth reads kpi_definitions" ON kpi_definitions FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "Admin manages kpi_definitions" ON kpi_definitions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);
CREATE POLICY "Auth manages kpi_readings" ON kpi_readings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- ============================================================
-- SEED DATA: KPIs permanentes da IMI
-- ============================================================

INSERT INTO kpi_definitions (id, name, description, department, metric_type, unit, frequency, target_value, warning_threshold, critical_threshold) VALUES
-- Financeiro
('mrr',                'MRR',                          'Monthly Recurring Revenue',       'financeiro', 'currency',   'R$',       'daily',   200000,  180000,  150000),
('arr',                'ARR',                          'Annual Recurring Revenue',        'financeiro', 'currency',   'R$',       'monthly', 2400000, 2000000, 1500000),
('gross_margin',       'Gross Margin',                 'Margem bruta',                    'financeiro', 'percentage', '%',        'monthly', 70,      60,      50),
('burn_rate',          'Burn Rate',                    'Taxa de queima mensal',           'financeiro', 'currency',   'R$/mês',   'monthly', 85000,   100000,  120000),
('runway_months',      'Runway',                       'Meses de operação restantes',     'financeiro', 'number',     'meses',    'monthly', 18,      12,      6),

-- Comercial
('paying_customers',   'Clientes Pagantes',            'Total de clientes ativos',        'comercial',  'number',     'clientes', 'daily',   200,     150,     100),
('new_customers_month','Novos Clientes/Mês',           'Aquisição mensal',                'comercial',  'number',     'clientes', 'monthly', 25,      15,      10),
('churn_rate',         'Churn Rate',                   'Taxa de cancelamento mensal',     'comercial',  'percentage', '%',        'monthly', 5,       8,       12),
('nrr',               'Net Revenue Retention',         'Retenção líquida de receita',     'comercial',  'percentage', '%',        'monthly', 100,     90,      80),
('pipeline_value',     'Pipeline Value',               'Valor total do pipeline',         'comercial',  'currency',   'R$',       'weekly',  300000,  200000,  100000),
('win_rate',           'Win Rate',                     'Taxa de conversão de deals',      'comercial',  'percentage', '%',        'monthly', 20,      15,      10),
('sales_cycle_days',   'Sales Cycle',                  'Ciclo médio de vendas',           'comercial',  'number',     'dias',     'monthly', 21,      30,      45),
('cac',               'CAC',                           'Custo de aquisição de cliente',   'comercial',  'currency',   'R$',       'monthly', 400,     600,     1000),
('ltv',               'LTV',                           'Lifetime Value do cliente',       'comercial',  'currency',   'R$',       'monthly', 4800,    3000,    2000),
('ltv_cac_ratio',     'LTV:CAC',                       'Ratio LTV sobre CAC',             'comercial',  'number',     'x',        'monthly', 12,      6,       3),

-- Marketing
('leads_total',        'Leads Gerados',                'Total de leads por período',      'marketing',  'number',     'leads',    'weekly',  500,     300,     150),
('organic_traffic',    'Tráfego Orgânico',             'Sessões orgânicas',               'marketing',  'number',     'sessões',  'weekly',  5000,    3000,    1000),
('conversion_rate',    'Taxa de Conversão',            'Conversão de visitante em lead',  'marketing',  'percentage', '%',        'weekly',  6,       4,       2),

-- Produto
('mau',               'Monthly Active Users',          'Usuários ativos no mês',          'produto',    'number',     'users',    'monthly', 1000,    500,     200),
('dau',               'Daily Active Users',            'Usuários ativos no dia',          'produto',    'number',     'users',    'daily',   300,     150,     50),
('uptime',            'Uptime',                        'Disponibilidade da plataforma',   'produto',    'percentage', '%',        'daily',   99.5,    99,      98),
('nps',               'NPS',                           'Net Promoter Score',              'produto',    'number',     'score',    'monthly', 40,      20,      0),
('bugs_p0',           'Bugs P0 Abertos',               'Bugs críticos sem resolução',     'produto',    'number',     'bugs',     'daily',   0,       1,       3),

-- IMI Invest
('invest_simulations', 'Simulações/Mês',               'Total de simulações mensais',     'invest',     'number',     'sims',     'monthly', 500,     300,     100),
('invest_leads',       'Leads Invest/Mês',             'Leads gerados pelo simulador',    'invest',     'number',     'leads',    'monthly', 150,     80,      30),
('invest_conversion',  'Conversão Invest',             'Lead para contato com corretor',  'invest',     'percentage', '%',        'monthly', 25,      15,      8),
('invest_pdfs',        'PDFs Gerados/Mês',             'Relatórios PDF gerados',          'invest',     'number',     'pdfs',     'monthly', 50,      25,      10),

-- Customer Success
('support_response_h', 'Tempo Resposta Suporte',       'Horas para primeira resposta',    'cs',         'number',     'horas',    'daily',   4,       8,       24),
('ttv_hours',          'Time-to-Value',                'Horas até primeiro uso real',     'cs',         'number',     'horas',    'monthly', 48,      72,      168),
('feature_adoption',   'Feature Adoption Rate',        'Taxa de adoção de features',      'cs',         'percentage', '%',        'monthly', 60,      40,      20)

ON CONFLICT (id) DO NOTHING;
