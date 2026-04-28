-- IMI Academy + Career Journey + Global Market v1
-- Idempotent migration — safe to run multiple times

-- =============================================
-- CAREER LEVELS
-- =============================================
CREATE TABLE IF NOT EXISTS career_levels (
  code        TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  subtitle    TEXT,
  icon        TEXT,
  color       TEXT,
  "order"     INT NOT NULL DEFAULT 0,
  commission  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO career_levels (code, name, subtitle, icon, color, "order", commission) VALUES
  ('candidate', 'Candidato',       'Aprovado no Discovery Day',  '🔍', '#6B6B78', 0, 0),
  ('trainee',   'Trainee',         'Em formação — T1 + T3',      '🌱', '#C5C5CD', 1, 50),
  ('junior',    'Advisor Júnior',  'CIA-1 Certificado',          '⭐', '#C8A44A', 2, 65),
  ('pleno',     'Advisor Pleno',   'CIA-2 Certificado',          '⭐⭐', '#D9BC82', 3, 75),
  ('senior',    'Advisor Sênior',  'CIA-3 ou CIA-4',             '⭐⭐⭐', '#E8D08A', 4, 80),
  ('master',    'Master Partner',  'CIA-M — Elite IMI',          '👑', '#FFD700', 5, 85)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- ACADEMY PILLARS / COURSES
-- =============================================
CREATE TABLE IF NOT EXISTS academy_courses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT UNIQUE NOT NULL,
  pillar        TEXT NOT NULL,
  title         TEXT NOT NULL,
  subtitle      TEXT,
  description   TEXT,
  weeks         INT NOT NULL DEFAULT 1,
  level_required TEXT REFERENCES career_levels(code),
  cia_track     TEXT, -- CIA-1, CIA-2, CIA-3, CIA-4, CIA-M
  order_in_pillar INT DEFAULT 0,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO academy_courses (code, pillar, title, subtitle, weeks, level_required, cia_track, order_in_pillar) VALUES
  -- Foundations (T0–T1)
  ('F-01', 'foundations', 'IMI Academy Onboarding',          'O ecossistema IMI e sua missão', 1, 'trainee', 'CIA-1', 1),
  ('F-02', 'foundations', 'Mercado Imobiliário Brasileiro',  'Estrutura, players e regulação', 2, 'trainee', 'CIA-1', 2),
  ('F-03', 'foundations', 'Mercado Imobiliário Internacional','Diferenças, oportunidades e riscos', 2, 'trainee', 'CIA-1', 3),
  ('F-04', 'foundations', 'Ética e Compliance',              'CRECI, COFECI e boas práticas', 1, 'trainee', 'CIA-1', 4),
  ('F-05', 'foundations', 'Atendimento de Alta Performance', 'Do lead ao fechamento consultivo', 1, 'trainee', 'CIA-1', 5),
  -- Backoffice
  ('BO-01', 'backoffice', 'Plataforma IMI — Overview',       'Módulos e fluxos principais', 1, 'trainee', 'CIA-1', 1),
  ('BO-02', 'backoffice', 'CRM e Pipeline',                  'Gestão de leads e negociação', 1, 'trainee', 'CIA-1', 2),
  -- AI & LLMs
  ('AI-01', 'ai_llm', 'Fundamentos de IA para Imóveis',     'Prompts, copilots e automação', 1, 'trainee', 'CIA-1', 1),
  ('AI-02', 'ai_llm', 'IA Aplicada ao Atendimento',         'Chatbots, análise de leads, avaliação', 1, 'junior', 'CIA-2', 2),
  -- Specialization
  ('SP-01', 'specialization', 'Residencial Alto Padrão',     'Posicionamento e venda de luxo', 2, 'junior', 'CIA-2', 1),
  ('SP-02', 'specialization', 'Corporativo e Escritórios',   'Sale-leaseback, BTS, cap rate', 2, 'junior', 'CIA-2', 2),
  ('SP-03', 'specialization', 'Loteamentos e Incorporação',  'VGV, permuta, SPE', 2, 'junior', 'CIA-2', 3),
  ('SP-04', 'specialization', 'Hotelaria e Short Stay',      'NOI, gestão de ativos, RevPAR', 2, 'pleno', 'CIA-3', 4),
  -- Legal
  ('LG-01', 'legal', 'Contratos Imobiliários',               'Promessa, ITBI, escritura, matrícula', 2, 'junior', 'CIA-2', 1),
  ('LG-02', 'legal', 'Due Diligence Imobiliária',            'Checklist, riscos, laudos técnicos', 2, 'junior', 'CIA-2', 2),
  ('LG-03', 'legal', 'Fundos e SPE',                         'FII, CRI, CRA e estruturas societárias', 3, 'pleno', 'CIA-3', 3),
  -- Tax
  ('TX-01', 'tax', 'Tributação na Compra e Venda',           'ITBI, IRPF ganho capital, DIMOB', 2, 'junior', 'CIA-2', 1),
  ('TX-02', 'tax', 'Estruturação Patrimonial',               'Holdings, doação, planejamento sucessório', 2, 'pleno', 'CIA-3', 2),
  ('TX-03', 'tax', 'Tributação Internacional',               'Remessa, câmbio, CFC rules, paraísos fiscais', 2, 'senior', 'CIA-4', 3),
  -- Agro
  ('AG-01', 'agro', 'Fundamentos Agro',                      'Terras, CAR, ITR, crédito rural', 2, 'junior', 'CIA-2', 1),
  ('AG-02', 'agro', 'Crédito de Carbono',                    'REDD+, mercado voluntário, tokenização', 2, 'pleno', 'CIA-3', 2),
  ('AG-03', 'agro', 'M&A Rural e Arrendamento',              'Valuação, laudos INCRA, licenças', 4, 'senior', 'CIA-4', 3),
  -- Tokenization
  ('TK-01', 'tokenization', 'Blockchain para Imóveis',        'RWA, tokenização, smart contracts', 4, 'pleno', 'CIA-3', 1),
  ('TK-02', 'tokenization', 'Tokenização Avançada',           'Emissão, captação, secondary market', 6, 'senior', 'CIA-4', 2),
  ('TK-03', 'tokenization', 'Compliance Cripto-Imobiliário',  'CVM, BACEN, AML/KYC em RWA', 6, 'senior', 'CIA-M', 3),
  -- International
  ('IN-01', 'international', 'Mercado USA',                   'Flórida, Nova York, Miami — investimento BR', 2, 'junior', 'CIA-2', 1),
  ('IN-02', 'international', 'Mercado UAE / Dubai',           'Freehold, off-plan, Golden Visa', 2, 'junior', 'CIA-2', 2),
  ('IN-03', 'international', 'Europa e Portugal',             'NHR, Golden Visa, permuta internacional', 2, 'pleno', 'CIA-3', 3),
  ('IN-04', 'international', 'América Latina',                'Paraguai, Uruguai, Argentina — oportunidades', 2, 'junior', 'CIA-2', 4),
  -- Advanced
  ('AV-01', 'advanced', 'Deal Structuring Avançado',         'Modelos complexos, co-investment, earnout', 2, 'senior', 'CIA-4', 1),
  ('AV-02', 'advanced', 'CIA-M Case Studies',                'Casos reais analisados por Master Partners', 2, 'master', 'CIA-M', 2)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- CIA CERTIFICATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS academy_certifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  full_name       TEXT,
  description     TEXT,
  level_required  TEXT REFERENCES career_levels(code),
  unlocks_level   TEXT REFERENCES career_levels(code),
  color           TEXT,
  passing_score   INT DEFAULT 70,
  exam_questions  INT DEFAULT 60,
  exam_minutes    INT DEFAULT 90,
  order_n         INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO academy_certifications (code, name, full_name, description, level_required, unlocks_level, color, passing_score, exam_questions, exam_minutes, order_n) VALUES
  ('CIA-1', 'CIA-1', 'Certified IMI Advisor — Nível 1',
   'Certificação de entrada. Cobre fundamentos do mercado, backoffice IMI, ética, atendimento e IA básica. Equivale ao CPA-10.',
   'trainee', 'junior', '#C8A44A', 70, 60, 90, 1),
  ('CIA-2', 'CIA-2', 'Certified IMI Advisor — Nível 2',
   'Especializações residencial/corporativo, jurídico básico, tributação compra/venda e mercados internacionais Tier-1. Equivale ao CPA-20.',
   'junior', 'pleno', '#D9BC82', 70, 80, 90, 2),
  ('CIA-3', 'CIA-3', 'Certified IMI Advisor — Nível 3',
   'Estruturação patrimonial, fundos/SPE, tokenização básica, crédito de carbono e mercados internacionais Tier-2. Equivale ao CEA.',
   'pleno', 'senior', '#E8D08A', 75, 100, 120, 3),
  ('CIA-4', 'CIA-4', 'Certified IMI Advisor — Nível 4',
   'Deals avançados, tributação internacional, M&A rural, tokenização avançada. Equivale ao CFP.',
   'senior', 'senior', '#F0C060', 75, 100, 120, 4),
  ('CIA-M', 'CIA-M', 'Certified IMI Advisor — Master',
   'Elite IMI. Compliance cripto-imobiliário, Case Studies reais, masterclasses com heads de mercado. Equivale ao CFP+CGA.',
   'senior', 'master', '#FFD700', 80, 80, 180, 5)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- ACADEMY ENROLLMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS academy_enrollments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id       UUID REFERENCES academy_courses(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'not_started', -- not_started, in_progress, completed
  progress_pct    INT DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, course_id)
);

