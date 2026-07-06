# 2026-07-06 · Backoffice: "Usuários não abre" + foto de perfil sumida

## Sintomas reportados (dono)
1. **Usuários não abre no backoffice** — clicar em Configurações → Usuários redireciona de volta.
2. **Não mostra mais minha foto no perfil** — avatar aparece como inicial "I".

## Diagnóstico (causa-raiz = dados, não código)
As páginas `/backoffice/settings/usuarios` e `/backoffice/hoje` não mudaram desde junho (#308) —
não houve regressão de código. A causa é **duplicidade de contas + admin máster incompleto**:

O dono tem **duas** contas:

| Conta | Backoffice (`profiles.role`) | Console `/users` (`imi.users`) |
|---|---|---|
| `iule@imi.com` | **admin** ✅ + foto | **sem linha em `imi.users`** ❌ |
| `iule.miranda@iulemirandaimoveis.com.br` | broker ❌ | SUPER_ADMIN ✅ (sem foto) |

Os dois sistemas gateiam admin de formas independentes:
- **Backoffice**: `public.profiles.role ∈ {ADMIN, SUPER_ADMIN, OWNER}` (guard em `usuarios/page.tsx`).
- **Console `/users`**: schema `imi` — `imi.users.is_super` / `imi.user_roles` (`getImiSession`).

O dono estava logado na conta **profissional** (role `broker`), então o guard da página Usuários
o redirecionava; e a foto vivia só na conta antiga (`avatar_url` nulo nas demais).

## Decisão do dono
Manter **`iule@imi.com` como administrador máster de todos os sistemas** (backoffice + users) e
**copiar a foto atual**.

## Correção aplicada
Migration idempotente **`supabase/migrations/20260706_owner_master_admin.sql`** (aplicada em
produção via Supabase MCP):
1. `public.profiles`: `iule@imi.com` → `role=admin`, `is_active=true`, foto preenchida.
2. `imi.users`: cria linha para `iule@imi.com` com `is_super=true`, `status=active`, foto.
3. `imi.user_roles`: atribui papel `SUPER_ADMIN`.
4. Foto existente (2,6 MB JPEG, bucket público `avatars`) copiada também para a conta profissional
   (`profiles` + `brokers` + `imi.users`) — assim aparece em qualquer uma das contas.

Nenhuma conta foi rebaixada. A migration é segura para rodar novamente (tudo com `coalesce`/guards).

## Verificação
```
iule@imi.com → backoffice_role=admin, bo_has_photo=true,
               console_is_super=true, console_status=active,
               console_roles={SUPER_ADMIN}, console_has_photo=true
```
Foto: objeto `avatars/6a51365d-...jpg` = image/jpeg, 2.656.610 bytes, bucket público (`avatars_public_read`).

## Como o dono deve proceder
Fazer login com **`iule@imi.com`**. A página Usuários abre e a foto aparece em backoffice e console.

## Arquivos
- `supabase/migrations/20260706_owner_master_admin.sql` (novo)
- `.memory/FAILURES.md` (FX-11)
- `.memory/PROJECT_STATE.md` (trabalho recente)
