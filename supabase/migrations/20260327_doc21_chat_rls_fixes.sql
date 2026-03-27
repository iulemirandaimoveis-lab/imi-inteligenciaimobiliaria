-- ============================================================
-- Doc 21: Chat schema fixes + RLS policies for public access
-- Applied: 2026-03-27
-- ============================================================

-- 1. Profiles anon read policy (for RealtorCard on public site)
DO $$ BEGIN
  CREATE POLICY "anon_read_public_profiles" ON public.profiles
    FOR SELECT TO anon
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add partnership_id to chat_channels (for deal_room linking)
ALTER TABLE public.chat_channels ADD COLUMN IF NOT EXISTS partnership_id UUID;

-- 3. Ensure all current users are members of default team channels
INSERT INTO public.chat_members (channel_id, user_id, role, unread_count)
SELECT c.id, u.id, 'member', 0
FROM public.chat_channels c
CROSS JOIN auth.users u
WHERE c.type = 'team' AND c.name IN ('Geral', 'Vendas', 'Avisos')
ON CONFLICT (channel_id, user_id) DO NOTHING;
