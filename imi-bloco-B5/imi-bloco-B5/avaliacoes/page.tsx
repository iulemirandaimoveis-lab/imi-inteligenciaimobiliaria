'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Search, Filter, FileText, CheckCircle, Clock, AlertCircle,
  BarChart2, Download, Eye, Edit, Mail, BookOpen, Sparkles, Calculator,
  ChevronRight, DollarSign, Building2, User, Calendar, TrendingUp,
  MoreHorizontal, ExternalLink, Gavel
} from 'lucide-react'
import Link from 'next/link'

// Mock data
const AVALIACOES = [
  {
    id: '1', protocolo: 'AVL-2026-001', status: 'concluida',
    cliente: 'Maria Santos Silva', tipo: 'Apartamento', bairro: 'Boa Viagem',
    area: 85, valor: 580000, metodo: 'Comparativo', finalidade: 'Compra e Venda',
    prazo: '2026-01-15', criada: '2026-01-08', honorarios: 1800, honorariosStatus: 'pago'
  },
  {
    id: '2', protocolo: 'AVL-2026-002', status: 'em_andamento',
    cliente: 'TJ-PE — Processo 0001234', tipo: 'Casa', bairro: 'Graças',
    area: 320, valor: null, metodo: 'Evolutivo', finalidade: 'Partilha Judicial',
    prazo: '2026-02-28', criada: '2026-01-25', honorarios: 4500, honorariosStatus: 'parcial'
  },
  {
    id: '3', protocolo: 'AVL-2026-003', status: 'aguardando_docs',
    cliente: 'Banco Bradesco', tipo: 'Apartamento', bairro: 'Pina',
    area: 68, valor: null, metodo: 'Comparativo', finalidade: 'Financiamento SFH',
    prazo: '2026-02-25', criada: '2026-02-18', honorarios: 1500, honorariosStatus: 'pendente'
  },
  {
    id: '4', protocolo: 'AVL-2026-004', status: 'concluida',
    cliente: 'Carlos Menezes', tipo: 'Cobertura', bairro: 'Boa Viagem',
    area: 280, valor: 2400000, metodo: 'Comparativo', finalidade: 'Inventário',
    prazo: '2026-02-10', criada: '2026-02-01', honorarios: 7200, honorariosStatus: 'pago'
  },
  {
    id: '5', protocolo: 'AVL-2026-005', status: 'em_andamento',
    cliente: 'FII Recife Imóveis', tipo: 'Comercial - Loja', bairro: 'Boa Viagem',
    area: 145, valor: null, metodo: 'Renda', finalidade: 'Fundo de Investimento',
    prazo: '2026-03-05', criada: '2026-02-19', honorarios: 5500, honorariosStatus: 'pendente'
  },
]

