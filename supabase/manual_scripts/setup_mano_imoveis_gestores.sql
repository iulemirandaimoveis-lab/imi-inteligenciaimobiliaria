-- ============================================================
-- IMI — Setup Mano Imóveis + Gestores (Mateus e Arcanjo)
-- Execute este script no Supabase SQL Editor após a migration
-- principal 20260516_duty_roster_fleet.sql
-- ============================================================

-- 1. Confirma que Mano Imóveis está cadastrada
SELECT id, name, agency_type, max_brokers_per_slot
FROM public.partner_agencies
WHERE name = 'Mano Imóveis';

-- 2. Confirma locais de plantão
SELECT dl.name, dl.location_type, dl.max_brokers_per_slot, pa.name AS agency
FROM public.duty_locations dl
LEFT JOIN public.partner_agencies pa ON pa.id = dl.agency_id;

-- 3. Confirma turnos criados
SELECT dts.label, dts.start_time, dts.end_time, dts.max_brokers, dl.name AS location
FROM public.duty_time_slots dts
JOIN public.duty_locations dl ON dl.id = dts.location_id
ORDER BY dl.name, dts.start_time;

-- ============================================================
-- GESTORES: Mateus (Médio/Alto Padrão) e Arcanjo (Loteamento)
-- Substitua os UUIDs pelos IDs reais dos usuários no auth.users
-- ============================================================

-- Para descobrir os IDs reais, execute primeiro:
-- SELECT id, email, raw_user_meta_data->>'name' AS name FROM auth.users ORDER BY created_at DESC;

-- Depois ajuste e execute o bloco abaixo:
DO $$
DECLARE
  v_mateus_user_id   UUID;  -- Cole aqui o UUID do Mateus
  v_arcanjo_user_id  UUID;  -- Cole aqui o UUID do Arcanjo
  v_agency_id        UUID;
  v_mateus_broker_id UUID;
  v_arcanjo_broker_id UUID;
BEGIN
  -- Busca IDs por email (ajuste os emails conforme cadastrado)
  SELECT id INTO v_mateus_user_id FROM auth.users
  WHERE lower(email) LIKE '%mateus%' LIMIT 1;

  SELECT id INTO v_arcanjo_user_id FROM auth.users
  WHERE lower(email) LIKE '%arcanjo%' OR lower(raw_user_meta_data->>'name') LIKE '%arcanjo%' LIMIT 1;

  SELECT id INTO v_agency_id FROM public.partner_agencies WHERE name = 'Mano Imóveis' LIMIT 1;

  IF v_mateus_user_id IS NULL THEN
    RAISE NOTICE 'Mateus não encontrado em auth.users. Verifique o email.';
  ELSE
    -- Atualiza profile para broker_manager
    UPDATE public.profiles
    SET role = 'broker_manager', is_active = true, updated_at = now()
    WHERE id = v_mateus_user_id;

    -- Insere ou atualiza broker
    INSERT INTO public.brokers (user_id, name, email, role, status, permissions)
    SELECT
      v_mateus_user_id,
      COALESCE(p.name, 'Mateus'),
      p.email,
      'broker_manager',
      'active',
      ARRAY['dashboard','plantao','frota','relatorios','equipe']
    FROM public.profiles p WHERE p.id = v_mateus_user_id
    ON CONFLICT (email) DO UPDATE SET
      role = 'broker_manager',
      status = 'active',
      permissions = ARRAY['dashboard','plantao','frota','relatorios','equipe'],
      updated_at = now();

    SELECT id INTO v_mateus_broker_id FROM public.brokers WHERE user_id = v_mateus_user_id;

    RAISE NOTICE 'Mateus configurado como gestor. Broker ID: %', v_mateus_broker_id;
  END IF;

  IF v_arcanjo_user_id IS NULL THEN
    RAISE NOTICE 'Arcanjo não encontrado em auth.users. Verifique o email.';
  ELSE
    -- Atualiza profile para broker_manager
    UPDATE public.profiles
    SET role = 'broker_manager', is_active = true, updated_at = now()
    WHERE id = v_arcanjo_user_id;

    -- Insere ou atualiza broker
    INSERT INTO public.brokers (user_id, name, email, role, status, permissions)
    SELECT
      v_arcanjo_user_id,
      COALESCE(p.name, 'Arcanjo'),
      p.email,
      'broker_manager',
      'active',
      ARRAY['dashboard','plantao','frota','relatorios','equipe']
    FROM public.profiles p WHERE p.id = v_arcanjo_user_id
    ON CONFLICT (email) DO UPDATE SET
      role = 'broker_manager',
      status = 'active',
      permissions = ARRAY['dashboard','plantao','frota','relatorios','equipe'],
      updated_at = now();

    SELECT id INTO v_arcanjo_broker_id FROM public.brokers WHERE user_id = v_arcanjo_user_id;

    RAISE NOTICE 'Arcanjo configurado como gestor. Broker ID: %', v_arcanjo_broker_id;
  END IF;
END $$;

-- ============================================================
-- Vinculação dos gestores à imobiliária parceira
-- (Adiciona informação na tabela partner_agencies via duty_rules)
-- ============================================================
UPDATE public.partner_agencies
SET duty_rules = jsonb_build_object(
  'gestores', jsonb_build_array(
    jsonb_build_object('nome', 'Mateus', 'segmento', 'Médio e Alto Padrão', 'role', 'broker_manager'),
    jsonb_build_object('nome', 'Arcanjo', 'segmento', 'Loteamento', 'role', 'broker_manager')
  ),
  'ciclo_abertura', 'segunda-feira 08:00',
  'max_cancelamentos_semana', 2,
  'prazo_cancelamento_horas', 24
),
updated_at = now()
WHERE name = 'Mano Imóveis';

-- ============================================================
-- Verificação final
-- ============================================================
SELECT
  pa.name AS imobiliaria,
  pa.agency_type,
  pa.max_brokers_per_slot,
  pa.duty_rules->'gestores' AS gestores,
  (SELECT COUNT(*) FROM public.duty_locations WHERE agency_id = pa.id) AS locais_plantao,
  (SELECT COUNT(*) FROM public.duty_time_slots dts
   JOIN public.duty_locations dl ON dl.id = dts.location_id
   WHERE dl.agency_id = pa.id) AS turnos_configurados
FROM public.partner_agencies pa
WHERE name = 'Mano Imóveis';
