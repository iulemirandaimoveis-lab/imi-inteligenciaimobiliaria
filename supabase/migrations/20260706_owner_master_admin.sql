-- 20260706_owner_master_admin.sql
--
-- BUG FIX (backoffice + console /users):
--   1. "Usuários não abre no backoffice" — a página /backoffice/settings/usuarios
--      só permite ADMIN/SUPER_ADMIN/OWNER. O dono estava logado numa conta cujo
--      profiles.role era "broker", então era redirecionado silenciosamente.
--   2. "Não mostra mais minha foto no perfil" — a foto do dono ficou presa numa
--      única conta; nas demais o avatar_url estava nulo em profiles/imi.users.
--
-- CAUSA-RAIZ: existem DUAS contas do dono (iule@imi.com e
-- iule.miranda@iulemirandaimoveis.com.br) e o admin máster não estava completo em
-- NENHUM dos dois sistemas ao mesmo tempo:
--   - Backoffice usa public.profiles.role
--   - Console /users usa o schema imi (imi.users.is_super + imi.user_roles)
-- iule@imi.com era admin no backoffice mas NÃO tinha sequer linha em imi.users
-- (sessão do console resolvia para null → loop de login).
--
-- Esta migration consolida iule@imi.com como ADMINISTRADOR MÁSTER dos DOIS
-- sistemas e propaga a foto existente. É IDEMPOTENTE: pode rodar várias vezes.
-- Nenhuma outra conta é rebaixada.

do $$
declare
  v_auth_id       uuid;
  v_photo         text;
  v_imi_user_id   uuid;
  v_super_role_id uuid;
begin
  -- 1. Resolve a conta pelo e-mail. Se não existir, encerra sem efeito.
  select id into v_auth_id from auth.users where lower(email) = 'iule@imi.com' limit 1;
  if v_auth_id is null then
    raise notice '[owner_master_admin] iule@imi.com ausente em auth.users — nada a fazer.';
    return;
  end if;

  -- Foto canônica do dono (fonte: brokers; cai para profiles/metadata se preciso).
  select coalesce(
           (select avatar_url from public.brokers  where user_id = v_auth_id and avatar_url is not null limit 1),
           (select avatar_url from public.profiles where id = v_auth_id and avatar_url is not null limit 1),
           (select raw_user_meta_data->>'avatar_url' from auth.users where id = v_auth_id)
         )
    into v_photo;

  -- 2. BACKOFFICE — garante admin + foto + ativo em public.profiles.
  update public.profiles
     set role       = 'admin',
         avatar_url = coalesce(avatar_url, v_photo),
         is_active  = true,
         updated_at = now()
   where id = v_auth_id;

  -- 3. CONSOLE /users (schema imi) — garante imi.users super admin + foto.
  select id into v_imi_user_id from imi.users where auth_user_id = v_auth_id;
  if v_imi_user_id is null then
    insert into imi.users (auth_user_id, email, full_name, avatar_url, status, is_super)
    values (v_auth_id, 'iule@imi.com', 'Iule Miranda', v_photo, 'active', true)
    returning id into v_imi_user_id;
  else
    update imi.users
       set is_super   = true,
           status     = 'active',
           avatar_url = coalesce(avatar_url, v_photo),
           updated_at = now()
     where id = v_imi_user_id;
  end if;

  -- 4. Atribui o papel SUPER_ADMIN (além do is_super) p/ consistência da UI de RBAC.
  select id into v_super_role_id from imi.roles where key = 'SUPER_ADMIN';
  if v_super_role_id is not null and not exists (
    select 1 from imi.user_roles
     where user_id = v_imi_user_id and role_id = v_super_role_id
  ) then
    insert into imi.user_roles (user_id, role_id) values (v_imi_user_id, v_super_role_id);
  end if;

  raise notice '[owner_master_admin] iule@imi.com consolidado como admin máster (backoffice + console).';
end $$;
