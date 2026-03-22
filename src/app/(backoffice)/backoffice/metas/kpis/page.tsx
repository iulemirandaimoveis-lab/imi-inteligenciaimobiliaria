'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Activity, Loader2, TrendingUp, TrendingDown,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { T } from '../../../lib/theme'
import { PageIntelHeader } from '../../../components/ui'

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
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: T.accent }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageIntelHeader
        moduleLabel="METAS · KPI"
        title="KPIs"
        subtitle="Indicadores-chave de performance"
        breadcrumbs={[{ label: 'Metas', href: '/backoffice/metas' }]}
      />

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

      {/* KPI Grid */}
      {filtered.length === 0 ? (
        <div
          className="rounded-lg p-12 text-center"
          style={{ background: T.surface, border: `1px solid ${T.border}` }}
        >
          <Activity className="w-8 h-8 mx-auto mb-3" style={{ color: T.textDim }} />
          <p className="text-sm" style={{ color: T.textMuted }}>Nenhum KPI cadastrado.</p>
          <p className="text-xs mt-1" style={{ color: T.textDim }}>Configure indicadores para acompanhar a performance.</p>
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
                className="rounded-lg p-5 transition-colors group"
                style={{ background: T.surface, border: `1px solid ${T.border}` }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm transition-colors truncate" style={{ color: T.textMuted }}>
                    {kpi.name}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                </div>

                {/* Current value */}
                <div className="flex items-baseline gap-2 mb-3">
                  <p className="text-2xl font-bold" style={{ color: T.text, fontFamily: T.font.data }}>
                    {fmt(currentValue)}
                  </p>
                  {kpi.unit && <span className="text-xs" style={{ color: T.textDim }}>{kpi.unit}</span>}
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
                  <span className={`px-2 py-0.5 rounded-[6px] text-xs ${st.bg} ${st.text}`}>
                    {status === 'green' ? 'Saudável' : status === 'yellow' ? 'Atenção' : 'Crítico'}
                  </span>
                  <span className="text-xs" style={{ color: T.textDim }}>
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
