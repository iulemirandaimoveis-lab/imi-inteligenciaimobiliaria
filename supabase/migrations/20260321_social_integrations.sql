-- ============================================================
-- SOCIAL INTEGRATIONS — Messages + Post Metrics tables
-- ============================================================

-- Ensure social_accounts has all required columns
ALTER TABLE public.social_accounts ADD COLUMN IF NOT EXISTS scopes TEXT[];
ALTER TABLE public.social_accounts ADD COLUMN IF NOT EXISTS page_id TEXT;
ALTER TABLE public.social_accounts ADD COLUMN IF NOT EXISTS page_name TEXT;
ALTER TABLE public.social_accounts ADD COLUMN IF NOT EXISTS ig_user_id TEXT;
ALTER TABLE public.social_accounts ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;

-- ── Social Messages (Unified Inbox) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.social_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'whatsapp', 'linkedin', 'twitter', 'email')),
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    conversation_id TEXT,
    sender_id TEXT,
    sender_name TEXT,
    sender_avatar TEXT,
    content TEXT,
    media_urls TEXT[],
    status TEXT DEFAULT 'received' CHECK (status IN ('received', 'read', 'replied', 'archived')),
    lead_id UUID,
    replied_by UUID,
    replied_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    platform_message_id TEXT,
    social_account_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.social_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'social_messages_auth' AND tablename = 'social_messages') THEN
        CREATE POLICY social_messages_auth ON public.social_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_social_msg_platform ON public.social_messages(platform);
CREATE INDEX IF NOT EXISTS idx_social_msg_status ON public.social_messages(status);
CREATE INDEX IF NOT EXISTS idx_social_msg_lead ON public.social_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_social_msg_conversation ON public.social_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_social_msg_created ON public.social_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_msg_platform_id ON public.social_messages(platform_message_id);

-- ── Social Post Metrics ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.social_post_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    publication_id UUID,
    platform TEXT NOT NULL,
    external_post_id TEXT,
    impressions INTEGER DEFAULT 0,
    reach INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    engagement_rate DECIMAL(8,4) DEFAULT 0,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.social_post_metrics ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'social_metrics_auth' AND tablename = 'social_post_metrics') THEN
        CREATE POLICY social_metrics_auth ON public.social_post_metrics FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_social_metrics_pub ON public.social_post_metrics(publication_id);
CREATE INDEX IF NOT EXISTS idx_social_metrics_platform ON public.social_post_metrics(platform);
CREATE INDEX IF NOT EXISTS idx_social_metrics_fetched ON public.social_post_metrics(fetched_at DESC);

-- ── OAuth States (for CSRF protection during OAuth flows) ────
CREATE TABLE IF NOT EXISTS public.oauth_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state TEXT NOT NULL UNIQUE,
    provider TEXT NOT NULL,
    user_id UUID NOT NULL,
    code_verifier TEXT, -- For PKCE (Twitter)
    redirect_path TEXT DEFAULT '/backoffice/integracoes',
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON public.oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON public.oauth_states(expires_at);
