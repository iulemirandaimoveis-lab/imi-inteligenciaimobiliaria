/**
 * @jest-environment node
 */

/**
 * F-09 contract tests — POST /api/proposals/respond
 * Autorização é pelo TOKEN secreto (não pelo proposal_id). Verifica:
 * token válido, inválido/adulterado, ausente, expirado, replay (estado terminal),
 * e comportamento não-autorizado esperado (403/400/410/409).
 */

const mockUpdateEq = jest.fn().mockResolvedValue({ error: null })
const mockUpdate = jest.fn(() => ({ eq: mockUpdateEq }))
const mockInsert = jest.fn().mockResolvedValue({ error: null })
const mockSingle = jest.fn()

jest.mock('@/lib/supabase/admin', () => ({
  get supabaseAdmin() {
    return {
      from: jest.fn(() => ({
        select: jest.fn(() => ({ eq: jest.fn(() => ({ single: mockSingle })) })),
        update: mockUpdate,
        insert: mockInsert,
      })),
    }
  },
}))

// Rate limit real usaria memória compartilhada entre casos → mock previsível.
jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn(async () => ({ success: true, remaining: 9, resetTime: Date.now() + 60000 })),
  getClientIP: jest.fn(() => '10.0.0.1'),
}))

import { POST } from '@/app/api/proposals/respond/route'
import { NextRequest } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

const VALID_TOKEN = 'a'.repeat(32)

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/proposals/respond', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(rateLimit as jest.Mock).mockResolvedValue({ success: true, remaining: 9, resetTime: Date.now() + 60000 })
})

describe('POST /api/proposals/respond — F-09 IDOR contract', () => {
  it('missing token → 400', async () => {
    const res = await POST(makeRequest({ action: 'accepted' }))
    expect(res.status).toBe(400)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('tampered/too-short token → 400 (schema)', async () => {
    const res = await POST(makeRequest({ token: 'short', action: 'accepted' }))
    expect(res.status).toBe(400)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('invalid/unknown token → 403, no mutation', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'no rows' } })
    const res = await POST(makeRequest({ token: 'z'.repeat(32), action: 'accepted' }))
    expect(res.status).toBe(403)
    expect(mockUpdate).not.toHaveBeenCalled()
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('valid token, respondable state → 200 accepts and records event', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'p1', status: 'viewed', validity_until: null, expires_at: null }, error: null })
    const res = await POST(makeRequest({ token: VALID_TOKEN, action: 'accepted' }))
    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'accepted' }))
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ proposal_id: 'p1', event_type: 'proposal_accepted' }))
  })

  it('expired proposal → 410, marks expired, no accept', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'p1', status: 'viewed', validity_until: '2000-01-01T00:00:00Z', expires_at: null }, error: null })
    const res = await POST(makeRequest({ token: VALID_TOKEN, action: 'accepted' }))
    expect(res.status).toBe(410)
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'expired' }))
    expect(mockUpdate).not.toHaveBeenCalledWith(expect.objectContaining({ status: 'accepted' }))
  })

  it('replay on terminal state (already accepted) → 409, no re-accept', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'p1', status: 'accepted', validity_until: null, expires_at: null }, error: null })
    const res = await POST(makeRequest({ token: VALID_TOKEN, action: 'accepted' }))
    expect(res.status).toBe(409)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('countered without counter payload → 400', async () => {
    const res = await POST(makeRequest({ token: VALID_TOKEN, action: 'countered' }))
    expect(res.status).toBe(400)
  })

  it('rate limited → 429 before any lookup', async () => {
    ;(rateLimit as jest.Mock).mockResolvedValue({ success: false, remaining: 0, resetTime: Date.now() + 60000 })
    const res = await POST(makeRequest({ token: VALID_TOKEN, action: 'accepted' }))
    expect(res.status).toBe(429)
    expect(mockSingle).not.toHaveBeenCalled()
  })
})
