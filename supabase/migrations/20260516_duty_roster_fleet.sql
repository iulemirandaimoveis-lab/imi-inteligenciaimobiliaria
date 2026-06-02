-- ============================================================
-- IMI — Rodízio de Plantão + Gestão de Frota
-- Date: 2026-05-16
-- Features:
--   1. Sistema de Rodízio de Plantão Imobiliário
--   2. Gestão Operacional de Frota Corporativa
-- ============================================================

-- ══════════════════════════════════════════════════════════════
-- PARTE 1 — RODÍZIO DE PLANTÃO
-- ══════════════════════════════════════════════════════════════

-- 1.1 IMOBILIÁRIAS PARCEIRAS
CREATE TABLE IF NOT EXISTS public.partner_agencies (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  cnpj           TEXT UNIQUE,
  address        TEXT,
  city           TEXT,
  state          TEXT DEFAULT 'PE',
  phone          TEXT,
  email          TEXT,
  responsible    TEXT,
  agency_type    TEXT NOT NULL DEFAULT 'parceira'
                   CHECK (agency_type IN ('propria','parceira','incorporadora','loteadora')),
  max_brokers_per_slot INTEGER NOT NULL DEFAULT 4,
  working_hours_start  TIME DEFAULT '08:00',
  working_hours_end    TIME DEFAULT '20:00',
  duty_rules     JSONB DEFAULT '{}',
  is_active      BOOLEAN DEFAULT true,
  notes          TEXT,
  created_by     UUID REFERENCES auth.users(id),
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_agencies_active ON public.partner_agencies(is_active);

-- 1.2 LOCAIS DE PLANTÃO (imobiliária ou empreendimento)
CREATE TABLE IF NOT EXISTS public.duty_locations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  location_type    TEXT NOT NULL CHECK (location_type IN ('imobiliaria','loteamento','condominio','empreendimento')),
  agency_id        UUID REFERENCES public.partner_agencies(id) ON DELETE SET NULL,
  address          TEXT,
  city             TEXT,
  state            TEXT DEFAULT 'PE',
  lat              DECIMAL(9,6),
  lng              DECIMAL(9,6),
  max_brokers_per_slot INTEGER NOT NULL DEFAULT 2
                     CHECK (max_brokers_per_slot BETWEEN 1 AND 10),
  is_active        BOOLEAN DEFAULT true,
  notes            TEXT,
  created_by       UUID REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_duty_locations_agency ON public.duty_locations(agency_id);
CREATE INDEX IF NOT EXISTS idx_duty_locations_active  ON public.duty_locations(is_active);

-- 1.3 JANELAS DE HORÁRIO (templates de turno por local)
CREATE TABLE IF NOT EXISTS public.duty_time_slots (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id      UUID NOT NULL REFERENCES public.duty_locations(id) ON DELETE CASCADE,
  label            TEXT NOT NULL,          -- ex: "Manhã", "Tarde", "Noite"
  start_time       TIME NOT NULL,
  end_time         TIME NOT NULL,
  day_of_week      INTEGER[],              -- NULL = todos os dias; [1..7] = específicos
  max_brokers      INTEGER NOT NULL DEFAULT 2,
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT now(),
  CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_duty_time_slots_location ON public.duty_time_slots(location_id);

-- 1.4 CICLOS SEMANAIS (abertura/fechamento de seleção)
CREATE TABLE IF NOT EXISTS public.duty_week_cycles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start       DATE NOT NULL,           -- segunda-feira da semana
  week_end         DATE NOT NULL,           -- domingo
  selection_opens  TIMESTAMPTZ NOT NULL,    -- quando abre a seleção
  selection_closes TIMESTAMPTZ NOT NULL,    -- quando fecha
  status           TEXT NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft','open','closed','published')),
  notes            TEXT,
  created_by       UUID REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE (week_start),
  CHECK (week_end > week_start),
  CHECK (selection_closes > selection_opens)
);

CREATE INDEX IF NOT EXISTS idx_duty_week_cycles_status ON public.duty_week_cycles(status);
CREATE INDEX IF NOT EXISTS idx_duty_week_cycles_week   ON public.duty_week_cycles(week_start);

-- 1.5 SCORE DE PRIORIDADE DO CORRETOR
-- Calculado no início de cada ciclo e determina a ordem de escolha
CREATE TABLE IF NOT EXISTS public.broker_priority_scores (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id        UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
  week_cycle_id    UUID NOT NULL REFERENCES public.duty_week_cycles(id) ON DELETE CASCADE,
  score            INTEGER NOT NULL DEFAULT 0,
  selection_order  INTEGER,                 -- posição na fila desta semana
  score_breakdown  JSONB DEFAULT '{}',     -- detalhamento dos critérios
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE (broker_id, week_cycle_id)
);

CREATE INDEX IF NOT EXISTS idx_broker_priority_broker ON public.broker_priority_scores(broker_id);
CREATE INDEX IF NOT EXISTS idx_broker_priority_cycle  ON public.broker_priority_scores(week_cycle_id);
CREATE INDEX IF NOT EXISTS idx_broker_priority_order  ON public.broker_priority_scores(week_cycle_id, selection_order);

-- 1.6 DISPONIBILIDADE DECLARADA PELO CORRETOR
CREATE TABLE IF NOT EXISTS public.duty_availability (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id        UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
  week_cycle_id    UUID NOT NULL REFERENCES public.duty_week_cycles(id) ON DELETE CASCADE,
  available_dates  DATE[] NOT NULL DEFAULT '{}',  -- datas disponíveis na semana
  preferred_shifts TEXT[] DEFAULT '{}',            -- 'manha','tarde','noite'
  preferred_locations UUID[] DEFAULT '{}',         -- duty_location ids preferidos
  notes            TEXT,
  declared_at      TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE (broker_id, week_cycle_id)
);

-- 1.7 ESCALA / RESERVA DE PLANTÃO
-- Tabela central — cada linha é um slot reservado por um corretor
CREATE TABLE IF NOT EXISTS public.duty_schedules (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_cycle_id    UUID NOT NULL REFERENCES public.duty_week_cycles(id) ON DELETE RESTRICT,
  location_id      UUID NOT NULL REFERENCES public.duty_locations(id) ON DELETE RESTRICT,
  time_slot_id     UUID NOT NULL REFERENCES public.duty_time_slots(id) ON DELETE RESTRICT,
  broker_id        UUID NOT NULL REFERENCES public.brokers(id) ON DELETE RESTRICT,
  schedule_date    DATE NOT NULL,
  start_time       TIME NOT NULL,
  end_time         TIME NOT NULL,
  status           TEXT NOT NULL DEFAULT 'confirmed'
                     CHECK (status IN ('confirmed','cancelled','swapped','no_show','completed')),
  booked_at        TIMESTAMPTZ DEFAULT now(),
  booked_by        UUID REFERENCES auth.users(id),
  cancelled_at     TIMESTAMPTZ,
  cancelled_by     UUID REFERENCES auth.users(id),
  cancel_reason    TEXT,
  -- performance metrics (preenchido após o plantão)
  leads_attended   INTEGER DEFAULT 0,
  visits_done      INTEGER DEFAULT 0,
  proposals_made   INTEGER DEFAULT 0,
  sales_closed     INTEGER DEFAULT 0,
  checkin_at       TIMESTAMPTZ,
  checkout_at      TIMESTAMPTZ,
  checkin_lat      DECIMAL(9,6),
  checkin_lng      DECIMAL(9,6),
  checkin_photo_url TEXT,
  checkin_metadata JSONB DEFAULT '{}',   -- hash, device, timestamp autenticado
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  -- Um corretor não pode ter dois plantões sobrepostos no mesmo dia/horário
  UNIQUE (broker_id, schedule_date, start_time, end_time)
);

-- Índices críticos para performance e validação de overbooking
CREATE INDEX IF NOT EXISTS idx_duty_schedules_cycle     ON public.duty_schedules(week_cycle_id);
CREATE INDEX IF NOT EXISTS idx_duty_schedules_location  ON public.duty_schedules(location_id);
CREATE INDEX IF NOT EXISTS idx_duty_schedules_broker    ON public.duty_schedules(broker_id);
CREATE INDEX IF NOT EXISTS idx_duty_schedules_date      ON public.duty_schedules(schedule_date);
CREATE INDEX IF NOT EXISTS idx_duty_schedules_status    ON public.duty_schedules(status);
CREATE INDEX IF NOT EXISTS idx_duty_schedules_slot_date ON public.duty_schedules(location_id, time_slot_id, schedule_date);

-- Função que verifica capacidade do slot antes de inserir/atualizar
CREATE OR REPLACE FUNCTION public.check_duty_slot_capacity()
RETURNS TRIGGER AS $$
DECLARE
  v_max_brokers   INTEGER;
  v_current_count INTEGER;
BEGIN
  -- Só valida inserções e quando não está cancelado
  IF TG_OP = 'DELETE' OR NEW.status IN ('cancelled','swapped') THEN
    RETURN NEW;
  END IF;
  -- Capacidade máxima do local neste slot/data
  SELECT max_brokers INTO v_max_brokers
    FROM public.duty_time_slots
   WHERE id = NEW.time_slot_id;
  IF v_max_brokers IS NULL THEN
    SELECT max_brokers_per_slot INTO v_max_brokers
      FROM public.duty_locations
     WHERE id = NEW.location_id;
  END IF;
  -- Conta reservas ativas no mesmo local/slot/data (excluindo a própria linha em UPDATE)
  SELECT COUNT(*) INTO v_current_count
    FROM public.duty_schedules
   WHERE location_id  = NEW.location_id
     AND time_slot_id = NEW.time_slot_id
     AND schedule_date = NEW.schedule_date
     AND status NOT IN ('cancelled','swapped')
     AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  IF v_current_count >= v_max_brokers THEN
    RAISE EXCEPTION 'SLOT_FULL: Capacidade máxima (%) atingida para este local/horário/data.',
      v_max_brokers;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_duty_slot_capacity ON public.duty_schedules;
CREATE TRIGGER trg_check_duty_slot_capacity
  BEFORE INSERT OR UPDATE ON public.duty_schedules
  FOR EACH ROW EXECUTE FUNCTION public.check_duty_slot_capacity();

-- 1.8 SOLICITAÇÕES DE TROCA DE PLANTÃO
CREATE TABLE IF NOT EXISTS public.duty_swap_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id      UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
  requester_schedule_id UUID NOT NULL REFERENCES public.duty_schedules(id) ON DELETE CASCADE,
  target_broker_id  UUID REFERENCES public.brokers(id) ON DELETE SET NULL,
  target_schedule_id UUID REFERENCES public.duty_schedules(id) ON DELETE SET NULL,
  swap_type         TEXT NOT NULL DEFAULT 'bilateral'
                      CHECK (swap_type IN ('bilateral','offer','emergency')),
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','accepted','rejected','cancelled','approved','expired')),
  reason            TEXT,
  response_notes    TEXT,
  reviewed_by       UUID REFERENCES auth.users(id),
  reviewed_at       TIMESTAMPTZ,
  expires_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_duty_swaps_requester ON public.duty_swap_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_duty_swaps_target    ON public.duty_swap_requests(target_broker_id);
CREATE INDEX IF NOT EXISTS idx_duty_swaps_status    ON public.duty_swap_requests(status);

-- 1.9 LISTA DE ESPERA (waitlist)
CREATE TABLE IF NOT EXISTS public.duty_waitlist (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id      UUID NOT NULL REFERENCES public.duty_locations(id) ON DELETE CASCADE,
  time_slot_id     UUID NOT NULL REFERENCES public.duty_time_slots(id) ON DELETE CASCADE,
  broker_id        UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
  schedule_date    DATE NOT NULL,
  position         INTEGER NOT NULL,
  week_cycle_id    UUID NOT NULL REFERENCES public.duty_week_cycles(id) ON DELETE CASCADE,
  status           TEXT NOT NULL DEFAULT 'waiting'
                     CHECK (status IN ('waiting','promoted','expired','cancelled')),
  created_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE (location_id, time_slot_id, schedule_date, broker_id)
);

-- ══════════════════════════════════════════════════════════════
-- PARTE 2 — GESTÃO DE FROTA
-- ══════════════════════════════════════════════════════════════

-- 2.1 VEÍCULOS
CREATE TABLE IF NOT EXISTS public.fleet_vehicles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate            TEXT NOT NULL UNIQUE,
  brand            TEXT NOT NULL,
  model            TEXT NOT NULL,
  year             INTEGER NOT NULL CHECK (year BETWEEN 1990 AND 2035),
  renavam          TEXT UNIQUE,
  color            TEXT,
  fuel_type        TEXT NOT NULL DEFAULT 'flex'
                     CHECK (fuel_type IN ('flex','gasolina','etanol','diesel','eletrico','hibrido')),
  km_current       INTEGER NOT NULL DEFAULT 0 CHECK (km_current >= 0),
  avg_consumption  DECIMAL(5,2),            -- km/l
  status           TEXT NOT NULL DEFAULT 'disponivel'
                     CHECK (status IN ('disponivel','em_uso','manutencao','bloqueado','sinistrado','reserva')),
  insurance_expiry DATE,
  ipva_expiry      DATE,
  license_expiry   DATE,                   -- validade do licenciamento
  next_revision_km INTEGER,               -- km para próxima revisão
  next_revision_date DATE,
  docs_urls        TEXT[] DEFAULT '{}',    -- uploads de documentos
  photo_urls       TEXT[] DEFAULT '{}',    -- fotos do veículo
  notes            TEXT,
  is_active        BOOLEAN DEFAULT true,
  created_by       UUID REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_status ON public.fleet_vehicles(status);
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_plate  ON public.fleet_vehicles(plate);

-- 2.2 USOS / RETIRADAS
CREATE TABLE IF NOT EXISTS public.fleet_usages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id        UUID NOT NULL REFERENCES public.fleet_vehicles(id) ON DELETE RESTRICT,
  broker_id         UUID NOT NULL REFERENCES public.brokers(id) ON DELETE RESTRICT,
  -- Fluxo: solicitado → aprovado → retirado → devolvido
  status            TEXT NOT NULL DEFAULT 'solicitado'
                      CHECK (status IN ('solicitado','aprovado','retirado','devolvido','cancelado','rejeitado')),
  purpose           TEXT NOT NULL
                      CHECK (purpose IN ('visita_cliente','plantao','captacao','vistoria',
                                         'documentacao','reuniao','marketing','suporte_interno','outro')),
  purpose_description TEXT,               -- detalhes obrigatórios
  destination       TEXT,
  estimated_return  TIMESTAMPTZ,
  -- Retirada
  km_initial        INTEGER CHECK (km_initial >= 0),
  fuel_level_initial TEXT CHECK (fuel_level_initial IN ('vazio','1/4','1/2','3/4','cheio')),
  pickup_at         TIMESTAMPTZ,
  pickup_by         UUID REFERENCES auth.users(id),  -- quem aprovou a retirada
  pickup_photos     TEXT[] DEFAULT '{}',
  pickup_photo_metadata JSONB DEFAULT '{}',   -- hash, device, GPS, timestamp
  pickup_notes      TEXT,
  -- Devolução
  km_final          INTEGER CHECK (km_final >= 0),
  fuel_level_final  TEXT CHECK (fuel_level_final IN ('vazio','1/4','1/2','3/4','cheio')),
  return_at         TIMESTAMPTZ,
  return_photos     TEXT[] DEFAULT '{}',
  return_photo_metadata JSONB DEFAULT '{}',
  return_notes      TEXT,
  -- Cálculos automáticos
  km_driven         INTEGER GENERATED ALWAYS AS (
                      CASE WHEN km_final IS NOT NULL AND km_initial IS NOT NULL
                           THEN km_final - km_initial ELSE NULL END
                    ) STORED,
  -- Aprovação
  approved_by       UUID REFERENCES auth.users(id),
  approved_at       TIMESTAMPTZ,
  rejected_by       UUID REFERENCES auth.users(id),
  rejected_at       TIMESTAMPTZ,
  rejection_reason  TEXT,
  -- Auditoria
  is_suspicious     BOOLEAN DEFAULT false,
  suspicious_reason TEXT,
  flagged_by        UUID REFERENCES auth.users(id),
  flagged_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now(),
  -- KM final deve ser >= KM inicial
  CHECK (km_final IS NULL OR km_initial IS NULL OR km_final >= km_initial)
);

