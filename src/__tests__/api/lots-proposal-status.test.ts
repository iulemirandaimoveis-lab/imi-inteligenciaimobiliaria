/**
 * @jest-environment node
 */

/**
 * GET /api/lots/proposal/status — status PÚBLICO e minimalista de uma proposta
 * originada do carrinho de lotes (autorização por token secreto, nunca por id).
 */

const mockSingle = jest.fn()

jest.mock('@/lib/supabase/admin', () => ({
  get supabaseAdmin() {
    return {
      from: jest.fn(() => ({
        select: jest.fn(() => ({ eq: jest.fn(() => ({ single: mockSingle })) })),
      })),
    }
  },
}))

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn(async () => ({ success: true, remaining: 29, resetTime: Date.now() + 60000 })),
  getClientIP: jest.fn(() => '10.0.0.1'),
}))

import { GET } from '@/app/api/lots/proposal/status/route'
import { NextRequest } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

function makeRequest(token: string | null) {
  const url = new URL('http://localhost:3000/api/lots/proposal/status')
  if (token !== null) url.searchParams.set('token', token)
  return new NextRequest(url)
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(rateLimit as jest.Mock).mockResolvedValue({ success: true, remaining: 29, resetTime: Date.now() + 60000 })
})

describe('GET /api/lots/proposal/status', () => {
  it('missing token → 400, no lookup', async () => {
    const res = await GET(makeRequest(null))
    expect(res.status).toBe(400)
    expect(mockSingle).not.toHaveBeenCalled()
  })

  it('too-short token → 400', async () => {
    const res = await GET(makeRequest('short'))
    expect(res.status).toBe(400)
    expect(mockSingle).not.toHaveBeenCalled()
  })

  it('unknown token → 404', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'no rows' } })
    const res = await GET(makeRequest('z'.repeat(32)))
    expect(res.status).toBe(404)
  })

  it('valid token → 200 with only status-shaped fields (no PII)', async () => {
    mockSingle.mockResolvedValue({
      data: {
        status: 'sent',
        signature_status: 'nao_enviada',
        valor_proposta: 258640,
        valor_entrada: 25065,
        pdf_url: null,
        signed_pdf_url: null,
        created_at: '2026-07-06T00:00:00Z',
        updated_at: '2026-07-06T00:00:00Z',
      },
      error: null,
    })
    const res = await GET(makeRequest('a'.repeat(32)))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.proposal.status).toBe('sent')
    expect(body.proposal).not.toHaveProperty('metadata')
    expect(body.proposal).not.toHaveProperty('client')
  })

  it('rate limited → 429 before any lookup', async () => {
    ;(rateLimit as jest.Mock).mockResolvedValue({ success: false, remaining: 0, resetTime: Date.now() + 60000 })
    const res = await GET(makeRequest('a'.repeat(32)))
    expect(res.status).toBe(429)
    expect(mockSingle).not.toHaveBeenCalled()
  })
})
