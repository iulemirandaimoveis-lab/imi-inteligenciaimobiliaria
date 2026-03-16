import { NextRequest, NextResponse } from 'next/server'
import { callClaude } from '@/lib/ai/claude'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

        const today = new Date()
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        const todayStr = today.toISOString().split('T')[0]
        const weekAgoStr = weekAgo.toISOString().split('T')[0]

        // Gather data points in parallel
        const [
            { count: leadsToday },
            { count: leadsWeek },
            { data: recentLeads },
            { data: transactions },
            { count: totalProperties },
            { count: activeProperties },
        ] = await Promise.all([
            supabase.from('leads').select('id', { count: 'exact', head: true })
                .gte('created_at', `${todayStr}T00:00:00`),
            supabase.from('leads').select('id', { count: 'exact', head: true })
                .gte('created_at', `${weekAgoStr}T00:00:00`),
            supabase.from('leads').select('status, source')
                .gte('created_at', `${weekAgoStr}T00:00:00`).limit(100),
            supabase.from('financial_transactions').select('type, amount')
                .gte('created_at', `${weekAgoStr}T00:00:00`).limit(100),
            supabase.from('developments').select('id', { count: 'exact', head: true }),
            supabase.from('developments').select('id', { count: 'exact', head: true })
                .in('status', ['available', 'disponivel', 'launch', 'lancamento']),
        ])

        const totalReceita = (transactions || [])
            .filter(t => t.type === 'receita' || t.type === 'income')
            .reduce((s, t) => s + Number(t.amount || 0), 0)

        const statusCounts: Record<string, number> = {}
        ;(recentLeads || []).forEach(l => {
            statusCounts[l.status] = (statusCounts[l.status] || 0) + 1
        })

        const sourceCounts: Record<string, number> = {}
        ;(recentLeads || []).forEach(l => {
            if (l.source) sourceCounts[l.source] = (sourceCounts[l.source] || 0) + 1
        })

        const context = `
Data: ${todayStr}

MÉTRICAS DA SEMANA:
- Novos leads hoje: ${leadsToday || 0}
- Novos leads na semana: ${leadsWeek || 0}
- Receita gerada: R$ ${totalReceita.toLocaleString('pt-BR')}
- Imóveis no portfólio: ${totalProperties || 0} (${activeProperties || 0} ativos)

STATUS DOS LEADS (últimos 7 dias):
${Object.entries(statusCounts).map(([k, v]) => `- ${k}: ${v}`).join('\n') || '- Sem dados'}

FONTES DE LEADS:
${Object.entries(sourceCounts).map(([k, v]) => `- ${k}: ${v}`).join('\n') || '- Sem dados'}
`.trim()

        const response = await callClaude({
            tenant_id: 'default',
            prompt: `Gere um resumo executivo diário para o gestor imobiliário:\n\n${context}`,
            system_prompt: `Você é o assistente de inteligência da IMI Intelligence.

Gere um resumo do dia em JSON:
{
  "greeting": "Bom dia! Aqui está seu resumo.",
  "highlights": ["ponto 1", "ponto 2", "ponto 3"],
  "alert": "Alerta importante se houver (ou null)",
  "suggestion": "Uma sugestão de ação para hoje"
}

Regras:
- Máximo 3 highlights, curtos e diretos
- Se dados são limitados, foque no que está disponível
- Sempre dê uma sugestão de ação prática
- Tom profissional mas amigável`,
            temperature: 0.7,
            max_tokens: 512,
            request_type: 'daily_summary',
        })

        const jsonMatch = response.content.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            return NextResponse.json({ error: 'Parse failed' }, { status: 500 })
        }

        return NextResponse.json({
            summary: JSON.parse(jsonMatch[0]),
            ai_request_id: response.ai_request_id,
            cost_usd: response.cost_usd,
        })
    } catch (error: any) {
        console.error('Daily summary error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
