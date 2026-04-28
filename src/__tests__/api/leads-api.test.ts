/**
 * @jest-environment node
 */

/**
 * Integration tests for /api/leads route handlers (GET, POST)
 * Covers: auth guards, validation, filtering, pagination, creation
 */

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockGetUser = jest.fn()
const mockGetSession = jest.fn()
const mockSelect = jest.fn()
const mockNot = jest.fn()
const mockOrder = jest.fn()
const mockRange = jest.fn()
const mockInsert = jest.fn()
const mockSelectAfterInsert = jest.fn()
const mockSingle = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(async () => ({
    auth: {
      getUser: mockGetUser,
      getSession: mockGetSession,
    },
    from: jest.fn((table: string) => {
      if (table === 'leads') {
        return {
          select: mockSelect,
          insert: mockInsert,
        }
      }
      return {}
    }),
  })),
}))

jest.mock('@/lib/governance', () => ({
  logAudit: jest.fn(),
  getRequestMeta: jest.fn(() => ({ ip: '127.0.0.1', user_agent: 'test' })),
}))

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn().mockResolvedValue({ success: true, remaining: 10, resetTime: Date.now() + 60000 }),
  getClientIP: jest.fn().mockReturnValue('127.0.0.1'),
  limiters: {
    public: jest.fn().mockResolvedValue({ success: true, remaining: 10, resetTime: Date.now() + 60000 }),
    auth: jest.fn().mockResolvedValue({ success: true, remaining: 60, resetTime: Date.now() + 60000 }),
    ai: jest.fn().mockResolvedValue({ success: true, remaining: 5, resetTime: Date.now() + 60000 }),
  },
}))

jest.mock('@/lib/notifications', () => ({
  createNotification: jest.fn().mockResolvedValue(undefined),
}))

const mockSafeParse = jest.fn()
jest.mock('@/lib/schemas', () => ({
  leadSchema: {
    safeParse: (...args: unknown[]) => mockSafeParse(...args),
  },
}))

// Suppress fetch fire-and-forget in POST handler
global.fetch = jest.fn().mockResolvedValue({ ok: true }) as jest.Mock

import { GET, POST } from '@/app/api/leads/route'
import { NextRequest } from 'next/server'

// ── Helpers ──────────────────────────────────────────────────────────────────

function createRequest(
  url: string,
  options: { method?: string; body?: Record<string, unknown> } = {}
): NextRequest {
  const { method = 'GET', body } = options
  const fullUrl = url.startsWith('http') ? url : `http://localhost:3000${url}`
  return new NextRequest(fullUrl, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
}

// ── Tests: GET /api/leads ────────────────────────────────────────────────────

describe('GET /api/leads', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Default: authenticated user
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    // Default chain: select -> not -> order -> range resolves with data
    mockRange.mockResolvedValue({
      data: [
        {
          id: '1',
          name: 'Lead A',
          email: 'a@test.com',
          phone: '11999999999',
          source: 'website',
          origin: null,
          status: 'new',
          score: 80,
          ai_score: null,
          interest_type: 'compra',
          interest_location: 'Recife',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          budget_min: 500000,
          budget_max: 1000000,
          capital: null,
          utm_source: null,
          country: 'BR',
          currency: 'BRL',
          language: 'pt',
          tags: ['vip'],
          notes: 'test note',
          assigned_to: null,
        },
      ],
      error: null,
      count: 1,
    })
    mockOrder.mockReturnValue({ range: mockRange })
    mockNot.mockReturnValue({ order: mockOrder })
    mockSelect.mockReturnValue({ not: mockNot })
  })

  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const request = createRequest('/api/leads')
    const response = await GET(request)
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.error).toBeDefined()
  })

  it('returns leads array when authenticated', async () => {
    const request = createRequest('/api/leads?page=1&limit=50')
    const response = await GET(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(json.data)).toBe(true)
    expect(json.data).toHaveLength(1)
    expect(json.data[0].name).toBe('Lead A')
    expect(json.data[0].email).toBe('a@test.com')
  })

  it('returns correct pagination metadata', async () => {
    const request = createRequest('/api/leads?page=1&limit=10')
    const response = await GET(request)
    const json = await response.json()

    expect(json.pagination).toBeDefined()
    expect(json.pagination.page).toBe(1)
    expect(json.pagination.limit).toBe(10)
    expect(json.pagination.total).toBe(1)
    expect(json.pagination.pages).toBe(1)
  })

  it('caps limit at 250', async () => {
    const request = createRequest('/api/leads?limit=500')
    await GET(request)
    expect(mockRange).toHaveBeenCalledWith(0, 249)
  })

  it('respects limit parameter', async () => {
    const request = createRequest('/api/leads?limit=5')
    await GET(request)
    expect(mockRange).toHaveBeenCalledWith(0, 4)
  })

  it('returns 500 when Supabase query fails', async () => {
    mockRange.mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
      count: null,
    })

    const request = createRequest('/api/leads')
    const response = await GET(request)
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.error).toBeTruthy()
    expect(json.data).toEqual([])
  })

  it('defaults missing lead fields to sensible values', async () => {
    mockRange.mockResolvedValue({
      data: [
        {
          id: '2',
          name: null,
          email: null,
          phone: null,
          source: null,
          origin: null,
          status: null,
          score: null,
          ai_score: null,
          interest_type: null,
          interest_location: null,
          created_at: null,
          updated_at: null,
          budget_min: null,
          budget_max: null,
          capital: null,
          utm_source: null,
          country: null,
          currency: null,
          language: null,
          tags: null,
          notes: null,
          assigned_to: null,
        },
      ],
      error: null,
      count: 1,
    })

    const request = createRequest('/api/leads')
    const response = await GET(request)
    const json = await response.json()

    const lead = json.data[0]
    expect(lead.name).toBe('Sem nome')
    expect(lead.email).toBe('')
    expect(lead.phone).toBe('')
    expect(lead.score).toBe(50)
    expect(lead.status).toBe('new')
    expect(lead.source).toBe('website')
    expect(lead.tags).toEqual([])
  })

  it('calculates offset correctly for page 3', async () => {
    const request = createRequest('/api/leads?page=3&limit=20')
    await GET(request)
    // page 3, limit 20 => offset = (3-1)*20 = 40, range = 40..59
    expect(mockRange).toHaveBeenCalledWith(40, 59)
  })
})