CREATE INDEX IF NOT EXISTS idx_fleet_usages_vehicle ON public.fleet_usages(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fleet_usages_broker  ON public.fleet_usages(broker_id);
CREATE INDEX IF NOT EXISTS idx_fleet_usages_status  ON public.fleet_usages(status);
CREATE INDEX IF NOT EXISTS idx_fleet_usages_created ON public.fleet_usages(created_at);

-- Trigger: impede retirada de veículo que já está em uso
CREATE OR REPLACE FUNCTION public.check_vehicle_available()
RETURNS TRIGGER AS $$
DECLARE
  v_vehicle_status TEXT;
  v_pending_usage  UUID;
BEGIN
  IF NEW.status NOT IN ('solicitado','aprovado','retirado') THEN
    RETURN NEW;
  END IF;

  -- Verifica status do veículo
  SELECT status INTO v_vehicle_status
    FROM public.fleet_vehicles WHERE id = NEW.vehicle_id;

  IF TG_OP = 'INSERT' AND v_vehicle_status NOT IN ('disponivel','reserva') THEN
    RAISE EXCEPTION 'VEHICLE_UNAVAILABLE: Veículo não disponível (status: %)', v_vehicle_status;
  END IF;

  -- Verifica se o corretor já tem uso ativo (retirado sem devolver)
  IF NEW.status = 'retirado' THEN
    SELECT id INTO v_pending_usage
      FROM public.fleet_usages
     WHERE broker_id = NEW.broker_id
       AND status = 'retirado'
       AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
     LIMIT 1;
    IF v_pending_usage IS NOT NULL THEN
      RAISE EXCEPTION 'BROKER_HAS_PENDING: Corretor já possui veículo retirado sem devolução.';
    END IF;

    -- Atualiza km do veículo
    IF NEW.km_initial IS NOT NULL THEN
      UPDATE public.fleet_vehicles
         SET km_current = NEW.km_initial, updated_at = now()
       WHERE id = NEW.vehicle_id;
    END IF;
    -- Muda status do veículo para em_uso
    UPDATE public.fleet_vehicles
       SET status = 'em_uso', updated_at = now()
     WHERE id = NEW.vehicle_id;
  END IF;

  -- Ao devolver, atualiza km e status do veículo
  IF NEW.status = 'devolvido' AND OLD.status = 'retirado' THEN
    IF NEW.km_final IS NOT NULL THEN
      UPDATE public.fleet_vehicles
         SET km_current = NEW.km_final, status = 'disponivel', updated_at = now()
       WHERE id = NEW.vehicle_id;
    ELSE
      UPDATE public.fleet_vehicles
         SET status = 'disponivel', updated_at = now()
       WHERE id = NEW.vehicle_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_vehicle_available ON public.fleet_usages;
CREATE TRIGGER trg_check_vehicle_available
  BEFORE INSERT OR UPDATE ON public.fleet_usages
  FOR EACH ROW EXECUTE FUNCTION public.check_vehicle_available();

-- 2.3 ABASTECIMENTOS
CREATE TABLE IF NOT EXISTS public.fleet_fuelings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usage_id         UUID NOT NULL REFERENCES public.fleet_usages(id) ON DELETE RESTRICT,
  vehicle_id       UUID NOT NULL REFERENCES public.fleet_vehicles(id) ON DELETE RESTRICT,
  broker_id        UUID NOT NULL REFERENCES public.brokers(id) ON DELETE RESTRICT,
  fuel_type        TEXT NOT NULL,
  liters           DECIMAL(8,2) NOT NULL CHECK (liters > 0),
  price_per_liter  DECIMAL(8,3) NOT NULL CHECK (price_per_liter > 0),
  total_cost       DECIMAL(10,2) GENERATED ALWAYS AS (liters * price_per_liter) STORED,
  gas_station      TEXT,
  km_at_fueling    INTEGER CHECK (km_at_fueling >= 0),
  receipt_url      TEXT,
  receipt_photo_metadata JSONB DEFAULT '{}',
  notes            TEXT,
  fueled_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fleet_fuelings_usage   ON public.fleet_fuelings(usage_id);
CREATE INDEX IF NOT EXISTS idx_fleet_fuelings_vehicle ON public.fleet_fuelings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fleet_fuelings_broker  ON public.fleet_fuelings(broker_id);

-- 2.4 MANUTENÇÕES
CREATE TABLE IF NOT EXISTS public.fleet_maintenances (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id       UUID NOT NULL REFERENCES public.fleet_vehicles(id) ON DELETE RESTRICT,
  maintenance_type TEXT NOT NULL CHECK (maintenance_type IN ('preventiva','corretiva','revisao','pneu','freio','outros')),
  description      TEXT NOT NULL,
  cost             DECIMAL(10,2) CHECK (cost >= 0),
  km_at_maintenance INTEGER,
  service_center   TEXT,
  invoice_url      TEXT,
  status           TEXT NOT NULL DEFAULT 'pendente'
                     CHECK (status IN ('pendente','em_andamento','concluida','cancelada')),
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  next_maintenance_km   INTEGER,
  next_maintenance_date DATE,
  created_by       UUID REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fleet_maintenance_vehicle ON public.fleet_maintenances(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fleet_maintenance_status  ON public.fleet_maintenances(status);

-- ══════════════════════════════════════════════════════════════
-- RLS POLICIES
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.partner_agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duty_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duty_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duty_week_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_priority_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duty_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duty_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duty_swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duty_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_fuelings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_maintenances ENABLE ROW LEVEL SECURITY;

-- Autenticados podem ler locais/agências/slots (info pública interna)
CREATE POLICY "duty_locations_read_all" ON public.duty_locations
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "duty_locations_write_admin" ON public.duty_locations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','owner','broker_manager'))
  );

CREATE POLICY "partner_agencies_read_all" ON public.partner_agencies
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "partner_agencies_write_admin" ON public.partner_agencies
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','owner','broker_manager'))
  );

CREATE POLICY "duty_time_slots_read_all" ON public.duty_time_slots
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "duty_time_slots_write_admin" ON public.duty_time_slots
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','owner','broker_manager'))
  );

