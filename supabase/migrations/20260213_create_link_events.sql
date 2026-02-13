-- Create link_events table
CREATE TABLE IF NOT EXISTS link_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tracked_link_id UUID REFERENCES tracked_links(id) ON DELETE SET NULL,
    
    event_type TEXT NOT NULL, -- 'click', 'page_view', 'conversion'
    
    utm_params JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb, -- time_on_page, converted, revenue, etc.
    
    device_type TEXT, -- 'mobile', 'desktop', 'tablet'
    location TEXT,    -- 'São Paulo, BR'
    ip_address TEXT,  -- Anonymized if possible
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_link_events_link ON link_events(tracked_link_id);
CREATE INDEX IF NOT EXISTS idx_link_events_created ON link_events(created_at);
CREATE INDEX IF NOT EXISTS idx_link_events_type ON link_events(event_type);

-- RLS
ALTER TABLE link_events ENABLE ROW LEVEL SECURITY;

-- Admins can view all events
CREATE POLICY "admins_can_view_link_events" ON link_events
    FOR SELECT TO authenticated
    USING (true);

-- Public can insert events (tracking pixels/scripts)
CREATE POLICY "public_can_insert_link_events" ON link_events
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);
