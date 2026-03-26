/**
 * @jest-environment node
 */

/**
 * Tests for src/lib/api-helpers.ts — apiHandler wrapper
 * Covers: JSON parsing, Zod validation, auth guard, handler execution, error catching
 */

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockGetUser = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: jest.fn(),
  })),
}))

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn().mockResolvedValue({ success: true, remaining: 10, resetTime: Date.now() + 60000 }),
  getClientIP: jest.fn(() => '127.0.0.1'),
  limiters: {
    public: jest.fn().mockResolvedValue({ success: true, remaining: 10, resetTime: Date.now() + 60000 }),
    auth: jest.fn().mockResolvedValue({ success: true, remaining: 10, resetTime: Date.now() + 60000 }),
    ai: jest.fn().mockResolvedValue({ success: true, remaining: 10, resetTime: Date.now() + 60000 }),
  },
}))

import { apiHandler } from '@/lib/api-helpers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makePostRequest(body: object | string) {
  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body)
  return new NextRequest('http://localhost:3000/api/test', {
    method: 'POST',
    body: bodyStr,
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeGetRequest() {
  return new NextRequest('http://localhost:3000/api/test', { method: 'GET' })
}

const testSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
})

// ── Tests ────────────────────────────────────────────────────────────────────

describe('apiHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default: authenticated
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'test@test.com', user_metadata: { role: 'admin' } } },
    })
  })

  it('rejects invalid JSON body with 400', async () => {
    const handler = apiHandler(
      testSchema,
      async () => NextResponse.json({ ok: true }),
      { auth: true }
    )

    // Create a request with invalid JSON
    const req = new NextRequest('http://localhost:3000/api/test', {
      method: 'POST',
      body: 'not-valid-json{{{',
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await handler(req)
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toContain('Invalid JSON')
  })

  it('validates Zod schema and returns 400 on failure', async () => {
    const handler = apiHandler(
      testSchema,
      async () => NextResponse.json({ ok: true }),
      { auth: true }
    )

    const req = makePostRequest({ name: '', email: 'not-an-email' })
    const res = await handler(req)
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toContain('Validation failed')
    expect(json.details).toBeDefined()
  })

  it('returns 401 when auth is required and user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const handler = apiHandler(
      null,
      async () => NextResponse.json({ ok: true }),
      { auth: true }
    )

    const req = makeGetRequest()
    const res = await handler(req)
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json.error).toBe('Unauthorized')
  })

  it('executes handler and returns response on success', async () => {
    const handler = apiHandler(
      testSchema,
      async (_req, body, ctx) => {
        return NextResponse.json({
          received: body,
          userId: ctx.user?.id,
        })
      },
      { auth: true }
    )

    const req = makePostRequest({ name: 'Test User', email: 'test@example.com' })
    const res = await handler(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.received.name).toBe('Test User')
    expect(json.received.email).toBe('test@example.com')
    expect(json.userId).toBe('u1')
  })

  it('catches thrown errors and returns 500', async () => {
    const handler = apiHandler(
      null,
      async () => {
        throw new Error('Something went wrong')
      },
      { auth: true }
    )

    const req = makeGetRequest()
    const res = await handler(req)
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json.error).toBe('Internal server error')
  })

  it('skips auth when auth option is false', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const handler = apiHandler(
      null,
      async (_req, _body, ctx) => {
        return NextResponse.json({ user: ctx.user })
      },
      { auth: false }
    )

    const req = makeGetRequest()
    const res = await handler(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.user).toBeNull()
  })

  it('returns 405 for disallowed methods', async () => {
    const handler = apiHandler(
      null,
      async () => NextResponse.json({ ok: true }),
      { auth: false, methods: ['GET'] }
    )

    const req = makePostRequest({ test: true })
    const res = await handler(req)
    const json = await res.json()

    expect(res.status).toBe(405)
    expect(json.error).toContain('not allowed')
  })

  it('skips schema validation for GET requests even if schema is provided', async () => {
    const handler = apiHandler(
      testSchema,
      async () => NextResponse.json({ ok: true }),
      { auth: true }
    )

    const req = makeGetRequest()
    const res = await handler(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.ok).toBe(true)
  })
})