CREATE POLICY "duty_week_cycles_read_all" ON public.duty_week_cycles
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "duty_week_cycles_write_admin" ON public.duty_week_cycles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','owner','broker_manager'))
  );

-- Scores: próprio broker ou admin
CREATE POLICY "broker_priority_read" ON public.broker_priority_scores
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      EXISTS (SELECT 1 FROM public.brokers WHERE id = broker_id AND user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','owner','broker_manager'))
    )
  );
CREATE POLICY "broker_priority_write_admin" ON public.broker_priority_scores
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','owner','broker_manager'))
  );

-- Disponibilidade: próprio broker ou admin
CREATE POLICY "duty_availability_own" ON public.duty_availability
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.brokers WHERE id = broker_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','owner','broker_manager'))
  );

-- Escala: todos autenticados podem ler (calendário público interno); escrita somente pelo próprio ou admin
CREATE POLICY "duty_schedules_read_all" ON public.duty_schedules
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "duty_schedules_write_own" ON public.duty_schedules
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.brokers WHERE id = broker_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','owner','broker_manager'))
  );
CREATE POLICY "duty_schedules_update_own" ON public.duty_schedules
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.brokers WHERE id = broker_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','owner','broker_manager'))
  );

-- Trocas: envolvidos + admin
CREATE POLICY "duty_swaps_access" ON public.duty_swap_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.brokers WHERE id = requester_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.brokers WHERE id = target_broker_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','owner','broker_manager'))
  );

