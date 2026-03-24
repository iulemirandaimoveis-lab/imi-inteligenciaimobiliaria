-- ============================================================
-- Migration 052: Add responsável fields to developers table
-- ============================================================

ALTER TABLE developers ADD COLUMN IF NOT EXISTS responsavel_nome      TEXT;
ALTER TABLE developers ADD COLUMN IF NOT EXISTS responsavel_cargo     TEXT;
ALTER TABLE developers ADD COLUMN IF NOT EXISTS responsavel_email     TEXT;
ALTER TABLE developers ADD COLUMN IF NOT EXISTS responsavel_telefone  TEXT;
ALTER TABLE developers ADD COLUMN IF NOT EXISTS inscricao_estadual    TEXT;
ALTER TABLE developers ADD COLUMN IF NOT EXISTS inscricao_municipal   TEXT;
ALTER TABLE developers ADD COLUMN IF NOT EXISTS numero                TEXT;
ALTER TABLE developers ADD COLUMN IF NOT EXISTS complemento           TEXT;
ALTER TABLE developers ADD COLUMN IF NOT EXISTS bairro                TEXT;
ALTER TABLE developers ADD COLUMN IF NOT EXISTS cep                   TEXT;
ALTER TABLE developers ADD COLUMN IF NOT EXISTS pais                  TEXT DEFAULT 'Brasil';
