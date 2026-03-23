-- ============================================================================
-- Fix partnerships & partnership_messages schemas to match API expectations
-- The original migration created a minimal schema; the API routes expect
-- richer columns for the co-broke / parceria workflow.
-- ============================================================================

-- ── 1. partnerships: add missing columns ────────────────────────────────────

-- Property-related
ALTER TABLE public.partnerships ADD COLUMN IF NOT EXISTS property_id UUID;
ALTER TABLE public.partnerships ADD COLUMN IF NOT EXISTS property_name TEXT;
ALTER TABLE public.partnerships ADD COLUMN IF NOT EXISTS property_price DECIMAL(14,2);

-- Owner broker (the one who owns the property)
ALTER TABLE public.partnerships ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE public.partnerships ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.partnerships ADD COLUMN IF NOT EXISTS owner_name TEXT;

-- Partner broker (the one proposing)
ALTER TABLE public.partnerships ADD COLUMN IF NOT EXISTS partner_user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.partnerships ADD COLUMN IF NOT EXISTS partner_name TEXT;

-- Commission breakdown
ALTER TABLE public.partnerships ADD COLUMN IF NOT EXISTS commission_total_pct DECIMAL(5,2) DEFAULT 0;
ALTER TABLE public.partnerships ADD COLUMN IF NOT EXISTS commission_owner_pct DECIMAL(5,2) DEFAULT 0;
ALTER TABLE public.partnerships ADD COLUMN IF NOT EXISTS commission_partner_pct DECIMAL(5,2) DEFAULT 0;
ALTER TABLE public.partnerships ADD COLUMN IF NOT EXISTS commission_platform_pct DECIMAL(5,2) DEFAULT 0;
ALTER TABLE public.partnerships ADD COLUMN IF NOT EXISTS commission_notes TEXT;

-- Lead info
ALTER TABLE public.partnerships ADD COLUMN IF NOT EXISTS lead_id UUID;
ALTER TABLE public.partnerships ADD COLUMN IF NOT EXISTS lead_name TEXT;

-- Messaging counters
ALTER TABLE public.partnerships ADD COLUMN IF NOT EXISTS total_messages INT DEFAULT 0;
ALTER TABLE public.partnerships ADD COLUMN IF NOT EXISTS unread_owner INT DEFAULT 0;
ALTER TABLE public.partnerships ADD COLUMN IF NOT EXISTS unread_partner INT DEFAULT 0;
ALTER TABLE public.partnerships ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ;
ALTER TABLE public.partnerships ADD COLUMN IF NOT EXISTS last_message_preview TEXT;

-- Lifecycle timestamps
ALTER TABLE public.partnerships ADD COLUMN IF NOT EXISTS proposed_at TIMESTAMPTZ;
ALTER TABLE public.partnerships ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;
ALTER TABLE public.partnerships ADD COLUMN IF NOT EXISTS terms_agreed_at TIMESTAMPTZ;
ALTER TABLE public.partnerships ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE public.partnerships ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

-- Completion / sale
ALTER TABLE public.partnerships ADD COLUMN IF NOT EXISTS sale_value DECIMAL(14,2);
ALTER TABLE public.partnerships ADD COLUMN IF NOT EXISTS total_commission DECIMAL(14,2);
ALTER TABLE public.partnerships ADD COLUMN IF NOT EXISTS owner_commission DECIMAL(14,2);
ALTER TABLE public.partnerships ADD COLUMN IF NOT EXISTS partner_commission DECIMAL(14,2);
ALTER TABLE public.partnerships ADD COLUMN IF NOT EXISTS platform_commission DECIMAL(14,2);

-- Cancellation / rejection
ALTER TABLE public.partnerships ADD COLUMN IF NOT EXISTS end_reason TEXT;
ALTER TABLE public.partnerships ADD COLUMN IF NOT EXISTS ended_by UUID;

-- Chat channel link
ALTER TABLE public.partnerships ADD COLUMN IF NOT EXISTS channel_id UUID;

-- Relax the status CHECK to include the statuses the API uses
-- (drop old constraint if it exists, then add the wider one)
ALTER TABLE public.partnerships DROP CONSTRAINT IF EXISTS partnerships_status_check;
ALTER TABLE public.partnerships ADD CONSTRAINT partnerships_status_check
    CHECK (status IN ('pending', 'proposed', 'negotiating', 'accepted', 'active', 'completed', 'cancelled', 'rejected', 'expired'));

-- Extra indexes
CREATE INDEX IF NOT EXISTS idx_partnerships_owner_user ON public.partnerships(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_partnerships_partner_user ON public.partnerships(partner_user_id);
CREATE INDEX IF NOT EXISTS idx_partnerships_property ON public.partnerships(property_id);

-- ── 2. partnership_messages: add missing columns ────────────────────────────

ALTER TABLE public.partnership_messages ADD COLUMN IF NOT EXISTS sender_name TEXT;
ALTER TABLE public.partnership_messages ADD COLUMN IF NOT EXISTS sender_avatar TEXT;
ALTER TABLE public.partnership_messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text';
ALTER TABLE public.partnership_messages ADD COLUMN IF NOT EXISTS read_by_owner BOOLEAN DEFAULT false;
ALTER TABLE public.partnership_messages ADD COLUMN IF NOT EXISTS read_by_partner BOOLEAN DEFAULT false;
ALTER TABLE public.partnership_messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- ── 3. chat_channels: add partnership_id column for linking ─────────────────

ALTER TABLE public.chat_channels ADD COLUMN IF NOT EXISTS partnership_id UUID;
