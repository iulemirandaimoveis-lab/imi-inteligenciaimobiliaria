-- ═══════════════════════════════════════════════════════════════════════════
-- IMI CONNECT — Schema Alignment Migration
-- Data: 2026-03-29
-- Objetivo: Alinhar colunas do banco com tipos TypeScript do frontend
-- Status: ALREADY EXECUTED via Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. CHAT_CHANNELS — Campos faltantes
ALTER TABLE public.chat_channels ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.chat_channels ADD COLUMN IF NOT EXISTS development_id UUID;
ALTER TABLE public.chat_channels ADD COLUMN IF NOT EXISTS lead_id UUID;
ALTER TABLE public.chat_channels ADD COLUMN IF NOT EXISTS proposal_id UUID;
ALTER TABLE public.chat_channels ADD COLUMN IF NOT EXISTS contrato_id UUID;
ALTER TABLE public.chat_channels ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
ALTER TABLE public.chat_channels ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT false;
ALTER TABLE public.chat_channels ADD COLUMN IF NOT EXISTS auto_created BOOLEAN DEFAULT false;
ALTER TABLE public.chat_channels ADD COLUMN IF NOT EXISTS last_message_preview TEXT;
ALTER TABLE public.chat_channels ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0;

-- 2. CHAT_MESSAGES — Alinhar nome de coluna + campos extras
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'message_type'
    AND table_schema = 'public'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'content_type'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.chat_messages RENAME COLUMN message_type TO content_type;
  END IF;
END $$;

ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'text';
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS entity_type TEXT;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS entity_id UUID;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS reply_to UUID;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS thread_count INTEGER DEFAULT 0;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS mentions TEXT[] DEFAULT '{}';
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}';
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'parent_message_id'
    AND table_schema = 'public'
  ) THEN
    UPDATE public.chat_messages SET reply_to = parent_message_id WHERE parent_message_id IS NOT NULL AND reply_to IS NULL;
    ALTER TABLE public.chat_messages DROP COLUMN IF EXISTS parent_message_id;
  END IF;
END $$;

DO $$ BEGIN
  ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_message_type_check;
  ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_content_type_check;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_content_type_check
  CHECK (content_type IN ('text', 'image', 'file', 'property_card', 'lead_card', 'proposal_card', 'system', 'ai_summary', 'voice', 'media'));

-- 3. CHAT_MEMBERS — Campos faltantes
ALTER TABLE public.chat_members ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT false;
ALTER TABLE public.chat_members ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
ALTER TABLE public.chat_members ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0;

DO $$ BEGIN
  ALTER TABLE public.chat_members ADD COLUMN notify_mode TEXT DEFAULT 'all';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 4. INDEXES
CREATE INDEX IF NOT EXISTS idx_chat_channels_type ON public.chat_channels(type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply ON public.chat_messages(reply_to) WHERE reply_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_messages_content_type ON public.chat_messages(content_type);

-- 5. REALTIME
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_channels;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6. TRIGGER: Update channel on new message
CREATE OR REPLACE FUNCTION update_channel_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_channels SET
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.content, 100),
    message_count = COALESCE(message_count, 0) + 1,
    updated_at = now()
  WHERE id = NEW.channel_id;

  UPDATE public.chat_members SET
    unread_count = COALESCE(unread_count, 0) + 1
  WHERE channel_id = NEW.channel_id
    AND user_id != NEW.sender_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_channel_on_message ON public.chat_messages;
CREATE TRIGGER trg_update_channel_on_message
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_channel_on_message();

-- 7. PROFILES — Auto-create on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'corretor')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 8. BOOTSTRAP: Default channels + market_indicators
-- (Already executed via SQL Editor)

-- 9. MARKET INDICATORS
CREATE TABLE IF NOT EXISTS public.market_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  value TEXT NOT NULL,
  unit TEXT,
  category TEXT,
  trend TEXT CHECK (trend IN ('up', 'down', 'stable')),
  sort_order INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.market_indicators ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "market_indicators_public_read" ON public.market_indicators
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
