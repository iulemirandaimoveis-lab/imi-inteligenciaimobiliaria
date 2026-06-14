-- LotMap CRM Engine — Phase 1
-- Creates: brokers, development_users, lot_proposals
-- Adds: broker_name to lot_reservations
-- Functions: negotiate_lot, change_lot_status (with metadata via session var)
-- Updates: log_lot_status_change trigger to capture session metadata
-- Seeds: Miguel Marques June/2026 negotiations

-- ── 1. Brokers table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.brokers (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT    NOT NULL,
  phone      TEXT,
  email      TEXT,
  creci      TEXT,
  active     BOOLEAN NOT NULL DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_brokers_active ON public.brokers(active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_brokers_name ON public.brokers(lower(name));

ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "brokers_public_read"   ON public.brokers;
DROP POLICY IF EXISTS "brokers_manager_write" ON public.brokers;

CREATE POLICY "brokers_public_read" ON public.brokers
  FOR SELECT USING (true);

CREATE POLICY "brokers_manager_write" ON public.brokers
  FOR ALL
  USING (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','manager')))
  WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','manager')));

-- ── 2. Development users (per-development role assignments) ──────────────────
CREATE TABLE IF NOT EXISTS public.development_users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  development_id UUID NOT NULL REFERENCES public.developments(id) ON DELETE CASCADE,
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  broker_id      UUID REFERENCES public.brokers(id) ON DELETE SET NULL,
  role           TEXT NOT NULL DEFAULT 'broker'
                 CHECK (role IN ('admin','manager','broker','viewer')),
  permissions    JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dev_users_dev  ON public.development_users(development_id);
CREATE INDEX IF NOT EXISTS idx_dev_users_user ON public.development_users(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_dev_users_user
  ON public.development_users(development_id, user_id) WHERE user_id IS NOT NULL;

ALTER TABLE public.development_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dev_users_manager_all"   ON public.development_users;
DROP POLICY IF EXISTS "dev_users_own_read"      ON public.development_users;

CREATE POLICY "dev_users_manager_all" ON public.development_users
  FOR ALL
  USING (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','manager')));

CREATE POLICY "dev_users_own_read" ON public.development_users
  FOR SELECT USING (auth.uid() = user_id);

-- ── 3. Lot proposals ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lot_proposals (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id         UUID    NOT NULL REFERENCES public.subdivision_lots(id) ON DELETE CASCADE,
  development_id UUID    REFERENCES public.developments(id),
  broker_id      UUID    REFERENCES public.brokers(id),
  created_by     UUID    REFERENCES auth.users(id),
  broker_name    TEXT,
  client_name    TEXT,
  client_phone   TEXT,
  price          NUMERIC(14,2),
  down_payment   NUMERIC(14,2),
  installments   INTEGER,
  notes          TEXT,
  status         TEXT NOT NULL DEFAULT 'aberta'
                 CHECK (status IN ('aberta','aprovada','recusada','cancelada')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lot_proposals_lot    ON public.lot_proposals(lot_id);
CREATE INDEX IF NOT EXISTS idx_lot_proposals_dev    ON public.lot_proposals(development_id);
CREATE INDEX IF NOT EXISTS idx_lot_proposals_broker ON public.lot_proposals(broker_id);
CREATE INDEX IF NOT EXISTS idx_lot_proposals_by     ON public.lot_proposals(created_by);

ALTER TABLE public.lot_proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lot_proposals_manager_all" ON public.lot_proposals;
DROP POLICY IF EXISTS "lot_proposals_own_read"    ON public.lot_proposals;

CREATE POLICY "lot_proposals_manager_all" ON public.lot_proposals
  FOR ALL
  USING (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','manager')));

CREATE POLICY "lot_proposals_own_read" ON public.lot_proposals
  FOR SELECT USING (auth.uid() = created_by);

-- ── 4. Add broker_name to lot_reservations ──────────────────────────────────
ALTER TABLE public.lot_reservations ADD COLUMN IF NOT EXISTS broker_name TEXT;

-- ── 5. Update trigger to capture session metadata ─────────────────────────
-- Callers can set: SET LOCAL "lot_audit.metadata" = '{"broker_name":"X"}';
-- before an UPDATE to have it captured in the history record.
CREATE OR REPLACE FUNCTION public.log_lot_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_meta JSONB;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    BEGIN
      v_meta := current_setting('lot_audit.metadata', true)::JSONB;
    EXCEPTION WHEN OTHERS THEN
      v_meta := NULL;
    END;
    INSERT INTO public.lot_status_history (
      lot_id, development_id, previous_status, new_status, changed_by, metadata
    ) VALUES (
      NEW.id, NEW.development_id, OLD.status, NEW.status, auth.uid(), v_meta
    );
  END IF;
  RETURN NEW;
END;
$$;

-- ── 6. negotiate_lot — marks lot NEGOCIACAO (any authenticated user) ─────────
CREATE OR REPLACE FUNCTION public.negotiate_lot(
  p_lot_id      UUID,
  p_broker_name TEXT DEFAULT NULL,
  p_client_name TEXT DEFAULT NULL,
  p_client_phone TEXT DEFAULT NULL,
  p_note        TEXT DEFAULT NULL
)
RETURNS public.subdivision_lots
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_lot public.subdivision_lots;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_lot FROM public.subdivision_lots WHERE id = p_lot_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'LOT_NOT_FOUND' USING ERRCODE = 'P0002'; END IF;

  IF upper(coalesce(v_lot.status,'')) NOT IN ('DISPONIVEL','NEGOCIACAO') THEN
    RAISE EXCEPTION 'LOT_NOT_AVAILABLE_FOR_NEGOTIATION' USING ERRCODE = 'P0001';
  END IF;

  -- Set metadata so the trigger captures broker info
  PERFORM set_config('lot_audit.metadata',
    jsonb_build_object(
      'broker_name', p_broker_name,
      'client_name', p_client_name,
      'client_phone', p_client_phone,
      'note', p_note
    )::TEXT,
    true  -- local to transaction
  );

  UPDATE public.subdivision_lots SET status = 'NEGOCIACAO' WHERE id = p_lot_id
  RETURNING * INTO v_lot;

  RETURN v_lot;
END;
$$;

REVOKE ALL ON FUNCTION public.negotiate_lot(UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.negotiate_lot(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- ── 7. change_lot_status — generic status change for managers ────────────────
CREATE OR REPLACE FUNCTION public.change_lot_status(
  p_lot_id      UUID,
  p_new_status  TEXT,
  p_reason      TEXT DEFAULT NULL,
  p_broker_name TEXT DEFAULT NULL
)
RETURNS public.subdivision_lots
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_lot public.subdivision_lots; v_old TEXT;
BEGIN
  IF NOT public.is_lot_manager() THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_lot FROM public.subdivision_lots WHERE id = p_lot_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'LOT_NOT_FOUND' USING ERRCODE = 'P0002'; END IF;

  v_old := v_lot.status;

  IF upper(p_new_status) NOT IN
     ('DISPONIVEL','NEGOCIACAO','RESERVADO','DOCUMENTACAO','VENDIDO','BLOQUEADO','PROPRIETARIO','INDISPONIVEL')
  THEN
    RAISE EXCEPTION 'INVALID_STATUS' USING ERRCODE = 'P0001';
  END IF;

  -- Releasing a reservation: cancel active reservation record
  IF upper(p_new_status) = 'DISPONIVEL' AND upper(coalesce(v_old,'')) = 'RESERVADO' THEN
    UPDATE public.lot_reservations
       SET status='cancelada', released_at=NOW(), released_by=auth.uid(),
           note=COALESCE(p_reason, note)
     WHERE lot_id=p_lot_id AND status='ativa';
  END IF;

  PERFORM set_config('lot_audit.metadata',
    jsonb_build_object(
      'broker_name', p_broker_name,
      'reason', p_reason,
      'changed_via', 'change_lot_status'
    )::TEXT,
    true
  );

  UPDATE public.subdivision_lots SET status = upper(p_new_status) WHERE id = p_lot_id
  RETURNING * INTO v_lot;

  RETURN v_lot;
END;
$$;

REVOKE ALL ON FUNCTION public.change_lot_status(UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.change_lot_status(UUID, TEXT, TEXT, TEXT) TO authenticated;

-- ── 8. Seed: brokers for Miguel Marques ─────────────────────────────────────
INSERT INTO public.brokers (name) VALUES
  ('Walter'),
  ('Gilka'),
  ('Miranda'),
  ('Eduardo'),
  ('Hyago'),
  ('Gustavo'),
  ('Mansur'),
  ('Tenório'),
  ('Anderson'),
  ('Clevis'),
  ('Lucas')
ON CONFLICT (lower(name)) DO NOTHING;

-- ── 9. Seed: Miguel Marques June/2026 negotiations ──────────────────────────
-- Disable status-change trigger so we insert history manually with broker metadata
ALTER TABLE public.subdivision_lots DISABLE TRIGGER lot_status_audit;

DO $$
DECLARE
  dev_id    UUID := '8b9f6835-1bd0-4850-80b0-aaef2223300d';
  seed_lots JSONB := '[
    {"q":"M","l":4,  "b":"Walter"},
    {"q":"M","l":5,  "b":"Walter"},
    {"q":"E","l":36, "b":"Gilka / Miranda"},
    {"q":"E","l":37, "b":"Gilka / Miranda"},
    {"q":"K","l":51, "b":"Eduardo"},
    {"q":"F","l":36, "b":"Hyago"},
    {"q":"I","l":1,  "b":"Gustavo"},
    {"q":"G","l":1,  "b":"Gustavo"},
    {"q":"L","l":3,  "b":"Mansur"},
    {"q":"M","l":28, "b":"Miranda"},
    {"q":"M","l":29, "b":"Miranda"},
    {"q":"F","l":6,  "b":"Tenório"},
    {"q":"F","l":7,  "b":"Tenório"},
    {"q":"L","l":2,  "b":"Anderson"},
    {"q":"D","l":21, "b":"Clevis"},
    {"q":"M","l":26, "b":"Mansur"},
    {"q":"M","l":27, "b":"Mansur"},
    {"q":"F","l":8,  "b":"corretor_nao_informado"},
    {"q":"F","l":9,  "b":"corretor_nao_informado"},
    {"q":"F","l":10, "b":"corretor_nao_informado"},
    {"q":"F","l":11, "b":"corretor_nao_informado"},
    {"q":"D","l":48, "b":"Mansur"},
    {"q":"L","l":40, "b":"Lucas"},
    {"q":"L","l":41, "b":"Lucas"}
  ]'::JSONB;
  rec       JSONB;
  lot_id    UUID;
  old_st    TEXT;
BEGIN
  FOR rec IN SELECT * FROM jsonb_array_elements(seed_lots) LOOP
    SELECT sl.id, sl.status INTO lot_id, old_st
      FROM public.subdivision_lots sl
     WHERE sl.development_id = dev_id
       AND upper(sl.quadra)  = upper(rec->>'q')
       AND sl.lot_number     = (rec->>'l')::INTEGER;

    IF lot_id IS NOT NULL THEN
      UPDATE public.subdivision_lots SET status = 'NEGOCIACAO' WHERE id = lot_id;

      INSERT INTO public.lot_status_history (
        lot_id, development_id, previous_status, new_status,
        changed_by, reason, metadata
      ) VALUES (
        lot_id, dev_id, coalesce(old_st,'DISPONIVEL'), 'NEGOCIACAO',
        NULL,
        'Seed: Negociações de Junho/2026',
        jsonb_build_object(
          'broker_name', rec->>'b',
          'seed_date',   '2026-06-14',
          'source',      'whatsapp_seed'
        )
      );
    END IF;
  END LOOP;
END $$;

ALTER TABLE public.subdivision_lots ENABLE TRIGGER lot_status_audit;
