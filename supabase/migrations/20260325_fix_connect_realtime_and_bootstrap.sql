-- ═══════════════════════════════════════════════════════════════════
-- IMI Connect — Fix Realtime + Bootstrap Channels
-- IMI Inteligência Imobiliária · 2026-03-25
-- ═══════════════════════════════════════════════════════════════════
-- This migration:
-- 1. Adds chat tables to the Supabase Realtime publication so that
--    postgres_changes subscriptions work in the Connect feature.
-- 2. Creates a trigger that auto-bootstraps users into default team
--    channels when they sign up or log in for the first time.
-- 3. Creates a helper function to add ALL existing users to default
--    team channels (run once after applying this migration).
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. Enable Realtime for chat tables ──────────────────────────────
-- Supabase uses the 'supabase_realtime' publication for real-time.
-- chat_messages INSERT events drive the live chat in Connect.
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_channels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_members;

-- ── 2. Ensure chat_channels has partnership_id (may have been missed) ──
ALTER TABLE public.chat_channels ADD COLUMN IF NOT EXISTS partnership_id UUID;

-- ── 3. Default team channels bootstrap ──────────────────────────────
-- Creates a default "geral" team channel for an organization if it
-- doesn't already exist, then adds the user to it.

CREATE OR REPLACE FUNCTION public.bootstrap_user_channels(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_channel_id UUID;
BEGIN
    -- Find or create the default "Geral" team channel
    SELECT id INTO v_channel_id
    FROM public.chat_channels
    WHERE type = 'team'
      AND name = 'geral'
      AND is_archived = false
    LIMIT 1;

    IF v_channel_id IS NULL THEN
        -- Create default channel
        INSERT INTO public.chat_channels (
            type, name, description, auto_created,
            is_archived, is_pinned, is_muted, message_count
        )
        VALUES (
            'team', 'geral',
            'Canal geral da equipe — todos os membros',
            true, false, false, false, 0
        )
        RETURNING id INTO v_channel_id;
    END IF;

    -- Add user as member if not already
    INSERT INTO public.chat_members (
        channel_id, user_id, role, unread_count,
        is_muted, is_pinned, notify_mode
    )
    VALUES (
        v_channel_id, p_user_id, 'member', 0,
        false, false, 'all'
    )
    ON CONFLICT (channel_id, user_id) DO NOTHING;

    -- Find or create the "Anúncios" channel
    SELECT id INTO v_channel_id
    FROM public.chat_channels
    WHERE type = 'announcement'
      AND name = 'anuncios'
      AND is_archived = false
    LIMIT 1;

    IF v_channel_id IS NULL THEN
        INSERT INTO public.chat_channels (
            type, name, description, auto_created,
            is_archived, is_pinned, is_muted, message_count
        )
        VALUES (
            'announcement', 'anuncios',
            'Avisos e comunicados da empresa',
            true, false, false, false, 0
        )
        RETURNING id INTO v_channel_id;
    END IF;

    INSERT INTO public.chat_members (
        channel_id, user_id, role, unread_count,
        is_muted, is_pinned, notify_mode
    )
    VALUES (
        v_channel_id, p_user_id, 'readonly', 0,
        false, false, 'all'
    )
    ON CONFLICT (channel_id, user_id) DO NOTHING;

EXCEPTION
    WHEN others THEN
        -- Silently ignore errors so login is never blocked
        NULL;
END;
$$;

-- ── 4. Trigger: auto-bootstrap on profile creation ──────────────────
-- The profiles table is populated when a user first logs in.
-- We hook into that to add them to default channels.

CREATE OR REPLACE FUNCTION public.on_profile_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM public.bootstrap_user_channels(NEW.id);
    RETURN NEW;
EXCEPTION
    WHEN others THEN RETURN NEW; -- Never block profile creation
END;
$$;

DROP TRIGGER IF EXISTS trg_bootstrap_channels ON public.profiles;
CREATE TRIGGER trg_bootstrap_channels
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.on_profile_created();

-- ── 5. Backfill: add all existing users to default channels ─────────
-- Run bootstrap for every user already in the profiles table.
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM public.profiles LOOP
        PERFORM public.bootstrap_user_channels(r.id);
    END LOOP;
EXCEPTION
    WHEN others THEN NULL; -- Ignore if profiles table doesn't exist yet
END;
$$;

-- ── 6. Grant execute on helper function ─────────────────────────────
GRANT EXECUTE ON FUNCTION public.bootstrap_user_channels(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_user_channels(UUID) TO service_role;
