'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Briefcase, Plus, Search, Eye, Edit, Clock,
  CheckCircle2, DollarSign, Calendar, MapPin, Loader2, RefreshCw
} from 'lucide-react'

interface Consultoria {
  id: string
  protocolo: string
  cliente_nome: string
  cliente_email: string
  cliente_tipo: string
  tipo: string
  descricao: string
  cidade: string
  status: 'em_andamento' | 'concluida' | 'proposta' | 'cancelada'
  honorarios: number
  honorarios_status: 'pago' | 'parcial' | 'pendente'
  data_inicio: string
  data_prev_conclusao: string
}

const TIPO_LABEL: Record<string, string> = {
  estrategica: 'Estratégica', tributaria: 'Tributária',
  patrimonial: 'Patrimonial', mercado: 'Análise de Mercado', juridica: 'Jurídica',
}

const STATUS_CFG: Record<string, { l: string; cls: string }> = {
  em_andamento: { l: 'Em Andamento', cls: 'bg-blue-50 text-blue-700' },
  concluida: { l: 'Concluída', cls: 'bg-emerald-50 text-emerald-700' },
  proposta: { l: 'Proposta', cls: 'bg-purple-50 text-purple-700' },
  cancelada: { l: 'Cancelada', cls: 'bg-red-50 text-red-700' },
}

const HON_CFG: Record<string, { l: string; cls: string }> = {
  pago: { l: 'Pago', cls: 'text-emerald-600' },
  parcial: { l: 'Parcial', cls: 'text-amber-600' },
  pendente: { l: 'Pendente', cls: 'text-red-500' },
}

// Fallback mock para quando o banco está vazio
const MOCK_FALLBACK: Consultoria[] = [
  {
    id: 'mock-1', protocolo: 'CON-2026-001',
    cliente_nome: 'Família Cavalcanti', cliente_email: 'cavalcanti@gmail.com',
    cliente_tipo: 'PF',
    tipo: 'patrimonial', descricao: 'Estruturação patrimonial pré-holding familiar — 3 imóveis Boa Viagem',
    cidade: 'Recife', status: 'em_andamento', honorarios: 8500,
    honorarios_status: 'parcial', data_inicio: '2026-01-15', data_prev_conclusao: '2026-03-15',
  },
  {
    id: 'mock-2', protocolo: 'CON-2026-002',
    cliente_nome: 'Construtora Omega S.A.', cliente_email: 'omega@construtora.com',
    cliente_tipo: 'PJ',
    tipo: 'mercado', descricao: 'Análise de viabilidade VGV — Empreendimento Torre Norte, Olinda',
    cidade: 'Olinda', status: 'concluida', honorarios: 15000,
    honorarios_status: 'pago', data_inicio: '2025-11-01', data_prev_conclusao: '2026-01-31',
  },
]

