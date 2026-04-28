-- ══════════════════════════════════════════════════════════════════════════
-- Jazz Boulevard — SQL COMPLETO PARA EXECUTAR NO SUPABASE
-- Seguro de rodar múltiplas vezes (idempotente)
-- SEM blocos DO $$ para compatibilidade com o editor do Supabase
-- ══════════════════════════════════════════════════════════════════════════

-- ── PARTE 1: Garantir colunas existem em developments ─────────────────────
ALTER TABLE public.developments ADD COLUMN IF NOT EXISTS name                   TEXT;
ALTER TABLE public.developments ADD COLUMN IF NOT EXISTS state                  TEXT;
ALTER TABLE public.developments ADD COLUMN IF NOT EXISTS lat                    DECIMAL(10,7);
ALTER TABLE public.developments ADD COLUMN IF NOT EXISTS lng                    DECIMAL(10,7);
ALTER TABLE public.developments ADD COLUMN IF NOT EXISTS status                 TEXT;
ALTER TABLE public.developments ADD COLUMN IF NOT EXISTS region                 TEXT DEFAULT 'pernambuco';
ALTER TABLE public.developments ADD COLUMN IF NOT EXISTS is_highlighted         BOOLEAN DEFAULT FALSE;
ALTER TABLE public.developments ADD COLUMN IF NOT EXISTS display_order          INT DEFAULT 0;
ALTER TABLE public.developments ADD COLUMN IF NOT EXISTS video_url              TEXT;
ALTER TABLE public.developments ADD COLUMN IF NOT EXISTS tags                   TEXT[];
ALTER TABLE public.developments ADD COLUMN IF NOT EXISTS features               JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.developments ADD COLUMN IF NOT EXISTS images                 JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.developments ADD COLUMN IF NOT EXISTS price_min              DECIMAL(14,2);
ALTER TABLE public.developments ADD COLUMN IF NOT EXISTS price_max              DECIMAL(14,2);
ALTER TABLE public.developments ADD COLUMN IF NOT EXISTS virtual_tour_url       TEXT;
ALTER TABLE public.developments ADD COLUMN IF NOT EXISTS floor_plan_types       JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.developments ADD COLUMN IF NOT EXISTS scrollytelling_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE public.developments ADD COLUMN IF NOT EXISTS concept_description    TEXT;
ALTER TABLE public.developments ADD COLUMN IF NOT EXISTS towers                 JSONB DEFAULT '[]'::jsonb;

-- ── PARTE 2: CP Construção (developer) ────────────────────────────────────
INSERT INTO public.developers (id, name, slug, logo_url, description, website, city, state)
VALUES (
  gen_random_uuid(),
  'CP Construção',
  'cp-construcao',
  NULL,
  'Desde 1987, a CP Construção transforma sonhos em realidade. Fundada pelo engenheiro Clauston Pacas em Santa Cruz do Capibaribe, protagonista na verticalização de Caruaru e agora em Garanhuns com o Jazz Boulevard.',
  'https://www.cpconstrucao.com.br',
  'Caruaru',
  'PE'
) ON CONFLICT (slug) DO NOTHING;

