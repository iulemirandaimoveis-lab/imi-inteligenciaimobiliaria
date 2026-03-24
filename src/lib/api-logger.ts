/**
 * Lightweight API request logger.
 * Wraps any API handler to log: method, path, userId, duration, status.
 * Usage: export const POST = withLogging(async (req) => { ... })
 */

type ApiHandler = (req: Request, context?: any) => Promise<Response>

export function withLogging(handler: ApiHandler): ApiHandler {
    return async (req: Request, context?: any) => {
        const start = Date.now()
        const url = new URL(req.url)
        const method = req.method
        const path = url.pathname

        try {
            const response = await handler(req, context)
            const duration = Date.now() - start
            const status = response.status

            // Log in structured JSON (Vercel log drain compatible)
            if (duration > 3000 || status >= 500) {
                console.log(JSON.stringify({
                    level: status >= 500 ? 'error' : 'warn',
                    msg: `${method} ${path}`,
                    status,
                    duration_ms: duration,
                    timestamp: new Date().toISOString(),
                }))
            }

            return response
        } catch (err) {
            const duration = Date.now() - start
            console.error(JSON.stringify({
                level: 'error',
                msg: `${method} ${path} UNHANDLED`,
                error: err instanceof Error ? err.message : 'Unknown',
                duration_ms: duration,
                timestamp: new Date().toISOString(),
            }))
            throw err
        }
    }
}
