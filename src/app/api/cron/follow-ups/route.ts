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
        const errors: string[] = []

        // Batch update: mark all follow-ups as completed in one query
        const followUpIds = followUps.map(f => f.id)
        const { error: batchUpdateError } = await supabase
            .from('lead_follow_ups')
            .update({ status: 'completed', updated_at: now })
            .in('id', followUpIds)
        if (batchUpdateError) {
            errors.push(`batch update: ${batchUpdateError.message}`)
        }

        // Batch update: update last_message_at for all associated lead channels
        const leadIds = followUps.map(f => f.lead_id).filter(Boolean)
        if (leadIds.length > 0) {
            const { error: channelError } = await supabase
                .from('chat_channels')
                .update({ last_message_at: now })
                .in('lead_id', leadIds)
            if (channelError) {
                errors.push(`channel update: ${channelError.message}`)
            }
        }

        const processed = errors.length === 0 ? followUps.length : followUps.length - errors.length
        return NextResponse.json({
            success: true,
            processed,
            total: followUps.length,
            errors: errors.length > 0 ? errors : undefined,
        })
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        )
    }
}
