-- Fix 1: Restrict development_units public read to loteamento developments only.
-- The previous policy USING (true) exposed units from all development types (apartments, etc.)
-- to anonymous users, leaking pricing and status data that should not be public.

DROP POLICY IF EXISTS "public_read_units" ON public.development_units;

CREATE POLICY "loteamento_public_read_units"
  ON public.development_units FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.developments d
      WHERE d.id = development_id AND d.type = 'loteamento'
    )
  );

-- Fix 2: Enable the interactive lot map for Alto Bellevue.
-- lot_map_enabled defaults to false; must be explicitly set per development
-- so that adding the InteractiveLotMap component to imoveis/[slug]/page.tsx
-- does not accidentally activate the map for developments that lack a JSON file.

UPDATE public.developments
  SET lot_map_enabled = true
  WHERE id = 'ab7d1fc1-f069-4e3b-a515-8e1204c11247';
