-- =============================================
-- IMI ATLANTIS - SAMPLE DATA (CORRIGIDO V3)
-- Dados de exemplo BLINDADOS contra erros de duplicidade
-- =============================================

-- IMPORTANTE: Substitua 'YOUR-ADMIN-USER-UUID' pelo UUID do usuário Admin no Supabase

-- 1. DEVELOPERS (Refeito com ON CONFLICT no SLUG)
INSERT INTO developers (name, description, website, phone, email, slug) VALUES
('Moura Dubeux', 'Construtora líder em Pernambuco', 'https://www.mouradubeux.com.br', '(81) 3419-8000', 'contato@mouradubeux.com.br', 'moura-dubeux'),
('Queiroz Galvão', 'Grupo com atuação nacional', 'https://www.qgdi.com.br', '(81) 3412-9000', 'contato@qgdi.com.br', 'queiroz-galvao'),
('Ecolife', 'Construtora sustentável', 'https://www.ecolife.com.br', '(81) 3465-3000', 'contato@ecolife.com.br', 'ecolife')
ON CONFLICT (slug) DO NOTHING; 
-- ^ Isso diz: "Se já existir esse slug, não faça nada e continue sem erro"

-- 2. DEVELOPMENTS (Conflito no SLUG)
-- Primeiro precisamos pegar os IDs reais das construtoras inseridas acima (caso já existissem)
DO $$
DECLARE
    dev_moura UUID;
    dev_queiroz UUID;
BEGIN
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

-- 3. CAMPAIGNS (Conflito no ID, pois não tem slug)
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

-- 4. LEADS (Conflito no EMAIL)
INSERT INTO leads (
  name, email, phone, cpf, status, origin, score,
  interest_type, interest_location
) VALUES
(
  'Maria Santos', 'maria.santos@email.com', '(81) 99876-5432', '123.456.789-00', 'qualified', 'instagram', 18,
  'apartment', 'Boa Viagem'
)
ON CONFLICT (email) DO NOTHING;

-- 5. CREDIT APPLICATIONS (Conflito no PROTOCOLO)
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


-- 6. TEAM MEMBERS (Exemplo comentado)
/*
DO $$
BEGIN
    INSERT INTO team_members (id, name, email, role, status) 
    VALUES ('YOUR-ADMIN-USER-UUID', 'Laila Miranda', 'laila@iulemirandaimoveis.com.br', 'admin', 'active')
    ON CONFLICT (id) DO UPDATE SET role = 'admin';
EXCEPTION
    WHEN foreign_key_violation THEN null; -- Ignora se o usuário não existir no Auth
END $$;
*/
