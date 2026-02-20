'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion'
import {
  TrendingUp, Users, Building2, DollarSign, FileText, ArrowRight,
  CheckCircle2, MapPin, Eye, Calendar, ChevronRight, Zap, Scale,
  CreditCard, Briefcase, BarChart2, Plus, Clock, AlertCircle
} from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import Link from 'next/link'

// ── Animated Counter ─────────────────────────────────────────
function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0 }: {
  value: number; prefix?: string; suffix?: string; decimals?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const motionVal = useMotionValue(0)
  const spring = useSpring(motionVal, { stiffness: 100, damping: 25 })

  useEffect(() => { if (inView) motionVal.set(value) }, [inView, value, motionVal])
  useEffect(() => spring.on('change', v => {
    if (ref.current) ref.current.textContent = prefix + v.toFixed(decimals) + suffix
  }), [spring, prefix, suffix, decimals])

  return <span ref={ref}>{prefix}0{suffix}</span>
}

const AREA_DATA = [
  { mes: 'Set', receita: 1.2, leads: 82 },
  { mes: 'Out', receita: 1.4, leads: 95 },
  { mes: 'Nov', receita: 1.1, leads: 78 },
  { mes: 'Dez', receita: 1.8, leads: 112 },
  { mes: 'Jan', receita: 2.1, leads: 118 },
  { mes: 'Fev', receita: 2.4, leads: 127 },
]

interface Props {
  stats: any
  avStats: any
  recentLeads: any[]
  recentAvaliacoes: any[]
  imoveisCount: number
}

