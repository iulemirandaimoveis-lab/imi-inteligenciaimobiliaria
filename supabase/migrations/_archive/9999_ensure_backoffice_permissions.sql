-- Ensure RLS is enabled on all relevant tables
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE developments ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts (and ensure we have a clean slate)
DROP POLICY IF EXISTS "authenticated_all" ON developers;
DROP POLICY IF EXISTS "authenticated_all" ON developments;
DROP POLICY IF EXISTS "authenticated_all" ON content;
DROP POLICY IF EXISTS "authenticated_all" ON consultations;
DROP POLICY IF EXISTS "authenticated_all" ON leads;

-- Create permissive policies for authenticated users (Backoffice users)
CREATE POLICY "authenticated_all" ON developers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON developments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON content FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON consultations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON leads FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Grant privileges to authenticated role just in case
GRANT ALL ON TABLE developers TO authenticated;
GRANT ALL ON TABLE developments TO authenticated;
GRANT ALL ON TABLE content TO authenticated;
GRANT ALL ON TABLE consultations TO authenticated;
GRANT ALL ON TABLE leads TO authenticated;
