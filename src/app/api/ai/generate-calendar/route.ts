import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateContentCalendar } from '@/lib/ai/claude';
import { GenerateCalendarRequest } from '@/types/commercial-system';
import { limiters } from '@/lib/rate-limit';
export const runtime = 'nodejs'
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        // Verifica autenticação
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const rl = await limiters.ai(user.id);
        if (!rl.success) return NextResponse.json({ error: 'Limite de requisições excedido. Aguarde 1 minuto.' }, { status: 429 });
        const body: GenerateCalendarRequest = await request.json();
        // Verifica se user tem acesso ao tenant
        const { data: tenantUser } = await supabase
            .from('tenant_users')
            .select('role')
            .eq('tenant_id', body.tenant_id)
            .eq('user_id', user.id)
            .single();
        if (!tenantUser) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        // Verifica se já existe calendar para este período
        const { data: existingCalendar } = await supabase
            .from('content_calendar')
            .select('id, status')
            .eq('tenant_id', body.tenant_id)
            .eq('month', body.month)
            .eq('year', body.year)
            .single();
        if (existingCalendar && existingCalendar.status !== 'draft') {
            return NextResponse.json(
                { error: 'Calendar already exists for this period' },
                { status: 400 }
            );
        }
        // Cria ou atualiza calendar
        let calendar_id = existingCalendar?.id;
        if (!calendar_id) {
            const { data: newCalendar, error: createError } = await supabase
                .from('content_calendar')
                .insert({
                    tenant_id: body.tenant_id,
                    month: body.month,
                    year: body.year,
                    objectives: body.objectives,
                    offers: body.offers || [],
                    strategic_dates: body.strategic_dates || [],
                    custom_instructions: body.custom_instructions,
                    status: 'draft',
                })
                .select('id')
                .single();
            if (createError) {
                throw new Error(`Failed to create calendar: ${createError.message}`);
            }
            calendar_id = newCalendar.id;
        }
        // Gera planejamento com Claude
        const aiResult = await generateContentCalendar({
            tenant_id: body.tenant_id,
            month: body.month,
            year: body.year,
            objectives: body.objectives,
            offers: body.offers || [],
            strategic_dates: body.strategic_dates || [],
            custom_instructions: body.custom_instructions,
            requested_by: user.id,
        });
        // Atualiza calendar com plano IA
        const { error: updateError } = await supabase
            .from('content_calendar')
            .update({
                ai_plan: aiResult.ai_plan,
                ai_request_id: aiResult.ai_request_id,
                status: 'ai_generated',
                updated_at: new Date().toISOString(),
            })
            .eq('id', calendar_id);
        if (updateError) {
            throw new Error(`Failed to update calendar: ${updateError.message}`);
        }
        return NextResponse.json({
            calendar_id,
            ai_plan: aiResult.ai_plan,
            ai_request_id: aiResult.ai_request_id,
            cost_usd: aiResult.cost_usd,
        });
    } catch (error: unknown) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
}
