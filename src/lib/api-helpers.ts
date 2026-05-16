import { NextRequest, NextResponse } from 'next/server'
// ZodType<Output, Def, any> allows schemas with .default() where Input ≠ Output
import { ZodType } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, getClientIP, limiters } from '@/lib/rate-limit'

export interface ApiContext {
  user: { id: string; email?: string; role?: string } | null
  supabase: Awaited<ReturnType<typeof createClient>>
  ip: string
}

export interface ApiHandlerOptions {
  auth?: boolean
  rateLimit?: 'public' | 'auth' | 'ai' | { limit: number; windowMs: number }
  auditAction?: string
  methods?: ('GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE')[]
}

export function apiHandler<TBody = unknown>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: ZodType<TBody, any, any> | null,
  handler: (req: NextRequest, body: TBody, ctx: ApiContext) => Promise<NextResponse>,
  options: ApiHandlerOptions = {}
) {
  const { auth = true, rateLimit: rlConfig = auth ? 'auth' : 'public', auditAction, methods } = options

  return async (req: NextRequest): Promise<NextResponse> => {
    const ip = getClientIP(req)
    try {
      if (methods && !methods.includes(req.method as (typeof methods)[number])) {
        return NextResponse.json({ error: `Method ${req.method} not allowed` }, { status: 405 })
      }

      // Rate limiting
      let rlResult: { success: boolean; resetTime: number } | undefined
      if (typeof rlConfig === 'string') {
        if (rlConfig === 'public') rlResult = await limiters.public(ip)
        else if (rlConfig !== 'ai') rlResult = await rateLimit(ip, { limit: 30, windowMs: 60000 })
      } else if (typeof rlConfig === 'object') {
        rlResult = await rateLimit(ip, rlConfig)
      }
      if (rlResult && !rlResult.success) {
        const retry = Math.ceil((rlResult.resetTime - Date.now()) / 1000)
        return NextResponse.json({ error: 'Too many requests', retryAfter: retry }, { status: 429, headers: { 'Retry-After': String(retry) } })
      }

      // Auth
      const supabase = await createClient()
      let user: ApiContext['user'] = null
      if (auth) {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        user = { id: authUser.id, email: authUser.email, role: authUser.user_metadata?.role }
        if (rlConfig === 'auth') {
          const authRl = await limiters.auth(user.id)
          if (!authRl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
        } else if (rlConfig === 'ai') {
          const aiRl = await limiters.ai(user.id)
          if (!aiRl.success) return NextResponse.json({ error: 'AI rate limit exceeded' }, { status: 429 })
        }
      }

      // Validation
      let body = {} as TBody
      if (schema && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
        let rawBody: unknown
        try { rawBody = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }
        const result = schema.safeParse(rawBody)
        if (!result.success) {
          const fieldErrors = result.error.flatten().fieldErrors
          const fieldMessages = Object.entries(fieldErrors)
            .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`)
            .join('; ')
          return NextResponse.json({ error: 'Validation failed', details: fieldErrors }, { status: 400 })
        }
        body = result.data
      }

      return await handler(req, body, { user, supabase, ip })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error'
      console.error(`[API ERROR] ${req.method} ${req.nextUrl.pathname}:`, error)
      return NextResponse.json(
        { error: 'Internal server error', ...(process.env.NODE_ENV === 'development' ? { debug: message } : {}) },
        { status: 500 }
      )
    }
  }
}
