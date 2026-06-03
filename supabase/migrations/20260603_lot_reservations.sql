-- Parte 2.1 — Reserva de lote com lock transacional (anti-conflito)
-- Fonte da verdade: subdivision_lots (lotes de loteamento; Alto Bellevue = 383).
-- Política aprovada: somente corretor/gestor (role admin|manager) reserva.
-- Janela: 48h com expiração automática (cron). Status no banco é MAIÚSCULO.

-- ── 1. Helper de papel ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_lot_manager()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p
                 WHERE p.id = auth.uid() AND p.role IN ('admin','manager'));
$$;

-- ── 2. Tabela de reservas (também trilha de auditoria) ──────────────────────
CREATE TABLE IF NOT EXISTS public.lot_reservations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id          UUID NOT NULL REFERENCES public.subdivision_lots(id) ON DELETE CASCADE,
  development_id  UUID REFERENCES public.developments(id),
  status          TEXT NOT NULL DEFAULT 'ativa'
                  CHECK (status IN ('ativa','expirada','cancelada','convertida')),
  reserved_by     UUID REFERENCES auth.users(id),
  client_name     TEXT,
  client_phone    TEXT,
  note            TEXT,
  reserved_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL,
  released_at     TIMESTAMPTZ,
  released_by     UUID REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS idx_lot_reservations_lot     ON public.lot_reservations(lot_id);
CREATE INDEX IF NOT EXISTS idx_lot_reservations_status  ON public.lot_reservations(status);
CREATE INDEX IF NOT EXISTS idx_lot_reservations_expires ON public.lot_reservations(expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_reservation_per_lot
  ON public.lot_reservations(lot_id) WHERE status = 'ativa';

-- ── 3. RLS — reservas contêm PII (telefone): só admin/manager ───────────────
ALTER TABLE public.lot_reservations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lot_reservations_manager_all" ON public.lot_reservations;
CREATE POLICY "lot_reservations_manager_all" ON public.lot_reservations
  FOR ALL
  USING (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','manager')))
  WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','manager')));

-- ── 4. reserve_lot — reserva atômica com lock de linha (SELECT ... FOR UPDATE)
CREATE OR REPLACE FUNCTION public.reserve_lot(
  p_lot_id UUID, p_client_name TEXT DEFAULT NULL, p_client_phone TEXT DEFAULT NULL,
  p_note TEXT DEFAULT NULL, p_hours INT DEFAULT 48)
RETURNS public.lot_reservations
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_lot public.subdivision_lots; v_resv public.lot_reservations;
BEGIN
  IF NOT public.is_lot_manager() THEN RAISE EXCEPTION 'NOT_AUTHORIZED' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_lot FROM public.subdivision_lots WHERE id = p_lot_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'LOT_NOT_FOUND' USING ERRCODE = 'P0002'; END IF;
  UPDATE public.lot_reservations SET status='expirada', released_at=NOW()
   WHERE lot_id=p_lot_id AND status='ativa' AND expires_at < NOW();
  IF EXISTS (SELECT 1 FROM public.lot_reservations WHERE lot_id=p_lot_id AND status='ativa') THEN
    RAISE EXCEPTION 'LOT_ALREADY_RESERVED' USING ERRCODE = 'P0001'; END IF;
  IF upper(coalesce(v_lot.status,'')) IS DISTINCT FROM 'DISPONIVEL' THEN
    RAISE EXCEPTION 'LOT_NOT_AVAILABLE' USING ERRCODE = 'P0001'; END IF;
  UPDATE public.subdivision_lots SET status='RESERVADO' WHERE id=p_lot_id;
  INSERT INTO public.lot_reservations (lot_id, development_id, reserved_by, client_name, client_phone, note, expires_at)
  VALUES (p_lot_id, v_lot.development_id, auth.uid(), p_client_name, p_client_phone, p_note,
          NOW() + make_interval(hours => p_hours))
  RETURNING * INTO v_resv;
  RETURN v_resv;
END; $$;

-- ── 5. release_lot — libera (cancela) a reserva ativa ───────────────────────
CREATE OR REPLACE FUNCTION public.release_lot(p_lot_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS public.subdivision_lots
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_lot public.subdivision_lots;
BEGIN
  IF NOT public.is_lot_manager() THEN RAISE EXCEPTION 'NOT_AUTHORIZED' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_lot FROM public.subdivision_lots WHERE id = p_lot_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'LOT_NOT_FOUND' USING ERRCODE = 'P0002'; END IF;
  UPDATE public.lot_reservations SET status='cancelada', released_at=NOW(), released_by=auth.uid(),
         note=COALESCE(p_reason, note)
   WHERE lot_id=p_lot_id AND status='ativa';
  IF upper(coalesce(v_lot.status,'')) = 'RESERVADO' THEN
    UPDATE public.subdivision_lots SET status='DISPONIVEL' WHERE id=p_lot_id RETURNING * INTO v_lot; END IF;
  RETURN v_lot;
END; $$;

-- ── 6. expire_lot_reservations — varredura (cron) de reservas vencidas ──────
CREATE OR REPLACE FUNCTION public.expire_lot_reservations()
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count INT;
BEGIN
  WITH expired AS (
    UPDATE public.lot_reservations SET status='expirada', released_at=NOW()
     WHERE status='ativa' AND expires_at < NOW() RETURNING lot_id)
  UPDATE public.subdivision_lots l SET status='DISPONIVEL'
    FROM expired e WHERE l.id=e.lot_id AND upper(coalesce(l.status,''))='RESERVADO';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END; $$;

-- ── 7. Grants restritos (sem PUBLIC/anon) ───────────────────────────────────
REVOKE ALL ON FUNCTION public.reserve_lot(UUID, TEXT, TEXT, TEXT, INT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.release_lot(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.expire_lot_reservations() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_lot_manager() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reserve_lot(UUID, TEXT, TEXT, TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_lot(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_lot_manager() TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_lot_reservations() TO service_role;