-- =============================================
-- CIA EXAM ATTEMPTS
-- =============================================
CREATE TABLE IF NOT EXISTS academy_cert_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cert_code       TEXT REFERENCES academy_certifications(code) ON DELETE CASCADE,
  score           INT CHECK (score BETWEEN 0 AND 100),
  passed          BOOLEAN DEFAULT FALSE,
  attempted_at    TIMESTAMPTZ DEFAULT NOW(),
  next_attempt_at TIMESTAMPTZ
);

-- =============================================
-- CERTIFICATIONS AWARDED
-- =============================================
CREATE TABLE IF NOT EXISTS academy_certifications_awarded (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cert_code       TEXT REFERENCES academy_certifications(code) ON DELETE CASCADE,
  awarded_at      TIMESTAMPTZ DEFAULT NOW(),
  certificate_url TEXT,
  UNIQUE (user_id, cert_code)
);

-- =============================================
-- CAREER MILESTONES
-- =============================================
CREATE TABLE IF NOT EXISTS career_milestones (
  code        TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  icon        TEXT,
  category    TEXT NOT NULL, -- deal, network, performance, learning, special
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO career_milestones (code, title, icon, category) VALUES
  ('first_deal',          'Primeira Operação',                   '🏠', 'deal'),
  ('first_million',       'R$1M em VGV',                         '💰', 'deal'),
  ('ten_deals',           '10 Operações',                        '🎯', 'deal'),
  ('first_international', 'Primeira Operação Internacional',     '🌍', 'deal'),
  ('first_referral',      'Primeiro Referral Enviado',           '🤝', 'network'),
  ('first_partnership',   'Primeira Parceria Ativa',             '🌐', 'network'),
  ('five_star_rating',    '5 Avaliações 5 Estrelas',             '⭐', 'performance'),
  ('cia1_earned',         'CIA-1 Conquistado',                   '🏅', 'learning'),
  ('cia2_earned',         'CIA-2 Conquistado',                   '🥈', 'learning'),
  ('cia3_earned',         'CIA-3 Conquistado',                   '🥇', 'learning'),
  ('carbon_deal',         'Primeiro Deal de Carbono',            '🌿', 'special'),
  ('token_deal',          'Primeira Tokenização',                '⛓️', 'special')
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- ADVISOR MILESTONES (user achievements)
-- =============================================
CREATE TABLE IF NOT EXISTS advisor_milestones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_code  TEXT REFERENCES career_milestones(code) ON DELETE CASCADE,
  earned_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, milestone_code)
);

