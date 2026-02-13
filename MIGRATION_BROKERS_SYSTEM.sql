-- MIGRATION: Broker Management System
-- Description: Creates the 'brokers' table and related functions for managing real estate agents

-- 1. Create the brokers table
CREATE TABLE IF NOT EXISTS brokers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    creci TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    role TEXT CHECK (role IN ('broker', 'broker_manager')) DEFAULT 'broker',
    permissions TEXT[] DEFAULT ARRAY['dashboard'],
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 2. Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS brokers_user_id_idx ON brokers(user_id);

-- 3. Enable RLS
ALTER TABLE brokers ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Allow admins to manage all brokers (assuming admins are identified securely, e.g., via metadata or separate table)
-- For now, allow authenticated users to view brokers (restrictive later based on roles)
CREATE POLICY "Admins can view all brokers" ON brokers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can insert brokers" ON brokers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins can update brokers" ON brokers FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can delete brokers" ON brokers FOR DELETE USING (auth.role() = 'authenticated');

-- 5. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_brokers_updated_at
BEFORE UPDATE ON brokers
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- 6. Function to verify module permission
CREATE OR REPLACE FUNCTION check_broker_permission(p_user_id UUID, p_module TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_permissions TEXT[];
    v_status TEXT;
BEGIN
    SELECT permissions, status INTO v_permissions, v_status
    FROM brokers
    WHERE user_id = p_user_id;

    IF v_status IS NULL OR v_status != 'active' THEN
        RETURN FALSE;
    END IF;

    RETURN p_module = ANY(v_permissions);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Grant access to authenticated users
GRANT ALL ON brokers TO authenticated;
GRANT EXECUTE ON FUNCTION check_broker_permission TO authenticated;
