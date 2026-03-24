-- ============================================================
-- MIGRATION 060: IMI INVEST ENGINE MODULE
-- Investment Intelligence Engine — Simulações, Leads, Índices
-- ============================================================

-- Tabela de leads do Invest (separada dos leads gerais)
CREATE TABLE IF NOT EXISTS invest_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  city TEXT,
  country TEXT DEFAULT 'BR',
  primary_market TEXT,
  budget_min DECIMAL(15,2),
  budget_max DECIMAL(15,2),
  budget_currency TEXT DEFAULT 'BRL',
  objectives TEXT[],
  risk_profile TEXT,
  experience TEXT,
  engagement_score INTEGER DEFAULT 0 CHECK (engagement_score BETWEEN 0 AND 100),
  readiness_score INTEGER DEFAULT 0 CHECK (readiness_score BETWEEN 0 AND 100),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  ai_recommendation TEXT,
  assigned_broker_id UUID REFERENCES profiles(id),
  assigned_at TIMESTAMPTZ,
  assignment_reason TEXT,
  status TEXT DEFAULT 'novo' CHECK (status IN ('novo', 'contatado', 'qualificado', 'em_negociacao', 'convertido', 'perdido', 'inativo')),
  converted_at TIMESTAMPTZ,
  lost_reason TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT,
  CONSTRAINT unique_invest_lead_email UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_invest_leads_status ON invest_leads(status);
CREATE INDEX IF NOT EXISTS idx_invest_leads_broker ON invest_leads(assigned_broker_id);
CREATE INDEX IF NOT EXISTS idx_invest_leads_score ON invest_leads(readiness_score DESC);
CREATE INDEX IF NOT EXISTS idx_invest_leads_market ON invest_leads(primary_market);

-- Tabela de simulações
CREATE TABLE IF NOT EXISTS invest_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  lead_id UUID REFERENCES invest_leads(id),
  broker_id UUID REFERENCES profiles(id),
  source TEXT NOT NULL DEFAULT 'public',
  market TEXT NOT NULL CHECK (market IN ('brasil', 'usa', 'dubai')),
  objective TEXT NOT NULL,
  investor_profile TEXT,
  currency TEXT NOT NULL DEFAULT 'BRL',
  property_value DECIMAL(15,2) NOT NULL,
  property_type TEXT NOT NULL,
  area_m2 DECIMAL(10,2),
  bedrooms INTEGER,
  location JSONB NOT NULL,
  down_payment_pct DECIMAL(5,2),
  financing_type TEXT,
  rental_strategy TEXT,
  monthly_rent DECIMAL(12,2),
  occupancy_rate DECIMAL(5,2),
  average_daily_rate DECIMAL(12,2),
  monthly_expenses JSONB,
  appreciation_rate DECIMAL(5,2),
  inflation_rate DECIMAL(5,2),
  interest_rate DECIMAL(5,2),
  holding_period INTEGER,
  exit_strategy TEXT,
  result JSONB,
  result_summary JSONB,
  data_sources TEXT[],
  engine_version TEXT DEFAULT '1.0',
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_invest_sim_market ON invest_simulations(market);
CREATE INDEX IF NOT EXISTS idx_invest_sim_created ON invest_simulations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invest_sim_lead ON invest_simulations(lead_id);
CREATE INDEX IF NOT EXISTS idx_invest_sim_broker ON invest_simulations(broker_id);
CREATE INDEX IF NOT EXISTS idx_invest_sim_value ON invest_simulations(property_value);

-- Tabela de eventos comportamentais
CREATE TABLE IF NOT EXISTS invest_lead_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  lead_id UUID REFERENCES invest_leads(id) ON DELETE CASCADE,
  simulation_id UUID REFERENCES invest_simulations(id),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'simulation_started', 'simulation_completed', 'result_viewed',
    'pdf_downloaded', 'comparison_run', 'alert_created',
    'broker_contact_requested', 'indices_viewed', 'glossary_viewed',
    'page_view', 'time_on_page'
  )),
  event_data JSONB,
  session_id TEXT,
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_invest_events_lead ON invest_lead_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_invest_events_type ON invest_lead_events(event_type);
CREATE INDEX IF NOT EXISTS idx_invest_events_created ON invest_lead_events(created_at DESC);

