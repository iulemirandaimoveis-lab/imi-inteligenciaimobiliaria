/**
 * @jest-environment node
 */

/**
 * POST /api/video-call — cria uma sala Daily.co sob demanda e avisa o corretor
 * por WhatsApp. Sem DAILY_API_KEY configurada, deve degradar graciosamente
 * (503) em vez de quebrar — o cliente cai no fallback de WhatsApp.
 */

const mockCreateDailyRoom: jest.Mock = jest.fn()
const mockIsDailyConfigured: jest.Mock = jest.fn()
const mockSendWhatsAppText: jest.Mock = jest.fn(async () => ({ ok: true }))

jest.mock('@/lib/video-call/daily', () => ({
  createDailyRoom: (opts?: unknown) => mockCreateDailyRoom(opts),
  isDailyConfigured: () => mockIsDailyConfigured(),
}))

jest.mock('@/lib/notifications/whatsapp', () => ({
  sendWhatsAppText: (phone?: string, text?: string) => mockSendWhatsAppText(phone, text),
}))

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn(async () => ({ success: true, remaining: 4, resetTime: Date.now() + 60000 })),
  getClientIP: jest.fn(() => '10.0.0.1'),
}))

import { POST } from '@/app/api/video-call/route'
import { NextRequest } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/video-call', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

const VALID_BODY = { brokerName: 'Ana', brokerPhone: '5581999999999', clientName: 'Maria', context: 'Alto Bellevue — L-22' }

beforeEach(() => {
  jest.clearAllMocks()
  ;(rateLimit as jest.Mock).mockResolvedValue({ success: true, remaining: 4, resetTime: Date.now() + 60000 })
  mockIsDailyConfigured.mockReturnValue(true)
})

describe('POST /api/video-call', () => {
  it('Daily.co not configured → 503, no room created', async () => {
    mockIsDailyConfigured.mockReturnValue(false)
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(503)
    expect(mockCreateDailyRoom).not.toHaveBeenCalled()
  })

  it('invalid body → 400', async () => {
    const res = await POST(makeRequest({ brokerName: 'Ana' }))
    expect(res.status).toBe(400)
    expect(mockCreateDailyRoom).not.toHaveBeenCalled()
  })

  it('room creation fails → 503, no WhatsApp sent', async () => {
    mockCreateDailyRoom.mockResolvedValue(null)
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(503)
    expect(mockSendWhatsAppText).not.toHaveBeenCalled()
  })

  it('success → 200, returns roomUrl and notifies the broker', async () => {
    mockCreateDailyRoom.mockResolvedValue({ url: 'https://imi.daily.co/abc123', name: 'abc123' })
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.roomUrl).toBe('https://imi.daily.co/abc123')
    expect(mockSendWhatsAppText).toHaveBeenCalledWith('5581999999999', expect.stringContaining('https://imi.daily.co/abc123'))
  })

  it('rate limited → 429 before checking Daily.co config', async () => {
    ;(rateLimit as jest.Mock).mockResolvedValue({ success: false, remaining: 0, resetTime: Date.now() + 60000 })
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(429)
    expect(mockIsDailyConfigured).not.toHaveBeenCalled()
  })
})
