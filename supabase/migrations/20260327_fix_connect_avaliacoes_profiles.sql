-- ═══════════════════════════════════════════════════════════════
-- Migration: Fix Connect schema + Avaliações schema + Profiles
-- Applied via Supabase MCP on 2026-03-27
-- ═══════════════════════════════════════════════════════════════

-- ── 1. chat_channels: add missing columns ──
ALTER TABLE public.chat_channels
  ADD COLUMN IF NOT EXISTS avatar_url       text,
  ADD COLUMN IF NOT EXISTS development_id   uuid,
  ADD COLUMN IF NOT EXISTS lead_id          uuid,
  ADD COLUMN IF NOT EXISTS proposal_id      uuid,
  ADD COLUMN IF NOT EXISTS contrato_id      uuid,
  ADD COLUMN IF NOT EXISTS is_pinned        boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_muted         boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_created     boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_message_preview text,
  ADD COLUMN IF NOT EXISTS message_count    integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at       timestamptz DEFAULT now();

-- ── 2. chat_members: add missing columns ──
ALTER TABLE public.chat_members
  ADD COLUMN IF NOT EXISTS is_muted       boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_pinned      boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_read_at   timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS unread_count   integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notify_mode    text DEFAULT 'all';

-- ── 3. chat_messages: rename type→content_type & add missing columns ──
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='chat_messages' AND column_name='type'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='chat_messages' AND column_name='content_type'
  ) THEN
    ALTER TABLE public.chat_messages RENAME COLUMN type TO content_type;
  END IF;
END $$;

ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS content_type  text DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS attachments   jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS entity_type   text,
  ADD COLUMN IF NOT EXISTS entity_id     text,
  ADD COLUMN IF NOT EXISTS reply_to      uuid,
  ADD COLUMN IF NOT EXISTS thread_count  integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mentions      text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_edited     boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS edited_at     timestamptz,
  ADD COLUMN IF NOT EXISTS reactions     jsonb DEFAULT '{}'::jsonb;

-- ── 4. chat_read_receipts ──
CREATE TABLE IF NOT EXISTS public.chat_read_receipts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id        uuid NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id           uuid NOT NULL,
  last_read_message_id uuid,
  last_read_at      timestamptz DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

ALTER TABLE public.chat_read_receipts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='chat_read_receipts' AND policyname='Users manage own read receipts') THEN
    CREATE POLICY "Users manage own read receipts" ON public.chat_read_receipts FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── 5. Add chat_members to Realtime publication ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'chat_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_members;
  END IF;
END $$;

-- ── 6. Auto-update channel metadata on new message ──
CREATE OR REPLACE FUNCTION public.on_chat_message_insert()
RETURNS trigger AS $$
BEGIN
    UPDATE public.chat_channels SET
        last_message_at = NEW.created_at,
        last_message_preview = LEFT(NEW.content, 100),
        message_count = COALESCE(message_count, 0) + 1,
        updated_at = now()
    WHERE id = NEW.channel_id;

    UPDATE public.chat_members SET
        unread_count = COALESCE(unread_count, 0) + 1
    WHERE channel_id = NEW.channel_id AND user_id != NEW.sender_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_chat_message_insert ON public.chat_messages;
CREATE TRIGGER trg_chat_message_insert
    AFTER INSERT ON public.chat_messages
    FOR EACH ROW EXECUTE FUNCTION public.on_chat_message_insert();

-- ── 7. Avaliações: add missing columns ──
ALTER TABLE public.avaliacoes
  ADD COLUMN IF NOT EXISTS honorarios_status text DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS documentos jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS laudo_content text,
  ADD COLUMN IF NOT EXISTS laudo_generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS ai_analysis jsonb;

COMMENT ON COLUMN public.avaliacoes.honorarios_status IS 'pago | parcial | pendente';
COMMENT ON COLUMN public.avaliacoes.documentos IS 'Array of {url, name, type, size, uploadedAt}';

-- ── 8. Improve profiles trigger ──
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'agent')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(NULLIF(profiles.name, ''), EXCLUDED.name),
        updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 9. Backfill missing profiles ──
INSERT INTO public.profiles (id, name, email, role)
SELECT
    au.id,
    COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
    au.email,
    'agent'
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