const STATUS_CONFIG = {
  concluida: { label: 'Concluída', icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700' },
  em_andamento: { label: 'Em Andamento', icon: Clock, color: 'bg-blue-100 text-blue-700' },
  aguardando_docs: { label: 'Aguard. Docs', icon: AlertCircle, color: 'bg-amber-100 text-amber-700' },
  cancelada: { label: 'Cancelada', icon: AlertCircle, color: 'bg-red-100 text-red-700' },
}

const HONOR_STATUS = {
  pago: { label: 'Pago', color: 'text-emerald-600' },
  parcial: { label: 'Parcial', color: 'text-amber-600' },
  pendente: { label: 'Pendente', color: 'text-red-500' },
}

export default function AvaliacoesPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')

  const filtered = AVALIACOES.filter(a => {
    const matchSearch = !search || a.cliente.toLowerCase().includes(search.toLowerCase()) ||
      a.protocolo.toLowerCase().includes(search.toLowerCase()) || a.bairro.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'todos' || a.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalHonorarios = AVALIACOES.filter(a => a.honorariosStatus === 'pago').reduce((s, a) => s + a.honorarios, 0)
  const pendentes = AVALIACOES.filter(a => a.honorariosStatus !== 'pago').reduce((s, a) => s + a.honorarios, 0)
  const emAndamento = AVALIACOES.filter(a => a.status === 'em_andamento' || a.status === 'aguardando_docs').length
  const concluidas = AVALIACOES.filter(a => a.status === 'concluida').length

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Avaliações</h1>
          <p className="text-xs text-gray-500 mt-0.5">Laudos técnicos NBR 14653</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/backoffice/avaliacoes/exercicios"
            className="flex items-center gap-2 h-9 px-4 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
            <BookOpen size={15} /> Exercícios
          </Link>
          <Link href="/backoffice/avaliacoes/email-honorarios"
            className="flex items-center gap-2 h-9 px-4 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
            <Mail size={15} /> Email + Honorários
          </Link>
          <Link href="/backoffice/avaliacoes/ia"
            className="flex items-center gap-2 h-9 px-4 border border-purple-200 text-purple-700 bg-purple-50 rounded-xl text-sm font-medium hover:bg-purple-100 transition-colors">
            <Sparkles size={15} /> Gerar com IA
          </Link>
          <Link href="/backoffice/avaliacoes/nova"
            className="flex items-center gap-2 h-9 px-4 bg-[#C49D5B] text-white rounded-xl text-sm font-semibold hover:bg-[#b08a4a] transition-colors">
            <Plus size={16} /> Nova Avaliação
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Honorários Recebidos', value: formatCurrency(totalHonorarios), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'A Receber', value: formatCurrency(pendentes), icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Em Andamento', value: emAndamento, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Concluídas', value: concluidas, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(kpi => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${kpi.bg}`}>
                <Icon size={16} className={kpi.color} />
              </div>
              <p className="text-xl font-bold text-gray-900">{kpi.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
            </div>
          )
        })}
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por cliente, protocolo, bairro..."
            className="w-full h-9 pl-9 pr-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C49D5B]" />
        </div>
        <div className="flex gap-1">
          {[
            { v: 'todos', l: 'Todos' },
            { v: 'em_andamento', l: 'Andamento' },
            { v: 'aguardando_docs', l: 'Docs' },
            { v: 'concluida', l: 'Concluídas' },
          ].map(f => (
            <button key={f.v} onClick={() => setStatusFilter(f.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === f.v ? 'bg-[#C49D5B] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
        {filtered.map(av => {
          const Status = STATUS_CONFIG[av.status as keyof typeof STATUS_CONFIG]
          const StatusIcon = Status.icon
          return (
            <div key={av.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                <FileText size={18} className="text-gray-500" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-mono text-gray-400">{av.protocolo}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${Status.color}`}>
                    <StatusIcon size={11} /> {Status.label}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-900 truncate">{av.cliente}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-gray-500 flex items-center gap-1"><Building2 size={11} />{av.tipo}</span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">📍{av.bairro}</span>
                  <span className="text-xs text-gray-500">{av.area}m²</span>
                </div>
              </div>

              <div className="hidden sm:flex flex-col items-end gap-1">
                {av.valor ? (
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(av.valor)}</p>
                ) : (
                  <p className="text-xs text-gray-400 italic">Valor em andamento</p>
                )}
                <p className={`text-xs font-medium ${HONOR_STATUS[av.honorariosStatus as keyof typeof HONOR_STATUS]?.color}`}>
                  Hon: {formatCurrency(av.honorarios)} • {HONOR_STATUS[av.honorariosStatus as keyof typeof HONOR_STATUS]?.label}
                </p>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link href={`/backoffice/avaliacoes/${av.id}`}
                  className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-white transition-colors">
                  <Eye size={14} />
                </Link>
                <Link href={`/backoffice/avaliacoes/${av.id}/editar`}
                  className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-white transition-colors">
                  <Edit size={14} />
                </Link>
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <FileText size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">Nenhuma avaliação encontrada</p>
          </div>
        )}
      </div>
    </div>
  )
}
