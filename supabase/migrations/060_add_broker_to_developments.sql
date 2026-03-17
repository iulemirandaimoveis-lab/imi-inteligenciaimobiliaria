-- Add broker_id to developments so we can show the realtor card on the website
ALTER TABLE developments ADD COLUMN IF NOT EXISTS broker_id UUID REFERENCES brokers(id) ON DELETE SET NULL;

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_developments_broker_id ON developments(broker_id);
