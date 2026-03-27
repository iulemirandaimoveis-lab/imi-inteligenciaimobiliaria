-- =====================================================================
-- DOC 19-A: DEFINITIVE CONSOLIDATED MIGRATION
-- Applied: 2026-03-27
-- Creates all missing tables, columns, indexes, RLS, and seed data
-- All statements use IF NOT EXISTS for idempotency
-- Production DB: 187 tables after this migration
-- =====================================================================

-- 1. WHATSAPP INSTANCES
CREATE TABLE IF NOT EXISTS whatsapp_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_name TEXT NOT NULL UNIQUE,
    instance_id TEXT,
    phone_number TEXT,
    status TEXT DEFAULT 'disconnected' CHECK (status IN ('connected','disconnected','qr_pending','banned','error')),
    qr_code TEXT,
    evolution_api_url TEXT,
    evolution_api_key TEXT,
    webhook_url TEXT,
    is_default BOOLEAN DEFAULT false,
    session_data JSONB DEFAULT '{}'::jsonb,
    auto_reply_enabled BOOLEAN DEFAULT false,
    business_hours JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_status ON whatsapp_instances(status);
ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;

-- 2. PROPERTY IMAGE ANALYSIS
CREATE TABLE IF NOT EXISTS property_image_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    development_id UUID REFERENCES developments(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    room_type TEXT,
    quality_score INTEGER CHECK (quality_score BETWEEN 0 AND 100),
    condition_score INTEGER CHECK (condition_score BETWEEN 1 AND 5),
    detected_issues JSONB DEFAULT '[]'::jsonb,
    auto_caption TEXT,
    analysis_model TEXT,
    analyzed_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(development_id, image_url)
);
CREATE INDEX IF NOT EXISTS idx_property_image_analysis_dev ON property_image_analysis(development_id);
ALTER TABLE property_image_analysis ENABLE ROW LEVEL SECURITY;

-- 3. PIPELINE STAGE HISTORY
CREATE TABLE IF NOT EXISTS pipeline_stage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    from_stage TEXT NOT NULL,
    to_stage TEXT NOT NULL,
    moved_by UUID REFERENCES auth.users(id),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pipeline_stage_history_lead ON pipeline_stage_history(lead_id);
ALTER TABLE pipeline_stage_history ENABLE ROW LEVEL SECURITY;

-- 4. LEAD ACTIVITIES
CREATE TABLE IF NOT EXISTS lead_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'note',
    title TEXT,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    performed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON lead_activities(lead_id);
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;

-- 5. LEAD SCORE HISTORY
CREATE TABLE IF NOT EXISTS lead_score_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    score INTEGER,
    ai_score INTEGER,
    factors JSONB DEFAULT '{}'::jsonb,
    model TEXT,
    scored_by TEXT DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lead_score_history_lead ON lead_score_history(lead_id);
ALTER TABLE lead_score_history ENABLE ROW LEVEL SECURITY;

-- 6. NEIGHBORHOOD BENCHMARKS
CREATE TABLE IF NOT EXISTS neighborhood_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'Brasil',
    neighborhood TEXT NOT NULL,
    avg_sqm_price NUMERIC,
    avg_yield NUMERIC,
    avg_liquidity_days INTEGER,
    avg_appreciation_12m NUMERIC,
    reference_date DATE,
    data_source TEXT DEFAULT 'manual',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(city, state, neighborhood, reference_date)
);
CREATE INDEX IF NOT EXISTS idx_neighborhood_benchmarks_loc ON neighborhood_benchmarks(city, neighborhood);
ALTER TABLE neighborhood_benchmarks ENABLE ROW LEVEL SECURITY;

