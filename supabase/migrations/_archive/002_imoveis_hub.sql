-- 002: Imoveis Hub - Advanced Asset Management & Analytics
-- Este arquivo centraliza a inteligência de dados para o módulo de Imóveis.
-- Executar no Supabase SQL Editor para habilitar filtros avançados e tracking.

-- 1. Evolução da tabela developments para o padrão IMI Pro
ALTER TABLE developments ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'apartment' CHECK (type IN ('apartment','house','penthouse','studio','land','commercial','resort'));
ALTER TABLE developments ADD COLUMN IF NOT EXISTS status_commercial TEXT DEFAULT 'draft' CHECK (status_commercial IN ('draft','published','campaign','private','sold'));
ALTER TABLE developments ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Brazil';
ALTER TABLE developments ADD COLUMN IF NOT EXISTS target_audience TEXT;
ALTER TABLE developments ADD COLUMN IF NOT EXISTS selling_points JSONB DEFAULT '[]';

-- Garantir colunas numéricas para filtros de precisão (Min/Max)
ALTER TABLE developments ADD COLUMN IF NOT EXISTS bedrooms INT DEFAULT 0;
ALTER TABLE developments ADD COLUMN IF NOT EXISTS bathrooms INT DEFAULT 0;
ALTER TABLE developments ADD COLUMN IF NOT EXISTS parking_spaces INT DEFAULT 0;
ALTER TABLE developments ADD COLUMN IF NOT EXISTS area_from DECIMAL(10,2);
ALTER TABLE developments ADD COLUMN IF NOT EXISTS area_to DECIMAL(10,2);
ALTER TABLE developments ADD COLUMN IF NOT EXISTS units_count INT DEFAULT 1;
ALTER TABLE developments ADD COLUMN IF NOT EXISTS floor_count INT;

-- Colunas de Mídia (Padrão IMI Pro)
ALTER TABLE developments ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE developments ADD COLUMN IF NOT EXISTS gallery_images TEXT[] DEFAULT '{}';
ALTER TABLE developments ADD COLUMN IF NOT EXISTS floor_plans TEXT[] DEFAULT '{}';
ALTER TABLE developments ADD COLUMN IF NOT EXISTS videos TEXT[] DEFAULT '{}';
ALTER TABLE developments ADD COLUMN IF NOT EXISTS virtual_tour_url TEXT;
ALTER TABLE developments ADD COLUMN IF NOT EXISTS brochure_url TEXT;

-- Colunas de Performance
ALTER TABLE developments ADD COLUMN IF NOT EXISTS views_count INT DEFAULT 0;
ALTER TABLE developments ADD COLUMN IF NOT EXISTS leads_count INT DEFAULT 0;
ALTER TABLE developments ADD COLUMN IF NOT EXISTS inventory_score INT DEFAULT 0;
ALTER TABLE developments ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- 2. Sistema de Links Rastreados (Campaign Intelligence)
CREATE TABLE IF NOT EXISTS tracked_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES developments(id) ON DELETE CASCADE,
    short_code TEXT UNIQUE NOT NULL,
    original_url TEXT NOT NULL,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    clicks INT DEFAULT 0,
    unique_clicks INT DEFAULT 0,
    last_click_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tracked_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_all_tracked_links" ON tracked_links;
CREATE POLICY "auth_all_tracked_links" ON tracked_links FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Timeline de Eventos do Ativo (Asset History)
CREATE TABLE IF NOT EXISTS property_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES developments(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMPTZ DEFAULT NOW(),
    event_type TEXT CHECK (event_type IN ('creation', 'price_change', 'campaign_start', 'sold', 'visit', 'lead_gen')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE property_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_all_property_events" ON property_events;
CREATE POLICY "auth_all_property_events" ON property_events FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Função de Cálculo de Score de Autoridade (IMI Engine)
CREATE OR REPLACE FUNCTION calculate_property_score(dev_id UUID)
RETURNS INT AS $$
DECLARE
    s INT := 0;
    dev RECORD;
BEGIN
    SELECT * INTO dev FROM developments WHERE id = dev_id;
    IF NOT FOUND THEN RETURN 0; END IF;
    
    -- Critérios de Qualidade de Cadastro
    IF dev.name IS NOT NULL AND dev.name != '' THEN s := s + 10; END IF;
    IF dev.description IS NOT NULL AND dev.description != '' THEN s := s + 10; END IF;
    IF dev.price_from IS NOT NULL AND dev.price_from > 0 THEN s := s + 15; END IF;
    
    -- Critérios de Mídia (Baseado no objeto JSONB images)
    IF dev.images IS NOT NULL AND (dev.images->>'main') != '' THEN s := s + 15; END IF;
    IF jsonb_array_length(COALESCE(dev.images->'gallery', '[]'::jsonb)) > 3 THEN s := s + 10; END IF;
    IF jsonb_array_length(COALESCE(dev.images->'floorPlans', '[]'::jsonb)) > 0 THEN s := s + 10; END IF;
    
    -- Critérios de Performance
    IF dev.views_count > 100 THEN s := s + 10; END IF;
    IF dev.leads_count > 5 THEN s := s + 10; END IF;
    IF dev.is_highlighted THEN s := s + 10; END IF;
    
    RETURN LEAST(s, 100);
END;
$$ LANGUAGE plpgsql;

-- 5. Sincronização de Dados Iniciais
UPDATE developments SET inventory_score = calculate_property_score(id);
UPDATE developments d SET leads_count = (
    SELECT COUNT(*) FROM leads l WHERE l.development_id = d.id
);
UPDATE developments d SET bedrooms = (SELECT bedrooms FROM development_units u WHERE u.development_id = d.id LIMIT 1) WHERE bedrooms = 0;

-- 6. Função para incremento atômico de cliques
CREATE OR REPLACE FUNCTION increment_link_clicks(link_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE tracked_links
    SET clicks = clicks + 1,
        last_click_at = NOW()
    WHERE id = link_id;
END;
$$ LANGUAGE plpgsql;
