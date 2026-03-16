# ADR-001: Next.js App Router Architecture

## Status
Accepted

## Context
IMI is a full-stack real estate intelligence platform requiring:
- Public website with i18n (PT-BR, EN, AR)
- Protected backoffice admin panel
- Server-side rendering for SEO
- API routes for business logic
- Real-time capabilities

## Decision
Use **Next.js 15 App Router** with route groups:
- `/(backoffice)/` — Protected admin area with auth middleware
- `/[lang]/(website)/` — Public site with i18n support
- `/api/` — REST API routes for CRUD and integrations

## Consequences
- **Positive**: Single deployment, shared types, SSR/ISR out of the box, Vercel Edge runtime
- **Positive**: Route groups enable separate layouts (admin vs. public) with shared components
- **Negative**: Large client components require careful `'use client'` boundary management
- **Negative**: Build times increase with page count (currently ~111 backoffice pages)

## Alternatives Considered
- **Pages Router**: Simpler mental model but lacks layout nesting and server components
- **Separate repos (website + admin)**: Better separation but duplicated types, infra, and deployment complexity
