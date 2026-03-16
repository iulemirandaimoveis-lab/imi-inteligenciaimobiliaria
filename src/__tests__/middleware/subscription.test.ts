/**
 * @jest-environment node
 */

/**
 * Tests for subscription enforcement logic in updateSession middleware
 * Verifies: trial expiration redirects, active trial access, paid tier access, billing exemption
 */

import { NextRequest } from 'next/server'

const mockGetSession = jest.fn()

jest.mock('@supabase/ssr', () => ({
    createServerClient: jest.fn(() => ({
        auth: {
            getSession: mockGetSession,
        },
    })),
}))

import { updateSession } from '@/lib/supabase/middleware'

function createRequest(path: string): NextRequest {
    return new NextRequest(new URL(path, 'http://localhost:3000'), {
        method: 'GET',
    })
}

describe('updateSession — subscription enforcement', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('redirects to /login when accessing /backoffice without session', async () => {
        mockGetSession.mockResolvedValue({ data: { session: null } })

        const req = createRequest('/backoffice/dashboard')
        const res = await updateSession(req)

        expect(res.status).toBe(307)
        const location = res.headers.get('Location')
        expect(location).toContain('/login')
        expect(location).toContain('redirectedFrom=%2Fbackoffice%2Fdashboard')
    })

    it('redirects to /backoffice/billing when trial has expired and tier is starter', async () => {
        const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // yesterday
        mockGetSession.mockResolvedValue({
            data: {
                session: {
                    user: {
                        user_metadata: {
                            subscription_tier: 'starter',
                            trial_ends_at: pastDate,
                        },
                    },
                },
            },
        })

        const req = createRequest('/backoffice/leads')
        const res = await updateSession(req)

        expect(res.status).toBe(307)
        expect(res.headers.get('Location')).toContain('/backoffice/billing')
    })

    it('redirects to /backoffice/billing when trial has expired and no tier is set', async () => {
        const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // week ago
        mockGetSession.mockResolvedValue({
            data: {
                session: {
                    user: {
                        user_metadata: {
                            trial_ends_at: pastDate,
                        },
                    },
                },
            },
        })

        const req = createRequest('/backoffice/contratos')
        const res = await updateSession(req)

        expect(res.status).toBe(307)
        expect(res.headers.get('Location')).toContain('/backoffice/billing')
    })

    it('allows access when trial is still active', async () => {
        const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // next week
        mockGetSession.mockResolvedValue({
            data: {
                session: {
                    user: {
                        user_metadata: {
                            subscription_tier: 'starter',
                            trial_ends_at: futureDate,
                        },
                    },
                },
            },
        })

        const req = createRequest('/backoffice/leads')
        const res = await updateSession(req)

        expect(res.status).toBe(200)
        expect(res.headers.get('Location')).toBeNull()
    })

    it('allows access when user has paid professional tier', async () => {
        const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        mockGetSession.mockResolvedValue({
            data: {
                session: {
                    user: {
                        user_metadata: {
                            subscription_tier: 'professional',
                            trial_ends_at: pastDate, // expired, but tier is paid
                        },
                    },
                },
            },
        })

        const req = createRequest('/backoffice/dashboard')
        const res = await updateSession(req)

        expect(res.status).toBe(200)
        expect(res.headers.get('Location')).toBeNull()
    })

    it('allows access when user has enterprise tier', async () => {
        mockGetSession.mockResolvedValue({
            data: {
                session: {
                    user: {
                        user_metadata: {
                            subscription_tier: 'enterprise',
                            trial_ends_at: null,
                        },
                    },
                },
            },
        })

        const req = createRequest('/backoffice/financeiro')
        const res = await updateSession(req)

        expect(res.status).toBe(200)
        expect(res.headers.get('Location')).toBeNull()
    })

    it('exempts /backoffice/billing from subscription enforcement', async () => {
        const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        mockGetSession.mockResolvedValue({
            data: {
                session: {
                    user: {
                        user_metadata: {
                            subscription_tier: 'starter',
                            trial_ends_at: pastDate,
                        },
                    },
                },
            },
        })

        const req = createRequest('/backoffice/billing')
        const res = await updateSession(req)

        expect(res.status).toBe(200)
        expect(res.headers.get('Location')).toBeNull()
    })

    it('redirects authenticated user from /login to /backoffice', async () => {
        mockGetSession.mockResolvedValue({
            data: {
                session: {
                    user: {
                        user_metadata: {
                            subscription_tier: 'professional',
                        },
                    },
                },
            },
        })

        const req = createRequest('/login')
        const res = await updateSession(req)

        expect(res.status).toBe(307)
        expect(res.headers.get('Location')).toContain('/backoffice')
    })

    it('allows unauthenticated user to access /login', async () => {
        mockGetSession.mockResolvedValue({ data: { session: null } })

        const req = createRequest('/login')
        const res = await updateSession(req)

        expect(res.status).toBe(200)
        expect(res.headers.get('Location')).toBeNull()
    })
})
