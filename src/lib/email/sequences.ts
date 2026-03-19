import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
interface EnrollInSequenceParams {
    sequence_id: string;
    lead_id: string;
}
interface ProcessSequencesResult {
    processed: number;
    sent: number;
    errors: number;
}
/**
 * Inscreve lead em sequência de emails
 */
export async function enrollInSequence(params: EnrollInSequenceParams) {
    const { sequence_id, lead_id } = params;
    const supabase = await createClient();
    try {
        // Verifica se já está inscrito
        const { data: existing } = await supabase
            .from('email_sequence_enrollments')
            .select('id')
            .eq('sequence_id', sequence_id)
            .eq('lead_id', lead_id)
            .single();
        if (existing) {
            return { success: false, error: 'Already enrolled' };
        }
        // Inscreve
        const { data, error } = await supabase
            .from('email_sequence_enrollments')
            .insert({
                sequence_id,
                lead_id,
                current_step: 0,
                status: 'active',
            })
            .select()
            .single();
        if (error) throw error;
        return { success: true, enrollment: data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
/**
 * Processa sequências de email (executar via cron)
 * Envia próximo email para cada enrollment ativo
 */
export async function processEmailSequences(): Promise<ProcessSequencesResult> {
    const supabase = await createClient();
    let processed = 0;
    let sent = 0;
    let errors = 0;
    try {
        // Busca enrollments ativos
        const { data: enrollments } = await supabase
            .from('email_sequence_enrollments')
            .select(
                `
                *,
                sequence:email_sequences(*),
                lead:leads(*)
            `
            )
            .eq('status', 'active');
        if (!enrollments) return { processed, sent, errors };
        for (const enrollment of enrollments) {
            processed++;
            try {
                const sequence = enrollment.sequence;
                const lead = enrollment.lead;
                const emails = sequence.emails as any[];
                // Verifica se há próximo email
                if (enrollment.current_step >= emails.length) {
                    // Sequência completa
                    await supabase
                        .from('email_sequence_enrollments')
                        .update({
                            status: 'completed',
                            completed_at: new Date().toISOString(),
                        })
                        .eq('id', enrollment.id);
                    continue;
                }
                const currentEmail = emails[enrollment.current_step];
                const delayHours = currentEmail.delay_hours || 0;
                // Verifica se delay passou
                const enrolledAt = new Date(enrollment.last_email_sent_at || enrollment.enrolled_at);
                const now = new Date();
                const hoursSinceLastEmail =
                    (now.getTime() - enrolledAt.getTime()) / (1000 * 60 * 60);
                if (hoursSinceLastEmail < delayHours) {
                    continue; // Ainda não é hora
                }
                // Renderiza template
                const subject = renderTemplate(currentEmail.subject, lead);
                const body = renderTemplate(currentEmail.body_html, lead);
                // Verifica se Resend está configurado
                if (!resend) {
                    continue;
                }
                // Envia email
                const result = await resend.emails.send({
                    from: `${sequence.tenant_id}@yourdomain.com`, // Configurar domínio
                    to: lead.email,
                    subject,
                    html: body,
                });
                if (result.error) {
                    throw new Error(result.error.message);
                }
                // Salva log
                await supabase.from('email_logs').insert({
                    tenant_id: sequence.tenant_id,
                    lead_id: lead.id,
                    enrollment_id: enrollment.id,
                    to_email: lead.email,
                    subject,
                    body_html: body,
                    status: 'sent',
                    external_id: result.data?.id,
                });
                // Atualiza enrollment
                await supabase
                    .from('email_sequence_enrollments')
                    .update({
                        current_step: enrollment.current_step + 1,
                        last_email_sent_at: new Date().toISOString(),
                    })
                    .eq('id', enrollment.id);
                sent++;
            } catch (error: any) {
                errors++;
                // Log erro
                await supabase.from('email_logs').insert({
                    tenant_id: enrollment.sequence.tenant_id,
                    lead_id: enrollment.lead_id,
                    enrollment_id: enrollment.id,
                    to_email: enrollment.lead.email,
                    subject: 'Error',
                    status: 'failed',
                    error_message: error.message,
                });
            }
        }
    } catch (error) {
    }
    return { processed, sent, errors };
}
/**
 * Renderiza template substituindo variáveis
 */
function renderTemplate(template: string, lead: any): string {
    let rendered = template;
    // Substitui variáveis {variable_name}
    rendered = rendered.replace(/\{name\}/g, lead.name || 'Cliente');
    rendered = rendered.replace(/\{email\}/g, lead.email || '');
    rendered = rendered.replace(/\{phone\}/g, lead.phone || '');
    rendered = rendered.replace(/\{source\}/g, lead.source || '');
    return rendered;
}
/**
 * Cancela enrollment
 */
export async function cancelEnrollment(enrollment_id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('email_sequence_enrollments')
        .update({ status: 'cancelled' })
        .eq('id', enrollment_id);
    if (error) throw error;
    return { success: true };
}
