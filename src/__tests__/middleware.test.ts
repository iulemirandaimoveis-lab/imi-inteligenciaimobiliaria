/**
 * @jest-environment node
 */

/**
 * Tests for Next.js middleware -- locale detection, CORS, route handling
 */
import { NextRequest } from 'next/server'

// Mock external dependencies before importing middleware
jest.mock('@formatjs/intl-localematcher', () => ({
  match: jest.fn((_languages: string[], _locales: string[], defaultLocale: string) => defaultLocale),
}))

jest.mock('negotiator', () => {
  return jest.fn().mockImplementation(() => ({
    languages: () => ['pt-BR', 'pt'],
  }))
})

jest.mock('@/lib/supabase/middleware', () => ({
  updateSession: jest.fn(async (request: NextRequest) => {
    const { NextResponse } = await import('next/server')
    return NextResponse.next({ request: { headers: request.headers } })
  }),
}))

import { middleware, config } from '@/middleware'
import { match } from '@formatjs/intl-localematcher'

const mockedMatch = match as jest.MockedFunction<typeof match>

function createRequest(
  url: string,
  options: { method?: string; headers?: Record<string, string> } = {}
): NextRequest {
  const { method = 'GET', headers = {} } = options
  const base = 'https://www.iulemirandaimoveis.com.br'
  const fullUrl = url.startsWith('http') ? url : base + url
  return new NextRequest(new URL(fullUrl), {
    method,
    headers: new Headers(headers),
  })
}

describe('middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedMatch.mockReturnValue('pt')
  })

  describe('QR short-link redirects', () => {
    it('passes through /l/ routes without redirect', async () => {
      const request = createRequest('/l/abc123')
      const response = await middleware(request)
      expect(response.status).toBe(200)
      expect(response.headers.get('Location')).toBeNull()
    })

    it('passes through /l/ routes with nested paths', async () => {
      const request = createRequest('/l/property/xyz')
      const response = await middleware(request)
      expect(response.status).toBe(200)
    })
  })

  describe('backoffice and API routes', () => {
    it('handles /backoffice routes via updateSession', async () => {
      const { updateSession } = await import('@/lib/supabase/middleware')
      const request = createRequest('/backoffice/dashboard')
      await middleware(request)
      expect(updateSession).toHaveBeenCalledWith(request)
    })

    it('handles /api routes via updateSession', async () => {
      const { updateSession } = await import('@/lib/supabase/middleware')
      const request = createRequest('/api/leads')
      await middleware(request)
      expect(updateSession).toHaveBeenCalledWith(request)
    })

    it('handles /auth routes via updateSession', async () => {
      const { updateSession } = await import('@/lib/supabase/middleware')
      const request = createRequest('/auth/callback')
      await middleware(request)
      expect(updateSession).toHaveBeenCalledWith(request)
    })

    it('handles /login routes via updateSession', async () => {
      const { updateSession } = await import('@/lib/supabase/middleware')
      const request = createRequest('/login')
      await middleware(request)
      expect(updateSession).toHaveBeenCalledWith(request)
    })
  })

  describe('static assets are skipped', () => {
    it('passes through /_next paths', async () => {
      const request = createRequest('/_next/static/chunk.js')
      const response = await middleware(request)
      expect(response.status).toBe(200)
      expect(response.headers.get('Location')).toBeNull()
    })

    it('passes through file paths with extensions', async () => {
      const request = createRequest('/favicon.ico')
      const response = await middleware(request)
      expect(response.status).toBe(200)
    })

    it('passes through /monitoring paths', async () => {
      const request = createRequest('/monitoring')
      const response = await middleware(request)
      expect(response.status).toBe(200)
    })

    it('passes through image files', async () => {
      const request = createRequest('/images/photo.jpg')
      const response = await middleware(request)
      expect(response.status).toBe(200)
    })
  })

  describe('CORS headers', () => {
    it('sets CORS headers on OPTIONS preflight for API routes', async () => {
      const request = createRequest('/api/leads', {
        method: 'OPTIONS',
        headers: { origin: 'https://www.iulemirandaimoveis.com.br' },
      })
      const response = await middleware(request)
      expect(response.status).toBe(204)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
        'https://www.iulemirandaimoveis.com.br'
      )
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET')
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST')
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type')
      expect(response.headers.get('Access-Control-Max-Age')).toBe('86400')
    })

    it('sets CORS Allow-Origin for allowed origins on API responses', async () => {
      const request = createRequest('/api/leads', {
        headers: { origin: 'https://www.iulemirandaimoveis.com.br' },
      })
      const response = await middleware(request)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://www.iulemirandaimoveis.com.br')
    })

    it('does not set Allow-Origin for disallowed origins', async () => {
      const request = createRequest('/api/leads', {
        headers: { origin: 'https://malicious-site.com' },
      })
      const response = await middleware(request)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull()
    })

    it('does not add CORS headers to non-API backoffice routes', async () => {
      const request = createRequest('/backoffice/leads', {
        headers: { origin: 'https://www.iulemirandaimoveis.com.br' },
      })
      const response = await middleware(request)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull()
    })
  })

  describe('locale detection and redirect', () => {
    it('redirects root / to /pt when locale is pt', async () => {
      mockedMatch.mockReturnValue('pt')
      const request = createRequest('/')
      const response = await middleware(request)
      expect(response.status).toBe(307)
      expect(response.headers.get('Location')).toContain('/pt/')
    })

    it('redirects to detected locale (en)', async () => {
      mockedMatch.mockReturnValue('en')
      const request = createRequest('/')
      const response = await middleware(request)
      expect(response.status).toBe(307)
      expect(response.headers.get('Location')).toContain('/en/')
    })

    it('redirects unlocalized path to locale-prefixed path', async () => {
      mockedMatch.mockReturnValue('pt')
      const request = createRequest('/imoveis')
      const response = await middleware(request)
      expect(response.status).toBe(307)
      expect(response.headers.get('Location')).toContain('/pt/imoveis')
    })

    it('does not redirect when locale is already present in path', async () => {
      const request = createRequest('/pt/imoveis')
      const response = await middleware(request)
      expect(response.status).toBe(200)
      expect(response.headers.get('Location')).toBeNull()
    })

    it('does not redirect for /en path', async () => {
      const request = createRequest('/en')
      const response = await middleware(request)
      expect(response.status).toBe(200)
    })

    it('does not redirect for /ja/about', async () => {
      const request = createRequest('/ja/about')
      const response = await middleware(request)
      expect(response.status).toBe(200)
    })
  })

  describe('matcher config', () => {
    it('has a matcher pattern defined', () => {
      expect(config.matcher).toBeDefined()
      expect(Array.isArray(config.matcher)).toBe(true)
      expect(config.matcher.length).toBeGreaterThan(0)
    })
  })
})
