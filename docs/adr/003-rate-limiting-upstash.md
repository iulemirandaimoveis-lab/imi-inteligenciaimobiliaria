# ADR-003: Rate Limiting with Upstash Redis

## Status
Accepted

## Context
API routes need protection against abuse, especially:
- Public lead capture endpoints (bot spam risk)
- AI-powered endpoints (expensive per-call cost)
- Authentication endpoints (brute force risk)

## Decision
Use **Upstash Redis** with a sliding window algorithm:
- **3 tiers**: Public (10 req/10s), Authenticated (60 req/60s), AI (5 req/60s)
- **Graceful fallback**: In-memory cache when Redis is unavailable
- **Per-identifier**: IP for public, user ID for authenticated

Implementation in `src/lib/rate-limit.ts` (155 lines, 100% test coverage).

## Consequences
- **Positive**: Serverless-compatible (no persistent connections needed)
- **Positive**: Distributed — works across Vercel Edge Functions
- **Positive**: Graceful degradation — app works without Redis
- **Negative**: Additional service dependency (Upstash)
- **Negative**: In-memory fallback is per-instance (not distributed)

## Alternatives Considered
- **Vercel KV**: Similar Redis-based, but Upstash offers better free tier
- **In-memory only**: Doesn't work in serverless (ephemeral instances)
- **Cloudflare Rate Limiting**: Requires Cloudflare as proxy
