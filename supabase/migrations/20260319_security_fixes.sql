-- ============================================================================
-- Migration: 20260319_security_fixes.sql
-- Description: Critical security fixes from audit
--   1. Replace USING(true) RLS with proper tenant isolation
--   2. Create compatibility views for naming mismatches
--   3. Add missing storage buckets + policies
--   4. Enable Realtime for chat tables
--   5. Ensure tenants/tenant_users foundation tables exist
-- ============================================================================

BEGIN;

-- ============================================================================
-- 5. ENSURE TENANTS & TENANT_USERS TABLES EXIST (must come first — referenced by RLS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  plan TEXT DEFAULT 'trial',
  max_users INT DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

-- Tenant RLS: users can see their own tenants
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'users_see_own_tenants' AND tablename = 'tenants'
  ) THEN
    CREATE POLICY "users_see_own_tenants" ON tenants
      FOR SELECT TO authenticated
      USING (id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'users_see_own_memberships' AND tablename = 'tenant_users'
  ) THEN
    CREATE POLICY "users_see_own_memberships" ON tenant_users
      FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;


-- ============================================================================
-- 1. RLS USING(true) → PROPER TENANT ISOLATION
-- ============================================================================
-- For each table:
--   a) Add tenant_id column if missing
--   b) Drop old permissive bo_full_* policies
--   c) Create tenant-isolated SELECT / INSERT / UPDATE / DELETE policies

-- Helper: reusable DO block generator is not available in plain SQL,
-- so we repeat the pattern per table.

-- ---------------------------------------------------------------------------
-- leads
-- ---------------------------------------------------------------------------
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

DROP POLICY IF EXISTS "bo_full_leads" ON leads;
DROP POLICY IF EXISTS "tenant_read_leads" ON leads;
DROP POLICY IF EXISTS "tenant_write_leads" ON leads;
DROP POLICY IF EXISTS "tenant_update_leads" ON leads;
DROP POLICY IF EXISTS "tenant_delete_leads" ON leads;

CREATE POLICY "tenant_read_leads" ON leads
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_write_leads" ON leads
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_update_leads" ON leads
  FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_delete_leads" ON leads
  FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- proposals
-- ---------------------------------------------------------------------------
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

DROP POLICY IF EXISTS "bo_full_proposals" ON proposals;
DROP POLICY IF EXISTS "tenant_read_proposals" ON proposals;
DROP POLICY IF EXISTS "tenant_write_proposals" ON proposals;
DROP POLICY IF EXISTS "tenant_update_proposals" ON proposals;
DROP POLICY IF EXISTS "tenant_delete_proposals" ON proposals;

CREATE POLICY "tenant_read_proposals" ON proposals
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_write_proposals" ON proposals
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_update_proposals" ON proposals
  FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_delete_proposals" ON proposals
  FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- developments
-- ---------------------------------------------------------------------------
ALTER TABLE developments ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

DROP POLICY IF EXISTS "bo_full_developments" ON developments;
DROP POLICY IF EXISTS "tenant_read_developments" ON developments;
DROP POLICY IF EXISTS "tenant_write_developments" ON developments;
DROP POLICY IF EXISTS "tenant_update_developments" ON developments;
DROP POLICY IF EXISTS "tenant_delete_developments" ON developments;

CREATE POLICY "tenant_read_developments" ON developments
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_write_developments" ON developments
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_update_developments" ON developments
  FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_delete_developments" ON developments
  FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- financial_transactions
-- ---------------------------------------------------------------------------
ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

DROP POLICY IF EXISTS "bo_full_financial_transactions" ON financial_transactions;
DROP POLICY IF EXISTS "tenant_read_financial_transactions" ON financial_transactions;
DROP POLICY IF EXISTS "tenant_write_financial_transactions" ON financial_transactions;
DROP POLICY IF EXISTS "tenant_update_financial_transactions" ON financial_transactions;
DROP POLICY IF EXISTS "tenant_delete_financial_transactions" ON financial_transactions;

CREATE POLICY "tenant_read_financial_transactions" ON financial_transactions
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_write_financial_transactions" ON financial_transactions
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_update_financial_transactions" ON financial_transactions
  FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_delete_financial_transactions" ON financial_transactions
  FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- contratos
-- ---------------------------------------------------------------------------
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

DROP POLICY IF EXISTS "bo_full_contratos" ON contratos;
DROP POLICY IF EXISTS "tenant_read_contratos" ON contratos;
DROP POLICY IF EXISTS "tenant_write_contratos" ON contratos;
DROP POLICY IF EXISTS "tenant_update_contratos" ON contratos;
DROP POLICY IF EXISTS "tenant_delete_contratos" ON contratos;

