/**
 * @jest-environment node
 */

/**
 * POST /api/lots/proposal — captação pública a partir do carrinho de lotes.
 * A gravação em public.proposals (para o link /carrinho virar status ao vivo)
 * é best-effort: nunca deve impedir a confirmação por WhatsApp ao cliente.
 */

const mockSingle = jest.fn()
const mockSelect = jest.fn(() => ({ single: mockSingle }))
const mockInsert = jest.fn(() => ({ select: mockSelect }))

jest.mock('@/lib/supabase/admin', () => ({
  get supabaseAdmin() {
    return { from: jest.fn(() => ({ insert: mockInsert })) }
  },
}))

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn(async () => ({ success: true, remaining: 4, resetTime: Date.now() + 60000 })),
  getClientIP: jest.fn(() => '10.0.0.1'),
}))

jest.mock('@/lib/notifications', () => ({
  createNotification: jest.fn(async () => ({})),
}))

jest.mock('@/lib/notifications/proposal-notifications', () => ({
  notifyLotProposal: jest.fn(async () => ({ ok: true })),
}))

import { POST } from '@/app/api/lots/proposal/route'
import { NextRequest } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/lots/proposal', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

const VALID_BODY = {
  developmentName: 'Alto Bellevue',
  developmentSlug: 'alto-bellevue',
  clientName: 'Maria Teste',
  clientPhone: '81999999999',
  lots: [{ id: 'L-22', block: 'L', lot: '22', areaM2: 376, price: 258640 }],
  totalAmount: 258640,
  downPayment: 25065,
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(rateLimit as jest.Mock).mockResolvedValue({ success: true, remaining: 4, resetTime: Date.now() + 60000 })
})

describe('POST /api/lots/proposal', () => {
  it('invalid body → 400, no insert attempted', async () => {
    const res = await POST(makeRequest({ developmentName: 'X' }))
    expect(res.status).toBe(400)
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('valid body → 200 and returns the proposalToken from the new row', async () => {
    mockSingle.mockResolvedValue({ data: { token: 'abc123deadbeef00' }, error: null })
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.proposalToken).toBe('abc123deadbeef00')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'sent',
        valor_proposta: 258640,
        valor_entrada: 25065,
        metadata: expect.objectContaining({ source: 'lot_cart' }),
      })
    )
  })

  it('DB insert failing never blocks the WhatsApp confirmation (best-effort)', async () => {
    mockSingle.mockRejectedValue(new Error('db down'))
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.proposalToken).toBeUndefined()
  })

  it('rate limited → 429 before any processing', async () => {
    ;(rateLimit as jest.Mock).mockResolvedValue({ success: false, remaining: 0, resetTime: Date.now() + 60000 })
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(429)
    expect(mockInsert).not.toHaveBeenCalled()
  })
})
