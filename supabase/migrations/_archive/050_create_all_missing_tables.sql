-- ============================================================
-- Migration 050: Create all missing tables
-- Created: 2026-03-11
-- ============================================================

-- ── lead_qualifications ──────────────────────────────────────
-- Used by /api/ai/qualify-lead to persist Claude AI scoring
CREATE TABLE IF NOT EXISTS public.lead_qualifications (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id      UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  score        INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  reasoning    TEXT,
  profile      JSONB    DEFAULT '{}',
  follow_ups   JSONB    DEFAULT '[]',
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.lead_qualifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own lead qualifications"
  ON public.lead_qualifications
  FOR ALL
  USING (
    user_id = auth.uid()
    OR lead_id IN (
      SELECT id FROM public.leads WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_lead_qualifications_lead_id
  ON public.lead_qualifications(lead_id);

CREATE INDEX IF NOT EXISTS idx_lead_qualifications_created_at
  ON public.lead_qualifications(created_at DESC);

-- ── inbox_messages ───────────────────────────────────────────
-- Unified inbox for multi-channel messages (email, WhatsApp, social)
CREATE TABLE IF NOT EXISTS public.inbox_messages (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id         UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  channel         TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp', 'instagram', 'linkedin', 'facebook', 'sms')),
  direction       TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  subject         TEXT,
  body            TEXT,
  sender_name     TEXT,
  sender_email    TEXT,
  sender_phone    TEXT,
  external_id     TEXT,
  thread_id       TEXT,
  is_read         BOOLEAN DEFAULT FALSE,
  is_starred      BOOLEAN DEFAULT FALSE,
  ai_reply        TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own inbox messages"
  ON public.inbox_messages
  FOR ALL
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_inbox_messages_user_id
  ON public.inbox_messages(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inbox_messages_lead_id
  ON public.inbox_messages(lead_id);

CREATE INDEX IF NOT EXISTS idx_inbox_messages_thread_id
  ON public.inbox_messages(thread_id);

-- ── lead_follow_ups ──────────────────────────────────────────
-- Ensure lead_follow_ups table exists (may have been created elsewhere)
CREATE TABLE IF NOT EXISTS public.lead_follow_ups (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id      UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type         TEXT NOT NULL CHECK (type IN ('call', 'email', 'whatsapp', 'meeting', 'task', 'note')),
  title        TEXT NOT NULL,
  description  TEXT,
  due_date     TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'cancelled')),
  priority     TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.lead_follow_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own lead follow ups"
  ON public.lead_follow_ups
  FOR ALL
  USING (
    user_id = auth.uid()
    OR lead_id IN (
      SELECT id FROM public.leads WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_lead_follow_ups_lead_id
  ON public.lead_follow_ups(lead_id);

CREATE INDEX IF NOT EXISTS idx_lead_follow_ups_due_date
  ON public.lead_follow_ups(due_date);

-- ── banking_connections ──────────────────────────────────────
-- OAuth tokens for Open Banking / Pix integrations
CREATE TABLE IF NOT EXISTS public.banking_connections (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_name       TEXT NOT NULL,
  provider        TEXT NOT NULL CHECK (provider IN ('abacate_pay', 'asaas', 'iugu', 'pix_manual', 'open_banking')),
  access_token    TEXT,
  refresh_token   TEXT,
  account_number  TEXT,
  agency          TEXT,
  pix_key         TEXT,
  status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'disconnected')),
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.banking_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own banking connections"
  ON public.banking_connections
  FOR ALL
  USING (user_id = auth.uid());

-- ── report_exports ───────────────────────────────────────────
-- Track exported reports (PDF, Excel, CSV)
CREATE TABLE IF NOT EXISTS public.report_exports (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type  TEXT NOT NULL,
  format       TEXT NOT NULL CHECK (format IN ('pdf', 'excel', 'csv', 'json')),
  file_url     TEXT,
  parameters   JSONB DEFAULT '{}',
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'error')),
  error_msg    TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  expires_at   TIMESTAMPTZ DEFAULT (now() + interval '7 days')
);

ALTER TABLE public.report_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own report exports"
  ON public.report_exports
  FOR ALL
  USING (user_id = auth.uid());

-- ── Log migration ────────────────────────────────────────────
INSERT INTO public._migrations_log (name, applied_at)
VALUES ('050_create_all_missing_tables', now())
ON CONFLICT DO NOTHING;
