-- IMI Rentals & Short Stay Module

-- Rental properties (extends developments with rental-specific data)
CREATE TABLE IF NOT EXISTS public.rental_properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    development_id UUID REFERENCES developments(id),
    name TEXT NOT NULL,
    address TEXT,
    property_type TEXT DEFAULT 'apartment' CHECK (property_type IN ('apartment','house','studio','commercial','room','penthouse')),
    listing_mode TEXT DEFAULT 'short_stay' CHECK (listing_mode IN ('short_stay','traditional','hybrid','seasonal')),

    -- Pricing
    daily_rate NUMERIC,
    monthly_rate NUMERIC,
    cleaning_fee NUMERIC DEFAULT 0,

    -- Occupancy
    max_guests INTEGER DEFAULT 4,
    bedrooms INTEGER DEFAULT 1,
    bathrooms INTEGER DEFAULT 1,

    -- Channels
    airbnb_listing_id TEXT,
    booking_listing_id TEXT,
    direct_booking_enabled BOOLEAN DEFAULT true,
    ical_url TEXT,

    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active','maintenance','blocked','inactive')),

    -- Owner
    owner_id UUID,
    owner_name TEXT,
    management_fee_pct NUMERIC DEFAULT 20, -- % management fee

    -- Metadata
    photos TEXT[],
    amenities TEXT[],
    rules TEXT,
    check_in_time TEXT DEFAULT '15:00',
    check_out_time TEXT DEFAULT '11:00',

    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings / Reservations
CREATE TABLE IF NOT EXISTS public.rental_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES rental_properties(id) ON DELETE CASCADE,

    guest_name TEXT NOT NULL,
    guest_email TEXT,
    guest_phone TEXT,
    guests_count INTEGER DEFAULT 1,

    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    nights INTEGER GENERATED ALWAYS AS (check_out - check_in) STORED,

    source TEXT DEFAULT 'direct' CHECK (source IN ('direct','airbnb','booking','other')),
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','checked_in','checked_out','cancelled','no_show')),

    -- Financial
    total_amount NUMERIC NOT NULL,
    cleaning_fee NUMERIC DEFAULT 0,
    platform_fee NUMERIC DEFAULT 0,
    net_amount NUMERIC,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending','partial','paid','refunded')),

    notes TEXT,
    external_booking_id TEXT, -- Airbnb/Booking reservation ID

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rental financials (monthly summary per property)
CREATE TABLE IF NOT EXISTS public.rental_financials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES rental_properties(id),
    month DATE NOT NULL, -- first day of month

    gross_revenue NUMERIC DEFAULT 0,
    platform_fees NUMERIC DEFAULT 0,
    cleaning_income NUMERIC DEFAULT 0,
    management_fee NUMERIC DEFAULT 0,
    expenses NUMERIC DEFAULT 0,
    net_revenue NUMERIC DEFAULT 0,

    occupancy_rate NUMERIC DEFAULT 0, -- percentage
    avg_daily_rate NUMERIC DEFAULT 0,
    bookings_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(property_id, month)
);

ALTER TABLE public.rental_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_financials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rental_properties_auth" ON public.rental_properties FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rental_bookings_auth" ON public.rental_bookings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rental_financials_auth" ON public.rental_financials FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_bookings_property ON rental_bookings(property_id, check_in);
CREATE INDEX idx_bookings_dates ON rental_bookings(check_in, check_out);
CREATE INDEX idx_financials_property ON rental_financials(property_id, month);
