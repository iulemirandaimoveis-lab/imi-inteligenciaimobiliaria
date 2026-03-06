/**
 * In-memory rate limiter — zero dependencies, production-ready for single-instance
 * For multi-instance/edge deployments, swap to @upstash/ratelimit + Redis
 */

interface RateLimitEntry {
    count: number
    resetTime: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up old entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now()
        for (const [key, entry] of store.entries()) {
            if (now > entry.resetTime) store.delete(key)
        }
    }, 5 * 60 * 1000)
}

export interface RateLimitConfig {
    /** Max requests allowed within the window */
    limit?: number
    /** Window duration in milliseconds */
    windowMs?: number
}

export interface RateLimitResult {
    success: boolean
    /** Remaining requests in the current window */
    remaining: number
    /** Timestamp when the window resets (ms) */
    resetTime: number
}

/**
 * Check rate limit for a given identifier (IP, user ID, etc.)
 */
export function rateLimit(
    identifier: string,
    { limit = 10, windowMs = 10_000 }: RateLimitConfig = {}
): RateLimitResult {
    const now = Date.now()
    const entry = store.get(identifier)

    if (!entry || now > entry.resetTime) {
        const newEntry: RateLimitEntry = { count: 1, resetTime: now + windowMs }
        store.set(identifier, newEntry)
        return { success: true, remaining: limit - 1, resetTime: newEntry.resetTime }
    }

    if (entry.count >= limit) {
        return { success: false, remaining: 0, resetTime: entry.resetTime }
    }

    entry.count++
    return { success: true, remaining: limit - entry.count, resetTime: entry.resetTime }
}

/** Helper to get client IP from Next.js request */
export function getClientIP(request: Request): string {
    return (
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        'unknown'
    )
}

/**
 * Pre-configured limiters for different API categories
 */
export const limiters = {
    /** Public APIs (no auth): 10 req / 10s per IP */
    public: (ip: string) => rateLimit(ip, { limit: 10, windowMs: 10_000 }),
    /** Authenticated APIs: 60 req / 60s per user */
    auth: (userId: string) => rateLimit(`auth:${userId}`, { limit: 60, windowMs: 60_000 }),
    /** AI endpoints: 5 req / 60s per user (expensive) */
    ai: (userId: string) => rateLimit(`ai:${userId}`, { limit: 5, windowMs: 60_000 }),
}
