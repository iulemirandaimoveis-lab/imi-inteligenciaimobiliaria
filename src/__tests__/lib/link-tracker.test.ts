/**
 * @jest-environment node
 */

/**
 * Tests for src/lib/link-tracker.ts
 * Covers: parseUserAgent, generateFingerprint (via resolveClick),
 *         resolveClick (unique click, duplicate, bot, missing link)
 */

// ── Mocks ──────────────────────────────────────────────────────────

// Helper: build a chainable query mock
function makeChain(resolvedValue: unknown) {
  const chain: Record<string, jest.Mock> = {}
  const methods = [
    'select', 'insert', 'update', 'upsert', 'eq', 'gte', 'lte',
    'limit', 'order', 'single', 'maybeSingle', 'in', 'or',
  ]
  methods.forEach(m => {
    chain[m] = jest.fn().mockReturnValue(chain)
  })
  chain.single = jest.fn().mockResolvedValue(resolvedValue)
  chain.maybeSingle = jest.fn().mockResolvedValue(resolvedValue)
  return chain
}

// Per-table + per-call overrides (use var for hoisting compatibility with jest.mock)
var fromMock: jest.Mock
var rpcMock: jest.Mock
var trackedLinksResponse: unknown = { data: null, error: null }
var linkClicksUpsertResponse: unknown = { data: { id: 'click-123' }, error: null }
var linkEventsInsertResponse: unknown = { data: null, error: null }

fromMock = jest.fn((table: string) => {
  if (table === 'tracked_links') {
    const chain = makeChain(trackedLinksResponse)
    return chain
  }
  if (table === 'link_clicks') {
    const chain = makeChain(linkClicksUpsertResponse)
    chain.upsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        maybeSingle: jest.fn().mockResolvedValue(linkClicksUpsertResponse),
      }),
    })
    return chain
  }
  if (table === 'link_events') {
    const chain = makeChain(linkEventsInsertResponse)
    chain.insert = jest.fn().mockResolvedValue(linkEventsInsertResponse)
    return chain
  }
  return makeChain({ data: null, error: null })
})

rpcMock = jest.fn().mockResolvedValue({ data: null, error: null })

jest.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: (...args: unknown[]) => fromMock(...args),
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}))

// ── Imports (after mocks) ──────────────────────────────────────────

import { parseUserAgent } from '@/lib/user-agent'
import { resolveClick, type ResolveClickInput } from '@/lib/link-tracker'

// ── Helpers ────────────────────────────────────────────────────────

function makeClickInput(overrides?: Partial<ResolveClickInput>): ResolveClickInput {
  return {
    shortCode: 'abc1234',
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    referrer: 'https://google.com',
    country: 'BR',
    region: 'SP',
    city: 'São Paulo',
    ...overrides,
  }
}

const MOCK_LINK = {
  id: 'link-uuid-001',
  destination_url: 'https://example.com/imovel/123',
  url: null,
  is_active: true,
  expires_at: null,
}

// ── Tests: parseUserAgent ──────────────────────────────────────────

describe('parseUserAgent', () => {
  it('detects Chrome on desktop', () => {
    const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    const result = parseUserAgent(ua)
    expect(result.browser).toBe('Chrome 120')
    expect(result.device_type).toBe('desktop')
    expect(result.os).toContain('macOS')
    expect(result.is_bot).toBe(false)
    expect(result.raw).toBe(ua)
  })

  it('detects Firefox on Windows', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121'
    const result = parseUserAgent(ua)
    expect(result.browser).toBe('Firefox 121')
    expect(result.device_type).toBe('desktop')
    expect(result.os).toBe('Windows 10/11')
    expect(result.is_bot).toBe(false)
  })

  it('detects Safari on iPhone (mobile)', () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17 Mobile/15E148 Safari/604.1'
    const result = parseUserAgent(ua)
    expect(result.browser).toBe('Safari 17')
    expect(result.device_type).toBe('mobile')
    expect(result.os).toContain('iOS')
    expect(result.is_bot).toBe(false)
  })

  it('detects WhatsApp bot', () => {
    const ua = 'WhatsApp/2.23.25.83 A'
    const result = parseUserAgent(ua)
    expect(result.is_bot).toBe(true)
  })

  it('detects Googlebot', () => {
    const ua = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
    const result = parseUserAgent(ua)
    expect(result.is_bot).toBe(true)
  })

  it('detects curl as bot', () => {
    const result = parseUserAgent('curl/7.88.1')
    expect(result.is_bot).toBe(true)
  })

  it('treats empty string as bot with unknown fields', () => {
    const result = parseUserAgent('')
    expect(result.is_bot).toBe(true)
    expect(result.device_type).toBe('unknown')
    expect(result.os).toBe('Unknown')
    expect(result.browser).toBe('Unknown')
    expect(result.raw).toBe('')
  })

  it('treats null as bot with unknown fields', () => {
    const result = parseUserAgent(null)
    expect(result.is_bot).toBe(true)
    expect(result.device_type).toBe('unknown')
    expect(result.browser).toBe('Unknown')
  })
})

// ── Tests: generateFingerprint (tested indirectly via resolveClick) ─

