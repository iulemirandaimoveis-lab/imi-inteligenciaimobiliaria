/**
 * @jest-environment node
 */

/**
 * Tests for src/lib/rate-limit.ts
 * Covers: in-memory rate limiting, window expiry, different limits,
 *         getClientIP helper, pre-configured limiters
 */

// Ensure no Upstash env vars so we always hit the in-memory path
delete process.env.UPSTASH_REDIS_REST_URL
delete process.env.UPSTASH_REDIS_REST_TOKEN

import { rateLimit, getClientIP, limiters } from '@/lib/rate-limit'

describe('rateLimit (in-memory fallback)', () => {
  it('allows the first request and returns correct remaining count', async () => {
    const result = await rateLimit('test-first-req', { limit: 5, windowMs: 10_000 })
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(4)
    expect(result.resetTime).toBeGreaterThan(Date.now() - 1000)
  })

  it('decrements remaining on subsequent requests', async () => {
    const id = 'test-decrement-' + Date.now()
    const r1 = await rateLimit(id, { limit: 3, windowMs: 10_000 })
    expect(r1.remaining).toBe(2)

    const r2 = await rateLimit(id, { limit: 3, windowMs: 10_000 })
    expect(r2.remaining).toBe(1)

    const r3 = await rateLimit(id, { limit: 3, windowMs: 10_000 })
    expect(r3.remaining).toBe(0)
    expect(r3.success).toBe(true)
  })

  it('rejects requests once the limit is exceeded', async () => {
    const id = 'test-exceed-' + Date.now()
    await rateLimit(id, { limit: 2, windowMs: 10_000 })
    await rateLimit(id, { limit: 2, windowMs: 10_000 })

    const blocked = await rateLimit(id, { limit: 2, windowMs: 10_000 })
    expect(blocked.success).toBe(false)
    expect(blocked.remaining).toBe(0)
  })

  it('resets after the window expires', async () => {
    const id = 'test-expire-' + Date.now()
    await rateLimit(id, { limit: 1, windowMs: 50 })

    const blocked = await rateLimit(id, { limit: 1, windowMs: 50 })
    expect(blocked.success).toBe(false)

    await new Promise(resolve => setTimeout(resolve, 60))

    const renewed = await rateLimit(id, { limit: 1, windowMs: 50 })
    expect(renewed.success).toBe(true)
  })

  it('uses default limit of 10 and windowMs of 10000 when not specified', async () => {
    const id = 'test-defaults-' + Date.now()
    const result = await rateLimit(id)
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(9)
  })

  it('tracks different identifiers independently', async () => {
    const ts = Date.now()
    const id1 = 'user-a-' + ts
    const id2 = 'user-b-' + ts

    await rateLimit(id1, { limit: 1, windowMs: 10_000 })
    const blocked = await rateLimit(id1, { limit: 1, windowMs: 10_000 })
    expect(blocked.success).toBe(false)

    const allowed = await rateLimit(id2, { limit: 1, windowMs: 10_000 })
    expect(allowed.success).toBe(true)
  })
})

describe('getClientIP', () => {
  it('extracts IP from x-forwarded-for header (first entry)', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    })
    expect(getClientIP(req)).toBe('1.2.3.4')
  })

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-real-ip': '10.0.0.1' },
    })
    expect(getClientIP(req)).toBe('10.0.0.1')
  })

  it('returns "unknown" when no IP headers are present', () => {
    const req = new Request('http://localhost')
    expect(getClientIP(req)).toBe('unknown')
  })
})

describe('limiters (pre-configured)', () => {
  it('limiters.public allows 10 requests', async () => {
    const id = 'public-ip-' + Date.now()
    const result = await limiters.public(id)
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(9)
  })

  it('limiters.auth allows 60 requests with auth prefix', async () => {
    const id = 'user-auth-' + Date.now()
    const result = await limiters.auth(id)
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(59)
  })

  it('limiters.ai allows only 5 requests', async () => {
    const id = 'user-ai-' + Date.now()
    const result = await limiters.ai(id)
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(4)
  })
})
