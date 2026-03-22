-- ═══════════════════════════════════════════════════════════════
-- IMI — SEED DATA PRODUCAO
-- Dados iniciais para lançamento: construtoras, imóveis, leads
-- Executar APÓS todas as migrations
-- ═══════════════════════════════════════════════════════════════

-- ── 1. CONSTRUTORAS (developers) ──────────────────────────────
INSERT INTO public.developers (id, name, slug, description, logo_url, website, city, state, status)
VALUES
    (gen_random_uuid(), 'IMI Incorporações', 'imi-incorporacoes',
     'Braço de incorporação da IMI — Inteligência Imobiliária. Empreendimentos de alto padrão no litoral da Paraíba.',
     NULL, 'https://www.iulemirandaimoveis.com.br', 'João Pessoa', 'PB', 'active'),

    (gen_random_uuid(), 'Moura Dubeux', 'moura-dubeux',
     'Uma das maiores incorporadoras do Nordeste. Mais de 45 anos de tradição com empreendimentos de alto padrão.',
     NULL, 'https://www.mouradubeux.com.br', 'Recife', 'PE', 'active'),

    (gen_random_uuid(), 'Alliance Empreendimentos', 'alliance-empreendimentos',
     'Referência em empreendimentos residenciais e comerciais na Paraíba e Pernambuco.',
     NULL, 'https://www.allianceempreendimentos.com.br', 'João Pessoa', 'PB', 'active')
ON CONFLICT DO NOTHING;

-- ── 2. IMÓVEIS (developments) ─────────────────────────────────
-- Pegar o ID da primeira construtora para FK
DO $$
DECLARE
    dev_imi UUID;
    dev_moura UUID;
    dev_alliance UUID;
