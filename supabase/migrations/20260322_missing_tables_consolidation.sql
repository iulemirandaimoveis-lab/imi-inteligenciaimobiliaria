-- =====================================================
-- IMI — Missing Tables Consolidation
-- Date: 2026-03-22
-- Tables: teams, team_members, partnerships, partnership_messages,
--         operational_playbooks, ads_campaigns_summary
-- =====================================================

-- ── TEAMS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    leader_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    avatar_url TEXT,
    color TEXT DEFAULT '#3D6FFF',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teams_auth" ON public.teams FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    broker_id UUID REFERENCES public.brokers(id) ON DELETE SET NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('leader', 'member', 'viewer')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_members_auth" ON public.team_members FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── PARTNERSHIPS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.partnerships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'co-broke' CHECK (type IN ('co-broke', 'referral', 'joint-venture', 'exchange', 'custom')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled', 'rejected')),
    initiator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    partner_email TEXT,
    partner_name TEXT,
    development_id UUID REFERENCES public.developments(id) ON DELETE SET NULL,
    commission_split JSONB DEFAULT '{"initiator": 50, "partner": 50}',
    terms TEXT,
    value DECIMAL(14,2),
    start_date DATE,
    end_date DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.partnerships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "partnerships_auth" ON public.partnerships FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_partnerships_initiator ON public.partnerships(initiator_id);
CREATE INDEX IF NOT EXISTS idx_partnerships_status ON public.partnerships(status);

CREATE TABLE IF NOT EXISTS public.partnership_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partnership_id UUID NOT NULL REFERENCES public.partnerships(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text' CHECK (type IN ('text', 'system', 'file', 'action')),
    metadata JSONB DEFAULT '{}',
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.partnership_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "partnership_messages_auth" ON public.partnership_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_partnership_msgs_partnership ON public.partnership_messages(partnership_id);

-- ── OPERATIONAL PLAYBOOKS ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.operational_playbooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general' CHECK (category IN ('general', 'sales', 'marketing', 'operations', 'legal', 'finance')),
    steps JSONB DEFAULT '[]',
    triggers JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    execution_count INTEGER DEFAULT 0,
    last_executed_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.operational_playbooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "playbooks_auth" ON public.operational_playbooks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── ADS CAMPAIGNS SUMMARY ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.ads_campaigns_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL CHECK (platform IN ('meta', 'google', 'linkedin', 'tiktok')),
    campaign_id TEXT NOT NULL,
    campaign_name TEXT,
    status TEXT DEFAULT 'active',
    impressions BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    spend DECIMAL(12,2) DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    cpc DECIMAL(8,4) DEFAULT 0,
    cpm DECIMAL(8,4) DEFAULT 0,
    ctr DECIMAL(8,4) DEFAULT 0,
    roas DECIMAL(8,4) DEFAULT 0,
    period_start DATE,
    period_end DATE,
    raw_data JSONB DEFAULT '{}',
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ads_campaigns_summary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ads_summary_auth" ON public.ads_campaigns_summary FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_ads_summary_platform ON public.ads_campaigns_summary(platform);
CREATE INDEX IF NOT EXISTS idx_ads_summary_campaign ON public.ads_campaigns_summary(campaign_id);

-- ── USEFUL VIEWS ───────────────────────────────────────

-- Revenue summary view
CREATE OR REPLACE VIEW public.revenue_summary AS
SELECT
    date_trunc('month', created_at) AS month,
    COUNT(*) AS total_transactions,
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expenses,
    SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) AS net_revenue
FROM public.financial_transactions
GROUP BY date_trunc('month', created_at)
ORDER BY month DESC;

-- Active users summary
CREATE OR REPLACE VIEW public.active_users_summary AS
SELECT
    b.id,
    b.name,
    b.email,
    b.role,
    b.status,
    b.last_login_at,
    b.created_at,
    (SELECT COUNT(*) FROM public.leads WHERE assigned_to = b.user_id) AS lead_count,
    (SELECT COUNT(*) FROM public.contratos WHERE broker_id = b.id) AS contract_count
FROM public.brokers b
WHERE b.status = 'active';
