-- Segurança: a tabela `integrations` guarda secret_value (tokens de API).
-- A política antiga (auth_all_integrations) permitia que QUALQUER usuário
-- autenticado lesse todos os segredos. Restringe a admin/manager.
-- Loaders server-side usam service_role (bypassa RLS) — não afetados.
DROP POLICY IF EXISTS "auth_all_integrations" ON public.integrations;
DROP POLICY IF EXISTS "integrations_admin_manager" ON public.integrations;
CREATE POLICY "integrations_admin_manager" ON public.integrations
  FOR ALL
  USING (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','manager')))
  WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','manager')));