-- =============================================
-- GEOGRAPHY — CONTINENTS & COUNTRIES
-- =============================================
CREATE TABLE IF NOT EXISTS continents (
  code  TEXT PRIMARY KEY,
  name  TEXT NOT NULL,
  name_pt TEXT
);

INSERT INTO continents (code, name, name_pt) VALUES
  ('SA', 'South America',  'América do Sul'),
  ('NA', 'North America',  'América do Norte'),
  ('EU', 'Europe',         'Europa'),
  ('AS', 'Asia',           'Ásia'),
  ('ME', 'Middle East',    'Oriente Médio'),
  ('OC', 'Oceania',        'Oceania'),
  ('AF', 'Africa',         'África')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS countries (
  code            TEXT PRIMARY KEY, -- ISO 3166-1 alpha-2
  name            TEXT NOT NULL,
  name_pt         TEXT,
  continent_code  TEXT REFERENCES continents(code),
  currency        TEXT DEFAULT 'USD',
  flag_emoji      TEXT,
  is_active       BOOLEAN DEFAULT TRUE
);

INSERT INTO countries (code, name, name_pt, continent_code, currency, flag_emoji) VALUES
  ('BR', 'Brazil',                'Brasil',             'SA', 'BRL', '🇧🇷'),
  ('US', 'United States',         'Estados Unidos',     'NA', 'USD', '🇺🇸'),
  ('PT', 'Portugal',              'Portugal',           'EU', 'EUR', '🇵🇹'),
  ('ES', 'Spain',                 'Espanha',            'EU', 'EUR', '🇪🇸'),
  ('FR', 'France',                'França',             'EU', 'EUR', '🇫🇷'),
  ('IT', 'Italy',                 'Itália',             'EU', 'EUR', '🇮🇹'),
  ('DE', 'Germany',               'Alemanha',           'EU', 'EUR', '🇩🇪'),
  ('GB', 'United Kingdom',        'Reino Unido',        'EU', 'GBP', '🇬🇧'),
  ('AE', 'United Arab Emirates',  'Emirados Árabes',    'ME', 'AED', '🇦🇪'),
  ('CA', 'Canada',                'Canadá',             'NA', 'CAD', '🇨🇦'),
  ('AU', 'Australia',             'Austrália',          'OC', 'AUD', '🇦🇺'),
  ('SG', 'Singapore',             'Singapura',          'AS', 'SGD', '🇸🇬'),
  ('AR', 'Argentina',             'Argentina',          'SA', 'ARS', '🇦🇷'),
  ('PY', 'Paraguay',              'Paraguai',           'SA', 'PYG', '🇵🇾'),
  ('UY', 'Uruguay',               'Uruguai',            'SA', 'UYU', '🇺🇾'),
  ('MX', 'Mexico',                'México',             'NA', 'USD', '🇲🇽'),
  ('PA', 'Panama',                'Panamá',             'NA', 'USD', '🇵🇦')
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- GLOBAL PROPERTIES (International Market)
-- =============================================
CREATE TABLE IF NOT EXISTS global_properties (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id      UUID REFERENCES auth.users(id),
  title           TEXT NOT NULL,
  description     TEXT,
  country_code    TEXT REFERENCES countries(code),
  city            TEXT,
  neighborhood    TEXT,
  address         TEXT,
  lat             DECIMAL(10,7),
  lng             DECIMAL(10,7),
  type            TEXT NOT NULL DEFAULT 'residential', -- residential, commercial, rural, industrial, land, hotel
  listing_type    TEXT NOT NULL DEFAULT 'sale', -- sale, rent, lease, auction
  price           DECIMAL(18,2) NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'USD',
  area_m2         DECIMAL(10,2),
  bedrooms        INT,
  bathrooms       INT,
  parking         INT,
  images          JSONB DEFAULT '[]'::JSONB,
  features        JSONB DEFAULT '[]'::JSONB,
  is_featured     BOOLEAN DEFAULT FALSE,
  is_active       BOOLEAN DEFAULT TRUE,
  views           INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- RLS POLICIES
-- =============================================

-- Career levels: public read
ALTER TABLE career_levels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "career_levels_read" ON career_levels;
CREATE POLICY "career_levels_read" ON career_levels FOR SELECT USING (true);

-- Academy courses: public read
ALTER TABLE academy_courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "academy_courses_read" ON academy_courses;
CREATE POLICY "academy_courses_read" ON academy_courses FOR SELECT USING (true);

-- CIA certifications: public read
ALTER TABLE academy_certifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "academy_certifications_read" ON academy_certifications;
CREATE POLICY "academy_certifications_read" ON academy_certifications FOR SELECT USING (true);

-- Career milestones: public read
ALTER TABLE career_milestones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "career_milestones_read" ON career_milestones;
CREATE POLICY "career_milestones_read" ON career_milestones FOR SELECT USING (true);

-- Enrollments: user sees own
ALTER TABLE academy_enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "academy_enrollments_own" ON academy_enrollments;
CREATE POLICY "academy_enrollments_own" ON academy_enrollments FOR ALL USING (auth.uid() = user_id);

-- Cert attempts: user sees own
ALTER TABLE academy_cert_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cert_attempts_own" ON academy_cert_attempts;
CREATE POLICY "cert_attempts_own" ON academy_cert_attempts FOR ALL USING (auth.uid() = user_id);

-- Certifications awarded: user sees own
ALTER TABLE academy_certifications_awarded ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "certs_awarded_own" ON academy_certifications_awarded;
CREATE POLICY "certs_awarded_own" ON academy_certifications_awarded FOR ALL USING (auth.uid() = user_id);

-- Advisor milestones: user sees own
ALTER TABLE advisor_milestones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "advisor_milestones_own" ON advisor_milestones;
CREATE POLICY "advisor_milestones_own" ON advisor_milestones FOR ALL USING (auth.uid() = user_id);

-- Geography: public read
ALTER TABLE continents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "continents_read" ON continents;
CREATE POLICY "continents_read" ON continents FOR SELECT USING (true);

ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "countries_read" ON countries;
CREATE POLICY "countries_read" ON countries FOR SELECT USING (true);

-- Global properties: authenticated read, advisor owns
ALTER TABLE global_properties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "global_properties_read" ON global_properties;
CREATE POLICY "global_properties_read" ON global_properties FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = TRUE);
DROP POLICY IF EXISTS "global_properties_advisor" ON global_properties;
CREATE POLICY "global_properties_advisor" ON global_properties FOR ALL USING (auth.uid() = advisor_id);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_academy_enrollments_user ON academy_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_cert_attempts_user ON academy_cert_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_certs_awarded_user ON academy_certifications_awarded(user_id);
CREATE INDEX IF NOT EXISTS idx_advisor_milestones_user ON advisor_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_global_properties_country ON global_properties(country_code);
CREATE INDEX IF NOT EXISTS idx_global_properties_active ON global_properties(is_active, is_featured);
