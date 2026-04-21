'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Target, TrendingUp, BarChart3, Activity,
  Loader2, ChevronRight, Zap,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { T } from '../../lib/theme'
import { PageIntelHeader, KPICard } from '../../components/ui'

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
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: T.accent }} />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageIntelHeader
        moduleLabel="METAS · OKR"
        title="Metas & OKRs"
        subtitle="Q1-2026 — Painel de acompanhamento"
        actions={
          <div className="flex gap-2">
            <Link
              href="/backoffice/metas/okrs"
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: T.textMuted, border: `1px solid ${T.border}` }}
            >
              Ver OKRs
            </Link>
            <Link
              href="/backoffice/metas/kpis"
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
            >
              Ver KPIs
            </Link>
          </div>
        }
      />

      {/* North Star Metric */}
      <div
        className="rounded-lg p-6"
        style={{ background: T.activeBg, border: `1px solid ${T.borderActive}` }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: T.activeBg }}
          >
            <Zap className="w-5 h-5" style={{ color: T.accent }} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: T.accent }}>North Star Metric</p>
            <p className="text-xs" style={{ color: T.textDim }}>Annual Recurring Revenue</p>
          </div>
        </div>
        <p className="text-3xl font-bold" style={{ color: T.text, fontFamily: T.font.data }}>
          {arrValue > 0 ? fmtCurrency(arrValue) : 'Sem dados'}
        </p>
      </div>

      {/* Department filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {DEPARTMENTS.map(d => (
          <button
            key={d}
            onClick={() => setDept(d)}
            className="px-3 py-1.5 rounded-[6px] text-xs font-medium whitespace-nowrap transition-colors"
            style={
              dept === d
                ? { background: T.activeBg, color: T.accent, border: `1px solid ${T.borderActive}` }
                : { background: T.surface, color: T.textMuted, border: `1px solid ${T.border}` }
            }
          >
            {d}
          </button>
        ))}
      </div>

      {/* OKR Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          label="Objetivos"
          value={totalObj}
          icon={<Target className="w-4 h-4" />}
          accent="gold"
        />
        <KPICard
          label="Key Results"
          value={objKRs.length}
          icon={<BarChart3 className="w-4 h-4" />}
          accent="blue"
        />
        <KPICard
          label="Score Médio"
          value={`${fmt(avgScore * 100)}%`}
          sublabel={`${objKRs.length} key results avaliados`}
          icon={<TrendingUp className="w-4 h-4" />}
          accent="success"
        />
        <KPICard
          label="KPIs Ativos"
          value={filteredKpis.length}
          icon={<Activity className="w-4 h-4" />}
          accent="info"
        />
      </div>

      {/* KPI Health Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: T.text }}>Saúde dos KPIs</h2>
          <div className="flex gap-3 text-xs" style={{ color: T.textMuted }}>
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
          <div
            className="rounded-lg p-12 text-center"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}
          >
            <Activity className="w-8 h-8 mx-auto mb-3" style={{ color: T.textDim }} />
            <p className="text-sm" style={{ color: T.textMuted }}>Nenhum KPI cadastrado ainda.</p>
            <p className="text-xs mt-1" style={{ color: T.textDim }}>Cadastre KPIs para acompanhar a saúde dos indicadores.</p>
            <Link
              href="/backoffice/metas/kpis"
              className="inline-block mt-4 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
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
                  className="rounded-lg p-4 transition-colors group"
                  style={{ background: T.surface, border: `1px solid ${T.border}` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm transition-colors" style={{ color: T.textMuted }}>{kpi.name}</span>
                    <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
                  </div>
                  <p className="text-xl font-bold" style={{ color: T.text, fontFamily: T.font.data }}>
                    {fmt(kpi.currentValue)}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`px-2 py-0.5 rounded-[6px] text-xs ${sc.bg} ${sc.text}`}>
                      {kpi.status === 'green' ? 'Saudável' : kpi.status === 'yellow' ? 'Atenção' : 'Crítico'}
                    </span>
                    <span className="text-xs" style={{ color: T.textDim }}>Meta: {fmt(kpi.target_value)}</span>
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
            className="rounded-lg p-5 transition-colors group"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5" style={{ color: T.accent }} />
                <div>
                  <p className="text-sm font-medium transition-colors" style={{ color: T.text }}>{item.label}</p>
                  <p className="text-xs" style={{ color: T.textDim }}>{item.desc}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4" style={{ color: T.textDim }} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
