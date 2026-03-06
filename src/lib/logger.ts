/**
 * Structured request logger — outputs JSON lines for Vercel log drain / Sentry
 * Usage: logRequest('POST', '/api/leads', user.id, { leadId: data.id })
 */

type LogLevel = 'info' | 'warn' | 'error'

interface LogEntry {
    timestamp: string
    level: LogLevel
    method?: string
    path?: string
    userId?: string
    durationMs?: number
    [key: string]: unknown
}

function log(level: LogLevel, entry: Omit<LogEntry, 'timestamp' | 'level'>) {
    const line: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        ...entry,
    }
    // Vercel captures stdout; JSON format enables log filtering
    console.log(JSON.stringify(line))
}

/** Log an API request/response */
export function logRequest(
    method: string,
    path: string,
    userId?: string,
    meta?: Record<string, unknown>
) {
    log('info', { method, path, userId, ...meta })
}

/** Log a warning (e.g. validation fail, rate limit hit) */
export function logWarn(
    message: string,
    meta?: Record<string, unknown>
) {
    log('warn', { message, ...meta })
}

/** Log an error with optional stack trace */
export function logError(
    message: string,
    error?: unknown,
    meta?: Record<string, unknown>
) {
    const errMeta: Record<string, unknown> = {}
    if (error instanceof Error) {
        errMeta.error = error.message
        errMeta.stack = error.stack
    } else if (error) {
        errMeta.error = String(error)
    }
    log('error', { message, ...errMeta, ...meta })

    // Also forward to Sentry if available
    if (typeof process !== 'undefined' && process.env.SENTRY_DSN) {
        try {
            // Dynamic import to avoid bundling Sentry in non-Sentry builds
            const Sentry = require('@sentry/nextjs')
            if (error instanceof Error) {
                Sentry.captureException(error)
            } else {
                Sentry.captureMessage(message, 'error')
            }
        } catch {
            // Sentry not available — silent fail
        }
    }
}
