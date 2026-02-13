-- ====================================================================
-- MIGRATION 006_FIX: Sistema de Links Rastreáveis
-- ====================================================================

-- Função para gerar short codes únicos
CREATE OR REPLACE FUNCTION generate_short_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
    is_unique BOOLEAN := false;
BEGIN
    WHILE NOT is_unique LOOP
        result := '';
        FOR i IN 1..8 LOOP
            result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
        END LOOP;
        
        -- Verificar se já existe
        SELECT NOT EXISTS(
            SELECT 1 FROM tracked_links WHERE short_code = result
        ) INTO is_unique;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Tabela de links rastreáveis
CREATE TABLE IF NOT EXISTS tracked_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    development_id UUID REFERENCES developments(id) ON DELETE CASCADE NOT NULL,
    short_code TEXT UNIQUE NOT NULL DEFAULT generate_short_code(),
    original_url TEXT NOT NULL,
    
    -- UTM Parameters
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    utm_term TEXT,
    
    -- Métricas
    clicks INTEGER DEFAULT 0,
    unique_clicks INTEGER DEFAULT 0,
    last_click_at TIMESTAMPTZ,
    
    -- Meta
    title TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de cliques (analytics detalhado)
CREATE TABLE IF NOT EXISTS tracked_link_clicks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tracked_link_id UUID REFERENCES tracked_links(id) ON DELETE CASCADE NOT NULL,
    
    -- Dados do visitante
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    
    -- Geolocalização
    country TEXT,
    city TEXT,
    
    -- Device
    device_type TEXT, -- mobile, desktop, tablet
    browser TEXT,
    os TEXT,
    
    clicked_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE tracked_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracked_link_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_all_tracked_links" ON tracked_links;
CREATE POLICY "auth_all_tracked_links" 
    ON tracked_links FOR ALL 
    TO authenticated 
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "auth_all_clicks" ON tracked_link_clicks;
CREATE POLICY "auth_all_clicks" 
    ON tracked_link_clicks FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- Permitir insert público de cliques (para tracking)
DROP POLICY IF EXISTS "public_insert_clicks" ON tracked_link_clicks;
CREATE POLICY "public_insert_clicks" 
    ON tracked_link_clicks FOR INSERT 
    TO anon 
    WITH CHECK (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_tracked_links_short_code ON tracked_links(short_code);
CREATE INDEX IF NOT EXISTS idx_tracked_links_development ON tracked_links(development_id);
CREATE INDEX IF NOT EXISTS idx_tracked_links_active ON tracked_links(is_active);
CREATE INDEX IF NOT EXISTS idx_clicks_link ON tracked_link_clicks(tracked_link_id);
CREATE INDEX IF NOT EXISTS idx_clicks_date ON tracked_link_clicks(clicked_at DESC);

-- Trigger para atualizar contadores
CREATE OR REPLACE FUNCTION update_link_metrics()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE tracked_links 
    SET 
        clicks = clicks + 1,
        last_click_at = NOW()
    WHERE id = NEW.tracked_link_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_link_metrics ON tracked_link_clicks;
CREATE TRIGGER trigger_update_link_metrics
    AFTER INSERT ON tracked_link_clicks
    FOR EACH ROW
    EXECUTE FUNCTION update_link_metrics();

COMMENT ON TABLE tracked_links IS 'Links curtos rastreáveis para campanhas';
COMMENT ON TABLE tracked_link_clicks IS 'Log detalhado de cliques em links rastreados';
