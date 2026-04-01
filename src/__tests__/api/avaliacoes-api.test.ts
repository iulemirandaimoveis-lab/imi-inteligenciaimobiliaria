/**
 * @jest-environment node
 */

/**
 * Integration tests for /api/avaliacoes route handlers (GET, POST)
 * Covers: auth guards, validation, creation, single fetch by ID
 */

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockGetUser = jest.fn()
const mockFrom = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}))

jest.mock('@/lib/notifications', () => ({
  createNotification: jest.fn().mockResolvedValue(undefined),
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

// Mock the avaliacaoSchema with a minimal zod-like object that has .partial().safeParse()
const mockSafeParse = jest.fn()
jest.mock('@/lib/schemas', () => ({
  avaliacaoSchema: {
    partial: () => ({ safeParse: mockSafeParse }),
  },
  avaliacaoUpdateSchema: {
    partial: () => ({ safeParse: jest.fn().mockReturnValue({ success: true, data: {} }) }),
  },
}))

import { GET, POST } from '@/app/api/avaliacoes/route'
import { NextRequest } from 'next/server'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost:3000/api/avaliacoes')
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }
  return new NextRequest(url.toString(), { method: 'GET' })
}

function makePostRequest(body: object) {
  return new NextRequest('http://localhost:3000/api/avaliacoes', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

// ── Tests: GET /api/avaliacoes ───────────────────────────────────────────────

describe('GET /api/avaliacoes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'not authenticated' },
    })

    const req = makeGetRequest()
    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json.error).toBeDefined()
  })

  it('returns avaliacoes list when authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

    const mockData = [
      { id: 'av-1', endereco: 'Rua A, 100', status: 'aguardando_docs' },
      { id: 'av-2', endereco: 'Rua B, 200', status: 'em_andamento' },
    ]

    const mockRange = jest.fn().mockResolvedValue({
      data: mockData,
      error: null,
      count: 2,
    })
    const mockOrder = jest.fn().mockReturnValue({ range: mockRange })
    const mockSelectAll = jest.fn().mockReturnValue({
      order: mockOrder,
      eq: jest.fn().mockReturnValue({ range: mockRange }),
    })
    mockFrom.mockReturnValue({ select: mockSelectAll })

    const req = makeGetRequest()
    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.data).toHaveLength(2)
    expect(json.pagination).toBeDefined()
    expect(json.pagination.total).toBe(2)
  })

  it('returns single avaliacao when id is provided', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

    const mockData = { id: 'av-1', endereco: 'Rua A, 100', status: 'concluida' }
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockData, error: null }),
        }),
      }),
    })

    const req = makeGetRequest({ id: 'av-1' })
    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.id).toBe('av-1')
    expect(json.endereco).toBe('Rua A, 100')
  })

  it('returns 500 on database error for single fetch', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
        }),
      }),
    })

    const req = makeGetRequest({ id: 'bad-id' })
    const res = await GET(req)

    expect(res.status).toBe(500)
  })
})

// ── Tests: POST /api/avaliacoes ──────────────────────────────────────────────

describe('POST /api/avaliacoes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'not authenticated' },
    })

    const req = makePostRequest({ endereco: 'Rua A, 100' })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json.error).toBeDefined()
  })

  it('returns 400 when required fields are missing (no endereco)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

    // apiHandler validates with avaliacaoPostSchema which requires endereco.min(1)
    // So this will be caught by apiHandler's schema validation as 'Validation failed'
    const req = makePostRequest({ tipo_imovel: 'apartamento' })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toBeDefined()
  })

  it('returns 400 when schema validation fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockSafeParse.mockReturnValue({
      success: false,
      error: {
        flatten: () => ({ fieldErrors: { endereco: ['Endereco invalido'] } }),
      },
    })

    // Send a valid body that passes apiHandler's avaliacaoPostSchema validation
    // but fails the internal avaliacaoSchema.partial().safeParse() in the handler
    const req = makePostRequest({ endereco: 'Rua A, 100' })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toBe('Dados inválidos')
    expect(json.details).toBeDefined()
  })

  it('creates avaliacao with valid data', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockSafeParse.mockReturnValue({ success: true, data: {} })

    const createdData = { id: 'av-new', endereco: 'Rua A, 100', status: 'aguardando_docs' }
    mockFrom.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: createdData, error: null }),
        }),
      }),
    })

    const req = makePostRequest({
      endereco: 'Rua A, 100',
      tipo_imovel: 'apartamento',
      cidade: 'Recife',
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.data).toBeDefined()
    expect(json.data.id).toBe('av-new')
  })
})
