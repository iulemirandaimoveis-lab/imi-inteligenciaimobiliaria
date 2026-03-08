/**
 * Distributed rate limiter — Upstash Redis (serverless-safe)
 * Falls back to in-memory for local dev when UPSTASH_REDIS_REST_URL is not set
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ─── Types (unchanged public API) ───────────────────────────

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

// ─── Upstash Redis client (lazy singleton) ──────────────────

const hasUpstash = !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
)

let _redis: Redis | null = null
function getRedis(): Redis | null {
    if (!hasUpstash) return null
    if (!_redis) {
        _redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL!,
            token: process.env.UPSTASH_REDIS_REST_TOKEN!,
        })
    }
    return _redis
}

// ─── Upstash Ratelimit instances (cached) ───────────────────

const upstashLimiters = new Map<string, Ratelimit>()

function getUpstashLimiter(prefix: string, limit: number, windowMs: number): Ratelimit {
    const key = `${prefix}:${limit}:${windowMs}`
    let limiter = upstashLimiters.get(key)
    if (!limiter) {
        const redis = getRedis()!
        // Upstash uses sliding window with second precision
        const windowSec = Math.max(1, Math.ceil(windowMs / 1000))
        limiter = new Ratelimit({
            redis,
            prefix: `imi:rl:${prefix}`,
            limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
            analytics: false,
        })
        upstashLimiters.set(key, limiter)
    }
    return limiter
}

// ─── In-memory fallback (dev / missing env) ─────────────────

interface RateLimitEntry {
    count: number
    resetTime: number
}

const memStore = new Map<string, RateLimitEntry>()

// Clean up old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now()
        for (const [key, entry] of memStore.entries()) {
            if (now > entry.resetTime) memStore.delete(key)
        }
    }, 5 * 60 * 1000)
}

function memRateLimit(
    identifier: string,
    { limit = 10, windowMs = 10_000 }: RateLimitConfig = {}
): RateLimitResult {
    const now = Date.now()
    const entry = memStore.get(identifier)

    if (!entry || now > entry.resetTime) {
        const newEntry: RateLimitEntry = { count: 1, resetTime: now + windowMs }
        memStore.set(identifier, newEntry)
        return { success: true, remaining: limit - 1, resetTime: newEntry.resetTime }
    }

    if (entry.count >= limit) {
        return { success: false, remaining: 0, resetTime: entry.resetTime }
    }

    entry.count++
    return { success: true, remaining: limit - entry.count, resetTime: entry.resetTime }
}

// ─── Public API (same signature — drop-in replacement) ──────

/**
 * Check rate limit for a given identifier (IP, user ID, etc.)
 * Uses Upstash Redis when available, in-memory fallback otherwise
 */
export async function rateLimit(
    identifier: string,
    { limit = 10, windowMs = 10_000 }: RateLimitConfig = {}
): Promise<RateLimitResult> {
    if (hasUpstash) {
        try {
            const limiter = getUpstashLimiter('default', limit, windowMs)
            const result = await limiter.limit(identifier)
            return {
                success: result.success,
                remaining: result.remaining,
                resetTime: result.reset,
            }
        } catch (err) {
            // Redis down → graceful fallback to in-memory
            console.warn('[rate-limit] Upstash error, falling back to memory:', err)
            return memRateLimit(identifier, { limit, windowMs })
        }
    }
    return memRateLimit(identifier, { limit, windowMs })
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
