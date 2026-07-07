-- ═══════════════════════════════════════════════════════════════════════════
-- Agendamento de Visita (calendário do corretor) — visit_bookings
-- ═══════════════════════════════════════════════════════════════════════════
-- O CLIENTE agenda uma visita a partir da página do imóvel (card do corretor)
-- ou durante a vídeo chamada: escolhe data/hora no calendário do corretor,
-- preenche nome/e-mail/telefone e anexa documento com foto para garantir o
-- compromisso. O agendamento notifica o corretor e cai na agenda dele (ICS +
-- Google Calendar quando configurado).
--
-- ⚠️ Migration versionada — NÃO aplicar sem aprovação do dono (invariante do
--    projeto: mudanças de banco exigem aprovação explícita). A API de
--    agendamento é best-effort: funciona (notifica por WhatsApp) mesmo antes
--    desta tabela existir; a persistência só liga depois de aplicada.
--
-- Convenções: PII (nome/telefone/e-mail/documentos) → RLS habilitada, leitura
-- só para admin/manager (espelha public.lot_reservations). Inserção pública
-- acontece via service role na rota /api/visits/book — sem policy para anon.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.visit_bookings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Token secreto para o cliente acompanhar/gerenciar o agendamento (P15).
  token             TEXT NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', '') UNIQUE,

  -- Empreendimento (opcional — pode agendar visita geral com o corretor).
  development_id    UUID REFERENCES public.developments(id) ON DELETE SET NULL,
  development_slug  TEXT,
  development_name  TEXT,

  -- Corretor (broker). broker_id pode ser nulo (corretor "default"/fallback);
  -- broker_phone é o identificador estável usado no anti-conflito de horário.
  broker_id         UUID,
  broker_name       TEXT,
  broker_phone      TEXT,
  broker_email      TEXT,

  -- Cliente.
  client_name       TEXT NOT NULL,
  client_email      TEXT,
  client_phone      TEXT NOT NULL,

  -- Agendamento.
  scheduled_at      TIMESTAMPTZ NOT NULL,
  duration_min      INTEGER NOT NULL DEFAULT 45,
  mode              TEXT NOT NULL DEFAULT 'presencial'
                    CHECK (mode IN ('presencial','video')),
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','confirmed','cancelled','completed','no_show')),

  -- Origem no funil e canais.
  source            TEXT NOT NULL DEFAULT 'property_page'
                    CHECK (source IN ('property_page','video_call','lot_map','other')),
  video_room_url    TEXT,

  -- Documento com foto + demais anexos enviados pelo cliente (URLs assinadas).
  documents         JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Sincronização com a agenda externa do corretor (Google Calendar).
  external_event_id TEXT,
  notes             TEXT,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visit_bookings_scheduled   ON public.visit_bookings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_visit_bookings_broker      ON public.visit_bookings(broker_id);
CREATE INDEX IF NOT EXISTS idx_visit_bookings_broker_fone ON public.visit_bookings(broker_phone);
CREATE INDEX IF NOT EXISTS idx_visit_bookings_development  ON public.visit_bookings(development_id);
CREATE INDEX IF NOT EXISTS idx_visit_bookings_status      ON public.visit_bookings(status);

-- Anti-conflito: um corretor (por telefone) não pode ter dois horários ativos
-- no mesmo instante. Ativos = pendente ou confirmado.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_visit_broker_slot
  ON public.visit_bookings(broker_phone, scheduled_at)
  WHERE status IN ('pending','confirmed') AND broker_phone IS NOT NULL;

-- updated_at automático.
CREATE OR REPLACE FUNCTION public.visit_bookings_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_visit_bookings_updated_at ON public.visit_bookings;
CREATE TRIGGER trg_visit_bookings_updated_at
  BEFORE UPDATE ON public.visit_bookings
  FOR EACH ROW EXECUTE FUNCTION public.visit_bookings_touch_updated_at();

-- ── RLS — contém PII: leitura/gestão só para admin/manager ───────────────────
ALTER TABLE public.visit_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "visit_bookings_manager_all" ON public.visit_bookings;
CREATE POLICY "visit_bookings_manager_all" ON public.visit_bookings
  FOR ALL
  USING (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','manager')))
  WITH CHECK (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','manager')));

-- Sem GRANT para anon: a criação pública passa pela service role na API.
REVOKE ALL ON public.visit_bookings FROM anon;
