# ADR-002: Supabase as Primary Backend Platform

## Status
Accepted

## Context
IMI requires authentication, real-time data, file storage, and a relational database with row-level security for multi-tenant data isolation.

## Decision
Use **Supabase** (PostgreSQL + Auth + Storage + Realtime) as the primary backend:
- **Auth**: Email/password with JWT sessions via `@supabase/ssr`
- **Database**: PostgreSQL with 54 versioned migrations
- **Storage**: Buckets for avatars, developers, media, developments, valuations
- **RLS**: Row-Level Security policies enforce tenant isolation
- **Realtime**: WebSocket subscriptions for live updates (leads, notifications)

## Consequences
- **Positive**: Single vendor for auth + DB + storage + realtime — reduces operational complexity
- **Positive**: RLS at database level provides defense-in-depth security
- **Positive**: Open-source core means no vendor lock-in
- **Negative**: Service role key required for admin operations (user creation, bypassing RLS)
- **Negative**: Migration management is manual (no built-in migration runner in CI)

## Alternatives Considered
- **Firebase**: NoSQL model doesn't fit relational real estate data
- **Custom Express + PostgreSQL**: More flexibility but significantly more infrastructure work
- **Prisma + PlanetScale**: Good for schema management but lacks auth/storage/realtime
