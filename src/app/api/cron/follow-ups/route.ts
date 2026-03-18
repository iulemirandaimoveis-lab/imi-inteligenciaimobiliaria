export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Cron job: processar follow-ups pendentes e atualizar canais
// Schedule: */15 * * * * (a cada 15 minutos)
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = await createClient()
        const now = new Date().toISOString()

        // Busca follow-ups pendentes com scheduled_at vencido
        const { data: followUps, error } = await supabase
            .from('lead_follow_ups')
            .select('id, lead_id')
            .eq('status', 'pending')
            .lte('scheduled_at', now)
            .limit(100)

        if (error) throw error

        if (!followUps || followUps.length === 0) {
            return NextResponse.json({
                success: true,
                processed: 0,
                message: 'Nenhum follow-up pendente',
            })
        }

        let processed = 0
        const errors: string[] = []

        for (const followUp of followUps) {
            try {
                // Marcar follow-up como completed
                const { error: updateError } = await supabase
                    .from('lead_follow_ups')
                    .update({ status: 'completed', updated_at: now })
                    .eq('id', followUp.id)

                if (updateError) throw updateError

                // Atualizar last_message_at no canal associado ao lead
                if (followUp.lead_id) {
                    await supabase
                        .from('chat_channels')
                        .update({ last_message_at: now })
                        .eq('lead_id', followUp.lead_id)
                }

                processed++
            } catch (err) {
                errors.push(
                    `follow_up ${followUp.id}: ${err instanceof Error ? err.message : 'Unknown error'}`
                )
            }
        }

        return NextResponse.json({
            success: true,
            processed,
            total: followUps.length,
            errors: errors.length > 0 ? errors : undefined,
        })
    } catch (error) {
        console.error('Error in cron/follow-ups:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        )
    }
}
