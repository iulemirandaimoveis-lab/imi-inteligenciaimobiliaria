-- MIGRAÇÃO 014: Backoffice Phase 2 - Core & Infrastructure
-- Descrição: Expansão do schema para Construtoras, Conteúdos, Consultorias e Galeria de Imóveis.

-- 1. EXTENSÃO UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA DEVELOPERS (Construtoras)
CREATE TABLE IF NOT EXISTS developers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    logo_url TEXT,
    description TEXT,
    website TEXT,
    cnpj TEXT,
    phone TEXT,
    email TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- 3. ALTER TABELA DEVELOPMENTS (Imóveis)
ALTER TABLE developments ADD COLUMN IF NOT EXISTS developer_id UUID REFERENCES developers(id);
ALTER TABLE developments ADD COLUMN IF NOT EXISTS gallery_images TEXT[];
ALTER TABLE developments ADD COLUMN IF NOT EXISTS floor_plans TEXT[];
ALTER TABLE developments ADD COLUMN IF NOT EXISTS videos TEXT[];
ALTER TABLE developments ADD COLUMN IF NOT EXISTS virtual_tour_url TEXT;
ALTER TABLE developments ADD COLUMN IF NOT EXISTS brochure_url TEXT;

-- 4. TABELA CONTENT (Conteúdos Institucionais)
CREATE TABLE IF NOT EXISTS content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    content JSONB,
    media_urls TEXT[],
    status TEXT DEFAULT 'draft',
    scheduled_at TIMESTAMP,
    published_at TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- 5. TABELA CONSULTATIONS (Consultorias)
CREATE TABLE IF NOT EXISTS consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT,
    consultation_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    scheduled_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- 6. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('developments', 'developments', true, 10485760, '{image/jpeg,image/png,image/webp}'),
  ('developers', 'developers', true, 5242880, '{image/jpeg,image/png,image/svg+xml}'),
  ('content', 'content', true, 10485760, '{image/jpeg,image/png,image/webp,video/mp4}')
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Políticas de RLS simplificadas para o Backoffice
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth Read Developers" ON developers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth Manage Developers" ON developers FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth Read Content" ON content FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth Manage Content" ON content FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth Read Consultations" ON consultations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth Manage Consultations" ON consultations FOR ALL USING (auth.role() = 'authenticated');

-- Políticas para Storage (simplificadas)
-- Estas políticas assumem que o bucket já existe no esquema do Supabase
CREATE POLICY "Public Read Developments" ON storage.objects FOR SELECT USING (bucket_id = 'developments');
CREATE POLICY "Auth Manage Developments" ON storage.objects FOR ALL USING (bucket_id = 'developments' AND auth.role() = 'authenticated');

CREATE POLICY "Public Read Developers" ON storage.objects FOR SELECT USING (bucket_id = 'developers');
CREATE POLICY "Auth Manage Developers" ON storage.objects FOR ALL USING (bucket_id = 'developers' AND auth.role() = 'authenticated');

CREATE POLICY "Public Read Content" ON storage.objects FOR SELECT USING (bucket_id = 'content');
CREATE POLICY "Auth Manage Content" ON storage.objects FOR ALL USING (bucket_id = 'content' AND auth.role() = 'authenticated');
