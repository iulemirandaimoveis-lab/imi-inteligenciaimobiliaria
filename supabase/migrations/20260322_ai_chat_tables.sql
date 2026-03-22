-- ═══════════════════════════════════════════════════════
-- AI CHAT MODULE — Database Tables
-- IMI Inteligência Imobiliária · 2026-03-22
-- ═══════════════════════════════════════════════════════

-- 1. Global configuration
CREATE TABLE IF NOT EXISTS public.ai_chat_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_enabled BOOLEAN DEFAULT true,
    allowed_models TEXT[] DEFAULT ARRAY['claude-haiku-4-5-20251001', 'claude-sonnet-4-6', 'claude-opus-4-6'],
    default_model TEXT DEFAULT 'claude-sonnet-4-6',
    global_daily_token_limit INTEGER DEFAULT 1000000,
    global_monthly_budget_usd DECIMAL(10,2) DEFAULT 100.00,
    system_prompt TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert initial config
INSERT INTO public.ai_chat_config (feature_enabled, allowed_models, default_model, global_daily_token_limit, global_monthly_budget_usd)
VALUES (true, ARRAY['claude-haiku-4-5-20251001', 'claude-sonnet-4-6', 'claude-opus-4-6'], 'claude-sonnet-4-6', 1000000, 100.00)
ON CONFLICT DO NOTHING;

-- 2. Role-based permissions
CREATE TABLE IF NOT EXISTS public.ai_chat_role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL UNIQUE,
    chat_enabled BOOLEAN DEFAULT false,
    allowed_models TEXT[] DEFAULT ARRAY['claude-haiku-4-5-20251001'],
    daily_token_limit INTEGER DEFAULT 50000,
    max_conversations_per_day INTEGER DEFAULT 20,
    can_use_tool_actions BOOLEAN DEFAULT false,
    can_view_history BOOLEAN DEFAULT true,
    can_export_conversations BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default roles
INSERT INTO public.ai_chat_role_permissions (role, chat_enabled, allowed_models, daily_token_limit, max_conversations_per_day, can_use_tool_actions, can_view_history, can_export_conversations) VALUES
('ceo',       true,  ARRAY['claude-haiku-4-5-20251001','claude-sonnet-4-6','claude-opus-4-6'], 500000, 100, true, true, true),
('admin',     true,  ARRAY['claude-haiku-4-5-20251001','claude-sonnet-4-6'], 200000, 50, true, true, true),
('manager',   false, ARRAY['claude-haiku-4-5-20251001','claude-sonnet-4-6'], 100000, 30, false, true, false),
('corretor',  false, ARRAY['claude-haiku-4-5-20251001'], 50000, 20, false, true, false),
('avaliador', false, ARRAY['claude-haiku-4-5-20251001'], 30000, 15, false, false, false)
ON CONFLICT (role) DO NOTHING;

-- 3. Per-user overrides
CREATE TABLE IF NOT EXISTS public.ai_chat_user_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    chat_enabled BOOLEAN,
    allowed_models TEXT[],
    daily_token_limit INTEGER,
    max_conversations_per_day INTEGER,
    can_use_tool_actions BOOLEAN,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- 4. Conversation history
CREATE TABLE IF NOT EXISTS public.ai_chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    model TEXT NOT NULL,
    messages JSONB NOT NULL DEFAULT '[]',
    total_input_tokens INTEGER DEFAULT 0,
    total_output_tokens INTEGER DEFAULT 0,
    estimated_cost_usd DECIMAL(10,4) DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_conversations_user ON public.ai_chat_conversations(user_id, created_at DESC);

-- 5. Usage log (billing + audit)
CREATE TABLE IF NOT EXISTS public.ai_chat_usage_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.ai_chat_conversations(id) ON DELETE SET NULL,
    model TEXT NOT NULL,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    cache_read_tokens INTEGER DEFAULT 0,
    cache_write_tokens INTEGER DEFAULT 0,
    estimated_cost_usd DECIMAL(10,6) NOT NULL DEFAULT 0,
    latency_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_usage_user_date ON public.ai_chat_usage_log(user_id, created_at);

-- 6. Cost summary view
CREATE OR REPLACE VIEW public.ai_chat_cost_summary AS
SELECT
    user_id,
    DATE_TRUNC('day', created_at) AS dia,
    model,
    COUNT(*) AS interacoes,
    SUM(input_tokens) AS total_input_tokens,
    SUM(output_tokens) AS total_output_tokens,
    SUM(estimated_cost_usd) AS custo_total_usd
FROM public.ai_chat_usage_log
GROUP BY user_id, DATE_TRUNC('day', created_at), model;

-- 7. RLS policies
ALTER TABLE public.ai_chat_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_user_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_usage_log ENABLE ROW LEVEL SECURITY;

-- Policies: authenticated users can read config, own conversations, own usage
CREATE POLICY "ai_config_read" ON public.ai_chat_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_role_perms_read" ON public.ai_chat_role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_overrides_own" ON public.ai_chat_user_overrides FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "ai_conversations_own" ON public.ai_chat_conversations FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "ai_usage_own" ON public.ai_chat_usage_log FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
