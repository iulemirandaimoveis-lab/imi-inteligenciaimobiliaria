-- =============================================
-- IMI ATLANTIS - SAMPLE DATA
-- Dados de exemplo para testes
-- Version: 1.0.0
-- Date: 2026-02-15
-- =============================================

-- IMPORTANTE: Execute este script APÓS criar o usuário admin no Supabase Auth
-- Substitua 'YOUR-ADMIN-USER-UUID' pelo UUID real do usuário criado

-- =============================================
-- 1. DEVELOPERS
-- =============================================
INSERT INTO developers (id, name, description, website, phone, email) VALUES
('d1111111-1111-1111-1111-111111111111', 'Moura Dubeux', 'Construtora líder em Pernambuco com mais de 50 anos de tradição', 'https://www.mouradubeux.com.br', '(81) 3419-8000', 'contato@mouradubeux.com.br'),
('d2222222-2222-2222-2222-222222222222', 'Queiroz Galvão', 'Grupo com atuação nacional em construção civil e infraestrutura', 'https://www.qgdi.com.br', '(81) 3412-9000', 'contato@qgdi.com.br'),
('d3333333-3333-3333-3333-333333333333', 'Ecolife', 'Construtora focada em empreendimentos sustentáveis', 'https://www.ecolife.com.br', '(81) 3465-3000', 'contato@ecolife.com.br');

-- =============================================
-- 2. DEVELOPMENTS
-- =============================================
INSERT INTO developments (
  id, name, slug, developer_id, type, status,
  address, neighborhood, city, state,
  total_area, private_area, bedrooms, suites, bathrooms, parking_spaces,
  price_min, price_max, price_per_sqm,
  total_units, available_units,
  delivery_date,
  features, amenities,
  published_at
) VALUES
(
  'p1111111-1111-1111-1111-111111111111',
  'Reserva Atlantis',
  'reserva-atlantis',
  'd1111111-1111-1111-1111-111111111111',
  'apartment',
  'available',
  'Av. Boa Viagem, 3500',
  'Boa Viagem',
  'Recife',
  'PE',
  120.00,
  95.00,
  3,
  1,
  2,
  2,
  680000.00,
  850000.00,
  7157.89,
  120,
  45,
  '2027-06-30',
  '["Vista mar", "Varanda gourmet", "Pé-direito duplo", "Acabamento premium"]',
  '["Piscina", "Academia", "Salão de festas", "Playground", "Coworking", "Pet place"]',
  NOW()
),
(
  'p2222222-2222-2222-2222-222222222222',
  'Vista Mar Residence',
  'vista-mar-residence',
  'd2222222-2222-2222-2222-222222222222',
  'apartment',
  'available',
  'Av. Conselheiro Aguiar, 2500',
  'Boa Viagem',
  'Recife',
  'PE',
  95.00,
  75.00,
  2,
  1,
  2,
  1,
  520000.00,
  620000.00,
  6933.33,
  80,
  22,
  '2026-12-31',
  '["Vista mar", "Varanda", "Closet"]',
  '["Piscina", "Academia", "Salão de festas"]',
  NOW()
);

-- =============================================
-- 3. LEADS (Exemplos com diferentes scores)
-- =============================================
INSERT INTO leads (
  id, name, email, phone, cpf,
  status, origin, score,
  interest_type, interest_location, budget_min, budget_max, bedrooms,
  occupation, income, marital_status, children,
  financing_needed, urgency,
  notes
) VALUES
(
  'l1111111-1111-1111-1111-111111111111',
  'Maria Santos',
  'maria.santos@email.com',
  '(81) 99876-5432',
  '123.456.789-00',
  'qualified',
  'instagram',
  18,
  'apartment',
  'Boa Viagem',
  600000.00,
  800000.00,
  3,
  'Médica',
  25000.00,
  'Casada',
  2,
  true,
  'immediate',
  'Cliente muito interessada, já visitou 3 imóveis'
),
(
  'l2222222-2222-2222-2222-222222222222',
  'João Silva',
  'joao.silva@email.com',
  '(81) 98765-4321',
  '987.654.321-00',
  'contacted',
  'google',
  15,
  'apartment',
  'Pina',
  400000.00,
  600000.00,
  2,
  'Engenheiro',
  18000.00,
  'Solteiro',
  0,
  true,
  'medium',
  'Aguardando aprovação de crédito'
),
(
  'l3333333-3333-3333-3333-333333333333',
  'Ana Paula Costa',
  'ana.costa@email.com',
  '(81) 97654-3210',
  NULL,
  'new',
  'website',
  8,
  'apartment',
  'Boa Viagem',
  NULL,
  NULL,
  3,
  NULL,
  NULL,
  NULL,
  NULL,
  false,
  NULL,
  'Lead novo, precisa de qualificação'
);

