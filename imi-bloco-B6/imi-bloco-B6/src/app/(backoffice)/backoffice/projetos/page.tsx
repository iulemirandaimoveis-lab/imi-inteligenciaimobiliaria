'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Building2, Plus, MapPin, TrendingUp, Eye, Users, DollarSign, BarChart2 } from 'lucide-react'

const PROJETOS = [
  {
    id: '1', nome: 'Reserva Atlantis', cidade: 'Ponta de Pedra', estado: 'PE',
    tipo: 'Empreendimento Costeiro', status: 'estruturacao', fase: 'Estruturação / Captação',
    unidades: 320, unidades_vendidas: 0, vgv: 480000000, pct: 0,
    area_total: 120000, descricao: 'Complexo hoteleiro e residencial de alto padrão. REGEN technology. Conceito: "um filme na forma de território".',
    imagem_url: null,
  },
  {
    id: '2', nome: 'Ocean Blue Cobertura', cidade: 'Recife', estado: 'PE',
    tipo: 'Apartamento Alto Padrão', status: 'lancamento', fase: 'Lançamento',
    unidades: 48, unidades_vendidas: 12, vgv: 96000000, pct: 25,
    area_total: 8200, descricao: 'Torre residencial premium com vista para o mar. Boa Viagem.',
    imagem_url: null,
  },
  {
    id: '3', nome: 'Villa Jardins', cidade: 'Piedade', estado: 'PE',
    tipo: 'Condomínio Horizontal', status: 'obras', fase: 'Em Obras',
    unidades: 32, unidades_vendidas: 24, vgv: 22000000, pct: 75,
    area_total: 14500, descricao: 'Casas em condomínio fechado. Entrega prevista Q3 2026.',
    imagem_url: null,
  },
  {
    id: '4', nome: 'Smart Pina', cidade: 'Recife', estado: 'PE',
    tipo: 'Studio Compacto', status: 'pronto', fase: 'Pronto para Morar',
    unidades: 24, unidades_vendidas: 20, vgv: 10000000, pct: 83,
    area_total: 2800, descricao: 'Studios com design funcional. 4 unidades disponíveis.',
    imagem_url: null,
  },
]

const STATUS_CFG: Record<string, { l: string; dot: string; badge: string }> = {
  estruturacao: { l: 'Estruturação', dot: 'bg-blue-400', badge: 'bg-blue-50 text-blue-700' },
  lancamento:   { l: 'Lançamento',   dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700' },
  obras:        { l: 'Em Obras',     dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700' },
  pronto:       { l: 'Pronto',       dot: 'bg-green-500', badge: 'bg-green-50 text-green-700' },
}

export default function ProjetosPage() {
  const [filtro, setFiltro] = useState('todos')

  const fmtCurrency = (v: number) => {
    if (v >= 1e6) return `R$ ${(v / 1e6).toFixed(0)}M`
    if (v >= 1e3) return `R$ ${(v / 1e3).toFixed(0)}k`
    return `R$ ${v.toLocaleString('pt-BR')}`
  }

  const filtered = filtro === 'todos' ? PROJETOS : PROJETOS.filter(p => p.status === filtro)
  const totalVGV = PROJETOS.reduce((s, p) => s + p.vgv, 0)
  const totalUnidades = PROJETOS.reduce((s, p) => s + p.unidades, 0)
  const totalVendidas = PROJETOS.reduce((s, p) => s + p.unidades_vendidas, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Projetos & Empreendimentos</h1>
          <p className="text-xs text-gray-500 mt-0.5">Portfólio de desenvolvimentos ativos</p>
        </div>
        <button className="flex items-center gap-2 h-9 px-4 bg-[#C49D5B] text-white rounded-xl text-sm font-semibold hover:bg-[#b08a4a] transition-colors">
          <Plus size={16} /> Novo Projeto
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { l: 'VGV Total Portfólio', v: fmtCurrency(totalVGV), icon: DollarSign, cls: 'text-[#C49D5B] bg-amber-50' },
          { l: 'Total de Unidades', v: totalUnidades, icon: Building2, cls: 'text-blue-600 bg-blue-50' },
          { l: 'Unidades Vendidas', v: totalVendidas, icon: Users, cls: 'text-emerald-600 bg-emerald-50' },
          { l: 'Taxa Média de Vendas', v: `${Math.round((totalVendidas / totalUnidades) * 100)}%`, icon: TrendingUp, cls: 'text-purple-600 bg-purple-50' },
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
      <div className="flex gap-2">
        {['todos', 'estruturacao', 'lancamento', 'obras', 'pronto'].map(s => (
          <button key={s} onClick={() => setFiltro(s)}
            className={`h-8 px-3 rounded-xl text-xs font-medium transition-colors border ${
              filtro === s ? 'bg-[#141420] text-white border-[#141420]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
            {s === 'todos' ? 'Todos' : STATUS_CFG[s]?.l}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {filtered.map(p => {
          const stt = STATUS_CFG[p.status]
          return (
            <div key={p.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-sm transition-all">
              {/* Imagem placeholder */}
              <div className="h-36 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
                <Building2 size={48} className="text-gray-300" />
                <span className={`absolute top-3 left-3 text-xs px-2 py-1 rounded-full font-medium ${stt.badge}`}>
                  {stt.l}
                </span>
                <span className="absolute top-3 right-3 text-xs px-2 py-1 rounded-full bg-black/60 text-white font-bold">
                  {fmtCurrency(p.vgv)} VGV
                </span>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{p.nome}</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin size={11} className="text-gray-400" />
                    <span className="text-xs text-gray-500">{p.cidade}, {p.estado}</span>
                    <span className="text-xs text-gray-300 mx-1">·</span>
                    <span className="text-xs text-gray-500">{p.tipo}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.descricao}</p>
                </div>

                {/* Progresso vendas */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">Vendas</span>
                    <span className="text-xs font-bold text-gray-900">{p.unidades_vendidas}/{p.unidades} unid. ({p.pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${p.pct >= 75 ? 'bg-emerald-500' : p.pct >= 30 ? 'bg-[#C49D5B]' : 'bg-blue-400'}`}
                      style={{ width: `${p.pct}%` }}
                    />
                  </div>
                </div>

                {/* Métricas */}
                <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                  <span className="text-xs text-gray-500">Área total: {p.area_total.toLocaleString('pt-BR')} m²</span>
                  <div className="flex gap-2">
                    <button className="h-7 px-3 border border-gray-200 rounded-lg text-xs hover:border-gray-300 flex items-center gap-1">
                      <Eye size={12} /> Ver
                    </button>
                    <button className="h-7 px-3 bg-[#141420] text-white rounded-lg text-xs hover:bg-[#1f1f30] flex items-center gap-1">
                      <BarChart2 size={12} /> Analytics
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
