-- Migration to add location fields to developers table
ALTER TABLE developers ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Brasil';
ALTER TABLE developers ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE developers ADD COLUMN IF NOT EXISTS city TEXT;
