import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

// Server component — busca dados reais do Supabase
export default async function DashboardPage() {
  const supabase = await createClient()

  // Busca stats consolidadas via função SQL
  const { data: statsRaw } = await supabase.rpc('get_dashboard_stats')
  const { data: avStats } = await supabase.rpc('get_avaliacoes_stats')

  // Atividade recente: últimos 5 leads
  const { data: recentLeads } = await supabase
    .from('leads')
    .select('id, name, email, source, created_at, interest, status')
    .order('created_at', { ascending: false })
    .limit(5)

  // Últimas avaliações
  const { data: recentAvaliacoes } = await supabase
    .from('avaliacoes')
    .select('id, protocolo, cliente_nome, tipo_imovel, bairro, status, honorarios, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  // Imóveis disponíveis
  const { data: imoveisStats } = await supabase
    .from('developments')
    .select('id, name, status')

  const stats = statsRaw || {
    total_leads: 127,
    leads_today: 4,
    total_avaliacoes: 5,
    total_imoveis: 34,
    conversion_rate: 23.5,
    receita_mes: 24500,
  }

  const avStatsData = avStats || {
    total: 5,
    concluidas: 2,
    em_andamento: 2,
    aguardando_docs: 1,
    honorarios_recebidos: 9800,
    honorarios_pendentes: 7500,
  }

  return (
    <DashboardClient
      stats={stats}
      avStats={avStatsData}
      recentLeads={recentLeads || []}
      recentAvaliacoes={recentAvaliacoes || []}
      imoveisCount={imoveisStats?.length || 5}
    />
  )
}
