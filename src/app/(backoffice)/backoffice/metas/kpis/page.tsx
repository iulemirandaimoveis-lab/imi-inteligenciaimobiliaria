'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Activity, Loader2, ChevronRight, TrendingUp, TrendingDown,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

/* ── types ─────────────────────────────────────────────────── */
interface KpiDef {
  id: string
  name: string
  department: string
  direction: string
  unit: string | null
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

function kpiStatus(kpi: KpiDef, value: number): 'green' | 'yellow' | 'red' {
  if (kpi.direction === 'increase') {
    if (value >= kpi.target_value) return 'green'
    if (value >= kpi.warning_threshold) return 'yellow'
    return 'red'
  }
  if (value <= kpi.target_value) return 'green'
  if (value <= kpi.warning_threshold) return 'yellow'
  return 'red'
}

const statusStyles = {
  green: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400', barColor: '#34d399' },
  yellow: { bg: 'bg-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-400', barColor: '#fbbf24' },
  red: { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-400', barColor: '#f87171' },
}

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(v)

/* ── mini bar chart ────────────────────────────────────────── */
function MiniBarChart({ readings, color }: { readings: number[]; color: string }) {
  if (readings.length === 0) return <div className="h-8 flex items-end gap-px" />
  const max = Math.max(...readings, 1)
  return (
    <div className="h-8 flex items-end gap-px">
      {readings.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm min-w-[3px] transition-all duration-300"
          style={{
            height: `${Math.max((v / max) * 100, 4)}%`,
            background: color,
            opacity: 0.4 + (i / readings.length) * 0.6,
          }}
        />
      ))}
    </div>
  )
}

/* ── component ─────────────────────────────────────────────── */
export default function KPIsDashboard() {
  const [loading, setLoading] = useState(true)
  const [dept, setDept] = useState('Todos')
  const [kpiDefs, setKpiDefs] = useState<KpiDef[]>([])
  const [kpiReadings, setKpiReadings] = useState<KpiReading[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [defRes, readRes] = await Promise.all([
        supabase.from('kpi_definitions').select('*'),
        supabase.from('kpi_readings').select('*').order('recorded_at', { ascending: true }).limit(500),
      ])
      setKpiDefs(defRes.data ?? [])
      setKpiReadings(readRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = dept === 'Todos' ? kpiDefs : kpiDefs.filter(k => k.department === dept)

  // Group readings by KPI
  const readingsByKpi = new Map<string, KpiReading[]>()
  kpiReadings.forEach(r => {
    const arr = readingsByKpi.get(r.kpi_id) || []
    arr.push(r)
    readingsByKpi.set(r.kpi_id, arr)
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 text-gold animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-white/40 mb-1">
            <Link href="/backoffice/metas" className="hover:text-white/60 transition-colors">Metas</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/60">KPIs</span>
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-editorial, serif)' }}>
            KPIs
          </h1>
          <p className="text-sm text-white/50 mt-1">Indicadores-chave de performance</p>
        </div>
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

      {/* KPI Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-white/10 p-12 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <Activity className="w-8 h-8 text-white/20 mx-auto mb-3" />
          <p className="text-white/50 text-sm">Nenhum KPI cadastrado.</p>
          <p className="text-white/30 text-xs mt-1">Configure indicadores para acompanhar a performance.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(kpi => {
            const readings = readingsByKpi.get(kpi.id) || []
            const last7 = readings.slice(-7).map(r => r.value)
            const currentValue = readings.length > 0 ? readings[readings.length - 1].value : 0
            const status = kpiStatus(kpi, currentValue)
            const st = statusStyles[status]

            // Trend: compare last 2 readings
            const prev = readings.length >= 2 ? readings[readings.length - 2].value : currentValue
            const trendUp = currentValue >= prev

            return (
              <Link
                key={kpi.id}
                href={`/backoffice/metas/kpis/${kpi.id}`}
                className="rounded-xl border border-white/10 p-5 hover:border-white/20 transition-colors group"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-white/70 group-hover:text-white transition-colors truncate">
                    {kpi.name}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                </div>

                {/* Current value */}
                <div className="flex items-baseline gap-2 mb-3">
                  <p className="text-2xl font-bold text-white" style={{ fontFamily: 'DM Mono, monospace' }}>
                    {fmt(currentValue)}
                  </p>
                  {kpi.unit && <span className="text-xs text-white/40">{kpi.unit}</span>}
                  {readings.length >= 2 && (
                    <span className={`flex items-center gap-0.5 text-xs ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
                      {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    </span>
                  )}
                </div>

                {/* Mini chart */}
                <div className="mb-3">
                  <MiniBarChart readings={last7} color={st.barColor} />
                </div>

                {/* Status & target */}
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${st.bg} ${st.text}`}>
                    {status === 'green' ? 'Saudável' : status === 'yellow' ? 'Atenção' : 'Crítico'}
                  </span>
                  <span className="text-xs text-white/30">
                    Meta: {fmt(kpi.target_value)}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
