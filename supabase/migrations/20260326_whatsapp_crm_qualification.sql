-- IMI WhatsApp + CRM + Qualification Tables
-- Execute in Supabase SQL Editor

-- Whatsapp instances
CREATE TABLE IF NOT EXISTS whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_name TEXT NOT NULL UNIQUE,
  instance_id TEXT,
  phone_number TEXT,
  status TEXT DEFAULT 'disconnected',
  qr_code TEXT,
  evolution_api_url TEXT NOT NULL,
  evolution_api_key TEXT NOT NULL,
  webhook_url TEXT,
  is_default BOOLEAN DEFAULT false,
  session_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- WhatsApp messages
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  instance_id UUID REFERENCES whatsapp_instances(id),
  remote_jid TEXT NOT NULL,
  message_id TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content_type TEXT DEFAULT 'text',
  body TEXT,
  media_url TEXT,
  media_mimetype TEXT,
  media_caption TEXT,
  status TEXT DEFAULT 'sent',
  is_ai_generated BOOLEAN DEFAULT false,
  ai_model_used TEXT,
  ai_intent_detected TEXT,
  ai_entities_extracted JSONB DEFAULT '{}',
  quoted_message_id TEXT,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Lead score history
CREATE TABLE IF NOT EXISTS lead_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  previous_score INTEGER,
  breakdown JSONB NOT NULL,
  trigger_event TEXT,
  ai_reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pipeline stage history  
CREATE TABLE IF NOT EXISTS pipeline_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  moved_by TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Lead activities
CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  performed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- WhatsApp templates
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  body TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  language TEXT DEFAULT 'pt-BR',
  is_ai_enabled BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Automation rules
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_conditions JSONB NOT NULL,
  action_type TEXT NOT NULL,
  action_config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Qualification sessions
CREATE TABLE IF NOT EXISTS qualification_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'in_progress',
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 6,
  questions_asked JSONB DEFAULT '[]',
  answers_received JSONB DEFAULT '[]',
  qualification_result JSONB,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add AI qualification columns to leads if they don't exist
DO $$ BEGIN
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_qualification_summary TEXT;
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_suggested_action TEXT;
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_profile_type TEXT;
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_budget_range TEXT;
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_regions_interest TEXT[];
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_property_types TEXT[];
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_urgency_level INTEGER DEFAULT 0;
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_objections TEXT[];
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS ai_sentiment TEXT;
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS whatsapp_jid TEXT;
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS whatsapp_instance_id UUID;
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS score_breakdown JSONB DEFAULT '{}';
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_scored_at TIMESTAMPTZ;
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS total_inbound_messages INTEGER DEFAULT 0;
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS total_outbound_messages INTEGER DEFAULT 0;
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS response_time_avg_seconds INTEGER;
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS days_in_pipeline INTEGER DEFAULT 0;
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_followup_at TIMESTAMPTZ;
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS followup_count INTEGER DEFAULT 0;
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_followup_at TIMESTAMPTZ;
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS conversion_value DECIMAL(15,2);
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS lost_reason TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wa_messages_lead ON whatsapp_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_wa_messages_jid ON whatsapp_messages(remote_jid);
CREATE INDEX IF NOT EXISTS idx_wa_messages_created ON whatsapp_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_score_history_lead ON lead_score_history(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pipeline_history_lead ON pipeline_stage_history(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_lead ON lead_activities(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_whatsapp_jid ON leads(whatsapp_jid) WHERE whatsapp_jid IS NOT NULL;

-- RLS
ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE qualification_sessions ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
  CREATE POLICY "auth_all" ON whatsapp_instances FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_all" ON whatsapp_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_all" ON lead_score_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_all" ON pipeline_stage_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_all" ON lead_activities FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_all" ON whatsapp_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_all" ON automation_rules FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_all" ON qualification_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE lead_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE pipeline_stage_history;

-- Message stats trigger
CREATE OR REPLACE FUNCTION update_lead_message_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE leads SET
    total_messages = COALESCE(total_messages, 0) + 1,
    total_inbound_messages = CASE WHEN NEW.direction = 'inbound' THEN COALESCE(total_inbound_messages, 0) + 1 ELSE COALESCE(total_inbound_messages, 0) END,
    total_outbound_messages = CASE WHEN NEW.direction = 'outbound' THEN COALESCE(total_outbound_messages, 0) + 1 ELSE COALESCE(total_outbound_messages, 0) END,
    last_message_at = NEW.created_at,
    first_contact_at = COALESCE(first_contact_at, NEW.created_at),
    last_contact_at = NEW.created_at
  WHERE id = NEW.lead_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_message_stats ON whatsapp_messages;
CREATE TRIGGER trigger_message_stats
  AFTER INSERT ON whatsapp_messages
  FOR EACH ROW EXECUTE FUNCTION update_lead_message_stats();
