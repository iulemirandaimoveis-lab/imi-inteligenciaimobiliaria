-- ═══════════════════════════════════════════════════════════════
-- IMI — Kempinski Laje da Pedra
-- Empreendimento de alto padrão em Canela/RS
-- ═══════════════════════════════════════════════════════════════

-- 1. Expand region check constraint to include Rio Grande do Sul
ALTER TABLE developments DROP CONSTRAINT IF EXISTS developments_region_check;
ALTER TABLE developments ADD CONSTRAINT developments_region_check
    CHECK ((region IS NULL) OR (region = ANY (ARRAY[
        'paraiba', 'pernambuco', 'sao-paulo', 'internacional',
        'rio-de-janeiro', 'bahia', 'ceara', 'minas-gerais',
        'florida', 'dubai', 'portugal', 'alagoas',
        'rio-grande-do-norte', 'santa-catarina', 'sergipe',
        'goias', 'parana', 'rio-grande-do-sul'
    ])));

-- 2. Insert development and units
DO $$
DECLARE
    v_id        UUID := gen_random_uuid();
    v_dev_id    UUID := 'edd19462-5ec9-4b03-b0ae-7f7ffaa2bbd5'; -- Kempinski Hotels
BEGIN

INSERT INTO developments (
    id, slug, name,
    developer, developer_id,
    description,
    status, status_commercial, status_comercial,
    type, tipo, property_type,
    neighborhood, city, state, country, region,
    address, street, street_number,
    lat, lng,
    bedrooms, bathrooms, parking_spaces,
    area_from, area_to,
    price_from, price_to, price_min, price_max, price_per_sqm,
    units_count, available_units, total_units, floor_count,
    delivery_date, completion_date,
    features, amenities, tags,
    is_highlighted, featured, display_order,
    condition,
    metragem, quartos, suites, vagas, tipologias
) VALUES (
    v_id,
    'kempinski-laje-da-pedra',
    'Kempinski Laje da Pedra',
    'Kempinski',
    v_dev_id,
    'Kempinski, a rede de luxo mais antiga da Europa, com mais de 150 anos de tradição. Laje de Pedra, ícone histórico de Canela com vista privilegiada para a Serra Gaúcha. Um resort residencial de altíssimo padrão onde arquitetura contemporânea se funde à natureza exuberante da região. Apartamentos de 1 a 3 suítes com áreas de 53 a 209 m², studios e gardens exclusivos, inseridos em um complexo de lazer completo com spa, restaurante, piscinas aquecidas, trilhas e bosque. Entrega prevista para setembro de 2027.',
    'under_construction',
    'published',
    'publicado',
    'resort',
    'resort',
    'resort',
    'Laje de Pedra',
    'Canela',
    'RS',
    'Brasil',
    'rio-grande-do-sul',
    'Rua Das Flores, 222, Laje de Pedra',
    'Rua Das Flores',
    '222',
    -29.3660,
    -50.8390,
    1, 1, 0,
    53.0, 209.0,
    480075, 16327675, 480075, 16327675, 9058.0,
    195, 19, 195, 3,
    '30/09/2027',
    '2027-09-30',
    '["Bar", "Brinquedoteca", "Elevador social", "Fire place", "Lounge", "Piscina adulto", "Portaria", "Segurança", "Terraço", "Academia", "Acessibilidade", "Ar condicionado central", "Coworking", "Espaço beauty", "Espaço gourmet", "Espaço zen", "Game place", "Gerador", "Hidromassagem", "Ofurô", "Quadra paddle", "Praça", "Porte cochère", "Portaria 24 horas", "Ponto para carro elétrico", "Pista caminhada", "Piscina infantil", "Piscina aquecida", "Lavanderia", "Estacionamento visitantes", "Espaço café", "Deck molhado", "Condomínio fechado", "Auditório", "Restaurante", "Adega", "Bicicletário", "Jardim", "Piscina térmica", "Playground", "Sports bar", "Spa", "Trilhas e bosque"]'::jsonb,
    '["Bar", "Brinquedoteca", "Elevador social", "Fire place", "Lounge", "Piscina adulto", "Portaria", "Segurança", "Terraço", "Academia", "Acessibilidade", "Ar condicionado central", "Coworking", "Espaço beauty", "Espaço gourmet", "Espaço zen", "Game place", "Gerador", "Hidromassagem", "Ofurô", "Quadra paddle", "Praça", "Porte cochère", "Portaria 24 horas", "Ponto para carro elétrico", "Pista caminhada", "Piscina infantil", "Piscina aquecida", "Lavanderia", "Estacionamento visitantes", "Espaço café", "Deck molhado", "Condomínio fechado", "Auditório", "Restaurante", "Adega", "Bicicletário", "Jardim", "Piscina térmica", "Playground", "Sports bar", "Spa", "Trilhas e bosque"]'::jsonb,
    '["alto padrão", "resort residencial", "Canela", "Serra Gaúcha", "kempinski", "laje de pedra", "luxo", "em construção", "rio grande do sul"]'::jsonb,
    true,
    true,
    10,
    'under_construction',
    '53 a 209 m²',
    '1 a 3',
    '0 a 3',
    '0 a 1',
    'Studio, Apartamento, Garden'
);

-- 3. Units from tabela de preços (abril 2026)
INSERT INTO development_units (development_id, unit_name, unit_type, area, tower, bedrooms, bathrooms, parking_spots, total_price, status)
VALUES
    (v_id, 'C217',  'Apartamento', 53.0,  'C', 1, 2, 0, 681595,   'available'),
    (v_id, 'B219',  'Studio',      53.0,  'B', 1, 1, 0, 480076,   'available'),
    (v_id, 'B318',  'Studio',      54.0,  'B', 1, 1, 0, 488749,   'available'),
    (v_id, 'C312',  'Apartamento', 71.0,  'C', 1, 2, 0, 1176466,  'available'),
    (v_id, 'C310',  'Apartamento', 72.0,  'C', 1, 2, 0, 5713972,  'available'),
    (v_id, 'C309',  'Apartamento', 144.0, 'C', 2, 3, 1, 16327675, 'available'),
    (v_id, 'C307',  'Apartamento', 142.0, 'C', 2, 3, 1, 16101157, 'available'),
    (v_id, 'C304',  'Apartamento', 53.0,  'C', 1, 2, 0, 4821164,  'available'),
    (v_id, 'C301',  'Apartamento', 72.0,  'C', 1, 2, 0, 2043255,  'available'),
    (v_id, 'C223',  'Apartamento', 55.0,  'C', 1, 2, 0, 681595,   'available'),
    (v_id, 'A106',  'Garden',      209.0, 'A', 3, 4, 1, 15128099, 'available'),
    (v_id, 'C208',  'Apartamento', 53.0,  'C', 1, 2, 0, 542827,   'available'),
    (v_id, 'C202',  'Apartamento', 54.0,  'C', 1, 2, 0, 542827,   'available'),
    (v_id, 'C121',  'Apartamento', 80.0,  'C', 1, 2, 0, 7244500,  'available'),
    (v_id, 'C007',  'Apartamento', 78.0,  'C', 1, 2, 0, 1471348,  'available'),
    (v_id, 'C252',  'Apartamento', 126.0, 'C', 2, 3, 1, 3279412,  'available'),
    (v_id, 'B127',  'Studio',      68.0,  'B', 1, 1, 0, 4245685,  'available'),
    (v_id, 'B107',  'Studio',      68.0,  'B', 1, 1, 0, 1061421,  'available'),
    (v_id, 'A215',  'Apartamento', 103.0, 'A', 2, 3, 1, 10776959, 'available');

END $$;
