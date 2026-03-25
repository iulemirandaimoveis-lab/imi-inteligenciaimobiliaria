-- Property Image Analysis (Moondream Vision AI)
CREATE TABLE IF NOT EXISTS property_image_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    development_id UUID REFERENCES developments(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    room_type TEXT,
    quality_score INTEGER CHECK (quality_score BETWEEN 0 AND 100),
    condition_score INTEGER CHECK (condition_score BETWEEN 1 AND 5),
    detected_amenities JSONB DEFAULT '[]',
    detected_issues JSONB DEFAULT '[]',
    auto_caption TEXT,
    is_primary BOOLEAN DEFAULT false,
    analysis_model TEXT DEFAULT 'moondream3-preview',
    analyzed_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(development_id, image_url)
);

ALTER TABLE property_image_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_access" ON property_image_analysis FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_pia_development ON property_image_analysis(development_id);
CREATE INDEX IF NOT EXISTS idx_pia_quality ON property_image_analysis(quality_score);
