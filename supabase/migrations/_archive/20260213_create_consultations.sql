-- Create consultations table
CREATE TABLE IF NOT EXISTS consultations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Cliente
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    client_type TEXT CHECK (client_type IN ('individual', 'business', 'family_office')),
    
    -- Perfil
    estimated_patrimony TEXT,
    has_international_income BOOLEAN DEFAULT false,
    occupation TEXT,
    
    -- Objetivos
    consultation_type TEXT NOT NULL,
    jurisdictions TEXT[], -- Array of strings
    main_goal TEXT,
    
    -- Estruturação
    needs_lawyer BOOLEAN DEFAULT false,
    needs_accountant BOOLEAN DEFAULT false,
    needs_bpo BOOLEAN DEFAULT false,
    
    -- Timing
    urgency TEXT,
    budget_range TEXT,
    
    -- Detalhes
    message TEXT,
    preferred_contact TEXT,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'scheduled', 'completed', 'archived')),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_to UUID REFERENCES auth.users(id)
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
CREATE INDEX IF NOT EXISTS idx_consultations_created ON consultations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consultations_email ON consultations(client_email);

-- RLS
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

-- Admins can view/edit all
CREATE POLICY "admins_card_read_consultations" ON consultations
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "admins_can_update_consultations" ON consultations
    FOR UPDATE TO authenticated
    USING (
         EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Users can insert (public form submission) - requires anon access if public, or auth if protected
-- Assuming this is a public form based on the wizard nature, allowing anon insert
CREATE POLICY "public_can_insert_consultations" ON consultations
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER trigger_update_consultations_updated_at
    BEFORE UPDATE ON consultations
    FOR EACH ROW
    EXECUTE FUNCTION update_evaluations_updated_at(); -- Reusing the function from previous migration if generic, or better create a specific one

-- Create generic update function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_consultations_updated_at ON consultations;
CREATE TRIGGER trigger_update_consultations_updated_at
    BEFORE UPDATE ON consultations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
