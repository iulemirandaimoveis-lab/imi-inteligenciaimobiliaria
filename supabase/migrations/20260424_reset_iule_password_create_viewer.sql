-- =====================================================
-- IMI — Redefinição de senha iule@imi.com + Criação de viewer
-- Data: 2026-04-24
-- Operações:
--   1. Atualizar senha de iule@imi.com → Imi@2026@
--   2. Encerrar todas as sessões ativas de iule@imi.com
--   3. Criar usuário teste@imi.com (senha: abc123, role: viewer)
--
-- Hashes gerados com bcryptjs (cost=10):
--   'Imi@2026@' → $2a$10$e.Vz3UbKvmQRbk7g0AnO3.tEJLF7U5N/Fl.Erm7SzihiGhA9frk5e
--   'abc123'   → $2a$10$9st19O5RVqD.bIEDeZXfHeCS/APJ.pjyvDzTX/NxOU1Yf/KBoTi.e
-- =====================================================


-- ── 1. REDEFINIR SENHA DE iule@imi.com ─────────────────────────────
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'iule@imi.com';

    IF v_user_id IS NULL THEN
        RAISE WARNING '[IMI] Usuário iule@imi.com não encontrado — nenhuma alteração feita.';
    ELSE
        -- Atualiza a senha com bcrypt de 'Imi@2026@'
        UPDATE auth.users SET
            encrypted_password = '$2a$10$e.Vz3UbKvmQRbk7g0AnO3.tEJLF7U5N/Fl.Erm7SzihiGhA9frk5e',
            updated_at = now()
        WHERE id = v_user_id;

        -- Encerra todas as sessões ativas (força novo login)
        DELETE FROM auth.sessions       WHERE user_id = v_user_id;
        DELETE FROM auth.refresh_tokens WHERE user_id = v_user_id;

        -- Garante que o perfil não exige reset de senha
        UPDATE public.profiles SET
            must_reset_password = false,
            updated_at = now()
        WHERE id = v_user_id;

        RAISE NOTICE '[IMI] iule@imi.com: senha atualizada e sessões encerradas (ID: %).', v_user_id;
    END IF;
END $$;


-- ── 2. CRIAR / GARANTIR USUÁRIO teste@imi.com (VIEWER) ─────────────
DO $$
DECLARE
    v_instance_id  UUID;
    v_new_user_id  UUID := gen_random_uuid();
    v_existing_id  UUID;
BEGIN
    SELECT id INTO v_existing_id
    FROM auth.users
    WHERE email = 'teste@imi.com';

    IF v_existing_id IS NOT NULL THEN
        -- Usuário já existe: resetar senha e garantir role viewer
        UPDATE auth.users SET
            encrypted_password  = '$2a$10$9st19O5RVqD.bIEDeZXfHeCS/APJ.pjyvDzTX/NxOU1Yf/KBoTi.e',
            raw_user_meta_data  = raw_user_meta_data || '{"role": "viewer"}'::jsonb,
            email_confirmed_at  = COALESCE(email_confirmed_at, now()),
            updated_at          = now()
        WHERE id = v_existing_id;

        UPDATE public.profiles SET
            role       = 'viewer',
            is_active  = true,
            updated_at = now()
        WHERE id = v_existing_id;

        RAISE NOTICE '[IMI] teste@imi.com já existia — senha e role viewer confirmados (ID: %).', v_existing_id;

    ELSE
        -- Obter instance_id a partir de um usuário existente
        SELECT instance_id INTO v_instance_id FROM auth.users LIMIT 1;

        -- Criar novo usuário no GoTrue
        INSERT INTO auth.users (
            id,
            instance_id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_sso_user,
            created_at,
            updated_at
        ) VALUES (
            v_new_user_id,
            v_instance_id,
            'authenticated',
            'authenticated',
            'teste@imi.com',
            '$2a$10$9st19O5RVqD.bIEDeZXfHeCS/APJ.pjyvDzTX/NxOU1Yf/KBoTi.e',
            now(),
            '{"provider": "email", "providers": ["email"]}'::jsonb,
            '{"name": "Usuário Teste", "role": "viewer"}'::jsonb,
            false,
            now(),
            now()
        );

        -- Criar perfil explícito (o trigger handle_new_user também executará,
        -- mas o ON CONFLICT garante os valores corretos mesmo se o trigger rodar primeiro)
        INSERT INTO public.profiles (id, name, email, role, is_active, must_reset_password)
        VALUES (v_new_user_id, 'Usuário Teste', 'teste@imi.com', 'viewer', true, false)
        ON CONFLICT (id) DO UPDATE SET
            role                = 'viewer',
            is_active           = true,
            must_reset_password = false,
            updated_at          = now();

        RAISE NOTICE '[IMI] teste@imi.com criado com role viewer (ID: %).', v_new_user_id;
    END IF;
END $$;
