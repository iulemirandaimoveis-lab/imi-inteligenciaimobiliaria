import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
})

export async function POST(request: NextRequest) {
    try {
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

        const userId = data.user?.id
        if (userId) {
            // Update last_login_at and create session record (fire-and-forget)
            Promise.all([
                supabaseAdmin
                    .from('brokers')
                    .update({ last_login_at: new Date().toISOString() })
                    .eq('user_id', userId),
                supabaseAdmin
                    .from('user_backoffice_sessions')
                    .insert({
                        user_id: userId,
                        started_at: new Date().toISOString(),
                        last_heartbeat_at: new Date().toISOString(),
                    }),
                // Upsert presence to online
                supabaseAdmin
                    .from('user_presence')
                    .upsert({
                        user_id: userId,
                        status: 'online',
                        last_seen_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    }),
            ]).catch(() => { /* non-blocking */ })
        }

        return NextResponse.json({ user: data.user, session: data.session })
    } catch {
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
}
