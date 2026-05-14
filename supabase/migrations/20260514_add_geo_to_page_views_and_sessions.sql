-- Add geo columns to page_views (country, city, region from Vercel geo headers)
ALTER TABLE public.page_views
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS region TEXT;

-- Add lat/lng to tracking_sessions for future map visualizations
ALTER TABLE public.tracking_sessions
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,6),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,6);

-- Indexes for geo queries
CREATE INDEX IF NOT EXISTS idx_page_views_country ON public.page_views(country);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_tracking_sessions_country ON public.tracking_sessions(country);
