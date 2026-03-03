-- Criar empreendimento de teste
INSERT INTO developments (
    slug,
    name,
    developer,
    status,
    region,
    city,
    state,
    description,
    short_description,
    price_min,
    price_max,
    is_highlighted
) VALUES (
    'residencial-atlantis-teste',
    'Residencial Atlantis Teste',
    'IMI Construtora',
    'launch',
    'pernambuco',
    'Recife',
    'PE',
    'Empreendimento de teste para validar sistema',
    'Teste do sistema IMI Atlantis',
    350000,
    850000,
    true
)
RETURNING id, name, slug;

-- Criar unidade teste
INSERT INTO development_units (
    development_id,
    unit_name,
    unit_type,
    area,
    bedrooms,
    bathrooms,
    parking_spots,
    total_price,
    status
) 
SELECT 
    id,
    'Apto 101',
    '2 quartos',
    65.5,
    2,
    1,
    1,
    450000,
    'available'
FROM developments 
WHERE slug = 'residencial-atlantis-teste'
LIMIT 1;
