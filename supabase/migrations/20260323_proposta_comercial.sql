-- Proposta Comercial Inteligente
CREATE TABLE IF NOT EXISTS public.propostas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT UNIQUE NOT NULL, -- short unique token for URL /p/[token]

    -- Property
    property_id UUID REFERENCES developments(id),
    property_name TEXT,
    property_price NUMERIC,
    property_address TEXT,

    -- Lead
    lead_id UUID REFERENCES leads(id),
    lead_name TEXT NOT NULL,
    lead_email TEXT,
    lead_phone TEXT,

    -- Broker
    broker_id UUID NOT NULL,
    broker_name TEXT,
    broker_creci TEXT,
    broker_phone TEXT,

    -- Proposal details
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','viewed','analyzing','accepted','rejected','expired','countered')),
    conditions JSONB DEFAULT '{}', -- payment terms, discounts, etc
    sections TEXT[] DEFAULT ARRAY['header','cover','gallery','description','proposal','simulator','cta'], -- enabled sections
    validity_days INTEGER DEFAULT 7,
    expires_at TIMESTAMPTZ,

    -- Financial
    proposed_value NUMERIC,
    down_payment_pct NUMERIC DEFAULT 20,
    financing_rate NUMERIC DEFAULT 9.5,
    financing_term INTEGER DEFAULT 360,

    -- Tracking
    views INTEGER DEFAULT 0,
    unique_views INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMPTZ,
    total_time_seconds INTEGER DEFAULT 0,
    section_times JSONB DEFAULT '{}', -- {header: 5, gallery: 30, simulator: 120, ...}
    interactions JSONB DEFAULT '{}', -- {photos_viewed: 8, simulator_used: true, ...}

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ, -- first view

    organization_id UUID
);

ALTER TABLE public.propostas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "propostas_auth" ON public.propostas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_propostas_token ON public.propostas(token);
CREATE INDEX idx_propostas_broker ON public.propostas(broker_id);
CREATE INDEX idx_propostas_lead ON public.propostas(lead_id);
CREATE INDEX idx_propostas_status ON public.propostas(status);

-- Proposal view events (section-level tracking)
CREATE TABLE IF NOT EXISTS public.proposta_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposta_id UUID NOT NULL REFERENCES propostas(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'view', 'scroll', 'section_view', 'interaction', 'cta_click'
    section TEXT, -- which section triggered the event
    data JSONB DEFAULT '{}', -- event-specific data
    device_type TEXT,
    browser TEXT,
    ip_address TEXT,
    city TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_proposta_events_proposta ON public.proposta_events(proposta_id, created_at DESC);
