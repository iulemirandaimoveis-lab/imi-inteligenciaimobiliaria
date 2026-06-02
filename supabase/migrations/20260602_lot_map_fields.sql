-- Adiciona suporte a mapa de lotes no development_units e developments

ALTER TABLE development_units
  ADD COLUMN IF NOT EXISTS polygon_id    TEXT,
  ADD COLUMN IF NOT EXISTS quadra        TEXT,
  ADD COLUMN IF NOT EXISTS lote_number   TEXT,
  ADD COLUMN IF NOT EXISTS price_per_m2  DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS discount_pct  DECIMAL(5,2) DEFAULT 20,
  ADD COLUMN IF NOT EXISTS map_status    TEXT CHECK (map_status IS NULL OR map_status IN ('disponivel','vendido','negociacao'));

-- Flag e configuração do mapa no empreendimento
ALTER TABLE developments
  ADD COLUMN IF NOT EXISTS lot_map_enabled    BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS lot_map_image_url  TEXT,
  ADD COLUMN IF NOT EXISTS lot_map_amenities  JSONB DEFAULT '[]'::jsonb;

-- RLS: leitura pública para anon (lista de disponibilidade é pública)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'development_units' AND policyname = 'public_read_units'
  ) THEN
    CREATE POLICY "public_read_units"
      ON development_units FOR SELECT TO anon
      USING (true);
  END IF;
END $$;
