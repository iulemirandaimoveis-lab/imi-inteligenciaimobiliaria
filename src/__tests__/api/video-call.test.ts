/**
 * @jest-environment node
 */

/**
 * POST /api/video-call — cria uma sala de vídeo chamada sob demanda (Daily.co
 * quando configurado, senão Jitsi zero-config) e avisa o corretor por WhatsApp.
 * A vídeo chamada só fica indisponível (503) se explicitamente desligada
 * (VIDEO_CALL_DISABLED=1) — caso em que o cliente cai no fallback de WhatsApp.
 */

const mockCreateVideoRoom: jest.Mock = jest.fn()
const mockIsVideoCallEnabled: jest.Mock = jest.fn()
const mockSendWhatsAppText: jest.Mock = jest.fn(async () => ({ ok: true }))

jest.mock('@/lib/video-call/provider', () => ({
  createVideoRoom: (opts?: unknown) => mockCreateVideoRoom(opts),
  isVideoCallEnabled: () => mockIsVideoCallEnabled(),
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
  mockIsVideoCallEnabled.mockReturnValue(true)
  mockCreateVideoRoom.mockResolvedValue({ url: 'https://meet.jit.si/IMIabc123', name: 'IMIabc123', provider: 'jitsi' })
})

describe('POST /api/video-call', () => {
  it('vídeo chamada desligada → 503, nenhuma sala criada', async () => {
    mockIsVideoCallEnabled.mockReturnValue(false)
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(503)
    expect(mockCreateVideoRoom).not.toHaveBeenCalled()
  })

  it('corpo inválido → 400', async () => {
    const res = await POST(makeRequest({ brokerName: 'Ana' }))
    expect(res.status).toBe(400)
    expect(mockCreateVideoRoom).not.toHaveBeenCalled()
  })

  it('criação da sala falha → 503, sem WhatsApp', async () => {
    mockCreateVideoRoom.mockResolvedValue(null)
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(503)
    expect(mockSendWhatsAppText).not.toHaveBeenCalled()
  })

  it('sucesso (Jitsi zero-config) → 200, devolve roomUrl/provider e avisa o corretor', async () => {
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.roomUrl).toBe('https://meet.jit.si/IMIabc123')
    expect(body.provider).toBe('jitsi')
    expect(mockSendWhatsAppText).toHaveBeenCalledWith('5581999999999', expect.stringContaining('https://meet.jit.si/IMIabc123'))
  })

  it('sucesso (Daily.co) → 200, provider daily', async () => {
    mockCreateVideoRoom.mockResolvedValue({ url: 'https://imi.daily.co/abc123', name: 'abc123', provider: 'daily' })
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.roomUrl).toBe('https://imi.daily.co/abc123')
    expect(body.provider).toBe('daily')
  })

  it('rate limited → 429 antes de checar disponibilidade', async () => {
    ;(rateLimit as jest.Mock).mockResolvedValue({ success: false, remaining: 0, resetTime: Date.now() + 60000 })
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(429)
    expect(mockIsVideoCallEnabled).not.toHaveBeenCalled()
  })
})