-- Waitlist
CREATE POLICY "duty_waitlist_read_all" ON public.duty_waitlist
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "duty_waitlist_write_own" ON public.duty_waitlist
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.brokers WHERE id = broker_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','owner','broker_manager'))
  );

-- Frota: veículos — todos leem; admin escreve
CREATE POLICY "fleet_vehicles_read" ON public.fleet_vehicles
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "fleet_vehicles_write_admin" ON public.fleet_vehicles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','owner','broker_manager'))
  );

-- Usos: próprio broker ou admin/gestor
CREATE POLICY "fleet_usages_own_read" ON public.fleet_usages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.brokers WHERE id = broker_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','owner','broker_manager'))
  );
CREATE POLICY "fleet_usages_own_write" ON public.fleet_usages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.brokers WHERE id = broker_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','owner','broker_manager'))
  );
CREATE POLICY "fleet_usages_own_update" ON public.fleet_usages
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.brokers WHERE id = broker_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','owner','broker_manager'))
  );

-- Abastecimentos: próprio broker ou admin
CREATE POLICY "fleet_fuelings_own" ON public.fleet_fuelings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.brokers WHERE id = broker_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','owner','broker_manager'))
  );

-- Manutenções: admin/gestor
CREATE POLICY "fleet_maintenances_admin" ON public.fleet_maintenances
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','owner','broker_manager'))
  );
