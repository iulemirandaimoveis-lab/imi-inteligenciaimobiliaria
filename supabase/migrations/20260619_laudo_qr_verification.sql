-- ============================================================================
-- Migration: 20260619_laudo_qr_verification.sql
-- Description: QR code authentication and digital verification system
--              for appraisal reports (laudos/PTAM).
--
--              Adds:
--                - laudo_seq: Global sequence for sequential report numbering
--                - generate_numero_laudo(): Returns next "IMI-YYYY-NNNNNN"
--                - numero_laudo (TEXT UNIQUE): Unique sequential report number
--                - qr_hash (TEXT UNIQUE): 32-char SHA-256 for integrity check
--                - qr_verificacao_url (TEXT): Full URL for QR code target
--
-- Note: laudo_seq is global (never resets per year). The year is embedded
-- in the label at generation time for human readability, but uniqueness is
-- guaranteed by the global sequence even across year boundaries.
-- ============================================================================

-- Global sequence — never reset, guarantees uniqueness across years
CREATE SEQUENCE IF NOT EXISTS laudo_seq
  START 1
  INCREMENT 1
  NO CYCLE;

-- Function: generate the next sequential laudo number
-- Format: IMI-YYYY-NNNNNN (e.g. IMI-2026-000001)
-- SECURITY DEFINER so authenticated users can call it without owning the sequence
CREATE OR REPLACE FUNCTION generate_numero_laudo()
RETURNS TEXT
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seq_val BIGINT;
BEGIN
  seq_val := nextval('laudo_seq');
  RETURN 'IMI-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(seq_val::TEXT, 6, '0');
END;
$$;

-- Allow authenticated users to call the function
GRANT EXECUTE ON FUNCTION generate_numero_laudo() TO authenticated;

-- Add verification columns to avaliacoes
ALTER TABLE avaliacoes
  ADD COLUMN IF NOT EXISTS numero_laudo       TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS qr_hash            TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS qr_verificacao_url TEXT;

-- Indexes for O(1) lookups from the public verification page
CREATE INDEX IF NOT EXISTS idx_avaliacoes_numero_laudo ON avaliacoes(numero_laudo)
  WHERE numero_laudo IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_avaliacoes_qr_hash ON avaliacoes(qr_hash)
  WHERE qr_hash IS NOT NULL;
