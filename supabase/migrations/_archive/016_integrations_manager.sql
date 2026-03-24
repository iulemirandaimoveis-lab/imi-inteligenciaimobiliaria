
-- 016: Integrations Manager - API Credentials & Connectivity
-- Este arquivo centraliza a governança de APIs externas.

CREATE TABLE IF NOT EXISTS integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key_name TEXT UNIQUE NOT NULL, -- e.g. 'ANTHROPIC_API_KEY', 'GOOGLE_METADATA_SECRET'
    display_name TEXT NOT NULL,
    provider TEXT NOT NULL, -- 'anthropic', 'google', 'meta', 'elevenlabs', etc
    category TEXT CHECK (category IN ('ai', 'marketing', 'communication', 'storage', 'productivity')),
    secret_value TEXT, -- Armazenar encriptado em produção (idealmente via Vault)
    is_active BOOLEAN DEFAULT false,
    last_tested_at TIMESTAMPTZ,
    status TEXT DEFAULT 'configured' CHECK (status IN ('configured', 'valid', 'invalid', 'expired')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_all_integrations" ON integrations;
CREATE POLICY "auth_all_integrations" ON integrations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Dados Iniciais (Placeholders de Configuração)
INSERT INTO integrations (key_name, display_name, provider, category) VALUES
('ANTHROPIC_API_KEY', 'Claude 3.5 Sonnet', 'anthropic', 'ai'),
('GOOGLE_GEN_AI_KEY', 'Gemini Pro 1.5', 'google', 'ai'),
('WHATSAPP_CLOUD_TOKEN', 'WhatsApp Cloud API', 'meta', 'communication'),
('META_BUSINESS_SECRET', 'Meta Business Suite', 'meta', 'marketing'),
('GOOGLE_MEET_CONFIG', 'Google Calendar / Meet', 'google', 'productivity'),
('GOOGLE_DRIVE_FOLDER', 'Google Drive Cloud Export', 'google', 'storage')
ON CONFLICT (key_name) DO NOTHING;