CREATE POLICY "fleet_maintenances_read" ON public.fleet_maintenances
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ══════════════════════════════════════════════════════════════
-- TRIGGERS updated_at
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'partner_agencies','duty_locations','duty_week_cycles',
    'broker_priority_scores','duty_availability','duty_schedules',
    'duty_swap_requests','fleet_vehicles','fleet_usages','fleet_maintenances'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%1$s_updated_at ON public.%1$s;
       CREATE TRIGGER trg_%1$s_updated_at
         BEFORE UPDATE ON public.%1$s
         FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();',
      t
    );
  END LOOP;
END $$;

-- ══════════════════════════════════════════════════════════════
-- SEED DATA
-- ══════════════════════════════════════════════════════════════

-- Mano Imóveis como imobiliária parceira
INSERT INTO public.partner_agencies (
  name, cnpj, address, city, state, agency_type,
  max_brokers_per_slot, working_hours_start, working_hours_end,
  is_active, notes
) VALUES (
  'Mano Imóveis',
  NULL,
  'Recife, PE',
  'Recife', 'PE',
  'parceira',
  4,
  '08:00', '20:00',
  true,
  'Imobiliária parceira principal. Gestores: Mateus (Médio/Alto Padrão) e Arcanjo (Loteamento).'
)
ON CONFLICT DO NOTHING;

