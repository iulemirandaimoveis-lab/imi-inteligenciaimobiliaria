'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Target, TrendingUp, BarChart3, Activity,
  Loader2, ChevronRight, Zap,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

/* ── types ─────────────────────────────────────────────────── */
interface Objective {
  id: string
  title: string
  department: string
  quarter: string
  level: string
}
interface KeyResult {
  id: string
  objective_id: string
  title: string
  current_value: number
  target_value: number
  start_value: number
}
interface KpiDef {
  id: string
  name: string
  department: string
  direction: string
  target_value: number
  warning_threshold: number
  critical_threshold: number
}
interface KpiReading {
  id: string
  kpi_id: string
  value: number
  recorded_at: string
}

/* ── helpers ───────────────────────────────────────────────── */
const DEPARTMENTS = ['Todos', 'Vendas', 'Marketing', 'Produto', 'Financeiro', 'Operações']
const QUARTER = 'Q1-2026'

function calcScore(kr: KeyResult) {
  const range = kr.target_value - kr.start_value
  if (range === 0) return 0
  return Math.max(0, Math.min(1, (kr.current_value - kr.start_value) / range))
}

function kpiStatus(kpi: KpiDef, value: number): 'green' | 'yellow' | 'red' {
  if (kpi.direction === 'increase') {
    if (value >= kpi.target_value) return 'green'
    if (value >= kpi.warning_threshold) return 'yellow'
    return 'red'
  }
  // decrease: lower is better
  if (value <= kpi.target_value) return 'green'
  if (value <= kpi.warning_threshold) return 'yellow'
  return 'red'
}