BEGIN
    SELECT id INTO dev_imi FROM developers WHERE slug = 'imi-incorporacoes' LIMIT 1;
    SELECT id INTO dev_moura FROM developers WHERE slug = 'moura-dubeux' LIMIT 1;
    SELECT id INTO dev_alliance FROM developers WHERE slug = 'alliance-empreendimentos' LIMIT 1;

    -- Imóvel 1: Lançamento premium em Cabo Branco
    INSERT INTO developments (
        id, name, slug, description, status, status_commercial,
        developer_id, neighborhood, city, state, country, region,
        address, lat, lng,
        bedrooms, bathrooms, parking_spaces,
        area_from, area_to, price_from, price_to,
        delivery_date, features, tags,
        is_highlighted, display_order
    ) VALUES (
        gen_random_uuid(), 'Residencial Brisa do Mar', 'residencial-brisa-do-mar',
        'Empreendimento de alto padrão à beira-mar em Cabo Branco. Apartamentos de 3 e 4 suítes com vista definitiva para o oceano. Acabamento premium, área de lazer completa com piscina infinity, academia, espaço gourmet e coworking. A apenas 200m da praia mais nobre de João Pessoa.',
        'launch', 'launch',
        dev_imi, 'Cabo Branco', 'João Pessoa', 'PB', 'Brasil', 'paraiba',
        'Av. Cabo Branco, 3200', -7.1283, -34.8358,
        3, 3, 2,
        95.0, 180.0, 850000.0, 2200000.0,
        '2027-06-01', ARRAY['Piscina Infinity', 'Academia', 'Espaço Gourmet', 'Coworking', 'Rooftop', 'Segurança 24h', 'Vista Mar', 'Elevador', 'Bicicletário'],
        ARRAY['lançamento', 'alto padrão', 'beira-mar'],
        true, 1
    ) ON CONFLICT DO NOTHING;

    -- Imóvel 2: Apartamento em Manaíra
    INSERT INTO developments (
        id, name, slug, description, status, status_commercial,
        developer_id, neighborhood, city, state, country, region,
        address, lat, lng,
        bedrooms, bathrooms, parking_spaces,
        area_from, area_to, price_from, price_to,
        delivery_date, features, tags,
        is_highlighted, display_order
    ) VALUES (
        gen_random_uuid(), 'Edifício Solar dos Ventos', 'edificio-solar-dos-ventos',
        'Apartamentos modernos em Manaíra, bairro mais valorizado de João Pessoa. Plantas inteligentes de 2 e 3 quartos, varanda gourmet, e área de lazer completa. Próximo a shoppings, restaurantes e praia.',
        'launch', 'launch',
        dev_moura, 'Manaíra', 'João Pessoa', 'PB', 'Brasil', 'paraiba',
        'Rua Silvino Lopes, 450', -7.1089, -34.8389,
        2, 2, 1,
        62.0, 115.0, 420000.0, 890000.0,
        '2027-12-01', ARRAY['Piscina', 'Salão de Festas', 'Playground', 'Churrasqueira', 'Pet Place', 'Segurança 24h'],
        ARRAY['lançamento', 'manaíra'],
        true, 2
    ) ON CONFLICT DO NOTHING;

    -- Imóvel 3: Casa em condomínio
    INSERT INTO developments (
        id, name, slug, description, status, status_commercial,
        developer_id, neighborhood, city, state, country, region,
        address, lat, lng,
        bedrooms, bathrooms, parking_spaces,
        area_from, area_to, price_from, price_to,
        delivery_date, features, tags,
        is_highlighted, display_order
    ) VALUES (
        gen_random_uuid(), 'Condomínio Recanto do Sol', 'recanto-do-sol',
        'Casas térreas e duplex em condomínio fechado no Altiplano. Lotes de 300m² a 450m², projetos personalizáveis. Segurança completa, área verde preservada, clube com piscina e quadras esportivas.',
        'ready', 'ready',
        dev_alliance, 'Altiplano', 'João Pessoa', 'PB', 'Brasil', 'paraiba',
        'Rod. PB-008, Km 7', -7.1450, -34.8100,
        4, 4, 3,
        180.0, 320.0, 980000.0, 1800000.0,
        NULL, ARRAY['Condomínio Fechado', 'Piscina', 'Quadra Esportiva', 'Área Verde', 'Portaria 24h', 'Clube', 'Playground'],
        ARRAY['pronta entrega', 'casas', 'condomínio'],
        false, 3
    ) ON CONFLICT DO NOTHING;

    -- Imóvel 4: Studio/Flat para investidor
    INSERT INTO developments (
        id, name, slug, description, status, status_commercial,
        developer_id, neighborhood, city, state, country, region,
        address, lat, lng,
        bedrooms, bathrooms, parking_spaces,
        area_from, area_to, price_from, price_to,
        delivery_date, features, tags,
        is_highlighted, display_order
    ) VALUES (
        gen_random_uuid(), 'IMI Studios Tambaú', 'imi-studios-tambau',
        'Studios e flats de 28m² a 45m² em Tambaú, ideal para investidores. Gestão hoteleira inclusa, pool de locação, e rentabilidade projetada de 0.8% a 1.2% ao mês. A 100m da praia.',
        'launch', 'launch',
        dev_imi, 'Tambaú', 'João Pessoa', 'PB', 'Brasil', 'paraiba',
        'Av. Almirante Tamandaré, 800', -7.1150, -34.8350,
        1, 1, 1,
        28.0, 45.0, 280000.0, 520000.0,
        '2027-03-01', ARRAY['Pool de Locação', 'Gestão Hoteleira', 'Rooftop', 'Coworking', 'Lavanderia', 'Próximo à Praia'],
        ARRAY['investimento', 'studios', 'tambaú'],
        true, 4
    ) ON CONFLICT DO NOTHING;

    -- Imóvel 5: Empreendimento em Recife (para mostrar multi-cidade)
    INSERT INTO developments (
        id, name, slug, description, status, status_commercial,
        developer_id, neighborhood, city, state, country, region,
        address, lat, lng,
        bedrooms, bathrooms, parking_spaces,
        area_from, area_to, price_from, price_to,
        delivery_date, features, tags,
        is_highlighted, display_order
    ) VALUES (
        gen_random_uuid(), 'Grand Tower Boa Viagem', 'grand-tower-boa-viagem',
        'Torre única de 40 andares em Boa Viagem, Recife. Apartamentos de 3 e 4 suítes com 120m² a 240m². Vista panorâmica, piscina no rooftop, e localização privilegiada próximo ao shopping e aeroporto.',
        'launch', 'launch',
        dev_moura, 'Boa Viagem', 'Recife', 'PE', 'Brasil', 'pernambuco',
        'Av. Boa Viagem, 4500', -8.1200, -34.8950,
        3, 3, 2,
        120.0, 240.0, 1200000.0, 3500000.0,
        '2028-06-01', ARRAY['Piscina Rooftop', 'Spa', 'Cinema', 'Espaço Gourmet', 'Wine Bar', 'Concierge', 'Vista Mar', 'Heliponto'],
        ARRAY['alto padrão', 'recife', 'boa viagem'],
        false, 5
    ) ON CONFLICT DO NOTHING;
