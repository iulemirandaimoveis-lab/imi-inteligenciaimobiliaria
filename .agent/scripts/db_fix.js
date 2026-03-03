const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const sql = `
-- Fix Settings / Team Members auto-creation on auth.users INSERT
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.settings (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.team_members (id, email, name, role)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', 'Novo Usuário'), 'agent')
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger for properties / evaluations
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own settings" ON settings;
DROP POLICY IF EXISTS "Users can update own settings" ON settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON settings;

CREATE POLICY "Users can view own settings" ON settings FOR SELECT USING (user_id = auth.uid() OR auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'));
CREATE POLICY "Users can update own settings" ON settings FOR UPDATE USING (user_id = auth.uid() OR auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'));
CREATE POLICY "Users can insert own settings" ON settings FOR INSERT WITH CHECK (user_id = auth.uid());

-- Fix RLS Policies for evaluations
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view evaluations" ON evaluations;
DROP POLICY IF EXISTS "Users can insert evaluations" ON evaluations;
DROP POLICY IF EXISTS "Users can update evaluations" ON evaluations;

CREATE POLICY "Users can view evaluations" ON evaluations FOR SELECT USING (assigned_to = auth.uid() OR auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'));
CREATE POLICY "Users can insert evaluations" ON evaluations FOR INSERT WITH CHECK (assigned_to = auth.uid() OR auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'));
CREATE POLICY "Users can update evaluations" ON evaluations FOR UPDATE USING (assigned_to = auth.uid() OR auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'));

-- Fix RLS Policies for team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can update own team member profile" ON team_members;
CREATE POLICY "Users can update own team member profile" ON team_members FOR UPDATE USING (id = auth.uid() OR auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'));
  `;

  try {
    const client = await pool.connect();
    console.log('Connected to DB. Running migration...');
    await client.query(sql);
    console.log('Migration successfully applied.');
    client.release();
  } catch (err) {
    console.error('Error applying migration:', err.message || err);
  } finally {
    pool.end();
  }
}

runMigration();
