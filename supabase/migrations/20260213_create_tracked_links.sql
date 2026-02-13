-- Create tracked_links table
CREATE TABLE IF NOT EXISTS tracked_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    development_id UUID REFERENCES developments(id),
    campaign_name TEXT NOT NULL,
    url TEXT NOT NULL,
    
    utm_params JSONB DEFAULT '{}'::jsonb, -- source, medium, campaign, content
    custom_slug TEXT UNIQUE,
    
    clicks INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_tracked_links_development ON tracked_links(development_id);
CREATE INDEX IF NOT EXISTS idx_tracked_links_campaign ON tracked_links(campaign_name);
CREATE INDEX IF NOT EXISTS idx_tracked_links_slug ON tracked_links(custom_slug);

-- RLS
ALTER TABLE tracked_links ENABLE ROW LEVEL SECURITY;

-- Admins/Editors can view/edit all
CREATE POLICY "authenticated_can_all_tracked_links" ON tracked_links
    FOR ALL TO authenticated
    USING (true);

-- Public access to resolve short links (read-only for finding by slug)
CREATE POLICY "public_can_view_tracked_links_by_slug" ON tracked_links
    FOR SELECT TO anon
    USING (true);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_tracked_links_updated_at ON tracked_links;
CREATE TRIGGER trigger_update_tracked_links_updated_at
    BEFORE UPDATE ON tracked_links
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