CREATE POLICY "tenant_read_contratos" ON contratos
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_write_contratos" ON contratos
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_update_contratos" ON contratos
  FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_delete_contratos" ON contratos
  FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- calendar_events
-- ---------------------------------------------------------------------------
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

DROP POLICY IF EXISTS "bo_full_calendar_events" ON calendar_events;
DROP POLICY IF EXISTS "tenant_read_calendar_events" ON calendar_events;
DROP POLICY IF EXISTS "tenant_write_calendar_events" ON calendar_events;
DROP POLICY IF EXISTS "tenant_update_calendar_events" ON calendar_events;
DROP POLICY IF EXISTS "tenant_delete_calendar_events" ON calendar_events;

CREATE POLICY "tenant_read_calendar_events" ON calendar_events
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_write_calendar_events" ON calendar_events
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_update_calendar_events" ON calendar_events
  FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_delete_calendar_events" ON calendar_events
  FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- chat_channels
-- ---------------------------------------------------------------------------
ALTER TABLE chat_channels ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

DROP POLICY IF EXISTS "bo_full_chat_channels" ON chat_channels;
DROP POLICY IF EXISTS "tenant_read_chat_channels" ON chat_channels;
DROP POLICY IF EXISTS "tenant_write_chat_channels" ON chat_channels;
DROP POLICY IF EXISTS "tenant_update_chat_channels" ON chat_channels;
DROP POLICY IF EXISTS "tenant_delete_chat_channels" ON chat_channels;

CREATE POLICY "tenant_read_chat_channels" ON chat_channels
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_write_chat_channels" ON chat_channels
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_update_chat_channels" ON chat_channels
  FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_delete_chat_channels" ON chat_channels
  FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- chat_messages
-- ---------------------------------------------------------------------------
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

DROP POLICY IF EXISTS "bo_full_chat_messages" ON chat_messages;
DROP POLICY IF EXISTS "tenant_read_chat_messages" ON chat_messages;
DROP POLICY IF EXISTS "tenant_write_chat_messages" ON chat_messages;
DROP POLICY IF EXISTS "tenant_update_chat_messages" ON chat_messages;
DROP POLICY IF EXISTS "tenant_delete_chat_messages" ON chat_messages;

CREATE POLICY "tenant_read_chat_messages" ON chat_messages
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_write_chat_messages" ON chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_update_chat_messages" ON chat_messages
  FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_delete_chat_messages" ON chat_messages
  FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- chat_members
-- ---------------------------------------------------------------------------
ALTER TABLE chat_members ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

DROP POLICY IF EXISTS "bo_full_chat_members" ON chat_members;
DROP POLICY IF EXISTS "tenant_read_chat_members" ON chat_members;
DROP POLICY IF EXISTS "tenant_write_chat_members" ON chat_members;
DROP POLICY IF EXISTS "tenant_update_chat_members" ON chat_members;
DROP POLICY IF EXISTS "tenant_delete_chat_members" ON chat_members;

CREATE POLICY "tenant_read_chat_members" ON chat_members
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_write_chat_members" ON chat_members
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_update_chat_members" ON chat_members
  FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_delete_chat_members" ON chat_members
  FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- media
-- ---------------------------------------------------------------------------
ALTER TABLE media ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

DROP POLICY IF EXISTS "bo_full_media" ON media;
DROP POLICY IF EXISTS "tenant_read_media" ON media;
DROP POLICY IF EXISTS "tenant_write_media" ON media;
DROP POLICY IF EXISTS "tenant_update_media" ON media;
DROP POLICY IF EXISTS "tenant_delete_media" ON media;

CREATE POLICY "tenant_read_media" ON media
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_write_media" ON media
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_update_media" ON media
  FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_delete_media" ON media
  FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- brokers
-- ---------------------------------------------------------------------------
ALTER TABLE brokers ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

DROP POLICY IF EXISTS "bo_full_brokers" ON brokers;
DROP POLICY IF EXISTS "tenant_read_brokers" ON brokers;
DROP POLICY IF EXISTS "tenant_write_brokers" ON brokers;
DROP POLICY IF EXISTS "tenant_update_brokers" ON brokers;
DROP POLICY IF EXISTS "tenant_delete_brokers" ON brokers;

CREATE POLICY "tenant_read_brokers" ON brokers
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_write_brokers" ON brokers
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_update_brokers" ON brokers
  FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_delete_brokers" ON brokers
  FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- content_items
-- ---------------------------------------------------------------------------
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

DROP POLICY IF EXISTS "bo_full_content_items" ON content_items;
DROP POLICY IF EXISTS "tenant_read_content_items" ON content_items;
DROP POLICY IF EXISTS "tenant_write_content_items" ON content_items;
DROP POLICY IF EXISTS "tenant_update_content_items" ON content_items;
DROP POLICY IF EXISTS "tenant_delete_content_items" ON content_items;