-- 7. LEADS — PIPELINE COLUMNS
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pipeline_stage TEXT DEFAULT 'novo';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS total_messages INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS days_in_pipeline INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS conversion_value NUMERIC DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_followup_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lost_reason TEXT;
CREATE INDEX IF NOT EXISTS idx_leads_pipeline_stage ON leads(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_leads_is_archived ON leads(is_archived);
CREATE INDEX IF NOT EXISTS idx_leads_temperature ON leads(temperature);

-- 8. RLS POLICIES
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='whatsapp_instances' AND policyname='whatsapp_instances_auth') THEN
        CREATE POLICY whatsapp_instances_auth ON whatsapp_instances FOR ALL USING (auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='property_image_analysis' AND policyname='property_image_analysis_auth') THEN
        CREATE POLICY property_image_analysis_auth ON property_image_analysis FOR ALL USING (auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pipeline_stage_history' AND policyname='pipeline_stage_history_auth') THEN
        CREATE POLICY pipeline_stage_history_auth ON pipeline_stage_history FOR ALL USING (auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='lead_activities' AND policyname='lead_activities_auth') THEN
        CREATE POLICY lead_activities_auth ON lead_activities FOR ALL USING (auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='lead_score_history' AND policyname='lead_score_history_auth') THEN
        CREATE POLICY lead_score_history_auth ON lead_score_history FOR ALL USING (auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='neighborhood_benchmarks' AND policyname='neighborhood_benchmarks_read') THEN
        CREATE POLICY neighborhood_benchmarks_read ON neighborhood_benchmarks FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='neighborhood_benchmarks' AND policyname='neighborhood_benchmarks_write') THEN
        CREATE POLICY neighborhood_benchmarks_write ON neighborhood_benchmarks FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 9. REALTIME
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'leads') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE leads;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'pipeline_stage_history') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE pipeline_stage_history;
    END IF;
END $$;

-- 10. SEED: Market indicators
INSERT INTO market_indicators (metric_name, value, unit, category, trend, sort_order, description) VALUES
('Valorização 12m (Recife)', '+12.8%', NULL, 'performance', 'up', 1, 'Segmento alto padrão — Boa Viagem, Pina, Casa Forte'),
('Liquidez Média', '52 dias', NULL, 'liquidez', 'stable', 2, 'Tempo médio de venda — imóveis R$ 500k–2M'),
('Custo Médio m² (Boa Viagem)', 'R$ 11.200', 'R$/m²', 'preco', 'up', 3, 'Bairro de orla — Recife/PE'),
('Lançamentos (trim.)', '18', 'empreendimentos', 'oferta', 'up', 4, 'Recife e região metropolitana'),
('Taxa Selic', '14.25%', 'a.a.', 'macro', 'stable', 5, 'Referência para financiamento imobiliário'),
('IGPM 12m', '+4.2%', NULL, 'macro', 'stable', 6, 'Referência de reajuste contratual')
ON CONFLICT DO NOTHING;

-- SEED: Neighborhood benchmarks
INSERT INTO neighborhood_benchmarks (city, state, country, neighborhood, avg_sqm_price, avg_yield, avg_liquidity_days, avg_appreciation_12m, reference_date) VALUES
('Recife', 'PE', 'Brasil', 'Boa Viagem', 11200, 5.8, 45, 12.5, '2026-03-01'),
('Recife', 'PE', 'Brasil', 'Pina', 9800, 6.2, 38, 14.2, '2026-03-01'),
('Recife', 'PE', 'Brasil', 'Casa Forte', 10200, 5.1, 55, 10.8, '2026-03-01'),
('Recife', 'PE', 'Brasil', 'Graças', 9600, 5.4, 50, 9.5, '2026-03-01'),
('Recife', 'PE', 'Brasil', 'Miramar', 13500, 5.5, 60, 11.2, '2026-03-01'),
('Recife', 'PE', 'Brasil', 'Espinheiro', 9100, 5.3, 48, 8.9, '2026-03-01'),
('Recife', 'PE', 'Brasil', 'Parnamirim', 10800, 5.9, 42, 13.1, '2026-03-01'),
('Recife', 'PE', 'Brasil', 'Tamarineira', 8600, 6.0, 40, 12.0, '2026-03-01'),
('João Pessoa', 'PB', 'Brasil', 'Altiplano', 12500, 5.2, 65, 15.5, '2026-03-01'),
('João Pessoa', 'PB', 'Brasil', 'Bessa', 9800, 5.8, 42, 13.8, '2026-03-01'),
('João Pessoa', 'PB', 'Brasil', 'Miramar', 10200, 5.4, 50, 12.2, '2026-03-01'),
('João Pessoa', 'PB', 'Brasil', 'Tambaú', 11800, 6.5, 35, 14.5, '2026-03-01'),
('João Pessoa', 'PB', 'Brasil', 'Cabo Branco', 11200, 6.2, 38, 13.5, '2026-03-01')
ON CONFLICT DO NOTHING;