END $$;

-- ── 3. LEADS (10 leads de exemplo) ───────────────────────────
INSERT INTO public.leads (id, name, email, phone, source, status, score, notes, property_interest, budget_min, budget_max, created_at)
VALUES
    (gen_random_uuid(), 'Carlos Eduardo Silva', 'carlos.silva@email.com', '(83) 99901-2345', 'website', 'novo', 85,
     'Interessado no Brisa do Mar, apartamento de 3 suítes. Orçamento confirmado.', 'Residencial Brisa do Mar', 800000, 1500000, NOW() - INTERVAL '2 days'),

    (gen_random_uuid(), 'Ana Beatriz Santos', 'ana.santos@email.com', '(83) 99812-3456', 'instagram', 'qualificado', 92,
     'Investidora, já possui 2 imóveis. Quer studios para renda. Perfil premium.', 'IMI Studios Tambaú', 250000, 600000, NOW() - INTERVAL '1 day'),

    (gen_random_uuid(), 'Ricardo Mendes', 'ricardo.mendes@email.com', '(81) 99723-4567', 'indicacao', 'em_negociacao', 78,
     'Busca apartamento em Recife para família. 3 quartos mínimo. Prazo: 6 meses.', 'Grand Tower Boa Viagem', 1000000, 2500000, NOW() - INTERVAL '5 days'),

    (gen_random_uuid(), 'Fernanda Oliveira', 'fernanda.oliveira@email.com', '(83) 99634-5678', 'website', 'novo', 65,
     'Primeiro imóvel, buscando financiamento. Interessada em Manaíra.', 'Edifício Solar dos Ventos', 350000, 600000, NOW() - INTERVAL '3 hours'),

    (gen_random_uuid(), 'João Pedro Almeida', 'joao.almeida@email.com', '(83) 99545-6789', 'whatsapp', 'qualificado', 88,
     'Empresário, busca casa no Altiplano para família. Pagamento à vista.', 'Condomínio Recanto do Sol', 900000, 1800000, NOW() - INTERVAL '12 hours'),

    (gen_random_uuid(), 'Mariana Costa', 'mariana.costa@email.com', '(81) 99456-7890', 'google_ads', 'novo', 55,
     'Pesquisando opções. Ainda indefinida sobre cidade (JP ou Recife).', NULL, 400000, 900000, NOW() - INTERVAL '6 hours'),

    (gen_random_uuid(), 'Lucas Ferreira', 'lucas.ferreira@email.com', '(83) 99367-8901', 'facebook', 'perdido', 30,
     'Não respondeu últimas 3 tentativas de contato. Mover para cold.', 'Residencial Brisa do Mar', 700000, 1200000, NOW() - INTERVAL '15 days'),

    (gen_random_uuid(), 'Patricia Lima', 'patricia.lima@email.com', '(83) 99278-9012', 'evento', 'qualificado', 95,
     'Conheceu no evento IMI Open House. Muito interessada, agendou visita para sábado.', 'Residencial Brisa do Mar', 1500000, 2200000, NOW() - INTERVAL '1 day'),

    (gen_random_uuid(), 'Roberto Nascimento', 'roberto.nascimento@email.com', '(81) 99189-0123', 'linkedin', 'novo', 70,
     'CEO de startup. Busca flat para estadias em JP. Pool de locação é prioridade.', 'IMI Studios Tambaú', 280000, 450000, NOW() - INTERVAL '4 hours'),

    (gen_random_uuid(), 'Camila Rodrigues', 'camila.rodrigues@email.com', '(83) 99090-1234', 'indicacao', 'em_negociacao', 82,
     'Indicada pela Patricia Lima. Casal jovem, primeiro imóvel. Pré-aprovada no banco.', 'Edifício Solar dos Ventos', 420000, 700000, NOW() - INTERVAL '8 hours')
ON CONFLICT DO NOTHING;

-- ── 4. VERIFICAÇÃO ────────────────────────────────────────────
DO $$
BEGIN
    RAISE NOTICE '=== SEED DATA VERIFICAÇÃO ===';
    RAISE NOTICE 'Construtoras: %', (SELECT count(*) FROM developers);
    RAISE NOTICE 'Imóveis: %', (SELECT count(*) FROM developments);
    RAISE NOTICE 'Leads: %', (SELECT count(*) FROM leads);
END $$;
