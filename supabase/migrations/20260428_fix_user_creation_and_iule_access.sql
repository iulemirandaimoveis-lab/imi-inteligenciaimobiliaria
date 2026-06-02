-- =====================================================
-- IMI — Fix user creation + owner access bootstrap
-- Date: 2026-04-28
-- =====================================================

-- 1) Prevent "Database error creating new user" from trigger failures
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_raw_role TEXT;
  v_role TEXT;
BEGIN
  v_raw_role := lower(coalesce(NEW.raw_user_meta_data->>'role', ''));
  v_role := CASE
    WHEN v_raw_role IN ('admin', 'super_admin', 'owner') THEN 'admin'
    WHEN v_raw_role IN ('manager', 'gestor', 'broker_manager') THEN 'broker_manager'
    ELSE 'broker'
  END;

  BEGIN
    INSERT INTO public.profiles (id, name, email, role, is_active)
    VALUES (
      NEW.id,
      COALESCE(
        NULLIF(NEW.raw_user_meta_data->>'name', ''),
        NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
        split_part(NEW.email, '@', 1)
      ),
      lower(NEW.email),
      v_role,
      true
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = COALESCE(NULLIF(public.profiles.name, ''), EXCLUDED.name),
      role = COALESCE(NULLIF(public.profiles.role, ''), EXCLUDED.role),
      is_active = true,
      updated_at = now();
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed for %: %', NEW.email, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 2) Ensure owner-level access for iule@imi.com across teams/metrics
DO $$
DECLARE
  v_user_id UUID;
  v_now TIMESTAMPTZ := now();
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE lower(email) = 'iule@imi.com'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário iule@imi.com não encontrado em auth.users';
  END IF;

  INSERT INTO public.profiles (id, name, email, role, is_active, updated_at)
  VALUES (v_user_id, 'Iule Miranda', 'iule@imi.com', 'owner', true, v_now)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = 'owner',
    is_active = true,
    updated_at = v_now;

  UPDATE public.brokers
  SET
    user_id = v_user_id,
    name = 'Iule Miranda',
    email = 'iule@imi.com',
    role = 'broker_manager',
    status = 'active',
    permissions = ARRAY[
      'dashboard','imoveis','leads','agenda','avaliacoes','financeiro','contratos',
      'settings','equipe','organizacao','relatorios'
    ],
    updated_at = v_now
  WHERE lower(email) = 'iule@imi.com' OR user_id = v_user_id;

  IF NOT EXISTS (
    SELECT 1 FROM public.brokers b WHERE b.user_id = v_user_id OR lower(b.email) = 'iule@imi.com'
  ) THEN
    INSERT INTO public.brokers (
      user_id, name, email, role, status, permissions, created_at, updated_at
    ) VALUES (
      v_user_id,
      'Iule Miranda',
      'iule@imi.com',
      'broker_manager',
      'active',
      ARRAY[
        'dashboard','imoveis','leads','agenda','avaliacoes','financeiro','contratos',
        'settings','equipe','organizacao','relatorios'
      ],
      v_now,
      v_now
    );
  END IF;

  UPDATE auth.users
  SET raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
    'name', 'Iule Miranda',
    'role', 'owner'
  )
  WHERE id = v_user_id;
END;
$$;
