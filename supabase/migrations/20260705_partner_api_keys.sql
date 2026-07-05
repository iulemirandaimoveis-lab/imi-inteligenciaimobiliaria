-- Partner API v1 (D-15): chaves de API de parceiros B2B
-- A chave completa (imi_pk_...) NUNCA é armazenada — apenas o hash SHA-256.
-- Acesso à tabela é exclusivamente via service_role após validação server-side
-- (mesmo contrato de P15/D-11): RLS habilitada e SEM policies para anon/authenticated.

CREATE TABLE IF NOT EXISTS public.partner_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_name TEXT NOT NULL,
  -- SHA-256 (hex) da chave completa; lookup por igualdade indexada
  key_hash TEXT NOT NULL UNIQUE,
  -- Prefixo exibível para identificação em logs/suporte (ex.: imi_pk_a1b2c3d4), nunca a chave
  key_prefix TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_partner_api_keys_active_hash
  ON public.partner_api_keys (key_hash)
  WHERE active AND revoked_at IS NULL;

ALTER TABLE public.partner_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_api_keys FORCE ROW LEVEL SECURITY;
-- Sem policies por design: nenhum acesso anon/authenticated; somente service_role.