-- Tabela de alertas do investidor
CREATE TABLE IF NOT EXISTS invest_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  lead_id UUID REFERENCES invest_leads(id) ON DELETE CASCADE,
  market TEXT NOT NULL,
  conditions JSONB NOT NULL,
  notification_channels TEXT[] DEFAULT ARRAY['email'],
  frequency TEXT DEFAULT 'weekly',
  active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0
);

-- Cache de índices econômicos
CREATE TABLE IF NOT EXISTS invest_indices_cache (
  id TEXT PRIMARY KEY,
  value DECIMAL(15,6) NOT NULL,
  unit TEXT,
  period TEXT,
  source TEXT NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  raw_data JSONB,
  history JSONB
);

CREATE INDEX IF NOT EXISTS idx_invest_indices_expires ON invest_indices_cache(expires_at);

-- Tabela de relatórios PDF gerados
CREATE TABLE IF NOT EXISTS invest_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  simulation_id UUID REFERENCES invest_simulations(id),
  lead_id UUID REFERENCES invest_leads(id),
  broker_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  language TEXT DEFAULT 'pt-BR',
  template TEXT DEFAULT 'standard',
  custom_text JSONB,
  pdf_url TEXT,
  pdf_size INTEGER,
  sent_to TEXT[],
  sent_at TIMESTAMPTZ,
  views INTEGER DEFAULT 0
);

-- RLS
ALTER TABLE invest_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invest_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE invest_lead_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE invest_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invest_indices_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE invest_reports ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Public can insert simulations" ON invest_simulations FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth can view simulations" ON invest_simulations FOR SELECT USING (
  user_id = auth.uid() OR broker_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

CREATE POLICY "Backoffice manages invest leads" ON invest_leads FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'broker'))
);
CREATE POLICY "Public insert invest leads" ON invest_leads FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone reads indices" ON invest_indices_cache FOR SELECT USING (true);
CREATE POLICY "Service inserts indices" ON invest_indices_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "Service updates indices" ON invest_indices_cache FOR UPDATE USING (true);

CREATE POLICY "Events insert" ON invest_lead_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Backoffice reads events" ON invest_lead_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'broker'))
);

CREATE POLICY "Backoffice manages reports" ON invest_reports FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager', 'broker'))
);

CREATE POLICY "Alerts manage" ON invest_alerts FOR ALL USING (true);

-- Trigger de scoring automático
CREATE OR REPLACE FUNCTION update_invest_lead_scoring()
RETURNS TRIGGER AS $$
DECLARE
  sim_count INTEGER;
  pdf_count INTEGER;
  compare_count INTEGER;
  alert_count INTEGER;
  total_engagement INTEGER;
  total_readiness INTEGER;
  new_priority TEXT;
BEGIN
  SELECT COUNT(*) INTO sim_count FROM invest_lead_events
    WHERE lead_id = NEW.lead_id AND event_type = 'simulation_completed';
  SELECT COUNT(*) INTO pdf_count FROM invest_lead_events
    WHERE lead_id = NEW.lead_id AND event_type = 'pdf_downloaded';
  SELECT COUNT(*) INTO compare_count FROM invest_lead_events
    WHERE lead_id = NEW.lead_id AND event_type = 'comparison_run';
  SELECT COUNT(*) INTO alert_count FROM invest_alerts
    WHERE lead_id = NEW.lead_id AND active = true;

  total_engagement := LEAST(100,
    (sim_count * 15) + (pdf_count * 25) + (compare_count * 20) + (alert_count * 10)
    + CASE WHEN NEW.event_type = 'broker_contact_requested' THEN 30 ELSE 0 END
  );

  total_readiness := LEAST(100,
    CASE WHEN pdf_count > 0 THEN 30 ELSE 0 END
    + CASE WHEN compare_count > 0 THEN 20 ELSE 0 END
    + CASE WHEN NEW.event_type = 'broker_contact_requested' THEN 40 ELSE 0 END
    + CASE WHEN alert_count > 0 THEN 10 ELSE 0 END
  );

  new_priority := CASE
    WHEN total_readiness >= 80 THEN 'urgent'
    WHEN total_readiness >= 50 THEN 'high'
    WHEN total_engagement >= 40 THEN 'medium'
    ELSE 'low'
  END;

  UPDATE invest_leads SET
    engagement_score = total_engagement,
    readiness_score = total_readiness,
    priority = new_priority,
    updated_at = NOW()
  WHERE id = NEW.lead_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_invest_lead_scoring
AFTER INSERT ON invest_lead_events
FOR EACH ROW EXECUTE FUNCTION update_invest_lead_scoring();