-- =============================================
-- 4. CREDIT APPLICATIONS
-- =============================================
INSERT INTO credit_applications (
  id, protocol,
  client_name, client_email, client_phone, client_cpf, client_income, client_occupation,
  property_address, property_type, property_value, property_area,
  bank, financed_amount, down_payment, term_months, interest_rate, monthly_payment, system,
  ltv, dti,
  status,
  documents,
  timeline
) VALUES
(
  'c1111111-1111-1111-1111-111111111111',
  'CRD-2026-001',
  'Carlos Eduardo Silva',
  'carlos.silva@email.com',
  '(81) 99876-5432',
  '123.456.789-00',
  15000.00,
  'Engenheiro Civil',
  'Av. Boa Viagem, 3500 - Apto 802',
  'apartment',
  680000.00,
  95.00,
  'Caixa Econômica Federal',
  544000.00,
  136000.00,
  360,
  9.50,
  4589.20,
  'SAC',
  80.00,
  30.60,
  'approved',
  '[
    {"name": "RG e CPF", "status": "approved", "uploadedAt": "2026-02-01"},
    {"name": "Comprovante de Renda", "status": "approved", "uploadedAt": "2026-02-01"},
    {"name": "Comprovante de Residência", "status": "approved", "uploadedAt": "2026-02-02"}
  ]',
  '[
    {"date": "2026-02-01", "event": "Solicitação criada", "status": "completed"},
    {"date": "2026-02-02", "event": "Documentos enviados", "status": "completed"},
    {"date": "2026-02-05", "event": "Análise de crédito iniciada", "status": "completed"},
    {"date": "2026-02-08", "event": "Aprovado pela Caixa", "status": "completed"},
    {"date": "2026-02-15", "event": "Aguardando assinatura", "status": "current"}
  ]'
);

-- =============================================
-- 5. EVALUATIONS
-- =============================================
INSERT INTO evaluations (
  id, protocol,
  property_address, property_type, property_area, property_bedrooms, property_bathrooms, property_parking,
  property_city, property_state,
  client_name, client_email, client_phone, client_document,
  purpose, method, request_date, deadline,
  status,
  documents
) VALUES
(
  'e1111111-1111-1111-1111-111111111111',
  'AVL-2026-001',
  'Av. Boa Viagem, 3500 - Apto 802, Boa Viagem',
  'apartment',
  95.00,
  3,
  2,
  2,
  'Recife',
  'PE',
  'Carlos Eduardo Silva',
  'carlos.silva@email.com',
  '(81) 99876-5432',
  '123.456.789-00',
  'Compra e Venda',
  'Comparativo Direto de Dados de Mercado',
  '2026-02-01',
  '2026-02-15',
  'in_progress',
  '[
    {"name": "Escritura", "status": "approved", "uploadedAt": "2026-02-01"},
    {"name": "IPTU", "status": "approved", "uploadedAt": "2026-02-01"},
    {"name": "Fotos do Imóvel", "status": "approved", "uploadedAt": "2026-02-02"}
  ]'
);

