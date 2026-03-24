
-- 017: Technical Appraisal Suite - Structured Reports & NBR 14653
-- Este arquivo define a arquitetura para os Laudos Técnicos IMI.

CREATE TABLE IF NOT EXISTS appraisal_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID REFERENCES appraisal_requests(id) ON DELETE SET NULL,
    property_id UUID REFERENCES developments(id) ON DELETE SET NULL, -- Se vinculado a um imóvel do catálogo
    title TEXT NOT NULL,
    subtitle TEXT,
    content_json JSONB DEFAULT '{}', -- Conteúdo estruturado (NBR sections)
    market_value_suggested DECIMAL(15,2),
    confidence_level TEXT CHECK (confidence_level IN ('high', 'medium', 'low')),
    attachments_url TEXT[], -- URLs de fotos, plantas, documentos
    pdf_url TEXT, -- Link para o laudo gerado final
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
    ai_analysis_json JSONB DEFAULT '{}', -- Insights do Claude sobre a região/valor
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- RLS
ALTER TABLE appraisal_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_all_appraisal_reports" ON appraisal_reports;
CREATE POLICY "auth_all_appraisal_reports" ON appraisal_reports FOR ALL TO authenticated USING (true) WITH CHECK (true);