// ── Tests: POST /api/leads ───────────────────────────────────────────────────

describe('POST /api/leads', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // apiHandler uses getUser for auth
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'user@test.com' } },
    })

    mockSingle.mockResolvedValue({
      data: { id: 'new-lead-1', name: 'New Lead' },
      error: null,
    })
    mockSelectAfterInsert.mockReturnValue({ single: mockSingle })
    mockInsert.mockReturnValue({ select: mockSelectAfterInsert })
  })

  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const request = createRequest('/api/leads', {
      method: 'POST',
      body: { name: 'Test' },
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.error).toBe('Unauthorized')
  })

  it('returns 400 when name is missing (validation fails)', async () => {
    mockSafeParse.mockReturnValue({
      success: false,
      error: {
        flatten: () => ({ fieldErrors: { name: ['Nome deve ter pelo menos 2 caracteres'] } }),
      },
    })

    const request = createRequest('/api/leads', {
      method: 'POST',
      body: { name: '' },
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toContain('name:')
    expect(json.details).toBeDefined()
  })

  it('creates lead with valid data', async () => {
    mockSafeParse.mockReturnValue({
      success: true,
      data: {
        name: 'New Lead',
        email: 'new@test.com',
        phone: '11999999999',
        source: 'website',
      },
    })

    const request = createRequest('/api/leads', {
      method: 'POST',
      body: { name: 'New Lead', email: 'new@test.com' },
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.lead).toBeDefined()
    expect(json.lead.id).toBe('new-lead-1')
  })

  it('returns 400 with invalid email format', async () => {
    mockSafeParse.mockReturnValue({
      success: false,
      error: {
        flatten: () => ({ fieldErrors: { email: ['Email invalido'] } }),
      },
    })

    const request = createRequest('/api/leads', {
      method: 'POST',
      body: { name: 'Test', email: 'not-an-email' },
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toContain('email:')
  })

  it('returns 500 when Supabase insert fails', async () => {
    mockSafeParse.mockReturnValue({
      success: true,
      data: { name: 'Lead', email: 'x@test.com' },
    })
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: 'Insert failed' },
    })

    const request = createRequest('/api/leads', {
      method: 'POST',
      body: { name: 'Lead' },
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.error).toBeTruthy()
  })

  it('calls logAudit after successful creation', async () => {
    const { logAudit } = await import('@/lib/governance')
    mockSafeParse.mockReturnValue({
      success: true,
      data: { name: 'Audit Lead', email: 'audit@test.com', source: 'manual' },
    })

    const request = createRequest('/api/leads', {
      method: 'POST',
      body: { name: 'Audit Lead' },
    })

    await POST(request)

    expect(logAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'create',
        entity_type: 'lead',
        entity_id: 'new-lead-1',
      })
    )
  })

  it('fires auto-score request after creation', async () => {
    mockSafeParse.mockReturnValue({
      success: true,
      data: { name: 'Score Lead' },
    })

    const request = createRequest('/api/leads', {
      method: 'POST',
      body: { name: 'Score Lead' },
    })

    await POST(request)

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/ai/auto-score'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ lead_id: 'new-lead-1' }),
      })
    )
  })
})
