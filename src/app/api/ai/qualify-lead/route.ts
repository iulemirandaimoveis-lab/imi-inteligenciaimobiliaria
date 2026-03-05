import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { qualifyLeadWithClaude } from '@/lib/ai/lead-qualifier';

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

        const body = await request.json();
        const { lead_id, include_interactions = true } = body;

        if (!lead_id) {
            return NextResponse.json({ error: 'lead_id is required' }, { status: 400 });
        }

        // Busca lead
        const { data: lead, error: leadError } = await supabase
            .from('leads')
            .select('*')
            .eq('id', lead_id)
            .eq('user_id', user.id)
            .single();

        if (leadError || !lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        // Busca interações (se solicitado)
        let interactions = [];
        if (include_interactions) {
            const { data: interactionData } = await supabase
                .from('lead_interactions')
                .select('*')
                .eq('lead_id', lead_id)
                .order('created_at', { ascending: false })
                .limit(20); // Últimas 20 interações

            interactions = interactionData || [];
        }

        // Qualifica com Claude
        const result = await qualifyLeadWithClaude({
            lead_id,
            lead_data: lead,
            interactions,
            requested_by: user.id,
        });

        // Persiste qualificação no banco de dados para histórico
        await supabase
            .from('lead_qualifications')
            .insert({
                lead_id: lead_id,
                score: result.qualification.score,
                reasoning: result.qualification.summary
            });

        return NextResponse.json({
            lead_id,
            qualification: result.qualification,
            follow_ups: result.follow_ups,
            ai_request_id: result.ai_request_id,
            cost_usd: result.cost_usd,
        });
    } catch (error: any) {
        console.error('Error in /api/ai/qualify-lead:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
