-- WhatsApp Click Events, Property POIs, and Rental Extensions
-- Migration: 20260327_whatsapp_poi_rentals

-- ═══════════════════════════════════════════════════════════════
-- 1. WhatsApp Click Events
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.whatsapp_click_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    development_id UUID REFERENCES developments(id) ON DELETE SET NULL,
    development_name TEXT,
    broker_id UUID,
    broker_name TEXT,
    source_page TEXT NOT NULL,
    unit_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    referrer TEXT,
    page_url TEXT,
    clicked_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_clicks_dev ON whatsapp_click_events(development_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_clicks_broker ON whatsapp_click_events(broker_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_clicks_date ON whatsapp_click_events(clicked_at);

ALTER TABLE whatsapp_click_events ENABLE ROW LEVEL SECURITY;

-- Anon can insert (public tracking)
CREATE POLICY "whatsapp_click_anon_insert" ON whatsapp_click_events
    FOR INSERT TO anon WITH CHECK (true);

-- Authenticated can read all clicks
CREATE POLICY "whatsapp_click_auth_select" ON whatsapp_click_events
    FOR SELECT TO authenticated USING (true);

-- ═══════════════════════════════════════════════════════════════
-- 2. Property POIs (Points of Interest Cache)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.property_pois (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL UNIQUE REFERENCES developments(id) ON DELETE CASCADE,
    pois JSONB DEFAULT '[]'::jsonb,
    scores JSONB DEFAULT '[]'::jsonb,
    overall_score INTEGER DEFAULT 0,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE property_pois ENABLE ROW LEVEL SECURITY;

-- Public can read POI data
CREATE POLICY "property_pois_public_read" ON property_pois
    FOR SELECT TO anon, authenticated USING (true);

-- Only authenticated can write (API route uses admin client, but policy for safety)
CREATE POLICY "property_pois_auth_write" ON property_pois
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- 3. Rental Guests
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.rental_guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    document_type TEXT CHECK (document_type IN ('cpf', 'rg', 'passport', 'other')),
    document_number TEXT,
    nationality TEXT DEFAULT 'BR',
    notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    is_blocked BOOLEAN DEFAULT false,
    blocked_reason TEXT,
    total_stays INTEGER DEFAULT 0,
    total_spent NUMERIC DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rental_guests_email ON rental_guests(email);
CREATE INDEX IF NOT EXISTS idx_rental_guests_phone ON rental_guests(phone);

ALTER TABLE rental_guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rental_guests_auth_all" ON rental_guests
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- 4. Rental Calendar Blocks
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.rental_calendar_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES rental_properties(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT DEFAULT 'maintenance' CHECK (reason IN ('maintenance', 'owner_use', 'renovation', 'other')),
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rental_blocks_property ON rental_calendar_blocks(property_id);
CREATE INDEX IF NOT EXISTS idx_rental_blocks_dates ON rental_calendar_blocks(start_date, end_date);

ALTER TABLE rental_calendar_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rental_calendar_blocks_auth_all" ON rental_calendar_blocks
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- 5. Rental Pricing Rules
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.rental_pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES rental_properties(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('seasonal', 'weekend', 'holiday', 'long_stay', 'last_minute', 'custom')),
    start_date DATE,
    end_date DATE,
    day_of_week INTEGER[], -- 0=Sun, 6=Sat
    min_nights INTEGER,
    max_nights INTEGER,
    price_modifier NUMERIC, -- multiplier (1.5 = 50% increase)
    fixed_price NUMERIC, -- override daily rate
    priority INTEGER DEFAULT 0, -- higher = takes precedence
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rental_pricing_property ON rental_pricing_rules(property_id);

ALTER TABLE rental_pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rental_pricing_rules_auth_all" ON rental_pricing_rules
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- 6. Rental Expenses
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.rental_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES rental_properties(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES rental_bookings(id) ON DELETE SET NULL,
    category TEXT NOT NULL CHECK (category IN ('cleaning', 'maintenance', 'utilities', 'supplies', 'commission', 'taxes', 'insurance', 'other')),
    description TEXT,
    amount NUMERIC NOT NULL,
    expense_date DATE DEFAULT CURRENT_DATE,
    receipt_url TEXT,
    vendor_name TEXT,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_period TEXT CHECK (recurrence_period IN ('monthly', 'quarterly', 'yearly')),
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rental_expenses_property ON rental_expenses(property_id);
CREATE INDEX IF NOT EXISTS idx_rental_expenses_date ON rental_expenses(expense_date);

ALTER TABLE rental_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rental_expenses_auth_all" ON rental_expenses
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- 7. Rental iCal Syncs
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.rental_ical_syncs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES rental_properties(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('airbnb', 'booking', 'vrbo', 'other')),
    ical_url TEXT NOT NULL,
    direction TEXT DEFAULT 'import' CHECK (direction IN ('import', 'export')),
    last_synced_at TIMESTAMPTZ,
    sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'success', 'error')),
    error_message TEXT,
    auto_sync BOOLEAN DEFAULT true,
    sync_interval_hours INTEGER DEFAULT 6,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rental_ical_property ON rental_ical_syncs(property_id);

ALTER TABLE rental_ical_syncs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rental_ical_syncs_auth_all" ON rental_ical_syncs
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- 8. Add guest_id to rental_bookings
-- ═══════════════════════════════════════════════════════════════

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'rental_bookings'
          AND column_name = 'guest_id'
    ) THEN
        ALTER TABLE public.rental_bookings
            ADD COLUMN guest_id UUID REFERENCES rental_guests(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_rental_bookings_guest ON rental_bookings(guest_id);
    END IF;
END $$;