const statusColor = {
  green: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  yellow: { bg: 'bg-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-400' },
  red: { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-400' },
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(v)
const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

/* ── component ─────────────────────────────────────────────── */
export default function MetasDashboard() {
  const [loading, setLoading] = useState(true)
  const [dept, setDept] = useState('Todos')
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [keyResults, setKeyResults] = useState<KeyResult[]>([])
  const [kpiDefs, setKpiDefs] = useState<KpiDef[]>([])
  const [kpiReadings, setKpiReadings] = useState<KpiReading[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [objRes, krRes, kpiDefRes, kpiReadRes] = await Promise.all([
        supabase.from('okr_objectives').select('*').eq('quarter', QUARTER),
        supabase.from('okr_key_results').select('*'),
        supabase.from('kpi_definitions').select('*'),
        supabase.from('kpi_readings').select('*').order('recorded_at', { ascending: false }).limit(200),
      ])
      setObjectives(objRes.data ?? [])
      setKeyResults(krRes.data ?? [])
      setKpiDefs(kpiDefRes.data ?? [])
      setKpiReadings(kpiReadRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filteredObj = dept === 'Todos' ? objectives : objectives.filter(o => o.department === dept)
  const filteredKpis = dept === 'Todos' ? kpiDefs : kpiDefs.filter(k => k.department === dept)

  // OKR summary
  const totalObj = filteredObj.length
  const objKRs = keyResults.filter(kr => filteredObj.some(o => o.id === kr.objective_id))
  const avgScore = objKRs.length > 0
    ? objKRs.reduce((s, kr) => s + calcScore(kr), 0) / objKRs.length
    : 0

  // KPI health
  const latestReadings = new Map<string, number>()
  kpiReadings.forEach(r => {
    if (!latestReadings.has(r.kpi_id)) latestReadings.set(r.kpi_id, r.value)
  })

  const kpiHealth = filteredKpis.map(kpi => {
    const val = latestReadings.get(kpi.id) ?? 0
    return { ...kpi, currentValue: val, status: kpiStatus(kpi, val) }
  })

  const healthCounts = { green: 0, yellow: 0, red: 0 }
  kpiHealth.forEach(k => healthCounts[k.status]++)

  // North Star: ARR mock (from KPIs or hardcoded)
  const arrKpi = kpiDefs.find(k => k.name?.toLowerCase().includes('arr'))
  const arrValue = arrKpi ? (latestReadings.get(arrKpi.id) ?? 0) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 text-gold animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-editorial, serif)' }}>
            Metas & OKRs
          </h1>
          <p className="text-sm text-white/50 mt-1">{QUARTER} — Painel de acompanhamento</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/backoffice/metas/okrs"
            className="px-4 py-2 rounded-lg text-sm font-medium border border-white/10 text-white/70 hover:text-white hover:border-white/20 transition-colors"
          >
            Ver OKRs
          </Link>
          <Link
            href="/backoffice/metas/kpis"
            className="px-4 py-2 rounded-lg text-sm font-medium text-navy-900"
            style={{ background: '#C8A44A' }}
          >
            Ver KPIs
          </Link>
        </div>
      </div>

      {/* North Star Metric */}
      <div className="rounded-xl border border-gold/30 p-6" style={{ background: 'rgba(200,164,74,0.05)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(200,164,74,0.15)' }}>
            <Zap className="w-5 h-5 text-gold" />
          </div>
          <div>
            <p className="text-xs text-gold font-medium uppercase tracking-wider">North Star Metric</p>
            <p className="text-xs text-white/40">Annual Recurring Revenue</p>
          </div>
        </div>
        <p className="text-3xl font-bold text-white" style={{ fontFamily: 'DM Mono, monospace' }}>
          {arrValue > 0 ? fmtCurrency(arrValue) : 'Sem dados'}
        </p>
      </div>

      {/* Department filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {DEPARTMENTS.map(d => (
          <button
            key={d}
            onClick={() => setDept(d)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              dept === d
                ? 'bg-gold/20 text-gold border border-gold/30'
                : 'bg-white/[0.03] text-white/50 border border-white/10 hover:text-white/70'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* OKR Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/10 p-5" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-gold" />
            <span className="text-xs text-white/50">Objetivos</span>
          </div>
          <p className="text-2xl font-bold text-white" style={{ fontFamily: 'DM Mono, monospace' }}>
            {totalObj}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 p-5" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-white/50">Key Results</span>
          </div>
          <p className="text-2xl font-bold text-white" style={{ fontFamily: 'DM Mono, monospace' }}>
            {objKRs.length}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 p-5" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-white/50">Score Médio</span>
          </div>
          <p className="text-2xl font-bold text-white" style={{ fontFamily: 'DM Mono, monospace' }}>
            {fmt(avgScore * 100)}%
          </p>
          <div className="mt-2 h-2 rounded-full overflow-hidden bg-white/10">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${avgScore * 100}%`, background: '#C8A44A' }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-white/10 p-5" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-white/50">KPIs Ativos</span>
          </div>
          <p className="text-2xl font-bold text-white" style={{ fontFamily: 'DM Mono, monospace' }}>
            {filteredKpis.length}
          </p>
        </div>
      </div>

      {/* KPI Health Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Saúde dos KPIs</h2>
          <div className="flex gap-3 text-xs text-white/50">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> {healthCounts.green}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> {healthCounts.yellow}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-400" /> {healthCounts.red}
            </span>
          </div>
        </div>

        {kpiHealth.length === 0 ? (
          <div className="rounded-xl border border-white/10 p-12 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <Activity className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-white/50 text-sm">Nenhum KPI cadastrado ainda.</p>
            <p className="text-white/30 text-xs mt-1">Cadastre KPIs para acompanhar a saúde dos indicadores.</p>
            <Link
              href="/backoffice/metas/kpis"
              className="inline-block mt-4 px-4 py-2 rounded-lg text-sm font-medium text-navy-900"
              style={{ background: '#C8A44A' }}
            >
              Configurar KPIs
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {kpiHealth.map(kpi => {
              const sc = statusColor[kpi.status]
              return (
                <Link
                  key={kpi.id}
                  href={`/backoffice/metas/kpis/${kpi.id}`}
                  className="rounded-xl border border-white/10 p-4 hover:border-white/20 transition-colors group"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/70 group-hover:text-white transition-colors">{kpi.name}</span>
                    <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
                  </div>
                  <p className="text-xl font-bold text-white" style={{ fontFamily: 'DM Mono, monospace' }}>
                    {fmt(kpi.currentValue)}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${sc.bg} ${sc.text}`}>
                      {kpi.status === 'green' ? 'Saudável' : kpi.status === 'yellow' ? 'Atenção' : 'Crítico'}
                    </span>
                    <span className="text-xs text-white/30">Meta: {fmt(kpi.target_value)}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Retrospectiva', desc: 'Revisão do quarter', href: '/backoffice/metas/retrospectiva', icon: BarChart3 },
          { label: 'Alinhamento', desc: 'Mapa de OKRs', href: '/backoffice/metas/alinhamento', icon: Target },
          { label: 'Novo OKR', desc: 'Criar objetivo', href: '/backoffice/metas/okrs/novo', icon: TrendingUp },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl border border-white/10 p-5 hover:border-gold/30 transition-colors group"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-gold" />
                <div>
                  <p className="text-sm font-medium text-white group-hover:text-gold transition-colors">{item.label}</p>
                  <p className="text-xs text-white/40">{item.desc}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-gold transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