CREATE POLICY "tenant_read_content_items" ON content_items
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_write_content_items" ON content_items
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_update_content_items" ON content_items
  FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_delete_content_items" ON content_items
  FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- content_calendar
-- ---------------------------------------------------------------------------
ALTER TABLE content_calendar ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

DROP POLICY IF EXISTS "bo_full_content_calendar" ON content_calendar;
DROP POLICY IF EXISTS "tenant_read_content_calendar" ON content_calendar;
DROP POLICY IF EXISTS "tenant_write_content_calendar" ON content_calendar;
DROP POLICY IF EXISTS "tenant_update_content_calendar" ON content_calendar;
DROP POLICY IF EXISTS "tenant_delete_content_calendar" ON content_calendar;

CREATE POLICY "tenant_read_content_calendar" ON content_calendar
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_write_content_calendar" ON content_calendar
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_update_content_calendar" ON content_calendar
  FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_delete_content_calendar" ON content_calendar
  FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- whatsapp_conversations
-- ---------------------------------------------------------------------------
ALTER TABLE whatsapp_conversations ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

DROP POLICY IF EXISTS "bo_full_whatsapp_conversations" ON whatsapp_conversations;
DROP POLICY IF EXISTS "tenant_read_whatsapp_conversations" ON whatsapp_conversations;
DROP POLICY IF EXISTS "tenant_write_whatsapp_conversations" ON whatsapp_conversations;
DROP POLICY IF EXISTS "tenant_update_whatsapp_conversations" ON whatsapp_conversations;
DROP POLICY IF EXISTS "tenant_delete_whatsapp_conversations" ON whatsapp_conversations;

CREATE POLICY "tenant_read_whatsapp_conversations" ON whatsapp_conversations
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_write_whatsapp_conversations" ON whatsapp_conversations
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_update_whatsapp_conversations" ON whatsapp_conversations
  FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_delete_whatsapp_conversations" ON whatsapp_conversations
  FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- whatsapp_messages
-- ---------------------------------------------------------------------------
ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

DROP POLICY IF EXISTS "bo_full_whatsapp_messages" ON whatsapp_messages;
DROP POLICY IF EXISTS "tenant_read_whatsapp_messages" ON whatsapp_messages;
DROP POLICY IF EXISTS "tenant_write_whatsapp_messages" ON whatsapp_messages;
DROP POLICY IF EXISTS "tenant_update_whatsapp_messages" ON whatsapp_messages;
DROP POLICY IF EXISTS "tenant_delete_whatsapp_messages" ON whatsapp_messages;

CREATE POLICY "tenant_read_whatsapp_messages" ON whatsapp_messages
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_write_whatsapp_messages" ON whatsapp_messages
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_update_whatsapp_messages" ON whatsapp_messages
  FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));

CREATE POLICY "tenant_delete_whatsapp_messages" ON whatsapp_messages
  FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT tu.tenant_id FROM tenant_users tu WHERE tu.user_id = auth.uid()));


-- ============================================================================
-- 2. NAMING MISMATCHES — COMPATIBILITY VIEWS
-- ============================================================================

-- okr_check_ins → okr_checkins compatibility
CREATE OR REPLACE VIEW okr_check_ins AS SELECT * FROM okr_checkins;

-- transactions → financial_transactions compatibility
CREATE OR REPLACE VIEW transactions AS SELECT * FROM financial_transactions;


-- ============================================================================
-- 3. MISSING STORAGE BUCKETS + POLICIES
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
  VALUES ('properties', 'properties', true)
  ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
  VALUES ('user-media', 'user-media', true)
  ON CONFLICT (id) DO NOTHING;

-- Storage object policies — drop and recreate to include new buckets
DROP POLICY IF EXISTS "media_public_read" ON storage.objects;
CREATE POLICY "media_public_read" ON storage.objects
  FOR SELECT
  USING (bucket_id IN ('media','developments','avatars','content','developers','contratos','properties','user-media'));

DROP POLICY IF EXISTS "media_auth_write" ON storage.objects;
CREATE POLICY "media_auth_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('media','developments','avatars','content','developers','contratos','properties','user-media'));

DROP POLICY IF EXISTS "media_auth_update" ON storage.objects;
CREATE POLICY "media_auth_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id IN ('media','developments','avatars','content','developers','contratos','properties','user-media'));

DROP POLICY IF EXISTS "media_auth_delete" ON storage.objects;
CREATE POLICY "media_auth_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id IN ('media','developments','avatars','content','developers','contratos','properties','user-media'));


-- ============================================================================
-- 4. ENABLE REALTIME FOR CHAT TABLES
-- ============================================================================

-- Use DO block to avoid errors if tables are already in the publication
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE chat_channels;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE chat_read_receipts;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


COMMIT;