-- =============================================
-- 6. CAMPAIGNS
-- =============================================
INSERT INTO campaigns (
  id, name, objective, channel, status,
  start_date, end_date,
  budget, daily_budget, spent,
  expected_leads, cost_per_lead,
  target_audience, age_range, location, interests,
  ad_title, ad_description, call_to_action, landing_page_url,
  utm_source, utm_medium, utm_campaign,
  impressions, clicks, leads, conversions, ctr, roi
) VALUES
(
  'ca111111-1111-1111-1111-111111111111',
  'Lançamento Reserva Atlantis - Instagram',
  'Geração de Leads',
  'instagram',
  'active',
  '2026-02-01',
  '2026-02-28',
  5000.00,
  200.00,
  3250.00,
  50,
  100.00,
  'Profissionais liberais, casais sem filhos, renda acima de R$ 10k',
  '25-45',
  '["Boa Viagem", "Pina"]',
  '["Imóveis de Luxo", "Apartamentos"]',
  'Seu Apartamento dos Sonhos em Boa Viagem',
  'Conheça o Reserva Atlantis, o empreendimento mais completo da região. Vista mar, área de lazer completa e acabamento premium.',
  'Agende Visita',
  'https://iulemirandaimoveis.com.br/imoveis/reserva-atlantis',
  'instagram',
  'paid',
  'reserva-atlantis-fev',
  125000,
  3750,
  52,
  8,
  3.0,
  160.0
);

-- =============================================
-- 7. NOTIFICATIONS (Exemplos)
-- =============================================
-- NOTA: Substitua 'YOUR-ADMIN-USER-UUID' pelo UUID real do admin
/*
INSERT INTO notifications (user_id, type, priority, title, message, action_url, read) VALUES
('YOUR-ADMIN-USER-UUID', 'lead', 'high', 'Novo Lead Qualificado', 'Maria Santos (Score 18/20) demonstrou interesse em apartamento de 3 quartos em Boa Viagem', '/backoffice/leads/l1111111-1111-1111-1111-111111111111', false),
('YOUR-ADMIN-USER-UUID', 'credit', 'high', 'Crédito Aprovado', 'Financiamento de Carlos Silva foi aprovado pela Caixa. Valor: R$ 544.000', '/backoffice/credito/c1111111-1111-1111-1111-111111111111', false),
('YOUR-ADMIN-USER-UUID', 'evaluation', 'medium', 'Laudo Concluído', 'Avaliação técnica AVL-2026-001 foi finalizada e está disponível para download', '/backoffice/avaliacoes/e1111111-1111-1111-1111-111111111111', false),
('YOUR-ADMIN-USER-UUID', 'campaign', 'medium', 'Meta de Campanha Atingida', 'Campanha "Reserva Atlantis - Instagram" atingiu 50 leads (100% da meta)', '/backoffice/campanhas/ca111111-1111-1111-1111-111111111111/analytics', true);
*/

-- =============================================
-- 8. TEAM MEMBERS (Exemplos)
-- =============================================
-- NOTA: Primeiro crie os usuários no Supabase Auth, depois insira aqui
/*
INSERT INTO team_members (id, name, email, phone, role, status, total_leads, total_sales, total_revenue) VALUES
('YOUR-ADMIN-USER-UUID', 'Laila Miranda', 'laila@iulemirandaimoveis.com.br', '(81) 99999-9999', 'admin', 'active', 145, 23, 15600000.00),
('USER-UUID-2', 'Carlos Eduardo Silva', 'carlos@iulemirandaimoveis.com.br', '(81) 98888-8888', 'manager', 'active', 98, 15, 9800000.00),
('USER-UUID-3', 'Ana Paula Costa', 'ana@iulemirandaimoveis.com.br', '(81) 97777-7777', 'agent', 'active', 67, 9, 5400000.00);
*/

-- =============================================
-- 9. SETTINGS (Exemplo)
-- =============================================
-- NOTA: Substitua 'YOUR-ADMIN-USER-UUID' pelo UUID real
/*
INSERT INTO settings (
  user_id,
  company_name, company_email, company_phone, company_address,
  email_notifications, push_notifications, weekly_report, lead_alerts,
  theme, language,
  two_factor_auth, session_timeout,
  google_analytics
) VALUES (
  'YOUR-ADMIN-USER-UUID',
  'Iu Lê Miranda Imóveis',
  'contato@iulemirandaimoveis.com.br',
  '(81) 99999-9999',
  'Av. Boa Viagem, 3500 - Boa Viagem, Recife - PE',
  true, true, true, true,
  'light', 'pt-BR',
  false, 30,
  'G-XXXXXXXXXX'
);
*/

-- =============================================
-- END OF SAMPLE DATA
-- =============================================
