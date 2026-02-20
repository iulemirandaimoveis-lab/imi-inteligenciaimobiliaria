'use client'

import { useState } from 'react'
import { FileText, Download, BarChart2, Scale, Users, Building2, DollarSign, Calendar, Loader2 } from 'lucide-react'

const RELATORIOS = [
  {
    id: 'avaliacoes_mes', icon: Scale, title: 'Avaliações do Mês',
    desc: 'Lista completa de laudos com honorários, status e grau NBR 14653',
    categoria: 'avaliacoes', formato: 'PDF + Excel',
  },
  {
    id: 'honorarios_recebidos', icon: DollarSign, title: 'Honorários Recebidos',
    desc: 'Fluxo de recebimento de honorários por período, cliente e finalidade',
    categoria: 'financeiro', formato: 'PDF + Excel',
  },
  {
    id: 'leads_pipeline', icon: Users, title: 'Pipeline de Leads',
    desc: 'Funil completo com taxa de conversão por fonte e status',
    categoria: 'crm', formato: 'PDF',
  },
  {
    id: 'portfolio_imoveis', icon: Building2, title: 'Portfólio de Imóveis',
    desc: 'Inventário atualizado com variação FIPE ZAP e valor de mercado',
    categoria: 'imoveis', formato: 'PDF + Excel',
  },
  {
    id: 'consultorias_ativas', icon: BarChart2, title: 'Consultorias Ativas',
    desc: 'Status de projetos, prazos, responsável e honorários pendentes',
    categoria: 'consultorias', formato: 'PDF',
  },
  {
    id: 'receita_consolidada', icon: DollarSign, title: 'Receita Consolidada',
    desc: 'Consolidado de receita por módulo: avaliações + consultorias + crédito',
    categoria: 'financeiro', formato: 'PDF + Excel',
  },
]

const CATEGORIA_BADGE: Record<string, string> = {
  avaliacoes: 'bg-purple-50 text-purple-700',
  financeiro: 'bg-emerald-50 text-emerald-700',
  crm: 'bg-blue-50 text-blue-700',
  imoveis: 'bg-amber-50 text-amber-700',
  consultorias: 'bg-orange-50 text-orange-700',
}

export default function RelatoriosPage() {
  const [gerando, setGerando] = useState<string | null>(null)
  const [periodo, setPeriodo] = useState('mes_atual')
  const [filtroCateg, setFiltroCateg] = useState('todos')

  const handleGerar = async (id: string) => {
    setGerando(id)
    await new Promise(r => setTimeout(r, 1500)) // TODO: real report generation
    setGerando(null)
    // TODO: trigger download
    alert(`Relatório "${id}" gerado. Integração com PDF/Excel em breve.`)
  }

  const filtered = filtroCateg === 'todos' ? RELATORIOS : RELATORIOS.filter(r => r.categoria === filtroCateg)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-xs text-gray-500 mt-0.5">Geração de relatórios executivos e operacionais</p>
      </div>

      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-gray-400" />
          <select value={periodo} onChange={e => setPeriodo(e.target.value)}
            className="h-9 px-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#C49D5B]">
            <option value="mes_atual">Este mês</option>
            <option value="mes_anterior">Mês anterior</option>
            <option value="trimestre">Trimestre atual</option>
            <option value="semestre">Semestre</option>
            <option value="ano">Ano atual</option>
            <option value="custom">Período personalizado</option>
          </select>
        </div>

        <div className="flex gap-2">
          {['todos', 'avaliacoes', 'financeiro', 'crm', 'imoveis', 'consultorias'].map(c => (
            <button key={c} onClick={() => setFiltroCateg(c)}
              className={`h-9 px-3 rounded-xl text-xs font-medium border transition-colors ${
                filtroCateg === c ? 'bg-[#141420] text-white border-[#141420]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}>
              {c === 'todos' ? 'Todos' : c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Relatórios */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(r => {
          const Icon = r.icon
          const isGerando = gerando === r.id
          return (
            <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Icon size={20} className="text-gray-600" />
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORIA_BADGE[r.categoria]}`}>
                  {r.categoria}
                </span>
              </div>
              <h3 className="text-sm font-bold text-gray-900">{r.title}</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{r.desc}</p>
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <FileText size={11} /> {r.formato}
                </span>
                <button onClick={() => handleGerar(r.id)} disabled={isGerando}
                  className="flex items-center gap-1.5 h-8 px-4 bg-[#141420] text-white rounded-lg text-xs font-semibold hover:bg-[#1f1f30] disabled:opacity-60 transition-colors">
                  {isGerando
                    ? <><Loader2 size={12} className="animate-spin" /> Gerando…</>
                    : <><Download size={12} /> Gerar</>
                  }
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Info card */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
        <p className="text-xs font-semibold text-amber-900 mb-1">Relatórios Personalizados</p>
        <p className="text-xs text-amber-700">
          Para relatórios customizados com logo IMI, NBR 14653, ou integração com tribunais e bancos —
          entre em contato com o suporte técnico. A geração automatizada de PDF com assinatura digital está prevista para Q2 2026.
        </p>
      </div>
    </div>
  )
}
