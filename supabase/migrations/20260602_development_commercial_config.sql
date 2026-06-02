-- Phase 0: Move hardcoded commercial config (WhatsApp, virtual tour, payment conditions)
-- out of source code and into the database.

CREATE TABLE IF NOT EXISTS public.development_commercial_config (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  development_id      UUID NOT NULL UNIQUE REFERENCES public.developments(id) ON DELETE CASCADE,
  whatsapp_contact    TEXT,
  virtual_tour_url    TEXT,
  payment_conditions  JSONB,
  notes               TEXT,
  created_by          UUID REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dev_commercial_config_dev ON public.development_commercial_config(development_id);

ALTER TABLE public.development_commercial_config ENABLE ROW LEVEL SECURITY;

-- Public read (payment conditions shown on public site)
CREATE POLICY "dev_commercial_config_public_read" ON public.development_commercial_config
  FOR SELECT USING (true);

-- Only admin/manager can write
CREATE POLICY "dev_commercial_config_manager_write" ON public.development_commercial_config
  FOR ALL
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'manager')
    )
  );

CREATE OR REPLACE FUNCTION public.dev_commercial_config_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER dev_commercial_config_updated_at
  BEFORE UPDATE ON public.development_commercial_config
  FOR EACH ROW EXECUTE FUNCTION public.dev_commercial_config_set_updated_at();

-- ── Seed: Jazz Boulevard ─────────────────────────────────────────────────────
-- WhatsApp contacts and virtual tour URL — previously hardcoded in source code
INSERT INTO public.development_commercial_config (development_id, whatsapp_contact, virtual_tour_url, notes)
SELECT
  id,
  '558799668204',
  'https://tour.panoee.net/TORRE_SOUL_RESIDENCE',
  'Jazz Boulevard campaign — manager WhatsApp. Previously hardcoded in [slug]/page.tsx'
FROM public.developments
WHERE slug = 'jazz-boulevard'
ON CONFLICT (development_id) DO UPDATE SET
  whatsapp_contact = EXCLUDED.whatsapp_contact,
  virtual_tour_url = EXCLUDED.virtual_tour_url,
  updated_at = NOW();

-- ── Seed: Alto Bellevue ──────────────────────────────────────────────────────
-- dev UUID is fixed and hardcoded in all Alto Bellevue migrations
INSERT INTO public.development_commercial_config (development_id, payment_conditions, notes)
VALUES (
  'ab7d1fc1-f069-4e3b-a515-8e1204c11247',
  '{"entrada": "20% de entrada", "parcelas": 120, "parcelValue": "a partir de R$ 1.800", "method": "Financiamento / Direto", "seller": "Alto Bellevue"}'::JSONB,
  'Payment conditions. Previously hardcoded in SubdivisionLotMap.tsx'
)
ON CONFLICT (development_id) DO UPDATE SET
  payment_conditions = EXCLUDED.payment_conditions,
  updated_at = NOW();

-- ── Seed: Miguel Marques ─────────────────────────────────────────────────────
-- dev UUID matches PAYMENT_CONDITIONS object key in SubdivisionLotMap.tsx
INSERT INTO public.development_commercial_config (development_id, payment_conditions, notes)
VALUES (
  '8b9f6835-1bd0-4850-80b0-aaef2223300d',
  '{"entrada": "1+1 — R$ 1.450 (5%)", "parcelas": 150, "parcelValue": "a partir de R$ 183", "method": "Carnê", "seller": "Mano Imóveis"}'::JSONB,
  'Payment conditions. Previously hardcoded in SubdivisionLotMap.tsx'
)
ON CONFLICT (development_id) DO UPDATE SET
  payment_conditions = EXCLUDED.payment_conditions,
  updated_at = NOW();
