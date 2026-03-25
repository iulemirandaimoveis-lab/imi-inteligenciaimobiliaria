-- IMI Connect: Enable Realtime + Bootstrap default channels
-- Date: 2026-03-25

-- Ensure chat tables exist
CREATE TABLE IF NOT EXISTS public.chat_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT DEFAULT 'team' CHECK (type IN ('team', 'direct', 'deal_room', 'group', 'property', 'partnership')),
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    partnership_id UUID,
    is_archived BOOLEAN DEFAULT false,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'observer')),
    last_read_at TIMESTAMPTZ DEFAULT now(),
    joined_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(channel_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    content TEXT,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'media', 'system', 'ai_summary')),
    metadata JSONB DEFAULT '{}',
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    parent_message_id UUID REFERENCES public.chat_messages(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel ON public.chat_messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_members_user ON public.chat_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_members_channel ON public.chat_members(channel_id);

-- RLS
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies (allow authenticated users)
DO $$ BEGIN
    CREATE POLICY "chat_channels_auth" ON public.chat_channels FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "chat_members_auth" ON public.chat_members FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "chat_messages_auth" ON public.chat_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Enable Realtime on chat tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_channels;

-- Bootstrap default channels (idempotent — only creates if they don't exist)
INSERT INTO public.chat_channels (name, type, description)
SELECT name, type, description FROM (VALUES
    ('Geral', 'team', 'Canal principal da equipe'),
    ('Vendas', 'team', 'Discussões comerciais e pipeline'),
    ('Avisos', 'team', 'Comunicados importantes')
) AS v(name, type, description)
WHERE NOT EXISTS (
    SELECT 1 FROM public.chat_channels WHERE chat_channels.name = v.name AND chat_channels.type = 'team'
);

-- Add all existing users as members of default channels
INSERT INTO public.chat_members (channel_id, user_id, role)
SELECT c.id, u.id, 'member'
FROM public.chat_channels c
CROSS JOIN auth.users u
WHERE c.type = 'team' AND c.name IN ('Geral', 'Vendas', 'Avisos')
ON CONFLICT (channel_id, user_id) DO NOTHING;
