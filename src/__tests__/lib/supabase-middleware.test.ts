/**
 * @jest-environment node
 */

/**
 * Tests for Supabase middleware (updateSession)
 * Verifies: auth redirect logic, env var usage
 *
 * Note: Subscription enforcement is DISABLED for launch phase.
 * Billing redirect tests are skipped.
 */

const mockGetUser = jest.fn()

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn((_url: string, _key: string, _opts: unknown) => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}))

import { updateSession } from '@/lib/supabase/middleware'
import { NextRequest } from 'next/server'

function makeRequest(path: string, cookies: Record<string, string> = {}) {
  const url = `http://localhost:3000${path}`
  const req = new NextRequest(url, { method: 'GET' })
  for (const [name, value] of Object.entries(cookies)) {
    req.cookies.set(name, value)
  }
  return req
}

describe('updateSession', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  })

  it('passes createServerClient the env vars', async () => {
    const { createServerClient } = require('@supabase/ssr')
    mockGetUser.mockResolvedValue({ data: { user: null } })

    await updateSession(makeRequest('/'))

    expect(createServerClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key',
      expect.any(Object)
    )
  })

  it('allows public routes without auth', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const response = await updateSession(makeRequest('/'))

    // Should not redirect
    expect(response.status).not.toBe(307)
    expect(response.status).not.toBe(302)
  })

  it('redirects unauthenticated users from /backoffice to /login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const response = await updateSession(makeRequest('/backoffice'))

    expect(response.status).toBe(307)
    const location = response.headers.get('location')
    expect(location).toContain('/login')
    expect(location).toContain('redirectedFrom=%2Fbackoffice')
  })

  it('redirects unauthenticated users from /backoffice/imoveis to /login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const response = await updateSession(makeRequest('/backoffice/imoveis'))

    expect(response.status).toBe(307)
    const location = response.headers.get('location')
    expect(location).toContain('/login')
    expect(location).toContain('redirectedFrom=%2Fbackoffice%2Fimoveis')
  })

  it('allows authenticated users to access /backoffice', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: 'u1', user_metadata: { subscription_tier: 'pro' } },
      },
    })
    const response = await updateSession(makeRequest('/backoffice'))

    // Should not redirect
    expect(response.status).not.toBe(307)
  })

  it('redirects authenticated users from /login to /backoffice', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: 'u1', user_metadata: {} },
      },
    })
    const response = await updateSession(makeRequest('/login'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/backoffice')
  })

  it.skip('redirects to billing when trial expired and no paid subscription', async () => {
    // Subscription enforcement is DISABLED for launch phase
  })

  it.skip('allows access to /backoffice/billing even with expired trial', async () => {
    // Subscription enforcement is DISABLED for launch phase
  })

  it('does not redirect when user is authenticated with any tier', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'u1',
          user_metadata: {
            subscription_tier: 'starter',
          },
        },
      },
    })
    const response = await updateSession(makeRequest('/backoffice/dashboard'))

    expect(response.status).not.toBe(307)
  })

  it('does not redirect when user has paid tier (pro)', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'u1',
          user_metadata: {
            subscription_tier: 'pro',
          },
        },
      },
    })
    const response = await updateSession(makeRequest('/backoffice/imoveis'))

    // Pro tier should not be redirected
    expect(response.status).not.toBe(307)
  })
})
