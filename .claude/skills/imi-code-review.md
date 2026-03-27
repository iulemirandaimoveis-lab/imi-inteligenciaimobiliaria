---
name: imi-code-review
description: |
  Code review para stack IMI (Next.js 14 + Supabase + TypeScript + Tailwind).
  TypeScript strict, React patterns, Supabase RLS, security, performance.
  Use quando fazer code review, PR review, ou quality checks.
---

# Code Review — IMI

## TypeScript
- strict mode, no `any`, proper typing, discriminated unions
- Optional chaining para dados do Supabase
- Zod schemas para validação de API input

## React/Next.js
- Server Components por padrão, 'use client' apenas quando necessário
- Não usar getSession() — sempre getUser()
- Data fetching no server, mutations via Server Actions ou API routes
- Imports: @/lib/supabase/server (server), @/lib/supabase/client (client), @/lib/supabase/admin (admin)

## Supabase
- RLS em TODAS as tabelas (zero exceções)
- Service role key NUNCA no client-side
- Queries com .select() explícito (não select *)

## Security
- Input validation em todos os endpoints
- CORS headers, rate limiting, CSP
- Env vars: NEXT_PUBLIC_ apenas para dados públicos

## Performance
- Lazy loading para componentes pesados
- Image optimization via next/image
- ≤3 font families, code splitting

## Design tokens
- Gold: #C8A44A, Navy: #0B1928, Background: #F8F6F2
- Fonts: Playfair Display (display), Geist Sans (body), Geist Mono (data)
