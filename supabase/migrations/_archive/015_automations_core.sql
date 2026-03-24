
-- 015: Automations Core - Logic for Triggers and Actions
-- Este arquivo define a base para o Canvas de Automações.

CREATE TABLE IF NOT EXISTS automation_workflows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('new_lead', 'link_clicked', 'campaign_start', 'property_sold')),
    config JSONB DEFAULT '{}', -- Configuração do workflow (nós do canvas)
    last_run_at TIMESTAMPTZ,
    run_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS automation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workflow_id UUID REFERENCES automation_workflows(id) ON DELETE CASCADE,
    entity_id UUID, -- UUID do lead, link, etc
    status TEXT CHECK (status IN ('success', 'failed', 'pending')),
    message TEXT,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE automation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_all_automation_workflows" ON automation_workflows;
CREATE POLICY "auth_all_automation_workflows" ON automation_workflows FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_all_automation_logs" ON automation_logs;
CREATE POLICY "auth_all_automation_logs" ON automation_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
