-- ============================================================
-- IMI — Redefinição de senha iule@imi.com + Criação de viewer
-- Data: 2026-04-24
--
-- Hashes bcryptjs (cost=10):
--   'Imi@2026@' → $2a$10$e.Vz3UbKvmQRbk7g0AnO3.tEJLF7U5N/Fl.Erm7SzihiGhA9frk5e
--   'abc123'   → $2a$10$9st19O5RVqD.bIEDeZXfHeCS/APJ.pjyvDzTX/NxOU1Yf/KBoTi.e
-- ============================================================


-- ── 1. NOVA SENHA: iule@imi.com → Imi@2026@ ───────────────────────

UPDATE auth.users
SET
    encrypted_password = '$2a$10$e.Vz3UbKvmQRbk7g0AnO3.tEJLF7U5N/Fl.Erm7SzihiGhA9frk5e',
    updated_at         = now()
WHERE email = 'iule@imi.com';

-- Encerra sessões ativas (força novo login)
DELETE FROM auth.sessions
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'iule@imi.com');

-- Encerra refresh tokens (user_id é varchar nesta tabela)
DELETE FROM auth.refresh_tokens
WHERE user_id = (SELECT id::text FROM auth.users WHERE email = 'iule@imi.com');

-- Limpa flag de reset no perfil
UPDATE public.profiles
SET
    must_reset_password = false,
    updated_at          = now()
WHERE id = (SELECT id FROM auth.users WHERE email = 'iule@imi.com');


-- ── 2. USUÁRIO VIEWER: teste@imi.com → abc123 ─────────────────────

-- Se já existe: atualiza senha e garante role viewer
UPDATE auth.users
SET
    encrypted_password = '$2a$10$9st19O5RVqD.bIEDeZXfHeCS/APJ.pjyvDzTX/NxOU1Yf/KBoTi.e',
    raw_user_meta_data = raw_user_meta_data || '{"role": "viewer"}'::jsonb,
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at         = now()
WHERE email = 'teste@imi.com';

-- Se não existe: cria o usuário
INSERT INTO auth.users (
    id, instance_id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    is_sso_user, created_at, updated_at
)
SELECT
    gen_random_uuid(),
    (SELECT instance_id FROM auth.users LIMIT 1),
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
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'teste@imi.com');

-- Cria/garante perfil viewer para teste@imi.com
INSERT INTO public.profiles (id, name, email, role, is_active, must_reset_password)
SELECT id, 'Usuário Teste', 'teste@imi.com', 'viewer', true, false
FROM auth.users
WHERE email = 'teste@imi.com'
ON CONFLICT (id) DO UPDATE SET
    role                = 'viewer',
    is_active           = true,
    must_reset_password = false,
    updated_at          = now();
