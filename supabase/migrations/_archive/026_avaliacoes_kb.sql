-- ====================================================================
-- MIGRAÇÃO 026: Motor de Avaliações — Base de Conhecimento ABNT NBR 14653
-- Tabelas: avaliacoes_kb_pages, avaliacoes_kb_topics
-- Data: 2026-03-14
-- ====================================================================

-- ── Tipos ────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE kb_category AS ENUM (
    'metodologia', 'norma', 'definicao', 'calculo',
    'exemplo', 'formulario', 'checklist', 'jurisprudencia'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE kb_source_type AS ENUM ('image', 'pdf', 'text', 'manual');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── avaliacoes_kb_pages ──────────────────────────────────────────────────────
-- Representa cada página/arquivo fonte processado pelo motor

CREATE TABLE IF NOT EXISTS avaliacoes_kb_pages (
    id           UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    source_file  TEXT         NOT NULL,
    source_type  kb_source_type DEFAULT 'image',
    page_title   TEXT,
    -- Normas ABNT encontradas na página (ex: ['NBR 14653-1', 'NBR 14653-2'])
    normas_citadas TEXT[]     DEFAULT '{}',
    -- Definições técnicas extraídas { "termo": "definição" }
    definicoes   JSONB        DEFAULT '{}',
    session_id   TEXT,        -- agrupa uploads de uma sessão
    processed_at TIMESTAMPTZ  DEFAULT NOW(),
    created_at   TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kb_pages_source_file  ON avaliacoes_kb_pages(source_file);
CREATE INDEX IF NOT EXISTS idx_kb_pages_session_id   ON avaliacoes_kb_pages(session_id);
CREATE INDEX IF NOT EXISTS idx_kb_pages_created_at   ON avaliacoes_kb_pages(created_at DESC);

-- ── avaliacoes_kb_topics ─────────────────────────────────────────────────────
-- Tópicos extraídos de cada página (1 página → N tópicos)

CREATE TABLE IF NOT EXISTS avaliacoes_kb_topics (
    id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    page_id     UUID        REFERENCES avaliacoes_kb_pages(id) ON DELETE CASCADE,
    title       TEXT        NOT NULL,
    content     TEXT        NOT NULL,
    keywords    TEXT[]      DEFAULT '{}',
    category    kb_category DEFAULT 'metodologia',
    -- Denormalizados para queries sem join
    source_file TEXT,
    page_title  TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kb_topics_page_id   ON avaliacoes_kb_topics(page_id);
CREATE INDEX IF NOT EXISTS idx_kb_topics_category  ON avaliacoes_kb_topics(category);
CREATE INDEX IF NOT EXISTS idx_kb_topics_keywords  ON avaliacoes_kb_topics USING GIN(keywords);
-- Full-text search em português
CREATE INDEX IF NOT EXISTS idx_kb_topics_fts ON avaliacoes_kb_topics
  USING GIN(to_tsvector('portuguese', coalesce(title,'') || ' ' || coalesce(content,'')));

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- KB é compartilhada entre todos os usuários autenticados (não multi-tenant)
-- pois é baseada em normas públicas ABNT

ALTER TABLE avaliacoes_kb_pages  ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes_kb_topics ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode ler
CREATE POLICY "kb_pages_read" ON avaliacoes_kb_pages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "kb_topics_read" ON avaliacoes_kb_topics
  FOR SELECT USING (auth.role() = 'authenticated');

-- Apenas service_role pode inserir/deletar (via API routes com supabaseAdmin)
CREATE POLICY "kb_pages_write" ON avaliacoes_kb_pages
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "kb_topics_write" ON avaliacoes_kb_topics
  FOR ALL USING (auth.role() = 'service_role');

-- ── Função de busca semântica básica ────────────────────────────────────────
-- Usada pelo motor para contextualizar as respostas da IA

CREATE OR REPLACE FUNCTION search_kb_topics(
  query_text TEXT,
  filter_category TEXT DEFAULT NULL,
  result_limit INT DEFAULT 8
)
RETURNS TABLE (
  id         UUID,
  title      TEXT,
  content    TEXT,
  keywords   TEXT[],
  category   kb_category,
  source_file TEXT,
  page_title  TEXT,
  relevance  FLOAT
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id, t.title, t.content, t.keywords, t.category,
    t.source_file, t.page_title,
    ts_rank(
      to_tsvector('portuguese', coalesce(t.title,'') || ' ' || coalesce(t.content,'')),
      plainto_tsquery('portuguese', query_text)
    ) AS relevance
  FROM avaliacoes_kb_topics t
  WHERE
    (filter_category IS NULL OR t.category::TEXT = filter_category)
    AND to_tsvector('portuguese', coalesce(t.title,'') || ' ' || coalesce(t.content,''))
        @@ plainto_tsquery('portuguese', query_text)
  ORDER BY relevance DESC
  LIMIT result_limit;
END;
$$;

-- ── Estatísticas rápidas (view) ──────────────────────────────────────────────
CREATE OR REPLACE VIEW avaliacoes_kb_stats AS
SELECT
  (SELECT COUNT(*) FROM avaliacoes_kb_pages)  AS total_pages,
  (SELECT COUNT(*) FROM avaliacoes_kb_topics) AS total_topics,
  (SELECT COUNT(DISTINCT unnest(normas_citadas)) FROM avaliacoes_kb_pages) AS total_normas,
  (SELECT jsonb_object_agg(category, cnt)
   FROM (
     SELECT category::TEXT, COUNT(*) AS cnt
     FROM avaliacoes_kb_topics
     GROUP BY category
   ) sub
  ) AS topics_by_category;
