import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { rateLimit, getClientIP } from '@/lib/rate-limit'

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
})

export async function POST(request: NextRequest) {
    try {
        // Anti brute-force: 5 tentativas/min por IP
        const ip = getClientIP(request)
        const rl = await rateLimit(`login:${ip}`, { limit: 5, windowMs: 60_000 })
        if (!rl.success) {
            return NextResponse.json({ error: 'Muitas tentativas. Aguarde um minuto.' }, { status: 429 })
        }

        const body = await request.json()
        const parsed = LoginSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 })
        }
        const { email, password } = parsed.data

        const supabase = await createClient()
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })

        if (error) {
            return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 401 })
        }

        return NextResponse.json({ user: data.user, session: data.session })
    } catch {
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
}
