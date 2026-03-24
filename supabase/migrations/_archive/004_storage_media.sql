
-- 004: Storage Setup for Media Assets
-- Habilita o bucket para fotos, plantas e vídeos.

-- 1. Criar Bucket 'media' se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de Acesso ao Storage
-- Permitir leitura pública
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT TO public USING (bucket_id = 'media');

-- Permitir upload/delete apenas para usuários autenticados (Admin)
DROP POLICY IF EXISTS "Authenticated Manage Media" ON storage.objects;
CREATE POLICY "Authenticated Manage Media" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'media') WITH CHECK (bucket_id = 'media');
