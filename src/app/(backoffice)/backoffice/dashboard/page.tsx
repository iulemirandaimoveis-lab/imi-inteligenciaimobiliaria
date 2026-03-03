import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

// Server component — busca dados reais do Supabase
export default async function DashboardPage() {
  const supabase = await createClient()

  // Atividade recente: últimos 5 leads
  const { data: recentLeads } = await supabase
    .from('leads')
    .select('id, name, email, source, created_at, interest:interest_type, status')
    .order('created_at', { ascending: false })
    .limit(5)

  // Últimas avaliações
  const { data: recentAvaliacoes } = await supabase
    .from('avaliacoes')
    .select('id, protocolo, cliente_nome, tipo_imovel, bairro, status, honorarios, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  // Conta leads e imoveis
  const { count: leadsCount } = await supabase.from('leads').select('*', { count: 'exact', head: true })
  const { count: imoveisCount } = await supabase.from('developments').select('*', { count: 'exact', head: true })
  const { count: avCount } = await supabase.from('avaliacoes').select('*', { count: 'exact', head: true })
  const { count: devCount } = await supabase.from('developers').select('*', { count: 'exact', head: true })

  // Data ranges para leads today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count: leadsTodayCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString())

  // Busca avaliacoes para calcular honorarios globais
  const { data: avaliacoesParaHonorarios } = await supabase
    .from('avaliacoes')
    .select('status, honorarios')

  let honorariosRecebidos = 0;
  let honorariosPendentes = 0;
  let concluidas = 0;
  let andamento = 0;

  if (avaliacoesParaHonorarios) {
    for (const av of avaliacoesParaHonorarios) {
      if (av.status === 'concluida') {
        honorariosRecebidos += Number(av.honorarios || 0);
        concluidas++;
      } else if (av.status === 'pgto_pendente') {
        honorariosPendentes += Number(av.honorarios || 0);
      } else if (av.status === 'em_andamento') {
        andamento++;
      }
    }
  }

  const stats = {
    total_leads: leadsCount || 0,
    leads_today: leadsTodayCount || 0,
    total_avaliacoes: avCount || 0,
    total_imoveis: imoveisCount || 0,
    conversion_rate: 0,
    receita_mes: honorariosRecebidos,
  }

  const avStatsData = {
    total: avCount || 0,
    concluidas: concluidas,
    em_andamento: andamento,
    aguardando_docs: avaliacoesParaHonorarios?.filter(a => a.status === 'aguardando_docs').length || 0,
    honorarios_recebidos: honorariosRecebidos,
    honorarios_pendentes: honorariosPendentes,
  }

  // Montar Dados do Grafico (Ultimos 6 meses)
  const chartData = []
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const mLabel = monthNames[d.getMonth()]

    const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString()

    const { count: leadsMes } = await supabase.from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth)
      .lte('created_at', endOfMonth)

    const { data: avaliacoesMes } = await supabase.from('avaliacoes')
      .select('honorarios')
      .gte('created_at', startOfMonth)
      .lte('created_at', endOfMonth)
      .eq('status', 'concluida')

    const honorarios = avaliacoesMes ? avaliacoesMes.reduce((s, a) => s + Number(a.honorarios || 0), 0) : 0

    chartData.push({
      mes: mLabel,
      leads: leadsMes || 0,
      honorarios: honorarios
    })
  }

  return (
    <DashboardClient
      stats={stats}
      avStats={avStatsData}
      recentLeads={recentLeads || []}
      recentAvaliacoes={recentAvaliacoes || []}
      imoveisCount={imoveisCount || 0}
      chartData={chartData}
    />
  )
}
