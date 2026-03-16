export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Cron job: processar follow-ups pendentes de leads
// Schedule: 0 * * * * (a cada hora)
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const now = new Date().toISOString()

        // Busca follow-ups pendentes vencidos
        const { data: followUps, error } = await supabaseAdmin
            .from('lead_follow_ups')
            .select(`
                id,
                lead_id,
                type,
                notes,
                assigned_to,
                leads (name, email, phone)
            `)
            .eq('status', 'pending')
            .lte('scheduled_at', now)
            .limit(50)

        if (error) throw error
        if (!followUps || followUps.length === 0) {
            return NextResponse.json({ success: true, processed: 0, message: 'Nenhum follow-up pendente' })
        }

        let processed = 0
        let failed = 0
        const errors: string[] = []

        for (const fu of followUps) {
            try {
                const lead = fu.leads as any
                const assignedTo = fu.assigned_to

                // Marcar como em processamento para evitar double-processing
                await supabaseAdmin
                    .from('lead_follow_ups')
                    .update({ status: 'in_progress', updated_at: now })
                    .eq('id', fu.id)

                // Criar notificação para o agente responsável
                if (assignedTo) {
                    await supabaseAdmin
                        .from('notifications')
                        .insert({
                            user_id: assignedTo,
                            type: 'follow_up_due',
                            title: `🔔 Follow-up vencido: ${lead?.name || 'Lead'}`,
                            message: fu.notes || `Follow-up do tipo "${fu.type}" está vencido`,
                            data: {
                                lead_id: fu.lead_id,
                                follow_up_id: fu.id,
                                type: fu.type,
                            },
                            read: false,
                        })
                }

                // Se tipo email e lead tem email, enviar via API de email
                if (fu.type === 'email' && lead?.email) {
                    try {
                        const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
                        await fetch(`${baseUrl}/api/email/send`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                to: lead.email,
                                subject: `Olá ${lead.name}, temos novidades para você`,
                                template: 'follow_up',
                                data: { name: lead.name, notes: fu.notes },
                                system: true,
                            }),
                        })
                    } catch {
                        // Email falhou — não bloqueia o processamento
                    }
                }

                // Marcar como concluído
                await supabaseAdmin
                    .from('lead_follow_ups')
                    .update({ status: 'completed', updated_at: now })
                    .eq('id', fu.id)

                // Registrar interação no lead
                await supabaseAdmin
                    .from('lead_interactions')
                    .insert({
                        lead_id: fu.lead_id,
                        type: fu.type,
                        notes: `[Auto] Follow-up processado automaticamente: ${fu.notes || ''}`,
                        created_by: assignedTo || null,
                    })

                processed++
            } catch (err) {
                failed++
                errors.push(`follow_up ${fu.id}: ${err instanceof Error ? err.message : 'Unknown error'}`)
                // Reverter para pending em caso de erro
                await supabaseAdmin
                    .from('lead_follow_ups')
                    .update({ status: 'pending', updated_at: now })
                    .eq('id', fu.id)
            }
        }

        return NextResponse.json({
            success: true,
            processed,
            failed,
            total: followUps.length,
            errors: errors.length > 0 ? errors : undefined,
        })
    } catch (error: any) {
        console.error('Error in cron/process-follow-ups:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        )
    }
}
