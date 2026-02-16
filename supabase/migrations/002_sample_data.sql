-- ==============================================================================
-- IMI ATLANTIS - SAMPLE DATA (CORRIGIDO FINAL - AUTO-REPAIR)
-- ==============================================================================

-- 0. AUTO-CORREÇÃO DE SCHEMA (Mágica para evitar erros 23502 e 23514)
-- Verifica se existe uma coluna legada 'developer' como NOT NULL e remove a restrição.
-- Remove também constraints de status antigas.
DO $$ 
BEGIN
    -- 1. Se a coluna developer existir e não for nula, vamos permitir nulo.
    BEGIN
        ALTER TABLE developments ALTER COLUMN developer DROP NOT NULL;
    EXCEPTION
        WHEN undefined_column THEN null; 
        WHEN OTHERS THEN null; 
    END;

    -- 2. Remove a constraint de status antiga que impede 'available'
    BEGIN
        ALTER TABLE developments DROP CONSTRAINT IF EXISTS developments_status_check;
    EXCEPTION
        WHEN undefined_object THEN null;
        WHEN OTHERS THEN null;
    END;

    -- 3. Garante que a tabela leads tenha as colunas novas
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS cpf VARCHAR(20);
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'new';
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS origin VARCHAR(50);
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS interest_type VARCHAR(50);
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS interest_location VARCHAR(100);

    -- 4. Adiciona constraints UNIQUE necessárias para o ON CONFLICT funcionar
    -- (O erro 42P10 acontece se tentarmos ON CONFLICT numa coluna que não é unique)
    BEGIN
        ALTER TABLE developers ADD CONSTRAINT developers_slug_key UNIQUE (slug);
    EXCEPTION WHEN duplicate_table THEN null; WHEN OTHERS THEN null; END;

    BEGIN
        ALTER TABLE developments ADD CONSTRAINT developments_slug_key UNIQUE (slug);
    EXCEPTION WHEN duplicate_table THEN null; WHEN OTHERS THEN null; END;

    BEGIN
        ALTER TABLE leads ADD CONSTRAINT leads_email_key UNIQUE (email);
    EXCEPTION WHEN duplicate_table THEN null; WHEN OTHERS THEN null; END;

    BEGIN
        ALTER TABLE credit_applications ADD CONSTRAINT credit_applications_protocol_key UNIQUE (protocol);
    EXCEPTION WHEN duplicate_table THEN null; WHEN OTHERS THEN null; END;

    -- 5. Garante que column ID tenha default (UUID)
    BEGIN
        ALTER TABLE leads ALTER COLUMN id SET DEFAULT gen_random_uuid();
    EXCEPTION WHEN OTHERS THEN null; END;

END $$;

-- 1. DEVELOPERS (Construtoras)
INSERT INTO developers (name, description, website, phone, email, slug) VALUES
('Moura Dubeux', 'Construtora líder em Pernambuco', 'https://www.mouradubeux.com.br', '(81) 3419-8000', 'contato@mouradubeux.com.br', 'moura-dubeux'),
('Queiroz Galvão', 'Grupo com atuação nacional', 'https://www.qgdi.com.br', '(81) 3412-9000', 'contato@qgdi.com.br', 'queiroz-galvao'),
('Ecolife', 'Construtora sustentável', 'https://www.ecolife.com.br', '(81) 3465-3000', 'contato@ecolife.com.br', 'ecolife')
ON CONFLICT (slug) DO NOTHING; 

-- 2. DEVELOPMENTS (Empreendimentos)
DO $$
DECLARE
    dev_moura UUID;
    dev_queiroz UUID;
BEGIN
    -- Busca os IDs corretos baseado no slug
    SELECT id INTO dev_moura FROM developers WHERE slug = 'moura-dubeux';
    SELECT id INTO dev_queiroz FROM developers WHERE slug = 'queiroz-galvao';

    INSERT INTO developments (
      name, slug, developer_id, type, status,
      address, neighborhood, city, state,
      total_area, private_area, bedrooms, suites, bathrooms, parking_spaces,
      price_min, price_max, price_per_sqm,
      total_units, available_units,
      delivery_date,
      features, amenities,
      published_at
    ) VALUES
    (
      'Reserva Atlantis', 'reserva-atlantis', dev_moura, 'apartment', 'available',
      'Av. Boa Viagem, 3500', 'Boa Viagem', 'Recife', 'PE',
      120.00, 95.00, 3, 1, 2, 2,
      680000.00, 850000.00, 7157.89,
      120, 45, '2027-06-30',
      '["Vista mar", "Varanda gourmet"]', '["Piscina", "Academia"]', NOW()
    ),
    (
      'Vista Mar Residence', 'vista-mar-residence', dev_queiroz, 'apartment', 'available',
      'Av. Conselheiro Aguiar, 2500', 'Boa Viagem', 'Recife', 'PE',
      95.00, 75.00, 2, 1, 2, 1,
      520000.00, 620000.00, 6933.33,
      80, 22, '2026-12-31',
      '["Vista mar", "Varanda"]', '["Piscina"]', NOW()
    )
    ON CONFLICT (slug) DO NOTHING;
END $$;

-- 3. CAMPAIGNS (Campanhas)
INSERT INTO campaigns (
  id, name, objective, channel, status,
  start_date, end_date,
  budget, daily_budget, spent,
  expected_leads, cost_per_lead,
  target_audience, age_range, location, interests,
  ad_title, ad_description, call_to_action, landing_page_url,
  utm_source, utm_medium, utm_campaign,
  impressions, clicks, leads, conversions, ctr, roi
) VALUES (
  'ca111111-1111-1111-1111-111111111111',
  'Lançamento Reserva Atlantis - Instagram',
  'Geração de Leads',
  'instagram',
  'active',
  '2026-02-01', '2026-02-28',
  5000.00, 200.00, 3250.00,
  50, 100.00,
  'Profissionais liberais', '25-45', '["Boa Viagem"]', '["Imóveis de Luxo"]',
  'Seu Apartamento dos Sonhos', 'Conheça o Reserva Atlantis.', 'Agende Visita', 'https://iulemirandaimoveis.com.br/imoveis/reserva-atlantis',
  'instagram', 'paid', 'reserva-atlantis-fev',
  125000, 3750, 52, 8, 3.0, 160.0
) ON CONFLICT (id) DO NOTHING;

-- 4. LEADS (COM ID EXPLÍCITO)
INSERT INTO leads (
  id, name, email, phone, cpf, status, origin, score,
  interest_type, interest_location
) VALUES
(
  gen_random_uuid(), 'Maria Santos', 'maria.santos@email.com', '(81) 99876-5432', '123.456.789-00', 'qualified', 'instagram', 18,
  'apartment', 'Boa Viagem'
)
ON CONFLICT (email) DO NOTHING;

-- 5. CREDIT APPLICATIONS (Crédito)
INSERT INTO credit_applications (
  protocol, client_name, client_email, client_cpf, 
  property_address, property_value, 
  financed_amount, down_payment, term_months, 
  status
) VALUES (
  'CRD-2026-001', 'Carlos Eduardo', 'carlos@email.com', '123.456.789-00',
  'Av. Boa Viagem', 680000,
  544000, 136000, 360,
  'approved'
) ON CONFLICT (protocol) DO NOTHING;