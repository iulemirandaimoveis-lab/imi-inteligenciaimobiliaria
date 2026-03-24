-- PARTE 2: CORREÇÃO DE STORAGE (Execute este DEPOIS)
-- Este script foca na segurança do Storage de Imagens.

-- 1. Habilita acesso público às imagens (para o site exibir as fotos)
DROP POLICY IF EXISTS "Public Access Developments" ON storage.objects;

-- Cria política permissiva para LEITURA (SELECT) no bucket 'developments'
CREATE POLICY "Public Access Developments"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'developments' );

-- Repete o mesmo para o bucket 'content' (Blog Posts)
DROP POLICY IF EXISTS "Public Access Content" ON storage.objects;

CREATE POLICY "Public Access Content"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'content' );

-- 2. Habilita upload apenas para usuários logados (Backoffice)
DROP POLICY IF EXISTS "Auth Manage Developments" ON storage.objects;

CREATE POLICY "Auth Manage Developments"
  ON storage.objects FOR ALL
  USING ( bucket_id = 'developments' AND auth.role() = 'authenticated' )
  WITH CHECK ( bucket_id = 'developments' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Auth Manage Content" ON storage.objects;

CREATE POLICY "Auth Manage Content"
  ON storage.objects FOR ALL
  USING ( bucket_id = 'content' AND auth.role() = 'authenticated' )
  WITH CHECK ( bucket_id = 'content' AND auth.role() = 'authenticated' );
