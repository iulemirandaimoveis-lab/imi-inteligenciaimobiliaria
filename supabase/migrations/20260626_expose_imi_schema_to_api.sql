-- ============================================================================
-- EXPOSE `imi` SCHEMA TO THE POSTGREST DATA API
-- Date: 2026-06-26
-- ----------------------------------------------------------------------------
-- Root cause of the /users console outage (ERR_TOO_MANY_REDIRECTS on
-- /users/dashboard):
--
--   The IMI auth ecosystem lives in an isolated `imi` schema. The app reads it
--   through supabase-js using `.schema('imi')`, which goes through PostgREST.
--   By default a Supabase project only exposes `public` and `graphql_public`,
--   so every `.schema('imi')` call failed with PGRST106
--   ("The schema must be one of the following: ..."). getImiSession() therefore
--   returned null for EVERY user, which bounced /users/dashboard → /users/login
--   while the auth cookie bounced /users/login → /users/dashboard: an infinite
--   redirect loop.
--
-- This migration adds `imi` to the PostgREST exposed-schema list. It mirrors
-- the Dashboard setting at: Project Settings → API → "Exposed schemas".
--
-- NOTE: this preserves the standard defaults (`public`, `graphql_public`). If
-- other custom schemas were already exposed via the Dashboard, add them here
-- too, since ALTER ROLE replaces the whole value.
--
-- Idempotent: safe to run multiple times.
-- ============================================================================

ALTER ROLE authenticator SET pgrst.db_schemas = 'public, graphql_public, imi';

-- Ask PostgREST to reload its config + schema cache so the change takes effect
-- without waiting for a connection recycle.
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';
