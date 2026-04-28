-- ═══════════════════════════════════════════════════════════════
-- Jazz Boulevard — Schema additions + seed data
-- Adds: virtual_tour_url, floor_plan_types, scrollytelling_enabled
-- Inserts: CP Construção developer + Jazz Boulevard development
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Schema additions ────────────────────────────────────────
ALTER TABLE public.developments
  ADD COLUMN IF NOT EXISTS virtual_tour_url    TEXT,
  ADD COLUMN IF NOT EXISTS floor_plan_types    JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS scrollytelling_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS concept_description TEXT,
  ADD COLUMN IF NOT EXISTS towers              JSONB DEFAULT '[]'::jsonb;

-- ── 2. Developer — CP Construção ───────────────────────────────
INSERT INTO public.developers (id, name, slug, description, logo_url, website, city, state, status)
VALUES (
  gen_random_uuid(),
  'CP Construção',
  'cp-construcao',
  'Desde 1987, a CP Construção transforma sonhos em realidade, construindo o futuro com inovação, segurança e excelência. Fundada pelo engenheiro Clauston Pacas em Santa Cruz do Capibaribe, a empresa é protagonista na verticalização de Caruaru e agora chega a Garanhuns com o Jazz Boulevard, o primeiro complexo multiuso da cidade.',
  NULL,
  'https://www.cpconstrucao.com.br',
  'Caruaru',
  'PE',
  'active'
) ON CONFLICT (slug) DO NOTHING;

-- ── 3. Development — Jazz Boulevard ───────────────────────────
DO $$
DECLARE
  dev_cp UUID;
