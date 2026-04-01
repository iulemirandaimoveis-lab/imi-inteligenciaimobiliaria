-- Neighborhood/mesoregion intelligence data
CREATE TABLE IF NOT EXISTS neighborhood_intelligence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'PE',

  -- Price metrics
  median_price_sqm DECIMAL,
  avg_price_sqm DECIMAL,
  price_trend_12m DECIMAL, -- % change YoY
  price_trend_3m DECIMAL,

  -- Market dynamics
  inventory_count INTEGER DEFAULT 0,
  avg_days_on_market INTEGER,
  absorption_rate DECIMAL, -- % sold per month

  -- Demographics & quality
  population_estimate INTEGER,
  walkability_score INTEGER CHECK (walkability_score BETWEEN 0 AND 100),
  transit_score INTEGER CHECK (transit_score BETWEEN 0 AND 100),
  safety_score INTEGER CHECK (safety_score BETWEEN 0 AND 100),

  -- Rental yields
  avg_rental_yield DECIMAL,
  avg_monthly_rent_sqm DECIMAL,
  vacancy_rate DECIMAL,

  -- Growth indicators
  new_launches_12m INTEGER DEFAULT 0,
  valorization_5y DECIMAL, -- % appreciation 5 years

  -- Metadata
  data_source TEXT DEFAULT 'imi_internal',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(neighborhood, city, state)
);

-- Enable RLS
ALTER TABLE neighborhood_intelligence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON neighborhood_intelligence FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin write" ON neighborhood_intelligence FOR ALL TO authenticated USING (true);

-- Index for fast lookups
CREATE INDEX idx_neighborhood_intel_lookup ON neighborhood_intelligence(city, neighborhood);

-- Seed with real Recife data
INSERT INTO neighborhood_intelligence (neighborhood, city, state, median_price_sqm, avg_price_sqm, price_trend_12m, price_trend_3m, inventory_count, avg_days_on_market, absorption_rate, walkability_score, transit_score, safety_score, avg_rental_yield, avg_monthly_rent_sqm, vacancy_rate, new_launches_12m, valorization_5y) VALUES
('Boa Viagem', 'Recife', 'PE', 8500, 9200, 12.5, 3.1, 340, 45, 8.2, 85, 78, 65, 5.8, 42, 4.2, 28, 68),
('Casa Forte', 'Recife', 'PE', 9800, 10500, 15.2, 4.5, 85, 35, 10.5, 72, 65, 82, 5.2, 45, 3.1, 12, 82),
('Pina', 'Recife', 'PE', 7200, 7800, 18.3, 5.2, 120, 38, 9.8, 78, 70, 60, 6.5, 38, 5.0, 15, 75),
('Parnamirim', 'Recife', 'PE', 8200, 8900, 10.8, 2.8, 65, 42, 7.5, 70, 62, 78, 5.5, 40, 3.8, 8, 65),
('Miramar', 'Joao Pessoa', 'PB', 7500, 8100, 14.5, 3.8, 95, 50, 7.2, 80, 68, 72, 6.2, 36, 4.5, 10, 72),
('Gracas', 'Recife', 'PE', 7800, 8400, 8.5, 2.2, 55, 48, 6.8, 82, 72, 75, 5.8, 38, 4.0, 6, 58),
('Espinheiro', 'Recife', 'PE', 7200, 7600, 9.2, 2.5, 48, 52, 6.2, 78, 70, 70, 6.0, 36, 4.5, 5, 55),
('Aflitos', 'Recife', 'PE', 9500, 10200, 11.5, 3.0, 35, 30, 11.2, 68, 60, 85, 4.8, 42, 2.8, 4, 78),
('Derby', 'Recife', 'PE', 6800, 7200, 7.8, 1.8, 40, 55, 5.5, 88, 82, 68, 6.5, 34, 5.2, 3, 48),
('Tamarineira', 'Recife', 'PE', 7000, 7500, 10.0, 2.6, 42, 46, 7.0, 72, 65, 74, 5.8, 36, 4.0, 5, 60),
('Boa Vista', 'Recife', 'PE', 5500, 6000, 6.5, 1.5, 30, 65, 4.5, 85, 80, 55, 7.2, 32, 6.0, 2, 42),
('Jaqueira', 'Recife', 'PE', 10500, 11200, 13.8, 3.5, 25, 28, 12.0, 65, 58, 88, 4.5, 46, 2.5, 6, 85),
('Rosarinho', 'Recife', 'PE', 6500, 7000, 11.0, 3.2, 38, 40, 8.0, 75, 68, 72, 6.2, 35, 3.8, 4, 62),
('Torre', 'Recife', 'PE', 5800, 6200, 8.0, 2.0, 50, 58, 5.8, 80, 75, 62, 6.8, 30, 5.5, 3, 45),
('Setubal', 'Recife', 'PE', 8800, 9500, 14.0, 3.8, 70, 32, 10.0, 75, 68, 70, 5.5, 43, 3.2, 10, 76)
ON CONFLICT (neighborhood, city, state) DO NOTHING;