export default function ConsultoriasPage() {
  const [data, setData] = useState<Consultoria[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')

  const fmtCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/consultorias')
      if (res.ok) {
        const json = await res.json()
        const list = Array.isArray(json) ? json : []
        setData(list.length > 0 ? list : MOCK_FALLBACK)
      } else {
        setData(MOCK_FALLBACK)
      }
    } catch {
      setData(MOCK_FALLBACK)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = data.filter(c => {
    const matchSearch = c.cliente_nome.toLowerCase().includes(search.toLowerCase()) ||
      c.protocolo.toLowerCase().includes(search.toLowerCase()) ||
      (c.cidade || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = filtroStatus === 'todos' || c.status === filtroStatus
    return matchSearch && matchStatus
  })

  const totalHonorarios = data.reduce((s, c) => s + Number(c.honorarios || 0), 0)
  const recebido = data.filter(c => c.honorarios_status === 'pago').reduce((s, c) => s + Number(c.honorarios || 0), 0)
  const emAndamento = data.filter(c => c.status === 'em_andamento').length
  const propostas = data.filter(c => c.status === 'proposta').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Consultorias</h1>
          <p className="text-xs text-gray-500 mt-0.5">Gestão de projetos e honorários</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="w-9 h-9 border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors">
            <RefreshCw size={14} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link href="/backoffice/consultorias/nova"
            className="flex items-center gap-2 h-9 px-4 bg-[#C49D5B] text-white rounded-xl text-sm font-semibold hover:bg-[#b08a4a] transition-colors">
            <Plus size={16} /> Nova Consultoria
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { l: 'Total Portfólio', v: fmtCurrency(totalHonorarios), icon: DollarSign, cls: 'text-[#C49D5B] bg-amber-50' },
          { l: 'Honorários Recebidos', v: fmtCurrency(recebido), icon: CheckCircle2, cls: 'text-emerald-600 bg-emerald-50' },
          { l: 'Em Andamento', v: emAndamento, icon: Clock, cls: 'text-blue-600 bg-blue-50' },
          { l: 'Propostas Abertas', v: propostas, icon: Briefcase, cls: 'text-purple-600 bg-purple-50' },
        ].map(kpi => {
          const Icon = kpi.icon
          const [textCls, bgCls] = kpi.cls.split(' ')
          return (
            <div key={kpi.l} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${bgCls}`}>
                <Icon size={18} className={textCls} />
              </div>
              <p className="text-xl font-bold text-gray-900">{kpi.v}</p>
              <p className="text-xs text-gray-500 mt-0.5">{kpi.l}</p>
            </div>
          )
        })}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar cliente, protocolo, cidade…"
            className="w-full pl-9 pr-4 h-9 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#C49D5B]"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {['todos', 'em_andamento', 'proposta', 'concluida', 'cancelada'].map(s => (
            <button key={s}
              onClick={() => setFiltroStatus(s)}
              className={`h-9 px-3 rounded-xl text-xs font-medium transition-colors border whitespace-nowrap ${filtroStatus === s
                ? 'bg-[#141420] text-white border-[#141420]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
              {s === 'todos' ? 'Todos' : STATUS_CFG[s]?.l}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-[#C49D5B]" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <Briefcase size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">Nenhuma consultoria encontrada</p>
              <Link href="/backoffice/consultorias/nova"
                className="mt-4 inline-flex items-center gap-2 text-sm text-[#C49D5B] font-medium hover:underline">
                <Plus size={14} /> Criar nova consultoria
              </Link>
            </div>
          )}

          {filtered.map(c => {
            const stt = STATUS_CFG[c.status] || { l: c.status, cls: 'bg-gray-50 text-gray-600' }
            const hon = HON_CFG[c.honorarios_status] || { l: c.honorarios_status, cls: 'text-gray-500' }
            return (
              <div key={c.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Briefcase size={18} className="text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono text-gray-400">{c.protocolo}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stt.cls}`}>{stt.l}</span>
                          {c.tipo && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                              {TIPO_LABEL[c.tipo] || c.tipo}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-gray-900 mt-1">{c.cliente_nome}</p>
                        {c.descricao && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{c.descricao}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-gray-900">{c.honorarios ? fmtCurrency(c.honorarios) : '—'}</p>
                        <p className={`text-xs font-medium ${hon.cls}`}>{hon.l}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      {c.cidade && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin size={12} /> {c.cidade}
                        </span>
                      )}
                      {c.data_inicio && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar size={12} /> Início: {new Date(c.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </span>
                      )}
                      {c.data_prev_conclusao && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock size={12} /> Conclusão: {new Date(c.data_prev_conclusao + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </span>
                      )}
                      <div className="ml-auto flex gap-2">
                        <button className="h-7 px-3 border border-gray-200 rounded-lg text-xs hover:border-gray-300 flex items-center gap-1 cursor-pointer">
                          <Eye size={12} /> Ver
                        </button>
                        <button className="h-7 px-3 border border-gray-200 rounded-lg text-xs hover:border-gray-300 flex items-center gap-1 cursor-pointer">
                          <Edit size={12} /> Editar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
