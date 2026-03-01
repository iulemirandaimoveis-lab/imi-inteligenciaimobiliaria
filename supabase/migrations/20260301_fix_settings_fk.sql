-- Fix settings table FK constraint that prevents single-tenant operation
-- The user_id references auth.users(id) but in single-tenant mode there's no auth user
-- Solution: Drop FK, make user_id nullable, allow settings without auth

-- Drop the FK constraint if it exists
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'settings_user_id_fkey'
        AND table_name = 'settings'
    ) THEN
        ALTER TABLE settings DROP CONSTRAINT settings_user_id_fkey;
    END IF;
END $$;

-- Make user_id nullable (should already be, but ensure)
ALTER TABLE settings ALTER COLUMN user_id DROP NOT NULL;

-- Drop the unique constraint on user_id if exists (allow multiple settings rows)
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'settings_user_id_key'
        AND table_name = 'settings'
    ) THEN
        ALTER TABLE settings DROP CONSTRAINT settings_user_id_key;
    END IF;
END $$;

-- Enable RLS but allow public read/write for single-tenant
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "settings_read" ON settings;
DROP POLICY IF EXISTS "settings_write" ON settings;
DROP POLICY IF EXISTS "settings_update" ON settings;
DROP POLICY IF EXISTS "Allow public read settings" ON settings;
DROP POLICY IF EXISTS "Allow public write settings" ON settings;

-- Create permissive policies for single-tenant operation
CREATE POLICY "settings_public_read" ON settings FOR SELECT USING (true);
CREATE POLICY "settings_public_insert" ON settings FOR INSERT WITH CHECK (true);
CREATE POLICY "settings_public_update" ON settings FOR UPDATE USING (true) WITH CHECK (true);

-- Also create audit_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for audit_log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_log_public_read" ON audit_log;
DROP POLICY IF EXISTS "audit_log_public_insert" ON audit_log;
CREATE POLICY "audit_log_public_read" ON audit_log FOR SELECT USING (true);
CREATE POLICY "audit_log_public_insert" ON audit_log FOR INSERT WITH CHECK (true);

-- Create index for audit_log queries
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, action);
