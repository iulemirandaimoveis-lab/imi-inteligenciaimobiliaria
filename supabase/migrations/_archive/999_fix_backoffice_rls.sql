-- Garantir policies permissivas
DROP POLICY IF EXISTS "authenticated_all" ON developers;
DROP POLICY IF EXISTS "authenticated_all" ON developments;
DROP POLICY IF EXISTS "authenticated_all" ON content;
DROP POLICY IF EXISTS "authenticated_all" ON consultations;

CREATE POLICY "authenticated_all" ON developers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON developments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON content FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON consultations FOR ALL TO authenticated USING (true) WITH CHECK (true);
