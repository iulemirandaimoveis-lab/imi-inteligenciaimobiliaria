-- Content Calendar & Items for social media automation
CREATE TABLE IF NOT EXISTS content_calendar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    platform TEXT NOT NULL, -- instagram, linkedin, tiktok, youtube, facebook
    format TEXT NOT NULL, -- post, carrossel, reels, story, short, article
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'scheduled', 'published', 'failed')),
    scheduled_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    content_text TEXT, -- The actual post text/caption
    hashtags TEXT[],
    image_urls TEXT[],
    video_url TEXT,
    book_reference TEXT, -- Which book was used as context
    ai_model TEXT, -- Which AI model generated the content
    engagement_metrics JSONB DEFAULT '{}', -- likes, comments, shares, reach
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_access" ON content_calendar FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_cc_status ON content_calendar(status);
CREATE INDEX IF NOT EXISTS idx_cc_scheduled ON content_calendar(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_cc_platform ON content_calendar(platform);
