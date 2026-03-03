import { NextResponse } from 'next/server'
import { AppError } from './errors'

// In-memory store for rate limiting
// For production with multiple instances, use Redis (e.g., Upstash)
const rateLimitStore = new Map<string, { count: number, resetTime: number }>();

interface RateLimitConfig {
    limit: number;
    windowMs: number;
}

export function rateLimit(ip: string, config: RateLimitConfig = { limit: 5, windowMs: 60 * 1000 }) {
    const now = Date.now();
    const windowData = rateLimitStore.get(ip);

    if (!windowData) {
        rateLimitStore.set(ip, { count: 1, resetTime: now + config.windowMs });
        return { success: true };
    }

    if (now > windowData.resetTime) {
        rateLimitStore.set(ip, { count: 1, resetTime: now + config.windowMs });
        return { success: true };
    }

    if (windowData.count >= config.limit) {
        return { success: false, resetTime: windowData.resetTime };
    }

    windowData.count += 1;
    return { success: true };
}

export function apiSuccess<T>(data: T, status = 200) {
    return NextResponse.json({ success: true, data }, { status });
}

export function apiError(error: unknown, status = 500) {
    console.error('[API Error]:', error);

    if (error instanceof AppError) {
        return NextResponse.json({
            success: false,
            error: { message: error.message, code: error.code, details: error.details }
        }, { status: error.statusCode });
    }

    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({
        success: false,
        error: { message, code: 'INTERNAL_ERROR' }
    }, { status });
}