describe('generateFingerprint (via crypto)', () => {
  it('produces deterministic SHA-256 hex output', async () => {
    const encoder = new TextEncoder()
    const data = '192.168.1.1|test-ua|2026-03-31'
    const buf = await crypto.subtle.digest('SHA-256', encoder.encode(data))
    const hash = Array.from(new Uint8Array(buf))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Same input → same output
    const buf2 = await crypto.subtle.digest('SHA-256', encoder.encode(data))
    const hash2 = Array.from(new Uint8Array(buf2))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    expect(hash).toBe(hash2)
    expect(hash).toHaveLength(64) // SHA-256 = 32 bytes = 64 hex chars
  })

  it('produces different hashes for different inputs', async () => {
    const encoder = new TextEncoder()
    const hash1Buf = await crypto.subtle.digest('SHA-256', encoder.encode('input-a'))
    const hash1 = Array.from(new Uint8Array(hash1Buf)).map(b => b.toString(16).padStart(2, '0')).join('')

    const hash2Buf = await crypto.subtle.digest('SHA-256', encoder.encode('input-b'))
    const hash2 = Array.from(new Uint8Array(hash2Buf)).map(b => b.toString(16).padStart(2, '0')).join('')

    expect(hash1).not.toBe(hash2)
  })
})

// ── Tests: resolveClick ────────────────────────────────────────────

describe('resolveClick', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    trackedLinksResponse = { data: { ...MOCK_LINK }, error: null }
    linkClicksUpsertResponse = { data: { id: 'click-123' }, error: null }
    linkEventsInsertResponse = { data: null, error: null }
  })

  it('returns destination_url and click_id for a successful unique click', async () => {
    const result = await resolveClick(makeClickInput())

    expect(result).not.toBeNull()
    expect(result!.destination_url).toBe(MOCK_LINK.destination_url)
    expect(result!.click_id).toBe('click-123')
    expect(result!.is_bot).toBe(false)
    expect(result!.link_id).toBe(MOCK_LINK.id)

    // Should have called from('tracked_links') and from('link_clicks')
    expect(fromMock).toHaveBeenCalledWith('tracked_links')
    expect(fromMock).toHaveBeenCalledWith('link_clicks')

    // Should fire event + increment for unique non-bot click
    expect(fromMock).toHaveBeenCalledWith('link_events')
    expect(rpcMock).toHaveBeenCalledWith('increment_link_clicks', { link_id: MOCK_LINK.id })
  })

  it('returns empty click_id when upsert returns null (duplicate click)', async () => {
    linkClicksUpsertResponse = { data: null, error: null }

    const result = await resolveClick(makeClickInput())

    expect(result).not.toBeNull()
    expect(result!.destination_url).toBe(MOCK_LINK.destination_url)
    expect(result!.click_id).toBe('')
    expect(result!.is_bot).toBe(false)
    expect(result!.link_id).toBe(MOCK_LINK.id)

    // Should NOT fire event or increment for duplicate
    expect(fromMock).not.toHaveBeenCalledWith('link_events')
    expect(rpcMock).not.toHaveBeenCalled()
  })

  it('still inserts click for bot but does not fire event or increment', async () => {
    const botInput = makeClickInput({
      userAgent: 'WhatsApp/2.23.25.83 A',
    })

    const result = await resolveClick(botInput)

    expect(result).not.toBeNull()
    expect(result!.is_bot).toBe(true)
    expect(result!.destination_url).toBe(MOCK_LINK.destination_url)
    expect(result!.click_id).toBe('click-123')

    // Should have inserted the click
    expect(fromMock).toHaveBeenCalledWith('link_clicks')

    // Should NOT fire event or increment for bots
    expect(fromMock).not.toHaveBeenCalledWith('link_events')
    expect(rpcMock).not.toHaveBeenCalled()
  })

  it('returns null when the link does not exist', async () => {
    trackedLinksResponse = { data: null, error: { message: 'not found' } }

    const result = await resolveClick(makeClickInput())

    expect(result).toBeNull()
    // Should not attempt to insert click
    expect(fromMock).not.toHaveBeenCalledWith('link_clicks')
  })

  it('returns null when the link is inactive', async () => {
    trackedLinksResponse = {
      data: { ...MOCK_LINK, is_active: false },
      error: null,
    }

    const result = await resolveClick(makeClickInput())

    expect(result).toBeNull()
  })

  it('returns null when the link is expired', async () => {
    trackedLinksResponse = {
      data: { ...MOCK_LINK, expires_at: '2020-01-01T00:00:00Z' },
      error: null,
    }

    const result = await resolveClick(makeClickInput())

    expect(result).toBeNull()
  })

  it('falls back to url column when destination_url is null', async () => {
    trackedLinksResponse = {
      data: { ...MOCK_LINK, destination_url: null, url: 'https://fallback.com/page' },
      error: null,
    }

    const result = await resolveClick(makeClickInput())

    expect(result).not.toBeNull()
    expect(result!.destination_url).toBe('https://fallback.com/page')
  })

  it('returns result with empty click_id on upsert error (graceful degradation)', async () => {
    linkClicksUpsertResponse = { data: null, error: { message: 'db error' } }

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const result = await resolveClick(makeClickInput())

    expect(result).not.toBeNull()
    expect(result!.destination_url).toBe(MOCK_LINK.destination_url)
    expect(result!.click_id).toBe('')

    expect(consoleSpy).toHaveBeenCalledWith(
      '[LinkTracker] Erro ao registrar clique:',
      expect.objectContaining({ message: 'db error' })
    )

    consoleSpy.mockRestore()
  })
})
