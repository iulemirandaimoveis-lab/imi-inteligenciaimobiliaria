-- Phase 0: Audit trail for subdivision_lots + RLS hardening
-- Fixes: C1 (no audit log), C2 (any authed user can write any lot), C8 (imi_properties same)

-- ── 1. Audit trail table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lot_status_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id          UUID NOT NULL REFERENCES public.subdivision_lots(id) ON DELETE CASCADE,
  development_id  UUID REFERENCES public.developments(id),
  previous_status TEXT,
  new_status      TEXT NOT NULL,
  changed_by      UUID REFERENCES auth.users(id),
  reason          TEXT,
  metadata        JSONB,
  changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lot_status_history_lot ON public.lot_status_history(lot_id);
CREATE INDEX IF NOT EXISTS idx_lot_status_history_time ON public.lot_status_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_lot_status_history_dev ON public.lot_status_history(development_id);

-- Audit log is append-only: admins/managers can read, anyone (via trigger) can insert
ALTER TABLE public.lot_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lot_status_history_insert" ON public.lot_status_history
  FOR INSERT WITH CHECK (true);

CREATE POLICY "lot_status_history_read" ON public.lot_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'manager')
    )
  );

-- No UPDATE or DELETE policies → immutable audit trail

-- ── 2. Trigger function ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.log_lot_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.lot_status_history (
      lot_id, development_id, previous_status, new_status, changed_by
    ) VALUES (
      NEW.id,
      NEW.development_id,
      OLD.status,
      NEW.status,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lot_status_audit ON public.subdivision_lots;
CREATE TRIGGER lot_status_audit
  AFTER UPDATE ON public.subdivision_lots
  FOR EACH ROW
  EXECUTE FUNCTION public.log_lot_status_change();

-- ── 3. Fix RLS on subdivision_lots ──────────────────────────────────────────
-- Drop the overly permissive "any authed user can do anything" policy
DROP POLICY IF EXISTS "subdivision_lots_auth_write" ON public.subdivision_lots;
DROP POLICY IF EXISTS "subdivision_lots_manager_write" ON public.subdivision_lots;

-- Read: anyone (incl. anonymous) can see available lots; RLS was already permissive for SELECT
-- Write: only authenticated admins and managers
CREATE POLICY "subdivision_lots_manager_write" ON public.subdivision_lots
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

-- ── 4. Fix RLS on imi_properties (same flaw) — só se a tabela existir ───────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_name='imi_properties' AND table_schema='public') THEN
    EXECUTE 'DROP POLICY IF EXISTS "imi_properties_auth_write" ON public.imi_properties';
    EXECUTE 'DROP POLICY IF EXISTS "imi_properties_manager_write" ON public.imi_properties';
    EXECUTE 'CREATE POLICY "imi_properties_manager_write" ON public.imi_properties FOR ALL
      USING (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN (''admin'',''manager'')))
      WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN (''admin'',''manager'')))';
  END IF;
END $$;