-- Locais de plantão
WITH agency AS (
  SELECT id FROM public.partner_agencies WHERE name = 'Mano Imóveis' LIMIT 1
)
INSERT INTO public.duty_locations (name, location_type, agency_id, city, state, max_brokers_per_slot, is_active, notes)
SELECT name, location_type, agency.id, 'Recife', 'PE', max_brokers, true, notes
FROM agency, (VALUES
  ('Mano Imóveis', 'imobiliaria', 4, 'Sede da Mano Imóveis — até 4 corretores por turno'),
  ('Miguel Marques', 'loteamento', 2, 'Loteamento Miguel Marques — máximo 2 corretores por turno'),
  ('Alto Bellevue', 'condominio', 2, 'Lote em condomínio Alto Bellevue — máximo 2 corretores por turno')
) AS v(name, location_type, max_brokers, notes)
ON CONFLICT DO NOTHING;

-- Turnos por local (manhã, tarde, noite)
INSERT INTO public.duty_time_slots (location_id, label, start_time, end_time, max_brokers, is_active)
SELECT
  dl.id,
  slot.label,
  slot.start_time::TIME,
  slot.end_time::TIME,
  dl.max_brokers_per_slot,
  true
FROM public.duty_locations dl
CROSS JOIN (VALUES
  ('Manhã', '08:00', '12:00'),
  ('Tarde', '12:00', '16:00'),
  ('Noite', '16:00', '20:00')
) AS slot(label, start_time, end_time)
WHERE dl.name IN ('Mano Imóveis','Miguel Marques','Alto Bellevue')
ON CONFLICT DO NOTHING;

-- Gestores de equipe: Mateus e Arcanjo
-- Serão inseridos/atualizados como broker_manager na tabela brokers
-- (matching por email quando o usuário existir)
-- Nota: o vínculo completo ao auth.users ocorre via painel de usuários

-- Seed inicial de ciclo semanal corrente para uso imediato
INSERT INTO public.duty_week_cycles (
  week_start, week_end,
  selection_opens, selection_closes,
  status
)
SELECT
  date_trunc('week', CURRENT_DATE)::date,
  (date_trunc('week', CURRENT_DATE) + interval '6 days')::date,
  date_trunc('week', CURRENT_DATE)::date + interval '0 hours',
  date_trunc('week', CURRENT_DATE)::date + interval '1 days' + interval '12 hours',
  'open'
WHERE NOT EXISTS (
  SELECT 1 FROM public.duty_week_cycles
  WHERE week_start = date_trunc('week', CURRENT_DATE)::date
);
