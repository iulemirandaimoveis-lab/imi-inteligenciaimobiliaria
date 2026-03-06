import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

const T = {
    surface: 'var(--bo-surface)', elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)', borderGold: 'var(--bo-border-gold)',
    text: 'var(--bo-text)', textSub: 'var(--bo-text-muted)',
    gold: 'var(--bo-accent)',
}

// ── helpers ──────────────────────────────────────────────────────
function startOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), 1)
}
function endOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
}
const MONTH_NAMES_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

// Server component — busca dados reais do Supabase
export default async function DashboardPage() {
    const supabase = await createClient()

    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Busca paralela de todos os dados necessários
    const [
        leadsResult,
        leadsAllResult,
        avResult,
        avAllResult,
        imoveisResult,
        devCountResult,
        leadsParadosResult,
        leadsHojeResult,
    ] = await Promise.all([
        // Leads dos últimos 6 meses (para gráfico)
        supabase
            .from('leads')
            .select('id, source, status, created_at, updated_at')
            .gte('created_at', sixMonthsAgo.toISOString()),

        // Contagem total de leads
        supabase.from('leads').select('*', { count: 'exact', head: true }),

        // Avaliações dos últimos 6 meses (para gráfico de receita)
        supabase
            .from('avaliacoes')
            .select('id, status, honorarios, created_at')
            .gte('created_at', sixMonthsAgo.toISOString()),

        // Todas as avaliações para stats globais
        supabase.from('avaliacoes').select('status, honorarios'),

        // Imóveis publicados
        supabase.from('developments').select('*', { count: 'exact', head: true }),

        // Construtoras
        supabase.from('developers').select('*', { count: 'exact', head: true }),

        // Leads parados há 5+ dias sem atualização (status ativo)
        supabase
            .from('leads')
            .select('id, name, status, updated_at')
            .in('status', ['new', 'warm', 'hot', 'contacted', 'qualified'])
            .lt('updated_at', fiveDaysAgo.toISOString())
            .order('updated_at', { ascending: true })
            .limit(20),

        // Leads criados hoje
        supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today.toISOString()),
    ])

    // Avaliações com prazo vencendo (em_andamento há mais de 25 dias)
    const veintiCincoDaysAgo = new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000)
    const { data: avPrazoResult } = await supabase
        .from('avaliacoes')
        .select('id, protocolo, cliente_nome, status, created_at')
        .eq('status', 'em_andamento')
        .lt('created_at', veintiCincoDaysAgo.toISOString())
        .limit(10)

    // Últimas 5 avaliações recentes
    const { data: recentAvaliacoes } = await supabase
        .from('avaliacoes')
        .select('id, protocolo, cliente_nome, tipo_imovel, bairro, status, honorarios, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

    // Últimos 5 leads recentes
    const { data: recentLeads } = await supabase
        .from('leads')
        .select('id, name, email, source, created_at, interest:interest_type, status')
        .order('created_at', { ascending: false })
        .limit(5)

    // ── Processar dados do gráfico (últimos 6 meses) ──────────────
    const chartData = []
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const mStart = startOfMonth(d).toISOString()
        const mEnd = endOfMonth(d).toISOString()
        const label = MONTH_NAMES_PT[d.getMonth()]

        // Leads do mês
        const leadsNoMes = (leadsResult.data || []).filter(l =>
            l.created_at >= mStart && l.created_at <= mEnd
        ).length

        // Honorários de avaliações concluídas no mês
        const honorMes = (avResult.data || [])
            .filter(a => a.status === 'concluida' && a.created_at >= mStart && a.created_at <= mEnd)
            .reduce((sum, a) => sum + Number(a.honorarios || 0), 0)

        chartData.push({ mes: label, leads: leadsNoMes, receita: Math.round(honorMes / 1000) })
    }

    // ── Stats de avaliações ──────────────────────────────────────
    let honorariosRecebidos = 0
    let honorariosPendentes = 0
    let concluidas = 0
    let andamento = 0

    for (const av of (avAllResult.data || [])) {
        if (av.status === 'concluida') {
            honorariosRecebidos += Number(av.honorarios || 0)
            concluidas++
        } else if (av.status === 'pgto_pendente') {
            honorariosPendentes += Number(av.honorarios || 0)
        } else if (av.status === 'em_andamento') {
            andamento++
        }
    }

    // ── Performance por canal (leads por source) ─────────────────
    const sourceMap: Record<string, number> = {}
    const totalLeads = leadsAllResult.count || 0
    for (const lead of (leadsResult.data || [])) {
        const src = lead.source || 'Orgânico'
        sourceMap[src] = (sourceMap[src] || 0) + 1
    }
    const canalPerformance = Object.entries(sourceMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([canal, count]) => ({
            canal,
            leads: count,
            pct: totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0,
        }))

    // ── Alertas ─────────────────────────────────────────────────
    const alertas = []
    const qtdParados = (leadsParadosResult.data || []).length
    const qtdPrazo = (avPrazoResult || []).length

    if (qtdParados > 0) {
        alertas.push({
            tipo: 'leads_parados',
            mensagem: `${qtdParados} lead${qtdParados > 1 ? 's' : ''} sem follow-up há 5+ dias`,
            href: '/backoffice/leads?status=parado',
            acao: 'Ver Leads',
            cor: 'warning',
        })
    }
    if (qtdPrazo > 0) {
        alertas.push({
            tipo: 'avaliacoes_prazo',
            mensagem: `${qtdPrazo} avaliação${qtdPrazo > 1 ? 'ões' : ''} com prazo vencendo`,
            href: '/backoffice/avaliacoes',
            acao: 'Ver Avaliações',
            cor: 'danger',
        })
    }
    if (honorariosPendentes > 0) {
        alertas.push({
            tipo: 'honorarios',
            mensagem: `${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(honorariosPendentes)} em honorários a receber`,
            href: '/backoffice/financeiro',
            acao: 'Ver Financeiro',
            cor: 'info',
        })
    }

    return (
        <DashboardClient
            stats={{
                total_leads: totalLeads,
                leads_today: leadsHojeResult.count || 0,
                receita_mes: honorariosRecebidos,
            }}
            avStats={{
                total: avAllResult.count || 0,
                concluidas,
                em_andamento: andamento,
                honorarios_recebidos: honorariosRecebidos,
                honorarios_pendentes: honorariosPendentes,
            }}
            recentLeads={recentLeads || []}
            recentAvaliacoes={recentAvaliacoes || []}
            imoveisCount={imoveisResult.count || 0}
            chartData={chartData}
            canalPerformance={canalPerformance}
            alertas={alertas}
        />
    )
}