BEGIN
  SELECT id INTO dev_cp FROM public.developers WHERE slug = 'cp-construcao' LIMIT 1;

  INSERT INTO public.developments (
    id, name, slug, description, status, status_commercial, status_comercial,
    developer_id,
    neighborhood, city, state, country, region,
    address, lat, lng,
    bedrooms, bathrooms, parking_spaces,
    area_from, area_to, price_from, price_to, price_min, price_max,
    floor_count, units_count, available_units,
    delivery_date,
    features, tags,
    is_highlighted, featured, display_order,
    video_url,
    virtual_tour_url,
    scrollytelling_enabled,
    concept_description,
    towers,
    floor_plan_types,
    images
  ) VALUES (
    gen_random_uuid(),
    'Jazz Boulevard',
    'jazz-boulevard-garanhuns',
    'O Jazz Boulevard é o primeiro complexo multiuso de Garanhuns, PE. Composto por duas torres — Fusion Center e Soul Residence — o empreendimento está em frente ao tradicional Relógio das Flores e incorpora a musicalidade e a pluralidade cultural da cidade. No Fusion Center: salas empresariais, lofts, studios e apartamentos com varanda para morar ou investir. No Soul Residence: 19 pavimentos com apartamentos de 95m² a 167m², com vista privilegiada para as Sete Colinas.',
    'launch',
    'published',
    'publicado',
    dev_cp,
    'Centro',
    'Garanhuns',
    'PE',
    'Brasil',
    'pernambuco',
    'Próximo ao Relógio das Flores, Centro',
    -8.8895,
    -36.4964,
    4,
    4,
    3,
    30.40,
    167.21,
    405472.0,
    1841356.0,
    405472.0,
    1841356.0,
    19,
    200,
    180,
    '2027-12-01'::date,
    ARRAY[
      'Lojas e Mall no Térreo',
      'Salas Empresariais',
      'Estacionamento Rotativo',
      'Academia',
      'Área Gourmet',
      'Varanda com Vista para as Colinas',
      'Revitalização Rádio Difusora',
      'Tour Virtual 360°',
      'Duas Torres',
      'Portaria 24h',
      'Coworking',
      'Rooftop'
    ],
    ARRAY['lançamento', 'multiuso', 'garanhuns', 'jazz boulevard', 'fusion center', 'soul residence', 'sete colinas', 'cp construção'],
    TRUE,
    TRUE,
    1,
    NULL,
    'https://tour.panoee.net/TORRE_SOUL_RESIDENCE',
    TRUE,
    'O empreendimento que celebra a essência da música e da cultura através da arquitetura. Garanhuns ama tradição e a CP Construção ama inovação. E o Jazz Boulevard é a materialização de tudo isso.',
    '[
      {
        "id": "fusion-center",
        "name": "Fusion Center",
        "tagline": "Tudo que você precisa num só lugar",
        "description": "13 andares com salas empresariais, lofts, studios e apartamentos com varanda. Lojas no térreo, estacionamento rotativo e áreas comuns exclusivas. Unidades escalonadas com varandas voltadas para as colinas da Suíça Pernambucana.",
        "floor_count": 13,
        "image": null
      },
      {
        "id": "soul-residence",
        "name": "Soul Residence",
        "tagline": "O tom certo entre sofisticação e aconchego",
        "description": "19 pavimentos com apartamentos de 95,45m² a 167,21m², com vista privilegiada para as Sete Colinas de Garanhuns. Estrutura completa com academia e área gourmet.",
        "floor_count": 19,
        "image": null
      }
    ]'::jsonb,
    '[
      {
        "id": "sala-empresarial",
        "name": "Sala Empresarial",
        "tower": "Fusion Center",
        "tower_id": "fusion-center",
        "category": "comercial",
        "area_from": 30.40,
        "area_to": 53.31,
        "bedrooms": 0,
        "bathrooms": 1,
        "parking": 0,
        "price_from": null,
        "price_to": null,
        "images": [],
        "description": "Salas de 30,40m² a 53,31m² para seus negócios em ritmo de pleno crescimento. Dois módulos disponíveis: sala privativa individual e coworking empresarial."
      },
      {
        "id": "studio",
        "name": "Studio",
        "tower": "Fusion Center",
        "tower_id": "fusion-center",
        "category": "residencial",
        "area_from": 45.77,
        "area_to": 92.31,
        "bedrooms": 1,
        "bathrooms": 1,
        "parking": 1,
        "price_from": 405472,
        "price_to": 974391,
        "images": [],
        "description": "Studios de 45,77m² a 92,31m² para morar ou investir. Espaços que aliam estilo e praticidade com ambientes integrados."
      },
      {
        "id": "loft",
        "name": "Loft",
        "tower": "Fusion Center",
        "tower_id": "fusion-center",
        "category": "residencial",
        "area_from": 46.43,
        "area_to": 61.94,
        "bedrooms": 1,
        "bathrooms": 1,
        "parking": 1,
        "price_from": 509778,
        "price_to": 706530,
        "images": [],
        "description": "Lofts de 46,43m² a 61,94m² com varandas voltadas para as colinas da Suíça Pernambucana. Perfeitos para vinhos, chocolates e boas conversas."
      },
      {
        "id": "apartamento-fusion",
        "name": "Apartamento",
        "tower": "Fusion Center",
        "tower_id": "fusion-center",
        "category": "residencial",
        "area_from": 60.87,
        "area_to": 92.31,
        "bedrooms": 2,
        "bathrooms": 2,
        "parking": 1,
        "price_from": 550049,
        "price_to": 974391,
        "images": [],
        "description": "Apartamentos de 60,87m² a 92,31m² com varanda e vista para as colinas. Mais de 3 tipologias disponíveis para morar ou investir."
      },
      {
        "id": "soul-tipo-cd",
        "name": "Apartamento 95m²",
        "tower": "Soul Residence",
        "tower_id": "soul-residence",
        "category": "residencial",
        "area_from": 95.45,
        "area_to": 96.79,
        "bedrooms": 3,
        "bathrooms": 3,
        "parking": 2,
        "price_from": 870765,
        "price_to": 1051872,
        "images": [],
        "description": "Apartamentos de 95,45m² a 96,79m² com toda a estrutura, sofisticação e conforto do Soul Residence."
      },
      {
        "id": "soul-tipo-b",
        "name": "Apartamento 120m²",
        "tower": "Soul Residence",
        "tower_id": "soul-residence",
        "category": "residencial",
        "area_from": 120.61,
        "area_to": 120.61,
        "bedrooms": 3,
        "bathrooms": 3,
        "parking": 2,
        "price_from": 1110295,
        "price_to": 1329139,
        "images": [],
        "description": "Apartamentos de 120,61m² com amplos ambientes e vista privilegiada para as Sete Colinas de Garanhuns."
      },
      {
        "id": "soul-tipo-a",
        "name": "Apartamento 167m²",
        "tower": "Soul Residence",
        "tower_id": "soul-residence",
        "category": "residencial",
        "area_from": 167.09,
        "area_to": 167.21,
        "bedrooms": 4,
        "bathrooms": 4,
        "parking": 3,
        "price_from": 1538174,
        "price_to": 1841356,
        "images": [],
        "description": "O maior apartamento do Soul Residence: 167m² de sofisticação absoluta. Para famílias que vivem em grande estilo com vista permanente para as Sete Colinas."
      }
    ]'::jsonb,
    '{
      "main": "",
      "gallery": [],
      "floorPlans": [],
      "videos": [],
      "virtualTour": "https://tour.panoee.net/TORRE_SOUL_RESIDENCE"
    }'::jsonb
  ) ON CONFLICT (slug) DO UPDATE SET
    virtual_tour_url        = EXCLUDED.virtual_tour_url,
    floor_plan_types        = EXCLUDED.floor_plan_types,
    scrollytelling_enabled  = EXCLUDED.scrollytelling_enabled,
    concept_description     = EXCLUDED.concept_description,
    towers                  = EXCLUDED.towers,
    is_highlighted          = EXCLUDED.is_highlighted,
    featured                = EXCLUDED.featured;

END $$;