-- ── PARTE 3: Jazz Boulevard (usando SELECT para pegar o developer_id) ─────
INSERT INTO public.developments (
  id,
  name, slug, description,
  type, tipo, property_type,
  status, status_commercial, status_comercial,
  developer_id,
  neighborhood, city, state, country, region,
  address, lat, lng,
  bedrooms, bathrooms, parking_spaces,
  area_from, area_to,
  price_from, price_to, price_min, price_max,
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
)
SELECT
  gen_random_uuid(),

  'Jazz Boulevard',
  'jazz-boulevard-garanhuns',
  'O Jazz Boulevard é o primeiro complexo multiuso de Garanhuns, PE. Composto por duas torres — Fusion Center e Soul Residence — o empreendimento está em frente ao tradicional Relógio das Flores e incorpora a musicalidade e a pluralidade cultural da cidade.',

  'apartment', 'apartamento', 'mixed',

  'launch', 'published', 'publicado',

  d.id,

  'Centro', 'Garanhuns', 'PE', 'Brasil', 'pernambuco',
  'Próximo ao Relógio das Flores, Centro',
  -8.8895, -36.4964,

  4, 4, 3,
  30.40, 167.21,
  405472.00, 1841356.00, 405472.00, 1841356.00,
  19, 200, 180,
  '2027-12-01'::date,

  '["Lojas e Mall no Térreo","Salas Empresariais","Estacionamento Rotativo","Academia","Área Gourmet","Varanda com Vista para as Colinas","Revitalização Rádio Difusora","Tour Virtual 360°","Duas Torres","Portaria 24h","Coworking","Rooftop"]'::jsonb,
  '["lançamento","multiuso","garanhuns","jazz boulevard","fusion center","soul residence","sete colinas","cp construção"]'::jsonb,

  TRUE, TRUE, 1,
  'https://youtube.com/shorts/F04Bu2g4qCE',
  'https://tour.panoee.net/TORRE_SOUL_RESIDENCE',
  TRUE,
  'O empreendimento que celebra a essência da música e da cultura através da arquitetura. Garanhuns ama tradição e a CP Construção ama inovação. E o Jazz Boulevard é a materialização de tudo isso.',

  '[{"id":"fusion-center","name":"Fusion Center","tagline":"Tudo que você precisa num só lugar","description":"13 andares com salas empresariais, lofts, studios e apartamentos com varanda. Lojas no térreo, estacionamento rotativo e áreas comuns exclusivas.","floor_count":13,"image":null},{"id":"soul-residence","name":"Soul Residence","tagline":"O tom certo entre sofisticação e aconchego","description":"19 pavimentos com apartamentos de 95,45m² a 167,21m², com vista privilegiada para as Sete Colinas de Garanhuns.","floor_count":19,"image":null}]'::jsonb,

  '[{"id":"sala-empresarial","name":"Sala Empresarial","tower":"Fusion Center","tower_id":"fusion-center","category":"comercial","area_from":30.40,"area_to":53.31,"bedrooms":0,"bathrooms":1,"parking":0,"price_from":null,"price_to":null,"images":[],"description":"Salas de 30,40m² a 53,31m² para seus negócios em ritmo de pleno crescimento."},{"id":"studio","name":"Studio","tower":"Fusion Center","tower_id":"fusion-center","category":"residencial","area_from":45.77,"area_to":92.31,"bedrooms":1,"bathrooms":1,"parking":1,"price_from":405472,"price_to":974391,"images":[],"description":"Studios de 45,77m² a 92,31m² para morar ou investir."},{"id":"loft","name":"Loft","tower":"Fusion Center","tower_id":"fusion-center","category":"residencial","area_from":46.43,"area_to":61.94,"bedrooms":1,"bathrooms":1,"parking":1,"price_from":509778,"price_to":706530,"images":[],"description":"Lofts de 46,43m² a 61,94m² com varandas voltadas para as colinas da Suíça Pernambucana."},{"id":"apartamento-fusion","name":"Apartamento","tower":"Fusion Center","tower_id":"fusion-center","category":"residencial","area_from":60.87,"area_to":92.31,"bedrooms":2,"bathrooms":2,"parking":1,"price_from":550049,"price_to":974391,"images":[],"description":"Apartamentos de 60,87m² a 92,31m² com varanda e vista para as colinas."},{"id":"soul-tipo-cd","name":"Apartamento 95m²","tower":"Soul Residence","tower_id":"soul-residence","category":"residencial","area_from":95.45,"area_to":96.79,"bedrooms":3,"bathrooms":3,"parking":2,"price_from":870765,"price_to":1051872,"images":[],"description":"Apartamentos de 95,45m² a 96,79m² com toda a estrutura e sofisticação do Soul Residence."},{"id":"soul-tipo-b","name":"Apartamento 120m²","tower":"Soul Residence","tower_id":"soul-residence","category":"residencial","area_from":120.61,"area_to":120.61,"bedrooms":3,"bathrooms":3,"parking":2,"price_from":1110295,"price_to":1329139,"images":[],"description":"Apartamentos de 120,61m² com amplos ambientes e vista privilegiada para as Sete Colinas."},{"id":"soul-tipo-a","name":"Apartamento 167m²","tower":"Soul Residence","tower_id":"soul-residence","category":"residencial","area_from":167.09,"area_to":167.21,"bedrooms":4,"bathrooms":4,"parking":3,"price_from":1538174,"price_to":1841356,"images":[],"description":"167m² de sofisticação absoluta. Para famílias que vivem em grande estilo com vista para as Sete Colinas."}]'::jsonb,

  '{"main":"","gallery":[],"floorPlans":[],"videos":["https://youtube.com/shorts/F04Bu2g4qCE"],"virtualTour":"https://tour.panoee.net/TORRE_SOUL_RESIDENCE"}'::jsonb

FROM public.developers d
WHERE d.slug = 'cp-construcao'
LIMIT 1

ON CONFLICT (slug) DO UPDATE SET
  name                   = EXCLUDED.name,
  virtual_tour_url       = EXCLUDED.virtual_tour_url,
  floor_plan_types       = EXCLUDED.floor_plan_types,
  scrollytelling_enabled = EXCLUDED.scrollytelling_enabled,
  concept_description    = EXCLUDED.concept_description,
  towers                 = EXCLUDED.towers,
  is_highlighted         = EXCLUDED.is_highlighted,
  features               = EXCLUDED.features,
  tags                   = EXCLUDED.tags,
  price_from             = EXCLUDED.price_from,
  price_to               = EXCLUDED.price_to,
  price_min              = EXCLUDED.price_min,
  price_max              = EXCLUDED.price_max,
  developer_id           = EXCLUDED.developer_id,
  video_url              = EXCLUDED.video_url,
  images                 = EXCLUDED.images,
  updated_at             = now();