export default function DashboardClient({ stats, avStats, recentLeads, recentAvaliacoes, imoveisCount }: Props) {
  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

  const KPIS = [
    {
      label: 'Receita do Mês', icon: DollarSign,
      value: formatCurrency(stats.receita_mes || 24500),
      sub: '+18% vs. mês anterior', up: true,
      color: 'text-[#C49D5B]', bg: 'bg-amber-50', href: '/backoffice/financeiro'
    },
    {
      label: 'Leads Ativos', icon: Users,
      value: stats.total_leads || 127,
      sub: `+${stats.leads_today || 4} hoje`, up: true,
      color: 'text-blue-600', bg: 'bg-blue-50', href: '/backoffice/leads'
    },
    {
      label: 'Honorários a Receber', icon: Scale,
      value: formatCurrency(avStats.honorarios_pendentes || 7500),
      sub: `${avStats.em_andamento || 2} laudos em andamento`, up: null,
      color: 'text-purple-600', bg: 'bg-purple-50', href: '/backoffice/avaliacoes'
    },
    {
      label: 'Imóveis no Portfólio', icon: Building2,
      value: imoveisCount,
      sub: 'Ativos cadastrados', up: null,
      color: 'text-emerald-600', bg: 'bg-emerald-50', href: '/backoffice/imoveis'
    },
  ]

  const QUICK_ACTIONS = [
    { label: 'Nova Avaliação', href: '/backoffice/avaliacoes/nova', icon: Scale, color: 'bg-[#C49D5B] text-white shadow-sm hover:bg-[#b08a4a]' },
    { label: 'Interpretar Email', href: '/backoffice/avaliacoes/email-honorarios', icon: FileText, color: 'bg-white text-gray-900 border border-gray-200 hover:border-[#C49D5B] hover:text-[#C49D5B]' },
    { label: 'Novo Imóvel', href: '/backoffice/imoveis/novo', icon: Building2, color: 'bg-[#141420] text-white hover:bg-black shadow-sm' },
    { label: 'Simulador', href: '/backoffice/credito', icon: CreditCard, color: 'bg-white text-gray-900 border border-gray-200 hover:border-[#C49D5B] hover:text-[#C49D5B]' },
  ]

  const STATUS_AV: Record<string, { l: string; c: string }> = {
    concluida: { l: 'Concluída', c: 'text-emerald-600 bg-emerald-50' },
    em_andamento: { l: 'Em Andamento', c: 'text-blue-600 bg-blue-50' },
    aguardando_docs: { l: 'Aguard. Docs', c: 'text-amber-600 bg-amber-50' },
  }

  return (
    <div className="space-y-6">
      {/* Saudação */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Link href="/backoffice/avaliacoes/nova"
          className="flex items-center gap-2 h-9 px-4 bg-[#C49D5B] text-white rounded-xl text-sm font-semibold hover:bg-[#b08a4a] transition-colors">
          <Plus size={16} /> Nova Avaliação
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {KPIS.map((kpi, i) => {
          const Icon = kpi.icon
          return (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Link href={kpi.href} className="block bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-all group">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${kpi.bg}`}>
                  <Icon size={18} className={kpi.color} />
                </div>
                <p className="text-xl font-bold text-gray-900">
                  {typeof kpi.value === 'number'
                    ? <AnimatedNumber value={kpi.value} />
                    : kpi.value}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
                <p className={`text-xs mt-1 font-medium ${kpi.up === true ? 'text-emerald-600' : kpi.up === false ? 'text-red-500' : 'text-gray-400'}`}>
                  {kpi.up === true && '↑ '}{kpi.up === false && '↓ '}{kpi.sub}
                </p>
              </Link>
            </motion.div>
          )
        })}
      </div>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {QUICK_ACTIONS.map(action => {
          const Icon = action.icon
          return (
            <Link key={action.label} href={action.href}
              className={`flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95 ${action.color}`}>
              <Icon size={16} /> {action.label}
            </Link>
          )
        })}
      </div>

      {/* Gráfico + Avaliações */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Receita */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-gray-900">Receita & Leads</p>
              <p className="text-xs text-gray-500">Últimos 6 meses</p>
            </div>
            <span className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full font-medium">+18% MoM</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={AREA_DATA}>
              <defs>
                <linearGradient id="receitaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C49D5B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#C49D5B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #F3F4F6', fontSize: 12 }} />
              <Area type="monotone" dataKey="receita" stroke="#C49D5B" strokeWidth={2} fill="url(#receitaGrad)" name="Receita (R$M)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status Avaliações */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-sm font-bold text-gray-900 mb-1">Avaliações</p>
          <p className="text-xs text-gray-500 mb-4">Status atual</p>
          <div className="space-y-3">
            {[
              { l: 'Concluídas', v: avStats.concluidas || 2, c: 'bg-emerald-500', pct: ((avStats.concluidas || 2) / (avStats.total || 5)) * 100 },
              { l: 'Em Andamento', v: avStats.em_andamento || 2, c: 'bg-blue-500', pct: ((avStats.em_andamento || 2) / (avStats.total || 5)) * 100 },
              { l: 'Aguard. Docs', v: avStats.aguardando_docs || 1, c: 'bg-amber-500', pct: ((avStats.aguardando_docs || 1) / (avStats.total || 5)) * 100 },
            ].map(item => (
              <div key={item.l}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">{item.l}</span>
                  <span className="text-xs font-bold text-gray-900">{item.v}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${item.c} rounded-full transition-all`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Honorários recebidos</span>
              <span className="font-semibold text-emerald-600">{formatCurrency(avStats.honorarios_recebidos || 9800)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">A receber</span>
              <span className="font-semibold text-amber-600">{formatCurrency(avStats.honorarios_pendentes || 7500)}</span>
            </div>
          </div>

          <Link href="/backoffice/avaliacoes"
            className="flex items-center justify-center gap-1 mt-4 text-xs text-[#C49D5B] font-medium hover:underline">
            Ver todas <ChevronRight size={13} />
          </Link>
        </div>
      </div>

      {/* Últimas Avaliações + Leads Recentes */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Avaliações recentes */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-50">
            <p className="text-sm font-bold text-gray-900">Avaliações Recentes</p>
            <Link href="/backoffice/avaliacoes" className="text-xs text-[#C49D5B] hover:underline font-medium">Ver todas</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {(recentAvaliacoes.length > 0 ? recentAvaliacoes : [
              { id: '1', protocolo: 'AVL-2026-001', cliente_nome: 'Maria Santos', tipo_imovel: 'Apartamento', bairro: 'Boa Viagem', status: 'concluida', honorarios: 1800 },
              { id: '2', protocolo: 'AVL-2026-002', cliente_nome: 'TJ-PE Processo', tipo_imovel: 'Casa', bairro: 'Graças', status: 'em_andamento', honorarios: 4500 },
              { id: '3', protocolo: 'AVL-2026-003', cliente_nome: 'Banco Bradesco', tipo_imovel: 'Apartamento', bairro: 'Pina', status: 'aguardando_docs', honorarios: 1500 },
            ]).map((av: any) => {
              const stt = STATUS_AV[av.status] || { l: av.status, c: 'text-gray-500 bg-gray-50' }
              return (
                <Link key={av.id} href={`/backoffice/avaliacoes/${av.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Scale size={14} className="text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-gray-400">{av.protocolo}</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{av.cliente_nome}</p>
                    <p className="text-xs text-gray-500">{av.tipo_imovel} • {av.bairro}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stt.c}`}>{stt.l}</span>
                    {av.honorarios && <p className="text-xs text-gray-500 mt-0.5">{formatCurrency(av.honorarios)}</p>}
                  </div>
                </Link>
              )
            })}
          </div>
          <div className="p-3 border-t border-gray-50">
            <Link href="/backoffice/avaliacoes/nova"
              className="flex items-center justify-center gap-2 h-8 w-full border border-dashed border-gray-200 rounded-lg text-xs text-gray-500 hover:border-[#C49D5B] hover:text-[#C49D5B] transition-colors">
              <Plus size={13} /> Nova Avaliação
            </Link>
          </div>
        </div>

        {/* Leads recentes */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-50">
            <p className="text-sm font-bold text-gray-900">Leads Recentes</p>
            <Link href="/backoffice/leads" className="text-xs text-[#C49D5B] hover:underline font-medium">Ver todos</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {(recentLeads.length > 0 ? recentLeads : [
              { id: '1', name: 'Maria Santos Silva', email: 'maria@gmail.com', source: 'Formulário', interest: 'Avaliação', status: 'novo', created_at: new Date().toISOString() },
              { id: '2', name: 'João Paulo Ferreira', email: 'joao@gmail.com', source: 'WhatsApp', interest: 'Compra', status: 'qualificado', created_at: new Date().toISOString() },
              { id: '3', name: 'Ana Beatriz Correia', email: 'ana@gmail.com', source: 'Instagram', interest: 'Financiamento', status: 'proposta', created_at: new Date().toISOString() },
            ]).map((lead: any) => {
              const initials = lead.name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() || 'LD'
              return (
                <Link key={lead.id} href={`/backoffice/leads/${lead.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-[#C49D5B] flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-white">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{lead.name}</p>
                    <p className="text-xs text-gray-500">{lead.source} • {lead.interest}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${lead.status === 'qualificado' ? 'bg-emerald-50 text-emerald-700' :
                      lead.status === 'proposta' ? 'bg-purple-50 text-purple-700' :
                        'bg-blue-50 text-blue-700'
                    }`}>
                    {lead.status || 'novo'}
                  </span>
                </Link>
              )
            })}
          </div>
          <div className="p-3 border-t border-gray-50">
            <Link href="/backoffice/leads/novo"
              className="flex items-center justify-center gap-2 h-8 w-full border border-dashed border-gray-200 rounded-lg text-xs text-gray-500 hover:border-[#C49D5B] hover:text-[#C49D5B] transition-colors">
              <Plus size={13} /> Novo Lead
            </Link>
          </div>
        </div>
      </div>

      {/* Atalhos dos módulos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          { l: 'Avaliações', href: '/backoffice/avaliacoes', icon: Scale, v: avStats.total || 5 },
          { l: 'Imóveis', href: '/backoffice/imoveis', icon: Building2, v: imoveisCount },
          { l: 'Crédito', href: '/backoffice/credito', icon: CreditCard, v: 3 },
          { l: 'Consultoria', href: '/backoffice/consultorias', icon: Briefcase, v: 2 },
          { l: 'Exercícios', href: '/backoffice/avaliacoes/exercicios', icon: BarChart2, v: '15+' },
          { l: 'Relatórios', href: '/backoffice/relatorios', icon: FileText, v: '→' },
        ].map(item => {
          const Icon = item.icon
          return (
            <Link key={item.l} href={item.href}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100 hover:border-[#C49D5B] hover:shadow-sm transition-all group text-center">
              <div className="w-9 h-9 rounded-xl bg-gray-100 group-hover:bg-amber-50 flex items-center justify-center transition-colors">
                <Icon size={18} className="text-gray-500 group-hover:text-[#C49D5B] transition-colors" />
              </div>
              <p className="text-lg font-bold text-gray-900">{item.v}</p>
              <p className="text-xs text-gray-500">{item.l}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
