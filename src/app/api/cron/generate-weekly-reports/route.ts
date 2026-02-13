import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { generateExecutiveReport } from '@/lib/reports/generator';

// Cron job: gerar relatórios semanais
// Executar toda segunda-feira às 8h
export async function GET(request: NextRequest) {
    try {
        // Verifica secret
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = await createClient();

        // Busca todos tenants ativos
        const { data: tenants } = await supabase
            .from('tenants')
            .select('id')
            .eq('is_active', true);

        if (!tenants) {
            return NextResponse.json({ success: true, reports_generated: 0 });
        }

        // Calcula período (última semana)
        const today = new Date();
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 7);

        const period_start = lastWeek.toISOString().split('T')[0];
        const period_end = today.toISOString().split('T')[0];

        const reports = [];

        // Gera relatório para cada tenant
        for (const tenant of tenants) {
            try {
                const report = await generateExecutiveReport({
                    tenant_id: tenant.id,
                    report_type: 'weekly',
                    period_start,
                    period_end,
                    generated_by: 'system', // ID do sistema
                });

                reports.push(report.id);
            } catch (error) {
                console.error(`Error generating report for tenant ${tenant.id}:`, error);
            }
        }

        return NextResponse.json({
            success: true,
            reports_generated: reports.length,
            report_ids: reports,
        });
    } catch (error: any) {
        console.error('Error in cron/generate-weekly-reports:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
