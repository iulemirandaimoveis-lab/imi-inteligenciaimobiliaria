'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronRight, Activity, Loader2, TrendingUp, TrendingDown,
  Plus, X, CheckCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

/* ── types ─────────────────────────────────────────────────── */
interface KpiDef {
  id: string
  name: string
  description: string | null
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
  green: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Saudável', barColor: '#34d399' },
  yellow: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Atenção', barColor: '#fbbf24' },
  red: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Crítico', barColor: '#f87171' },
}

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(v)
const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

const inputCls = 'w-full px-3 py-2 rounded-[6px] text-sm bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#3D6FFF]/50 transition-colors'

/* ── component ─────────────────────────────────────────────── */
export default function KPIDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [kpi, setKpi] = useState<KpiDef | null>(null)
  const [readings, setReadings] = useState<KpiReading[]>([])

  // New reading form
  const [showForm, setShowForm] = useState(false)
  const [newValue, setNewValue] = useState('')
  const [saving, setSaving] = useState(false)

  async function loadData() {
    const supabase = createClient()
    const [defRes, readRes] = await Promise.all([
      supabase.from('kpi_definitions').select('*').eq('id', id).single(),
      supabase.from('kpi_readings').select('*').eq('kpi_id', id).order('recorded_at', { ascending: true }).limit(30),
    ])
    setKpi(defRes.data)
    setReadings(readRes.data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [id])

  async function handleNewReading() {
    if (!newValue) return
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('kpi_readings').insert({
        kpi_id: id,
        value: parseFloat(newValue),
      })
      if (error) throw error
      toast.success('Leitura registrada!')
      setNewValue('')
      setShowForm(false)
      loadData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 text-[#3D6FFF] animate-spin" />
      </div>
    )
  }

  if (!kpi) {
    return (
      <div className="rounded-lg border border-white/10 p-12 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <Activity className="w-8 h-8 text-white/20 mx-auto mb-3" />
        <p className="text-white/50 text-sm">KPI não encontrado.</p>
        <Link href="/backoffice/metas/kpis" className="text-[#3D6FFF] text-sm mt-2 inline-block hover:underline">
          Voltar para KPIs
        </Link>
      </div>
    )
  }

  const currentValue = readings.length > 0 ? readings[readings.length - 1].value : 0
  const prevValue = readings.length >= 2 ? readings[readings.length - 2].value : currentValue
  const trendUp = currentValue >= prevValue
  const status = kpiStatus(kpi, currentValue)
  const st = statusStyles[status]
  const maxVal = Math.max(...readings.map(r => r.value), kpi.target_value, 1)

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-xs text-white/40 mb-1">
          <Link href="/backoffice/metas" className="hover:text-white/60 transition-colors">Metas</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/backoffice/metas/kpis" className="hover:text-white/60 transition-colors">KPIs</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-white/60 truncate max-w-[200px]">{kpi.name}</span>
        </div>
      </div>

      {/* KPI Header */}
      <div className="rounded-lg border border-white/10 p-6" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-white">{kpi.name}</h1>
            {kpi.description && <p className="text-sm text-white/50 mt-1">{kpi.description}</p>}
            <div className="flex items-center gap-2 mt-3">
              <span className="px-2 py-0.5 rounded-[6px] text-xs bg-white/[0.06] text-white/50">{kpi.department}</span>
              <span className={`px-2 py-0.5 rounded-[6px] text-xs ${st.bg} ${st.text}`}>{st.label}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-white" style={{ fontFamily: 'DM Mono, monospace' }}>
                {fmt(currentValue)}
              </p>
              {kpi.unit && <span className="text-sm text-white/40">{kpi.unit}</span>}
            </div>
            {readings.length >= 2 && (
              <span className={`flex items-center gap-1 justify-end text-xs mt-1 ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
                {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {trendUp ? '+' : ''}{fmt(currentValue - prevValue)}
              </span>
            )}
          </div>
        </div>

        {/* Thresholds */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/[0.06]">
          <div>
            <p className="text-xs text-white/40 mb-1">Meta</p>
            <p className="text-sm font-bold text-emerald-400" style={{ fontFamily: 'DM Mono, monospace' }}>
              {fmt(kpi.target_value)}
            </p>
          </div>
          <div>
            <p className="text-xs text-white/40 mb-1">Alerta</p>
            <p className="text-sm font-bold text-amber-400" style={{ fontFamily: 'DM Mono, monospace' }}>
              {fmt(kpi.warning_threshold)}
            </p>
          </div>
          <div>
            <p className="text-xs text-white/40 mb-1">Crítico</p>
            <p className="text-sm font-bold text-red-400" style={{ fontFamily: 'DM Mono, monospace' }}>
              {fmt(kpi.critical_threshold)}
            </p>
          </div>
        </div>
      </div>

      {/* Registrar Leitura */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[#0B1928]"
          style={{ background: '#3D6FFF' }}
        >
          <Plus className="w-4 h-4" />
          Registrar Leitura
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-[#3D6FFF]/20 p-5 space-y-4" style={{ background: 'rgba(200,164,74,0.05)' }}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#3D6FFF]">Nova Leitura</span>
            <button onClick={() => setShowForm(false)} className="text-white/30 hover:text-white/60">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs text-white/50 mb-1">Valor</label>
              <input
                type="number"
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                placeholder="0"
                className={inputCls}
              />
            </div>
            <button
              onClick={handleNewReading}
              disabled={saving || !newValue}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[#0B1928] disabled:opacity-50"
              style={{ background: '#3D6FFF' }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Salvar
            </button>
          </div>
        </div>
      )}

      {/* Historical Chart (CSS bars) */}
      <div className="rounded-lg border border-white/10 p-6" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <h2 className="text-sm font-semibold text-white mb-4">Histórico ({readings.length} leituras)</h2>
        {readings.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-8">Nenhuma leitura registrada.</p>
        ) : (
          <div>
            {/* Target line reference */}
            <div className="relative">
              <div className="flex items-end gap-1 h-40">
                {readings.map((r, i) => {
                  const pct = (r.value / maxVal) * 100
                  const barStatus = kpiStatus(kpi, r.value)
                  const barSt = statusStyles[barStatus]
                  return (
                    <div key={r.id} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                      <div
                        className="w-full rounded-t-sm min-h-[2px] transition-all duration-300"
                        style={{
                          height: `${Math.max(pct, 2)}%`,
                          background: barSt.barColor,
                          opacity: 0.5 + (i / readings.length) * 0.5,
                        }}
                      />
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-1 hidden group-hover:block z-10">
                        <div className="px-2 py-1 rounded text-xs bg-[#0B1928] border border-white/20 text-white whitespace-nowrap">
                          <span style={{ fontFamily: 'DM Mono, monospace' }}>{fmt(r.value)}</span>
                          <br />
                          <span className="text-white/40">{fmtDate(r.recorded_at)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* Target line */}
              <div
                className="absolute left-0 right-0 border-t border-dashed border-emerald-400/30"
                style={{ bottom: `${(kpi.target_value / maxVal) * 100}%` }}
              >
                <span className="absolute right-0 -top-4 text-[10px] text-emerald-400/50">Meta</span>
              </div>
            </div>
            {/* Date labels */}
            <div className="flex justify-between mt-2 text-[10px] text-white/30">
              {readings.length > 0 && <span>{fmtDate(readings[0].recorded_at)}</span>}
              {readings.length > 1 && <span>{fmtDate(readings[readings.length - 1].recorded_at)}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
