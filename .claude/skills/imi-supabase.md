---
name: imi-supabase
description: |
  Padrões Supabase específicos para a plataforma IMI Tech.
  Auth, RLS, Storage, Edge Functions, Realtime.
  Use quando trabalhar com banco de dados, autenticação, storage, ou backend.
---

# Supabase Patterns — IMI

## Schema principal
- developments (imóveis): localização, tipologia, área, preço, status
- avaliacoes (avaliações): imóvel, método NBR, valor, laudo
- leads (pipeline): contato, persona, score, stage, fonte
- documents: matrícula, certidões, laudos
- profiles (usuários): role (admin, corretor, cliente)

## RLS obrigatório em TODAS as tabelas
```sql
CREATE POLICY "Corretor vê seus leads" ON leads FOR SELECT USING (auth.uid() = corretor_id);
```

## Auth patterns
- Email + senha (padrão), Magic link (premium), OAuth Google (equipe)
- Usar `getUser()` nunca `getSession()` (deprecated)
- Server: `@/lib/supabase/server`, Client: `@/lib/supabase/client`, Admin: `@/lib/supabase/admin`

## Storage
- Bucket `imoveis`: fotos públicas, mínimo 1920x1080
- Bucket `laudos`: PDFs privados, acesso por RLS
- Bucket `documentos`: certidões — criptografado

## Performance
- Indexes em colunas de busca (status, created_at, city)
- Realtime apenas onde necessário (chat, notificações)
